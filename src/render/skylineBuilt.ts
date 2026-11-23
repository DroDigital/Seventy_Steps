/**
 * The built far outlines (round 117; render/skylineShapes.ts dispatches to them): what men and older things raised against the far sky, each
 * part a height and the height of its walls, which have windows (`Profile.wall`). Kadath's onyx castle, its keep and spire among towers of
 * every height and the battlements between; R'lyeh's cyclopean blocks cut aslant, its monoliths and leaning spires on a stepped citadel (the
 * angles all wrong); terraced towers in tiers, some with a needle; a New England town of gables and flat tops, chimneys, church naves under
 * their belfries and steeples, and elms among the roofs; a dream-city's wall, domes and slender towers capped with spires and bulbs. Pure.
 */

import type { Rng } from '../core/rng';
import { cap, clamp, crown, dome, fbm, lean, lineNoise, type Profile, slab, smooth, tallest } from './skylineKit';

type Part = (x: number) => readonly [h: number, wall: number];

const range = (rng: Rng) => (lo: number, hi: number): number => lo + (hi - lo) * rng();

/** An outline from its parts: its height, and its walls'. */
function built(part: Part, top = 1.1): Profile {
  const f: Profile = (x) => clamp(part(x)[0], 0, top);
  f.wall = (x) => {
    const [h, wall] = part(x);
    return clamp(Math.min(wall, h), 0, top);
  };
  return f;
}

/** The onyx castle on Kadath's summit (`base` high there), within |x| < 0.075: a keep and its spire, towers of many heights, walls between. */
export function castle(rng: Rng, aspect: number, base: number): Part {
  const r = range(rng);
  const keep = { c: r(-0.005, 0.005), w: 0.0085, h: r(0.88, 0.92) };
  const towers = Array.from({ length: 11 }, (_, i) => {
    const c = (i % 2 ? 1 : -1) * r(0.011, 0.068);
    return { c, w: r(0.003, 0.0068), h: r(0.83, 0.93) - Math.abs(c) * 0.7, cap: rng() < 0.7 };
  });
  const wallTop = base + 0.055;
  return (x) => {
    if (Math.abs(x) > 0.074) return [0, 0];
    const teeth = Math.floor((x + 1) / 0.0026) % 2 ? 0.007 : 0; // the battlements
    const parts: (readonly [number, number])[] = [[Math.abs(x) < 0.07 ? wallTop + teeth : 0, wallTop - 0.012]];
    parts.push([Math.max(slab(x, keep.c, keep.w, keep.h), cap(x, keep.c, keep.w * 0.7, keep.h, 0.15)), keep.h - 0.02]);
    for (const t of towers) {
      const roof = t.cap ? Math.min(0.09, t.w * aspect * 2.4) : 0;
      const body = t.h - roof;
      parts.push([Math.max(slab(x, t.c, t.w, body + (t.cap ? 0 : (Math.floor((x + 1) / 0.0019) % 2 ? 0.006 : 0))), t.cap ? cap(x, t.c, t.w * 1.1, body, roof) : 0), body - 0.015]);
    }
    return tallest(parts);
  };
}

/** R'lyeh: a black mass of cyclopean blocks cut aslant, monoliths and leaning spires, on a stepped citadel. */
export function city(rng: Rng): Profile {
  const r = range(rng);
  const n = lineNoise(rng);
  const blocks = Array.from({ length: 36 }, () => ({ c: r(-0.47, 0.47), w: r(0.006, 0.035), h: r(0.14, 0.42), tilt: r(-1.6, 1.6) }));
  const monoliths = Array.from({ length: 16 }, () => ({ c: r(-0.45, 0.45), w: r(0.003, 0.01), h: r(0.42, 0.8), tilt: r(-5, 5) }));
  const spires = Array.from({ length: 12 }, () => ({ c: r(-0.44, 0.44), w: r(0.006, 0.02), h: r(0.55, 1), k: r(-0.9, 0.9) }));
  const citadel = { c: r(-0.1, 0.1), w: r(0.07, 0.11), h: r(0.42, 0.55) };
  return built((x) => {
    let y = 0.14 + (fbm(n, x * 7, 3) - 0.5) * 0.12;
    const dc = Math.abs(x - citadel.c) / citadel.w;
    if (dc < 1) y = Math.max(y, citadel.h * (Math.ceil((1 - dc) * 4) / 4)); // four great courses
    for (const b of blocks) y = Math.max(y, slab(x, b.c, b.w, b.h, b.tilt));
    for (const m of monoliths) y = Math.max(y, slab(x, m.c, m.w, m.h, m.tilt));
    for (const s of spires) y = Math.max(y, lean(x, s.c, s.w, s.h, s.k, 1.1));
    return [y * (1 - 0.55 * smooth(0.36, 0.5, Math.abs(x))), 0];
  });
}

/** Terraced towers in tiers, a few with a needle over them, on low terraces. */
export function towers(rng: Rng): Profile {
  const r = range(rng);
  const n = lineNoise(rng);
  const list = Array.from({ length: 15 }, () => ({ c: r(-0.45, 0.45), h: r(0.3, 1), w: r(0.012, 0.03), tiers: 2 + Math.floor(rng() * 3), needle: rng() < 0.45 }));
  return built((x) => {
    let best: readonly [number, number] = [0.07 + (fbm(n, x * 9, 3) - 0.5) * 0.05, 0];
    for (const t of list) {
      const d = Math.abs(x - t.c);
      if (d >= t.w) continue;
      for (let k = t.tiers - 1; k >= 0; k--) { // the narrowest tier x lies within is the one seen at its top
        if (d >= t.w * (1 - k / (t.tiers + 0.6))) continue;
        const top = t.h * (0.62 + (0.38 * (k + 1)) / t.tiers);
        if (top > best[0]) best = [top, top - 0.015];
        break;
      }
      if (t.needle && d < t.w * 0.1 && t.h * 1.1 > best[0]) best = [t.h * 1.1, best[1]];
    }
    return best;
  });
}

/** A New England town: gables, flat tops and chimneys in a close run, a few churches with their steeples, elms among them, on rolling ground. */
export function town(rng: Rng, aspect: number, trees: number): Profile {
  const r = range(rng);
  const n = lineNoise(rng);
  const houses = Array.from({ length: 84 }, () => {
    const c = r(-0.49, 0.49);
    const w = r(0.006, 0.016);
    return { c, w, eaves: r(0.1, 0.25) * (1 - 0.45 * smooth(0.3, 0.5, Math.abs(c))), roof: Math.min(0.2, r(0.35, 0.9) * w * aspect), flat: rng() < 0.18, chimney: rng() < 0.55 ? r(-0.55, 0.55) : null };
  });
  const churches = Array.from({ length: 4 }, () => ({ c: r(-0.38, 0.38), w: r(0.006, 0.011), h: r(0.6, 1) }));
  const elms = Array.from({ length: Math.round(46 * trees) }, () => ({ c: r(-0.48, 0.48), w: r(0.004, 0.009), h: r(0.1, 0.2) }));
  const ground = (x: number): number => 0.04 + (fbm(n, x * 6 + 3, 3) - 0.5) * 0.05;
  return built((x) => {
    const parts: (readonly [number, number])[] = [[ground(x), 0]];
    for (const h of houses) {
      const d = Math.abs(x - h.c);
      if (d >= h.w) continue;
      let y = h.flat ? h.eaves + h.roof * 0.22 : h.eaves + h.roof * (1 - d / h.w);
      if (h.chimney !== null && Math.abs(x - (h.c + h.chimney * h.w)) < h.w * 0.15) y = Math.max(y, h.eaves + h.roof * 1.05 + 0.025);
      parts.push([y, h.eaves - 0.01]);
    }
    for (const s of churches) {
      const d = Math.abs(x - s.c);
      if (d < s.w * 3.4) parts.push([s.h * 0.3 + s.h * 0.07 * (1 - d / (s.w * 3.4)), s.h * 0.25]); // the nave and its roof
      if (d < s.w) parts.push([s.h * 0.56, s.h * 0.5]); // the tower
      if (d < s.w * 0.82) parts.push([cap(x, s.c, s.w * 0.82, s.h * 0.6, s.h * 0.4), 0]); // the belfry and its spire
    }
    for (const e of elms) parts.push([crown(x, e.c, e.w, e.h, ground(e.c)), 0]);
    const [y, wall] = tallest(parts);
    return [y * (1 - 0.35 * smooth(0.38, 0.5, Math.abs(x))), wall];
  });
}

/** A dream-city: its wall, domes on their drums, and slender towers capped with spires and bulbs. */
export function minarets(rng: Rng, aspect: number): Profile {
  const r = range(rng);
  const n = lineNoise(rng);
  const domes = Array.from({ length: 10 }, () => ({ c: r(-0.44, 0.44), r: r(0.008, 0.022) }));
  const list = Array.from({ length: 17 }, () => ({ c: r(-0.46, 0.46), w: r(0.006, 0.014), h: r(0.38, 1), bulb: rng() < 0.55 })); // as broad as round 32's, whose walls of lit windows were the city's glow
  return built((x) => {
    const wallTop = 0.1 + (fbm(n, x * 8, 2) - 0.5) * 0.03;
    const parts: (readonly [number, number])[] = [[wallTop, wallTop - 0.03]];
    for (const d of domes) parts.push([dome(x, d.c, d.r, 0.16, aspect), 0.14]);
    for (const t of list) {
      const roof = Math.min(t.h * 0.2, t.w * aspect * (t.bulb ? 1.2 : 2.4));
      const body = t.h - roof;
      parts.push([slab(x, t.c, t.w * 1.6, body * 0.55), body * 0.5]); // its stout lower stage
      parts.push([slab(x, t.c, t.w, body), body * 0.94]);
      parts.push([t.bulb ? (Math.abs(x - t.c) < t.w ? body + roof * (0.62 * Math.sqrt(1 - ((x - t.c) / t.w) ** 2) + 0.38 * (1 - Math.abs(x - t.c) / t.w) ** 3) : 0) : cap(x, t.c, t.w, body, roof), 0]);
    }
    return tallest(parts);
  });
}
