/**
 * The mind's ears (round 80, atmosphere): what a failing mind hears that nobody else does, besides the whispers (gameAudio.ts) and the
 * steps behind (follower.ts). The ringing (a thin high pair of sines a few Hz apart, creeping in as the stress passes the Uneasy line and
 * rising a little with it; a heavy blow taken rings the ears a moment more), and the lantern at the hip (render/lanternLife.ts: its dips as
 * it gutters out are each a spit, its going out a hiss, its catching again a soft whump). The numbers and the recipes are
 * data/mindSounds.ts, every one hard-capped and a good way under a whisper; they follow `fx.stress` (so the Accessibility cap scales them)
 * and are silent in a menu and a cutscene. Read-only on the simulation, writes only the sound.
 */

import { MIND_EARS, MIND_SOUNDS } from '../../data/mindSounds';
import type { Game } from '../../systems/components';
import { lanternGain } from '../lanternLife';
import type { AtmAudioContext } from './atmosphereAudio';

const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** The ringing's level (a share of full scale, at its peak) for a mind at `stress`: nothing until the Uneasy line, creeping up to the ceiling at the end of madness. */
export const ringLevel = (stress: number): number => MIND_EARS.ring.ceiling * smooth(MIND_EARS.ring.from, 1, stress);

/** What a blow of `share` (of the investigator's greatest health) adds to the ringing for a moment, at `stress`: nothing for a scratch, nothing in a steady mind. */
export const ringStrike = (share: number, stress: number): number => MIND_EARS.ring.struck.add * smooth(MIND_EARS.ring.struck.from, MIND_EARS.ring.struck.full, share) * smooth(MIND_EARS.ring.from, MIND_EARS.ring.from + 0.3, stress);

/** The ring a blow left, `since` seconds after it: a quick swell and a long fall. */
export const ringAfter = (add: number, since: number): number => (since < 0 ? 0 : add * Math.min(1, since / MIND_EARS.ring.struck.attack) * Math.exp(-since / (MIND_EARS.ring.struck.decay / 3)));

export type LanternCue = 'spit' | 'out' | 'catch';
export interface LanternEar { armed: boolean; dark: boolean }

/** The flame of `gain` (0..1) heard against what it was: a dip from well lit to low is a spit (once for each, as the stutter's own dips are counted in tests/lanternLife.test.ts), the last of it going is its dying, a dark one that comes up again is its catching. */
export function lanternStep(s: LanternEar, gain: number): LanternCue | null {
  const L = MIND_EARS.lantern;
  if (s.dark) {
    if (gain < L.catches) return null;
    [s.dark, s.armed] = [false, gain >= L.high];
    return 'catch';
  }
  if (gain <= L.out) {
    [s.dark, s.armed] = [true, false];
    return 'out';
  }
  if (gain >= L.high) s.armed = true;
  else if (gain <= L.low && s.armed) {
    s.armed = false;
    return 'spit';
  }
  return null;
}

const HURT: ReadonlySet<string> = new Set(['hit', 'stagger', 'guardBreak', 'riposte', 'interrupted']);

/** The ringing: made when it is first wanted (two sines into the bed, one path slow and one quick), then asked its level each frame. */
function createRinging(ctx: AtmAudioContext): (stress: number, quiet: boolean) => void {
  const { e, g } = ctx;
  const R = MIND_EARS.ring;
  let paths: { base: GainNode; strike: GainNode } | null = null;
  let [struck, struckAt, stressNow, lastBase, lastStrike, tried] = [0, -1e9, 0, -1, -1, false];
  g.events.on('Hit', (ev) => {
    if (ev.target !== g.player.id || ev.lingering || !HURT.has(ev.outcome)) return;
    const [now, add] = [g.frame / 60, ringStrike(ev.damage / (g.ecs.c.health.get(g.player.id)?.max ?? 100), stressNow)];
    if (add > 0 && now - struckAt > R.struck.gap) [struck, struckAt] = [add, now];
  });
  const build = (audio: AudioContext, bed: AudioNode): { base: GainNode; strike: GainNode } => {
    const [base, strike, sum] = [audio.createGain(), audio.createGain(), audio.createGain()];
    base.gain.value = strike.gain.value = 0;
    for (const [hz, share] of [[R.hz, R.mix[0]], [R.hz + R.beat, R.mix[1]]] as const) {
      const [osc, level] = [audio.createOscillator(), audio.createGain()];
      osc.frequency.value = hz;
      level.gain.value = share;
      osc.connect(level).connect(sum);
      osc.start();
    }
    sum.connect(base).connect(bed);
    sum.connect(strike).connect(bed);
    return { base, strike };
  };
  return (stress, quiet) => {
    stressNow = stress;
    const [audio, bed] = [e.ctx, e.bed];
    if (!audio || !bed) return;
    const want = quiet ? 0 : ringLevel(stress);
    if (!paths) {
      if (want <= 0 || tried) return;
      tried = true;
      paths = build(audio, bed);
    }
    const struckNow = quiet ? 0 : ringAfter(struck, g.frame / 60 - struckAt);
    if (Math.abs(want - lastBase) > 1e-5) {
      paths.base.gain.setTargetAtTime(want, audio.currentTime, want > lastBase ? R.rise : R.fall);
      lastBase = want;
    }
    if (Math.abs(struckNow - lastStrike) > 2e-5) {
      paths.strike.gain.setTargetAtTime(struckNow, audio.currentTime, 0.05);
      lastStrike = struckNow;
    }
  };
}

/** The lantern at the hip: its dips, its dying and its catching heard, in the head, a little to the left where it hangs. */
function createLanternEars(ctx: AtmAudioContext): (quiet: boolean) => void {
  const L = MIND_EARS.lantern;
  const g: Game = ctx.g;
  const ear: LanternEar = { armed: true, dark: lanternGain(g) <= L.out };
  return (quiet) => {
    const cue = lanternStep(ear, lanternGain(g));
    if (!cue || quiet) return;
    if (cue === 'spit') ctx.recipe('mind:lanternSpit', MIND_SOUNDS.lanternSpit, { gain: L.spit, pan: L.pan, vary: 0.7 });
    else if (cue === 'out') ctx.recipe('mind:lanternOut', MIND_SOUNDS.lanternOut, { gain: L.died, pan: L.pan, vary: 0.5 });
    else ctx.recipe('mind:lanternKindle', MIND_SOUNDS.lanternKindle, { gain: L.kindled, pan: L.pan, vary: 0.5 });
  };
}

export interface MindEars {
  /** Each frame: the ringing and the lantern; `quiet`: a menu, a cutscene. */
  update(stress: number, quiet: boolean): void;
}

export function createMindEars(ctx: AtmAudioContext): MindEars {
  const ring = createRinging(ctx);
  const lantern = createLanternEars(ctx);
  return {
    update(stress, quiet) {
      ring(stress, quiet);
      lantern(quiet);
    },
  };
}
