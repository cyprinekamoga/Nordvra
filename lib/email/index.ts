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
 * TODO(före lansering): UNTESTED. Enable deliberately with EMAIL_PROVIDER=resend after
 * verifying the sending domain in Resend (SPF/DKIM), setting RESEND_API_KEY and EMAIL_FROM
 * (e.g. "Nordvra <info@nordvra.se>"), and sending a test to an internal address.
 */
export class ResendEmailProvider implements EmailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
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
    if (apiKey && from) return new ResendEmailProvider(apiKey, from);
    console.warn("[email] EMAIL_PROVIDER=resend but RESEND_API_KEY/EMAIL_FROM is missing – using console");
  } else if (kind !== "console" && kind !== "") {
    console.warn(`[email] Unknown EMAIL_PROVIDER "${scrubForLog(kind)}" – using console`);
  }
  return new ConsoleEmailProvider();
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
