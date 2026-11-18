import { useState } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";
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

const assistWithAi = async (text: string): Promise<StudentProfile | null> => {
  if (!AI_ASSIST_URL) return null;
  try {
    const res = await fetch(AI_ASSIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const base = extractProfile(text);
    return {
      degrees: Array.isArray(data.degrees) ? data.degrees : base.degrees,
      fields: Array.isArray(data.fields) ? data.fields : base.fields,
      countries: Array.isArray(data.countries) ? data.countries : base.countries,
      fullyFunded: typeof data.fullyFunded === "boolean" ? data.fullyFunded : base.fullyFunded,
      raw: base.raw,
    };
  } catch {
    return null; // network or function down: local parsing already covers it
  }
};

const MatchMe = ({ countries, fields, onMatch, active }: MatchMeProps) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [degree, setDegree] = useState("");
  const [field, setField] = useState("");
  const [country, setCountry] = useState("");
  const [fullyFunded, setFullyFunded] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleMatch = async () => {
    setBusy(true);
    try {
      const fromText = text.trim() ? (await assistWithAi(text)) ?? extractProfile(text) : null;
      const profile: StudentProfile = {
        degrees: degree ? [degree] : fromText?.degrees ?? [],
        fields: field ? [field] : fromText?.fields ?? [],
        countries: country ? [country] : fromText?.countries ?? [],
        fullyFunded: fullyFunded || (fromText?.fullyFunded ?? false),
        raw: text.trim(),
      };
      if (!isEmptyProfile(profile)) onMatch(profile);
    } finally {
      setBusy(false);
    }
  };

  const handleClear = () => {
    setText("");
    setDegree("");
    setField("");
    setCountry("");
    setFullyFunded(false);
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

      <div className="flex items-center gap-3">
        <button
          onClick={handleMatch}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 font-body text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
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
    </div>
  );
};

export default MatchMe;
