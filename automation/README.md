# Scholarship monitoring automation

Runs daily from `.github/workflows/daily-crawl.yml` (02:30 UTC) and can be started by hand
from the **Actions** tab (inputs: `dry_run`, `rebaseline`).

## What it does (all free: no paid APIs)
1. Applies any source URL you approved (see "Real source URLs" below), then loads active rows from `scholarship_sources`
   (skips non-pages such as Google search URLs).
2. Fetches each page with retries, as an honest `ScholarshipMonitor` bot (no disguises: bot-protected sites show as `blocked`);
   records the result in `scholarship_sources.last_status` / `last_checked_at`.
3. Strips menus, footers, cookie text and volatile lines, hashes the rest, and compares with the last snapshot;
   a real change saves a snapshot and logs `modified`.
4. **Parses every scholarship on the page** (`parse_scholarships.py`): single-scholarship pages (Key facts / Eligibility /
   How to apply sections) and listing pages (one heading per scholarship). Extracted: deadline and its *type*
   (fixed, rolling, automatic, varies, closed), opening date, amount (+ number and currency), eligibility, requirements,
   how to apply, application link, award type, number of awards, who it is open to, degree level, field.
5. **Matches** them to known scholarships by name (`matching.py`), updates the matched rows, logs `deadline_changed` /
   `amount_changed`, reopens a `Closed` scholarship when a new future date appears, and **adds** new scholarships it finds
   (logged as `added`). Only scholarships actually found on the page get a fresh `last_verified_at`; the rest age out of the
   website after 45 days, so dead or removed scholarships disappear on their own.
6. Marks scholarships whose deadline has passed as `Closed`; emails a summary; refreshes `public/sitemap.xml`.

Deadlines are only stored when the page states them. When it says "rolling" or "automatic", that is what the site shows;
when it says nothing, the site says "Not confirmed, check official page". The crawler never invents a date
(a day and month without a year is flagged `deadline_inferred`).

## Real source URLs (the Google-search sources)
`suggest_sources.py` (workflow **Suggest Source URLs**, weekly or by hand) finds each university's official site from
Wikidata, reads its `robots.txt`/sitemap, scores scholarship-looking pages and saves proposals to
`source_url_suggestions` as `pending`. **To approve:** Supabase -> Table Editor -> `source_url_suggestions` -> set
`status` to `approved` on the right row. The next daily crawl switches that source to the URL and starts monitoring it.

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

## Safe first run
Run the **Daily Scholarship Crawl** workflow once with **dry_run = true**: it prints every update/insert it *would* make
without saving anything. Check the log, then run it for real.

## Known limits
* Plain `requests` only: pages that need JavaScript, or that block bots (HTTP 403/challenge), show as `blocked`.
  We do not try to get around bot protection; those need an official feed, permission, or manual entry.
* The parser is rule-based, so unusual page layouts may yield fewer fields. It is conservative: it leaves a field empty
  rather than guess.

## Database
The schema lives in `supabase/migrations/` (`..._live_schema_baseline.sql` = what exists, `..._enable_rls.sql` = security).
Row Level Security is ON: the website's public key can only read listed scholarships, universities and change history.
**The crawler must use `SUPABASE_SERVICE_KEY`**; with only the public key its writes are rejected.
