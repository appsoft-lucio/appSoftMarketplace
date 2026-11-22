import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readAuthConfig } from "./config";

const config = readAuthConfig(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY);
export const authConfigured = config !== null;
let client: SupabaseClient | null = null;

export function getAuthClient(): SupabaseClient {
  if (!config) throw new Error("O acesso ainda está sendo configurado. Tente novamente mais tarde.");
  client ??= createClient(config.url, config.key, {
    auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}