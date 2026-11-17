import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from compare import compare_text, extract_text
from extract import extract_amount, extract_deadline
from fetcher import skip_reason

TODAY = date(2026, 11, 17)


def test_deadline_prefers_next_future_date():
    t = "Intro\nApplication deadline: 29 August 2025\nSecond round closes 15 Jan 2027\nOther"
    assert extract_deadline(t, TODAY) == (date(2027, 1, 15), "15 Jan 2027")


def test_deadline_ignores_dates_without_cue_and_handles_us_format():
    assert extract_deadline("Posted on 3 May 2026", TODAY) is None
    assert extract_deadline("Applications close\nMarch 1, 2027", TODAY)[0] == date(2027, 3, 1)
    assert extract_deadline("Deadline 5th Sept 2026", TODAY)[0] == date(2026, 9, 5)


def test_deadline_all_past_returns_latest():
    t = "Deadline: 1 March 2025\nClosing date 1 June 2025"
    assert extract_deadline(t, TODAY)[0] == date(2025, 6, 1)


def test_amount():
    assert extract_amount("This scholarship is worth £3,000 per year") == "£3,000 per year"
    assert extract_amount("A 25% tuition discount is awarded") == "25% tuition"
    assert extract_amount("Nothing here") is None


def test_cleaning_ignores_chrome_and_volatile_lines():
    a = "<body><nav>Menu</nav><main><p>Award £1000</p><p>Last updated 3 May 2026</p></main><footer>© 2026</footer></body>"
    b = "<body><nav>Different menu</nav><main><p>Award £1000</p><p>Last updated 9 Nov 2026</p></main><footer>© 2027</footer></body>"
    assert not compare_text(extract_text(a), extract_text(b))["changed"]
    c = b.replace("£1000", "£2000")
    assert compare_text(extract_text(a), extract_text(c))["changed"]


def test_skip_search_and_mailto():
    assert skip_reason("https://www.google.com/search?q=x")
    assert skip_reason("mailto:a@b.c")
    assert skip_reason("https://www.aston.ac.uk/x") is None


def test_cleaning_never_wipes_a_page_wrapped_in_a_form():
    body = "<p>" + ("GREAT scholarship worth £10,000. Deadline 5 June 2027. " * 60) + "</p>"
    html = f"<html><body><form id='aspnetForm'>{body}</form></body></html>"
    text = extract_text(html)
    assert "GREAT scholarship" in text and len(text) > 1000


def test_small_widgets_and_nav_are_still_removed():
    html = "<body><nav>Home About</nav><form><input></form><main><p>Real content here</p></main></body>"
    assert extract_text(html) == "Real content here"


def test_user_agent_is_honest_and_single():
    from fetcher import USER_AGENT
    assert "ScholarshipMonitor" in USER_AGENT and "Chrome" not in USER_AGENT
