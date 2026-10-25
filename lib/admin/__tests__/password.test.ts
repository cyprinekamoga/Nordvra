import { describe, expect, it } from "vitest";
import { ADMIN_PASSWORD_MIN, generatePassword } from "@/lib/admin/password";

describe("generatePassword", () => {
  it("is long enough and avoids look-alike characters", () => {
    const pw = generatePassword();
    expect(pw).toHaveLength(16);
    expect(pw.length).toBeGreaterThanOrEqual(ADMIN_PASSWORD_MIN);
    expect(pw).not.toMatch(/[0O1lI]/);
  });

  it("differs every time", () => {
    expect(new Set(Array.from({ length: 20 }, () => generatePassword())).size).toBe(20);
  });
});
