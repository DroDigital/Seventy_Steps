/**
 * What a horror's own death lets loose in the world as it goes (2026-11-23; data/bossDeaths.ts): its cues, played by how far through
 * its death move it is, so a slowed fall and the effects lab keep them where they belong and a stream gives the same handful however
 * fast the death plays. Matter (data/bossDeathMatter.ts) as the world's particles, sized and sped by the body; rings, scars and prints
 * on the ground; a light; a bolt out of the sky; a blast's wave; a sound. Render only, read-only on the simulation: it plays with the
 * cutscenes off as with them on.
 */

import type * as THREE from 'three';
import type { Entity } from '../core/ecs';
import type { V3 } from '../core/geom';
import { deathMoveAt, deathOf, type DeathCue, type Where } from '../data/bossDeaths';
import { MATTER, type Matter } from '../data/bossDeathMatter';
import type { SampleSetId } from '../data/samples';
import type { StingerId } from '../data/sounds';
import type { Game } from '../systems/components';
import { MODEL_PREFIX } from '../systems/creatures';
import type { Beams } from './beams';
import { addWave } from './blastWaves';
import { flashLight } from './flashLights';
import type { GroundFx } from './groundFx';
import { boltPath } from './lightningPath';
import type { Rgb } from './palette';
import type { Particles } from './particles';

export interface DeathParts {
  particles: Particles;
  ground: GroundFx;
  beams: Beams;
  /** The sky's flash and its thunder, for a bolt (worldLife.ts). */
  lightning?: { strikeNow(far: number): void };
  audio: { sample(set: SampleSetId, o?: { gain?: number; pitch?: number }): void; stinger(sound: StingerId, o?: { gain?: number; pitch?: number }): void };
  /** Where a creature's painted body stands above its feet, and how broad it is drawn (creatureViews.ts). */
  figure(id: Entity): { bottom: number; top: number } | undefined;
  painted: ReadonlyMap<Entity, number>;
}

export interface BossDeathFx {
  update(time: number, camera: THREE.Camera): void;
}

const WHITE: Rgb = [1, 1, 1];
const rand = (a: number, b: number): number => a + (b - a) * Math.random();
const span = (r: readonly [number, number]): number => rand(r[0], r[1]);

/** A body as its cues are laid about it this frame. */
interface Body {
  at: V3; // its feet, where its death has moved them
  floor: number; // the ground under it
  height: number;
  breadth: number;
  k: number; // how much greater than a man's (1)
  right: { x: number; z: number }; // the view's, level
  who: string; // its roster id, for the look of its marks
}

export function createBossDeathFx(g: Game, parts: DeathParts): BossDeathFx {
  const c = g.ecs.c;
  const live = new Map<Entity, { last: number; carry: number[] }>();
  const groundAt = (x: number, z: number): number => g.world.ground(x, z);

  const emit = (m: Matter, n: number, where: Where, b: Body): void => {
    const pace = Math.sqrt(b.k);
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const [dx, dz] = [Math.cos(a), Math.sin(a)];
      const r = Math.sqrt(Math.random()) * (m.spread ?? 0.5) * b.breadth;
      const up = where === 'feet' ? rand(0, 0.25) : where === 'head' ? rand(0.75, 1) : where === 'ground' ? 0 : rand(0.1, 0.95);
      const [x, z] = [b.at.x + dx * r, b.at.z + dz * r];
      const out = (m.out ?? 0) * pace * rand(0.5, 1);
      const swirl = (m.swirl ?? 0) * pace;
      const wind = (m.wind ?? 0) * rand(0.7, 1.2);
      parts.particles.spawn({
        x, z, y: where === 'ground' ? groundAt(x, z) + 0.06 : b.at.y + up * b.height,
        vx: dx * out - dz * swirl + b.right.x * wind, vy: span(m.rise) * pace, vz: dz * out + dx * swirl + b.right.z * wind,
        life: span(m.life), size: span(m.size) * Math.pow(b.k, 0.6), grow: m.grow ?? 0.4, color: m.color[Math.floor(Math.random() * m.color.length)], colorEnd: m.end,
        alpha: m.alpha ?? 0.9, glow: m.glow, gravity: m.gravity, drag: m.drag, shape: m.shape, spin: m.spin ? rand(-m.spin, m.spin) : undefined, rot: rand(0, Math.PI * 2),
        hold: m.hold, floor: m.floor ? groundAt(x, z) : undefined,
      });
    }
  };

  const fire = (cue: DeathCue, b: Body, time: number): void => {
    const feet = { x: b.at.x, y: b.floor, z: b.at.z };
    const mid = { x: b.at.x, y: b.at.y + b.height * 0.5, z: b.at.z };
    const wide = Math.sqrt(b.k);
    if ('burst' in cue) emit(MATTER[cue.burst], Math.round(cue.n * Math.min(2, wide)), cue.where ?? 'body', b);
    else if ('ring' in cue) parts.ground.shock(feet, 0.4 * wide, cue.to * wide, cue.ring, b.who, cue.life ?? 0.9);
    else if ('scar' in cue) parts.ground.scar(feet, cue.r * wide, cue.scar, b.who, cue.life);
    else if ('light' in cue) flashLight(mid, cue.light, cue.strength, cue.range * wide, cue.seconds);
    else if ('blast' in cue) addWave(feet, cue.blast, time);
    else if ('bolt' in cue) {
      const top = { x: feet.x + rand(-4, 4), y: feet.y + 85, z: feet.z + rand(-4, 4) };
      parts.beams.bolt(boltPath(top, mid, Math.random, { segments: 16, sway: 6, forks: 3 }), 0.45, 0.55, cue.bolt, WHITE);
      flashLight(mid, cue.bolt, 3, 24, 0.6);
      parts.lightning?.strikeNow(0);
    } else if ('prints' in cue) {
      for (let i = 0; i < cue.prints; i++) {
        const a = (i / cue.prints) * Math.PI * 2 + rand(-0.3, 0.3);
        const [x, z] = [feet.x + Math.cos(a) * cue.r * wide, feet.z + Math.sin(a) * cue.r * wide];
        parts.ground.scar({ x, y: groundAt(x, z), z }, 0.32 * wide, [0.12, 0.12, 0.12], b.who, 24);
      }
    } else if ('set' in cue) parts.audio.sample(cue.set, { gain: cue.gain, pitch: cue.pitch });
    else if ('sting' in cue) parts.audio.stinger(cue.sting, { gain: cue.gain, pitch: cue.pitch });
  };

  return {
    update(time, camera) {
      const view = { x: camera.matrixWorld.elements[0], z: camera.matrixWorld.elements[2] };
      const level = Math.hypot(view.x, view.z) || 1;
      const right = { x: view.x / level, z: view.z / level };
      for (const [id, a] of c.actor) {
        const key = a.move === 'death' ? c.model.get(id)?.slice(MODEL_PREFIX.length) : undefined;
        const death = key ? deathOf(key) : undefined;
        const tr = c.transform.get(id);
        if (!death || !tr) {
          live.delete(id);
          continue;
        }
        const t = Math.min(1, a.frame / Math.max(1, a.moves.death?.frames ?? 80));
        let state = live.get(id);
        if (!state || t < state.last) live.set(id, (state = { last: -1, carry: [] })); // (a death begun again, in the effects lab)
        if (t === state.last) continue;
        const fig = parts.figure(id);
        const height = fig ? Math.max(0.5, fig.top - fig.bottom) : c.body.get(id)?.height ?? 2;
        const breadth = parts.painted.get(id) ?? height * 0.5;
        const m = deathMoveAt(death.move, t, time);
        const from = c.transform.get(g.player.id)?.pos ?? tr.pos;
        const d = Math.hypot(tr.pos.x - from.x, tr.pos.z - from.z) || 1;
        const at = { x: tr.pos.x + ((tr.pos.x - from.x) / d) * m.away * breadth, y: tr.pos.y + (fig?.bottom ?? 0) + m.lift * height, z: tr.pos.z + ((tr.pos.z - from.z) / d) * m.away * breadth };
        const body: Body = { at, floor: groundAt(at.x, at.z), height: height * m.sy, breadth: breadth * m.sx, k: Math.min(3, Math.max(0.7, height / 2.2)), right, who: key!.split('#')[0] };
        death.cues.forEach((cue, i) => {
          if ('until' in cue) { // a stream: its handful over its span, by how much of the span this frame covers
            const lo = Math.max(cue.at, state!.last);
            const hi = Math.min(cue.until, t);
            if (hi <= lo) return;
            const want = (cue.n * Math.min(2, Math.sqrt(body.k)) * (hi - lo)) / (cue.until - cue.at) + (state!.carry[i] ?? 0);
            const n = Math.floor(want);
            state!.carry[i] = want - n;
            emit(MATTER[cue.stream], n, cue.where ?? 'body', body);
          } else if (cue.at > state!.last && cue.at <= t) fire(cue, body, time);
        });
        state.last = t;
      }
      for (const id of live.keys()) if (!c.actor.has(id)) live.delete(id);
    },
  };
}
