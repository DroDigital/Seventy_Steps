/**
 * The candles before the fog (round 45; systems/candles.ts): a stub of tallow in a saucer, ringed in chalk, a tall
 * pale thing in the dark. Unlit, a stub with a cold faint gleam on it that can be found from some way off; lit,
 * a flame that breathes, and a warm halo. Made only while the camera is near (they are as many as the horrors),
 * and put away when it is not. Render only.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Game } from '../systems/components';
import { candlesOf, type Candle } from '../systems/candles';
import { createHalos } from './halos';
import { box, tint } from './meshKit';
import { createWorldMaterial } from './worldMaterial';

const MAKE = 60; // metres: made nearer than this...
const KEEP = 85; // ...put away farther than this
const SEEN = 34; // and its halo is drawn this far
const CHALK: [number, number, number] = [0.86, 0.84, 0.78];
const TALLOW: [number, number, number] = [0.9, 0.86, 0.7];
const SAUCER: [number, number, number] = [0.42, 0.4, 0.4];
const FLAME: [number, number, number] = [1, 0.8, 0.45];
const WARM = [1, 0.72, 0.38] as const;
const COLD = [0.5, 0.55, 0.75] as const;

export interface CandleViews {
  update(eye: THREE.Vector3, time: number, hidden: boolean): void;
}

/** The chalk ring, the saucer and the stub: one solid mesh, in its own frame (the candle at the origin, on the ground). */
function stand(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [box(0.42, 0.05, 0.42, 0, 0.03, 0, SAUCER), box(0.1, 0.34, 0.1, 0, 0.25, 0, TALLOW), box(0.16, 0.04, 0.16, 0, 0.1, 0, TALLOW)];
  for (let i = 0; i < 12; i++) { // a ring of chalk strokes, a pace across
    const a = (i / 12) * Math.PI * 2;
    parts.push(tint(new THREE.BoxGeometry(0.34, 0.02, 0.09).rotateY(-a).translate(Math.cos(a) * 0.95, 0.012, Math.sin(a) * 0.95), CHALK));
  }
  for (let i = 0; i < 5; i++) { // and the sign's branches inside it
    const a = (i / 5) * Math.PI * 2 + 0.4;
    parts.push(tint(new THREE.BoxGeometry(0.5, 0.02, 0.07).rotateY(-a).translate(Math.cos(a) * 0.5, 0.014, Math.sin(a) * 0.5), CHALK));
  }
  return mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
}

export function createCandleViews(scene: THREE.Scene, g: Game): CandleViews {
  const halos = createHalos(24, 0.5);
  scene.add(halos.mesh);
  const solid = createWorldMaterial({ texture: 'stone', seed: 5, vertexColors: true, vary: 0.3 });
  const shine = createWorldMaterial({ texture: 'cloth', seed: 5, vertexColors: true, emissive: 1 });
  const body = stand();
  const flame = tint(new THREE.ConeGeometry(0.06, 0.2, 5).translate(0, 0.52, 0), FLAME);
  const made = new Map<string, { group: THREE.Group; flame: THREE.Mesh }>();
  const drop = (id: string): void => {
    const m = made.get(id);
    if (m) scene.remove(m.group); // (geometry and materials are shared)
    made.delete(id);
  };
  return {
    update(eye, time, hidden) {
      halos.begin();
      const lit = g.overworld?.candles;
      if (hidden || !lit) {
        for (const id of [...made.keys()]) drop(id);
        return halos.end();
      }
      for (const c of candlesOf() as readonly Candle[]) {
        const far = Math.hypot(c.x - eye.x, c.z - eye.z);
        if (far > KEEP) {
          if (made.has(c.id)) drop(c.id);
          continue;
        }
        let m = made.get(c.id);
        if (!m) {
          if (far > MAKE) continue;
          const group = new THREE.Group();
          group.position.set(c.x, g.world.ground(c.x, c.z), c.z);
          group.add(new THREE.Mesh(body, solid));
          const f = new THREE.Mesh(flame, shine);
          group.add(f);
          scene.add(group);
          m = { group, flame: f };
          made.set(c.id, m);
        }
        const on = lit.has(c.id);
        m.flame.visible = on;
        if (on) m.flame.scale.set(1, 0.85 + 0.25 * Math.sin(time * 9 + c.x) * Math.sin(time * 5.3 + c.z), 1);
        if (far < SEEN) {
          const y = m.group.position.y + 0.55;
          const breath = 0.5 + 0.5 * Math.sin(time * 7 + c.x * 0.3);
          if (on) halos.put(c.x, y, c.z, 1.5 + 0.15 * breath, WARM, 0.7 + 0.25 * breath);
          else halos.put(c.x, y - 0.15, c.z, 0.9, COLD, 0.28 + 0.1 * Math.sin(time * 1.4 + c.z));
        }
      }
      halos.end();
    },
  };
}
