import { company } from "@/lib/company";
import { capSentence, taxFacts } from "@/lib/content/facts";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { CURRENT_RULES, type TaxYearRules } from "@/lib/taxRules";

/**
 * Vanliga frågor (SPEC §5, §12). Rates and caps come from lib/taxRules.ts via `taxFacts`, so
 * the answers follow the rules file. Answers are plain paragraphs (also used for the FAQPage
 * JSON-LD); links are rendered under the answer.
 *
 * Server-side module (imports lib/settings for the quote validity default).
 */

export interface FaqLink {
  href: string;
  label: string;
}

export type FaqGroupId = "bokning" | "pris" | "avdrag" | "trygghet";

export interface FaqItem {
  /** Stable anchor id, e.g. "bokningsavgift" → /vanliga-fragor#bokningsavgift */
  id: string;
  group: FaqGroupId;
  question: string;
  /** One string per paragraph. Plain text – no HTML. */
  answer: string[];
  links?: FaqLink[];
}

export interface FaqGroup {
  id: FaqGroupId;
  title: string;
}

export const FAQ_GROUPS: readonly FaqGroup[] = [
  { id: "bokning", title: "Så går en bokning till" },
  { id: "pris", title: "Pris och betalning" },
  { id: "avdrag", title: "RUT- och ROT-avdraget" },
  { id: "trygghet", title: "Trygghet och dina rättigheter" },
];

export interface FaqOptions {
  rules?: TaxYearRules;
  /** How long a quote link is valid (hours). Defaults to the settings default (48). */
  quoteValidHours?: number;
}

const SKATTEVERKET_URL = "https://www.skatteverket.se";

export function getFaq({
  rules = CURRENT_RULES,
  quoteValidHours = DEFAULT_SETTINGS.quoteValidHours,
}: FaqOptions = {}): FaqItem[] {
  const f = taxFacts(rules);
  const phone = company.phoneDisplay;

  return [
    // ── Så går en bokning till ────────────────────────────────────────────────
    {
      id: "hur-gar-det-till",
      group: "bokning",
      question: "Hur går det till när jag bokar?",
      answer: [
        "Du svarar på några frågor genom att klicka – det tar ungefär två minuter. Du behöver inte skriva någon beskrivning.",
        "Innan du skickar ser du ett ungefärligt pris, både före och efter avdraget. Förfrågan är gratis och inte bindande.",
        "Inom 24 timmar får du en offert med exakt pris och tid via mejl och sms. Bokningen blir klar först när du har godkänt offerten.",
      ],
      links: [{ href: "/boka", label: "Gör en förfrågan" }],
    },
    {
      id: "offert",
      group: "bokning",
      question: "Hur fungerar offerten?",
      answer: [
        "Vi letar upp ett bra företag som kan göra jobbet när du vill och tar fram ett exakt pris. I offerten ser du arbetskostnad, eventuellt material och resor, avdraget och vad du betalar.",
        `Länken till offerten gäller i ${quoteValidHours} timmar. Du väljer själv om du vill trycka på ”Godkänn och boka” eller ”Nej tack”. Säger du nej kostar det ingenting.`,
        "För ROT-jobb, till exempel målning eller badrum, lämnar ett partnerföretag offerten. Den kommer oftast inom 48 timmar.",
      ],
    },
    {
      id: "vem-kommer",
      group: "bokning",
      question: "Vem kommer hem till mig och gör jobbet?",
      answer: [
        `Antingen ${company.legalName} eller ett av våra partnerföretag. Vi väljer företaget åt dig och kontrollerar att det är godkänt för F-skatt och har försäkring.`,
        "I offerten står det vilket företag som gör jobbet och vem som är din avtalspart. Om vi själva gör jobbet säger vi det tydligt – vill du hellre ha ett annat företag ordnar vi det.",
      ],
    },
    {
      id: "hela-sverige",
      group: "bokning",
      question: "Finns ni där jag bor?",
      answer: [
        `Ja. Vi hjälper kunder i hela Sverige. Vi har vår bas i ${company.hometown} och samarbetar med lokala företag runt om i landet.`,
        "Om vi inte hittar ett företag som kan ta jobbet där du bor hör vi av oss och berättar det. Det kostar dig ingenting.",
      ],
    },
    {
      id: "boka-per-telefon",
      group: "bokning",
      question: "Kan jag boka per telefon i stället?",
      answer: [
        `Ja, gärna. Ring oss på ${phone} så hjälper vi dig med hela bokningen och svarar på dina frågor. Det kostar inget extra att boka per telefon.`,
      ],
      links: [
        { href: company.phoneHref, label: `Ring ${phone}` },
        { href: "/kontakt", label: "Fler sätt att kontakta oss" },
      ],
    },

    // ── Pris och betalning ────────────────────────────────────────────────────
    {
      id: "vad-kostar-det",
      group: "pris",
      question: "Vad kostar det?",
      answer: [
        "Priset beror på tjänsten, bostadens storlek och var du bor. När du gör en förfrågan ser du direkt ett ungefärligt pris, till exempel ”vanligtvis 3 800–4 800 kr efter RUT-avdrag”.",
        "Det exakta priset står i offerten. Alla priser är inklusive moms.",
      ],
    },
    {
      id: "bokningsavgift",
      group: "pris",
      question: "Tar ni någon bokningsavgift?",
      answer: [
        "Nej. Det finns ingen bokningsavgift. Du betalar bara för själva jobbet – priset som står i offerten.",
        "När ett partnerföretag gör jobbet och fakturerar dig får vi en ersättning från företaget, inte från dig.",
      ],
    },
    {
      id: "betalning",
      group: "pris",
      question: "Hur betalar jag?",
      answer: [
        "Du betalar efter att jobbet är gjort, mot en faktura från din avtalspart. Avdraget är redan draget på fakturan.",
        "För att du ska få avdraget måste du betala elektroniskt – med kort, Swish eller banköverföring – och själv vara den som betalar. Kontant betalning ger inte avdrag.",
      ],
    },
    {
      id: "avboka",
      group: "pris",
      question: "Kan jag avboka eller ändra tiden?",
      answer: [
        "En förfrågan kan du ändra eller ta tillbaka när som helst, utan kostnad.",
        `Har du godkänt offerten och vill ändra eller avboka? Hör av dig så snart som möjligt. När ${company.legalName} är din avtalspart kostar det ingenting att avboka senast 48 timmar före avtalad tid. Du har också 14 dagars ångerrätt.`,
      ],
      links: [{ href: "/villkor#avbokning", label: "Läs mer om avbokning i villkoren" }],
    },

    // ── RUT- och ROT-avdraget ─────────────────────────────────────────────────
    {
      id: "hur-mycket-avdrag",
      group: "avdrag",
      question: "Hur mycket får jag i avdrag?",
      answer: [
        `RUT-avdraget är ${f.rutRate} på arbetskostnaden, till exempel för städning, flytt och trädgård. ROT-avdraget är ${f.rotRate} på arbetskostnaden för reparation, underhåll och ombyggnad.`,
        "Avdraget gäller bara arbetskostnaden – inte material eller resor.",
        capSentence(rules),
      ],
      links: [{ href: "/sa-fungerar-rut-och-rot", label: "Så fungerar RUT och ROT" }],
    },
    {
      id: "vem-har-ratt",
      group: "avdrag",
      question: "Vem har rätt till RUT- och ROT-avdrag?",
      answer: [
        `Du behöver fylla minst ${f.minimumAge} år under året och betala skatt i Sverige.`,
        "RUT gäller arbete i bostaden där du bor, i ditt fritidshus eller i dina föräldrars hem. ROT gäller en bostad som du själv äger – med lagfart på huset eller som medlem i bostadsrättsföreningen. ROT gäller inte i en hyreslägenhet.",
        "När du gör en förfrågan ställer vi några enkla frågor och visar om det ser ut som att du har rätt till avdraget.",
      ],
    },
    {
      id: "nekat-avdrag",
      group: "avdrag",
      question: "Vad händer om Skatteverket säger nej till avdraget?",
      answer: [
        "RUT/ROT-avdraget förutsätter att du har rätt till det. Om Skatteverket nekar helt eller delvis (t.ex. för att du har för lite skatt eller redan använt ditt tak) betalar du mellanskillnaden.",
        "Avdraget kan aldrig bli större än den skatt du betalar under året. Är du osäker kan du se hur mycket avdrag du har kvar på Skatteverkets Mina sidor.",
      ],
      links: [{ href: SKATTEVERKET_URL, label: "Skatteverket.se" }],
    },
    {
      id: "ansoka-sjalv",
      group: "avdrag",
      question: "Måste jag själv ansöka om avdraget?",
      answer: [
        "Nej. Avdraget dras direkt på fakturan. Företaget som fakturerar dig begär sedan resten av betalningen från Skatteverket.",
        `För RUT-jobb är det ${company.legalName} som sköter det. För ROT-jobb gör partnerföretaget det. Du behöver bara betala din del och lämna rätt uppgifter när du godkänner offerten.`,
      ],
    },
    {
      id: "flera-kopare",
      group: "avdrag",
      question: "Vi är två i hushållet – kan vi dela på avdraget?",
      answer: [
        "Ja. Om ni båda står som köpare får var och en avdrag för sin del, och var och en har sitt eget tak. På så sätt kan ni tillsammans få större avdrag för ett dyrt jobb.",
        "Båda behöver ha rätt till avdraget och betala sin del själva. För ROT behöver båda äga bostaden. När ni godkänner offerten fyller ni i personnummer och hur stor andel var och en betalar.",
      ],
    },
    {
      id: "avdrag-kvar",
      group: "avdrag",
      question: "Hur vet jag hur mycket avdrag jag har kvar i år?",
      answer: [
        "Logga in på Skatteverkets Mina sidor. Där ser du hur mycket RUT- och ROT-avdrag du redan har fått i år.",
        `${capSentence(rules)} Om taket tar slut betalar du mellanskillnaden.`,
      ],
      links: [{ href: SKATTEVERKET_URL, label: "Skatteverkets Mina sidor" }],
    },

    // ── Trygghet och dina rättigheter ─────────────────────────────────────────
    {
      id: "f-skatt-forsakring",
      group: "trygghet",
      question: "Har företagen F-skatt och försäkring?",
      answer: [
        `Ja. ${company.legalName} är godkänt för F-skatt och försäkrat hos If.`,
        "Innan ett partnerföretag får jobb genom oss kontrollerar vi att det är godkänt för F-skatt hos Skatteverket och har en giltig försäkring. Företag utan godkänd F-skatt kan inte få jobb av oss.",
      ],
    },
    {
      id: "personnummer",
      group: "trygghet",
      question: "Varför behöver ni mitt personnummer?",
      answer: [
        "Vi behöver ditt personnummer eftersom lagen kräver det när avdraget begärs från Skatteverket. Vi delar det bara med företaget som utför arbetet.",
        "Vi frågar efter personnumret först när du godkänner offerten – inte i förfrågan. Det krypteras innan det sparas, och vi skickar det aldrig i mejl eller sms.",
      ],
      links: [{ href: "/integritetspolicy#personnummer", label: "Läs mer i vår integritetspolicy" }],
    },
    {
      id: "angerratt",
      group: "trygghet",
      question: "Har jag ångerrätt?",
      answer: [
        "Ja. Du har 14 dagars ångerrätt från den dag du godkänner offerten. Du ångrar dig genom att ringa eller mejla oss.",
        "Vill du att jobbet görs inom de 14 dagarna får du kryssa i det när du godkänner offerten. Ångrar du dig efter att arbetet har börjat betalar du för den del som redan är gjord.",
      ],
      links: [{ href: "/villkor#angerratt", label: "Läs mer om ångerrätt" }],
    },
    {
      id: "inte-nojd",
      group: "trygghet",
      question: "Vad gör jag om jag inte är nöjd?",
      answer: [
        "Hör av dig till oss så snart du märker att något inte blev bra. Vi ser till att felet rättas till.",
        `När ${company.legalName} är din avtalspart har du reklamationsrätt enligt konsumenttjänstlagen i 3 år. När ett partnerföretag är din avtalspart gäller samma lag för det företaget, och vi hjälper dig att få kontakt.`,
      ],
      links: [{ href: "/villkor#reklamation", label: "Läs mer om reklamation" }],
    },
  ];
}

/** The five questions on the homepage (SPEC §12). */
export const FAQ_PREVIEW_IDS = [
  "bokningsavgift",
  "hur-mycket-avdrag",
  "vem-kommer",
  "nekat-avdrag",
  "boka-per-telefon",
] as const;

export function faqPreview(options: FaqOptions = {}): FaqItem[] {
  const all = getFaq(options);
  return FAQ_PREVIEW_IDS.map((id) => {
    const item = all.find((q) => q.id === id);
    if (!item) throw new Error(`FAQ preview id "${id}" does not exist`);
    return item;
  });
}

/** Questions grouped for the FAQ page, in FAQ_GROUPS order. */
export function faqByGroup(items: FaqItem[]): { group: FaqGroup; items: FaqItem[] }[] {
  return FAQ_GROUPS.map((group) => ({
    group,
    items: items.filter((i) => i.group === group.id),
  })).filter((g) => g.items.length > 0);
}

/** schema.org FAQPage structured data for the FAQ page. */
export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "sv-SE",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer.join(" "),
      },
    })),
  };
}

/**
 * JSON for a `<script type="application/ld+json">`. Escapes "<" (and the line/paragraph
 * separators) so the content can never close the script tag.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(new RegExp("\\u2028", "g"), "\\u2028")
    .replace(new RegExp("\\u2029", "g"), "\\u2029");
}
