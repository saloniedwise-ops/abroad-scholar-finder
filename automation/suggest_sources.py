"""Propose real scholarship-page URLs for sources that have none (Google search links, dead URLs).

Free and polite:
  * the official website of each university comes from Wikidata's public API;
  * we only read pages that the site's robots.txt allows, with our honest bot User-Agent;
  * candidates are scored (URL words + page content) and saved to `source_url_suggestions`
    as 'pending'. NOTHING is crawled until you approve one: open Supabase -> Table Editor ->
    source_url_suggestions and set status = 'approved' on the right row. The next crawl
    switches the source to that URL.

Usage:  python suggest_sources.py            (needs SUPABASE_URL + SUPABASE_SERVICE_KEY)
        DRY_RUN=1 python suggest_sources.py  (print only)
"""
from __future__ import annotations

import re
import sys
import time
from urllib import robotparser
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

from fetcher import USER_AGENT

HEADERS = {"User-Agent": USER_AGENT}
WIKIDATA = "https://www.wikidata.org/w/api.php"
URL_WORDS = [  # (pattern, weight)
    (r"scholarship", 5), (r"bursar", 4), (r"fees?-?(and|&)?-?funding|funding", 3), (r"financial-?aid|student-?finance", 3),
    (r"international", 2), (r"undergraduate|postgraduate|masters|graduate", 1), (r"award", 1),
]
BAD_URL = re.compile(r"(\.pdf$|/news|/blog|/events?/|/staff|/people|/login|/search|/tag/|/category/|/careers?|/jobs?)", re.I)
PAGE_SIGNALS = re.compile(r"(scholarship|bursary|award|funding)", re.I)
MONEY = re.compile(r"(£|€|\$|USD|AUD|CAD)\s?\d")
DEADLINE = re.compile(r"(deadline|closing date|apply by|rolling)", re.I)
_robots: dict[str, robotparser.RobotFileParser | None] = {}


def get(url: str, timeout: int = 20) -> requests.Response | None:
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        return r if r.status_code == 200 else None
    except requests.RequestException:
        return None


def allowed(url: str) -> bool:
    """Respect robots.txt. If it cannot be read, be conservative and allow only the homepage-level fetch."""
    host = urlparse(url).scheme + "://" + urlparse(url).netloc
    if host not in _robots:
        rp = robotparser.RobotFileParser()
        r = get(host + "/robots.txt")
        if r is None:
            _robots[host] = None
        else:
            rp.parse(r.text.splitlines())
            _robots[host] = rp
    rp = _robots[host]
    return True if rp is None else rp.can_fetch(USER_AGENT, url)


def api_json(params: dict, tries: int = 4) -> dict:
    """Wikidata call that backs off when rate limited (HTTP 429) instead of hammering the API."""
    for attempt in range(tries):
        r = requests.get(WIKIDATA, headers=HEADERS, timeout=20, params=params)
        if r.status_code == 429:
            time.sleep(min(float(r.headers.get("Retry-After", 5 * (attempt + 1))), 60))
            continue
        r.raise_for_status()
        return r.json()
    raise requests.RequestException("Wikidata rate limit")


def official_website(name: str) -> str | None:
    """Official website (P856) of the best-matching university on Wikidata."""
    try:
        s = api_json({"action": "wbsearchentities", "search": re.sub(r"\s*[-–(].*$", "", name), "language": "en",
                      "type": "item", "limit": 5, "format": "json"})
        for hit in s.get("search", []):
            desc = (hit.get("description") or "").lower()
            if not re.search(r"(universit|college|school|institut|academy)", desc + " " + hit["label"].lower()):
                continue
            e = api_json({"action": "wbgetentities", "ids": hit["id"], "props": "claims", "format": "json"})
            claims = e["entities"][hit["id"]]["claims"].get("P856", [])
            for c in claims:
                url = c["mainsnak"].get("datavalue", {}).get("value")
                if url:
                    return url
    except (requests.RequestException, KeyError, ValueError):
        pass
    return None


def sitemap_urls(base: str, limit: int = 6000) -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()
    queue = [urljoin(base, "/sitemap.xml")]
    r0 = get(urljoin(base, "/robots.txt"))
    if r0:
        queue = re.findall(r"(?im)^sitemap:\s*(\S+)", r0.text) + queue
    while queue and len(urls) < limit and len(seen) < 12:
        sm = queue.pop(0)
        if sm in seen:
            continue
        seen.add(sm)
        r = get(sm, 30)
        if not r or "<" not in r.text[:200]:
            continue
        locs = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", r.text)
        for loc in locs:
            (queue if loc.endswith(".xml") or "sitemap" in loc.lower().rsplit("/", 1)[-1] else urls).append(loc)
    return urls


def homepage_links(base: str) -> list[str]:
    r = get(base)
    if not r:
        return []
    soup = BeautifulSoup(r.text, "lxml")
    return [urljoin(r.url, a["href"]) for a in soup.find_all("a", href=True)]


def score_url(url: str, base_host: str) -> float:
    p = urlparse(url)
    if p.netloc.replace("www.", "") != base_host.replace("www.", "") or BAD_URL.search(url):
        return 0
    path = p.path.lower()
    s = sum(w for pat, w in URL_WORDS if re.search(pat, path))
    if not re.search(r"scholarship|bursar|funding|financial", path):
        return 0
    depth = len([x for x in path.split("/") if x])
    return s - 0.3 * max(0, depth - 3)


def verify(url: str) -> tuple[float, str | None]:
    """Fetch a candidate (robots-allowed) and score its content."""
    if not allowed(url):
        return -99, None
    r = get(url)
    if not r:
        return -99, None
    soup = BeautifulSoup(r.text, "lxml")
    title = re.sub(r"\s+", " ", soup.title.string).strip() if soup.title and soup.title.string else None
    text = soup.get_text(" ", strip=True)
    bonus = (2 if PAGE_SIGNALS.search(title or "") else 0) + (2 if MONEY.search(text) else 0) \
        + (2 if DEADLINE.search(text) else 0) + (1 if len(text) > 1500 else 0)
    return bonus, title


def find_candidates(name: str, website: str | None = None, top: int = 4) -> tuple[list[dict], str | None]:
    site = website or official_website(name)
    if not site:
        return [], None
    base = site if site.startswith("http") else "https://" + site
    host = urlparse(base).netloc
    pool = set(sitemap_urls(base)) | set(homepage_links(base))
    ranked = sorted(((score_url(u, host), u) for u in pool), reverse=True)
    out = []
    for sc, u in ranked[: top * 3]:
        if sc <= 0:
            break
        bonus, title = verify(u)
        if bonus < 0:
            continue
        out.append({"url": u, "title": title, "score": round(sc + bonus, 1),
                    "reason": f"URL score {sc:g}, page score {bonus}, site {host}"})
        time.sleep(0.5)  # be gentle
    out.sort(key=lambda c: -c["score"])
    return out[:top], base


def main() -> int:
    import config
    import db

    config.require_supabase()
    rows = (db.supabase.table("scholarship_sources").select("id,university_id,university_name,source_url,last_status")
            .eq("monitor_enabled", True).execute().data or [])
    need = [r for r in rows if "google." in (r.get("source_url") or "") or (r.get("last_status") or "").startswith("not_found")]
    unis = {u["id"]: u.get("website_url") for u in
            (db.supabase.table("universities").select("id,website_url").execute().data or [])}
    existing = {(s["source_id"], s["candidate_url"]) for s in
                (db.supabase.table("source_url_suggestions").select("source_id,candidate_url").execute().data or [])}
    print(f"{len(need)} sources need a real URL")
    found = 0
    for r in need:
        cands, base = find_candidates(r["university_name"], unis.get(r.get("university_id")))
        label = f"{r['university_name']} ({base or 'no official site found'})"
        if not cands:
            print(f"none   {label}")
            continue
        found += 1
        for c in cands:
            if (r["id"], c["url"]) in existing:
                continue
            row = {"source_id": r["id"], "candidate_url": c["url"], "page_title": c["title"], "score": c["score"],
                   "reason": c["reason"], "status": "pending"}
            print(f"suggest {r['university_name']}: {c['url']} (score {c['score']})")
            if not config.DRY_RUN:
                db.supabase.table("source_url_suggestions").upsert(row, on_conflict="source_id,candidate_url").execute()
    print(f"\nProposed URLs for {found} of {len(need)} sources. Approve them in Supabase -> source_url_suggestions.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
