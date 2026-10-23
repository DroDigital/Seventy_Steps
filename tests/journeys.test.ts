import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyInput } from '../src/core/input';
import { gatePlace, signPlace, travel } from '../src/systems/checkpoints';
import { WORLD } from '../src/data/tuning';
import { createWorldGame, stepGame } from '../src/systems/game';
import { createJourneys, DYING_MS } from '../src/ui/journeys';
import { inkLine, lineLight, veilField, type Veil } from '../src/ui/veil';
import { worldLayout } from '../src/world/placements';
import { press, scriptedGame } from './helpers';
import { goTo, record, slay } from './worldHelpers';

/** A veil that covers only when told to, and says what it was asked. */
function fakeVeil() {
  let covered = false;
  let finish: (() => void) | null = null;
  let fill = 0;
  const asked: string[] = [];
  const veil: Veil = {
    cover: (words = '', _secs?: number, line?: string) => (asked.push(line ? `cover ${words} · ${line}` : `cover ${words}`), (fill = 0), new Promise<void>((r) => (finish = () => ((covered = true), r())))),
    lift: () => (asked.push('lift'), (covered = false), Promise.resolve()),
    darken: () => void (covered = true),
    haunt: () => undefined,
    progress: (share) => void (fill = Math.max(fill, share)),
    get fill() {
      return fill;
    },
    get covered() {
      return covered;
    },
    get active() {
      return covered;
    },
  };
  return { veil, asked, covers: async () => (finish?.(), await Promise.resolve()) };
}

let now = 0;
const at = (ms: number): void => void (now = ms);
vi.spyOn(performance, 'now').mockImplementation(() => now);
afterEach(() => at(0));

const pos = (g: ReturnType<typeof createWorldGame>) => g.ecs.c.transform.get(g.player.id)!.pos;

describe('journeys (ui/journeys.ts)', () => {
  it('a gate walked into is a journey: the veil falls over the walk in the light of the realm beyond, the world still stepping, and holds once they are through (round 60)', () => {
    const g = createWorldGame();
    const { veil, asked } = fakeVeil();
    const lights: unknown[] = [];
    const cover = veil.cover;
    veil.cover = (words, secs, line, light) => (lights.push(light), cover(words, secs, line));
    const j = createJourneys(g, veil);
    const gate = gatePlace('hub_australia')!;
    goTo(g, gate.arrive.x, gate.arrive.z);
    stepGame(g, emptyInput());
    for (let i = 0; i < 400 && !g.player.gatePass; i++) {
      const p = pos(g);
      g.camera.yaw = g.camera.prevYaw = Math.atan2(gate.x - p.x, gate.z - p.z);
      const f = j.before({ ...emptyInput(), moveY: 1 });
      if (f) stepGame(g, f);
    }
    expect(g.player.gatePass).not.toBeNull();
    expect(asked).toEqual([`cover ${gatePlace(gate.to)!.name.toUpperCase()}`]);
    expect(lights[0]).toHaveLength(3); // the far realm's light
    expect(j.busy).toBe(true);
    expect(j.still).toBe(false); // the walk on into the light goes on under it
    while (g.player.gatePass) stepGame(g, j.before(emptyInput()) ?? emptyInput());
    expect(pos(g)).toMatchObject({ x: gatePlace(gate.to)!.arrive.x, z: gatePlace(gate.to)!.arrive.z });
    expect(j.before(emptyInput())).toEqual(emptyInput()); // then as any journey: one step on arrival...
    expect(j.before(emptyInput())).toBeNull(); // ...and the world waits while the far side is made
  });

  it('a jump waits under the veil: the world stands still while it covers, takes a step on arrival, waits for the chunks, then the veil lifts', async () => {
    const g = createWorldGame();
    g.overworld!.discovered.add('arkham_streets');
    const { veil, asked, covers } = fakeVeil();
    const j = createJourneys(g, veil);
    j.go('ARKHAM', () => travel(g, 'arkham_streets'));
    expect(asked).toEqual(['cover ARKHAM']);
    expect(j.before(emptyInput())).toBeNull();
    expect(pos(g).x).not.toBeCloseTo(signPlace('arkham_streets')!.rest.x);
    await covers();
    expect(pos(g)).toMatchObject({ x: signPlace('arkham_streets')!.rest.x, z: signPlace('arkham_streets')!.rest.z });
    expect(j.before(press('light'))).toEqual(emptyInput()); // one step without the investigator's hand...
    expect(j.before(emptyInput())).toBeNull(); // ...then the world waits in the dark
    expect(j.budget).toBeGreaterThan(10);
    j.update(6); // its first frame: the hold's clock starts, six chunk jobs pending
    at(2000);
    j.update(3); // chunks still building
    expect(asked).toEqual(['cover ARKHAM']);
    j.update(0);
    expect(asked).toEqual(['cover ARKHAM', 'lift']);
    expect(j.still).toBe(false);
  });

  it('a journey with its own line (the descent) says it, and holds until it can be read (round 17)', async () => {
    const g = createWorldGame();
    g.overworld!.discovered.add('arkham_streets');
    const { veil, asked, covers } = fakeVeil();
    const j = createJourneys(g, veil);
    j.go('ARKHAM', () => travel(g, 'arkham_streets'), 'A line of its own.');
    expect(asked).toEqual(['cover ARKHAM · A line of its own.']);
    await covers();
    j.before(emptyInput());
    j.update(0); // its first frame: nothing to build
    at(2000);
    j.update(0);
    expect(asked).toHaveLength(1); // a journey without a line would have lifted by now
    at(3500);
    j.update(0);
    expect(asked.at(-1)).toBe('lift');
  });

  it('E at a gate is not a journey: no veil falls and the key goes on to the world, which does nothing with it (round 60)', () => {
    const g = createWorldGame();
    const gate = worldLayout().gates[0];
    const back = (WORLD.reach - 0.7) / WORLD.gateArrive;
    goTo(g, gate.x + (gate.arrive.x - gate.x) * back, gate.z + (gate.arrive.z - gate.z) * back);
    const before = { ...pos(g) };
    const { veil, asked } = fakeVeil();
    const j = createJourneys(g, veil);
    expect(j.before(press('interact'))?.pressed.interact).toBe(true);
    expect([asked, j.busy]).toEqual([[], false]);
    expect(pos(g)).toMatchObject({ x: before.x, z: before.z });
  });

  it('dying, the veil falls and the death throes wait for it before the respawn', async () => {
    const { g, deepOne } = scriptedGame();
    const { veil, asked, covers } = fakeVeil();
    const j = createJourneys(g, veil);
    const respawned = record(g, 'Respawned');
    slay(g, deepOne);
    at(DYING_MS - 100);
    j.update(0);
    expect(asked).toEqual([]); // the fall shows first, UNMADE over it (round 14)
    at(DYING_MS + 100);
    j.update(0);
    expect(asked).toHaveLength(1);
    expect(asked[0]).toMatch(/^cover THE ELDER SIGN · \S/); // in the dark, where UNMADE stood alone before it, what the last blow teaches is read (round 54)
    for (let i = 0; i < 400; i++) {
      const input = j.before(emptyInput());
      if (input) stepGame(g, input);
    }
    expect(respawned).toEqual([]); // held at the last of the fall
    await covers();
    for (let i = 0; i < 5; i++) {
      const input = j.before(emptyInput());
      if (input) stepGame(g, input);
    }
    expect(respawned).toHaveLength(1);
    at(DYING_MS + 2100);
    j.update(0);
    at(DYING_MS + 3100);
    j.update(0);
    expect(asked.at(-1)).toBe('lift');
  });
});

describe('loading under the veil (playtest round 10)', () => {
  const arrived = (ready?: () => Promise<void>) => {
    const g = createWorldGame();
    const f = fakeVeil();
    f.veil.darken();
    const j = createJourneys(g, f.veil, ready);
    return { g, j, ...f };
  };

  it('the line fills on from what the making filled before the hold, as the chunks about the arrival stand', () => {
    const { veil, j } = arrived();
    veil.progress(0.5); // the game's own making
    j.arrive();
    j.update(8);
    expect(veil.fill).toBeCloseTo(0.5);
    j.update(4);
    expect(veil.fill).toBeCloseTo(0.75);
    j.update(0);
    expect(veil.fill).toBe(1);
  });

  it('the hold counts from its first frame, so a slow making does not rob the chunks of their time', () => {
    const { j, asked } = arrived();
    j.arrive();
    at(5000); // the making took five seconds
    j.update(3);
    at(8000);
    j.update(3);
    expect(asked).not.toContain('lift'); // three seconds of building so far: they wait on
    at(9100);
    j.update(3);
    expect(asked).toContain('lift'); // at most four
  });

  it('the world is made ready to be seen (its shaders) before the veil lifts, standing still meanwhile', async () => {
    let done = (): void => undefined;
    const ready = vi.fn(() => new Promise<void>((r) => (done = r)));
    const { j, asked } = arrived(ready);
    const reveal = vi.fn();
    j.arrive(reveal);
    expect(j.before(emptyInput())).toEqual(emptyInput()); // the one step on arrival...
    j.update(0);
    at(1000);
    expect(j.before(emptyInput())).toBeNull(); // ...then it waits
    j.update(0);
    expect(ready).toHaveBeenCalledOnce();
    expect(asked).not.toContain('lift');
    expect(j.before(emptyInput())).toBeNull(); // still, while it is made ready
    expect(j.still).toBe(true);
    done();
    await Promise.resolve();
    await Promise.resolve();
    expect(asked).toEqual(['lift']);
    expect(reveal).toHaveBeenCalledOnce();
    expect(j.still).toBe(false);
  });
});

describe('the veil (ui/veil.ts)', () => {
  it('creeps in from the edges: nothing covered at 0, everything at 1, the corners before the centre', () => {
    const [w, h] = [48, 27];
    const f = veilField(w, h);
    const values = [...f];
    expect(Math.max(...values)).toBeLessThan(inkLine(0));
    expect(Math.min(...values)).toBeGreaterThan(inkLine(1));
    const centre = f[Math.floor(h / 2) * w + Math.floor(w / 2)];
    for (const corner of [f[0], f[w - 1], f[(h - 1) * w], f[h * w - 1]]) expect(corner).toBeGreaterThan(centre);
  });

  it('fills its line from the middle outwards, its tips glinting, the rest a dim track (playtest round 10)', () => {
    expect(lineLight(0, 0)).toBe(0); // nothing made yet: all track
    for (const dx of [0, 10, -10, 16, -16]) expect(lineLight(dx, 0.5)).toBe(1);
    expect(lineLight(17, 0.5)).toBe(0.5);
    expect(lineLight(-17, 0.5)).toBe(0.5);
    expect(lineLight(25, 0.5)).toBe(0);
    expect(lineLight(33, 1)).toBe(1);
    expect(lineLight(34, 1)).toBe(0.5);
    expect(lineLight(35, 1)).toBe(-1); // beyond its ends
  });
});
