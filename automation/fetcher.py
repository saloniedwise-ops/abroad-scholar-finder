"""HTTP fetching with retries and an explicit result status (never raises)."""
from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlparse

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from config import REQUEST_TIMEOUT

USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0 Safari/537.36 ScholarshipMonitor/2.0"
)


@dataclass
class FetchResult:
    status: str  # ok | not_found | blocked | skipped | error
    html: str = ""
    http_code: int | None = None
    detail: str = ""

    @property
    def ok(self) -> bool:
        return self.status == "ok"

    def label(self) -> str:
        """Short text stored in scholarship_sources.last_status."""
        if self.ok:
            return "ok"
        return f"{self.status}: {self.detail}".strip(": ")[:120]


def _session() -> requests.Session:
    s = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=1.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("GET",),
        respect_retry_after_header=True,
    )
    s.mount("https://", HTTPAdapter(max_retries=retry))
    s.mount("http://", HTTPAdapter(max_retries=retry))
    s.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "en"})
    return s


def skip_reason(url: str | None) -> str | None:
    """Sources that can never produce a meaningful snapshot."""
    if not url:
        return "no source_url"
    p = urlparse(url)
    if p.scheme not in ("http", "https"):
        return f"unsupported scheme {p.scheme or '?'}"
    host = p.netloc.lower()
    if "google." in host and p.path.startswith("/search"):
        # A search-results page changes constantly and is not a scholarship page.
        return "search-engine URL, needs a real source page"
    return None


def fetch(url: str | None, session: requests.Session | None = None) -> FetchResult:
    reason = skip_reason(url)
    if reason:
        return FetchResult("skipped", detail=reason)
    session = session or _session()
    try:
        r = session.get(url, timeout=REQUEST_TIMEOUT, allow_redirects=True)
    except requests.RequestException as e:
        return FetchResult("error", detail=type(e).__name__)

    code = r.status_code
    if code in (404, 410):
        return FetchResult("not_found", http_code=code, detail=f"HTTP {code}")
    if code in (401, 403, 429):
        return FetchResult("blocked", http_code=code, detail=f"HTTP {code}")
    if code >= 400:
        return FetchResult("error", http_code=code, detail=f"HTTP {code}")
    ctype = r.headers.get("content-type", "")
    if "html" not in ctype and "text" not in ctype:
        return FetchResult("skipped", http_code=code, detail=f"non-HTML ({ctype[:30]})")
    return FetchResult("ok", html=r.text, http_code=code)


def new_session() -> requests.Session:
    return _session()
