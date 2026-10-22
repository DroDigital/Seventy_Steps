import { describe, expect, it } from 'vitest';
import { emptyInput } from '../src/core/input';
import { ARENA_WAYS } from '../src/data/arenaWaysAll';
import { DISCOVERIES } from '../src/data/discoveriesAll';
import { PASSAGE } from '../src/data/tuning';
import type { Game } from '../src/systems/components';
import { fightAction } from '../src/systems/fightActions';
import { createWorldGame, stepGame } from '../src/systems/game';
import { isFound } from '../src/systems/found';
import { applySave, parseSave, snapshot } from '../src/systems/save';
import { calmed, wayRuns, WAYS, type WayRun } from '../src/systems/ways';
import { along, courtPoint, pointAt } from '../src/world/arenaWay';
import { stepPlace } from '../src/world/discoveryPlan';
import { worldLayout } from '../src/world/placements';
import { goTo, record, run } from './worldHelpers';

/** Round 62: the ways played (systems/ways.ts). */
const enter = (g: Game, boss: string): WayRun => {
  const a = worldLayout().arenas.find((x) => x.bosses[0] === boss)!;
  goTo(g, a.x + a.front.x * (a.radius + 14), a.z + a.front.z * (a.radius + 14));
  run(g, 4);
  return wayRuns(g).find((r) => r.plan.boss === boss)!;
};
const at = (r: WayRun, d: number, side = 0): { x: number; z: number } => pointAt(r.plan, d, side);

/** Approach with real input and collision; only the starting position is supplied by the test. */
function walkTo(g: Game, to: { x: number; z: number }, reached: () => boolean): void {
  for (let k = 0; k < 240 && !reached(); k++) {
    for (const id of [...g.ecs.c.dread.keys()]) g.ecs.despawn(id);
    const me = g.ecs.c.transform.get(g.player.id)!.pos;
    g.camera.yaw = Math.atan2(to.x - me.x, to.z - me.z);
    stepGame(g, { ...emptyInput(), moveY: 1 });
  }
}

describe('a way\'s plates', () => {
  it('wake under a foot and burst a moment after, hurting those still in the ring; a safe one does not wake', () => {
    const g = createWorldGame();
    const r = enter(g, 'simon_orne');
    const safe = r.plates.find((p) => p.safe)!;
    const unsafe = r.plates.find((p) => !p.safe)!;
    const [warned, landed] = [record(g, 'WardWarned'), record(g, 'WardLanded')];
    goTo(g, safe.x, safe.z);
    run(g, WAYS.ward.warn + 10);
    expect(warned.length, 'a safe plate is not woken').toBe(0);
    const hp = g.ecs.c.health.get(g.player.id)!.hp;
    goTo(g, unsafe.x, unsafe.z);
    run(g, 2);
    expect(warned.length).toBe(1);
    expect(warned[0]!.look).toBe('salt');
    expect(landed.length).toBe(0);
    run(g, unsafe.warn + 2);
    expect(landed.length).toBe(1);
    expect(g.ecs.c.health.get(g.player.id)!.hp, 'hurt where it burst').toBeLessThan(hp);
  });

  it('is cleared by a step aside before it bursts', () => {
    const g = createWorldGame();
    const r = enter(g, 'black_man');
    const p = r.plates[0]!;
    const hp = g.ecs.c.health.get(g.player.id)!.hp;
    goTo(g, p.x, p.z);
    run(g, 3);
    expect(p.state).toBe('warn');
    goTo(g, p.x + p.burst + 3, p.z);
    run(g, p.warn + 5);
    expect(g.ecs.c.health.get(g.player.id)!.hp).toBe(hp);
  });

  it('rest, once they have burst, before they wake again', () => {
    const g = createWorldGame();
    const r = enter(g, 'black_man');
    const p = r.plates[0]!;
    goTo(g, p.x, p.z);
    run(g, p.warn + 3);
    expect(p.state).toBe('cool');
    goTo(g, p.x + p.burst + 5, p.z); // (not standing on it, or it wakes at once)
    run(g, p.cool + 3);
    expect(p.state).toBe('idle');
  });
});

describe('a field of plates', () => {
  it('has one safe plate in each row, and it bears the sign on the tablet', () => {
    const g = createWorldGame();
    const r = enter(g, 'medusa_gorgon');
    const h = ARENA_WAYS.medusa_gorgon!.hazards![0]!;
    expect(h.kind).toBe('field');
    if (h.kind !== 'field') return;
    expect(r.plates.length).toBe(h.rows * h.cols);
    expect(r.tablet).not.toBeNull();
    for (let row = 0; row < h.rows; row++) {
      const cells = r.plates.slice(row * h.cols, (row + 1) * h.cols);
      expect(cells.filter((c) => c.safe).length, `row ${row}`).toBe(1);
      for (const c of cells) expect(c.rune === r.tablet!.rune, `row ${row}`).toBe(c.safe);
    }
  });
});

describe('ground that wears', () => {
  it('takes the mind of one who stands on it, and not of one beside it; and a rite done stills it', () => {
    const g = createWorldGame();
    const r = enter(g, 'colour_out_of_space');
    const p = r.patches[0]!;
    const beside = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => ({ x: p.x + Math.cos((k * Math.PI) / 4) * (p.r + 4), z: p.z + Math.sin((k * Math.PI) / 4) * (p.r + 4) })).find((q) => r.patches.every((o) => Math.hypot(q.x - o.x, q.z - o.z) > o.r + 1))!; // (clear of every patch, for they lie close together)
    const drop = (x: number, z: number): number => { // the mind lost in two seconds standing at a place (a horror near wears at it too, so what stands there is sent away before it is measured)
      goTo(g, x, z);
      run(g, 60);
      for (const id of [...g.ecs.c.dread.keys()]) g.ecs.despawn(id);
      const before = g.mind.sanity;
      run(g, 120);
      return before - g.mind.sanity;
    };
    const base = drop(beside.x, beside.z);
    expect(drop(p.x, p.z) - base, 'the patch wears at the mind').toBeGreaterThan(2.5);
    g.overworld!.told.add('rite:colour_out_of_space');
    expect(calmed(g, r)).toBe(true);
    expect(drop(p.x, p.z) - base, 'and a rite done stills it').toBeLessThan(2.5);
  });
});

describe('ground that takes the breath', () => {
  it('wears the stamina of one who stands in it, however fast it would mend, and not of one beside it', () => {
    const g = createWorldGame();
    const r = enter(g, 'other_gods');
    const p = r.patches.find((q) => q.of === 'stamina')!;
    const beside = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => ({ x: p.x + Math.cos((k * Math.PI) / 4) * (p.r + 4), z: p.z + Math.sin((k * Math.PI) / 4) * (p.r + 4) })).find((q) => r.patches.every((o) => Math.hypot(q.x - o.x, q.z - o.z) > o.r + 1))!;
    const st = g.ecs.c.stamina.get(g.player.id)!;
    const lowest = (x: number, z: number): number => { // the least the bar reaches in two seconds on a place, begun full
      goTo(g, x, z);
      run(g, 4);
      for (const id of [...g.ecs.c.dread.keys()]) g.ecs.despawn(id);
      st.value = st.max;
      st.delay = 0;
      let least = st.value;
      for (let k = 0; k < 120; k++) {
        run(g, 1);
        least = Math.min(least, st.value);
      }
      return least;
    };
    expect(lowest(beside.x, beside.z), 'beside it the bar stays full').toBe(st.max);
    expect(lowest(p.x, p.z), 'in it the bar is worn, the recovery held off').toBeLessThan(st.max * 0.6);
  });
});

describe('a vent', () => {
  it('erupts of itself, in a round, after showing it, and hurts what stands in it', () => {
    const g = createWorldGame();
    const r = enter(g, 'shub_niggurath');
    const v = r.vents[0]!;
    const [warned, landed] = [record(g, 'WardWarned'), record(g, 'WardLanded')];
    goTo(g, v.x, v.z);
    const hp = g.ecs.c.health.get(g.player.id)!.hp;
    run(g, v.every[1] * 60 + v.warn + 120);
    expect(warned.length).toBeGreaterThan(0);
    expect(landed.length).toBeGreaterThan(0);
    expect(g.ecs.c.health.get(g.player.id)!.hp).toBeLessThan(hp);
  });
});

describe('a rite', () => {
  const light = (r: WayRun, rank: number) => r.lights.find((l) => l.rank === rank)!;

  it.each(Object.entries(ARENA_WAYS).filter(([, way]) => way.rite).map(([boss]) => boss))('%s: every light can be reached on foot from the court and its rite completed', (boss) => {
    const g = createWorldGame();
    const r = enter(g, boss);
    const hp = g.ecs.c.health.get(g.player.id)!;
    hp.hp = hp.max = 10000; // isolate puzzle access from the court's damage
    for (const l of r.lights) {
      const lane = pointAt(r.plan, along(r.plan, l.x, l.z).d);
      goTo(g, lane.x, lane.z);
      walkTo(g, l, () => l.lit);
      const me = g.ecs.c.transform.get(g.player.id)!.pos;
      expect(l.lit, `${boss}: light ${l.rank + 1}, stopped ${Math.hypot(me.x - l.x, me.z - l.z).toFixed(2)} m away`).toBe(true);
    }
    expect(g.overworld!.told.has(`rite:${boss}`), `${boss}: the actual lights complete its rite`).toBe(true);
  });

  it.each(Object.entries(ARENA_WAYS).filter(([, way]) => way.rite).map(([boss]) => boss))('%s: its lights expose a working interaction prompt before they auto-light', (boss) => {
    const g = createWorldGame();
    const r = enter(g, boss);
    const look = r.plan.way.rite!.look;
    for (const l of r.lights) {
      const lane = pointAt(r.plan, along(r.plan, l.x, l.z).d);
      const distance = Math.hypot(lane.x - l.x, lane.z - l.z);
      goTo(g, l.x + (lane.x - l.x) * 2.2 / distance, l.z + (lane.z - l.z) * 2.2 / distance);
      expect(l.lit, 'not yet inside the automatic lighting radius').toBe(false);
      expect(fightAction(g)?.label).toBe(look === 'glow' ? 'kindle the light' : `light the ${look}`);
      const input = emptyInput();
      input.pressed.interact = true;
      stepGame(g, input);
      expect(l.lit, 'the prompted button takes the flame').toBe(true);
    }
    expect(g.overworld!.told.has(`rite:${boss}`)).toBe(true);
    expect(fightAction(g), 'completed lights stop offering the action').toBeNull();
  });

  it('the candle quest opens its gate through page pickup, real light approaches and the offering button, and stays open after reload', () => {
    const g = createWorldGame();
    const r = enter(g, 'black_man');
    const a = worldLayout().arenas.find((x) => x.bosses[0] === 'black_man')!;
    const doc = DISCOVERIES.black_man!.leaves[0]!.doc;
    const page = worldLayout().tomes.find((x) => x.name === doc)!.at;
    const pageLane = pointAt(r.plan, along(r.plan, page.x, page.z).d);
    goTo(g, pageLane.x, pageLane.z);
    walkTo(g, page, () => g.overworld!.read.has(doc));
    expect(g.overworld!.read.has(doc), 'the actual page is collected').toBe(true);
    for (const l of r.lights) {
      const lane = pointAt(r.plan, along(r.plan, l.x, l.z).d);
      goTo(g, lane.x, lane.z);
      walkTo(g, l, () => l.lit);
      expect(l.lit, `candle ${l.rank + 1}`).toBe(true);
    }
    const offer = DISCOVERIES.black_man!.steps.find((s) => s.kind === 'offer')!;
    const altar = stepPlace(a, offer)!;
    goTo(g, altar.x, altar.z);
    run(g, 3);
    const opened = record(g, 'GateOpened');
    const input = emptyInput();
    input.pressed.interact = true;
    stepGame(g, input);
    expect(isFound(g, 'black_man')).toBe(true);
    expect(opened).toHaveLength(1);
    const gate = courtPoint(a.house!, 2);
    goTo(g, gate.x, gate.z);
    run(g, PASSAGE.frames.sealed + 6);
    const gateEntity = [...g.ecs.c.piece].find(([, p]) => p.def.minFound === 'black_man')![0];
    expect(g.ecs.c.piece.get(gateEntity)!.seal.every((c) => g.world.off.has(c)), 'the gate collision opens').toBe(true);
    const copy = createWorldGame({ save: parseSave(JSON.stringify(snapshot(g)))! });
    run(copy, PASSAGE.frames.sealed + 6);
    expect(isFound(copy, 'black_man'), 'the fix needs no new journey').toBe(true);
    const loadedGate = [...copy.ecs.c.piece].find(([, p]) => p.def.minFound === 'black_man')![0];
    expect(copy.ecs.c.piece.get(loadedGate)!.seal.every((c) => copy.world.off.has(c)), 'the loaded gate stays open').toBe(true);
  });

  it('is done by lighting the lights in the order the place tells: the least first', () => {
    const g = createWorldGame();
    const r = enter(g, 'colour_out_of_space');
    expect(r.lights.length).toBe(4);
    const sizes = [...r.lights].sort((a, b) => a.rank - b.rank).map((l) => l.height);
    expect(sizes, 'the least is first').toEqual([...sizes].sort((a, b) => a - b));
    const [lit, done] = [record(g, 'RiteLit'), record(g, 'RiteDone')];
    const echoes = g.player.echoes;
    const insight = g.mind.insight;
    for (let k = 0; k < 4; k++) {
      goTo(g, light(r, k).x + 0.4, light(r, k).z);
      run(g, 3);
    }
    expect(lit.length).toBe(4);
    expect(done.length).toBe(1);
    expect(g.overworld!.told.has('rite:colour_out_of_space')).toBe(true);
    expect(g.player.echoes).toBe(echoes + ARENA_WAYS.colour_out_of_space!.rite!.reward.echoes);
    expect(g.mind.insight).toBe(insight + 1);
    expect(calmed(g, r)).toBe(true);
  });

  it('puts them all out at a wrong one, and a flare goes up at it', () => {
    const g = createWorldGame();
    const r = enter(g, 'colour_out_of_space');
    const [failed, warned] = [record(g, 'RiteFailed'), record(g, 'WardWarned')];
    goTo(g, light(r, 0).x + 0.4, light(r, 0).z);
    run(g, 3);
    expect(light(r, 0).lit).toBe(true);
    goTo(g, light(r, 2).x + 0.4, light(r, 2).z);
    run(g, 3);
    expect(failed.length).toBe(1);
    expect(warned.length).toBe(1);
    expect(r.lights.every((l) => !l.lit)).toBe(true);
    expect(r.progress).toBe(0);
    expect(g.overworld!.told.has('rite:colour_out_of_space')).toBe(false);
  });

  it('is kept: the lights burn on a load, and the way is still calm', () => {
    const g = createWorldGame();
    const r = enter(g, 'colour_out_of_space');
    for (let k = 0; k < 4; k++) {
      goTo(g, light(r, k).x + 0.4, light(r, k).z);
      run(g, 3);
    }
    const copy = createWorldGame();
    applySave(copy, parseSave(JSON.stringify(snapshot(g)))!);
    const r2 = enter(copy, 'colour_out_of_space');
    expect(r2.lights.every((l) => l.lit)).toBe(true);
    expect(calmed(copy, r2)).toBe(true);
  });
});

describe('a way\'s words', () => {
  it('are said once as the court is walked in, and again not', () => {
    const g = createWorldGame();
    const r = enter(g, 'simon_orne');
    const omens = record(g, 'WayOmen');
    const first = ARENA_WAYS.simon_orne!.omens[0]!;
    goTo(g, at(r, first.at - 4).x, at(r, first.at - 4).z);
    run(g, 12);
    expect(omens.map((o) => o.words)).toContain(first.words);
    const n = omens.length;
    goTo(g, at(r, first.at - 6).x, at(r, first.at - 6).z);
    run(g, 12);
    expect(omens.length, 'once').toBe(n);
    const copy = createWorldGame();
    applySave(copy, parseSave(JSON.stringify(snapshot(g)))!);
    expect(copy.overworld!.told.has('way:simon_orne:0')).toBe(true);
  });
});
