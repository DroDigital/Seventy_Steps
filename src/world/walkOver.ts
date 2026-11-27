/**
 * What a set piece walked over may stand to (2026-11-27, asked: "right at Bokrug's entrance there is a stone path where the player's legs
 * are clipping through ... make sure similar issues don't occur anywhere else"). A piece set `walk` has no collider, so a body's feet stay
 * on the ground under it: the flags of Bokrug's way in were 48 cm deep, laid on the ground, and their top stood half way up the shins.
 * Now a piece laid on the floor that is walked over is either paving (wide for its depth: flags, decks, tiles, a dais), sunk until its face
 * is a hand's breadth proud of the ground; or clutter (bricks, bones, books, roots), sunk to the ankle, however tall (a piece
 * made solid would add a collider, and the land's plan lays its props, posts and secrets about the colliders it finds). Plants are walked through as the land's bushes are, and anything not laid on the floor (a banner hung, a lily on
 * water, a stair down a bank) is the planner's own. Pure: world/placeKit.ts and world/arenaSet.ts ask it; tests/walkOver.test.ts walks it.
 */

export const WALK_OVER = {
  flush: 0.04, // metres paving's face stands above the ground
  ankle: 0.3, // what clutter is sunk to
  flat: 2.5, // paving is at least this many times as wide (its narrower way) as it is deep
  laid: 0.2, // metres off the floor a piece is set at, at most, to count as laid on it
} as const;

/** Things that grow: walked through, as the open world's bushes and reeds are. */
const SOFT = /lily|reed|bush|grass|fern|weed|flower|kelp|moss_tuft/;

/** What is laid to be walked on, whatever its depth (the Black Man's flat stepping stones down his way). */
const PAVING = /floor|flat|tile|deck|dais|pallet|plank|slab|flag(?!_)|paving/;

/** Whether a model or kit is a flight of steps (a stair on flat ground is sunk to the ankle as clutter is; on a bank it is its planner's). */
export const isStair = (id: string): boolean => /stair|steps/.test(id);

/**
 * How a piece `id` set at `foot` metres off the floor, `h` tall and `w` by `d` (half extents) is to be walked over: `drop`, metres it
 * is lowered (0 or less), and `walk`, whether it is still walked through (false: it stands, a solid thing).
 */
export function walkOver(id: string, w: number, d: number, h: number, foot: number): { drop: number; walk: boolean } {
  if (SOFT.test(id) || Math.abs(foot) > WALK_OVER.laid) return { drop: 0, walk: true };
  const top = foot + h;
  const paving = !isStair(id) && (PAVING.test(id) || 2 * Math.min(w, d) >= WALK_OVER.flat * h);
  if (paving) return { drop: Math.min(0, WALK_OVER.flush - top), walk: true };
  return { drop: Math.min(0, WALK_OVER.ankle - top), walk: true };
}
