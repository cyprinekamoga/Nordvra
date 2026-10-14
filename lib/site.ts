/** Used when NEXT_PUBLIC_SITE_URL isn't set (local development). */
export const DEFAULT_SITE_URL = "http://localhost:3000";

/**
 * Absolute URL on this site, e.g. `siteUrl("/offert/abc")` → "https://nordvra.se/offert/abc".
 * Reads NEXT_PUBLIC_SITE_URL (no trailing slash in the result). Used for links in emails/SMS,
 * metadata and the sitemap. Never put personnummer or other PII in `path`.
 */
export function siteUrl(path?: string): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim() || DEFAULT_SITE_URL;
  const base = raw.replace(/\/+$/, "");
  if (!path) return base;
  const rest = path.replace(/^\/+/, "");
  if (rest === "") return base;
  return `${base}/${rest}`;
}
