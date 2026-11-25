/**
 * How the far land looks (round 117, asked: "improve all background images in the world, like the city and the castle and everything else,
 * dramatically: they still look out of place, not immersed, merged or blended enough into the world"). A far silhouette (data/skylines.ts) was
 * one flat colour with a hard edge and a see-through foot, lighter than the sky on one side and darker on the other. Now each is a form in the
 * night's light (render/skylineFar.ts): its flanks lit or shadowed by the moon, its crest catching the sky, the grain of what it is made of, snow
 * where the cold lies, the air between laid over it as the very light of the sky behind it (thicker low down, with distance and in rain), a
 * paler land behind it, a bank of mist rolling at its foot and, on the tallest, a belt of cloud. Numbers and choices only.
 */

import type { SilhouetteKind } from './skylines';

/** What a far form's face is made of (render/shaders/skylineFar.ts reads the number). */
export const GRAIN = { none: 0, rock: 1, trees: 2, masonry: 3, sand: 4, hide: 5 } as const;

/** A paler layer of land behind a silhouette (drawn first, in the same draw): its own outline, wider or taller, further off. */
export interface Backdrop {
  kind: SilhouetteKind;
  width: number; // × the silhouette's width
  height: number; // × its height
  shift: number; // along its width, as a share of it
  haze: number; // 0..1: the air it lies behind, over the silhouette's own
  depth: number; // how far behind the silhouette it truly stands, as a share of its width: walking past, the nearer moves across the farther
}

export interface FarLook {
  grain: number; // GRAIN
  snow: number; // 0..1: how much of its upper slopes lie under snow
  snowline: number; // the share of its height the snow begins at
  wet: number; // 0..1: the moon's glint off wet stone (R'lyeh, the reef)
  mist: number; // 0..1: how thick the bank of mist at its foot
  mistRise: number; // metres the bank rises at its thickest, besides FAR.mistShare of the silhouette's height
  cloud: number; // 0..1: a belt of cloud across it
  cloudAt: number; // the belt's middle, a share of its height
  trees: number; // 0..1: how thickly its crests and streets are grown with trees (render/skylineShapes.ts)
  back: Backdrop | null;
}

const look = (o: Partial<FarLook>): FarLook => ({ grain: GRAIN.rock, snow: 0, snowline: 0.5, wet: 0, mist: 0.6, mistRise: 10, cloud: 0, cloudAt: 0.5, trees: 0, back: null, ...o });

/** Each kind's own look. */
export const FAR_KINDS: Readonly<Record<SilhouetteKind, FarLook>> = {
  peak: look({ snow: 0.22, snowline: 0.56, mist: 0.75, mistRise: 40, cloud: 0.8, cloudAt: 0.46, back: { kind: 'range', width: 1.6, height: 0.55, shift: 0.06, haze: 0.4, depth: 0.6 } }), // Kadath over its cold waste
  range: look({ snow: 0.55, snowline: 0.34, mist: 0.6, mistRise: 30, cloud: 0.35, cloudAt: 0.6, back: { kind: 'range', width: 1.25, height: 1.3, shift: -0.08, haze: 0.45, depth: 0.5 } }), // and higher peaks loom behind
  city: look({ grain: GRAIN.masonry, wet: 0.7, mist: 0.8, mistRise: 16, back: { kind: 'city', width: 1.15, height: 0.75, shift: 0.1, haze: 0.38, depth: 0.3 } }),
  towers: look({ grain: GRAIN.masonry, mist: 0.6, mistRise: 14, back: { kind: 'towers', width: 1.2, height: 0.72, shift: -0.1, haze: 0.38, depth: 0.3 } }),
  hills: look({ grain: GRAIN.trees, mist: 0.8, mistRise: 12, trees: 0.5, back: { kind: 'hills', width: 1.35, height: 1.3, shift: 0.12, haze: 0.4, depth: 0.45 } }), // ridge behind ridge
  town: look({ grain: GRAIN.masonry, mist: 0.65, mistRise: 7, trees: 0.45, back: { kind: 'hills', width: 1.7, height: 0.55, shift: 0, haze: 0.32, depth: 0.6 } }), // the land it stands on
  reef: look({ wet: 0.8, mist: 0.9, mistRise: 6 }), // spray at its foot
  dunes: look({ grain: GRAIN.sand, mist: 0.45, mistRise: 8, back: { kind: 'dunes', width: 1.3, height: 1.4, shift: 0.1, haze: 0.42, depth: 0.5 } }), // dust
  minarets: look({ grain: GRAIN.masonry, mist: 0.6, mistRise: 10, back: { kind: 'minarets', width: 1.12, height: 0.8, shift: -0.1, haze: 0.36, depth: 0.25 } }),
  titan: look({ grain: GRAIN.hide, mist: 0.85, mistRise: 30, cloud: 0.45, cloudAt: 0.3 }), // the mist about its knees
};

/** A realm's own changes to a kind's look. */
export const FAR_REGIONS: Readonly<Record<string, Partial<Record<SilhouetteKind, Partial<FarLook>>>>> = {
  hub: { hills: { trees: 0.6 } },
  arkham: { hills: { trees: 0.15, grain: GRAIN.rock } }, // the heath's low ridges: bare, a few dead trees
  dunwich: { hills: { trees: 0.35 } }, // the round hills: their tops bare for the stones
  vermont: { hills: { trees: 0.9, mist: 0.9 } }, // the wooded hills of Vermont
  innsmouth: { hills: { trees: 0.3 } },
  providence: { hills: { trees: 0.5 } },
  mountains: { range: { snow: 0.95, snowline: 0.18, cloud: 0.45 } }, // the plateau's ranges under snow from their feet
  dreamlands: { range: { snow: 0.35, snowline: 0.55 } },
  yuggoth: { range: { snow: 0, grain: GRAIN.rock }, towers: { wet: 0.3 } },
  pnakotus: { towers: { grain: GRAIN.masonry, mist: 0.4 } },
  kn_yan: { towers: { mist: 0.85 } }, // the blue murk under the earth
  beyond: { towers: { mist: 0.4 } },
  cloud_summit: { peak: { snow: 0, cloud: 0.95, cloudAt: 0.38, mist: 1, mistRise: 80 } }, // the cloud-sea about the summits
  black_wood: { hills: { trees: 1, grain: GRAIN.hide } }, // a wood that is a body
  pale_lattice: { towers: { mist: 0.3, grain: GRAIN.none } }, // still, clear air between the prisms
  piping_dark: { minarets: { mist: 0.7 } },
  spheres: { towers: { mist: 0.5, wet: 0.5 } },
};

/** A silhouette's look in its realm. */
export const farLookOf = (region: string, kind: SilhouetteKind): FarLook => ({ ...FAR_KINDS[kind], ...FAR_REGIONS[region]?.[kind] });

/** The far land's numbers (render/skyline.ts, render/shaders/skylineFar.ts). */
export const FAR = {
  air: 0.065, // the far air's thickness per metre, as a share of the realm's haze (data/fogs.ts: 0.0035 a metre is a far shape's crest a fifth gone at 1 km, half at 3 km)
  edge: 1, // (2026-11-25) and the near haze over the world's own reach (RENDER.far) as a share, which every far shape lies beyond: it was 15 times clearer than the land 100 m off, and read as nearer than it
  ground: 1.5, // how much thicker the air is at a far shape's foot than over its crest...
  groundRise: 50, // ...thinning over this many metres up it
  weather: 1.5, // a closed sky (rain, storm, gale) thickens the air by this share more
  most: 0.94, // the most of a far shape the air takes: it is never wholly gone while its realm shows it
  shade: 0.26, // a far face in the moon's shadow, × the realm's far colour...
  lit: 1.0, // ...and what a face full in the moon gains over it
  under: 0.52, // and never more than this share of the sky behind it: a far form stands darker than the sky it is seen against (a soft knee from `knee` of it)
  knee: 0.55,
  hue: 0.45, // and how much of the moon's own hue it takes
  crest: 0.22, // how much of the sky's light the crest's last pixel catches (the cut-out's hard edge, softened by what lies behind it)
  rim: 1.3, // the moon's rim along a crest it stands behind
  snow: [0.45, 1.45], // moonlit snow: its light as a share of the night sky's (the middle of its horizon and zenith), in the moon's shadow and full in it
  windowAir: 0.3, // the share of the far air a lit window is greyed by (the stone about it takes all of it): the glow of a far city's windows is what is seen of it (asked: "I liked the glow of the city")
  mistShare: 0.08, // the bank at a far shape's foot rises this share of its height too
  mistAhead: 0.04, // and lies this share of its width before it
  mistWind: 0.6, // the bank rolls along with the realm's wind, at this share of it (it is far: it seems to move slowly)
  footAlpha: 0.0, // the silhouette under its foot line fades to this, into the haze below the horizon
  foot: -0.12, // and its columns reach this far below the foot line (a share of its height)
  columns: { peak: 1300, range: 900, city: 1000, towers: 900, hills: 700, town: 1100, reef: 700, dunes: 600, minarets: 1000, titan: 700 } as Readonly<Record<SilhouetteKind, number>>, // columns across its width (a back layer has BACK_COLUMNS of them per width)
  backColumns: 0.55,
  oblique: 55, // degrees: the most a far shape's face is turned from the eye (it stands where it truly is, facing its realm; seen from far to one side, it turns, as a thing with depth would not fall to a sliver)
  handoff: [100, 150] as const, // metres: a far town's columns nearer than these give way to the real town, which the world draws there
} as const;
