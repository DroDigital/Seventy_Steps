/**
 * A shadow with no one (round 78): out beyond the lantern's pool a long, thin human shadow lies across the grass, arms to the knee, stretched by the
 * moon, and where it must be cast from there is nothing at all. It stays while it is not approached, moves a pace only while the lens is turned from
 * it, and is gone, shadow and all, when the investigator comes within a few metres. The figure is on the moon's caster layer alone and is never drawn
 * by the lens (as the people's shadow proxies are), so only what it casts is seen. Only for a failing mind (the watchers' own), in the open, with the
 * moon's shadows on; the moon's light is lifted a little while one lies, so that its shadow is read at the deepest night. The Dunwich Horror's
 * invisible brother, the Thing on the Doorstep. Render only.
 */

import * as THREE from 'three';
import { SHADE } from '../data/dreadPicture';
import type { Game } from '../systems/components';
import { hasLineOfSight } from '../world/colliders';
import { roofedAt } from '../world/terrain';
import { WORLD } from '../data/tuning';
import { calmOf } from './dreadCalm';
import { DREAD_AIR } from './shock';
import { newGaze, offsetTo, readGaze } from './gaze';
import { box } from './meshKit';
import { shadowMesh } from './moonShadow';
import { facing, grown, heightFor, mayLie, mayMove, placeOf, shadeEvery, shadeLasts, slideEvery, tooNear } from './unseenShadeRules';
import { watchersFor } from './watchers';
import { worldUniforms } from './worldMaterial';

const WHITE = [1, 1, 1] as const;
const FIGURE = 3.11; // the figure's height as built, metres

/** A man too tall and too thin, broad in the shoulder, the arms hanging to the knee a little away from the body, the head to one side: only the shape of his shadow. */
function figure(): THREE.Mesh {
  const parts = [
    box(0.13, 1.55, 0.2, -0.16, 0.78, 0, WHITE), box(0.13, 1.55, 0.2, 0.16, 0.78, 0, WHITE), // legs
    box(0.5, 1.15, 0.26, 0, 2.1, 0, WHITE), // chest
    box(0.78, 0.18, 0.28, 0, 2.62, 0, WHITE), // shoulders
    box(0.1, 1.9, 0.12, -0.46, 1.62, 0, WHITE), box(0.1, 1.9, 0.12, 0.46, 1.62, 0, WHITE), // arms, to the knee
    box(0.12, 0.2, 0.14, -0.5, 0.58, 0, WHITE), box(0.12, 0.2, 0.14, 0.5, 0.58, 0, WHITE), // hands
    box(0.22, 0.32, 0.22, 0.07, 2.95, 0, WHITE), // head, a little to one side
  ];
  const mesh = shadowMesh(parts)!;
  mesh.frustumCulled = false;
  mesh.visible = false;
  return mesh;
}

export interface UnseenShade {
  update(camera: THREE.Camera, time: number, hidden: boolean): void;
  /** Debug: lies one `metres` off to the `left` or right now, whatever the mind or the hour. */
  force(metres: number, left?: boolean): void;
  /** How far it has risen (0..1). */
  readonly size: number;
}

export function createUnseenShade(scene: THREE.Scene, g: Game): UnseenShade {
  const mesh = figure();
  mesh.scale.y = SHADE.height / FIGURE;
  scene.add(mesh);
  const gaze = newGaze();
  const toMoon = new THREE.Vector3();
  let [k, last, nextAt, endAt, slideAt] = [0, -1, Number.NaN, 0, 0];
  let [live, forced] = [false, false]; // an episode is under way / was called by hand
  let called: { metres: number; left: boolean } | null = null; // the hand's call, taken up by the next frame

  /** Lays it `distance` metres from the lens `angle` radians off its heading, if the ground there is open (or `sure`). */
  function lay(time: number, distance: number, angle: number, sure = false): boolean {
    const b = gaze.look + angle;
    const [x, z] = [gaze.x + Math.sin(b) * distance, gaze.z + Math.cos(b) * distance];
    const y = g.world.ground(x, z);
    if (!sure && (y < WORLD.seaLevel + 0.3 || roofedAt(x, z) || !hasLineOfSight(g.world, { x: gaze.x, y: gaze.y, z: gaze.z }, { x, y: y + 1.6, z }))) return false;
    mesh.position.set(x, y, z);
    endAt = time + shadeLasts(Math.random());
    slideAt = time + slideEvery(Math.random());
    return true;
  }

  return {
    get size() {
      return k;
    },
    force(metres, left = true) {
      called = { metres, left };
    },
    update(camera, time, hidden) {
      const dt = last < 0 ? 0 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      readGaze(camera, gaze);
      if (called) { // (debug) one is laid where asked, whatever the mind, the hour or the ground
        lay(time, called.metres, (called.left ? -1 : 1) * 1.45, true);
        [live, forced, endAt, called] = [true, true, time + 600, null];
      }
      const calm = calmOf(g, time);
      const fit = mayLie({ shadows: worldUniforms.uShadow.value.x > 0, hidden: hidden || !g.overworld, mind: forced || watchersFor(g.mind.sanity) >= 1, cap: DREAD_AIR.cap, calm });
      if (!live && k <= 0) { // between episodes: one begins when its time comes and a place is found
        mesh.visible = false;
        if (!fit) return void (nextAt = Number.NaN);
        if (!Number.isFinite(nextAt)) nextAt = time + shadeEvery(Math.random());
        if (time < nextAt) return;
        const p = placeOf(Math.random(), Math.random(), Math.random() < 0.5);
        if (!lay(time, p.distance, p.angle)) return void (nextAt = time + 4); // (no open ground just now: try again soon)
        live = true;
      }
      const [dx, dz] = [mesh.position.x - gaze.x, mesh.position.z - gaze.z];
      if (live && (!fit || time > endAt || tooNear(Math.hypot(dx, dz)))) [live, forced, nextAt] = [false, false, time + shadeEvery(Math.random())];
      if (live && mayMove(offsetTo(gaze, mesh.position.x, mesh.position.z)) && time >= slideAt) { // turned from it, it comes a pace
        slideAt = time + slideEvery(Math.random());
        const d = Math.hypot(dx, dz) || 1;
        const by = Math.min(SHADE.slide[0] + (SHADE.slide[1] - SHADE.slide[0]) * Math.random(), Math.max(0, d - SHADE.gone - 3));
        const [nx, nz] = [mesh.position.x - (dx / d) * by, mesh.position.z - (dz / d) * by];
        mesh.position.set(nx, g.world.ground(nx, nz), nz);
      }
      k = grown(k, live ? 1 : 0, dt);
      mesh.visible = k > 0.001;
      toMoon.copy(worldUniforms.uLightDir.value).normalize();
      mesh.scale.y = (heightFor(toMoon.y) / FIGURE) * k;
      mesh.rotation.y = facing(toMoon.x, toMoon.z, gaze.x - mesh.position.x, gaze.z - mesh.position.z);
      worldUniforms.uLightColor.value.multiplyScalar(1 + SHADE.moon * k * DREAD_AIR.cap); // so that its shadow is read at the deepest night
    },
  };
}
