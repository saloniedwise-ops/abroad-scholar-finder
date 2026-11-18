import {
  X,
  SlidersHorizontal,
  Sparkles,
  Clock3,
  Star,
  ArrowUpDown,
  Banknote,
  Heart,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

export type QuickFilterType =
  | "saved"
  | "closingSoon"
  | "recentlyUpdated"
  | "highValue"
  | "featured";

export type SortOption = "relevant" | "deadline" | "updated" | "name";

interface FilterBarProps {
  selectedCountry: string;
  selectedField: string;
  selectedDegree: string;
  selectedUniversity: string;
  selectedQuickFilters: QuickFilterType[];
  selectedSort: SortOption;
  savedCount: number;
  onCountryChange: (country: string) => void;
  onFieldChange: (field: string) => void;
  onDegreeChange: (degree: string) => void;
  onUniversityChange: (university: string) => void;
  onQuickFiltersChange: (filters: QuickFilterType[]) => void;
  onSortChange: (sort: SortOption) => void;
  resultCount: number;
  countries: string[];
  fields: string[];
  degrees: string[];
  universities: string[];
}

const FilterBar = ({
  selectedCountry,
  selectedField,
  selectedDegree,
  selectedUniversity,
  selectedQuickFilters = [],
  selectedSort,
  savedCount,
  onCountryChange,
  onFieldChange,
  onDegreeChange,
  onUniversityChange,
  onQuickFiltersChange,
  onSortChange,
  resultCount,
  countries,
  fields,
  degrees,
  universities,
}: FilterBarProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectClass =
    "rounded-lg border border-border bg-card px-4 py-2.5 font-body text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-gold cursor-pointer";

  const hasActiveFilters =
    !!selectedCountry ||
    !!selectedField ||
    !!selectedDegree ||
    !!selectedUniversity ||
    selectedQuickFilters.length > 0 ||
    selectedSort !== "relevant";

  const toggleQuickFilter = (filter: QuickFilterType) => {
    if (selectedQuickFilters.includes(filter)) {
      onQuickFiltersChange(selectedQuickFilters.filter((f) => f !== filter));
    } else {
      onQuickFiltersChange([...selectedQuickFilters, filter]);
    }
  };

  const clearAll = () => {
    onCountryChange("");
    onFieldChange("");
    onDegreeChange("");
    onUniversityChange("");
    onQuickFiltersChange([]);
    onSortChange("relevant");
  };

  const quickFilters: {
    key: QuickFilterType;
    label: string;
    icon: ReactNode;
    count?: number;
  }[] = [
    {
      key: "saved",
      label: "Saved",
      icon: <Heart className="h-3 w-3" />,
      count: savedCount,
    },
    {
      key: "closingSoon",
      label: "Closing Soon",
      icon: <Clock3 className="h-3 w-3" />,
    },
    {
      key: "recentlyUpdated",
      label: "Recently Updated",
      icon: <Sparkles className="h-3 w-3" />,
    },
    {
      key: "highValue",
      label: "High Value",
      icon: <Banknote className="h-3 w-3" />,
    },
    {
      key: "featured",
      label: "Featured",
      icon: <Star className="h-3 w-3" />,
    },
  ];

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCountry}
                onChange={(e) => onCountryChange(e.target.value)}
                className={selectClass}
              >
                <option value="">🌍 All Countries</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {fields.length > 0 && (
                <select
                  value={selectedField}
                  onChange={(e) => onFieldChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="">📚 All Fields</option>
                  {fields.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              )}

              {degrees.length > 0 && (
                <select
                  value={selectedDegree}
                  onChange={(e) => onDegreeChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="">🎓 All Degrees</option>
                  {degrees.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`flex items-center gap-1.5 rounded-lg border px-4 py-2.5 font-body text-sm transition-colors ${
                  showAdvanced
                    ? "border-gold bg-gold/10 text-gold-dark"
                    : "border-border bg-card text-muted-foreground hover:border-gold/40"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Advanced
              </button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={selectedSort}
                  onChange={(e) => onSortChange(e.target.value as SortOption)}
                  className={selectClass}
                >
                  <option value="relevant">Most Relevant</option>
                  <option value="deadline">Nearest Deadline</option>
                  <option value="updated">Recently Updated</option>
                  <option value="name">Scholarship Name A–Z</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-2 font-body text-xs text-destructive hover:bg-destructive/10"
                >
                  <X className="h-3 w-3" />
                  Clear All
                </button>
              )}

              <span className="whitespace-nowrap font-body text-sm text-muted-foreground">
                {resultCount} scholarships found
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter) => {
              const active = selectedQuickFilters.includes(filter.key);

              return (
                <button
                  key={filter.key}
                  onClick={() => toggleQuickFilter(filter.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-xs font-medium transition-colors ${
                    active
                      ? "bg-gold/15 text-gold-dark ring-1 ring-gold/30"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {filter.icon}
                  {filter.label}
                  {typeof filter.count === "number" && (
                    <span className="ml-0.5 rounded-full bg-background px-1.5 text-[10px]">
                      {filter.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {showAdvanced && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              <select
                value={selectedUniversity}
                onChange={(e) => onUniversityChange(e.target.value)}
                className={selectClass}
              >
                <option value="">🏛️ All Universities</option>
                {universities.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          )}

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedCountry && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 font-body text-xs text-accent-foreground">
                  {selectedCountry}
                  <button onClick={() => onCountryChange("")} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedField && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 font-body text-xs text-accent-foreground">
                  {selectedField}
                  <button onClick={() => onFieldChange("")} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedDegree && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 font-body text-xs text-accent-foreground">
                  {selectedDegree}
                  <button onClick={() => onDegreeChange("")} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedUniversity && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 font-body text-xs text-accent-foreground">
                  {selectedUniversity}
                  <button onClick={() => onUniversityChange("")} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedQuickFilters.map((filter) => (
                <span
                  key={filter}
                  className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-1 font-body text-xs text-gold-dark"
                >
                  {filter === "saved" && "Saved"}
                  {filter === "closingSoon" && "Closing Soon"}
                  {filter === "recentlyUpdated" && "Recently Updated"}
                  {filter === "highValue" && "High Value"}
                  {filter === "featured" && "Featured"}
                  <button
                    onClick={() => onQuickFiltersChange(selectedQuickFilters.filter((f) => f !== filter))}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              {selectedSort !== "relevant" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 font-body text-xs text-accent-foreground">
                  Sort:{" "}
                  {selectedSort === "deadline"
                    ? "Nearest Deadline"
                    : selectedSort === "updated"
                    ? "Recently Updated"
                    : "Scholarship Name A–Z"}
                  <button onClick={() => onSortChange("relevant")} className="hover:text-destructive">
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
