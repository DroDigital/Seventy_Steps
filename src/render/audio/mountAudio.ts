/**
 * A ride heard (round 50). The rider's own foley, like footsteps: not placed in the world, or the camera would swallow it, and
 * presentation only: nothing here makes noise the simulation hears. Every hoofbeat is a foot that comes down in the gait the
 * picture shows (systems/mountGait.ts, counted by the simulation in `MountState.phase`), so a horse stopped against a wall stops
 * at once and the sound is the feet's; under the beats runs a bed that follows the speed and the ground (mountBed.ts), and over
 * them the harness, the timber's creak, the wheels' knocks, a snort at the gallop; the motor car has its engine instead of hooves.
 * Procedural until recordings stand in front of them (data/mountSounds.ts). Levels are against the impacts: tests/mountAudio.test.ts.
 */
import type { V3 } from '../../core/geom';
import { MOUNT_TRAVERSAL, type MountId } from '../../data/mounts';
import {
  CREAK, ENGINE_START, ENGINE_STOP, HARNESS_JINGLE, MOUNT_MIX, NICKER, SNORT, SPECTRAL_DISMISS, SPECTRAL_SUMMON, UNHITCH, WHEEL_KNOCK, hoofBeat, type Ground,
} from '../../data/mountSounds';
import { SAMPLE_SETS, type SampleSetId } from '../../data/samples';
import type { Sound } from '../../data/sounds';
import type { Game } from '../../systems/components';
import { gaitAt, hoofWeight, touchdowns } from '../../systems/mountGait';
import { surfaceAt } from './foley';
import { SILENT_BED, bedTargets, type MountBed } from './mountBed';
import type { Sampler } from './sampler';

type Recipe = (key: string, sound: Sound, o?: { at?: V3 | null; gain?: number; range?: number; pitch?: number; vary?: number; pan?: number }) => boolean;

const STEP_SET: Record<Ground, SampleSetId> = { dirt: 'stepDirt', road: 'stepRoad', stone: 'stepStone', water: 'stepWater' };
const KNOCK_EVERY: Record<Ground, readonly [number, number]> = { dirt: [3.5, 6], road: [1.4, 2.4], stone: [1.1, 1.8], water: [99, 99] }; // metres between a wheel's knocks
const PAIR = 0.059; // the second spectral horse's gait, a share of a cycle behind the first (0.37 rad: render/mountCarriage.ts)
const GALLOP_SNORT = 14; // m/s

const between = ([a, b]: readonly [number, number]): number => a + (b - a) * Math.random();

export interface MountAudio {
  /** Delta seconds between consecutive render frames; called only while the world advances. */
  update(dt: number): void;
  /** Play has stopped (a menu, the title): the beds go quiet. */
  pause(): void;
}

export function createMountAudio(g: Game, recipe: Recipe, sampler?: Pick<Sampler, 'play'>, bed?: MountBed): MountAudio {
  let active: MountId | null = null;
  let last: V3 | null = null;
  let phase = 0;
  let ground: Ground = 'dirt';
  let frames = 0;
  let metres = 0;
  let knockAt = 4;
  let creakIn = 2;
  let snortIn = 6;
  let idleIn = 8;
  let galloping = false;

  const reset = (from: number): void => {
    phase = from;
    metres = 0;
    knockAt = between(KNOCK_EVERY[ground]);
    creakIn = between([1.2, 3]);
    snortIn = between([5, 9]);
    idleIn = between([7, 14]);
    galloping = false;
    bed?.set(SILENT_BED);
  };
  const strike = (id: MountId, leg: number, speed: number, pair: boolean): void => {
    const weight = hoofWeight(speed);
    const hind = leg >= 2;
    const pan = (leg % 2 === 0 ? -0.3 : 0.3) * (pair ? -1 : 1);
    const shoe = id === 'chariot' ? 'bone' : 'iron';
    recipe(`mount:${id}:hoof:${leg}${pair ? 'b' : ''}`, hoofBeat(ground, { hind, shoe, weight }), { gain: MOUNT_MIX.hoof * (0.55 + 0.45 * weight) * (pair ? 0.8 : 1), pitch: hind ? 0.94 : 1.02, vary: 0.4, pan });
    if (id === 'grey') sampler?.play(SAMPLE_SETS[STEP_SET[ground]], { gain: MOUNT_MIX.hoofSample * weight * weight, pan, pitch: 0.7 + 0.14 * weight - (hind ? 0.05 : 0) });
  };

  return {
    pause: () => bed?.set(SILENT_BED),
    update(dt) {
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
        return;
      }
      if (!active || !pos) return;
      const id = active;
      const speed = Math.max(0, mount.speed);
      if (!(dt > 0 && dt <= 0.25) || moved > Math.max(3, speed * dt * 3)) { // a long gap, a pause or a jump of place: no backlog of beats
        reset(mount.phase);
        return;
      }
      if (frames++ % 6 === 0) ground = surfaceAt(g, pos.x, pos.y, pos.z);
      bed?.set(bedTargets(id, speed, ground));
      const was = phase;
      phase = mount.phase;
      const travelled = speed * dt;

      if (id !== 'automobile') {
        for (const leg of touchdowns(was, phase, speed)) strike(id, leg, speed, false);
        if (id === 'chariot') for (const leg of touchdowns(was + PAIR, phase + PAIR, speed)) strike(id, leg, speed, true);
        const load = Math.min(1, speed / MOUNT_TRAVERSAL.gallop);
        if (Math.floor(phase) > Math.floor(was) && speed > 0.8) {
          recipe(`mount:${id}:jingle`, HARNESS_JINGLE, { gain: MOUNT_MIX.jingle * (0.4 + 0.6 * load) * (id === 'chariot' ? 0.8 : 1), pitch: id === 'chariot' ? 0.72 : 1, vary: 0.5, pan: Math.random() * 0.4 - 0.2 });
        }
        creakIn -= dt * (0.4 + 1.6 * load);
        if (speed > 1.5 && creakIn <= 0) {
          creakIn = between([1.2, 3]);
          recipe(`mount:${id}:creak`, CREAK, { gain: MOUNT_MIX.creak * (0.55 + 0.45 * load), pitch: 0.9 + 0.25 * Math.random(), vary: 0.5 });
        }
        if (id === 'grey') {
          const fast = speed >= GALLOP_SNORT && gaitAt(speed).kind === 'gallop';
          snortIn -= dt;
          if ((fast && !galloping) || (fast && snortIn <= 0) || (speed < 0.5 && (idleIn -= dt) <= 0)) {
            snortIn = between([5, 9]);
            idleIn = between([7, 14]);
            recipe('mount:grey:snort', SNORT, { gain: MOUNT_MIX.snort * (fast ? 1 : 0.6), pitch: 0.92 + 0.16 * Math.random(), vary: 0.5, pan: Math.random() * 0.3 - 0.15 });
          }
          galloping = fast;
        }
      }
      metres += travelled;
      if (metres >= knockAt && speed > 1.5) {
        metres = 0;
        knockAt = between(KNOCK_EVERY[ground]);
        if (ground !== 'water') recipe(`mount:${id}:knock`, WHEEL_KNOCK, { gain: MOUNT_MIX.knock * (0.5 + 0.5 * Math.min(1, speed / MOUNT_TRAVERSAL.gallop)) * (ground === 'dirt' ? 0.7 : 1), pitch: id === 'automobile' ? 0.8 : 1, vary: 0.5, pan: Math.random() * 0.5 - 0.25 });
      }
    },
  };
}
