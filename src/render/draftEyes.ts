/**
 * The carriage horse's eyes: a faint eldritch magenta glow about each, and the trail they leave as the horse goes. The glow and
 * the trail are halos (halos.ts) at world positions, so a trail stays where the horse has been. The batch hangs under the horse's
 * root, so a hidden mount hides it with the rest. Render only.
 */
import * as THREE from 'three';
import { createHalos } from './halos';
import { ANOMALY } from './palette';

const GLOW = { radius: 0.06, gain: 0.22, flicker: 0.08 } as const; // metres; the share of the colour at its middle; how far it wavers
const TRAIL = { every: 1 / 24, life: 0.4, count: 10, radius: 0.04, gain: 0.1, speed: 0.4 } as const; // a sample each `every` seconds while the horse goes over `speed` m/s; at most `count` an eye, each fading over `life`
const CARRIED = 2.5; // metres an eye cannot cover in one frame on foot: a summon or a teleport, whose trail is let go

interface Sample { at: THREE.Vector3; time: number }

export interface DraftEyes {
  /** The halo batch, for the horse's root to hold. */
  readonly mesh: THREE.Mesh;
  /** This frame's glow and trail about `eyes` (at their world positions), with the horse going at `speed` m/s and shown `fade` (0 to 1: the mount's ghost fade). */
  update(eyes: readonly THREE.Object3D[], time: number, speed: number, fade: number): void;
}

export function createDraftEyes(): DraftEyes {
  const halos = createHalos(2 * (1 + TRAIL.count), 0.5);
  const trails: Sample[][] = [];
  const where = new THREE.Vector3();
  let clock = -Infinity; // the last frame's time
  let sampled = -Infinity; // the last sample's time
  return {
    mesh: halos.mesh,
    update(eyes, time, speed, fade) {
      if (time < clock) { trails.forEach(t => { t.length = 0; }); sampled = -Infinity; } // the clock went back: the trails begin again
      clock = time;
      while (trails.length < eyes.length) trails.push([]);
      const sample = speed > TRAIL.speed && time - sampled >= TRAIL.every;
      if (sample) sampled = time;
      halos.begin();
      eyes.forEach((eye, i) => {
        eye.getWorldPosition(where);
        const trail = trails[i];
        const newest = trail[trail.length - 1];
        if (newest && where.distanceTo(newest.at) > CARRIED) trail.length = 0; // carried, not walked: no trail through the jump
        if (sample) {
          trail.push({ at: where.clone(), time });
          if (trail.length > TRAIL.count) trail.shift();
        }
        while (trail.length && time - trail[0].time > TRAIL.life) trail.shift();
        const wave = 1 + GLOW.flicker * Math.sin(time * (2.1 + 0.6 * i) + 1.7 * i);
        halos.put(where.x, where.y, where.z, GLOW.radius, ANOMALY.magenta, GLOW.gain * wave * fade);
        for (const s of trail) {
          const age = (time - s.time) / TRAIL.life;
          halos.put(s.at.x, s.at.y, s.at.z, TRAIL.radius * (1 - 0.5 * age), ANOMALY.magenta, TRAIL.gain * (1 - age) * (1 - age) * fade);
        }
      });
      halos.end();
    },
  };
}
