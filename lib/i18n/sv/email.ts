/**
 * Swedish texts for emails and SMS (infra area). Rendered by `lib/email/templates.ts` and
 * `lib/sms/templates.ts`; placeholders use "{name}" and are filled with `fmt()`.
 *
 * Rules: never include personnummer, never "halva priset" for ROT, no booking/service fee
 * ("Ingen bokningsavgift"). Keep sentences short and warm – many readers are 65+.
 */
const email = {
  common: {
    greeting: "Hej {name}!",
    greetingNoName: "Hej!",
    signOff: "Vänliga hälsningar",
    signature: "Nordvra",
    questions: "Har du frågor? Ring oss på {phone} eller mejla {email}. Vi hjälper dig gärna.",
    customerFooter: "Du får det här mejlet eftersom du har gjort en förfrågan hos Nordvra.",
    ownerFooter: "Internt mejl från Nordvra.",
    bookingNumberLabel: "Ärendenummer",
    serviceLabel: "Tjänst",
    preferredDateLabel: "Önskat datum",
    scheduledDateLabel: "Datum",
    timeWindowLabel: "Tid",
    postcodeLabel: "Postnummer",
    dateToBeAgreed: "Vi bestämmer dag tillsammans med dig",
    timeWindows: {
      formiddag: "Förmiddag",
      eftermiddag: "Eftermiddag",
      flexibel: "Flexibel tid",
    },
  },

  requestReceived: {
    subject: "Vi har fått din förfrågan ({bookingNumber})",
    preheader: "Du får pris och tid från oss inom 24 timmar.",
    heading: "Tack för din förfrågan!",
    intro:
      "Vi har tagit emot din förfrågan om {serviceName} och letar nu upp ett bra företag som kan göra jobbet.",
    next:
      "Inom 24 timmar får du en offert via mejl och SMS med exakt pris och tid. Ingenting är bokat förrän du har godkänt offerten.",
    free: "Förfrågan är gratis och inte bindande. Ingen bokningsavgift.",
  },

  ownerNewRequest: {
    subject: "Ny förfrågan {bookingNumber}: {serviceName}",
    preheader: "En kund väntar på pris och tid inom 24 timmar.",
    heading: "Ny förfrågan",
    intro: "En ny förfrågan har kommit in. Kunden har lovats pris och tid inom 24 timmar.",
    button: "Öppna ärendet",
  },

  quoteSent: {
    subject: "Din offert för {serviceName} är klar ({bookingNumber})",
    preheader: "Se pris och tid och godkänn när du är redo.",
    heading: "Din offert är klar",
    intro:
      "Nu har vi tagit fram en offert för {serviceName}. Där ser du pris före och efter avdrag, när arbetet kan göras och vilket företag som utför det.",
    button: "Se och godkänn offerten",
    linkFallback: "Fungerar inte knappen? Kopiera länken till din webbläsare:",
    validUntil: "Länken gäller till {expiresAt}.",
    notBooked:
      "Ingenting är bokat förrän du har godkänt offerten med knappen ”Godkänn och boka”. Vill du inte gå vidare väljer du ”Nej tack”. Det kostar ingenting.",
    pnrNote:
      "När du godkänner fyller du i personnummer direkt på offertsidan, eftersom Skatteverket kräver det för avdraget. Skicka aldrig personnummer via mejl eller SMS.",
  },

  bookingConfirmed: {
    subject: "Din bokning är bekräftad ({bookingNumber})",
    preheader: "Här är en sammanfattning av din bokning.",
    heading: "Din bokning är bekräftad",
    intro: "Tack! Nu är {serviceName} bokat. Här är det viktigaste:",
    payment:
      "Du betalar fakturan med Swish eller banköverföring och måste själv vara den som betalar. Annars kan avdraget nekas.",
    change: "Behöver du ändra eller avboka? Ring oss så hjälper vi dig.",
  },

  ownerQuoteAnswered: {
    subjectAccepted: "Offert godkänd: {bookingNumber}",
    subjectDeclined: "Offert nekad: {bookingNumber}",
    preheaderAccepted: "Kunden har godkänt offerten.",
    preheaderDeclined: "Kunden har tackat nej till offerten.",
    headingAccepted: "Offerten är godkänd",
    headingDeclined: "Kunden tackade nej",
    introAccepted:
      "Kunden har godkänt offerten för {bookingNumber}. Bekräfta tiden med utföraren och skicka en bekräftelse till kunden.",
    introDeclined:
      "Kunden har tackat nej till offerten för {bookingNumber}. Läs eventuell kommentar i ärendet.",
    button: "Öppna ärendet",
  },

  ownerRedoRequested: {
    subject: "Omstädning begärd: {bookingNumber}",
    preheader: "Kunden har anmält omstädning enligt besiktningsgarantin.",
    heading: "Kunden vill ha omstädning",
    intro:
      "Kunden har anmält omstädning för {bookingNumber} enligt besiktningsgarantin. Kontakta kunden och utföraren i dag, så att städningen blir klar före besiktningen.",
    button: "Öppna ärendet",
  },

  ownerNewReview: {
    subject: "Nytt omdöme: {bookingNumber} ({rating} av 5)",
    preheader: "En kund har lämnat ett omdöme som väntar på granskning.",
    heading: "Nytt omdöme att granska",
    intro: "Kunden för {bookingNumber} har lämnat ett omdöme, {rating} av 5. Det syns inte på webbplatsen förrän du publicerar det.",
    button: "Granska omdömen",
  },

  reviewRequest: {
    subject: "Hur blev {service}?",
    preheader: "Berätta gärna hur det gick. Det tar en minut.",
    heading: "Hur blev det?",
    greeting: "Hej {name}!",
    intro: "Tack för att du bokade {service} via Nordvra. Vi vill gärna veta hur det gick. Ditt omdöme hjälper andra att välja, och oss att bli bättre.",
    button: "Lämna ett omdöme",
  },

  testEmail: {
    subject: "Testmejl från Nordvra",
    preheader: "E-posten fungerar.",
    heading: "E-posten fungerar",
    intro: "Det här är ett testmejl från adminsidan. Kommer det fram skickas bekräftelser, offerter och notiser till kunderna som de ska.",
  },

  reminder: {
    subject: "Dags för {service} igen?",
    preheader: "Du bad oss påminna dig. Boka på 2 minuter, ingen bokningsavgift.",
    heading: "Dags för {service} igen?",
    greeting: "Hej {name}!",
    intro:
      "Du bad oss påminna dig när det började bli dags för {service} igen. Vill du boka gör du det på ett par minuter, och du ser priset före och efter avdrag direkt.",
    stop: "Vill du inte ha fler påminnelser? Svara på det här mejlet så tar vi bort den.",
    button: "Boka igen",
  },

  sms: {
    requestReceived:
      "Nordvra: Tack för din förfrågan ({bookingNumber})! Du får pris och tid inom 24 timmar. Frågor? Ring {phone}.",
    quoteSent:
      "Nordvra: Din offert ({bookingNumber}) är klar. Se och godkänn den här: {link} Länken gäller till {expiresAt}. Inget är bokat förrän du godkänner.",
    bookingConfirmed:
      "Nordvra: Din bokning {bookingNumber} är bekräftad. {when} Frågor? Ring {phone}.",
    whenScheduled: "Datum: {date}.",
    whenScheduledWithTime: "Datum: {date}, {timeWindow}.",
    whenUnscheduled: "Vi hör av oss om dag och tid.",
    resident:
      "Nordvra: En anhörig har bokat {service} hos dig. {when} Företaget som kommer heter {partner}. Ingen ska ta betalt på plats eller sälja extra arbete. Frågor? Ring {phone}.",
    residentNoPartner:
      "Nordvra: En anhörig har bokat {service} hos dig. {when} Ingen ska ta betalt på plats eller sälja extra arbete. Frågor? Ring {phone}.",
  },
} as const;

export default email;
