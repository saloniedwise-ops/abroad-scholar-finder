interface DedupeRow {
  university_name: string;
  scholarship_name: string;
  last_verified_at: string | null;
}

export const CANONICAL_DEGREES = ["Undergraduate", "Postgraduate", "PhD / Research"] as const;
export type CanonicalDegree = (typeof CANONICAL_DEGREES)[number];

const DEGREE_ALIASES: Record<string, CanonicalDegree> = {
  undergraduate: "Undergraduate",
  "postgraduate": "Postgraduate",
  "postgraduate taught": "Postgraduate",
  "postgraduate research": "Postgraduate",
  masters: "Postgraduate",
  "phd": "PhD / Research",
  "phd / research": "PhD / Research",
  doctorate: "PhD / Research",
  doctoral: "PhD / Research",
};

// degree_level arrives as free text from many sources, often combined
// ("Undergraduate, Postgraduate", "Undergraduate & Postgraduate").
// Split it into the canonical levels it covers.
export const degreeTokens = (level?: string | null): CanonicalDegree[] => {
  if (!level) return [];
  const found = new Set<CanonicalDegree>();
  level
    .split(/[,&/]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .forEach((part) => {
      const canonical = DEGREE_ALIASES[part];
      if (canonical) found.add(canonical);
    });
  // Whole-string fallbacks for values the splitter missed.
  if (found.size === 0) {
    const lower = level.toLowerCase();
    if (lower.includes("phd") || lower.includes("doctor")) found.add("PhD / Research");
    if (lower.includes("postgrad") || lower.includes("master")) found.add("Postgraduate");
    if (lower.includes("undergrad") || lower.includes("bachelor")) found.add("Undergraduate");
  }
  return CANONICAL_DEGREES.filter((d) => found.has(d));
};

const normalizeKey = (text?: string | null) =>
  (text || "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const verifiedTime = (s: DedupeRow) => {
  const t = s.last_verified_at ? Date.parse(s.last_verified_at) : NaN;
  return Number.isNaN(t) ? 0 : t;
};

// The crawler has historically created near-identical rows for the same
// scholarship (same university + same name). Show each real scholarship once,
// keeping the most recently verified row.
export const dedupeScholarships = <T extends DedupeRow>(rows: T[]): T[] => {
  const best = new Map<string, T>();
  rows.forEach((row) => {
    const key = `${normalizeKey(row.university_name)}|${normalizeKey(row.scholarship_name)}`;
    const existing = best.get(key);
    if (!existing || verifiedTime(row) > verifiedTime(existing)) {
      best.set(key, row);
    }
  });
  return [...best.values()];
};
