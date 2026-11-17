import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Single source of truth for the backend: the Supabase project that holds the live
// scholarship data and is written to by the daily crawler (automation/).
// Override per environment with VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://ndfxfsjbfcocdyzbtitj.supabase.co";

// Publishable (public) key: safe in the browser, protected by Row Level Security.
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_IlJ7rMqawQCCNijd2DPJjA_E7Kwj1vX";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
