/**
 * The points of interest found (round 61; data/pois.ts, world/poiSites.ts): coming within a place's reach finds it once. Its name is
 * read out with its line, what it gives is given (a little insight for the strange ones), it is kept in the save among what was told
 * (`poi:<id>`), and the map shows its mark in place of the "?". A place's chest is set down as the investigator nears and is taken
 * for good (`Hoard: <id>` among the tomes read); its dread or its comfort is felt while within it; and a place that speaks twice says
 * its second line when one comes back. Looked for a few times a second. Pure: no Three.js.
 */

import { hoardName, poiDef, poiKey } from '../data/pois';
import { POI, SIM } from '../data/tuning';
import { poiSitesOf, type PoiSite } from '../world/poiSites';
import { regionAt } from '../world/worldMap';
import type { Game } from './components';
import { demoAllows } from './demo';
import { isExplored } from './exploration';
import { changeInsight, spawnTome } from './insight';
import { setPlaceDread } from './placeAura';
import { restoreSanity } from './sanity';

/** How near the investigator comes to a place to find it. */
export const reachOf = (s: Pick<PoiSite, 'r'>): number => Math.min(POI.most, Math.max(POI.least, s.r + POI.reach));

/** The places found among a region's, and how many it has (those the demo's edge shuts out left uncounted). */
export function poiCount(g: Game, region: string): { found: number; of: number } {
  const all = poiSitesOf(region).filter((s) => demoAllows(g, s));
  return { found: all.filter((s) => g.overworld?.told.has(poiKey(s.def.id))).length, of: all.length };
}

export type PoiMark = 'hidden' | 'rumour' | 'found' | 'spent';

/**
 * What the map shows of a place: nothing until ground within POI.hint of it has been charted (in any of POI.ring directions, near and far,
 * or at its own heart); then a grey "?"; once found, its kind's mark, and a dim one once its hoard is taken.
 */
export function poiMark(g: Game, s: PoiSite): PoiMark {
  const ow = g.overworld;
  if (!ow || !demoAllows(g, s)) return 'hidden';
  if (ow.told.has(poiKey(s.def.id))) return s.def.hoard && ow.read.has(hoardName(s.def.id)) ? 'spent' : 'found';
  if (isExplored(ow.explored, s.x, s.z)) return 'rumour';
  for (let k = 0; k < POI.ring; k++) {
    const a = (k / POI.ring) * Math.PI * 2;
    for (const f of [0.5, 1]) if (isExplored(ow.explored, s.x + Math.sin(a) * POI.hint * f, s.z + Math.cos(a) * POI.hint * f)) return 'rumour';
  }
  return 'hidden';
}

const chests = new WeakMap<Game, Set<string>>(); // the hoards set down in this world, by place (not kept: a load sets them down again)
const spoke = new WeakMap<Game, Map<string, number>>(); // the frame each place last spoke
const within = new WeakMap<Game, Set<string>>(); // the places the investigator stood in at the last look

function setDown(g: Game, s: PoiSite): void {
  const mine = chests.get(g) ?? chests.set(g, new Set()).get(g)!;
  const id = s.def.id;
  if (!s.chest || !s.def.hoard || mine.has(id) || g.overworld?.read.has(hoardName(id))) return;
  mine.add(id);
  spawnTome(g, { x: s.chest.x, z: s.chest.z, yaw: (s.chest.x * 7.3 + s.chest.z) % 6.28, name: hoardName(id), insight: 0, echoes: s.def.hoard });
}

export function poiSystem(g: Game): void {
  const ow = g.overworld;
  if (!ow || g.frame % POI.every) return;
  const p = g.ecs.c.transform.get(g.player.id)?.pos;
  const region = p ? regionAt(p.x, p.z)?.id : undefined;
  if (!p || !region || (g.ecs.c.health.get(g.player.id)?.hp ?? 0) <= 0) {
    within.delete(g); // off the land, or fallen: in no place
    setPlaceDread(g, 0);
    return;
  }
  const dt = POI.every / SIM.hz;
  const was = within.get(g);
  const now = new Set<string>();
  within.set(g, now);
  let dread = 0; // the heaviest of the dread of the places stood in (read by sanity.ts's drain until the next look)
  for (const s of poiSitesOf(region)) {
    const d = Math.hypot(s.x - p.x, s.z - p.z);
    const def = s.def;
    if (d > POI.range || !demoAllows(g, s)) continue;
    setDown(g, s);
    if (d > reachOf(s)) continue;
    const came = !was?.has(def.id); // just come into it
    now.add(def.id);
    const key = poiKey(def.id);
    const at = spoke.get(g) ?? spoke.set(g, new Map()).get(g)!;
    if (!ow.told.has(key)) {
      ow.told.add(key);
      at.set(def.id, g.frame);
      const { found, of } = poiCount(g, region);
      g.events.emit('PoiFound', { id: def.id, name: def.name, region, kind: def.kind, line: def.line, found, of });
      const gain = def.insight ?? (def.kind === 'anomaly' || def.kind === 'tale' ? POI.insight : 0);
      if (gain > 0) changeInsight(g, gain, 'tome', def.name);
    } else if (came && def.again && g.frame - (at.get(def.id) ?? -Infinity) >= POI.hear * SIM.hz) {
      at.set(def.id, g.frame);
      g.events.emit('PoiAgain', { id: def.id, name: def.name, line: def.again });
    }
    if (def.aura && def.aura > 0) restoreSanity(g, def.aura * dt);
    else if (def.aura) dread = Math.max(dread, -def.aura);
  }
  setPlaceDread(g, dread);
}

/** The place of a given id, resolved: for the tests and the map. */
export const poiSite = (id: string): PoiSite | undefined => {
  const def = poiDef(id);
  return def ? poiSitesOf(def.region).find((s) => s.def.id === id) : undefined;
};
