import { company } from "@/lib/company";
import { capSentence, taxFacts } from "@/lib/content/facts";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { CURRENT_RULES, type TaxYearRules } from "@/lib/taxRules";

/**
 * Villkor and Integritetspolicy (SPEC §5, §13) as structured data, rendered by
 * components/content/LegalDocumentView.
 *
 * TODO(jurist/skatterådgivare): DRAFT – must be reviewed before launch. The pages show the
 * "Ska granskas av jurist/skatterådgivare före lansering." banner until then.
 * TODO(revisor): confirm retention periods (pnr_retention_years / pnr_unused_retention_days).
 *
 * Server-side module (imports lib/settings for retention and quote validity defaults).
 */

export interface LegalLink {
  href: string;
  label: string;
}

export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  /** Term + explanation pairs, e.g. purpose → legal basis. */
  | { kind: "dl"; items: { term: string; detail: string }[] }
  | { kind: "links"; items: LegalLink[] };

export interface LegalSubsection {
  title: string;
  blocks: LegalBlock[];
}

export interface LegalSection {
  /** Anchor id, e.g. "cookies" → /integritetspolicy#cookies */
  id: string;
  title: string;
  blocks: LegalBlock[];
  subsections?: LegalSubsection[];
}

export interface LegalDocument {
  title: string;
  /** ISO date the version takes effect (company.termsVersion). */
  version: string;
  intro: string[];
  sections: LegalSection[];
}

export interface LegalOptions {
  rules?: TaxYearRules;
  quoteValidHours?: number;
  /** Years personnummer are kept after the RUT/ROT claim is settled. */
  retentionYears?: number;
  /** Days personnummer are kept for jobs that never happen (and agent-model jobs). */
  unusedRetentionDays?: number;
}

const p = (text: string): LegalBlock => ({ kind: "p", text });
const ul = (...items: string[]): LegalBlock => ({ kind: "ul", items });
const links = (...items: LegalLink[]): LegalBlock => ({ kind: "links", items });

const ARN_URL = "https://www.arn.se";
const IMY_URL = "https://www.imy.se";
const KONSUMENTVERKET_URL = "https://www.konsumentverket.se";
const SKATTEVERKET_URL = "https://www.skatteverket.se";

// ─────────────────────────────────────────────────────────────────────────────
// Villkor
// ─────────────────────────────────────────────────────────────────────────────

export function termsOfService({
  rules = CURRENT_RULES,
  quoteValidHours = DEFAULT_SETTINGS.quoteValidHours,
}: LegalOptions = {}): LegalDocument {
  const f = taxFacts(rules);
  const us = company.legalName;

  return {
    title: "Villkor",
    version: company.termsVersion,
    intro: [
      `De här villkoren gäller när du använder Nordvra för att skicka en förfrågan, få en offert och boka en tjänst.`,
      "Vi har försökt skriva villkoren så enkelt som möjligt. Du har alltid de rättigheter som konsumentlagarna ger dig, och inget i villkoren kan ta bort dem.",
    ],
    sections: [
      {
        id: "om-villkoren",
        title: "1. Vilka vi är",
        blocks: [
          p(`Nordvra har sin bas i ${company.hometown} och hjälper kunder i hela Sverige. Vi arbetar digitalt och har inget kontor som kunder besöker.`),
          p(`Du når oss på telefon ${company.phoneDisplay} och på e-post ${company.email}.`),
          p(`${us} är godkänt för F-skatt och har ansvarsförsäkring hos ${company.insurance}.`),
        ],
      },
      {
        id: "forfragan-offert-bokning",
        title: "2. Förfrågan, offert och bokning",
        blocks: [
          p("Så här går det till:"),
          ul(
            "Förfrågan: Du berättar vad du behöver hjälp med, när och var. Förfrågan är gratis och inte bindande. Ingenting är bokat ännu.",
            "Ungefärligt pris: Innan du skickar förfrågan visar vi ett ungefärligt pris. Det är bara en vägledning. Det exakta priset står i offerten.",
            "Offert: Vi tar fram ett exakt pris och en tid, oftast inom 24 timmar. För ROT-jobb lämnar ett partnerföretag offerten, oftast inom 48 timmar. Du får en länk till offerten via mejl och sms.",
            `Bokning: Avtalet blir bindande först när du trycker på ”Godkänn och boka” i offerten. Länken gäller i ${quoteValidHours} timmar. Trycker du på ”Nej tack”, eller låter länken gå ut, kostar det ingenting.`,
          ),
          p("När du godkänner offerten lämnar du också de uppgifter som behövs för avdraget, till exempel personnummer för varje köpare och vilken andel var och en betalar."),
          p("Efter bokningen får du en bekräftelse via mejl. Spara den, för där står ditt bokningsnummer."),
        ],
      },
      {
        id: "avtalspart",
        title: "3. Vem du gör avtal med",
        blocks: [
          p("I offerten står det alltid vem som är din avtalspart, alltså vem du gör avtal med och vem som ansvarar för jobbet. Det finns två varianter."),
        ],
        subsections: [
          {
            title: "RUT-tjänster: avtal med " + us,
            blocks: [
              p(`För RUT-tjänster, till exempel städning, flytt och trädgårdsarbete, är ${us} din avtalspart. Vi fakturerar dig, tar emot betalningen och begär RUT-avdraget hos Skatteverket.`),
              p("Vi kan låta ett noga utvalt partnerföretag (underleverantör) utföra arbetet. Vi ansvarar då för arbetet precis som om vi hade gjort det själva."),
            ],
          },
          {
            title: "ROT-tjänster: avtal med partnerföretaget",
            blocks: [
              p(`För ROT-tjänster, till exempel målning, badrum, el och VVS, är partnerföretaget som nämns i offerten din avtalspart. ${us} förmedlar jobbet.`),
              p("Partnerföretaget lämnar offerten, utför arbetet, fakturerar dig, begär ROT-avdraget och ansvarar för arbetet. Partnerföretagets egna villkor kan också gälla. I så fall står det i offerten."),
              p("Vi får en ersättning från partnerföretaget för att vi förmedlar jobbet. Du betalar ingen avgift till oss."),
              p("Vi hjälper dig gärna om något inte fungerar med partnerföretaget."),
            ],
          },
        ],
      },
      {
        id: "pris",
        title: "4. Pris",
        blocks: [
          p("Alla priser är i svenska kronor och inklusive moms. Offerten visar arbetskostnad, material och resor var för sig, avdraget och vad du ska betala."),
          p("Det finns ingen bokningsavgift. Du betalar bara för jobbet."),
          p("Priset i offerten gäller för det arbete som beskrivs där. Om det visar sig att jobbet är större än du har uppgett, till exempel att bostaden är större, kontaktar vi dig innan något extra görs. Du betalar aldrig för extra arbete som du inte har godkänt."),
        ],
      },
      {
        id: "avdrag",
        title: "5. RUT- och ROT-avdrag",
        blocks: [
          p("Vi använder fakturamodellen. Det betyder att avdraget dras direkt på fakturan. Företaget som fakturerar dig begär sedan resten av betalningen från Skatteverket."),
          ul(
            `RUT-avdraget är ${f.rutRate} och ROT-avdraget ${f.rotRate} av arbetskostnaden.`,
            "Avdraget gäller bara arbetskostnaden, inte material eller resor.",
            capSentence(rules),
            "Avdraget kan aldrig bli större än den skatt du betalar under året.",
          ),
          p("Avdraget är inte garanterat. RUT/ROT-avdraget förutsätter att du har rätt till det. Om Skatteverket nekar helt eller delvis (t.ex. för att du har för lite skatt eller redan använt ditt tak) betalar du mellanskillnaden."),
          p("Mellanskillnaden faktureras dig, och du betalar den inom 30 dagar."),
          p("Du ansvarar för att uppgifterna du lämnar är riktiga: att du har rätt till avdraget, ditt personnummer, hur stor andel varje köpare betalar och, för ROT, fastighetsbeteckning eller bostadsrättsföreningens organisationsnummer och lägenhetsnummer."),
          p(`Ungefärliga priser efter avdrag utgår från att du har rätt till fullt avdrag. Reglerna som gäller är de som Skatteverket tillämpar för det år du betalar. Våra beräkningar bygger på: ${f.source}.`),
        ],
      },
      {
        id: "betalning",
        title: "6. Betalning",
        blocks: [
          p("Du får en faktura när jobbet är gjort. Fakturan visar arbetskostnad, material, resor, avdraget och vad du ska betala."),
          p("Du måste betala elektroniskt (kort, Swish eller överföring) och själv vara den som betalar. Är ni flera köpare betalar var och en sin andel. Kontant betalning ger inte rätt till avdrag."),
          p("Betala senast på förfallodagen som står på fakturan. Betalar du för sent kan vi ta ut dröjsmålsränta enligt räntelagen och påminnelseavgift enligt lag."),
          p("För ROT-jobb betalar du till partnerföretaget enligt dess faktura."),
        ],
      },
      {
        id: "angerratt",
        title: "7. Ångerrätt",
        blocks: [
          p("Du har 14 dagars ångerrätt enligt lagen om distansavtal och avtal utanför affärslokaler. Ångerfristen börjar den dag du godkänner offerten."),
          p(`Du ångrar dig genom att ringa oss på ${company.phoneDisplay} eller mejla ${company.email}. Du kan också använda Konsumentverkets standardformulär för ångerrätt. Det räcker att du tydligt säger att du ångrar dig.`),
          p("Vill du att jobbet görs inom de 14 dagarna måste du be om det när du godkänner offerten. Ångrar du dig efter att arbetet har börjat betalar du för den del av arbetet som redan är gjord."),
          p("Om hela arbetet har utförts inom ångerfristen, efter att du har bett om det, har du ingen ångerrätt kvar."),
          p("Har du redan betalat något som ska återbetalas får du pengarna tillbaka senast 14 dagar efter att du har ångrat dig."),
          links({ href: KONSUMENTVERKET_URL, label: "Konsumentverket: om ångerrätt" }),
        ],
      },
      {
        id: "avbokning",
        title: "8. Avbokning och ändring",
        blocks: [
          ul(
            "Före bokning: Du kan ändra eller ta tillbaka en förfrågan när som helst, utan kostnad.",
            `Efter bokning, när ${us} är din avtalspart: Du kan avboka utan kostnad senast 48 timmar före avtalad tid. Avbokar du senare får vi ta betalt för arbete som redan är gjort och för kostnader vi inte kan undvika, enligt konsumenttjänstlagen.`,
            "Efter bokning, när ett partnerföretag är din avtalspart: Partnerföretagets villkor för avbokning gäller. Kontakta oss så hjälper vi dig.",
          ),
          p("Vill du byta tid? Hör av dig så snart som möjligt, så försöker vi hitta en ny tid som passar."),
          p("Om vi eller partnerföretaget måste ställa in jobbet säger vi till så snart vi kan och erbjuder en ny tid eller ett annat företag. Du betalar ingenting för ett jobb som vi ställer in."),
          p("Ångerrätten i punkt 7 gäller alltid utöver det här."),
        ],
      },
      {
        id: "infor-jobbet",
        title: "9. Inför jobbet",
        blocks: [
          p("För att jobbet ska bli bra behöver du:"),
          ul(
            "se till att den som ska göra jobbet kommer in i bostaden på avtalad tid, till exempel genom att lämna nycklar eller portkod",
            "se till att det finns el, vatten och belysning",
            "berätta om husdjur, trånga utrymmen, parkering och annat som påverkar jobbet",
            "ta undan värdesaker och sådant som lätt går sönder",
          ),
          p("Om vi inte kommer in i bostaden på avtalad tid, och det beror på dig, kan vi ta betalt för de kostnader vi har haft."),
        ],
      },
      {
        id: "reklamation",
        title: "10. Reklamation: om något inte blev bra",
        blocks: [
          p("Hör av dig så snart du märker att något inte blev bra. Berätta vad som är fel, gärna med bilder. Reklamerar du inom två månader från att du märkte felet har du alltid gjort det i tid."),
          p(`När ${us} är din avtalspart har du reklamationsrätt enligt konsumenttjänstlagen i 3 år från att jobbet blev klart. Vi rättar till felet utan kostnad för dig. Går det inte, eller dröjer det för länge, kan du ha rätt till prisavdrag, att häva avtalet eller skadestånd enligt lagen.`),
          p("Vid flyttstädning: berätta för oss så snart som möjligt om något anmärks vid besiktningen, så kommer vi tillbaka och åtgärdar det."),
          p("När ett partnerföretag är din avtalspart reklamerar du till partnerföretaget. Konsumenttjänstlagen gäller på samma sätt. Vi hjälper dig att få kontakt och följer upp."),
        ],
      },
      {
        id: "ansvar",
        title: "11. Ansvar och försäkring",
        blocks: [
          p(`${us} ansvarar enligt konsumenttjänstlagen för skador som vi eller våra underleverantörer orsakar på din bostad eller dina saker. Vi har ansvarsförsäkring hos ${company.insurance}.`),
          p("Partnerföretag som får jobb genom oss ska vara godkända för F-skatt och ha en ansvarsförsäkring. Vi kontrollerar det innan de får jobb."),
          p("När ett partnerföretag är din avtalspart ansvarar partnerföretaget för sitt arbete. Vi ansvarar för att vår förmedling går rätt till."),
          p("Vi gör vårt bästa för att webbplatsen alltid ska fungera, men vi kan inte lova att den aldrig ligger nere. Du kan alltid ringa oss i stället."),
        ],
      },
      {
        id: "klagomal",
        title: "12. Klagomål och tvister",
        blocks: [
          p(`Är du inte nöjd? Kontakta oss först på ${company.phoneDisplay} eller ${company.email}, så försöker vi lösa det tillsammans. Vi svarar så snart vi kan.`),
          p("Kommer vi inte överens kan du vända dig till Allmänna reklamationsnämnden (ARN). ARN prövar tvister mellan konsumenter och företag gratis."),
          p("Du kan också få råd av konsumentvägledningen i din kommun eller av Hallå konsument."),
          p("Svensk lag gäller för avtalet. En tvist kan också prövas av allmän domstol."),
          links(
            { href: ARN_URL, label: "Allmänna reklamationsnämnden (arn.se)" },
            { href: "https://www.hallakonsument.se", label: "Hallå konsument" },
          ),
        ],
      },
      {
        id: "personuppgifter",
        title: "13. Personuppgifter",
        blocks: [
          p("Så här behandlar vi dina personuppgifter, bland annat ditt personnummer, står i vår integritetspolicy."),
          links({ href: "/integritetspolicy", label: "Läs integritetspolicyn" }),
        ],
      },
      {
        id: "andringar",
        title: "14. Ändringar av villkoren",
        blocks: [
          p("Vi kan ändra villkoren. För din bokning gäller alltid den version som gällde när du skickade din förfrågan och godkände offerten. Vi sparar vilken version du har godkänt."),
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Integritetspolicy
// ─────────────────────────────────────────────────────────────────────────────

export function privacyPolicy({
  retentionYears = DEFAULT_SETTINGS.pnrRetentionYears,
  unusedRetentionDays = DEFAULT_SETTINGS.pnrUnusedRetentionDays,
  quoteValidHours = DEFAULT_SETTINGS.quoteValidHours,
}: LegalOptions = {}): LegalDocument {
  return {
    title: "Integritetspolicy",
    version: company.termsVersion,
    intro: [
      "Här berättar vi vilka personuppgifter vi behandlar när du använder Nordvra, varför vi gör det, vem vi delar dem med, hur länge vi sparar dem och vilka rättigheter du har.",
      "Vi samlar bara in de uppgifter vi behöver. Vi säljer aldrig dina uppgifter och använder inga cookies för reklam eller statistik.",
    ],
    sections: [
      {
        id: "ansvarig",
        title: "1. Personuppgiftsansvarig",
        blocks: [
          p(`Personuppgiftsansvarig är ${company.legalName}.`),
          p(`Har du frågor om dina personuppgifter? Ring ${company.phoneDisplay} eller mejla ${company.email}.`),
        ],
      },
      {
        id: "uppgifter",
        title: "2. Vilka uppgifter vi behandlar",
        blocks: [
          ul(
            "Kontaktuppgifter: namn, telefonnummer, e-postadress och adressen där jobbet ska göras.",
            "Uppgifter om jobbet: vilken tjänst du vill ha, typ av bostad och storlek, önskat datum och det du skriver i fältet för övrig information.",
            "Svar på frågorna om avdraget: till exempel om du fyller minst 18 år i år, betalar skatt i Sverige och äger bostaden. Svaren är ja eller nej. Vi frågar inte efter ditt personnummer i förfrågan.",
            "När du godkänner en offert: personnummer och namn för varje köpare, hur stor andel var och en betalar och, för ROT, fastighetsbeteckning eller bostadsrättsföreningens organisationsnummer och lägenhetsnummer.",
            "Faktura och betalning: fakturanummer, belopp, betaldatum och betalsätt, och vad Skatteverket har beslutat om avdraget.",
            "Kontakt med oss: mejl, sms och anteckningar från telefonsamtal.",
            "Tekniska uppgifter: IP-adress och tidpunkt i våra serverloggar, som behövs för att skydda webbplatsen.",
          ),
          p("Skriv inte känsliga uppgifter, till exempel om hälsa, i fältet för övrig information. Om något sådant är viktigt för jobbet kan du ringa oss i stället."),
        ],
      },
      {
        id: "syften",
        title: "3. Varför vi behandlar uppgifterna och med vilken rätt",
        blocks: [
          p("Vi får bara behandla personuppgifter om det finns en rättslig grund enligt dataskyddsförordningen (GDPR). Så här ser det ut:"),
          {
            kind: "dl",
            items: [
              {
                term: "Hantera din förfrågan och ta fram en offert",
                detail: "Rättslig grund: åtgärder som du har bett om innan ett avtal ingås (avtal).",
              },
              {
                term: "Utföra eller förmedla jobbet, skicka bekräftelser och fakturera",
                detail: "Rättslig grund: avtal.",
              },
              {
                term: "Begära RUT- eller ROT-avdrag hos Skatteverket med ditt personnummer",
                detail: "Rättslig grund: rättslig förpliktelse. Lagen om förfarandet vid skattereduktion för hushållsarbete kräver köparens personnummer när avdraget begärs.",
              },
              {
                term: "Bokföring",
                detail: "Rättslig grund: rättslig förpliktelse enligt bokföringslagen.",
              },
              {
                term: "Kundservice, reklamationer och tvister",
                detail: "Rättslig grund: avtal och vårt berättigade intresse av att kunna hantera och försvara anspråk.",
              },
              {
                term: "Skydda webbplatsen mot missbruk och fel",
                detail: "Rättslig grund: vårt berättigade intresse av en säker tjänst.",
              },
            ],
          },
          p("Vi skickar ingen reklam utan att du har sagt ja till det. Vi fattar inga beslut om dig som enbart bygger på automatisk behandling. Frågorna om avdraget är bara vägledning. Du kan alltid skicka din förfrågan."),
        ],
      },
      {
        id: "personnummer",
        title: "4. Om ditt personnummer",
        blocks: [
          p("Vi behöver ditt personnummer eftersom lagen kräver det när avdraget begärs från Skatteverket. Vi delar det bara med företaget som utför arbetet."),
          ul(
            "Vi frågar efter personnumret först när du godkänner offerten, aldrig i förfrågan.",
            "Personnumret krypteras innan det sparas i vår databas.",
            "I våra listor visas det bara delvis dolt, till exempel 850101-XXXX. Det fullständiga numret visas bara för den som ska begära avdraget.",
            "Vi skickar aldrig personnummer i mejl eller sms, lägger det aldrig i en webbadress och skriver det aldrig i loggar.",
            "Skicka inte ditt personnummer till oss via mejl. Det fyller du i säkert i offerten.",
          ),
        ],
      },
      {
        id: "mottagare",
        title: "5. Vem vi delar uppgifterna med",
        blocks: [
          ul(
            "Företaget som utför jobbet: namn, telefonnummer, adress och uppgifter om jobbet, så att det kan göra arbetet. När ett partnerföretag är din avtalspart får det också personnummer och andelar, eftersom det är det företaget som begär avdraget.",
            "Skatteverket: personnummer, belopp och uppgifter om arbetet när avdraget begärs.",
            "Våra leverantörer (personuppgiftsbiträden) för drift, databas, e-post och sms. De får bara behandla uppgifterna för vår räkning och enligt våra instruktioner. Vår databas finns i Sverige.",
            "Myndigheter, om lagen kräver det.",
          ),
          p("Om en leverantör behandlar uppgifter utanför EU/EES ser vi till att det finns skydd enligt GDPR, till exempel EU-kommissionens standardavtalsklausuler."),
        ],
      },
      {
        id: "lagring",
        title: "6. Hur länge vi sparar uppgifterna",
        blocks: [
          ul(
            `Personnummer och andra underlag för RUT- och ROT-avdraget sparas i ${retentionYears} år efter att Skatteverket har betalat ut eller beslutat om avdraget. Sedan tas personnumret bort automatiskt.`,
            `Jobb som aldrig blir av, till exempel när du tackar nej, offerten går ut eller jobbet avbokas, sparas i högst ${unusedRetentionDays} dagar med personnummer. Sedan tas personnumret bort automatiskt.`,
            `När ett partnerföretag är din avtalspart tar vi bort personnumret hos oss ${unusedRetentionDays} dagar efter jobbet. Partnerföretaget sparar det enligt sina egna regler.`,
            "Fakturor och annat bokföringsmaterial sparas i 7 år efter utgången av det kalenderår då räkenskapsåret avslutades, enligt bokföringslagen.",
            "Kontaktuppgifter och uppgifter om jobbet sparas så länge du kan reklamera jobbet, det vill säga i 3 år efter att jobbet blev klart, om de inte måste sparas längre enligt lag.",
            "Serverloggar sparas en kort tid och används bara för säkerhet och felsökning.",
          ),
        ],
      },
      {
        id: "sakerhet",
        title: "7. Så skyddar vi uppgifterna",
        blocks: [
          ul(
            "All trafik till webbplatsen är krypterad (https).",
            "Personnummer krypteras med AES-256-GCM i vår app innan de sparas. Nyckeln förvaras skild från databasen.",
            "Bara behöriga administratörer kan logga in och se bokningar. Du som kund kan aldrig läsa andras uppgifter.",
            `Länken till din offert är hemlig, gäller i ${quoteValidHours} timmar och visas inte i sökmotorer.`,
            "Våra loggar innehåller inga personnummer eller formulärsvar.",
          ),
        ],
      },
      {
        id: "rattigheter",
        title: "8. Dina rättigheter",
        blocks: [
          p("Enligt GDPR har du rätt att:"),
          ul(
            "få veta vilka uppgifter vi har om dig (registerutdrag)",
            "få felaktiga uppgifter rättade",
            "få uppgifter raderade, om vi inte måste spara dem enligt lag",
            "begränsa behandlingen av dina uppgifter",
            "invända mot behandling som bygger på vårt berättigade intresse",
            "få ut uppgifter som du själv har lämnat i ett maskinläsbart format (dataportabilitet)",
          ),
          p("Vi kan inte radera uppgifter som lagen kräver att vi sparar, till exempel underlag för bokföring och för RUT- och ROT-avdraget."),
          p(`Kontakta oss på ${company.email} eller ${company.phoneDisplay}. Vi svarar inom en månad. Vi kan behöva kontrollera vem du är innan vi lämnar ut uppgifter. Skicka inte ditt personnummer via mejl.`),
        ],
      },
      {
        id: "klagomal",
        title: "9. Klagomål",
        blocks: [
          p("Tycker du att vi behandlar dina personuppgifter fel? Hör gärna av dig till oss först. Du har också rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY)."),
          links({ href: IMY_URL, label: "Integritetsskyddsmyndigheten (imy.se)" }),
        ],
      },
      {
        id: "cookies",
        title: "10. Cookies",
        blocks: [
          p("Vi använder bara nödvändiga cookies och liknande tekniker, alltså sådant som behövs för att webbplatsen ska fungera. Därför behöver vi inte ditt samtycke. Vi använder inga cookies för statistik eller reklam, och inga cookies från andra företag."),
          {
            kind: "dl",
            items: [
              {
                term: "Svar i förfrågan (sessionStorage i din webbläsare)",
                detail: "Sparar dina svar medan du fyller i förfrågan, så att du kan gå tillbaka utan att något försvinner. Raderas när du skickar förfrågan eller stänger fliken. Innehåller aldrig personnummer.",
              },
              {
                term: "Cookie-meddelandet (localStorage i din webbläsare)",
                detail: "Kommer ihåg att du har sett meddelandet om cookies, så att det inte visas igen.",
              },
              {
                term: "Inloggning för administratörer (cookies)",
                detail: "Används bara när våra medarbetare loggar in i administrationen. Sätts aldrig för dig som kund.",
              },
            ],
          },
          p("Du kan radera cookies och sparade uppgifter i webbläsarens inställningar. Webbplatsen fungerar ändå, men du kan behöva börja om en förfrågan som du inte har skickat."),
        ],
      },
      {
        id: "andringar",
        title: "11. Ändringar",
        blocks: [
          p("Vi uppdaterar integritetspolicyn när vi ändrar hur vi behandlar personuppgifter. Datumet högst upp visar när den senast ändrades."),
          links(
            { href: SKATTEVERKET_URL, label: "Skatteverket.se: om RUT och ROT" },
            { href: "/villkor", label: "Läs våra villkor" },
          ),
        ],
      },
    ],
  };
}
