import { countries, fields, degrees } from "@/data/scholarships";

interface FilterBarProps {
  selectedCountry: string;
  selectedField: string;
  selectedDegree: string;
  onCountryChange: (country: string) => void;
  onFieldChange: (field: string) => void;
  onDegreeChange: (degree: string) => void;
  resultCount: number;
}

const FilterBar = ({
  selectedCountry,
  selectedField,
  selectedDegree,
  onCountryChange,
  onFieldChange,
  onDegreeChange,
  resultCount,
}: FilterBarProps) => {
  const selectClass =
    "rounded-lg border border-border bg-card px-4 py-2.5 font-body text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-gold cursor-pointer";

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedCountry}
            onChange={(e) => onCountryChange(e.target.value)}
            className={selectClass}
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedField}
            onChange={(e) => onFieldChange(e.target.value)}
            className={selectClass}
          >
            <option value="">All Fields</option>
            {fields.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          <select
            value={selectedDegree}
            onChange={(e) => onDegreeChange(e.target.value)}
            className={selectClass}
          >
            <option value="">All Degrees</option>
            {degrees.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <p className="font-body text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{resultCount}</span> scholarships found
        </p>
      </div>
    </div>
  );
};

export default FilterBar;
