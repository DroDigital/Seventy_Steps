import { describe, expect, it } from 'vitest';
import { PLAYER, WATER, WORLD } from '../src/data/tuning';
import { fallDark, fallSystem } from '../src/systems/falls';
import { createWorldGame } from '../src/systems/game';
import { seaChopNow } from '../src/systems/seaChop';
import { seaHeight } from '../src/world/seaSurface';
import { enterSea, seaTimeOf, splashSize, surfaceAt, waterDark } from '../src/systems/waterFall';
import type { Collider } from '../src/world/colliders';

/** Walks the real ground west of Arkham, past its border and down the slope, until the body falls; then plays the fall out, frame by frame. */
function intoTheSea() {
  const g = createWorldGame();
  const tr = g.ecs.c.transform.get(g.player.id)!;
  const events: { type: string; frame: number; data: unknown }[] = [];
  let frame = 0;
  g.events.on('Splash', (d) => events.push({ type: 'Splash', frame, data: d }));
  g.events.on('Seized', (d) => events.push({ type: 'Seized', frame, data: d }));
  g.events.on('Died', (d) => events.push({ type: 'Died', frame, data: d }));
  tr.pos = { x: -500, y: g.world.ground(-500, 220), z: 220 };
  tr.prev = { ...tr.pos };
  for (let i = 0; i < 700 && !g.player.falling; i++) {
    tr.prev = { ...tr.pos };
    tr.pos.x -= 0.07;
    tr.pos.y = g.world.ground(tr.pos.x, tr.pos.z);
    g.frame++;
    fallSystem(g);
  }
  expect(g.player.falling).not.toBeNull();
  const track: { depth: number; y: number; bed: number; dark: number; hp: number }[] = [];
  const start = frame;
  while (frame - start < WATER.max + 30 && !events.some((e) => e.type === 'Died')) {
    frame++;
    g.frame++;
    fallSystem(g);
    const f = g.player.falling!;
    track.push({ depth: f.water!.depth, y: tr.pos.y, bed: g.world.ground(tr.pos.x, tr.pos.z), dark: fallDark(f), hp: g.ecs.c.health.get(g.player.id)!.hp });
  }
  return { g, tr, events, track };
}

describe('a body that goes off the land into the sea (round 55)', () => {
  it('is in the water\'s fall, not the air\'s: it meets the surface where the waves have it, once, and a tentacle has hold of it a little after', () => {
    const { events, g } = intoTheSea();
    const splash = events.filter((e) => e.type === 'Splash');
    const seized = events.filter((e) => e.type === 'Seized');
    expect(splash).toHaveLength(1);
    expect(seized).toHaveLength(1);
    const s = splash[0]!.data as { at: { x: number; y: number; z: number }; speed: number; size: number };
    expect(Math.abs(s.at.y - surfaceAt(s.at.x, s.at.z, 0))).toBeLessThan(WORLD.seaLevel + 3); // at the water (the waves moved a frame on: a loose bound)
    expect(s.at.y).toBeLessThan(WORLD.seaLevel + 0.4);
    expect(s.size).toBeGreaterThan(0);
    expect(s.size).toBeLessThanOrEqual(1);
    expect(seized[0]!.frame - splash[0]!.frame).toBe(WATER.seize);
    expect(g.ecs.c.health.get(g.player.id)!.hp).toBe(0);
  });

  it('floats chest-deep until it is seized, then is drawn out along the seabed and dies when it has been held long enough, the picture going dark as it is', () => {
    const { track, events } = intoTheSea();
    const splash = events.find((e) => e.type === 'Splash')!;
    const seized = events.find((e) => e.type === 'Seized')!;
    const died = events.find((e) => e.type === 'Died')!;
    expect(died.frame - seized.frame).toBeLessThanOrEqual(WATER.held + 1);
    expect(died.frame - seized.frame).toBeGreaterThanOrEqual(WATER.held - 1);
    let last = 0;
    for (const [i, t] of track.entries()) {
      expect(t.y, 'the seabed is under it').toBeGreaterThanOrEqual(t.bed - 1e-6);
      if (i < track.length - 1) expect(t.hp).toBe(PLAYER.hp); // alive until the death at the end
      expect(t.dark, 'it only darkens').toBeGreaterThanOrEqual(last - 1e-9);
      last = t.dark;
    }
    expect(track[0]!.dark).toBe(0);
    expect(track[WATER.seize - 2]!.dark, 'clear until the tentacle has it').toBe(0);
    expect(last).toBeGreaterThan(0.95); // and black by the death
    // floating: until it is seized the feet hang about chest-deep, not sinking on...
    const afloat = track.slice(splash.frame - events[0]!.frame + 30, WATER.seize);
    for (const t of afloat) expect(t.depth).toBeLessThan(WATER.afloat + 0.6);
  });

  it('is drawn out into the sea along the way the tentacle lies, farther each frame, and not carried on at a walk before it', () => {
    const { g, tr, events } = intoTheSea();
    const seized = events.find((e) => e.type === 'Seized')!.data as { at: { x: number; z: number } };
    const away = Math.hypot(tr.pos.x - seized.at.x, tr.pos.z - seized.at.z);
    expect(away).toBeGreaterThan(3); // dragged a good way
    expect(away).toBeLessThan(12);
    const w = g.player.falling!.water!;
    expect(Math.hypot(w.heading.x, w.heading.z)).toBeCloseTo(1, 5);
    expect(Math.hypot(w.root.x - tr.pos.x, w.root.z - tr.pos.z)).toBeCloseTo(WATER.root, 3); // the tentacle stays taut, ahead of it
  });
});

describe('a body dropped into the sea from a height', () => {
  const dropped = (y: number) => {
    const g = createWorldGame();
    g.world = { ground: () => -9, colliders: [], off: new Set(), contain: () => {} };
    const tr = g.ecs.c.transform.get(g.player.id)!;
    tr.pos = { x: -600, y, z: 220 };
    tr.prev = { ...tr.pos };
    g.player.falling = { frame: 0, vy: 0, vx: 0, vz: 0, spin: 1, lip: { ...tr.pos }, water: enterSea(tr.pos, { x: 0, z: 0 }, 0) };
    const splashes: { speed: number; size: number }[] = [];
    g.events.on('Splash', (d) => splashes.push(d));
    for (let i = 0; i < 90; i++) fallSystem(g);
    return splashes;
  };

  it('meets the water at the speed of its fall, once, and the higher it fell, the bigger the splash', () => {
    const [low, high] = [dropped(0), dropped(6)];
    expect(low).toHaveLength(1);
    expect(high).toHaveLength(1);
    const surface = surfaceAt(-600, 220, 0);
    const expected = Math.sqrt(2 * WATER.gravity * (6 - surface));
    expect(high[0]!.speed).toBeGreaterThan(expected * 0.9);
    expect(high[0]!.speed).toBeLessThan(expected * 1.1);
    expect(high[0]!.size).toBeGreaterThan(low[0]!.size);
    expect(splashSize(0)).toBeGreaterThan(0);
    expect(splashSize(100)).toBe(1);
  });
});

describe('the surface it meets is the one drawn (round 55)', () => {
  /** A body falls into the sea from 3 m, in R'lyeh in a storm; returns where it met the water, and when by the sea's clock. */
  const fallsInStorm = (clock: (g: ReturnType<typeof createWorldGame>) => number | null) => {
    const g = createWorldGame();
    g.overworld!.region = 'rlyeh';
    Object.assign(g.overworld!.weather, { kind: 'storm', amount: 1 });
    const chop = seaChopNow(g);
    if (clock(g) !== null) g.seaTime = () => clock(g)!;
    g.world = { ground: () => -9, colliders: [], off: new Set(), contain: () => {} };
    const tr = g.ecs.c.transform.get(g.player.id)!;
    tr.pos = { x: -600, y: 3, z: 220 };
    tr.prev = { ...tr.pos };
    g.player.falling = { frame: 0, vy: 0, vx: 0, vz: 0, spin: 1, lip: { ...tr.pos }, water: enterSea(tr.pos, { x: 0, z: 0 }, seaTimeOf(g), chop) };
    const meets: { y: number; time: number }[] = [];
    g.events.on('Splash', (d) => meets.push({ y: d.at.y, time: seaTimeOf(g) }));
    for (let i = 0; i < 90; i++) {
      g.frame++;
      fallSystem(g);
    }
    expect(meets).toHaveLength(1);
    const at = (time: number, c: number) => WORLD.seaLevel + seaHeight(-600, 220, time, c);
    return { chop, met: meets[0]!, drawn: at(meets[0]!.time, chop), calm: at(meets[0]!.time, 1) };
  };

  it('rides the swell as the wind has raised it: a body that falls in a storm splashes at the storm\'s water, not the calm\'s', () => {
    const { chop, met, drawn, calm } = fallsInStorm(() => null);
    expect(chop).toBeGreaterThan(2.5);
    expect(Math.abs(met.y - drawn)).toBeLessThan(0.05); // (the body has moved a hair sideways in the air)
    expect(Math.abs(drawn - calm)).toBeGreaterThan(0.1); // and the two differ here, so the test tells them apart
  });

  it('takes the wave by the clock the picture runs on, which a cutscene that held the frames still has set apart from them', () => {
    const offset = 37.3; // seconds the picture's clock has run on (a cutscene: main.ts advances it, and `g.frame` waits)
    const { chop, met, drawn } = fallsInStorm((g) => offset + g.frame / 60);
    const byFrames = WORLD.seaLevel + seaHeight(-600, 220, met.time - offset, chop); // where the frames' own clock would have had the water
    expect(Math.abs(met.y - drawn)).toBeLessThan(0.05);
    expect(Math.abs(drawn - byFrames)).toBeGreaterThan(0.1); // the frames' clock would have put it at another wave
  });
});

describe('the end of the fall (round 55)', () => {
  it('lies where it died: nothing draws the body on in the dark once the death has come', () => {
    const g = createWorldGame();
    g.world = { ground: () => -9, colliders: [], off: new Set(), contain: () => {} };
    const tr = g.ecs.c.transform.get(g.player.id)!;
    tr.pos = { x: -600, y: 0, z: 220 };
    tr.prev = { ...tr.pos };
    g.player.falling = { frame: 0, vy: 0, vx: 0, vz: 0, spin: 1, lip: { ...tr.pos }, water: enterSea(tr.pos, { x: 0, z: 0 }, 0) };
    let died: { x: number; y: number; z: number } | null = null;
    g.events.on('Died', () => (died = { ...tr.pos }));
    for (let i = 0; i < WATER.max + 20; i++) {
      g.frame++;
      fallSystem(g);
    }
    expect(died).not.toBeNull();
    expect(g.player.falling!.frame).toBeGreaterThan(0);
    expect(tr.pos).toEqual(died); // it did not go on sinking and drifting to the end of the frames
  });

  it('reads the sea\'s clock from the picture when it is handed in, else from the frames', () => {
    const g = createWorldGame();
    g.frame = 120;
    expect(seaTimeOf(g)).toBeCloseTo(2, 6);
    g.seaTime = () => 100; // (a cutscene has held the frames still while the picture's clock ran on)
    expect(seaTimeOf(g)).toBe(100);
  });
});

describe('a pit is not the sea', () => {
  it('keeps the air\'s fall: no water, no splash', () => {
    const g = createWorldGame();
    const home = g.player.checkpoint;
    const pit: Collider = { kind: 'box', fall: true, min: { x: home.x + 10, y: -9, z: home.z - 3 }, max: { x: home.x + 16, y: 9, z: home.z + 3 } };
    g.world = { ground: () => 0, colliders: [pit], off: new Set(), contain: () => {} };
    const tr = g.ecs.c.transform.get(g.player.id)!;
    tr.pos = { x: home.x + 13, y: 0, z: home.z };
    tr.prev = { ...tr.pos };
    let splashed = false;
    g.events.on('Splash', () => void (splashed = true));
    fallSystem(g);
    expect(g.player.falling).not.toBeNull();
    expect(g.player.falling!.water).toBeNull();
    for (let i = 0; i < 80; i++) fallSystem(g);
    expect(splashed).toBe(false);
  });

  it('has a dark that is the time held\'s alone', () => {
    expect(waterDark({ surface: 0, entered: 1, grab: 5, root: { x: 0, y: 0, z: 0 }, heading: { x: 0, z: 1 }, held: 0, depth: 0 })).toBe(0);
    expect(waterDark({ surface: 0, entered: 1, grab: 5, root: { x: 0, y: 0, z: 0 }, heading: { x: 0, z: 1 }, held: WATER.dark[1], depth: 0 })).toBe(1);
  });
});
