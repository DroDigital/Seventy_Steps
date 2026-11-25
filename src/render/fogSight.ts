/**
 * Tracks whether the follow camera is still looking through a crossed boss fog wall at the player (2026-11-24).
 * Rather than hiding the whole wall, bossFog.ts feeds this sight point into fogBreach.ts so the localized breach
 * where the player passed stays open along the line of sight until the camera crosses too, then swirls shut.
 */
import type { V3 } from '../core/geom';
import { crosses, sideOf } from '../systems/fogGates';
import type { FogWall } from '../world/gatePlan';

export interface FogSightState {
  at: V3 | null;
  u: number; // metres along the wall from its centre
  y: number; // metres above the wall's foot
  clear: number; // 0..1 eased sight-hold weight
  blocked: boolean;
}

export interface FogSight {
  /** Record the side reached by a completed traversal. */
  crossed(at: V3): void;
  /** The ray's wall-plane crossing and whether the camera is still behind the crossed wall. */
  update(camera: V3, player: V3 | undefined, passing: boolean, dt: number): FogSightState;
}

export function createFogSight(w: Pick<FogWall, 'x' | 'z' | 'yaw' | 'width'> & { y?: number }): FogSight {
  const [cs, sn, foot] = [Math.cos(w.yaw), Math.sin(w.yaw), w.y ?? 0];
  let side = 0;
  let clear = 0;
  let at: V3 | null = null;
  let [u, y] = [0, 1.15];
  return {
    crossed: (p) => { side = Math.sign(sideOf(w, p)); },
    update(camera, player, passing, dt) {
      const playerSide = player ? Math.sign(sideOf(w, player)) : 0;
      // A wall remains opaque before its first traversal, including if a camera happens to orbit behind it.
      const eligible = passing || (side !== 0 && playerSide === side);
      const blocked = !!player && eligible && crosses(w, camera, player);
      if (blocked && player) {
        const a = sideOf(w, camera);
        const b = sideOf(w, player);
        const t = a / (a - b);
        at = { x: camera.x + (player.x - camera.x) * t, y: camera.y + (player.y + 1.1 - camera.y) * t, z: camera.z + (player.z - camera.z) * t };
        u = (at.x - w.x) * cs - (at.z - w.z) * sn;
        y = Math.max(0.5, at.y - foot);
      }
      clear += Math.sign((blocked ? 1 : 0) - clear) * Math.min(Math.abs((blocked ? 1 : 0) - clear), Math.max(0, dt) / (blocked ? 0.18 : 0.6));
      if (!blocked && clear === 0) at = null;
      return { at, u, y, clear, blocked };
    },
  };
}
