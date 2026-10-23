/** Baked lanterns' burners, measured in the models' own frame. Shared by their flames, light and moth haunts. */
import type { V3 } from '../core/geom';
import type { Prop } from './props';

interface LanternModel {
  at: readonly [number, number, number];
  radius: number;
  height: number;
  halo: number;
}

export const LANTERN_MODELS: Readonly<Record<string, LanternModel>> = {
  lightpost: { at: [0, 3.12, 0.384], radius: 0.055, height: 0.24, halo: 0.5 },
  lantern: { at: [-0.0025, 0.254, 0.0025], radius: 0.022, height: 0.095, halo: 0.24 },
};

/** The flame's centre in world space, with the same turn, scale and ground inset as propJob. */
export function lanternModelFlame(p: Prop): V3 | null {
  const l = p.set?.lit && LANTERN_MODELS[p.set.id];
  if (!l) return null;
  const k = p.set!.scale ?? 1;
  const [x, y, z] = l.at.map((v) => v * k);
  const [s, c] = [Math.sin(p.yaw), Math.cos(p.yaw)];
  return { x: p.x + x * c + z * s, y: p.y - 0.15 + y, z: p.z - x * s + z * c };
}
