/**
 * The hearth (round 80): the small noise of the world's lights, placed. A pool of HEARTH.voices voices, each a looped texture of a
 * flame (audio/hearthTexture.ts; a Sign's hum is oscillators) through a low-pass, the flame's flicker, a level and a pan, into the
 * bed (so the ambience setting and a horror's hush govern it). The nearest lights in earshot take the voices (audio/hearthPlan.ts);
 * a voice follows its light, glides in and out, and is let go once it has faded, so none pops as another light takes its place.
 * Paused, the voices fade. Read-only on the simulation.
 */

import type { V3 } from '../../core/geom';
import { HEARTH, type HearthKind } from '../../data/lightSounds';
import type { AudioEngine } from './engine';
import { hearthPlan, type Voicing } from './hearthPlan';
import { flameTexture } from './hearthTexture';
import type { HeardLight } from './heardLights';
import { noiseSource } from './synth';

/** What the hearth is doing now, for the debug hooks (`await import('/src/render/audio/hearth.ts')`): the voices sounding, and the nearest light heard (its kind and its distance). */
export const HEARTH_NOW: { sounding: number; kind: string; d: number } = { sounding: 0, kind: '', d: Infinity };

export interface Hearth {
  /** Each frame: the lights in earshot, where the listener is, which way is right, `open` (0..1) for how clear each is to the ear, and `lamps` (0..1) for how far the street lamps are lit by the hour. */
  update(heard: readonly HeardLight[], listener: V3, right: V3, open: (h: HeardLight) => number, paused: boolean, lamps?: number): void;
}

interface Voice {
  key: number; // the light it follows (0: free)
  kind: HearthKind;
  lp: BiquadFilterNode;
  flick: GainNode;
  level: GainNode;
  pan: StereoPannerNode;
  sources: AudioScheduledSourceNode[];
  freeAt: number; // audio-clock seconds it may be taken again, once faded
  fading: boolean;
  sent: { level: number; cutoff: number; pan: number; flick: number };
}

const near = (a: number, b: number, tol: number): boolean => Math.abs(a - b) <= tol;

function holder(voices: readonly Voice[], key: number): Voice | null {
  for (const v of voices) if (v.key === key) return v;
  return null;
}

function idle(voices: readonly Voice[], now: number): Voice | null {
  for (const v of voices) if (!v.key && now >= v.freeAt) return v;
  return null;
}

export function createHearth(e: AudioEngine): Hearth {
  const voices: Voice[] = [];
  const textures = new Map<string, AudioBuffer>();

  function texture(ctx: AudioContext, kind: 'fire' | 'torch' | 'lamp'): AudioBuffer {
    let buf = textures.get(kind);
    if (!buf) {
      const { rate, seconds } = HEARTH.texture;
      buf = ctx.createBuffer(1, Math.round(rate * seconds), rate);
      buf.getChannelData(0).set(flameTexture(HEARTH.flames[kind], rate, seconds, HEARTH.level));
      textures.set(kind, buf);
    }
    return buf;
  }

  function make(ctx: AudioContext, out: AudioNode): Voice {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.5;
    lp.frequency.value = HEARTH.dull;
    const flick = ctx.createGain();
    const level = ctx.createGain();
    level.gain.value = 0;
    const pan = ctx.createStereoPanner();
    lp.connect(flick).connect(level).connect(pan).connect(out);
    return { key: 0, kind: 'torch', lp, flick, level, pan, sources: [], freeAt: 0, fading: false, sent: { level: 0, cutoff: HEARTH.dull, pan: 0, flick: 1 } };
  }

  /** Puts a light's sound into a free voice: a loop of its flame from anywhere in it, or a Sign's hum. */
  function start(ctx: AudioContext, v: Voice, p: Voicing): void {
    const now = ctx.currentTime;
    v.key = p.key;
    v.kind = p.kind;
    v.fading = false;
    v.sent = { level: 0, cutoff: p.cutoff, pan: p.pan, flick: p.flick };
    v.level.gain.cancelScheduledValues(now);
    v.level.gain.setValueAtTime(0, now);
    v.lp.frequency.setValueAtTime(p.cutoff, now);
    v.pan.pan.setValueAtTime(p.pan, now);
    v.flick.gain.setValueAtTime(p.flick, now);
    if (p.kind === 'sigil') {
      const { tones, air, airHz, mix } = HEARTH.sigil;
      for (const [hz, a] of tones) {
        const osc = ctx.createOscillator();
        osc.frequency.value = hz;
        const g = ctx.createGain();
        g.gain.value = a * mix;
        osc.connect(g).connect(v.lp);
        osc.start(now);
        v.sources.push(osc);
      }
      const breath = noiseSource(ctx);
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = airHz;
      band.Q.value = 0.8;
      const g = ctx.createGain();
      g.gain.value = air;
      breath.connect(band).connect(g).connect(v.lp);
      breath.start(now, Math.random() * 1.9);
      v.sources.push(breath);
    } else {
      const src = ctx.createBufferSource();
      src.buffer = texture(ctx, p.kind);
      src.loop = true;
      src.connect(v.lp);
      src.start(now, Math.random() * HEARTH.texture.seconds);
      v.sources.push(src);
    }
  }

  function release(v: Voice, now: number): void {
    for (const s of v.sources.splice(0)) {
      try {
        s.stop(now + 0.02);
      } catch {
        /* already stopped */
      }
    }
    v.key = 0;
    v.fading = false;
  }

  return {
    update(heard, listener, right, open, paused, lamps = 1) {
      const { ctx, bed } = e;
      if (!ctx || !bed) return;
      if (!voices.length) for (let i = 0; i < HEARTH.voices; i++) voices.push(make(ctx, bed));
      const now = ctx.currentTime;
      const plan = paused ? [] : hearthPlan(heard, listener, right, open, lamps);
      [HEARTH_NOW.kind, HEARTH_NOW.d] = !paused && heard[0] ? [heard[0].kind, heard[0].d] : ['', Infinity]; // (the list is nearest first)
      for (const v of voices) v.fading = v.key !== 0; // (told otherwise below for every light in the plan)
      for (const p of plan) {
        let v = holder(voices, p.key);
        if (!v) {
          v = idle(voices, now);
          if (!v) continue; // every voice is busy or still fading: the next frame
          start(ctx, v, p);
        }
        v.fading = false;
        v.freeAt = 0;
        const s = v.sent;
        if (!near(p.level, s.level, Math.max(0.0006, s.level * 0.03))) v.level.gain.setTargetAtTime((s.level = p.level), now, HEARTH.ease);
        if (!near(Math.log(p.cutoff), Math.log(s.cutoff), 0.03)) v.lp.frequency.setTargetAtTime((s.cutoff = p.cutoff), now, 0.15);
        if (!near(p.pan, s.pan, 0.01)) v.pan.pan.setTargetAtTime((s.pan = p.pan), now, 0.1);
        if (!near(p.flick, s.flick, 0.015)) v.flick.gain.setTargetAtTime((s.flick = p.flick), now, HEARTH.flick);
      }
      HEARTH_NOW.sounding = 0;
      for (const v of voices) {
        if (!v.key) continue;
        if (v.fading) {
          if (v.freeAt === 0) { // told to go: its level glides to nothing, then it is let go
            v.level.gain.setTargetAtTime(0, now, HEARTH.ease);
            v.sent.level = 0;
            v.freeAt = now + HEARTH.release;
          } else if (now >= v.freeAt) {
            release(v, now);
            continue;
          }
        }
        HEARTH_NOW.sounding++;
      }
    },
  };
}
