/** Oil burners within the baked lantern housings: a small, warm teardrop, not a bonfire above the cap. */
import * as THREE from 'three';
import { LANTERN_MODELS } from '../world/lanternModels';
import type { Prop } from '../world/props';
import { box, tint } from './meshKit';
import type { SolidPiece } from './propShapes';

/** Geometry stays in the model's local frame until propJob turns and places all of its pieces together. */
export function modelLantern(p: Prop): SolidPiece[] {
  const look = p.set;
  const l = look && LANTERN_MODELS[look.id];
  if (!look || !l || !look.lit) return [];
  const k = look.scale ?? 1;
  const [x, y, z] = l.at;
  const foot = y - l.height / 2;
  const rings = [[0, 0], [0.65, 0.1], [1, 0.32], [0.7, 0.62], [0.24, 0.88], [0, 1]];
  const flame = new THREE.LatheGeometry(rings.map(([r, h]) => new THREE.Vector2(r * l.radius, h * l.height)), 7);
  const pos = flame.getAttribute('position');
  const colors: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const h = pos.getY(i) / l.height;
    const hot = Math.max(0, 1 - Math.abs(h - 0.35) / 0.65);
    colors.push(1, 0.36 + hot * 0.5, 0.07 + hot * 0.32);
  }
  flame.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  flame.translate(x, foot, z).scale(k, k, k);
  const wick = box(l.radius * 0.45, l.height * 0.2, l.radius * 0.45, x, foot - l.height * 0.05, z, [0.09, 0.065, 0.045]).scale(k, k, k);
  const out: SolidPiece[] = [
    { mat: 'stone', geo: wick },
    { mat: 'glow', geo: flame, light: look.lit, at: [x * k, y * k, z * k], halo: l.halo * k, haloGain: 0.36 },
  ];
  if (look.id === 'lightpost') {
    const burner = tint(new THREE.CylinderGeometry(0.075, 0.09, 0.065, 8).translate(x, foot - 0.045, z), [0.34, 0.25, 0.15]).scale(k, k, k);
    out.push({ mat: 'stone', geo: burner });
  }
  return out;
}
