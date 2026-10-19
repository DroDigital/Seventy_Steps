/**
 * The demo's edge, seen (round 56; asked: "visible mist please"): a bank of mist along every run of the border between its
 * realms and the rest (world/demoBorder.ts), just beyond where the investigator is held (systems/demo.ts). It is the boss
 * fog's own (render/bossFog.ts), in the grey of Arkham's churchyards, following the ground and thinning with distance from
 * the eye. Made only in the demo. Render only.
 */

import * as THREE from 'three';
import { FOG_THEMES } from '../data/fogThemes';
import { WORLD } from '../data/tuning';
import { DEMO } from '../systems/demo';
import { borderRuns, type BorderRun } from '../world/demoBorder';
import { surface } from '../world/terrain';
import { fogFrag, fogMaterial } from './bossFog';
import { worldUniforms } from './worldMaterial';

const HEIGHT = 26; // metres of mist above the ground: over the investigator and the trees, a bank and not a curtain
const STEP = 4; // metres between its columns, as it follows the ground
const BEYOND = 1; // metres past the border line: the investigator, held at the step, stands before it, not in it
const [NEAR, FAR] = [140, 300]; // it thins from this far from the eye to nothing at that
const SHOW = FAR + 40; // a run this far off is not drawn at all
const SOLID = 0.9; // where it shows this much, it is a wall to the depth as well
const FEATHER = 60; // metres over which an open end thins out

/** Metres from (x, z) to the nearest point of a run. */
function gap(run: BorderRun, x: number, z: number): number {
  const [ux, uz] = [run.b.x - run.a.x, run.b.z - run.a.z];
  const t = Math.max(0, Math.min(1, ((x - run.a.x) * ux + (z - run.a.z) * uz) / (ux * ux + uz * uz)));
  return Math.hypot(x - (run.a.x + ux * t), z - (run.a.z + uz * t));
}

/** A strip of columns along a run, its foot on the ground (or the sea) and its crown HEIGHT above; uv.y climbs it, and uv.x is 1 but
 * toward an end that meets no other run (where the land of the demo meets the sea), where it feathers out over FEATHER metres. */
function stripOf(run: BorderRun, open: readonly [boolean, boolean]): THREE.BufferGeometry {
  const len = Math.hypot(run.b.x - run.a.x, run.b.z - run.a.z);
  const n = Math.max(1, Math.ceil(len / STEP));
  const pos: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const x = run.a.x + (run.b.x - run.a.x) * k - run.inward.x * BEYOND;
    const z = run.a.z + (run.b.z - run.a.z) * k - run.inward.z * BEYOND;
    const foot = Math.max(surface(x, z), WORLD.seaLevel) - 1.5; // (sunk a little, so no seam shows where it meets the ground)
    pos.push(x, foot, z, x, foot + HEIGHT + 1.5, z);
    const fade = Math.min(1, open[0] ? (k * len) / FEATHER : 1, open[1] ? ((1 - k) * len) / FEATHER : 1);
    uv.push(fade, 0, fade, 1);
    if (i < n) index.push(2 * i, 2 * i + 2, 2 * i + 1, 2 * i + 1, 2 * i + 2, 2 * i + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeBoundingSphere();
  return geo;
}

export interface DemoMist {
  update(camera: THREE.Camera, time: number, hidden: boolean): void;
}

export function createDemoMist(scene: THREE.Scene): DemoMist {
  const runs = borderRuns(DEMO.regions);
  const height = 'vUv.y * (1.0 + 0.4 * noise(vec3((vWorld.x + vWorld.z) * 0.04, uTime * 0.05, 3.0)))'; // a ragged crown, rising and falling along it
  const far = `vUv.x * (1.0 - smoothstep(${NEAR.toFixed(1)}, ${FAR.toFixed(1)}, distance(vWorld.xz, cameraPosition.xz)))`; // (uv.x: its open ends feathered)
  const lit = (m: THREE.ShaderMaterial): THREE.ShaderMaterial => {
    Object.assign(m.uniforms, { uAmbient: worldUniforms.uAmbient, uLightColor: worldUniforms.uLightColor }); // the world's own, as day turns to night
    return m;
  };
  const material = lit(fogMaterial(FOG_THEMES.grey, { x: 0, y: 0, z: 0 }, 0, HEIGHT, fogFrag({ height, far, lit: true })));
  // Where it is solid it is a wall to the depth too: the post pass's haze and contact shadows, read from the depth, drew the trees behind it back over it.
  const depth = lit(fogMaterial(FOG_THEMES.grey, { x: 0, y: 0, z: 0 }, 0, HEIGHT, fogFrag({ height, far, solid: SOLID, lit: true })));
  [depth.transparent, depth.depthWrite, depth.colorWrite] = [false, true, false];
  const meets = (p: { x: number; z: number }, self: BorderRun): boolean => runs.some((r) => r !== self && [r.a, r.b].some((q) => q.x === p.x && q.z === p.z));
  const meshes = runs.map((run) => {
    const geo = stripOf(run, [!meets(run.a, run), !meets(run.b, run)]);
    const mesh = new THREE.Mesh(geo, material);
    mesh.renderOrder = 2; // with the boss fog: after the world, before the particles
    const wall = new THREE.Mesh(geo, depth); // drawn with the world's solids
    mesh.visible = wall.visible = false;
    scene.add(wall, mesh);
    return { run, mesh, wall };
  });
  let [vis, last] = [0, -1];
  return {
    update(camera, time, hidden) {
      const dt = last < 0 ? 0 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      vis += Math.sign((hidden ? 0 : 1) - vis) * Math.min(Math.abs((hidden ? 0 : 1) - vis), dt / 1.2);
      material.uniforms.uTime!.value = time;
      material.uniforms.uVis!.value = vis;
      depth.uniforms.uTime!.value = time;
      depth.uniforms.uVis!.value = vis;
      for (const m of meshes) m.mesh.visible = m.wall.visible = vis > 0.001 && gap(m.run, camera.position.x, camera.position.z) < SHOW;
    },
  };
}
