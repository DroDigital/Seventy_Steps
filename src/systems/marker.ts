/**
 * The markers (round 60: "add the ability to set a marker on the map, that has its own minimap arrow indicator"; round 68: "more than
 * one custom waypoint ... and the ability to delete them"): the places the investigator has marked on the map of a realm, up to
 * `MARKER.most`, kept in the save. The minimap points to each, as it points to where the story leads, in a colour and shape of its own,
 * and shows it where it lies within the minimap's reach. They are set and removed from the full map (ui/mapScreen.ts); coming within
 * `MARKER.arrive` of one clears it, with a word. Pure: no DOM.
 */

import { distXZ, type XZ } from '../core/geom';
import { t } from '../core/i18n';
import { MARKER } from '../data/tuning';
import { realmOf } from '../world/mapData';
import { regionAt } from '../world/worldMap';
import type { Game } from './components';

/** Whether `at` lies on a realm's ground (a marker on the black beyond the edge of the world is no marker). */
export const markable = (at: XZ): boolean => !!regionAt(at.x, at.z);

/** Adds a marker at `at`: 'added', 'full' when `MARKER.most` stand already, or 'refused' for a place that is no ground, or no overworld. */
export function addMarker(g: Pick<Game, 'overworld'>, at: XZ): 'added' | 'full' | 'refused' {
  const ow = g.overworld;
  if (!ow || !Number.isFinite(at.x) || !Number.isFinite(at.z) || !markable(at)) return 'refused';
  if (ow.markers.length >= MARKER.most) return 'full';
  ow.markers.push({ x: at.x, z: at.z });
  return 'added';
}

/** Removes the marker `m` (the one itself, as `markersHere` gave it); false if it does not stand. */
export function removeMarker(g: Pick<Game, 'overworld'>, m: XZ): boolean {
  const ow = g.overworld;
  const i = ow ? ow.markers.findIndex((x) => x === m || (x.x === m.x && x.z === m.z)) : -1;
  if (!ow || i < 0) return false;
  ow.markers.splice(i, 1);
  return true;
}

/** Removes every marker, in every realm; how many there were. */
export function clearMarkers(g: Pick<Game, 'overworld'>): number {
  const n = g.overworld?.markers.length ?? 0;
  if (g.overworld) g.overworld.markers = [];
  return n;
}

/** The markers that lie in the realm the investigator is in (another realm's are kept, and not shown there). */
export function markersHere(g: Pick<Game, 'overworld' | 'ecs' | 'player'>): XZ[] {
  const ms = g.overworld?.markers;
  if (!ms?.length) return [];
  const pos = g.ecs.c.transform.get(g.player.id)!.pos;
  const mine = regionAt(pos.x, pos.z);
  if (!mine) return [];
  const realm = realmOf(mine.id);
  return ms.filter((m) => {
    const theirs = regionAt(m.x, m.z);
    return !!theirs && realm.some((r) => r.id === theirs.id);
  });
}

/** How far a marker is from the investigator (metres). */
export const markerDistance = (g: Pick<Game, 'ecs' | 'player'>, m: XZ): number => distXZ(m, g.ecs.c.transform.get(g.player.id)!.pos);

/** One step: each marker reached is cleared, with a word. */
export function markerSystem(g: Game): void {
  const ow = g.overworld;
  if (!ow?.markers.length) return;
  for (const m of markersHere(g)) {
    if (markerDistance(g, m) > MARKER.arrive) continue;
    removeMarker(g, m);
    g.events.emit('Notice', { text: t('n.markerReached') });
  }
}
