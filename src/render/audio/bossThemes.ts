/**
 * The boss themes (round 44; data/bossMusic.ts): while a fight is engaged, the recorded theme of its
 * track sounds on the scores' bus, on the realms' seamless loop (realmLoop.ts) begun at the theme's
 * entry. Which theme sounds is decided by track, not boss: while any engaged fight maps to the one
 * sounding it stays (a pair's partner falling restarts nothing), and going to another while a fight
 * goes on is a crossfade of BOSS_MUSIC.handover seconds. Each later phase lifts it a little (level,
 * highs); in the last it moves, at the next bar line and by a one-bar crossfade, to its hot stretch
 * and loops that. A horror's spoken line ducks it; the first arrival scene holds it low until the
 * scene ends, and it comes up from the next bar line. Its file is fetched and decoded when wanted (or
 * before, for the nearest horror unmet), two held at most; until it is ready, or if it fails, the
 * caller's procedural score plays (bossMusic.ts). Read-only on the simulation; silent without WebAudio.
 */

import { BOSS_MUSIC, bossFile, bossTrackOf, type BossTrackId } from '../../data/bossMusic';
import type { Region } from './loudness';
import { barLineAfter, comeIn, duckLevel, liftOf, planOf, sceneLevel, type BossPlan, type Scored } from './bossPlan';
import type { AudioEngine } from './engine';
import { createRealmLoop, type RealmLoop } from './realmLoop';
import { createTrackCache } from './trackCache';
import { FADE_IN, FADE_OUT } from './themeLoop';

export interface ThemeInput {
  fights: readonly Scored[]; // engaged, the first the one the procedural score would play
  warm: BossTrackId | null; // the theme of the nearest horror yet to be met, to have ready
  scene: boolean; // a cutscene has the screen
  replacing: boolean; // the procedural score is sounding: a theme that comes in takes over from it
}

export interface ThemeStatus {
  sounding: BossTrackId | null; // a theme is sounding (or held, a new one coming): the procedural score stands down
}

export interface BossThemes {
  update(input: ThemeInput): ThemeStatus;
  /** A horror's line is spoken for `seconds`: the theme goes low under it. */
  duck(seconds: number): void;
  readonly sounding: BossTrackId | null;
}

interface Loaded {
  buffer: AudioBuffer;
  plan: BossPlan;
}

interface Section {
  loop: RealmLoop;
  gain: GainNode; // faded in and out when the theme moves to another stretch
  endsAt: number; // audio time it may be let go
}

interface Theme {
  id: BossTrackId;
  t: Loaded;
  shelf: BiquadFilterNode;
  lift: GainNode;
  speak: GainNode;
  scene: GainNode;
  out: GainNode;
  section: Section;
  old: Section[]; // the stretches it has left
  hot: boolean;
  phase: number;
  held: boolean; // under the arrival scene
  ducked: boolean;
  endsAt: number; // audio time it may be let go (Infinity while it sounds)
}

const curved = (curve: Float32Array, top: number): Float32Array<ArrayBuffer> => curve.map((x) => x * top) as unknown as Float32Array<ArrayBuffer>;

export function createBossThemes(e: AudioEngine): BossThemes {
  const cache = createTrackCache<BossTrackId, Loaded>(e, { url: bossFile, make: (buffer, id) => ({ buffer, plan: planOf(id, buffer) }), keep: BOSS_MUSIC.keep, retry: BOSS_MUSIC.retry, label: 'boss music' });
  let current: Theme | null = null;
  const leaving = new Set<Theme>();
  let duckUntil = 0;

  const level = (g: AudioParam, ctx: AudioContext, dir: 'in' | 'out', top: number, seconds: number): void => {
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueCurveAtTime(curved(dir === 'in' ? FADE_IN : FADE_OUT, top), ctx.currentTime, seconds);
  };

  const section = (ctx: AudioContext, into: AudioNode, t: Loaded, region: Region, entry: number, at: number, fadeIn = 0, top = 1): Section => {
    const gain = ctx.createGain();
    gain.gain.value = fadeIn ? 0 : top;
    if (fadeIn) gain.gain.setValueCurveAtTime(curved(FADE_IN, top), at, fadeIn);
    gain.connect(into);
    const loop = createRealmLoop(ctx, gain, t.buffer, region, entry);
    loop.begin(at);
    return { loop, gain, endsAt: Infinity };
  };

  const stopSection = (s: Section): void => {
    s.loop.stop();
    s.gain.disconnect();
  };

  const release = (th: Theme): void => {
    for (const s of [th.section, ...th.old]) stopSection(s);
    for (const n of [th.shelf, th.lift, th.speak, th.scene, th.out]) n.disconnect();
  };

  /** The theme goes out over `seconds`, and is let go after. */
  const end = (ctx: AudioContext, th: Theme, seconds: number): void => {
    level(th.out.gain, ctx, 'out', th.out.gain.value, seconds);
    th.endsAt = ctx.currentTime + seconds + 0.1;
    leaving.add(th);
    if (current === th) current = null;
  };

  const start = (ctx: AudioContext, bus: AudioNode, id: BossTrackId, t: Loaded, input: ThemeInput): void => {
    const [at, p] = [ctx.currentTime + 0.05, t.plan];
    const [shelf, lift, speak, scene, out] = [ctx.createBiquadFilter(), ctx.createGain(), ctx.createGain(), ctx.createGain(), ctx.createGain()];
    shelf.type = 'highshelf';
    shelf.frequency.value = BOSS_MUSIC.lift.shelf;
    const phase = Math.max(0, ...input.fights.filter((f) => bossTrackOf(f.id) === id).map((f) => f.phase));
    const l = liftOf(phase);
    shelf.gain.value = l.bright;
    lift.gain.value = l.level;
    scene.gain.value = input.scene ? sceneLevel : 1;
    out.gain.value = 0;
    shelf.connect(lift).connect(speak).connect(scene).connect(out).connect(bus);
    const prev = current;
    const secs = prev ? BOSS_MUSIC.handover : comeIn(p, input.replacing);
    if (prev) end(ctx, prev, BOSS_MUSIC.handover);
    const th: Theme = { id, t, shelf, lift, speak, scene, out, section: section(ctx, shelf, t, p.loop, p.entry, at), old: [], hot: false, phase, held: input.scene, ducked: false, endsAt: Infinity };
    level(out.gain, ctx, 'in', p.gain * BOSS_MUSIC.level, secs);
    current = th;
    const hot = p.hot ? `${p.hot.start.toFixed(1)}-${p.hot.end.toFixed(1)} s` : 'none';
    console.info(`boss music: ${id} (entry ${p.entry.toFixed(1)} s, loop ${p.loop.start.toFixed(1)}-${p.loop.end.toFixed(1)} s, gain ${p.gain.toFixed(3)}, hot ${hot}${prev || input.replacing ? ', taking over' : ''})`);
  };

  /** The last phase: at the next bar line, a one-bar crossfade to the hot stretch, looped on its own ends. */
  const toHot = (ctx: AudioContext, th: Theme): void => {
    const { plan } = th.t;
    if (!plan.hot) return;
    th.hot = true;
    const at = barLineAfter((t) => th.section.loop.position(t), ctx.currentTime + 0.1, plan.bar, plan.grid);
    const len = BOSS_MUSIC.hotBars * plan.bar;
    const old = th.section;
    old.gain.gain.setValueCurveAtTime(FADE_OUT, at, len);
    old.endsAt = at + len + 0.1;
    th.old.push(old);
    th.section = section(ctx, th.shelf, th.t, plan.hot, plan.hot.start, at, len, plan.hotGain);
    console.info(`boss music: ${th.id} to its hot stretch at ${at.toFixed(2)} s (${plan.hot.start.toFixed(1)}-${plan.hot.end.toFixed(1)} s)`);
  };

  /** Phase lift, the move to the hot stretch, the arrival scene's hold and a spoken line's duck, for the theme that sounds. */
  const shape = (ctx: AudioContext, th: Theme, input: ThemeInput): void => {
    const now = ctx.currentTime;
    const mine = input.fights.filter((f) => bossTrackOf(f.id) === th.id);
    const phase = Math.max(0, ...mine.map((f) => f.phase));
    if (phase !== th.phase) {
      th.phase = phase;
      const l = liftOf(phase);
      th.lift.gain.setTargetAtTime(l.level, now, BOSS_MUSIC.lift.settle / 3);
      th.shelf.gain.setTargetAtTime(l.bright, now, BOSS_MUSIC.lift.settle / 3);
    }
    if (!th.hot && mine.some((f) => f.last)) toHot(ctx, th);
    if (input.scene !== th.held) {
      th.held = input.scene;
      const g = th.scene.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      if (th.held) g.setTargetAtTime(sceneLevel, now, 0.25);
      else g.setTargetAtTime(1, barLineAfter((t) => th.section.loop.position(t), now + 0.1, th.t.plan.bar, th.t.plan.grid), BOSS_MUSIC.scene.rise / 3); // the first full bar lands as the scene ends
    }
    const ducked = now < duckUntil;
    if (ducked !== th.ducked) {
      th.ducked = ducked;
      th.speak.gain.cancelScheduledValues(now);
      th.speak.gain.setValueAtTime(th.speak.gain.value, now);
      th.speak.gain.setTargetAtTime(ducked ? duckLevel : 1, now, ducked ? BOSS_MUSIC.duck.attack : BOSS_MUSIC.duck.release / 3);
    }
    th.section.loop.tick();
  };

  return {
    get sounding() {
      return current && current.endsAt === Infinity ? current.id : null;
    },
    duck(seconds) {
      duckUntil = Math.max(duckUntil, (e.ctx?.currentTime ?? 0) + seconds + 0.2);
    },
    update(input) {
      const [ctx, bus] = [e.ctx, e.score];
      if (!ctx || !bus || ctx.state !== 'running') return { sounding: null };
      const now = ctx.currentTime;
      cache.tick(now);
      for (const th of leaving) {
        if (now >= th.endsAt) {
          release(th);
          leaving.delete(th);
        }
      }
      if (current) {
        for (const s of current.old) if (now >= s.endsAt) stopSection(s);
        current.old = current.old.filter((s) => now < s.endsAt);
      }
      const tracks = input.fights.map((f) => bossTrackOf(f.id)).filter((t): t is BossTrackId => !!t);
      const want = current && tracks.includes(current.id) ? current.id : (tracks[0] ?? null);
      cache.trim([current?.id, want, input.warm]);
      if (!input.fights.length && input.warm) void cache.load(input.warm); // the nearest horror unmet: its theme ready before the fight
      if (!want) {
        if (current) end(ctx, current, BOSS_MUSIC.fadeOut);
        return { sounding: null };
      }
      if (current?.id !== want) {
        const t = cache.get(want);
        if (!t) {
          void cache.load(want);
          return { sounding: current ? current.id : null }; // not ready (or failed): what sounds goes on, else the procedural score plays
        }
        try {
          start(ctx, bus, want, t, input);
        } catch (err) {
          cache.fail(want); // the browser refused it: not asked for again every frame
          console.warn(`boss music: ${want} could not start`, err);
          return { sounding: current ? current.id : null };
        }
      }
      if (current) shape(ctx, current, input);
      return { sounding: current ? current.id : null };
    },
  };
}
