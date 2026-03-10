import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useScholarships, useFilterOptions } from "@/hooks/useScholarships";
import type { Scholarship } from "@/hooks/useScholarships";
import HeroSection from "@/components/HeroSection";
import FilterBar from "@/components/FilterBar";
import ScholarshipCard from "@/components/ScholarshipCard";
import ScholarshipPagination from "@/components/ScholarshipPagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Globe, BookOpen, Building2, Loader2 } from "lucide-react";

const ITEMS_PER_PAGE = 12;

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const queryClient = useQueryClient();
  const { data: scholarships = [], isLoading, error } = useScholarships();
  const filterOptions = useFilterOptions(scholarships);

  const filtered = useMemo(() => {
    return scholarships.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        s.scholarship_name.toLowerCase().includes(q) ||
        s.university_name.toLowerCase().includes(q);

      const matchesCountry = !selectedCountry || s.country_name === selectedCountry;
      const matchesField = !selectedField || s.field_category === selectedField;
      const matchesDegree = !selectedDegree || s.degree_level.includes(selectedDegree);
      const matchesUniversity = !selectedUniversity || s.university_name === selectedUniversity;

      return matchesSearch && matchesCountry && matchesField && matchesDegree && matchesUniversity;
    });
  }, [scholarships, searchQuery, selectedCountry, selectedField, selectedDegree, selectedUniversity]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCountry, selectedField, selectedDegree, selectedUniversity]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const byCountry = useMemo(() => {
    const map: Record<string, Scholarship[]> = {};
    filtered.forEach((s) => {
      if (!map[s.country_name]) map[s.country_name] = [];
      map[s.country_name].push(s);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const byDegree = useMemo(() => {
    const map: Record<string, Scholarship[]> = {};
    filtered.forEach((s) => {
      if (!map[s.degree_level]) map[s.degree_level] = [];
      map[s.degree_level].push(s);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const byField = useMemo(() => {
    const map: Record<string, Scholarship[]> = {};
    filtered.forEach((s) => {
      if (!map[s.field_category]) map[s.field_category] = [];
      map[s.field_category].push(s);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const featured = paginatedItems.filter((s) => s.featured);

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
            <Link to="/monitoring" className="transition-colors hover:text-gold">Monitoring</Link>
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
        countries={filterOptions.countries}
        fields={filterOptions.fields}
        degrees={filterOptions.degrees}
        universities={filterOptions.universities}
      />

      <main className="container mx-auto px-4 py-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <p className="font-body text-destructive">Failed to load scholarships. Please try again.</p>
          </div>
        ) : (
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
                {renderGrid(paginatedItems)}
                <ScholarshipPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
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
        )}

        {!isLoading && !error && filtered.length === 0 && (
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
