/**
 * Swedish strings for the request flow `/boka` and `/boka/klart` (Request flow area).
 * Placeholders use "{name}" and are filled with `fmt()` from `@/lib/i18n`.
 *
 * Rules: never write "halva priset" for ROT; RUT is "50 % på arbetskostnaden". Never call
 * RUT/ROT a loophole/kryphål/trick. There is no booking or service fee – "Ingen bokningsavgift".
 * Shared texts (price lines, legal boxes, housing types, eligibility reasons …) live in
 * `common.ts`; only flow-specific wording is here.
 */
const booking = {
  meta: {
    title: "Boka",
    description:
      "Berätta vad du behöver hjälp med på ett par minuter och se ett ungefärligt pris före och efter RUT- eller ROT-avdrag. Förfrågan är gratis och inte bindande. Ingen bokningsavgift.",
  },

  loading: "Laddar din förfrågan …",
  pageTitle: "Boka",

  nav: {
    continue: "Fortsätt",
    back: "Tillbaka",
    submit: "Skicka förfrågan",
    submitting: "Skickar förfrågan …",
    goToStep: "Gå till steg {step}",
  },

  errorSummaryTitle: "Något behöver fyllas i innan du kan gå vidare",

  steps: {
    category: {
      title: "Vad behöver du hjälp med?",
      lead: "Välj det som passar bäst. Märket visar om tjänsten ger RUT- eller ROT-avdrag.",
      listLabel: "Kategorier",
    },
    service: {
      title: "Vilken tjänst gäller det?",
      lead: "Du har valt {category}. Märket på varje tjänst visar vilket avdrag den ger.",
      listLabel: "Tjänster inom {category}",
      empty:
        "Just nu finns inga tjänster att boka här via webben. Ring oss så hjälper vi dig, eller gå tillbaka och välj något annat.",
      warningsLead: "Tryck på en rad för att läsa mer om vad som inte ger avdrag.",
    },
    home: {
      title: "Om bostaden",
      lead: "Några snabba frågor om bostaden, så blir priset mer rätt.",
      housingLegend: "Vilken typ av bostad är det?",
      sizeLegend: "Hur stor är bostaden?",
      sizeHint: "Ungefärlig boyta räcker.",
      sizeOptionalHint: "Ungefärlig boyta räcker. Du kan hoppa över frågan.",
      floorsLabel: "Antal våningar",
      floorsHint: "Räkna alla våningar där arbetet ska göras, även källare och vind.",
      floorsUnit: "våningar",
      petsLegend: "Finns det husdjur i bostaden?",
      petsHint: "Med husdjur tar arbetet ofta lite längre tid.",
      frequencyLegend: "Hur ofta vill du ha städning?",
      windowsLabel: "Antal fönster",
      windowsHint: "Ett ungefärligt antal räcker. Vi stämmer av i offerten.",
      windowsUnit: "fönster",
      appliancesLegend: "Vilka vitvaror gäller det?",
      appliancesHint: "Välj en eller flera.",
      addonsLegend: {
        flyttstad: "Vad ska ingå i flyttstädningen?",
        fonster: "Har fönstren spröjs?",
        default: "Vill du lägga till något?",
      },
      addonsHint: {
        flyttstad: "Ugn och kyl och frys ingår alltid. Välj det som gäller din bostad.",
        fonster: "Välj om fönstren har spröjs, för då tar putsningen längre tid.",
        default: "Välj det du vill ha med. Du kan hoppa över frågan.",
      },
      includedHint: "Ingår",
    },
    when: {
      title: "När?",
      lead: "Välj den dag som passar dig bäst. Vi bekräftar exakt tid i offerten.",
      dateLabel: "Vilken dag passar dig?",
      timeLegend: "Vilken tid på dagen passar?",
      inspectionLegend: "När är besiktningen?",
      inspectionHint: "Bra att veta om du har ett besiktningsdatum. Det är inte obligatoriskt.",
      inspectionKnown: "Jag vet datumet",
      inspectionUnknown: "Vet inte än",
      inspectionDateLabel: "Besiktningsdatum",
      flexibleLabel: "Jag är flexibel, välj billigaste tid",
      flexibleDescription:
        "Vi tar hänsyn till det när vi letar utförare. Det är ett önskemål, inte en rabatt.",
    },
    where: {
      title: "Var?",
      lead: "Vi hjälper dig i hela Sverige.",
      postcodeLabel: "Postnummer",
      postcodeHint: "Fem siffror, till exempel 632 20.",
    },
    eligibility: {
      title: "Har du rätt till avdraget?",
      lead: "Några korta frågor så att vi räknar med rätt avdrag. Du kan skicka förfrågan oavsett vad du svarar.",
      questions: {
        age18: "Är du minst 18 år i år?",
        taxSweden: "Betalar du skatt i Sverige?",
        rutResidence: "Bor du i bostaden, är det ditt fritidshus eller dina föräldrars hem?",
        rotOwner: "Äger du bostaden (lagfart eller bostadsrätt)?",
        rotBuildingOver5: "Är huset mer än 5 år gammalt?",
        buyerCount: "Hur många ska dela på avdraget?",
        usedThisYear: "Har du redan använt RUT/ROT i år?",
      },
      hints: {
        age18: "Det räcker att du fyller 18 under året.",
        taxSweden: "Avdraget dras av från skatt som du betalar i Sverige.",
        rutResidence: null,
        rotOwner: null,
        rotBuildingOver5:
          "Svarar du nej ger bara reparation och underhåll avdrag, inte om- eller tillbyggnad.",
        buyerCount:
          "Bor ni flera i bostaden kan ni dela på arbetskostnaden och få avdrag var för sig.",
        usedThisYear: null,
      },
      resultLabel: "Resultat",
      canStillSend: "Du kan ändå skicka förfrågan.",
    },
    summary: {
      title: "Ditt ungefärliga pris",
      lead: "Så här brukar det kosta. Exakt pris får du i offerten.",
      priceHeading: "Pris",
      headline: "Vanligtvis {price} efter {deduction}",
      headlineNoDeduction: "Vanligtvis {price}",
      noDeductionNote: "Pris utan avdrag",
      exactWithin24h: "Exakt pris inom 24 timmar.",
      noDeduction: "Inget avdrag",
      zeroKr: "0\u00a0kr",
      perVisit: "{price} per tillfälle",
      rateHour: "{price}/timme",
      rateM2: "{price}/m²",
      labourShareHint: "Avdraget räknas på {share} % av hela priset, eftersom den delen räknas som arbete.",
      quoteOnlyRut: "Vi tar fram ett pris åt dig inom 24 timmar.",
      windowsCount: "{count} fönster",
      ineligibleTitle: "Priset visas utan avdrag",
      legalHeading: "Bra att veta om avdraget",
      choicesHeading: "Det här har du valt",
      change: "Ändra",
      changeLabel: "Ändra {what}",
      choices: {
        service: "Tjänst",
        home: "Bostad",
        date: "Dag och tid",
        postcode: "Postnummer",
        deduction: "Avdrag",
      },
      deductionYes: "{deduction}. Du verkar ha rätt till det",
      deductionNo: "Inget avdrag enligt dina svar",
      flexible: "flexibel",
    },
    contact: {
      title: "Dina kontaktuppgifter",
      lead: "Vi skickar offerten till dig via mejl och SMS.",
      formLabel: "Kontaktuppgifter",
      name: "Namn",
      phone: "Mobilnummer",
      phoneHint: "Vi skickar offerten via SMS.",
      email: "E-post",
      street: "Gatuadress",
      streetHint: "Adressen där arbetet ska göras.",
      postcode: "Postnummer",
      city: "Ort",
      note: "Något mer vi bör veta?",
      noteHint:
        "Till exempel portkod, parkering eller något som är extra viktigt. Skriv inte ditt personnummer här. Vi frågar efter det först när du godkänner offerten.",
      termsLegend: "Villkor",
    },
  },

  warnings: {
    /** "Det här ger inte RUT-avdrag" */
    title: "Det här ger inte {deduction}",
  },

  /** Choices that are not in `common` (keys are stored in the request's `details`). */
  appliances: {
    tvattmaskin: "Tvättmaskin",
    torktumlare: "Torktumlare",
    diskmaskin: "Diskmaskin",
    kyl: "Kyl",
    frys: "Frys",
    ugn: "Ugn",
    spis: "Spis",
    koksflakt: "Köksfläkt",
  },

  /** Inline validation messages (steps 1–8). */
  errors: {
    categoryRequired: "Välj vad du behöver hjälp med.",
    serviceRequired: "Välj en tjänst.",
    housingRequired: "Välj typ av bostad.",
    sizeRequired: "Välj ungefär hur stor bostaden är.",
    floorsInvalid: "Välj mellan 1 och 5 våningar.",
    petsRequired: "Svara ja eller nej.",
    frequencyRequired: "Välj hur ofta du vill ha städning.",
    windowsInvalid: "Välj mellan 1 och 60 fönster.",
    appliancesRequired: "Välj minst en vitvara.",
    dateRequired: "Välj en dag i kalendern.",
    dateOutOfRange: "Välj en dag från och med i morgon och högst sex månader fram.",
    timeWindowRequired: "Välj en tid på dagen.",
    inspectionDateRequired: "Välj besiktningsdatum i kalendern, eller välj ”Vet inte än”.",
    postcodeInvalid: "Skriv postnumret med fem siffror, till exempel 632 20.",
    answerRequired: "Svara på frågan för att gå vidare.",
    nameRequired: "Skriv ditt för- och efternamn.",
    nameTooLong: "Namnet får vara högst 200 tecken.",
    phoneInvalid: "Skriv ett svenskt telefonnummer, till exempel 070-123 45 67.",
    emailInvalid: "Skriv en e-postadress, till exempel namn@exempel.se.",
    streetRequired: "Skriv gatuadressen där arbetet ska göras.",
    streetTooLong: "Adressen får vara högst 200 tecken.",
    cityRequired: "Skriv orten.",
    cityTooLong: "Orten får vara högst 100 tecken.",
    noteTooLong: "Texten får vara högst 2 000 tecken.",
    notePersonnummer:
      "Ta bort personnumret från texten. Vi frågar efter det först när du godkänner offerten.",
    termsRequired: "Du behöver godkänna villkoren och integritetspolicyn för att skicka förfrågan.",
  },

  /** Errors from the server action (mapped from the `submit_request` RPC). */
  submitErrors: {
    title: "Förfrågan kunde inte skickas",
    invalidForm: "Kontrollera uppgifterna i formuläret.",
    incomplete: "Några svar saknas i din förfrågan. Gå tillbaka till steg {step} och fyll i det som saknas.",
    rateLimited:
      "Du har skickat flera förfrågningar på kort tid. Vänta en stund och försök igen, eller ring oss på {phone}.",
    dateInPast: "Dagen du valde har redan passerat. Gå tillbaka till steg 4 och välj en ny dag.",
    unknownService:
      "Tjänsten du valde går inte att boka just nu. Gå tillbaka och välj en annan tjänst, eller ring oss på {phone}.",
    notConfigured:
      "Vi kan inte ta emot förfrågningar via webben just nu. Ring oss på {phone} så hjälper vi dig direkt.",
    generic: "Något gick fel när förfrågan skulle skickas. Försök igen, eller ring oss på {phone} så hjälper vi dig.",
  },

  done: {
    metaTitle: "Tack för din förfrågan",
    title: "Tack! Vi har fått din förfrågan",
    numberLabel: "Ditt förfrågningsnummer",
    numberHint: "Ange numret om du ringer eller mejlar oss.",
    body: "Vi återkommer med pris och tid inom 24 timmar via mejl och SMS.",
    nextTitle: "Så går det till nu",
    next: [
      "Vi letar upp ett bra och kontrollerat företag som kan göra jobbet när det passar dig.",
      "Inom 24 timmar får du en offert via mejl och SMS, med exakt pris före och efter avdrag.",
      "Inget är bokat förrän du har godkänt offerten. Passar den inte tackar du bara nej. Det kostar ingenting.",
    ],
    newRequest: "Skicka en ny förfrågan",
  },
} as const;

export default booking;
