/**
 * Swedish strings for the quote page `/offert/[token]` (quote area, SPEC §3, §5).
 * Placeholders use "{name}" and are filled with `fmt()` from `@/lib/i18n`.
 *
 * Rules: never write "halva priset" for ROT; there is no booking or service fee ("Ingen
 * bokningsavgift"); never call RUT/ROT a loophole/kryphål/trick. The legal box texts themselves
 * live in `t.common.legal` (verbatim from SPEC §5) and are reused here.
 */
const quote = {
  meta: {
    title: "Din offert",
    description: "Se priset före och efter avdrag och godkänn din bokning.",
  },

  loading: "Hämtar din offert …",

  header: {
    eyebrow: "Offert {bookingNumber}",
    title: "Din offert",
    greeting: "Hej {name}!",
    greetingNoName: "Hej!",
    intro:
      "Här är vårt pris för tjänsten {service}. Läs igenom offerten och godkänn den om allt stämmer. Inget är bokat förrän du har godkänt.",
    validUntil: "Offerten gäller till {date}.",
  },

  message: {
    title: "Meddelande från oss",
  },

  details: {
    title: "Det här bokar du",
    service: "Tjänst",
    address: "Adress",
    date: "Datum",
    time: "Tid på dagen",
    home: "Bostad",
    hours: "Beräknad tid",
    hoursOne: "cirka 1 timme",
    hoursMany: "cirka {hours} timmar",
    dateToBeAgreed: "Vi bestämmer datum tillsammans med dig",
    bookingNumber: "Bokningsnummer",
    status: "Status",
  },

  price: {
    title: "Pris",
    headlineAfter: "Du betalar {amount} efter {deduction}",
    headlineNoDeduction: "Du betalar {amount}",
    labour: "Arbetskostnad (före avdrag)",
    material: "Material",
    travel: "Resor",
    total: "Pris före avdrag",
    deductionHint: "Dras av direkt på fakturan.",
    shareOfTotalHint: "För den här tjänsten räknas {pct} % av hela priset som arbetskostnad.",
    cappedHint: "Avdraget är begränsat av taket per person och år.",
    noBookingFee: "Ingen bokningsavgift",
    zero: "0\u00a0kr",
    toPay: "Att betala",
    inclVat: "Alla priser är inklusive moms.",
    buyersNote:
      "Avdraget är beräknat för {count} köpare som delar lika. Ändrar ni fördelningen ser ni det nya avdraget per person i formuläret nedan.",
  },

  eligibility: {
    notEligibleTitle: "Priset är utan avdrag",
    notEligibleIntro:
      "Utifrån dina svar i förfrågan ser det ut som att du inte kan få {deduction} för det här jobbet:",
    callIfWrong:
      "Tror du att du ändå har rätt till avdraget? Ring oss på {phone} innan du godkänner, så går vi igenom det tillsammans.",
  },

  counterparty: {
    subcontractor: "Arbetet utförs av vår underleverantör {partner}.",
    sellerInvoice:
      "Nordvra skickar fakturan, tar emot betalningen och ansöker om {deduction} hos Skatteverket.",
    sellerInvoiceNoDeduction: "Nordvra skickar fakturan och tar emot betalningen.",
    agentInvoice:
      "{partner} skickar fakturan, tar emot betalningen och ansöker om {deduction} hos Skatteverket.",
    agentInvoiceNoDeduction: "{partner} skickar fakturan och tar emot betalningen.",
    agentComplaint:
      "Har du klagomål på arbetet vänder du dig till {partner}. Du har reklamationsrätt enligt konsumenttjänstlagen i 3 år, och vi hjälper dig gärna.",
    partnerFallback: "partnerföretaget",
    orgNrMissing: "uppges i bekräftelsen",
  },

  legal: {
    title: "Bra att veta innan du godkänner",
  },

  form: {
    title: "Godkänn offerten",
    intro: "Fyll i uppgifterna nedan. När du trycker på ”Godkänn och boka” blir bokningen bindande.",
    buyersTitle: "Vem eller vilka köper tjänsten?",
    buyersHint:
      "Alla som ska dela på avdraget behöver stå som köpare och själva betala sin andel. Ni kan vara upp till 4 köpare.",
    buyersHintNoDeduction: "Skriv in den eller de som köper tjänsten.",
    buyerLegend: "Köpare {n}",
    name: "För- och efternamn",
    pnr: "Personnummer",
    pnrHint: "12 siffror, till exempel ÅÅÅÅMMDD-NNNN.",
    share: "Andel",
    shareHint: "Hur stor del av jobbet personen betalar och får avdrag för.",
    shareSuffix: "%",
    removeBuyer: "Ta bort köpare {n}",
    addBuyer: "Lägg till köpare",
    evenSplit: "Dela lika",
    maxBuyers: "Ni kan vara högst 4 köpare.",
    sharesTotal: "Summa andelar: {sum} %",
    sharesOff: "andelarna måste bli 100 % tillsammans.",
    buyerAdded: "Köpare {n} är tillagd. Andelarna är fördelade lika.",
    buyerRemoved: "Köparen är borttagen. Andelarna är fördelade lika.",
    sharesReset: "Andelarna är fördelade lika.",
    preview: {
      title: "Avdrag per köpare",
      buyerFallback: "Köpare {n}",
      share: "{share} % av jobbet",
      capped: "Begränsat av taket för avdraget",
      under18: "Inget avdrag, fyller inte 18 år i år",
      totalDeduction: "Totalt avdrag",
      toPay: "Att betala",
      invalid: "Avdraget per köpare visas när andelarna blir 100 % tillsammans.",
    },
    property: {
      title: "Uppgifter om bostaden",
      hint: "Skatteverket behöver de här uppgifterna för ROT-avdraget.",
      fastighetsbeteckning: "Fastighetsbeteckning",
      fastighetsbeteckningHint:
        "Till exempel ”Nacka Sicklaön 123:4”. Den står på lagfartsbeviset och finns hos Lantmäteriet.",
      brfOrgNr: "Bostadsrättsföreningens organisationsnummer",
      brfOrgNrHint: "10 siffror, NNNNNN-NNNN. Det står på avgiftsavin eller i föreningens årsredovisning.",
      lagenhetsnummer: "Lägenhetsnummer",
      lagenhetsnummerHint:
        "Föreningens nummer på lägenheten, ofta fyra siffror. Det står på avgiftsavin eller i ditt upplåtelseavtal.",
    },
    consentsTitle: "Bekräfta och boka",
    withdrawalWaiverHint: "Arbetet är planerat inom 14 dagar, alltså inom ångerfristen.",
    approve: "Godkänn och boka",
    approving: "Bokar …",
    decline: "Nej tack",
    binding: "När du trycker på ”Godkänn och boka” är bokningen bindande.",
    errorSummaryTitle: "Något behöver rättas innan du kan boka",
  },

  errors: {
    nameRequired: "Skriv köparens för- och efternamn.",
    nameFull: "Skriv både för- och efternamn.",
    nameTooLong: "Namnet får vara högst 100 tecken.",
    pnrRequired: "Skriv köparens personnummer.",
    pnrFormat: "Skriv personnumret med 12 siffror: ÅÅÅÅMMDD-NNNN.",
    pnrDate: "Födelsedatumet i personnumret finns inte. Kontrollera siffrorna.",
    pnrChecksum: "Personnumret stämmer inte. Kontrollera de fyra sista siffrorna.",
    pnrDuplicate: "Samma personnummer finns redan hos köpare {n}.",
    shareRequired: "Skriv en andel mellan 1 och 100 %.",
    shareRange: "Andelen måste vara ett heltal mellan 1 och 100 %.",
    sharesTotal: "Andelarna måste bli 100 % tillsammans. Nu blir de {sum} %.",
    buyersCount: "Ni kan vara mellan 1 och 4 köpare.",
    fastighetRequired: "Skriv fastighetsbeteckningen.",
    fastighetFormat:
      "Skriv fastighetsbeteckningen som kommun, område och nummer, till exempel ”Nacka Sicklaön 123:4”.",
    brfRequired: "Skriv föreningens organisationsnummer.",
    brfInvalid: "Organisationsnumret stämmer inte. Det ska vara 10 siffror: NNNNNN-NNNN.",
    lagenhetRequired: "Skriv lägenhetsnumret.",
    lagenhetInvalid: "Lägenhetsnumret får bara innehålla siffror och bokstäver, högst 10 tecken.",
    deductionConsent: "Bekräfta att du förstår att avdraget inte är garanterat.",
    waiverConsent: "Arbetet är planerat inom 14 dagar. Bekräfta att det får påbörjas inom ångerfristen.",
    termsConsent: "Du behöver godkänna villkoren och integritetspolicyn.",
  },

  warnings: {
    under18:
      "Personen fyller inte 18 år i år och kan därför inte få {deduction}. Ni kan ändå boka, men den här delen av jobbet blir utan avdrag.",
  },

  /** Messages for errors from the accept_quote / decline_quote RPCs (and the action itself). */
  submitErrors: {
    invalidForm: "Något behöver rättas innan du kan boka. Se markeringarna nedan.",
    notFound: "Vi hittar inte offerten. Ring oss på {phone} så hjälper vi dig.",
    expired: "Offerten har gått ut. Ring oss på {phone} så tar vi fram en ny.",
    notOpen: "Offerten går inte längre att svara på. Ring oss på {phone} om du har frågor.",
    invalidBuyers: "Kontrollera uppgifterna om köparna och försök igen.",
    invalidShares: "Andelarna måste bli 100 % tillsammans.",
    missingConsent: "Bekräfta alla rutor innan du bokar.",
    missingWaiver: "Arbetet är planerat inom 14 dagar. Bekräfta att det får påbörjas inom ångerfristen.",
    missingProperty: "Fyll i uppgifterna om bostaden.",
    generic:
      "Något gick fel och bokningen är inte klar. Försök igen, eller ring oss på {phone} så hjälper vi dig.",
    declineGeneric:
      "Något gick fel och vi kunde inte spara ditt svar. Försök igen, eller ring oss på {phone}.",
    notConfigured:
      "Det går inte att svara på offerten via webben just nu. Ring oss på {phone} så hjälper vi dig.",
  },

  decline: {
    title: "Vill du tacka nej till offerten?",
    body: "Det är helt i sin ordning. Berätta gärna varför. Det hjälper oss att bli bättre.",
    reasonsLegend: "Varför tackar du nej?",
    reasonsHint: "Valfritt. Du kan välja flera.",
    reasons: {
      too_expensive: "För dyrt",
      wrong_time: "Fel tid",
      found_other: "Har hittat annan lösning",
      other: "Annat",
    },
    otherLabel: "Berätta gärna mer",
    otherHint: "Skriv inte personnummer eller andra känsliga uppgifter här.",
    confirm: "Ja, tacka nej",
    confirming: "Skickar …",
    cancel: "Nej, gå tillbaka",
  },

  states: {
    newRequest: "Gör en ny förfrågan",
    notFound: {
      title: "Vi hittar inte offerten",
      body: "Länken kan vara felskriven eller ofullständig. Kopiera hela länken från mejlet eller sms:et, eller ring oss så hjälper vi dig.",
    },
    unavailable: {
      title: "Offerten kan inte visas just nu",
      body: "Något gick fel när vi hämtade offerten. Försök igen om en stund, eller ring oss så hjälper vi dig.",
    },
    expired: {
      title: "Offerten har gått ut",
      body: "Offerten gällde till {date}. Ring oss så tar vi fram en ny offert, eller skicka en ny förfrågan.",
      bodyNoDate: "Tiden för att godkänna offerten har gått ut. Ring oss så tar vi fram en ny offert, eller skicka en ny förfrågan.",
    },
    approved: {
      title: "Tack! Din bokning är klar",
      body: "Du har godkänt offerten och bokningen är bindande. Vi bekräftar bokningen via e-post och hör av oss innan arbetet börjar.",
      approvedAt: "Godkänd {date}",
      summaryTitle: "Din bokning",
    },
    declined: {
      title: "Du har tackat nej till offerten",
      body: "Tack för att du svarade. Inget är bokat och du betalar ingenting. Har du ändrat dig eller vill du ha en ny offert? Ring oss eller skicka en ny förfrågan.",
    },
    cancelled: {
      title: "Bokningen är avbokad",
      body: "Den här bokningen är avbokad. Har du frågor? Ring oss så hjälper vi dig.",
    },
    notReady: {
      title: "Offerten är inte klar än",
      body: "Vi håller på med din offert. Du får ett mejl och ett sms när den är klar. Ring oss gärna om du har frågor.",
    },
  },
} as const;

export default quote;
