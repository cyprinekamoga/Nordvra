/**
 * Copy for the public service pages (`/stadning`, `/stadning/flyttstadning` …). Every category
 * has its own text; the services people search for most have hand-written text, the rest get
 * a page built from the catalogue (name, description, price and deduction). Placeholders such
 * as {rutRate} come from `taxFactVars()`, so the pages follow lib/taxRules.ts.
 *
 * Plain text, no HTML. No dashes as punctuation (ranges like 2–4 are fine).
 */

export interface PageFaq {
  question: string;
  answer: string;
}

export interface CategoryCopy {
  /** Under the h1. */
  lead: string;
  /** A few short paragraphs under the list of services. */
  body: string[];
  /** <title> without " | Nordvra". */
  metaTitle: string;
  metaDescription: string;
}

export interface ServiceCopy {
  lead: string;
  body?: string[];
  /** "Det här ingår", as a tick list. */
  includes?: string[];
  faq?: PageFaq[];
  metaTitle?: string;
  metaDescription?: string;
}

export const categoryCopy: Readonly<Record<string, CategoryCopy>> = {
  stadning: {
    lead: "Hemstädning, storstädning och flyttstädning med RUT-avdrag. Du ser priset direkt och vi hittar ett kontrollerat städföretag åt dig.",
    body: [
      "Med RUT-avdraget får du {rutRate} av arbetskostnaden tillbaka direkt på fakturan, så du behöver inte ansöka om något själv.",
      "Flyttstädningen har besiktningsgaranti: blir något underkänt städar vi om det utan kostnad.",
    ],
    metaTitle: "Städning med RUT-avdrag, se priset direkt",
    metaDescription:
      "Boka hemstädning, storstädning eller flyttstädning med {rutRate} RUT-avdrag. Se priset före och efter avdrag på en gång. Ingen bokningsavgift.",
  },
  flytt: {
    lead: "Flytthjälp med RUT-avdrag: packning, bärhjälp, montering av möbler och upphängning i nya hemmet.",
    body: [
      "RUT-avdraget gäller arbetet, alltså bärhjälp, packning och montering. Lastbil och material ger inget avdrag.",
      "Boka flytthjälp och flyttstädning i samma förfrågan, så planerar vi så att städningen görs när allt är utburet.",
    ],
    metaTitle: "Flytthjälp med RUT-avdrag, se priset direkt",
    metaDescription:
      "Boka bärhjälp, packning och möbelmontering med {rutRate} RUT-avdrag. Lägg till flyttstädning i samma förfrågan. Ingen bokningsavgift.",
  },
  fonsterputs: {
    lead: "Fönsterputs med RUT-avdrag, in- och utvändigt. Du ser priset per fönster direkt.",
    body: [],
    metaTitle: "Fönsterputs med RUT-avdrag, pris per fönster",
    metaDescription:
      "Boka fönsterputs med {rutRate} RUT-avdrag. Se priset per fönster före och efter avdrag. Boka en gång eller för hela säsongen.",
  },
  tradgard: {
    lead: "Trädgårdshjälp och snöskottning med RUT-avdrag: gräsklippning, häckklippning, ogräsrensning, beskärning och mer.",
    body: [
      "RUT gäller trädgårdsarbete på tomten som hör till din bostad. Bortforsling av trädgårdsavfall ger inget avdrag.",
      "Gräsklippning och snöskottning kan du boka för hela säsongen.",
    ],
    metaTitle: "Trädgårdshjälp och snöskottning med RUT-avdrag",
    metaDescription:
      "Boka gräsklippning, häckklippning, beskärning eller snöskottning med {rutRate} RUT-avdrag. Se priset direkt. Ingen bokningsavgift.",
  },
  "hem-it": {
    lead: "Hjälp hemma med dator, wifi, TV och vitvaror, med RUT-avdrag på arbetet.",
    body: [
      "RUT gäller när arbetet görs hemma hos dig. Hjälp på distans och delar till vitvarorna ger inget avdrag.",
    ],
    metaTitle: "IT-hjälp och reparation av vitvaror med RUT-avdrag",
    metaDescription:
      "Boka hjälp med dator, router, wifi, TV eller vitvaror hemma hos dig med {rutRate} RUT-avdrag. Se priset per timme direkt.",
  },
  omsorg: {
    lead: "Barnpassning, personlig omsorg och tillsyn av bostaden med RUT-avdrag.",
    body: [
      "Du kan också boka hjälp i dina föräldrars hem och själv få RUT-avdraget för det du betalar.",
    ],
    metaTitle: "Barnpassning och omsorg med RUT-avdrag",
    metaDescription:
      "Boka barnpassning, hjälp i vardagen eller tillsyn av bostaden med {rutRate} RUT-avdrag. Se priset per timme direkt.",
  },
  maleri: {
    lead: "Målning och tapetsering med ROT-avdrag, inomhus och utomhus. Du ser ungefärligt pris direkt och får en offert från en kontrollerad målare.",
    body: [
      "ROT-avdraget gäller arbetskostnaden. Färg, tapet och annat material ger inget avdrag.",
    ],
    metaTitle: "Målare med ROT-avdrag, se priset direkt",
    metaDescription:
      "Boka målning inomhus eller utomhus, tapetsering och målning av dörrar och köksluckor med {rotRate} ROT-avdrag. Offert inom 24 timmar.",
  },
  "badrum-kok": {
    lead: "Renovering av badrum och kök med ROT-avdrag: kakel, klinker, golv och fast inredning.",
    body: [
      "Vi förmedlar uppdraget till ett kontrollerat företag. Du får en offert att godkänna innan något arbete börjar.",
      "ROT-avdraget gäller arbetet. Material som kakel och skåp ger inget avdrag.",
    ],
    metaTitle: "Badrumsrenovering och kök med ROT-avdrag",
    metaDescription:
      "Renovera badrum eller kök med {rotRate} ROT-avdrag. Kakel, klinker, golv och fast inredning. Offert från ett kontrollerat företag inom 24 timmar.",
  },
  snickeri: {
    lead: "Snickare med ROT-avdrag för golv, väggar, dörrar, trappor, garderober och altan.",
    body: ["ROT-avdraget gäller arbetet. Virke, golv och annat material ger inget avdrag."],
    metaTitle: "Snickare med ROT-avdrag, se priset direkt",
    metaDescription:
      "Boka golvläggning, nya väggar, dörrar, trappor eller garderober med {rotRate} ROT-avdrag. Offert från en kontrollerad snickare.",
  },
  el: {
    lead: "Elektriker med ROT-avdrag: eldragning, uttag, elcentral, belysning och laddbox.",
    body: ["Elarbete i bostaden får bara göras av ett registrerat elinstallationsföretag."],
    metaTitle: "Elektriker med ROT-avdrag, se priset direkt",
    metaDescription:
      "Boka elektriker för uttag, eldragning, elcentral, spotlights eller laddbox med {rotRate} ROT-avdrag. Offert inom 24 timmar.",
  },
  vvs: {
    lead: "Rörmokare med ROT-avdrag för rör, avlopp och värmepump.",
    body: ["ROT-avdraget gäller arbetet. Själva värmepumpen och andra delar ger inget avdrag."],
    metaTitle: "Rörmokare och värmepump med ROT-avdrag",
    metaDescription:
      "Boka rörarbeten, avlopp eller installation av värmepump med {rotRate} ROT-avdrag. Offert från ett kontrollerat VVS-företag.",
  },
  "tak-fasad": {
    lead: "Tak, fasad och fönster med ROT-avdrag: takbyte, plåtarbeten, hängrännor, fönsterbyte, inglasning och skorsten.",
    body: ["ROT-avdraget gäller arbetet på huset. Material och ställning ger inget avdrag."],
    metaTitle: "Takbyte, fasad och fönsterbyte med ROT-avdrag",
    metaDescription:
      "Boka takbyte, plåtarbeten, hängrännor, fönsterbyte eller fasadtvätt med {rotRate} ROT-avdrag. Offert från ett kontrollerat företag.",
  },
  mark: {
    lead: "Dränering och grävning runt huset med ROT-avdrag.",
    body: ["ROT gäller markarbete som hör till huset, till exempel dränering av grunden och grävning för ledningar."],
    metaTitle: "Dränering och markarbeten med ROT-avdrag",
    metaDescription:
      "Boka dränering av husgrunden eller grävning för avlopp, vatten, el eller fiber med {rotRate} ROT-avdrag. Offert inom 24 timmar.",
  },
};

export const serviceCopy: Readonly<Record<string, ServiceCopy>> = {
  flyttstadning: {
    lead: "Flyttstädning med RUT-avdrag och besiktningsgaranti. Se priset för din bostad direkt och boka på två minuter.",
    body: [
      "Vi städar hela bostaden enligt en checklista som följer det besiktningen brukar kontrollera, så du kan lämna nycklarna utan oro.",
      "Blir något underkänt vid besiktningen städar vi om det utan kostnad.",
    ],
    includes: [
      "Alla rum: golv, lister, dörrar, fönsterbänkar och eluttag",
      "Kök: ugn, spis, kyl, frys, skåp och lådor in- och utvändigt",
      "Badrum: kakel, golvbrunn, toalett, handfat och badkar eller dusch",
      "Fönsterputs in- och utvändigt",
      "Balkong och förråd om du väljer det",
    ],
    faq: [
      {
        question: "Vad kostar flyttstädning?",
        answer:
          "Det beror på hur stor bostaden är. I tabellen ser du vad det brukar kosta före och efter RUT-avdrag. När du bokar får du priset för din bostad direkt.",
      },
      {
        question: "Kan jag boka flytthjälp och flyttstädning samtidigt?",
        answer:
          "Ja. Välj flyttpaketet när du bokar, så får du ett pris för varje del och vi planerar så att städningen görs när allt är utburet.",
      },
    ],
    metaTitle: "Flyttstädning med RUT-avdrag och besiktningsgaranti",
    metaDescription:
      "Boka flyttstädning med {rutRate} RUT-avdrag. Se priset för din bostad direkt. Besiktningsgaranti: blir något underkänt städar vi om utan kostnad.",
  },
  hemstadning: {
    lead: "Hemstädning med RUT-avdrag varje vecka, varannan vecka eller en gång. Samma städare varje gång när det går.",
    includes: [
      "Dammsugning och våttorkning av golv",
      "Damning av ytor, lister och fönsterbänkar",
      "Kök: bänkar, spis, diskho och utsidan av vitvarorna",
      "Badrum: toalett, handfat, dusch eller badkar och speglar",
      "Tömning av papperskorgar",
    ],
    faq: [
      {
        question: "Vad kostar hemstädning med RUT?",
        answer:
          "Priset beror på hur stor bostaden är och hur ofta vi städar. Tabellen visar ungefärligt pris per städtillfälle. När du bokar ser du priset för just ditt hem.",
      },
      {
        question: "Måste jag vara hemma när ni städar?",
        answer: "Nej. Många lämnar en nyckel eller en kod. Det kommer du överens om när städningen bokas.",
      },
    ],
    metaTitle: "Hemstädning med RUT-avdrag, se priset direkt",
    metaDescription:
      "Boka hemstädning varje vecka, varannan vecka eller en gång med {rutRate} RUT-avdrag. Se priset per städtillfälle direkt. Ingen bokningsavgift.",
  },
  storstadning: {
    lead: "Storstädning med RUT-avdrag när hemmet behöver en ordentlig genomgång, till exempel inför våren eller en högtid.",
    includes: [
      "Allt som ingår i hemstädning",
      "Insidan av ugn, kyl och frys",
      "Skåp och garderober utvändigt, dörrar och dörrkarmar",
      "Kakel och fogar i kök och badrum",
      "Element, lampor och svåra ställen bakom möbler",
    ],
    metaTitle: "Storstädning med RUT-avdrag, se priset direkt",
    metaDescription:
      "Boka storstädning av hela bostaden med {rutRate} RUT-avdrag. Se priset för din bostad direkt. Ingen bokningsavgift.",
  },
  fonsterputs: {
    lead: "Fönsterputs med RUT-avdrag, in- och utvändigt. Du ser priset per fönster direkt och kan boka en gång eller för hela säsongen.",
    includes: [
      "Fönsterglas in- och utvändigt och mellan glasen",
      "Fönsterbågar och karmar torkas av",
      "Spröjsade fönster och inglasad balkong om du väljer det",
    ],
    faq: [
      {
        question: "Vad kostar fönsterputs?",
        answer:
          "Priset räknas per fönster. Ovanför ser du vad ett fönster brukar kosta före och efter RUT-avdrag. När du bokar fyller du i antal fönster och ser priset för hela jobbet.",
      },
      {
        question: "Kan jag få fönsterputs flera gånger om året?",
        answer: "Ja. Välj säsongsabonnemang när du bokar, så kommer vi tillbaka varje säsong utan att du behöver boka igen.",
      },
    ],
    metaTitle: "Fönsterputs med RUT-avdrag, pris per fönster",
    metaDescription:
      "Boka fönsterputs med {rutRate} RUT-avdrag. Se priset per fönster direkt. Boka en gång eller för hela säsongen. Ingen bokningsavgift.",
  },
  "bara-lasta": {
    lead: "Bärhjälp vid flytt med RUT-avdrag. Flyttarna bär, lastar och lossar, du visar vad som ska med.",
    body: ["Behöver du lastbil ordnar vi det, men lastbilen ger inget RUT-avdrag. Avdraget gäller arbetet."],
    faq: [
      {
        question: "Vad kostar flytthjälp?",
        answer:
          "Flytthjälp kostar per person och timme. Hur lång tid det tar beror på hur mycket du har och hur långt det är att bära. Ovanför ser du timpriset före och efter RUT-avdrag.",
      },
    ],
    metaTitle: "Flytthjälp med RUT-avdrag, bärhjälp per timme",
    metaDescription:
      "Boka bärhjälp vid flytt med {rutRate} RUT-avdrag. Se timpriset direkt och lägg till flyttstädning i samma förfrågan. Ingen bokningsavgift.",
  },
  packning: {
    lead: "Vi packar ner hela hemmet inför flytten och packar upp i nya bostaden, med RUT-avdrag på arbetet.",
    metaTitle: "Packhjälp vid flytt med RUT-avdrag",
    metaDescription:
      "Boka packning och uppackning vid flytt med {rutRate} RUT-avdrag. Se timpriset direkt. Ingen bokningsavgift.",
  },
  "malning-inomhus": {
    lead: "Målning av väggar och tak inomhus med ROT-avdrag. Du ser ungefärligt pris per kvadratmeter direkt och får en offert från en kontrollerad målare.",
    includes: [
      "Skydd av golv och möbler",
      "Spackling och slipning av små skador",
      "Grundmålning där det behövs och två strykningar",
      "Städning efter jobbet",
    ],
    faq: [
      {
        question: "Vad kostar det att måla om ett rum?",
        answer:
          "Priset räknas per kvadratmeter vägg. Ovanför ser du vad det brukar kosta före och efter ROT-avdrag. Färg och material tillkommer och ger inget avdrag.",
      },
    ],
    metaTitle: "Målare inomhus med ROT-avdrag, pris per m²",
    metaDescription:
      "Boka målning av väggar och tak med {rotRate} ROT-avdrag. Se ungefärligt pris per m² direkt. Offert från en kontrollerad målare inom 24 timmar.",
  },
  tapetsering: {
    lead: "Tapetsering med ROT-avdrag. Målaren tar ner gammal tapet, förbereder väggen och sätter upp den nya.",
    metaTitle: "Tapetsering med ROT-avdrag, pris per m²",
    metaDescription:
      "Boka tapetsering med {rotRate} ROT-avdrag. Se ungefärligt pris per m² direkt. Offert från en kontrollerad målare inom 24 timmar.",
  },
  badrumsrenovering: {
    lead: "Badrumsrenovering med ROT-avdrag, helt eller delvis. Du får en offert från ett kontrollerat företag inom 24 timmar.",
    body: [
      "Ett badrum måste byggas tätt. Be om ett våtrumsintyg när jobbet är klart, det är bra att ha om du säljer bostaden.",
      "ROT-avdraget gäller arbetet. Kakel, porslin och annat material ger inget avdrag.",
    ],
    faq: [
      {
        question: "Vad kostar en badrumsrenovering?",
        answer:
          "Det beror på hur stort badrummet är och vad som ska göras. Ovanför ser du timpriset före och efter ROT-avdrag. Du får ett fast pris i offerten innan något bokas.",
      },
    ],
    metaTitle: "Badrumsrenovering med ROT-avdrag",
    metaDescription:
      "Renovera badrummet med {rotRate} ROT-avdrag. Offert från ett kontrollerat företag inom 24 timmar. Ingen bokningsavgift.",
  },
  varmepump: {
    lead: "Installation och byte av värmepump med ROT-avdrag på arbetet.",
    body: ["Själva värmepumpen ger inget ROT-avdrag, bara arbetet med att installera den."],
    metaTitle: "Installera värmepump med ROT-avdrag",
    metaDescription:
      "Boka installation eller byte av värmepump med {rotRate} ROT-avdrag på arbetet. Offert från ett kontrollerat VVS-företag inom 24 timmar.",
  },
  grasklippning: {
    lead: "Gräsklippning med RUT-avdrag. Boka en gång eller för hela säsongen, så kommer vi tillbaka utan att du behöver tänka på det.",
    metaTitle: "Gräsklippning med RUT-avdrag, hela säsongen",
    metaDescription:
      "Boka gräsklippning en gång eller för hela säsongen med {rutRate} RUT-avdrag. Se timpriset direkt. Ingen bokningsavgift.",
  },
  snoskottning: {
    lead: "Snöskottning av uppfart och gångar med RUT-avdrag. Boka för hela vintern.",
    metaTitle: "Snöskottning med RUT-avdrag, hela vintern",
    metaDescription:
      "Boka snöskottning av uppfart och gångar med {rutRate} RUT-avdrag. Boka för hela säsongen. Se timpriset direkt.",
  },
  golvlaggning: {
    lead: "Golvläggning, slipning och reparation av golv med ROT-avdrag på arbetet.",
    metaTitle: "Golvläggning och golvslipning med ROT-avdrag",
    metaDescription:
      "Boka golvläggning, golvslipning eller reparation av golv med {rotRate} ROT-avdrag. Offert från en kontrollerad snickare inom 24 timmar.",
  },
  laddbox: {
    lead: "Installation av laddbox på husväggen med ROT-avdrag på arbetet, av en kontrollerad elektriker.",
    metaTitle: "Installera laddbox med ROT-avdrag",
    metaDescription:
      "Boka installation av laddbox för elbil med {rotRate} ROT-avdrag på arbetet. Offert från en kontrollerad elektriker inom 24 timmar.",
  },
  barnpassning: {
    lead: "Barnpassning i hemmet med {rutRate} RUT-avdrag på arbetskostnaden.",
    metaTitle: "Barnpassning med RUT-avdrag",
    metaDescription: "Boka barnpassning hemma med {rutRate} RUT-avdrag. Se timpriset direkt. Ingen bokningsavgift.",
  },
};
