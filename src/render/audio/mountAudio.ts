/**
 * A ride heard (round 50). The rider's own foley, like footsteps: not placed in the world, or the camera would swallow it, and
 * presentation only: nothing here makes noise the simulation hears. Every hoofbeat is a foot that comes down in the gait the
 * picture shows (systems/mountGait.ts, counted by the simulation in `MountState.phase`), so a horse stopped against a wall stops
 * at once and the sound is the feet's; under the beats runs a bed that follows the speed and the ground (mountBed.ts), and over
 * them the harness, the timber's creak, the wheels' knocks, a snort at the gallop; the motor car has its engine instead of hooves.
 * Procedural (data/mountSounds.ts), except that the included horse's voice and harness are recordings (round 59: data/plannedSounds.ts,
 * found on Freesound as CC0), which stand alone in front of their recipes by key, and the recipes play where a file has not loaded.
 * Levels are against the impacts: tests/mountAudio.test.ts.
 */
import type { V3 } from '../../core/geom';
import { MOUNT_TRAVERSAL, type MountId } from '../../data/mounts';
import {
  CREAK, ENGINE_START, ENGINE_STOP, EXHAUST_POP, HARNESS_SHAKE, HORSE_BLOW, HORSE_HALT, HORSE_URGE, HORSE_WHICKER, LIP_FLUTTER, MOUNT_MIX, NICKER, REIN_SLAP, SNORT, SPECTRAL_DISMISS, SPECTRAL_SUMMON,
  SPECTRAL_WHISPER, TAIL_SWISH, TRACE_SHIFT, UNHITCH, hoofBeat, hoofScrape, wheelThump, type Ground,
} from '../../data/mountSounds';
import { SAMPLE_SETS, type SampleSetId } from '../../data/samples';
import { SIM } from '../../data/tuning';
import type { Sound } from '../../data/sounds';
import type { Game } from '../../systems/components';
import { HORSE_TOSS, pawLanded } from '../../systems/horseIdle';
import { gaitAt, gaitScale, hoofWeight, touchdowns } from '../../systems/mountGait';
import { surfaceAt } from './foley';
import { SILENT_BED, bedTargets, type MountBed } from './mountBed';
import type { Sampler } from './sampler';

type Recipe = (key: string, sound: Sound, o?: { at?: V3 | null; gain?: number; range?: number; pitch?: number; vary?: number; pan?: number }) => boolean;

const STEP_SET: Record<Ground, SampleSetId> = { dirt: 'stepDirt', road: 'stepRoad', stone: 'stepStone', water: 'stepWater' };
const THUMP_EVERY: Record<Ground, readonly [number, number]> = { dirt: [3.5, 6], road: [3, 5], stone: [2.2, 3.6], water: [99, 99] }; // metres between a wheel's thumps
const PAIR = 0.059; // the second spectral horse's gait, a share of a cycle behind the first (0.37 rad: render/mountCarriage.ts)
const GALLOP_SNORT = 14 * gaitScale; // m/s: set for a gallop of 18, kept in step with the mounts' (round 55: a gallop of 10.5 never reached 14)

const between = ([a, b]: readonly [number, number]): number => a + (b - a) * Math.random();
const around = (spread: number, middle = 1): number => middle - spread / 2 + spread * Math.random();

/** What a standing horse does to pass the time, and how often (weights): the skeletons' team only shakes its harness, its breath being the whisper's. */
const IDLE_NOISES = [['blow', 3], ['whicker', 2.5], ['shake', 2], ['snort', 2], ['swish', 1.5], ['flutter', 1]] as const;
type Idle = (typeof IDLE_NOISES)[number][0];

export interface MountAudio {
  /** Delta seconds between consecutive render frames; called only while the world advances. */
  update(dt: number, seconds?: number): void;
  /** Play has stopped (a menu, the title): the beds go quiet. */
  pause(): void;
}

export function createMountAudio(g: Game, play: Recipe, sampler?: Pick<Sampler, 'play'>, bed?: MountBed): MountAudio {
  /** Every sound of a ride goes through the one level (round 61), after the recordings' own clamp is made: a cut that is felt in the voice as well. */
  const recipe: Recipe = (key, sound, o = {}) => play(key, sound, { ...o, gain: (o.gain ?? 1) * MOUNT_MIX.level });
  let active: MountId | null = null;
  let last: V3 | null = null;
  let phase = 0;
  let ground: Ground = 'dirt';
  let frames = 0;
  let metres = 0;
  let thumpAt = 4;
  let creakIn = 2;
  let whisperIn = 3;
  let lastSpeed = 0;
  let snortIn = 6;
  let idleIn = 8;
  let galloping = false;
  let idleLast: Idle | null = null;
  let tossed = false; // the head went up after the last noise: the harness has spoken, and the next is not a shake
  let pawClock: number | null = null;
  const seen = { struck: 0, halts: 0 }; // the driver's slaps and hard pulls already heard (systems/mountReins.ts)
  const later: { in: number; play: () => void }[] = []; // a horse answers a moment after the hand

  const reset = (from: number): void => {
    phase = from;
    metres = 0;
    thumpAt = between(THUMP_EVERY[ground]);
    creakIn = between([1.2, 3]);
    whisperIn = between([2, 5]);
    lastSpeed = 0;
    snortIn = between([5, 9]);
    idleIn = between([6, 12]);
    galloping = false;
    seen.struck = g.player.mount.reins.struck;
    seen.halts = g.player.mount.reins.halts;
    later.length = 0;
    tossed = false;
    pawClock = null;
    g.player.mount.idleToss = null;
    bed?.set(SILENT_BED);
  };
  const strike = (id: MountId, leg: number, speed: number, pair: boolean): void => {
    const weight = hoofWeight(speed);
    const hind = leg >= 2;
    const pan = (leg % 2 === 0 ? -0.3 : 0.3) * (pair ? -1 : 1);
    const shoe = id === 'chariot' ? 'bone' : 'iron';
    recipe(`mount:${id}:hoof:${leg}${pair ? 'b' : ''}`, hoofBeat(ground, { hind, shoe, weight }), { gain: MOUNT_MIX.hoof * (0.55 + 0.45 * weight) * (pair ? 0.65 : 1), pitch: hind ? 0.94 : 1.02, vary: 0.4, pan });
    if (id === 'grey') sampler?.play(SAMPLE_SETS[STEP_SET[ground]], { gain: MOUNT_MIX.hoofSample * MOUNT_MIX.level * weight * weight, pan, pitch: 0.7 + 0.14 * weight - (hind ? 0.05 : 0) });
  };

  const spread = (width: number): number => (Math.random() - 0.5) * width;
  /** The reins slapped on its back, and the horse's eager huff a moment after (not every time: a horse that answered every slap would be a machine). */
  const slap = (id: MountId): void => {
    recipe(`mount:${id}:slap`, REIN_SLAP, { gain: MOUNT_MIX.slap, pitch: around(0.12, 1), vary: 0.4, pan: spread(0.2) });
    if (id === 'grey' && Math.random() < 0.75) later.push({ in: between([0.26, 0.38]), play: () => recipe('mount:grey:urge', HORSE_URGE, { gain: MOUNT_MIX.urge, pitch: around(0.18, 1), vary: 0.5, pan: spread(0.3) }) });
  };
  /** A hard pull at speed: the blow through the nose, the hooves braking, and the harness shaken as the head goes up. */
  const halt = (id: MountId, speed: number): void => {
    const load = Math.min(1, speed / MOUNT_TRAVERSAL.gallop);
    if (id === 'grey') recipe('mount:grey:halt', HORSE_HALT, { gain: MOUNT_MIX.halt * (0.6 + 0.4 * load), pitch: around(0.16, 1), vary: 0.5, pan: spread(0.3) });
    recipe(`mount:${id}:scrape`, hoofScrape(ground), { gain: MOUNT_MIX.scrape * (0.5 + 0.5 * load), pitch: around(0.2, 1), vary: 0.4, pan: spread(0.3) });
    later.push({ in: between([0.2, 0.32]), play: () => recipe(`mount:${id}:shake`, HARNESS_SHAKE, { gain: MOUNT_MIX.shake * (0.55 + 0.45 * load), pitch: around(0.2, id === 'chariot' ? 0.85 : 1), vary: 0.5, pan: spread(0.3) }) });
    if (id === 'chariot') later.push({ in: 0.35, play: () => recipe('mount:chariot:whisper', SPECTRAL_WHISPER, { gain: MOUNT_MIX.whisper * (0.5 + 0.4 * load), pitch: around(0.2, 0.9), vary: 0.5, pan: spread(0.5) }) });
  };
  /** One small noise of a horse standing at its harness, never the same twice running. */
  const idle = (id: MountId, seconds: number): void => {
    const pool = id === 'grey' ? IDLE_NOISES.filter(([name]) => name !== idleLast && !(tossed && name === 'shake')) : ([['shake', 1]] as const);
    tossed = false;
    let roll = Math.random() * pool.reduce((sum, [, weight]) => sum + weight, 0);
    const [name] = pool.find(([, weight]) => (roll -= weight) < 0) ?? pool[0];
    idleLast = name;
    const key = `mount:${id}:${name === 'snort' ? 'snort' : name}`;
    const o = { vary: 0.5, pan: spread(0.3) };
    if (name === 'blow') recipe(key, HORSE_BLOW, { ...o, gain: MOUNT_MIX.blow, pitch: around(0.2, 1) });
    else if (name === 'whicker') recipe(key, HORSE_WHICKER, { ...o, gain: MOUNT_MIX.whicker, pitch: around(0.2, 1) });
    else if (name === 'shake') recipe(key, HARNESS_SHAKE, { ...o, gain: MOUNT_MIX.shake * 0.8, pitch: around(0.2, id === 'chariot' ? 0.85 : 1) });
    else if (name === 'swish') recipe(key, TAIL_SWISH, { ...o, gain: MOUNT_MIX.swish, pitch: around(0.2, 1) });
    else if (name === 'flutter') recipe(key, LIP_FLUTTER, { ...o, gain: MOUNT_MIX.flutter, pitch: around(0.2, 1) });
    else recipe(key, SNORT, { ...o, gain: MOUNT_MIX.snort * 0.6, pitch: around(0.16, 0.92 + 0.08) });
    if (id === 'grey' && (name === 'blow' || name === 'snort') && Math.random() < (name === 'snort' ? 0.4 : 0.25)) { // a breath out, and the head goes up: the harness answers it
      tossed = true;
      const delay = between([0.28, 0.45]);
      const cue = g.player.mount.idleToss = { start: seconds, peak: seconds + delay };
      later.push({ in: delay, play: () => {
        if (g.player.mount.idleToss !== cue || g.player.mount.active !== 'grey' || g.player.mount.speed >= 0.5) return;
        recipe('mount:grey:toss', HARNESS_SHAKE, { gain: MOUNT_MIX.shake, pitch: around(0.2, 1), vary: 0.5, pan: spread(0.3) });
      } });
    }
  };
  /** Called, it is there: the whinny, the harness taking the rider's weight, and a low whicker. Hooves sound only on gait or paw landings. */
  const arrive = (): void => {
    later.push({ in: between([0.2, 0.32]), play: () => recipe('mount:grey:settle', HARNESS_SHAKE, { gain: MOUNT_MIX.shake, pitch: around(0.2, 1), vary: 0.5, pan: spread(0.3) }) });
    later.push({ in: between([1.9, 2.5]), play: () => recipe('mount:grey:greet', HORSE_WHICKER, { gain: MOUNT_MIX.whicker, pitch: around(0.2, 1), vary: 0.5, pan: spread(0.3) }) });
  };

  return {
    pause: () => bed?.set(SILENT_BED),
    update(dt, seconds = g.seaTime?.() ?? g.frame / SIM.hz) {
      const mount = g.player.mount;
      const pos = g.ecs.c.transform.get(g.player.id)?.pos;
      const now = !g.ecs.c.dead.has(g.player.id) && pos ? mount.active : null;
      const moved = last && pos ? Math.hypot(pos.x - last.x, pos.z - last.z) : 0;
      last = pos ? { ...pos } : null;
      if (now !== active) {
        const prev = active;
        active = now;
        reset(mount.phase);
        if (prev) recipe(`mount:${prev}:dismiss`, prev === 'grey' ? UNHITCH : prev === 'chariot' ? SPECTRAL_DISMISS : ENGINE_STOP, { gain: prev === 'grey' ? MOUNT_MIX.unhitch : prev === 'chariot' ? MOUNT_MIX.spectralDismiss : MOUNT_MIX.engineStop, vary: 0.2 });
        if (now) recipe(`mount:${now}:summon`, now === 'grey' ? NICKER : now === 'chariot' ? SPECTRAL_SUMMON : ENGINE_START, { gain: now === 'grey' ? MOUNT_MIX.nicker : now === 'chariot' ? MOUNT_MIX.spectralSummon : MOUNT_MIX.engineStart, vary: 0.25 });
        if (now === 'grey') arrive();
        return;
      }
      if (!active || !pos) return;
      const id = active;
      const speed = Math.max(0, mount.speed);
      if (speed >= 0.5 || (mount.idleToss && seconds >= mount.idleToss.peak + HORSE_TOSS.settle)) mount.idleToss = null;
      if (!(dt > 0 && dt <= 0.25) || moved > Math.max(3, speed * dt * 3)) { // a long gap, a pause or a jump of place: no backlog of beats
        reset(mount.phase);
        return;
      }
      if (frames++ % 6 === 0) ground = surfaceAt(g, pos.x, pos.y, pos.z);
      bed?.set(bedTargets(id, speed, ground));
      const was = phase;
      phase = mount.phase;
      const travelled = speed * dt;
      if (id !== 'automobile') { // the driver's hands, and what the horse makes of them
        const reins = mount.reins;
        if (reins.struck > seen.struck) { seen.struck = reins.struck; slap(id); }
        if (reins.halts > seen.halts) { seen.halts = reins.halts; halt(id, reins.haltSpeed); }
        for (let i = later.length - 1; i >= 0; i--) if ((later[i].in -= dt) <= 0) later.splice(i, 1)[0].play();
        if (speed < 0.5 && (idleIn -= dt) <= 0) { idleIn = between([6, 14]); idle(id, seconds); } // standing, the small noises of a horse that is awake
        const clock = id === 'grey' && speed < 0.5 ? g.seaTime?.() ?? g.frame / SIM.hz : null; // and its hoof put down in the pawing the picture draws (systems/horseIdle.ts)
        if (clock !== null && pawClock !== null && clock - pawClock < 0.25 && pawLanded(pawClock, clock) > 0) {
          recipe('mount:grey:hoof:paw', hoofBeat(ground, { hind: false, shoe: 'iron', weight: 0.85 }), { gain: MOUNT_MIX.hoof * 0.8, pitch: 1.02, vary: 0.4, pan: -0.3 });
          recipe('mount:grey:trace', TRACE_SHIFT, { gain: MOUNT_MIX.trace * 0.6, vary: 0.5, pan: spread(0.4) });
        }
        pawClock = clock;
      }

      if (id !== 'automobile') {
        for (const leg of touchdowns(was, phase, speed)) strike(id, leg, speed, false);
        if (id === 'chariot') for (const leg of touchdowns(was + PAIR, phase + PAIR, speed)) strike(id, leg, speed, true);
        const load = Math.min(1, speed / MOUNT_TRAVERSAL.gallop);
        if (Math.floor(phase) > Math.floor(was) && Math.floor(phase) % 2 === 0 && speed > 2.5) { // leather and wood shifting, once in two strides
          recipe(`mount:${id}:trace`, TRACE_SHIFT, { gain: MOUNT_MIX.trace * (0.4 + 0.6 * load), pitch: id === 'chariot' ? 0.85 : 1, vary: 0.5, pan: Math.random() * 0.4 - 0.2 });
        }
        if (id === 'chariot') { // a cold breath through the bones, now and then, and the violet fire crackling in it
          whisperIn -= dt * (0.5 + load);
          if (speed > 1 && whisperIn <= 0) {
            whisperIn = between([3, 7]);
            recipe('mount:chariot:whisper', SPECTRAL_WHISPER, { gain: MOUNT_MIX.whisper * (0.5 + 0.5 * load), pitch: 0.9 + 0.2 * Math.random(), vary: 0.5, pan: Math.random() * 0.6 - 0.3 });
          }
        }
        creakIn -= dt * (0.4 + 1.6 * load);
        if (speed > 1.5 && creakIn <= 0) {
          creakIn = between([1.2, 3]);
          recipe(`mount:${id}:creak`, CREAK, { gain: MOUNT_MIX.creak * (0.55 + 0.45 * load), pitch: 0.9 + 0.25 * Math.random(), vary: 0.5 });
        }
        if (id === 'grey') {
          const fast = speed >= GALLOP_SNORT && gaitAt(speed).kind === 'gallop';
          snortIn -= dt;
          if ((fast && !galloping) || (fast && snortIn <= 0)) {
            snortIn = between([5, 9]);
            recipe('mount:grey:snort', SNORT, { gain: MOUNT_MIX.snort, pitch: 0.92 + 0.16 * Math.random(), vary: 0.5, pan: Math.random() * 0.3 - 0.15 });
          }
          galloping = fast;
        }
      }
      metres += travelled;
      if (metres >= thumpAt && speed > 1.5) {
        metres = 0;
        thumpAt = between(THUMP_EVERY[ground]);
        if (ground !== 'water') recipe(`mount:${id}:thump`, wheelThump(id === 'automobile' ? 'rubber' : 'wood', ground), { gain: MOUNT_MIX.thump * (0.5 + 0.5 * Math.min(1, speed / MOUNT_TRAVERSAL.gallop)) * (ground === 'dirt' ? 0.75 : 1), vary: 0.5, pan: Math.random() * 0.5 - 0.25 });
      }
      if (id === 'automobile' && lastSpeed - speed > 0.12 && lastSpeed > 9 * gaitScale && Math.random() < 0.5) { // easing off at speed: the exhaust pops
        recipe('mount:automobile:pop', EXHAUST_POP, { gain: MOUNT_MIX.pop, pitch: 0.9 + 0.2 * Math.random(), vary: 0.5, pan: Math.random() * 0.3 - 0.15 });
      }
      lastSpeed = speed;
    },
  };
}
