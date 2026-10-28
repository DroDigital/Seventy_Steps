/** Keeps a crossed fog wall clear while the actual camera remains on its other side. */
import type { V3 } from '../core/geom';
import { crosses, sideOf } from '../systems/fogGates';
import type { FogWall } from '../world/gatePlan';

export interface FogSight {
  /** Record the side reached by a completed traversal. */
  crossed(at: V3): void;
  /** The opening's centre and how much of the wall is cleared, 0..1. */
  update(camera: V3, player: V3 | undefined, passing: boolean, dt: number): { at: V3 | null; clear: number; blocked: boolean };
}

export function createFogSight(w: Pick<FogWall, 'x' | 'z' | 'yaw' | 'width'>): FogSight {
  let side = 0;
  let clear = 0;
  let at: V3 | null = null;
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
      }
      // The generous opening covers the first frame; clearing the rest eases in and out.
      clear += Math.sign((blocked ? 1 : 0) - clear) * Math.min(Math.abs((blocked ? 1 : 0) - clear), Math.max(0, dt) / (blocked ? 0.18 : 0.6));
      if (!blocked && clear === 0) at = null;
      return { at, clear, blocked };
    },
  };
}
