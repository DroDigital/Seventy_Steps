/**
 * The few specks a quiet blow sheds (round 89, render only; data/foeBlows.ts `Matter`, the numbers FOE_FX.matter): drops of brine and beads
 * of ichor fall, ash and down drift down, grit falls, spores and embers rise, frost and soft lights hang. Their colour is what they are made of
 * with the blow's own hues come a share of the way into it, so a ghoul's spores and a mi-go's are not one pale green. Never more than the
 * caller asks for: the crowd (`foeCrowd.ts`) decides how many that is.
 */

import type { V3 } from '../core/geom';
import type { FoeBlow, Matter } from '../data/foeBlows';
import { FOE_FX, type MatterSpec } from '../data/fxTuning';
import { toneOf, type Pen, type Tone } from './blowPen';
import { mixRgb, scaleRgb, type Rgb } from './palette';

const tau = Math.PI * 2;
const lerp = (r: readonly [number, number], t: number): number => r[0] + (r[1] - r[0]) * t;

/** What `matter` is made of in particles, or nothing for a blow that sheds none. */
export const matterOf = (matter: Matter): MatterSpec | undefined => (matter === 'none' ? undefined : FOE_FX.matter[matter]);

/** The matter's colour with the blow's hues come in: at birth, half way, and at death (an ember goes dark). */
function matterTone(pen: Pen, blow: FoeBlow, m: MatterSpec): Tone {
  const t = toneOf(blow.hues, pen.rng);
  const base = m.base as Rgb;
  const k = m.share ?? FOE_FX.hueShare;
  return {
    color: mixRgb(base, t.color, k),
    colorMid: mixRgb(base, t.colorMid, k),
    colorEnd: m.cools ? mixRgb(scaleRgb(base, 0.3), t.colorEnd, 0.15) : mixRgb(scaleRgb(base, 0.6), t.colorEnd, k),
  };
}

export interface SpeckAt {
  at: V3;
  v: V3;
  life?: number; // seconds (the matter's own by default)
  size?: number; // metres (ditto)
  gravity?: number; // m/s² (ditto)
  glow?: boolean; // (ditto)
  /** Which of the matter's shapes, by turn. */
  turn?: number;
}

/** One speck of `blow`'s matter (or of `fallback` for a blow that sheds none), flung as the caller says. */
export function speck(pen: Pen, blow: FoeBlow, p: SpeckAt, fallback: Matter = 'mote'): boolean {
  const m = matterOf(blow.matter) ?? matterOf(fallback);
  if (!m) return false;
  const r = pen.rng;
  const gravity = p.gravity ?? m.gravity;
  pen.put({
    at: p.at, v: p.v, life: p.life ?? lerp(m.life, r()), size: p.size ?? lerp(m.size, r()), shape: m.shapes[(p.turn ?? 0) % m.shapes.length]!,
    tone: matterTone(pen, blow, m), alpha: FOE_FX.speckAlpha, glow: p.glow ?? m.glow, gravity, drag: m.drag,
    spin: m.spin ? (r() * 2 - 1) * m.spin : 0, rot: r() * tau, hold: 0.3, ...(gravity > 0 && { floor: pen.floorOf(p.at) }),
  });
  return true;
}

/** `n` specks thrown from `at`, scattered about the way `dir` points (all round for none): what a blow throws where it lands. */
export function specks(pen: Pen, blow: FoeBlow, at: V3, n: number, dir?: { x: number; z: number }): number {
  const m = matterOf(blow.matter);
  if (!m) return 0;
  const r = pen.rng;
  for (let i = 0; i < n; i++) {
    const a = dir ? Math.atan2(dir.z, dir.x) + (r() * 2 - 1) * 1.3 : r() * tau;
    const out = lerp(m.out, r());
    speck(pen, blow, { at: { x: at.x + (r() - 0.5) * 0.12, y: at.y, z: at.z + (r() - 0.5) * 0.12 }, v: { x: Math.cos(a) * out, y: lerp(m.up, r()), z: Math.sin(a) * out }, turn: i });
  }
  return n;
}

/** A mote drawn in from `from` to `to` over `life` seconds: a caster's gather (lit: they are lights). */
export function mote(pen: Pen, blow: FoeBlow, from: V3, to: V3, life: number, size: number): void {
  speck(pen, blow, { at: from, v: { x: (to.x - from.x) / life, y: (to.y - from.y) / life, z: (to.z - from.z) / life }, life, size, gravity: 0, glow: true });
}

/** A mote that rises from `at` (a summoning's, a roar's front, an arrival's). */
export function riser(pen: Pen, blow: FoeBlow, at: V3, rise: number, life: number, size: number): void {
  speck(pen, blow, { at, v: { x: (pen.rng() - 0.5) * 0.3, y: rise, z: (pen.rng() - 0.5) * 0.3 }, life, size, gravity: 0, glow: true });
}
