/**
 * Everything that makes a boss's attacks readable (render only, spec §3E): the ground telegraphs,
 * the beams and the attack particles, and the fog closed about an engaged ring (round 12), updated
 * together each frame. Read-only on the simulation.
 */

import type * as THREE from 'three';
import type { Game } from '../systems/components';
import { createAttackFx } from './attackFx';
import { createBeams } from './beams';
import { createDecals } from './decals';
import { createFlaskFx } from './flaskFx';
import { createFogGates } from './fogGates';
import { createGroundFx } from './groundFx';
import { createMeleeFx } from './meleeFx';
import type { Particles } from './particles';
import { createTelegraphs } from './telegraphs';

export interface BossFx {
  update(alpha: number, time: number, camera: THREE.Camera): void;
}

export function createBossFx(scene: THREE.Scene, g: Game, particles: Particles): BossFx {
  const ground = createGroundFx(); // what a blow leaves on the ground and sends along it (round 51)
  const telegraphs = createTelegraphs(g, createDecals(scene), ground);
  const beams = createBeams(scene, g);
  const fx = createAttackFx(g, particles, ground);
  const melee = createMeleeFx(g, particles, ground);
  const fog = createFogGates(g, particles);
  const flasks = createFlaskFx(scene, g, particles); // round 29: a flask of lamp oil, in flight and burning
  return {
    update(alpha, time, camera) {
      telegraphs.update(alpha, time);
      beams.update(alpha, time, camera);
      fx.update(alpha);
      melee.update(alpha);
      fog.update(time);
      flasks.update(alpha, time);
    },
  };
}
