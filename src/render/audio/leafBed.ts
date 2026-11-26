/**
 * The trees heard (round 125; recorded in round 126, docs/SOUND.md). Round 125 made the leaves of noise: a high band flickered by fast
 * tremolos, which crackled like static beside every tree and doubled the region's own leaves. Now three CC0 field recordings, cut by
 * tools/foliage_sounds.py: a broadleaf crown's rustle (`canopy`), pines soughing (`pines`) and a gale's gusts heaving whole boughs
 * (`boughs`). What stands within reach is counted every half second, broadleaf and conifer apart, so a wood of firs sighs and an oak wood
 * rustles; the beds swell as a gust front comes through the crowns (the very gust the boughs are bent by: render/windField.ts), quickly in
 * and slowly out; a thin, far stand is dull, the midst of a wood bright; the beds lean to the side the trees stand on; rain drowns half of
 * them; under a roof and out of the world nothing. Now and then, in a gust, a trunk near by groans, placed where it stands (`onCreak`).
 * Each bed is read twice, apart in time and pan and a hair apart in speed, so no stretch of it is heard twice alike. In the bed, so the
 * ambience setting and a horror's hush take it.
 */

import { LEAF_SOUND as L } from '../../data/windTuning';
import { chunkContent } from '../../world/chunks';
import { chunkOf } from '../../world/worldMap';
import { gustAt } from '../windField';
import type { AudioEngine } from './engine';
import type { Sampler } from './sampler';

type Bed = keyof typeof L.beds;
const BEDS = Object.keys(L.beds) as Bed[];

export interface LeafBed {
  /** Each frame: the listener at (x, z), the time, the wind's strength (worldUniforms.uWind), the rain (0..1) and whether a roof is over them. */
  set(x: number, z: number, time: number, wind: number, rain: number, inside: boolean): void;
}

export interface Stand {
  broad: number; // the broadleaf trees and bushes about the listener, 0..1
  conifer: number; // the conifers
  side: [number, number]; // which way the stand lies from the listener (x, z), its length the share of it that is to one side
  trunks: { x: number; z: number }[]; // the trees near enough to be heard creak
}

/** What stands about (x, z): the trees, conifers and bushes within reach, the nearer the more. */
export function standAt(x: number, z: number): Stand {
  let [broad, conifer, sx, sz, sum] = [0, 0, 0, 0, 0];
  const trunks: Stand['trunks'] = [];
  const [cx, cz] = [chunkOf(x), chunkOf(z)];
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      for (const p of chunkContent(cx + i, cz + j).props) {
        const w = p.kind === 'tree' ? 1 : p.kind === 'pine' ? 0.8 : p.kind === 'bush' ? 0.25 : 0;
        if (!w) continue;
        const d = Math.hypot(p.x - x, p.z - z);
        if (d >= L.reach) continue;
        const k = w * (1 - d / L.reach) ** 2;
        if (p.kind === 'pine') conifer += k;
        else broad += k;
        if (d > 0.5) [sx, sz] = [sx + (k * (p.x - x)) / d, sz + (k * (p.z - z)) / d];
        sum += k;
        if (p.kind !== 'bush' && d >= L.creak.near[0] && d <= L.creak.near[1] && trunks.length < 12) trunks.push({ x: p.x, z: p.z });
      }
    }
  }
  const side: [number, number] = sum > 0 ? [sx / sum, sz / sum] : [0, 0];
  return { broad: Math.min(1, broad / L.full), conifer: Math.min(1, conifer / L.full), side, trunks };
}

/** How hard it rains (0..1) in a spell of weather, for the leaves it drowns. */
export const rainOf = (w: { kind: string; amount: number } | undefined): number => (w && (w.kind === 'rain' || w.kind === 'storm') ? w.amount : 0);

export interface LeafLevels {
  canopy: number; // the beds' levels, 0..1 of their gain
  pines: number;
  boughs: number;
  lowpass: number; // Hz
}

const SILENT: LeafLevels = { canopy: 0, pines: 0, boughs: 0, lowpass: L.dull[0] };

/** The beds' levels for a stand, the gust on it, the wind's strength and the rain. */
export function leafLevels(s: Pick<Stand, 'broad' | 'conifer'>, gust: number, wind: number, rain: number, inside: boolean): LeafLevels {
  const all = Math.min(1, s.broad + s.conifer);
  if (inside || all <= 0) return SILENT;
  const g = Math.min(1, Math.max(0, gust));
  const blow = Math.min(1.5, Math.max(0.45, wind / 1.2));
  const wet = 1 - L.rain * Math.min(1, Math.max(0, rain));
  const swell = (L.calm + (1 - L.calm) * g) * blow * wet;
  return {
    canopy: s.broad * swell,
    pines: s.conifer * swell,
    boughs: all * g ** 1.5 * Math.min(1.4, Math.max(0.12, (wind - 0.5) / 1.3)) * wet,
    lowpass: L.dull[0] + (L.dull[1] - L.dull[0]) * Math.min(1, all * 1.3) * (0.65 + 0.35 * g),
  };
}

/** Whether a trunk groans this frame (`dt` s), `since` s after the last: oftener in a gust and a thick stand, never too soon. */
export function creaks(trees: number, gust: number, wind: number, since: number, dt: number, rand: number): boolean {
  if (since < L.creak.gap || trees < L.creak.least || wind < 0.5) return false;
  return rand < (dt / L.creak.every) * trees * (0.25 + 1.75 * gust * gust);
}

export function createLeafBed(e: AudioEngine, sampler: Sampler, right: { x: number; z: number }, onCreak: (x: number, z: number, gain: number) => void): LeafBed {
  let apply: ((l: LeafLevels, lean: number) => void) | null = null;
  let stand: Stand = { broad: 0, conifer: 0, side: [0, 0], trunks: [] };
  let [measured, lastTime, lastCreak, asked] = [-1, -1, -Infinity, false];
  e.onStart((ctx) => {
    const out = e.bed;
    if (!out) return;
    const dull = ctx.createBiquadFilter();
    dull.type = 'lowpass';
    dull.frequency.value = L.dull[0];
    dull.Q.value = 0.5;
    const [left, rightBus] = [ctx.createGain(), ctx.createGain()]; // the lean: the two sides' readers
    for (const [g, side] of [[left, -1], [rightBus, 1]] as const) {
      const pan = ctx.createStereoPanner();
      pan.pan.value = side * L.spread;
      g.connect(pan).connect(dull);
    }
    dull.connect(out);
    const level = Object.fromEntries(BEDS.map((b) => [b, [] as GainNode[]])) as Record<Bed, GainNode[]>; // each bed's level, one gain for each of its readers
    const started = new Set<Bed>();
    const start = (b: Bed): void => {
      const buf = sampler.buffer(L.beds[b]);
      if (started.has(b) || !buf || buf.duration < 4) return;
      started.add(b);
      for (const [bus, at, rate] of [[left, 0.06, 0.985 + Math.random() * 0.01], [rightBus, buf.duration * (0.4 + Math.random() * 0.2), 1.005 + Math.random() * 0.01]] as const) {
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        [src.loopStart, src.loopEnd] = [0.06, buf.duration - 0.06]; // (an MP3's padding at each end)
        src.playbackRate.value = rate;
        const g = ctx.createGain();
        g.gain.value = 0;
        level[b].push(g);
        src.connect(g).connect(bus);
        src.start(0, at);
      }
    };
    const held: Record<Bed, number> = { canopy: 0, pines: 0, boughs: 0 };
    apply = (l, lean) => {
      const t = ctx.currentTime;
      for (const b of BEDS) {
        start(b);
        const v = l[b] * L.gain[b];
        for (const g of level[b]) g.gain.setTargetAtTime(v * Math.SQRT1_2, t, v > held[b] ? L.rise : L.fall);
        held[b] = v;
      }
      left.gain.setTargetAtTime(1 - L.lean * lean, t, 1.5);
      rightBus.gain.setTargetAtTime(1 + L.lean * lean, t, 1.5);
      dull.frequency.setTargetAtTime(l.lowpass, t, 1.5);
    };
  });
  return {
    set(x, z, time, wind, rain, inside) {
      if (!apply) return;
      if (measured < 0 || time - measured > L.every || time < measured) [stand, measured] = [standAt(x, z), time];
      const all = stand.broad + stand.conifer;
      if (!asked && all > 0) { // the recordings are fetched where trees are first met
        asked = true;
        void sampler.load(Object.values(L.beds));
      }
      const gust = gustAt(time, x, z);
      const lean = stand.side[0] * right.x + stand.side[1] * right.z; // + : the trees stand to the listener's right
      apply(leafLevels(stand, gust, wind, rain, inside), Math.max(-1, Math.min(1, lean)));
      const dt = lastTime < 0 || time < lastTime ? 0 : Math.min(0.25, time - lastTime);
      lastTime = time;
      if (time < lastCreak) lastCreak = -Infinity;
      if (!inside && stand.trunks.length && creaks(all, gust, wind, time - lastCreak, dt, Math.random())) {
        lastCreak = time;
        const tr = stand.trunks[Math.floor(Math.random() * stand.trunks.length)];
        onCreak(tr.x, tr.z, (0.55 + 0.45 * gust) * (1 - 0.4 * Math.min(1, rain)));
      }
    },
  };
}
