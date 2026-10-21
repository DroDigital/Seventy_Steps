/**
 * The marker (round 60: "add the ability to set a marker on the map, that has its own minimap arrow indicator"): one place the
 * investigator has marked on the map of a realm, kept in the save. The minimap points to it, as it points to where the story leads,
 * in a colour and shape of its own, and shows it where it lies within the minimap's reach. It is set and cleared from the full map
 * (ui/mapScreen.ts); coming within `MARKER.arrive` of it clears it, with a word. Pure: no DOM.
 */

import { distXZ, type XZ } from '../core/geom';
import { t } from '../core/i18n';
import { MARKER } from '../data/tuning';
import { realmOf } from '../world/mapData';
import { regionAt } from '../world/worldMap';
import type { Game } from './components';

/** Whether `at` lies on a realm's ground (a marker on the black beyond the edge of the world is no marker). */
export const markable = (at: XZ): boolean => !!regionAt(at.x, at.z);

/** Sets the marker at `at` (or with null clears it); false for a place that is no ground, or no overworld. */
export function setMarker(g: Pick<Game, 'overworld'>, at: XZ | null): boolean {
  const ow = g.overworld;
  if (!ow) return false;
  if (!at) {
    ow.marker = null;
    return true;
  }
  if (!markable(at) || !Number.isFinite(at.x) || !Number.isFinite(at.z)) return false;
  ow.marker = { x: at.x, z: at.z };
  return true;
}

/** The marker if it lies in the realm the investigator is in (another realm's is kept, and not shown there). */
export function markerHere(g: Pick<Game, 'overworld' | 'ecs' | 'player'>): XZ | null {
  const m = g.overworld?.marker;
  if (!m) return null;
  const [mine, theirs] = [regionAt(g.ecs.c.transform.get(g.player.id)!.pos.x, g.ecs.c.transform.get(g.player.id)!.pos.z), regionAt(m.x, m.z)];
  return mine && theirs && realmOf(mine.id).some((r) => r.id === theirs.id) ? m : null;
}

/** How far the marker is from the investigator (metres), or null if there is none in this realm. */
export function markerDistance(g: Pick<Game, 'overworld' | 'ecs' | 'player'>): number | null {
  const m = markerHere(g);
  return m ? distXZ(m, g.ecs.c.transform.get(g.player.id)!.pos) : null;
}

/** One step: the marker reached is cleared, with a word. */
export function markerSystem(g: Game): void {
  const d = markerDistance(g);
  if (d === null || d > MARKER.arrive) return;
  g.overworld!.marker = null;
  g.events.emit('Notice', { text: t('n.markerReached') });
}
