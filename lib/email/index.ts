import "server-only";
import { maskEmail, scrubForLog } from "@/lib/email/mask";

export type EmailMessage = { to: string; subject: string; text: string; html?: string };

export interface EmailProvider {
  send(msg: EmailMessage): Promise<{ ok: boolean; id?: string; error?: string }>;
}

/**
 * Development/placeholder provider: sends nothing, logs only the recipient's domain and the
 * subject. Never logs bodies – they can contain quote links (secret tokens) and names.
 */
export class ConsoleEmailProvider implements EmailProvider {
  async send(msg: EmailMessage): Promise<{ ok: boolean; id?: string; error?: string }> {
    console.info(`[email] to=${maskEmail(msg.to)} subject=${msg.subject}`);
    return { ok: true, id: "console" };
  }
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Sends through Resend (https://resend.com/docs/api-reference/emails/send-email).
 *
 * Setup (docs/EMAIL.md): verify the sending domain in Resend (SPF/DKIM), then set
 * EMAIL_PROVIDER=resend, RESEND_API_KEY, EMAIL_FROM ("Nordvra <info@nordvra.se>") and optionally
 * EMAIL_REPLY_TO, and use "Skicka testmejl" in admin settings.
 */
export class ResendEmailProvider implements EmailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    /** Where customer replies go (a monitored inbox), when it differs from the sender. */
    private readonly replyTo?: string,
  ) {}

  async send(msg: EmailMessage): Promise<{ ok: boolean; id?: string; error?: string }> {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [msg.to],
        subject: msg.subject,
        text: msg.text,
        ...(msg.html ? { html: msg.html } : {}),
        ...(this.replyTo ? { reply_to: this.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) {
      // The response body may echo the recipient, so only the status is reported.
      return { ok: false, error: `resend_http_${response.status}` };
    }
    const data = (await response.json().catch(() => null)) as { id?: unknown } | null;
    return { ok: true, id: typeof data?.id === "string" ? data.id : undefined };
  }
}

/** EMAIL_PROVIDER=console (default) | resend. Falls back to console when Resend isn't set up. */
export function getEmailProvider(): EmailProvider {
  const kind = (process.env.EMAIL_PROVIDER ?? "console").trim().toLowerCase();
  if (kind === "resend") {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.EMAIL_FROM?.trim();
    const replyTo = process.env.EMAIL_REPLY_TO?.trim() || undefined;
    if (apiKey && from) return new ResendEmailProvider(apiKey, from, replyTo);
    console.warn("[email] EMAIL_PROVIDER=resend but RESEND_API_KEY/EMAIL_FROM is missing – using console");
  } else if (kind !== "console" && kind !== "") {
    console.warn(`[email] Unknown EMAIL_PROVIDER "${scrubForLog(kind)}" – using console`);
  }
  return new ConsoleEmailProvider();
}

/** What the admin settings page shows about email (never the API key). */
export function emailStatus(): { provider: "console" | "resend"; from: string | null; replyTo: string | null } {
  const provider = getEmailProvider() instanceof ResendEmailProvider ? "resend" : "console";
  return {
    provider,
    from: process.env.EMAIL_FROM?.trim() || null,
    replyTo: process.env.EMAIL_REPLY_TO?.trim() || null,
  };
}

/**
 * Sends an email and never throws: returns true when the provider accepted it. Failures are
 * logged with the masked recipient and the subject only. Use for every customer/owner email so
 * a provider outage can never break a booking or an admin action.
 */
export async function sendEmailSafe(msg: EmailMessage): Promise<boolean> {
  const to = maskEmail(msg?.to);
  try {
    if (!msg || typeof msg.to !== "string" || !msg.to.includes("@") || !msg.subject) {
      console.warn(`[email] Not sent (invalid message) to=${to}`);
      return false;
    }
    const result = await getEmailProvider().send(msg);
    if (!result.ok) {
      console.warn(
        `[email] Not sent to=${to} subject=${msg.subject} error=${scrubForLog(result.error ?? "unknown")}`,
      );
    }
    return result.ok;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[email] Not sent to=${to} error=${scrubForLog(message)}`);
    return false;
  }
}
