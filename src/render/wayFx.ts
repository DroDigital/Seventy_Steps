/**
 * The things of the ways, seen at work (round 62; systems/ways.ts says what they do): the ring a plate, a vent or a wave marks where it will
 * burst, thickening with a crackle of its own matter as the moment nears, and the burst itself, scar and shock ring; and the ground that wears
 * at the mind, drawn as a ring on it with motes lifting off it. Each `Look` of data/arenaWays.ts is a matter (an element of render/fxKit.ts) and
 * a set of colours, so a ward of salt is white dust and a wave of brine is spray, and none is the sky's blue. Render only.
 */

import type { V3 } from '../core/geom';
import type { Look } from '../data/arenaWays';
import type { Game } from '../systems/components';
import { wayRuns } from '../systems/ways';
import { lookOf, type AttackLook } from './attackLook';
import { burst, ELEMENTS, flash, type Element } from './fxKit';
import type { GroundFx } from './groundFx';
import type { AoeMotif } from './aoeLook';
import { mixRgb, type Rgb } from './palette';
import type { Particles } from './particles';

interface Spec {
  element: keyof typeof ELEMENTS;
  motif: AoeMotif;
  danger: Rgb; // where it will fall
  line: Rgb; // its light
  ring: Rgb; // its dust
  core: Rgb;
  ember: Rgb;
  ink: Rgb; // what it leaves on the ground
}

const SPECS: Readonly<Record<Look, Spec>> = {
  flame: { element: 'flame', motif: 'flame', danger: [1, 0.46, 0.16], line: [1, 0.72, 0.32], ring: [0.5, 0.3, 0.2], core: [1, 0.95, 0.8], ember: [0.5, 0.15, 0.05], ink: [0.12, 0.06, 0.04] },
  spore: { element: 'spore', motif: 'spore', danger: [0.72, 0.82, 0.36], line: [0.86, 0.92, 0.52], ring: [0.46, 0.52, 0.3], core: [0.95, 1, 0.8], ember: [0.3, 0.4, 0.15], ink: [0.1, 0.12, 0.06] },
  coil: { element: 'coil', motif: 'coil', danger: [0.58, 0.78, 0.3], line: [0.78, 0.92, 0.46], ring: [0.42, 0.5, 0.3], core: [0.95, 1, 0.8], ember: [0.25, 0.4, 0.12], ink: [0.08, 0.12, 0.05] },
  salt: { element: 'ash', motif: 'ash', danger: [0.92, 0.92, 0.86], line: [1, 1, 0.96], ring: [0.8, 0.8, 0.76], core: [1, 1, 1], ember: [0.5, 0.5, 0.5], ink: [0.5, 0.5, 0.48] },
  bolt: { element: 'star', motif: 'star', danger: [0.62, 0.78, 1], line: [0.7, 0.85, 1], ring: [0.85, 0.92, 1], core: [1, 1, 1], ember: [0.2, 0.3, 0.55], ink: [0.1, 0.12, 0.2] },
  brine: { element: 'tide', motif: 'tide', danger: [0.4, 0.66, 0.74], line: [0.66, 0.88, 0.94], ring: [0.55, 0.7, 0.72], core: [0.95, 1, 1], ember: [0.2, 0.35, 0.4], ink: [0.08, 0.14, 0.16] },
  sand: { element: 'crack', motif: 'crack', danger: [0.88, 0.7, 0.4], line: [1, 0.85, 0.55], ring: [0.78, 0.66, 0.46], core: [1, 0.95, 0.8], ember: [0.5, 0.35, 0.15], ink: [0.2, 0.15, 0.08] },
  frost: { element: 'frost', motif: 'frost', danger: [0.7, 0.86, 1], line: [0.82, 0.93, 1], ring: [0.85, 0.92, 1], core: [1, 1, 1], ember: [0.3, 0.4, 0.55], ink: [0.12, 0.16, 0.24] },
  eye: { element: 'eye', motif: 'eye', danger: [0.86, 0.22, 0.46], line: [1, 0.5, 0.7], ring: [0.5, 0.3, 0.4], core: [1, 0.9, 0.95], ember: [0.4, 0.1, 0.25], ink: [0.12, 0.04, 0.08] },
  sign: { element: 'glyph', motif: 'glyph', danger: [0.96, 0.86, 0.32], line: [1, 0.94, 0.55], ring: [0.7, 0.62, 0.3], core: [1, 1, 0.85], ember: [0.5, 0.42, 0.1], ink: [0.16, 0.14, 0.05] },
  void: { element: 'glyph', motif: 'glyph', danger: [0.3, 0.9, 0.62], line: [0.55, 1, 0.8], ring: [0.3, 0.55, 0.45], core: [0.9, 1, 0.95], ember: [0.1, 0.4, 0.28], ink: [0.04, 0.12, 0.09] },
  star: { element: 'star', motif: 'star', danger: [0.72, 0.62, 1], line: [0.85, 0.78, 1], ring: [0.6, 0.55, 0.8], core: [1, 0.97, 1], ember: [0.3, 0.2, 0.55], ink: [0.1, 0.07, 0.18] },
  stain: { element: 'stain', motif: 'stain', danger: [0.78, 0.3, 0.62], line: [0.95, 0.5, 0.8], ring: [0.5, 0.35, 0.45], core: [1, 0.9, 0.97], ember: [0.4, 0.12, 0.3], ink: [0.12, 0.05, 0.1] },
  glass: { element: 'crack', motif: 'crack', danger: [0.62, 0.72, 0.92], line: [0.8, 0.88, 1], ring: [0.62, 0.68, 0.8], core: [1, 1, 1], ember: [0.3, 0.35, 0.5], ink: [0.1, 0.12, 0.18] },
};

const cache = new Map<Look, { look: AttackLook; element: Element }>();
/** The look of a kind of hazard: its matter and its colours, as an attack's. */
export function wayLook(look: Look): { look: AttackLook; element: Element } {
  let m = cache.get(look);
  if (!m) {
    const s = SPECS[look];
    m = { look: { ...lookOf(undefined), motif: s.motif, danger: s.danger, line: s.line, ring: s.ring, mind: s.line, core: s.core, ember: s.ember, ink: s.ink, punch: 1, twist: 1, pitch: 1 }, element: ELEMENTS[s.element] };
    cache.set(look, m);
  }
  return m;
}

/** The motif of a look: what its sounds are made of (render/audio/wayAudio.ts). */
export const motifOf = (look: string): AoeMotif => SPECS[look as Look]?.motif ?? 'plain';

const rand = (a: number, b: number): number => a + (b - a) * Math.random();

export interface WayFx {
  update(time: number, eye: V3): void;
}

export function createWayFx(g: Game, particles: Particles, ground: GroundFx): WayFx {
  const warns: { at: V3; radius: number; ends: number; look: Look }[] = [];
  let now = 0;
  g.events.on('WardWarned', ({ at, radius, frames, look, mute }) => {
    if (mute) return;
    const w = wayLook(look as Look);
    ground.warn(at, radius, frames / 60, w.look.danger);
    warns.push({ at: { ...at }, radius, ends: now + frames / 60, look: look as Look });
  });
  g.events.on('WardLanded', ({ at, radius, look, mute }) => {
    if (mute) return;
    const w = wayLook(look as Look);
    const k = look as Look;
    burst(particles, w.element, at, radius, w.look, 1.1);
    flash(particles, w.element, at, radius * 1.4, w.look, 1);
    ground.scar(at, radius * 1.1, w.look.ink, undefined, k === 'salt' ? 7 : 12);
    ground.shock(at, radius * 0.5, radius * 2.6, w.look.ring, undefined, 0.5, 0.9);
    if (k === 'brine') for (let i = 0; i < 14; i++) particles.spawn({ x: at.x + rand(-radius, radius) * 0.6, y: at.y + 0.2, z: at.z + rand(-radius, radius) * 0.6, vy: rand(3, 6), vx: rand(-1, 1), vz: rand(-1, 1), life: 0.9, size: rand(0.18, 0.34), grow: 1.4, color: w.look.line, colorEnd: w.look.ring, gravity: 9, drag: 0.5, shape: 'disc', alpha: 0.8 });
  });
  let ring = 0; // the next patch whose ring is drawn
  return {
    update(time, eye) {
      now = time;
      for (let i = warns.length - 1; i >= 0; i--) {
        const w = warns[i]!;
        const left = w.ends - time;
        if (left < -0.3) {
          warns.splice(i, 1);
          continue;
        }
        const m = wayLook(w.look);
        const k = Math.min(1, Math.max(0, 1 - left / 1.2));
        for (let n = 0; n < 1 + Math.round(k * 3); n++) {
          const a = Math.random() * Math.PI * 2;
          const d = w.radius * (0.2 + 0.85 * Math.random());
          particles.spawn({ x: w.at.x + Math.sin(a) * d, y: w.at.y + 0.1, z: w.at.z + Math.cos(a) * d, vy: 1 + 3 * k + Math.random() * 1.5, vx: Math.sin(a) * 0.3, vz: Math.cos(a) * 0.3, life: 0.4, size: 0.08 + 0.08 * k, grow: 0.5, color: m.look.core, colorEnd: m.look.line, glow: m.element.glow, shape: Math.random() < 0.4 ? 'spark' : 'streak', stretch: 0.1, spin: 6, hold: 0.3 });
        }
      }
      // ground that wears at the mind: a ring on it, and motes lifting off it (only the nearest, and only while the camera is by)
      const patches = wayRuns(g).flatMap((r) => (r.near ? r.patches : []));
      if (patches.length === 0) return;
      const p = patches[ring++ % patches.length]!;
      const m = wayLook(p.look);
      if (Math.hypot(p.x - eye.x, p.z - eye.z) < 60) ground.sigil({ x: p.x, y: p.y, z: p.z }, p.r, mixRgb(m.look.ink, m.look.danger, 0.3), undefined, 1.4); // a ring the colour of the ground gone wrong, not of a mark laid on it
      for (const q of patches) {
        if (Math.hypot(q.x - eye.x, q.z - eye.z) > 45 || Math.random() > 0.7) continue;
        const a = Math.random() * Math.PI * 2;
        const d = q.r * Math.sqrt(Math.random());
        const c = wayLook(q.look);
        particles.spawn({ x: q.x + Math.sin(a) * d, y: q.y + 0.1, z: q.z + Math.cos(a) * d, vy: rand(0.3, 1), vx: rand(-0.1, 0.1), vz: rand(-0.1, 0.1), life: rand(1.6, 2.6), size: rand(0.08, 0.16), grow: 0.8, color: c.look.line, colorEnd: c.look.ember, glow: true, shape: 'wisp', alpha: 0.7 });
        particles.spawn({ x: q.x + Math.sin(a) * d, y: q.y + 0.2, z: q.z + Math.cos(a) * d, vy: rand(0.2, 0.5), life: rand(2.4, 3.6), size: rand(0.5, 1.0), grow: 2.2, color: c.look.ring, colorEnd: c.look.ink, shape: 'disc', alpha: 0.22 }); // and a low grey smoke over it
      }
    },
  };
}
