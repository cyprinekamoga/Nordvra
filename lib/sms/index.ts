import "server-only";
import { maskPhone, scrubForLog } from "@/lib/email/mask";

export type SmsMessage = { to: string; text: string };

export interface SmsProvider {
  send(msg: { to: string; text: string }): Promise<{ ok: boolean; error?: string }>;
}

/**
 * Development/placeholder provider: sends nothing, logs only the last two digits of the number.
 * Never logs the text – SMS can contain quote links with secret tokens.
 */
export class ConsoleSmsProvider implements SmsProvider {
  async send(msg: SmsMessage): Promise<{ ok: boolean; error?: string }> {
    console.info(`[sms] to=${maskPhone(msg.to)}`);
    return { ok: true };
  }
}

/**
 * 46elks (https://46elks.se/docs/send-sms) – NOT ENABLED.
 *
 * TODO(före lansering): implement and test before use:
 *   POST https://api.46elks.com/a1/sms, Basic auth SMS_API_USER:SMS_API_PASSWORD,
 *   form fields from ("Nordvra", max 11 chars), to (+46…), message.
 * Until then send() always fails, so sendSmsSafe() returns false and the admin sends the link
 * manually (the "Skicka offert" action shows it once).
 */
export class FortySixElksSmsProvider implements SmsProvider {
  constructor(
    private readonly apiUser: string,
    private readonly apiPassword: string,
  ) {}

  async send(msg: SmsMessage): Promise<{ ok: boolean; error?: string }> {
    void msg;
    void this.apiUser;
    void this.apiPassword;
    return { ok: false, error: "46elks_not_implemented" };
  }
}

/** SMS_PROVIDER=console (default) | 46elks. */
export function getSmsProvider(): SmsProvider {
  const kind = (process.env.SMS_PROVIDER ?? "console").trim().toLowerCase();
  if (kind === "46elks") {
    const user = process.env.SMS_API_USER?.trim();
    const password = process.env.SMS_API_PASSWORD?.trim();
    if (user && password) return new FortySixElksSmsProvider(user, password);
    console.warn("[sms] SMS_PROVIDER=46elks but SMS_API_USER/SMS_API_PASSWORD is missing – using console");
  } else if (kind !== "console" && kind !== "") {
    console.warn(`[sms] Unknown SMS_PROVIDER "${scrubForLog(kind)}" – using console`);
  }
  return new ConsoleSmsProvider();
}

/** Sends an SMS and never throws: returns true when the provider accepted it. */
export async function sendSmsSafe(msg: { to: string; text: string }): Promise<boolean> {
  const to = maskPhone(msg?.to);
  try {
    if (!msg || typeof msg.to !== "string" || msg.to.replace(/\D/g, "").length < 8 || !msg.text) {
      console.warn(`[sms] Not sent (invalid message) to=${to}`);
      return false;
    }
    const result = await getSmsProvider().send(msg);
    if (!result.ok) {
      console.warn(`[sms] Not sent to=${to} error=${scrubForLog(result.error ?? "unknown")}`);
    }
    return result.ok;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[sms] Not sent to=${to} error=${scrubForLog(message)}`);
    return false;
  }
}
