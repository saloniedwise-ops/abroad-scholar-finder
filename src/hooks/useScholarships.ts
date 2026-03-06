import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Scholarship {
  id: string;
  scholarship_name: string;
  university_name: string;
  country_name: string;
  country_flag: string;
  degree_level: string;
  field_category: string;
  amount_display: string | null;
  intake: string | null;
  deadline_display: string | null;
  description: string | null;
  status: string | null;
  learn_more_url: string | null;
  featured: boolean | null;
}

export function useScholarships() {
  return useQuery({
    queryKey: ["scholarships"],
    queryFn: async (): Promise<Scholarship[]> => {
      const { data, error } = await supabase
        .from("scholarships")
        .select("id, scholarship_name, university_name, country_name, country_flag, degree_level, field_category, amount_display, intake, deadline_display, description, status, learn_more_url, featured")
        .eq("public_visible", true)
        .eq("is_active", true)
        .order("featured", { ascending: false })
        .order("scholarship_name");

      if (error) throw error;
      return data as Scholarship[];
    },
  });
}

export function useFilterOptions(scholarships: Scholarship[]) {
  const countries = [...new Set(scholarships.map((s) => s.country_name))].sort();
  const fields = [...new Set(scholarships.map((s) => s.field_category))].sort();
  const degrees = [...new Set(scholarships.map((s) => s.degree_level))].sort();
  const universities = [...new Set(scholarships.map((s) => s.university_name))].sort();
  return { countries, fields, degrees, universities };
}
