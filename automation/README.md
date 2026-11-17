# Scholarship monitoring automation

Runs daily from `.github/workflows/daily-crawl.yml` (02:30 UTC) and can be started by hand
from the **Actions** tab (inputs: `dry_run`, `rebaseline`).

## What it does
1. Loads active rows from `scholarship_sources` (skips non-pages such as Google search URLs).
2. Fetches each page with retries; records the result in `scholarship_sources.last_status` / `last_checked_at`.
3. Strips menus, footers, cookie text and volatile lines, hashes the rest, and compares with the last snapshot.
4. On a real change: saves a snapshot and logs `modified` in `scholarship_changes`.
5. For sources that map to exactly **one** scholarship it extracts deadline and amount and updates
   `scholarships` (logging `deadline_changed` / `amount_changed`). Multi-scholarship pages only refresh `last_verified_at`.
6. Marks scholarships whose deadline has passed as `Closed` (the website hides them).
7. Emails a summary, then refreshes `public/sitemap.xml`.

## GitHub secrets
| Secret | Purpose |
|---|---|
| `SUPABASE_URL` | `https://ndfxfsjbfcocdyzbtitj.supabase.co` |
| `SUPABASE_SERVICE_KEY` | **Required now that RLS is on.** Service-role key, used for all writes |
| `SUPABASE_ANON_KEY` | Used only for the sitemap (read-only) |
| `ALERT_SENDER_EMAIL`, `ALERT_SENDER_APP_PASSWORD`, `ALERT_RECIPIENT_EMAIL` | Gmail summary |

## First run after this upgrade
Run the workflow once with **rebaseline = true** so the new text cleaning does not flag every page as "modified".

## Local use
```bash
pip install -r requirements.txt
cp .env.example .env            # fill in values
DRY_RUN=1 python crawler.py     # prints writes, saves nothing
python -m pytest -q tests
```

## Known limits
* Plain `requests` only: pages that need JavaScript or block bots (HTTP 403) show as `blocked`.
* Many sources are still Google search URLs and are skipped: they need a real scholarship page URL.

## Database
The schema lives in `supabase/migrations/` (`..._live_schema_baseline.sql` = what exists, `..._enable_rls.sql` = security).
Row Level Security is ON: the website's public key can only read listed scholarships, universities and change history.
**The crawler must use `SUPABASE_SERVICE_KEY`**; with only the public key its writes are rejected.
