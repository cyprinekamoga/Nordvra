import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { SupabaseNotConfiguredError, supabaseEnv } from "@/lib/supabase/env";

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Cookie-less client with the publishable key. Use it on the server for catalogue reads
 * (inside 'use cache') and for the public RPCs (submit_request, get_quote, accept_quote,
 * decline_quote, public_config). Throws SupabaseNotConfiguredError when env is missing.
 */
export function createAnonClient(): TypedSupabaseClient {
  const env = supabaseEnv();
  if (!env) throw new SupabaseNotConfiguredError();
  return createClient<Database>(env.url, env.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
