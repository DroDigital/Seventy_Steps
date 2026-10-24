/**
 * The organ of the daemon pipers (round 71; pack 14's pipes, pack 15's bones, pack 08's plinths, a bone collar and a flute's mouth made in code, docs/BOSS_PLACES.md):
 * the court is walled by its own pipes, shafts of black stone set shoulder to shoulder in a ring, graded from the shortest either side of the gate to the
 * tallest at the back, each open at the top; every other one stands on a plinth of the old temple, every other one is collared in bone, and every third has
 * a flute's mouth cut in it facing the court. Ribs brace them where they lean together. Two great pipes keep the gate. Notes rise from their open tops,
 * thin and purple, and the court's dark tiles hold a slow mote. The fog is held low so the pipes show over it. Pure: no Three.js.
 */

import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { bearing, polar } from './common';

const BLACK: Put = { tint: [0.2, 0.19, 0.24], keep: 0.35 };
const BONE: Put = { tint: [0.84, 0.8, 0.68], keep: 0.8 };
const [S, STEP] = [3, 5.0]; // the pipes' scale (5.2 m across) and the arc between their middles

export const pipers: PlaceFn = (c: Court, h: House) => {
  const G = c.R + (h.reach ?? HOUSE.reach);
  const gate = h.gate.width / 2 + 0.9;
  const near = (th: number): number => Math.cos(bearing(th) / 2) ** 10;
  const back = c.R + 5.8; // the ring's radius at the back, where the region's edge may be near (the court's tallest pipes stand there); at the gate it is the wall's
  const ring = (th: number): number => back + (G - 2 - back) * near(th);
  const pipe = (a: number, cc: number, tall: number, k: number, s: number): void => {
    const plinth = k % 2 === 0 ? 2.3 : 0;
    if (plinth) c.add('tp_col_base', a, cc, { ...BLACK, s: 1.9, stretch: [1, 0.5, 1] });
    c.add('dp_pipe_4', a, cc, { ...BLACK, s, y: plinth, height: tall - plinth - 3, round: true });
    c.add('dp_pipe_open', a, cc, { ...BLACK, s, y: tall - 3, height: 3, round: true, walk: true });
    if (k % 2 === 1) for (const f of [0.42, 0.78]) c.add('px_collar', a, cc, { ...BONE, s: s * 0.88, y: plinth + (tall - plinth) * f, walk: true });
    if (k % 3 === 0) {
      const d = Math.hypot(a, cc);
      const r = 0.87 * s + 0.04;
      c.add('px_mouth', a - (a / d) * r, cc - (cc / d) * r, { ...BONE, face: 'in', s: s * 0.8, y: plinth + 2.4, walk: true });
    }
  };

  // the ring of pipes from either side of the gate round to the back, graded in height: their bearings at equal steps along the ring's own arc, the last of them the back's, which the two sides share
  const th0 = (gate + 3.2 + STEP) / (G - 2);
  const bearings: number[] = [];
  {
    const N = 720;
    const [pts, len] = [[th0], [0]];
    for (let i = 1; i <= N; i++) {
      const [t0, t1] = [th0 + ((Math.PI - th0) * (i - 1)) / N, th0 + ((Math.PI - th0) * i) / N];
      pts.push(t1);
      len.push(len[i - 1]! + Math.hypot(ring(t0) * Math.cos(t0) - ring(t1) * Math.cos(t1), ring(t0) * Math.sin(t0) - ring(t1) * Math.sin(t1)));
    }
    const n = Math.ceil(len[N]! / STEP);
    for (let i = 0, j = 0; i <= n; i++) {
      while (j < N && len[j + 1]! < (len[N]! * i) / n) j++;
      const f = j >= N ? 0 : ((len[N]! * i) / n - len[j]!) / (len[j + 1]! - len[j]!);
      bearings.push(j >= N ? Math.PI : pts[j]! + (pts[j + 1]! - pts[j]!) * f);
    }
  }
  let k = 0;
  for (const side of [-1, 1]) {
    bearings.forEach((th, i) => {
      if (side > 0 && i === bearings.length - 1) return; // (the back's is one pipe)
      const r = ring(th);
      const tall = 9 + 21 * (th / Math.PI) ** 1.2 + ((k * 7) % 3) * 0.8;
      pipe(Math.cos(th) * r, side * Math.sin(th) * r, tall, k++, S);
      const mid = i + 1 < bearings.length ? (th + bearings[i + 1]!) / 2 : th;
      if (k % 6 === 3 && i + 1 < bearings.length) c.add('bn_ribcage', Math.cos(mid) * (ring(mid) + 0.6), side * Math.sin(mid) * (ring(mid) + 0.6), { ...BONE, s: 4.6, y: tall * 0.55, face: 'in', turn: 90, walk: true });
    });
  }
  // the gate's two great pipes
  for (const side of [-1, 1]) pipe(G - 0.6, side * (gate + 3.2), 15, 1, 3.4);

  // notes from the open tops of a few, and a slow mote over the tiles
  for (let i = 0; i < 7; i++) {
    const th = (i + 0.5) * (Math.PI * 2 / 7) + 0.2;
    if (bearing(th) < 0.4) continue;
    const tall = 9 + 21 * (bearing(th) / Math.PI) ** 1.2;
    c.emit({ at: [Math.cos(th) * ring(th), Math.sin(th) * ring(th)], y: [tall, tall + 1], r: 1.6, rate: 1.6, life: [4, 7], size: [0.4, 0.6], colour: [0.75, 0.6, 1], alpha: 0.85, rise: 0.8, drift: 0.4, shape: 'note', glow: true, reach: 120 });
  }
  c.emit({ at: [0, 0], y: [0.4, 6], r: c.R + 8, rate: 3, life: [5, 8], size: [0.12, 0.2], colour: [0.7, 0.6, 1], alpha: 0.6, drift: 0.4, shape: 'spark', glow: true, reach: 110 });
  return { outline: polar((th) => ring(th) + 2 * near(th), 40), ahead: G, outer: 12, fogHeight: 4 };
};
