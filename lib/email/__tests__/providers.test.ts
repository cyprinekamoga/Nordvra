import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ConsoleEmailProvider,
  ResendEmailProvider,
  getEmailProvider,
  sendEmailSafe,
} from "@/lib/email/index";
import { maskEmail, maskPhone, scrubForLog } from "@/lib/email/mask";
import {
  ConsoleSmsProvider,
  FortySixElksSmsProvider,
  getSmsProvider,
  sendSmsSafe,
} from "@/lib/sms/index";

const SECRET_BODY = "Hej Anna! https://nordvra.se/offert/secret-token 19800101-1234";

function logged(spy: { mock: { calls: unknown[][] } }): string {
  return spy.mock.calls.map((args) => args.map(String).join(" ")).join("\n");
}

describe("masking", () => {
  it("masks emails to the domain", () => {
    expect(maskEmail("anna.svensson@example.se")).toBe("***@example.se");
    expect(maskEmail("Anna@Example.SE")).toBe("***@example.se");
    expect(maskEmail("no-at-sign")).toBe("***");
    expect(maskEmail(undefined)).toBe("***");
  });

  it("masks phone numbers to the last two digits", () => {
    expect(maskPhone("+46701234567")).toBe("+46*****67");
    expect(maskPhone("070-123 45 89")).toBe("+46*****89");
    expect(maskPhone("")).toBe("+46*******");
  });

  it("scrubs emails, numbers and URLs from error text", () => {
    const out = scrubForLog("fail for anna@example.se +46701234567 19800101-1234 https://x.se/offert/t");
    expect(out).not.toContain("anna@");
    expect(out).toContain("***@example.se");
    expect(out).not.toMatch(/\d{6}/);
    expect(out).not.toContain("offert/t");
    expect(scrubForLog("http 422")).toBe("http 422");
  });
});

describe("console providers", () => {
  let info: ReturnType<typeof vi.spyOn>;
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    info = vi.spyOn(console, "info").mockImplementation(() => {});
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("ConsoleEmailProvider logs only domain and subject", async () => {
    const res = await new ConsoleEmailProvider().send({
      to: "anna@example.se",
      subject: "Din offert är klar (NV-2026-00012)",
      text: SECRET_BODY,
      html: `<p>${SECRET_BODY}</p>`,
    });
    expect(res.ok).toBe(true);
    expect(logged(info)).toBe("[email] to=***@example.se subject=Din offert är klar (NV-2026-00012)");
  });

  it("ConsoleSmsProvider logs only the last two digits", async () => {
    const res = await new ConsoleSmsProvider().send({ to: "+46701234567", text: SECRET_BODY });
    expect(res.ok).toBe(true);
    expect(logged(info)).toBe("[sms] to=+46*****67");
  });

  it("defaults to console providers and falls back when credentials are missing", () => {
    vi.stubEnv("EMAIL_PROVIDER", "");
    vi.stubEnv("SMS_PROVIDER", "");
    expect(getEmailProvider()).toBeInstanceOf(ConsoleEmailProvider);
    expect(getSmsProvider()).toBeInstanceOf(ConsoleSmsProvider);

    vi.stubEnv("EMAIL_PROVIDER", "resend");
    vi.stubEnv("RESEND_API_KEY", "");
    expect(getEmailProvider()).toBeInstanceOf(ConsoleEmailProvider);
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Nordvra <info@nordvra.se>");
    expect(getEmailProvider()).toBeInstanceOf(ResendEmailProvider);

    vi.stubEnv("SMS_PROVIDER", "46elks");
    vi.stubEnv("SMS_API_USER", "");
    expect(getSmsProvider()).toBeInstanceOf(ConsoleSmsProvider);
    vi.stubEnv("SMS_API_USER", "u");
    vi.stubEnv("SMS_API_PASSWORD", "p");
    expect(getSmsProvider()).toBeInstanceOf(FortySixElksSmsProvider);
  });

  it("sendEmailSafe / sendSmsSafe succeed with console providers", async () => {
    vi.stubEnv("EMAIL_PROVIDER", "console");
    vi.stubEnv("SMS_PROVIDER", "console");
    await expect(sendEmailSafe({ to: "a@example.se", subject: "Hej", text: SECRET_BODY })).resolves.toBe(true);
    await expect(sendSmsSafe({ to: "+46701234567", text: SECRET_BODY })).resolves.toBe(true);
    const all = logged(info) + logged(warn);
    expect(all).not.toContain("secret-token");
    expect(all).not.toContain("19800101");
    expect(all).not.toContain("a@example.se");
  });

  it("never throw and never log PII when a provider fails", async () => {
    vi.stubEnv("EMAIL_PROVIDER", "resend");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Nordvra <info@nordvra.se>");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connect failed for anna@example.se");
      }),
    );
    await expect(
      sendEmailSafe({ to: "anna@example.se", subject: "Hej", text: SECRET_BODY }),
    ).resolves.toBe(false);

    vi.stubGlobal("fetch", vi.fn(async () => new Response("{\"message\":\"anna@example.se\"}", { status: 422 })));
    await expect(
      sendEmailSafe({ to: "anna@example.se", subject: "Hej", text: SECRET_BODY }),
    ).resolves.toBe(false);

    vi.stubEnv("SMS_PROVIDER", "46elks");
    vi.stubEnv("SMS_API_USER", "u");
    vi.stubEnv("SMS_API_PASSWORD", "p");
    await expect(sendSmsSafe({ to: "+46701234567", text: SECRET_BODY })).resolves.toBe(false);

    // Invalid input
    await expect(sendEmailSafe({ to: "", subject: "", text: "" })).resolves.toBe(false);
    await expect(sendSmsSafe({ to: "12", text: "x" })).resolves.toBe(false);

    const all = logged(warn) + logged(info);
    expect(all).not.toContain("anna@");
    expect(all).not.toContain("0701234567");
    expect(all).not.toContain("secret-token");
    expect(all).toContain("resend_http_422");
    vi.unstubAllGlobals();
  });

  it("ResendEmailProvider posts the message to Resend", async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: "abc" }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await new ResendEmailProvider("re_key", "Nordvra <info@nordvra.se>").send({
      to: "anna@example.se",
      subject: "Hej",
      text: "Text",
      html: "<p>Text</p>",
    });
    expect(res).toEqual({ ok: true, id: "abc" });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_key");
    expect(JSON.parse(String(init.body))).toEqual({
      from: "Nordvra <info@nordvra.se>",
      to: ["anna@example.se"],
      subject: "Hej",
      text: "Text",
      html: "<p>Text</p>",
    });
    vi.unstubAllGlobals();
  });
});

describe("ResendEmailProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("posts the message with the key, sender and reply-to", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "msg_1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await new ResendEmailProvider("re_test", "Nordvra <info@nordvra.se>", "hej@exempel.se").send({
      to: "anna@example.se",
      subject: "Hej",
      text: "Text",
      html: "<p>Text</p>",
    });
    expect(res).toEqual({ ok: true, id: "msg_1" });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    expect(JSON.parse(String(init.body))).toEqual({
      from: "Nordvra <info@nordvra.se>",
      to: ["anna@example.se"],
      subject: "Hej",
      text: "Text",
      html: "<p>Text</p>",
      reply_to: "hej@exempel.se",
    });
  });

  it("reports only the HTTP status on errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("domain not verified for anna@example.se", { status: 403 })));
    const res = await new ResendEmailProvider("re_test", "Nordvra <info@nordvra.se>").send({
      to: "anna@example.se",
      subject: "Hej",
      text: "Text",
    });
    expect(res).toEqual({ ok: false, error: "resend_http_403" });
  });

  it("picks up EMAIL_REPLY_TO from the environment", async () => {
    vi.stubEnv("EMAIL_PROVIDER", "resend");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Nordvra <info@nordvra.se>");
    vi.stubEnv("EMAIL_REPLY_TO", "hej@exempel.se");
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await getEmailProvider().send({ to: "a@example.se", subject: "S", text: "T" });
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(JSON.parse(String(init.body)).reply_to).toBe("hej@exempel.se");
  });
});
