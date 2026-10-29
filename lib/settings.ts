import "server-only";
import type { TypedSupabaseClient } from "@/lib/supabase/anon";
import type { Tables } from "@/lib/supabase/database.types";
import { toNumber } from "@/lib/catalog/map";

/**
 * App settings (single `settings` row, id = 1). Admin-only under RLS, so pass the admin's
 * server client (`createServerSupabase()`); with any other client the defaults are returned.
 */
export type AppSettings = {
  quoteValidHours: number;
  pnrRetentionYears: number;
  pnrUnusedRetentionDays: number;
  defaultCommissionPct: number;
  petsSurchargePct: number;
  extraFloorSurchargePct: number;
  notificationEmail: string;
};

/** Same defaults as the database columns (supabase/migrations, SPEC §7). */
export const DEFAULT_SETTINGS: Readonly<AppSettings> = Object.freeze({
  quoteValidHours: 48,
  pnrRetentionYears: 7,
  pnrUnusedRetentionDays: 90,
  defaultCommissionPct: 12,
  petsSurchargePct: 10,
  extraFloorSurchargePct: 5,
  notificationEmail: "info@nordvra.se",
});

type SettingsRow = Tables<"settings">;

/** Pure: a (possibly partial or string-typed) settings row → `AppSettings` with defaults. */
export function mapSettings(row: { [K in keyof SettingsRow]?: unknown } | null | undefined): AppSettings {
  const d = DEFAULT_SETTINGS;
  if (!row) return { ...d };
  const positive = (value: unknown, fallback: number) => {
    const n = toNumber(value, fallback);
    return n > 0 ? n : fallback;
  };
  const pct = (value: unknown, fallback: number) => {
    const n = toNumber(value, fallback);
    return n >= 0 && n <= 100 ? n : fallback;
  };
  const email = typeof row.notification_email === "string" ? row.notification_email.trim() : "";
  return {
    quoteValidHours: positive(row.quote_valid_hours, d.quoteValidHours),
    pnrRetentionYears: positive(row.pnr_retention_years, d.pnrRetentionYears),
    pnrUnusedRetentionDays: positive(row.pnr_unused_retention_days, d.pnrUnusedRetentionDays),
    defaultCommissionPct: pct(row.default_commission_pct, d.defaultCommissionPct),
    petsSurchargePct: pct(row.pets_surcharge_pct, d.petsSurchargePct),
    extraFloorSurchargePct: pct(row.extra_floor_surcharge_pct, d.extraFloorSurchargePct),
    notificationEmail: email.includes("@") ? email : d.notificationEmail,
  };
}

/** Reads the settings row; falls back to `DEFAULT_SETTINGS` on any error (logs the message only). */
export async function getSettings(client: TypedSupabaseClient): Promise<AppSettings> {
  try {
    const { data, error } = await client.from("settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw new Error(error.message);
    return mapSettings(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[settings] Using default settings: ${message}`);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * The owner's notification address for alerts sent from customer actions (no admin session):
 * read through the `owner_notification_email` RPC, so the address set under Inställningar is
 * used. Falls back to the default on any error.
 */
export async function getNotificationEmail(client: TypedSupabaseClient): Promise<string> {
  try {
    const { data, error } = await client.rpc("owner_notification_email");
    if (error || typeof data !== "string" || !data.includes("@")) return DEFAULT_SETTINGS.notificationEmail;
    return data.trim();
  } catch {
    return DEFAULT_SETTINGS.notificationEmail;
  }
}
