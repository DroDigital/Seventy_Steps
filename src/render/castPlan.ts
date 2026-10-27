/**
 * How a foe's cut-out stands for a light (round 92; render only, pure): the arithmetic the shadow vertex shader
 * (shaders/castSprite.ts) does, written once here where it can be tested, and the size of the shadow a body casts.
 */

import { CAST } from '../data/fxTuning';

const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * How far a cut-out leans back from the light (radians off the vertical) when the light stands at height `sy` (the sine of its
 * elevation, 0 at the horizon and 1 overhead). Standing upright, a cut-out lit from elevation e throws a shadow cot(e) of its height
 * long; leaning back by b it throws cos(e - b) / sin(e) of it, so the lean that makes it `CAST.stretch` is the one that solves that.
 * A low light needs none, and the lean is held to `CAST.lean`.
 */
export function leanOf(sy: number): number {
  const s = Math.min(0.999, Math.max(0, sy));
  return Math.min(CAST.lean, Math.max(0, Math.asin(s) - Math.acos(Math.min(1, CAST.stretch * s))));
}

/** How long a cut-out's shadow is on level ground, in the cut-out's own heights, under a light of height `sy`, once it leans by `leanOf(sy)`. */
export function shadowReach(sy: number): number {
  const s = Math.min(0.999, Math.max(1e-3, sy));
  return Math.cos(Math.asin(s) - leanOf(s)) / s;
}

export interface Loom {
  /** How much taller the shadow is than the body that casts it, and how much broader. */
  tall: number;
  wide: number;
}

/**
 * The shadow of a body `height` metres tall: larger than it by `base`, by more the taller it stands (a horror's shadow is the court's),
 * and by more again in the last phase of its fight (`deep`, 0..1: render/bossPresence.ts).
 */
export function loomOf(height: number, deep = 0, out: Loom = { tall: 1, wide: 1 }): Loom {
  const { base, size, from, to, deep: d, wide } = CAST.loom;
  out.tall = 1 + base + size * smooth(from, to, height) + d * Math.min(1, Math.max(0, deep));
  out.wide = 1 + (out.tall - 1) * wide;
  return out;
}

/** The share of the picture's left and right that the cut-out turns about: 1 where its right is the camera's right, 0 where it is the opposite, through the shape common to both. */
export function turnOf(sideDotRight: number): number {
  return smooth(-CAST.turn, CAST.turn, sideDotRight);
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Where a corner of a body's cut-out stands in the world (what shaders/castSprite.ts's vertex shader does): `origin` is the bottom middle of the
 * picture, `feet` the metres its feet stand above that, `w` and `h` the picture's size, `loom` how much larger the shadow is, `light` the moon's
 * direction (`point` false) or the lantern's or a lamp's place, `back` how far behind the body the cut-out stands, and (`px`, `py`) the corner:
 * px across (-0.5..0.5), py up (0..1).
 */
export function castCorner(
  origin: Vec3,
  feet: number,
  w: number,
  h: number,
  loom: Loom,
  light: Vec3 & { point: boolean },
  back: number,
  right: { x: number; z: number },
  px: number,
  py: number,
): Vec3 {
  const [cw, ch] = [w * loom.wide, h * loom.tall];
  const base = { x: origin.x, y: origin.y + feet, z: origin.z }; // the feet stay where they are
  const to = light.point ? { x: light.x - base.x, y: light.y - (base.y + 0.5 * ch), z: light.z - base.z } : { x: light.x, y: light.y, z: light.z };
  const len = Math.hypot(to.x, to.y + 1e-4, to.z);
  const dir = { x: to.x / len, y: (to.y + 1e-4) / len, z: to.z / len };
  const fl = Math.hypot(dir.x, dir.z);
  const f = fl > 1e-3 ? { x: dir.x / fl, z: dir.z / fl } : { x: -right.z, z: right.x }; // overhead: across the camera
  const lean = leanOf(dir.y);
  const [sin, cos] = [Math.sin(lean), Math.cos(lean)];
  const along = py * ch - feet * loom.tall;
  return {
    x: base.x - f.x * back + f.z * px * cw - f.x * sin * along,
    y: base.y + cos * along,
    z: base.z - f.z * back - f.x * px * cw - f.z * sin * along,
  };
}
