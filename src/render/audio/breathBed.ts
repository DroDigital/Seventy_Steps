/**
 * The Sleeper's breath, heard (round 78, atmosphere): beneath everything, near a colossus that has not yet woken, the dream breathes. Two
 * low sines and a triangle's harmonic (for the speakers that do not reach the bottom) swell with the breath, and a rush of low air is
 * drawn in as it fills and let go as it empties; the larger the sleeper the slower and the lower it is, the nearer the ring the louder
 * (to -19 dBFS at the most, on the effects bus: not the bed, which the hush that this same nearness brings would take away). Made when it
 * is first wanted and let go after a while without a sleeper. The picture's half is render/sleeperBreath.ts; the waveform they keep to is
 * render/sleepers.ts. The numbers are data/sleeperBreath.ts. Read-only on the simulation, writes only the sound.
 */

import { BREATH } from '../../data/sleeperBreath';
import { breathAt, breathPeriod, drawing, type Sleeper } from '../sleepers';
import type { AudioEngine } from './engine';
import { noiseSource } from './synth';

export interface BreathTargets {
  /** The whole bed's level (a share of full scale on the effects bus): reach x breath x peak. */
  master: number;
  /** The noise's against it: whole as the breath is drawn in, a third as it lets go. */
  rush: number;
  /** The three pitches, Hz: lower the taller the sleeper. */
  hz: readonly [number, number, number];
}

/** What the bed asks for at `seconds`, for a sleeper with `reach` of the world (0..1) and `height` metres tall: pure. */
export function breathTargets(seconds: number, reach: number, height: number): BreathTargets {
  const period = breathPeriod(height);
  const drop = 1 - BREATH.bed.drop * Math.min(1, Math.max(0, (height - BREATH.minHeight) / (BREATH.bed.span - BREATH.minHeight)));
  const [a, b, c] = BREATH.bed.hz;
  return { master: BREATH.bed.peak * reach * breathAt(seconds, period), rush: drawing(seconds, period) ? 1 : 0.33, hz: [a * drop, b * drop, c * drop] };
}

export interface BreathBed {
  /** Each frame: the sleeper that has the world (null: none), and whether to be silent (a menu, a cutscene). */
  update(seconds: number, sleeper: Sleeper | null, quiet: boolean): void;
}

interface Graph {
  master: GainNode;
  rush: GainNode;
  oscs: OscillatorNode[];
  noise: AudioBufferSourceNode;
}

export function createBreathBed(e: AudioEngine): BreathBed {
  let [graph, idle, last, height, reach, set]: [Graph | null, number, number, number, number, number] = [null, 0, -1, 12, 0, -1];
  const B = BREATH.bed;
  const build = (ctx: AudioContext, bus: AudioNode): Graph => {
    const [master, rush] = [ctx.createGain(), ctx.createGain()];
    master.gain.value = rush.gain.value = 0;
    const oscs = (['sine', 'sine', 'triangle'] as const).map((type, i) => {
      const [osc, level] = [ctx.createOscillator(), ctx.createGain()];
      osc.type = type;
      osc.frequency.value = B.hz[i];
      level.gain.value = B.gain[i];
      osc.connect(level).connect(master);
      osc.start();
      return osc;
    });
    const [noise, lows] = [noiseSource(ctx), ctx.createBiquadFilter()];
    lows.type = 'lowpass';
    lows.frequency.value = B.noise.hz;
    lows.Q.value = B.noise.q;
    noise.connect(lows).connect(rush).connect(master);
    noise.start();
    master.connect(bus);
    return { master, rush, oscs, noise };
  };
  const dispose = (): void => {
    if (!graph) return;
    for (const s of [...graph.oscs, graph.noise]) s.stop();
    graph.master.disconnect();
    graph = null;
  };
  return {
    update(seconds, sleeper, quiet) {
      const [ctx, bus] = [e.ctx, e.sfx];
      if (!ctx || !bus) return;
      const dt = last < 0 ? 0 : Math.min(0.2, Math.max(0, seconds - last));
      last = seconds;
      if (sleeper) [height, reach] = [sleeper.height, sleeper.k];
      else reach = Math.max(0, reach - dt / BREATH.ease.down);
      const t = breathTargets(seconds, quiet ? 0 : reach, height);
      if (t.master < 1e-4 && !graph) return;
      idle = t.master < 1e-4 ? idle + dt : 0;
      if (idle > 20) return dispose(); // long without one: the graph is let go
      graph ??= build(ctx, bus);
      if (seconds - set < 0.12 && seconds >= set) return; // (the levels glide: asked a few times a second)
      set = seconds;
      const now = ctx.currentTime;
      graph.master.gain.setTargetAtTime(t.master, now, B.glide);
      graph.rush.gain.setTargetAtTime(t.rush * B.noise.gain, now, B.glide);
      graph.oscs.forEach((o, i) => {
        o.frequency.setTargetAtTime(t.hz[i], now, 0.5);
        o.detune.setTargetAtTime(e.detune, now, 0.3);
      });
    },
  };
}
