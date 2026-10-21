/**
 * "Checklista inför besiktningen": what a move-out inspection usually checks, room by room.
 * Shown on /flyttstadning-checklista and linked from the flow and the booking page.
 */

export interface ChecklistRoom {
  id: string;
  title: string;
  items: readonly string[];
}

export const moveOutChecklist: readonly ChecklistRoom[] = [
  {
    id: "kok",
    title: "Kök",
    items: [
      "Ugn, plåtar och galler rengjorda, även ugnsluckans glas",
      "Spisen, även under och bakom den när den går att dra ut",
      "Köksfläkt och fettfilter",
      "Kyl och frys avfrostade, rengjorda och lämnade på glänt",
      "Diskmaskin, filter och gummilister",
      "Skåp och lådor, in- och utvändigt",
      "Kakel, diskbänk och kranar avkalkade",
    ],
  },
  {
    id: "badrum",
    title: "Badrum och tvätt",
    items: [
      "Kakel och fogar fria från kalk och smuts",
      "Golvbrunnen rensad",
      "Toalett, även runt foten och bakom",
      "Handfat, kranar, spegel och badrumsskåp",
      "Badkar eller dusch, duschvägg och duschslang",
      "Tvättmaskinens filter och tvättmedelsfack",
    ],
  },
  {
    id: "alla-rum",
    title: "Alla rum",
    items: [
      "Golv och golvlister",
      "Dörrar, karmar och handtag",
      "Strömbrytare och eluttag",
      "Element, även bakom och mellan flänsarna",
      "Fönster in- och utvändigt och mellan glasen, fönsterbänkar och karmar",
      "Garderober och hyllor, in- och utvändigt",
      "Ventiler och lampor",
    ],
  },
  {
    id: "ovrigt",
    title: "Balkong och förråd",
    items: [
      "Balkongen sopad och balkongdörren putsad",
      "Förrådet tömt och sopat",
    ],
  },
];

/** What the customer does around the inspection. */
export const inspectionTips: readonly string[] = [
  "Se till att allt är utflyttat innan städningen börjar, även i förråd och på balkong.",
  "Var gärna med på besiktningen och be om anmärkningarna skriftligt.",
  "Blir något underkänt: anmäl det på din bokningssida eller ring oss samma dag. Vi städar om utan kostnad.",
  "Spara bilderna i fotorapporten. De visar hur bostaden såg ut när städningen var klar.",
];
