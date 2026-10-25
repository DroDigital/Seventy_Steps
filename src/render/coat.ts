/**
 * Round 80, the coats of the land (data/coats.ts): the realm's coat eased as the investigator walks from one realm to the next (at once when
 * the camera has leapt: a journey), taken off at the door of a roofed place, and laid in the world shader's uniforms (shaders/world.ts).
 * Called by the realm's look (render/realmLook.ts), which knows when a leap has been made. Render only.
 */

import { COAT_EASE, coatOf, easeCoat, NO_COAT, type CoatLook } from '../data/coats';
import { worldUniforms } from './worldMaterial';

export interface CoatLayer {
  /** The coat now. */
  readonly now: CoatLook;
  /** `dt` seconds on (1e9: at once): eased toward the coat of `region`, or toward none under a roof. */
  update(region: string | null, enclosed: boolean, dt: number): void;
}

/** Lays a coat in the shared uniforms. */
export function lay(c: CoatLook, u: typeof worldUniforms = worldUniforms): void {
  u.uCoatCol.value.set(c.cap[0], c.cap[1], c.cap[2]);
  u.uCoatStain.value.set(c.stain[0], c.stain[1], c.stain[2]);
  u.uCoatA.value.set(c.capShare, c.wind, c.stainShare, c.amount);
  u.uCoatLine.value.set(c.line, Math.max(c.soft, 0.05), c.wobble, c.crust);
}

export function createCoatLayer(): CoatLayer {
  let eased = NO_COAT;
  lay(eased);
  return {
    get now() {
      return eased;
    },
    update(region, enclosed, dt) {
      const want = enclosed ? NO_COAT : coatOf(region);
      const span = enclosed ? COAT_EASE.roofed : COAT_EASE.realm;
      eased = dt >= 1e9 ? want : easeCoat(eased, want, Math.min(1, dt / span));
      lay(eased);
    },
  };
}
