import { describe, expect, it } from "vitest";
import {
  bookingConfirmed,
  displayDate,
  displayDateTime,
  displayTimeWindow,
  escapeHtml,
  ownerNewRequest,
  ownerQuoteAnswered,
  quoteSent,
  requestReceived,
  type RenderedEmail,
} from "@/lib/email/templates";
import { bookingConfirmedSms, quoteSentSms, requestReceivedSms } from "@/lib/sms/templates";

/** Personnummer/samordningsnummer in any common format (YYMMDD-XXXX, YYYYMMDDXXXX, …). */
const PNR = /(?<!\d)(?:19|20)?\d{2}[01]\d[0-3]\d[-+\s]?\d{4}(?!\d)/;
const PHONE = "076-113 43 84";
const QUOTE_LINK = "https://nordvra.se/offert/Zx9_abcDEF123-token";
const ADMIN_LINK = "https://nordvra.se/admin/bokningar/1b2c";

const emails: Record<string, RenderedEmail> = {
  requestReceived: requestReceived({
    name: "Anna Svensson",
    bookingNumber: "NV-2026-00012",
    serviceName: "Flyttstäd",
    preferredDate: "2026-10-20",
  }),
  ownerNewRequest: ownerNewRequest({
    bookingNumber: "NV-2026-00012",
    serviceName: "Flyttstäd",
    postcode: "63220",
    preferredDate: "2026-10-20",
    adminUrl: ADMIN_LINK,
  }),
  quoteSent: quoteSent({
    name: "Anna Svensson",
    bookingNumber: "NV-2026-00012",
    serviceName: "Flyttstäd",
    link: QUOTE_LINK,
    expiresAt: "2026-10-15T12:00:00Z",
  }),
  bookingConfirmed: bookingConfirmed({
    name: "Anna Svensson",
    bookingNumber: "NV-2026-00012",
    serviceName: "Flyttstäd",
    scheduledDate: "2026-10-20",
    timeWindow: "formiddag",
  }),
  ownerAccepted: ownerQuoteAnswered({ bookingNumber: "NV-2026-00012", accepted: true, adminUrl: ADMIN_LINK }),
  ownerDeclined: ownerQuoteAnswered({ bookingNumber: "NV-2026-00012", accepted: false, adminUrl: ADMIN_LINK }),
};

describe("email templates", () => {
  it.each(Object.entries(emails))("%s has subject, text and html without personnummer", (_n, e) => {
    expect(e.subject.length).toBeGreaterThan(5);
    expect(e.text.length).toBeGreaterThan(20);
    expect(e.html).toContain('<html lang="sv">');
    expect(e.html).toContain("#0B5D4B");
    for (const part of [e.subject, e.text, e.html]) {
      expect(part).not.toMatch(PNR);
      expect(part).not.toMatch(/halva priset|kryphål|loophole|serviceavgift/i);
    }
    expect(e.text).toContain("NV-2026-00012");
    expect(e.subject).not.toContain("Anna");
  });

  it("customer emails greet by name and include the phone number", () => {
    for (const e of [emails.requestReceived, emails.quoteSent, emails.bookingConfirmed]) {
      expect(e.text).toContain("Hej Anna Svensson!");
      expect(e.text).toContain(PHONE);
      expect(e.html).toContain(PHONE);
    }
  });

  it("owner emails link to the admin booking", () => {
    for (const e of [emails.ownerNewRequest, emails.ownerAccepted, emails.ownerDeclined]) {
      expect(e.text).toContain(ADMIN_LINK);
      expect(e.html).toContain(`href="${ADMIN_LINK}"`);
    }
    expect(emails.ownerNewRequest.text).toContain("632 20");
    expect(emails.ownerAccepted.subject).toContain("godkänd");
    expect(emails.ownerDeclined.subject).toContain("nekad");
  });

  it("quoteSent contains the link, the expiry and that nothing is booked yet", () => {
    const e = emails.quoteSent;
    expect(e.text).toContain(QUOTE_LINK);
    expect(e.html).toContain(`href="${QUOTE_LINK}"`);
    // 12:00 UTC = 14:00 in Stockholm (CEST).
    expect(e.text).toContain(`Länken gäller till ${displayDateTime("2026-10-15T12:00:00Z")}.`);
    expect(e.text).toMatch(/14:00/);
    expect(e.text).toContain("Ingenting är bokat förrän du har godkänt offerten");
  });

  it("requestReceived says it is free and has no booking fee", () => {
    expect(emails.requestReceived.text).toContain("Ingen bokningsavgift");
    expect(emails.requestReceived.text).toContain("tisdag 20 oktober 2026");
  });

  it("bookingConfirmed shows date/time and payment rule; handles an open date", () => {
    expect(emails.bookingConfirmed.text).toContain("Förmiddag");
    expect(emails.bookingConfirmed.text).toContain("elektroniskt");
    const open = bookingConfirmed({
      name: "",
      bookingNumber: "NV-2026-00013",
      serviceName: "Målning",
      scheduledDate: null,
      timeWindow: null,
    });
    expect(open.text).toContain("Hej!");
    expect(open.text).toContain("Vi bestämmer dag tillsammans med dig");
  });

  it("escapes HTML in inputs", () => {
    const e = requestReceived({
      name: '<script>alert("x")</script>',
      bookingNumber: "NV-2026-00014",
      serviceName: "Hemstäd & fönster",
      preferredDate: "2026-11-02",
    });
    expect(e.html).not.toContain("<script>");
    expect(e.html).toContain("&lt;script&gt;");
    expect(e.html).toContain("Hemstäd &amp; fönster");
  });

  it("never turns a non-http link into an anchor", () => {
    const e = ownerQuoteAnswered({ bookingNumber: "NV-2026-00015", accepted: true, adminUrl: "javascript:alert(1)" });
    expect(e.html).not.toContain('href="javascript:');
  });

  it("helpers", () => {
    expect(displayDate("2026-10-20")).toBe("tisdag 20 oktober 2026");
    expect(displayDate("20 okt")).toBe("20 okt");
    expect(displayDate(null)).toBe("");
    expect(displayDateTime("not a date")).toBe("not a date");
    expect(displayTimeWindow("eftermiddag")).toBe("Eftermiddag");
    expect(displayTimeWindow(null)).toBe("");
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });
});

describe("sms templates", () => {
  it("are short, contain the link/number and no personnummer", () => {
    const texts = [
      requestReceivedSms({ bookingNumber: "NV-2026-00012" }),
      quoteSentSms({ bookingNumber: "NV-2026-00012", link: QUOTE_LINK, expiresAt: "2026-10-15T12:00:00Z" }),
      bookingConfirmedSms({ bookingNumber: "NV-2026-00012", scheduledDate: "2026-10-20", timeWindow: "formiddag" }),
      bookingConfirmedSms({ bookingNumber: "NV-2026-00012", scheduledDate: null, timeWindow: null }),
    ];
    for (const text of texts) {
      expect(text).not.toMatch(PNR);
      expect(text).not.toMatch(/\{\w+\}/);
      expect(text).toContain("NV-2026-00012");
    }
    expect(texts[1]).toContain(QUOTE_LINK);
    expect(texts[2]).toContain("förmiddag");
    expect(texts[3]).toContain("Vi hör av oss");
  });
});
