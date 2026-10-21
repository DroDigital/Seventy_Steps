/**
 * The candles before the fog (round 45; systems/candles.ts), made understated in round 62: a stub of tallow on what its place has
 * (render/candleShapes.ts: a cairn, a skull, a gravestone's foot, driftwood, a votive), a small thing to come on at the way's edge.
 * Unlit, it has a faint cold gleam that is found only from a few paces; lit, a small flame that breathes, and a dim warm halo about it.
 * Made only while the camera is near (they are as many as the horrors), and put away when it is not. Render only.
 */

import * as THREE from 'three';
import type { CandleLook } from '../data/arenaSets';
import type { Game } from '../systems/components';
import { candlesOf, type Candle } from '../systems/candles';
import { candleBody, type CandleBody } from './candleShapes';
import { createHalos } from './halos';
import { tint } from './meshKit';
import { createWorldMaterial } from './worldMaterial';

const MAKE = 50; // metres: made nearer than this...
const KEEP = 70; // ...put away farther than this
const SEEN = 32; // its lit halo is drawn this far
const GLEAM = 20; // and the cold gleam of one unlit
const FLAME: [number, number, number] = [1, 0.8, 0.45];
const WARM = [1, 0.72, 0.38] as const;
const COLD = [0.5, 0.55, 0.75] as const;

export interface CandleViews {
  update(eye: THREE.Vector3, time: number, hidden: boolean): void;
}

export function createCandleViews(scene: THREE.Scene, g: Game): CandleViews {
  const halos = createHalos(24, 0.5);
  scene.add(halos.mesh);
  const solid = createWorldMaterial({ texture: 'stone', seed: 5, vertexColors: true, vary: 0.3 });
  const shine = createWorldMaterial({ texture: 'cloth', seed: 5, vertexColors: true, emissive: 1 });
  const bodies = new Map<CandleLook, CandleBody>();
  const bodyOf = (look: CandleLook): CandleBody => bodies.get(look) ?? bodies.set(look, candleBody(look)).get(look)!;
  const flames = new Map<CandleLook, THREE.BufferGeometry>();
  const flameOf = (look: CandleLook): THREE.BufferGeometry => flames.get(look) ?? flames.set(look, tint(new THREE.ConeGeometry(0.055, 0.17, 5).translate(0, bodyOf(look).top - 0.04, 0), FLAME)).get(look)!;
  const made = new Map<string, { group: THREE.Group; flame: THREE.Mesh; top: number }>();
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
          group.rotation.y = c.yaw + Math.PI + (((c.x * 12.9898 + c.z * 78.233) % 1) - 0.5) * 0.6; // its face to whoever comes up to it, as it was set down: not all alike
          group.add(new THREE.Mesh(bodyOf(c.look).geo, solid));
          const f = new THREE.Mesh(flameOf(c.look), shine);
          group.add(f);
          scene.add(group);
          m = { group, flame: f, top: bodyOf(c.look).top };
          made.set(c.id, m);
        }
        const on = lit.has(c.id);
        m.flame.visible = on;
        if (on) m.flame.scale.set(1, 0.85 + 0.25 * Math.sin(time * 9 + c.x) * Math.sin(time * 5.3 + c.z), 1);
        const y = m.group.position.y + m.top;
        const breath = 0.5 + 0.5 * Math.sin(time * 7 + c.x * 0.3);
        if (on && far < SEEN) halos.put(c.x, y, c.z, 1.1 + 0.12 * breath, WARM, 0.5 + 0.15 * breath);
        else if (!on && far < GLEAM) halos.put(c.x, y - 0.1, c.z, 0.6, COLD, 0.22 + 0.06 * Math.sin(time * 1.4 + c.z));
      }
      halos.end();
    },
  };
}
