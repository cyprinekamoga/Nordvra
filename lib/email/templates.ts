import { company } from "@/lib/company";
import { palette } from "@/lib/design/tokens";
import { formatDateLong, formatDateTime, formatPostcode } from "@/lib/format";
import { fmt, t } from "@/lib/i18n";

/**
 * Email templates (Swedish). Each returns `{ subject, text, html }` – plain text for every
 * client plus a simple, inline-styled HTML version in the brand colours.
 *
 * Inputs never include personnummer, and nothing here may add one. Customer names are only
 * used in the greeting, never in subjects (subjects end up in logs).
 */

export type RenderedEmail = { subject: string; text: string; html: string };

const s = t.email;

// ---------------------------------------------------------------------------------------------
// Helpers

/** "2026-10-14" → "onsdag 14 oktober 2026"; anything else (already formatted) is kept. */
export function displayDate(value: string | null | undefined): string {
  if (!value) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? formatDateLong(value.trim()) : value;
}

/** ISO timestamp → "15 okt. 2026 14:00" (Stockholm time); unparseable values are kept. */
export function displayDateTime(value: string | null | undefined): string {
  if (!value) return "";
  return Number.isNaN(new Date(value).getTime()) ? value : formatDateTime(value);
}

/** "formiddag" → "Förmiddag"; unknown values are kept as they are. */
export function displayTimeWindow(value: string | null | undefined): string {
  if (!value) return "";
  const labels: Record<string, string> = s.common.timeWindows;
  return labels[value] ?? value;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only http(s) links become buttons/anchors. */
function isWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

type Row = readonly [label: string, value: string];

interface Layout {
  subject: string;
  preheader: string;
  heading: string;
  greeting?: string;
  paragraphs: string[];
  rows?: Row[];
  button?: { label: string; href: string; showFallback?: boolean };
  after?: string[];
  audience: "customer" | "owner";
}

const contactLine = () =>
  fmt(s.common.questions, { phone: company.phoneDisplay, email: company.email });

function renderText(l: Layout): string {
  const parts: string[] = [];
  if (l.greeting) parts.push(l.greeting);
  parts.push(...l.paragraphs);
  if (l.rows?.length) parts.push(l.rows.map(([label, value]) => `${label}: ${value}`).join("\n"));
  if (l.button) parts.push(`${l.button.label}:\n${l.button.href}`);
  if (l.after?.length) parts.push(...l.after);
  if (l.audience === "customer") parts.push(contactLine());
  parts.push(`${s.common.signOff}\n${s.common.signature}`);
  parts.push(
    [
      l.audience === "customer" ? s.common.customerFooter : s.common.ownerFooter,
      `${company.phoneDisplay} · ${company.email}`,
    ].join("\n"),
  );
  return `${parts.join("\n\n")}\n`;
}

const c = {
  canvas: palette.canvas,
  surface: palette.surface,
  ink: palette.ink,
  muted: palette.muted,
  brand: palette.brand,
  onBrand: palette["on-brand"],
  border: palette.border,
};

const P = `margin:0 0 16px;font-size:18px;line-height:1.5;color:${c.ink};`;

function renderHtml(l: Layout): string {
  const e = escapeHtml;
  const blocks: string[] = [];
  blocks.push(
    `<h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:${c.ink};">${e(l.heading)}</h1>`,
  );
  if (l.greeting) blocks.push(`<p style="${P}">${e(l.greeting)}</p>`);
  for (const p of l.paragraphs) blocks.push(`<p style="${P}">${e(p)}</p>`);

  if (l.rows?.length) {
    const rows = l.rows
      .map(
        ([label, value]) =>
          `<tr><td style="padding:6px 16px 6px 0;font-size:16px;color:${c.muted};vertical-align:top;">${e(label)}</td>` +
          `<td style="padding:6px 0;font-size:18px;font-weight:bold;color:${c.ink};vertical-align:top;">${e(value)}</td></tr>`,
      )
      .join("");
    blocks.push(
      `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:collapse;">${rows}</table>`,
    );
  }

  if (l.button) {
    const { label, href, showFallback } = l.button;
    if (isWebUrl(href)) {
      blocks.push(
        `<p style="margin:8px 0 24px;"><a href="${e(href)}" style="display:inline-block;background:${c.brand};color:${c.onBrand};` +
          `font-size:18px;font-weight:bold;line-height:1.3;text-decoration:none;padding:14px 24px;border-radius:8px;">${e(label)}</a></p>`,
      );
      if (showFallback) {
        blocks.push(
          `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${c.muted};">${e(s.quoteSent.linkFallback)}<br>` +
            `<a href="${e(href)}" style="color:${c.brand};word-break:break-all;">${e(href)}</a></p>`,
        );
      }
    } else {
      blocks.push(`<p style="${P}">${e(label)}: ${e(href)}</p>`);
    }
  }

  for (const p of l.after ?? []) blocks.push(`<p style="${P}">${e(p)}</p>`);
  if (l.audience === "customer") blocks.push(`<p style="${P}">${e(contactLine())}</p>`);
  blocks.push(
    `<p style="margin:24px 0 0;font-size:18px;line-height:1.5;color:${c.ink};">${e(s.common.signOff)}<br>${e(s.common.signature)}</p>`,
  );

  const footerNote = l.audience === "customer" ? s.common.customerFooter : s.common.ownerFooter;
  const phoneHref = e(company.phoneHref);
  const emailHref = e(`mailto:${company.email}`);

  return [
    `<!doctype html>`,
    `<html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<meta name="color-scheme" content="light"><title>${e(l.subject)}</title></head>`,
    `<body style="margin:0;padding:0;background:${c.canvas};color:${c.ink};font-family:Arial,Helvetica,sans-serif;">`,
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${e(l.preheader)}</div>`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.canvas};">`,
    `<tr><td align="center" style="padding:24px 12px;">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${c.surface};border:1px solid ${c.border};border-radius:12px;">`,
    `<tr><td style="padding:24px 24px 0;">`,
    `<p style="margin:0;font-size:26px;font-weight:bold;line-height:1.2;color:${c.brand};">${e(company.brandName)}</p>`,
    `<p style="margin:0;font-size:15px;line-height:1.4;color:${c.muted};">${e(company.operatedBy)}</p>`,
    `</td></tr>`,
    `<tr><td style="padding:24px;">${blocks.join("")}</td></tr>`,
    `<tr><td style="padding:16px 24px 24px;border-top:1px solid ${c.border};font-size:15px;line-height:1.5;color:${c.muted};">`,
    `${e(footerNote)}<br>`,
    `<a href="${phoneHref}" style="color:${c.brand};">${e(company.phoneDisplay)}</a> · `,
    `<a href="${emailHref}" style="color:${c.brand};">${e(company.email)}</a>`,
    `</td></tr></table></td></tr></table></body></html>`,
  ].join("");
}

function render(l: Layout): RenderedEmail {
  return { subject: l.subject, text: renderText(l), html: renderHtml(l) };
}

const greet = (name: string) =>
  name.trim() ? fmt(s.common.greeting, { name: name.trim() }) : s.common.greetingNoName;

// ---------------------------------------------------------------------------------------------
// Templates (SPEC §8a)

/** To the customer right after `/boka` was submitted. */
export function requestReceived(p: {
  name: string;
  bookingNumber: string;
  serviceName: string;
  preferredDate: string;
}): RenderedEmail {
  const m = s.requestReceived;
  const rows: Row[] = [
    [s.common.bookingNumberLabel, p.bookingNumber],
    [s.common.serviceLabel, p.serviceName],
  ];
  const date = displayDate(p.preferredDate);
  if (date) rows.push([s.common.preferredDateLabel, date]);
  return render({
    audience: "customer",
    subject: fmt(m.subject, { bookingNumber: p.bookingNumber }),
    preheader: m.preheader,
    heading: m.heading,
    greeting: greet(p.name),
    paragraphs: [fmt(m.intro, { serviceName: p.serviceName })],
    rows,
    after: [m.next, m.free],
  });
}

/** To the owner (notification email from settings) when a new request arrives. */
export function ownerNewRequest(p: {
  bookingNumber: string;
  serviceName: string;
  postcode: string;
  preferredDate: string;
  adminUrl: string;
}): RenderedEmail {
  const m = s.ownerNewRequest;
  return render({
    audience: "owner",
    subject: fmt(m.subject, { bookingNumber: p.bookingNumber, serviceName: p.serviceName }),
    preheader: m.preheader,
    heading: m.heading,
    paragraphs: [m.intro],
    rows: [
      [s.common.bookingNumberLabel, p.bookingNumber],
      [s.common.serviceLabel, p.serviceName],
      [s.common.postcodeLabel, formatPostcode(p.postcode)],
      [s.common.preferredDateLabel, displayDate(p.preferredDate) || "–"],
    ],
    button: { label: m.button, href: p.adminUrl },
  });
}

/** To the customer with the `/offert/<token>` link. `expiresAt` is an ISO timestamp. */
export function quoteSent(p: {
  name: string;
  bookingNumber: string;
  serviceName: string;
  link: string;
  expiresAt: string;
}): RenderedEmail {
  const m = s.quoteSent;
  return render({
    audience: "customer",
    subject: fmt(m.subject, { serviceName: p.serviceName, bookingNumber: p.bookingNumber }),
    preheader: m.preheader,
    heading: m.heading,
    greeting: greet(p.name),
    paragraphs: [fmt(m.intro, { serviceName: p.serviceName })],
    rows: [[s.common.bookingNumberLabel, p.bookingNumber]],
    button: { label: m.button, href: p.link, showFallback: true },
    after: [fmt(m.validUntil, { expiresAt: displayDateTime(p.expiresAt) }), m.notBooked, m.pnrNote],
  });
}

/** To the customer once the booking is confirmed (date and time window may still be open). */
export function bookingConfirmed(p: {
  name: string;
  bookingNumber: string;
  serviceName: string;
  scheduledDate: string | null;
  timeWindow: string | null;
}): RenderedEmail {
  const m = s.bookingConfirmed;
  const rows: Row[] = [
    [s.common.bookingNumberLabel, p.bookingNumber],
    [s.common.serviceLabel, p.serviceName],
    [s.common.scheduledDateLabel, displayDate(p.scheduledDate) || s.common.dateToBeAgreed],
  ];
  const time = displayTimeWindow(p.timeWindow);
  if (time) rows.push([s.common.timeWindowLabel, time]);
  return render({
    audience: "customer",
    subject: fmt(m.subject, { bookingNumber: p.bookingNumber }),
    preheader: m.preheader,
    heading: m.heading,
    greeting: greet(p.name),
    paragraphs: [fmt(m.intro, { serviceName: p.serviceName })],
    rows,
    after: [m.payment, m.change],
  });
}

/** To the owner when the customer clicks "Godkänn och boka" or "Nej tack". */
export function ownerQuoteAnswered(p: {
  bookingNumber: string;
  accepted: boolean;
  adminUrl: string;
}): RenderedEmail {
  const m = s.ownerQuoteAnswered;
  const vars = { bookingNumber: p.bookingNumber };
  return render({
    audience: "owner",
    subject: fmt(p.accepted ? m.subjectAccepted : m.subjectDeclined, vars),
    preheader: p.accepted ? m.preheaderAccepted : m.preheaderDeclined,
    heading: p.accepted ? m.headingAccepted : m.headingDeclined,
    paragraphs: [fmt(p.accepted ? m.introAccepted : m.introDeclined, vars)],
    button: { label: m.button, href: p.adminUrl },
  });
}
