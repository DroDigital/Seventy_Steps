/**
 * Round 105 (asked: the spinning barrage "should never be 2 times in a row", "not almost every boss should have this attack, make it more variable
 * between bosses and integrate the full 3D room"; then a cooldown on the strong blows, chosen attacks over random ones, and a horror that learns):
 * the court patterns, the bolts that glance off walls, how a horror in its fight chooses, and that none of it leaves a horror standing idle.
 */
import { describe, expect, it } from 'vitest';
import type { Entity } from '../src/core/ecs';
import { distXZ } from '../src/core/geom';
import { ATTACKS, attackRange, compileAttack } from '../src/data/attacks';
import type { BrainDef } from '../src/data/archetypes';
import { st } from '../src/data/entities/kit';
import { ENTITIES } from '../src/data/registry';
import { ATTACK_IDS, type AttackId, type EntityDef } from '../src/data/schema';
import { CHOICE } from '../src/data/tuning';
import { startMove } from '../src/systems/actions';
import { chooseAttack, learnFrom, leaning, type Situation } from '../src/systems/attackChoice';
import type { Game } from '../src/systems/components';
import { courtSpots, COURT_MOST } from '../src/systems/courtPlans';
import { postsIn } from '../src/systems/courtPosts';
import { place, scriptedGame, steps } from './helpers';

const STATS = st(500, 50, 20, 3, 1, 5);
const NEW: readonly AttackId[] = ['rebound', 'mortar', 'procession', 'quartering', 'closing_walls', 'cave_in'];
const rngOf = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function armed(gap: number): { g: Game; player: Entity; foe: Entity } {
  const { g, player, dummy, deepOne } = scriptedGame();
  place(g, dummy, 30, 30, 0);
  place(g, deepOne, 0, 5, 0);
  place(g, player, 0, 5 + gap, Math.PI);
  const a = g.ecs.c.actor.get(deepOne)!;
  a.moves = { ...a.moves, ...Object.fromEntries(ATTACK_IDS.map((id) => [id, compileAttack(id, STATS, 1.9)])) };
  return { g, player, foe: deepOne };
}

/** Every scripted horror, its boss variants with them. */
const horrors = (): EntityDef[] => ENTITIES.flatMap((d) => [d.bossScript && d, d.bossVariant?.bossScript && ({ ...d, bossScript: d.bossVariant.bossScript } as EntityDef)].filter((x): x is EntityDef => !!x));
const heightOf = (d: EntityDef): number => (d.sprite?.scale ?? d.assembly?.scale ?? 1.9);

describe('the spinning barrage', () => {
  it("is left to four horrors whose tales it fits: Keziah's daggers, Zann at his window, the Daemon Pipers and Yog-Sothoth", () => {
    const has = horrors().filter((d) => d.bossScript!.phases.some((p) => p.attacks.some((a) => a.id === 'barrage'))).map((d) => d.id);
    expect(has.sort()).toEqual(['daemon_pipers', 'keziah_mason', 'yog_sothoth', 'zann_window_thing']);
  });

  it('every new pattern is some horror\'s, and none is heavier than the barrage it replaces by more than a little', () => {
    const used = new Set(horrors().flatMap((d) => d.bossScript!.phases.flatMap((p) => p.attacks.map((a) => a.id))));
    for (const id of NEW) {
      expect(used.has(id), id).toBe(true);
      expect(ATTACKS[id].once, id).toBe(true);
      expect(ATTACKS[id].power, id).toBeLessThanOrEqual(1);
    }
  });
});

describe('choosing a blow', () => {
  const brain = (ids: AttackId[]): BrainDef => ({ attacks: ids.map((id) => ({ move: id, weight: 1, range: [0, 30] as const })) }) as unknown as BrainDef;
  const calm = (recent: string[] = [], usedAt: Record<string, number> = {}, now = 10_000): Situation => ({ recent, usedAt, now, hidden: false, healing: false });

  it('never strikes a `once` blow twice running, nor while it rests, unless nothing else fits', () => {
    const rng = rngOf(3);
    const def = brain(['barrage', 'slam']);
    for (let i = 0; i < 200; i++) expect(chooseAttack(def, 2, rng, true, calm(['barrage']))).toBe('slam');
    const resting = calm(['slam', 'barrage'], { barrage: 10_000 - 60 });
    for (let i = 0; i < 200; i++) expect(chooseAttack(def, 2, rng, true, resting)).toBe('slam');
    expect(chooseAttack(brain(['barrage', 'quartering']), 2, rng, true, calm(['quartering'], { barrage: 9_990 }))).toBe('barrage'); // all resting: the rest gives way
    expect(chooseAttack(brain(['barrage']), 2, rng, true, calm(['barrage']))).toBeNull(); // the `once` never does
  });

  it('leans toward the middle of a bracket, toward what goes round cover when its quarry hides, toward quick blows into a dose', () => {
    const a = (move: AttackId) => ({ move, weight: 1, range: [0, 30] as const });
    expect(leaning(a('slam'), 15, calm(['slam']))).toBeCloseTo(CHOICE.sweet[2]);
    expect(leaning(a('slam'), 1, calm())).toBeCloseTo(1);
    const hidden = { ...calm(), hidden: true };
    expect(leaning(a('projectile'), 15, hidden)).toBeLessThan(leaning(a('mortar'), 15, hidden) / 3);
    expect(leaning(a('cave_in'), 15, hidden)).toBeGreaterThan(leaning(a('cave_in'), 15, calm()));
    const healing = { ...calm(), healing: true };
    expect(leaning(a('bite'), 15, healing)).toBeGreaterThan(leaning(a('crushing_blow'), 15, healing));
  });

  it('learns within a fight which blows land, within its cap, and still may strike any', () => {
    let learnt: Record<string, number> | undefined;
    for (let i = 0; i < 10; i++) learnt = learnFrom(learnt, 'slam', 'hit');
    for (let i = 0; i < 10; i++) learnt = learnFrom(learnt, 'sweep', 'dodged');
    expect(learnt).toEqual({ slam: 1, sweep: -1 });
    const s = { ...calm(), learnt };
    const a = (move: AttackId) => ({ move, weight: 1, range: [0, 30] as const });
    expect(leaning(a('slam'), 15, s) / leaning(a('slam'), 15, calm())).toBeCloseTo(1 + CHOICE.learn.most);
    expect(leaning(a('sweep'), 15, s)).toBeGreaterThan(0);
  });

  it('over a long fight, never strikes a `once` blow twice running', () => {
    const br = { recent: [] as string[] };
    const def = brain(['barrage', 'rebound', 'slam']);
    const rng = rngOf(11);
    let last = '';
    for (let i = 0; i < 300; i++) {
      const m = chooseAttack(def, 4, rng, true, calm(br.recent, {}, i * 1000))!;
      if (ATTACKS[m as AttackId].once) expect(m).not.toBe(last);
      last = m;
      br.recent = [m, ...br.recent].slice(0, 3);
    }
  });

  it('leaves no horror that cannot move without a blow where its only one would be a `once` struck last (one that can steps nearer)', () => {
    const bad = new Set<string>();
    for (const d of horrors()) {
      const mobile = d.behavior.params?.mobile !== false && d.behavior.archetype !== 'stationary_horror';
      if (mobile) continue;
      d.bossScript!.phases.forEach((p, i) => {
        const choices = p.attacks.map((a) => ({ move: a.id, range: attackRange(a.id, heightOf(d)) }));
        for (let x = 0; x <= 40; x += 0.5) {
          const near = choices.filter((a) => (!mobile || x >= a.range[0]) && x <= a.range[1]);
          if (near.length === 1 && ATTACKS[near[0].move].once) bad.add(`${d.id}:${i}:${near[0].move}`);
        }
      });
    }
    expect([...bad]).toEqual([]);
  });
});

describe('the court patterns', () => {
  const court = { x: 0, z: 0, radius: 14 };
  const marks = (id: AttackId) => compileAttack(id, STATS, 1.9).marks!;

  it('rows march out from the horror, one gap in each, the gap moving from row to row', () => {
    const m = marks('procession');
    const spots = courtSpots(m, { x: 0, z: 8 }, { x: 0, z: 0 }, 0.5, rngOf(5), court)!;
    const rows = [...new Set(spots.map((s) => s.order))];
    expect(rows).toEqual([0, 1, 2, 3]);
    const gaps: number[] = [];
    for (const r of rows) {
      const row = spots.filter((s) => s.order === r).map((s) => s.at.x).sort((a, b) => a - b);
      expect(row).toHaveLength(m.count - 1);
      const step = m.radius * 1.7;
      const missing = [...Array(m.count).keys()].map((j) => (j - (m.count - 1) / 2) * step).find((x) => !row.some((y) => Math.abs(y - x) < 0.01))!;
      gaps.push(missing);
    }
    for (let i = 1; i < gaps.length; i++) expect(Math.abs(gaps[i] - gaps[i - 1])).toBeGreaterThan(m.radius * 1.7 * 1.5);
  });

  it('quarters burst half and then the other half; the rim runs round inside the wall; no call lays more than its cap', () => {
    const q = courtSpots(marks('quartering'), { x: 0, z: 8 }, { x: 0, z: 0 }, 0.5, rngOf(9), court)!;
    expect(new Set(q.map((s) => s.order))).toEqual(new Set([0, 1]));
    expect(q.length).toBeLessThanOrEqual(COURT_MOST);
    const r = courtSpots(marks('closing_walls'), { x: 0, z: 8 }, { x: 0, z: 0 }, 0.5, rngOf(9), court)!;
    for (const s of r) expect(Math.hypot(s.at.x, s.at.z)).toBeLessThan(court.radius - marks('closing_walls').radius);
    expect(r.map((s) => s.order)).toEqual(r.map((_, i) => i));
    expect(r.length).toBeLessThanOrEqual(COURT_MOST);
  });

  it('a cave-in falls about the pillars nearest the target, and finds the arena\'s pillars but not its walls', () => {
    const { g } = scriptedGame();
    g.world.colliders.push({ kind: 'box', min: { x: -10, y: 0, z: 10 }, max: { x: 10, y: 4, z: 10.5 } }); // a wall's run
    const posts = postsIn(g.world, { x: 0, z: 0, radius: 16 });
    expect(posts.some((p) => Math.hypot(p.x + 8, p.z - 1) < 0.1)).toBe(true);
    expect(posts.some((p) => p.r > 2)).toBe(false);
    const target = { x: -7, z: 3 };
    const spots = courtSpots(marks('cave_in'), target, { x: 0, z: 0 }, 0.5, rngOf(4), court, posts)!;
    expect(spots.filter((s) => s.order === 0).map((s) => s.at)).toEqual([target]); // the first stone on the target
    const first = spots.filter((s) => s.order === 1);
    for (const s of first) expect(distXZ(s.at, { x: -8, z: 1 })).toBeLessThan(0.8 + marks('cave_in').radius + 0.01);
  });
});

describe('the bolts that glance', () => {
  it('come back off a wall instead of breaking on it', () => {
    const { g, foe } = armed(6);
    g.world.colliders.push({ kind: 'box', min: { x: -3, y: 0, z: 9 }, max: { x: 3, y: 4, z: 9.5 } });
    const landed: string[] = [];
    g.events.on('BoltLanded', (e) => void landed.push(e.on));
    startMove(g.ecs.c.actor.get(foe)!, 'rebound');
    for (let i = 0; i < 80 && !landed.length; i++) steps(g, 1);
    expect(landed[0]).toBe('wall');
    const back = [...g.ecs.c.bolt.values()].filter((b) => b.vel.z < 0);
    expect(back.length).toBeGreaterThan(0);
    expect(back.every((b) => (b.bounces ?? 0) === 1)).toBe(true);
  });
});

it('the new attacks compile: rebound flies farther, the mortar is lobbed and leaves embers', () => {
  const r = compileAttack('rebound', STATS, 1.9).volley!;
  expect(r.bounces).toBe(2);
  expect(r.range).toBeGreaterThan(compileAttack('projectile', STATS, 1.9).volley!.range);
  const m = compileAttack('mortar', STATS, 1.9).volley!;
  expect(m.lob).toBe(true);
  expect(m.pool).toBeDefined();
});
