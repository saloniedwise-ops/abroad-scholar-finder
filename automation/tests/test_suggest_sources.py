import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import suggest_sources as ss


def test_url_scoring_prefers_scholarship_pages_on_the_same_site():
    host = "www.uni.edu.au"
    good = ss.score_url("https://www.uni.edu.au/study/scholarships", host)
    better = ss.score_url("https://www.uni.edu.au/international/scholarships-and-funding", host)
    assert good > 0 and better >= good
    assert ss.score_url("https://www.uni.edu.au/news/scholarship-winners-2026", host) == 0   # news
    assert ss.score_url("https://other.com/scholarships", host) == 0                           # other site
    assert ss.score_url("https://www.uni.edu.au/about-us", host) == 0                          # not about funding
    deep = ss.score_url("https://www.uni.edu.au/a/b/c/d/e/scholarships", host)
    assert deep < good                                                                         # prefers shallow pages


def test_official_website_from_wikidata(monkeypatch):
    calls = []

    def fake_api(params, tries=4):
        calls.append(params["action"])
        if params["action"] == "wbsearchentities":
            return {"search": [{"id": "Q1", "label": "Some Band", "description": "rock band"},
                               {"id": "Q2", "label": "Deakin University", "description": "university in Australia"}]}
        return {"entities": {"Q2": {"claims": {"P856": [{"mainsnak": {"datavalue": {"value": "https://www.deakin.edu.au/"}}}]}}}}

    monkeypatch.setattr(ss, "api_json", fake_api)
    assert ss.official_website("Deakin University - Burwood") == "https://www.deakin.edu.au/"


def test_official_website_gives_up_quietly_when_rate_limited(monkeypatch):
    import requests

    def boom(params, tries=4):
        raise requests.RequestException("limit")

    monkeypatch.setattr(ss, "api_json", boom)
    assert ss.official_website("Any University") is None


def test_robots_txt_is_respected(monkeypatch):
    ss._robots.clear()

    class R:
        status_code = 200
        text = "User-agent: *\nDisallow: /private/"

    monkeypatch.setattr(ss, "get", lambda url, timeout=20: R())
    assert ss.allowed("https://uni.test/study/scholarships") is True
    assert ss.allowed("https://uni.test/private/scholarships") is False
