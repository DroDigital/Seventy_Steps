import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EYES } from '../src/data/dreadPicture';
import { OUTER_DARK } from '../src/data/regions';
import { blinkIn, eyesIn, heightOf, lifeOf, maySettle, pairsFor, restOf, risen, shut, vanishes } from '../src/render/darkEyeRules';
import { createDarkEyes } from '../src/render/darkEyes';
import { createWorldGame } from '../src/systems/game';
import { setSanity } from '../src/systems/sanity';

afterEach(() => vi.restoreAllMocks());

const spot = { distance: 35, offset: 0.8, lit: 0, sea: false, roofed: false, wood: 1, roll: 0 };
const pair = { age: 5, life: 12, stared: 0, distance: 30, lit: 0 };
const world = { calm: true, hidden: false };

describe('eyes beyond the lantern: the rules (pure)', () => {
  it('hang on the heath and in the woods, never blinking in Innsmouth and red in the Black Wood, and nowhere else', () => {
    for (const id of ['arkham', 'dunwich', 'vermont', 'providence', 'innsmouth', 'black_wood']) expect(eyesIn(id), id).not.toBeNull();
    expect(eyesIn('innsmouth')!.blinks).toBe(false);
    expect(eyesIn('arkham')!.blinks).toBe(true);
    const red = eyesIn('black_wood')!.rgb;
    expect(red[0]).toBeGreaterThan(red[1] * 3);
    for (const id of ['hub', 'mountains', 'dreamlands', 'rlyeh', 'yuggoth', 'beyond', ...OUTER_DARK.filter((r) => r !== 'black_wood'), 'nowhere']) expect(eyesIn(id), id).toBeNull();
    expect(eyesIn(null)).toBeNull();
  });

  it('are one more below the uneasy, three above', () => {
    expect(pairsFor(100)).toBe(EYES.max);
    expect(pairsFor(EYES.uneasy)).toBe(EYES.max);
    expect(pairsFor(EYES.uneasy - 1)).toBe(EYES.max + 1);
  });

  it('settle only in the dark, in the open, dry, out of the middle of the picture and far enough', () => {
    expect(maySettle(spot)).toBe(true);
    expect(maySettle({ ...spot, lit: 0.5 })).toBe(false); // near a lamp, a fire or a window
    expect(maySettle({ ...spot, lit: EYES.litAt + 0.01 })).toBe(false);
    expect(maySettle({ ...spot, distance: EYES.from - 1 })).toBe(false);
    expect(maySettle({ ...spot, distance: EYES.far + 1 })).toBe(false);
    expect(maySettle({ ...spot, offset: 0.05 })).toBe(false); // not in the middle of the picture
    expect(maySettle({ ...spot, offset: -0.8 })).toBe(true);
    expect(maySettle({ ...spot, sea: true })).toBe(false);
    expect(maySettle({ ...spot, roofed: true })).toBe(false);
  });

  it('prefer cover: an open place takes the roll, a wooded one nearly always', () => {
    expect(maySettle({ ...spot, wood: 0, roll: 0.3 })).toBe(true);
    expect(maySettle({ ...spot, wood: 0, roll: 0.5 })).toBe(false);
    expect(maySettle({ ...spot, wood: 1, roll: 0.99 })).toBe(true);
  });

  it('go when looked at squarely for a moment, when approached, when lit, at the end of their time, in a fight or a talk, or under a roof', () => {
    expect(vanishes(pair, world)).toBe(false);
    expect(vanishes({ ...pair, stared: EYES.stareFor + 0.1 }, world)).toBe(true);
    expect(vanishes({ ...pair, stared: EYES.stareFor - 0.1 }, world)).toBe(false);
    expect(vanishes({ ...pair, distance: EYES.near - 1 }, world)).toBe(true);
    expect(vanishes({ ...pair, lit: 0.5 }, world)).toBe(true);
    expect(vanishes({ ...pair, age: 13 }, world)).toBe(true);
    expect(vanishes(pair, { calm: false, hidden: false })).toBe(true);
    expect(vanishes(pair, { calm: true, hidden: true })).toBe(true);
  });

  it('keep to the numbers: rise over a second and a half, hang 6 to 20 s, rest 30 to 90, blink 4 to 9 s apart for a fifth of a second, at a hound\'s height', () => {
    expect(risen(0)).toBe(0);
    expect(risen(EYES.fadeIn / 2)).toBeCloseTo(0.5, 9);
    expect(risen(99)).toBe(1);
    expect([lifeOf(0), lifeOf(1)]).toEqual([...EYES.life]);
    expect([restOf(0), restOf(1)]).toEqual([...EYES.rest]);
    expect([blinkIn(0), blinkIn(1)]).toEqual([...EYES.blinkEvery]);
    expect([heightOf(0), heightOf(1)]).toEqual([...EYES.height]);
    expect(shut(10, 10)).toBe(true);
    expect(shut(10 + EYES.blink + 0.01, 10)).toBe(false);
    expect(shut(9.9, 10)).toBe(false);
    expect(shut(10.05, 10, 0.1)).toBe(false); // the other eye shuts late
    expect(shut(10.15, 10, 0.1)).toBe(true);
  });
});

describe('eyes beyond the lantern: in the world', () => {
  const setup = (): { g: ReturnType<typeof createWorldGame>; scene: THREE.Scene; eyes: ReturnType<typeof createDarkEyes>; camera: THREE.PerspectiveCamera } => {
    const g = createWorldGame();
    g.overworld!.region = 'arkham';
    const scene = new THREE.Scene();
    const eyes = createDarkEyes(scene, g);
    const camera = new THREE.PerspectiveCamera(60, 16 / 9);
    const me = g.ecs.c.transform.get(g.player.id)!.pos;
    camera.position.set(me.x, me.y + 1.6, me.z);
    camera.updateMatrixWorld();
    let n = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => (((n = (n * 7 + 3) % 97) + 0.5) / 97) * 0.9);
    return { g, scene, eyes, camera };
  };
  const shown = (scene: THREE.Scene): number => ((scene.children[0] as THREE.Mesh).geometry as THREE.InstancedBufferGeometry).instanceCount;
  const run = (eyes: ReturnType<typeof createDarkEyes>, camera: THREE.Camera, from: number, seconds: number, each?: () => void): number => {
    let most = 0;
    for (let t = 0; t < seconds; t += 0.1) {
      each?.();
      eyes.update(camera, from + t, false);
      most = Math.max(most, eyes.out);
    }
    return most;
  };

  it('come out in the dark and never more than the allowed number of pairs, each of two eyes', () => {
    const { g, scene, eyes, camera } = setup();
    const most = run(eyes, camera, 100, 400);
    expect(most).toBeGreaterThan(0);
    expect(most).toBeLessThanOrEqual(pairsFor(g.mind.sanity));
    setSanity(g, 30);
    const frayed = run(eyes, camera, 600, 400);
    expect(frayed).toBeLessThanOrEqual(EYES.max + 1);
    eyes.force(30, 0.5);
    eyes.update(camera, 1100, false);
    expect(shown(scene)).toBeGreaterThanOrEqual(1);
    expect(shown(scene)).toBeLessThanOrEqual(2 * (EYES.max + 1));
  });

  it('never come where it is lit, and are gone when it is', () => {
    const { g, eyes, camera } = setup();
    g.lit = () => 1;
    expect(run(eyes, camera, 100, 400)).toBe(0);
  });

  it('are none in the hub, in a fight or a talk, or under a roof', () => {
    const a = setup();
    a.g.overworld!.region = 'hub';
    expect(run(a.eyes, a.camera, 100, 300)).toBe(0);
    const b = setup();
    b.g.player.listening = 1;
    expect(run(b.eyes, b.camera, 100, 300)).toBe(0);
    const c = setup();
    let i = 0;
    expect(run(c.eyes, c.camera, 100, 300, () => void i++)).toBeGreaterThan(0);
    const d = setup();
    let most = 0;
    for (let t = 0; t < 300; t += 0.1) {
      d.eyes.update(d.camera, 100 + t, true); // enclosed
      most = Math.max(most, d.eyes.out);
    }
    expect(most).toBe(0);
  });

  it('go at once when come near, and when looked at squarely', () => {
    const { scene, eyes, camera } = setup();
    eyes.update(camera, 99, false);
    const at = eyes.force(30, 0.6)!;
    eyes.update(camera, 100, false);
    expect(eyes.out).toBe(1);
    camera.position.set(at.x, at.y, at.z - 10); // within 16 m
    camera.updateMatrixWorld();
    for (let t = 0; t < 1; t += 0.1) eyes.update(camera, 101 + t, false);
    expect(eyes.out).toBe(0);
    expect(shown(scene)).toBe(0);
    const again = setup();
    again.eyes.update(again.camera, 99, false); // (the lens is read)
    again.eyes.force(30, 0); // dead ahead of the lens
    for (let t = 0; t < 2; t += 0.1) again.eyes.update(again.camera, 100 + t, false);
    expect(again.eyes.out).toBe(0);
  });
});
