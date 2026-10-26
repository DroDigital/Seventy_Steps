/** Oil burners within the baked lantern housings: a small, warm flame, not a bonfire above the cap (round 87: the pixel flame of a lamp, sized to the housing, and no teardrop of its own). */
import * as THREE from 'three';
import { LIGHTS } from '../data/tuning';
import { LANTERN_MODELS } from '../world/lanternModels';
import type { Prop } from '../world/props';
import { box, tint } from './meshKit';
import { fireSpot } from './fireSpot';
import type { Piece } from './propShapes';

/** Geometry stays in the model's local frame until propJob turns and places all of its pieces together. */
export function modelLantern(p: Prop): Piece[] {
  const look = p.set;
  const l = look && LANTERN_MODELS[look.id];
  if (!look || !l || !look.lit) return [];
  const k = look.scale ?? 1;
  const [x, y, z] = l.at;
  const foot = y - l.height / 2;
  const wick = box(l.radius * 0.45, l.height * 0.2, l.radius * 0.45, x, foot - l.height * 0.05, z, [0.09, 0.065, 0.045]).scale(k, k, k);
  const tall = LIGHTS.flames[look.lit]?.height ?? 0.22; // (the flame is as tall as the housing's flame was: the light at its middle, the pixel flame's foot on the wick)
  const out: Piece[] = [
    { mat: 'stone', geo: wick },
    { mat: 'glow', ...fireSpot(look.lit, [x * k, foot * k, z * k], (l.height * k) / tall, y * k), halo: l.halo * k, haloGain: 0.36 },
  ];
  if (look.id === 'lightpost') {
    const burner = tint(new THREE.CylinderGeometry(0.075, 0.09, 0.065, 8).translate(x, foot - 0.045, z), [0.34, 0.25, 0.15]).scale(k, k, k);
    out.push({ mat: 'stone', geo: burner });
  }
  return out;
}
