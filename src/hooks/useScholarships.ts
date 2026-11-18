import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { CANONICAL_DEGREES, dedupeScholarships, degreeTokens } from "@/lib/taxonomy";

export interface Scholarship {
  id: string;
  scholarship_name: string;
  scholarship_slug: string | null;
  university_name: string;
  country_name: string;
  country_flag: string;
  degree_level: string;
  field_category: string;
  amount_display: string | null;
  intake: string | null;
  deadline_display: string | null;
  deadline_date?: string | null;
  description: string | null;
  summary: string | null;
  status: string | null;
  learn_more_url: string | null;
  featured: boolean | null;
  last_verified_at: string | null;
  // Rich details filled by the crawler (all optional)
  deadline_type: string | null; // fixed | rolling | automatic | varies | closed | not_published
  deadline_inferred: boolean;
  opens_date: string | null;
  eligibility: string | null;
  requirements: string | null;
  how_to_apply: string | null;
  application_url: string | null;
  award_type: string | null;
  number_of_awards: string | null;
  nationality: string | null;
  amount_value: number | null;
  amount_currency: string | null;
  source_url: string | null;
}

// A raw database row: the live table has more (and different) columns than the generated types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const FLAGS: Record<string, string> = {
  "united kingdom": "🇬🇧", uk: "🇬🇧", "united states": "🇺🇸", usa: "🇺🇸", us: "🇺🇸",
  canada: "🇨🇦", australia: "🇦🇺", aus: "🇦🇺", ireland: "🇮🇪", germany: "🇩🇪",
  france: "🇫🇷", italy: "🇮🇹", austria: "🇦🇹", netherlands: "🇳🇱", spain: "🇪🇸",
  "new zealand": "🇳🇿", singapore: "🇸🇬", switzerland: "🇨🇭", sweden: "🇸🇪",
  denmark: "🇩🇰", finland: "🇫🇮", norway: "🇳🇴", japan: "🇯🇵", "south korea": "🇰🇷",
  china: "🇨🇳", "hong kong": "🇭🇰", uae: "🇦🇪", "united arab emirates": "🇦🇪",
};

function flagFor(row: Row): string {
  if (row.country_flag) return row.country_flag;
  const key = String(row.country_name ?? row.country_code ?? "").toLowerCase();
  return FLAGS[key] ?? FLAGS[String(row.country_code ?? "").toLowerCase()] ?? "🌍";
}

/**
 * Rows the old extractor produced from page noise (e-mail addresses, contact
 * names, "skip to content", ...) are not scholarships; closed, expired or
 * long-unverified ones are not worth showing either.
 */
// A scholarship is only shown while the daily crawler has confirmed its source page recently.
// Dead/blocked pages, search-engine "sources" and never-verified rows therefore drop off
// automatically, and come back by themselves once the source can be checked again.
export const MAX_UNVERIFIED_DAYS = 45;

export function isListable(row: Row, today = new Date()): boolean {
  const name = String(row.scholarship_name ?? "").trim();
  if (name.length < 6 || /@|^skip to|^home$|^menu$/i.test(name)) return false;
  if (String(row.learn_more_url ?? "").toLowerCase().startsWith("mailto:")) return false;
  if (row.status === "Closed") return false;
  if (!row.last_verified_at) return false;
  const ageDays = (today.getTime() - new Date(row.last_verified_at).getTime()) / 86_400_000;
  if (!(ageDays <= MAX_UNVERIFIED_DAYS)) return false;
  if (row.deadline_date && new Date(row.deadline_date) < new Date(today.toDateString())) return false;
  return true;
}

function normalizeScholarship(row: Row): Scholarship {
  return {
    id: row.id,
    scholarship_name: row.scholarship_name ?? "Untitled Scholarship",
    scholarship_slug: row.scholarship_slug ?? null,
    university_name: row.university_name ?? "Unknown University",
    country_name: row.country_name ?? "Unknown Country",
    country_flag: flagFor(row),
    degree_level: row.degree_level ?? "General",
    field_category: row.field_category ?? "Other",
    amount_display: row.amount_display ?? null,
    intake: row.intake ?? null,
    deadline_display: row.deadline_display ?? null,
    deadline_date: row.deadline_date ?? null,
    description: row.description ?? null,
    summary: row.summary ?? null,
    status: row.status ?? "Active",
    learn_more_url: row.learn_more_url ?? null,
    featured: row.featured ?? false,
    last_verified_at: row.last_verified_at ?? null,
    deadline_type: row.deadline_type ?? null,
    deadline_inferred: row.deadline_inferred ?? false,
    opens_date: row.opens_date ?? null,
    eligibility: row.eligibility ?? null,
    requirements: row.requirements ?? null,
    how_to_apply: row.how_to_apply ?? null,
    application_url: row.application_url ?? null,
    award_type: row.award_type ?? null,
    number_of_awards: row.number_of_awards ?? null,
    nationality: row.nationality ?? null,
    amount_value: row.amount_value ?? null,
    amount_currency: row.amount_currency ?? null,
    source_url: row.source_url ?? null,
  };
}

export function useScholarships() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("scholarships-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scholarships" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["scholarships"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["scholarships"],
    queryFn: async (): Promise<Scholarship[]> => {
      const { data, error } = await supabase
        .from("scholarships")
        .select("*")
        .eq("public_visible", true)
        .eq("is_active", true)
        .order("last_verified_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false, nullsFirst: false })
        .order("featured", { ascending: false });

      if (error) throw error;
      return dedupeScholarships((data ?? []).filter((r) => isListable(r)).map(normalizeScholarship));
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

export function useScholarshipBySlug(slug: string) {
  return useQuery({
    queryKey: ["scholarship", slug],
    queryFn: async (): Promise<Scholarship | null> => {
      const { data, error } = await supabase
        .from("scholarships")
        .select("*")
        .eq("scholarship_slug", slug)
        .eq("public_visible", true)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return normalizeScholarship(data);
    },
    enabled: !!slug,
  });
}

export function useFilterOptions(scholarships: Scholarship[]) {
  const countries = [...new Set(scholarships.map((s) => s.country_name))].sort();
  // Only offer fields the data actually knows about; nearly all rows are
  // still uncategorised ("Other"), and a one-option filter is just confusing.
  const fields = [...new Set(scholarships.map((s) => s.field_category))]
    .filter((f) => f && f !== "Other")
    .sort();
  // degree_level is free text ("Undergraduate, Postgraduate", ...); expose
  // the canonical levels a visitor actually thinks in.
  const degreeSet = new Set<string>();
  scholarships.forEach((s) => degreeTokens(s.degree_level).forEach((d) => degreeSet.add(d)));
  const degrees = CANONICAL_DEGREES.filter((d) => degreeSet.has(d)) as string[];
  const universities = [...new Set(scholarships.map((s) => s.university_name))].sort();
  return { countries, fields, degrees, universities };
}
