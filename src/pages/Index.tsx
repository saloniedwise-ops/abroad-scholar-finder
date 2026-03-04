import { useState, useMemo } from "react";
import { scholarships } from "@/data/scholarships";
import type { Scholarship } from "@/data/scholarships";
import HeroSection from "@/components/HeroSection";
import FilterBar from "@/components/FilterBar";
import ScholarshipCard from "@/components/ScholarshipCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Globe, BookOpen, Building2 } from "lucide-react";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");

  const filtered = useMemo(() => {
    return scholarships.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.university.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.field.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q);

      const matchesCountry = !selectedCountry || s.country === selectedCountry;
      const matchesField = !selectedField || s.field === selectedField;
      const matchesDegree = !selectedDegree || s.degree.includes(selectedDegree);
      const matchesUniversity = !selectedUniversity || s.university === selectedUniversity;

      return matchesSearch && matchesCountry && matchesField && matchesDegree && matchesUniversity;
    });
  }, [searchQuery, selectedCountry, selectedField, selectedDegree, selectedUniversity]);

  // Group by country
  const byCountry = useMemo(() => {
    const map: Record<string, Scholarship[]> = {};
    filtered.forEach((s) => {
      if (!map[s.country]) map[s.country] = [];
      map[s.country].push(s);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  // Group by degree
  const byDegree = useMemo(() => {
    const map: Record<string, Scholarship[]> = {};
    filtered.forEach((s) => {
      if (!map[s.degree]) map[s.degree] = [];
      map[s.degree].push(s);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  // Group by field
  const byField = useMemo(() => {
    const map: Record<string, Scholarship[]> = {};
    filtered.forEach((s) => {
      if (!map[s.field]) map[s.field] = [];
      map[s.field].push(s);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const featured = filtered.filter((s) => s.featured);

  const renderGrid = (items: Scholarship[]) => (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((s) => (
        <ScholarshipCard key={s.id} scholarship={s} />
      ))}
    </div>
  );

  const renderGrouped = (groups: [string, Scholarship[]][], icon: React.ReactNode) => (
    <div className="space-y-10">
      {groups.map(([group, items]) => (
        <section key={group}>
          <div className="mb-4 flex items-center gap-2">
            {icon}
            <h3 className="font-display text-xl font-bold text-foreground">
              {group}
            </h3>
            <span className="rounded-full bg-muted px-2.5 py-0.5 font-body text-xs font-medium text-muted-foreground">
              {items.length}
            </span>
          </div>
          {renderGrid(items)}
        </section>
      ))}
    </div>
  );

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
        selectedUniversity={selectedUniversity}
        onCountryChange={setSelectedCountry}
        onFieldChange={setSelectedField}
        onDegreeChange={setSelectedDegree}
        onUniversityChange={setSelectedUniversity}
        resultCount={filtered.length}
      />

      {/* Scholarship Content */}
      <main className="container mx-auto px-4 py-10">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-8 flex w-full flex-wrap gap-1 bg-muted/50 p-1">
            <TabsTrigger value="all" className="flex items-center gap-1.5 font-body">
              <GraduationCap className="h-3.5 w-3.5" />
              All
            </TabsTrigger>
            <TabsTrigger value="country" className="flex items-center gap-1.5 font-body">
              <Globe className="h-3.5 w-3.5" />
              By Country
            </TabsTrigger>
            <TabsTrigger value="degree" className="flex items-center gap-1.5 font-body">
              <BookOpen className="h-3.5 w-3.5" />
              By Degree
            </TabsTrigger>
            <TabsTrigger value="field" className="flex items-center gap-1.5 font-body">
              <Building2 className="h-3.5 w-3.5" />
              By Field
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {featured.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-6 font-display text-2xl font-bold text-foreground">
                  ⭐ Featured Scholarships
                </h2>
                {renderGrid(featured)}
              </section>
            )}

            <section>
              <h2 className="mb-6 font-display text-2xl font-bold text-foreground">
                All Scholarships
              </h2>
              {renderGrid(filtered)}
            </section>
          </TabsContent>

          <TabsContent value="country">
            {renderGrouped(byCountry, <Globe className="h-5 w-5 text-gold" />)}
          </TabsContent>

          <TabsContent value="degree">
            {renderGrouped(byDegree, <BookOpen className="h-5 w-5 text-gold" />)}
          </TabsContent>

          <TabsContent value="field">
            {renderGrouped(byField, <Building2 className="h-5 w-5 text-gold" />)}
          </TabsContent>
        </Tabs>

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
