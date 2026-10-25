/**
 * Round 80, atmosphere: the hub of what deepens the open world's air without touching its rules. Every part lives in
 * `render/atm/` and is made once with the world's life (render/worldLife.ts), then updated each drawn frame after the rest
 * of the life has been. Parts only read the simulation (`g`) and the pictures' own state; none writes a number the game's
 * balance reads. A part that has nothing to do (a dungeon, a cutscene, a realm it does not belong to) does it cheaply.
 */

import type * as THREE from 'three';
import type { Game } from '../systems/components';
import type { GameAudio } from './audio/gameAudio';
import type { LifeParts } from './worldLife';
import { createSkyPass } from './atm/sky';
import { createMistLight } from './atm/mist';
import { createRealmAir } from './atm/air';
import { createFootsteps } from './atm/steps';
import { createGroundSkin } from './atm/ground';
import { createDreadPicture } from './atm/dread';
import { createHorizon } from './atm/horizon';
import { createSleeper } from './atm/sleeper';

export interface AtmContext {
  scene: THREE.Scene;
  g: Game;
  audio: GameAudio;
  parts: LifeParts;
}

export interface AtmPart {
  /** Each drawn frame: `enclosed`, under a dungeon's roof (or any fight's walls); `alpha`, how far the picture is from the last step to the next; `gloom`, how dark the roofed room is kept. */
  update(camera: THREE.Camera, time: number, enclosed: boolean, alpha: number, gloom?: number): void;
}

export function createAtmosphere(ctx: AtmContext): AtmPart {
  const parts: AtmPart[] = [createSkyPass(ctx), createMistLight(ctx), createRealmAir(ctx), createFootsteps(ctx), createGroundSkin(ctx), createDreadPicture(ctx), createSleeper(ctx), createHorizon(ctx)]; // (the breath writes the corners from the base and the eye scales what it finds, so they compose: the other order wiped the eye out)
  return {
    update(camera, time, enclosed, alpha, gloom) {
      for (const p of parts) p.update(camera, time, enclosed, alpha, gloom);
    },
  };
}
