import * as THREE from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { LOOKS, PUFFS, PUFF_OF, STEPS } from '../src/data/bodyTuning';
import { createStrideClock, followed, type Footfall } from '../src/render/footfalls';
import { laid, printOn } from '../src/render/footprintPlan';
import { createFootprints } from '../src/render/footprints';
import { puffsOf } from '../src/render/footPuffs';
import { createFootsteps } from '../src/render/atm/steps';
import type { ParticleSpec } from '../src/render/particles';
import { wetness } from '../src/render/wetness';
import { createGame, createWorldGame } from '../src/systems/game';
import type { GroundKind } from '../src/world/groundKind';
import { findGround, stride } from './footHelpers';

afterEach(() => void (wetness.value = 0));

const foot = (o: Partial<Footfall> = {}): Footfall => ({ x: 10, y: 1, z: 20, yaw: 0, foot: 1, speed: 4, stride: 1, ground: 'snow', body: { x: 10, z: 20 }, ...o });

describe('what the ground keeps of a step (round 80)', () => {
  it('snow, mud, sand and flesh hold a print dry, longest in snow; stone, boards and the sea hold none', () => {
    const life = (k: GroundKind): number | undefined => printOn(k, 0, 0)?.life;
    expect(life('snow')).toBeGreaterThan(life('mud')!);
    expect(life('mud')).toBeGreaterThan(life('sand')!);
    for (const k of ['sand', 'flesh', 'rot'] as const) expect(printOn(k, 0, 0), k).not.toBeNull();
    for (const k of ['stone', 'slab', 'boards', 'road', 'grass', 'dirt', 'leaves', 'gravel', 'cobble', 'water'] as const) expect(printOn(k, 0, 0), k).toBeNull();
    for (const [k, dry] of Object.entries(STEPS.dry)) expect(LOOKS, k).toContain(dry!.look);
  });

  it('rain-soaked grass, dirt and leaves take a shallow print that dries as the ground does; a drizzle takes none', () => {
    expect(printOn('grass', 0.2, 0)).toBeNull();
    const wet = printOn('grass', 1, 0)!;
    const damp = printOn('grass', 0.5, 0)!;
    expect(LOOKS[wet.look]).toBe('wet');
    expect(wet.life).toBeGreaterThan(damp.life);
    expect(wet.alpha).toBeGreaterThan(damp.alpha);
  });

  it('out of the sea, any dry ground takes a wet print for ten seconds, shorter and fainter as the boots dry; the sea itself none', () => {
    const fresh = printOn('stone', 0, 1)!;
    const drying = printOn('stone', 0, 0.3)!;
    expect(fresh.life).toBeCloseTo(STEPS.afterWater.seconds);
    expect(drying.life).toBeLessThan(fresh.life);
    expect(drying.alpha).toBeLessThan(fresh.alpha);
    expect(printOn('boards', 0, 1)).not.toBeNull();
    expect(printOn('stone', 0, 0)).toBeNull();
    expect(printOn('water', 1, 1)).toBeNull();
  });

  it('a mind that is Fractured or Unmoored is followed, unless the FX setting holds the stress under it', () => {
    expect(followed('lucid', 1)).toBe(false);
    expect(followed('uneasy', 1)).toBe(false);
    expect(followed('fractured', 0.7)).toBe(true);
    expect(followed('unmoored', -1)).toBe(true); // (the stress not yet known)
    expect(followed('unmoored', 0.2)).toBe(false); // (a cap of 20%)
  });

  it('the second set is laid every second footfall, bare, larger, a stride behind and to the left, and lasts', () => {
    const print = printOn('snow', 0, 0)!;
    const f = foot({ yaw: 0, stride: 1.2 });
    expect(laid(f, print, false, 2, 0)).toHaveLength(1);
    expect(laid(f, print, true, 1, 0)).toHaveLength(1);
    const [own, them] = laid(f, print, true, 2, 0);
    expect(own.bare).toBe(false);
    expect(them.bare).toBe(true);
    expect(them.scale).toBeCloseTo(STEPS.haunt.scale);
    expect(them.z).toBeLessThan(f.body.z - 1); // behind (yaw 0 faces +z)
    expect(them.x).toBeGreaterThan(f.body.x + 0.5); // to the left (the right of yaw 0 is -x)
    expect(them.fadeIn).toBeGreaterThan(own.fadeIn);
    expect(them.print.life).toBe(STEPS.haunt.life);
    expect(laid(foot({ ground: 'water' }), print, true, 2, 0)).toHaveLength(1);
  });
});

describe('the footfall clock keeps the foley\'s stride', () => {
  it('a walk lays a footfall every stride, the feet alternating, on the ground walked on', () => {
    const g = createWorldGame();
    const at = findGround(g, 'mountains', 'snow', 15, 0.5)!;
    const tr = g.ecs.c.transform.get(g.player.id)!;
    tr.pos = { x: at.x, y: 1, z: at.z };
    tr.prev = { ...tr.pos };
    const clock = createStrideClock(g);
    const falls: Footfall[] = [];
    for (let i = 0; i < 100; i++) {
      stride(g, 0.1, 0.5);
      const f = clock.step((i + 1) / 20); // 2 m/s
      if (f) falls.push(f);
    }
    expect(falls.length).toBeGreaterThanOrEqual(10);
    expect(falls.length).toBeLessThanOrEqual(14); // 10 m at about 0.85 m a stride
    expect(falls.every((f, i) => i === 0 || f.foot !== falls[i - 1].foot)).toBe(true);
    expect(falls[3].ground).toBe('snow');
    expect(falls[3].yaw).toBeCloseTo(0.5, 1);
  });

  it('no footfall mounted, in a move, fallen, in a scene, or after a jump', () => {
    const g = createWorldGame();
    const clock = createStrideClock(g);
    let t = 0;
    const walk = (metres = 0.2): Footfall | null => (stride(g, metres, 0), clock.step((t += 0.1)));
    const count = (n = 40): number => Array.from({ length: n }, () => walk()).filter((f) => f).length;
    expect(count()).toBeGreaterThan(5);
    g.player.mount.active = 'grey';
    expect(count()).toBe(0);
    g.player.mount.active = null;
    const a = g.ecs.c.actor.get(g.player.id)!;
    a.move = 'light1';
    expect(count()).toBe(0);
    a.move = null;
    g.cutscene = true;
    expect(count()).toBe(0);
    g.cutscene = false;
    g.ecs.c.dead.set(g.player.id, true);
    expect(count()).toBe(0);
    g.ecs.c.dead.delete(g.player.id);
    expect(walk(5)).toBeNull(); // (a jump of five metres)
    expect(count()).toBeGreaterThan(5);
  });
});

describe('what a heel kicks up', () => {
  const rand = (): number => 0.5;
  it('nothing at a walk, powder in snow, mud flecks in mud, leaves in leaves, nothing on stone', () => {
    expect(puffsOf(foot({ speed: 2 }), 0, rand)).toEqual([]);
    expect(puffsOf(foot({ ground: 'stone' }), 0, rand)).toEqual([]);
    const snow = puffsOf(foot({ ground: 'snow', speed: 5 }), 0, rand);
    expect(snow.length).toBeGreaterThanOrEqual(2);
    expect(snow.every((s) => s.shape === 'wisp')).toBe(true);
    expect(puffsOf(foot({ ground: 'mud', speed: 5 }), 0, rand).every((s) => s.shape === 'disc' && s.floor === 1)).toBe(true);
    expect(puffsOf(foot({ ground: 'leaves', speed: 5 }), 0, rand).every((s) => s.shape === 'shard')).toBe(true);
    for (const kind of Object.values(PUFF_OF)) expect(PUFFS[kind!], String(kind)).toBeDefined();
  });

  it('a sprint kicks up more than a trot, and wet dust is darker', () => {
    expect(puffsOf(foot({ ground: 'snow', speed: 6.4 }), 0, rand).length).toBeGreaterThanOrEqual(puffsOf(foot({ ground: 'snow', speed: 3.2 }), 0, rand).length);
    const dry = puffsOf(foot({ ground: 'dirt', speed: 5 }), 0, rand)[0];
    const wet = puffsOf(foot({ ground: 'dirt', speed: 5 }), 1, rand)[0];
    expect(wet.color[0]).toBeLessThan(dry.color[0]);
  });
});

describe('the batch of prints', () => {
  it('holds 128, lets the oldest go, fades them out, and draws nothing once none shows', () => {
    const scene = new THREE.Scene();
    const prints = createFootprints(scene, () => 0);
    const mesh = scene.children[0] as THREE.InstancedMesh;
    expect(mesh.visible).toBe(false);
    const print = printOn('snow', 0, 0)!;
    for (let i = 0; i < 300; i++) prints.lay({ x: i * 0.5, z: 0, yaw: 0, foot: 1, bare: false, scale: 1, fadeIn: 0.1, print: { ...print, life: 10 } }, 0);
    prints.update(1);
    expect(prints.live).toBe(STEPS.capacity);
    expect(mesh.count).toBe(STEPS.capacity);
    expect(mesh.visible).toBe(true);
    prints.update(9.9);
    expect(prints.live).toBeLessThan(STEPS.capacity + 1);
    prints.update(11);
    expect(prints.live).toBe(0);
    expect(mesh.visible).toBe(false);
  });

  it('a print lies on a slope with its face to the sky and its toe the way it goes', () => {
    const scene = new THREE.Scene();
    const prints = createFootprints(scene, (x, z) => 0.5 * x + 0 * z); // rises to +x
    const mesh = scene.children[0] as THREE.InstancedMesh;
    prints.lay({ x: 2, z: 3, yaw: Math.PI / 2, foot: 1, bare: false, scale: 1, fadeIn: 0.1, print: printOn('snow', 0, 0)! }, 0); // going up the slope
    const m = new THREE.Matrix4();
    mesh.getMatrixAt(0, m);
    const [ex, ey, ez] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    m.extractBasis(ex, ey, ez);
    expect(ey.y).toBeGreaterThan(0.85); // faces up, tilted with the ground
    expect(ey.x).toBeLessThan(-0.3); // leaning away from the rise
    expect(ez.x).toBeGreaterThan(0); // the toe runs +x
    expect(ez.y).toBeGreaterThan(0); // and climbs
    const p = new THREE.Vector3().setFromMatrixPosition(m);
    expect(p.y).toBeGreaterThan(0.5 * 2 + 0.03);
  });
});

describe('the part: it lays, kicks and follows, and writes nothing to the game', () => {
  function rig(region: string, ground: GroundKind) {
    const g = createWorldGame();
    const at = findGround(g, region, ground, 70, 1)!;
    const tr = g.ecs.c.transform.get(g.player.id)!;
    tr.pos = { x: at.x, y: 1, z: at.z };
    tr.prev = { ...tr.pos };
    const scene = new THREE.Scene();
    const specs: ParticleSpec[] = [];
    const part = createFootsteps({ scene, g, audio: {} as never, parts: { particles: { spawn: (s: ParticleSpec) => void specs.push(s), update: () => undefined } } as never });
    const mesh = (): THREE.InstancedMesh => scene.children[0] as THREE.InstancedMesh;
    let t = 0;
    const walk = (metres: number, seconds: number, steps = 20): void => {
      for (let i = 0; i < steps; i++) {
        stride(g, metres / steps, 1);
        t += seconds / steps;
        part.update(null as never, t, false, 1);
      }
    };
    const wait = (seconds: number): void => void part.update(null as never, (t += seconds), false, 1);
    return { g, scene, specs, mesh, walk, wait, part };
  }
  const state = (g: ReturnType<typeof createWorldGame>): string => JSON.stringify({ mind: g.mind, hp: [...g.ecs.c.health], st: [...g.ecs.c.stamina], echoes: g.player.echoes, frame: g.frame, rng: g.rng });

  it('walking on snow lays prints, and running kicks powder; walking on stone lays nothing', () => {
    const snow = rig('mountains', 'snow');
    snow.walk(12, 6); // 2 m/s
    expect(snow.mesh().count).toBeGreaterThan(8);
    expect(snow.specs).toEqual([]); // (a walk kicks up nothing)
    snow.walk(30, 5); // 6 m/s
    expect(snow.specs.length).toBeGreaterThan(5);
    const stone = rig('kn_yan', 'slab');
    stone.walk(12, 6);
    expect(stone.mesh().count).toBe(0);
  });

  it('no print is laid mounted, and none in the arena', () => {
    const r = rig('mountains', 'snow');
    r.g.player.mount.active = 'grey';
    r.walk(12, 4);
    expect(r.mesh().count).toBe(0);
    const arena = createGame();
    const scene = new THREE.Scene();
    const part = createFootsteps({ scene, g: arena, audio: {} as never, parts: { particles: { spawn: () => undefined } } as never });
    for (let i = 1; i <= 40; i++) {
      stride(arena, 0.15, 0);
      part.update(null as never, i / 10, false, 1);
    }
    expect((scene.children[0] as THREE.InstancedMesh).count).toBe(0);
  });

  it('a followed mind lays a second set of bare prints; a lucid one does not', () => {
    const lucid = rig('mountains', 'snow');
    lucid.walk(14, 7);
    const own = lucid.mesh().count;
    const dread = rig('mountains', 'snow');
    dread.g.mind.band = 'unmoored';
    dread.walk(14, 7);
    expect(dread.mesh().count).toBeGreaterThan(own * 1.3);
  });

  it('after the sea, wet prints trail on dry stone, and they stop after ten seconds', () => {
    const r = rig('kn_yan', 'slab');
    r.g.events.emit('Splash', { at: { ...r.g.ecs.c.transform.get(r.g.player.id)!.pos }, speed: 3, size: 0.5 });
    r.walk(6, 3);
    expect(r.mesh().count).toBeGreaterThan(3);
    const laidBefore = r.mesh().count;
    r.wait(11); // the boots dry
    r.walk(6, 3);
    expect(r.mesh().count).toBe(laidBefore); // (no more laid on dry stone)
  });

  it('reads the game and writes nothing of its balance', () => {
    const r = rig('mountains', 'snow');
    r.g.mind.band = 'unmoored';
    const before = state(r.g);
    r.walk(40, 8);
    expect(state(r.g)).toBe(before);
  });
});
