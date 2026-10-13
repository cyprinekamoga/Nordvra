/**
 * Supabase connection settings. Only the public URL and the publishable key are used:
 * customers act through SECURITY DEFINER RPCs and admins through their own session (RLS).
 * No service-role key exists anywhere in the app.
 */
export function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return supabaseEnv() !== null;
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)");
  }
}
