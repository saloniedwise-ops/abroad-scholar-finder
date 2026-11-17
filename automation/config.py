"""Runtime configuration, read from environment variables (or automation/.env)."""
import os

from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
# Prefer the service-role key: the crawler WRITES (snapshots, changes, scholarships),
# and the tables should not be writable with the public anon key.
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
USING_SERVICE_KEY = bool(os.getenv("SUPABASE_SERVICE_KEY"))

DRY_RUN = os.getenv("DRY_RUN", "").lower() in ("1", "true", "yes")
# One-time: store fresh snapshots WITHOUT logging "modified" (use after changing the text cleaning).
REBASELINE = os.getenv("REBASELINE", "").lower() in ("1", "true", "yes")
MAX_WORKERS = int(os.getenv("CRAWL_WORKERS", "8"))
REQUEST_TIMEOUT = int(os.getenv("CRAWL_TIMEOUT", "30"))


def require_supabase() -> None:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError(
            "Missing SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY)."
        )
