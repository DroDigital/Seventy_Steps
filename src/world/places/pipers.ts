/**
 * The organ of the daemon pipers (round 71; round 72: the pipes are 3D Vault's Wajia bone flute stood on end and darkened, its finger holes along the shaft, pack 15's bones, pack 08's plinths,
 * docs/BOSS_PLACES.md; round 75: rafts of reed pipes in the wall, drums, gallows of chimes, and the scale the organ plays): the court is walled by its own flutes, shafts of black bone set shoulder to shoulder in a ring, graded from the shortest either side of the gate to the
 * tallest at the back, each open at the top; every other one stands on a plinth of the old temple, and every fourth is a raft of pipes bound together. Ribs brace them where they lean together. Two great flutes keep the gate,
 * a raft either side of the way in and, beyond it, a gallows of bone chimes; four drums stand at the foot of the pipes where the court is widest, and ring when the notes pass. Now and then the organ plays its scale: a note runs up each
 * side from the gate, pipe to pipe, and the two meet at the tallest, at the back, in a chord. Notes rise from the open tops, thin and purple, and the court's dark tiles hold a slow mote. The fog is held low so the pipes show over it. Pure: no Three.js.
 */

import type { V3 } from '../../core/geom';
import { HOUSE, type House } from '../../data/arenaHouses';
import type { PlaceFn } from '../enclosurePlace';
import type { Court, Put } from '../placeKit';
import { bearing, polar, sky } from './common';

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
    if (k % 4 === 3) { // a raft of pipes in the wall, bound, in the place of a flute: as broad as one, as tall as the grade says
      c.add('px_panpipe', a, cc, { ...BONE, s: 1.5, height: tall, keep: 0.6, face: 'in' });
      return;
    }
    const whole = tall >= 24; // the taller shafts are the whole flute stood on end, the shorter its flared foot and the first of its holes, at the same scale
    if (k % 3 === 1) c.add('px_collar', a, cc, { ...BONE, s: s * 0.7, y: plinth + (tall - plinth) * 0.32, walk: true }); // (the foot of the flute is the wider: a ring of bone about it)
    c.add(whole ? 'wf_flute' : 'wf_flute_low', a, cc, { ...BLACK, s: (s / 3) * (whole ? 2.64 : 2.9) * (1 + ((k * 5) % 3) * 0.03), y: plinth, height: tall - plinth, round: true, turn: (k % 2) * 180 });
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
  const scale: V3[][] = [[], []]; // the tops of the pipes, from the gate to the back, on each side: the notes of the scale
  for (const side of [-1, 1]) {
    bearings.forEach((th, i) => {
      if (side > 0 && i === bearings.length - 1) return; // (the back's is one pipe)
      const r = ring(th);
      const tall = 9 + 21 * (th / Math.PI) ** 1.2 + ((k * 7) % 3) * 0.8;
      pipe(Math.cos(th) * r, side * Math.sin(th) * r, tall, k++, S);
      scale[side > 0 ? 1 : 0]!.push(sky(c, Math.cos(th) * r, side * Math.sin(th) * r, tall + 0.6));
      const mid = i + 1 < bearings.length ? (th + bearings[i + 1]!) / 2 : th;
      if (k % 6 === 3 && i + 1 < bearings.length) c.add('bn_ribcage', Math.cos(mid) * (ring(mid) + 0.6), side * Math.sin(mid) * (ring(mid) + 0.6), { ...BONE, s: 4.6, y: tall * 0.55, face: 'in', turn: 90, walk: true });
    });
  }
  scale[1]!.push(scale[0]![scale[0]!.length - 1]!); // (the right-hand scale ends where the left's does: the one tallest pipe)
  // the gate's two great pipes, a raft of reeds before each, the gallows of chimes outside, and the drums at the foot of the pipes where the court is widest
  for (const side of [-1, 1]) {
    pipe(G - 0.6, side * (gate + 3.2), 15, 1, 3.4);
    c.add('bn_pile_skull', G - 4, side * (gate + 1.4), { ...BONE, s: 1.5, jitter: 0.3, walk: true });
    c.add('px_panpipe', G - 12, side * 10, { ...BONE, s: 1.3, keep: 0.6, face: 'front', turn: side * 20 });
    c.add('px_chimes', G + 9, side * (gate + 8), { ...BLACK, s: 1.2, face: 'front', keep: 0.5 });
  }
  const drums: [number, number][] = [];
  for (const side of [-1, 1]) {
    for (const th of [0.45, 0.72]) {
      const [a, cc] = [Math.cos(th) * (c.R + 5.4), side * Math.sin(th) * (c.R + 5.4)];
      c.add('px_drum', a, cc, { tint: [0.34, 0.26, 0.22], keep: 0.6, s: 0.8, face: 'in' });
      drums.push([a, cc]);
    }
  }
  for (const [a, cc] of drums) c.emit({ at: [a, cc], y: [2.4, 2.8], r: 0.5, rate: 0.5, life: [1.4, 2], size: [0.9, 1.3], grow: 3, colour: [0.75, 0.6, 1], alpha: 0.5, shape: 'ring', glow: true, reach: 100 });

  // notes from the open tops of a few, and a slow mote over the tiles
  for (let i = 0; i < 7; i++) {
    const th = (i + 0.5) * (Math.PI * 2 / 7) + 0.2;
    if (bearing(th) < 0.4) continue;
    const tall = 9 + 21 * (bearing(th) / Math.PI) ** 1.2;
    c.emit({ at: [Math.cos(th) * ring(th), Math.sin(th) * ring(th)], y: [tall, tall + 1], r: 1.6, rate: 1.6, life: [4, 7], size: [0.4, 0.6], colour: [0.75, 0.6, 1], alpha: 0.85, rise: 0.8, drift: 0.4, shape: 'note', glow: true, reach: 120 });
  }
  c.emit({ at: [0, 0], y: [0.4, 6], r: c.R + 8, rate: 3, life: [5, 8], size: [0.12, 0.2], colour: [0.7, 0.6, 1], alpha: 0.6, drift: 0.4, shape: 'spark', glow: true, reach: 110 });

  // the scale: a note from the foot of each side's pipes to its top, and a chord of both at the back
  const note = { shape: 'note', count: 2, size: [0.5, 0.75], life: [1.6, 2.6], colour: [0.75, 0.6, 1], alpha: 0.9, rise: 0.9, spread: 0.7, glow: true } as const;
  const chord = { ...note, count: 18, size: [0.6, 1] as const, life: [2.2, 3.4] as const, rise: 1.6, spread: 3.4, at: scale[0]![scale[0]!.length - 1]! };
  const signals = [-1, 1].map((side, i) => ({ kind: 'chase' as const, at: scale[i]!, every: [11, 16] as const, step: 0.2, thread: [0.7, 0.5, 1] as const, core: [1, 0.95, 1] as const, width: 0.2, puff: note, ...(side > 0 && { last: chord }) }));
  return { outline: polar((th) => ring(th) + 2 * near(th), 40), ahead: G, outer: 12, signals, fogHeight: 4 };
};
