/**
 * Shared Swedish strings used across the whole site (UI foundation area).
 * Placeholders use "{name}" and are filled with `fmt()` from `@/lib/i18n`.
 *
 * Rules: never write "halva priset" for ROT; write "50 % på arbetskostnaden" for RUT. Never
 * call RUT/ROT a loophole/kryphål/trick. There is no booking or service fee – say
 * "Ingen bokningsavgift".
 */
const common = {
  brand: {
    name: "Nordvra",
    tagline:
      "Vi hittar ett bra företag, du slipper jämföra offerter, och vi hjälper dig med RUT/ROT-avdraget.",
  },

  skipLink: "Hoppa till innehållet",

  nav: {
    label: "Huvudmeny",
    howItWorks: "Så fungerar det",
    faq: "Vanliga frågor",
    contact: "Kontakt",
    book: "Boka",
    menu: "Meny",
  },

  footer: {
    navLabel: "Sidor på Nordvra",
    servicesHeading: "Boka och läs mer",
    legalHeading: "Villkor och integritet",
    companyHeading: "Företaget bakom Nordvra",
    contactHeading: "Kontakt",
    links: {
      home: "Startsidan",
      book: "Boka en tjänst",
      howItWorks: "Så fungerar RUT och ROT",
      notDeductible: "Vad ger inte avdrag?",
      faq: "Vanliga frågor",
      about: "Om oss",
      contact: "Kontakt",
      terms: "Villkor",
      privacy: "Integritetspolicy",
      cookies: "Cookies",
    },
    companyIntro:
      "Nordvra finns i {hometown}. Vi hjälper kunder i hela Sverige tillsammans med noga utvalda partnerföretag.",
    /** "Stockholm – vi hjälper dig i hela Sverige" */
    location: "{hometown} – vi hjälper dig i hela Sverige",
    fSkatt: "Godkänd för F-skatt",
    insured: "Försäkrade hos If",
    noBookingFee: "Ingen bokningsavgift",
    orgNr: "Org.nr: {orgNr}",
    address: "Adress: {address}",
    phone: "Telefon: {phone}",
    email: "E-post: {email}",
    pending: "(fylls i före lansering)",
    copyright: "© Nordvra",
  },

  phone: {
    /** Short CTA, e.g. above the step navigation. */
    cta: "Hellre ringa? Ring oss",
    /** Full CTA sentence – must be visible on every customer page. */
    ctaWithNumber: "Hellre ringa? Ring oss på {phone}",
    /** Accessible name of the header phone button (its visible text is the number). */
    headerButtonLabel: "Ring oss på {phone}",
    /** "Hellre ringa?" – first half of the CTA. */
    cardTitle: "Hellre ringa?",
    /** "Ring oss på 076-113 43 84" – second half of the CTA (link text). */
    callUsOn: "Ring oss på {phone}",
    cardBody:
      "Du kan boka hela tjänsten per telefon. Vi svarar på dina frågor och fyller i förfrågan åt dig.",
    emailLead: "Du kan också mejla oss på",
  },

  actions: {
    continue: "Fortsätt",
    back: "Tillbaka",
    next: "Nästa",
    previous: "Föregående",
    send: "Skicka",
    save: "Spara",
    saving: "Sparar …",
    sending: "Skickar …",
    loading: "Laddar …",
    cancel: "Avbryt",
    close: "Stäng",
    change: "Ändra",
    remove: "Ta bort",
    add: "Lägg till",
    readMore: "Läs mer",
    bookNow: "Boka nu",
    bookInTwoMinutes: "Boka på 2 minuter",
    startOver: "Börja om",
    tryAgain: "Försök igen",
    copy: "Kopiera",
    copied: "Kopierat",
    understood: "Jag förstår",
    toHome: "Till startsidan",
  },

  answers: {
    yes: "Ja",
    no: "Nej",
    dontKnow: "Vet inte",
  },

  badges: {
    /** "RUT 50 %" – rate comes from CURRENT_RULES. */
    rut: "RUT {rate} %",
    rot: "ROT {rate} %",
    /** Screen-reader version of the badge. */
    rutLong: "RUT-avdrag {rate} % på arbetskostnaden",
    rotLong: "ROT-avdrag {rate} % på arbetskostnaden",
    noBookingFee: "Ingen bokningsavgift",
    included: "Ingår",
    free: "Gratis",
    notBinding: "Inte bindande",
    legalDraft: "Utkast",
  },

  deduction: {
    rut: "RUT",
    rot: "ROT",
    rutDeduction: "RUT-avdrag",
    rotDeduction: "ROT-avdrag",
    rutAndRot: "RUT och ROT",
    /** "RUT-avdrag 50 %" */
    deductionWithRate: "{type}-avdrag {rate} %",
    rutExplainer: "RUT-avdraget är {rate} % på arbetskostnaden för t.ex. städning, flytt och trädgård.",
    rotExplainer:
      "ROT-avdraget är {rate} % på arbetskostnaden för reparation, underhåll och ombyggnad av din bostad.",
  },

  price: {
    usually: "vanligtvis",
    usuallyRange: "Vanligtvis {range}",
    afterDeduction: "efter {type}-avdrag",
    beforeDeduction: "före avdrag",
    labour: "Arbetskostnad",
    labourBeforeDeduction: "Arbetskostnad (före avdrag)",
    material: "Material",
    travel: "Resor",
    materialAndTravel: "Material / resor",
    materialAndTravelLater: "Tillkommer vid behov – visas i offerten",
    deduction: "{type}-avdrag {rate} %",
    noBookingFee: "Ingen bokningsavgift",
    toPay: "Att betala",
    total: "Totalt",
    priceBefore: "Pris före avdrag",
    priceAfter: "Pris efter avdrag",
    perHour: "kr/timme",
    perM2: "kr/m²",
    perWindow: "per fönster",
    perVisit: "per tillfälle",
    preliminary: "Priset är preliminärt. Vi bekräftar exakt pris och tid inom 24 timmar.",
    quoteFromPartner: "Pris efter offert från partnerföretag, oftast inom 48 h",
    inclVat: "Alla priser är inklusive moms.",
    minus: "minus",
  },

  /** Plain-Swedish legal info boxes (SPEC §5). Body texts are verbatim from the spec. */
  legal: {
    notGuaranteed: {
      title: "Avdraget är inte garanterat",
      body: "RUT/ROT-avdraget förutsätter att du har rätt till det. Om Skatteverket nekar helt eller delvis (t.ex. för att du har för lite skatt eller redan använt ditt tak) betalar du mellanskillnaden.",
      checkbox:
        "Jag förstår att avdraget inte är garanterat och att jag betalar mellanskillnaden om Skatteverket nekar helt eller delvis.",
    },
    labourOnly: {
      title: "Bara arbetskostnad",
      body: "Avdraget gäller bara arbetskostnaden – inte material eller resor.",
    },
    rates: {
      title: "Så mycket är avdraget",
      body: "RUT-avdraget är {rutRate} % på arbetskostnaden. ROT-avdraget är {rotRate} % på arbetskostnaden.",
    },
    cap: {
      title: "Tak för avdraget",
      body: "Max 75 000 kr per person och år för RUT och ROT tillsammans, varav max 50 000 kr för ROT.",
    },
    payment: {
      title: "Betalning",
      body: "Du måste betala elektroniskt (kort, Swish eller överföring) och själv vara den som betalar.",
    },
    withdrawal: {
      title: "Ångerrätt",
      body: "Du har 14 dagars ångerrätt.",
      waiverCheckbox:
        "Jag vill att arbetet påbörjas inom ångerfristen och förstår att jag betalar för utfört arbete om jag ångrar mig.",
    },
    personnummer: {
      title: "Därför behöver vi ditt personnummer",
      body: "Vi behöver ditt personnummer eftersom lagen kräver det när avdraget begärs från Skatteverket. Vi delar det bara med företaget som utför arbetet.",
      privacyLink: "Läs mer i vår integritetspolicy",
    },
    counterparty: {
      title: "Avtalspart och reklamation",
      seller: "Avtalspart: {legalName}",
      agent: "Avtalspart: {partner} (org.nr {orgNr}), förmedlat av Nordvra",
      complaint: "Du har reklamationsrätt enligt konsumenttjänstlagen i 3 år.",
    },
    terms: {
      /** Checkbox label is built as: before + [termsLink] + and + [privacyLink] + after. */
      checkboxBefore: "Jag godkänner ",
      termsLink: "villkoren",
      checkboxAnd: " och ",
      privacyLink: "integritetspolicyn",
      checkboxAfter: ".",
      checkboxPlain: "Jag godkänner villkoren och integritetspolicyn.",
    },
    requestFree: "Förfrågan är gratis och inte bindande. Du får en offert som du godkänner innan något bokas.",
    reviewBanner: "Ska granskas av jurist/skatterådgivare före lansering.",
  },

  /** Swedish labels for `booking_status`. */
  status: {
    ny_forfragan: "Ny förfrågan",
    soker_utforare: "Söker utförare",
    offert_skickad: "Offert skickad",
    godkand: "Godkänd",
    utford: "Utförd",
    betald: "Betald",
    rut_rot_begard: "RUT/ROT begärd",
    avslutad: "Avslutad",
    nekad: "Nekad",
    avbokad: "Avbokad",
    offert_utgangen: "Offert utgången",
  },

  housing: {
    hyresratt: "Hyreslägenhet",
    bostadsratt: "Bostadsrätt",
    villa: "Villa eller radhus",
    fritidshus: "Fritidshus",
    foraldrar: "Mina föräldrars hem",
  },

  housingHints: {
    foraldrar: "Bara RUT",
  },

  sizeBands: {
    "0-39": "0–39 m²",
    "40-59": "40–59 m²",
    "60-79": "60–79 m²",
    "80-99": "80–99 m²",
    "100-129": "100–129 m²",
    "130-159": "130–159 m²",
    "160+": "160 m² eller mer",
  },

  timeWindows: {
    formiddag: "Förmiddag",
    eftermiddag: "Eftermiddag",
    flexibel: "Flexibel",
  },

  frequencies: {
    en_gang: "En gång",
    varje_vecka: "Varje vecka",
    varannan_vecka: "Varannan vecka",
    var_fjarde_vecka: "Var fjärde vecka",
  },

  pricingUnits: {
    job: "för hela jobbet",
    visit: "per tillfälle",
    hour: "kr/timme",
    window: "per fönster",
    m2: "kr/m²",
  },

  buyerCount: {
    1: "1 person",
    2: "2 personer",
    3: "3 eller fler",
  },

  usedThisYear: {
    ja: "Ja",
    nej: "Nej",
    vet_inte: "Vet inte",
  },

  eligibility: {
    /** Why the deduction does not apply (`IneligibleReason` in lib/eligibility.ts). */
    reasons: {
      under18:
        "Du behöver fylla minst 18 år i år för att få RUT- eller ROT-avdrag. Du kan ändå boka – priset blir då utan avdrag.",
      noSwedishTax:
        "Avdraget räknas av från skatt som du betalar i Sverige. Om du inte betalar skatt här kan du inte få avdraget, men du kan ändå boka till priset utan avdrag.",
      rutNotResidence:
        "RUT-avdrag gäller arbete i bostaden där du bor, i ditt fritidshus eller i dina föräldrars hem. För andra bostäder visar vi priset utan avdrag.",
      rotRental:
        "ROT-avdrag gäller inte arbete i en hyreslägenhet, eftersom du inte äger bostaden. Vi visar priset utan avdrag.",
      rotParentsHome:
        "ROT-avdrag gäller bara en bostad som du själv äger. Arbete i dina föräldrars hem kan ge RUT-avdrag, men inte ROT-avdrag.",
      rotNotOwner:
        "För ROT-avdrag behöver du äga bostaden – med lagfart på huset eller som medlem i bostadsrättsföreningen. Vi visar priset utan avdrag.",
      rotNewBuilding:
        "Om- och tillbyggnad ger bara ROT-avdrag om huset är mer än 5 år gammalt. Reparation och underhåll ger avdrag oavsett hur gammalt huset är.",
    },
    /** Good to know even when the deduction applies (`EligibilityWarning`). */
    warnings: {
      rotRepairOnly:
        "Eftersom huset inte är mer än 5 år gammalt ger bara reparation och underhåll ROT-avdrag – inte om- eller tillbyggnad. Vi stämmer av vad som gäller för ditt jobb i offerten.",
      usedThisYear:
        "Du har redan använt RUT eller ROT i år. Taket är 75 000 kr per person och år, varav max 50 000 kr för ROT. Om taket tar slut betalar du mellanskillnaden.",
      checkRemaining:
        "Du kan se hur mycket avdrag du har kvar i år på Skatteverkets Mina sidor. Om taket redan är nått betalar du mellanskillnaden.",
    },
    eligibleTitle: "Det ser ut som att du har rätt till avdraget",
    notEligibleTitle: "Det ser ut som att du inte kan få avdraget",
    notEligibleBody:
      "Det gör inget – du kan fortfarande skicka din förfrågan. Vi visar priset utan avdrag.",
    warningsTitle: "Bra att veta",
    skatteverketLink: "Kolla hur mycket du har kvar på Skatteverkets Mina sidor",
    skatteverketUrl: "https://www.skatteverket.se",
  },

  form: {
    optional: "(valfritt)",
    required: "Obligatoriskt",
    errorPrefix: "Fel:",
    errorSummaryTitle: "Något behöver rättas innan du kan gå vidare",
    charactersLeft: "{count} tecken kvar",
  },

  stepper: {
    decrease: "Minska {label}",
    increase: "Öka {label}",
    announce: "{label}: {value}",
  },

  calendar: {
    previousMonth: "Föregående månad",
    nextMonth: "Nästa månad",
    unavailable: "går inte att välja",
    selected: "vald",
    today: "i dag",
    instructions:
      "Använd piltangenterna för att byta dag, Page Up och Page Down för att byta månad. Tryck Enter för att välja.",
    noDateSelected: "Inget datum valt",
    selectedDate: "Valt datum: {date}",
  },

  progress: {
    step: "Steg {step} av {total}",
  },

  warningChip: {
    prefix: "Ger inte avdrag:",
    linkHint: "Läs mer om vad som inte ger avdrag",
  },

  cookies: {
    label: "Om cookies",
    text: "Vi använder bara nödvändiga cookies – de som behövs för att webbplatsen ska fungera.",
    link: "Läs mer om cookies",
    accept: "Jag förstår",
  },

  external: {
    newTab: "(öppnas i en ny flik)",
  },

  company: {
    fSkatt: "Godkänd för F-skatt",
    insured: "Försäkrade hos If",
    coverage: "Hela Sverige",
    based: "{legalName} i {hometown}",
    pending: "(fylls i före lansering)",
  },

  errors: {
    generic: "Något gick fel. Försök igen, eller ring oss på {phone} så hjälper vi dig.",
    network: "Vi kunde inte nå servern. Kontrollera din uppkoppling och försök igen.",
  },
} as const;

export default common;
