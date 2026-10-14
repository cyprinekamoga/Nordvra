"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { CATALOG_TAG } from "@/lib/catalog/load";
import { parseKrToOre } from "@/lib/format";
import { parseOrgNr } from "@/lib/validation/identity";
import { parsePostcodePrefixes } from "@/lib/admin/partners";
import { Constants } from "@/lib/supabase/database.types";

const uuid = z.string().uuid();
const slug = z.string().regex(/^[a-z0-9-]+$/);

function str(fd: FormData, key: string, max = 500): string | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim().slice(0, max) : "";
  return s === "" ? null : s;
}
function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === "on" || fd.get(key) === "true";
}
function num(fd: FormData, key: string): number | null {
  const s = str(fd, key);
  if (s === null) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function date(fd: FormData, key: string): string | null {
  const s = str(fd, key);
  return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

// ── Partners ────────────────────────────────────────────────────────────

export async function savePartnerAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const idRaw = str(formData, "id");
  const id = idRaw && uuid.safeParse(idRaw).success ? idRaw : null;
  const back = id ? `/admin/partners/${id}` : "/admin/partners/ny";

  const name = str(formData, "name", 200);
  const orgRaw = str(formData, "org_nr", 20) ?? "";
  const org = orgRaw.toUpperCase() === "TODO" ? { ok: true as const, normalized: "TODO" } : parseOrgNr(orgRaw);
  const fSkatt = bool(formData, "f_skatt_verified");
  const fSkattDate = date(formData, "f_skatt_checked_at");
  const rating = num(formData, "rating");
  const commission = num(formData, "commission_pct");
  if (!name || !org.ok || (fSkatt && !fSkattDate) || (rating !== null && (rating < 1 || rating > 5))) {
    redirect(`${back}?fel=ogiltig`);
  }

  const row = {
    name,
    org_nr: org.normalized,
    contact_name: str(formData, "contact_name", 200),
    phone: str(formData, "phone", 50),
    email: str(formData, "email", 200),
    f_skatt_verified: fSkatt,
    f_skatt_checked_at: fSkattDate,
    employer_registered: bool(formData, "employer_registered"),
    insurance_company: str(formData, "insurance_company", 200),
    insurance_valid_to: date(formData, "insurance_valid_to"),
    service_ids: formData.getAll("service_ids").map(String).filter((s) => slug.safeParse(s).success),
    regions: formData.getAll("regions").map(String).slice(0, 25),
    postcode_prefixes: parsePostcodePrefixes(str(formData, "postcode_prefixes", 1000) ?? ""),
    rating,
    internal_price_notes: str(formData, "internal_price_notes", 2000),
    subcontractor_agreement_signed: bool(formData, "subcontractor_agreement_signed"),
    commission_pct: commission !== null && commission >= 0 && commission <= 100 ? commission : 12,
    active: bool(formData, "active"),
    notes: str(formData, "notes", 2000),
  };

  const supabase = await createServerSupabase();
  if (id) {
    const { error } = await supabase.from("partners").update(row).eq("id", id);
    redirect(`/admin/partners/${id}?${error ? "fel=fel" : "ok=sparad"}`);
  }
  const { data, error } = await supabase.from("partners").insert(row).select("id").single();
  if (error || !data) redirect("/admin/partners/ny?fel=fel");
  redirect(`/admin/partners/${data.id}?ok=skapad`);
}

// ── Services and prices ────────────────────────────────────────────────

export async function saveServiceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = slug.parse(formData.get("id"));
  const model = str(formData, "model");
  const rotKind = str(formData, "rot_kind");
  const supabase = await createServerSupabase();
  const { data: current } = await supabase.from("services").select("deduction_type").eq("id", id).single();
  if (!current) redirect("/admin/tjanster?fel=fel");
  const { error } = await supabase
    .from("services")
    .update({
      name: str(formData, "name", 200) ?? undefined,
      description: str(formData, "description", 1000) ?? "",
      active: bool(formData, "active"),
      model: model === "agent" ? "agent" : "seller",
      rot_kind: current.deduction_type === "rot" ? (rotKind === "rebuild" ? "rebuild" : "repair") : null,
      warning_ids: (str(formData, "warning_ids", 2000) ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => /^[a-z0-9-]+$/.test(s)),
    })
    .eq("id", id);
  updateTag(CATALOG_TAG);
  redirect(`/admin/tjanster/${id}?${error ? "fel=fel" : "ok=sparad"}`);
}

export async function toggleServiceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = slug.parse(formData.get("id"));
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("services").update({ active: formData.get("active") === "true" }).eq("id", id);
  updateTag(CATALOG_TAG);
  redirect(`/admin/tjanster?${error ? "fel=fel" : "ok=sparad"}`);
}

const SIZE_BANDS = Constants.public.Enums.size_band;

/** Saves (insert or update) one price range row. Amounts are entered in kronor BEFORE deduction. */
export async function saveRangeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const serviceId = slug.parse(formData.get("service_id"));
  const rangeId = num(formData, "range_id");
  const band = str(formData, "size_band");
  const ore = (k: string) => parseKrToOre(str(formData, k)) ?? 0;
  const row = {
    service_id: serviceId,
    size_band: band && (SIZE_BANDS as readonly string[]).includes(band) ? (band as (typeof SIZE_BANDS)[number]) : null,
    labour_min_ore: ore("labour_min"),
    labour_max_ore: ore("labour_max"),
    material_min_ore: ore("material_min"),
    material_max_ore: ore("material_max"),
    travel_min_ore: ore("travel_min"),
    travel_max_ore: ore("travel_max"),
    note: str(formData, "note", 500),
  };
  const back = `/admin/tjanster/${serviceId}`;
  if (row.labour_max_ore < row.labour_min_ore || row.material_max_ore < row.material_min_ore || row.travel_max_ore < row.travel_min_ore) {
    redirect(`${back}?fel=ogiltig`);
  }
  const supabase = await createServerSupabase();
  const { error } = rangeId
    ? await supabase.from("price_ranges").update(row).eq("id", rangeId)
    : await supabase.from("price_ranges").insert(row);
  updateTag(CATALOG_TAG);
  redirect(`${back}?${error ? "fel=fel" : "ok=sparad"}`);
}

export async function deleteRangeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const serviceId = slug.parse(formData.get("service_id"));
  const rangeId = num(formData, "range_id");
  const supabase = await createServerSupabase();
  const { error } = rangeId ? await supabase.from("price_ranges").delete().eq("id", rangeId) : { error: true };
  updateTag(CATALOG_TAG);
  redirect(`/admin/tjanster/${serviceId}?${error ? "fel=fel" : "ok=borttagen"}`);
}

export async function saveAddonAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const serviceId = slug.parse(formData.get("service_id"));
  const id = slug.parse(formData.get("id"));
  const supabase = await createServerSupabase();
  const min = parseKrToOre(str(formData, "labour_min")) ?? 0;
  const max = parseKrToOre(str(formData, "labour_max")) ?? 0;
  if (max < min) redirect(`/admin/tjanster/${serviceId}?fel=ogiltig`);
  const { error } = await supabase
    .from("service_addons")
    .update({ label: str(formData, "label", 100) ?? undefined, labour_min_ore: min, labour_max_ore: max, included: bool(formData, "included") })
    .eq("id", id);
  updateTag(CATALOG_TAG);
  redirect(`/admin/tjanster/${serviceId}?${error ? "fel=fel" : "ok=sparad"}`);
}

// ── Settings, tax rules, admins ─────────────────────────────────────────

export async function saveSettingsAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const n = (k: string, min: number, max: number) => {
    const v = num(formData, k);
    return v !== null && v >= min && v <= max ? v : null;
  };
  const values = {
    quote_valid_hours: n("quote_valid_hours", 1, 720),
    pnr_retention_years: n("pnr_retention_years", 1, 15),
    pnr_unused_retention_days: n("pnr_unused_retention_days", 1, 3650),
    default_commission_pct: n("default_commission_pct", 0, 100),
    pets_surcharge_pct: n("pets_surcharge_pct", 0, 100),
    extra_floor_surcharge_pct: n("extra_floor_surcharge_pct", 0, 100),
    notification_email: z.string().email().safeParse(str(formData, "notification_email")).data ?? null,
  };
  if (Object.values(values).some((v) => v === null)) redirect("/admin/installningar?fel=ogiltig");
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("settings")
    .update({
      ...(values as Record<string, number | string>),
      quote_valid_hours: Math.round(values.quote_valid_hours!),
      pnr_retention_years: Math.round(values.pnr_retention_years!),
      pnr_unused_retention_days: Math.round(values.pnr_unused_retention_days!),
    })
    .eq("id", 1);
  updateTag(CATALOG_TAG);
  redirect(`/admin/installningar?${error ? "fel=fel" : "ok=sparad"}`);
}

/** Blank fields mean "use the value in lib/taxRules.ts". Rates entered in %, caps in kronor. */
export async function saveTaxOverrideAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const year = num(formData, "year");
  if (year === null || year < 2020 || year > 2100) redirect("/admin/installningar?fel=ogiltig");
  const pct = (k: string) => {
    const v = num(formData, k);
    return v === null ? null : Math.min(1, Math.max(0, v / 100));
  };
  const cap = (k: string) => parseKrToOre(str(formData, k));
  const row = {
    year: Math.round(year),
    rut_rate: pct("rut_rate"),
    rot_rate: pct("rot_rate"),
    rut_cap_ore: cap("rut_cap"),
    rot_cap_ore: cap("rot_cap"),
    combined_cap_ore: cap("combined_cap"),
    note: str(formData, "note", 500),
    updated_by: admin.email,
    updated_at: new Date().toISOString(),
  };
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("tax_rule_overrides").upsert(row, { onConflict: "year" });
  updateTag(CATALOG_TAG);
  redirect(`/admin/installningar?${error ? "fel=fel" : "ok=sparad"}`);
}

export async function addAdminAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success) redirect("/admin/installningar?fel=ogiltig");
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("admin_users").upsert({ email: email.data, added_by: admin.email });
  redirect(`/admin/installningar?${error ? "fel=fel" : "ok=sparad"}`);
}

export async function removeAdminAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const email = String(formData.get("email") ?? "").toLowerCase();
  const supabase = await createServerSupabase();
  const { count } = await supabase.from("admin_users").select("email", { count: "exact", head: true });
  if (email === admin.email.toLowerCase() || (count ?? 0) <= 1) redirect("/admin/installningar?fel=sista");
  const { error } = await supabase.from("admin_users").delete().eq("email", email);
  redirect(`/admin/installningar?${error ? "fel=fel" : "ok=borttagen"}`);
}
