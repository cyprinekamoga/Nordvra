import "server-only";
import { cache } from "react";
import { redirect, unstable_rethrow } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";

export type AdminUser = { id: string; email: string };

/** Where non-admins are sent. */
export const ADMIN_LOGIN_PATH = "/admin/login";

/**
 * Deduplicated per request (React `cache`), so a layout, a page and its server actions can all
 * call `getAdmin()` without extra round trips. Reads cookies: call it inside <Suspense> or a
 * segment with `export const instant = false`.
 */
const loadAdmin = cache(async (): Promise<AdminUser | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createServerSupabase();
    // getUser() validates the session with Supabase Auth (getSession() only trusts the cookie).
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;
    if (error || !user?.email) return null;

    const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");
    if (rpcError || isAdmin !== true) return null;

    return { id: user.id, email: user.email };
  } catch (error) {
    // Let Next.js internal errors (prerender bail-outs, redirects) through.
    unstable_rethrow(error);
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[auth] Admin check failed: ${message}`);
    return null;
  }
});

/** The signed-in admin, or null (not signed in, not on the admin list, or email unconfirmed). */
export async function getAdmin(): Promise<AdminUser | null> {
  return loadAdmin();
}

/**
 * Use first in every admin page, layout, route handler and server action.
 * Redirects to /admin/login when the visitor isn't an admin.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await loadAdmin();
  if (!admin) redirect(ADMIN_LOGIN_PATH);
  return admin;
}
