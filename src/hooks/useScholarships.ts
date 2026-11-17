import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

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
 * names, "skip to content", ...) are not scholarships; closed or expired ones
 * are not worth showing either.
 */
export function isListable(row: Row, today = new Date()): boolean {
  const name = String(row.scholarship_name ?? "").trim();
  if (name.length < 6 || /@|^skip to|^home$|^menu$/i.test(name)) return false;
  if (String(row.learn_more_url ?? "").toLowerCase().startsWith("mailto:")) return false;
  if (row.status === "Closed") return false;
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
      return (data ?? []).filter((r) => isListable(r)).map(normalizeScholarship);
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
  const fields = [...new Set(scholarships.map((s) => s.field_category))].sort();
  const degrees = [...new Set(scholarships.map((s) => s.degree_level))].sort();
  const universities = [...new Set(scholarships.map((s) => s.university_name))].sort();
  return { countries, fields, degrees, universities };
}
