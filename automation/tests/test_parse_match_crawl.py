import sys
import types
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from matching import match_records, normalize_name, similarity, slugify
from parse_scholarships import parse_page

TODAY = date(2026, 11, 17)

SINGLE = """<html><head><title>Global Leaders Scholarship | Uni of Test</title></head><body>
<nav>Menu</nav><main><h1>Global Leaders Scholarship</h1>
<h2>Key facts</h2><p>Value:</p><p>£6,500</p><p>Opens:</p><p>12 November 2026</p><p>Deadline:</p><p>14 March 2027</p>
<h2>Summary</h2><p>This award supports outstanding international students who show leadership potential across the world.</p>
<h2>Eligibility</h2><p>You must hold an offer for a taught postgraduate Master's course and be an international student.</p>
<h2>How to apply</h2><p>Complete the online form.</p><a href="/apply/form">Apply now</a>
</main><footer>© 2026</footer></body></html>"""

LISTING = """<html><body><main><h1>Funding</h1>
<h3>Alumni Bursary</h3><p>Amount: 10% off tuition fees for our graduates.</p><p>Eligibility: Loughborough alumni.</p>
<h3>Merit Scholarship</h3><p>A £5,000 scholarship for international students. Deadline: 1 June 2027</p>
<h3>Women in Science Bursary</h3><p>Worth £1,000 per year. Applications are accepted on a rolling basis.</p>
<h3>Contact us</h3><p>Email us</p></main></body></html>"""


def test_single_page_fields():
    (rec,) = parse_page(SINGLE, "https://uni.test/s", TODAY)
    assert rec["mode"] == "single" and rec["name"] == "Global Leaders Scholarship"
    assert rec["deadline_type"] == "fixed" and str(rec["deadline_date"]) == "2027-03-14"
    assert str(rec["opens_date"]) == "2026-11-12"
    assert rec["amount_value"] == 6500 and rec["amount_currency"] == "GBP"
    assert "taught postgraduate" in rec["eligibility"] and rec["degree_level"] == "Postgraduate Taught"
    assert rec["application_url"] == "https://uni.test/apply/form"
    assert rec["confidence"] >= 0.8


def test_listing_page_splits_scholarships_and_reads_deadline_kinds():
    recs = parse_page(LISTING, "https://uni.test/funding", TODAY)
    by = {r["name"]: r for r in recs}
    assert set(by) == {"Alumni Bursary", "Merit Scholarship", "Women in Science Bursary"}
    assert by["Alumni Bursary"]["amount_display"] == "10% of tuition"
    assert by["Merit Scholarship"]["deadline_type"] == "fixed" and str(by["Merit Scholarship"]["deadline_date"]) == "2027-06-01"
    assert by["Women in Science Bursary"]["deadline_type"] == "rolling"


def test_deadline_wording_types():
    def one(txt):
        h = f"<main><h1>Test Scholarship</h1><p>{txt}</p></main>"
        return parse_page(h, "https://u.test", TODAY)[0]["deadline_type"]
    assert one("You will be considered automatically, no separate application is required.") == "automatic"
    assert one("Applications are now closed for this intake.") == "closed"
    assert one("Deadlines vary by programme.") == "varies"
    assert one("Nothing about dates here.") is None


def test_day_month_without_year_is_inferred_and_flagged():
    h = "<main><h1>Spring Scholarship</h1><p>Deadline: 31 May</p></main>"
    rec = parse_page(h, "https://u.test", TODAY)[0]
    assert str(rec["deadline_date"]) == "2027-05-31" and rec["deadline_inferred"] is True


def test_matching_by_name_and_direct_single_pair():
    rows = [{"scholarship_name": "The Merit Scholarship 2026", "id": "1"}, {"scholarship_name": "Alumni Bursary", "id": "2"}]
    recs = [{"name": "Merit Scholarship"}, {"name": "Alumni bursaries"}, {"name": "Brand New Award"}]
    pairs, rest = match_records(recs, rows)
    assert {(r["name"], w["id"]) for r, w in pairs} == {("Merit Scholarship", "1"), ("Alumni bursaries", "2")}
    assert [r["name"] for r in rest] == ["Brand New Award"]
    p, r = match_records([{"name": "Totally different"}], [{"scholarship_name": "Other thing", "id": "9"}])
    assert len(p) == 1 and not r  # 1 page scholarship + 1 linked row are paired directly


def test_normalize_and_slug():
    assert normalize_name("The Chevening Scholarships 2026/27") == "chevening"
    assert similarity("Chevening Scholarship", "Chevening Scholarships") == 1.0
    assert slugify("Uni of Test: Merit Award!") == "uni-of-test-merit-award"


class FakeDB(types.ModuleType):
    def __init__(self):
        super().__init__("db")
        self.updates, self.inserts, self.changes, self.verified = [], [], [], []
        self._slugs = set()

    def now_iso(self): return "NOW"
    def update_scholarship(self, i, f): self.updates.append((i, f))
    def insert_scholarship(self, r): self.inserts.append(r)
    def insert_change(self, *a, **k): self.changes.append((a, k))
    def mark_verified(self, ids): self.verified += ids
    def unique_slug(self, b): return b


def test_process_page_updates_matched_adds_new_and_verifies_only_matched(monkeypatch):
    fake = FakeDB()
    monkeypatch.setitem(sys.modules, "db", fake)
    import crawler

    source = {"id": "s1", "source_slug": "uni", "source_url": "https://uni.test/funding", "university_name": "Uni",
              "university_id": "u1", "country_name": "UK"}
    linked = [
        {"id": "r1", "scholarship_name": "Merit Scholarship", "deadline_date": None, "deadline_display": None,
         "status": "Closed", "amount_display": None, "degree_level": None, "field_category": None, "summary": None},
        {"id": "r2", "scholarship_name": "Vanished Award", "deadline_date": None, "status": None},
    ]
    records = parse_page(LISTING, source["source_url"], TODAY)
    stats = crawler.process_page(source, records, linked, TODAY, set())

    assert stats["matched"] == 1  # only "Merit Scholarship" exists in the database already
    assert "r1" in fake.verified and "r2" not in fake.verified  # unmatched rows age out
    upd = dict(fake.updates)["r1"]
    assert upd["deadline_date"] == "2027-06-01" and upd["deadline_type"] == "fixed"
    assert upd["status"] == "Active"  # a closed scholarship with a new future deadline reopens
    assert any(a[2] == "deadline_changed" for a, _ in fake.changes)
    assert {r["scholarship_name"] for r in fake.inserts} == {"Alumni Bursary", "Women in Science Bursary"}
    assert all(r["public_visible"] and r["legacy_source_value"] == "uni" for r in fake.inserts)
