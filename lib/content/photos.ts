/**
 * Photos in public/bilder. From Unsplash under the Unsplash License (https://unsplash.com/license)
 * and, for the hero, from Pexels under the Pexels License (https://www.pexels.com/license/); both
 * are free for commercial use with no credit required. People in them are models, never our
 * customers or staff, so show them as illustrations only.
 *
 * Every photo shows the work we book: cleaning, moving, painting and building (RUT and ROT), never
 * landscapes or empty rooms. They follow the same rules so the set reads as one shoot: bright
 * homes in white, grey and light wood; the only strong colour is blue-green (the brand); hands and
 * people at work rather than posed faces, and professionals rather than people doing it themselves;
 * and one colour grade (slightly cooler, softer warm tones, even brightness). No readable brand
 * names or number plates.
 *
 * Quality: only photos whose original is at least 4K (3840 × 2160) are used, and the files here
 * are stored at 3840 px on the long side; next/image serves smaller sizes from them.
 *
 * Use them through `PhotoFrame` (components/media) or next/image. `alt` is for when the photo
 * carries meaning; pass `decorative` when the text next to it already says everything.
 */
export interface Photo {
  src: string;
  width: number;
  height: number;
  /** Swedish description for screen readers. */
  alt: string;
  /** CSS object-position when the photo is cropped into a frame. */
  focus?: string;
  photographer: string;
  /** Where it was taken, when Unsplash says so. */
  place?: string;
  sourceUrl: string;
}

export const photos = {
  // Hero collage: professional cleaners at work (Pexels; sharp studio-quality original, 5851 px).
  // The tall collage tile shows the cleaner with the vacuum on the left.
  cleaningTeam: {
    src: "/bilder/stadteam.jpg",
    width: 3840,
    height: 2560,
    alt: "Två städare i arbetskläder dammsuger och moppar ett ljust vardagsrum",
    focus: "27% 50%",
    photographer: "Tima Miroshnichenko",
    sourceUrl: "https://www.pexels.com/photo/women-in-orange-uniform-cleaning-the-floor-6195277/",
  },
  // Hero collage (Pexels; sharp, upright originals of 6000 px).
  heroCleaner: {
    src: "/bilder/stadare-dammsuger.jpg",
    width: 2560,
    height: 3840,
    alt: "En städare i arbetskläder dammsuger ett ljust rum",
    focus: "50% 40%",
    photographer: "Tima Miroshnichenko",
    sourceUrl: "https://www.pexels.com/photo/photo-of-a-woman-using-a-vacuum-cleaner-6196694/",
  },
  heroMover: {
    src: "/bilder/flyttare-kartonger.jpg",
    width: 2560,
    height: 3840,
    alt: "En flyttare bär flyttkartonger i en ljus, tom bostad",
    focus: "45% 40%",
    photographer: "RDNE Stock project",
    sourceUrl: "https://www.pexels.com/photo/light-man-couple-people-7464682/",
  },
  heroPainter: {
    src: "/bilder/malare-vagg.jpg",
    width: 2560,
    height: 3840,
    alt: "En målare rollar en vit innervägg",
    focus: "55% 35%",
    photographer: "Tima Miroshnichenko",
    sourceUrl: "https://www.pexels.com/photo/a-man-in-white-shirt-painting-a-house-6474135/",
  },
  // Cleaning (RUT).
  kitchenWipe: {
    src: "/bilder/stadning-kok.jpg",
    width: 3328,
    height: 3840,
    alt: "Händer sprayar och torkar av diskbänken i ett kök",
    photographer: "everdrop GmbH",
    sourceUrl: "https://unsplash.com/photos/a-woman-is-cleaning-a-kitchen-sink-with-a-rag-SqOMDOQb3ws",
  },
  vacuuming: {
    src: "/bilder/stadning.jpg",
    width: 3840,
    height: 2560,
    alt: "En städare i grön tröja och arbetshandskar dammsuger en pall",
    focus: "45% 50%",
    photographer: "Giorgio Trovato",
    sourceUrl: "https://unsplash.com/photos/a-woman-in-a-green-shirt-and-black-gloves-vacuuming-a-gray-ottoman-5TXz228u4eo",
  },
  steamClean: {
    src: "/bilder/angtvatt.jpg",
    width: 3840,
    height: 2560,
    alt: "Kakelväggen i ett badrum rengörs med en ångtvätt",
    focus: "60% 50%",
    photographer: "Aurum Gebäudereinigung Kassel",
    place: "Kassel",
    sourceUrl: "https://unsplash.com/photos/steam-cleaner-sanitizing-tiled-wall-in-bathroom-LB3y1u7h61c",
  },
  wiping: {
    src: "/bilder/avtorkning.jpg",
    width: 3840,
    height: 3413,
    alt: "Händer i blå handskar torkar av en vit yta",
    photographer: "Anton",
    sourceUrl: "https://unsplash.com/photos/person-wiping-surface-with-paper-towel-SnKfmC1I9fU",
  },
  // Moving (RUT).
  packing: {
    src: "/bilder/packning.jpg",
    width: 3840,
    height: 2160,
    alt: "En person packar flyttkartonger i ett vardagsrum",
    focus: "58% 50%",
    photographer: "Vitaly Gariev",
    sourceUrl: "https://unsplash.com/photos/a-woman-moving-boxes-in-a-living-room-wS40ELZROLE",
  },
  movers: {
    src: "/bilder/barhjalp.jpg",
    width: 3840,
    height: 2908,
    alt: "Två flyttare bär in en inplastad möbel från flyttbilen",
    photographer: "Joseph Prospere",
    place: "Gold Coast",
    sourceUrl: "https://unsplash.com/photos/moving-truck-and-person-carrying-furniture-near-a-building-k0HLWPwfJLU",
  },
  // Painting and building (ROT).
  paintRoller: {
    src: "/bilder/malning-roller.jpg",
    width: 3840,
    height: 2880,
    alt: "En vägg målas vit med en målarroller",
    focus: "45% 40%",
    photographer: "Andrew Itaga",
    sourceUrl: "https://unsplash.com/photos/a-person-using-a-paint-roller-to-paint-a-wall-rMVjOX8nm2U",
  },
  paintKit: {
    src: "/bilder/farg-och-roller.jpg",
    width: 3840,
    height: 2878,
    alt: "En burk grön färg, roller, pensel och målartråg på ett täckpapper",
    photographer: "Annie Spratt",
    sourceUrl: "https://unsplash.com/photos/a-green-paint-can-sitting-on-top-of-a-cardboard-box-712YAykhAD8",
  },
  facadePainter: {
    src: "/bilder/fasadmalare.jpg",
    width: 3840,
    height: 2561,
    alt: "En hantverkare på en stege lagar och målar fasaden på ett vitt hus",
    focus: "45% 55%",
    photographer: "Flow Clark",
    place: "London",
    sourceUrl: "https://unsplash.com/photos/man-in-yellow-shirt-and-blue-denim-jeans-standing-on-white-concrete-building-during-daytime-ioOlenqfMqA",
  },
  carpenter: {
    src: "/bilder/snickare-falun.jpg",
    width: 3840,
    height: 2560,
    alt: "En snickare mäter en bräda med tumstock",
    focus: "65% 50%",
    photographer: "Jimmy Nilsson Masth",
    place: "Falun",
    sourceUrl: "https://unsplash.com/photos/a-man-measuring-a-piece-of-wood-with-a-measuring-tape-ohF5oGzMcUY",
  },
  // Booking categories (step 1 tiles): professionals at work.
  windowCleaner: {
    src: "/bilder/fonsterputsare.jpg",
    width: 3840,
    height: 2560,
    alt: "En fönsterputsare tvättar fönstren på ett hus med en lång stång",
    focus: "18% 45%",
    photographer: "Joshua Bowers",
    sourceUrl: "https://unsplash.com/photos/a-man-holding-a-large-metal-pole-in-front-of-a-house-J4i2xrPmcm0",
  },
  gardener: {
    src: "/bilder/tradgardsmastare.jpg",
    width: 3840,
    height: 2560,
    alt: "En trädgårdsmästare i arbetskläder kör en skottkärra över gräsmattan",
    focus: "35% 50%",
    photographer: "FRAEM GmbH",
    sourceUrl: "https://unsplash.com/photos/a-man-pulling-a-wheelbarrow-with-a-wheel-LVJnIiIeyO0",
  },
  itTechnician: {
    src: "/bilder/it-tekniker.jpg",
    width: 3840,
    height: 2160,
    alt: "En tekniker lagar en öppnad bärbar dator",
    photographer: "Revendo",
    sourceUrl: "https://unsplash.com/photos/a-person-holding-a-laptop-7x0dGJqbfgk",
  },
  homeCare: {
    src: "/bilder/hemtjanst.jpg",
    width: 3840,
    height: 2560,
    alt: "En vårdare serverar te till en kvinna i hennes hem",
    focus: "65% 50%",
    photographer: "Care Assure",
    sourceUrl: "https://unsplash.com/photos/nl8g7l-gvBA",
  },
  bathroomWorker: {
    src: "/bilder/badrum-vvs.jpg",
    width: 3840,
    height: 2560,
    alt: "En hantverkare i arbetsbyxor arbetar i ett badrum",
    focus: "55% 50%",
    photographer: "bhagya laxmi",
    sourceUrl: "https://unsplash.com/photos/a-plumber-repairs-plumbing-in-a-bathroom-jaP5ClBdIyU",
  },
  plumber: {
    src: "/bilder/rormokare.jpg",
    width: 3840,
    height: 3456,
    alt: "En rörmokare drar åt en koppling vid en varmvattenberedare",
    photographer: "Marian Florinel Condruz",
    sourceUrl: "https://unsplash.com/photos/person-holding-yellow-and-gray-hand-tool-C-oYJoIfgCs",
  },
  electrician: {
    src: "/bilder/elektriker.jpg",
    width: 3840,
    height: 2596,
    alt: "En elektriker monterar en armatur på väggen",
    focus: "60% 40%",
    photographer: "Bermix Studio",
    sourceUrl: "https://unsplash.com/photos/a-man-working-on-a-wall-with-a-screwdriver-bAGo7O4prtY",
  },
  roofers: {
    src: "/bilder/takarbete.jpg",
    width: 3840,
    height: 2560,
    alt: "Två takläggare med säkerhetssele arbetar på ett tak",
    photographer: "Raze Solar",
    sourceUrl: "https://unsplash.com/photos/a-couple-of-people-that-are-on-a-roof-MyBBMM317A4",
  },
  groundwork: {
    src: "/bilder/markarbete.jpg",
    width: 3840,
    height: 2550,
    alt: "En minigrävare gräver ett dike i en trädgård",
    focus: "60% 50%",
    photographer: "Annie Spratt",
    sourceUrl: "https://unsplash.com/photos/mini-excavator-digging-a-trench-in-a-garden-zcRPPl4GTME",
  },
} as const satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof photos;

/** Photo for each booking category tile (category ids from lib/catalog/seed.ts). */
export const categoryPhotos: Record<string, PhotoKey> = {
  stadning: "steamClean",
  flytt: "movers",
  fonsterputs: "windowCleaner",
  tradgard: "gardener",
  "hem-it": "itTechnician",
  omsorg: "homeCare",
  maleri: "paintRoller",
  "badrum-kok": "bathroomWorker",
  snickeri: "carpenter",
  el: "electrician",
  vvs: "plumber",
  "tak-fasad": "roofers",
  mark: "groundwork",
};
