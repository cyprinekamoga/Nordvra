import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Keeps the admin's Supabase session fresh on /admin requests.
 *
 * Server Components can't write cookies, so expired access tokens are refreshed here and the new
 * cookies are written both to the forwarded request (so the page sees them) and to the response
 * (so the browser stores them). This never blocks or redirects: access control is done by
 * `requireAdmin()` in the admin layout, pages and server actions.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const env = supabaseEnv();
  if (!env) return response;

  try {
    const supabase = createServerClient<Database>(env.url, env.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          // Responses that set auth cookies must never be cached by a CDN.
          for (const [key, value] of Object.entries(headers ?? {})) {
            response.headers.set(key, value);
          }
        },
      },
    });
    // Validates the token and refreshes it when it has expired (writes cookies via setAll).
    await supabase.auth.getClaims();
  } catch {
    // Never block a request because Supabase is unreachable; requireAdmin() decides access.
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
