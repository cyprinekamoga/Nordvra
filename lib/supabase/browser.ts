"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import type { TypedSupabaseClient } from "@/lib/supabase/anon";

/** Browser client for admin UI that needs client-side auth calls. Customers never use it. */
export function createBrowserSupabase(): TypedSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");
  return createBrowserClient<Database>(url, key);
}
