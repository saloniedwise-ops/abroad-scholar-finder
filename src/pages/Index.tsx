import { useState, useMemo } from "react";
import { scholarships } from "@/data/scholarships";
import HeroSection from "@/components/HeroSection";
import FilterBar from "@/components/FilterBar";
import ScholarshipCard from "@/components/ScholarshipCard";
import { GraduationCap } from "lucide-react";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");

  const filtered = useMemo(() => {
    return scholarships.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.university.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.field.toLowerCase().includes(q);

      const matchesCountry = !selectedCountry || s.country === selectedCountry;
      const matchesField = !selectedField || s.field === selectedField;
      const matchesDegree = !selectedDegree || s.degree.includes(selectedDegree);

      return matchesSearch && matchesCountry && matchesField && matchesDegree;
    });
  }, [searchQuery, selectedCountry, selectedField, selectedDegree]);

  const featured = filtered.filter((s) => s.featured);
  const regular = filtered.filter((s) => !s.featured);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <a href="#" className="transition-colors hover:text-gold">Resources</a>
          </nav>
        </div>
      </header>

      <HeroSection searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <FilterBar
        selectedCountry={selectedCountry}
        selectedField={selectedField}
        selectedDegree={selectedDegree}
        onCountryChange={setSelectedCountry}
        onFieldChange={setSelectedField}
        onDegreeChange={setSelectedDegree}
        resultCount={filtered.length}
      />

      {/* Scholarship Grid */}
      <main className="container mx-auto px-4 py-10">
        {featured.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-6 font-display text-2xl font-bold text-foreground">
              Featured Scholarships
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((s) => (
                <ScholarshipCard key={s.id} scholarship={s} />
              ))}
            </div>
          </section>
        )}

        {regular.length > 0 && (
          <section>
            <h2 className="mb-6 font-display text-2xl font-bold text-foreground">
              All Scholarships
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {regular.map((s) => (
                <ScholarshipCard key={s.id} scholarship={s} />
              ))}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <GraduationCap className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
              No scholarships found
            </h3>
            <p className="font-body text-muted-foreground">
              Try adjusting your filters or search query.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
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
