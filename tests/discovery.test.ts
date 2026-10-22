/**
 * The discoveries (round 63; data/discoveries.ts, world/discoveryPlan.ts, systems/discovery.ts): each open horror's house is shut at its
 * gate until its acts are done, and every act of every discovery can be done: a page read, a rite, a vigil kept in its hour, a gift laid.
 */
import { describe, expect, it } from 'vitest';
import { ARENA_HOUSES } from '../src/data/arenaHousesAll';
import { ARENA_WAYS } from '../src/data/arenaWaysAll';
import { FOUND, foundKey, stepKey, type Step } from '../src/data/discoveries';
import { DISCOVERIES } from '../src/data/discoveriesAll';
import { DOCUMENTS } from '../src/data/documents';
import { MODEL_INFO } from '../src/data/models/index';
import { QUESTS } from '../src/data/quests';
import { PROP_KINDS } from '../src/data/regions';
import { SET_KITS } from '../src/data/setKits';
import { PASSAGE, SANITY, SIM } from '../src/data/tuning';
import { phaseOf } from '../src/systems/clock';
import type { Game } from '../src/systems/components';
import { applyCarry, carryOf, parseCarry } from '../src/systems/cycles';
import { currentStep, discoverySystem, holds, vigilShare, vigilsNear } from '../src/systems/discovery';
import { isFound } from '../src/systems/found';
import { fightAction } from '../src/systems/fightActions';
import { createWorldGame } from '../src/systems/game';
import { isDone, stageOf } from '../src/systems/quests';
import { bandOf, setSanity } from '../src/systems/sanity';
import { applySave, parseSave, snapshot } from '../src/systems/save';
import { refreshSeals, sealedHere } from '../src/systems/seals';
import { kindsOf } from '../src/systems/weather';
import { courtPoint, WAY } from '../src/world/arenaWay';
import { discoveryProps, stepPlace } from '../src/world/discoveryPlan';
import { worldLayout, type ArenaPlace } from '../src/world/placements';
import { goTo, record, run, walkIn } from './worldHelpers';

const w = worldLayout();
const arenas = w.arenas.filter((a) => a.house);
const entries = Object.entries(DISCOVERIES);
const arenaOf = (boss: string): ArenaPlace => arenas.find((a) => a.bosses[0] === boss)!;

describe('the discoveries are written', () => {
  it('for every house, and for nothing else', () => {
    for (const a of arenas) expect(DISCOVERIES[a.bosses[0]!], a.bosses[0]).toBeTruthy();
    for (const [id] of entries) expect(arenas.some((a) => a.bosses[0] === id), `${id} has no house`).toBe(true);
    expect(Object.keys(ARENA_HOUSES).sort()).toEqual(Object.keys(DISCOVERIES).sort());
  });

  it('with pages that exist, lie in the court outside the wall, and are read by a step that asks for them', () => {
    for (const [id, d] of entries) {
      const a = arenaOf(id);
      for (const l of d.leaves) {
        expect(DOCUMENTS[l.doc], `${id}: ${l.doc}`).toBeTruthy();
        const t = w.tomes.find((x) => x.name === l.doc);
        expect(t, `${id}: ${l.doc} is laid`).toBeTruthy();
        expect(t!.note, `${id}: ${l.doc} is a note`).toBe(true);
        expect(Math.hypot(t!.at.x - a.x, t!.at.z - a.z), `${id}: ${l.doc} outside the wall`).toBeGreaterThan(a.house!.radius + 3);
        expect(l.at.d, `${id}: ${l.doc} in the court`).toBeLessThanOrEqual(FOUND.court);
        expect(d.steps.some((s) => s.kind === 'read' && s.doc === l.doc), `${id}: ${l.doc} is asked`).toBe(true);
      }
      for (const s of d.steps) if (s.kind === 'read') expect(DOCUMENTS[s.doc], `${id}: ${s.doc}`).toBeTruthy();
    }
  });

  it('with marks and altars that are pieces the world has, outside the wall, in the court', () => {
    for (const [id, d] of entries) {
      const a = arenaOf(id);
      const placed = d.steps.filter((s) => s.kind === 'vigil' || s.kind === 'offer');
      expect(discoveryProps(a).length, id).toBe(placed.length);
      for (const s of placed) {
        if (s.kind !== 'vigil' && s.kind !== 'offer') continue;
        const known = s.piece.of.startsWith('prop:') ? (PROP_KINDS as readonly string[]).includes(s.piece.of.slice(5)) : !!MODEL_INFO[s.piece.of] || !!SET_KITS[s.piece.of];
        expect(known, `${id}: ${s.piece.of}`).toBe(true);
        const at = stepPlace(a, s)!;
        expect(Math.hypot(at.x - a.x, at.z - a.z), `${id}: outside the wall`).toBeGreaterThan(a.house!.radius + 3);
        expect(s.at.d, `${id}: in the court`).toBeLessThanOrEqual(FOUND.court);
        expect(Math.abs(s.at.side), `${id}: off the way in`).toBeGreaterThanOrEqual(WAY.width / 2 + 1.5);
      }
    }
  });

  it('asking only what the place has: a rite where the way has one, a sky the realm has, words in capitals', () => {
    for (const [id, d] of entries) {
      const a = arenaOf(id);
      const skies = kindsOf(a.region).map(([k]) => k as string);
      const rites = d.steps.filter((s) => s.kind === 'rite').length;
      expect(rites, `${id}: a rite step for a way with one, and only then`).toBe(ARENA_WAYS[id]?.rite ? 1 : 0);
      for (const s of d.steps) {
        expect(s.note.length, `${id}: a note`).toBeGreaterThan(20);
        if (s.kind === 'vigil') {
          for (const k of s.when.sky ?? []) expect(skies.includes(k), `${id}: ${k} falls in ${a.region}`).toBe(true);
          expect(s.words, id).toBe(s.words.toUpperCase());
          expect(Object.keys(s.when).length, `${id}: a vigil asks something`).toBeGreaterThan(0);
        }
        if (s.kind === 'offer') {
          expect(s.words, id).toBe(s.words.toUpperCase());
          expect(s.label.length, id).toBeGreaterThan(5);
        }
      }
      expect(d.opens, id).toBe(d.opens.toUpperCase());
      expect(d.steps.length, id).toBeGreaterThanOrEqual(2);
      expect(d.steps.length, id).toBeLessThanOrEqual(3);
    }
  });

  it('as quests: an act to a stage, and the horror last', () => {
    for (const [id, d] of entries) {
      const q = QUESTS[`discover_${id}`];
      expect(q, id).toBeTruthy();
      expect(q!.stages.length, id).toBe(d.steps.length + 1);
      expect(q!.stages[d.steps.length]!.goal).toEqual({ kind: 'slay', boss: id });
      expect(q!.title, id).toBe(d.title);
      expect(q!.lenient, id).toBe('last');
    }
  });
});

/** The frame at which the night is in `hour`. */
const frameOfHour = (hour: 'gloaming' | 'deep' | 'waning'): number => {
  for (let f = 0; f < 1080 * SIM.hz; f += 600) {
    const p = phaseOf(f / SIM.hz);
    if (hour === 'gloaming' ? p < 0.12 : hour === 'deep' ? p > 0.3 && p < 0.6 : p > 0.75 && p < 0.95) return f;
  }
  throw new Error(hour);
};
/** A sanity inside the band. */
const sanityIn = (band: string): number => {
  for (let v = SANITY.max; v >= 0; v -= 1) if (bandOf(v) === band) return v - 2 >= 0 && bandOf(v - 2) === band ? v - 2 : v;
  throw new Error(band);
};

/** Makes the world such that a vigil's condition holds, and keeps it so. */
function arrange(g: Game, s: Extract<Step, { kind: 'vigil' }>): void {
  const ow = g.overworld!;
  const hours = s.when.hour ?? ['deep'];
  const f = frameOfHour(hours[0]!);
  if (g.frame < f || g.frame - f > 6000) g.frame = f;
  if (s.when.sky) ow.weather = { kind: s.when.sky[0]!, want: s.when.sky[0]!, amount: 1, until: Infinity };
  setSanity(g, s.when.mind ? sanityIn(s.when.mind.from) : 100);
}

/** Does every act of a discovery as a player could, and returns the game. */
function complete(g: Game, boss: string): void {
  const a = arenaOf(boss);
  const d = DISCOVERIES[boss]!;
  const ow = g.overworld!;
  g.player.laudanum = 5;
  g.player.echoes = 5000;
  for (const [i, s] of d.steps.entries()) {
    expect(currentStep(g, boss), `${boss}: act ${i} is the one to do`).toBe(i);
    if (s.kind === 'read') ow.read.add(s.doc);
    else if (s.kind === 'rite') ow.told.add(`rite:${boss}`);
    else if (s.kind === 'vigil') {
      const at = stepPlace(a, s)!;
      goTo(g, at.x, at.z);
      for (let k = 0; k < SIM.hz * s.seconds + 30 && !ow.told.has(stepKey(boss, i)); k++) {
        if (k % 20 === 0) arrange(g, s);
        g.frame++;
        discoverySystem(g);
      }
    } else {
      const at = stepPlace(a, s)!;
      goTo(g, at.x + 0.4, at.z);
      setSanity(g, 100);
      g.ecs.c.health.get(g.player.id)!.hp = g.ecs.c.health.get(g.player.id)!.max;
      const act = fightAction(g);
      expect(act, `${boss}: an altar answers E`).not.toBeNull();
      act!.run();
    }
    discoverySystem(g);
    expect(ow.told.has(stepKey(boss, i)), `${boss}: act ${i} done`).toBe(true);
  }
}

/** A world game with the investigator by `boss`'s house, its foes sent away (they would wear on the mind and the body while a vigil is kept). */
function atHouse(boss: string): Game {
  const g = createWorldGame();
  const a = arenaOf(boss);
  const at = courtPoint(a.house!, 30, 0);
  goTo(g, at.x, at.z);
  run(g, 4);
  for (const id of [...g.ecs.c.dread.keys()]) g.ecs.despawn(id);
  return g;
}

describe('a house is seen, shut, and given', () => {
  it('names itself once as it is come to, and begins its quest', () => {
    const g = createWorldGame();
    const a = arenaOf('colour_out_of_space');
    const seen = record(g, 'HouseSeen');
    const far = courtPoint(a.house!, WAY.length - 4, 0);
    goTo(g, far.x, far.z);
    run(g, 6);
    expect(seen.length, 'not from afar').toBe(0);
    const near = courtPoint(a.house!, 20, 0);
    goTo(g, near.x, near.z);
    run(g, 6);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ boss: 'colour_out_of_space', name: ARENA_HOUSES.colour_out_of_space!.name });
    expect(stageOf(g, 'discover_colour_out_of_space')).toBe(0);
    expect(g.overworld!.tracked).toBe('discover_colour_out_of_space');
    run(g, 60);
    expect(seen, 'once').toHaveLength(1);
  });

  it('keeps its gate shut, saying so at it, until every act is done; then opens, once, and stays open', () => {
    const g = atHouse('colour_out_of_space');
    const a = arenaOf('colour_out_of_space');
    const id = [...g.ecs.c.piece].find(([, p]) => p.def.name === 'colour_out_of_space:house')![0];
    const sealOn = (): boolean => g.ecs.c.piece.get(id)!.seal.every((c) => !g.world.off.has(c));
    expect(sealOn()).toBe(true);
    const gate = courtPoint(a.house!, 2, 0);
    goTo(g, gate.x, gate.z);
    expect(sealedHere(g)).toBe(DISCOVERIES.colour_out_of_space!.shut.toUpperCase());
    const [opened, said] = [record(g, 'GateOpened'), record(g, 'Notice')];
    complete(g, 'colour_out_of_space');
    run(g, 2);
    expect(isFound(g, 'colour_out_of_space')).toBe(true);
    expect(sealOn(), 'the seal stands until the gate is come to').toBe(true);
    expect(opened).toHaveLength(1);
    expect(said.some((n) => n.text === DISCOVERIES.colour_out_of_space!.opens)).toBe(true);
    goTo(g, gate.x, gate.z);
    run(g, PASSAGE.frames.door + 6);
    expect(sealOn(), 'the seal is lifted as the gate is come to').toBe(false);
    expect(sealedHere(g)).toBeNull();
    const copy = createWorldGame();
    applySave(copy, parseSave(JSON.stringify(snapshot(g)))!);
    refreshSeals(copy);
    const id2 = [...copy.ecs.c.piece].find(([, p]) => p.def.name === 'colour_out_of_space:house')![0];
    goTo(copy, gate.x, gate.z);
    run(copy, PASSAGE.frames.door + 6);
    expect(copy.ecs.c.piece.get(id2)!.seal.every((c) => !copy.world.off.has(c)), 'and opens so in a save').toBe(false);
  });

  it('does a vigil only once the acts before it are done, and lets it ebb when it is not kept', () => {
    const g = atHouse('colour_out_of_space');
    const a = arenaOf('colour_out_of_space');
    const d = DISCOVERIES.colour_out_of_space!;
    const vig = d.steps.findIndex((s) => s.kind === 'vigil');
    const s = d.steps[vig]!;
    if (s.kind !== 'vigil') throw new Error('a vigil');
    const at = stepPlace(a, s)!;
    goTo(g, at.x, at.z);
    const hushed = record(g, 'Notice');
    for (let k = 0; k < 300; k++) {
      if (k % 20 === 0) arrange(g, s);
      g.frame++;
      discoverySystem(g);
    }
    expect(vigilShare(g, 'colour_out_of_space', vig), 'its turn has not come').toBe(0);
    expect(vigilsNear(g, 10), 'and its ring is not drawn').toEqual([]);
    expect(hushed.filter((n) => n.text.startsWith('NOTHING STIRS')), 'it says so, once in a while').toHaveLength(1);
    g.overworld!.read.add((d.steps[0] as { doc: string }).doc);
    g.overworld!.told.add('rite:colour_out_of_space');
    const kept = record(g, 'VigilKept');
    for (let k = 0; k < 240; k++) {
      if (k % 20 === 0) arrange(g, s);
      g.frame++;
      discoverySystem(g);
    }
    const share = vigilShare(g, 'colour_out_of_space', vig);
    expect(share).toBeGreaterThan(0);
    expect(kept[0]).toMatchObject({ share: 0 });
    expect(vigilsNear(g, 10), 'its ring is drawn, warm, as far as it is kept').toEqual([{ x: at.x, z: at.z, share, holds: true }]);
    goTo(g, at.x + 30, at.z);
    expect(vigilsNear(g, 10)).toEqual([]);
    for (let k = 0; k < 60; k++) {
      g.frame++;
      discoverySystem(g);
    }
    expect(vigilShare(g, 'colour_out_of_space', vig), 'ebbs').toBeLessThan(share);
    setSanity(g, 100);
    goTo(g, at.x, at.z);
    g.frame = frameOfHour('gloaming'); // not the hour: it does not grow
    g.overworld!.weather = { kind: 'clear', want: 'clear', amount: 0, until: Infinity };
    const before = vigilShare(g, 'colour_out_of_space', vig);
    for (let k = 0; k < 120; k++) {
      g.frame++;
      discoverySystem(g);
    }
    expect(vigilShare(g, 'colour_out_of_space', vig)).toBeLessThanOrEqual(before);
  });

  it('asks the hour, the sky, the mind and the dark that a vigil says', () => {
    const g = createWorldGame();
    g.frame = frameOfHour('deep');
    expect(holds(g, { hour: ['deep'] })).toBe(true);
    expect(holds(g, { hour: ['waning', 'gloaming'] })).toBe(false);
    setSanity(g, 100);
    expect(holds(g, { mind: { from: 'lucid', to: 'uneasy' } })).toBe(true);
    expect(holds(g, { mind: { from: 'fractured', to: 'unmoored' } })).toBe(false);
    setSanity(g, 30);
    expect(holds(g, { mind: { from: 'fractured', to: 'unmoored' } })).toBe(true);
    g.overworld!.weather = { kind: 'storm', want: 'storm', amount: 1, until: Infinity };
    expect(holds(g, { sky: ['storm', 'gale'] })).toBe(true);
    expect(holds(g, { sky: ['rain'] })).toBe(false);
    expect(holds(g, { dark: true })).toBe(true); // (no light is handed in: the dark)
    g.lit = () => 0.9;
    expect(holds(g, { dark: true })).toBe(false);
  });

  it('takes the gift laid on an altar, and not what is not there to give', () => {
    const g = atHouse('black_man');
    const a = arenaOf('black_man');
    const d = DISCOVERIES.black_man!;
    const i = d.steps.findIndex((s) => s.kind === 'offer');
    g.overworld!.read.add((d.steps[0] as { doc: string }).doc);
    g.overworld!.told.add('rite:black_man');
    discoverySystem(g);
    const s = d.steps[i]!;
    if (s.kind !== 'offer' || s.give.kind !== 'mind') throw new Error('a mind');
    const at = stepPlace(a, s)!;
    goTo(g, at.x + 0.5, at.z);
    expect(fightAction(g)?.label).toBe(s.label);
    goTo(g, at.x + 9, at.z);
    expect(fightAction(g), 'not far from the altar').toBeNull();
    goTo(g, at.x + 0.5, at.z);
    setSanity(g, 6);
    const act = fightAction(g)!;
    expect(act.label).toContain('too little');
    const mind = g.mind.sanity;
    act.run();
    expect(g.mind.sanity, 'nothing taken').toBe(mind);
    expect(g.overworld!.told.has(stepKey('black_man', i))).toBe(false);
    setSanity(g, 90);
    const offered = record(g, 'Offered');
    fightAction(g)!.run();
    expect(g.mind.sanity).toBeLessThan(90 - s.give.n + 1);
    expect(offered).toHaveLength(1);
    expect(g.overworld!.told.has(stepKey('black_man', i))).toBe(true);
    expect(isFound(g, 'black_man')).toBe(true);
    expect(fightAction(g), 'the altar answers no more').toBeNull();
  });

  it('lets a horror put down open its house, and a journey carried on find it so', () => {
    const g = createWorldGame();
    g.overworld!.slain.add('boss:yig');
    refreshSeals(g);
    expect(isFound(g, 'yig')).toBe(true);
    const carry = carryOf(g);
    expect(carry.found).toContain('yig');
    expect(parseCarry({ ...carry, found: ['yig', 'nonsense', 3] })!.found).toEqual(['yig']);
    expect(parseCarry({ ...carry, found: undefined })!.found).toEqual([]);
    const next = createWorldGame();
    applyCarry(next, carry);
    expect(next.overworld!.told.has(foundKey('yig'))).toBe(true);
    expect(isDone(g, 'discover_yig')).toBe(false); // (the quest itself is lenient: it is closed by the horror's fall in the quest system)
  });
});

describe('there is no way in but the gate', () => {
  it('a body walking at the horror from the gate side and the sides and back is stopped at the wall, the shut gate included (every house: tests/houseWalk.test.ts)', () => {
    const g = createWorldGame();
    const a = arenaOf('colour_out_of_space');
    const P = a.house!.radius;
    const gateAt = Math.atan2(a.front.z, a.front.x);
    for (const turn of [0, 90, 180, 270]) {
      const t = gateAt + (turn * Math.PI) / 180;
      expect(walkIn(g, a, { x: a.x + Math.cos(t) * (P + 7), z: a.z + Math.sin(t) * (P + 7) }, 240), `from ${turn}° of the gate`).toBeGreaterThan(P - 0.5);
    }
  });
});

describe('every discovery can be done', () => {
  for (const [boss, d] of entries) {
    it(`${boss}: ${d.title}`, () => {
      const g = atHouse(boss);
      complete(g, boss);
      expect(isFound(g, boss), 'the gate is given').toBe(true);
      const id = [...g.ecs.c.piece].find(([, p]) => p.def.name === `${boss}:house`)![0];
      const gate = courtPoint(arenaOf(boss).house!, 3, 0);
      goTo(g, gate.x, gate.z);
      run(g, PASSAGE.frames.door + 6);
      expect(g.ecs.c.piece.get(id)!.seal.every((c) => !g.world.off.has(c)), 'its seal is lifted as the gate is come to').toBe(false);
    });
  }
});
