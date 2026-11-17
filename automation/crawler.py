"""Daily scholarship crawler.

For every active source: fetch -> clean -> detect change -> store snapshot -> parse every
scholarship on the page -> match to known scholarships -> update / add them -> record status.
"""
from __future__ import annotations

import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date

import config
from compare import compare_text, extract_text
from fetcher import FetchResult, fetch, new_session
from matching import match_records, slugify
from parse_scholarships import NAME_WORDS, parse_page

# Columns copied from a parsed record. "fill" = only when the database value is empty
# (curated values win); "set" = the page is the source of truth, always refreshed.
SET_FIELDS = ["amount_display", "amount_value", "amount_currency", "eligibility", "requirements",
              "how_to_apply", "application_url", "award_type", "number_of_awards", "nationality",
              "opens_date"]
FILL_FIELDS = ["degree_level", "field_category", "summary"]
MAX_NEW_PER_SOURCE = 40


def fetch_source(source: dict) -> tuple[dict, FetchResult, str, list[dict]]:
    """Network + parsing step, safe to run in a worker thread."""
    result = fetch(source.get("source_url"), session=new_session())
    if not result.ok:
        return source, result, "", []
    text = extract_text(result.html, source.get("css_selector"))
    try:
        records = parse_page(result.html, source["source_url"])
    except Exception as e:  # a parser bug on one page must not lose the snapshot
        print(f"PARSE-ERROR {source.get('university_name')}: {type(e).__name__}: {e}", file=sys.stderr)
        records = []
    return source, result, text, records


def _iso(v):
    return v.isoformat() if hasattr(v, "isoformat") else v


def build_updates(rec: dict, row: dict, source: dict, today: date) -> dict:
    """Database columns to change for a matched scholarship (empty dict = nothing new)."""
    up: dict = {}
    for f in SET_FIELDS:
        if rec.get(f) not in (None, ""):
            up[f] = _iso(rec[f])
    for f in FILL_FIELDS:
        if rec.get(f) and not row.get(f):
            up[f] = rec[f]
    if rec.get("deadline_type"):
        up.update(deadline_type=rec["deadline_type"], deadline_display=rec["deadline_display"],
                  deadline_inferred=bool(rec.get("deadline_inferred")))
        if rec.get("deadline_date"):
            up["deadline_date"] = _iso(rec["deadline_date"])
        # status follows what the page says
        if rec["deadline_type"] == "closed" and not rec.get("deadline_date"):
            up["status"] = "Closed"
        elif rec["deadline_type"] in ("fixed", "rolling", "automatic", "varies") and row.get("status") == "Closed":
            up["status"] = "Active"  # reopened / new round
    up.update(source_url=source["source_url"], extraction_confidence=rec.get("confidence"))
    return up


def process_page(source: dict, records: list[dict], linked: list[dict], today: date) -> dict:
    import db

    stats = {"matched": 0, "updated_fields": 0, "added": 0}
    uni = source.get("university_name") or ""
    pairs, unmatched = match_records(records, linked)

    verified: list[str] = []
    for rec, row in pairs:
        up = build_updates(rec, row, source, today)
        stats["matched"] += 1
        verified.append(row["id"])
        new_dd, old_dd = up.get("deadline_date"), row.get("deadline_date")
        if new_dd and new_dd != old_dd:
            db.insert_change(source["id"], uni, "deadline_changed",
                             f"Deadline for {row['scholarship_name']}: {row.get('deadline_display') or 'unknown'} -> {up['deadline_display']}",
                             "deadline_date", old_dd, new_dd, row["id"], row["scholarship_name"])
        if up.get("amount_display") and up["amount_display"] != row.get("amount_display"):
            db.insert_change(source["id"], uni, "amount_changed",
                             f"Amount for {row['scholarship_name']}: {row.get('amount_display') or 'unknown'} -> {up['amount_display']}",
                             "amount_display", row.get("amount_display"), up["amount_display"], row["id"], row["scholarship_name"])
        db.update_scholarship(row["id"], {**up, "extracted_at": db.now_iso(), "last_verified_at": db.now_iso()})
        stats["updated_fields"] += len(up)

    # New scholarships found on the page that we do not have yet.
    added = 0
    for rec in unmatched:
        if added >= MAX_NEW_PER_SOURCE:
            break
        name = rec["name"]
        if len(name) < 8 or not NAME_WORDS.search(name) or rec["confidence"] < 0.4:
            continue
        row = {
            "scholarship_name": name, "scholarship_slug": db.unique_slug(slugify(f"{uni} {name}")),
            "university_id": source.get("university_id"), "university_name": uni,
            "country_name": source.get("country_name"), "legacy_source_value": source.get("source_slug"),
            "public_visible": True, "is_active": True, "status": "Active", "learn_more_url": source["source_url"],
            "last_verified_at": db.now_iso(), "extracted_at": db.now_iso(),
            "degree_level": rec.get("degree_level"), "field_category": rec.get("field_category"),
            "summary": rec.get("summary"),
        }
        row.update(build_updates(rec, {}, source, today))
        if row.get("status") == "Closed" and row.get("deadline_type") == "closed":
            pass  # keep: stored as closed so it is not re-added tomorrow
        db.insert_scholarship(row)
        db.insert_change(source["id"], uni, "added", f"New scholarship found: {name} ({uni})",
                         "scholarship_name", None, name, None, name)
        added += 1
    stats["added"] = added
    db.mark_verified(verified)
    return stats


def run() -> int:
    import db

    today = date.today()
    # RLS is on: without the service-role key every read returns nothing and the run would
    # look "successful". Refuse to run instead of failing silently.
    if not config.USING_SERVICE_KEY:
        print("ERROR: SUPABASE_SERVICE_KEY is not set (the public key can no longer read or write crawler tables).",
              file=sys.stderr)
        return 2

    # Source URLs the owner approved in the dashboard become the new crawl targets.
    for sug in db.get_approved_suggestions():
        db.apply_suggestion(sug)
        print(f"applied approved source URL: {sug['candidate_url']}")

    sources = db.get_active_sources()
    if not sources:
        print("ERROR: no active sources returned; check SUPABASE_URL / SUPABASE_SERVICE_KEY.", file=sys.stderr)
        return 2
    print(f"{len(sources)} active sources (dry_run={config.DRY_RUN}, rebaseline={config.REBASELINE})")

    latest = db.get_latest_snapshots()
    linked_map = db.get_scholarships_by_source(sources)
    stats = {"ok": 0, "changed": 0, "failed": 0, "skipped": 0, "matched": 0, "updated_fields": 0, "added": 0}

    with ThreadPoolExecutor(max_workers=config.MAX_WORKERS) as pool:
        for source, result, text, records in pool.map(fetch_source, sources):
            name = source.get("university_name") or source.get("source_slug") or source["id"][:8]
            try:
                db.update_source_status(source["id"], result.label())
                if result.status == "skipped":
                    stats["skipped"] += 1
                    print(f"skip   {name}: {result.detail}")
                    continue
                if not result.ok:
                    stats["failed"] += 1
                    print(f"FAIL   {name}: {result.label()}")
                    continue

                stats["ok"] += 1
                prev = latest.get(source["id"])
                cmp = compare_text(prev["raw_text"] if prev else "", text)
                if prev is None or cmp["changed"]:
                    db.insert_snapshot(source["id"], cmp["new_text"], cmp["new_hash"])
                    if prev is not None and not config.REBASELINE:
                        stats["changed"] += 1
                        db.insert_change(source["id"], source.get("university_name") or "", "modified",
                                         f"Scholarship page updated for {name}", "page_content",
                                         cmp["old_text"][:1000], cmp["new_text"][:1000])
                page = process_page(source, records, linked_map.get(source["id"], []), today)
                for k in ("matched", "updated_fields", "added"):
                    stats[k] += page[k]
                print(f"ok     {name}: {len(records)} found, {page['matched']} matched, {page['added']} new")
            except Exception as e:  # one bad source must never stop the run
                stats["failed"] += 1
                print(f"ERROR  {name}: {type(e).__name__}: {e}", file=sys.stderr)

    db.close_expired(str(today))
    print(f"\nSummary: {stats}")
    # Fail the workflow only if (almost) everything failed, i.e. the crawler itself is broken.
    total = stats["ok"] + stats["failed"]
    return 1 if total and stats["ok"] / total < 0.3 else 0


if __name__ == "__main__":
    sys.exit(run())
