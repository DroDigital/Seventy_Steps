/**
 * The quiet blows, in the game (round 88; render/foeFx.ts, foeStrike.ts, foeCast.ts; asked: "many of the lower-tier creatures' attack animations
 * and telegraphs appear acceptable but overly elaborate; in high-density combat scenarios, this detracts from the intended eerie atmosphere").
 * A horror's blows are the machinery of round 51 and 59 (meleeFx, attackFx) as they were; every other creature draws one graphic mark of its own
 * and a few specks, no crown, fountain, cloud, scar, lit arc, camera-facing flash or light; a crowd is thinned. Round 59's test of what a foe's
 * blow throws is replaced: it protected the busy behaviour (more than eight particles and a scar for the large) this round removes.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRng } from '../src/core/rng';
import { emptyInput } from '../src/core/input';
import { BOSS_ATTACK_THEME } from '../src/data/bossAttackTheme';
import { MARKS, type FoeBlow, type Mark } from '../src/data/foeBlows';
import { FOE_FX } from '../src/data/fxTuning';
import { ENTITIES } from '../src/data/registry';
import { isQuiet, isThemed } from '../src/render/attackLook';
import { createAttackFx } from '../src/render/attackFx';
import { createFoeFx } from '../src/render/foeFx';
import { flashLight } from '../src/render/flashLights';
import type { GroundFx } from '../src/render/groundFx';
import { createMeleeFx, strengthOf, TELL } from '../src/render/meleeFx';
import type { ParticleSpec, Particles } from '../src/render/particles';
import { moveDef, startMove } from '../src/systems/actions';
import { createGame, stepGame } from '../src/systems/game';
import { spawnCreature } from '../src/systems/creatures';
import type { Entity } from '../src/core/ecs';
import { fxAudit } from './bossFxHelpers';
import { place } from './helpers';

vi.mock('../src/render/flashLights', () => ({ flashLight: vi.fn() }));

const OLD_PROJECTILE = 201; // what a caster's single projectile spawned in round 59 (dagon_priest, measured)
const KIT_SHAPES = ['crescent', 'lash', 'cross', 'dash', 'arc', 'mark', 'trace'];
const SHAPE_OF: Readonly<Record<Mark, string | null>> = {
  rake: 'crescent', jaws: 'crescent', crescent: 'crescent', lash: 'lash', splat: 'mark', swirl: 'arc', glint: 'cross', dash: 'dash', ripple: null, sigil: 'rune', eye: 'eye', plume: 'puff',
};
const HUES: FoeBlow['hues'] = [0xf0e4a0, 0x4c90e8, 0x20305c];
const blowOf = (mark: Mark): FoeBlow => ({ mark, tempo: 'snap', matter: 'none', hues: HUES });

function rig(creature: string, blow?: FoeBlow) {
  const g = createGame({ creature });
  const c = g.ecs.c;
  const foe = [...c.actor.keys()].find((k) => k !== g.player.id && c.dread.has(k))!;
  c.brain.delete(foe);
  const at = c.transform.get(foe)!.pos;
  place(g, g.player.id, at.x, at.z + 6, Math.PI); // (the arena stands them twenty-five metres apart: a fight is closer)
  const spawned: ParticleSpec[] = [];
  const decals: string[] = [];
  const particles = { spawn: (p: ParticleSpec) => void spawned.push(p), update() {} } as Particles;
  const ground = new Proxy({}, { get: (_t, k) => (k === 'count' ? () => 0 : () => void decals.push(String(k))) }) as GroundFx;
  const melee = createMeleeFx(g, particles, ground);
  const attack = createAttackFx(g, particles, ground);
  const foes = createFoeFx(g, particles, ground, { rng: createRng(3), ...(blow && { blows: () => blow }) });
  const update = (alpha = 0): void => {
    melee.update(alpha);
    attack.update(alpha);
    foes.update(alpha);
  };
  /** Lets the strokes that wait a beat come due. */
  const settle = (frames = 30): void => {
    g.frame += frames;
    update();
  };
  const swing = (id: Entity, move: string): void => {
    const a = c.actor.get(id)!;
    startMove(a, move);
    a.frame = moveDef(a)!.hit!.window[0];
    const t = c.transform.get(id)!;
    g.events.emit('Swung', { entity: id, at: { ...t.pos }, yaw: t.yaw });
  };
  return { g, c, foe, foes, spawned, decals, update, settle, swing };
}

beforeEach(() => vi.mocked(flashLight).mockClear());

describe('a horror\'s blows are as they were, and every other creature\'s are quiet (round 88)', () => {
  it('a horror\'s slam still bursts, scars the ground, sends a ring out and lights it; the quiet kit draws nothing for it', () => {
    const horror = Object.keys(BOSS_ATTACK_THEME).find((id) => {
      const g = createGame({ creature: id });
      const foe = [...g.ecs.c.actor.keys()].find((k) => k !== g.player.id && g.ecs.c.dread.has(k));
      return foe !== undefined && Object.values(g.ecs.c.actor.get(foe)!.moves).some((m) => m.hit && m.hit.reach >= 0.05 && Math.abs(m.hit.arc[0] - m.hit.arc[1]) < 1);
    })!;
    expect(horror).toBeDefined();
    const { c, foe, spawned, decals, swing, update } = rig(horror);
    expect(isQuiet(createGame({ creature: horror }), foe)).toBe(false);
    const a = c.actor.get(foe)!;
    const slam = Object.entries(a.moves).find(([, m]) => m.hit && m.hit.reach >= 0.05 && Math.abs(m.hit.arc[0] - m.hit.arc[1]) < 1)![0];
    swing(foe, slam);
    update();
    expect(spawned.length).toBeGreaterThan(40); // a crown, a fountain, a cloud
    expect(decals).toContain('scar');
    expect(decals).toContain('shock');
    expect(vi.mocked(flashLight)).toHaveBeenCalled();
    expect(spawned.filter((p) => KIT_SHAPES.includes(p.shape ?? '')), 'the quiet kit leaves a horror alone').toHaveLength(0);
  });

  it('round 59\'s share of a blow by size is kept for the horrors', () => {
    expect(strengthOf(true, 0.3)).toBe(1);
    expect(strengthOf(false, 0.27)).toBeLessThan(0.45);
    expect(strengthOf(false, 1.5)).toBeGreaterThan(strengthOf(false, 0.5));
    expect(strengthOf(false, 9)).toBeLessThan(1);
  });

  it('a lower-tier foe\'s slam draws a thin ripple and its own mark, at most the budget, with no scar, no lit arc, no flash and no light', () => {
    for (const creature of ['hybrid_mummy', 'gug', 'moon_beast']) {
      const { c, foe, spawned, decals, swing, update, settle } = rig(creature, blowOf('rake'));
      const slam = Object.keys(c.actor.get(foe)!.moves).includes('slam') ? 'slam' : 'tentacle_burst';
      swing(foe, slam);
      update();
      settle();
      expect(spawned.length, creature).toBeGreaterThanOrEqual(1);
      expect(spawned.length, creature).toBeLessThanOrEqual(FOE_FX.strike.marks + FOE_FX.strike.specks);
      expect(spawned.every((p) => p.shape === 'crescent'), `${creature}: a rake is crescents`).toBe(true);
      expect(decals.filter((d) => d === 'scar' || d === 'slash' || d === 'sigil'), creature).toEqual([]);
      if (slam === 'slam') expect(decals, creature).toEqual(['shock']);
      expect(vi.mocked(flashLight), creature).not.toHaveBeenCalled();
    }
  });

  it('every mark is what its blow draws where it falls, in the blow\'s hues', () => {
    for (const mark of MARKS) {
      const { foe, spawned, decals, swing, update, settle } = rig('gug', blowOf(mark));
      swing(foe, 'slam');
      update();
      settle();
      const want = SHAPE_OF[mark];
      if (want) expect(spawned.some((p) => p.shape === want), `${mark}: ${want}`).toBe(true);
      else expect(decals.length, 'a ripple lies on the ground').toBeGreaterThanOrEqual(1);
      expect(decals.filter((d) => d !== 'shock'), mark).toEqual([]);
      for (const p of spawned.filter((q) => q.shape === want)) expect(p.colorMid, mark).toBeDefined();
      expect(vi.mocked(flashLight), mark).not.toHaveBeenCalled();
    }
  });

  it('a rake creature\'s bite is three strokes laid one after another, and a creature with a seed blow is drawn in it', () => {
    const bite = rig('ghoul');
    bite.swing(bite.foe, 'bite');
    bite.update();
    const first = bite.spawned.filter((p) => p.shape === 'crescent').length;
    bite.settle();
    expect(first, 'the strokes of a drag come one after another').toBe(1);
    expect(bite.spawned.filter((p) => p.shape === 'crescent')).toHaveLength(3);
    expect(bite.spawned.filter((p) => p.shape !== 'crescent' && p.shape !== 'trace').every((p) => p.shape === 'wisp'), 'spores rise').toBe(true);
    expect(bite.spawned.filter((p) => p.shape === 'trace').length, 'and a faint wake behind its lunge').toBeLessThanOrEqual(FOE_FX.wake.pieces);
    expect(bite.spawned.length).toBeLessThanOrEqual(FOE_FX.strike.marks + FOE_FX.strike.thrustSpecks + FOE_FX.wake.pieces + 1); // (the stamp, its specks and the wake)
    const sweep = rig('deep_one');
    sweep.swing(sweep.foe, 'sweep');
    sweep.update();
    expect(sweep.spawned, 'a sweep is laid along its tip as it goes, a stroke at a time').toHaveLength(1);
    const a = sweep.c.actor.get(sweep.foe)!;
    const h = moveDef(a)!.hit!;
    for (let f = h.window[0]; f < h.window[1]; f++) {
      a.frame = f;
      sweep.g.frame++;
      sweep.update();
    }
    sweep.settle();
    expect(sweep.spawned.filter((p) => p.shape === 'crescent')).toHaveLength(FOE_FX.strike.pieces);
    expect(sweep.spawned.length).toBeLessThanOrEqual(FOE_FX.strike.pieces + FOE_FX.strike.specks);
  });

  it('a blow that lands leaves the mark and the accent at the wound and throws back a few specks, never more than its budget', () => {
    const { g, c, foe, spawned, decals, update, settle } = rig('deep_one');
    c.health.get(g.player.id)!.hp = c.health.get(g.player.id)!.max = 1e6;
    place(g, g.player.id, c.transform.get(foe)!.pos.x, c.transform.get(foe)!.pos.z + 1.2, Math.PI);
    update();
    g.events.emit('Hit', { attacker: foe, target: g.player.id, outcome: 'hit', damage: 60 });
    settle();
    expect(spawned.filter((p) => p.shape === 'crescent').length, 'its mark').toBe(1);
    expect(decals, 'its accent, a ripple').toEqual(['shock']);
    const specks = spawned.filter((p) => p.shape === 'disc' || p.shape === 'bubble');
    expect(specks.length).toBeGreaterThan(0);
    expect(specks.length).toBeLessThanOrEqual(FOE_FX.wound.specks);
    expect(spawned.length).toBeLessThanOrEqual(FOE_FX.wound.marks + FOE_FX.wound.specks);
    expect(vi.mocked(flashLight)).not.toHaveBeenCalled();
    g.events.emit('Hit', { attacker: foe, target: g.player.id, outcome: 'hit', damage: 5, lingering: true });
    const n = spawned.length;
    settle();
    expect(spawned.length, 'a pool\'s tick is not a blow').toBe(n);
  });

  it('an ally\'s melee draws nothing, as it did not before', () => {
    const { g, c, spawned, decals, update, settle } = rig('deep_one');
    const ally = spawnCreature(g, 'pickman', { x: 3, z: 3, yaw: 0 })!;
    c.brain.delete(ally);
    expect(c.combatant.get(ally)!.faction).toBe('player');
    update();
    const a = c.actor.get(ally)!;
    startMove(a, 'sweep');
    a.frame = moveDef(a)!.hit!.window[0];
    g.events.emit('Swung', { entity: ally, at: { ...c.transform.get(ally)!.pos }, yaw: 0 });
    for (let f = a.frame; f < moveDef(a)!.hit!.window[1]; f++) {
      a.frame = f;
      g.frame++;
      update();
    }
    settle();
    expect(spawned).toHaveLength(0);
    expect(decals).toHaveLength(0);
  });
});

describe('a slow heavy blow glints once before it falls (round 59, now the mark in miniature)', () => {
  const tellsOf = (spawned: ParticleSpec[]): ParticleSpec[] => spawned.filter((p) => p.shape === 'crescent' || p.shape === 'rune');

  it('once, however the pictures fall against the steps; a quiet one at half strength', () => {
    const { c, foe, update, spawned, g } = rig('gug', blowOf('rake'));
    const a = c.actor.get(foe)!;
    startMove(a, 'slam');
    const h = moveDef(a)!.hit!;
    expect(h.window[0]).toBeGreaterThanOrEqual(TELL.windup);
    for (let f = 0; f < h.window[0]; f++) {
      a.frame = f;
      g.frame++;
      update(0);
      update(0.5); // two pictures to a step
    }
    g.frame += 30;
    update();
    const tell = tellsOf(spawned);
    expect(tell.length).toBeGreaterThanOrEqual(1);
    expect(tell.length).toBeLessThanOrEqual(FOE_FX.tell.marks);
    expect(tell.every((p) => (p.alpha ?? 1) <= FOE_FX.tell.alpha + 1e-9)).toBe(true);
    expect(spawned.filter((p) => !tell.includes(p)), 'nothing but the mark').toHaveLength(0);
    // a picture that comes late (a hitch from before the tell to the blow), or a foe first drawn mid-swing, does not glint at a blow already falling (Codex on PR 149)
    for (const first of [h.window[0], h.window[0] + 2]) {
      const late = rig('gug', blowOf('rake'));
      const b = late.c.actor.get(late.foe)!;
      startMove(b, 'slam');
      b.frame = TELL.windup - TELL.lead - 4;
      late.update();
      b.frame = first;
      late.g.frame++;
      late.update();
      late.settle();
      expect(late.spawned, `skipped to ${first}`).toHaveLength(0);
      const seen = rig('gug', blowOf('rake'));
      const m = seen.c.actor.get(seen.foe)!;
      startMove(m, 'slam');
      m.frame = first;
      seen.update();
      seen.settle();
      expect(seen.spawned, `first seen at ${first}`).toHaveLength(0);
    }
    const quick = rig('zoog', blowOf('rake'));
    const q = quick.c.actor.get(quick.foe)!;
    startMove(q, 'bite');
    for (let f = 0; f < moveDef(q)!.hit!.window[0]; f++) {
      q.frame = f;
      quick.g.frame++;
      quick.update();
    }
    quick.settle();
    expect(tellsOf(quick.spawned), 'a quick blow gives no tell').toHaveLength(0);
  });
});

describe('a caster draws a few motes and a mark, not a storm (round 88)', () => {
    it('a projectile, whole, is a third of what it was or less, with no scar, no flash and no light, and a bolt\'s trail leaves a smear every third frame at most', () => {
    const g = createGame({ creature: 'dagon_priest' });
    const c = g.ecs.c;
    const foe = [...c.actor.keys()].find((k) => k !== g.player.id && c.dread.has(k))!;
    c.brain.delete(foe);
    c.health.get(g.player.id)!.hp = c.health.get(g.player.id)!.max = 1e7;
    place(g, g.player.id, c.transform.get(foe)!.pos.x, c.transform.get(foe)!.pos.z + 7, Math.PI);
    const spawned: { p: ParticleSpec; frame: number }[] = [];
    const decals: string[] = [];
    const particles = { spawn: (p: ParticleSpec) => void spawned.push({ p, frame: g.frame }), update() {} } as Particles;
    const ground = new Proxy({}, { get: (_t, k) => (k === 'count' ? () => 0 : () => void decals.push(String(k))) }) as GroundFx;
    const attack = createAttackFx(g, particles, ground);
    const foes = createFoeFx(g, particles, ground);
    const a = c.actor.get(foe)!;
    startMove(a, 'projectile');
    let bolts = 0;
    const length = moveDef(a)!.frames + 90;
    for (let f = 0; f < length; f++) {
      stepGame(g, emptyInput());
      attack.update(1);
      foes.update(1);
      bolts = Math.max(bolts, c.bolt.size);
    }
    expect(spawned.length).toBeGreaterThan(5);
    expect(spawned.length).toBeLessThanOrEqual(OLD_PROJECTILE / 3);
    expect(decals.filter((d) => d !== 'sigil' && d !== 'shock')).toEqual([]);
    expect(vi.mocked(flashLight)).not.toHaveBeenCalled();
    const traces = spawned.filter((s) => s.p.shape === 'trace');
    const frames = new Set(traces.map((s) => s.frame));
    expect(frames.size, 'a smear every third step at most, for each bolt').toBeLessThanOrEqual(Math.ceil(length / FOE_FX.bolt.trailEvery));
    expect(traces.length).toBeLessThanOrEqual(frames.size * Math.max(1, bolts));
    const motes = spawned.filter((s) => s.p.shape === 'disc' && (s.p.life ?? 0) <= FOE_FX.gather.life[1] + 1e-9);
    expect(motes.length, 'the gather: about nine motes').toBeLessThanOrEqual(FOE_FX.gather.motes + FOE_FX.bolt.land.specks);
  });

  it('a summoning is a faint sigil and a few rising motes; a teleport two swirls; a roar a few motes', () => {
    for (const [creature, move] of [['dagon_priest', 'summon'], ['kn_yan_dweller', 'teleport'], ['dagon_priest', 'roar']] as const) {
      const { g, c, foe, spawned, decals, update } = rig(creature);
      place(g, g.player.id, c.transform.get(foe)!.pos.x, c.transform.get(foe)!.pos.z + 5, Math.PI);
      const a = c.actor.get(foe)!;
      startMove(a, move);
      const length = moveDef(a)!.frames + 30;
      for (let f = 0; f < length; f++) {
        stepGame(g, emptyInput());
        update(1);
      }
      expect(spawned.length, move).toBeGreaterThan(0);
      expect(spawned.length, move).toBeLessThanOrEqual(FOE_FX.gather.motes + FOE_FX.summon.motes + FOE_FX.pulse.motes + 6);
      if (move === 'summon') expect(decals).toContain('sigil');
      if (move === 'teleport') expect(spawned.filter((p) => p.shape === 'arc').length).toBe(2);
      expect(decals.filter((d) => d === 'scar' || d === 'slash'), move).toEqual([]);
      expect(vi.mocked(flashLight), move).not.toHaveBeenCalled();
    }
  });

  it('the creatures that are not horrors are the quiet ones, and the investigator is neither', () => {
    const g = createGame({ creature: 'dagon_priest' });
    const c = g.ecs.c;
    const foe = [...c.actor.keys()].find((k) => k !== g.player.id && c.dread.has(k))!;
    expect(isQuiet(g, foe)).toBe(true);
    expect(isQuiet(g, g.player.id)).toBe(false);
    const horror = createGame({ creature: 'cthulhu' });
    const boss = [...horror.ecs.c.actor.keys()].find((k) => k !== horror.player.id && horror.ecs.c.dread.has(k))!;
    expect(isQuiet(horror, boss)).toBe(false);
  });
});

describe('a crowd is thinned (round 88)', () => {
  function crowd(n: number) {
    const g = createGame({ creature: 'ghoul' });
    const c = g.ecs.c;
    const first = [...c.actor.keys()].find((k) => k !== g.player.id && c.dread.has(k))!;
    place(g, g.player.id, 0, 0, 0);
    const foes: Entity[] = [first];
    for (let i = 1; i < n; i++) foes.push(spawnCreature(g, 'ghoul', { x: 0, z: 0, yaw: Math.PI })!);
    foes.forEach((f, i) => {
      c.brain.delete(f);
      place(g, f, ((i % 2) * 2 - 1) * (1 + i * 0.3), 2 + i * 0.9, Math.PI); // nearest first, none on another
    });
    const spawned: ParticleSpec[] = [];
    const particles = { spawn: (p: ParticleSpec) => void spawned.push(p), update() {} } as Particles;
    const ground = new Proxy({}, { get: (_t, k) => (k === 'count' ? () => 0 : () => undefined) }) as GroundFx;
    const fx = createFoeFx(g, particles, ground, { rng: createRng(9) });
    return { g, c, foes, fx, spawned };
  }

  const strike = ({ g, c, foes, fx }: ReturnType<typeof crowd>): void => {
    fx.update(0);
    for (const f of foes) {
      const a = c.actor.get(f)!;
      startMove(a, 'bite');
      a.frame = moveDef(a)!.hit!.window[0];
      g.events.emit('Swung', { entity: f, at: { ...c.transform.get(f)!.pos }, yaw: c.transform.get(f)!.yaw });
      g.events.emit('Hit', { attacker: f, target: g.player.id, outcome: 'hit', damage: 12 });
    }
    g.frame += 1;
    fx.update(0);
  };

  it('twelve foes striking in one frame spend no more than the rolling budget, and the nearest are drawn in full', () => {
    const twelve = crowd(12);
    strike(twelve);
    twelve.g.frame += 30;
    twelve.fx.update(0);
    expect(twelve.spawned.length).toBeLessThanOrEqual(FOE_FX.crowd.budget);
    const four = crowd(4);
    strike(four);
    four.g.frame += 30;
    four.fx.update(0);
    expect(four.spawned.length).toBeGreaterThan(0);
    expect(twelve.spawned.length).toBeLessThanOrEqual(Math.max(four.spawned.length, FOE_FX.crowd.budget));
    const tiers = twelve.foes.map((f) => twelve.fx.crowd.tierOf(f));
    expect(tiers.slice(0, FOE_FX.crowd.full)).toEqual(Array(FOE_FX.crowd.full).fill('full'));
    expect(tiers.filter((t) => t === 'full')).toHaveLength(FOE_FX.crowd.full);
    const order = ['full', 'marks', 'none'];
    const ranks = tiers.map((t) => order.indexOf(t));
    expect(ranks, 'tiers follow distance').toEqual([...ranks].sort((a, b) => a - b));
  });

  it('the budget is spent per half second, not per game: a second pack, later, draws again', () => {
    const t = crowd(12);
    strike(t);
    const first = t.spawned.length;
    t.g.frame += 60; // a second on
    strike(t);
    expect(t.spawned.length).toBeGreaterThan(first);
  });
});

describe('every move of the creatures that are not horrors is drawn quietly (round 88)', () => {
  const IDS = Object.values(ENTITIES).filter((e) => (e.bossScript || e.sprite || e.assembly) && !isThemed(e.id)).map((e) => e.id);

  it('there are fifty-one of them', () => expect(IDS.length).toBeGreaterThanOrEqual(51));

  it('each, move by move, with the render side running: finite, within the batches\' budgets, no light, and a median of under forty particles a creature (it was 86; the casters 200 to 525)', () => {
    const totals: number[] = [];
    for (const id of IDS) {
      const r = fxAudit(id);
      expect(r.bad, id).toEqual([]);
      expect(r.spawned, id).toBeLessThan(110);
      expect(r.peakLive, id).toBeLessThan(60);
      expect(r.peakDecals, id).toBeLessThan(12);
      expect([...r.kinds].filter((k) => k === 'scar' || k === 'sector'), `${id}: no scar and no lit arc`).toEqual([]);
      totals.push(r.spawned);
    }
    totals.sort((a, b) => a - b);
    expect(totals[Math.floor(totals.length / 2)]).toBeLessThan(40);
    expect(vi.mocked(flashLight)).not.toHaveBeenCalled();
  }, 120_000);

  it('a caster\'s moves are as quiet as a brawler\'s', () => {
    for (const id of ['dagon_priest', 'algol_light_being', 'nasht_kaman_thah']) {
      const r = fxAudit(id);
      for (const [move, n] of Object.entries(r.perMove)) expect(n, move).toBeLessThanOrEqual(OLD_PROJECTILE / 3);
    }
  });
});
