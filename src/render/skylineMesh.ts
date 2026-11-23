/**
 * The far silhouettes' geometry (round 117; render/skyline.ts). An outline was a flat shape triangulated from its edge, so the shader knew
 * nothing of where in the form a pixel lay. Now it is a strip of columns from under its foot to its crest, and every vertex carries the crest
 * above it, the crest's slope, the height of the walls there (which have windows) and the air its layer lies behind: the shader lights each
 * column as the face under that slope, catches the crest's last pixel and puts windows only on walls (render/shaders/skylineFar.ts). A
 * silhouette's back layer (data/farLooks.ts `back`, a paler land behind it) is drawn first in the same strip; render/horizonGlow.ts adds the
 * glow over a town, the veils (the bank of mist at its foot, a belt of cloud) and a lamp, all in one draw.
 */

import * as THREE from 'three';
import { createRng } from '../core/rng';
import { FAR, type FarLook } from '../data/farLooks';
import type { Silhouette } from '../data/skylines';
import { profile, type Profile } from './skylineShapes';

/** One layer of a silhouette: its outline `f`, drawn over [x0, x1] of the silhouette's width, `height` times its height, behind `haze` of air, `z` metres before it (behind: below 0). */
export interface Layer {
  f: Profile;
  x0: number;
  x1: number;
  height: number;
  haze: number;
  z: number;
  columns: number;
}

/** A veil drawn over the outline: the bank of mist at its foot (0) or a belt of cloud across it (1), over a box in the silhouette's units, `z` metres before it. */
export interface Veil {
  type: 0 | 1;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z: number;
}

/** A silhouette's own outline, and its layers: its back layer (if its look has one), then itself. */
export function layersOf(def: Pick<Silhouette, 'kind' | 'width' | 'height' | 'seed'>, look: FarLook): { main: Profile; layers: Layer[] } {
  const aspect = def.width / def.height;
  const main = profile(def.kind, createRng(def.seed), { aspect, trees: look.trees });
  const layers: Layer[] = [];
  const b = look.back;
  if (b) {
    const f = profile(b.kind, createRng(def.seed * 7 + 13), { aspect: (aspect * b.width) / b.height, trees: look.trees });
    layers.push({ f, x0: b.shift - b.width / 2, x1: b.shift + b.width / 2, height: b.height, haze: b.haze, z: -b.depth * def.width, columns: Math.round(FAR.columns[def.kind] * FAR.backColumns * b.width) });
  }
  layers.push({ f: main, x0: -0.5, x1: 0.5, height: 1, haze: 0, z: 0, columns: FAR.columns[def.kind] });
  return { main, layers };
}

/** The veils a silhouette `width` by `height` metres wears with its look: the mist a little before it, the cloud about it. */
export function veilsOf(width: number, height: number, look: FarLook): Veil[] {
  const veils: Veil[] = [];
  if (look.mist > 0) veils.push({ type: 0, x0: -0.8, x1: 0.8, y0: FAR.foot, y1: (look.mistRise / height + FAR.mistShare) * 1.7, z: FAR.mistAhead * width });
  if (look.cloud > 0) veils.push({ type: 1, x0: -0.85, x1: 0.85, y0: look.cloudAt - 0.24, y1: look.cloudAt + 0.24, z: 0 });
  return veils;
}

/** The columns of the layers, back first: `position`, and `aShape` (the crest over the column, its slope, its walls' height, the layer's air); `userData.back` is how many of its indices are the back layers'. */
export function stripGeometry(layers: readonly Layer[]): THREE.BufferGeometry {
  const count = layers.reduce((s, l) => s + (l.columns + 1) * 2, 0);
  const pos = new Float32Array(count * 3);
  const shape = new Float32Array(count * 4);
  const index: number[] = [];
  let v = 0;
  for (const l of layers) {
    const n = l.columns;
    const tops = new Float32Array(n + 1);
    const walls = new Float32Array(n + 1);
    for (let i = 0; i <= n; i++) {
      const u = i / n - 0.5;
      tops[i] = Math.max(0, l.f(u)) * l.height;
      walls[i] = Math.min(tops[i], Math.max(0, l.f.wall?.(u) ?? 0) * l.height);
    }
    const dx = (l.x1 - l.x0) / n;
    for (let i = 0; i <= n; i++) {
      const [a, b] = [Math.max(0, i - 1), Math.min(n, i + 1)];
      const slope = (tops[b] - tops[a]) / (dx * (b - a));
      for (const y of [FAR.foot, tops[i]]) {
        pos.set([l.x0 + i * dx, y, l.z], v * 3);
        shape.set([tops[i], slope, walls[i], l.haze], v * 4);
        v++;
      }
      if (i < n) index.push(v - 2, v, v - 1, v - 1, v, v + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aShape', new THREE.Float32BufferAttribute(shape, 4));
  g.setIndex(index);
  g.userData.back = layers.slice(0, -1).reduce((s, l) => s + l.columns * 6, 0);
  return g;
}
