/**
 * Secret passages open as they are approached (round 61): a hidden doorway or bridge that insight shows stays shut until the investigator
 * comes near, then opens over a second or so, its way passable as the picture is well on, and shuts again if the mind loses what shows it.
 */
import { describe, expect, it } from 'vitest';
import type { Entity } from '../src/core/ecs';
import { PASSAGE } from '../src/data/tuning';
import { createWorldGame } from '../src/systems/game';
import { changeInsight } from '../src/systems/insight';
import { passageKind, wakeOf } from '../src/systems/passages';
import { spawnPiece } from '../src/systems/hiddenLayer';
import { goTo, record, run } from './worldHelpers';
import type { Game } from '../src/systems/components';

const door = (g: Game, minInsight = 1): [Entity, ReturnType<Game['ecs']['c']['piece']['get']>] => {
  const hit = [...g.ecs.c.piece].find(([, p]) => p.def.door && p.def.minInsight === minInsight)!;
  return [hit[0], hit[1]];
};
const bridge = (g: Game): [Entity, NonNullable<ReturnType<Game['ecs']['c']['piece']['get']>>] => {
  const hit = [...g.ecs.c.piece].find(([, p]) => p.def.bridge && p.def.minInsight !== undefined)!;
  return [hit[0], hit[1]];
};
const sealOn = (g: Game, id: Entity): boolean => g.ecs.c.piece.get(id)!.seal.every((c) => !g.world.off.has(c));
const deckOn = (g: Game, id: Entity): boolean => g.ecs.c.piece.get(id)!.colliders.every((c) => !g.world.off.has(c));
const layer = (g: Game, id: Entity) => g.ecs.c.layer.get(id)!;
/** A place on the floor at the near brink's side of a bridge, `more` metres past its brink (the room's floor: the middle of a bridge's room is its gap). */
const brink = (d: NonNullable<ReturnType<Game['ecs']['c']['piece']['get']>>['def'], more: number): { x: number; z: number } =>
  d.bridge!.alongX ? { x: d.x - d.bridge!.half - more, z: d.z } : { x: d.x, z: d.z - d.bridge!.half - more };
const withMind = (): Game => {
  const g = createWorldGame();
  changeInsight(g, 9, 'debug', 'test');
  return g;
};

describe('a secret doorway (round 61)', () => {
  it('is shown to a mind with the insight, and stays shut, a wall, until it is approached', () => {
    const g = withMind();
    const [id, piece] = door(g);
    expect(layer(g, id).shown).toBe(true);
    expect(layer(g, id).open).toBe(0);
    expect(sealOn(g, id)).toBe(true);
    goTo(g, piece!.def.x + 60, piece!.def.z);
    run(g, 120);
    expect(layer(g, id).open).toBe(0); // far off: asleep
    expect(sealOn(g, id)).toBe(true);
  });

  it('wakes as the investigator comes near, says so once, and opens over its seconds: passable once the slab is well aside', () => {
    const g = withMind();
    const [id, piece] = door(g);
    const d = piece!.def;
    const [log] = [record(g, 'PassageOpening')];
    goTo(g, d.x + PASSAGE.wake - 1, d.z);
    run(g, 1);
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ id, kind: 'door' });
    const frames = PASSAGE.frames.door;
    run(g, Math.ceil(frames * PASSAGE.solidAt) - 3);
    expect(layer(g, id).open).toBeLessThan(PASSAGE.solidAt);
    expect(sealOn(g, id)).toBe(true); // the slab is still across
    run(g, 6);
    expect(layer(g, id).open).toBeGreaterThanOrEqual(PASSAGE.solidAt);
    expect(sealOn(g, id)).toBe(false); // the way is open
    run(g, frames);
    expect(layer(g, id).open).toBe(1);
    expect(log).toHaveLength(1); // once
  });

  it('is finished once begun, though the investigator walks away, and stays open', () => {
    const g = withMind();
    const [id, piece] = door(g);
    goTo(g, piece!.def.x + PASSAGE.wake - 1, piece!.def.z);
    run(g, 10);
    goTo(g, piece!.def.x + 80, piece!.def.z);
    run(g, PASSAGE.frames.door);
    expect(layer(g, id).open).toBe(1);
    expect(sealOn(g, id)).toBe(false);
  });

  it('is a wall again, and shut, when the mind loses what showed it, and opens again as it is approached once more', () => {
    const g = withMind();
    const [id, piece] = door(g);
    goTo(g, piece!.def.x + 3, piece!.def.z);
    run(g, PASSAGE.frames.door + 5);
    expect(sealOn(g, id)).toBe(false);
    changeInsight(g, -9, 'debug', 'test');
    expect(layer(g, id).shown).toBe(false);
    expect(layer(g, id).open).toBe(0);
    expect(sealOn(g, id)).toBe(true);
    changeInsight(g, 9, 'debug', 'test');
    expect(layer(g, id).open).toBe(0); // shown again: shut until it is approached
    goTo(g, piece!.def.x + 3, piece!.def.z);
    run(g, PASSAGE.frames.door + 5);
    expect(layer(g, id).open).toBe(1);
  });

  it('does not open for a mind that cannot see it, though it is stood at', () => {
    const g = createWorldGame();
    const [id, piece] = door(g, 2);
    goTo(g, piece!.def.x + 3, piece!.def.z);
    run(g, PASSAGE.frames.door * 2);
    expect(layer(g, id).shown).toBe(false);
    expect(layer(g, id).open).toBe(0);
    expect(sealOn(g, id)).toBe(true);
  });

  it('is already open for one standing at it when the world is made, and is not shut on them', () => {
    const g = withMind();
    const [, piece] = door(g);
    const d = piece!.def;
    goTo(g, d.x, d.z);
    const again = spawnPiece(g, { ...d, name: `${d.name} (again)` });
    expect(layer(g, again).open).toBe(1);
    expect(g.ecs.c.piece.get(again)!.seal.every((c) => g.world.off.has(c))).toBe(true);
  });
});

describe('a secret bridge (round 61)', () => {
  it('has no deck, and its gap is a fall, until it has formed; then the deck stands and the gap is stopped', () => {
    const g = withMind();
    const [id, piece] = bridge(g);
    expect(piece.def.bridge!.half).toBeGreaterThan(0);
    expect(deckOn(g, id)).toBe(false);
    expect(sealOn(g, id)).toBe(true);
    const at = brink(piece.def, 2);
    goTo(g, at.x, at.z);
    run(g, 2);
    expect(layer(g, id).open).toBeGreaterThan(0);
    expect(deckOn(g, id)).toBe(false); // still forming
    run(g, Math.ceil(PASSAGE.frames.bridge * PASSAGE.solidAt) + 2);
    expect(deckOn(g, id)).toBe(true);
    expect(sealOn(g, id)).toBe(false);
  });

  it('wakes farther off than a door, by half its length, so that it is formed before the brink is reached', () => {
    const g = withMind();
    const [, b] = bridge(g);
    const [, d] = door(g);
    expect(passageKind(b.def)).toBe('bridge');
    expect(passageKind(d!.def)).toMatch(/door|sealed/);
    expect(wakeOf(b.def)).toBe(PASSAGE.wake + b.def.bridge!.half);
    expect(wakeOf(b.def)).toBeGreaterThan(wakeOf(d!.def));
  });

  it('forms faster than a door opens, and a sealed door of the Beyond opens more slowly than either', () => {
    expect(PASSAGE.frames.bridge).toBeLessThan(PASSAGE.frames.door);
    expect(PASSAGE.frames.sealed).toBeGreaterThan(PASSAGE.frames.door);
  });
});
