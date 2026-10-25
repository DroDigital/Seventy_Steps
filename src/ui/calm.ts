/**
 * Round 78, the quiet walk: some seconds after the last blow, wound, lock-on or hunt, with the body and the mind whole and nothing
 * afoot, the bars, counters, map and quest line sink to a third of their strength (never gone), and if the investigator then stands
 * still and leaves the view alone the camera draws back and a hair higher, as if taking breath (render/followCamera.ts). Any blow, hunt,
 * lock-on, step or turn of the view snaps it back in under half a second. Read-only on the simulation; the setting is Settings › Play ›
 * Quiet walk. `stepCalm` is the pure part (tests/calm.test.ts); `createCalm` reads the game for what it needs.
 */

import { QUIET } from '../data/uiMood';
import { engagedFights } from '../systems/bossFight';
import type { Game } from '../systems/components';

export interface CalmState {
  quiet: number; // seconds nothing has threatened
  still: number; // seconds the investigator has stood still, the view left alone
  hud: number; // 0..1, the bars' recession, as eased (not yet shaped)
  camera: number; // 0..1, the camera's drawing back
}

export const newCalm = (): CalmState => ({ quiet: 0, still: 0, hud: 0, camera: 0 });

/** What a step is told: `calm`, nothing threatens and the screen is the world's; `still`, no step is taken and the view is not turned. */
export interface CalmInput {
  calm: boolean;
  still: boolean;
}

const toward = (v: number, want: number, dt: number, q: typeof QUIET): number => (want > v ? Math.min(want, v + dt / q.in) : Math.max(want, v - dt / q.out));

/** One step of `dt` seconds. */
export function stepCalm(s: CalmState, i: CalmInput, dt: number, q: typeof QUIET = QUIET): void {
  if (!i.calm) [s.quiet, s.still] = [0, 0];
  else {
    s.quiet += dt;
    s.still = i.still && s.quiet >= q.hudAfter ? s.still + dt : 0; // (counted from when the bars have receded: "a few seconds more")
  }
  const hud = s.quiet >= q.hudAfter ? 1 : 0;
  s.hud = toward(s.hud, hud, dt, q);
  s.camera = toward(s.camera, hud && s.still >= q.camAfter ? 1 : 0, dt, q);
}

/** The shape of a recession: it starts and ends softly. */
export const shaped = (v: number): number => v * v * (3 - 2 * v);

export interface Calm {
  /** Each drawn frame: the bars' recession and the camera's drawing back, 0..1 each. */
  update(): { hud: number; camera: number };
  /** Something happened the quiet should not outlast (a quest line changed): the count begins again. */
  poke(): void;
}

/** `enabled`: Settings › Play › Quiet walk, and the screen is the world's (no menu, talk or cutscene over it). */
export function createCalm(g: Game, enabled: () => boolean): Calm {
  const s = newCalm();
  const me = g.player.id;
  let last = performance.now();
  let at = { x: 0, z: 0, yaw: 0, pitch: 0 };
  let poked = false;
  g.events.on('Hit', (e) => void ((e.attacker === me || e.target === me) && (poked = true)));
  g.events.on('Died', () => void (poked = true));
  g.events.on('QuestChanged', () => void (poked = true));

  const threatened = (): boolean => {
    const c = g.ecs.c;
    const p = c.transform.get(me)!.pos;
    for (const [id, br] of c.brain) {
      if (c.dead.has(id) || (br.state !== 'engage' && br.state !== 'alert')) continue;
      const tr = c.transform.get(id);
      if (br.state === 'engage' ? br.target === me : !!tr && Math.hypot(tr.pos.x - p.x, tr.pos.z - p.z) < 20) return true;
    }
    return false;
  };

  return {
    poke: () => void (poked = true),
    update() {
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const h = g.ecs.c.health.get(me);
      const st = g.ecs.c.stamina.get(me);
      const p = g.ecs.c.transform.get(me)!.pos;
      const moved = dt > 0 ? Math.hypot(p.x - at.x, p.z - at.z) / dt : 0;
      const turned = dt > 0 ? (Math.abs(g.camera.yaw - at.yaw) + Math.abs(g.camera.pitch - at.pitch)) / dt : 0;
      at = { x: p.x, z: p.z, yaw: g.camera.yaw, pitch: g.camera.pitch };
      const whole = !!h && !!st && h.hp >= h.max && st.value >= st.max - 0.5 && g.mind.sanity >= QUIET.sanity;
      const free = enabled() && !!g.overworld && !g.cutscene && !g.player.mount.active && !g.player.falling && !g.player.fogPass && !g.player.gatePass && !g.player.kneeling && g.lock.target === null;
      const calm = free && whole && !poked && engagedFights(g).length === 0 && !threatened();
      poked = false;
      stepCalm(s, { calm, still: moved < QUIET.still && turned < QUIET.turn }, dt);
      return { hud: shaped(s.hud), camera: shaped(s.camera) };
    },
  };
}
