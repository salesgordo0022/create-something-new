import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function createSupabaseClient() {
  if (!isConfigured) {
    console.warn("Supabase não configurado. Use VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env");
  }
  return createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder");
}

export const supabase = createSupabaseClient();
export { isConfigured };
