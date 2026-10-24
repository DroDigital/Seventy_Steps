/**
 * The pieces of an arena's set drawn (round 61; data/arenaSets.ts says where each stands): a baked model (modelKit.ts), laid over
 * the prop job's colours, with a flame in a lantern's housing or at other models' tops when lit; a built piece from `KITS` below. Feet at the
 * origin, facing +z, as every prop's. Render only.
 */

import * as THREE from 'three';
import { MODEL_INFO } from '../data/models/index';
import { scaleOf, type Prop } from '../world/props';
import { tint, tileUv } from './meshKit';
import { modelPieces } from './modelKit';
import { modelLantern } from './modelLantern';
import { LANTERN_MODELS } from '../world/lanternModels';
import { ashlar, colonnade, crystal, dam, cliff, grove, hedge, kerb, slabs as slabWall, spill, terrace } from './setShapesHouse';
import { gatehouse, keep } from './setShapesKeep';
import { banner, idol, meteor, pipes } from './setShapesRelic';
import { hornTree, skullPole, totem } from './setShapesRite';
import { hexped, pylon, slab, sphinx, trilith, ziggurat } from './setShapesStone';
import { towerHorn, towerRound, towerSpire, towerSquare } from './setShapesTower';
import { BASE, mixRgb, type Rgb } from './palette';
import type { Piece } from './propShapes';

const FLAME: Rgb = mixRgb(BASE.bone, [1, 0.8, 0.5], 0.6);

/** A small flame standing at (x, y, z), lighting about it as a fire. */
function flame(p: Prop, [x, y, z]: readonly [number, number, number], size = 0.3): Piece {
  const geo = tint(tileUv(new THREE.ConeGeometry(size, size * 1.7, 6).translate(x, y + size * 0.8, z), 1, 1), FLAME);
  return { mat: 'glow', geo, light: p.set?.lit, at: [x, y + size, z] };
}

/** The built pieces: name → its pieces from the prop. */
const KITS: Readonly<Record<string, (p: Prop, c: Rgb) => Piece[]>> = {
  totem, skull_pole: skullPole, horn_tree: hornTree,
  pylon, sphinx, trilith, ziggurat, slab, hexped, idol, pipes, banner, meteor,
  house_ashlar: ashlar, house_dam: dam, house_cliff: cliff, house_grove: grove, house_colonnade: colonnade, house_hedge: hedge, house_slabs: slabWall, house_crystal: crystal, house_terrace: terrace, // round 63: the walls of a house, and its towers
  house_tower_square: towerSquare, house_tower_round: towerRound, house_tower_spire: towerSpire, house_tower_horn: towerHorn,
  house_keep: keep, house_gatehouse: gatehouse, // round 67: a walled court's keep, and the span over its gate
  house_kerb: kerb, house_spill: spill, // round 68: a river's kerb, and a dam's spillway
};

/** A set piece's pieces in its own frame. */
export function setPieces(p: Prop, c: Rgb): Piece[] {
  const look = p.set;
  if (!look) return [];
  const info = MODEL_INFO[look.id];
  if (info) {
    const out = modelPieces(p, c);
    if (LANTERN_MODELS[look.id]) out.push(...modelLantern(p));
    else if (look.lit) {
      const [sx, sy, sz] = scaleOf(look);
      if (info.anchors?.length) for (const [x, y, z] of info.anchors) out.push(flame(p, [x * sx, y * sy, z * sz], look.flame)); // a fixture's own flame, in its bowl (the baker's anchors)
      else out.push(flame(p, [0, info.y1 * sy * 0.98, 0], look.flame));
    }
    return out;
  }
  return KITS[look.id]?.(p, c) ?? [];
}
