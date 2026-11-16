/**
 * Lore-specific presences of some of the horrors (render/bossAuras.ts). Presentation only: they change no
 * sanity and no combat. Round 115: no drawn lines, frames, cracks or bands; each is a few soft motes moving
 * as its tale says, and, for some, a faint haze. Kept faint, so the painted body is what is seen.
 * A horror whose own picture and signature already say enough (Keziah Mason, the Black Man, Tsathoggua,
 * the Ancient Ones) has none.
 */

/** How the motes move about the body. */
export type AuraMotion =
  | 'rise' // up from the feet and gone
  | 'fall' // let go from the body and sinking to the ground
  | 'orbit' // circling, passing before and behind it
  | 'still' // hung in the air, unmoving, appearing and fading in place
  | 'drift' // torn off and carried down the wind
  | 'spiral' // drawn round and in toward the body
  | 'peel' // lifting off the body and swelling as it climbs
  | 'stream'; // drawn up from the ground about it into the sky above
/** What one mote looks like. */
export type AuraShape = 'bubble' | 'drop' | 'wisp' | 'scrap' | 'globe' | 'speck' | 'spore';
/** A soft field behind the body: none, a low mist about the feet, or a pall about the whole. */
export type AuraHaze = 'none' | 'low' | 'pall';

export interface BossAuraProfile {
  motion: AuraMotion;
  shape: AuraShape;
  haze: AuraHaze;
  blend: 'glow' | 'shade'; // glow adds light; shade is drawn over, so a dark aura darkens
  color: readonly [number, number, number];
  accent: readonly [number, number, number];
  opacity: number;
  count: number; // motes (0: the haze alone)
  speed: number;
  size: number; // a mote across, in body heights
  top: number; // how high the motes reach, in body heights
  grow: number; // times larger a mote is at the end of its life, less one
  iris: number; // 0..1, how far its hue wanders (an iridescence)
  width: number;
}

const p = (o: Partial<BossAuraProfile> & Pick<BossAuraProfile, 'motion' | 'shape' | 'color' | 'accent' | 'opacity'>): BossAuraProfile =>
  ({ haze: 'none', blend: 'glow', count: 20, speed: 0.6, size: 0.012, top: 1, grow: 0, iris: 0, width: 1, ...o });

/** Different beings share a motif only where their lore does (Father Dagon and Mother Hydra). */
export const BOSS_AURAS: Readonly<Record<string, BossAuraProfile>> = {
  // risen from R'lyeh: the sea runs off him in drops, and a sea mist lies at his feet
  cthulhu: p({ motion: 'fall', shape: 'drop', haze: 'low', color: [0.20, 0.33, 0.30], accent: [0.38, 0.52, 0.48], opacity: 0.3, count: 28, speed: 3.2, size: 0.012, top: 0.85, width: 0.9 }),
  // the Deep Ones' parents: breath rising from below the water
  father_dagon: p({ motion: 'rise', shape: 'bubble', haze: 'low', color: [0.20, 0.36, 0.36], accent: [0.42, 0.58, 0.55], opacity: 0.22, count: 18, speed: 0.9, size: 0.012, top: 0.5, grow: 0.3 }),
  mother_hydra: p({ motion: 'rise', shape: 'bubble', haze: 'low', color: [0.22, 0.37, 0.32], accent: [0.48, 0.58, 0.48], opacity: 0.22, count: 18, speed: 0.75, size: 0.012, top: 0.5, grow: 0.3 }),
  // the lake of Ib at night: pale vapour lifting from the water
  bokrug: p({ motion: 'rise', shape: 'wisp', haze: 'low', color: [0.26, 0.36, 0.33], accent: [0.50, 0.57, 0.50], opacity: 0.1, count: 12, speed: 0.45, size: 0.07, top: 0.65, grow: 1.2, width: 1.1 }),
  // the King in Yellow: rags of his tattered mantle carried off on the wind of Hali
  hastur: p({ motion: 'drift', shape: 'scrap', blend: 'shade', color: [0.46, 0.38, 0.18], accent: [0.66, 0.56, 0.30], opacity: 0.4, count: 16, speed: 0.6, size: 0.034, top: 0.95 }),
  // it cannot abide light: the dark it stands in closes about it, and nothing shines
  haunter_of_the_dark: p({ motion: 'still', shape: 'wisp', haze: 'pall', blend: 'shade', color: [0.03, 0.02, 0.05], accent: [0.06, 0.04, 0.09], opacity: 0.32, count: 0, width: 1.05 }),
  // the Crawling Chaos: a black that comes off him as smoke and climbs
  nyarlathotep: p({ motion: 'peel', shape: 'wisp', blend: 'shade', color: [0.05, 0.03, 0.07], accent: [0.16, 0.10, 0.20], opacity: 0.4, count: 20, speed: 0.55, size: 0.07, top: 1, grow: 1.5 }),
  // a congeries of iridescent globes
  yog_sothoth: p({ motion: 'orbit', shape: 'globe', color: [0.30, 0.50, 0.50], accent: [0.62, 0.58, 0.78], opacity: 0.26, count: 16, speed: 0.45, size: 0.034, top: 0.9, iris: 0.6, width: 1.15 }),
  // the Prolonged of Life: about him time holds still, motes that hang and do not fall
  umr_at_tawil: p({ motion: 'still', shape: 'speck', color: [0.46, 0.42, 0.56], accent: [0.72, 0.71, 0.76], opacity: 0.3, count: 22, speed: 0.6, size: 0.012 }),
  // the Black Goat of the Woods: a dark cloud at her hooves and spores settling from her
  shub_niggurath: p({ motion: 'fall', shape: 'spore', haze: 'low', color: [0.11, 0.13, 0.08], accent: [0.52, 0.55, 0.32], opacity: 0.22, count: 26, speed: 0.4, size: 0.013, width: 1.2 }),
  // a colour that is no colour of this world, glimmering upward as the blighted trees did
  colour_out_of_space: p({ motion: 'rise', shape: 'speck', color: [0.58, 0.20, 0.48], accent: [0.40, 0.76, 0.62], opacity: 0.36, count: 26, speed: 0.55, size: 0.016, top: 1.1, iris: 0.8 }),
  // the blind idiot at the centre, round which all things are drawn
  azathoth: p({ motion: 'spiral', shape: 'speck', color: [0.34, 0.20, 0.40], accent: [0.64, 0.38, 0.48], opacity: 0.26, count: 32, speed: 0.45, size: 0.009, top: 0.9, width: 1.2 }),
  // Hatheg-Kla: the cloud the Other Gods came down in, that drew Barzai up into the sky
  other_gods: p({ motion: 'stream', shape: 'wisp', color: [0.38, 0.38, 0.44], accent: [0.62, 0.61, 0.67], opacity: 0.1, count: 14, speed: 0.6, size: 0.05, top: 1.4, grow: 1.2, width: 1.1 }),
  // the sight that turns flesh to stone: a grey grit falls from it and settles
  ghatanothoa: p({ motion: 'fall', shape: 'speck', haze: 'low', blend: 'shade', color: [0.32, 0.30, 0.27], accent: [0.50, 0.46, 0.40], opacity: 0.3, count: 28, speed: 0.45, size: 0.008 }),
};
