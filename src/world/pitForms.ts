/**
 * The shapes a pit room's chasm is cut in (2026-11-27, asked: "all dungeons currently feature an identical large pit hazard, which becomes
 * repetitive"): every pit had been one square hole inside a ledge, the same in the Library's charnel as in Tsath. Now each dungeon cuts its
 * own (data/dungeonTraps.ts `pit`). A form is a few holes, rectangles in the room's own frame given as shares of the inner square the
 * ledge leaves (-1..1 across and along); the holes never touch, so no hole's wall stands in another's mouth (render/siteMeshes.ts `pit`
 * draws each as an open box), and the ledge about them is whole, so every doorway still meets every other on foot. Pure: no Three.js.
 */

import type { PitForm } from '../data/dungeonTraps';

export type { PitForm };

/** A hole: u0, u1 across the room's axis, v0, v1 along it, each a share of the inner square's half (from -1 to 1). */
export type Hole = readonly [u0: number, u1: number, v0: number, v1: number];

export const PIT_FORMS: Readonly<Record<PitForm, readonly Hole[]>> = {
  square: [[-1, 1, -1, 1]], // the old one hole
  grid: [[-1, -0.22, -1, -0.22], [0.22, 1, -1, -0.22], [-1, -0.22, 0.22, 1], [0.22, 1, 0.22, 1]], // four, a cross of floor between them
  trenches: [[-1, 1, -1, -0.34], [-1, 1, 0.34, 1]], // two across the way, a band of floor between
  rifts: [[-1, -0.34, -1, 1], [0.34, 1, -1, 1]], // two along the way, a causeway down the middle
  twin: [[-1, -0.1, -1, -0.1], [0.1, 1, 0.1, 1]], // two squares corner to corner
  slot: [[-1, 1, -0.3, 0.3]], // one trench across the room
  offset: [[-1, 1, 0, 1]], // the far half fallen in
  shaft: [[-0.45, 0.45, -0.45, 0.45]], // a small deep shaft in the middle
  checker: [[-0.28, 0.28, -0.28, 0.28], [-1, -0.6, -1, -0.6], [0.6, 1, -1, -0.6], [-1, -0.6, 0.6, 1], [0.6, 1, 0.6, 1]], // five
  lane: [[-1, 0.2, -1, 1]], // a wide hole, a lane of floor down one side
  ladder: [[-1, 1, -1, -0.62], [-1, 1, -0.3, 0.1], [-1, 1, 0.42, 0.8]], // three rungs across, floor between
  gallery: [[-0.6, 0.6, -1, 1]], // a gallery of a hole down the middle, floor either side
};

/** The holes of a form in room-local metres, the inner square's half being `p`. */
export const pitHoles = (form: PitForm, p: number): Hole[] => PIT_FORMS[form].map(([a, b, c, d]) => [a * p, b * p, c * p, d * p] as const);

/**
 * The floor of the inner square left about a form's holes, as rectangles (u0, u1, v0, v1): the square cut by every hole's edges into a grid
 * of cells, those no hole covers kept, and runs of them along u merged. The ledge round the square is laid apart.
 */
export function pitFloor(form: PitForm, p: number): Hole[] {
  const holes = pitHoles(form, p);
  const cuts = (i: 0 | 2): number[] => [...new Set([-p, p, ...holes.flatMap((h) => [h[i], h[i + 1]])])].sort((a, b) => a - b);
  const [us, vs] = [cuts(0), cuts(2)];
  const out: Hole[] = [];
  for (let j = 0; j < vs.length - 1; j++) {
    let run: [number, number] | null = null;
    for (let i = 0; i < us.length - 1; i++) {
      const [mu, mv] = [(us[i] + us[i + 1]) / 2, (vs[j] + vs[j + 1]) / 2];
      const open = holes.some(([u0, u1, v0, v1]) => mu > u0 && mu < u1 && mv > v0 && mv < v1);
      if (!open) run = run ? [run[0], us[i + 1]] : [us[i], us[i + 1]];
      if ((open || i === us.length - 2) && run) {
        out.push([run[0], run[1], vs[j], vs[j + 1]]);
        run = null;
      }
    }
  }
  return out;
}
