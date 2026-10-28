import { describe, expect, it } from 'vitest';
import { START_SIGN } from '../src/data/sites';
import { signPlace, travel, travelBar } from '../src/systems/checkpoints';
import { isAbsent } from '../src/systems/components';
import { createWorldGame } from '../src/systems/game';
import { litSigns, padTravel, signAt, signToward } from '../src/ui/mapTravel';
import type { MapPlace } from '../src/world/mapData';
import { realmOf } from '../src/world/mapData';

describe('playtest round 7: fast travel from the map', () => {
  it('the map offers the realm’s lit signs, nearest first, and picks the one under the pointer', () => {
    const g = createWorldGame();
    const realm = realmOf(g.overworld!.region!);
    const here = g.ecs.c.transform.get(g.player.id)!.pos;
    expect(litSigns(g, realm, here).map((s) => s.id)).toEqual([START_SIGN]);
    g.overworld!.discovered.add('arkham_streets');
    g.overworld!.discovered.add('rlyeh_door'); // another realm: not on this map
    const lit = litSigns(g, realm, here);
    expect(lit.map((s) => s.id)).toEqual([START_SIGN, 'arkham_streets']);
    const s = lit[1];
    const view = { cx: s.x, cz: s.z, scale: 1, w: 400, h: 300 };
    expect(signAt(lit, view, 205, 148)?.id).toBe('arkham_streets'); // a few pixels off
    expect(signAt(lit, view, 240, 150)).toBeNull();
  });

  it('the pad picks a sign under its mark, or the one that way from the middle, and travels only once it is chosen', () => {
    const place = (id: string, x: number, z: number): MapPlace => ({ id, x, z, kind: 'sign', name: id, region: 'arkham', bosses: [] });
    const north = place('north', 0, 80); // +z is up the map
    const east = place('east', -90, 0); // −x is to the right
    const south = place('south', 10, -70);
    const signs = [north, east, south];
    const view = { cx: 0, cz: 0, scale: 2, w: 400, h: 300 };
    expect(signToward(signs, view, { x: 0, z: 0 }, { x: 0, y: -1 })?.id).toBe('north');
    expect(signToward(signs, view, { x: 0, z: 0 }, { x: 1, y: 0 })?.id).toBe('east');
    expect(signToward(signs, view, { x: 0, z: 0 }, { x: 0, y: 1 })?.id).toBe('south');
    expect(signToward(signs, view, { x: 0, z: 0 }, { x: -1, y: 0 })).toBeNull(); // nothing to the left
    expect(signToward(signs, view, north, { x: 0, y: -1 })).toBeNull(); // already on the northern sign: the next press does not pick it again
    const onNorth = { cx: north.x, cz: north.z, scale: 2, w: 400, h: 300 };
    expect(signToward(signs, onNorth, { x: onNorth.cx, z: onNorth.cz }, { x: 0, y: 1 })?.id).toBe('south');
    const here = place('here', 0, 0);
    const under = signAt([here, ...signs], view, 200, 150);
    expect(under?.id).toBe('here'); // the mark at the middle of the map
    expect(padTravel(under, null)).toBe('choose');
    expect(padTravel(under, under)).toBe('journey');
    expect(padTravel(east, under)).toBe('choose'); // a different sign under the mark is chosen before any journey
    expect(padTravel(null, north)).toBe('journey');
    expect(padTravel(null, null)).toBe('find');
  });

  it('no journey while a foe hunts close by, or a boss fight is on; otherwise the sign is reached', () => {
    const g = createWorldGame();
    expect(travelBar(g)).toBeNull();
    const foe = [...g.overworld!.alive.values()].find((e) => !isAbsent(g, e) && !g.ecs.c.fight.has(e))!;
    const p = g.ecs.c.transform.get(g.player.id)!.pos;
    g.ecs.c.transform.get(foe)!.pos = { x: p.x + 4, y: p.y, z: p.z };
    const br = g.ecs.c.brain.get(foe)!;
    Object.assign(br, { state: 'engage', target: g.player.id });
    expect(travelBar(g)).toBe('foes');
    Object.assign(br, { state: 'idle', target: null });
    const boss = g.ecs.spawn();
    g.ecs.c.fight.set(boss, { engaged: true } as never);
    g.ecs.c.health.set(boss, { hp: 100, max: 100, calm: 0 } as never);
    expect(travelBar(g)).toBe('boss');
    g.ecs.despawn(boss);
    expect(travelBar(g)).toBeNull();
    g.overworld!.discovered.add('arkham_streets');
    expect(travel(g, 'arkham_streets')).toBe(true);
    expect(g.ecs.c.transform.get(g.player.id)!.pos).toMatchObject({ x: signPlace('arkham_streets')!.rest.x, z: signPlace('arkham_streets')!.rest.z });
  });
});
