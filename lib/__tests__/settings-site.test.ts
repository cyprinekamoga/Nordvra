import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, getSettings, mapSettings } from "@/lib/settings";
import { DEFAULT_SITE_URL, siteUrl } from "@/lib/site";
import type { TypedSupabaseClient } from "@/lib/supabase/anon";

describe("settings", () => {
  it("has the documented defaults", () => {
    expect(DEFAULT_SETTINGS).toEqual({
      quoteValidHours: 48,
      pnrRetentionYears: 7,
      pnrUnusedRetentionDays: 90,
      defaultCommissionPct: 12,
      petsSurchargePct: 10,
      extraFloorSurchargePct: 5,
      notificationEmail: "info@nordvra.se",
    });
  });

  it("maps a row and coerces numeric strings", () => {
    expect(
      mapSettings({
        id: 1,
        quote_valid_hours: 72,
        pnr_retention_years: 10,
        pnr_unused_retention_days: 60,
        default_commission_pct: "15.00",
        pets_surcharge_pct: "0",
        extra_floor_surcharge_pct: "7.5",
        notification_email: " owner@example.se ",
      }),
    ).toEqual({
      quoteValidHours: 72,
      pnrRetentionYears: 10,
      pnrUnusedRetentionDays: 60,
      defaultCommissionPct: 15,
      petsSurchargePct: 0,
      extraFloorSurchargePct: 7.5,
      notificationEmail: "owner@example.se",
    });
  });

  it("falls back per field on missing or invalid values", () => {
    expect(mapSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(
      mapSettings({ quote_valid_hours: 0, default_commission_pct: 150, notification_email: "nope" }),
    ).toEqual(DEFAULT_SETTINGS);
  });

  it("getSettings returns defaults when the query fails or throws", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const failing = {
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: null, error: { message: "permission denied" } }) }),
        }),
      }),
    } as unknown as TypedSupabaseClient;
    const throwing = {
      from: () => {
        throw new Error("network down");
      },
    } as unknown as TypedSupabaseClient;
    await expect(getSettings(failing)).resolves.toEqual(DEFAULT_SETTINGS);
    await expect(getSettings(throwing)).resolves.toEqual(DEFAULT_SETTINGS);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it("getSettings maps the row on success", async () => {
    const ok = {
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { quote_valid_hours: 24 }, error: null }) }),
        }),
      }),
    } as unknown as TypedSupabaseClient;
    await expect(getSettings(ok)).resolves.toEqual({ ...DEFAULT_SETTINGS, quoteValidHours: 24 });
  });
});

describe("siteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("joins paths without double or trailing slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://nordvra.se/");
    expect(siteUrl()).toBe("https://nordvra.se");
    expect(siteUrl("/")).toBe("https://nordvra.se");
    expect(siteUrl("/offert/abc")).toBe("https://nordvra.se/offert/abc");
    expect(siteUrl("admin/bokningar/1")).toBe("https://nordvra.se/admin/bokningar/1");
  });

  it("falls back to localhost when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(siteUrl("/boka")).toBe(`${DEFAULT_SITE_URL}/boka`);
  });
});
