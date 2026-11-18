import { describe, it, expect } from "vitest";
import { extractProfile, scoreScholarship, isEmptyProfile } from "@/lib/matcher";
import type { Scholarship } from "@/hooks/useScholarships";

const makeScholarship = (overrides: Partial<Scholarship>): Scholarship =>
  ({
    id: "x",
    scholarship_name: "Test Scholarship",
    university_name: "Test University",
    country_name: "United Kingdom",
    degree_level: "General",
    field_category: "Other",
    amount_display: null,
    featured: false,
    last_verified_at: null,
    ...overrides,
  } as Scholarship);

describe("extractProfile", () => {
  it("pulls degree, field, country and funding intent out of plain words", () => {
    const p = extractProfile(
      "Indian student finishing my bachelors in computer science, looking for a fully funded masters in the UK"
    );
    expect(p.degrees).toEqual(expect.arrayContaining(["Undergraduate", "Postgraduate"]));
    expect(p.fields).toContain("Engineering");
    expect(p.countries).toContain("United Kingdom");
    expect(p.fullyFunded).toBe(true);
  });

  it("returns an empty profile for unrelated text", () => {
    expect(isEmptyProfile(extractProfile("hello there"))).toBe(true);
  });
});

describe("scoreScholarship", () => {
  const profile = extractProfile("masters in engineering in the UK, fully funded");

  it("rewards matching degree, field and country", () => {
    const good = scoreScholarship(
      makeScholarship({
        degree_level: "Postgraduate Taught",
        field_category: "Engineering",
        country_name: "United Kingdom",
        amount_display: "Fully funded",
      }),
      profile
    );
    const bad = scoreScholarship(
      makeScholarship({
        degree_level: "Undergraduate",
        field_category: "Law",
        country_name: "Canada",
      }),
      profile
    );
    expect(good.score).toBeGreaterThan(bad.score);
    expect(good.reasons.join(" ")).toMatch(/Postgraduate|Engineering|United Kingdom/);
  });

  it("does not penalise unknown degree or field", () => {
    const unknown = scoreScholarship(
      makeScholarship({ degree_level: "General", field_category: "Other" }),
      profile
    );
    const mismatch = scoreScholarship(
      makeScholarship({ degree_level: "Undergraduate", field_category: "Law" }),
      profile
    );
    expect(unknown.score).toBeGreaterThan(mismatch.score);
  });
});
