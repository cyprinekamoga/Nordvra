/**
 * Photos in public/bilder. All from Unsplash under the Unsplash License (free for commercial use,
 * no credit required; https://unsplash.com/license). People in them are models, never our
 * customers or staff, so show them as illustrations only.
 *
 * Use them through `PhotoFrame` (components/media). `alt` is for when the photo carries meaning;
 * pass `decorative` when the text next to it already says everything.
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
  sourceUrl: string;
}

export const photos = {
  cleaningSink: {
    src: "/bilder/stadning-diskbank.jpg",
    width: 1400,
    height: 933,
    alt: "Händer som torkar av en diskbänk med en grön sprayflaska",
    focus: "62% 50%",
    photographer: "everdrop GmbH",
    sourceUrl: "https://unsplash.com/photos/a-woman-is-cleaning-a-kitchen-sink-with-a-rag-SqOMDOQb3ws",
  },
  cleaningBottles: {
    src: "/bilder/stadning-flaskor.jpg",
    width: 1400,
    height: 1050,
    alt: "Två bruna sprayflaskor och en diskborste på ett träbord",
    photographer: "Daiga Ellaby",
    sourceUrl: "https://unsplash.com/photos/two-brown-spray-bottles-on-brown-table-uooMllXe6gE",
  },
  kitchen: {
    src: "/bilder/kok-ljust.jpg",
    width: 1400,
    height: 933,
    alt: "Ljust kök med vita skåp, trägolv och en stor växt",
    photographer: "Lisa Anna",
    sourceUrl: "https://unsplash.com/photos/a-kitchen-with-white-cabinets-and-wooden-floors-KuLVrz8KWs0",
  },
  livingRoom: {
    src: "/bilder/vardagsrum.jpg",
    width: 1400,
    height: 1050,
    alt: "Ljust vardagsrum med vit soffa och gröna växter",
    photographer: "Collov Home Design",
    sourceUrl: "https://unsplash.com/photos/living-room-with-white-sofa-set-and-green-potted-plant-NTaF5rBmlyE",
  },
  movingBoxes: {
    src: "/bilder/flytt-kartonger.jpg",
    width: 1400,
    height: 788,
    alt: "Ett par sitter på golvet bland flyttkartonger i sitt nya hem",
    focus: "45% 50%",
    photographer: "Vitaly Gariev",
    sourceUrl: "https://unsplash.com/photos/couple-sitting-among-moving-boxes-in-new-home-QpRjfYmGtbk",
  },
  keys: {
    src: "/bilder/nycklar.jpg",
    width: 1400,
    height: 934,
    alt: "En hand håller husnycklar framför en ytterdörr",
    focus: "35% 50%",
    photographer: "Jakub Żerdzicki",
    sourceUrl: "https://unsplash.com/photos/holding-house-keys-in-front-of-the-entrance-bqUZEAeWuok",
  },
  carpenter: {
    src: "/bilder/snickare.jpg",
    width: 1400,
    height: 933,
    alt: "En snickare arbetar med en träbit vid en arbetsbänk",
    focus: "55% 60%",
    photographer: "Minh Đức",
    sourceUrl: "https://unsplash.com/photos/carpenter-working-on-wood-with-tools-in-workshop-lQIUbkn6jj4",
  },
  redHouse: {
    src: "/bilder/rott-hus.jpg",
    width: 1400,
    height: 933,
    alt: "Rött trähus med vita knutar bakom en gärdsgård",
    focus: "50% 45%",
    photographer: "Christer Lässman",
    sourceUrl: "https://unsplash.com/photos/a-red-house-with-a-red-fence-in-front-of-it-LD4q7uNlfoY",
  },
  stockholm: {
    src: "/bilder/stockholm.jpg",
    width: 1400,
    height: 933,
    alt: "Stockholm vid vattnet i kvällsljus, med Riddarholmskyrkan",
    photographer: "Jon Flobrant",
    sourceUrl: "https://unsplash.com/photos/scenery-of-a-body-of-water-beside-a-city-jxfe3orC4G8",
  },
} as const satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof photos;
