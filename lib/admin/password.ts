/** Minimum length for admin passwords (same rule as the "admin-users" Edge Function). */
export const ADMIN_PASSWORD_MIN = 12;

const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A random password without look-alike characters (no 0/O, 1/l/I), 16 characters by default. */
export function generatePassword(length = 16, random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const out: string[] = [];
  // Rejection sampling keeps every character equally likely.
  const limit = 256 - (256 % ALPHABET.length);
  while (out.length < length) {
    for (const byte of random(length * 2)) {
      if (byte < limit && out.length < length) out.push(ALPHABET[byte % ALPHABET.length]);
    }
  }
  return out.join("");
}
