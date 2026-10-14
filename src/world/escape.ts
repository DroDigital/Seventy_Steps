/**
 * Whether a body can walk out of where it stands (round 49: two foes stood inside a ruin whose four walls met, and the
 * investigator could not come in to them; four farmyards were shut by their own house and barn). A search over a grid of
 * `step` metres from (x, z), farthest first, satisfied once it has come `reach` metres from where it began: open ground is
 * crossed in about `reach / step` cells, a walled pocket is explored whole, and is small. `blocked` says whether a body
 * cannot stand at a point. Pure.
 */

export const ESCAPE_REACH = 20; // metres out that count as being out
export const ESCAPE_STEP = 0.6; // metres between the points tried (less than a wall is thick, with a body's width round it)

const DIRS: readonly (readonly [number, number])[] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/** How far the search came: out (it reached `reach` metres), or the `cells` of the pocket it was shut into. */
export function walkOut(blocked: (x: number, z: number) => boolean, x: number, z: number, reach = ESCAPE_REACH, step = ESCAPE_STEP): { out: boolean; cells: number } {
  const key = (i: number, j: number): number => i * 100003 + j;
  const seen = new Set<number>([key(0, 0)]);
  const stack: [number, number][] = [[0, 0]];
  while (stack.length) {
    const [i, j] = stack.pop()!;
    if (Math.hypot(i, j) * step >= reach) return { out: true, cells: seen.size };
    const next: [number, number][] = [];
    for (const [a, b] of DIRS) if (!seen.has(key(i + a, j + b))) next.push([i + a, j + b]);
    next.sort((p, q) => Math.hypot(p[0], p[1]) - Math.hypot(q[0], q[1])); // the farthest is pushed last, and so tried first
    for (const [a, b] of next) {
      seen.add(key(a, b));
      if (!blocked(x + a * step, z + b * step)) stack.push([a, b]);
    }
  }
  return { out: false, cells: seen.size };
}

export const escapes = (blocked: (x: number, z: number) => boolean, x: number, z: number, reach = ESCAPE_REACH, step = ESCAPE_STEP): boolean => walkOut(blocked, x, z, reach, step).out;
