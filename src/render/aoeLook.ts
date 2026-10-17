/**
 * How a horror's area is drawn. The blow still covers the same ground, on the same clock: a disc, a
 * ring, a lane, a sector, a swirl, a pool. What changed is the mark inside it. A fighter with no
 * entry keeps the plain fill.
 */

import type { TextureKind } from './textures';

export const AOE_MOTIFS = ['plain', 'tide', 'glyph', 'crack', 'flame', 'spore', 'coil', 'eye', 'root', 'star', 'frost', 'ash', 'stain'] as const;
export type AoeMotif = (typeof AOE_MOTIFS)[number];

export interface AoeStyle {
  motif: number;
  name: AoeMotif;
  seed: number;
  freq: number;
  arms: number;
}

export interface AoeSkin {
  texture: TextureKind;
  scroll: readonly [number, number];
  emissive: number;
}

/** The puddle's surface. Index matches `AOE_MOTIFS`. */
export const AOE_SKIN: readonly AoeSkin[] = [
  { texture: 'flesh', scroll: [0.05, 0.03], emissive: 0.35 },
  { texture: 'water', scroll: [0.08, 0.04], emissive: 0.5 },
  { texture: 'slab', scroll: [0.01, 0.015], emissive: 0.6 },
  { texture: 'rock', scroll: [0, 0], emissive: 0.4 },
  { texture: 'cloth', scroll: [0.3, 0.5], emissive: 0.9 },
  { texture: 'rot', scroll: [0.04, 0.02], emissive: 0.4 },
  { texture: 'flesh', scroll: [0.1, 0.04], emissive: 0.5 },
  { texture: 'cloth', scroll: [0.02, 0], emissive: 0.7 },
  { texture: 'rot', scroll: [0.03, 0.05], emissive: 0.35 },
  { texture: 'water', scroll: [0.18, 0.12], emissive: 0.85 },
  { texture: 'snow', scroll: [0.02, 0.01], emissive: 0.55 },
  { texture: 'cloth', scroll: [0.12, 0.06], emissive: 0.28 },
  { texture: 'flesh', scroll: [0.03, 0.02], emissive: 0.42 },
];

const ASSIGN: Readonly<Record<string, AoeMotif>> = {
  cthulhu: 'tide', father_dagon: 'tide', bokrug: 'tide', martins_beach_horror: 'tide',
  mother_hydra: 'root', shub_niggurath: 'root', wilbur_whateley: 'root', shunned_house_entity: 'root',
  hastur: 'glyph', black_man: 'glyph', simon_orne: 'glyph', high_priest: 'glyph', umr_at_tawil: 'glyph', zkauba: 'glyph',
  tsathoggua: 'stain', yeb: 'stain', shoggoth: 'stain', ephraim_waite: 'stain', the_hound: 'stain', lilith: 'stain',
  ghatanothoa: 'eye', haunter_of_the_dark: 'eye', zann_window_thing: 'eye', hypnos: 'eye', other_gods: 'eye', nyarlathotep: 'eye',
  yig: 'coil', medusa_gorgon: 'coil', daemon_pipers: 'coil',
  nug: 'spore', colour_out_of_space: 'spore', rhan_tegoth: 'spore',
  flying_polyp: 'ash', whisperer: 'ash', the_unnamable: 'ash', the_outsider: 'ash',
  yog_sothoth: 'star', azathoth: 'star', ancient_ones: 'star', great_ones: 'star',
  keziah_mason: 'flame', joseph_curwen: 'flame', charles_le_sorcier: 'flame', brown_jenkin: 'flame',
  edward_hutchinson: 'frost', dr_munoz: 'frost', terrible_old_man: 'frost',
  dunwich_horror: 'crack', colossus_pyramids: 'crack',
};

export const PLAIN_AOE: AoeStyle = { motif: 0, name: 'plain', seed: 0, freq: 4, arms: 3 };

function vary(id: string): Pick<AoeStyle, 'seed' | 'freq' | 'arms'> {
  let n = 2166136261;
  for (let i = 0; i < id.length; i++) n = Math.imul(n ^ id.charCodeAt(i), 16777619);
  n >>>= 0;
  return { seed: (n % 1000) / 100, freq: 3 + (n % 6), arms: 3 + ((n >>> 11) % 6) };
}

/** The mark drawn for roster id `id`. Unknown fighters stay plain. */
export function aoeLook(id: string | undefined): AoeStyle {
  const name = id && ASSIGN[id];
  if (!name) return PLAIN_AOE;
  return { motif: AOE_MOTIFS.indexOf(name), name, ...vary(id) };
}
