/**
 * The attacks of round 70 (asked: "numerous boss encounters exhibit repetitive and nearly identical mechanics. It is recommended that more
 * distinct, lore-consistent attacks be implemented, particularly for high-tier bosses, such as tidal surges, tentacular strikes, meteor
 * showers, conflagrations, and toxic or hallucinogenic clouds"): a wall of water down a lane, tentacles that creep after the feet and
 * lock, stars and lightning that fall on a shower of marks, three lines of flame that burn on, and banks of poison and of dream that
 * drift after the investigator. Each is read by where it will be and by when, and none is a heavier blow than the horrors already had.
 */
import { describe, expect, it } from 'vitest';
import type { Entity } from '../src/core/ecs';
import { distXZ } from '../src/core/geom';
import { ATTACKS, compileAttack } from '../src/data/attacks';
import { st } from '../src/data/entities/kit';
import { ENTITIES } from '../src/data/registry';
import { ATTACK_IDS, type AttackId } from '../src/data/schema';
import { startMove } from '../src/systems/actions';
import type { Game } from '../src/systems/components';
import { planSpots } from '../src/systems/strikePlans';
import { place, scriptedGame, steps } from './helpers';
import { record } from './worldHelpers';

const NEW: readonly AttackId[] = ['tidal_surge', 'tentacle_rise', 'starfall', 'conflagration', 'toxic_cloud', 'dream_cloud', 'thunderfall'];
const STATS = st(500, 50, 20, 3, 1, 5);

function armed(gap: number): { g: Game; player: Entity; foe: Entity } {
  const { g, player, deepOne } = scriptedGame();
  place(g, deepOne, 0, 5, 0);
  place(g, player, 0, 5 + gap, Math.PI);
  const a = g.ecs.c.actor.get(deepOne)!;
  a.moves = { ...a.moves, ...Object.fromEntries(ATTACK_IDS.map((id) => [id, compileAttack(id, STATS, 1.9)])) };
  return { g, player, foe: deepOne };
}
const attack = (g: Game, foe: Entity, id: AttackId): void => startMove(g.ecs.c.actor.get(foe)!, id);
function until(g: Game, done: () => boolean, max = 400): boolean {
  for (let i = 0; i < max && !done(); i++) steps(g, 1);
  return done();
}

describe('the new attacks, as data', () => {
  it('are all in the library, each with its own matter and none the heaviest blow of a horror', () => {
    for (const id of NEW) expect(ATTACKS[id], id).toBeDefined();
    for (const id of NEW) expect(ATTACKS[id].power, id).toBeLessThanOrEqual(1.3); // (the eruption's: a horror's heaviest blows are its crushing and delayed ones)
    expect(new Set(NEW.map((id) => ATTACKS[id].marks?.look ?? ATTACKS[id].cloud?.kind ?? (ATTACKS[id].wave?.lane ? 'lane' : id))).size).toBe(NEW.length);
  });

  it('compile into the moves they should be, scaled to the body but not past a colossus\'s court', () => {
    const small = compileAttack('tidal_surge', STATS, 1.9);
    const huge = compileAttack('tidal_surge', STATS, 40);
    expect(small.wave?.lane).toBeDefined();
    expect(huge.wave!.lane!.half).toBeLessThan(small.wave!.lane!.half * 1.4);
    expect(huge.wave!.speed).toBeLessThan(small.wave!.speed * 1.4); // a wall of water moves at a pace a person can read, however large its horror
    expect(compileAttack('conflagration', STATS, 1.9).marks?.leaves?.fire).toBe(true);
    expect(compileAttack('dream_cloud', STATS, 1.9).cloud?.damage).toBe(0);
    expect(compileAttack('dream_cloud', STATS, 1.9).cloud?.mind).toBeGreaterThan(0);
    expect(compileAttack('toxic_cloud', STATS, 1.9).cloud?.mind).toBe(0);
    expect(compileAttack('toxic_cloud', STATS, 40).cloud!.radius).toBeLessThan(compileAttack('toxic_cloud', STATS, 1.9).cloud!.radius * 1.7);
  });

  it('lays marks in lines, in a shower and in a ring, as each is meant to be', () => {
    const rng = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    const centre = { x: 0, z: 10 };
    const from = { x: 0, z: 0 };
    const lines = planSpots({ ...compileAttack('conflagration', STATS, 1.9).marks! }, centre, from, 0.5, rng);
    expect(lines).toHaveLength(12);
    const angles = new Set(lines.map((s) => Math.round((Math.atan2(s.at.x - from.x, s.at.z - from.z) * 180) / Math.PI / 5) * 5));
    expect(angles.size).toBe(3);
    expect(Math.max(...lines.map((s) => s.order))).toBe(3); // four on a line, the near ones first
    const rain = planSpots(compileAttack('starfall', STATS, 1.9).marks!, centre, from, 0.5, rng);
    expect(rain).toHaveLength(9);
    expect(distXZ(rain[0].at, centre)).toBeLessThan(0.01);
    for (const a of rain) for (const b of rain) if (a !== b) expect(distXZ(a.at, b.at)).toBeGreaterThan(1.2);
    const seek = planSpots(compileAttack('tentacle_rise', STATS, 1.9).marks!, centre, from, 0.5, rng);
    expect(seek.map((s) => s.order)).toEqual([0, 1, 2]);
  });
});

describe('the new attacks, played', () => {
  it('a tidal surge comes down a lane: it strikes whoever stands in it once and shoves them on, and misses whoever stands beside it', () => {
    const { g, player, foe } = armed(7);
    const hits = record(g, 'Hit');
    attack(g, foe, 'tidal_surge');
    expect(until(g, () => g.ecs.c.wave.size > 0)).toBe(true);
    const wave = [...g.ecs.c.wave.values()][0];
    expect(wave.lane).toBeDefined();
    expect(until(g, () => hits.length > 0)).toBe(true);
    expect(hits.filter((h) => h.attacker === foe)).toHaveLength(1);
    const z = g.ecs.c.transform.get(player)!.pos.z;
    steps(g, 20);
    expect(g.ecs.c.transform.get(player)!.pos.z).toBeGreaterThan(z + 1);
    // and from beside the lane, 12 m off its line, nothing touches them
    const b = armed(7);
    const missed = record(b.g, 'Hit');
    attack(b.g, b.foe, 'tidal_surge');
    until(b.g, () => b.g.ecs.c.wave.size > 0);
    place(b.g, b.player, 12, 12, Math.PI);
    until(b.g, () => b.g.ecs.c.wave.size === 0, 400);
    expect(missed.filter((h) => h.attacker === b.foe)).toEqual([]);
  });

  it('tentacles creep after the feet, lock a breath before they rise, and rise where they locked', () => {
    const { g, player, foe } = armed(6);
    const hits = record(g, 'Hit');
    const up = record(g, 'Erupted');
    attack(g, foe, 'tentacle_rise');
    expect(until(g, () => g.ecs.c.mark.size === 3)).toBe(true);
    const marks = [...g.ecs.c.mark];
    const [lead] = marks.sort(([, a], [, b]) => a.delay - b.delay)[0];
    expect(marks.every(([, m]) => m.look === 'tentacle' && m.seek)).toBe(true);
    place(g, player, 5, 11, Math.PI); // the investigator moves off: the marks follow
    const before = distXZ(g.ecs.c.transform.get(lead)!.pos, g.ecs.c.transform.get(player)!.pos);
    steps(g, 20);
    expect(distXZ(g.ecs.c.transform.get(lead)!.pos, g.ecs.c.transform.get(player)!.pos)).toBeLessThan(before);
    until(g, () => g.ecs.c.mark.get(lead)!.delay <= g.ecs.c.mark.get(lead)!.seek!.lock);
    const held = { ...g.ecs.c.transform.get(lead)!.pos };
    place(g, player, -8, 3, Math.PI); // and away, after it has locked
    steps(g, 6);
    expect(g.ecs.c.transform.get(lead)!.pos).toEqual(held);
    until(g, () => up.length > 0);
    expect(up[0].look).toBe('tentacle');
    expect(hits.filter((h) => h.attacker === foe)).toEqual([]);
  });

  it('a conflagration burns on: every burst leaves a fire, and the gaps between the lines are clear', () => {
    const { g, foe } = armed(6);
    attack(g, foe, 'conflagration');
    expect(until(g, () => g.ecs.c.mark.size === 12)).toBe(true);
    expect([...g.ecs.c.mark.values()].every((m) => m.look === 'flame' && m.leaves?.fire)).toBe(true);
    until(g, () => g.ecs.c.mark.size === 0);
    expect(g.ecs.c.hazard.size).toBe(12);
    expect([...g.ecs.c.hazard.values()].every((h) => h.fire && h.life > 100)).toBe(true);
  });

  it('a shower of stars and of lightning falls on marks that burst one after another', () => {
    for (const [id, count, look] of [['starfall', 9, 'star'], ['thunderfall', 6, 'bolt']] as const) {
      const { g, foe } = armed(6);
      const bursts = record(g, 'Erupted');
      attack(g, foe, id);
      expect(until(g, () => g.ecs.c.mark.size === count), id).toBe(true);
      expect([...g.ecs.c.mark.values()].every((m) => m.look === look), id).toBe(true);
      until(g, () => g.ecs.c.mark.size === 0);
      expect(bursts, id).toHaveLength(count);
    }
  });

  it('a toxic cloud drifts after the investigator and hurts a tick at a time; a dreaming one takes the mind and leaves the body', () => {
    const toxic = armed(8);
    const lingering = record(toxic.g, 'Hit');
    attack(toxic.g, toxic.foe, 'toxic_cloud');
    expect(until(toxic.g, () => toxic.g.ecs.c.hazard.size === 2)).toBe(true);
    const [cloud] = [...toxic.g.ecs.c.hazard.keys()];
    const gap = () => distXZ(toxic.g.ecs.c.transform.get(cloud)!.pos, toxic.g.ecs.c.transform.get(toxic.player)!.pos);
    const before = gap();
    steps(toxic.g, 60);
    expect(gap()).toBeLessThan(before);
    place(toxic.g, toxic.player, toxic.g.ecs.c.transform.get(cloud)!.pos.x, toxic.g.ecs.c.transform.get(cloud)!.pos.z, Math.PI);
    until(toxic.g, () => lingering.some((h) => h.attacker === toxic.foe), 120);
    expect(lingering.filter((h) => h.attacker === toxic.foe).length).toBeGreaterThan(0);

    const dream = armed(8);
    const harm = record(dream.g, 'Hit');
    attack(dream.g, dream.foe, 'dream_cloud');
    expect(until(dream.g, () => dream.g.ecs.c.hazard.size === 2)).toBe(true);
    const [fog] = [...dream.g.ecs.c.hazard.keys()];
    dream.g.mind.sanity = 100;
    const health = dream.g.ecs.c.health.get(dream.player)!.hp;
    for (let i = 0; i < 180; i++) {
      const p = dream.g.ecs.c.transform.get(fog)!.pos;
      place(dream.g, dream.player, p.x, p.z, Math.PI); // it stands in the bank, wherever it drifts
      steps(dream.g, 1);
    }
    expect(dream.g.mind.sanity).toBeLessThan(100);
    expect(dream.g.ecs.c.health.get(dream.player)!.hp).toBe(health);
    expect(harm.filter((h) => h.attacker === dream.foe)).toEqual([]);
  });

  it('a cloud thins away once its horror is gone', () => {
    const { g, foe } = armed(8);
    attack(g, foe, 'toxic_cloud');
    until(g, () => g.ecs.c.hazard.size === 2);
    g.ecs.c.health.get(foe)!.hp = 0;
    expect(until(g, () => g.ecs.c.hazard.size === 0, 120)).toBe(true);
  });
});

describe('the new attacks, given to the horrors that they belong to', () => {
  const users = (id: AttackId): string[] =>
    ENTITIES.filter((e) => (e.bossScript ?? e.bossVariant?.bossScript)?.phases.some((p) => p.attacks.some((a) => a.id === id))).map((e) => e.id);

  it('are each some horrors\' own: at least two, and the tales\' own horrors in them', () => {
    for (const id of NEW) expect(users(id).length, id).toBeGreaterThanOrEqual(2);
    expect(users('tidal_surge')).toEqual(expect.arrayContaining(['cthulhu', 'father_dagon', 'bokrug']));
    expect(users('tentacle_rise')).toEqual(expect.arrayContaining(['cthulhu', 'mother_hydra']));
    expect(users('starfall')).toEqual(expect.arrayContaining(['yog_sothoth', 'great_ones']));
    expect(users('conflagration')).toEqual(expect.arrayContaining(['joseph_curwen', 'ghatanothoa']));
    expect(users('toxic_cloud')).toEqual(expect.arrayContaining(['tsathoggua', 'yig', 'colour_out_of_space', 'dr_munoz']));
    expect(users('dream_cloud')).toEqual(expect.arrayContaining(['hypnos', 'hastur', 'high_priest']));
    expect(users('thunderfall')).toEqual(expect.arrayContaining(['dunwich_horror', 'haunter_of_the_dark']));
  });
});
