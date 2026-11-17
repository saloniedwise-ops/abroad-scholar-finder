"""Daily scholarship crawler.

For every active source: fetch -> clean -> detect change -> store snapshot ->
extract deadline/amount -> update the linked scholarships -> record source status.
"""
from __future__ import annotations

import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date

import config
from compare import compare_text, extract_text
from extract import extract_amount, extract_deadline
from fetcher import FetchResult, fetch, new_session


def fetch_source(source: dict) -> tuple[dict, FetchResult, str]:
    """Network-only step, safe to run in a worker thread."""
    result = fetch(source.get("source_url"), session=new_session())
    text = extract_text(result.html, source.get("css_selector")) if result.ok else ""
    return source, result, text


def apply_extraction(source: dict, text: str, linked: list[dict], today: date) -> int:
    """Update deadline/amount only for 1:1 sources (one page == one scholarship).

    Pages that describe several scholarships can't be mapped safely, so for those we
    only refresh last_verified_at.
    """
    import db

    if len(linked) != 1:
        return 0
    row = linked[0]
    updates: dict = {}
    deadline = extract_deadline(text, today)
    if deadline and str(deadline[0]) != row.get("deadline_date"):
        updates.update(deadline_date=str(deadline[0]), deadline_display=deadline[1])
        db.insert_change(source["id"], source.get("university_name") or "", "deadline_changed",
                         f"Deadline for {row['scholarship_name']}: {row.get('deadline_display') or 'unknown'} -> {deadline[1]}",
                         "deadline_date", row.get("deadline_date"), deadline[0],
                         row["id"], row["scholarship_name"])
    amount = extract_amount(text)
    if amount and amount != row.get("amount_display"):
        updates["amount_display"] = amount
        db.insert_change(source["id"], source.get("university_name") or "", "amount_changed",
                         f"Amount for {row['scholarship_name']}: {row.get('amount_display') or 'unknown'} -> {amount}",
                         "amount_display", row.get("amount_display"), amount,
                         row["id"], row["scholarship_name"])
    if updates:
        if updates.get("deadline_date") and updates["deadline_date"] >= str(today) and row.get("status") == "Closed":
            updates["status"] = "Active"  # deadline extended / reopened
        db.update_scholarship(row["id"], updates)
    return len(updates)


def run() -> int:
    import db

    today = date.today()
    sources = db.get_active_sources()
    print(f"{len(sources)} active sources (dry_run={config.DRY_RUN}, rebaseline={config.REBASELINE}, service_key={config.USING_SERVICE_KEY})")
    if not config.USING_SERVICE_KEY and not config.DRY_RUN:
        print("WARNING: no SUPABASE_SERVICE_KEY, writes may be rejected by RLS", file=sys.stderr)

    latest = db.get_latest_snapshots()
    linked_map = db.get_scholarships_by_source(sources)
    stats = {"ok": 0, "changed": 0, "failed": 0, "skipped": 0, "updated_fields": 0}

    with ThreadPoolExecutor(max_workers=config.MAX_WORKERS) as pool:
        for source, result, text in pool.map(fetch_source, sources):
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
                linked = linked_map.get(source["id"], [])
                stats["updated_fields"] += apply_extraction(source, cmp["new_text"], linked, today)
                db.mark_verified([r["id"] for r in linked])
                print(f"ok     {name}" + ("  (changed)" if prev is not None and cmp["changed"] and not config.REBASELINE else ""))
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
