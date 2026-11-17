"""Daily scholarship crawler.

For every active source: fetch -> clean -> detect change -> store snapshot -> parse every
scholarship on the page -> match to known scholarships -> update / add them -> record status.
"""
from __future__ import annotations

import re
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date

import config
from compare import compare_text, extract_text
from fetcher import FetchResult, fetch, new_session
from matching import match_records, normalize_name, slugify
from parse_scholarships import NAME_WORDS, parse_page

# Columns copied from a parsed record. "fill" = only when the database value is empty
# (curated values win); "set" = the page is the source of truth, always refreshed.
SET_FIELDS = ["amount_display", "amount_value", "amount_currency", "eligibility", "requirements",
              "how_to_apply", "application_url", "award_type", "number_of_awards", "nationality",
              "opens_date"]
FILL_FIELDS = ["degree_level", "field_category", "summary"]
MAX_NEW_PER_SOURCE = 40
# Page chrome, not an actual scholarship name.
GENERIC_NAME = re.compile(
    r"^(scholarships?|international scholarships?|scholarships? for international students|"
    r"fees (and|&) funding|scholarships? (and|&) (financial aid|funding)(\s*[-\u2013].*)?|"
    r"funding|financial aid|scholarships? and bursaries)$", re.I)

# Award described as covering everything (tuition / full funding).
FULL_FUNDING = re.compile(
    r"\b(fully?[\s-]?(funded|tuition|ride)|100%\s*(of\s*)?tuition|full\s+(tuition\s+)?scholarship)\b", re.I)

AMOUNT_FIELDS = ("amount_display", "amount_value", "amount_currency")
DEADLINE_FIELDS = ("deadline_type", "deadline_display", "deadline_inferred", "deadline_date", "status")


def sanity_check_updates(up: dict, row: dict) -> tuple[dict, list[tuple[str, object, object, str]]]:
    """Split proposed updates into safe-to-apply and needs-human-review.

    A flagged change is withheld from the scholarship row and recorded as a
    "needs_review" change instead: the crawler never applies an implausible
    amount swing or a deadline-quality downgrade on its own."""
    safe = dict(up)
    flagged: list[tuple[str, object, object, str]] = []

    def withhold(fields, reason):
        for f in fields:
            if f in safe:
                flagged.append((f, row.get(f), safe.pop(f), reason))

    new_disp = up.get("amount_display")
    if new_disp and new_disp != row.get("amount_display"):
        old_val, new_val = row.get("amount_value"), up.get("amount_value")
        reason = None
        if old_val and new_val:
            if (up.get("amount_currency") and row.get("amount_currency")
                    and up["amount_currency"] != row["amount_currency"]):
                reason = f"currency change {row['amount_currency']} -> {up['amount_currency']}"
            elif new_val < 0.25 * old_val:
                reason = f"amount drop of over 75% ({old_val} -> {new_val})"
            elif new_val > 20 * old_val:
                reason = f"amount jump of over 20x ({old_val} -> {new_val})"
        if (reason is None and new_val and new_val < 1000
                and FULL_FUNDING.search(row.get("amount_display") or "")):
            reason = f"full-funding award became a small fixed sum ({new_disp})"
        if reason:
            withhold(AMOUNT_FIELDS, reason)

    if (row.get("deadline_type") in ("fixed", "rolling")
            and up.get("deadline_type") == "varies"):
        withhold(DEADLINE_FIELDS,
                 f"deadline quality downgrade {row['deadline_type']} -> {up['deadline_type']}")

    return safe, flagged


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


def process_page(source: dict, records: list[dict], linked: list[dict], today: date,
               known_names: set[tuple[str, str]]) -> dict:
    import db

    stats = {"matched": 0, "updated_fields": 0, "added": 0, "flagged": 0}
    uni = source.get("university_name") or ""
    pairs, unmatched = match_records(records, linked)

    verified: list[str] = []
    for rec, row in pairs:
        up = build_updates(rec, row, source, today)
        safe, flagged = sanity_check_updates(up, row)
        stats["matched"] += 1
        verified.append(row["id"])
        for field, old, new, reason in flagged:
            db.insert_change(source["id"], uni, "needs_review",
                             f"Review {row['scholarship_name']}: {reason} ({old} -> {new})",
                             field, old, new, row["id"], row["scholarship_name"])
            stats["flagged"] += 1
            print(f"flag-review {row['scholarship_name']!r} {field}: {old!r} -> {new!r} ({reason})")
        new_dd, old_dd = safe.get("deadline_date"), row.get("deadline_date")
        if new_dd and new_dd != old_dd:
            db.insert_change(source["id"], uni, "deadline_changed",
                             f"Deadline for {row['scholarship_name']}: {row.get('deadline_display') or 'unknown'} -> {safe['deadline_display']}",
                             "deadline_date", old_dd, new_dd, row["id"], row["scholarship_name"])
        if safe.get("amount_display") and safe["amount_display"] != row.get("amount_display"):
            db.insert_change(source["id"], uni, "amount_changed",
                             f"Amount for {row['scholarship_name']}: {row.get('amount_display') or 'unknown'} -> {safe['amount_display']}",
                             "amount_display", row.get("amount_display"), safe["amount_display"], row["id"], row["scholarship_name"])
        db.update_scholarship(row["id"], {**safe, "extracted_at": db.now_iso(), "last_verified_at": db.now_iso()})
        stats["updated_fields"] += len(safe)

    # New scholarships found on the page that we do not have yet.
    added = 0
    for rec in unmatched:
        if added >= MAX_NEW_PER_SOURCE:
            break
        name = rec["name"]
        norm = normalize_name(name)
        # Generic headings ("Scholarships", "International Scholarships") and entries we
        # already have under this university must not become new scholarships.
        if (len(name) < 8 or not NAME_WORDS.search(name) or rec["confidence"] < 0.4
                or GENERIC_NAME.match(name.strip()) or len(norm) < 6):
            print(f"skip-name {name!r} ({uni})")
            continue
        if (uni, norm) in known_names:
            print(f"skip-dup {name!r} ({uni})")
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
        known_names.add((uni, norm))
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
    # Global dedupe: (university, normalized name) pairs already in the database.
    known_names = {(r.get("university_name") or "", normalize_name(r.get("scholarship_name")))
                   for r in db.all_scholarships()}
    stats = {"ok": 0, "changed": 0, "failed": 0, "skipped": 0, "matched": 0, "updated_fields": 0, "added": 0, "flagged": 0}

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
                page = process_page(source, records, linked_map.get(source["id"], []), today, known_names)
                for k in ("matched", "updated_fields", "added", "flagged"):
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
