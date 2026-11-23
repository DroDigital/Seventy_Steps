/**
 * The outlines of the far silhouettes (data/skylines.ts; render/skyline.ts): each a height, as a share of the silhouette's, along its width,
 * x from -0.5 to 0.5. Round 117: drawn from smooth fractal noise (the crests' only roughness was 64 random steps, a staircase along every
 * ridge, and the peaks and reef plain triangles), and each in its own form: Kadath's mountain, its flanks ridged and shouldered and its
 * summit levelled for the onyx castle; ranges of leaning, ridged peaks with the Elder Things' cubes on the highest; round hills fringed with
 * trees, a ring of stones on the highest; jagged crags out of the sea with Devil Reef's lamp-tower; wind-cut dunes with their slip faces and
 * cyclopean stones half buried; and the horror hunched on the horizon, its wings half open (round 26). The built ones (castle, city, towers,
 * town, minarets) are render/skylineBuilt.ts. Pure.
 */

import { hash2, type Rng } from '../core/rng';
import type { SilhouetteKind } from '../data/skylines';
import { castle, city, minarets, town, towers } from './skylineBuilt';
import { clamp, crown, fbm, lean, lineNoise, type Profile, type ProfileOptions, ridged, slab, smooth } from './skylineKit';

export type { Profile, ProfileOptions } from './skylineKit';

/** A kind's usual width over height in metres (data/skylines.ts), for an outline asked for without its own. */
const ASPECT: Readonly<Record<SilhouetteKind, number>> = { peak: 2, range: 4.5, city: 3.8, towers: 3.5, hills: 11, town: 5, reef: 7, dunes: 18, minarets: 5.4, titan: 0.9 };

const between = (rng: Rng) => (lo: number, hi: number): number => lo + (hi - lo) * rng();

/** Unknown Kadath: one great mountain over its cold waste, ridged and shouldered, the onyx castle on its levelled summit. */
function peak(rng: Rng, aspect: number): Profile {
  const r = between(rng);
  const n = lineNoise(rng);
  const shoulders = [{ c: r(-0.3, -0.17), h: r(0.36, 0.5), w: r(0.12, 0.2), k: r(-0.4, 0.4) }, { c: r(0.17, 0.32), h: r(0.28, 0.42), w: r(0.1, 0.18), k: r(-0.4, 0.4) }];
  const summit = 0.76;
  const keep = castle(rng, aspect, summit);
  const f: Profile = (x) => {
    const a = Math.abs(x);
    let y = 0.79 * (1 - smooth(0.06, 0.5, a)) ** 1.35;
    for (const s of shoulders) y = Math.max(y, lean(x, s.c, s.w, s.h, s.k, 1.3));
    const jag = Math.min(1, y * 2.2);
    y += (ridged(n, x * 16 + 5, 4) - 0.45) * 0.08 * jag + (fbm(n, x * 75 + 31, 3) - 0.5) * 0.025 * jag;
    if (a < 0.08) y = clamp(y, summit - 0.03, summit + 0.012); // the crown of rock, levelled where the castle stands
    return clamp(Math.max(y, keep(x)[0]), 0, 1.1);
  };
  f.wall = (x) => keep(x)[1];
  return f;
}

/** Peaks upon peaks, leaning and ridged, the Elder Things' cubes on the highest. */
function mountains(rng: Rng): Profile {
  const r = between(rng);
  const n = lineNoise(rng);
  const peaks = Array.from({ length: 9 }, () => ({ c: r(-0.46, 0.46), h: r(0.32, 1), w: r(0.05, 0.14), k: r(-0.6, 0.6) }));
  const land = (x: number): number => {
    let y = 0.07 + (fbm(n, x * 6, 3) - 0.5) * 0.08;
    for (const p of peaks) y = Math.max(y, lean(x, p.c, p.w, p.h, p.k, 1.25));
    const jag = Math.min(1, y * 2);
    return y + (ridged(n, x * 22 + 7, 5) - 0.45) * 0.13 * jag + (ridged(n, x * 70 + 19, 3) - 0.45) * 0.045 * jag + (fbm(n, x * 160 + 3, 2) - 0.5) * 0.02 * jag; // crags upon crags
  };
  const cubes = [...peaks].sort((a, b) => b.h - a.h).slice(0, 3).map((p) => {
    const c = p.c + p.k * p.w * 0.8;
    return { c, w: r(0.005, 0.012), top: land(c) + r(0.03, 0.06) };
  });
  return (x) => {
    let y = land(x);
    for (const q of cubes) if (Math.abs(x - q.c) < q.w) y = Math.max(y, q.top);
    return clamp(y, 0, 1.1);
  };
}

/** Round hills, their slopes grown with trees where the wood is thick, a ring of standing stones on the highest. */
function hills(rng: Rng, aspect: number, trees: number): Profile {
  const r = between(rng);
  const n = lineNoise(rng);
  const list = Array.from({ length: 7 }, () => ({ c: r(-0.42, 0.42), h: r(0.35, 1), s: r(0.07, 0.17) }));
  const top = list.reduce((a, b) => (b.h > a.h ? b : a));
  const seed = Math.floor(rng() * 1e6);
  const stones = Array.from({ length: 7 }, (_, k) => ({ c: top.c + (k - 3) * 0.0055 + r(-0.0012, 0.0012), h: r(0.035, 0.055) }));
  const ground = (x: number): number => {
    let y = 0;
    for (const h of list) y = Math.max(y, h.h * Math.exp(-(((x - h.c) / h.s) ** 2)));
    return y * (0.9 + 0.2 * fbm(n, x * 9 + 2, 3)) + (fbm(n, x * 30, 2) - 0.5) * 0.03 * Math.min(1, y * 3);
  };
  const tall = 0.07; // a tree's height, as a share of the hills'
  const half = (tall * 0.45) / aspect; // and its crown's half-width
  const cell = half * 1.5;
  return (x) => {
    const g = ground(x);
    let y = g;
    if (trees > 0) {
      for (let i = Math.floor(x / cell) - 1; i <= Math.floor(x / cell) + 1; i++) {
        const c = (i + 0.5) * cell + (hash2(i, 1, seed) - 0.5) * cell * 0.6;
        if (Math.abs(c - top.c) < 0.035) continue; // the stones' crown is bare
        if (hash2(i, 2, seed) > trees * (0.35 + 0.9 * fbm(n, c * 14 + 50, 2)) - 0.1) continue; // the wood comes and goes in stands
        y = Math.max(y, crown(x, c, half * (0.7 + 0.6 * hash2(i, 3, seed)), tall * (0.6 + 0.7 * hash2(i, 4, seed)), ground(c)));
      }
    }
    for (const s of stones) y = Math.max(y, slab(x, s.c, 0.0013, ground(s.c) + s.h));
    return clamp(y, 0, 1.1);
  };
}

/** Long waves of sand, a slow rise to the windward and a short steep slip face, cyclopean stones half buried among them, some aslant. */
function dunes(rng: Rng): Profile {
  const r = between(rng);
  const n = lineNoise(rng);
  const waves = Array.from({ length: 5 }, () => ({ f: r(2.5, 10), p: r(0, 1), a: r(0.06, 0.24), k: r(0.62, 0.86) }));
  const stones = Array.from({ length: 6 }, () => ({ c: r(-0.42, 0.42), w: r(0.005, 0.02), h: r(0.45, 0.9), tilt: r(-3, 3) }));
  return (x) => {
    let y = 0.1 + (fbm(n, x * 5, 3) - 0.5) * 0.08;
    for (const w of waves) {
      const t = (((x * w.f + w.p) % 1) + 1) % 1;
      y += w.a * 0.55 * (t < w.k ? (t / w.k) ** 1.6 : ((1 - t) / (1 - w.k)) ** 0.7);
    }
    for (const s of stones) y = Math.max(y, slab(x, s.c, s.w, s.h, s.tilt));
    return clamp(y, 0, 1.1);
  };
}

/** Jagged crags standing out of the sea, one with a lamp-tower on it (round 80: its lamp turns, render/horizonGlow.ts). */
function reef(rng: Rng): Profile {
  const r = between(rng);
  const n = lineNoise(rng);
  const rocks = Array.from({ length: 14 }, () => ({ c: r(-0.45, 0.45), h: r(0.18, 0.7), w: r(0.015, 0.06), k: r(-0.6, 0.6) }));
  const light = rocks[0];
  const outline: Profile = (x) => {
    let y = 0;
    for (const k of rocks) y = Math.max(y, lean(x, k.c, k.w, k.h, k.k, 0.75));
    if (y > 0) y += (ridged(n, x * 40 + 3, 3) - 0.45) * 0.08 * Math.min(1, y * 3);
    if (Math.abs(x - light.c) < 0.004) y = Math.max(y, light.h + 0.28); // the lamp-tower
    return clamp(y, 0, 1.1);
  };
  outline.lamp = { x: light.c, y: light.h + 0.28 };
  return outline;
}

/** A great shape, hunched, its wings half open and torn, a crown of feelers on its head (round 26). */
function titan(rng: Rng): Profile {
  const r = between(rng);
  const n = lineNoise(rng);
  const feelers = Array.from({ length: 7 }, (_, i) => ({ c: -0.045 + i * 0.015, h: r(0.05, 0.16), w: r(0.004, 0.009) }));
  return (x) => {
    const a = Math.abs(x);
    let y = Math.max(0.7 * Math.exp(-((x / 0.17) ** 2)), 0.82 * Math.exp(-(((x - 0.02) / 0.06) ** 2))); // the shoulders, and the head bowed a little to one side
    for (const f of feelers) {
      const d = Math.abs(x - 0.02 - f.c);
      if (d < f.w) y = Math.max(y, 0.8 + f.h * (1 - d / f.w));
    }
    const wing = a > 0.15 && a < 0.47 ? 0.9 * Math.max(0, 1 - Math.abs(a - 0.27) / 0.22) ** 1.3 * (0.88 + 0.2 * Math.sin(a * 140)) : 0;
    y = Math.max(y, wing, 0.08 + (fbm(n, x * 12, 3) - 0.5) * 0.05);
    return clamp(y + (fbm(n, x * 90 + 9, 3) - 0.5) * 0.03 * Math.min(1, y * 3), 0, 1.1);
  };
}

export function profile(kind: SilhouetteKind, rng: Rng, o: ProfileOptions = {}): Profile {
  const aspect = o.aspect ?? ASPECT[kind];
  const trees = o.trees ?? 0.4;
  switch (kind) {
    case 'peak':
      return peak(rng, aspect);
    case 'range':
      return mountains(rng);
    case 'city':
      return city(rng);
    case 'towers':
      return towers(rng);
    case 'hills':
      return hills(rng, aspect, trees);
    case 'town':
      return town(rng, aspect, trees);
    case 'reef':
      return reef(rng);
    case 'dunes':
      return dunes(rng);
    case 'minarets':
      return minarets(rng, aspect);
    case 'titan':
      return titan(rng);
  }
}
