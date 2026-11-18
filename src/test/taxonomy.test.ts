import { describe, it, expect } from "vitest";
import { degreeTokens, dedupeScholarships } from "@/lib/taxonomy";

describe("degreeTokens", () => {
  it("returns nothing for unknown levels", () => {
    expect(degreeTokens(null)).toEqual([]);
    expect(degreeTokens("General")).toEqual([]);
    expect(degreeTokens("")).toEqual([]);
  });

  it("maps combined free text to canonical levels", () => {
    expect(degreeTokens("Undergraduate, Postgraduate")).toEqual(["Undergraduate", "Postgraduate"]);
    expect(degreeTokens("Undergraduate & Postgraduate")).toEqual(["Undergraduate", "Postgraduate"]);
    expect(degreeTokens("Postgraduate Taught, PhD / Research")).toEqual(["Postgraduate", "PhD / Research"]);
    expect(degreeTokens("Undergraduate, Postgraduate Taught, PhD / Research")).toEqual([
      "Undergraduate",
      "Postgraduate",
      "PhD / Research",
    ]);
  });

  it("keeps canonical order", () => {
    expect(degreeTokens("PhD / Research, Undergraduate")).toEqual(["Undergraduate", "PhD / Research"]);
  });
});

describe("dedupeScholarships", () => {
  const row = (id: string, uni: string, name: string, verified: string | null) => ({
    id,
    university_name: uni,
    scholarship_name: name,
    last_verified_at: verified,
  });

  it("keeps one row per university+name, preferring the most recently verified", () => {
    const rows = [
      row("a", "AUT", "International Excellence Scholarship", "2026-11-10T00:00:00Z"),
      row("b", "AUT", "International Excellence Scholarship", "2026-11-17T00:00:00Z"),
      row("c", "AUT", "Other Award", "2026-11-01T00:00:00Z"),
    ];
    const out = dedupeScholarships(rows);
    expect(out).toHaveLength(2);
    expect(out.map((r) => r.id).sort()).toEqual(["b", "c"]);
  });

  it("treats name punctuation and case as the same scholarship", () => {
    const rows = [
      row("a", "University of Waikato", "Vice-Chancellor's Excellence Scholarship", null),
      row("b", "University of Waikato", "Vice Chancellors Excellence Scholarship", "2026-11-15T00:00:00Z"),
    ];
    const out = dedupeScholarships(rows);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("b");
  });

  it("keeps same-named scholarships at different universities", () => {
    const rows = [
      row("a", "AUT", "Excellence Scholarship", null),
      row("b", "Waikato", "Excellence Scholarship", null),
    ];
    expect(dedupeScholarships(rows)).toHaveLength(2);
  });
});
