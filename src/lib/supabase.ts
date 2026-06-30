import { createClient } from "@supabase/supabase-js";

// Note: table names flow through as runtime strings in services/supabaseCrud.ts
// and services/dataLoader.ts (generic CRUD + hand-assembled joins), so the
// strict generated `Database` generic (src/types/database.types.ts) can't be
// wired in without fighting supabase-js's literal-key overload resolution.
// The generated types still serve as schema documentation/reference.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
