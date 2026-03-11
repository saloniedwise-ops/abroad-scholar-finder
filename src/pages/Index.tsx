import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useScholarships } from "@/hooks/useScholarships";
import { useSavedScholarships } from "@/hooks/useSavedScholarships";
import ScholarshipCard from "@/components/ScholarshipCard";
import FilterBar, { QuickFilterType } from "@/components/FilterBar";
import { GraduationCap } from "lucide-react";

const Index = () => {
  const { data: scholarships = [], isLoading } = useScholarships();
  const { savedIds, toggleSaved, isSaved } = useSavedScholarships();

  const [selectedQuickFilters, setSelectedQuickFilters] = useState<
    QuickFilterType[]
  >([]);

  const filtered = useMemo(() => {
    let data = [...scholarships];

    if (selectedQuickFilters.includes("saved")) {
      data = data.filter((s) => savedIds.includes(s.id));
    }
    if (selectedQuickFilters.includes("featured")) {
      data = data.filter((s) => s.featured);
    }

    return data;
  }, [scholarships, selectedQuickFilters, savedIds]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-hero px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-gold" />
            <span className="font-display text-lg font-bold text-primary-foreground">
              ScholarGlobe
            </span>
          </div>
          <nav className="hidden font-body text-sm text-primary-foreground/70 md:flex md:gap-6">
            <a href="#" className="transition-colors hover:text-gold">Scholarships</a>
            <a href="#" className="transition-colors hover:text-gold">Countries</a>
            <a href="#" className="transition-colors hover:text-gold">Universities</a>
            <Link to="/monitoring" className="transition-colors hover:text-gold">Monitoring</Link>
          </nav>
        </div>
      </header>

      <FilterBar
        selectedQuickFilters={selectedQuickFilters}
        onQuickFiltersChange={setSelectedQuickFilters}
      />

      <main className="container mx-auto px-4 py-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <ScholarshipCard
                key={s.id}
                scholarship={s}
                isSaved={isSaved(s.id)}
                onToggleSaved={toggleSaved}
              />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="py-20 text-center">
            <GraduationCap className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
              No scholarships found
            </h3>
            <p className="font-body text-muted-foreground">
              Try adjusting your filters.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-muted py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="font-body text-sm text-muted-foreground">
            © 2026 ScholarGlobe. Helping Indian students find scholarships worldwide.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
