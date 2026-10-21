/**
 * What the map marks and how it reads (round 60: the map was a heap of small like marks, all drawn at once, and a key of glyphs
 * that were not the ones drawn). Each thing the investigator knows of in the realm on show becomes one `Mark`: its figure, where it
 * falls, what it is called and what may be done with it (the words a hover shows), and the name drawn beside it, if any. The
 * full map keeps to what its zoom can hold: the signs, gates, dungeons and horrors always, the people and the named places as it is
 * zoomed in, their names further in. The minimap shows all it has room for, and no names. No drawing here: the painter draws these,
 * and the screen picks among them. Pure: no DOM.
 */

import { NPCS } from '../data/npcs';
import { getEntity } from '../data/registry';
import type { RegionDef } from '../data/regions';
import type { Game } from '../systems/components';
import { isExplored } from '../systems/exploration';
import { markerDistance, markerHere } from '../systems/marker';
import { npcPlace } from '../systems/npcs';
import { mapPlaces, type MapPlace } from '../world/mapData';
import { placesOf } from '../world/namedPlaces';
import { regionAt } from '../world/worldMap';
import { BONE, DIM, type MarkKind, type MarkState, PIN_TIP, reach } from './mapIcons';
import type { MapLabel } from './mapLabels';
import { falseStar, slip, SLIDE } from './mapWrong';
import { screenX, screenY, type MapView } from './mapView';

export interface Mark {
  kind: MarkKind;
  x: number; // canvas pixels (a failing mind's slide included)
  y: number;
  r: number; // the radius it is drawn at
  state: MarkState;
  title: string; // what it is
  name: string; // what it is called, if the investigator knows
  note: string; // what may be done with it, or what is so of it
  badge: 'live' | 'slain' | null; // a dungeon's horror, once met
  place: MapPlace | null;
  label: MapLabel | null;
}

/** Pixels a metre, divided by the UI's scale, from which each thing is drawn on the full map, and then named. */
export const DETAIL = { people: 0.9, peopleNames: 1.8, places: 1.2, placeNames: 2.2, doorNames: 1.0 } as const;

const GATE_NAME = '#c3a4ee';
const DOOR_NAME = '#b9b19c';

export interface Gathered {
  marks: Mark[]; // drawn in this order, the first underneath
  labels: MapLabel[]; // the signs' first
}

/**
 * The marks of `realm` on `view`. `full`: the full map (names, and a zoom's worth of detail); `unit`: the radius of a mark, pixels;
 * `k`: the UI's scale, which sizes the names.
 */
export function gatherMarks(g: Game, view: MapView, realm: readonly RegionDef[], full: boolean, unit: number, k: number): Gathered {
  const ow = g.overworld;
  const out: Gathered = { marks: [], labels: [] };
  if (!ow) return out;
  const inRealm = new Set(realm.map((r) => r.id));
  const [sanity, bucket] = [g.mind.sanity, Math.floor(performance.now() / 1000 / SLIDE)];
  const detail = view.scale / k;
  const slain = (id: string): boolean => ow.slain.has(`boss:${id}`);
  const near = (x: number, y: number): boolean => x > -20 && y > -20 && x < view.w + 20 && y < view.h + 20;
  const [under, middle, over]: [Mark[], Mark[], Mark[]] = [[], [], []];
  const labels: Record<'signs' | 'doors' | 'people' | 'places', MapLabel[]> = { signs: [], doors: [], people: [], places: [] };
  const add = (list: Mark[], m: Omit<Mark, 'r' | 'label' | 'badge' | 'place'> & Partial<Pick<Mark, 'badge' | 'place'>>, scale: number, label: MapLabel | null, row: keyof typeof labels): void => {
    const r = unit * scale;
    list.push({ badge: null, place: null, ...m, r, label });
    if (label) labels[row].push({ ...label, gap: reach(m.kind, r) + 3 });
  };
  const slid = (id: string, x: number, y: number): [number, number] => {
    const o = slip(id, sanity, bucket); // a failing mind's map slides (round 26)
    return [x + o.dx, y + o.dy];
  };

  for (const p of mapPlaces()) {
    if (!inRealm.has(p.region)) continue;
    const [x, y] = slid(p.id, screenX(view, p.x), screenY(view, p.z));
    if (!near(x, y)) continue;
    const found = ow.discovered.has(p.id);
    if (!isExplored(ow.explored, p.x, p.z) && !(p.kind === 'sign' && found)) continue;
    if (p.kind === 'sign') {
      const text = { text: p.name, x, y, size: 11 * k, color: BONE, gap: 0 };
      add(middle, {
        kind: 'sign', x, y, state: { lit: found }, place: p,
        title: found ? 'Elder Sign' : 'An Elder Sign, unlit',
        name: found ? p.name : '',
        note: found ? 'A place to rest. Click to choose it for a journey' : 'Walk up to it to light it',
      }, 1, found && full ? text : null, 'signs');
    } else if (p.kind === 'gate') {
      add(middle, { kind: 'gate', x, y, state: {}, place: p, title: 'Gate', name: p.name, note: 'Walk into it to pass through' }, 1,
        full && detail >= DETAIL.doorNames ? { text: p.name, x, y, size: 10 * k, color: GATE_NAME, gap: 0 } : null, 'doors');
    } else if (p.kind === 'dungeon') {
      const met = p.bosses.filter((b) => g.mind.seen.has(b) || slain(b));
      const done = met.length > 0 && met.every(slain);
      add(middle, {
        kind: 'dungeon', x, y, state: {}, place: p, badge: met.length ? (done ? 'slain' : 'live') : null,
        title: 'Dungeon', name: p.name, note: !met.length ? 'Its door stands open' : done ? 'Its horror is slain' : 'A horror lurks within',
      }, 1, full && detail >= DETAIL.doorNames ? { text: p.name, x, y, size: 10 * k, color: DOOR_NAME, gap: 0 } : null, 'doors');
    } else {
      const done = p.bosses.every(slain);
      const known = p.bosses.filter((b) => g.mind.seen.has(b) || slain(b)).map((b) => getEntity(b)?.name ?? '');
      add(middle, {
        kind: 'boss', x, y, state: { slain: done }, place: p,
        title: done ? 'A horror, slain' : "A horror's lair", name: known.join(' · '), note: done ? 'It will not rise again' : 'Something great dwells here',
      }, 1.05, null, 'doors');
    }
  }

  if (!full || detail >= DETAIL.people) {
    for (const n of NPCS) { // the people met in the dream: a figure where they stand, named once met
      const at = npcPlace(n);
      if (!at || !inRealm.has(regionAt(at.x, at.z)?.id ?? '') || !isExplored(ow.explored, at.x, at.z)) continue;
      const [x, y] = slid(n.id, screenX(view, at.x), screenY(view, at.z));
      const met = ow.met.has(n.id);
      add(under, { kind: 'person', x, y, state: { met }, title: met ? 'Someone you have met' : 'A figure', name: met ? n.name : '', note: met ? '' : 'Speak with them to learn who they are' }, 0.8,
        full && met && detail >= DETAIL.peopleNames ? { text: n.name, x, y, size: 10 * k, color: DIM, gap: 0 } : null, 'people');
    }
  }

  if (!full || detail >= DETAIL.places) {
    for (const pl of realm.flatMap((r) => placesOf(r.id))) { // the named places found, marked and named last (round 18)
      if (!ow.places.has(pl.id)) continue;
      const [x, y] = [screenX(view, pl.x), screenY(view, pl.z)];
      add(under, { kind: 'place', x, y, state: {}, title: 'A place you found', name: pl.name, note: '' }, 0.7,
        full && detail >= DETAIL.placeNames ? { text: pl.name, x, y, size: 8.5 * k, color: DIM, gap: 0 } : null, 'places');
    }
  }

  for (const d of g.ecs.query('drop')) {
    const at = g.ecs.c.transform.get(d)!.pos;
    add(over, { kind: 'echo', x: screenX(view, at.x), y: screenY(view, at.z), state: {}, title: 'Your lost Echoes', name: '', note: 'Walk over them to take them back' }, 0.85, null, 'places');
  }

  const pin = full ? markerHere(g) : null; // the investigator's own marker (the minimap draws it as a beacon, upright: leadMark.ts)
  if (pin) {
    const r = unit * 0.95;
    const metres = Math.round(markerDistance(g) ?? 0);
    add(over, { kind: 'marker', x: screenX(view, pin.x), y: screenY(view, pin.z) - PIN_TIP * r, state: {}, title: 'Your marker', name: `${metres} m away`, note: 'Right-click it, or press F, to clear it' }, 0.95, null, 'places'); // its point on the place
  }

  out.marks.push(...under, ...middle, ...over);
  out.labels.push(...labels.signs, ...labels.doors, ...labels.people, ...labels.places);
  return out;
}

/** A star that is not there, for a failing mind's map (round 26): where, in canvas pixels, or null while the mind holds. */
export function falseSign(g: Game, view: MapView): { x: number; y: number } | null {
  const bucket = Math.floor(performance.now() / 1000 / SLIDE);
  const lie = falseStar(g.mind.sanity, bucket, Math.min(view.w, view.h) / 2);
  return lie && performance.now() % (SLIDE * 1000) < 4000 ? { x: view.w / 2 + lie.dx, y: view.h / 2 + lie.dy } : null;
}

/** The mark nearest a point on the canvas, within its own reach and `slack` pixels, if any; what lies on top (the last drawn) wins a tie. */
export function markAt(marks: readonly Mark[], x: number, y: number, slack = 4): Mark | null {
  let best: Mark | null = null;
  let bestD = Infinity;
  for (const m of marks) {
    const d = Math.hypot(m.x - x, m.y - y);
    if (d <= reach(m.kind, m.r) + slack && d <= bestD) [best, bestD] = [m, d];
  }
  return best;
}
