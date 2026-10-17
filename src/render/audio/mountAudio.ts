/** Mount foley follows travelled metres, so a horse against a wall never keeps galloping.
 * Both rides are presentation only: their sounds never emit simulation noise or alter perception.
 * Short recipes keep the effects bus/settings and stop scheduling as soon as play pauses.
 */
import type { V3 } from '../../core/geom';
import { MOUNT_TRAVERSAL, type MountId } from '../../data/mounts';
import { noise, tone, type Sound } from '../../data/sounds';
import type { Game } from '../../systems/components';
import { surfaceAt, type Surface } from './foley';

type Recipe = (key: string, sound: Sound, o?: { at?: V3 | null; gain?: number; range?: number; pitch?: number; vary?: number }) => boolean;

const SUMMON: Sound = [
  noise('bandpass', 380, 0.46, 0.16, { to: 2200, attack: 0.06, q: 0.8 }),
  tone('sine', 94, 0.44, 0.1, { to: 47, attack: 0.04 }),
  tone('triangle', 510, 0.34, 0.022, { to: 320, vibrato: [7, 12] }),
];
const START: Sound = [
  noise('bandpass', 930, 0.11, 0.1, { to: 300, q: 1.2 }),
  tone('triangle', 85, 0.3, 0.1, { to: 46, at: 0.05 }),
  noise('lowpass', 270, 0.25, 0.09, { at: 0.06, to: 150 }),
];
const HARNESS: Sound = [
  noise('bandpass', 1500, 0.065, 0.05, { q: 3 }),
  tone('triangle', 740, 0.085, 0.024, { to: 680 }),
  tone('sine', 1130, 0.06, 0.012, { at: 0.025 }),
];
const CREAK: Sound = [
  noise('bandpass', 340, 0.19, 0.07, { to: 480, q: 5, attack: 0.02 }),
  tone('triangle', 132, 0.16, 0.035, { to: 165, vibrato: [14, 9], filter: { type: 'lowpass', hz: 470 } }),
];
const WHEELS: Record<Surface, Sound> = {
  dirt: [noise('bandpass', 380, 0.16, 0.1, { q: 0.7, attack: 0.02 })],
  road: [noise('bandpass', 660, 0.16, 0.1, { q: 0.8, attack: 0.02 }), tone('triangle', 125, 0.09, 0.025, { to: 95 })],
  stone: [noise('bandpass', 1050, 0.14, 0.085, { q: 0.7 }), tone('triangle', 172, 0.08, 0.035, { to: 100 })],
  water: [noise('bandpass', 1150, 0.18, 0.11, { to: 430, q: 0.6, attack: 0.015 })],
};

/** Two close but distinct contacts, one from each horse. Low body, bone click and ground grit. */
function hooves(surface: Surface, beat: number): Sound {
  const hard = surface === 'stone' || surface === 'road';
  const grit = surface === 'water' ? 1400 : hard ? 1850 : 600;
  return [
    tone('triangle', beat % 2 ? 138 : 155, 0.075, 0.12, { to: 76, filter: { type: 'lowpass', hz: 880 } }),
    noise('bandpass', grit, 0.045, hard ? 0.09 : 0.06, { q: 1.2 }),
    tone('triangle', beat % 2 ? 164 : 146, 0.065, 0.09, { at: 0.038, to: 83, filter: { type: 'lowpass', hz: 760 } }),
    noise('bandpass', grit * 0.86, 0.045, hard ? 0.065 : 0.045, { at: 0.038, q: 1.3 }),
  ];
}

/** Uneven firing and soft mechanical resonance, with more load as the wheels gain speed. */
function engine(load: number): Sound {
  return [
    tone('sawtooth', 43 + 20 * load, 0.13, 0.06, { to: 36 + 16 * load, filter: { type: 'lowpass', hz: 190 + 180 * load } }),
    tone('triangle', 87 + 27 * load, 0.085, 0.035, { to: 65 + 18 * load }),
    noise('lowpass', 230 + 210 * load, 0.1, 0.055, { to: 110 }),
    noise('bandpass', 980, 0.025, 0.018, { at: 0.032, q: 2.5 }),
  ];
}

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
        active = now;
        travelled = wheelMetres = harnessMetres = engineSeconds = speed = beat = 0;
        if (now && pos) recipe(`mount:${now}:summon`, now === 'chariot' ? SUMMON : START, { at: { ...pos }, gain: 0.65, range: 22, vary: 0.35 });
        return;
      }
      if (!active || !pos) return;
      // Discontinuities (travel, respawn, an inactive tab) never produce a backlog of contacts.
      if (!(dt > 0 && dt <= 0.1) || moved > Math.max(3, mount.speed * dt * 3)) {
        travelled = wheelMetres = harnessMetres = engineSeconds = speed = 0;
        return;
      }
      const measured = moved / dt;
      speed += (measured - speed) * Math.min(1, dt * 12);
      const load = Math.min(1, speed / MOUNT_TRAVERSAL.gallop);
      const at = { x: pos.x, y: pos.y + 0.3, z: pos.z };
      const play = (key: string, sound: Sound, gain = 1, pitch = 1): void => {
        recipe(`mount:${active}:${key}`, sound, { at, gain, pitch, range: 24, vary: 0.2 });
      };
      if (active === 'automobile') {
        engineSeconds += dt;
        const interval = 0.19 - 0.095 * load;
        if (engineSeconds >= interval) {
          engineSeconds %= interval;
          play('engine', engine(load), 0.7 + 0.2 * load, beat++ % 3 ? 1 : 0.95);
        }
      }
      if (moved < 0.001) return;
      const surface = surfaceAt(g, pos.x, pos.y, pos.z);
      travelled += moved;
      wheelMetres += moved;
      harnessMetres += moved;
      if (active === 'chariot') {
        const stride = MOUNT_TRAVERSAL.stride / 4; // four paired contacts per visual stride
        if (travelled >= stride) {
          travelled %= stride;
          play('hooves', hooves(surface, beat++), 0.5 + 0.22 * load);
        }
        if (harnessMetres >= 4.3) {
          harnessMetres %= 4.3;
          play('harness', HARNESS, 0.45 + 0.15 * load);
          if (beat % 3 === 0) play('creak', CREAK, 0.4);
        }
      }
      if (wheelMetres >= 1.8) {
        wheelMetres %= 1.8;
        play('wheels', WHEELS[surface], 0.3 + 0.25 * load, active === 'automobile' ? 0.85 : 1);
      }
    },
  };
}
