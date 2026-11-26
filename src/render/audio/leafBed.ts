/**
 * Round 125, the leaves heard: where trees, conifers and bushes stand about the investigator, their leaves rustle in the bed, softly on a
 * calm night and swelling as a gust front comes through them (the very gust the boughs are bent by: render/windField.ts), with the deeper
 * rush of whole boughs in the strongest gusts and in a gale; nothing under a roof, nothing where nothing grows. Made in code of noise, in
 * two voices: the chatter of the leaves (a high band, flickered by two fast tremolos, so it crackles rather than hisses) and the boughs'
 * rush (a low band). In the bed, so the ambience setting and a horror's hush take it.
 */

import { LEAF_SOUND as L } from '../../data/windTuning';
import { chunkContent } from '../../world/chunks';
import { chunkOf } from '../../world/worldMap';
import { gustAt } from '../windField';
import type { AudioEngine } from './engine';

export interface LeafBed {
  /** Each frame: the listener at (x, z), the time, the wind's strength (worldUniforms.uWind) and whether a roof is over them. */
  set(x: number, z: number, time: number, wind: number, inside: boolean): void;
}

/** What rustles about (x, z), 0..1: the trees, conifers and bushes within reach, the nearer the more. */
export function leafCover(x: number, z: number): number {
  let sum = 0;
  const [cx, cz] = [chunkOf(x), chunkOf(z)];
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      for (const p of chunkContent(cx + i, cz + j).props) {
        const w = p.kind === 'tree' ? 1 : p.kind === 'pine' ? 0.7 : p.kind === 'bush' ? 0.3 : 0;
        if (!w) continue;
        const d = Math.hypot(p.x - x, p.z - z);
        if (d < L.reach) sum += w * (1 - d / L.reach) ** 2;
      }
    }
  }
  return Math.min(1, sum / L.full);
}

/** The two voices' levels (0..1) for a place's cover, the gust on it and the wind's strength. */
export function leafLevels(cover: number, gust: number, wind: number, inside: boolean): { rustle: number; boughs: number } {
  if (inside || cover <= 0) return { rustle: 0, boughs: 0 };
  const blow = Math.min(1.6, Math.max(0.45, wind / 1.2));
  return { rustle: cover * (L.calm + (1 - L.calm) * gust) * blow, boughs: cover * gust * gust * Math.min(1.4, Math.max(0.2, (wind - 0.6) / 1.5)) };
}

export function createLeafBed(e: AudioEngine): LeafBed {
  let apply: ((rustle: number, boughs: number) => void) | null = null;
  let [cover, measured] = [0, -1];
  e.onStart((ctx) => {
    const out = e.bed;
    if (!out) return;
    const buf = ctx.createBuffer(2, ctx.sampleRate * 2, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const voice = (hz: number, q: number, high: number): [GainNode, GainNode] => {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.start(0, Math.random() * 1.8);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = high;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = hz;
      bp.Q.value = q;
      const flicker = ctx.createGain();
      const level = ctx.createGain();
      level.gain.value = 0;
      src.connect(hp).connect(bp).connect(flicker).connect(level).connect(out);
      return [flicker, level];
    };
    const [chatter, rustle] = voice(L.rustleHz, 0.7, 1400);
    chatter.gain.value = 0.62;
    for (const [hz, depth] of L.flicker) { // the tremolos that make a hiss a crackle of leaves
      const o = ctx.createOscillator();
      const d = ctx.createGain();
      o.frequency.value = hz;
      d.gain.value = depth;
      o.connect(d).connect(chatter.gain);
      o.start();
    }
    const [, boughs] = voice(L.boughHz, 0.9, 300);
    apply = (r, b) => {
      const t = ctx.currentTime;
      rustle.gain.setTargetAtTime(r * L.rustleGain, t, 0.35);
      boughs.gain.setTargetAtTime(b * L.boughGain, t, 0.6);
    };
  });
  return {
    set(x, z, time, wind, inside) {
      if (!apply) return;
      if (measured < 0 || time - measured > L.every || time < measured) [cover, measured] = [leafCover(x, z), time];
      const l = leafLevels(cover, gustAt(time, x, z), wind, inside);
      apply(l.rustle, l.boughs);
    },
  };
}
