/**
 * The markers on the map (round 60: "add the ability to set a marker on the map, that has its own minimap arrow indicator"; round 68:
 * "more than one custom waypoint ... and the ability to delete them"): up to twelve places, set from the full map, kept in the save,
 * pointed to by the minimap's rim in a pointer of its own each, removed one at a time or all together, cleared on coming to each.
 */
import { describe, expect, it } from 'vitest';
import { MARKER } from '../src/data/tuning';
import { createWorldGame } from '../src/systems/game';
import { addMarker, clearMarkers, markable, markerDistance, markerSystem, markersHere, removeMarker } from '../src/systems/marker';
import { applySave, parseSave, snapshot } from '../src/systems/save';
import { beaconPlace } from '../src/ui/leadMark';
import { gatherMarks, markAt } from '../src/ui/mapMarks';
import { PIN_TIP, reach } from '../src/ui/mapIcons';
import { screenX, screenY, worldX, worldZ, type MapView } from '../src/ui/mapView';
import { allRealms, realmOf } from '../src/world/mapData';
import { regionRect } from '../src/world/worldMap';
import { record } from './worldHelpers';

const pos = (g: ReturnType<typeof createWorldGame>) => g.ecs.c.transform.get(g.player.id)!.pos;
const hubRealm = (g: ReturnType<typeof createWorldGame>) => realmOf(g.overworld!.region ?? 'hub');

describe('setting markers (round 68)', () => {
  it('stands any number up to the most, each on the ground; the black beyond the world is no place, nor are the numbers that are not', () => {
    const g = createWorldGame();
    const at = (i: number) => ({ x: pos(g).x + 20 + i * 5, z: pos(g).z + 10 });
    expect(addMarker(g, at(0))).toBe('added');
    expect(addMarker(g, at(1))).toBe('added'); // a second does not move the first
    expect(g.overworld!.markers).toEqual([at(0), at(1)]);
    expect(markable({ x: 1e7, z: 1e7 })).toBe(false);
    expect(addMarker(g, { x: 1e7, z: 1e7 })).toBe('refused');
    expect(addMarker(g, { x: NaN, z: 0 })).toBe('refused');
    expect(g.overworld!.markers).toHaveLength(2); // a refused one leaves what stood
    for (let i = 2; i < MARKER.most; i++) expect(addMarker(g, at(i))).toBe('added');
    expect(addMarker(g, at(99))).toBe('full');
    expect(g.overworld!.markers).toHaveLength(MARKER.most);
  });

  it('is removed one at a time, the one given and no other, and all together', () => {
    const g = createWorldGame();
    const [a, b, c] = [0, 1, 2].map((i) => ({ x: pos(g).x + 30 + i * 8, z: pos(g).z }));
    for (const m of [a, b, c]) addMarker(g, m);
    expect(removeMarker(g, markersHere(g)[1]!)).toBe(true);
    expect(g.overworld!.markers).toEqual([a, c]);
    expect(removeMarker(g, b)).toBe(false); // gone already
    expect(removeMarker(g, { x: a.x, z: a.z })).toBe(true); // by place, as a click on the map finds it
    expect(g.overworld!.markers).toEqual([c]);
    addMarker(g, a);
    expect(clearMarkers(g)).toBe(2);
    expect(g.overworld!.markers).toEqual([]);
    expect(clearMarkers(g)).toBe(0);
  });

  it('shows in the realm it is set in, and is kept, and not shown, in another', () => {
    const g = createWorldGame();
    const other = allRealms().find((r) => r !== hubRealm(g) && r[0].id !== hubRealm(g)[0].id)!;
    const rc = regionRect(other[0]);
    const far = { x: (rc.x0 + rc.x1) / 2, z: (rc.z0 + rc.z1) / 2 };
    addMarker(g, far);
    expect(g.overworld!.markers).toHaveLength(1);
    expect(markersHere(g)).toEqual([]);
    const near = { x: pos(g).x + 20, z: pos(g).z };
    addMarker(g, near);
    expect(markersHere(g)).toEqual([near]); // the other realm's is kept, not shown
    expect(g.overworld!.markers).toHaveLength(2);
    expect(markerDistance(g, near)).toBeCloseTo(20, 5);
  });

  it('is cleared, with a word, on coming within reach of it, and not before; the others stand', () => {
    const g = createWorldGame();
    const said = record(g, 'Notice');
    const [far, near] = [{ x: pos(g).x + MARKER.arrive + 5, z: pos(g).z }, { x: pos(g).x - MARKER.arrive + 1, z: pos(g).z }];
    addMarker(g, far);
    markerSystem(g);
    expect(g.overworld!.markers).toEqual([far]);
    expect(said).toHaveLength(0);
    addMarker(g, near);
    markerSystem(g);
    expect(g.overworld!.markers).toEqual([far]);
    expect(said.map((n) => n.text)).toEqual(['MARKER REACHED']);
  });

  it('is kept in the save, an old save keeps its one as the first, and one with none has none', () => {
    const g = createWorldGame();
    expect(snapshot(g).markers).toBeUndefined();
    const [a, b] = [{ x: pos(g).x + 60, z: pos(g).z - 30 }, { x: pos(g).x - 40, z: pos(g).z + 25 }];
    addMarker(g, a);
    addMarker(g, b);
    const json = JSON.stringify(snapshot(g));
    const back = createWorldGame();
    applySave(back, parseSave(json)!);
    expect(back.overworld!.markers).toHaveLength(2);
    expect(back.overworld!.markers[0]!.x).toBeCloseTo(a.x, 0);
    expect(back.overworld!.markers[1]!.z).toBeCloseTo(b.z, 0);
    const bad = JSON.parse(json);
    bad.markers = [{ x: 'far', z: 2 }];
    expect(parseSave(JSON.stringify(bad))).toBeNull(); // not a place: the save is not read as good
    bad.markers = 'many';
    expect(parseSave(JSON.stringify(bad))).toBeNull();
    const old = JSON.parse(json); // round 60's save: one place, `marker`
    delete old.markers;
    old.marker = { x: a.x, z: a.z };
    const upgraded = createWorldGame();
    applySave(upgraded, parseSave(JSON.stringify(old))!);
    expect(upgraded.overworld!.markers).toHaveLength(1);
    expect(upgraded.overworld!.markers[0]!.x).toBeCloseTo(a.x, 0);
    delete old.marker;
    const plain = createWorldGame();
    addMarker(plain, a);
    applySave(plain, parseSave(JSON.stringify(old))!);
    expect(plain.overworld!.markers).toEqual([]);
    const crowded = JSON.parse(json);
    crowded.markers = Array.from({ length: MARKER.most + 5 }, (_, i) => ({ x: a.x + i, z: a.z }));
    const capped = createWorldGame();
    applySave(capped, parseSave(JSON.stringify(crowded))!);
    expect(capped.overworld!.markers).toHaveLength(MARKER.most);
  });
});

describe('the pointer to it (round 60)', () => {
  const view: MapView = { cx: 0, cz: 0, scale: 1, w: 200, h: 200 };

  it('puts a place in view where the map does, with no pointer, and a place out of view nowhere unless there is a rim', () => {
    const p = beaconPlace(view, { x: -30, z: 20 }, 'round')!; // +x is drawn to the left, so -x lies to the right
    expect([p.x, p.y, p.beyond]).toEqual([130, 80, false]);
    expect(beaconPlace(view, { x: 500, z: 0 }, false)).toBeNull();
  });

  it("points to one beyond the minimap's round edge from its middle, on the rim", () => {
    const p = beaconPlace(view, { x: -300, z: 0 }, 'round')!; // far to the right
    expect(p.beyond).toBe(true);
    expect(p.angle).toBeCloseTo(0, 5);
    expect(Math.hypot(p.x - 100, p.y - 100)).toBeCloseTo(93, 5); // the rim, 7 pixels in
    expect(p.y).toBeCloseTo(100, 5);
  });

  it("points to one beyond the full map's screen at its edge", () => {
    const p = beaconPlace({ ...view, w: 400, h: 200 }, { x: 0, z: 900 }, 'screen')!; // far to the north: up
    expect(p.beyond).toBe(true);
    expect(p.y).toBeCloseTo(26, 5);
    expect(p.x).toBeCloseTo(200, 5);
    expect(beaconPlace({ ...view, w: 400, h: 200 }, { x: 0, z: 10 }, 'screen')!.beyond).toBe(false);
  });

  it('sets an off-screen lead in by the room its key needs, and leaves a plain pointer on the old edge', () => {
    const far = { x: -900, z: 0 }; // off the right: +x is drawn to the left
    const screen = { ...view, w: 400, h: 200 };
    const plain = beaconPlace(screen, far, 'screen')!;
    const lead = beaconPlace(screen, far, 'screen', 0, 16)!; // the key's rays, as drawBeacon asks
    expect(plain.x).toBeCloseTo(374, 5); // 26 pixels in from the right
    expect(lead.beyond).toBe(true);
    expect(lead.x).toBeCloseTo(358, 5); // the same edge, pulled in by the inset
    expect(lead.angle).toBeCloseTo(plain.angle, 5); // still the way to the place
    const round = beaconPlace(view, { x: -300, z: 0 }, 'round', 0, 16)!;
    expect(Math.hypot(round.x - 100, round.y - 100)).toBeCloseTo(77, 5); // the rim was 93; sixteen pixels further in
  });

  it("turns with the camera as the minimap's picture does: what lay up lies to the right after a quarter turn", () => {
    const up = beaconPlace(view, { x: 0, z: 40 }, 'round')!;
    expect([Math.round(up.x), Math.round(up.y)]).toEqual([100, 60]);
    const turned = beaconPlace(view, { x: 0, z: 40 }, 'round', Math.PI / 2)!; // ctx.rotate(yaw) is clockwise
    expect([Math.round(turned.x), Math.round(turned.y)]).toEqual([140, 100]);
  });

  it('is the inverse of where the map draws a point', () => {
    const v: MapView = { cx: 120, cz: -80, scale: 2.5, w: 1280, h: 720 };
    for (const [x, z] of [[0, 0], [300, -200], [-50, 640]] as const) {
      expect(worldX(v, screenX(v, x))).toBeCloseTo(x, 6);
      expect(worldZ(v, screenY(v, z))).toBeCloseTo(z, 6);
    }
  });
});

describe('the markers on the full map (round 68)', () => {
  it('are marks of their own on the full map, each with its place and the way to remove it; the minimap draws none (it points)', () => {
    const g = createWorldGame();
    const [a, b] = [{ x: pos(g).x + 30, z: pos(g).z }, { x: pos(g).x - 50, z: pos(g).z + 20 }];
    addMarker(g, a);
    addMarker(g, b);
    const view: MapView = { cx: pos(g).x, cz: pos(g).z, scale: 4, w: 1280, h: 720 };
    const pins = gatherMarks(g, view, hubRealm(g), true, 7, 1).marks.filter((m) => m.kind === 'marker');
    expect(pins).toHaveLength(2);
    const first = pins.find((m) => m.at === g.overworld!.markers[0])!;
    expect(first.title).toBe('Your marker');
    expect(first.name).toBe('30 m away');
    expect(first.note).toMatch(/remove/i);
    expect(first.x).toBeCloseTo(screenX(view, a.x), 5);
    expect(first.y + PIN_TIP * first.r).toBeCloseTo(screenY(view, a.z), 5); // the pin's point is on the place
    expect(gatherMarks(g, view, hubRealm(g), false, 5, 1).marks.some((m) => m.kind === 'marker')).toBe(false);
    expect(markAt(pins, first.x + reach('marker', first.r) - 1, first.y)?.at).toBe(g.overworld!.markers[0]); // picked by its head: it says which of them
    removeMarker(g, first.at!);
    expect(gatherMarks(g, view, hubRealm(g), true, 7, 1).marks.filter((m) => m.kind === 'marker')).toHaveLength(1);
    clearMarkers(g);
    expect(gatherMarks(g, view, hubRealm(g), true, 7, 1).marks.some((m) => m.kind === 'marker')).toBe(false);
  });
});
