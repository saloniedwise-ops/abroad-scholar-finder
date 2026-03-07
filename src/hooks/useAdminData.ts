import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ScholarshipChange {
  id: string;
  university_name: string;
  scholarship_name: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  detected_at: string;
}

export interface ScholarshipSource {
  id: string;
  source_name: string;
  source_url: string | null;
  university_name: string | null;
  last_checked_at: string | null;
  last_status: string | null;
}

export function useScholarshipChanges() {
  return useQuery({
    queryKey: ["scholarship-changes"],
    queryFn: async (): Promise<ScholarshipChange[]> => {
      const { data, error } = await supabase
        .from("scholarship_changes")
        .select("*")
        .order("detected_at", { ascending: false });

      if (error) throw error;
      return data as ScholarshipChange[];
    },
  });
}

export function useScholarshipSources() {
  return useQuery({
    queryKey: ["scholarship-sources"],
    queryFn: async (): Promise<ScholarshipSource[]> => {
      const { data, error } = await supabase
        .from("scholarship_sources")
        .select("*")
        .order("last_checked_at", { ascending: false });

      if (error) throw error;
      return data as ScholarshipSource[];
    },
  });
}
