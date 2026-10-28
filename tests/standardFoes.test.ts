import { describe, expect, it } from 'vitest';
import { ATTACKS } from '../src/data/attacks';
import { PLAYER_MOVES } from '../src/data/moves';
import { PLAYER } from '../src/data/tuning';
import { PRESS_CAP, PRESS_VERMIN, REGION_PRESS, capFor, landScale } from '../src/data/regionPress';
import { REGIONS } from '../src/data/regions';
import { ENTITIES, getEntity, variantOf } from '../src/data/registry';
import { morph, spawnCreature } from '../src/systems/creatures';
import { foeDamage } from '../src/systems/cycles';
import { createGame } from '../src/systems/game';
import { regionAt, regionRect } from '../src/world/worldMap';

const of = (id: string) => getEntity(id)!;
const poiseOf = (id: 'light1' | 'light2' | 'light3' | 'heavy1'): number => PLAYER_MOVES[id].hit!.poise;
const LIGHT = poiseOf('light1');
const TWO = poiseOf('light1') + poiseOf('light2');
const CHAIN = TWO + poiseOf('light3');
const HEAVY = poiseOf('heavy1');

/** Vermin, and the one bird that does not fight: a cane-light still drops the vermin. */
const VERMIN = new Set(['zoog', 'rat_swarm', 'wamp', 'cat_from_saturn', 'child_of_yig']);
/** Bodies a cane heavy does not put down. The light chain still does. A man and a priest are not among them. */
const HEAVY_STANDS = new Set(['deep_one', 'ghoul', 'ghast', 'night_gaunt', 'man_of_leng', 'winged_hybrid', 'nameless_city_reptile', 'gnoph_keh']);

const mid = (id: string): { x: number; z: number; yaw: number } => {
  const rect = regionRect(REGIONS.find((r) => r.id === id)!);
  return { x: (rect.x0 + rect.x1) / 2, z: (rect.z0 + rect.z1) / 2, yaw: 0 };
};

describe('standard foes, by the stories and by the land', () => {
  it('names a press for every region, rising with the horrors that live there', () => {
    expect(Object.keys(REGION_PRESS).sort()).toEqual(REGIONS.map((r) => r.id).sort());
    expect(REGION_PRESS.hub).toBeLessThan(REGION_PRESS.arkham);
    expect(REGION_PRESS.arkham).toBeLessThan(REGION_PRESS.innsmouth);
    expect(REGION_PRESS.innsmouth).toBeLessThan(REGION_PRESS.rlyeh);
    expect(REGION_PRESS.rlyeh).toBeLessThan(REGION_PRESS.court_centre);
    expect(REGION_PRESS.arkham).toBeLessThan(REGION_PRESS.dreamlands);
    expect(REGION_PRESS.mountains).toBeGreaterThan(REGION_PRESS.dunwich);
  });

  it('presses a body against the mildest region it inhabits, and never off the land or past its tier', () => {
    const deep = of('deep_one');
    const rat = of('rat_swarm');
    expect(landScale(deep.regions, 'innsmouth', 'lesser')).toBe(1);
    expect(landScale(deep.regions, 'rlyeh', 'lesser')).toBeGreaterThan(1);
    expect(landScale(deep.regions, 'hub', 'lesser')).toBe(1);
    expect(landScale(deep.regions, undefined, 'lesser')).toBe(1);
    expect(landScale(rat.regions, 'hub', 'lesser', capFor(rat.id, 'lesser'))).toBe(1);
    const wood = landScale(rat.regions, 'black_wood', 'lesser', capFor(rat.id, 'lesser'));
    expect(wood).toBe(PRESS_VERMIN);
    expect(wood).toBeGreaterThan(landScale(rat.regions, 'arkham', 'lesser', capFor(rat.id, 'lesser')));
    expect(landScale(rat.regions, 'arkham', 'lesser', capFor(rat.id, 'lesser'))).toBeGreaterThan(1);
    expect(wood).toBeLessThan(PRESS_CAP.lesser);
    expect(landScale(of('mi_go').regions, 'black_wood', 'greater')).toBe(PRESS_CAP.greater);
    expect(landScale(of('shoggoth').regions, 'mountains', 'greater')).toBe(1);
    expect(landScale(deep.regions, 'court_centre', 'great_old_one')).toBe(1);
  });

  it('spawns the pressed health where the creature stands, and leaves the hub, the arena and a horror alone', () => {
    const g = createGame();
    const deep = of('deep_one');
    const scale = landScale(deep.regions, 'rlyeh', 'lesser');
    const there = spawnCreature(g, 'deep_one', mid('rlyeh'))!;
    expect(regionAt(mid('rlyeh').x, mid('rlyeh').z)!.id).toBe('rlyeh');
    expect(g.ecs.c.health.get(there)!.max).toBe(Math.round(deep.stats.hp * scale));
    expect(g.ecs.c.dread.get(there)!.land).toBeCloseTo(scale);
    expect(foeDamage(g, there)).toBeCloseTo(scale);
    expect(g.ecs.c.combatant.get(there)!.bounty).toBe(deep.drops.echoes);
    const home = spawnCreature(g, 'deep_one', mid('hub'))!;
    expect(g.ecs.c.health.get(home)!.max).toBe(deep.stats.hp);
    expect(foeDamage(g, home)).toBe(1);
    const off = spawnCreature(g, 'deep_one', { x: 4, z: -9, yaw: 0 })!;
    expect(regionAt(4, -9)).toBeUndefined();
    expect(g.ecs.c.health.get(off)!.max).toBe(deep.stats.hp);
    expect(foeDamage(g, off)).toBe(1);
    const boss = spawnCreature(g, 'father_dagon', mid('rlyeh'))!;
    expect(g.ecs.c.dread.get(boss)!.land).toBe(1);
    expect(g.ecs.c.health.get(boss)!.max).toBe(of('father_dagon').stats.hp);
    morph(g, there, 'deep_one', 'eldritch');
    const form = variantOf(deep, 'eldritch')!;
    expect(g.ecs.c.health.get(there)!.max).toBe(Math.round(form.stats.hp * scale));
    expect(g.ecs.c.dread.get(there)!.land).toBeCloseTo(scale);
  });

  it('keeps vermin slight, a man standing through two lights, and a heavy body through a cane heavy', () => {
    for (const e of ENTITIES) {
      if (e.tier !== 'lesser' || e.stats.damage === 0) continue;
      const arch = e.behavior.archetype;
      if (VERMIN.has(e.id) || arch === 'swarm') expect(e.stats.poise, e.id).toBeLessThan(LIGHT);
      else if (arch === 'brute' || HEAVY_STANDS.has(e.id)) {
        expect(e.stats.poise, e.id).toBeGreaterThan(HEAVY);
        expect(e.stats.poise, e.id).toBeLessThan(CHAIN);
      } else {
        expect(e.stats.poise, e.id).toBeGreaterThan(TWO);
        expect(e.stats.poise, e.id).toBeLessThanOrEqual(HEAVY);
      }
    }
    expect(of('albino_penguin').stats.damage).toBe(0);
    expect(of('albino_penguin').behavior.attacks).toEqual([]);
  });

  it('orders the lesser by the stories, and leaves the greater order as it stood', () => {
    const s = (id: string) => of(id).stats;
    expect(s('zoog').damage).toBeLessThan(s('cthulhu_cultist').damage);
    expect(s('cthulhu_cultist').damage).toBeLessThan(s('ghoul').damage);
    expect(s('ghoul').damage).toBeLessThan(s('deep_one').damage);
    expect(s('deep_one').damage).toBeLessThan(s('gnoph_keh').damage);
    expect(s('innsmouth_hybrid').damage).toBeLessThanOrEqual(s('deep_one').damage);
    expect(s('ghoul').hp).toBeLessThan(s('ghast').hp);
    expect(s('ghast').hp).toBeLessThan(s('deep_one').hp);
    expect(s('deep_one').hp).toBeLessThan(s('moon_beast').hp);
    expect(s('moon_beast').hp).toBeLessThan(s('gyaa_yothn').hp);
    expect(s('man_of_leng').hp).toBeLessThan(s('moon_beast').hp);
    expect(s('ghoul').poise).toBeLessThan(s('ghast').poise);
    expect(s('ghast').poise).toBeLessThanOrEqual(s('gnoph_keh').poise);
    expect(s('dagon_priest').poise).toBeGreaterThan(TWO);
    expect(s('moon_bog_wraith').poise).toBeGreaterThan(TWO);
    expect(s('exham_troglodyte').poise).toBeLessThanOrEqual(HEAVY);
    expect(s('rat_swarm').damage).toBeLessThan(s('deep_one').damage);
    expect(s('mi_go').hp).toBeLessThan(s('elder_thing').hp);
    expect(s('elder_thing').hp).toBeLessThan(s('shoggoth').hp);
    expect(s('dhole').hp).toBeGreaterThan(s('gug').hp);
    expect(s('star_spawn').hp).toBeGreaterThan(s('shoggoth').hp);
    const ratCap = capFor('rat_swarm', 'lesser');
    const bite = Math.round(Math.round(s('rat_swarm').damage * ATTACKS.bite.power) * landScale(of('rat_swarm').regions, 'black_wood', 'lesser', ratCap));
    expect(bite * 12).toBeLessThan(PLAYER.hp); // a dozen bites, about what a swarm lands while a gate is walked
    const sweep = s('deep_one').damage * ATTACKS.sweep.power * landScale(of('deep_one').regions, 'innsmouth', 'lesser');
    expect(bite).toBeLessThan(sweep);
    for (const id of ['ghoul', 'cthulhu_cultist', 'man_of_leng', 'martense_degenerate']) {
      expect(of(id).behavior.attacks, id).toContain('combo');
    }
    for (const id of ['zoog', 'albino_penguin', 'dagon_priest', 'rat_swarm', 'child_of_yig', 'deep_one', 'reanimated_corpse', 'exham_troglodyte']) {
      expect(of(id).behavior.attacks, id).not.toContain('combo');
    }
    expect(of('reanimated_corpse').stats.damage).toBeLessThanOrEqual(14);
    expect(of('exham_troglodyte').stats.damage).toBeLessThanOrEqual(14);
    expect(variantOf(of('innsmouth_hybrid'), 'eldritch')!.stats.damage).toBeGreaterThan(s('innsmouth_hybrid').damage);
  });
});
