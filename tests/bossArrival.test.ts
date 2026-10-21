/**
 * Bosses are not seen from afar (round 60: "prevent players from detecting bosses, particularly large entities such as Cthulhu and
 * Father Dagon, from a distance while traversing the map, as this compromises immersion"): not drawn, locked on to or beheld until
 * roused as the investigator steps into the ring, and then they come into view, the great bodies of earth and sea up out of the ground.
 */
import { describe, expect, it } from 'vitest';
import { ARRIVAL } from '../src/data/bossTuning';
import { arrivalSeconds, arrivedBy, createArrivals, risenFrom, risesOut } from '../src/render/bossArrival';
import { lookOf } from '../src/render/creatureViews';
import { isUnroused, isUnseen } from '../src/systems/components';
import { startMove } from '../src/systems/actions';
import { spawnCreature } from '../src/systems/creatures';
import { createWorldGame } from '../src/systems/game';
import { inSight } from '../src/systems/insight';
import { aimPoint } from '../src/systems/lockOn';
import { createGame } from '../src/systems/game';
import { ENTITIES } from '../src/data/registry';
import { goTo } from './worldHelpers';

describe('how a horror comes into view', () => {
  it('takes longer the greater it is, within bounds', () => {
    expect(arrivalSeconds(2)).toBeCloseTo(ARRIVAL.least + ARRIVAL.perMetre * 2, 5);
    expect(arrivalSeconds(16)).toBeGreaterThan(arrivalSeconds(6));
    expect(arrivalSeconds(40)).toBeGreaterThan(arrivalSeconds(16));
    expect(arrivalSeconds(400)).toBe(ARRIVAL.most);
    expect(arrivalSeconds(0)).toBe(ARRIVAL.least);
  });

  it('comes slowly in and slowly to its full, never back', () => {
    const at = (s: number): number => arrivedBy(s, 16);
    expect(at(0)).toBe(0);
    expect(at(arrivalSeconds(16))).toBe(1);
    let last = 0;
    for (let s = 0; s <= 3; s += 0.05) {
      expect(at(s)).toBeGreaterThanOrEqual(last);
      last = at(s);
    }
    expect(at(arrivalSeconds(16) / 2)).toBeCloseTo(0.5, 5);
    expect(at(arrivalSeconds(16) * 0.1)).toBeLessThan(0.1); // eased: a slow beginning
  });

  it('the great bodies of earth and sea come up out of the ground, the rest are only dithered in', () => {
    expect(risesOut('lathe')).toBe(true);
    expect(risesOut('mound')).toBe(true);
    expect(risesOut('spheres')).toBe(false);
    expect(risesOut(undefined)).toBe(false);
    expect(risenFrom(0, true)).toBe(ARRIVAL.rise);
    expect(risenFrom(1, true)).toBe(0);
    expect(risenFrom(0.5, false)).toBe(0);
    expect(risenFrom(0.3, true)).toBeGreaterThan(risenFrom(0.6, true));
  });

  it('is shown unroused as nothing, then from the moment it is roused as far as its clock has run; what was never veiled is whole', () => {
    const a = createArrivals();
    expect(a.of(1, true, 10, 40, true)).toEqual({ appear: 0, sink: 0 });
    expect(a.of(1, true, 11, 40, true).appear).toBe(0); // however long it waited
    const first = a.of(1, false, 20, 40, true); // roused: its clock begins here, not before
    expect(first.appear).toBe(0);
    const half = a.of(1, false, 20 + arrivalSeconds(40) / 2, 40, true);
    expect(half.appear).toBeCloseTo(0.5, 5);
    expect(half.sink).toBeGreaterThan(0);
    expect(a.of(1, false, 20 + arrivalSeconds(40) + 1, 40, true)).toEqual({ appear: 1, sink: 0 });
    expect(a.of(1, false, 400, 40, true)).toEqual({ appear: 1, sink: 0 }); // and it stays whole
    expect(a.of(2, false, 5, 40, true)).toEqual({ appear: 1, sink: 0 }); // never seen unroused: a servant, or a creature that is not a boss
  });

  it('is veiled again if the fight is reset, and its clock begins afresh when it is roused again', () => {
    const a = createArrivals();
    a.of(1, true, 0, 16, false);
    a.of(1, false, 10, 16, false);
    a.of(1, false, 10 + arrivalSeconds(16) + 1, 16, false);
    expect(a.of(1, true, 30, 16, false).appear).toBe(0);
    expect(a.of(1, false, 31, 16, false).appear).toBe(0);
    expect(a.of(1, false, 31 + arrivalSeconds(16) / 2, 16, false).appear).toBeCloseTo(0.5, 5);
  });

  it('forgets the creatures that are gone', () => {
    const a = createArrivals();
    a.of(1, true, 0, 16, false);
    a.of(1, false, 5, 16, false);
    a.forget(new Set());
    expect(a.of(1, false, 5.5, 16, false).appear).toBe(1); // no longer known: not veiled
  });
});

describe('a boss of the open world is not seen until it is roused', () => {
  const place = (g: ReturnType<typeof createWorldGame>, id: string) => {
    const at = g.ecs.c.transform.get(g.player.id)!.pos;
    const e = spawnCreature(g, id, { x: at.x + 60, z: at.z, yaw: 0 })!;
    return e;
  };

  it('stands unroused in its ring, unseen: not drawn, not locked on to, not beheld, though it is there', () => {
    const g = createWorldGame();
    const boss = place(g, 'cthulhu');
    expect(g.ecs.c.fight.get(boss)!.engaged).toBe(false);
    expect(isUnroused(g, boss)).toBe(true);
    expect(isUnseen(g, boss)).toBe(true);
    expect(lookOf(g, boss, 0)).toBeNull();
    expect(inSight(g, boss)).toBe(false);
    expect(g.ecs.c.transform.has(boss)).toBe(true); // it is in the world all the same
  });

  it('is seen once roused, and veiled again when its fight is given up', () => {
    const g = createWorldGame();
    const boss = place(g, 'father_dagon');
    const f = g.ecs.c.fight.get(boss)!;
    f.engaged = true;
    expect(isUnroused(g, boss)).toBe(false);
    expect(isUnseen(g, boss)).toBe(false);
    expect(lookOf(g, boss, 0)).not.toBeNull();
    f.engaged = false; // reset: it gave up the chase, or the investigator fell
    expect(isUnroused(g, boss)).toBe(true);
    expect(lookOf(g, boss, 0)).toBeNull();
  });

  it('stays in view through its fall: its fight ends with its death, and a horror dying is not a horror not yet roused', () => {
    const g = createWorldGame();
    const boss = place(g, 'father_dagon');
    const f = g.ecs.c.fight.get(boss)!;
    f.engaged = true;
    g.ecs.c.health.get(boss)!.hp = 0;
    startMove(g.ecs.c.actor.get(boss)!, 'death');
    g.events.emit('Died', { entity: boss, killer: g.player.id, at: { ...g.ecs.c.transform.get(boss)!.pos } }); // registerFights ends the fight: engaged is false from here
    expect(f.engaged).toBe(false);
    expect(isUnroused(g, boss)).toBe(false);
    expect(isUnseen(g, boss)).toBe(false);
    expect(lookOf(g, boss, 0)).not.toBeNull(); // the death animation is drawn
  });

  it('is shown at once in the combat arena and the bestiary, which have no open world: the viewers show every creature', () => {
    const g = createGame({ creature: 'cthulhu' });
    const boss = [...g.ecs.c.fight.keys()][0];
    expect(boss).toBeDefined();
    expect(isUnroused(g, boss)).toBe(false);
    expect(lookOf(g, boss, 0)).not.toBeNull();
  });

  it('is no creature that is not a boss: it stands as it always did', () => {
    const g = createWorldGame();
    const at = g.ecs.c.transform.get(g.player.id)!.pos;
    const foe = spawnCreature(g, ENTITIES.find((e) => !e.bossScript && e.tier === 'lesser')!.id, { x: at.x + 8, z: at.z, yaw: 0 })!;
    expect(isUnroused(g, foe)).toBe(false);
    expect(aimPoint(g, foe)).not.toBeNull();
  });

  it('has its servants as they were: a summoned boss fights as a servant and is seen', () => {
    const g = createWorldGame();
    goTo(g, 0, 0);
    const boss = place(g, 'yig');
    g.ecs.c.fight.delete(boss); // a summoned boss fights as a servant, not a fight of its own (specials.ts)
    expect(isUnroused(g, boss)).toBe(false);
    expect(isUnseen(g, boss)).toBe(false);
  });
});
