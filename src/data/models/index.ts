/**
 * Every baked model the arenas stand (round 61, and the boss places of round 71): what each is, read by the simulation. The Kenney kits' models
 * come from tools/models/bake_models.py (`kenneyIndex.ts`), the places' from the supplied asset collection by tools/models/bake_boss_models.py
 * (`bossIndex.ts`) and the arenas' gates' leaves from free models by the same tool (`gateIndex.ts`, docs/GATES.md); their licences are in CREDITS.md and
 * docs/BOSS_PLACES.md. Data only.
 */

import { BOSS_INFO } from './bossIndex';
import { GATE_INFO } from './gateIndex';
import { KENNEY_INFO } from './kenneyIndex';
import { WEB_INFO } from './webIndex';

/** A box a body cannot walk through, in a model's own frame (feet at the origin, its footprint centred): the centre (x, z), the half extents (x, z), and from which height to which. */
export type Solid = readonly [cx: number, cz: number, hx: number, hz: number, y0: number, y1: number];

export interface ModelInfo {
  kit: string; // the pack it is cut from
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
  round: boolean; // a standing thing: its footprint a circle, else a box
  tris: number;
  solids?: readonly Solid[]; // what a body cannot walk through (a doorway, an arch or a colonnade is boxes about its opening); absent: its footprint as one shape
  anchors?: readonly (readonly [number, number, number])[]; // where a flame or a light sits in it (a torch's bowl, a brazier's coals), in its own frame
}

export const MODEL_INFO: Readonly<Record<string, ModelInfo>> = { ...KENNEY_INFO, ...BOSS_INFO, ...GATE_INFO, ...WEB_INFO };
