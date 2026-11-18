import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Loader2, Wand2 } from "lucide-react";
import {
  extractProfile,
  isEmptyProfile,
  type StudentProfile,
} from "@/lib/matcher";
import { CANONICAL_DEGREES } from "@/lib/taxonomy";

interface MatchMeProps {
  countries: string[];
  fields: string[];
  onMatch: (profile: StudentProfile | null) => void;
  active: boolean;
}

const selectClass =
  "rounded-lg border border-border bg-card px-3 py-2 font-body text-sm text-foreground focus:border-gold focus:outline-none";

// Optional AI assist: when a parsing endpoint is configured (a Supabase Edge
// Function holding a free Gemini key), the student's own words are structured
// by the LLM. Without it, everything below still runs in the browser.
const AI_ASSIST_URL = import.meta.env.VITE_MATCH_ASSIST_URL as string | undefined;

const DEGREES = new Set<string>(CANONICAL_DEGREES);
const DEGREE_ALIAS: Record<string, string> = {
  undergraduate: "Undergraduate", bachelor: "Undergraduate", bachelors: "Undergraduate",
  postgraduate: "Postgraduate", master: "Postgraduate", masters: "Postgraduate",
  mba: "Postgraduate", pg: "Postgraduate",
  phd: "PhD / Research", doctorate: "PhD / Research", doctoral: "PhD / Research",
};
const FIELDS = ["Engineering", "Business", "Medicine", "Law", "Science", "Arts", "Sport"];
const FIELD_ALIAS: Record<string, string> = Object.fromEntries([
  ...FIELDS.map((f) => [f.toLowerCase(), f] as [string, string]),
  ["cs", "Engineering"], ["computer science", "Engineering"], ["management", "Business"],
  ["mba", "Business"], ["finance", "Business"], ["medical", "Medicine"], ["legal", "Law"],
]);

const canonical = (arr: unknown, aliases: Record<string, string>, allowed: Set<string> | string[]) => {
  if (!Array.isArray(arr)) return undefined;
  const allow = new Set(allowed as Iterable<string>);
  const out = arr
    .map((v) => aliases[String(v).trim().toLowerCase()])
    .filter((v): v is string => !!v && allow.has(v));
  return out.length ? [...new Set(out)] : undefined;
};

const assistWithAi = async (text: string): Promise<Partial<StudentProfile> | null> => {
  if (!AI_ASSIST_URL) return null;
  try {
    const res = await fetch(AI_ASSIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      degrees: canonical(data.degrees, DEGREE_ALIAS, DEGREES),
      fields: canonical(data.fields, FIELD_ALIAS, FIELDS),
      countries: Array.isArray(data.countries) ? data.countries.map(String) : undefined,
      fullyFunded: typeof data.fullyFunded === "boolean" ? data.fullyFunded : undefined,
    };
  } catch {
    return null; // network or function down: local parsing already applied
  }
};

const AI_STEPS = [
  "Reading your profile...",
  "Asking Gemini to understand your goals...",
  "Scanning every scholarship...",
  "Re-ranking your best matches...",
];

const MatchMe = ({ countries, fields, onMatch, active }: MatchMeProps) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [degree, setDegree] = useState("");
  const [field, setField] = useState("");
  const [country, setCountry] = useState("");
  const [fullyFunded, setFullyFunded] = useState(false);
  const [aiState, setAiState] = useState<"idle" | "working" | "refined" | "local">("idle");
  const [step, setStep] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (aiState === "working") {
      setStep(0);
      timer.current = setInterval(() => setStep((s) => (s + 1) % AI_STEPS.length), 1400);
      return () => {
        if (timer.current) clearInterval(timer.current);
      };
    }
  }, [aiState]);

  const buildProfile = (parsed: Partial<StudentProfile> | null): StudentProfile => ({
    degrees: degree ? [degree] : parsed?.degrees ?? [],
    fields: field ? [field] : parsed?.fields ?? [],
    countries: country ? [country] : parsed?.countries ?? [],
    fullyFunded: fullyFunded || parsed?.fullyFunded === true,
    raw: text.trim(),
  });

  const handleMatch = async () => {
    const local = text.trim() ? extractProfile(text) : null;
    const base = buildProfile(local);
    if (isEmptyProfile(base)) return;

    // Instant: local parsing ranks immediately so there is always something
    // to look at, then Gemini refines the order a moment later.
    onMatch(base);

    if (!text.trim() || !AI_ASSIST_URL) {
      setAiState("local");
      return;
    }
    setAiState("working");
    const ai = await assistWithAi(text);
    if (ai && (ai.degrees || ai.fields || ai.countries || ai.fullyFunded !== undefined)) {
      // AI wins over the quick local parse; explicit dropdown picks win over both.
      const refined = buildProfile({
        degrees: ai.degrees ?? local?.degrees,
        fields: ai.fields ?? local?.fields,
        countries: ai.countries ?? local?.countries,
        fullyFunded: ai.fullyFunded ?? local?.fullyFunded,
        raw: local?.raw ?? "",
      } as Partial<StudentProfile>);
      onMatch(refined);
      setAiState("refined");
    } else {
      setAiState("local");
    }
  };

  const handleClear = () => {
    setText("");
    setDegree("");
    setField("");
    setCountry("");
    setFullyFunded(false);
    setAiState("idle");
    onMatch(null);
  };

  if (!open && !active) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gradient-to-r from-gold/10 via-gold/5 to-transparent px-4 py-3.5 font-body text-sm font-medium text-foreground transition-colors hover:border-gold hover:from-gold/20"
      >
        <Sparkles className="h-4 w-4 text-gold" />
        Not sure where to start? Describe yourself and let us match you
      </button>
    );
  }

  return (
    <div className="mb-8 rounded-xl border border-gold/30 bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold" />
          <h2 className="font-display text-lg font-bold text-foreground">Match me</h2>
        </div>
        <button
          onClick={() => {
            handleClear();
            setOpen(false);
          }}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close matcher"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder='In your own words, e.g. "Indian student finishing my bachelors in computer science, looking for a fully funded masters in the UK"'
        className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select value={degree} onChange={(e) => setDegree(e.target.value)} className={selectClass}>
          <option value="">Any degree</option>
          {CANONICAL_DEGREES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {fields.length > 0 && (
          <select value={field} onChange={(e) => setField(e.target.value)} className={selectClass}>
            <option value="">Any field</option>
            {fields.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        )}
        <select value={country} onChange={(e) => setCountry(e.target.value)} className={selectClass}>
          <option value="">Any country</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 font-body text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={fullyFunded}
            onChange={(e) => setFullyFunded(e.target.checked)}
            className="accent-gold"
          />
          Fully funded only
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleMatch}
          disabled={aiState === "working"}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 font-body text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {aiState === "working" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Find my matches
        </button>
        {active && (
          <button
            onClick={handleClear}
            className="font-body text-xs text-muted-foreground hover:text-destructive"
          >
            Clear match
          </button>
        )}
      </div>

      {aiState === "working" && (
        <div className="mt-4 rounded-lg border border-gold/20 bg-gold/5 px-4 py-3" aria-live="polite">
          <div className="flex items-center gap-2.5">
            <Wand2 className="h-4 w-4 animate-pulse text-gold" />
            <span key={step} className="font-body text-sm text-foreground">
              {AI_STEPS[step]}
            </span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gold/15">
            <div className="h-full w-1/3 animate-[slide_1.2s_ease-in-out_infinite] rounded-full bg-gold" />
          </div>
          <p className="mt-2 font-body text-xs text-muted-foreground">
            Your quick matches are already below - Gemini is fine-tuning the order.
          </p>
        </div>
      )}
      {aiState === "refined" && (
        <p className="mt-3 font-body text-xs text-emerald-600 dark:text-emerald-400" aria-live="polite">
          ✨ Gemini refined your matches based on your story.
        </p>
      )}
    </div>
  );
};

export default MatchMe;
