/**
 * The investigator's found weapons as geometry (playtest round 4, data/weapons.ts), in the hand's frame: the grip at the wrist, the business end down −y, the edge
 * forward (+z). Round 77: modelled in Blender and baked with him (tools/player/model_arms.py; data/player), so the hand and the rack show the same weapon. The
 * sword-cane's own is in the figure (`cane` and `cane_drawn`).
 */

import type * as THREE from 'three';
import type { WeaponId } from '../data/weapons';
import { partGeometry } from './playerParts';
import type { TextureKind } from './textures';

/** Every found weapon's geometry, and the texture it takes. */
export const ARMS: Record<Exclude<WeaponId, 'cane'>, readonly [() => THREE.BufferGeometry, TextureKind]> = {
  axe: [() => partGeometry(['arm_axe']), 'wood'],
  razor: [() => partGeometry(['arm_razor']), 'cloth'],
  rapier: [() => partGeometry(['arm_rapier']), 'cloth'],
  cutlass: [() => partGeometry(['arm_cutlass']), 'cloth'],
};
