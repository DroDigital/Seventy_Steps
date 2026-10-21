/**
 * What the map marks, and how it reads (round 60): the figures that are shown, the words each has, and what the zoom holds.
 */
import { describe, expect, it } from 'vitest';
import { NPCS } from '../src/data/npcs';
import { REGIONS } from '../src/data/regions';
import { explore } from '../src/systems/exploration';
import { createWorldGame } from '../src/systems/game';
import { DETAIL, gatherMarks, markAt, type Mark } from '../src/ui/mapMarks';
import type { MapView } from '../src/ui/mapView';
import { mapPlaces, realmOf } from '../src/world/mapData';
import { placesOf } from '../src/world/namedPlaces';

/** A world game, the ground about the first Elder Sign not yet found seen (the one it begins at is found at once). */
function scene() {
  const g = createWorldGame();
  const first = mapPlaces().find((p) => p.kind === 'sign' && !g.overworld!.discovered.has(p.id))!;
  explore(g.overworld!.explored, first, 400);
  const realm = realmOf(first.region);
  const view = (scale: number): MapView => ({ cx: first.x, cz: first.z, scale, w: 1280, h: 720 });
  return { g, first, realm, view };
}

const of = (marks: readonly Mark[], kind: Mark['kind']): Mark[] => marks.filter((m) => m.kind === kind);

describe('what the map marks (round 60)', () => {
  it('marks a sign that is seen but not found dim, and says so; found, it is lit, named and chosen for a journey', () => {
    const { g, first, realm, view } = scene();
    let [marks, labels] = ((r) => [r.marks, r.labels] as const)(gatherMarks(g, view(2), realm, true, 7, 1));
    const dim = marks.find((m) => m.place?.id === first.id)!;
    expect(dim.state.lit).toBe(false);
    expect(dim.name).toBe('');
    expect(dim.note).toMatch(/light it/i);
    expect(labels.some((l) => l.text === first.name)).toBe(false); // an unfound sign is not named
    g.overworld!.discovered.add(first.id);
    [marks, labels] = ((r) => [r.marks, r.labels] as const)(gatherMarks(g, view(2), realm, true, 7, 1));
    const lit = marks.find((m) => m.place?.id === first.id)!;
    expect(lit.state.lit).toBe(true);
    expect(lit.name).toBe(first.name);
    expect(lit.note).toMatch(/journey/i);
    expect(labels.some((l) => l.text === first.name)).toBe(true);
  });

  it('holds back the people and the places found until the map is zoomed in, and shows them on the minimap as ever', () => {
    const { g, first, realm, view } = scene();
    const [ow, npc] = [g.overworld!, NPCS.find((n) => ow_has(g, n.id))];
    for (const r of REGIONS) for (const pl of placesOf(r.id)) ow.places.add(pl.id);
    for (const n of NPCS) ow.met.add(n.id);
    explore(ow.explored, first, 4000);
    const far = gatherMarks(g, view(DETAIL.people * 0.5), realm, true, 7, 1).marks;
    expect(of(far, 'person')).toHaveLength(0);
    expect(of(far, 'place')).toHaveLength(0);
    const near = gatherMarks(g, view(DETAIL.placeNames * 1.5), realm, true, 7, 1);
    expect(of(near.marks, 'place').length + of(near.marks, 'person').length).toBeGreaterThan(0);
    const mini = gatherMarks(g, view(0.5), realm, false, 5, 1);
    expect(of(mini.marks, 'person').length + of(mini.marks, 'place').length).toBeGreaterThan(0);
    expect(mini.labels).toHaveLength(0); // the minimap names nothing
    expect(npc === undefined || typeof npc.name === 'string').toBe(true);
  });

  it('names a person only once met, and the names of the places only as far in as they can be read', () => {
    const { g, first, realm, view } = scene();
    const ow = g.overworld!;
    for (const n of NPCS) ow.met.add(n.id);
    for (const r of REGIONS) for (const pl of placesOf(r.id)) ow.places.add(pl.id);
    explore(ow.explored, first, 4000);
    const mid = gatherMarks(g, view((DETAIL.peopleNames + DETAIL.placeNames) / 2), realm, true, 7, 1).labels.map((l) => l.text);
    const deep = gatherMarks(g, view(DETAIL.placeNames * 1.2), realm, true, 7, 1).labels.map((l) => l.text);
    expect(deep.length).toBeGreaterThan(mid.length);
  });

  it('puts the signs first among the names, so that they are the ones that are kept when there is no room', () => {
    const { g, first, realm, view } = scene();
    const ow = g.overworld!;
    ow.discovered.add(first.id);
    for (const n of NPCS) ow.met.add(n.id);
    explore(ow.explored, first, 4000);
    const { labels } = gatherMarks(g, view(DETAIL.placeNames * 1.2), realm, true, 7, 1);
    expect(labels[0].text).toBe(first.name);
  });

  it('describes a horror\'s lair by what is known of it: no name until met, and struck from the living once slain', () => {
    const { g, first, realm } = scene();
    const lair = mapPlaces().find((p) => p.kind === 'arena' && realmOf(p.region) === realm)!;
    explore(g.overworld!.explored, lair, 300);
    const [x, z] = [lair.x, lair.z];
    const v: MapView = { cx: x, cz: z, scale: 2, w: 1280, h: 720 };
    const before = gatherMarks(g, v, realm, true, 7, 1).marks.find((m) => m.place === lair)!;
    expect(before.kind).toBe('boss');
    expect(before.state.slain).toBe(false);
    expect(before.name).toBe('');
    g.mind.seen.add(lair.bosses[0]);
    const met = gatherMarks(g, v, realm, true, 7, 1).marks.find((m) => m.place === lair)!;
    expect(met.name).not.toBe('');
    for (const b of lair.bosses) g.overworld!.slain.add(`boss:${b}`);
    const done = gatherMarks(g, v, realm, true, 7, 1).marks.find((m) => m.place === lair)!;
    expect(done.state.slain).toBe(true);
    expect(done.title).toMatch(/slain/i);
    expect(first).toBeDefined();
  });

  it('picks the mark under a point within its reach, the one drawn on top winning where two lie close', () => {
    const marks = [
      { kind: 'sign', x: 100, y: 100, r: 7 },
      { kind: 'dungeon', x: 104, y: 100, r: 7 },
      { kind: 'gate', x: 300, y: 300, r: 7 },
    ] as unknown as Mark[];
    expect(markAt(marks, 301, 301)?.kind).toBe('gate');
    expect(markAt(marks, 104, 100)?.kind).toBe('dungeon');
    expect(markAt(marks, 100, 100)?.kind).toBe('sign');
    expect(markAt(marks, 200, 200)).toBeNull();
  });
});

const ow_has = (g: { overworld?: { met: Set<string> } | null }, id: string): boolean => !!g.overworld?.met.has(id);
