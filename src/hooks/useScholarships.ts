import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

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
  description: string | null;
  summary: string | null;
  status: string | null;
  learn_more_url: string | null;
  featured: boolean | null;
  last_verified_at: string | null;
  is_active: boolean;
  public_visible: boolean;
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
      return (data ?? []).map((s: any) => ({
        id: s.id,
        scholarship_name: s.scholarship_name ?? "",
        scholarship_slug: s.scholarship_slug ?? null,
        university_name: s.university_name ?? "",
        country_name: s.country_name ?? "",
        country_flag: s.country_flag ?? "🌍",
        degree_level: s.degree_level ?? "",
        field_category: s.field_category ?? "",
        amount_display: s.amount_display ?? null,
        intake: s.intake ?? null,
        deadline_display: s.deadline_display ?? null,
        description: s.description ?? null,
        summary: s.summary ?? null,
        status: s.status ?? null,
        learn_more_url: s.learn_more_url ?? null,
        featured: s.featured ?? false,
        last_verified_at: s.last_verified_at ?? null,
        is_active: s.is_active ?? true,
        public_visible: s.public_visible ?? true,
      })) as Scholarship[];
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
      const s: any = data;
      return {
        id: s.id,
        scholarship_name: s.scholarship_name ?? "",
        scholarship_slug: s.scholarship_slug ?? null,
        university_name: s.university_name ?? "",
        country_name: s.country_name ?? "",
        country_flag: s.country_flag ?? "🌍",
        degree_level: s.degree_level ?? "",
        field_category: s.field_category ?? "",
        amount_display: s.amount_display ?? null,
        intake: s.intake ?? null,
        deadline_display: s.deadline_display ?? null,
        description: s.description ?? null,
        summary: s.summary ?? null,
        status: s.status ?? null,
        learn_more_url: s.learn_more_url ?? null,
        featured: s.featured ?? false,
        last_verified_at: s.last_verified_at ?? null,
      } as Scholarship;
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
