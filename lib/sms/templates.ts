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

function whenText(scheduledDate: string | null, timeWindowValue: string | null): string {
  const date = displayDate(scheduledDate);
  const timeWindow = displayTimeWindow(timeWindowValue).toLowerCase();
  return !date
    ? s.whenUnscheduled
    : timeWindow
      ? fmt(s.whenScheduledWithTime, { date, timeWindow })
      : fmt(s.whenScheduled, { date });
}

export function bookingConfirmedSms(p: {
  bookingNumber: string;
  scheduledDate: string | null;
  timeWindow: string | null;
}): string {
  const when = whenText(p.scheduledDate, p.timeWindow);
  return fmt(s.bookingConfirmed, { bookingNumber: p.bookingNumber, when, phone: company.phoneDisplay });
}

/**
 * To the person who lives in the home when a relative booked: who is coming and when, and that
 * nobody may take payment or sell extra work at the door. No names (SMS rule).
 */
export function residentSms(p: {
  serviceName: string;
  scheduledDate: string | null;
  timeWindow: string | null;
  partnerName: string | null;
}): string {
  const vars = {
    service: p.serviceName.toLocaleLowerCase("sv-SE"),
    when: whenText(p.scheduledDate, p.timeWindow),
    phone: company.phoneDisplay,
  };
  return p.partnerName ? fmt(s.resident, { ...vars, partner: p.partnerName }) : fmt(s.residentNoPartner, vars);
}
