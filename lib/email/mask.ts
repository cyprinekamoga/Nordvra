/**
 * Masking for logs. Logs may only show a recipient's email domain or the last two digits of a
 * phone number – never full addresses, numbers, message bodies or personnummer.
 */

/** "anna@example.se" → "***@example.se"; anything without a domain → "***". */
export function maskEmail(address: string | null | undefined): string {
  const value = (address ?? "").trim();
  const at = value.lastIndexOf("@");
  const domain = at >= 0 ? value.slice(at + 1).toLowerCase() : "";
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain) ? `***@${domain}` : "***";
}

/** "+46 70-123 45 67" → "+46*****67". */
export function maskPhone(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  const last2 = digits.length >= 2 ? digits.slice(-2) : "**";
  return `+46*****${last2}`;
}

/**
 * Removes anything personal from a free-text error message before it is logged:
 * email addresses, phone numbers/personnummer (any run of 6+ digits, also with - or spaces)
 * and URLs (quote links carry secret tokens).
 */
export function scrubForLog(text: string): string {
  return text
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/[^\s@<>"']+@([^\s@<>"']+)/g, (_m, domain: string) => `***@${domain}`)
    .replace(/\+?\d[\d\s-]{4,}\d/g, (m) => (m.replace(/\D/g, "").length >= 6 ? "[nummer]" : m))
    .slice(0, 300);
}
