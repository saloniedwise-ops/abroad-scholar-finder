"""Phase 2 safeguards: change sanity gates + review queue (needs_review changes)."""
import sys
from datetime import date

sys.path.insert(0, "automation")

import crawler  # noqa: E402

TODAY = date(2026, 11, 17)


def run(source, recs, linked, monkeypatch):
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
    stats = crawler.process_page(source, recs, linked, TODAY, set())
    return fake, stats


SOURCE = {"id": "s1", "source_slug": "uni", "source_url": "https://uni.test/funding",
          "university_name": "Uni", "university_id": "u1", "country_name": "UK"}


def test_full_funding_to_small_sum_is_held_for_review(monkeypatch):
    row = {"id": "r1", "scholarship_name": "Excellence Award", "university_name": "Uni",
           "legacy_source_value": "uni", "amount_display": "Fully funded",
           "amount_value": None, "amount_currency": None, "status": "Active"}
    rec = {"name": "Excellence Award", "confidence": 0.9, "amount_display": "£50",
           "amount_value": 50.0, "amount_currency": "GBP"}
    fake, stats = run(SOURCE, [rec], [row], monkeypatch)

    assert stats["flagged"] == 3  # display, value, currency withheld
    assert "amount_display" not in fake.updates["r1"]
    assert "amount_value" not in fake.updates["r1"]
    reviews = [c for c in fake.changes if c[2] == "needs_review"]
    assert reviews, "flagged change must land in the review queue"


def test_normal_amount_update_applies_without_review(monkeypatch):
    row = {"id": "r2", "scholarship_name": "Merit Award", "university_name": "Uni",
           "legacy_source_value": "uni", "amount_display": "£8,000",
           "amount_value": 8000.0, "amount_currency": "GBP", "status": "Active"}
    rec = {"name": "Merit Award", "confidence": 0.9, "amount_display": "£8,500",
           "amount_value": 8500.0, "amount_currency": "GBP"}
    fake, stats = run(SOURCE, [rec], [row], monkeypatch)

    assert stats["flagged"] == 0
    assert fake.updates["r2"]["amount_value"] == 8500.0
    assert any(c[2] == "amount_changed" for c in fake.changes)


def test_steep_amount_drop_and_jump_are_held(monkeypatch):
    rows = [
        {"id": "r3", "scholarship_name": "Drop Award", "university_name": "Uni",
         "legacy_source_value": "uni", "amount_display": "£2,000",
         "amount_value": 2000.0, "amount_currency": "GBP", "status": "Active"},
        {"id": "r4", "scholarship_name": "Jump Award", "university_name": "Uni",
         "legacy_source_value": "uni", "amount_display": "£1,000",
         "amount_value": 1000.0, "amount_currency": "GBP", "status": "Active"},
    ]
    recs = [
        {"name": "Drop Award", "confidence": 0.9, "amount_display": "£100",
         "amount_value": 100.0, "amount_currency": "GBP"},
        {"name": "Jump Award", "confidence": 0.9, "amount_display": "£50,000",
         "amount_value": 50000.0, "amount_currency": "GBP"},
    ]
    fake, stats = run(SOURCE, recs, rows, monkeypatch)

    assert stats["flagged"] == 6  # both awards lose all three amount fields
    assert "amount_display" not in fake.updates["r3"]
    assert "amount_display" not in fake.updates["r4"]


def test_currency_switch_is_held(monkeypatch):
    row = {"id": "r5", "scholarship_name": "Currency Award", "university_name": "Uni",
           "legacy_source_value": "uni", "amount_display": "£5,000",
           "amount_value": 5000.0, "amount_currency": "GBP", "status": "Active"}
    rec = {"name": "Currency Award", "confidence": 0.9, "amount_display": "$5,000",
           "amount_value": 5000.0, "amount_currency": "USD"}
    fake, stats = run(SOURCE, [rec], [row], monkeypatch)

    assert stats["flagged"] == 3
    assert "amount_currency" not in fake.updates["r5"]


def test_deadline_quality_downgrade_is_held_but_real_move_applies(monkeypatch):
    rows = [
        {"id": "r6", "scholarship_name": "Downgrade Prize", "university_name": "Uni",
         "legacy_source_value": "uni", "deadline_type": "fixed",
         "deadline_display": "1 March 2027", "deadline_date": "2027-03-01", "status": "Active"},
        {"id": "r7", "scholarship_name": "Moved Prize", "university_name": "Uni",
         "legacy_source_value": "uni", "deadline_type": "fixed",
         "deadline_display": "1 March 2027", "deadline_date": "2027-03-01", "status": "Active"},
    ]
    recs = [
        {"name": "Downgrade Prize", "confidence": 0.9, "deadline_type": "varies",
         "deadline_display": "Varies"},
        {"name": "Moved Prize", "confidence": 0.9, "deadline_type": "fixed",
         "deadline_display": "1 April 2027", "deadline_date": date(2027, 4, 1)},
    ]
    fake, stats = run(SOURCE, recs, rows, monkeypatch)

    assert "deadline_type" not in fake.updates["r6"]          # downgrade withheld
    assert fake.updates["r7"]["deadline_date"] == "2027-04-01"  # real move applied
    assert any(c[2] == "deadline_changed" for c in fake.changes)
    assert any(c[2] == "needs_review" for c in fake.changes)
