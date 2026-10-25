/**
 * What a creature is made of, as a colour (round 78; render only): the flesh, hide, shell or stone of its drawing
 * (data/reviewedLook.ts, measured from the art), lifted so a clot of a dark body shows on dark ground. A blow
 * throws it off as chunks and spray; every form threw the same grey before. A form with no drawing of its own
 * (the drawn fallback sprites, a colossus built in code) has none, and its blows keep the grey.
 */

import type { Entity } from '../core/ecs';
import { REVIEWED_MATTER } from '../data/reviewedLook';
import type { Game } from '../systems/components';
import { MODEL_PREFIX } from '../systems/creatures';
import type { Rgb } from './palette';

const LIFT = { scale: 0.85, floor: 0.1 } as const;

/** The colour a creature of model `model` (`creature:<id>[#variant]`) is made of, or undefined. */
export function matterColour(model: string | undefined): Rgb | undefined {
  if (!model?.startsWith(MODEL_PREFIX)) return undefined;
  const found = REVIEWED_MATTER[model.slice(MODEL_PREFIX.length)];
  return found && [found[0] * LIFT.scale + LIFT.floor, found[1] * LIFT.scale + LIFT.floor, found[2] * LIFT.scale + LIFT.floor];
}

export const matterOf = (g: Game, id: Entity): Rgb | undefined => matterColour(g.ecs.c.model.get(id));
