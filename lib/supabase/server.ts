import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";
import { SupabaseNotConfiguredError, supabaseEnv } from "@/lib/supabase/env";
import type { TypedSupabaseClient } from "@/lib/supabase/anon";

/**
 * Cookie-based client for admin pages, route handlers and server actions. Reads the admin's
 * session from cookies, so every query runs under Row Level Security as that user.
 * Request-time API: call it inside a <Suspense> boundary or a segment with `instant = false`.
 */
export async function createServerSupabase(): Promise<TypedSupabaseClient> {
  const env = supabaseEnv();
  if (!env) throw new SupabaseNotConfiguredError();
  const cookieStore = await cookies();
  return createServerClient<Database>(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only. proxy.ts refreshes
          // the session cookies on /admin requests, so this is safe to ignore.
        }
      },
    },
  });
}
