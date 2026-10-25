/**
 * How a drawn creature comes and goes and wears its wounds (round 78; render/creatureFx.ts,
 * shaders/spriteFx.ts). Nothing in the recorded art is changed: its own texels are taken away, in an
 * order and a style, and a wound is a dark wet patch laid over the pixels it falls on. Data only.
 */

import type { EntityDef } from './schema';

/** The styles the sprite shader knows, by the number it is told (shaders/spriteFx.ts reads them as `style`). */
export const FX_STYLE = { none: 0, crumble: 1, burn: 2, melt: 3, shatter: 4, rise: 5 } as const;
export type FxStyle = keyof typeof FX_STYLE;

/** What a death is by the matter of the body: the sea's and the flesh's melt into ichor, bone, stone and sand fall as dust, soot and rust burn away, and what is not of this world goes into the starlight. */
const BY_PALETTE: Readonly<Record<string, FxStyle>> = {
  sea: 'melt', ichor: 'melt', rubber: 'melt', flesh: 'melt', fungus: 'melt', mold: 'melt',
  bone: 'crumble', pallid: 'crumble', sand: 'crumble', stone: 'crumble',
  charcoal: 'burn', rust: 'burn',
};

export function deathStyle(def: Pick<EntityDef, 'tier' | 'sprite' | 'assembly'>): FxStyle {
  if (def.tier === 'great_old_one' || def.tier === 'outer_god') return 'shatter';
  if (def.sprite?.silhouette === 'spectre' || def.sprite?.outside) return 'shatter';
  return BY_PALETTE[def.sprite?.palette ?? def.assembly?.palette ?? 'flesh'] ?? 'crumble';
}

export const CREATURE_FX = {
  deathHold: 0.08, // the share of the death move the body keeps whole (the blow's last frame) before it begins to go
  emerge: 0.9, // seconds an ambusher or a burrower takes to rise out of the ground it lay hidden under
  swap: 0.75, // seconds a creature takes to form again as its other self (the eldritch variant of a failing mind)
  woundMetres: 0.55, // how far about the wound the flash of a blow reaches
  woundSeconds: 0.35, // how long a blow's local flash is held (the whole body takes a fifth of it besides: FEEDBACK.flashLevel)
  stains: 5, // the most dark patches a body shows of its wounds, all at no health: they come as it is hurt
  stainFrom: 0.12, // the share of health lost before the first shows
} as const;
