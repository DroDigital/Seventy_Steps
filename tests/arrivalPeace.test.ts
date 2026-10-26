import { describe, expect, it } from 'vitest';
import { emptyInput } from '../src/core/input';
import { PLAYER_MOVES } from '../src/data/moves';
import { PEACE, REALITY, SANITY, SIM } from '../src/data/tuning';
import { rest, signPlace, travel } from '../src/systems/checkpoints';
import { shove } from '../src/systems/combat';
import { isSheltered, type Game } from '../src/systems/components';
import { spawnCreature } from '../src/systems/creatures';
import { allWakes } from '../src/systems/fogGates';
import { createGame, createWorldGame, stepGame } from '../src/systems/game';
import { bufferPress } from '../src/systems/inputBuffer';
import { beginPeace } from '../src/systems/peace';
import { HOOKS } from '../src/systems/reality';
import { bleed, loseSanity } from '../src/systems/sanity';
import { applySave, snapshot } from '../src/systems/save';
import { chunkContent } from '../src/world/chunks';
import { worldLayout } from '../src/world/placements';
import { chunkOf } from '../src/world/worldMap';
import { hookFight } from './bossHelpers';
import { press, steps } from './helpers';
import { goTo, record, run, slay } from './worldHelpers';

const AFTER = Math.round(PEACE.after * SIM.hz);
const walk = { ...emptyInput(), moveY: 1 };

/** Signs with a foe posted within `r` metres of where the investigator rises: the halls' stones, where an arrival used to meet a blow as the veil lifted. */
function hallSigns(r: number): { id: string; foe: number }[] {
  const out: { id: string; foe: number }[] = [];
  for (const s of worldLayout().signs) {
    const seen = new Set<string>();
    let near = Infinity;
    for (let cx = chunkOf(s.rest.x - r); cx <= chunkOf(s.rest.x + r); cx++) for (let cz = chunkOf(s.rest.z - r); cz <= chunkOf(s.rest.z + r); cz++) {
      for (const sp of chunkContent(cx, cz).spawns) {
        if (seen.has(sp.id) || sp.id.startsWith('ally:') || sp.id.startsWith('boss:')) continue;
        seen.add(sp.id);
        near = Math.min(near, Math.hypot(sp.at.x - s.rest.x, sp.at.z - s.rest.z));
      }
    }
    if (near <= r) out.push({ id: s.id, foe: near });
  }
  return out;
}

/** A sign of the open ground, no hall's and with no one standing near it: its foes are far off, and E there rests, and does not talk. */
function quietSign(g: Game): string {
  const people = [...g.ecs.c.npc.keys()].map((e) => g.ecs.c.transform.get(e)!.pos);
  const halls = new Set(hallSigns(30).map((h) => h.id));
  const s = worldLayout().signs.find((x) => !x.dream && !halls.has(x.id) && people.every((p) => Math.hypot(p.x - x.rest.x, p.z - x.rest.z) > 12));
  if (!s) throw new Error('no quiet sign');
  return s.id;
}

/** A world game with a quiet sign found, travelled to, and a deep one `away` metres out in front of the investigator, facing them. */
function arrive(away = 4): { g: Game; foe: number; hp: number } {
  const g = createWorldGame();
  const id = quietSign(g);
  g.overworld!.discovered.add(id);
  expect(travel(g, id)).toBe(true);
  const me = g.ecs.c.transform.get(g.player.id)!;
  const [sin, cos] = [Math.sin(me.yaw), Math.cos(me.yaw)];
  const foe = spawnCreature(g, 'deep_one', { x: me.pos.x + sin * away, z: me.pos.z + cos * away, yaw: me.yaw + Math.PI })!;
  return { g, foe, hp: g.ecs.c.health.get(g.player.id)!.hp };
}

const hunting = (g: Game): boolean => [...g.ecs.c.brain.values()].some((b) => b.target === g.player.id);

describe('an arrival is at peace (round 88)', () => {
  it('is begun by fast travel, a rest and a game continued at its stone, and is not there before', () => {
    const g = createWorldGame();
    expect(g.player.peace).toBeNull();
    const [a, b] = worldLayout().signs.filter((s) => !s.dream);
    g.overworld!.discovered.add(b.id);
    travel(g, b.id);
    expect(g.player.peace).toEqual({ since: g.frame, risen: false, left: AFTER });
    expect(isSheltered(g)).toBe(true);
    g.player.peace = null;
    const at = signPlace(a.id)!;
    g.ecs.c.transform.get(g.player.id)!.pos = { x: at.rest.x, y: 0, z: at.rest.z };
    rest(g, a.id);
    expect(g.player.peace).not.toBeNull();
    g.player.peace = null;
    const loaded = createWorldGame({ save: snapshot(g) });
    expect(loaded.player.peace).not.toBeNull();
    applySave(g, snapshot(g));
    expect(g.player.peace).not.toBeNull();
  });

  it('a game continued out in the world, away from its stone, is continued as it was: no free pause in a hall or a horror\'s court', () => {
    const g = createWorldGame();
    const cp = g.player.checkpoint;
    for (const dx of [40, -40, 60]) {
      goTo(g, cp.x + dx, cp.z);
      const at = g.ecs.c.transform.get(g.player.id)!.pos;
      const loaded = createWorldGame({ save: snapshot(g) });
      const there = loaded.ecs.c.transform.get(loaded.player.id)!.pos;
      if (Math.hypot(there.x - at.x, there.z - at.z) > 1) continue; // (footing unsafe there: they would be set down at the stone, and at peace)
      expect(loaded.player.peace).toBeNull();
      return;
    }
    throw new Error('no place away from the stone with safe footing found');
  });

  it('a fall ends in peace at the stone: the Respawned event begins it', async () => {
    const g = createWorldGame();
    const s = signPlace(worldLayout().signs.find((x) => !x.dream)!.id)!;
    g.ecs.c.transform.get(g.player.id)!.pos = { x: s.rest.x, y: 0, z: s.rest.z };
    rest(g, s.id);
    g.player.peace = null;
    g.player.kneeling = null;
    const killer = spawnCreature(g, 'deep_one', { x: s.rest.x + 3, z: s.rest.z, yaw: 0 })!;
    slay(g, killer);
    steps(g, PLAYER_MOVES.death.frames + 5);
    expect(g.ecs.c.health.get(g.player.id)!.hp).toBeGreaterThan(0);
    expect(g.player.peace).toEqual(expect.objectContaining({ risen: false }));
    expect(hunting(g)).toBe(false);
  });

  it('shelters like a dialogue: no blow, shove, loss of mind or bleeding, and a foe on them lets go', () => {
    const { g, foe, hp } = arrive(2);
    const br = g.ecs.c.brain.get(foe)!;
    br.state = 'engage';
    br.target = g.player.id;
    const mind = g.mind.sanity;
    loseSanity(g, 30);
    expect(g.mind.sanity).toBe(mind);
    shove(g, g.player.id, { ...g.ecs.c.transform.get(foe)!.pos }, 5);
    expect(g.ecs.c.shove.has(g.player.id)).toBe(false);
    g.mind.band = 'unmoored';
    bleed(g, 1);
    expect(g.ecs.c.health.get(g.player.id)!.hp).toBe(hp);
    g.mind.band = 'lucid';
    steps(g, 120);
    expect(br.target).toBeNull();
    expect(br.state).not.toBe('engage');
    expect(g.ecs.c.health.get(g.player.id)!.hp).toBe(hp);
  });

  it('a gaze builds nothing in their peace, and turns them to stone in its absence', () => {
    for (const peace of [true, false]) {
      const { g, boss, fight } = hookFight(['petrify_buildup']);
      if (peace) g.player.peace = { since: 0, risen: false, left: AFTER };
      g.reality.petrify = 1 - REALITY.petrifyRate / 2;
      HOOKS.petrify_buildup(g, [[boss, fight]]);
      expect(g.ecs.c.health.get(g.player.id)!.hp > 0, `peace ${peace}`).toBe(peace);
    }
  });

  it('is not begun in the combat arena, which has no stones, journeys or veil', () => {
    const g = createGame();
    beginPeace(g);
    expect(g.player.peace).toBeNull();
    expect(isSheltered(g)).toBe(false);
  });

  it('holds while they kneel as long as they like, and no foe beside the stone takes them up', () => {
    const { g, foe, hp } = arrive(3);
    steps(g, 60 * 20);
    expect(g.player.peace).toEqual(expect.objectContaining({ risen: false, left: AFTER }));
    expect(g.player.kneeling).not.toBeNull();
    expect(g.ecs.c.brain.get(foe)!.target).toBeNull();
    expect(g.ecs.c.actor.get(foe)!.move).toBeNull();
    expect(g.ecs.c.health.get(g.player.id)!.hp).toBe(hp);
  });

  it('their first move rises from it, and it ends PEACE.after seconds later, when the foe beside them takes them up', () => {
    const { g, foe, hp } = arrive(3);
    steps(g, 30);
    stepGame(g, walk);
    expect(g.player.peace!.risen).toBe(true);
    stepGame(g, emptyInput());
    expect(g.player.peace!.left).toBe(AFTER - 1);
    steps(g, AFTER - 3);
    expect(g.player.peace).not.toBeNull();
    expect(g.ecs.c.health.get(g.player.id)!.hp).toBe(hp);
    expect(hunting(g)).toBe(false);
    steps(g, 3);
    expect(g.player.peace).toBeNull();
    steps(g, 90);
    expect(g.ecs.c.brain.get(foe)!.target).toBe(g.player.id); // the normal senses, from nothing
  });

  it('their own blow, shot or flask ends it at once, and the step it began on does not rise from it', () => {
    for (const button of ['light', 'heavy', 'shoot', 'throw'] as const) {
      const { g, foe } = arrive(2.2);
      g.player.oil = 1;
      steps(g, 5);
      stepGame(g, press(button));
      expect(g.player.peace, button).toBeNull();
      steps(g, 60);
      expect(g.ecs.c.brain.get(foe)!.target ?? null, button).not.toBeNull(); // struck or seen, it is on them
    }
    const g = createWorldGame();
    const s = signPlace(quietSign(g))!;
    g.ecs.c.transform.get(g.player.id)!.pos = { x: s.rest.x, y: 0, z: s.rest.z };
    stepGame(g, press('interact')); // E at the stone rests: the press that did it is not a rising
    expect(g.player.peace).toEqual(expect.objectContaining({ risen: false }));
    stepGame(g, emptyInput());
    expect(g.player.peace!.risen).toBe(false);
  });

  it('a talk, a trade or the sign\'s menu holds it as it is, and a horror woken, a boss\'s fog or a death ends it', () => {
    const { g } = arrive();
    stepGame(g, walk);
    g.sheltered = true;
    steps(g, AFTER * 2);
    expect(g.player.peace).toEqual(expect.objectContaining({ risen: true, left: AFTER }));
    g.sheltered = false;
    for (const event of ['BossEngaged', 'FogPassing'] as const) {
      beginPeace(g);
      g.events.emit(event, { entity: 0, name: 'x', wall: 'x', x: 0, z: 0, frames: 1 });
      expect(g.player.peace, event).toBeNull();
    }
    beginPeace(g);
    g.events.emit('Died', { entity: g.player.id, killer: null, at: { x: 0, y: 0, z: 0 } });
    expect(g.player.peace).toBeNull();
    beginPeace(g);
    g.events.emit('Died', { entity: g.player.id + 1, killer: null, at: { x: 0, y: 0, z: 0 } }); // another's death is not theirs
    expect(g.player.peace).not.toBeNull();
  });
});

describe('what an arrival carries over, and what waits for them (round 88)', () => {
  it('a swing in progress or a press queued as they set out is left behind: neither breaks the peace of the arrival', () => {
    for (const queued of [false, true]) {
      const g = createWorldGame();
      const id = quietSign(g);
      g.overworld!.discovered.add(id);
      if (queued) bufferPress(g.player.buffer, 'light');
      else {
        stepGame(g, press('heavy'));
        steps(g, 3);
        expect(g.ecs.c.actor.get(g.player.id)!.move).not.toBeNull();
      }
      expect(travel(g, id)).toBe(true);
      steps(g, 30);
      expect(g.ecs.c.actor.get(g.player.id)!.move, `queued=${queued}`).toBeNull();
      expect(g.player.peace, `queued=${queued}`).toEqual(expect.objectContaining({ risen: false }));
    }
  });

  it('a horror that joins another\'s fight does not come out on an investigator at peace, and does as soon as it is over', () => {
    const g = createWorldGame();
    const p = g.ecs.c.transform.get(g.player.id)!.pos;
    const keziah = spawnCreature(g, 'keziah_mason', { x: p.x + 8, z: p.z, yaw: 0 })!;
    const jenkin = spawnCreature(g, 'brown_jenkin', { x: p.x + 3, z: p.z, yaw: 0 })!;
    const notices: string[] = [];
    g.events.on('Notice', (e) => void notices.push(e.text));
    const h = g.ecs.c.health.get(keziah)!;
    h.hp = h.max * 0.45; // as a wound kept in a save would have her
    beginPeace(g);
    steps(g, 60);
    expect(g.ecs.c.brain.get(jenkin)!.state).toBe('hidden');
    expect(g.player.peace).not.toBeNull();
    expect(notices).not.toContain('BROWN JENKIN JOINS THE FIGHT');
    g.player.peace = null;
    steps(g, 5);
    expect(g.ecs.c.brain.get(jenkin)!.state).toBe('engage');
    expect(notices).toContain('BROWN JENKIN JOINS THE FIGHT');
  });

  it.each(['at peace', 'in a talk'] as const)('a horror seen %s is beheld, with its shock, once they are free: nothing is forfeited', (how) => {
    const g = createGame({ creature: 'wilbur_whateley' });
    const sights: unknown[] = [];
    g.events.on('FirstSight', (e) => void sights.push(e));
    if (how === 'in a talk') g.sheltered = true;
    else g.player.peace = { since: 0, risen: false, left: AFTER };
    steps(g, 30);
    expect(g.mind.seen.has('wilbur_whateley')).toBe(false);
    expect(g.mind.insight).toBe(0);
    expect(g.mind.sanity).toBe(SANITY.max);
    expect(sights).toEqual([]);
    g.sheltered = false;
    g.player.peace = null;
    steps(g, 3);
    expect(g.mind.seen.has('wilbur_whateley')).toBe(true);
    expect(g.mind.insight).toBe(1);
    expect(g.mind.sanity).toBeCloseTo(SANITY.max - SANITY.firstSight.named, 5);
    expect(sights).toHaveLength(1);
  });
});

describe('a sleeping horror\'s ring (review of round 88: a rising at an open arena\'s stake ran the court at peace)', () => {
  it('ends it where the horror wakes by its own senses, as it always did, and not before', () => {
    const g = createWorldGame();
    const w = allWakes().find((x) => x.spawns.length > 0)!;
    goTo(g, w.x + w.radius + 6, w.z, -Math.PI / 2);
    run(g, 1);
    beginPeace(g);
    const woken = record(g, 'BossEngaged');
    run(g, 120);
    expect(g.player.peace).not.toBeNull();
    expect(woken).toHaveLength(0);
    goTo(g, w.x + w.radius - 3, w.z, -Math.PI / 2);
    run(g, 1);
    expect(g.player.peace).toBeNull();
    run(g, 180);
    expect(woken).toHaveLength(1);
  });
});

describe('the halls\' stones: no one is on a travelling investigator as the veil lifts', () => {
  const halls = hallSigns(14);

  it('there are halls whose stone has a foe within a few strides', () => {
    expect(halls.length).toBeGreaterThanOrEqual(8);
  });

  it.each(halls.map((h) => [h.id, h.foe] as const))('%s (a foe %f m off)', (id) => {
    const g = createWorldGame();
    g.overworld!.discovered.add(id);
    expect(travel(g, id)).toBe(true);
    const hp = g.ecs.c.health.get(g.player.id)!.hp;
    steps(g, 60 * 6);
    expect(hunting(g)).toBe(false);
    expect(g.ecs.c.health.get(g.player.id)!.hp).toBe(hp);
    expect(g.mind.sanity).toBe(100);
    stepGame(g, walk);
    steps(g, AFTER - 2);
    expect(hunting(g)).toBe(false); // PEACE.after seconds of their own, after they rise
    expect(g.ecs.c.health.get(g.player.id)!.hp).toBe(hp);
  });
});
