import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Column-level encryption for personnummer (AES-256-GCM).
 *
 * The key lives only in the server environment (PII_ENCRYPTION_KEY, 32 random bytes as
 * base64). The database stores ciphertext; a database dump alone does not reveal personnummer.
 * Generate a key with:  openssl rand -base64 32
 *
 * Format: "v1.<iv>.<tag>.<ciphertext>" (base64url parts). The version prefix allows key
 * rotation later (decrypt with old key, re-encrypt with new).
 */

const VERSION = "v1";

function getKey(): Buffer {
  const raw = process.env.PII_ENCRYPTION_KEY;
  if (!raw) throw new Error("PII_ENCRYPTION_KEY is not set");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("PII_ENCRYPTION_KEY must be 32 bytes (base64)");
  return key;
}

export function isEncryptionConfigured(): boolean {
  try {
    getKey();
    return true;
  } catch {
    return false;
  }
}

export function encryptPII(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptPII(token: string): string {
  const [version, iv, tag, ciphertext] = token.split(".");
  if (version !== VERSION || !iv || !tag || !ciphertext) throw new Error("Unknown ciphertext format");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
}

/** Random URL-safe token for quote links. Only its hash is stored. */
export function createQuoteToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
