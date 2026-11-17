"""Write public/sitemap.xml from the scholarships that are publicly listed."""
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

from supabase import create_client

URL = os.environ["SUPABASE_URL"]
KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ["SUPABASE_SERVICE_KEY"]
SITE = os.getenv("SITE_URL", "https://scholarshipfinder-scholarglobe.lovable.app").rstrip("/")

sb = create_client(URL, KEY)
rows, start = [], 0
while True:
    page = (sb.table("scholarships").select("scholarship_slug,scholarship_name,learn_more_url,deadline_date,last_verified_at,updated_at")
            .eq("public_visible", True).eq("is_active", True).or_("status.is.null,status.neq.Closed")
            .not_.is_("scholarship_slug", "null").range(start, start + 999).execute().data or [])
    rows += page
    if len(page) < 1000:
        break
    start += 1000

today = datetime.now(timezone.utc).date().isoformat()


def listable(r: dict) -> bool:
    """Keep in sync with isListable() in src/hooks/useScholarships.ts."""
    name = (r.get("scholarship_name") or "").strip()
    if len(name) < 6 or re.search(r"@|^skip to|^home$|^menu$", name, re.I):
        return False
    if (r.get("learn_more_url") or "").lower().startswith("mailto:"):
        return False
    if r.get("deadline_date") and r["deadline_date"] < today:
        return False
    verified = r.get("last_verified_at")
    if not verified:
        return False
    age = datetime.now(timezone.utc) - datetime.fromisoformat(verified.replace("Z", "+00:00"))
    return age.days <= 45


rows = [r for r in rows if listable(r)]
urls = [f"  <url><loc>{SITE}/</loc><lastmod>{today}</lastmod><priority>1.0</priority></url>"]
for r in rows:
    last = (r.get("last_verified_at") or r.get("updated_at") or today)[:10]
    urls.append(f"  <url><loc>{escape(SITE + '/scholarship/' + r['scholarship_slug'])}</loc>"
                f"<lastmod>{last}</lastmod><priority>0.6</priority></url>")

xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
       '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(urls) + "\n</urlset>\n")
out = Path(__file__).resolve().parents[1] / "public" / "sitemap.xml"
out.write_text(xml, encoding="utf-8")
print(f"Wrote {len(rows) + 1} URLs to {out}")
