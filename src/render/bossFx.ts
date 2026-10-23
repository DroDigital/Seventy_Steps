/**
 * Everything that makes a boss's attacks readable (render only, spec §3E): the ground telegraphs,
 * the beams and the attack particles, and the fog closed about an engaged ring (round 12), updated
 * together each frame. Read-only on the simulation.
 */

import type * as THREE from 'three';
import type { Game } from '../systems/components';
import { createAttackFx } from './attackFx';
import { createBeams, type Beams } from './beams';
import { createDecals } from './decals';
import { createFlaskFx } from './flaskFx';
import { createFogGates } from './fogGates';
import type { GroundFx } from './groundFx';
import { createMatterFx } from './matterFx';
import { createMeleeFx } from './meleeFx';
import type { Particles } from './particles';
import { createStrikeTentacles } from './strikeTentacles';
import { createSurgeView } from './surgeView';
import { createTelegraphs } from './telegraphs';

export interface BossFx {
  update(alpha: number, time: number, camera: THREE.Camera): void;
  /** The beams, whose ribbons also draw a bolt of lightning (render/worldLife.ts). */
  beams: Beams;
}

export function createBossFx(scene: THREE.Scene, g: Game, particles: Particles, ground: GroundFx): BossFx {
  const telegraphs = createTelegraphs(g, createDecals(scene), ground);
  const beams = createBeams(scene, g);
  const fx = createAttackFx(g, particles, ground);
  const matter = createMatterFx(g, particles, ground, beams); // round 70: falling stars, lightning, flame and clouds
  const tentacles = createStrikeTentacles(scene, g); // the tentacles that rise from marked ground
  const surge = createSurgeView(scene, g, particles); // the wall of water of a tidal surge
  const melee = createMeleeFx(g, particles, ground);
  const fog = createFogGates(g, particles);
  const flasks = createFlaskFx(scene, g, particles); // round 29: a flask of lamp oil, in flight and burning
  return {
    beams,
    update(alpha, time, camera) {
      telegraphs.update(alpha, time);
      beams.update(alpha, time, camera);
      fx.update(alpha);
      matter.update(alpha);
      tentacles.update(time);
      surge.update(alpha);
      melee.update(alpha);
      fog.update(time);
      flasks.update(alpha, time);
    },
  };
}
