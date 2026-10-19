/**
 * What the seat back hides of the driver's lantern (round 57). The lantern hangs at the driver's hip, in front of the seat back, and
 * the follow camera hangs behind it: the back (a black leather panel over a board, one slab from the deck to the top of the cushions'
 * back) stands between the two, but the lantern's halo is drawn toward the eye so the surface it sits on does not cut it (halos.ts),
 * and its light is a point's, so both came through. The slab is a thin box in the carriage's own frame; `slabCover` says how much of
 * a line from `eye` to `lamp` it takes (1 where it crosses the slab, falling to 0 a little outside its edge), the halo is drawn by what
 * is left, and the world and sprite shaders take the lantern's light off what lies behind it (shaders/shadow.ts, `lanternSlab`).
 */
import type { V3 } from '../core/geom';

/** A thin upright slab: `halfX` either side of the middle, `y0` to `y1` high, its middle plane at `z` (all in the carriage's frame). */
export interface Slab { halfX: number; y0: number; y1: number; z: number }

/** The seat back of the chariots: the board below the black leather back, from the deck to the top (mountCarriage.ts builds both). */
export const SEAT_BACK: Slab = Object.freeze({ halfX: 0.66, y0: 0.855, y1: 1.79, z: -0.2 });

const smooth = (t: number): number => { const c = Math.min(1, Math.max(0, t)); return c * c * (3 - 2 * c); };

/** How much of the light at `lamp` the slab takes from `eye` (both in the slab's frame): 1 behind it, 0 clear of it, soft over `soft` metres past its edge. */
export function slabCover(slab: Slab, eye: V3, lamp: V3, soft = 0.3): number {
  const [da, db] = [eye.z - slab.z, lamp.z - slab.z];
  if (da * db >= 0) return 0; // both on one side of it: nothing between
  const t = da / (da - db);
  const [x, y] = [eye.x + (lamp.x - eye.x) * t, eye.y + (lamp.y - eye.y) * t];
  const outside = Math.hypot(Math.max(Math.abs(x) - slab.halfX, 0), Math.max(slab.y0 - y, y - slab.y1, 0));
  return 1 - smooth(outside / soft);
}
