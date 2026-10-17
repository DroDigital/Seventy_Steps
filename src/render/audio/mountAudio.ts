/** Mount foley follows travelled metres, so a horse against a wall never keeps galloping.
 * All three rides are presentation only: their sounds never emit simulation noise or alter perception.
 * They are the rider's own foley, like footsteps: not placed in the world, or the camera would swallow them.
 * Short recipes keep the effects bus and stop scheduling as soon as play pauses.
 * Procedural placeholders until a recorded set is cut; levels sit under combat impact.
 */
import type { V3 } from '../../core/geom';
import { MOUNT_TRAVERSAL, type MountId } from '../../data/mounts';
import { noise, tone, type Sound } from '../../data/sounds';
import type { Game } from '../../systems/components';
import { surfaceAt, type Surface } from './foley';

type Recipe = (key: string, sound: Sound, o?: { at?: V3 | null; gain?: number; range?: number; pitch?: number; vary?: number }) => boolean;

const NICKER: Sound = [
  tone('triangle', 380, 0.18, 0.09, { to: 260, vibrato: [7, 28] }),
  noise('bandpass', 640, 0.12, 0.045, { q: 1.4 }),
  tone('sine', 190, 0.24, 0.05, { to: 150, at: 0.05 }),
];
const SUMMON: Sound = [
  noise('bandpass', 380, 0.28, 0.12, { to: 1800, attack: 0.04, q: 0.8 }),
  tone('sine', 94, 0.32, 0.08, { to: 47, attack: 0.03 }),
  tone('triangle', 510, 0.22, 0.03, { to: 320, vibrato: [7, 12] }),
];
const START: Sound = [
  noise('bandpass', 930, 0.11, 0.1, { to: 300, q: 1.2 }),
  tone('triangle', 85, 0.28, 0.09, { to: 46, at: 0.05 }),
  noise('lowpass', 270, 0.22, 0.07, { at: 0.06, to: 150 }),
];
const LET_GO: Sound = [
  noise('bandpass', 480, 0.1, 0.14, { q: 1.6 }),
  tone('triangle', 170, 0.16, 0.07, { to: 90 }),
];
const UNHARNESS: Sound = [
  noise('bandpass', 860, 0.12, 0.12, { to: 280, q: 1.1 }),
  tone('sine', 70, 0.22, 0.08, { to: 40 }),
];
const STALL: Sound = [
  tone('sawtooth', 48, 0.2, 0.14, { to: 28, filter: { type: 'lowpass', hz: 420 } }),
  noise('lowpass', 180, 0.16, 0.09, { to: 90 }),
];
const HARNESS: Sound = [
  noise('bandpass', 1500, 0.065, 0.16, { q: 3 }),
  tone('triangle', 740, 0.08, 0.08, { to: 680 }),
  tone('sine', 1130, 0.06, 0.04, { at: 0.025 }),
];
const CREAK: Sound = [
  noise('bandpass', 340, 0.18, 0.28, { to: 480, q: 2.2, attack: 0.015 }),
  tone('triangle', 132, 0.16, 0.12, { to: 165, vibrato: [14, 9], filter: { type: 'lowpass', hz: 700 } }),
];
const BREATH: Sound = [
  noise('bandpass', 260, 0.32, 0.08, { to: 160, q: 0.55, attack: 0.08 }),
  noise('lowpass', 140, 0.28, 0.045, { attack: 0.1 }),
];
const SNORT: Sound = [
  noise('bandpass', 170, 0.11, 0.1, { to: 80, q: 0.7, attack: 0.01 }),
  tone('triangle', 130, 0.08, 0.04, { to: 70 }),
];
const WIND: Sound = [
  noise('bandpass', 420, 0.36, 0.12, { to: 240, q: 0.45, attack: 0.06 }),
  tone('sine', 88, 0.3, 0.05, { to: 64 }),
];
const WHEELS: Record<Surface, Sound> = {
  dirt: [noise('bandpass', 340, 0.16, 0.14, { q: 0.7, attack: 0.02 })],
  road: [noise('bandpass', 620, 0.14, 0.13, { q: 0.85, attack: 0.015 }), tone('triangle', 140, 0.08, 0.04, { to: 90 })],
  stone: [noise('bandpass', 1100, 0.12, 0.12, { q: 0.9 }), tone('triangle', 210, 0.07, 0.045, { to: 110 })],
  water: [noise('bandpass', 980, 0.16, 0.13, { to: 400, q: 0.55, attack: 0.015 })],
};

/** One contact, or a close pair from the two spectral horses. Timbre follows the ground. */
function hooves(surface: Surface, beat: number, pair: boolean): Sound {
  const body = surface === 'stone' ? 220 : surface === 'road' ? 168 : surface === 'water' ? 110 : 92;
  const grit = surface === 'water' ? 1500 : surface === 'stone' ? 2300 : surface === 'road' ? 1280 : 480;
  const click = surface === 'stone' ? 0.07 : surface === 'road' ? 0.045 : surface === 'water' ? 0.08 : 0.035;
  const thud = surface === 'dirt' ? 0.13 : 0.1;
  const hit: Sound = [
    tone('triangle', beat % 2 ? body : body + 16, 0.07, thud, { to: body * 0.5, filter: { type: 'lowpass', hz: surface === 'stone' ? 1400 : 640 } }),
    noise('bandpass', grit, 0.04, click, { q: surface === 'stone' ? 2.2 : 1.1 }),
  ];
  if (!pair) return surface === 'water' ? [...hit, noise('bandpass', 800, 0.08, 0.05, { to: 360, q: 0.5 })] : hit;
  return [
    ...hit,
    tone('triangle', beat % 2 ? body + 22 : body + 6, 0.065, thud * 0.75, { at: 0.034, to: body * 0.48, filter: { type: 'lowpass', hz: 720 } }),
    noise('bandpass', grit * 0.86, 0.04, click * 0.8, { at: 0.034, q: 1.3 }),
  ];
}

function engine(load: number): Sound {
  return [
    tone('sawtooth', 42 + 18 * load, 0.12, 0.12, { to: 34 + 14 * load, filter: { type: 'lowpass', hz: 280 + 220 * load } }),
    tone('triangle', 84 + 24 * load, 0.08, 0.06, { to: 62 + 16 * load }),
    noise('lowpass', 220 + 180 * load, 0.1, 0.07, { to: 120 }),
    noise('bandpass', 980, 0.025, 0.03, { at: 0.03, q: 2.4 }),
  ];
}

const summonOf = (id: MountId): Sound => (id === 'grey' ? NICKER : id === 'chariot' ? SUMMON : START);
const dismissOf = (id: MountId): Sound => (id === 'grey' ? LET_GO : id === 'chariot' ? UNHARNESS : STALL);

export interface MountAudio {
  /** Delta seconds from consecutive render frames; called only while the world advances. */
  update(dt: number): void;
}

export function createMountAudio(g: Game, recipe: Recipe): MountAudio {
  let active: MountId | null = null;
  let last: V3 | null = null;
  let travelled = 0;
  let wheelMetres = 0;
  let harnessMetres = 0;
  let engineSeconds = 0;
  let breath = 0;
  let snort = 0;
  let wind = 0;
  let beat = 0;
  let speed = 0;

  return {
    update(dt) {
      const mount = g.player.mount;
      const pos = g.ecs.c.transform.get(g.player.id)?.pos;
      const now = !g.ecs.c.dead.has(g.player.id) && pos ? mount.active : null;
      const moved = last && pos ? Math.hypot(pos.x - last.x, pos.z - last.z) : 0;
      last = pos ? { ...pos } : null;
      if (now !== active) {
        const prev = active;
        active = now;
        travelled = wheelMetres = harnessMetres = engineSeconds = breath = snort = wind = speed = beat = 0;
        if (prev) recipe(`mount:${prev}:dismiss`, dismissOf(prev), { gain: 0.9, vary: 0.2 });
        if (now) recipe(`mount:${now}:summon`, summonOf(now), { gain: 0.85, vary: 0.25 });
        return;
      }
      if (!active || !pos) return;
      if (!(dt > 0 && dt <= 0.1) || moved > Math.max(3, mount.speed * dt * 3)) {
        travelled = wheelMetres = harnessMetres = engineSeconds = breath = snort = wind = speed = beat = 0;
        return;
      }
      const id = active;
      const measured = moved / dt;
      speed += (measured - speed) * Math.min(1, dt * 12);
      const load = Math.min(1, speed / MOUNT_TRAVERSAL.gallop);
      const gallop = load > 0.55;
      const play = (key: string, sound: Sound, gain = 1, pitch = 1): void => {
        recipe(`mount:${id}:${key}`, sound, { gain, pitch, vary: 0.12 });
      };
      if (speed < 1.4 && id === 'grey') {
        breath += dt;
        snort += dt;
        if (breath >= 2.4) { breath %= 2.4; play('breath', BREATH, 0.9); }
        if (snort >= 6.4) { snort %= 6.4; play('snort', SNORT, 0.85); }
      }
      if (speed < 1.4 && id === 'chariot') {
        wind += dt;
        if (wind >= 2.8) { wind %= 2.8; play('wind', WIND, 0.85); }
      }
      if (id === 'automobile') {
        engineSeconds += dt;
        const interval = 0.19 - 0.095 * load;
        if (engineSeconds >= interval) {
          engineSeconds %= interval;
          play('engine', engine(load), 0.85 + 0.1 * load, beat % 3 ? 1 : 0.96);
          beat++;
        }
      }
      if (moved < 0.001) return;
      const surface = surfaceAt(g, pos.x, pos.y, pos.z);
      travelled += moved;
      if (id !== 'automobile') {
        const stride = MOUNT_TRAVERSAL.stride / (id === 'chariot' ? 4 : gallop ? 2 : 2.4);
        if (travelled >= stride) {
          travelled %= stride;
          const pitch = gallop ? 1.08 : 0.94;
          play('hooves', hooves(surface, beat++, id === 'chariot'), (id === 'grey' ? 0.72 : 0.8) + 0.12 * load, pitch);
        }
      } else travelled = 0;
      if (id === 'grey') return;
      wheelMetres += moved;
      if (id === 'chariot') {
        harnessMetres += moved;
        if (harnessMetres >= 4.3) {
          harnessMetres %= 4.3;
          play('harness', HARNESS, 0.85 + 0.1 * load);
          if (beat % 3 === 0) play('creak', CREAK, 0.9);
        }
      }
      if (wheelMetres >= 1.8) {
        wheelMetres %= 1.8;
        play('wheels', WHEELS[surface], 0.75 + 0.2 * load, id === 'automobile' ? 0.9 : 1);
      }
    },
  };
}
