"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { siteUrl } from "@/lib/site";

export interface AuthFormState {
  ok?: boolean;
  message?: string;
}

const emailSchema = z.string().trim().toLowerCase().email();
const passwordSchema = z.string().min(10, "Lösenordet måste ha minst 10 tecken.");

const NOT_CONFIGURED: AuthFormState = { message: "Inloggningen är inte konfigurerad (Supabase saknas)." };

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const email = emailSchema.safeParse(formData.get("email"));
  const password = z.string().min(1).safeParse(formData.get("password"));
  if (!email.success || !password.success) return { message: "Fyll i e-post och lösenord." };

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email: email.data, password: password.data });
  if (error) {
    return {
      message: /confirm/i.test(error.message)
        ? "Bekräfta din e-postadress via länken i mejlet först."
        : "Fel e-post eller lösenord.",
    };
  }
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return { message: "Kontot har inte behörighet till administrationen." };
  }
  redirect("/admin");
}

/** First-time account creation, only for allow-listed admin emails. Same answer either way. */
export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { message: "Ange en giltig e-postadress." };
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return { message: password.error.issues[0]?.message ?? "Ogiltigt lösenord." };

  const generic: AuthFormState = {
    ok: true,
    message: "Om adressen är godkänd för administrationen har vi skickat ett mejl med en bekräftelselänk.",
  };
  const supabase = await createServerSupabase();
  const { data: allowed } = await supabase.rpc("admin_email_allowed", { p_email: email.data });
  if (allowed !== true) return generic;

  await supabase.auth.signUp({
    email: email.data,
    password: password.data,
    options: { emailRedirectTo: siteUrl("/admin/auth/confirm") },
  });
  return generic;
}

export async function resetPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { message: "Ange en giltig e-postadress." };
  const supabase = await createServerSupabase();
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: siteUrl("/admin/auth/confirm?next=/admin/nytt-losenord"),
  });
  return { ok: true, message: "Om kontot finns har vi skickat en länk för att välja nytt lösenord." };
}

export async function updatePasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return { message: password.error.issues[0]?.message ?? "Ogiltigt lösenord." };
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { message: "Länken har gått ut. Begär en ny från inloggningssidan." };
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { message: "Kunde inte spara lösenordet. Försök igen." };
  redirect("/admin");
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}
