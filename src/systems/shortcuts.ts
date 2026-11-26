/**
 * Shortcuts (round 125, asked: the dungeons designed the way Souls levels are; docs/LEVEL_DESIGN.md): a doorway between two rooms
 * shut by a door barred on one side, its `from`, the deeper side. Coming the long way round, the investigator finds the bar and
 * works it (E), the door opens, and stays open: the save keeps it (`ow.told`, `cut:<id>`), and a new journey bars it again (cycles.ts
 * carries only hints and finds across). From the other side it will not move: E tries it, and it rattles on its bar. While shut its
 * seal fills the doorway; this system takes it out of the world once the door is open, and puts it back if a save that had not opened
 * it is read. Pure: no Three.js.
 */

import { distXZ } from '../core/geom';
import { t } from '../core/i18n';
import { SHORTCUT } from '../data/tuning';
import type { Collider } from '../world/colliders';
import { worldLayout } from '../world/placements';
import { shortcutSeal, sideOf, type ShortcutPlace } from '../world/shortcutPlan';
import { startMove } from './actions';
import type { Game } from './components';
import type { FightAction } from './signatures';

/** What the save keeps of an opened shortcut. */
export const shortcutKey = (id: string): string => `cut:${id}`;

const seals = new WeakMap<Game, Map<string, Collider>>();
const opening = new WeakMap<Game, Map<string, number>>(); // the frame each was opened on: its seal comes out as the leaves are well aside

/** Whether the shortcut `id` has been opened in this journey. */
export const isOpened = (g: Game, id: string): boolean => !!g.overworld?.told.has(shortcutKey(id));

/** Puts every shortcut's seal into the world, shut (shortcutSystem opens those the save says are open). */
export function furnishShortcuts(g: Game): void {
  const map = new Map<string, Collider>();
  for (const s of worldLayout().shortcuts) {
    const c = shortcutSeal(s);
    g.world.colliders.push(c);
    map.set(s.id, c);
  }
  seals.set(g, map);
  opening.set(g, new Map());
}

/** One step: each seal stands while its door is barred, and goes once the door has swung well aside. */
export function shortcutSystem(g: Game): void {
  const map = seals.get(g);
  if (!map || !g.overworld) return;
  const begun = opening.get(g)!;
  for (const [id, c] of map) {
    const at = begun.get(id);
    const open = isOpened(g, id) && (at === undefined || g.frame - at >= SHORTCUT.solidFor);
    if (open) g.world.off.add(c);
    else g.world.off.delete(c);
    if (at !== undefined && open) begun.delete(id);
  }
}

/** The shut shortcut within reach that the investigator stands nearest, if any. */
function nearShut(g: Game): ShortcutPlace | null {
  const me = g.ecs.c.transform.get(g.player.id)?.pos;
  if (!me) return null;
  let best: ShortcutPlace | null = null;
  let d = SHORTCUT.reach;
  for (const s of worldLayout().shortcuts) {
    const k = distXZ(s, me);
    if (k <= d && Math.abs(me.y - s.y) < 1.5 && !isOpened(g, s.id)) [best, d] = [s, k];
  }
  return best;
}

/** Opens the shortcut `s` from its far side: the bar is worked, the door swings, and it stays open. */
export function openShortcut(g: Game, s: ShortcutPlace): void {
  if (!g.overworld || isOpened(g, s.id)) return;
  g.overworld.told.add(shortcutKey(s.id));
  opening.get(g)?.set(s.id, g.frame);
  startMove(g.ecs.c.actor.get(g.player.id)!, 'kindle'); // the hands at the bar
  g.events.emit('ShortcutOpened', { id: s.id, x: s.x, y: s.y, z: s.z });
}

/** What E does at a shut shortcut: from its far side it opens it; from this side it tries it, and it holds. */
export function shortcutAction(g: Game): FightAction | null {
  const s = nearShut(g);
  if (!s) return null;
  const me = g.ecs.c.transform.get(g.player.id)!.pos;
  if (sideOf(s, me) === 'from') return { label: t('hud.unbar'), run: () => openShortcut(g, s) };
  return { label: t('hud.barredBeyond'), run: () => g.events.emit('ShortcutTried', { id: s.id, x: s.x, y: s.y, z: s.z }) };
}
