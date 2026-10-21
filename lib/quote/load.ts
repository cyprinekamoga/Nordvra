import "server-only";
import { hashToken } from "@/lib/crypto/pii";
import { createAnonClient } from "@/lib/supabase/anon";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { parseHomeLog, type HomeLogEntry } from "./homeLog";
import { isPlausibleToken, parseQuote, type QuoteData } from "./quote";

export type QuoteLookup =
  | { kind: "found"; quote: QuoteData; tokenHash: string }
  | { kind: "notFound" }
  | { kind: "unavailable" };

/**
 * Reads a quote by its link token through the public `get_quote` RPC (only the SHA-256 hash of
 * the token is sent). Never cached: the status changes when the customer answers. The token
 * and the response are never logged.
 */
export async function loadQuote(token: string): Promise<QuoteLookup> {
  if (!isPlausibleToken(token)) return { kind: "notFound" };
  if (!isSupabaseConfigured()) {
    console.warn("[quote] get_quote skipped: Supabase is not configured");
    return { kind: "unavailable" };
  }
  const tokenHash = hashToken(token);
  try {
    const { data, error } = await createAnonClient().rpc("get_quote", { p_token_hash: tokenHash });
    if (error) {
      console.warn(`[quote] get_quote failed (${error.code ?? "no code"})`);
      return { kind: "unavailable" };
    }
    if (data === null) return { kind: "notFound" };
    const quote = parseQuote(data);
    if (!quote) {
      console.warn("[quote] get_quote returned an unexpected shape");
      return { kind: "unavailable" };
    }
    return { kind: "found", quote, tokenHash };
  } catch (error) {
    console.warn(`[quote] get_quote threw: ${error instanceof Error ? error.name : "unknown"}`);
    return { kind: "unavailable" };
  }
}

/** "Bostadens logg" for the home of this booking. Empty when unavailable (never blocks the page). */
export async function loadHomeLog(tokenHash: string): Promise<HomeLogEntry[]> {
  try {
    const { data, error } = await createAnonClient().rpc("get_home_log", { p_token_hash: tokenHash });
    if (error) {
      console.warn(`[quote] get_home_log failed (${error.code ?? "no code"})`);
      return [];
    }
    return parseHomeLog(data);
  } catch (error) {
    console.warn(`[quote] get_home_log threw: ${error instanceof Error ? error.name : "unknown"}`);
    return [];
  }
}
