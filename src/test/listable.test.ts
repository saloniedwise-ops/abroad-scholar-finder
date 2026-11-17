import { describe, expect, it } from "vitest";
import { isListable } from "@/hooks/useScholarships";

const today = new Date("2026-11-17");

describe("isListable", () => {
  it("keeps a normal scholarship", () => {
    expect(isListable({ scholarship_name: "Women in Science Bursary", deadline_date: "2027-01-10" }, today)).toBe(true);
    expect(isListable({ scholarship_name: "Open all year", deadline_date: null }, today)).toBe(true);
  });
  it("drops junk produced by the old extractor", () => {
    expect(isListable({ scholarship_name: "scholarships@hw.ac.uk" }, today)).toBe(false);
    expect(isListable({ scholarship_name: "Contact team", learn_more_url: "mailto:a@b.c" }, today)).toBe(false);
    expect(isListable({ scholarship_name: "Skip to main content" }, today)).toBe(false);
  });
  it("drops closed and expired scholarships", () => {
    expect(isListable({ scholarship_name: "Merit Award", status: "Closed" }, today)).toBe(false);
    expect(isListable({ scholarship_name: "Merit Award", deadline_date: "2026-11-16" }, today)).toBe(false);
    expect(isListable({ scholarship_name: "Merit Award", deadline_date: "2026-11-17" }, today)).toBe(true);
  });
});
