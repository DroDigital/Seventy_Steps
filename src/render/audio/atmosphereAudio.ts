/**
 * Round 80, atmosphere: the hub of what deepens the game's sound without touching its rules. Every part lives in
 * `audio/atm/` and is made once with the game's audio (audio/gameAudio.ts), then updated each frame. Parts only read the
 * simulation (`g`); a part that has nothing to do (paused, a cutscene) does it cheaply.
 */

import type * as THREE from 'three';
import type { V3 } from '../../core/geom';
import type { Game } from '../../systems/components';
import type { FxParams } from '../fx';
import type { AudioEngine } from './engine';
import type { GameAudio } from './gameAudio';
import type { Sampler } from './sampler';
import { createFooting } from './atm/footing';
import { createNightVoices } from './atm/voices';
import { createSpace } from './atm/space';
import { createMindEars } from './atm/dread';

export interface AtmAudioContext {
  e: AudioEngine;
  g: Game;
  sampler: Sampler;
  /** The game's own recipe player (placed, dulled by the distance, varied). */
  recipe: GameAudio['recipe'];
  /** A recording where `at` is (null: in the head), fading with the distance to `range` metres. */
  recorded: (set: string, at: V3 | null, range: number, o?: { gain?: number; pitch?: number; delay?: number; fit?: number; pan?: number }) => boolean;
  /** Where the listener is (the camera) and which way is right: live objects, updated before the parts. */
  listener: V3;
  right: V3;
}

export interface AtmAudioPart {
  update(fx: FxParams, seconds: number, camera: THREE.Camera, paused: boolean): void;
}

export function createAtmosphereAudio(ctx: AtmAudioContext): AtmAudioPart {
  const parts: AtmAudioPart[] = [createSpace(ctx), createNightVoices(ctx), createFooting(ctx), createMindEars(ctx)];
  return {
    update(fx, seconds, camera, paused) {
      for (const p of parts) p.update(fx, seconds, camera, paused);
    },
  };
}
