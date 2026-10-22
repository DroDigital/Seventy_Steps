/**
 * The colossi are struck where their picture shows them (tools/reviewed_look.py measures the painted body of each
 * boss form in three bands; a lathed colossus's hurt zones are never narrower than that). A mound or a body of
 * spheres keeps the zones it had.
 */
import { describe, expect, it } from 'vitest';
import { zoneShapes } from '../src/data/assemblyShape';
import { getEntity } from '../src/data/registry';
import { REVIEWED_BODY } from '../src/data/reviewedLook';
import { toCombatant } from '../src/systems/creatures';
import { zonesOf, zoneGap } from '../src/systems/hurt';
import { bossGame } from './bossHelpers';

const LATHED = ['cthulhu', 'father_dagon', 'mother_hydra', 'ghatanothoa', 'colossus_pyramids'];
const combatant = (id: string) => toCombatant(getEntity(id)!);

describe('the painted body in the fight', () => {
  it('is given to a lathed colossus as it is made a combatant, and to no other body', () => {
    for (const id of LATHED) expect(combatant(id).assembly?.painted, id).toEqual(REVIEWED_BODY[id]);
    for (const id of ['azathoth', 'shub_niggurath', 'yog_sothoth']) expect(combatant(id).assembly?.painted, id).toBeUndefined();
    expect(getEntity('cthulhu')!.assembly!.painted).toBeUndefined(); // the registry's recipe is left as written
  });

  it('widens each band of a lathed colossus to its picture, and never narrows one', () => {
    for (const id of LATHED) {
      const { assembly, radius, height } = combatant(id);
      const [own, fit] = [zoneShapes({ ...assembly!, painted: undefined }, radius, height, 1, false)!, zoneShapes(assembly, radius, height, 1, false)!];
      fit.forEach((z, band) => {
        expect(z.r, `${id} band ${band}`).toBeGreaterThanOrEqual(own[band].r);
        expect(z.r, `${id} band ${band}`).toBeGreaterThanOrEqual(REVIEWED_BODY[id][band] * height - 1e-9);
        expect(z.r, `${id} band ${band}`).toBeCloseTo(Math.max(own[band].r, REVIEWED_BODY[id][band] * height), 9);
        for (const key of ['x', 'z', 'y0', 'y1'] as const) expect(z[key], `${id} band ${band} ${key}`).toBe(own[band][key]);
      });
    }
  });

  it('widens the stooped head too, where it comes down in front of the face', () => {
    const { assembly, radius, height } = combatant('mother_hydra');
    const [down] = zoneShapes(assembly, radius, height, 1, true)!.slice(-1);
    const [own] = zoneShapes({ ...assembly!, painted: undefined }, radius, height, 1, true)!.slice(-1);
    expect(down.r).toBeGreaterThan(own.r);
    expect([down.z, down.y1]).toEqual([own.z, own.y1]);
  });

  it('leaves a mound and a body of spheres exactly as they were', () => {
    for (const id of ['azathoth', 'shub_niggurath', 'yog_sothoth']) {
      const { assembly, radius, height } = combatant(id);
      expect(zoneShapes(assembly, radius, height, 1, false), id).toEqual(zoneShapes({ ...assembly!, painted: undefined }, radius, height, 1, false));
    }
  });

  it('is struck at the edge of the picture: a blow past the old torso reaches Hydra', () => {
    const { g, boss } = bossGame('mother_hydra');
    const [, torso] = zonesOf(g, boss)!;
    const old = combatant('mother_hydra').radius * 0.95; // the torso as it was
    const radial = (old + torso.r) / 2; // between that and the picture's edge
    expect(torso.r).toBeGreaterThan(old);
    const at = g.ecs.c.transform.get(boss)!.pos;
    const y = at.y + (torso.y0 + torso.y1) / 2;
    const [a, b] = [{ x: at.x + radial, y, z: at.z }, { x: at.x + radial, y: y + 0.1, z: at.z }];
    const hit = zoneGap(g, boss, a, b, 0.01)!;
    expect(hit.gap2).toBeLessThan(1e-9);
    expect(hit.damage).toBeGreaterThan(0);
    const out = zoneGap(g, boss, { ...a, x: at.x + torso.r + 1 }, { ...b, x: at.x + torso.r + 1 }, 0.01)!; // and one past the picture still misses
    expect(out.gap2).toBeGreaterThan(0.5);
  });
});
