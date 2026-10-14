import { company } from "@/lib/company";
import { displayDate, displayDateTime, displayTimeWindow } from "@/lib/email/templates";
import { fmt, t } from "@/lib/i18n";

/**
 * Short SMS texts (Swedish) that match the email templates. Never include personnummer or
 * customer names. Optional helpers – the email templates are the binding contract.
 */
const s = t.email.sms;

export function requestReceivedSms(p: { bookingNumber: string }): string {
  return fmt(s.requestReceived, { bookingNumber: p.bookingNumber, phone: company.phoneDisplay });
}

export function quoteSentSms(p: { bookingNumber: string; link: string; expiresAt: string }): string {
  return fmt(s.quoteSent, {
    bookingNumber: p.bookingNumber,
    link: p.link,
    expiresAt: displayDateTime(p.expiresAt),
  });
}

export function bookingConfirmedSms(p: {
  bookingNumber: string;
  scheduledDate: string | null;
  timeWindow: string | null;
}): string {
  const date = displayDate(p.scheduledDate);
  const timeWindow = displayTimeWindow(p.timeWindow).toLowerCase();
  const when = !date
    ? s.whenUnscheduled
    : timeWindow
      ? fmt(s.whenScheduledWithTime, { date, timeWindow })
      : fmt(s.whenScheduled, { date });
  return fmt(s.bookingConfirmed, { bookingNumber: p.bookingNumber, when, phone: company.phoneDisplay });
}
