/**
 * The pieces of an arena's set that are built, not baked (round 61; render/setShapes.ts draws them): their sizes, so the simulation
 * can give each its collider without a renderer. `w` and `d` half extents (a round one's radius is `w`), `h` its height. Data only.
 */

export interface SetKit {
  w: number;
  d: number;
  h: number;
  round?: boolean;
  walk?: boolean; // flat, laid on the ground: no collider
}

export const SET_KITS: Readonly<Record<string, SetKit>> = {
  totem: { w: 0.7, d: 0.7, h: 4.5, round: true },
  skull_pole: { w: 0.25, d: 0.25, h: 2.4, round: true },
  horn_tree: { w: 0.55, d: 0.55, h: 8, round: true },
  pylon: { w: 1.7, d: 1.7, h: 9 },
  sphinx: { w: 1.1, d: 2.4, h: 2.8 },
  trilith: { w: 1.9, d: 0.8, h: 4.2 }, // a circle's: its posts and lintel one block to the eye (a collider of the whole breadth, so a cutscene's lens is never set among its posts)
  ziggurat: { w: 5, d: 5, h: 4.4 },
  slab: { w: 2.4, d: 0.7, h: 8 },
  hexped: { w: 1.3, d: 1.3, h: 1.4, round: true },
  idol: { w: 2.2, d: 2.2, h: 6, round: true },
  pipes: { w: 1.5, d: 1.5, h: 6, round: true },
  banner: { w: 1.1, d: 0.3, h: 5.5, round: true },
  meteor: { w: 1.6, d: 1.6, h: 2, round: true },
};
