/**
 * Photos in public/bilder. All from Unsplash under the Unsplash License (free for commercial use,
 * no credit required; https://unsplash.com/license). People in them are models, never our
 * customers or staff, so show them as illustrations only.
 *
 * Every photo follows the same rules so the set reads as one shoot: mostly white, grey and light
 * wood; the only strong colour is blue-green (the brand); work and places rather than posed faces;
 * and one colour grade (slightly cooler, softer warm tones, even brightness).
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
  // Swedish nature: the brand story.
  forestRoad: {
    src: "/bilder/skog-gavle.jpg",
    width: 1600,
    height: 1200,
    alt: "Skog sedd uppifrån med en grusväg som slingrar sig genom granarna",
    photographer: "Geranimo",
    place: "Gävle",
    sourceUrl: "https://unsplash.com/photos/aerial-shot-of-road-surrounded-by-green-trees-qzgN45hseN0",
  },
  forestMist: {
    src: "/bilder/dimskog.jpg",
    width: 1600,
    height: 2000,
    alt: "Skog i morgondimma sedd uppifrån",
    photographer: "Christoph Nolte",
    place: "Sverige",
    sourceUrl: "https://unsplash.com/photos/misty-forest-canopy-seen-from-above-at-sunrise-OjNUFawqv3c",
  },
  forestLake: {
    src: "/bilder/skog-sundsvall.jpg",
    width: 1600,
    height: 671,
    alt: "Barrskog och sjöar sedda uppifrån",
    photographer: "Peter van der Meulen",
    place: "Sundsvall",
    sourceUrl: "https://unsplash.com/photos/an-aerial-view-of-a-forest-with-a-lake-in-the-distance-BZ4ZuzDsBLI",
  },
  mountainFarm: {
    src: "/bilder/fjallgard.jpg",
    width: 1600,
    height: 1067,
    alt: "Röda trähus med torvtak vid en sjö, med fjäll i bakgrunden",
    focus: "50% 60%",
    photographer: "Jessica Pamp",
    place: "Sverige",
    sourceUrl: "https://unsplash.com/photos/XiHRIiwq2jY",
  },
  mountainRoad: {
    src: "/bilder/vag-riksgransen.jpg",
    width: 1600,
    height: 1200,
    alt: "En väg slingrar sig genom fjällandskapet mot ett snöfläckigt fjäll",
    photographer: "Niklas Sagrén",
    place: "Riksgränsen",
    sourceUrl: "https://unsplash.com/photos/-jR4ZObzFu0",
  },
  stockholm: {
    src: "/bilder/stockholm.jpg",
    width: 1400,
    height: 933,
    alt: "Stockholm vid vattnet i kvällsljus, med Riddarholmskyrkan",
    photographer: "Jon Flobrant",
    place: "Stockholm",
    sourceUrl: "https://unsplash.com/photos/scenery-of-a-body-of-water-beside-a-city-jxfe3orC4G8",
  },
  // Homes and work: the services.
  cleaning: {
    src: "/bilder/stadning.jpg",
    width: 1600,
    height: 1067,
    alt: "En person i grön tröja och svarta handskar dammsuger en pall",
    focus: "40% 50%",
    photographer: "Giorgio Trovato",
    sourceUrl: "https://unsplash.com/photos/a-woman-in-a-green-shirt-and-black-gloves-vacuuming-a-gray-ottoman-5TXz228u4eo",
  },
  bedroom: {
    src: "/bilder/sovrum.jpg",
    width: 1600,
    height: 1371,
    alt: "Nybäddad säng med vita lakan och en grön växt i morgonljus",
    photographer: "Susan Wilkinson",
    sourceUrl: "https://unsplash.com/photos/white-bed-linen-near-green-plant-gSOdp7YlgNQ",
  },
  bathroom: {
    src: "/bilder/badrum.jpg",
    width: 1600,
    height: 2399,
    alt: "Ljust badrum med mörkgrönt tvättställsskåp",
    focus: "50% 62%",
    photographer: "Tile Merchant Ireland",
    sourceUrl: "https://unsplash.com/photos/9X3dY1BaUTY",
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
  window: {
    src: "/bilder/fonster.jpg",
    width: 1600,
    height: 900,
    alt: "Ett stort spröjsat fönster med gröna träd utanför",
    photographer: "Yikai Sun",
    sourceUrl: "https://unsplash.com/photos/9s8kKkS_Qcw",
  },
  emptyHome: {
    src: "/bilder/tom-bostad.jpg",
    width: 1600,
    height: 1067,
    alt: "Ett tomt, nystädat rum med vita väggar och öppna dörrar",
    photographer: "Pawel Czerwinski",
    sourceUrl: "https://unsplash.com/photos/-LxsAkmUYbI",
  },
} as const satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof photos;
