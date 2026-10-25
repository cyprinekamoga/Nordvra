// Nordvra – admin accounts (Supabase Edge Function "admin-users").
//
// The only way to create an admin login: a signed-in admin creates the account (email +
// password) in /admin/installningar and hands the details over personally. Public sign-up is
// switched off. The service-role key exists only here, inside Supabase, never in the website.
//
// POST { action: "create", email, password }  → creates a confirmed user + admin_users row
// POST { action: "delete", email }            → removes the admin_users row and the login
// Caller must send their own session token and be an admin (public.is_admin()).

import { createClient } from "npm:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MIN_PASSWORD = 12;

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply(405, { error: "method_not_allowed" });
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return reply(401, { error: "not_signed_in" });

  // Who is calling, and are they an admin? Checked with the caller's own token.
  const asCaller = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: caller } = await asCaller.auth.getUser(token);
  const { data: isAdmin } = await asCaller.rpc("is_admin");
  if (!caller?.user?.email || isAdmin !== true) return reply(403, { error: "not_admin" });
  const callerEmail = caller.user.email.toLowerCase();

  let body: { action?: unknown; email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "invalid_body" });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) return reply(400, { error: "invalid_email" });

  const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  if (body.action === "create") {
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < MIN_PASSWORD || password.length > 72) return reply(400, { error: "weak_password" });
    const { error: createError } = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (createError) {
      const exists = /already|registered|exists/i.test(createError.message);
      return reply(exists ? 409 : 500, { error: exists ? "user_exists" : "create_failed" });
    }
    const { error: rowError } = await service.from("admin_users").upsert({ email, added_by: callerEmail });
    if (rowError) return reply(500, { error: "create_failed" });
    return reply(200, { ok: true });
  }

  if (body.action === "delete") {
    if (email === callerEmail) return reply(400, { error: "cannot_remove_self" });
    const { count } = await service.from("admin_users").select("email", { count: "exact", head: true });
    if ((count ?? 0) <= 1) return reply(400, { error: "last_admin" });
    await service.from("admin_users").delete().eq("email", email);
    // Remove the login too, so the password stops working everywhere.
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 });
      if (error || !data) break;
      const user = data.users.find((u) => u.email?.toLowerCase() === email);
      if (user) {
        await service.auth.admin.deleteUser(user.id);
        break;
      }
      if (data.users.length < 200) break;
    }
    return reply(200, { ok: true });
  }

  return reply(400, { error: "unknown_action" });
});
