/**
 * A creature's signature drawn over its element (round 60; data/attackSignatures.ts): every flash, burst, landing,
 * trail, gathering and column of a blow sheds a few of its own things (bubbles, runes, eyes, forked arcs, fangs,
 * feathers, a swarm, crystals, petals, voids, a prism's sparks, sand, chains, grasping smoke, notes, cinders, motes),
 * thrown in its own way (a fountain, a spiral, drawn in, a rain, an orbit, scattered), in its own light. The element
 * says what a blow is made of; this says whose it is. Render only.
 */

import type { V3 } from '../core/geom';
import type { Form, Motion, Signature } from '../data/attackSignatures';
import type { AttackLook } from './attackLook';
import { mixRgb, type Rgb } from './palette';
import type { Particles, ParticleShape } from './particles';

/** The moments a blow's effects are made at (fxKit.ts). */
export type Moment = 'flash' | 'burst' | 'land' | 'trail' | 'gather' | 'rise';

interface FormSpec {
  shape: ParticleShape;
  size: number; // metres across, for a burst a few metres wide
  life: number; // seconds
  speed: number; // m/s it is thrown at
  gravity: number; // m/s² (negative: it rises)
  drag: number;
  spin: number; // rad/s, either way
  grow: number;
  hold: number;
  glow: boolean;
  rest?: boolean; // it lands on the ground and lies there
  many?: number; // a share more (or fewer) of it than of the rest
  dark?: boolean; // drawn in the horror's ink, its accent at the edge
  level?: boolean; // it keeps upright (an eye, a note)
  draw?: 'arc' | 'chain' | 'tendril' | 'void' | 'prism' | 'hand';
}

const F = (shape: ParticleShape, size: number, life: number, speed: number, gravity: number, drag: number, o: Partial<FormSpec> = {}): FormSpec => ({
  shape, size, life, speed, gravity, drag, spin: 0, grow: 1, hold: 0.4, glow: true, ...o,
});

export const FORM_SPECS: Readonly<Record<Form, FormSpec>> = {
  tendrils: F('wisp', 0.34, 0.9, 1.4, -0.6, 1.6, { draw: 'tendril', grow: 0.7, many: 0.7 }),
  bubbles: F('bubble', 0.3, 1.1, 1.6, -1.8, 1.3, { grow: 1.3, hold: 0.45 }),
  runes: F('rune', 0.5, 0.95, 1.2, -0.35, 2, { spin: 2.4, grow: 0.85, hold: 0.55 }),
  eyes: F('eye', 0.55, 0.85, 0.7, 0, 3, { level: true, grow: 1.25, hold: 0.6, many: 0.6 }),
  arcs: F('bolt', 0.95, 0.17, 0, 0, 0, { draw: 'arc', hold: 0.5, many: 0.5 }),
  fangs: F('fang', 0.6, 0.34, 4.2, 0, 4.5, { grow: 1.45, hold: 0.3 }),
  feathers: F('feather', 0.42, 1.7, 2.3, 0.7, 2.3, { spin: 3, hold: 0.5, rest: true, glow: false }),
  swarm: F('disc', 0.075, 0.95, 2.2, 0, 0.6, { many: 2.6, hold: 0.5 }),
  crystals: F('shard', 0.44, 1.1, 4.6, 9, 0.6, { hold: 0.55, rest: true }),
  petals: F('petal', 0.32, 1.6, 2.1, 0.45, 1.7, { spin: 4, hold: 0.5, rest: true }),
  void: F('disc', 0.62, 0.55, 1, 0, 2.2, { draw: 'void', grow: 0.35, hold: 0.3, many: 0.6 }),
  prism: F('spark', 0.26, 0.75, 3, 0, 1.5, { draw: 'prism', spin: 6, hold: 0.4 }),
  sand: F('disc', 0.06, 0.85, 4.2, 6, 2.6, { many: 3, rest: true, glow: false, hold: 0.6 }),
  chains: F('ring', 0.22, 0.75, 2.6, 0.5, 2, { draw: 'chain', hold: 0.5, many: 0.5 }),
  hands: F('wisp', 0.62, 1.25, 1.2, -2.2, 1.4, { draw: 'hand', grow: 1.8, dark: true, glow: false, many: 0.6 }),
  notes: F('note', 0.4, 1.45, 1.6, -0.85, 1.8, { level: true, hold: 0.5 }),
  cinders: F('spark', 0.13, 1.35, 2.6, -1.9, 1, { spin: 8, many: 1.5, hold: 0.3 }),
  motes: F('disc', 0.17, 1.45, 1.8, -0.2, 1.2, { hold: 0.6 }),
};

const rand = (a: number, b: number): number => a + (b - a) * Math.random();
const tau = Math.PI * 2;
const INK: Rgb = [0.03, 0.025, 0.05];

/** How many of the signature's things a moment sheds, for a blow `radius` metres across. */
/** The most particles a signature adds at a moment (a colossus's burst drawn of tendrils, seven to the stalk, was 280 of them over the element's own). */
export const BUDGET: Readonly<Record<Moment, number>> = { burst: 64, land: 24, rise: 36, flash: 8, gather: 4, trail: 1 };

export function countOf(moment: Moment, radius: number, many = 1, punch = 1): number {
  const base = moment === 'burst' ? 5 + radius * 2.6 : moment === 'land' ? 3 + radius * 5 : moment === 'rise' ? 4 + radius * 2 : moment === 'flash' ? 2 : moment === 'gather' ? 1 : Math.random() < 0.4 ? 1 : 0;
  return Math.min(60, Math.round(base * many * (moment === 'burst' ? punch : 1)));
}

/** Where the `i`th of `n` starts (about the blow's heart) and how it is thrown. */
export function launch(m: Motion, i: number, n: number, r: number, speed: number, life: number, back?: number): { o: V3; v: V3 } {
  const a = back !== undefined && (m === 'fountain' || m === 'scatter') ? back + rand(-1.1, 1.1) : (i / Math.max(1, n)) * tau + rand(-0.3, 0.3);
  const [c, s] = [Math.cos(a), Math.sin(a)];
  switch (m) {
    case 'fountain': {
      const d = Math.sqrt(Math.random()) * r * 0.45;
      return { o: { x: c * d, y: 0.15, z: s * d }, v: { x: c * speed * rand(0.2, 0.5), y: speed * rand(1, 1.7), z: s * speed * rand(0.2, 0.5) } };
    }
    case 'spiral': {
      const d = r * rand(0.25, 0.75);
      return { o: { x: c * d, y: rand(0.15, 0.9), z: s * d }, v: { x: -s * speed * 1.3 + c * speed * 0.35, y: speed * rand(0.3, 0.8), z: c * speed * 1.3 + s * speed * 0.35 } };
    }
    case 'implode': {
      const [d, h] = [r * rand(1, 1.4) + 0.6, rand(0.2, 1.6)];
      return { o: { x: c * d, y: h, z: s * d }, v: { x: (-c * d) / life, y: (0.5 - h) / life, z: (-s * d) / life } };
    }
    case 'rain': {
      const d = Math.sqrt(Math.random()) * r;
      return { o: { x: c * d, y: rand(2.5, 4.5) + r * 0.4, z: s * d }, v: { x: rand(-0.3, 0.3), y: -speed * rand(1.5, 2.5), z: rand(-0.3, 0.3) } };
    }
    case 'orbit': {
      const d = r * 0.75 + 0.35;
      return { o: { x: c * d, y: rand(0.3, 1.3), z: s * d }, v: { x: -s * speed * 1.5, y: speed * 0.15, z: c * speed * 1.5 } };
    }
    default:
      return { o: { x: 0, y: rand(0.2, 0.7), z: 0 }, v: { x: c * speed * 2 * rand(0.7, 1.2), y: speed * rand(0, 0.4), z: s * speed * 2 * rand(0.7, 1.2) } };
  }
}

/** The signature's colour: its accent, or (for a dark thing) the accent sunk into the horror's ink. */
const toneOf = (f: FormSpec, look: AttackLook): Rgb => (f.dark ? mixRgb(look.accent, look.ink, 0.65) : look.accent);
/** A prism's sparks turn as they fly: the accent's channels turned a third about. */
const turned = (c: Rgb): Rgb => [c[1], c[2], c[0]];

/**
 * The signature of `look` at a moment of a blow: `at` its heart, `radius` its size, `dir` (a landing's flight) and `vel`
 * (a trail's) where it has one, `t` how far a gathering has come. Nothing for a fighter with none.
 */
export function signature(fx: Particles, look: AttackLook, moment: Moment, at: V3, radius: number, dir?: { x: number; z: number }, vel?: V3, t = 1): void {
  const sig = look.sig;
  if (!sig) return;
  const f = FORM_SPECS[sig.form];
  const n = countOf(moment, radius, f.many, look.punch);
  if (!n) return;
  let left = BUDGET[moment];
  const out: Particles = { spawn: (q) => void (left-- > 0 && fx.spawn(q)), update: fx.update };
  const scale = moment === 'trail' ? 0.5 : moment === 'gather' ? 0.45 : moment === 'land' ? 0.75 : Math.min(2.5, 0.6 + radius * 0.25);
  const motion: Motion = moment === 'gather' ? 'implode' : sig.motion;
  const r = moment === 'gather' ? radius : moment === 'trail' ? 0.2 : moment === 'flash' ? radius * 0.5 : radius;
  const back = dir ? Math.atan2(-dir.z, -dir.x) : undefined;
  const tone = toneOf(f, look);
  for (let i = 0; i < n; i++) {
    const life = f.life * rand(0.75, 1.2) * (moment === 'trail' ? 0.6 : moment === 'gather' ? 0.5 : 1);
    const speed = f.speed * (moment === 'burst' ? 0.7 + radius * 0.25 : moment === 'land' ? 0.8 : 0.5);
    const { o, v } = moment === 'trail' && vel
      ? { o: { x: 0, y: 0, z: 0 }, v: { x: -vel.x * 0.1 + rand(-0.6, 0.6), y: -vel.y * 0.1 + rand(-0.2, 0.6), z: -vel.z * 0.1 + rand(-0.6, 0.6) } }
      : launch(motion, i, n, r, speed, life, back);
    const p = { x: at.x + o.x, y: at.y + o.y, z: at.z + o.z };
    const size = f.size * scale * rand(0.75, 1.25) * (moment === 'gather' ? 0.7 + t * 0.6 : 1);
    if (f.draw && moment !== 'trail') { // (a trail's step sheds one thing, the form's own: a bolt fires many a step)
      drawn(out, f, look, tone, p, v, size, life, at.y, r);
      continue;
    }
    const rot = f.level ? 0 : f.shape === 'fang' ? Math.atan2(v.z, v.x) : rand(0, tau);
    out.spawn({ ...p, vx: v.x, vy: v.y, vz: v.z, life, size, grow: f.grow, color: tone, colorEnd: f.glow ? look.line : look.ink, glow: f.glow, shape: f.shape, gravity: f.gravity, drag: f.drag, spin: f.level ? 0 : rand(-f.spin, f.spin), rot, alpha: 0.95, hold: f.hold, ...(f.rest && { floor: at.y + 0.03, bounce: 0.25 }) });
  }
}

/** The forms drawn of more than one particle each. */
function drawn(fx: Particles, f: FormSpec, look: AttackLook, tone: Rgb, p: V3, v: V3, size: number, life: number, ground: number, r: number): void {
  switch (f.draw) {
    case 'arc': { // a forked bolt that cracks and is gone, and the sparks it throws
      fx.spawn({ ...p, y: p.y + rand(0.3, 0.9), life: rand(0.1, 0.2), size: size * (1 + r * 0.25), color: look.core, colorEnd: tone, glow: true, shape: 'bolt', rot: rand(0, tau), alpha: 1, hold: 0.5 });
      for (let k = 0; k < 2; k++) fx.spawn({ ...p, y: p.y + 0.5, vx: rand(-3, 3), vy: rand(0.5, 3), vz: rand(-3, 3), life: rand(0.2, 0.4), size: 0.1, color: look.core, colorEnd: tone, glow: true, shape: 'spark', gravity: 6, hold: 0.3 });
      return;
    }
    case 'chain': { // links in a row, thrown together
      const a = rand(0, tau);
      for (let k = 0; k < 5; k++) {
        const d = k * size * 1.3;
        fx.spawn({ x: p.x + Math.cos(a) * d, y: p.y + k * 0.05, z: p.z + Math.sin(a) * d, vx: v.x, vy: v.y, vz: v.z, life: life * (1 - k * 0.06), size, color: tone, colorEnd: look.line, glow: true, shape: 'ring', thick: 0.34, gravity: f.gravity, drag: f.drag, hold: f.hold, alpha: 0.95 });
      }
      return;
    }
    case 'tendril': { // a stalk that curls up from where it rises, its tip lingering
      const a = rand(0, tau);
      for (let k = 0; k < 7; k++) {
        const [b, rr] = [a + k * 0.65, 0.12 + k * 0.07];
        fx.spawn({ x: p.x + Math.cos(b) * rr, y: p.y + k * 0.26 * (1 + r * 0.15), z: p.z + Math.sin(b) * rr, vx: v.x - Math.sin(b) * 0.8, vy: v.y * 0.6 + 0.4, vz: v.z + Math.cos(b) * 0.8, life: life * (0.6 + k * 0.09), size: size * (1.2 - k * 0.11), grow: f.grow, color: tone, colorEnd: look.ink, glow: true, shape: k === 6 ? 'shard' : 'wisp', gravity: f.gravity, drag: f.drag, hold: 0.5, alpha: 0.85 });
      }
      return;
    }
    case 'void': { // a hole of dark with a lit rim, drawn shut
      const shared = { ...p, vx: v.x, vy: v.y, vz: v.z, life, grow: f.grow, drag: f.drag, hold: f.hold };
      fx.spawn({ ...shared, size, color: INK, alpha: 0.95, shape: 'disc' });
      fx.spawn({ ...shared, size: size * 1.25, color: tone, colorEnd: look.mind, glow: true, shape: 'ring', thick: 0.22, alpha: 0.95 });
      return;
    }
    case 'prism': { // a spark that turns through the colours as it flies
      fx.spawn({ ...p, vx: v.x, vy: v.y, vz: v.z, life, size, color: tone, colorEnd: turned(tone), glow: true, shape: 'spark', drag: f.drag, spin: rand(-f.spin, f.spin), rot: rand(0, tau), hold: f.hold, alpha: 1 });
      fx.spawn({ ...p, vx: v.x * 0.9, vy: v.y * 0.9, vz: v.z * 0.9, life: life * 0.8, size: size * 0.6, color: turned(turned(tone)), glow: true, shape: 'shard', drag: f.drag, spin: 5, hold: f.hold });
      return;
    }
    default: { // a hand of smoke: its palm rising, its fingers reaching out of it
      fx.spawn({ ...p, vx: v.x, vy: Math.abs(v.y) + 0.5, vz: v.z, life, size, grow: f.grow, color: tone, colorEnd: INK, shape: 'wisp', gravity: f.gravity, drag: f.drag, alpha: 0.6, hold: 0.3 });
      for (let k = -1.5; k <= 1.5; k++) fx.spawn({ ...p, y: Math.max(ground, p.y) + size * 0.4, vx: v.x + k * 0.5, vy: Math.abs(v.y) + 1.6, vz: v.z + k * 0.35, life: life * 0.7, size: size * 0.32, color: mixRgb(tone, look.accent, 0.4), colorEnd: INK, shape: 'streak', stretch: 0.25, gravity: f.gravity * 0.5, drag: f.drag, alpha: 0.75, hold: 0.3 });
    }
  }
}

export type { Signature };
