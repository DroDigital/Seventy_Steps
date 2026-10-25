import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { BREATH } from '../src/data/sleeperBreath';
import { bodyOf } from '../src/systems/creatures';
import { getEntity } from '../src/data/registry';
import { teleport } from '../src/systems/checkpoints';
import { createGame, createWorldGame } from '../src/systems/game';
import { priorOf } from '../src/systems/sealCount';
import { breathTargets } from '../src/render/audio/breathBed';
import { hushOf, hushReach } from '../src/render/audio/dread';
import type { PostPass } from '../src/render/postPass';
import { breathAt, breathPeriod, drawing, nearestSleeper } from '../src/render/sleepers';
import { BREATH_DEBUG, createSleeperBreath } from '../src/render/sleeperBreath';
import { worldUniforms } from '../src/render/worldMaterial';
import { worldLayout, type SpawnPoint } from '../src/world/placements';
import { run } from './worldHelpers';

type Boss = SpawnPoint & { arena: NonNullable<SpawnPoint['arena']> };
const BOSSES = worldLayout().spawns.filter((s): s is Boss => s.id.startsWith('boss:') && !!s.arena);
const heightOf = (s: Boss): number => bodyOf(getEntity(s.entity)!).height;
const CTHULHU = BOSSES.find((s) => s.id === 'boss:cthulhu')!;
const SMALL = BOSSES.find((s) => heightOf(s) < BREATH.minHeight)!;

/** A world with the investigator `past` metres outside a boss's ring, the boss a second on. */
function stand(s: Boss, past: number) {
  const g = createWorldGame();
  const prior = priorOf(s.entity);
  if (prior) g.overworld!.slain.add(`boss:${prior}`);
  teleport(g, { x: s.arena.x, z: s.arena.z + s.arena.radius + past, yaw: Math.PI });
  run(g, 60);
  return { g, e: g.overworld!.alive.get(s.id)!, me: g.ecs.c.transform.get(g.player.id)!.pos };
}

describe('the Sleeper\'s breath (round 78)', () => {
  it('a breath draws in slowly and lets go quickly, 0 to 1 and never outside it', () => {
    const period = 12;
    const xs = Array.from({ length: 1201 }, (_, i) => breathAt((i / 1200) * period, period));
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThanOrEqual(1);
    expect(xs[0]).toBe(0);
    expect(xs.indexOf(Math.max(...xs)) / 1200).toBeCloseTo(BREATH.inhale, 1); // full at the end of the draw
    const slope = (a: number, b: number): number => Math.max(...xs.slice(a + 1, b).map((x, i) => Math.abs(x - xs[a + i])));
    expect(slope(Math.round(BREATH.inhale * 1200), 1200)).toBeGreaterThan(slope(0, Math.round(BREATH.inhale * 1200))); // the letting go is the faster
    expect(breathAt(period * 7.3, period)).toBeCloseTo(breathAt(period * 0.3, period)); // and it goes on
    expect(breathAt(-1, period)).toBeGreaterThanOrEqual(0);
    expect(drawing(1, period) && !drawing(period * 0.8, period)).toBe(true);
  });

  it('the larger the sleeper the slower it breathes, within nine and fifteen seconds', () => {
    expect(breathPeriod(8)).toBeGreaterThanOrEqual(9);
    expect(breathPeriod(40)).toBeGreaterThan(breathPeriod(11));
    expect(breathPeriod(400)).toBe(15);
    expect(breathPeriod(0)).toBe(9);
  });

  it('finds a colossus that sleeps: its reach is the hush\'s, falling to nothing past it', () => {
    const near = stand(CTHULHU, 20);
    const s = nearestSleeper(near.g, near.me)!;
    expect(s.id).toBe(near.e);
    expect(s.height).toBe(40);
    expect(s.period).toBe(breathPeriod(40));
    expect(s.k).toBeCloseTo(hushOf(20, hushReach(40)));
    const far = stand(CTHULHU, hushReach(40) + 5);
    expect(nearestSleeper(far.g, far.me)).toBeNull();
  });

  it('ignores one that is engaged, dead, unseen or short, and the arena', () => {
    const { g, e, me } = stand(CTHULHU, 20);
    const fight = g.ecs.c.fight.get(e)!;
    fight.engaged = true;
    expect(nearestSleeper(g, me)).toBeNull(); // the fight begun: the breath stops
    fight.engaged = false;
    fight.script.unseen = true;
    expect(nearestSleeper(g, me)).toBeNull();
    fight.script.unseen = false;
    expect(nearestSleeper(g, me)).not.toBeNull();
    g.ecs.c.health.get(e)!.hp = 0;
    expect(nearestSleeper(g, me)).toBeNull(); // slain
    g.ecs.c.health.get(e)!.hp = 1;
    g.ecs.c.dead.set(e, true);
    expect(nearestSleeper(g, me)).toBeNull();
    const small = stand(SMALL, 3);
    expect(nearestSleeper(small.g, small.me)).toBeNull(); // not tall enough to breathe a world
    const arena = createGame({ creature: 'cthulhu' });
    expect(nearestSleeper(arena, { x: 0, y: 0, z: 0 })).toBeNull(); // the arena shows every creature: nothing sleeps there
  });

  it('the bed rises and falls with the breath, lower the taller, and never above its peak', () => {
    const [period, low, high] = [breathPeriod(40), breathTargets(0, 1, 40), breathTargets(0, 1, 9)];
    const peak = Math.max(...Array.from({ length: 400 }, (_, i) => breathTargets((i / 400) * period, 1, 40).master));
    expect(peak).toBeCloseTo(BREATH.bed.peak, 3);
    expect(20 * Math.log10(peak * BREATH.bed.gain.reduce((a, b) => a + b, 0))).toBeLessThan(-18); // never louder than that, on the effects bus
    expect(breathTargets(period * BREATH.inhale, 0.5, 40).master).toBeCloseTo(0.5 * BREATH.bed.peak, 3); // by the reach
    expect(breathTargets(period * BREATH.inhale, 0, 40).master).toBe(0);
    expect(low.hz[0]).toBeLessThan(high.hz[0]);
    expect(breathTargets(1, 1, 40).rush).toBe(1); // drawn in: the rush
    expect(breathTargets(period * 0.8, 1, 40).rush).toBeLessThan(1);
  });
});

/** A post pass with only the uniforms the breath moves. */
function post(): PostPass {
  const uniforms = { uFog: { value: new THREE.Vector4() }, uFogAir: { value: new THREE.Vector4() }, uFogColor: { value: new THREE.Vector3() }, uVig: { value: 0.42 } };
  return { uniforms } as unknown as PostPass;
}

describe('the breath seen: it multiplies what the mist and the lantern were set to, and gives it back', () => {
  const frame = (p: PostPass): void => {
    p.uniforms.uFog.value.set(0.05, 2, 0, 0.5); // (the mist and the lantern are set afresh each frame before it)
    p.uniforms.uFogAir.value.set(0.004, 20, 0.6, 0);
    p.uniforms.uFogColor.value.set(0.2, 0.3, 0.25);
    worldUniforms.uLanternColor.value.set(1, 0.8, 0.5);
  };

  it('swells the mist, the haze and the mist\'s light, draws the lantern down and darkens the corners at the peak, near a sleeper', () => {
    const { g } = stand(CTHULHU, 20);
    const p = post();
    const breath = createSleeperBreath(g, p);
    BREATH_DEBUG.phase = 1;
    for (let i = 0; i < 160; i++) (frame(p), breath.update(i * 0.1, false)); // the reach is taken up over a few seconds
    const k = hushOf(20, hushReach(40));
    expect(p.uniforms.uFog.value.x).toBeCloseTo(0.05 * (1 + BREATH.swell.mist * k), 3);
    expect(p.uniforms.uFogAir.value.x).toBeGreaterThan(0.004);
    expect(p.uniforms.uFogColor.value.y).toBeGreaterThan(0.3);
    expect(worldUniforms.uLanternColor.value.x).toBeLessThan(1);
    expect(p.uniforms.uVig.value).toBeGreaterThan(0.42);
    BREATH_DEBUG.phase = 0;
    frame(p);
    breath.update(16.1, false);
    expect(p.uniforms.uFog.value.x).toBeCloseTo(0.05, 6); // let go
    expect(p.uniforms.uVig.value).toBeCloseTo(0.42, 6);
    BREATH_DEBUG.phase = null;
  });

  it('is nothing under a roof, in a scene, past the reach or once the fight begins, and the corners are given back', () => {
    const { g, e } = stand(CTHULHU, 20);
    const p = post();
    const breath = createSleeperBreath(g, p);
    BREATH_DEBUG.phase = 1;
    let t = 0;
    const settle = (enclosed: boolean, seconds: number): void => {
      for (let i = 0; i < seconds * 10; i++) (frame(p), breath.update((t += 0.1), enclosed));
    };
    settle(false, 16);
    expect(p.uniforms.uFog.value.x).toBeGreaterThan(0.055);
    settle(true, 4); // under a roof
    expect(p.uniforms.uFog.value.x).toBeCloseTo(0.05, 3);
    expect(p.uniforms.uVig.value).toBeCloseTo(0.42, 3);
    settle(false, 16);
    g.cutscene = true; // a scene: it is not washed by the breath
    settle(false, 4);
    expect(p.uniforms.uFog.value.x).toBeCloseTo(0.05, 3);
    g.cutscene = false;
    settle(false, 16);
    g.ecs.c.fight.get(e)!.engaged = true; // and it stops, dead
    settle(false, 4);
    expect(p.uniforms.uFog.value.x).toBeCloseTo(0.05, 3);
    BREATH_DEBUG.phase = null;
  });
});
