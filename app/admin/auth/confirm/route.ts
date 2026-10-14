import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Landing point for Supabase Auth email links (sign-up confirmation, password reset).
 * Supabase must allow this URL: Authentication → URL Configuration → Redirect URLs.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  // Only allow internal admin paths as the destination.
  const next = nextParam && /^\/admin(\/[a-z0-9-/]*)?$/.test(nextParam) ? nextParam : "/admin";

  const supabase = await createServerSupabase();
  let ok = false;
  if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  } else if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  }

  const target = ok ? next : "/admin/login";
  return NextResponse.redirect(new URL(target, request.url));
}
