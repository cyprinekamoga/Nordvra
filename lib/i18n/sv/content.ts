/**
 * Swedish strings for the content pages and the homepage (Content area, SPEC §5, §12, §13).
 *
 * Rates and caps are NEVER written as numbers here: use the placeholders below and fill them
 * with `fmt(text, taxFactVars())` from `@/lib/content/facts` (derived from lib/taxRules.ts).
 *   {rutRate} "50 %"   {rotRate} "30 %"   {combinedCap} "75 000 kr"   {rotCap} "50 000 kr"
 *   {rutCap}  {minimumAge} 18   {rotYears} 5   {year} 2026
 * Long texts (FAQ, Villkor, Integritetspolicy) live in lib/content/faq.ts and lib/content/legal.ts.
 *
 * Rules: never "halva priset" for ROT; never "kryphål"/"trick"; there is no booking or service
 * fee – say "Ingen bokningsavgift".
 */
const content = {
  meta: {
    home: {
      title: "Nordvra | Vi bokar städning och hantverkare åt dig, med RUT- och ROT-avdrag",
      description:
        "Boka städning, flytthjälp och hantverkare på två minuter. Se priset före och efter RUT- och ROT-avdrag direkt. Vi väljer och kontrollerar företaget. Ingen bokningsavgift.",
    },
    howItWorks: {
      title: "Så fungerar RUT och ROT",
      description:
        "RUT-avdraget är {rutRate} och ROT-avdraget {rotRate} på arbetskostnaden. Läs om tak, vem som har rätt till avdraget, betalning och hur vi sköter ansökan åt dig.",
    },
    checklist: {
      title: "Checklista inför besiktningen",
      description:
        "Det här brukar besiktningen kontrollera efter en flyttstädning, rum för rum. Med Nordvras besiktningsgaranti städar vi om utan kostnad om något blir underkänt.",
    },
    notDeductible: {
      title: "Vad ger inte avdrag?",
      description:
        "Vanliga saker som inte ger RUT- eller ROT-avdrag, till exempel material, resor, byggstädning och nybyggnation.",
    },
    faq: {
      title: "Vanliga frågor",
      description:
        "Svar på vanliga frågor om pris, bokning, RUT- och ROT-avdrag, personnummer, ångerrätt och reklamation.",
    },
    about: {
      title: "Om oss",
      description:
        "Nordvra finns i Stockholm. Vi bokar städning och hantverkare åt dig i hela Sverige, med RUT- och ROT-avdrag.",
    },
    contact: {
      title: "Kontakt",
      description: "Ring oss eller mejla, så hjälper vi dig att boka och svarar på frågor om RUT och ROT.",
    },
    terms: {
      title: "Villkor",
      description:
        "Villkor för förfrågan, offert och bokning via Nordvra: avtalspart, pris, avdrag, betalning, ångerrätt, avbokning och reklamation.",
    },
    privacy: {
      title: "Integritetspolicy",
      description:
        "Så behandlar vi dina personuppgifter och ditt personnummer, hur länge vi sparar dem, dina rättigheter och vilka cookies vi använder.",
    },
    notFound: {
      title: "Sidan finns inte",
    },
  },

  shared: {
    onThisPage: "På den här sidan",
    readMore: "Läs mer",
    skatteverketLink: "Läs mer hos Skatteverket",
    skatteverketUrl: "https://www.skatteverket.se",
    rulesSource: "Reglerna gäller {year}. Källa: {source}.",
    bookCtaTitle: "Vill du boka?",
    bookCtaBody: "Det tar ungefär två minuter. Förfrågan är gratis och inte bindande.",
  },

  home: {
    hero: {
      /** Big headline; the part in `titleMark` gets the hand-drawn underline. */
      titleStart: "Hjälp hemma, ",
      titleMark: "utan krångel.",
      lead: "Klicka i vad du behöver, se priset {strong} på en gång och låt oss hitta ett kontrollerat företag. Det kostar inget att fråga.",
      leadStrong: "före och efter RUT- och ROT-avdrag",
      searchLabel: "Vad ska göras?",
      searchPlaceholder: "T.ex. målning",
      searchNoResults: "Vi hittade inget som matchar. Bläddra bland alla tjänster i stället.",
      searchAll: "Se alla tjänster",
      searchCount: "{count} tjänster hittades",
      searchCountOne: "1 tjänst hittades",
      trust: ["Ingen bokningsavgift", "Pris inom 24 timmar", "Kontrollerade företag"],
      benefitsTitle: "Det här får du hos oss",
      benefits: [
        "Du klickar dig fram utan att skriva någon text",
        "Pris före och efter avdrag direkt",
        "Vi kollar om du har rätt till avdraget",
        "Vi väljer och kontrollerar företaget",
        "Hjälp på telefon hela vägen",
        "Ingen bokningsavgift",
      ],
    },
    steps: {
      title: "Så enkelt är det",
      items: [
        {
          title: "Välj tjänst",
          body: "Klicka på det du behöver hjälp med, till exempel städning, flytt eller målning. Svara på några korta frågor om bostaden.",
        },
        {
          title: "Välj tid",
          body: "Välj en dag som passar dig, och förmiddag eller eftermiddag. Du ser direkt ungefär vad det kostar.",
        },
        {
          title: "Vi fixar resten",
          body: "Vi hittar ett bra företag och skickar en offert inom 24 timmar. När du har godkänt den sköter vi resten, även avdraget.",
        },
      ],
      stepLabel: "Steg {n}",
      lead: "Från förfrågan till färdigt jobb. Du klickar, vi sköter resten.",
      /** Booking-form cards beside the scrollytelling steps (decoration; the step text says the same). */
      visual: {
        chipsTitle: "Vad behöver du hjälp med?",
        chips: ["Städning", "Flytt", "Måla & tapetsera"],
        pricePay: "Du betalar {price}",
        priceNote: "efter RUT-avdrag",
        quote: "Offert inom 24 timmar",
        invoice: "Avdraget dras på fakturan",
      },
    },
    services: {
      eyebrow: "Tjänster",
      title: "Hjälp i hemmet, från golv till tak",
      items: [
        { title: "Städning", body: "Hemstädning, storstädning, flyttstädning och fönsterputs." },
        { title: "Flytthjälp", body: "Packning, bärhjälp och montering av möbler." },
        { title: "Måla & tapetsera", body: "Väggar, tak, dörrar och köksluckor." },
        { title: "Snickeri", body: "Golv, dörrar, trappor och garderober." },
      ],
      cardCta: "Se pris och boka",
      all: "Se alla tjänster",
    },
    about: {
      eyebrow: "Om Nordvra",
      title: "Från Stockholm, för hela Sverige",
      link: "Läs mer om oss",
    },
    movingDay: {
      title: "En flyttdag med Nordvra",
      lead: "Så kan det se ut när du bokar både flytthjälp och flyttstädning. Ett exempel, timme för timme.",
      tabsLabel: "Flyttdagen timme för timme",
      chapters: [
        {
          time: "08:00",
          title: "Bärarna kommer",
          body: "Flyttfirman bär, lastar och kör till din nya bostad. Du visar vad som ska med, de lyfter.",
        },
        {
          time: "13:00",
          title: "Flyttstädningen börjar",
          body: "När bostaden är tom tar städarna över. De gör kök, badrum, fönster och golv enligt checklistan.",
        },
        {
          time: "17:00",
          title: "Nycklarna lämnas",
          body: "Du lämnar över en ren bostad. RUT-avdraget är redan draget på fakturan, så du betalar bara din del.",
        },
      ],
      note: "Det här är ett exempel. Du väljer själv dag och tid när du bokar.",
      cta: "Boka flytt eller städning",
    },
    didYouKnow: {
      title: "Visste du att…",
      lead: "Med RUT- och ROT-avdraget betalar du mindre för hjälp i hemmet. Avdraget dras direkt på fakturan, så du behöver inte ansöka själv.",
      rutTitle: "RUT-avdrag: {rutRate} på arbetskostnaden",
      rutBody:
        "För städning, flytt, fönsterputs, trädgård och snöskottning, hjälp med IT och vitvaror, barnpassning och omsorg.",
      rotTitle: "ROT-avdrag: {rotRate} på arbetskostnaden",
      rotBody: "För reparation, underhåll och ombyggnad, till exempel målning, badrum, kök, el, VVS och tak.",
      exampleNote: "Avdraget gäller bara arbetskostnaden. Ditt exakta pris får du i offerten.",
      calculator: {
        title: "Räkna själv",
        lead: "Dra i reglaget och se hur mycket du betalar efter avdraget.",
        typeLegend: "Vad gäller det?",
        rut: "Städning, flytt med mera",
        rot: "Hantverkare",
        labourLabel: "Arbetskostnad före avdrag",
        startHint: "Startvärde: {label}, {price} före avdrag.",
        labour: "Arbetskostnad",
        deduction: "{type}-avdrag {rate}",
        youPay: "Du betalar",
        taxAgencyPays: "Skatteverket betalar",
        capped: "Avdraget är begränsat av taket per person och år.",
      },
      readMore: "Så fungerar RUT och ROT",
    },
    compare: {
      title: "Skillnaden mot offertsajter",
      lead: "På en offertsajt skriver du själv en beskrivning, får flera offerter och måste jämföra och kontrollera företagen på egen hand. Hos oss gör vi det jobbet åt dig.",
      caption: "Jämförelse mellan Nordvra och vanliga offertsajter",
      colFeature: "Det här ingår",
      colUs: "Nordvra",
      colThem: "Offertsajter",
      rows: [
        {
          feature: "Du klickar dig fram på ett par minuter utan att skriva någon text",
          us: "Ja",
          them: "Nej, du beskriver jobbet själv",
          themYes: false,
        },
        {
          feature: "Pris före och efter avdrag direkt",
          us: "Ja",
          them: "Nej, först när offerterna kommer",
          themYes: false,
        },
        {
          feature: "Vi kollar om du har rätt till avdraget",
          us: "Ja",
          them: "Nej",
          themYes: false,
        },
        {
          feature: "Vi väljer och kontrollerar företaget åt dig",
          us: "Ja",
          them: "Nej, du jämför flera offerter själv",
          themYes: false,
        },
        {
          feature: "Personlig hjälp på telefon",
          us: "Ja, hela vägen",
          them: "Du har kontakt med varje företag själv",
          themYes: false,
        },
        {
          feature: "Ingen bokningsavgift",
          us: "Ja",
          them: "Ja",
          themYes: true,
        },
      ],
    },
    trust: {
      title: "Tryggt från början till slut",
      items: [
        {
          icon: "house",
          title: "Personlig service",
          body: "Vi finns i {hometown} och tar hand om din bokning från förfrågan till färdigt jobb.",
        },
        {
          icon: "map-pin",
          title: "Hela Sverige",
          body: "Vi samarbetar med noga utvalda företag runt om i landet.",
        },
        {
          icon: "badge-check",
          title: "Godkänd för F-skatt",
          body: "Vi och alla våra partnerföretag är godkända för F-skatt. Det kontrollerar vi hos Skatteverket.",
        },
        {
          icon: "shield",
          title: "Försäkrade hos If",
          body: "Vi har ansvarsförsäkring, och våra partnerföretag ska också vara försäkrade.",
        },
        {
          icon: "phone",
          title: "Riktiga människor i telefon",
          body: "Ring {phone}, så hjälper vi dig med bokningen och svarar på dina frågor.",
        },
      ],
    },
    faq: {
      title: "Vanliga frågor",
      all: "Se alla vanliga frågor",
    },
    final: {
      title: "Redo att boka?",
      body: "Det tar ungefär två minuter. Förfrågan är gratis och inte bindande, och du godkänner priset innan något bokas.",
    },
  },

  howItWorks: {
    title: "Så fungerar RUT och ROT",
    lead: "RUT och ROT är skatteavdrag som gör det billigare att anlita hjälp i hemmet. Avdraget dras direkt på fakturan, och vi sköter pappersarbetet. Här förklarar vi reglerna enkelt.",
    sections: {
      overview: {
        title: "RUT och ROT i korthet",
        rutTitle: "RUT-avdrag: {rutRate} på arbetskostnaden",
        rutBody: "RUT gäller hushållsnära tjänster, till exempel:",
        rotTitle: "ROT-avdrag: {rotRate} på arbetskostnaden",
        rotBody: "ROT gäller reparation, underhåll, om- och tillbyggnad av din bostad, till exempel:",
      },
      labourOnly: {
        title: "Avdraget gäller bara arbetskostnaden",
        body: "Avdraget räknas på arbetskostnaden inklusive moms. Material, resor och utrustning ger aldrig avdrag. De betalar du fullt ut.",
        exampleTitle: "Exempel: {label}",
        labour: "Arbetskostnad",
        material: "Material",
        total: "Pris före avdrag",
        deduction: "ROT-avdrag {rate} (bara på arbetet)",
        youPay: "Du betalar",
      },
      cap: {
        title: "Tak: så mycket kan du få per år",
        perPerson:
          "Taket gäller per person. Är ni två som köper tjänsten tillsammans har var och en sitt eget tak.",
        ownTax:
          "Avdraget kan aldrig bli större än den skatt du betalar under året. Har du låg inkomst, till exempel bara pension, kan avdraget bli mindre än du tror.",
        checkRemaining:
          "På Skatteverkets Mina sidor ser du hur mycket avdrag du redan har använt i år.",
      },
      who: {
        title: "Vem kan få avdraget?",
        lead: "Du kan få RUT- eller ROT-avdrag om du:",
        items: [
          "fyller minst {minimumAge} år under året",
          "betalar skatt i Sverige",
          "själv köper och betalar tjänsten",
        ],
        rutTitle: "För RUT gäller också",
        rutItems: [
          "att arbetet görs i bostaden där du bor eller i ditt fritidshus",
          "eller i dina föräldrars hem, om det är du som köper och betalar",
          "att det gäller både hyresrätt, bostadsrätt och villa",
        ],
        rotTitle: "För ROT gäller också",
        rotItems: [
          "att du äger bostaden, med lagfart på huset eller som medlem i bostadsrättsföreningen",
          "att du bor där, eller att det är ditt fritidshus",
          "att ROT inte gäller i en hyreslägenhet eller i dina föräldrars hem",
        ],
      },
      household: {
        title: "Flera i hushållet kan dela på avdraget",
        body: [
          "Om ni är två eller fler som köper tjänsten kan var och en få avdrag för sin del. Var och en har då sitt eget tak, vilket kan ge ett större avdrag för ett dyrt jobb.",
          "Alla som delar på avdraget behöver ha rätt till det och betala sin del själva. För ROT behöver alla äga bostaden.",
          "När ni godkänner offerten fyller ni i personnummer för var och en och hur stor andel var och en betalar, till exempel hälften var.",
        ],
      },
      payment: {
        title: "Så måste du betala",
        extra: [
          "Den som får avdraget måste själv betala. Betalar någon annan, till exempel ett barn åt sin förälder, är det den personen som ska stå som köpare.",
          "Kontant betalning ger inte avdrag. Det är först när du har betalat som företaget kan begära resten från Skatteverket.",
        ],
      },
      paperwork: {
        title: "Vem sköter ansökan?",
        lead: "Du behöver inte ansöka om avdraget själv. Avdraget dras direkt på fakturan, och företaget som fakturerar dig begär resten av betalningen från Skatteverket.",
        sellerTitle: "RUT-jobb: vi sköter allt",
        sellerBody:
          "För RUT-jobb är {legalName} din avtalspart. Vi fakturerar dig, tar emot betalningen och begär avdraget hos Skatteverket. Ibland utförs arbetet av ett partnerföretag som vi har valt ut, men vi ansvarar ändå för jobbet.",
        agentTitle: "ROT-jobb: partnerföretaget ansöker",
        agentBody:
          "För ROT-jobb är partnerföretaget som nämns i offerten din avtalspart. Företaget fakturerar dig och begär avdraget. Vi förmedlar jobbet och hjälper dig hela vägen.",
        after:
          "När Skatteverket har beslutat ser du avdraget på Mina sidor. Om Skatteverket säger nej helt eller delvis betalar du mellanskillnaden.",
      },
      rotAge: {
        title: "Om- och tillbyggnad: huset måste ha några år på nacken",
        body: [
          "Reparation och underhåll ger ROT-avdrag oavsett hur gammalt huset är.",
          "Om- och tillbyggnad ger bara ROT-avdrag om huset är mer än {rotYears} år gammalt, räknat från när det först togs i bruk. Det gäller till exempel ett helt nytt badrum, ett nytt kök eller nya väggar.",
          "Är du osäker? Vi stämmer av vad som gäller för ditt jobb i offerten.",
        ],
      },
      notDeductible: {
        title: "Vad ger inte avdrag?",
        body: "Det mesta som görs i hemmet ger avdrag, men inte allt. Till exempel ger byggstädning, nybyggnation och resor inte avdrag.",
        link: "Se listan över vad som inte ger avdrag",
      },
      skatteverket: {
        title: "Läs mer hos Skatteverket",
        body: "Skatteverket har de fullständiga reglerna för RUT och ROT. Sök på ”rutavdrag” eller ”rotavdrag” på deras webbplats.",
      },
    },
  },

  checklist: {
    title: "Checklista inför besiktningen",
    lead: "Det här brukar besiktningen kontrollera efter en flyttstädning. Allt ingår i flyttstädningen du bokar hos oss.",
    tipsTitle: "Inför och efter besiktningen",
    print: "Skriv ut checklistan",
    ctaTitle: "Boka flyttstädning med besiktningsgaranti",
    ctaBody: "Lägg gärna till flytthjälp i samma förfrågan. Du ser priset före och efter RUT-avdrag direkt.",
  },
  notDeductible: {
    title: "Vad ger inte avdrag?",
    lead: "Det mesta som görs i hemmet ger RUT- eller ROT-avdrag, men inte allt. Här är vanliga saker som inte ger avdrag. Är du osäker? Ring oss, så kollar vi åt dig.",
    rutTitle: "Ger inte RUT-avdrag",
    rutIntro: "RUT gäller arbetet i hemmet. Det här ingår inte:",
    rotTitle: "Ger inte ROT-avdrag",
    rotIntro: "ROT gäller arbete på en bostad du äger. Det här ingår inte:",
    countLabel: "{count} exempel",
    notListedTitle: "Hittar du inte det du letar efter?",
    notListedBody:
      "Listan visar vanliga exempel och är inte komplett. Skatteverket har de fullständiga reglerna. Du kan också ringa oss, så hjälper vi dig.",
  },

  faqPage: {
    title: "Vanliga frågor",
    lead: "Här hittar du svar på det som kunder oftast undrar över. Tryck på en fråga för att se svaret. Hittar du inte det du söker? Ring oss, så hjälper vi dig.",
    groupsNav: "Ämnen",
  },

  about: {
    title: "Om Nordvra",
    lead: "Nordvra finns i {hometown}. Vi startade Nordvra för att det ska vara enkelt för alla att boka hjälp i hemmet, med RUT- och ROT-avdraget klart från början.",
    why: {
      title: "Därför finns Nordvra",
      body: [
        "Många tycker att det är krångligt att anlita hjälp. Man ska skriva en beskrivning, vänta på offerter, jämföra priser och ta reda på om företaget är seriöst. Sedan ska man förstå hur avdraget fungerar.",
        "Vi vill göra det enkelt. Du klickar dig fram på ett par minuter och ser direkt ungefär vad det kostar efter avdraget. Sedan tar vi hand om resten.",
      ],
    },
    how: {
      title: "Så arbetar vi",
      items: [
        "Vi väljer ett bra företag som kan göra jobbet när du vill, så du slipper jämföra offerter.",
        "Vi kontrollerar att företaget är godkänt för F-skatt och har försäkring innan det får jobb av oss.",
        "Vi är tydliga med vem som är din avtalspart och vem som gör jobbet.",
        "Det finns ingen bokningsavgift. Du betalar bara för jobbet.",
        "Du kan alltid ringa oss och prata med en människa.",
      ],
    },
    facts: {
      title: "Fakta om oss",
      company: "Företag",
      hometown: "Ort",
      coverage: "Vi hjälper kunder i",
      fSkatt: "F-skatt",
      insurance: "Försäkring",
    },
    reviews: {
      title: "Omdömen",
      body: "Vi visar bara omdömen från riktiga kunder efter utfört jobb, och vi publicerar dem som de är skrivna.",
      link: "Läs vad våra kunder säger",
    },
  },

  contact: {
    title: "Kontakt",
    lead: "Ring oss gärna. Vi hjälper dig att boka, svarar på frågor om RUT och ROT och kan fylla i förfrågan åt dig.",
    phoneTitle: "Ring oss",
    phoneBody: "Det enklaste sättet att nå oss. Du pratar med en människa.",
    hoursLabel: "Telefontider",
    hours: "Vardagar 8–18",
    emailTitle: "Mejla oss",
    emailBody: "Vi svarar så snart vi kan, oftast samma dag.",
    privacyNote:
      "Skicka aldrig ditt personnummer via mejl. Vi frågar efter det först när du godkänner offerten, och då fyller du i det i ett säkert formulär.",
    bookingTitle: "Har du redan en bokning?",
    bookingBody:
      "Ange ditt bokningsnummer när du ringer eller mejlar. Det börjar med NV och står i mejlet du fick från oss.",
    complaintTitle: "Är du inte nöjd?",
    complaintBody: "Hör av dig så snart som möjligt, så ser vi till att det blir rätt.",
    complaintLink: "Läs om reklamation i villkoren",
    companyTitle: "Företaget bakom Nordvra",
  },

  legal: {
    tocTitle: "Innehåll",
    version: "Version {version}",
    effective: "Gäller från {date}",
    questions: "Har du frågor om texten? Ring {phone} eller mejla {email}.",
  },

  notFound: {
    title: "Sidan finns inte",
    body: "Vi hittar tyvärr inte sidan du letar efter. Den kan ha flyttats, eller så är adressen felstavad.",
    linksTitle: "Här kan du gå vidare",
  },
} as const;

export default content;
