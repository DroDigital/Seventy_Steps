/**
 * Round 80, atmosphere: the weather in each land's own matter (render/weather.ts). The same storm, the same sight lines, the same
 * rules (systems/weather.ts is untouched: what a region has and when), but a gale on the Mountains of Madness is a ground blizzard of
 * driven snow and a storm there a full one (no rain, no puddles on the snow); Pnakotus's storm is a hissing sand-wind; Arkham's gale
 * throws the heath's grey ash and Innsmouth's the reef's salt spray, and leaves tumble only where trees stand. A realm without a row
 * is the default, which is what the weather has always drawn, so the hub and every unlisted realm are as they were. Data only.
 */

import type { Vec3 } from './tuning';

/** What the streaks of a spell of rain or storm are: rain, driven snow or sand. */
export type Precip = 'rain' | 'snow' | 'sand';

export interface Fleck {
  shape: 'shard' | 'disc' | 'spark';
  size: number; // metres
  colors: readonly [Vec3, Vec3]; // one or the other
  alpha: number;
  gravity: number; // m/s² down: leaves are heavy, snow and spray are not
}

export interface WeatherSkin {
  precip: Precip;
  dust: Vec3; // the strands a gale or storm drives past...
  cloud: Vec3; // ...and the clouds of it
  /** What tumbles in the gale's wind where leaves do not: grit, ash, snow, spray. Null: the leaves of every land. */
  fleck: Fleck | null;
  wet: number; // 0..1: how far the ground takes the wet of the rain (0: snow and sand stay dry)
  streak: Vec3; // the colour of the lines of rain, snow or sand
  thick: number; // how heavily its strands and clouds are laid (1: as ever)
  /** The share of the fog's reach a spell takes at its fullest, where it is not the weather's own (data/lifeTuning.ts WEATHER.haze). */
  haze?: Readonly<Record<string, number>>;
  /** The bed that is heard under it: 'wind' where the rain's wash would be wrong (the sound: render/audio/weatherBed.ts). */
  bed?: 'wind';
  /** The dream's motes in this land: the lights (born and dying) and the share of them that are petals. */
  motes: { a: Vec3; aEnd: Vec3; b: Vec3; bEnd: Vec3; petals: number };
}

/** The weather as it has always been drawn. */
export const DEFAULT_SKIN: WeatherSkin = {
  precip: 'rain',
  dust: [0.38, 0.36, 0.32],
  cloud: [0.34, 0.32, 0.28],
  fleck: null,
  wet: 1,
  streak: [0.58, 0.64, 0.72],
  thick: 1,
  motes: { a: [0.96, 0.84, 0.5], aEnd: [0.7, 0.4, 0.2], b: [0.72, 0.6, 1], bEnd: [0.45, 0.3, 0.8], petals: 0 },
};

/** How many streaks fall, by what they are, at their fullest (the array is WEATHER.rainStorm's: 680). */
export const STREAKS = { snowGale: 380, snowStorm: 680, sandStorm: 560 };

/** How the snow and the sand are driven: slant (the sideways run to the fall, so a blizzard's flake is carried at several times its fall), the fall in m/s and the length of a streak's fall in m (what is drawn is longer, by the slant), a gale and a storm. */
export const DRIVEN = {
  snow: { gale: { slant: 3, fall: 1.8, length: 0.06 }, storm: { slant: 4.5, fall: 2.4, length: 0.05 } },
  sand: { gale: { slant: 7, fall: 1.5, length: 0.1 }, storm: { slant: 8, fall: 1.5, length: 0.1 } },
};

export const SKINS: Readonly<Record<string, WeatherSkin>> = {
  // Dyer's expedition met only polar wind and driven snow: a gale is a ground blizzard, a storm a whiteout, and the wind alone is heard
  mountains: {
    ...DEFAULT_SKIN, precip: 'snow', dust: [0.84, 0.88, 0.95], cloud: [0.8, 0.85, 0.93], wet: 0, streak: [0.86, 0.9, 0.97], thick: 1.6, bed: 'wind',
    fleck: { shape: 'disc', size: 0.1, colors: [[0.95, 0.97, 1], [0.86, 0.9, 0.97]], alpha: 0.9, gravity: 0.15 },
    haze: { gale: 0.3, storm: 0.55, rain: 0.4 },
  },
  // The Shadow Out of Time: the desert's storm is sand on the wind, and dry
  pnakotus: {
    ...DEFAULT_SKIN, precip: 'sand', dust: [0.66, 0.54, 0.38], cloud: [0.6, 0.48, 0.34], wet: 0, streak: [0.78, 0.64, 0.44], thick: 1.4, bed: 'wind',
    fleck: { shape: 'disc', size: 0.07, colors: [[0.72, 0.58, 0.4], [0.6, 0.48, 0.34]], alpha: 0.85, gravity: 0.25 },
    haze: { gale: 0.25, storm: 0.5, rain: 0.4 },
  },
  // The Colour Out of Space: grey ash, blown from the blasted ground
  arkham: {
    ...DEFAULT_SKIN, dust: [0.5, 0.5, 0.44], cloud: [0.44, 0.44, 0.4],
    fleck: { shape: 'shard', size: 0.09, colors: [[0.55, 0.55, 0.5], [0.4, 0.4, 0.36]], alpha: 0.8, gravity: 0.35 },
  },
  // The reef's salt spray, not leaves
  innsmouth: {
    ...DEFAULT_SKIN, dust: [0.62, 0.7, 0.72], cloud: [0.52, 0.6, 0.62],
    fleck: { shape: 'disc', size: 0.08, colors: [[0.82, 0.9, 0.92], [0.64, 0.74, 0.76]], alpha: 0.8, gravity: 0.4 },
  },
  // The dream's motes: soft petals among the lights in the Dreamlands, spores of the Fungi on Yuggoth
  dreamlands: { ...DEFAULT_SKIN, motes: { ...DEFAULT_SKIN.motes, petals: 0.4 } },
  yuggoth: { ...DEFAULT_SKIN, motes: { a: [0.92, 0.6, 0.5], aEnd: [0.6, 0.25, 0.2], b: [0.86, 0.62, 0.74], bEnd: [0.55, 0.3, 0.45], petals: 0 } },
};

export const skinOf = (region: string | null | undefined): WeatherSkin => SKINS[region ?? ''] ?? DEFAULT_SKIN;

/** The kind of bed a spell is heard as in `region`: where the matter is snow or sand, the rain and the storm are the wind alone (no wash of rain). */
export const bedKind = <K extends string>(region: string | null | undefined, kind: K): K | 'gale' => (skinOf(region).bed === 'wind' && (kind === 'rain' || kind === 'storm') ? 'gale' : kind);
