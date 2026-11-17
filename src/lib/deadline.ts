import type { Scholarship } from "@/hooks/useScholarships";

/** Exact deadline: the stored date first, else a best-effort parse of the display text. */
export function getDeadlineDate(s: Pick<Scholarship, "deadline_date" | "deadline_display">): Date | null {
  if (s.deadline_date) {
    const d = new Date(`${s.deadline_date}T00:00:00`);
    if (!isNaN(d.getTime())) return d;
  }
  const raw = s.deadline_display;
  if (!raw) return null;
  const cleaned = raw.replace(/(\d+)(st|nd|rd|th)/gi, "$1").replace(/\s+/g, " ").trim();
  const parsed = new Date(cleaned);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function daysUntil(date: Date | null, now = new Date()): number | null {
  if (!date) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

const TYPE_LABEL: Record<string, string> = {
  rolling: "Rolling: apply any time",
  automatic: "Automatic: no separate application",
  varies: "Varies by programme",
  closed: "Closed",
  not_published: "Not published by the university",
};

/** What to show in the "Deadline" slot: a date, a deadline type, or an honest "not confirmed". */
export function deadlineLabel(s: Scholarship): string {
  if (s.deadline_type === "fixed" || (!s.deadline_type && s.deadline_display)) {
    const d = getDeadlineDate(s);
    const text = d
      ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : s.deadline_display;
    return s.deadline_inferred ? `${text} (year assumed)` : (text ?? "Not confirmed");
  }
  if (s.deadline_type && TYPE_LABEL[s.deadline_type]) return TYPE_LABEL[s.deadline_type];
  return "Not confirmed, check official page";
}
