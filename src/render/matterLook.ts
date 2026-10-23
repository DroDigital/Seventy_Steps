/**
 * What the new attacks' ground is made of (round 70): a flame is flame, a falling star is pale gold, lightning is the storm's blue, and
 * only a tentacle keeps the horror's own colours. The telegraph, the burst and the sound of marked ground that has a `look` (data/moves.ts)
 * all read it, so a conflagration is orange under every horror that kindles one. Render only.
 */

import type { MarkLook } from '../data/moves';
import { ELEMENTS } from './fxKit';
import type { AttackLook } from './attackLook';
import type { Rgb } from './palette';
import { STORM_LOOK } from './skyStrikeFx';

interface Matter {
  motif: AttackLook['motif'];
  colours?: Partial<Pick<AttackLook, 'danger' | 'line' | 'ring' | 'core' | 'ember'>>;
  sound: string; // a recorded set (data/samples.ts) laid under the burst
  gain: number;
}

const FLAME: Rgb = [1, 0.5, 0.12];
const GOLD: Rgb = [1, 0.86, 0.5];

export const MATTER: Readonly<Record<MarkLook, Matter>> = {
  tentacle: { motif: 'root', sound: 'slime', gain: 0.55 },
  star: { motif: 'star', colours: { danger: GOLD, line: GOLD, ring: [1, 0.95, 0.75], core: [1, 1, 0.92], ember: [0.5, 0.3, 0.1] }, sound: 'strike', gain: 0.5 },
  flame: { motif: 'flame', colours: { danger: FLAME, line: [1, 0.78, 0.3], ring: [1, 0.62, 0.2], core: [1, 0.96, 0.75], ember: [0.5, 0.1, 0.02] }, sound: 'gust', gain: 0.5 },
  bolt: { motif: 'star', colours: { danger: STORM_LOOK.danger, line: STORM_LOOK.line, ring: STORM_LOOK.ring, core: STORM_LOOK.core, ember: STORM_LOOK.ember }, sound: 'thunder', gain: 0.6 },
};

/** `base` (the horror's look) as this ground would have it: its element and, but for a tentacle's, its colours. */
export function matterLook(base: AttackLook, k: MarkLook | undefined): AttackLook {
  if (!k) return base;
  const m = MATTER[k];
  return { ...base, motif: m.motif, ...m.colours };
}

export const matterElement = (base: AttackLook, k: MarkLook | undefined) => ELEMENTS[matterLook(base, k).motif];

/** Each kind of cloud's colours: its billows at birth and at death, and the motes that drift in it. */
export const CLOUDS: Readonly<Record<'toxic' | 'dream', { billow: readonly [Rgb, Rgb]; mote: Rgb }>> = {
  toxic: { billow: [[0.66, 0.8, 0.2], [0.28, 0.4, 0.1]], mote: [0.9, 1, 0.45] },
  dream: { billow: [[0.56, 0.38, 0.88], [0.18, 0.12, 0.38]], mote: [0.92, 0.84, 1] },
};
