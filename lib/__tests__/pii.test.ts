import { beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { createQuoteToken, decryptPII, encryptPII, hashToken } from "@/lib/crypto/pii";

beforeAll(() => {
  process.env.PII_ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("PII encryption", () => {
  it("round-trips and never contains the plaintext", () => {
    const secret = "191212121212";
    const encrypted = encryptPII(secret);
    expect(encrypted).not.toContain(secret);
    expect(encrypted.startsWith("v1.")).toBe(true);
    expect(decryptPII(encrypted)).toBe(secret);
  });

  it("uses a fresh IV every time", () => {
    expect(encryptPII("x")).not.toBe(encryptPII("x"));
  });

  it("detects tampering", () => {
    const parts = encryptPII("191212121212").split(".");
    parts[3] = Buffer.from("tampered").toString("base64url");
    expect(() => decryptPII(parts.join("."))).toThrow();
  });
});

describe("quote tokens", () => {
  it("stores only a hash", () => {
    const { token, hash } = createQuoteToken();
    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(hash).toBe(hashToken(token));
    expect(hash).not.toContain(token);
  });
});
