/**
 * Secret passages open as they are approached (round 61, asked: "ensure they activate via a contextually appropriate animation upon
 * approach"). A hidden doorway or bridge that the mind can see (hiddenLayer.ts: enough insight, or the band it asks for) was simply
 * there, open, from the moment the insight was held, however far off. Now it stays shut, a wall or a gap, until the investigator comes
 * within `PASSAGE.wake` of it, and then opens over a second or so: a door's slab draws aside into the wall, a bridge's stones rise
 * across the gap one after another (render/hiddenViews.ts draws it from `Layer.open`, and the sound and the dust are its). What the
 * way is physically, wall or open, follows the picture: a door's seal comes out of the world once the slab is `solidAt` of the way
 * aside, a bridge's deck stands once it is as far formed (and its gap, which a body falls into, is stopped then). Once it has begun it
 * is finished whether or not they stay; once open it stays open until the mind loses what shows it. Pure: no Three.js.
 */

import { distXZ } from '../core/geom';
import type { HiddenPieceDef } from '../data/arena';
import { PASSAGE } from '../data/tuning';
import type { Entity } from '../core/ecs';
import type { Game } from './components';

export type PassageKind = 'door' | 'bridge' | 'sealed';

/** What a piece with a seal is: a bridge (its gap is its seal), a door to the Beyond banded with glyphs, or a hidden door in a wall. */
export const passageKind = (d: HiddenPieceDef): PassageKind => (d.seal?.look === 'none' ? 'bridge' : d.seal?.look === 'sealed' ? 'sealed' : 'door');

/** How near the investigator must come for it to wake: a bridge's from its middle, farther by half its length, so that it is formed before the brink is reached. */
export const wakeOf = (d: HiddenPieceDef): number => PASSAGE.wake + (d.bridge ? d.bridge.half : 0);

/** The seconds a passage takes to open. */
export const secondsOf = (d: HiddenPieceDef): number => PASSAGE.frames[passageKind(d)] / 60;

/**
 * Puts a piece's colliders in the world to match its state: a doorway's frame stands while it is shown, and its seal (the wall that
 * fills it) until the slab is `solidAt` aside; a bridge's deck stands, and its gap stops being a gap, only once it is formed. A piece
 * with no seal (a standing stone of the arena) has no opening: it is there while it is shown.
 */
export function settle(g: Game, id: Entity): void {
  const [l, piece] = [g.ecs.c.layer.get(id), g.ecs.c.piece.get(id)];
  if (!l || !piece) return;
  const open = l.shown && (!piece.def.seal || l.open >= PASSAGE.solidAt);
  const bridge = piece.def.seal?.look === 'none';
  for (const c of piece.colliders) {
    if ((bridge ? open : l.shown) === true) g.world.off.delete(c);
    else g.world.off.add(c);
  }
  for (const c of piece.seal) {
    if (open) g.world.off.add(c);
    else g.world.off.delete(c);
  }
}

/**
 * A load stands the investigator where they were saved (save.ts): a passage that they stood at, and that the saved mind shows, is
 * already open, as it was when they left it, so that a bridge they were out on holds them and a door they were in is not shut on them.
 * (The world is made before the save is read, with the body at the start and the mind not yet its own, so `spawnPiece`'s own reading of
 * where the body stands has nothing to go on.)
 */
export function openAround(g: Game, at: { x: number; z: number }): void {
  for (const [id, l] of g.ecs.c.layer) {
    const piece = g.ecs.c.piece.get(id);
    if (!piece?.def.seal || !l.shown || l.open >= 1 || distXZ(piece.def, at) > wakeOf(piece.def)) continue;
    l.open = 1;
    settle(g, id);
  }
}

/** One step: each shown passage the investigator is near begins to open, and each begun goes on to its end. */
export function passageSystem(g: Game): void {
  const me = g.ecs.c.transform.get(g.player.id)?.pos;
  if (!me) return;
  for (const [id, l] of g.ecs.c.layer) {
    const piece = g.ecs.c.piece.get(id);
    if (!piece?.def.seal || !l.shown || l.open >= 1) continue;
    const d = piece.def;
    if (l.open === 0 && distXZ(d, me) > wakeOf(d)) continue; // asleep until approached
    const was = l.open;
    l.open = Math.min(1, l.open + 1 / PASSAGE.frames[passageKind(d)]);
    if (was === 0) g.events.emit('PassageOpening', { id, kind: passageKind(d), x: d.x, y: g.world.ground(d.x, d.z), z: d.z, seconds: secondsOf(d) });
    settle(g, id);
  }
}
