/**
 * The shape of a bolt of lightning (round 52; pure): a jagged line from the cloud to the ground that wanders and comes back to its mark,
 * and a few forks that leave it part of the way down and give out before they land. From a random stream, so a test sees the same bolt.
 */

import type { V3 } from '../core/geom';

export interface BoltPath {
  main: V3[]; // from the sky to the ground, in order
  forks: V3[][]; // each begins on the main line
}

export interface BoltShape {
  segments?: number; // in the main line
  sway?: number; // metres a segment may wander sideways, at the most
  forks?: number; // at the most
}

export function boltPath(top: V3, ground: V3, rng: () => number, { segments = 14, sway = 5, forks = 3 }: BoltShape = {}): BoltPath {
  const main: V3[] = [];
  let [ox, oz] = [0, 0];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const calm = i === 0 || i === segments ? 0 : (1 - t) ** 0.6; // it leaves the cloud at its point and settles on its mark: the first and the last are exactly theirs
    ox = ox * 0.55 + (rng() - 0.5) * sway * 2 * calm;
    oz = oz * 0.55 + (rng() - 0.5) * sway * 2 * calm;
    main.push({ x: top.x + (ground.x - top.x) * t + (i === 0 || i === segments ? 0 : ox), y: top.y + (ground.y - top.y) * t, z: top.z + (ground.z - top.z) * t + (i === 0 || i === segments ? 0 : oz) });
  }
  const branches: V3[][] = [];
  const starts = new Set<number>();
  for (let k = 0; k < forks; k++) starts.add(Math.floor(segments * (0.2 + 0.55 * rng())));
  for (const from of starts) {
    const a = rng() * Math.PI * 2;
    const lean = 0.25 + 0.5 * rng(); // how far out it strikes, against how far down
    const n = 3 + Math.floor(rng() * 4);
    const drop = (main[from]!.y - ground.y) * (0.25 + 0.3 * rng());
    const fork: V3[] = [{ ...main[from]! }];
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      fork.push({
        x: main[from]!.x + Math.sin(a) * drop * lean * t + (rng() - 0.5) * sway * 0.5,
        y: main[from]!.y - drop * t,
        z: main[from]!.z + Math.cos(a) * drop * lean * t + (rng() - 0.5) * sway * 0.5,
      });
    }
    branches.push(fork);
  }
  return { main, forks: branches };
}
