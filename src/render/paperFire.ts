/**
 * The fire of a note's burning paper (round 89), as particles: licks of flame off its rim, orange at the heart and violet at the
 * tips; sparks that rise and go out; smoke; and, as it burns away, a stream of embers and flakes of ash off the front of the burn.
 * Render only: render/paperViews.ts and render/paperBurn.ts ask for them, by how many.
 */

import { PAPER, PAPER_LOOK } from '../data/paperTuning';
import { worldAt, type Leaf, type PaperFx } from './paperStand';

const at = { x: 0, y: 0, z: 0 };
const pick = (leaf: Leaf, rnd: () => number): void => {
  const sheet = rnd() < 0.7 ? 0 : 1 + Math.floor(rnd() * PAPER.scraps);
  const rim = leaf.sheets[sheet].rim;
  worldAt(leaf, sheet, rim[Math.floor(rnd() * rim.length)], at);
};

/** A lick of flame, a spark or a thread of smoke from the rim of a standing leaf: `n` of each kind, drawn from `rnd`. */
export function burn(fx: PaperFx, leaf: Leaf, flames: number, sparks: number, smoke: number, rnd: () => number = Math.random): void {
  for (let i = 0; i < flames; i++) {
    pick(leaf, rnd);
    fx.particles.spawn({ x: at.x, y: at.y, z: at.z, vx: (rnd() - 0.5) * 0.18, vy: 0.45 + 0.4 * rnd(), vz: (rnd() - 0.5) * 0.18, life: 0.4 + 0.35 * rnd(), size: 0.13 + 0.1 * rnd(), grow: 0.4, color: rnd() < 0.3 ? PAPER_LOOK.heart : PAPER_LOOK.flame, colorEnd: PAPER_LOOK.tip, alpha: 0.8, glow: true, drag: 1.3, shape: 'wisp' });
  }
  for (let i = 0; i < sparks; i++) {
    pick(leaf, rnd);
    fx.particles.spawn({ x: at.x, y: at.y, z: at.z, vx: (rnd() - 0.5) * 0.5, vy: 0.5 + 0.6 * rnd(), vz: (rnd() - 0.5) * 0.5, life: 0.9 + 0.9 * rnd(), size: 0.045 + 0.03 * rnd(), color: PAPER_LOOK.flame, colorEnd: PAPER_LOOK.tip, alpha: 0.95, glow: true, gravity: -0.25, drag: 0.5, shape: 'spark', spin: (rnd() - 0.5) * 6 });
  }
  for (let i = 0; i < smoke; i++) {
    pick(leaf, rnd);
    fx.particles.spawn({ x: at.x, y: at.y + 0.05, z: at.z, vx: (rnd() - 0.5) * 0.12, vy: 0.22 + 0.2 * rnd(), vz: (rnd() - 0.5) * 0.12, life: 1.6 + 0.8 * rnd(), size: 0.1 + 0.06 * rnd(), grow: 2.6, color: PAPER_LOOK.ash, alpha: 0.2, drag: 0.7, shape: 'puff', thick: rnd() * 0.99 });
  }
}

/** What a burning leaf sheds from where the burn has reached: embers that rise, flakes of ash that fall, from `n` places on its middle sheet, and a lick of flame from each. */
export function shed(fx: PaperFx, leaf: Leaf, front: number, n: number, ground: (x: number, z: number) => number, rnd: () => number = Math.random): void {
  const sheet = leaf.sheets[0];
  for (let tries = 0, got = 0; tries < n * 4 && got < n; tries++) {
    const v = Math.floor(rnd() * sheet.count);
    if (Math.abs(front - sheet.inner[v]) > 0.14) continue; // (where the front is)
    got++;
    worldAt(leaf, 0, v, at);
    fx.particles.spawn({ x: at.x, y: at.y, z: at.z, vx: (rnd() - 0.5) * 0.5, vy: 0.5 + 0.9 * rnd(), vz: (rnd() - 0.5) * 0.5, life: 1 + 1.2 * rnd(), size: 0.05 + 0.04 * rnd(), color: PAPER_LOOK.heart, colorEnd: PAPER_LOOK.tip, alpha: 1, glow: true, gravity: -0.3, drag: 0.6, shape: 'spark', spin: (rnd() - 0.5) * 8 });
    fx.particles.spawn({ x: at.x, y: at.y, z: at.z, vx: (rnd() - 0.5) * 0.3, vy: 0.2 + 0.4 * rnd(), vz: (rnd() - 0.5) * 0.3, life: 0.45 + 0.4 * rnd(), size: 0.16 + 0.1 * rnd(), grow: 0.5, color: PAPER_LOOK.flame, colorEnd: PAPER_LOOK.tip, alpha: 0.75, glow: true, drag: 1.2, shape: 'wisp' });
    if (rnd() < 0.6) fx.particles.spawn({ x: at.x, y: at.y, z: at.z, vx: (rnd() - 0.5) * 0.4, vy: 0.1, vz: (rnd() - 0.5) * 0.4, life: 2 + 1.2 * rnd(), size: 0.035 + 0.03 * rnd(), color: PAPER_LOOK.ash, alpha: 0.7, gravity: 0.35, drag: 0.8, shape: 'shard', spin: (rnd() - 0.5) * 5, floor: ground(at.x, at.z) });
  }
}
