import type {
  Catalog,
  Category,
  FormKind,
  PricingUnit,
  PriceRangeRow,
  RotKind,
  Service,
  ServiceAddon,
  SizeBand,
} from "@/lib/catalog/types";
import type { DeductionType } from "@/lib/taxRules";

/**
 * Starting catalogue and indicative prices.
 *
 * This file is the single source for:
 *  - supabase/seed.sql (generated with `npm run db:seed:generate`)
 *  - the offline fallback when Supabase isn't configured (local dev, tests)
 *
 * In production the database is the source of truth and the admin edits prices there.
 *
 * Prices: entered here as the customer price AFTER deduction for RUT (what people recognise),
 * converted to labour BEFORE deduction incl. VAT (what we store). ROT ranges are entered
 * before deduction. Everything is stored split into labour / material / travel.
 *
 * Market prices, checked October 2026 against the published price lists of Swedish firms and
 * price guides (about 60 sources; cleaning e.g. Freska, Strykfritt, Miljöklar, Städmyran,
 * Qleanex; moving e.g. Pipers, Flexflytt, Ekofox, Miljöklar; trades from Byggahus' 2026 surveys
 * of 39 firms in 13 cities, plus firms' own lists). Ranges are roughly the middle half of what
 * firms charge (25th–75th percentile), so cheap local firms and premium chains both fit.
 * docs/PRICES.md lists every range with its sources.
 */

const kr = (n: number) => Math.round(n * 100);
/** RUT price after 50 % deduction → labour before deduction. */
const rutAfterToLabour = (afterKr: number) => kr(afterKr * 2);

export const categories: Category[] = [
  { id: "stadning", name: "Städning", icon: "sparkles", deductionType: "rut", sort: 10, active: true },
  { id: "flytt", name: "Flytt", icon: "truck", deductionType: "rut", sort: 20, active: true },
  { id: "fonsterputs", name: "Fönsterputs", icon: "window", deductionType: "rut", sort: 30, active: true },
  { id: "tradgard", name: "Trädgård & snö", icon: "tree", deductionType: "rut", sort: 40, active: true },
  { id: "hem-it", name: "Hem-IT & vitvaror", icon: "wifi", deductionType: "rut", sort: 50, active: true },
  { id: "omsorg", name: "Barn- & omsorg", icon: "heart", deductionType: "rut", sort: 60, active: true },
  { id: "maleri", name: "Måla & tapetsera", icon: "paint", deductionType: "rot", sort: 70, active: true },
  { id: "badrum-kok", name: "Badrum & kök", icon: "bath", deductionType: "rot", sort: 80, active: true },
  { id: "snickeri", name: "Snickeri", icon: "hammer", deductionType: "rot", sort: 90, active: true },
  { id: "el", name: "El", icon: "zap", deductionType: "rot", sort: 100, active: true },
  { id: "vvs", name: "VVS & värmepump", icon: "droplet", deductionType: "rot", sort: 110, active: true },
  { id: "tak-fasad", name: "Tak, fasad & fönster", icon: "house", deductionType: "rot", sort: 120, active: true },
  { id: "mark", name: "Mark & dränering", icon: "shovel", deductionType: "rot", sort: 130, active: true },
];

interface ServiceSeed {
  id: string;
  name: string;
  description: string;
  unit: PricingUnit;
  form?: FormKind;
  rotKind?: RotKind;
  model?: Service["model"];
  sizeBand?: boolean;
  homeDetails?: boolean;
  share?: number;
  skv: string;
  warnings?: string[];
  extraCategories?: string[];
}

function build(categoryId: string, type: DeductionType, seeds: ServiceSeed[]): Service[] {
  return seeds.map((s, i) => ({
    id: s.id,
    categoryId,
    extraCategoryIds: s.extraCategories ?? [],
    name: s.name,
    description: s.description,
    deductionType: type,
    model: s.model ?? (type === "rut" ? "seller" : "agent"),
    rotKind: type === "rot" ? (s.rotKind ?? "repair") : null,
    pricingUnit: s.unit,
    labourShareOfTotal: s.share ?? null,
    formKind: s.form ?? "standard",
    askHomeDetails: s.homeDetails ?? false,
    usesSizeBand: s.sizeBand ?? false,
    skvWorkType: s.skv,
    warningIds: s.warnings ?? [],
    sort: (i + 1) * 10,
    active: true,
  }));
}

export const services: Service[] = [
  // ── RUT ──────────────────────────────────────────────────────────────
  ...build("stadning", "rut", [
    {
      id: "hemstadning",
      name: "Hemstädning",
      description: "Löpande städning varje eller varannan vecka, eller en gång.",
      unit: "visit",
      form: "hemstad",
      sizeBand: true,
      homeDetails: true,
      skv: "Städning",
      warnings: ["rut-gemensamma-utrymmen", "rut-hemstajling"],
    },
    {
      id: "storstadning",
      name: "Storstädning",
      description: "Grundlig städning av hela bostaden, inklusive svåra ställen.",
      unit: "job",
      form: "storstad",
      sizeBand: true,
      homeDetails: true,
      skv: "Städning",
      warnings: ["rut-gemensamma-utrymmen"],
    },
    {
      id: "flyttstadning",
      name: "Flyttstädning",
      description: "Städning när du flyttar, med garanti inför besiktningen.",
      unit: "job",
      form: "flyttstad",
      sizeBand: true,
      homeDetails: true,
      skv: "Städning",
      warnings: ["rut-byggstadning", "rut-gemensamma-utrymmen"],
      // Also under Flytt, so the whole move-out package is in one place.
      extraCategories: ["flytt"],
    },
    {
      id: "tvatt-strykning",
      name: "Tvätt och strykning i hemmet",
      description: "Tvätt, strykning och mangling hemma hos dig.",
      unit: "hour",
      skv: "Kläd- och textilvård",
    },
  ]),
  ...build("fonsterputs", "rut", [
    {
      id: "fonsterputs",
      name: "Fönsterputs",
      description: "Puts av fönster in- och utvändigt.",
      unit: "window",
      form: "fonster",
      homeDetails: true,
      skv: "Städning",
      extraCategories: ["stadning"],
    },
  ]),
  ...build("flytt", "rut", [
    {
      id: "packning",
      name: "Packning och uppackning",
      description: "Vi packar ner och packar upp dina saker.",
      unit: "hour",
      sizeBand: false,
      skv: "Flyttjänster",
      warnings: ["rut-flyttbil", "rut-tippen"],
    },
    {
      id: "bara-lasta",
      name: "Bära, lasta och lossa",
      description: "Bärhjälp vid flytt: lastning och lossning.",
      unit: "hour",
      skv: "Flyttjänster",
      warnings: ["rut-flyttbil", "rut-tippen"],
    },
    {
      id: "mobelmontering",
      name: "Montering och demontering av möbler",
      description: "Vi tar isär och sätter ihop möbler vid flytten.",
      unit: "hour",
      skv: "Flyttjänster",
      warnings: ["rut-mobelreparation"],
    },
    {
      id: "upphangning",
      name: "Upphängning av tavlor och lampor vid flytt",
      description: "Vi hänger upp tavlor, hyllor och lampor i nya hemmet.",
      unit: "hour",
      skv: "Möblering",
    },
    {
      id: "secondhand-transport",
      name: "Transport till second hand eller auktion",
      description: "Vi kör bohag till försäljning. Avdraget räknas på halva priset.",
      unit: "job",
      share: 0.5,
      skv: "Transport till försäljning",
      warnings: ["rut-tippen"],
    },
  ]),
  ...build("tradgard", "rut", [
    { id: "grasklippning", name: "Gräsklippning", description: "Klippning av gräsmatta på din tomt.", unit: "hour", skv: "Trädgårdsarbete", warnings: ["rut-robot"] },
    { id: "hackklippning", name: "Häckklippning", description: "Klippning och formning av häckar.", unit: "hour", skv: "Trädgårdsarbete", warnings: ["rut-tippen"] },
    { id: "ograsrensning", name: "Ogräsrensning", description: "Rensning av rabatter och gångar.", unit: "hour", skv: "Trädgårdsarbete" },
    { id: "krattning", name: "Krattning", description: "Krattning av löv och gräs.", unit: "hour", skv: "Trädgårdsarbete", warnings: ["rut-tippen"] },
    { id: "beskarning", name: "Beskärning", description: "Beskärning av träd och buskar.", unit: "hour", skv: "Trädgårdsarbete" },
    { id: "tradfallning", name: "Trädfällning på tomten", description: "Fällning av träd på din tomt.", unit: "hour", skv: "Trädgårdsarbete", warnings: ["rut-tippen"] },
    { id: "stubbfrasning", name: "Stubbfräsning", description: "Fräsning av stubbar på tomten.", unit: "job", skv: "Trädgårdsarbete" },
    { id: "snoskottning", name: "Snöskottning", description: "Skottning av uppfart och gångar vid bostaden.", unit: "hour", skv: "Snöskottning" },
    { id: "takskottning", name: "Takskottning", description: "Skottning av snö från taket.", unit: "hour", skv: "Snöskottning" },
  ]),
  ...build("hem-it", "rut", [
    {
      id: "it-installation",
      name: "Installation av dator, router, wifi och TV",
      description: "Vi installerar och kopplar in utrustningen hemma hos dig.",
      unit: "hour",
      skv: "IT-tjänster",
      warnings: ["rut-fjarrsupport", "rut-larm-robot"],
    },
    {
      id: "it-felsokning",
      name: "Felsökning och reparation på plats",
      description: "Hjälp med dator, nätverk och TV när något krånglar.",
      unit: "hour",
      skv: "IT-tjänster",
      warnings: ["rut-fjarrsupport"],
    },
    {
      id: "vitvaror-reparation",
      name: "Reparation av vitvaror",
      description: "Tvättmaskin, torktumlare, diskmaskin, kyl, frys, ugn, spis eller köksfläkt.",
      unit: "hour",
      form: "vitvaror",
      skv: "Reparation av vitvaror",
      warnings: ["rut-vitvaror-installation"],
    },
  ]),
  ...build("omsorg", "rut", [
    {
      id: "barnpassning",
      name: "Barnpassning",
      description: "Barnpassning i hemmet för barn upp till årskurs 7.",
      unit: "hour",
      skv: "Barnpassning",
      warnings: ["rut-djurpassning"],
    },
    {
      id: "personlig-omsorg",
      name: "Personlig omsorg",
      description: "Hjälp med hygien, promenader, enkla ärenden och enkel matlagning.",
      unit: "hour",
      skv: "Personlig omsorg",
      warnings: ["rut-bidrag", "rut-massage"],
    },
    {
      id: "tillsyn",
      name: "Tillsyn av bostaden",
      description: "Vi tittar till bostaden när du är borta. Vi vattnar, tömmer posten och kollar läget.",
      unit: "visit",
      skv: "Tillsyn av bostad",
    },
  ]),

  // ── ROT (rengöring listed under Städning, labelled ROT 30 %) ───────────
  ...build("stadning", "rot", [
    {
      id: "rot-ventilation",
      name: "Rengöring av ventilationskanaler",
      description: "Rengöring av ventilationskanaler i bostaden.",
      unit: "hour",
      skv: "Rengöring",
    },
    {
      id: "rot-avlopp",
      name: "Rengöring av avlopp",
      description: "Rensning och spolning av avlopp i bostaden.",
      unit: "hour",
      skv: "Rengöring",
    },
    {
      id: "rot-byggstadning",
      name: "Byggstädning efter ROT-arbete",
      description: "Städning efter renovering eller annat ROT-arbete.",
      unit: "hour",
      skv: "Rengöring",
      warnings: ["rot-bortforsling"],
    },
  ]).map((s, i) => ({ ...s, sort: 100 + i * 10 })),
  ...build("maleri", "rot", [
    { id: "malning-inomhus", name: "Målning inomhus", description: "Målning av väggar och tak inomhus.", unit: "m2", skv: "Målning/tapetsering" },
    { id: "tapetsering", name: "Tapetsering", description: "Tapetsering av väggar.", unit: "m2", skv: "Målning/tapetsering" },
    { id: "malning-utomhus", name: "Målning utomhus", description: "Målning av fasad, fönster och knutar.", unit: "m2", skv: "Målning/tapetsering", warnings: ["rot-fristaende"] },
    { id: "malning-dorrar", name: "Målning av dörrar", description: "Målning av innerdörrar och ytterdörrar.", unit: "hour", skv: "Målning/tapetsering" },
    { id: "malning-koksluckor", name: "Målning av köksluckor", description: "Lackering och målning av köksluckor.", unit: "hour", skv: "Målning/tapetsering" },
  ]),
  ...build("badrum-kok", "rot", [
    { id: "badrumsrenovering", name: "Badrumsrenovering", description: "Renovering av badrum, helt eller delvis.", unit: "hour", rotKind: "rebuild", skv: "Bygg", warnings: ["rot-bortforsling", "rot-arkitekt"] },
    { id: "kakel-klinker", name: "Kakel och klinker", description: "Plattsättning av väggar och golv inomhus.", unit: "hour", rotKind: "rebuild", skv: "Bygg" },
    { id: "golv-kok-badrum", name: "Golv i kök eller badrum", description: "Byte eller reparation av golv.", unit: "hour", skv: "Bygg" },
    { id: "fast-inredning", name: "Fast inredning i kök", description: "Byte av köksskåp, bänkskivor och annan fast inredning.", unit: "hour", rotKind: "rebuild", skv: "Bygg", warnings: ["rot-bortforsling"] },
    { id: "vitvaror-installation", name: "Installation av vitvaror vid renovering", description: "Installation av inbyggda vitvaror när köket renoveras.", unit: "hour", rotKind: "rebuild", skv: "Bygg" },
  ]),
  ...build("snickeri", "rot", [
    { id: "golvlaggning", name: "Golvläggning", description: "Läggning, slipning och reparation av golv.", unit: "hour", skv: "Bygg" },
    { id: "vaggar-tak", name: "Väggar och innertak", description: "Nya eller ändrade väggar och innertak.", unit: "hour", rotKind: "rebuild", skv: "Bygg" },
    { id: "dorrar-las", name: "Dörrar och lås", description: "Byte och justering av dörrar och lås.", unit: "hour", skv: "Bygg", warnings: ["rot-larm"] },
    { id: "trappor", name: "Trappor", description: "Byte eller renovering av trappor inomhus.", unit: "hour", skv: "Bygg" },
    { id: "garderober", name: "Inbyggda garderober", description: "Platsbyggda garderober och förvaring.", unit: "hour", rotKind: "rebuild", skv: "Bygg" },
    { id: "altan-balkong", name: "Altan eller balkong fäst i huset", description: "Altan eller balkong som sitter fast i huset.", unit: "hour", rotKind: "rebuild", skv: "Bygg", warnings: ["rot-fristaende", "rot-brf-utanfor"] },
  ]),
  ...build("el", "rot", [
    { id: "eldragning", name: "Ny- och omdragning av el", description: "Nya ledningar eller omdragning av el i bostaden.", unit: "hour", rotKind: "rebuild", skv: "El" },
    { id: "eluttag", name: "Uttag och strömbrytare", description: "Nya eller flyttade uttag och strömbrytare.", unit: "hour", skv: "El" },
    { id: "elcentral", name: "Byte av elcentral", description: "Byte eller uppgradering av elcentral.", unit: "hour", skv: "El" },
    { id: "spotlights", name: "Spotlights och fast belysning", description: "Installation av infälld och fast belysning.", unit: "hour", rotKind: "rebuild", skv: "El", warnings: ["rot-larm"] },
    { id: "laddbox", name: "Väggmonterad laddbox", description: "Installation av laddbox på husväggen.", unit: "hour", skv: "El", warnings: ["rot-laddstolpe"] },
  ]),
  ...build("vvs", "rot", [
    { id: "rorarbeten", name: "Rörarbeten", description: "Byte och reparation av vatten- och värmerör.", unit: "hour", skv: "VVS" },
    { id: "avlopp", name: "Avlopp", description: "Byte och reparation av avloppsrör i huset.", unit: "hour", skv: "VVS" },
    { id: "varmepump", name: "Värmepump", description: "Installation och byte av värmepump.", unit: "hour", skv: "VVS" },
  ]),
  ...build("tak-fasad", "rot", [
    { id: "takbyte", name: "Takbyte", description: "Byte eller renovering av tak.", unit: "hour", skv: "Bygg", warnings: ["rot-fristaende"] },
    { id: "platarbeten", name: "Plåtarbeten", description: "Plåtarbeten på tak och fasad.", unit: "hour", skv: "Glas/plåtarbete" },
    { id: "hangrannor", name: "Hängrännor och stuprör", description: "Byte och reparation av hängrännor.", unit: "hour", skv: "Glas/plåtarbete" },
    { id: "fonsterbyte", name: "Fönsterbyte", description: "Byte av fönster och fönsterdörrar.", unit: "hour", skv: "Glas/plåtarbete" },
    { id: "inglasning", name: "Inglasning av balkong", description: "Inglasning av balkong eller altan fäst i huset.", unit: "hour", rotKind: "rebuild", skv: "Glas/plåtarbete", warnings: ["rot-brf-utanfor"] },
    { id: "fasadtvatt", name: "Fasad- och taktvätt", description: "Tvätt av fasad och tak.", unit: "hour", skv: "Rengöring" },
    { id: "skorsten", name: "Murning och sotning: skorsten", description: "Murning och renovering av skorsten.", unit: "hour", skv: "Murning" },
    { id: "kamin", name: "Murning och sotning: kamin", description: "Installation och murning av kamin.", unit: "hour", rotKind: "rebuild", skv: "Murning" },
    { id: "kakelugn", name: "Murning och sotning: kakelugn", description: "Renovering av kakelugn.", unit: "hour", skv: "Murning" },
  ]),
  ...build("mark", "rot", [
    { id: "dranering", name: "Dränering av husgrund", description: "Dränering runt husets grund.", unit: "hour", skv: "Mark/dräneringsarbete", warnings: ["rot-markarbeten"] },
    { id: "gravning", name: "Grävning för avlopp, vatten, el eller fiber", description: "Grävning för ledningar till huset.", unit: "hour", skv: "Mark/dräneringsarbete", warnings: ["rot-markarbeten"] },
  ]),
];

export const addons: ServiceAddon[] = [
  { id: "flytt-ugn", serviceId: "flyttstadning", label: "Ugn", included: true, perWindow: false, labourMin: 0, labourMax: 0, sort: 10 },
  { id: "flytt-kyl", serviceId: "flyttstadning", label: "Kyl och frys", included: true, perWindow: false, labourMin: 0, labourMax: 0, sort: 20 },
  { id: "flytt-balkong", serviceId: "flyttstadning", label: "Balkong", included: false, perWindow: false, labourMin: rutAfterToLabour(150), labourMax: rutAfterToLabour(300), sort: 30 },
  { id: "flytt-inglasad", serviceId: "flyttstadning", label: "Inglasad balkong", included: false, perWindow: false, labourMin: rutAfterToLabour(300), labourMax: rutAfterToLabour(500), sort: 40 },
  { id: "flytt-sprojs", serviceId: "flyttstadning", label: "Spröjsade fönster", included: false, perWindow: false, labourMin: rutAfterToLabour(200), labourMax: rutAfterToLabour(400), sort: 50 },
  { id: "flytt-forrad", serviceId: "flyttstadning", label: "Förråd", included: false, perWindow: false, labourMin: rutAfterToLabour(200), labourMax: rutAfterToLabour(300), sort: 60 },
  { id: "fonster-sprojs", serviceId: "fonsterputs", label: "Spröjsade fönster", included: false, perWindow: true, labourMin: rutAfterToLabour(25), labourMax: rutAfterToLabour(35), sort: 10 },
  { id: "storstad-ugn", serviceId: "storstadning", label: "Ugn", included: false, perWindow: false, labourMin: rutAfterToLabour(250), labourMax: rutAfterToLabour(500), sort: 10 },
  { id: "storstad-kyl", serviceId: "storstadning", label: "Kyl och frys", included: false, perWindow: false, labourMin: rutAfterToLabour(200), labourMax: rutAfterToLabour(300), sort: 20 },
  { id: "storstad-fonster", serviceId: "storstadning", label: "Fönsterputs", included: false, perWindow: false, labourMin: rutAfterToLabour(400), labourMax: rutAfterToLabour(700), sort: 30 },
];

/** [band, min, max] – customer price AFTER RUT in kronor. */
type BandRow = [SizeBand, number, number];

function bandRows(serviceId: string, rows: BandRow[], note: string | null = null): PriceRangeRow[] {
  return rows.map(([sizeBand, min, max]) => ({
    serviceId,
    sizeBand,
    labourMin: rutAfterToLabour(min),
    labourMax: rutAfterToLabour(max),
    materialMin: 0,
    materialMax: 0,
    travelMin: 0,
    travelMax: 0,
    note,
  }));
}

/** One row regardless of size. RUT: after-deduction kronor. */
function rutRow(serviceId: string, min: number, max: number, note: string | null = null): PriceRangeRow {
  return {
    serviceId,
    sizeBand: null,
    labourMin: rutAfterToLabour(min),
    labourMax: rutAfterToLabour(max),
    materialMin: 0,
    materialMax: 0,
    travelMin: 0,
    travelMax: 0,
    note,
  };
}

/** One row regardless of size. ROT: before-deduction kronor, labour only. */
function rotRow(serviceId: string, min: number, max: number, note: string | null = null): PriceRangeRow {
  return {
    serviceId,
    sizeBand: null,
    labourMin: kr(min),
    labourMax: kr(max),
    materialMin: 0,
    materialMax: 0,
    travelMin: 0,
    travelMax: 0,
    note,
  };
}

const CARPENTER_NOTE = "Per timme, före ROT-avdrag. Material och framkörning tillkommer.";
const ELECTRICIAN_NOTE = "Per timme, före ROT-avdrag. Material och framkörning tillkommer.";
const PLUMBER_NOTE = "Per timme, före ROT-avdrag. Material och framkörning tillkommer.";

export const ranges: PriceRangeRow[] = [
  // Cleaning: firms' published size-band prices after RUT (14–15 firms per band).
  ...bandRows(
    "flyttstadning",
    [
      ["0-39", 1_700, 2_100],
      ["40-59", 1_900, 2_800],
      ["60-79", 2_300, 3_600],
      ["80-99", 2_700, 4_500],
      ["100-129", 3_100, 5_300],
      ["130-159", 3_500, 5_600],
      ["160+", 4_000, 6_400],
    ],
    "Ugn, kyl, frys och fönster ingår oftast.",
  ),
  ...bandRows(
    "hemstadning",
    [
      ["0-39", 600, 900],
      ["40-59", 850, 1_000],
      ["60-79", 900, 1_200],
      ["80-99", 950, 1_400],
      ["100-129", 1_100, 1_700],
      ["130-159", 1_300, 1_900],
      ["160+", 1_500, 2_200],
    ],
    "Per städtillfälle när vi städar varannan vecka (oftast 250–320 kr i timmen). Varje vecka blir något billigare, en gång i månaden något dyrare.",
  ),
  ...bandRows("storstadning", [
    ["0-39", 1_800, 2_300],
    ["40-59", 1_900, 2_400],
    ["60-79", 2_300, 3_300],
    ["80-99", 2_700, 3_800],
    ["100-129", 3_100, 4_700],
    ["130-159", 3_600, 5_200],
    ["160+", 3_900, 5_500],
  ]),
  rutRow("fonsterputs", 60, 95, "Per fönster med fyra sidor. Spröjsade fönster kostar cirka 30 kr mer. Många tar minst 650–950 kr per tillfälle."),
  rutRow("tvatt-strykning", 250, 330),
  // Moving: per person and hour, as firms price bärhjälp and packing.
  rutRow("packning", 300, 420, "Per person och timme. Flyttkartonger och material tillkommer."),
  rutRow("bara-lasta", 300, 420, "Per person och timme. Lastbil kostar extra om du behöver en, och ger inget avdrag."),
  rutRow("mobelmontering", 400, 500, "Per person och timme."),
  rutRow("upphangning", 400, 500, "Per person och timme."),
  // Second-hand transport: whole price before deduction; deduction is 25 % of it.
  {
    serviceId: "secondhand-transport",
    sizeBand: null,
    labourMin: kr(1_200),
    labourMax: kr(3_200),
    materialMin: 0,
    materialMax: 0,
    travelMin: 0,
    travelMax: 0,
    note: "Från några möbler upp till ett halvt flyttlass. Avdraget är 25 % av hela priset, eftersom halva priset räknas som arbete.",
  },
  ...["grasklippning", "hackklippning", "ograsrensning", "krattning"].map((id) => rutRow(id, 250, 380)),
  rutRow("beskarning", 300, 450),
  rutRow("tradfallning", 400, 700, "Per timme. Bortforsling av ris och stammar ger inget avdrag."),
  rutRow("stubbfrasning", 1_100, 1_600, "För första stubben, med framkörning. Varje extra stubbe kostar oftast 350–550 kr."),
  rutRow("snoskottning", 290, 400, "Per person och timme."),
  rutRow("takskottning", 375, 500, "Per person och timme. Oftast två på taket och en vakt på marken."),
  rutRow("it-installation", 400, 700),
  rutRow("it-felsokning", 400, 700),
  rutRow("vitvaror-reparation", 700, 800, "Reservdelar och framkörning tillkommer."),
  rutRow("barnpassning", 180, 250),
  rutRow("personlig-omsorg", 250, 350),
  rutRow("tillsyn", 200, 350, "Per besök."),
  // Painting: labour per m² (Hemfixarna, Offerta, NLL Måleri, fixed room prices in Göteborg).
  rotRow("malning-inomhus", 160, 300, "Per m² vägg, före ROT-avdrag. Tak kostar cirka 10 % mer. Färg och material tillkommer."),
  rotRow("tapetsering", 250, 450, "Per m² vägg, före ROT-avdrag. Tapet tillkommer. Att ta bort gammal tapet kostar cirka 50–150 kr/m² extra."),
  rotRow("malning-utomhus", 200, 450, "Per m² fasad, före ROT-avdrag. Material tillkommer, och ställning kostar extra på hus med mer än ett plan."),
  rotRow("malning-dorrar", 600, 750, "Per timme, före ROT-avdrag. En innerdörr kostar oftast 1 000–2 000 kr att måla."),
  rotRow("malning-koksluckor", 600, 750, "Per timme, före ROT-avdrag. Räkna med 300–600 kr per lucka, eller 6 000–15 000 kr för ett helt kök."),
  // Bathroom and kitchen: hourly rates, with what a whole job usually costs.
  rotRow("badrumsrenovering", 700, 900, "Per timme, före ROT-avdrag. Ett helt badrum på 4–5 m² kostar oftast 140 000–220 000 kr med material."),
  rotRow("kakel-klinker", 700, 850, "Per timme, före ROT-avdrag. Plattsättning kostar oftast 650–1 100 kr per m². Tätskikt och material tillkommer."),
  rotRow("golv-kok-badrum", 650, 850, CARPENTER_NOTE),
  rotRow("fast-inredning", 650, 800, "Per timme, före ROT-avdrag. Montering av ett vanligt kök kostar oftast 20 000–45 000 kr i arbete."),
  rotRow("vitvaror-installation", 650, 850, CARPENTER_NOTE),
  // Carpenter: Byggahus 2026 (mean 707 kr/h), JK Snickare, Offerta, BraByggare.
  ...["golvlaggning", "vaggar-tak", "dorrar-las", "trappor", "garderober", "altan-balkong"].map((id) =>
    rotRow(id, 650, 800, CARPENTER_NOTE),
  ),
  // Electrician: Byggahus 2026 (mean 835 kr/h), Elkontakten, FRESAB, Jourpartner.
  ...["eldragning", "eluttag", "spotlights", "laddbox"].map((id) => rotRow(id, 750, 950, ELECTRICIAN_NOTE)),
  rotRow("elcentral", 750, 950, "Per timme, före ROT-avdrag. Ett byte kostar oftast 8 000–20 000 kr i lägenhet och 12 000–30 000 kr i villa, med material."),
  // Plumber: Byggahus 2026 (mean 851 kr/h), Täby VVS, Jourpartner, Rörfiness.
  ...["rorarbeten", "avlopp"].map((id) => rotRow(id, 800, 950, PLUMBER_NOTE)),
  rotRow("varmepump", 800, 950, "Per timme, före ROT-avdrag. Att installera en luft/vatten- eller bergvärmepump kostar oftast 20 000–40 000 kr i arbete."),
];

export const seedCatalog: Catalog = {
  categories,
  services,
  addons,
  ranges,
  config: { petsSurchargePct: 10, extraFloorSurchargePct: 5, taxOverrides: [] },
  source: "seed",
};
