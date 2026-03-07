from supabase import create_client
from config import SUPABASE_URL, SUPABASE_ANON_KEY

# create client
supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


# ✅ get active monitoring sources
def get_active_sources():
    response = (
        supabase.table("scholarship_sources")
        .select("*")
        .eq("monitor_enabled", True)
        .eq("is_active", True)
        .execute()
    )
    return response.data or []


# ✅ get latest snapshot
def get_latest_snapshot(source_id):
    response = (
        supabase.table("scholarship_snapshots")
        .select("*")
        .eq("source_id", source_id)
        .order("captured_at", desc=True)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


# ✅ insert snapshot
def insert_snapshot(source_id, raw_text, text_hash):
    return (
        supabase.table("scholarship_snapshots")
        .insert(
            {
                "source_id": source_id,
                "raw_text": raw_text,
                "text_hash": text_hash,
            }
        )
        .execute()
    )


# ✅ insert change log
def insert_change(source_id, university_name, old_value, new_value):
    return (
        supabase.table("scholarship_changes")
        .insert(
            {
                "source_id": source_id,
                "university_name": university_name,
                "field_changed": "page_content",
                "change_type": "modified",
                "old_value": old_value,
                "new_value": new_value,
                "change_summary": f"Scholarship page updated for {university_name}",
            }
        )
        .execute()
    )
