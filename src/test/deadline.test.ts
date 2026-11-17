import { describe, expect, it } from "vitest";
import { daysUntil, deadlineLabel, getDeadlineDate } from "@/lib/deadline";
import type { Scholarship } from "@/hooks/useScholarships";

const base = { deadline_date: null, deadline_display: null, deadline_type: null, deadline_inferred: false } as Scholarship;
const s = (o: Partial<Scholarship>) => ({ ...base, ...o }) as Scholarship;

describe("deadline helpers", () => {
  it("prefers the exact stored date over display text", () => {
    const d = getDeadlineDate(s({ deadline_date: "2027-03-14", deadline_display: "sometime" }));
    expect(d?.getFullYear()).toBe(2027);
    expect(d?.getMonth()).toBe(2);
    expect(d?.getDate()).toBe(14);
  });
  it("falls back to parsing display text, and to null", () => {
    expect(getDeadlineDate(s({ deadline_display: "14th March 2027" }))?.getFullYear()).toBe(2027);
    expect(getDeadlineDate(s({ deadline_display: "Rolling" }))).toBeNull();
  });
  it("counts days", () => {
    expect(daysUntil(new Date("2026-11-20T00:00:00"), new Date("2026-11-17T15:00:00"))).toBe(3);
    expect(daysUntil(null)).toBeNull();
  });
  it("labels every deadline kind honestly", () => {
    expect(deadlineLabel(s({ deadline_type: "fixed", deadline_date: "2027-03-14" }))).toMatch(/14 Mar 2027/);
    expect(deadlineLabel(s({ deadline_type: "fixed", deadline_date: "2027-05-31", deadline_inferred: true }))).toMatch(/year assumed/);
    expect(deadlineLabel(s({ deadline_type: "rolling" }))).toMatch(/Rolling/);
    expect(deadlineLabel(s({ deadline_type: "automatic" }))).toMatch(/Automatic/);
    expect(deadlineLabel(s({}))).toMatch(/Not confirmed/);
  });
});
