/**
 * The effects lab (round 51; `?debug` only): the game held still and stepped by hand, so a script can fire any move of any
 * creature and look at it, frame by frame, from where it chooses. `window.fxlab`:
 *   hold(true)           the world stands still until it is stepped
 *   advance(seconds)     steps the simulation, in tenths of a second with a picture drawn between each, and resolves
 *   skip(seconds)        steps the simulation with no picture drawn at all (to get to the weather's turn quickly)
 *   target(id)           which roster creature the rest is about (default: the nearest that fights the investigator)
 *   moves()              the names of its moves
 *   fire(name)           that creature begins that move now
 *   place({ ... })       puts the investigator `dist` metres from it, on the bearing `bearing` (radians, 0 = in front of it)
 *   look({ ... })        the camera: at `yaw` (about the creature), `dist`, `up` metres up, looking at `aim` metres up, at the point `mix`
 *                        of the way from the creature to the investigator (default 0); `look(null)`: the game's
 */
import * as THREE from 'three';
import { startMove } from '../systems/actions';
import type { Game } from '../systems/components';

export interface FxLab {
  hold(on: boolean): void;
  advance(seconds: number): Promise<void>;
  skip(seconds: number): void;
  target(id: string | null): void;
  moves(): string[];
  fire(name: string): void;
  place(o: { dist: number; bearing?: number }): void;
  look(o: { yaw: number; dist: number; up: number; aim: number; fov?: number; mix?: number } | null): void;
}

declare global {
  interface Window {
    fxlab?: FxLab;
  }
}

export interface LabHooks {
  /** Steps the simulation `n` frames and the clock with it. */
  step(n: number): void;
  hold: { on: boolean };
}

const frames = (n: number): Promise<void> => new Promise((done) => (n <= 0 ? done() : requestAnimationFrame(() => void frames(n - 1).then(done))));

export function installFxLab(game: Game, camera: THREE.PerspectiveCamera, hooks: LabHooks): void {
  if (!new URLSearchParams(window.location.search).has('debug')) return;
  const c = game.ecs.c;
  let only: string | null = null;
  const foe = (): number | undefined => {
    const p = c.transform.get(game.player.id)!.pos;
    let best: number | undefined;
    let d = Infinity;
    for (const [id, a] of c.actor) {
      if (id === game.player.id || !c.combatant.get(id) || c.combatant.get(id)!.faction !== 'enemy' || c.dead.has(id) || (only && c.dread.get(id)?.id !== only)) continue;
      const t = c.transform.get(id)!.pos;
      const dd = Math.hypot(t.x - p.x, t.z - p.z);
      if (dd < d && Object.keys(a.moves).length) [best, d] = [id, dd];
    }
    return best;
  };
  let view: { yaw: number; dist: number; up: number; aim: number; fov: number; mix: number } | null = null;
  const original = camera.updateMatrixWorld.bind(camera);
  camera.updateMatrixWorld = (force?: boolean): void => {
    const id = foe();
    if (view && id !== undefined) {
      const at = c.transform.get(id)!;
      const me = c.transform.get(game.player.id)!.pos;
      const [cx, cz] = [at.pos.x + (me.x - at.pos.x) * view.mix, at.pos.z + (me.z - at.pos.z) * view.mix];
      const yaw = at.yaw + view.yaw;
      camera.position.set(cx + Math.sin(yaw) * view.dist, at.pos.y + view.up, cz + Math.cos(yaw) * view.dist);
      if (camera.fov !== view.fov) {
        camera.fov = view.fov;
        camera.updateProjectionMatrix();
      }
      camera.lookAt(cx, at.pos.y + view.aim, cz);
    }
    original(force);
  };
  window.fxlab = {
    hold: (on) => void (hooks.hold.on = on),
    async advance(seconds) {
      for (let left = Math.round(seconds * 60); left > 0; left -= 6) {
        hooks.step(Math.min(6, left));
        await frames(2);
      }
    },
    skip(seconds) {
      hooks.step(Math.round(seconds * 60));
    },
    target: (id) => void (only = id),
    moves: () => Object.keys(c.actor.get(foe() ?? -1)?.moves ?? {}),
    fire(name) {
      const id = foe();
      if (id === undefined) return;
      c.brain.delete(id); // it acts only as told
      startMove(c.actor.get(id)!, name);
    },
    place({ dist, bearing = 0 }) {
      const id = foe();
      if (id === undefined) return;
      const t = c.transform.get(id)!;
      const yaw = t.yaw + bearing;
      const [x, z] = [t.pos.x + Math.sin(yaw) * dist, t.pos.z + Math.cos(yaw) * dist];
      const me = c.transform.get(game.player.id)!;
      me.pos = { x, y: game.world.ground(x, z), z };
      me.prev = { ...me.pos };
      [me.yaw, me.prevYaw] = [yaw + Math.PI, yaw + Math.PI];
    },
    look(o) {
      view = o && { fov: 50, mix: 0, ...o };
    },
  };
}
