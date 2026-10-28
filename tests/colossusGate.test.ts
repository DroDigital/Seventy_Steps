/**
 * The Colossus pylon's doorway sits 6.3 m up its own mesh, with the lintel at 18.74 m and nothing under the threshold,
 * so the temple floated over a gate that already stood on the court. The mesh is set down onto that threshold.
 */
import { describe, expect, it } from 'vitest';
import { ARENA_HOUSES } from '../src/data/arenaHousesAll';
import { planPlace } from '../src/world/enclosurePlace';
import type { Emit } from '../src/world/placeEmit';

const SILL = 6.3;
const LINTEL = 18.74;
const FOOT = 0.15; // render/propMeshes draws a set piece this far into the ground

describe('the colossus gate', () => {
  const site = { x: 0, z: 0, y: 12, radius: 26, front: { x: 0, z: 1 } };
  const place = planPlace(ARENA_HOUSES.colossus_pyramids!, 'colossus_pyramids', site);
  const pylon = place.props.find((p) => p.set?.id === 'eg_pylon')!;
  const door = place.piece.door!;

  it('sets the pylon down so its threshold is the court the gate stands on', () => {
    expect(pylon.y - FOOT + SILL).toBeCloseTo(site.y, 5);
    expect(door.y).toBe(site.y);
    expect(door.width).toBe(9); // wider than the painted hole: the towers' colliders leave that opening, and this is what shuts it
    expect(site.y + door.height).toBeCloseTo(pylon.y - FOOT + LINTEL, 5);
  });

  it('brings the tower fires, banners and smoke down with the mesh', () => {
    const fires = place.props.filter((p) => p.set?.id === 'px_brazier' && p.y > site.y + 8);
    const flags = place.props.filter((p) => p.set?.id?.startsWith('tp_flag'));
    const smoke = (place.living ?? []).filter((l): l is Emit => l.kind === 'emit' && l.y[0] > 8);
    expect(fires).toHaveLength(2);
    expect(flags).toHaveLength(4);
    expect(smoke).toHaveLength(2);
    for (const f of fires) expect(f.y - pylon.y).toBeCloseTo(31.4, 5);
    for (const f of flags) expect(f.y - pylon.y).toBeCloseTo(7, 5);
    for (const s of smoke) expect(s.y[0]).toBeCloseTo(fires[0]!.y - site.y + 1.5, 5);
  });
});
