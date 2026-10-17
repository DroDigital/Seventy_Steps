/**
 * A body in the sea (round 55). The land ends where the water is (falls.ts), and what steps off it into the sea does not drop through the seabed in
 * the dark, as a body over a pit does: it falls to the surface as any body falls, meets the water where the waves have it (`seaHeight`, the table
 * the shader draws), throws up a splash by how hard it came, keeps a little of its speed and loses the rest to the water, floats chest-deep a
 * moment (the lungs' air), and then the tentacle that came up out of the deeper water has hold of it and draws it down and out, the picture
 * going dark by the depth, and the death comes when it is deep enough to be past saving. The seabed is under it all the way: where the sea is
 * shallow the body is dragged along it out into the deep. No Three.js; the same frames for the picture and the sound to read.
 */

import { clamp, type V3 } from '../core/geom';
import { SIM, WATER, WORLD } from '../data/tuning';
import { seaHeight } from '../world/seaSurface';
import type { Falling, Game, WaterFall } from './components';
import { seaChop } from './seaChop';

const smooth = (x: number): number => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};

/** The splash's size, 0 to 1, for a body meeting the water at `speed` m/s: a step in is a ripple, a fall from a height a fountain. */
export const splashSize = (speed: number): number => clamp(0.12 + 0.13 * speed, 0, 1);

/** The sea's clock, in seconds: the one the shader draws the waves by (`Game.seaTime`, the renderer's, which runs on through a cutscene that holds the frames still), else the frames'. */
export const seaTimeOf = (g: Game): number => g.seaTime?.() ?? g.frame / SIM.hz;

/** The water's height at a place and a time, as the picture draws it: the waves raised by the wind's `chop` (`seaChop(g)`; 1 as the sea lies). */
export const surfaceAt = (x: number, z: number, time: number, chop = 1): number => WORLD.seaLevel + seaHeight(x, z, time, chop);

/** A body that has gone into the sea: where the tentacle comes up (ahead of it, the way it was going, and to one side) and what has happened so far (nothing). */
export function enterSea(at: V3, run: { x: number; z: number }, time: number, chop = 1): WaterFall {
  const len = Math.hypot(run.x, run.z);
  const [dx, dz] = len > 0.5 ? [run.x / len, run.z / len] : [0, 1];
  const side = Math.sin(at.x * 12.9898 + at.z * 78.233) > 0 ? 1 : -1; // (either side, the same whenever it is the same place)
  const [px, pz] = [-dz * side, dx * side];
  const [x, z] = [at.x + dx * WATER.root * 0.85 + px * WATER.root * 0.5, at.z + dz * WATER.root * 0.85 + pz * WATER.root * 0.5];
  return { surface: surfaceAt(at.x, at.z, time, chop), entered: -1, grab: -1, root: { x, y: surfaceAt(x, z, time, chop), z }, heading: { x: 0, z: 1 }, held: 0, depth: 0 };
}

/**
 * One frame in the sea. `die` is the death at the end of it (falls.ts: where the Echoes lie). Returns nothing; the body, the speeds and `f.water` are
 * changed, and `Splash` and `Seized` are emitted when they happen.
 */
export function waterStep(g: Game, f: Falling, die: (g: Game, lip: V3) => void): void {
  const w = f.water!;
  const id = g.player.id;
  const tr = g.ecs.c.transform.get(id)!;
  const dt = 1 / SIM.hz;
  const chop = seaChop(g);
  const time = seaTimeOf(g);
  if (f.frame >= WATER.max) return;
  f.frame++;
  w.surface = surfaceAt(tr.pos.x, tr.pos.z, time, chop);
  if (w.entered < 0) {
    f.vy -= WATER.gravity * dt; // still in the air: it falls as a body does, and keeps its run
    tr.pos.x += f.vx * dt;
    tr.pos.z += f.vz * dt;
    tr.pos.y += f.vy * dt;
    if (tr.pos.y <= w.surface) { // it meets the water
      w.entered = f.frame;
      const speed = Math.hypot(f.vy, f.vx, f.vz);
      g.events.emit('Splash', { at: { x: tr.pos.x, y: w.surface, z: tr.pos.z }, speed, size: splashSize(speed) });
      f.vy *= WATER.entryKeep;
      f.vx *= WATER.entryAcross;
      f.vz *= WATER.entryAcross;
      tr.pos.y = Math.min(tr.pos.y, w.surface);
    }
    return;
  }
  const since = f.frame - w.entered;
  if (w.grab < 0 && since >= WATER.seize) {
    w.grab = f.frame;
    const [hx, hz] = [w.root.x - tr.pos.x, w.root.z - tr.pos.z];
    const len = Math.hypot(hx, hz) || 1;
    w.heading = { x: hx / len, z: hz / len };
    g.events.emit('Seized', { entity: id, at: { ...tr.pos }, root: { ...w.root } });
  }
  w.held = w.grab < 0 ? 0 : f.frame - w.grab;
  const held = smooth(w.held / WATER.ramp); // how hard the tentacle has it
  const depth = Math.max(0, w.surface - tr.pos.y);
  let up = -WATER.damp * f.vy - WATER.drag * f.vy * Math.abs(f.vy);
  if (w.grab < 0) up += clamp(WATER.spring * (depth - WATER.afloat), -12, 6); // the lungs' air holds it chest-deep
  up -= WATER.pull * held; // and it is drawn down...
  f.vy += up * dt;
  const keep = Math.exp(-WATER.swim * dt);
  f.vx *= keep;
  f.vz *= keep;
  if (held > 0) { // ...and out, the way the tentacle lies
    f.vx += w.heading.x * WATER.draw * held * dt;
    f.vz += w.heading.z * WATER.draw * held * dt;
  }
  tr.pos.x += f.vx * dt;
  tr.pos.z += f.vz * dt;
  tr.pos.y += f.vy * dt;
  const bed = g.world.ground(tr.pos.x, tr.pos.z); // the seabed is under it: where the sea is shallow it is dragged along the bottom, out into the deep
  if (tr.pos.y < bed + 0.02) {
    tr.pos.y = bed + 0.02;
    f.vy = Math.max(f.vy, 0);
  }
  w.depth = Math.max(0, w.surface - tr.pos.y);
  if (w.grab >= 0) { // it is drawing the body out: the root stays ahead of it
    w.root.x = tr.pos.x + w.heading.x * WATER.root;
    w.root.z = tr.pos.z + w.heading.z * WATER.root;
    w.root.y = surfaceAt(w.root.x, w.root.z, time, chop);
  }
  if (w.held >= WATER.held || f.frame >= WATER.max) die(g, f.lip);
}

/** How dark the picture is for a body in the sea, 0 to 1: nothing until the tentacle has it, black as it is drawn out and under, past saving. */
export function waterDark(w: WaterFall): number {
  const [from, to] = WATER.dark;
  return smooth((w.held - from) / (to - from));
}
