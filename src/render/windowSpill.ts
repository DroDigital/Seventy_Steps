/**
 * Window light belongs to the receiving surface: the shared lamp shader projects its soft footprint onto stone, props and bodies.
 * Keep each pane's projection in the very same slot as its actual light. No additive ground plane or separate source budget:
 * textures, normals, fog and the light's intensity all apply in the world material.
 */

import type { Game } from '../systems/components';
import { createSpillPlans, type Pane } from './spillPlan';
import { LIGHT_VIEW } from './worldLights';
import { worldUniforms } from './worldMaterial';

export interface WindowSpill {
  /** After lights are chosen; a roof, dungeon or arena keeps its ordinary room lighting. */
  update(time: number, on: boolean): void;
}

export function createWindowSpill(g: Game): WindowSpill {
  const plan = createSpillPlans();
  const windows = worldUniforms.uLampWindows.value;
  return {
    update(_time, on) {
      const world = g.world;
      const lights = windows.length - LIGHT_VIEW.flashes; // (the farthest slots are a flash's for its moment, no window's: worldLights.ts, flashLights.ts)
      for (let i = 0; i < windows.length; i++) {
        const s = i < lights ? LIGHT_VIEW.seen[i]?.s : undefined;
        if (on && world && s?.kind === 'window' && s.glass && worldUniforms.uLamps.value[i].w > 0) {
          const p = plan(s as Pane, world);
          if (p) {
            windows[i].set(p.nx, p.nz, p.offset, p.height);
            continue;
          }
        }
        windows[i].set(0, 0, 0, 0);
      }
    },
  };
}
