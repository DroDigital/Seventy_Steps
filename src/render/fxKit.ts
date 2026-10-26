/**
 * The vocabulary of a blow's particles (render only, round 51). Every horror's attacks are made of
 * one of twelve elements (the mark its ground carries, `aoeLook`): the sea throws drops and spray,
 * stone shards and dust, fire embers that cool and smoke that climbs, frost splinters and a settling
 * fog, spores and ash drift, ink falls in black beads, stars and eyes flash and shed light. An element
 * is a handful of numbers; the four things done with it (a burst, a bolt's landing, a bolt's trail,
 * a charge gathering) are the same code, so a new horror needs no new effect, only its element and
 * colours. Particles only: the ground's marks are `groundFx`.
 */

import type { V3 } from '../core/geom';
import type { AoeMotif } from './aoeLook';
import type { AttackLook } from './attackLook';
import { FLASH_LIGHTS } from '../data/fxTuning';
import { flashLight } from './flashLights';
import { groundUnder, signature } from './fxForms';
import type { Particles, ParticleShape } from './particles';
import type { Rgb } from './palette';

export interface Element {
  chunk: ParticleShape; // what flies out of a burst
  gravity: number; // m/s² on a chunk (negative: it floats up)
  glow: boolean; // chunks shine
  cools: boolean; // a chunk goes ember, then dark, as it falls
  tint: 'danger' | 'line' | 'ring'; // the chunk's colour
  mist: number; // m/s a cloud rises (negative: it settles)
  smoke: boolean; // the cloud is dark, not the horror's dust colour
  glint: ParticleShape | null; // a few bright specks over the rest
  halo: boolean; // a ring of light opens with the flash
  streaks: boolean; // light thrown outward in rays
}

const el = (chunk: ParticleShape, gravity: number, glow: boolean, tint: Element['tint'], mist: number, o: Partial<Element> = {}): Element => ({
  chunk, gravity, glow, cools: false, tint, mist, smoke: false, glint: null, halo: false, streaks: false, ...o,
});

export const ELEMENTS: Readonly<Record<AoeMotif, Element>> = {
  plain: el('disc', 7, false, 'danger', 0.6),
  tide: el('disc', 13, false, 'line', 1.1, { glint: 'spark' }),
  glyph: el('spark', -0.8, true, 'line', 0.9, { halo: true, glint: 'spark' }),
  crack: el('shard', 15, false, 'ring', 0.5, { glint: 'spark' }),
  flame: el('spark', -2.5, true, 'danger', 2.4, { cools: true, smoke: true }),
  spore: el('wisp', -0.7, true, 'line', 0.7, { glint: 'disc' }),
  coil: el('streak', 3, true, 'line', 0.6, { streaks: true }),
  eye: el('spark', 0, true, 'line', 0.4, { halo: true, glint: 'spark' }),
  root: el('shard', 10, false, 'danger', 0.7, { glint: 'disc' }),
  star: el('spark', 0, true, 'line', 0.3, { halo: true, streaks: true, glint: 'spark' }),
  frost: el('shard', 8, false, 'line', -0.5, { glint: 'spark' }),
  ash: el('shard', 1.4, false, 'ring', 1.6, { smoke: true }),
  stain: el('disc', 11, false, 'danger', -0.4, { cools: true, smoke: true }),
};

const rand = (a: number, b: number): number => a + (b - a) * Math.random();
const tau = Math.PI * 2;
const DARK: Rgb = [0.05, 0.05, 0.07];
const WHITE: Rgb = [1, 0.97, 0.9];

/** A light's colour from a blow's: toward white by FLASH_LIGHTS.white. */
export const whiteOf = (c: Rgb): Rgb => [c[0] + (1 - c[0]) * FLASH_LIGHTS.white, c[1] + (1 - c[1]) * FLASH_LIGHTS.white, c[2] + (1 - c[2]) * FLASH_LIGHTS.white];
const colorOf = (e: Element, look: AttackLook): Rgb => look[e.tint];
const endOf = (e: Element, look: AttackLook, c: Rgb): Rgb => (e.cools ? (e.glow ? look.ember : DARK) : c);

/** The size of a chunk for a burst of this radius: coarse for a colossus's, fine for a bolt's. */
const chunkSize = (radius: number): number => Math.min(0.75, 0.13 + radius * 0.045);

/** A flash at the heart of a blow: a blaze that is gone in a few frames, and the ring of light it opens; `lit` (round 87): whether it also lights the world about it, as a foe's blows do (render/attackFx.ts) and the investigator's, an ally's do not. */
export function flash(fx: Particles, e: Element, at: V3, radius: number, look: AttackLook, lift = 0.4, lit = true): void {
  const y = at.y + lift;
  const b = FLASH_LIGHTS.burst;
  if (lit) flashLight({ x: at.x, y: y + 0.3, z: at.z }, whiteOf(look.core), Math.min(b.most, b.strength + radius * b.per), Math.min(b.rangeMost, b.range + radius * b.rangePer), b.seconds); // and it lights what is about it (round 83)
  fx.spawn({ x: at.x, y, z: at.z, life: 0.18, size: Math.min(7, radius * 0.9 + 0.4), grow: 1.5, color: look.core, colorEnd: look.line, glow: true, hold: 0.35, shape: 'wisp' });
  fx.spawn({ x: at.x, y, z: at.z, life: 0.24, size: Math.min(9, radius * 1.5 + 0.5), grow: 0.5, color: look.core, glow: true, hold: 0.2, shape: 'spark', rot: rand(0, tau), spin: rand(-2, 2) });
  if (e.halo) fx.spawn({ x: at.x, y, z: at.z, life: 0.45, size: Math.min(5, radius * 0.7 + 0.3), grow: 4, color: look.line, glow: true, shape: 'ring', thick: 0.12, alpha: 0.9 });
  signature(fx, look, 'flash', { x: at.x, y, z: at.z }, radius);
}

/** A burst of the element's matter flung out of `at`, from a few metres' radius to a colossus's. */
export function burst(fx: Particles, e: Element, at: V3, radius: number, look: AttackLook, strength = 1, lit = true): void {
  const power = strength * look.punch;
  const c = colorOf(e, look);
  const end = endOf(e, look, c);
  const size = chunkSize(radius);
  const rest = groundUnder(fx, at) + 0.02; // what falls lies on the ground under it
  flash(fx, e, at, radius * 0.5, look, 0.4, lit);
  const crown = Math.round((8 + radius * 3.5) * power);
  for (let i = 0; i < crown; i++) {
    const a = (i / crown) * tau + rand(-0.2, 0.2);
    const s = radius * rand(1.3, 2.4);
    fx.spawn({ x: at.x, y: at.y + 0.15, z: at.z, vx: Math.cos(a) * s, vz: Math.sin(a) * s, vy: rand(0.5, 2.5), life: rand(0.5, 1), size: size * rand(0.7, 1.3), grow: e.glow ? 0.4 : 1, color: c, colorEnd: end, glow: e.glow, shape: e.chunk, gravity: e.gravity, drag: 1.4, spin: rand(-9, 9) * look.twist, rot: rand(0, tau), alpha: 0.95, hold: 0.3, stretch: 0.2, ...(e.gravity > 0 && { floor: rest }) });
  }
  const fountain = Math.round((6 + radius * 2.2) * power);
  for (let i = 0; i < fountain; i++) {
    const a = rand(0, tau);
    const d = Math.sqrt(Math.random()) * radius * 0.6;
    fx.spawn({ x: at.x + Math.cos(a) * d, y: at.y + 0.2, z: at.z + Math.sin(a) * d, vx: Math.cos(a) * rand(0, 2.5), vz: Math.sin(a) * rand(0, 2.5), vy: rand(3.5, 8.5), life: rand(0.7, 1.3), size: size * rand(0.6, 1.1), grow: e.glow ? 0.3 : 0.8, color: c, colorEnd: end, glow: e.glow, shape: e.chunk, gravity: Math.max(e.gravity, 5) + (e.glow ? 2 : 0), drag: 0.6, spin: rand(-7, 7) * look.twist, rot: rand(0, tau), alpha: 0.95, hold: 0.25, stretch: 0.18, floor: rest });
  }
  const cloud = Math.round((5 + radius * 1.6) * power);
  const mist = e.smoke ? look.ember : look.ring;
  for (let i = 0; i < cloud; i++) {
    const a = rand(0, tau);
    const d = Math.sqrt(Math.random()) * radius;
    fx.spawn({ x: at.x + Math.cos(a) * d, y: at.y + rand(0.1, 0.6), z: at.z + Math.sin(a) * d, vx: Math.cos(a) * rand(0.5, 2), vz: Math.sin(a) * rand(0.5, 2), vy: e.mist * rand(0.6, 1.4), life: rand(0.9, 1.7), size: Math.min(5, radius * rand(0.25, 0.55) + 0.4), grow: 2.6, color: mist, colorEnd: e.smoke ? DARK : look.ember, shape: 'wisp', alpha: e.smoke ? 0.55 : 0.4, drag: 1.2 });
  }
  if (e.glint) {
    const n = Math.round((6 + radius * 1.5) * power);
    for (let i = 0; i < n; i++) {
      const a = rand(0, tau);
      const s = radius * rand(0.8, 2);
      fx.spawn({ x: at.x, y: at.y + 0.3, z: at.z, vx: Math.cos(a) * s, vz: Math.sin(a) * s, vy: rand(1, 5), life: rand(0.5, 1.1), size: rand(0.12, 0.26), grow: 0.2, color: WHITE, colorEnd: look.line, glow: true, shape: e.glint, gravity: 4, drag: 1, spin: rand(-6, 6), alpha: 1, hold: 0.4 });
    }
  }
  if (e.streaks) {
    const n = 8 + Math.round(radius * 1.5);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * tau + rand(-0.15, 0.15);
      const s = radius * rand(3, 5);
      fx.spawn({ x: at.x, y: at.y + 0.5, z: at.z, vx: Math.cos(a) * s, vz: Math.sin(a) * s, vy: rand(0, 1.2), life: 0.35, size: 0.18 + radius * 0.03, color: look.core, colorEnd: look.line, glow: true, shape: 'streak', stretch: 0.14, alpha: 1, hold: 0.3 });
    }
  }
  signature(fx, look, 'burst', at, radius);
}

/** A bolt landing at `at` travelling `dir` (a unit vector in the ground plane): a spray thrown back, a stain, a flash. */
export function impact(fx: Particles, e: Element, at: V3, dir: { x: number; z: number }, size: number, look: AttackLook, lit = true): void {
  const c = colorOf(e, look);
  const end = endOf(e, look, c);
  flash(fx, e, at, size * 1.2, look, 0.3, lit);
  const rest = groundUnder(fx, at) + 0.02; // a wound's or a wall's spray falls to the ground under it, not to the height it struck
  const back = Math.atan2(-dir.z, -dir.x);
  const n = 8 + Math.round(size * 14);
  for (let i = 0; i < n; i++) {
    const a = back + rand(-1.1, 1.1);
    const s = rand(1.5, 5.5);
    fx.spawn({ x: at.x, y: at.y + 0.2, z: at.z, vx: Math.cos(a) * s, vz: Math.sin(a) * s, vy: rand(1, 4.5), life: rand(0.35, 0.8), size: rand(0.1, 0.2) + size * 0.25, grow: e.glow ? 0.4 : 1, color: c, colorEnd: end, glow: e.glow, shape: e.chunk, gravity: Math.max(e.gravity, 6), drag: 1.2, spin: rand(-10, 10), rot: rand(0, tau), alpha: 0.95, hold: 0.3, stretch: 0.2, floor: rest });
  }
  for (let i = 0; i < 3; i++) fx.spawn({ x: at.x, y: at.y + 0.25, z: at.z, vx: rand(-1, 1), vz: rand(-1, 1), vy: Math.abs(e.mist) * rand(0.6, 1.2) + 0.5, life: rand(0.5, 0.9), size: 0.7 + size, grow: 2.4, color: e.smoke ? look.ember : look.ring, shape: 'wisp', alpha: 0.4, drag: 1.5 });
  if (e.glint) for (let i = 0; i < 4; i++) fx.spawn({ x: at.x, y: at.y + 0.3, z: at.z, vx: rand(-3, 3), vz: rand(-3, 3), vy: rand(1, 4), life: rand(0.3, 0.7), size: 0.14, color: WHITE, glow: true, shape: e.glint, gravity: 5, spin: 8, hold: 0.4 });
  signature(fx, look, 'land', at, size, dir);
}

/** One step of a bolt's trail, from `at` flying at `vel` (m/s): a halo of its light, its matter shed behind, now and then a spark. */
export function trail(fx: Particles, e: Element, at: V3, vel: V3, radius: number, look: AttackLook, lit: boolean): void {
  const speed = Math.hypot(vel.x, vel.y, vel.z) || 1;
  const c = colorOf(e, look);
  fx.spawn({ x: at.x, y: at.y, z: at.z, life: 0.1, size: radius * 4.4, grow: 0.8, color: look.line, glow: true, shape: 'wisp', alpha: 0.85 });
  fx.spawn({ x: at.x, y: at.y, z: at.z, vx: -vel.x * 0.12 + rand(-0.4, 0.4), vy: -vel.y * 0.12 + rand(-0.2, 0.6), vz: -vel.z * 0.12 + rand(-0.4, 0.4), life: rand(0.3, 0.55), size: radius * rand(0.9, 1.5), grow: e.mist < 0 ? 1.4 : 2.2, color: lit ? look.core : c, colorEnd: endOf(e, look, c), shape: e.chunk === 'disc' ? 'disc' : 'wisp', glow: e.glow || lit, alpha: 0.8, drag: 2, gravity: Math.max(0, e.gravity) * 0.2, hold: 0.2 });
  if (Math.random() < 0.55) fx.spawn({ x: at.x, y: at.y, z: at.z, vx: -vel.x * 0.25 + rand(-1.5, 1.5), vy: rand(-0.5, 1.5), vz: -vel.z * 0.25 + rand(-1.5, 1.5), life: rand(0.2, 0.5), size: radius * 0.6 + 0.06, color: WHITE, colorEnd: look.line, glow: true, shape: e.glint ?? 'spark', gravity: 3, spin: 6, hold: 0.3 });
  if (speed > 6 && Math.random() < 0.5) fx.spawn({ x: at.x, y: at.y, z: at.z, vx: vel.x * 0.1, vy: vel.y * 0.1, vz: vel.z * 0.1, life: 0.14, size: radius * 0.9, color: look.core, glow: true, shape: 'streak', stretch: 0.05, alpha: 0.9 });
  signature(fx, look, 'trail', at, radius, undefined, vel);
}

/** The gathering of a caster's wind-up: the element's matter and light drawn in toward `at` from `range` metres, faster as `t` (0..1) nears the end. */
export function charge(fx: Particles, e: Element, at: V3, range: number, t: number, look: AttackLook): void {
  const n = 1 + Math.round(t * 2);
  for (let i = 0; i < n; i++) {
    const a = rand(0, tau);
    const r = range * rand(0.7, 1.15);
    const h = rand(-0.4, 0.9) * range * 0.5;
    const life = rand(0.28, 0.45);
    const k = r / life;
    const spiral = e.chunk === 'streak' ? 3 : 1.2;
    fx.spawn({ x: at.x + Math.cos(a) * r, y: at.y + h, z: at.z + Math.sin(a) * r, vx: -Math.cos(a) * k - Math.sin(a) * spiral, vy: -h / life, vz: -Math.sin(a) * k + Math.cos(a) * spiral, life, size: 0.1 + range * 0.025, grow: 0.3, color: look.line, colorEnd: look.core, glow: true, shape: i % 3 === 0 ? 'streak' : e.glint ?? 'disc', stretch: 0.05, alpha: 0.9, hold: 0.4 });
  }
  if (t > 0.8) fx.spawn({ x: at.x, y: at.y, z: at.z, life: 0.1, size: range * 0.35 + 0.3, grow: 1.4, color: look.core, glow: true, shape: 'wisp', alpha: 0.5 + 0.5 * t });
  signature(fx, look, 'gather', at, range, undefined, undefined, t);
}

/** A column of light and matter rising from `at`: a summoning's pillar, an arrival's. */
export function column(fx: Particles, e: Element, at: V3, radius: number, height: number, look: AttackLook, density = 1): void {
  const n = Math.round((8 + radius * 5) * density);
  for (let i = 0; i < n; i++) {
    const a = rand(0, tau);
    const d = Math.sqrt(Math.random()) * radius;
    const v = rand(height * 1.4, height * 3);
    fx.spawn({ x: at.x + Math.cos(a) * d, y: at.y + rand(0, 0.6), z: at.z + Math.sin(a) * d, vx: -Math.sin(a) * 0.6, vz: Math.cos(a) * 0.6, vy: v, life: height / v + 0.25, size: rand(0.12, 0.3), grow: 0.4, color: i % 3 ? look.line : look.core, colorEnd: look.mind, glow: true, shape: i % 4 === 0 ? 'streak' : e.glint ?? 'disc', stretch: 0.1, drag: 0.4, alpha: 0.9, hold: 0.5 });
  }
  fx.spawn({ x: at.x, y: at.y + 0.3, z: at.z, life: 0.4, size: Math.min(8, radius * 2.2 + 1), grow: 0.5, color: look.line, colorEnd: look.mind, glow: true, shape: 'wisp', alpha: 0.6, hold: 0.3 });
  signature(fx, look, 'rise', at, radius);
}
