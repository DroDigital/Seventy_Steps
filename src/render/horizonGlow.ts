/**
 * The far horizon's life (round 80; render/skyline.ts draws it, data/horizonLife.ts holds its numbers). A far town was a silhouette with a few
 * windows lit, the same at every hour, and the sky above it as empty as anywhere: now the lit windows of a town glow over its roofs, the glow
 * strongest in the gloaming and faint by the waning hour as the windows go out, deeper where the sky is closed in. And a lamp that turns stands
 * on Devil Reef and on Kingsport's head: its pilot light seen always, a flash as the beam comes round to the eye, and the shaft of it standing
 * out to one side as it passes. All of it is carried by the silhouette's own mesh (one more quad in its geometry: no new draw call, and the
 * town's roofs are drawn over the glow, the lamp over the roofs). Pure but for the geometry. Render only.
 */

import * as THREE from 'three';
import { BEAM, DOME, GLOWING, LAMPS, type LampDef } from '../data/horizonLife';
import type { Silhouette } from '../data/skylines';
import { windowShare } from '../systems/clock';
import type { Weather } from '../systems/weather';
import type { Profile } from './skylineShapes';

const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Whether a far silhouette lays a glow over the sky: a city of lit windows. */
export const glows = (def: Pick<Silhouette, 'kind' | 'lit'>): boolean => GLOWING.has(def.kind) && (def.lit ?? 0) > 0;

/** The lamp (if any) that stands on the `index`th silhouette of a region. */
export const lampFor = (region: string, index: number): LampDef | undefined => LAMPS.find((l) => l.region === region && l.index === index);

/** How much of the glow the hour leaves: all of it while the windows are lit, `DOME.night` of it by the last hour. */
export const nightGlow = (phase: number): number => DOME.night + (1 - DOME.night) * windowShare(phase);

/** How much a closed sky (`rain`, `storm`, `gale`) lies over the world, 0..1: the glow lies on the cloud. */
export function overcastOf(w: Pick<Weather, 'kind' | 'amount'> | undefined): number {
  return w && (w.kind === 'rain' || w.kind === 'storm' || w.kind === 'gale') ? Math.min(1, Math.max(0, w.amount)) : 0;
}

/**
 * The strength of a town's glow, 0 and up (about 0.6 at the most): by how many of its windows are lit (`def.lit`) and how many are still
 * lit at `phase` of the night, how far it is (`dist`, metres: the air takes some, and a town close by is seen as itself), the sky's `overcast`,
 * and a slow swell of the many lamps (`time`, `seed`).
 */
export function domeStrength(def: Pick<Silhouette, 'lit' | 'seed'>, dist: number, phase: number, overcast = 0, time = 0): number {
  const weight = DOME.floor + (1 - DOME.floor) * Math.min(1, (def.lit ?? 0) / DOME.lit);
  const near = smooth(DOME.near[0], DOME.near[1], dist);
  const air = 1 / (1 + dist / DOME.half);
  const breath = 1 + DOME.breath.amount * Math.sin(time * DOME.breath.speed * 2 * Math.PI + def.seed * 1.7);
  return DOME.strength * weight * nightGlow(phase) * near * air * (1 + DOME.overcast * Math.min(1, Math.max(0, overcast))) * breath;
}

export interface Beam {
  flash: number; // 0..1: the beam is coming round to the eye
  sweep: number; // -1..1: which side its shaft stands out to, and how far (a shaft turning toward or away from the eye is a short one)
  shaft: number; // 0..1: how bright the shaft is (brightest as it comes round)
}

/** Where a lamp's beam is at `time`: it turns once a `period`, at the eye when `phase` of the turn is a whole one. */
export function beamAt(lamp: Pick<LampDef, 'period' | 'phase'>, time: number): Beam {
  const turn = (time / lamp.period + lamp.phase) * 2 * Math.PI;
  const toward = Math.cos(turn);
  return { flash: Math.max(0, toward) ** BEAM.turn, sweep: Math.sin(turn), shaft: 0.3 + 0.7 * Math.max(0, toward) };
}

/** Where a lamp stands on an outline `f` (silhouette units: along the width, up the height), or null when it has no place there. */
export function lampPlace(f: Profile, lamp: LampDef): { x: number; y: number } | null {
  if (lamp.x === null) return f.lamp ? { x: f.lamp.x, y: f.lamp.y + lamp.rise } : null; // the reef's own tower
  return { x: lamp.x, y: Math.min(1.1, Math.max(0, f(lamp.x))) + lamp.rise };
}

/**
 * The silhouette's geometry with its extra quads: the glow over a town (`dome`) first, then the outline `base`, then the lamp's, so the roofs
 * are drawn over the glow and the light over the roofs. Every vertex has `aFx`: its kind (0 outline, 1 glow, 2 lamp) and the quad's own coordinates.
 */
export function glowGeometry(base: THREE.BufferGeometry, dome: boolean, lamp: { x: number; y: number } | null): THREE.BufferGeometry {
  const pos: number[] = [];
  const fx: number[] = [];
  const index: number[] = [];
  const add = (x: number, y: number, kind: number, u = 0, v = 0): number => (pos.push(x, y, 0), fx.push(kind, u, v, 0), pos.length / 3 - 1);
  const quad = (kind: number, c: readonly (readonly [number, number, number, number])[]): void => {
    const [a, b, d, e] = c.map(([x, y, u, v]) => add(x, y, kind, u, v));
    index.push(a, b, d, a, d, e);
  };
  if (dome) {
    const { across: w, below, above } = DOME.box;
    quad(1, [[-w, -below, 0, 0], [w, -below, 1, 0], [w, above, 1, 1], [-w, above, 0, 1]]);
  }
  const first = pos.length / 3;
  const from = base.getAttribute('position');
  for (let i = 0; i < from.count; i++) add(from.getX(i), from.getY(i), 0);
  for (const i of base.index!.array) index.push(i + first);
  if (lamp) quad(2, [[lamp.x, lamp.y, -1, -1], [lamp.x, lamp.y, 1, -1], [lamp.x, lamp.y, 1, 1], [lamp.x, lamp.y, -1, 1]]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aFx', new THREE.Float32BufferAttribute(fx, 4));
  g.setIndex(index);
  return g;
}
