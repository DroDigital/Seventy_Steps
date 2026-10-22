/**
 * The built things of the ways drawn and lit (round 62; systems/ways.ts holds their state, render/wayShapes.ts their shapes): the plates of a
 * hazard, each a hexagon in the ground with a rune glowing on it that brightens as it wakes and goes dark when it has burst; the tablet at a
 * field's head with the rune that is safe; and the lights of a rite, a faint cold gleam while they wait and a flame and a halo in the rite's own
 * colour once taken. Made only while the camera is by a way and put away when it is not. Render only.
 */

import * as THREE from 'three';
import type { Game } from '../systems/components';
import { along } from '../world/arenaWay';
import { calmed, wayRuns, type WayRun } from '../systems/ways';
import { createHalos } from './halos';
import { tint } from './meshKit';
import { ANOMALY, type Rgb } from './palette';
import { lightShape, plateShape, tabletShape } from './wayShapes';
import { wayLook } from './wayFx';
import { createWorldMaterial } from './worldMaterial';

const MAKE = 100; // metres from a way within which its things are made...
const KEEP = 135; // ...and put away beyond
const SEEN = 55; // a halo is drawn this far
const RITE_SEEN = 95; // a rite's lights are drawn this far, so the candles of a way are found down its length (round 66)
const COLD = [0.5, 0.55, 0.75] as const;
const FLAME: Rgb = [1, 0.8, 0.45];

export interface WayViews {
  update(eye: THREE.Vector3, time: number, hidden: boolean): void;
}

interface Made {
  group: THREE.Group;
  plates: { glow: THREE.ShaderMaterial; at: THREE.Vector3 }[];
  lights: { flame: THREE.Mesh; top: number }[];
  own: THREE.Material[]; // the materials made for this run alone (the shared ones are the views' for good)
}

export function createWayViews(scene: THREE.Scene, g: Game): WayViews {
  const halos = createHalos(48, 0.5);
  scene.add(halos.mesh);
  const stone = createWorldMaterial({ texture: 'stone', seed: 5, vertexColors: true, vary: 0.3 });
  const body = createWorldMaterial({ texture: 'cloth', seed: 7, vertexColors: true, vary: 0.3 });
  const shine = (): THREE.ShaderMaterial => createWorldMaterial({ texture: 'cloth', seed: 5, vertexColors: true, emissive: 1 });
  const flameMat = createWorldMaterial({ texture: 'cloth', seed: 5, vertexColors: true, emissive: 1 });
  const made = new Map<WayRun, Made>();

  const make = (run: WayRun): Made => {
    const group = new THREE.Group();
    const m: Made = { group, plates: [], lights: [], own: [] };
    for (const p of run.plates) {
      const shape = plateShape(p.rune);
      const glowMat = shine();
      const hue = wayLook(p.look).look.danger;
      const at = new THREE.Group();
      at.position.set(p.x, p.y - 0.06, p.z);
      at.add(new THREE.Mesh(shape.stone, stone), new THREE.Mesh(tint(shape.rune.clone(), hue), glowMat));
      group.add(at);
      m.plates.push({ glow: glowMat, at: at.position });
      m.own.push(glowMat);
    }
    if (run.tablet) {
      const t = tabletShape(run.tablet.rune);
      const hue = wayLook(run.plates[0]?.look ?? 'sign').look.line;
      const at = new THREE.Group();
      at.position.set(run.tablet.x, run.tablet.y - 0.05, run.tablet.z);
      at.rotation.y = run.tablet.yaw;
      const glow = shine();
      at.add(new THREE.Mesh(t.stone, stone), new THREE.Mesh(tint(t.rune.clone(), hue), glow));
      m.own.push(glow);
      group.add(at);
    }
    const rite = run.plan.way.rite;
    for (const l of run.lights) {
      const shape = lightShape(rite!.look, l.height);
      const at = new THREE.Group();
      at.position.set(l.x, l.y - 0.04, l.z);
      at.add(new THREE.Mesh(tint(shape.body, [0.5, 0.48, 0.45]), body));
      const f = new THREE.Mesh(tint(shape.flame, FLAME), flameMat);
      at.add(f);
      group.add(at);
      m.lights.push({ flame: f, top: shape.top });
    }
    scene.add(group);
    return m;
  };

  /** A run's views put away: out of the scene, and their geometry and their own materials given back (three.js keeps a buffer until it is told, and a way walked past again is made anew). */
  const drop = (run: WayRun): void => {
    const m = made.get(run);
    if (m) {
      scene.remove(m.group);
      m.group.traverse((o) => void (o instanceof THREE.Mesh && o.geometry.dispose()));
      for (const mat of m.own) mat.dispose();
    }
    made.delete(run);
  };

  return {
    update(eye, time, hidden) {
      halos.begin();
      const runs = hidden ? [] : wayRuns(g);
      for (const run of [...made.keys()]) if (hidden || !runs.includes(run)) drop(run);
      for (const run of runs) {
        const empty = run.plates.length === 0 && run.lights.length === 0;
        if (empty) continue;
        const far = along(run.plan, eye.x, eye.z).dist;
        if (far > KEEP) {
          if (made.has(run)) drop(run);
          continue;
        }
        let m = made.get(run);
        if (!m) {
          if (far > MAKE) continue;
          m = make(run);
          made.set(run, m);
        }
        const calm = calmed(g, run);
        run.plates.forEach((p, i) => {
          const view = m!.plates[i]!;
          const warn = p.state === 'warn' ? 1 - p.left / Math.max(1, p.warn) : 0;
          const flicker = p.state === 'warn' ? 0.6 + 0.4 * Math.sin(time * (18 + 30 * warn)) : 0;
          view.glow.uniforms.uEmissive.value = calm ? 0.12 : p.state === 'cool' ? 0.1 : 0.85 + 0.2 * Math.sin(time * 1.4 + i) + 1.4 * warn * (0.5 + 0.5 * flicker);
          if (!calm && p.state === 'idle' && Math.hypot(p.x - eye.x, p.z - eye.z) < 30) halos.put(p.x, p.y + 0.15, p.z, 0.9, wayLook(p.look).look.danger, 0.2); // a faint glow on the ground about it
          if (p.state === 'warn' && Math.hypot(p.x - eye.x, p.z - eye.z) < SEEN) halos.put(p.x, p.y + 0.3, p.z, 1.2 + warn, wayLook(p.look).look.danger, 0.3 + 0.5 * warn);
        });
        const rite = run.plan.way.rite;
        run.lights.forEach((l, i) => {
          const view = m!.lights[i]!;
          view.flame.visible = l.lit;
          if (view.flame && l.lit) view.flame.scale.set(1, 0.85 + 0.3 * Math.sin(time * 9 + i * 1.7) * Math.sin(time * 5.3 + i), 1);
          const y = l.y + view.top;
          if (Math.hypot(l.x - eye.x, l.z - eye.z) > (rite ? RITE_SEEN : SEEN)) return;
          const hue = rite ? ANOMALY[rite.glow] : FLAME;
          if (l.lit) halos.put(l.x, y, l.z, 2.1 + 0.2 * Math.sin(time * 7 + i), hue, 0.95);
          else if (l.rank === run.progress) halos.put(l.x, y, l.z, 1.3 + 0.35 * Math.sin(time * 3.2), hue, 0.45 + 0.25 * Math.sin(time * 3.2)); // the one whose turn it is beckons from the first, so a rite's candle is found (round 65: only after a wrong light; round 66: always)
          else halos.put(l.x, y, l.z, 0.95, COLD, 0.3 + 0.08 * Math.sin(time * 1.4 + i));
        });
      }
      halos.end();
    },
  };
}
