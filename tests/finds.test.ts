/**
 * Weapons and relics found (round 60: "many users obtain them without sufficient awareness of the process or inventory status"):
 * each is marked new until it has been looked at, says so by an event a card answers once the investigator is free, and the
 * Arms page can tell what is found of what there is, and where the rest is rumoured to lie.
 */
import { describe, expect, it } from 'vitest';
import { FINDS } from '../src/data/tuning';
import { QUESTS } from '../src/data/quests';
import { RELIC_IDS, RELIC_SLOTS } from '../src/data/relics';
import { WEAPON_IDS, WEAPON_WHERE, type WeaponId } from '../src/data/weapons';
import { equip, takeUp } from '../src/systems/arms';
import { setArena } from '../src/systems/bossFight';
import { spawnCreature } from '../src/systems/creatures';
import { clearNew, due, free, isNew, newFinds, temperOf, weaponFigureList, weaponFigures } from '../src/systems/finds';
import { createWorldGame } from '../src/systems/game';
import { owned, slotsOf } from '../src/systems/relics';
import { worldLayout } from '../src/world/placements';
import { record } from './worldHelpers';

describe('a weapon found (round 60)', () => {
  it('is theirs, marked new, said in a Notice and a Found event, and taken only once', () => {
    const g = createWorldGame();
    const [found, said] = [record(g, 'Found'), record(g, 'Notice')];
    takeUp(g, 'razor');
    expect(g.player.arms).toContain('razor');
    expect(isNew(g, 'weapon', 'razor')).toBe(true);
    expect(found).toEqual([{ kind: 'weapon', id: 'razor', from: undefined }]);
    expect(said.at(-1)!.text).toMatch(/STRAIGHT RAZOR · A NEW WEAPON/);
    takeUp(g, 'razor');
    expect(found).toHaveLength(1); // not again
    expect(g.player.weapon).toBe('cane'); // and found is not taken up: that is the card's asking, or the Arms page's
  });

  it("names who gave it: a quest's gift says whose it was", () => {
    const g = createWorldGame();
    const found = record(g, 'Found');
    takeUp(g, 'rapier', "The Toad of N'kai");
    expect(found[0]).toMatchObject({ kind: 'weapon', id: 'rapier', from: "The Toad of N'kai" });
  });

  it('is marked looked at when the page that shows it has, one at a time or all together, and counted until then', () => {
    const g = createWorldGame();
    takeUp(g, 'razor');
    takeUp(g, 'axe');
    expect(newFinds(g)).toBe(2);
    clearNew(g, 'weapon', 'razor');
    expect([isNew(g, 'weapon', 'razor'), isNew(g, 'weapon', 'axe'), newFinds(g)]).toEqual([false, true, 1]);
    clearNew(g);
    expect(newFinds(g)).toBe(0);
  });

  it('is held against the one in hand in figures: green where better, red where worse, none for the one in hand', () => {
    const g = createWorldGame();
    const razor = weaponFigureList(g, 'razor');
    expect(razor.find((f) => f.text.startsWith('Light blow'))!.tone).toBe('bad'); // the cane hits harder
    expect(razor.find((f) => f.text.includes('stamina'))!.tone).toBe('good'); // and costs more to swing
    expect(razor.find((f) => f.text.startsWith('Reach'))!.tone).toBe('bad');
    const same = weaponFigureList(g, 'cane');
    expect(same.every((f) => f.tone === 'dim' && !f.text.includes('('))).toBe(true);
    takeUp(g, 'razor');
    equip(g, 'razor');
    expect(weaponFigureList(g, 'cane').find((f) => f.text.startsWith('Light blow'))!.tone).toBe('good'); // and the other way about
    expect(weaponFigures(g, 'razor').light).toBeLessThan(weaponFigures(g, 'cane').light);
  });

  it("tells a weapon's temper, where it has one", () => {
    expect(temperOf('cutlass')).toMatch(/Salt-rusted/);
    expect(temperOf('cane')).toBeUndefined();
  });

  it('has a rumour of where each weapon but the first is to be had, and the rumours are true: each lies somewhere or is a quest\'s gift', () => {
    const lying = new Set(worldLayout().tomes.flatMap((t) => (t.weapon ? [t.weapon] : [])));
    const given = new Set(Object.values(QUESTS).flatMap((q) => (q.reward.weapon ? [q.reward.weapon] : [])));
    for (const id of WEAPON_IDS.filter((w): w is Exclude<WeaponId, 'cane'> => w !== 'cane')) {
      expect(WEAPON_WHERE[id], id).toMatch(/\./);
      expect(lying.has(id) || given.has(id), id).toBe(true);
    }
    expect(WEAPON_IDS.filter((w) => w !== 'cane').length).toBe(Object.keys(WEAPON_WHERE).length);
  });
});

describe('a relic found (round 60)', () => {
  const slay = (g: ReturnType<typeof createWorldGame>, name: string): void => void g.events.emit('Vanquished', { entity: 0, name });

  it("is theirs and worn at once while a slot is free, marked new, and said in a Notice and a Found event with who left it", () => {
    const g = createWorldGame();
    const [found, said] = [record(g, 'Found'), record(g, 'Notice')];
    slay(g, 'Wilbur Whateley');
    expect(owned(g)).toHaveLength(1);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ kind: 'relic', from: 'Wilbur Whateley', worn: true });
    expect(isNew(g, 'relic', found[0].id)).toBe(true);
    expect(said.at(-1)!.text).toMatch(/^RELIC · .* · WORN$/);
  });

  it('is kept, not worn, once the slots are full, and the Found event says so', () => {
    const g = createWorldGame();
    const found = record(g, 'Found');
    for (let i = 0; i < RELIC_SLOTS + 1; i++) slay(g, `Horror ${'x'.repeat(i + 3)}`);
    expect(found.map((f) => f.worn)).toEqual([true, true, false]);
    expect(slotsOf(g).filter(Boolean)).toHaveLength(RELIC_SLOTS);
    expect(owned(g)).toHaveLength(RELIC_SLOTS + 1);
    expect(RELIC_IDS.length).toBeGreaterThan(RELIC_SLOTS);
  });
});

describe('when a card may open (round 60)', () => {
  it('only once the investigator is free: no scene, no fight, none hunting close, not fallen', () => {
    const g = createWorldGame();
    expect(free(g)).toBe(true);
    g.cutscene = {} as never;
    expect(free(g)).toBe(false);
    g.cutscene = null as never;
    expect(free(g)).toBe(true);
    const at = g.ecs.c.transform.get(g.player.id)!.pos;
    const boss = spawnCreature(g, 'keziah_mason', { x: at.x + 40, z: at.z, yaw: 0 })!;
    g.ecs.c.fight.get(boss)!.engaged = true;
    setArena(g, boss, { x: at.x + 40, z: at.z, radius: 30 });
    expect(free(g)).toBe(false); // a boss fight is on
    g.ecs.c.fight.get(boss)!.engaged = false;
    expect(free(g)).toBe(true);
    g.ecs.c.health.get(g.player.id)!.hp = 0;
    expect(free(g)).toBe(false);
  });

  it('waits its moment after the find: a weapon is felt first, a relic has its horror\'s banner and Echoes read', () => {
    const queue = [{ kind: 'relic' as const, id: 'starHook', at: 1000 }, { kind: 'weapon' as const, id: 'razor', at: 1000 }];
    expect(due(queue, 1000 + FINDS.wait.relic - 1)).toBeUndefined();
    expect(due(queue, 1000 + FINDS.wait.relic)?.id).toBe('starHook');
    expect(due([], 5000)).toBeUndefined();
    expect(FINDS.wait.relic).toBeGreaterThan(FINDS.wait.weapon);
    expect(due([queue[1]], 1000 + FINDS.wait.weapon)?.id).toBe('razor');
  });
});
