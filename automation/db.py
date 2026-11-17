"""Supabase access for the crawler. All writes honour DRY_RUN."""
from __future__ import annotations

from datetime import datetime, timezone

from supabase import create_client

import config

config.require_supabase()
supabase = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _write(label: str, fn):
    if config.DRY_RUN:
        print(f"[dry-run] {label}")
        return None
    return fn()


def get_active_sources() -> list[dict]:
    return (supabase.table("scholarship_sources").select("*")
            .eq("monitor_enabled", True).eq("is_active", True).execute().data or [])


def get_latest_snapshots() -> dict[str, dict]:
    """source_id -> newest snapshot (hash + text), fetched in one pass."""
    latest: dict[str, dict] = {}
    start = 0
    while True:
        rows = (supabase.table("scholarship_snapshots")
                .select("source_id,text_hash,raw_text,captured_at")
                .order("captured_at", desc=True)
                .range(start, start + 999).execute().data or [])
        for r in rows:
            latest.setdefault(r["source_id"], r)
        if len(rows) < 1000:
            return latest
        start += 1000


def get_scholarships_by_source(sources: list[dict]) -> dict[str, list[dict]]:
    """Map source id -> scholarship rows linked through legacy_source_value (slug or URL)."""
    cols = ("id,scholarship_name,scholarship_slug,university_name,legacy_source_value,deadline_date,"
            "deadline_display,deadline_type,amount_display,status,degree_level,field_category,summary")
    rows: list[dict] = []
    start = 0
    while True:
        page = (supabase.table("scholarships").select(cols)
                .range(start, start + 999).execute().data or [])
        rows += page
        if len(page) < 1000:
            break
        start += 1000
    global _ALL_SLUGS
    _ALL_SLUGS = {r["scholarship_slug"] for r in rows if r.get("scholarship_slug")}
    by_key: dict[str, list[dict]] = {}
    for r in rows:
        by_key.setdefault(r.get("legacy_source_value") or "", []).append(r)
    out: dict[str, list[dict]] = {}
    for s in sources:
        linked = list(by_key.get(s.get("source_slug") or "\0", [])) + list(by_key.get(s.get("source_url") or "\0", []))
        out[s["id"]] = linked
    return out


_ALL_SLUGS: set[str] = set()


def unique_slug(base: str) -> str:
    slug, n = base, 2
    while slug in _ALL_SLUGS:
        slug, n = f"{base}-{n}", n + 1
    _ALL_SLUGS.add(slug)
    return slug


def insert_scholarship(row: dict) -> None:
    _write(f"new scholarship {row.get('scholarship_name')!r}",
           lambda: supabase.table("scholarships").insert(row).execute())


def get_approved_suggestions() -> list[dict]:
    return (supabase.table("source_url_suggestions").select("*").eq("status", "approved").execute().data or [])


def apply_suggestion(suggestion: dict) -> None:
    """Point a source at its approved real URL and make it crawlable again."""
    _write(f"apply suggestion {suggestion['candidate_url']}", lambda: (
        supabase.table("scholarship_sources")
        .update({"source_url": suggestion["candidate_url"], "last_status": None, "monitor_enabled": True,
                 "is_active": True, "source_type": "Official URL"}).eq("id", suggestion["source_id"]).execute(),
        supabase.table("source_url_suggestions").update({"status": "applied"})
        .eq("id", suggestion["id"]).execute()))


def update_source_status(source_id: str, status: str) -> None:
    _write(f"source {source_id[:8]} -> {status}", lambda: supabase.table("scholarship_sources")
           .update({"last_checked_at": now_iso(), "last_status": status}).eq("id", source_id).execute())


def insert_snapshot(source_id: str, raw_text: str, text_hash: str) -> None:
    _write(f"snapshot {source_id[:8]}", lambda: supabase.table("scholarship_snapshots").insert(
        {"source_id": source_id, "raw_text": raw_text, "text_hash": text_hash}).execute())


def insert_change(source_id: str, university_name: str, change_type: str, summary: str,
                  field_changed: str | None = None, old_value=None, new_value=None,
                  scholarship_id: str | None = None, scholarship_name: str | None = None) -> None:
    row = {"source_id": source_id, "university_name": university_name,
           "scholarship_id": scholarship_id, "scholarship_name": scholarship_name,
           "field_changed": field_changed, "change_type": change_type,
           "old_value": None if old_value is None else str(old_value)[:1000],
           "new_value": None if new_value is None else str(new_value)[:1000],
           "change_summary": summary}
    _write(f"change {change_type}: {summary}", lambda: supabase.table("scholarship_changes").insert(row).execute())


def update_scholarship(scholarship_id: str, fields: dict) -> None:
    _write(f"scholarship {scholarship_id[:8]} <- {fields}", lambda: supabase.table("scholarships")
           .update(fields).eq("id", scholarship_id).execute())


def mark_verified(scholarship_ids: list[str]) -> None:
    if scholarship_ids:
        _write(f"verify {len(scholarship_ids)} scholarships", lambda: supabase.table("scholarships")
               .update({"last_verified_at": now_iso()}).in_("id", scholarship_ids).execute())


def close_expired(today: str) -> None:
    """Flag scholarships whose known deadline has passed (frontend hides 'Closed')."""
    _write("close expired", lambda: supabase.table("scholarships").update({"status": "Closed"})
           .lt("deadline_date", today).or_("status.is.null,status.neq.Closed").execute())
