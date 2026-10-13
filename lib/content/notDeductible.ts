import type { DeductionType } from "@/lib/taxRules";

/**
 * Things that do NOT give RUT or ROT. Used on /vad-ger-inte-avdrag and as warning chips
 * in the request flow (services reference these ids via `warningIds`).
 * TODO(jurist/skatterådgivare): review against Skatteverket's current lists before launch.
 */
export interface NotDeductibleItem {
  id: string;
  type: DeductionType;
  title: string;
  detail?: string;
}

export const notDeductible: NotDeductibleItem[] = [
  // RUT
  {
    id: "rut-byggstadning",
    type: "rut",
    title: "Byggstädning",
    detail: "Ger inte RUT. Byggstädning efter ROT-arbete kan i stället ge ROT-avdrag.",
  },
  {
    id: "rut-flyttbil",
    type: "rut",
    title: "Hyra av flyttbil, bränsle, flyttkartonger och magasinering",
    detail: "Bara själva arbetet med att packa, bära och lasta ger RUT.",
  },
  { id: "rut-resor", type: "rut", title: "Resor och reseersättning" },
  { id: "rut-tippen", type: "rut", title: "Körning till tippen eller återvinningen" },
  { id: "rut-hemstajling", type: "rut", title: "Hemstajling" },
  { id: "rut-mobelreparation", type: "rut", title: "Reparation av möbler" },
  { id: "rut-djurpassning", type: "rut", title: "Djurpassning" },
  {
    id: "rut-larm-robot",
    type: "rut",
    title: "Larm, kameror, robotdammsugare och robotgräsklippare",
  },
  {
    id: "rut-robot",
    type: "rut",
    title: "Installation eller skötsel av robotgräsklippare",
  },
  {
    id: "rut-vitvaror-installation",
    type: "rut",
    title: "Installation av vitvaror",
    detail: "Ger inte RUT. Vid renovering av kök kan installationen ge ROT-avdrag.",
  },
  { id: "rut-fjarrsupport", type: "rut", title: "Fjärrsupport och hjälp via telefon" },
  {
    id: "rut-gemensamma-utrymmen",
    type: "rut",
    title: "Gemensamma utrymmen, t.ex. trapphus och källare",
  },
  { id: "rut-massage", type: "rut", title: "Massage och fotvård" },
  {
    id: "rut-bidrag",
    type: "rut",
    title: "Arbete som redan får bidrag, t.ex. hemtjänst",
  },

  // ROT
  {
    id: "rot-nybyggnation",
    type: "rot",
    title: "Nybyggnation, friggebod, garage, fristående byggnader och rivning",
  },
  {
    id: "rot-fristaende",
    type: "rot",
    title: "Fristående byggnader som förråd, friggebod och garage",
  },
  {
    id: "rot-markarbeten",
    type: "rot",
    title: "Staket, murar, plattsättning på mark, uppfart, gräsmatta, asfalt och pool",
  },
  {
    id: "rot-arkitekt",
    type: "rot",
    title: "Arkitekt, bygglovsritningar, besiktning och energideklaration",
  },
  { id: "rot-skadedjur", type: "rot", title: "Skadedjursbekämpning" },
  { id: "rot-bortforsling", type: "rot", title: "Bortforsling av avfall" },
  { id: "rot-larm", type: "rot", title: "Larm" },
  {
    id: "rot-laddstolpe",
    type: "rot",
    title: "Fristående laddstolpe",
    detail:
      "Kan ge avdrag för grön teknik i stället. Grön teknik och ROT kan inte kombineras för samma arbete.",
  },
  { id: "rot-hyresratt", type: "rot", title: "Arbete i en hyresrätt" },
  {
    id: "rot-brf-utanfor",
    type: "rot",
    title: "I bostadsrätt: balkong, terrass och allt utanför lägenheten",
    detail: "Det ansvarar föreningen för, så det ger inte ROT för dig.",
  },
];

export function notDeductibleById(id: string): NotDeductibleItem | undefined {
  return notDeductible.find((i) => i.id === id);
}
