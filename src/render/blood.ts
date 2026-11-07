/**
 * Blood (round 113; render only, read-only on the simulation): every blow that lands on a body that bleeds throws drops of its own blood
 * (data/gore.ts) out of the wound along the blade's way, and where they come down they leave a spatter; the investigator bleeds too when
 * struck. A killing cut spurts from the body for a moment and the piece leaves a trail; a body that dies leaves a pool spreading under it.
 * A dry thing (a mummy, a sorcerer of dust, stone) puffs and leaves pale dust instead. Off with the Gore setting, none of it is drawn.
 */

import type { Entity } from '../core/ecs';
import { BLOOD, GORE_FX, goreOf, isWet, type BloodKind } from '../data/gore';
import type { Game } from '../systems/components';
import { MODEL_PREFIX } from '../systems/creatures';
import { SIM } from '../data/tuning';
import { LANDS } from './audio/impact';
import type { BloodPools } from './bloodPools';
import { mixRgb, type Rgb } from './palette';
import type { Particles } from './particles';
import { woundPoint } from './wound';

/** The Gore setting, read each frame (main.ts): off, no cut, no blood. */
export const GORE_SETTING = { on: true };

const rand = (a: number, b: number): number => a + (b - a) * Math.random();
const RED: BloodKind = 'red';

export interface Blood {
  /** The blood a creature (or the investigator) spills, 'none' for what does not bleed. */
  kindOf(id: Entity): BloodKind;
  /** Drops thrown from `at` along `dir` (level), `count` of them at up to `speed` m/s. */
  spray(at: { x: number; y: number; z: number }, dir: { x: number; z: number }, kind: BloodKind, count: number, speed: number, time: number): void;
  /** A spurt from `at` for GORE_FX.gush seconds, upward and along `dir`. */
  gush(at: { x: number; y: number; z: number }, dir: { x: number; z: number }, kind: BloodKind, size: number, time: number): void;
  /** A pool spreading under (x, z), `size` metres across when whole. */
  pool(x: number, z: number, kind: BloodKind, size: number, time: number, grow?: number): void;
  update(time: number): void;
}

export function createBlood(g: Game, fx: Particles, pools: BloodPools): Blood {
  const c = g.ecs.c;
  const ground = (x: number, z: number): number => (fx.ground ?? g.world.ground)(x, z);
  const marks: { at: number; x: number; z: number; kind: BloodKind; size: number; yaw: number }[] = []; // spatters waiting for their drops to land
  let off = false; // the Gore setting is off, and its blood has been taken away
  const gushes: { until: number; at: { x: number; y: number; z: number }; dir: { x: number; z: number }; kind: BloodKind; size: number; next: number }[] = [];

  const kindOf = (id: Entity): BloodKind => {
    if (id === g.player.id) return RED;
    const model = c.model.get(id);
    return model?.startsWith(MODEL_PREFIX) ? goreOf(model.slice(MODEL_PREFIX.length))[1] : 'none';
  };
  const colour = (kind: BloodKind): Rgb => (kind === 'none' ? [0, 0, 0] : BLOOD[kind]);

  function drop(at: { x: number; y: number; z: number }, v: { x: number; y: number; z: number }, kind: BloodKind, size: number): number {
    const col = colour(kind);
    const floor = ground(at.x, at.z);
    const wet = isWet(kind);
    fx.spawn({
      ...at, vx: v.x, vy: v.y, vz: v.z, life: wet ? rand(0.55, 0.9) : rand(0.35, 0.6), size, grow: wet ? 0.8 : 1.8,
      color: mixRgb(col, [1, 1, 1], wet ? 0.08 : 0.15), colorEnd: wet ? mixRgb(col, [0, 0, 0], 0.35) : col, alpha: wet ? 1 : 0.6,
      gravity: wet ? 9.8 : 3, drag: wet ? 0.4 : 2.4, floor, bounce: 0.05, shape: wet ? undefined : 'puff', hold: wet ? 0.6 : 0,
    });
    const h = Math.max(0, at.y - floor); // when it comes down: y + vy t - g t²/2 = floor
    return wet ? (v.y + Math.sqrt(v.y * v.y + 2 * 9.8 * h)) / 9.8 : -1;
  }

  const blood: Blood = {
    kindOf,
    spray(at, dir, kind, count, speed, time) {
      if (!GORE_SETTING.on || kind === 'none') return;
      const yaw = Math.atan2(dir.x, dir.z);
      let far = 0;
      let last = { x: at.x, z: at.z };
      for (let i = 0; i < count; i++) {
        const a = yaw + rand(-0.7, 0.7);
        const s = rand(0.35, 1) * speed;
        const v = { x: Math.sin(a) * s, y: rand(0.4, 2.6), z: Math.cos(a) * s };
        const t = drop(at, v, kind, rand(0.05, 0.11));
        if (t > far) [far, last] = [t, { x: at.x + v.x * t, z: at.z + v.z * t }];
      }
      if (far > 0) marks.push({ at: time + far, x: (at.x + last.x) / 2 + dir.x * 0.2, z: (at.z + last.z) / 2 + dir.z * 0.2, kind, size: 0.5 + 0.12 * count ** 0.5 * speed / 3, yaw });
      else if (!isWet(kind)) marks.push({ at: time + 0.3, x: at.x + dir.x * 0.4, z: at.z + dir.z * 0.4, kind, size: 0.45, yaw });
    },
    gush(at, dir, kind, size, time) {
      if (!GORE_SETTING.on || kind === 'none') return;
      gushes.push({ until: time + GORE_FX.gush, at: { ...at }, dir, kind, size, next: time });
    },
    pool(x, z, kind, size, time, grow = GORE_FX.poolGrow) {
      if (!GORE_SETTING.on || kind === 'none') return;
      pools.lay({ x, z, size, color: colour(kind), wet: isWet(kind), kind: 0, yaw: 0, grow, life: GORE_FX.poolLife }, time);
    },
    update(time) {
      if (!GORE_SETTING.on) { // turned off: what is still to fall or spurt goes, and the blood laid goes once (round 113)
        if (!off) {
          off = true;
          marks.length = 0;
          gushes.length = 0;
          pools.clearBlood();
        }
        pools.update(time);
        return;
      }
      off = false;
      for (let i = marks.length - 1; i >= 0; i--) {
        const m = marks[i];
        if (m.at > time) continue;
        marks.splice(i, 1);
        pools.lay({ x: m.x, z: m.z, size: m.size, color: colour(m.kind), wet: isWet(m.kind), kind: 1, yaw: m.yaw, grow: 0.12, life: GORE_FX.spatterLife }, time);
      }
      for (let i = gushes.length - 1; i >= 0; i--) {
        const s = gushes[i];
        if (time >= s.until) {
          gushes.splice(i, 1);
          continue;
        }
        if (time < s.next) continue;
        s.next = time + 0.045;
        const left = (s.until - time) / GORE_FX.gush; // it weakens
        const k = Math.max(0.6, Math.min(2.5, s.size));
        drop(s.at, { x: s.dir.x * rand(0.4, 1.4) * k + rand(-0.4, 0.4), y: rand(1.5, 3.4) * left * Math.sqrt(k), z: s.dir.z * rand(0.4, 1.4) * k + rand(-0.4, 0.4) }, s.kind, rand(0.06, 0.12) * Math.sqrt(k));
      }
      pools.update(time);
    },
  };

  g.events.on('Hit', (e) => {
    if (!GORE_SETTING.on || e.lingering || e.damage <= 0 || !LANDS.includes(e.outcome)) return;
    const kind = kindOf(e.target);
    if (kind === 'none' || !c.transform.has(e.attacker)) return;
    const w = woundPoint(g, e.target, e.attacker, 0.25);
    if (!w) return;
    const self = e.target === g.player.id;
    const [lo, hi] = self ? GORE_FX.hurtDrops : GORE_FX.drops;
    const weight = Math.min(1, e.damage / (self ? 40 : 60));
    const size = Math.max(1, (c.body.get(e.target)?.radius ?? 0.5) / 0.5);
    blood.spray(w.at, { x: w.dx, z: w.dz }, kind, Math.round(lo + (hi - lo) * weight + (e.outcome === 'kill' ? 4 : 0)), (2.2 + 2.5 * weight) * Math.min(2, Math.sqrt(size)), g.frame / SIM.hz);
  });

  return blood;
}
