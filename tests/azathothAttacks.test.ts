/**
 * Azathoth's attacks (2026-10-29; asked: "implement different and unique boss attacks to make this the most challenging boss fight of all", and to take away the timer
 * and the drain of its health): it is blind, so none of its blows is aimed at the investigator. The dirge is three rings of sound, each quicker than the last; the
 * drumbeat is rings of boils that burst outward a beat at a time; the dance is thirteen stamps winding out of its flank; the seething is boils over the whole court that
 * leave pools; the maelstrom draws the court in and breaks about the body. Each is read by where it will fall and when, in the Court it fights in (44 m across).
 */
import { describe, expect, it } from 'vitest';
import type { Entity } from '../src/core/ecs';
import { distXZ } from '../src/core/geom';
import { ATTACKS, compileAttack } from '../src/data/attacks';
import { ENTITIES, getEntity } from '../src/data/registry';
import type { AttackId } from '../src/data/schema';
import { startMove } from '../src/systems/actions';
import { teleport } from '../src/systems/checkpoints';
import type { Fight, Game } from '../src/systems/components';
import { attacksOf, toCombatant } from '../src/systems/creatures';
import { courtOpen } from '../src/systems/endings';
import { createWorldGame } from '../src/systems/game';
import { priorOf } from '../src/systems/sealCount';
import { planSpots } from '../src/systems/strikePlans';
import { lookOf } from '../src/render/attackLook';
import { signature } from '../src/render/fxForms';
import type { ParticleSpec } from '../src/render/particles';
import { worldLayout } from '../src/world/placements';
import { steps } from './helpers';
import { kill, record, run } from './worldHelpers';

const OWN: readonly AttackId[] = ['dirge', 'dirge_2', 'dirge_3', 'drumbeat', 'dance', 'seethe', 'maelstrom', 'maelstrom_burst', 'crescendo'];
const azathoth = getEntity('azathoth')!;
const moves = toCombatant(azathoth).moves;
const body = toCombatant(azathoth).radius;

const seeded = (seed: number) => {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
};

/** The Court at the Centre as the world builds it (44 m across its heart), Azathoth engaged and held calm, the investigator `gap` metres out on its +z side and not to be killed. */
function court(gap = 24): { g: Game; boss: Entity; fight: Fight } {
  const spawn = worldLayout().spawns.find((s) => s.id === 'boss:azathoth')!;
  const g = createWorldGame();
  const prior = priorOf(spawn.entity);
  if (prior) g.overworld!.slain.add(`boss:${prior}`);
  teleport(g, { x: spawn.at.x, z: spawn.at.z + gap, yaw: Math.PI });
  run(g, 60);
  const boss = g.overworld!.alive.get(spawn.id)!;
  g.ecs.c.health.get(g.player.id)!.immortal = true;
  Object.assign(g.ecs.c.brain.get(boss)!, { state: 'engage', target: g.player.id, cooldown: 1e6 });
  steps(g, 3);
  return { g, boss, fight: g.ecs.c.fight.get(boss)! };
}

/** Starts `id` and runs until `done` holds (or `max` steps). */
function perform(g: Game, boss: Entity, id: AttackId, done: () => boolean, max = 400): boolean {
  startMove(g.ecs.c.actor.get(boss)!, id);
  for (let i = 0; i < max && !done(); i++) steps(g, 1);
  return done();
}

describe('Azathoth\'s attacks, as data', () => {
  it('are its own: in the library, in its script, and in no other horror\'s', () => {
    for (const id of OWN) expect(ATTACKS[id], id).toBeDefined();
    const mine = new Set(attacksOf(azathoth));
    for (const id of OWN) expect(mine.has(id), id).toBe(true); // (the chains come with the attacks that begin them)
    for (const other of ENTITIES.filter((e) => e.id !== 'azathoth')) for (const id of attacksOf(other)) expect(OWN, `${other.id} ${id}`).not.toContain(id);
  });

  it('chain as they should: three notes, quicker each, and a pull that breaks', () => {
    expect([ATTACKS.dirge.follow, ATTACKS.dirge_2.follow, ATTACKS.dirge_3.follow]).toEqual(['dirge_2', 'dirge_3', undefined]);
    expect(ATTACKS.maelstrom.follow).toBe('maelstrom_burst');
    const [a, b, c] = ['dirge', 'dirge_2', 'dirge_3'].map((id) => moves[id].wave!);
    expect(a.speed).toBeLessThan(b.speed);
    expect(b.speed).toBeLessThan(c.speed);
    const between = (from: string, to: string): number => moves[from].frames - moves[from].wave!.frame + moves[to].wave!.frame; // frames from one ring's release to the next's
    for (const [from, to] of [['dirge', 'dirge_2'], ['dirge_2', 'dirge_3']]) {
      expect(between(from, to), `${from} to ${to}`).toBeGreaterThanOrEqual(34); // a beat that a roll can follow: it may be cut short for the next from its 36th frame, and its i-frames last twenty-two
      expect(between(from, to), `${from} to ${to}`).toBeLessThanOrEqual(45);
    }
    expect(moves.dirge.then).toBe('dirge_2');
  });

  it('show themselves for 0.6 s before they land, and the heaviest blow is the maelstrom\'s burst, which fills the ground about the body', () => {
    for (const id of ['dirge', 'drumbeat', 'dance', 'seethe', 'maelstrom'] as const) expect(ATTACKS[id].windup, id).toBeGreaterThanOrEqual(36);
    const heaviest = Math.max(...OWN.map((id) => ATTACKS[id].power));
    expect(ATTACKS.maelstrom_burst.power).toBe(heaviest);
    const burst = moves.maelstrom_burst.hit!;
    expect(burst.radius).toBeGreaterThan(body + 5); // it reaches past where the body stands, to the ground its melee is fought on
    expect(moves.maelstrom.pull!.speed).toBeLessThan(6.4); // a sprint gains on the pull a little; a walk does not
  });

  it('are compiled at its size without growing past its Court', () => {
    const court = 44;
    const outermost = (id: AttackId): number => {
      const m = moves[id].marks!;
      return body + m.ring[1] + m.radius;
    };
    expect(outermost('drumbeat')).toBeLessThan(court);
    expect(outermost('dance')).toBeLessThan(court);
    const small = compileAttack('dirge', azathoth.stats, 1.9); // and for a body of a man's height, the same rings, small
    expect(small.wave!.speed).toBeLessThan(moves.dirge.wave!.speed / 3);
  });
});

describe('Azathoth\'s marked ground is laid about its body and aimed at no one', () => {
  const m = (id: AttackId) => moves[id].marks!;
  const centres = [{ x: 0, z: 0 }, { x: 31, z: -12 }];

  it.each(['drumbeat', 'dance', 'seethe'] as const)('%s lies the same wherever the investigator stands', (id) => {
    const [a, b] = centres.map((centre) => planSpots(m(id), centre, { x: 100, z: 100 }, body, seeded(9)));
    expect(a).toEqual(b);
  });

  it('the drumbeat is two rings about the body, the outer bursting a beat after the inner and standing between its spots', () => {
    const spots = planSpots(m('drumbeat'), centres[0], { x: 0, z: 0 }, body, seeded(3));
    const [inner, outer] = [spots.filter((s) => s.order === 0), spots.filter((s) => s.order === 1)];
    expect(inner.length).toBe(m('drumbeat').count);
    expect(outer.length).toBeGreaterThan(inner.length);
    expect(spots.length).toBe(inner.length + outer.length);
    expect(new Set(inner.map((s) => Math.round(Math.hypot(s.at.x, s.at.z) * 10))).size).toBe(1); // a ring
    expect(Math.hypot(inner[0].at.x, inner[0].at.z)).toBeCloseTo(body + m('drumbeat').ring[0], 5);
    expect(Math.hypot(outer[0].at.x, outer[0].at.z)).toBeCloseTo(body + m('drumbeat').ring[1], 5);
    const bearing = (s: { at: { x: number; z: number } }): number => Math.atan2(s.at.x, s.at.z);
    for (const s of outer) { // no outer spot straight out from an inner one: out is not the way
      const nearest = Math.min(...inner.map((i) => Math.abs(Math.atan2(Math.sin(bearing(i) - bearing(s)), Math.cos(bearing(i) - bearing(s))))));
      expect(nearest).toBeGreaterThan(0.02);
    }
  });

  it('the dance is thirteen stamps winding out from the body once about it, the nearest bursting first', () => {
    const spots = planSpots(m('dance'), centres[0], { x: 0, z: 0 }, body, seeded(5));
    expect(spots).toHaveLength(13);
    const radii = spots.map((s) => Math.hypot(s.at.x, s.at.z));
    expect(spots.map((s) => s.order)).toEqual([...Array(13).keys()]);
    for (let i = 1; i < radii.length; i++) expect(radii[i]).toBeGreaterThan(radii[i - 1]);
    const turn = (s: { at: { x: number; z: number } }): number => Math.atan2(s.at.x, s.at.z);
    const steps_ = spots.slice(1).map((s, i) => Math.atan2(Math.sin(turn(s) - turn(spots[i])), Math.cos(turn(s) - turn(spots[i]))));
    for (const d of steps_) expect(d).toBeCloseTo(steps_[0], 5); // an even turn, one way
    expect(Math.abs(steps_[0]) * 13).toBeCloseTo(Math.PI * 2, 5); // once about the body
  });

  it('the seething is boils over the whole court, apart from one another and out of the body', () => {
    const reach = 44 - m('seethe').radius - 0.5;
    for (const seed of [1, 2, 3, 4, 5]) {
      const spots = planSpots(m('seethe'), centres[0], { x: 0, z: 0 }, body, seeded(seed), reach);
      expect(spots).toHaveLength(12);
      for (const s of spots) {
        expect(Math.hypot(s.at.x, s.at.z)).toBeGreaterThanOrEqual(body + m('seethe').ring[0] - 1e-6);
        expect(Math.hypot(s.at.x, s.at.z)).toBeLessThanOrEqual(reach + 1e-6);
      }
      for (const a of spots) for (const b of spots) if (a !== b) expect(distXZ(a.at, b.at)).toBeGreaterThanOrEqual(m('seethe').radius * 2.2 - 1e-6);
    }
  });
});

describe('Azathoth\'s attacks, played in its Court', () => {
  it('the dirge is three rings, a beat apart, each striking what stands at the body\'s edge once', () => {
    const { g, boss } = court(body + 1.6);
    const at: number[] = [];
    g.events.on('Quaked', () => at.push(g.frame));
    const hits = record(g, 'Hit');
    expect(perform(g, boss, 'dirge', () => at.length === 3 && g.ecs.c.actor.get(boss)!.move === null, 400)).toBe(true);
    expect(at[1] - at[0]).toBeGreaterThanOrEqual(30);
    expect(at[1] - at[0]).toBeLessThanOrEqual(45);
    expect(at[2] - at[1]).toBeGreaterThanOrEqual(30);
    expect(hits.filter((h) => h.attacker === boss && h.target === g.player.id)).toHaveLength(3);
  });

  it('the drumbeat bursts its rings outward a beat apart, and every boil lies in the Court', () => {
    const { g, boss, fight } = court();
    const bursts: { at: number; r: number }[] = [];
    g.events.on('Erupted', (e) => bursts.push({ at: g.frame, r: distXZ(e.at, g.ecs.c.transform.get(boss)!.pos) }));
    expect(perform(g, boss, 'drumbeat', () => g.ecs.c.mark.size === 13)).toBe(true);
    const centre = g.ecs.c.transform.get(boss)!.pos;
    for (const [e, mk] of g.ecs.c.mark) {
      const d = distXZ(g.ecs.c.transform.get(e)!.pos, centre);
      expect(d).toBeGreaterThan(body);
      expect(d + mk.radius).toBeLessThan(fight.arena.radius);
    }
    steps(g, 120);
    expect(bursts).toHaveLength(13);
    const first = bursts.slice(0, 5);
    const last = bursts.slice(5);
    expect(Math.max(...first.map((b) => b.r))).toBeLessThan(Math.min(...last.map((b) => b.r)));
    expect(Math.min(...last.map((b) => b.at)) - Math.max(...first.map((b) => b.at))).toBeGreaterThanOrEqual(20); // a beat
  });

  it('the dance falls in order from the nearest ground out, and the seething leaves a pool where every boil burst', () => {
    const { g, boss } = court();
    const burst: number[] = [];
    g.events.on('Erupted', (e) => burst.push(distXZ(e.at, g.ecs.c.transform.get(boss)!.pos)));
    expect(perform(g, boss, 'dance', () => g.ecs.c.mark.size === 13)).toBe(true);
    steps(g, 140);
    expect(burst).toHaveLength(13);
    for (let i = 1; i < burst.length; i++) expect(burst[i]).toBeGreaterThanOrEqual(burst[i - 1] - 0.5);
    const before = g.ecs.c.hazard.size;
    run(g, 200); // its recovery, and the dance is over
    expect(g.ecs.c.hazard.size).toBe(before); // the dance leaves nothing
    expect(perform(g, boss, 'seethe', () => g.ecs.c.mark.size === 12)).toBe(true);
    for (let i = 0; i < 200 && g.ecs.c.mark.size > 0; i++) steps(g, 1);
    const pools = [...g.ecs.c.hazard.values()];
    expect(pools).toHaveLength(before + 12);
    expect(pools.every((p) => !p.fire && p.life > 100 && p.damage > 0)).toBe(true);
  });

  it('the maelstrom draws in what stands at the edge of the Court and breaks about the body: what it drew in is struck, what stood beyond its reach is not', () => {
    const near = court(26);
    const hits = record(near.g, 'Hit');
    const z0 = distXZ(near.g.ecs.c.transform.get(near.g.player.id)!.pos, near.g.ecs.c.transform.get(near.boss)!.pos);
    expect(perform(near.g, near.boss, 'maelstrom', () => near.g.ecs.c.actor.get(near.boss)!.move === 'maelstrom_burst', 200)).toBe(true);
    const z1 = distXZ(near.g.ecs.c.transform.get(near.g.player.id)!.pos, near.g.ecs.c.transform.get(near.boss)!.pos);
    expect(z1).toBeLessThan(z0 - 3); // drawn in
    steps(near.g, 30);
    const struck = hits.filter((h) => h.attacker === near.boss && h.target === near.g.player.id);
    expect(struck).toHaveLength(1);
    expect(struck[0].damage).toBeGreaterThan(moves.dirge.wave!.damage * 1.5); // the heaviest of its blows
    const far = court(39); // out at the wall: drawn in a few metres, but the burst falls short
    const missed = record(far.g, 'Hit');
    perform(far.g, far.boss, 'maelstrom', () => far.g.ecs.c.actor.get(far.boss)!.move === 'maelstrom_burst', 200);
    steps(far.g, 30);
    expect(missed.filter((h) => h.attacker === far.boss && h.target === far.g.player.id)).toEqual([]);
  });

  it('the crescendo, its last phase\'s own, lays boils over the court and runs on into the dirge before the last of them has burst', () => {
    expect(ATTACKS.crescendo.follow).toBe('dirge');
    expect(azathoth.bossScript!.phases.map((p) => p.attacks.some((a) => a.id === 'crescendo'))).toEqual([false, false, false, true]);
    const { g, boss } = court();
    const left: number[] = [];
    g.events.on('Quaked', () => left.push(g.ecs.c.mark.size)); // the boils still to burst as each ring is loosed
    expect(perform(g, boss, 'crescendo', () => left.length === 3 && g.ecs.c.actor.get(boss)!.move === null, 500)).toBe(true);
    expect(left[0]).toBe(moves.crescendo.marks!.count);
    expect(left[1]).toBeGreaterThan(0);
    expect(left[2]).toBe(0);
  });

  it('when it falls the Court\'s endings open, as they did when its piping ended', () => {
    const { g, boss } = court();
    expect(courtOpen(g)).toBe(false);
    const vanquished = record(g, 'Vanquished');
    kill(g, boss);
    expect(vanquished.map((v) => v.entity)).toContain(boss);
    expect(courtOpen(g)).toBe(true);
  });
});

describe('Azathoth\'s blows are drawn within the sprites a picture can hold', () => {
  it('no forked bolt it throws is ten metres across, whatever the size of the blow (a ring out of a body fifteen metres wide drew them thirteen)', () => {
    const look = lookOf('azathoth');
    for (const moment of ['burst', 'flash', 'gather'] as const) {
      for (const radius of [4, 16.5, 24, 40]) {
        const got: ParticleSpec[] = [];
        signature({ spawn: (p) => void got.push(p), update: () => undefined }, look, moment, { x: 0, y: 0, z: 0 }, radius);
        for (const p of got) expect(p.size, `${moment} at ${radius} m`).toBeLessThan(10);
      }
    }
  });
});
