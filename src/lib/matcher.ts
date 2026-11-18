import type { Scholarship } from "@/hooks/useScholarships";
import { degreeTokens } from "@/lib/taxonomy";

export interface StudentProfile {
  degrees: string[];
  fields: string[];
  countries: string[];
  fullyFunded: boolean;
  raw: string;
}

export interface MatchResult {
  scholarship: Scholarship;
  score: number;
  reasons: string[];
}

const DEGREE_KEYWORDS: [RegExp, string][] = [
  [/\b(under\s?grad(uate)?|bachelor'?s?|b\.?sc|b\.?tech|b\.?a\.?|bba|mbbs)\b/i, "Undergraduate"],
  [/\b(post\s?grad(uate)?|master'?s?|m\.?sc|m\.?tech|m\.?a\.?|mba|pg)\b/i, "Postgraduate"],
  [/\b(ph\.?\s?d|doctora(te|l)|research degree)\b/i, "PhD / Research"],
];

const FIELD_KEYWORDS: [RegExp, string][] = [
  [/\b(engineering|mechanical|civil|electrical|computer science|cs\b|software|data science|it\b)/i, "Engineering"],
  [/\b(business|management|finance|accounting|marketing|mba|economics)\b/i, "Business"],
  [/\b(medicine|medical|nursing|health|pharmacy|dentistry)/i, "Medicine"],
  [/\b(law|legal|llb|llm)\b/i, "Law"],
  [/\b(science|physics|chemistry|biology|mathematics|maths)\b/i, "Science"],
  [/\b(arts?|humanities|design|media|journalism|literature)\b/i, "Arts"],
  [/\b(sport|athletics?)\b/i, "Sport"],
];

const COUNTRY_KEYWORDS: [RegExp, string][] = [
  [/\b(uk|united kingdom|britain|england|scotland|london)\b/i, "United Kingdom"],
  [/\b(us|usa|united states|america)\b/i, "United States"],
  [/\bcanada\b/i, "Canada"],
  [/\b(australia|aussie)\b/i, "Australia"],
  [/\b(new zealand|nz)\b/i, "New Zealand"],
  [/\bireland\b/i, "Ireland"],
  [/\bgermany\b/i, "Germany"],
  [/\bfrance\b/i, "France"],
  [/\bnetherlands|holland\b/i, "Netherlands"],
  [/\bsingapore\b/i, "Singapore"],
];

const FULLY_FUNDED_RE =
  /\b(full(?:y)?[\s-]?(?:fund(?:ed)?|tuition|ride)|100%|tuition waiver|all expenses|living stipend|stipend)\b/i;

const uniq = (items: string[]) => [...new Set(items)];

// Turn a student's free-text description into structured criteria, entirely
// in the browser. The optional AI assist refines this; the site works fully
// without it.
export const extractProfile = (text: string): StudentProfile => {
  const degrees = DEGREE_KEYWORDS.filter(([re]) => re.test(text)).map(([, d]) => d);
  const fields = FIELD_KEYWORDS.filter(([re]) => re.test(text)).map(([, f]) => f);
  const countries = COUNTRY_KEYWORDS.filter(([re]) => re.test(text)).map(([, c]) => c);
  return {
    degrees: uniq(degrees),
    fields: uniq(fields),
    countries: uniq(countries),
    fullyFunded: FULLY_FUNDED_RE.test(text),
    raw: text.trim(),
  };
};

export const isEmptyProfile = (p: StudentProfile) =>
  p.degrees.length === 0 && p.fields.length === 0 && p.countries.length === 0 && !p.fullyFunded;

const haystack = (s: Scholarship) =>
  `${s.scholarship_name} ${s.summary ?? ""} ${s.description ?? ""} ${s.eligibility ?? ""}`.toLowerCase();

const FIELD_TEXT_RE: Record<string, RegExp> = {
  Engineering: /engineer|comput|software|technology|data sci|stem/i,
  Business: /business|management|finance|account|marketing|mba|econom/i,
  Medicine: /medic|nurs|health|pharma|dent/i,
  Law: /\blaw\b|legal/i,
  Science: /science|physics|chemist|biolog|math/i,
  Arts: /\bart|humanit|design|media|journalis|literature/i,
  Sport: /sport|athlet/i,
};

export const scoreScholarship = (s: Scholarship, p: StudentProfile): MatchResult => {
  let score = 0;
  const reasons: string[] = [];

  if (p.degrees.length > 0) {
    const levels = degreeTokens(s.degree_level);
    if (levels.length === 0) {
      score += 1; // unknown degree: keep it in the running
    } else if (levels.some((l) => p.degrees.includes(l))) {
      score += 4;
      reasons.push(`Open for ${levels.filter((l) => p.degrees.includes(l)).join(" + ")}`);
    } else {
      score -= 4; // known mismatch
    }
  }

  if (p.fields.length > 0) {
    const known = s.field_category && s.field_category !== "Other" ? [s.field_category] : [];
    const textHit = p.fields.some((f) => FIELD_TEXT_RE[f]?.test(haystack(s)));
    if (known.length > 0 && known.some((f) => p.fields.includes(f))) {
      score += 4;
      reasons.push(`${known.find((f) => p.fields.includes(f))} scholarship`);
    } else if (textHit) {
      score += 2;
      reasons.push("Mentions your field");
    } else if (known.length > 0) {
      score -= 3;
    } else {
      score += 1; // field unknown
    }
  }

  if (p.countries.length > 0) {
    if (p.countries.includes(s.country_name)) {
      score += 3;
      reasons.push(`In ${s.country_name}`);
    } else {
      score -= 3;
    }
  }

  if (p.fullyFunded && s.amount_display && FULLY_FUNDED_RE.test(s.amount_display)) {
    score += 3;
    reasons.push("Fully funded");
  }

  if (s.deadline_type === "rolling" || s.deadline_type === "automatic") {
    score += 1;
    reasons.push("Rolling deadline");
  } else if (s.deadline_date) {
    const days = (Date.parse(s.deadline_date) - Date.now()) / 86_400_000;
    if (days >= 0 && days <= 45) {
      score += 1;
      reasons.push("Deadline coming up");
    }
  }

  if (s.featured) score += 0.5;

  return { scholarship: s, score, reasons: reasons.slice(0, 3) };
};

export const rankMatches = (scholarships: Scholarship[], p: StudentProfile): MatchResult[] =>
  scholarships
    .map((s) => scoreScholarship(s, p))
    .sort((a, b) => b.score - a.score);
