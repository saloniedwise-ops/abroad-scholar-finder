import { describe, expect, it } from "vitest";
import { isListable } from "@/hooks/useScholarships";

const today = new Date("2026-11-17");
const fresh = "2026-11-16T10:00:00Z";

describe("isListable", () => {
  it("keeps a normal scholarship", () => {
    expect(isListable({ scholarship_name: "Women in Science Bursary", deadline_date: "2027-01-10", last_verified_at: fresh }, today)).toBe(true);
    expect(isListable({ scholarship_name: "Open all year", deadline_date: null, last_verified_at: fresh }, today)).toBe(true);
  });
  it("drops junk produced by the old extractor", () => {
    expect(isListable({ scholarship_name: "scholarships@hw.ac.uk" }, today)).toBe(false);
    expect(isListable({ scholarship_name: "Contact team", learn_more_url: "mailto:a@b.c" }, today)).toBe(false);
    expect(isListable({ scholarship_name: "Skip to main content" }, today)).toBe(false);
  });
  it("drops closed and expired scholarships", () => {
    expect(isListable({ scholarship_name: "Merit Award", status: "Closed" }, today)).toBe(false);
    expect(isListable({ scholarship_name: "Merit Award", deadline_date: "2026-11-16" }, today)).toBe(false);
    expect(isListable({ scholarship_name: "Merit Award", deadline_date: "2026-11-17", last_verified_at: fresh }, today)).toBe(true);
  });
  it("drops scholarships the crawler could not verify recently", () => {
    expect(isListable({ scholarship_name: "Merit Award", last_verified_at: null }, today)).toBe(false);
    expect(isListable({ scholarship_name: "Merit Award", last_verified_at: "2026-04-22T10:00:00Z" }, today)).toBe(false);
    expect(isListable({ scholarship_name: "Merit Award", last_verified_at: "2026-10-10T10:00:00Z" }, today)).toBe(true);
  });
});
