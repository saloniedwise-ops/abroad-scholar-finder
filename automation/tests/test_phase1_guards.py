"""Phase 1 safeguards: aggregate amounts, generic names, global dedupe."""
import sys
from datetime import date

sys.path.insert(0, "automation")

from parse_scholarships import _amount  # noqa: E402
from matching import normalize_name  # noqa: E402

TODAY = date(2026, 11, 17)


def test_aggregate_fund_total_is_not_an_award_amount():
    text = ("Welcome\n"
            "This year, we are providing support by awarding over £500,000 in merit scholarships "
            "to international fee-paying students enrolling in January & September 2027.\n")
    assert _amount(text)["amount_display"] is None


def test_per_award_amount_still_extracted():
    text = "Award value: Up to £3,000 off tuition fees\n"
    assert "£3,000" in _amount(text)["amount_display"]


def test_generic_names_and_duplicates_are_not_inserted(monkeypatch):
    class FakeDB:
        inserts, changes, updates, verified = [], [], {}, []

        def unique_slug(self, base): return base
        def insert_scholarship(self, row): self.inserts.append(row)
        def insert_change(self, *a): self.changes.append(a)
        def update_scholarship(self, i, f): self.updates[i] = f
        def mark_verified(self, ids): self.verified.extend(ids)
        def now_iso(self): return "2026-11-17T00:00:00+00:00"

    fake = FakeDB()
    monkeypatch.setitem(sys.modules, "db", fake)
    import crawler

    source = {"id": "s1", "source_slug": "uni", "source_url": "https://uni.test/funding",
              "university_name": "Uni", "university_id": "u1", "country_name": "UK"}
    recs = [
        {"name": "Scholarships", "confidence": 0.9},          # generic page heading
        {"name": "International Scholarships", "confidence": 0.9},  # generic
        {"name": "Alumni Bursary", "confidence": 0.9},         # already exists globally
        {"name": "Vice-Chancellor's Excellence Scholarship", "confidence": 0.9},  # genuinely new
    ]
    known = {("Uni", normalize_name("Alumni Bursary"))}
    stats = crawler.process_page(source, recs, [], TODAY, known)

    assert stats["added"] == 1
    assert [r["scholarship_name"] for r in fake.inserts] == ["Vice-Chancellor's Excellence Scholarship"]
