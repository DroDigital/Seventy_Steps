/**
 * What the world editor can add (round 110, development builds only): any prop kind, any set piece
 * (the baked models and the built pieces), the lights (a street lamp, a fire pit, a torch, a brazier,
 * a lantern post), each made whole as the planners make it.
 */

import { createRng } from '../core/rng';
import { MODEL_INFO } from '../data/models/index';
import { PROP_KINDS, type PropKind } from '../data/regions';
import type { HouseStyle } from '../data/regionFeatures';
import { SET_KITS } from '../data/setKits';
import type { LightKind } from '../data/tuning';
import { pieceSize, propSpec } from '../world/edits/editApply';
import type { PropSpec } from '../world/edits/editTypes';
import { propAt } from '../world/props';

export const HOUSE_STYLES: readonly HouseStyle[] = ['clapboard', 'brick', 'hovel', 'stone'];

/** The kinds a prop may be added as (a set piece by its id). */
export const ADD_KINDS: readonly PropKind[] = PROP_KINDS.filter((k) => k !== 'set');

/** Every set piece's id. */
export const PIECES: readonly string[] = [...new Set([...Object.keys(MODEL_INFO), ...Object.keys(SET_KITS)])].sort();

export interface LightPreset {
  name: string;
  kind: PropKind;
  piece?: string;
  lit?: LightKind;
}

export const LIGHT_PRESETS: readonly LightPreset[] = [
  { name: 'street lamp', kind: 'lamp' },
  { name: 'fire pit', kind: 'firepit' },
  { name: 'torch', kind: 'set', piece: 'rn_torch', lit: 'torch' },
  { name: 'brazier', kind: 'set', piece: 'px_brazier', lit: 'fire' },
  { name: 'lantern post', kind: 'set', piece: 'lightpost', lit: 'lamp' },
].filter((l) => !l.piece || MODEL_INFO[l.piece] || SET_KITS[l.piece]) as LightPreset[];

/** A new prop of `kind` (or the set piece `piece`) at (x, y, z), turned `yaw`, sized as the planners size one; null for a piece not known. */
export function newProp(kind: PropKind, x: number, y: number, z: number, yaw: number, seed: number, piece?: string, lit?: LightKind): PropSpec | null {
  if (kind !== 'set') return propSpec(propAt(kind, x, y, z, createRng(seed), yaw));
  const size = piece ? pieceSize(piece) : null;
  if (!piece || !size) return null;
  return { kind: 'set', x, y, z, w: size[0], d: size[1], h: size[2], yaw, seed, piece, ...(lit && { look: { lit } }) };
}
