/**
 * FX controller hook (spec §3A): each frame the investigator's sanity and the nearest anomaly
 * (glowing horrors, dropped Echoes, shown hidden-layer stone) fill the FxState, and a band change
 * for the worse sends a pulse of warp. main.ts turns the state into shader uniforms and audio
 * detune/distortion (`computeFx` → `update*Uniforms`, render/audio/). Pure: no Three.js.
 */

import { dist3, type V3 } from '../core/geom';
import { SHOCK } from '../data/dreadPicture';
import { FX } from '../data/tuning';
import { isAbsent, type Game } from '../systems/components';
import { bandIndex } from '../systems/sanity';
import { anomalyProximity, type FxState } from './fx';
import { createPressure } from './pressure';
import { DREAD_AIR } from './shock';

/** anomalyProximity of the nearest anomaly-coloured thing to `from` (the camera). */
export function nearestAnomaly(g: Game, from: V3): number {
  const { dread, drop, piece, layer, transform } = g.ecs.c;
  let best = 0;
  const near = (id: number): void => {
    const p = transform.get(id)?.pos;
    if (p) best = Math.max(best, anomalyProximity(dist3(from, p)));
  };
  for (const [id, d] of dread) if (d.glow && !isAbsent(g, id)) near(id);
  for (const id of drop.keys()) near(id);
  for (const id of piece.keys()) if (layer.get(id)?.shown) near(id);
  for (const [id, h] of g.ecs.c.hazard) { // round 70: a bank of dream (the hallucinogenic cloud) brings the wrong stars and the whispers down about whoever stands in it
    const p = h.cloud === 'dream' ? transform.get(id)?.pos : undefined;
    if (p) best = Math.max(best, Math.min(1, Math.max(0, 1 - Math.hypot(from.x - p.x, from.z - p.z) / (h.radius * 1.4))) * Math.min(1, h.life / 40));
  }
  return best;
}

export interface FxController {
  /** Fills `state` for this frame: `seconds` is render time, `camera` the lens position. */
  update(state: FxState, camera: V3, seconds: number): void;
}

export function createFxController(g: Game): FxController {
  let worse = false;
  let jolted = false; // round 80: a sudden large loss within a band sends a ring too, at half the strength
  let pulseAt = -Infinity;
  let scale = 1; // the share of a full ring the pulse now is
  const pressure = createPressure(g);
  g.events.on('SanityBandChanged', ({ from, to }) => void (worse ||= bandIndex(to) > bandIndex(from)));
  g.events.on('SanityLost', ({ amount }) => void (jolted ||= amount >= SHOCK.from));
  return {
    update(state, camera, seconds) {
      if (worse || jolted) [pulseAt, scale, worse, jolted] = [seconds, worse ? 1 : SHOCK.ringScale, false, false];
      state.pressure = pressure.update(seconds);
      DREAD_AIR.cap = Math.min(1, Math.max(0, state.cap)); // the sound of the dread keeps to the FX intensity too (render/shock.ts)
      state.pulseScale = scale;
      state.sanity = g.mind.sanity;
      state.anomalyProximity = nearestAnomaly(g, camera);
      state.pulse = Math.max(0, 1 - (seconds - pulseAt) / FX.pulseSeconds);
      state.time = seconds;
    },
  };
}
