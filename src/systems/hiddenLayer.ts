/**
 * HiddenLayer hook (spec §3A): eldritch geometry, bridges and doors — and a few creatures, like the
 * Being from Beyond — exist only for the enlightened: while insight ≥ minInsight and the sanity
 * band lies wholly at or below maxSanity (a band floor, so the band's hysteresis carries over).
 * It listens for band and insight changes. Kadath's door waits instead on the waking world's seals
 * (`minSeals`, seals.ts). A hidden piece's colliders leave the world (and its seal,
 * the wall a hidden door opens or the edge of the chasm a hidden bridge spans, stands); a hidden
 * creature is absent (`isAbsent`): it neither acts nor collides, and nothing can see or touch it.
 */

import type { Entity } from '../core/ecs';
import type { HiddenPieceDef } from '../data/arena';
import { PASSAGE } from '../data/tuning';
import { pieceColliders } from '../world/arena';
import type { Game, Layer, Mind } from './components';
import { settle } from './passages';
import { bandCeiling } from './sanity';
import { isFound } from './found';
import { sealsBroken } from './sealCount';

/** Whether a hidden layer shows to a mind with this insight and band, with `seals` of the waking world broken and the horrors `found` (a house's gate, round 63) said by the predicate. */
export function layerShown(m: Mind, l: Pick<Layer, 'minInsight' | 'maxSanity' | 'minSeals' | 'minFound'>, seals = 0, found: (boss: string) => boolean = () => false): boolean {
  return (
    (l.minInsight === undefined || m.insight >= l.minInsight) &&
    (l.maxSanity === undefined || bandCeiling(m.band) <= l.maxSanity) &&
    (l.minSeals === undefined || seals >= l.minSeals) &&
    (l.minFound === undefined || found(l.minFound))
  );
}

/** A creature leaving the world forgets its fight: no move, no target. */
function quiet(g: Game, id: Entity): void {
  const a = g.ecs.c.actor.get(id);
  if (a) Object.assign(a, { move: null, frame: 0, hitstop: 0, frozen: false, guard: false });
  const br = g.ecs.c.brain.get(id);
  if (br) Object.assign(br, { state: 'idle', target: null, lost: 0, aware: 0, last: null });
}

/** Shows or hides one layered entity to match the mind. A passage that is shown stays shut until it is approached (passages.ts). */
export function applyLayer(g: Game, id: Entity): void {
  const l = g.ecs.c.layer.get(id)!;
  const shown = layerShown(g.mind, l, l.minSeals === undefined ? 0 : sealsBroken(g), (boss) => isFound(g, boss));
  const piece = g.ecs.c.piece.get(id);
  if (shown !== l.shown) {
    l.shown = shown;
    l.open = shown && !piece?.def.seal ? 1 : 0; // a piece with no seal has nothing to open; a passage begins shut, and a hidden one is shut again
    if (!shown) quiet(g, id);
  }
  settle(g, id);
}

/** Puts an entity on a hidden layer, hiding it at once if the mind cannot see it. */
export function addLayer(g: Game, id: Entity, hidden: { minInsight?: number; maxSanity?: number; minSeals?: number; minFound?: string }): void {
  g.ecs.c.layer.set(id, { ...hidden, shown: true, open: 1 });
  applyLayer(g, id);
}

/** Hidden-layer geometry: its colliders join the world, switched on and off with the layer (its seal's the other way round). */
export function spawnPiece(g: Game, def: HiddenPieceDef): Entity {
  const e = g.ecs.spawn();
  const pos = { x: def.x, y: g.world.ground(def.x, def.z), z: def.z };
  g.ecs.c.transform.set(e, { pos, prev: { ...pos }, yaw: 0, prevYaw: 0 });
  const colliders = pieceColliders(def);
  const seal = def.seal ? pieceColliders({ ...def, boxes: def.seal.boxes }) : [];
  if (def.seal?.look === 'none') for (const c of seal) c.fall = true; // a hidden bridge's chasm: the investigator falls, a foe is stopped
  g.world.colliders.push(...colliders, ...seal);
  for (const c of seal) g.world.off.add(c); // a fresh layer counts as shown until addLayer settles it
  g.ecs.c.piece.set(e, { def, colliders, seal });
  addLayer(g, e, { minInsight: def.minInsight, maxSanity: def.maxSanity, minSeals: def.minSeals, minFound: def.minFound });
  const me = g.ecs.c.transform.get(g.player?.id)?.pos; // one a body stands in when the world is made (a load, a respawn) is not shut on them
  const layer = g.ecs.c.layer.get(e)!;
  if (def.seal && layer.shown) {
    layer.open = me && Math.hypot(me.x - def.x, me.z - def.z) < PASSAGE.stood ? 1 : 0;
    settle(g, e);
  }
  return e;
}

/** Subscribes the hook: every band or insight change re-checks every layer. */
export function registerHiddenLayer(g: Game): void {
  const update = (): void => {
    for (const id of g.ecs.c.layer.keys()) applyLayer(g, id);
  };
  g.events.on('SanityBandChanged', update);
  g.events.on('InsightChanged', update);
}
