import { useState, useMemo, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useScholarships, useFilterOptions } from "@/hooks/useScholarships";
import { useSavedScholarships } from "@/hooks/useSavedScholarships";
import type { Scholarship } from "@/hooks/useScholarships";
import HeroSection from "@/components/HeroSection";
import { daysUntil, getDeadlineDate } from "@/lib/deadline";
import FilterBar, { type QuickFilterType, type SortOption } from "@/components/FilterBar";
import ScholarshipCard from "@/components/ScholarshipCard";
import ScholarshipPagination from "@/components/ScholarshipPagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GraduationCap,
  Globe,
  BookOpen,
  Building2,
  Loader2,
  Heart,
} from "lucide-react";
import { degreeTokens } from "@/lib/taxonomy";
import MatchMe from "@/components/MatchMe";
import { rankMatches, type StudentProfile } from "@/lib/matcher";

const ITEMS_PER_PAGE = 12;


const isClosingSoon = (scholarship: Scholarship) => {
  const diff = daysUntil(getDeadlineDate(scholarship));
  return diff !== null && diff >= 0 && diff <= 14;
};

const isRecentlyUpdated = (scholarship: Scholarship) => {
  if (!scholarship.last_verified_at) return false;
  const parsed = new Date(scholarship.last_verified_at);
  if (isNaN(parsed.getTime())) return false;

  const now = new Date();
  const diffDays = (now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 3;
};

const isHighValue = (scholarship: Scholarship) => {
  const amount = scholarship.amount_display?.toLowerCase() || "";
  return (
    amount.includes("full tuition") ||
    amount.includes("fully funded") ||
    amount.includes("100%") ||
    amount.includes("tuition waiver") ||
    amount.includes("living stipend")
  );
};

const sortByNearestDeadline = (items: Scholarship[]) => {
  return [...items].sort((a, b) => {
    const aDate = getDeadlineDate(a);
    const bDate = getDeadlineDate(b);

    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;

    return aDate.getTime() - bDate.getTime();
  });
};

const sortByRecentVerification = (items: Scholarship[]) => {
  return [...items].sort((a, b) => {
    const aTime = a.last_verified_at ? new Date(a.last_verified_at).getTime() : 0;
    const bTime = b.last_verified_at ? new Date(b.last_verified_at).getTime() : 0;
    return bTime - aTime;
  });
};

const sortByName = (items: Scholarship[]) => {
  return [...items].sort((a, b) => a.scholarship_name.localeCompare(b.scholarship_name));
};

// Default ordering: featured first, then the nearest real deadline, undated last.
const sortByRelevance = (items: Scholarship[]) => {
  return [...items].sort((a, b) => {
    if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
    const aDate = getDeadlineDate(a);
    const bDate = getDeadlineDate(b);
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    return aDate.getTime() - bDate.getTime();
  });
};

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedQuickFilters, setSelectedQuickFilters] = useState<QuickFilterType[]>([]);
  const [selectedSort, setSelectedSort] = useState<SortOption>("relevant");
  const [currentPage, setCurrentPage] = useState(1);
  const [matchProfile, setMatchProfile] = useState<StudentProfile | null>(null);

  const { data: scholarships = [], isLoading, error } = useScholarships();
  const { isSaved, toggleSaved, savedCount, clearSaved, savedIds } = useSavedScholarships();
  const filterOptions = useFilterOptions(scholarships);

  const savedScholarships = useMemo(
    () => scholarships.filter((s) => savedIds.includes(s.id)),
    [scholarships, savedIds]
  );

  const filtered = useMemo(() => {
    return scholarships.filter((s) => {
      const q = searchQuery.toLowerCase();

      const matchesSearch =
        !q ||
        s.scholarship_name.toLowerCase().includes(q) ||
        s.university_name.toLowerCase().includes(q) ||
        s.country_name.toLowerCase().includes(q);

      const matchesCountry = !selectedCountry || s.country_name === selectedCountry;
      // "Other" = we don't know the field yet, so don't hide the scholarship.
      const matchesField =
        !selectedField || s.field_category === "Other" || s.field_category === selectedField;
      // degree_level is free text ("Undergraduate, Postgraduate", "General" when
      // unknown). Match on canonical levels; unknown levels match any selection.
      const levels = degreeTokens(s.degree_level);
      const matchesDegree =
        !selectedDegree || levels.length === 0 || levels.includes(selectedDegree as never);
      const matchesUniversity = !selectedUniversity || s.university_name === selectedUniversity;

      const matchesQuickFilters =
        (!selectedQuickFilters.includes("saved") || savedIds.includes(s.id)) &&
        (!selectedQuickFilters.includes("closingSoon") || isClosingSoon(s)) &&
        (!selectedQuickFilters.includes("recentlyUpdated") || isRecentlyUpdated(s)) &&
        (!selectedQuickFilters.includes("highValue") || isHighValue(s)) &&
        (!selectedQuickFilters.includes("featured") || !!s.featured);

      return (
        matchesSearch &&
        matchesCountry &&
        matchesField &&
        matchesDegree &&
        matchesUniversity &&
        matchesQuickFilters
      );
    });
  }, [
    scholarships,
    savedIds,
    searchQuery,
    selectedCountry,
    selectedField,
    selectedDegree,
    selectedUniversity,
    selectedQuickFilters,
  ]);

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchProfile) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [matchProfile]);

  const matchReasonsById = useMemo(() => {
    if (!matchProfile) return null;
    const map = new Map<string, string[]>();
    rankMatches(filtered, matchProfile).forEach((r) => map.set(r.scholarship.id, r.reasons));
    return map;
  }, [filtered, matchProfile]);

  const sorted = useMemo(() => {
    if (matchProfile) {
      return rankMatches(filtered, matchProfile).map((r) => r.scholarship);
    }
    if (selectedSort === "deadline") return sortByNearestDeadline(filtered);
    if (selectedSort === "updated") return sortByRecentVerification(filtered);
    if (selectedSort === "name") return sortByName(filtered);
    return sortByRelevance(filtered);
  }, [filtered, selectedSort, matchProfile]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedCountry,
    selectedField,
    selectedDegree,
    selectedUniversity,
    selectedQuickFilters,
    selectedSort,
    matchProfile,
  ]);

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginatedItems = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const savedTotalPages = Math.ceil(savedScholarships.length / ITEMS_PER_PAGE);
  const paginatedSavedItems = savedScholarships.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const byCountry = useMemo(() => {
    const map: Record<string, Scholarship[]> = {};
    sorted.forEach((s) => {
      if (!map[s.country_name]) map[s.country_name] = [];
      map[s.country_name].push(s);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [sorted]);

  const byDegree = useMemo(() => {
    const map: Record<string, Scholarship[]> = {};
    sorted.forEach((s) => {
      const levels = degreeTokens(s.degree_level);
      (levels.length > 0 ? levels : ["Other"]).forEach((level) => {
        if (!map[level]) map[level] = [];
        map[level].push(s);
      });
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [sorted]);

  const byField = useMemo(() => {
    const map: Record<string, Scholarship[]> = {};
    sorted.forEach((s) => {
      if (!map[s.field_category]) map[s.field_category] = [];
      map[s.field_category].push(s);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [sorted]);

  const hasRealFields = filterOptions.fields.length > 0;


  const renderGrid = (items: Scholarship[]) => (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((s) => (
        <ScholarshipCard
          key={s.id}
          scholarship={s}
          isSaved={isSaved(s.id)}
          onToggleSaved={toggleSaved}
          matchReasons={matchReasonsById?.get(s.id)}
        />
      ))}
    </div>
  );

  const renderGrouped = (groups: [string, Scholarship[]][], icon: ReactNode) => (
    <div className="space-y-10">
      {groups.map(([group, items]) => (
        <div key={group}>
          <div className="mb-4 flex items-center gap-2">
            {icon}
            <h3 className="font-display text-xl font-bold text-foreground">{group}</h3>
            <span className="rounded-full bg-muted px-2.5 py-0.5 font-body text-xs text-muted-foreground">
              {items.length}
            </span>
          </div>
          {renderGrid(items)}
        </div>
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
          </nav>
        </div>
      </header>

      <HeroSection searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <FilterBar
        selectedCountry={selectedCountry}
        selectedField={selectedField}
        selectedDegree={selectedDegree}
        selectedUniversity={selectedUniversity}
        selectedQuickFilters={selectedQuickFilters}
        selectedSort={selectedSort}
        savedCount={savedCount}
        onCountryChange={setSelectedCountry}
        onFieldChange={setSelectedField}
        onDegreeChange={setSelectedDegree}
        onUniversityChange={setSelectedUniversity}
        onQuickFiltersChange={setSelectedQuickFilters}
        onSortChange={setSelectedSort}
        resultCount={sorted.length}
        countries={filterOptions.countries}
        fields={filterOptions.fields}
        degrees={filterOptions.degrees}
        universities={filterOptions.universities}
      />

      <main className="container mx-auto px-4 py-10">
        <MatchMe
          countries={filterOptions.countries}
          fields={filterOptions.fields}
          onMatch={setMatchProfile}
          active={!!matchProfile}
        />
        {matchProfile && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="font-body text-sm text-muted-foreground">
              Showing your best matches first
            </span>
            {[
              ...matchProfile.degrees,
              ...matchProfile.fields,
              ...matchProfile.countries,
              ...(matchProfile.fullyFunded ? ["Fully funded"] : []),
            ].map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-gold/15 px-2.5 py-0.5 font-body text-xs font-medium text-gold-dark"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <p className="font-body text-destructive">Failed to load scholarships. Please try again.</p>
          </div>
        ) : (
          <>
            <div ref={resultsRef} className="scroll-mt-32" />
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-6 w-full justify-start">
                <TabsTrigger value="all" className="gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  All
                </TabsTrigger>
                <TabsTrigger value="saved" className="gap-1.5">
                  <Heart className="h-4 w-4" />
                  Saved
                  {savedCount > 0 && (
                    <span className="ml-1 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                      {savedCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="country" className="gap-1.5">
                  <Globe className="h-4 w-4" />
                  By Country
                </TabsTrigger>
                <TabsTrigger value="degree" className="gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  By Degree
                </TabsTrigger>
                {hasRealFields && (
                  <TabsTrigger value="field" className="gap-1.5">
                    <Building2 className="h-4 w-4" />
                    By Field
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="all">
                <div>
                  {renderGrid(paginatedItems)}
                  <ScholarshipPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
              </TabsContent>

              <TabsContent value="saved">
                {savedScholarships.length > 0 ? (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-display text-xl font-bold text-foreground">
                        Your Saved Scholarships
                      </h3>

                      <button
                        onClick={clearSaved}
                        className="font-body text-xs text-muted-foreground hover:text-destructive"
                      >
                        Clear Saved
                      </button>
                    </div>

                    {renderGrid(paginatedSavedItems)}

                    {savedTotalPages > 1 && (
                      <ScholarshipPagination currentPage={currentPage} totalPages={savedTotalPages} onPageChange={setCurrentPage} />
                    )}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                      No saved scholarships yet
                    </h3>
                    <p className="font-body text-muted-foreground">
                      Click the heart icon on any scholarship card to save it here.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="country">
                {renderGrouped(byCountry, <Globe className="h-5 w-5 text-gold" />)}
              </TabsContent>

              <TabsContent value="degree">
                {renderGrouped(byDegree, <BookOpen className="h-5 w-5 text-gold" />)}
              </TabsContent>

              {hasRealFields && (
                <TabsContent value="field">
                  {renderGrouped(byField, <Building2 className="h-5 w-5 text-gold" />)}
                </TabsContent>
              )}
            </Tabs>
          </>
        )}

        {!isLoading && !error && sorted.length === 0 && (
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
