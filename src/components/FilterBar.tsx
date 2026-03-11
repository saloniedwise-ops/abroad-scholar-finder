import { Clock3, Sparkles, Banknote, Star, Heart } from "lucide-react";

export type QuickFilterType =
  | "closingSoon"
  | "recentlyUpdated"
  | "highValue"
  | "featured"
  | "saved";

interface Props {
  selectedQuickFilters: QuickFilterType[];
  onQuickFiltersChange: (filters: QuickFilterType[]) => void;
}

const FilterBar = ({ selectedQuickFilters = [], onQuickFiltersChange }: Props) => {
  const toggle = (key: QuickFilterType) => {
    if (selectedQuickFilters.includes(key)) {
      onQuickFiltersChange(selectedQuickFilters.filter((f) => f !== key));
    } else {
      onQuickFiltersChange([...selectedQuickFilters, key]);
    }
  };

  const chips: { key: QuickFilterType; label: string; icon: React.ReactNode }[] = [
    { key: "saved", label: "Saved", icon: <Heart className="h-3 w-3" /> },
    { key: "closingSoon", label: "Closing Soon", icon: <Clock3 className="h-3 w-3" /> },
    { key: "recentlyUpdated", label: "Recently Updated", icon: <Sparkles className="h-3 w-3" /> },
    { key: "highValue", label: "High Value", icon: <Banknote className="h-3 w-3" /> },
    { key: "featured", label: "Featured", icon: <Star className="h-3 w-3" /> },
  ];

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3 flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => toggle(c.key)}
            className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 transition-colors ${
              selectedQuickFilters.includes(c.key)
                ? "bg-gold/20 text-gold-dark font-semibold"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {c.icon}
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterBar;
