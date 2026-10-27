/**
 * A note's paper burning away (round 89), as its page is put away: the leaf lifts, curls and flutters harder as a burn crosses
 * it from its rim to its middle (render/paperFlow.ts), flaring where the front is and leaving ash behind it; embers and flakes of
 * ash stream off the front; then the ash is dithered away (the world material's ordered dither, `uGhost`) and nothing is left.
 * The sound is the burning of paper (data/paperSounds.ts).
 */

import { createRng, type Rng } from '../core/rng';
import { PAPER, PAPER_LOOK } from '../data/paperTuning';
import { PAPER_BURN } from '../data/paperSounds';
import { shed, burn } from './paperFire';
import { burnAt } from './paperFlow';
import { disposeLeaf, flames, place, worldAt, type Leaf, type PaperCtx } from './paperStand';

export interface Burning {
  t: number; // seconds since it began
  readonly leaf: Leaf;
  readonly rng: Rng;
  carry: number; // embers owed
  wisps: number; // flames and smoke owed
}

const RANGE = 22;
const smooth = (x: number): number => {
  const k = Math.min(1, Math.max(0, x));
  return k * k * (3 - 2 * k);
};

const tip = { x: 0, y: 0, z: 0 };

/** Flames along the front of the burn where it has got to on the leaf: every few vertices of the band it is in. */
function frontFlames(ctx: PaperCtx, leaf: Leaf, front: number, gain: number): void {
  const sheet = leaf.sheets[0];
  for (let v = 0, k = 0; v < sheet.count && k < 22; v++) {
    if (Math.abs(sheet.inner[v] - front) > 0.07 || (v * 7 + Math.floor(leaf.time * 9)) % 3) continue; // (a third of them, a different third as the flames flicker)
    worldAt(leaf, 0, v, tip);
    ctx.flames.put(tip.x, tip.y - 0.03, tip.z, PAPER.flame[0] * (0.8 + 0.4 * ((v * 13) % 5) / 5), (v * 0.173) % 1, v % 2 ? 1 : -1, v % 4 === 1 ? 'violet' : 'warm', gain);
    k++;
  }
}

/** Begins to burn a leaf away; `scene` is told nothing: the leaf is already in it. */
export function startBurn(ctx: PaperCtx, leaf: Leaf, seed: number): Burning {
  const p = leaf.root.position;
  ctx.fx.audio.recipe('paper:burn', PAPER_BURN, { at: { x: p.x, y: p.y + PAPER.hover, z: p.z }, range: RANGE, gain: 0.55, vary: 0.5, fit: PAPER.burn.total });
  return { t: 0, leaf, rng: createRng(seed ^ 0x2545f491), carry: 0, wisps: 0 };
}

/** Moves the burn on by `dt` seconds; true once nothing of the leaf is left and it has been taken out of the scene. */
export function stepBurn(ctx: PaperCtx, b: Burning, dt: number): boolean {
  const { leaf, rng } = b;
  b.t += dt;
  const B = PAPER.burn;
  const heat = burnAt(b.t);
  place(leaf, leaf.time + dt, leaf.look, b.t, heat);
  const ghost = smooth((b.t - B.lag) / B.dither);
  leaf.mat.uniforms.uGhost.value = ghost;
  if (heat.front < 1.35) { // the embers and the flakes it sheds, off where it is burning
    b.carry += 150 * dt;
    const n = Math.floor(b.carry);
    b.carry -= n;
    shed(ctx.fx, leaf, heat.front, n, ctx.ground, rng);
  }
  if (ghost < 0.8) { // and the flames and smoke of the leaf itself
    b.wisps += (heat.front < 1.1 ? 26 : 9) * dt;
    const n = Math.floor(b.wisps);
    b.wisps -= n;
    burn(ctx.fx, leaf, n, n > 0 && rng() < 0.4 ? 1 : 0, n > 0 && rng() < 0.5 ? 1 : 0, rng);
  }
  flames(ctx.flames, leaf, leaf.time, (1 - ghost) * (1 - smooth(heat.front / 0.35))); // the flames of the rim go out as the front passes them
  if (ghost < 0.9) frontFlames(ctx, leaf, heat.front, 1 - ghost);
  const p = leaf.root.position;
  const lit = (1 - ghost) * (0.5 + heat.flare * 0.5) * (b.t < B.front + 0.4 ? 1 : 0.4);
  ctx.halos.put(p.x, p.y + PAPER.hover + B.rise * Math.min(1, b.t / B.total), p.z, 1.5, PAPER_LOOK.flame, PAPER.halo * 2 * lit);
  if (b.t < B.total && ghost < 1) return false;
  disposeLeaf(ctx.scene, leaf);
  return true;
}
