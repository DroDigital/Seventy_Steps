/**
 * The marker on the map (round 60: "add the ability to set a marker on the map, that has its own minimap arrow indicator"): one place,
 * set from the full map, kept in the save, pointed to by the minimap's rim in a pointer of its own, cleared on coming to it.
 */
import { describe, expect, it } from 'vitest';
import { MARKER } from '../src/data/tuning';
import { createWorldGame } from '../src/systems/game';
import { markable, markerDistance, markerHere, markerSystem, setMarker } from '../src/systems/marker';
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

describe('setting the marker (round 60)', () => {
  it('is one place on the ground, set and cleared; the black beyond the world is no place, nor are the numbers that are not', () => {
    const g = createWorldGame();
    const here = { x: pos(g).x + 40, z: pos(g).z + 10 };
    expect(setMarker(g, here)).toBe(true);
    expect(g.overworld!.marker).toEqual(here);
    expect(setMarker(g, { x: here.x + 5, z: here.z })).toBe(true); // set again: it moves, there is only one
    expect(g.overworld!.marker!.x).toBe(here.x + 5);
    expect(markable({ x: 1e7, z: 1e7 })).toBe(false);
    expect(setMarker(g, { x: 1e7, z: 1e7 })).toBe(false);
    expect(setMarker(g, { x: NaN, z: 0 })).toBe(false);
    expect(g.overworld!.marker!.x).toBe(here.x + 5); // a refused one leaves what stood
    expect(setMarker(g, null)).toBe(true);
    expect(g.overworld!.marker).toBeNull();
  });

  it('shows in the realm it is set in, and is kept, and not shown, in another', () => {
    const g = createWorldGame();
    const other = allRealms().find((r) => r !== hubRealm(g) && r[0].id !== hubRealm(g)[0].id)!;
    const rc = regionRect(other[0]);
    setMarker(g, { x: (rc.x0 + rc.x1) / 2, z: (rc.z0 + rc.z1) / 2 });
    expect(g.overworld!.marker).not.toBeNull();
    expect(markerHere(g)).toBeNull();
    expect(markerDistance(g)).toBeNull();
    const near = { x: pos(g).x + 20, z: pos(g).z };
    setMarker(g, near);
    expect(markerHere(g)).toEqual(near);
    expect(markerDistance(g)).toBeCloseTo(20, 5);
  });

  it('is cleared, with a word, on coming within reach of it, and not before', () => {
    const g = createWorldGame();
    const said = record(g, 'Notice');
    setMarker(g, { x: pos(g).x + MARKER.arrive + 5, z: pos(g).z });
    markerSystem(g);
    expect(g.overworld!.marker).not.toBeNull();
    expect(said).toHaveLength(0);
    setMarker(g, { x: pos(g).x + MARKER.arrive - 1, z: pos(g).z });
    markerSystem(g);
    expect(g.overworld!.marker).toBeNull();
    expect(said.map((n) => n.text)).toEqual(['MARKER REACHED']);
  });

  it('is kept in the save, and an old save, or one with none, has none', () => {
    const g = createWorldGame();
    expect(snapshot(g).marker).toBeUndefined();
    const at = { x: pos(g).x + 60, z: pos(g).z - 30 };
    setMarker(g, at);
    const json = JSON.stringify(snapshot(g));
    const back = createWorldGame();
    applySave(back, parseSave(json)!);
    expect(back.overworld!.marker!.x).toBeCloseTo(at.x, 0);
    expect(back.overworld!.marker!.z).toBeCloseTo(at.z, 0);
    const bad = JSON.parse(json);
    bad.marker = { x: 'far', z: 2 };
    expect(parseSave(JSON.stringify(bad))).toBeNull(); // not a place: the save is not read as good
    delete bad.marker;
    const plain = createWorldGame();
    setMarker(plain, at);
    applySave(plain, parseSave(JSON.stringify(bad))!);
    expect(plain.overworld!.marker).toBeNull();
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

describe('the marker on the full map (round 60)', () => {
  it('is a mark of its own on the full map, its point on the place, with the way to clear it; the minimap draws none (it points)', () => {
    const g = createWorldGame();
    const at = { x: pos(g).x + 30, z: pos(g).z };
    setMarker(g, at);
    const view: MapView = { cx: pos(g).x, cz: pos(g).z, scale: 4, w: 1280, h: 720 };
    const full = gatherMarks(g, view, hubRealm(g), true, 7, 1).marks.find((m) => m.kind === 'marker')!;
    expect(full).toBeDefined();
    expect(full.title).toBe('Your marker');
    expect(full.name).toBe('30 m away');
    expect(full.note).toMatch(/clear/i);
    expect(full.x).toBeCloseTo(screenX(view, at.x), 5);
    expect(full.y + PIN_TIP * full.r).toBeCloseTo(screenY(view, at.z), 5); // the pin's point is on the place
    expect(gatherMarks(g, view, hubRealm(g), false, 5, 1).marks.some((m) => m.kind === 'marker')).toBe(false);
    expect(markAt([full], full.x + reach('marker', full.r) - 1, full.y)?.kind).toBe('marker'); // picked by its head
    setMarker(g, null);
    expect(gatherMarks(g, view, hubRealm(g), true, 7, 1).marks.some((m) => m.kind === 'marker')).toBe(false);
  });
});
