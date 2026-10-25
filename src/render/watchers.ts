/**
 * The watchers (round 26: a failing mind showed in the picture and the sound, never in the world): from the
 * Fractured on, now and then a tall dark figure stands far off on open ground, turned to the investigator,
 * where there was nobody. It is put behind them and out of the corner of the eye, so it is found by turning.
 * Looked at squarely for a moment it is gone, and it is gone as they come near. Fewer the
 * steadier the mind; none in a dungeon, in the arena or under a cutscene. They are not creatures (nothing
 * in the simulation, nothing to strike or to fear): only what a mind makes of the dark. Render only.
 * Round 80, not where it was: one that has stood a while comes a step nearer each time the lens is turned
 * from it (never while it is seen, never to within 26 m), so that turning back finds it nearer than it was
 * left; while the lens swings a dark upright shape now and then crosses the very edge of the picture
 * (a darter) and is gone when turned to; and while any stand the bed gives way (`WATCHING`).
 */

import * as THREE from 'three';
import { hasLineOfSight } from '../world/colliders';
import { DARTER, STEP } from '../data/dreadPicture';
import { SANITY } from '../data/tuning';
import type { Game } from '../systems/components';
import { calmOf } from './dreadCalm';
import { FEEL } from './feel';
import { createTurn, newGaze, offsetTo, readGaze } from './gaze';
import { box } from './meshKit';
import { darterEvery, darterGone, darterStart, mayStep, stepEvery, stepOf } from './watcherSteps';
import { DREAD_AIR } from './shock';
import { createWorldMaterial } from './worldMaterial';

/** How many watchers a mind at `sanity` is given. */
export const watchersFor = (sanity: number): number => (sanity >= SANITY.bands[1] ? 0 : sanity >= SANITY.bands[2] + 10 ? 1 : sanity >= SANITY.bands[2] - 5 ? 2 : 3);

const NEAR = 18; // metres: closer than this and it is gone
const SPAWN = [42, 78] as const; // metres it is put at
const STARE = 0.22; // radians either side of where the lens looks that count as looking at it
const LOOK_AT = 1.6; // seconds looked at before it goes
const LIFE = [50, 110] as const; // seconds it stays, unwatched

interface Watcher {
  mesh: THREE.Mesh;
  born: number;
  life: number;
  looked: number; // seconds looked at
  gone: number; // seconds since it began to go (-1: not going)
  step: number; // seconds of its next step (round 80)
}

/** A shape that crosses the edge of the picture while the lens swings (round 80). */
interface Darter {
  mesh: THREE.Mesh;
  born: number;
  vx: number; // metres a second
  vz: number;
}

/** How many watchers stand now (round 80): the sound reads it, and the bed gives way while they do (atm/dread.ts). */
export const WATCHING = { count: 0, nearest: -1, call: null as { metres: number; offset: number } | null }; // (`call`: debug, ui/../dreadDebug.ts: one is put where asked, at an age to step)

/** A man too tall, too thin, arms to the knee and the head a little on one side. */
function figure(): THREE.BufferGeometry {
  const black = [0.03, 0.03, 0.035] as const;
  const parts = [
    box(0.42, 1.25, 0.24, 0, 1.2, 0, black),
    box(0.26, 0.3, 0.26, 0.05, 2.0, 0, black),
    box(0.12, 1.35, 0.14, -0.3, 1.2, 0, black),
    box(0.12, 1.35, 0.14, 0.3, 1.2, 0, black),
    box(0.15, 0.85, 0.16, -0.12, 0.42, 0, black),
    box(0.15, 0.85, 0.16, 0.12, 0.42, 0, black),
  ];
  const merged = new THREE.BufferGeometry();
  const pos: number[] = [];
  const col: number[] = [];
  const nrm: number[] = [];
  const uv: number[] = [];
  for (const p of parts) {
    const g = p.index ? p.toNonIndexed() : p;
    for (const name of ['position', 'color', 'normal', 'uv'] as const) {
      const a = g.getAttribute(name);
      const out = name === 'position' ? pos : name === 'color' ? col : name === 'normal' ? nrm : uv;
      for (let i = 0; i < a.count * a.itemSize; i++) out.push(a.array[i]);
    }
  }
  merged.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  merged.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return merged;
}

export interface Watchers {
  update(camera: THREE.Camera, time: number, hidden: boolean, vanished: () => void): void;
}

export function createWatchers(scene: THREE.Scene, g: Game): Watchers {
  const geometry = figure();
  const material = createWorldMaterial({ texture: 'stone', vertexColors: true, character: 'creature', eldritch: 0.7, bodyScale: 2.2 });
  const list: Watcher[] = [];
  const gaze = newGaze();
  const turn = createTurn();
  let last = -1;
  let darter: Darter | null = null;
  let nextDarter = Infinity; // seconds of the next darter, set when one is first possible
  const drop = (w: Watcher): void => void scene.remove(w.mesh);

  /** The darter: advanced, flickered, and gone when turned to or at the end of its second. */
  function dart(time: number, dt: number, allowed: boolean): void {
    if (!darter) return;
    const m = darter.mesh;
    m.position.x += darter.vx * dt;
    m.position.z += darter.vz * dt;
    m.position.y = g.world.ground(m.position.x, m.position.z);
    const age = time - darter.born;
    const fade = Math.min(age / 0.15, (DARTER.seconds - age) / 0.25, 1);
    m.visible = fade >= 1 || Math.random() < Math.max(0, fade);
    m.rotation.y = Math.atan2(gaze.x - m.position.x, gaze.z - m.position.z);
    if (allowed && age < DARTER.seconds && !darterGone(offsetTo(gaze, m.position.x, m.position.z))) return;
    scene.remove(m);
    darter = null;
  }

  /** Puts a darter at the edge of the picture the lens swings toward, if the lens is swinging, a mind this far gone is held, and nothing is fought. */
  function maybeDart(time: number, want: number): void {
    if (want < DARTER.from) return void (nextDarter = Infinity);
    if (darter) return;
    if (!Number.isFinite(nextDarter)) nextDarter = time + darterEvery(Math.random());
    if (time < nextDarter) return;
    const start = darterStart(turn.rate, gaze.half, Math.random(), Math.random());
    if (!start || !calmOf(g, time) || DREAD_AIR.cap <= 0 || FEEL.flashes <= 0) return; // (nothing sudden at the corner of the eye for those who have turned the flashes or the effects off)
    const b = gaze.look + start.offset;
    const [x, z] = [gaze.x + Math.sin(b) * start.distance, gaze.z + Math.cos(b) * start.distance];
    const y = g.world.ground(x, z);
    if (!hasLineOfSight(g.world, { x: gaze.x, y: gaze.y, z: gaze.z }, { x, y: y + 1.6, z })) return;
    const out = Math.sign(start.offset); // outward: on across the edge, the way the picture's edge is going
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.frustumCulled = false;
    scene.add(mesh);
    darter = { mesh, born: time, vx: Math.cos(b) * start.speed * out, vz: -Math.sin(b) * start.speed * out };
    nextDarter = time + darterEvery(Math.random());
  }

  return {
    update(camera, time, hidden, vanished) {
      const dt = last < 0 ? 0 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      const me = g.overworld ? g.ecs.c.transform.get(g.player.id)?.pos : undefined;
      const want = hidden || !me || g.cutscene ? 0 : watchersFor(g.mind.sanity);
      readGaze(camera, gaze);
      turn.update(gaze.look, time);
      for (const w of [...list]) {
        const [dx, dz] = [w.mesh.position.x - camera.position.x, w.mesh.position.z - camera.position.z];
        const bearing = Math.atan2(dx, dz);
        const off = Math.abs(offsetTo(gaze, w.mesh.position.x, w.mesh.position.z));
        if (w.gone < 0) {
          w.looked = off < STARE ? w.looked + dt : Math.max(0, w.looked - dt * 0.5);
          const done = Math.hypot(dx, dz) < NEAR || time - w.born > w.life || list.length > want;
          if (w.looked > LOOK_AT || done) {
            w.gone = 0;
            if (w.looked > LOOK_AT) vanished(); // seen, and gone: a breath of a whisper
          } else if (mayStep(time - w.born, off, gaze.half, time, w.step)) {
            const d = Math.hypot(dx, dz);
            const by = stepOf(d, Math.random());
            w.step = time + stepEvery(Math.random());
            if (by > 0) { // a step toward the investigator, if the way there is clear
              const [nx, nz] = [w.mesh.position.x - (dx / d) * by, w.mesh.position.z - (dz / d) * by];
              const ny = g.world.ground(nx, nz);
              if (hasLineOfSight(g.world, { x: w.mesh.position.x, y: w.mesh.position.y + 1.6, z: w.mesh.position.z }, { x: nx, y: ny + 1.6, z: nz })) w.mesh.position.set(nx, ny, nz);
            }
          }
        } else w.gone += dt;
        const fade = w.gone >= 0 ? 1 - w.gone / 0.6 : Math.min(1, (time - w.born) / 3);
        w.mesh.visible = fade >= 1 || Math.random() < fade; // it flickers in and out of being
        w.mesh.rotation.y = bearing + Math.PI; // turned to them
        if (w.gone > 0.6) {
          drop(w);
          list.splice(list.indexOf(w), 1);
        }
      }
      let [standing, nearest] = [0, -1];
      for (const w of list) {
        if (w.gone >= 0) continue;
        const d = Math.hypot(w.mesh.position.x - camera.position.x, w.mesh.position.z - camera.position.z);
        nearest = standing++ === 0 ? d : Math.min(nearest, d);
      }
      [WATCHING.count, WATCHING.nearest] = [standing, nearest];
      dart(time, dt, want >= DARTER.from);
      if (me) maybeDart(time, want);
      if (WATCHING.call && me && want > list.length) { // (debug) one where it was asked for, old enough to step
        const { metres, offset } = WATCHING.call;
        WATCHING.call = null;
        const b = gaze.look + offset;
        const [x, z] = [camera.position.x + Math.sin(b) * metres, camera.position.z + Math.cos(b) * metres];
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, g.world.ground(x, z), z);
        mesh.frustumCulled = false;
        scene.add(mesh);
        list.push({ mesh, born: time - STEP.after - 1, life: 1e6, looked: 0, gone: -1, step: time });
      }
      if (!me || list.length >= want || Math.random() > dt * 0.25) return;
      const a = gaze.look + Math.PI * (0.55 + 0.9 * Math.random()) * (Math.random() < 0.5 ? -1 : 1); // behind them, or out at the edge of sight
      const r = SPAWN[0] + (SPAWN[1] - SPAWN[0]) * Math.random();
      const [x, z] = [camera.position.x + Math.sin(a) * r, camera.position.z + Math.cos(a) * r];
      const y = g.world.ground(x, z);
      if (!hasLineOfSight(g.world, { x: camera.position.x, y: camera.position.y, z: camera.position.z }, { x, y: y + 1.6, z })) return;
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.frustumCulled = false;
      scene.add(mesh);
      list.push({ mesh, born: time, life: LIFE[0] + (LIFE[1] - LIFE[0]) * Math.random(), looked: 0, gone: -1, step: time + stepEvery(Math.random()) });
    },
  };
}
