import { countries, fields, degrees, universities } from "@/data/scholarships";
import { X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

interface FilterBarProps {
  selectedCountry: string;
  selectedField: string;
  selectedDegree: string;
  selectedUniversity: string;
  onCountryChange: (country: string) => void;
  onFieldChange: (field: string) => void;
  onDegreeChange: (degree: string) => void;
  onUniversityChange: (university: string) => void;
  resultCount: number;
}

const FilterBar = ({
  selectedCountry,
  selectedField,
  selectedDegree,
  selectedUniversity,
  onCountryChange,
  onFieldChange,
  onDegreeChange,
  onUniversityChange,
  resultCount,
}: FilterBarProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectClass =
    "rounded-lg border border-border bg-card px-4 py-2.5 font-body text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-gold cursor-pointer";

  const hasActiveFilters = selectedCountry || selectedField || selectedDegree || selectedUniversity;

  const clearAll = () => {
    onCountryChange("");
    onFieldChange("");
    onDegreeChange("");
    onUniversityChange("");
  };

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* Primary filters row */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedCountry}
                onChange={(e) => onCountryChange(e.target.value)}
                className={selectClass}
              >
                <option value="">🌍 All Countries</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={selectedField}
                onChange={(e) => onFieldChange(e.target.value)}
                className={selectClass}
              >
                <option value="">📚 All Fields</option>
                {fields.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>

              <select
                value={selectedDegree}
                onChange={(e) => onDegreeChange(e.target.value)}
                className={selectClass}
              >
                <option value="">🎓 All Degrees</option>
                {degrees.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`flex items-center gap-1.5 rounded-lg border px-4 py-2.5 font-body text-sm transition-colors ${
                  showAdvanced
                    ? "border-gold bg-gold/10 text-gold-dark"
                    : "border-border bg-card text-muted-foreground hover:border-gold/40"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Advanced
              </button>
            </div>

            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 font-body text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <X className="h-3 w-3" />
                  Clear All
                </button>
              )}
              <p className="font-body text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{resultCount}</span> scholarships found
              </p>
            </div>
          </div>

          {/* Advanced filters */}
          {showAdvanced && (
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <select
                value={selectedUniversity}
                onChange={(e) => onUniversityChange(e.target.value)}
                className={selectClass}
              >
                <option value="">🏛️ All Universities</option>
                {universities.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {selectedCountry && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 font-body text-xs font-medium text-gold-dark">
                  {selectedCountry}
                  <button onClick={() => onCountryChange("")} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedField && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 font-body text-xs font-medium text-gold-dark">
                  {selectedField}
                  <button onClick={() => onFieldChange("")} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedDegree && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 font-body text-xs font-medium text-gold-dark">
                  {selectedDegree}
                  <button onClick={() => onDegreeChange("")} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedUniversity && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 font-body text-xs font-medium text-gold-dark">
                  {selectedUniversity}
                  <button onClick={() => onUniversityChange("")} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
