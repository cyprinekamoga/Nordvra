/**
 * Photos in public/bilder. All from Unsplash under the Unsplash License (free for commercial use,
 * no credit required; https://unsplash.com/license). People in them are models, never our
 * customers or staff, so show them as illustrations only.
 *
 * Every photo shows the work we book: cleaning, moving, painting and building (RUT and ROT), never
 * landscapes or empty rooms. They follow the same rules so the set reads as one shoot: bright
 * homes in white, grey and light wood; the only strong colour is blue-green (the brand); hands and
 * people at work rather than posed faces; and one colour grade (slightly cooler, softer warm tones,
 * even brightness). No readable brand names or number plates.
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
  // Cleaning (RUT).
  mopping: {
    src: "/bilder/flyttstadning.jpg",
    width: 1600,
    height: 900,
    alt: "En person moppar golvet i ett ljust, nästan tomt vardagsrum",
    focus: "30% 50%",
    photographer: "Vitaly Gariev",
    sourceUrl: "https://unsplash.com/photos/a-woman-mops-a-bright-modern-living-room-floor-2NcTLdFHpH8",
  },
  moppingLiving: {
    src: "/bilder/golvmopp.jpg",
    width: 1600,
    height: 900,
    alt: "En person i gula handskar moppar trägolvet i ett vardagsrum",
    focus: "70% 50%",
    photographer: "Vitaly Gariev",
    sourceUrl: "https://unsplash.com/photos/woman-with-headphones-mopping-a-wooden-floor-YWS51jdrfdA",
  },
  kitchenWipe: {
    src: "/bilder/stadning-kok.jpg",
    width: 1040,
    height: 1200,
    alt: "Händer sprayar och torkar av diskbänken i ett kök",
    photographer: "everdrop GmbH",
    sourceUrl: "https://unsplash.com/photos/a-woman-is-cleaning-a-kitchen-sink-with-a-rag-SqOMDOQb3ws",
  },
  vacuuming: {
    src: "/bilder/stadning.jpg",
    width: 1600,
    height: 1067,
    alt: "En person i grön tröja och svarta handskar dammsuger en pall",
    focus: "40% 50%",
    photographer: "Giorgio Trovato",
    sourceUrl: "https://unsplash.com/photos/a-woman-in-a-green-shirt-and-black-gloves-vacuuming-a-gray-ottoman-5TXz228u4eo",
  },
  steamClean: {
    src: "/bilder/angtvatt.jpg",
    width: 1600,
    height: 1067,
    alt: "Kakelväggen i ett badrum rengörs med en ångtvätt",
    focus: "60% 50%",
    photographer: "Aurum Gebäudereinigung Kassel",
    place: "Kassel",
    sourceUrl: "https://unsplash.com/photos/steam-cleaner-sanitizing-tiled-wall-in-bathroom-LB3y1u7h61c",
  },
  wiping: {
    src: "/bilder/avtorkning.jpg",
    width: 1350,
    height: 1200,
    alt: "Händer i blå handskar torkar av en vit yta",
    photographer: "Anton",
    sourceUrl: "https://unsplash.com/photos/person-wiping-surface-with-paper-towel-SnKfmC1I9fU",
  },
  // Moving (RUT).
  packing: {
    src: "/bilder/packning.jpg",
    width: 1600,
    height: 900,
    alt: "En person packar flyttkartonger i ett vardagsrum",
    focus: "58% 50%",
    photographer: "Vitaly Gariev",
    sourceUrl: "https://unsplash.com/photos/a-woman-moving-boxes-in-a-living-room-wS40ELZROLE",
  },
  movingTruck: {
    src: "/bilder/flyttbil.jpg",
    width: 1100,
    height: 1078,
    alt: "En flyttbil med öppna bakdörrar lastas med möbler och kartonger",
    photographer: "Egor Ivlev",
    sourceUrl: "https://unsplash.com/photos/a-man-unloading-furniture-from-the-back-of-a-moving-truck-rEqEQK_DFJE",
  },
  // Painting and building (ROT).
  paintRoller: {
    src: "/bilder/malning-roller.jpg",
    width: 1600,
    height: 1200,
    alt: "En vägg målas vit med en målarroller",
    focus: "45% 40%",
    photographer: "Andrew Itaga",
    sourceUrl: "https://unsplash.com/photos/a-person-using-a-paint-roller-to-paint-a-wall-rMVjOX8nm2U",
  },
  paintKit: {
    src: "/bilder/farg-och-roller.jpg",
    width: 1600,
    height: 1199,
    alt: "En burk grön färg, roller, pensel och målartråg på ett täckpapper",
    photographer: "Annie Spratt",
    sourceUrl: "https://unsplash.com/photos/a-green-paint-can-sitting-on-top-of-a-cardboard-box-712YAykhAD8",
  },
  carpenter: {
    src: "/bilder/snickare-falun.jpg",
    width: 1600,
    height: 1067,
    alt: "En snickare mäter en bräda med tumstock",
    focus: "65% 50%",
    photographer: "Jimmy Nilsson Masth",
    place: "Falun",
    sourceUrl: "https://unsplash.com/photos/a-man-measuring-a-piece-of-wood-with-a-measuring-tape-ohF5oGzMcUY",
  },
} as const satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof photos;
