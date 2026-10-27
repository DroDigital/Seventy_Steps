/**
 * The people met (round 83; render/personLife.ts, figureSway.ts, figureBlink.ts, npcFigures.ts): cloth and hats that take the breeze,
 * the pace and a turn; eyes that blink and, in the waning hour, close; a merchant who shows the rare wares they still hold; the realm's
 * snow on a hat. The people only: neither a creature nor the investigator. (The blob and the lantern's shadows: blobShadow.test.ts.)
 */
import * as THREE from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { FIGURE_LIFE, WARE_SHOWN } from '../src/data/fxTuning';
import { NPCS } from '../src/data/npcs';
import { blinkAt, lidAt } from '../src/render/figureBlink';
import { newHang, restAt, stepHang, type LooseKind, type SwayIn } from '../src/render/figureSway';
import { buildFigure } from '../src/render/figures';
import { npcFigure } from '../src/render/npcFigures';
import { livePerson, newLife, type Standing } from '../src/render/personLife';
import { WORLD_FRAG } from '../src/render/shaders/world';
import { worldUniforms } from '../src/render/worldMaterial';

const calm = (): SwayIn => ({ dt: 1 / 60, time: 0, phase: 0, fwd: 0, left: 0, walk: 0, turn: 0 });
const settle = (kind: LooseKind, i: Partial<SwayIn>, sign: 1 | -1 = 1, seconds = 4, dt = 1 / 60) => {
  const h = newHang();
  const input = { ...calm(), ...i, dt };
  for (let t = 0; t < seconds; t += dt) stepHang(h, kind, input, sign);
  return h;
};

describe('cloth and hats that take the breeze, the pace and a turn', () => {
  it('lean downwind and settle there: what hangs swings its bottom away from the wind, a hat its top toward it', () => {
    const K = FIGURE_LIFE.loose;
    const shawl = settle('shawl', { fwd: 1 });
    expect(shawl.pitch).toBeCloseTo(-K.shawl.wind, 2);
    const hat = settle('hat', { fwd: 1 }, -1);
    expect(hat.pitch).toBeCloseTo(K.hat.wind, 2);
    expect(settle('shawl', { left: 1 }).roll).toBeCloseTo(K.shawl.wind, 2);
    expect(settle('hat', { left: 1 }, -1).roll).toBeCloseTo(-K.hat.wind, 2);
  });

  it('trails behind a walker, and is flung the other way by a turn', () => {
    const K = FIGURE_LIFE.loose;
    expect(settle('scarf', { walk: 1 }).pitch).toBeCloseTo(K.scarf.walk, 2); // the bottom swings back
    expect(settle('scarf', { turn: 1 }).roll).toBeCloseTo(-K.scarf.turn, 2); // turning left, the end swings to the right
    expect(settle('hat', { turn: 1 }, -1).roll).toBeCloseTo(K.hat.turn, 2);
  });

  it('never leans past what it may, however hard the wind', () => {
    for (const kind of Object.keys(FIGURE_LIFE.loose) as LooseKind[]) {
      const most = FIGURE_LIFE.loose[kind].most;
      const h = settle(kind, { fwd: 50, left: -50, walk: 1, turn: 1 });
      expect(Math.abs(h.pitch), kind).toBeLessThanOrEqual(most * 1.2 + 1e-9);
      expect(Math.abs(h.roll), kind).toBeLessThanOrEqual(most * 1.2 + 1e-9);
    }
  });

  it('settles to the same rest at any frame rate, and in a dead calm only flutters', () => {
    const [slow, fast] = [settle('shawl', { fwd: 1 }, 1, 3, 1 / 20), settle('shawl', { fwd: 1 }, 1, 3, 1 / 144)];
    expect(Math.abs(slow.pitch - fast.pitch)).toBeLessThan(0.01);
    const h = newHang();
    let worst = 0;
    for (let t = 0; t < 10; t += 1 / 60) {
      stepHang(h, 'shawl', { ...calm(), time: t }, 1);
      worst = Math.max(worst, Math.abs(h.pitch), Math.abs(h.roll));
    }
    expect(worst).toBeLessThan(0.03);
    const rest = restAt('hat', calm(), -1);
    expect(rest.pitch).toBeCloseTo(0, 6);
  });
});

describe('a blink', () => {
  it('comes once in each cell of a few seconds, at an instant of its own for each person, and is shut for a fraction of a second', () => {
    const { cell, shut } = FIGURE_LIFE.blink;
    for (const seed of [1, 2, 3, 40]) {
      let [blinks, was, peak, closed] = [0, 0, 0, 0];
      const step = 0.01;
      for (let t = 0; t < 200; t += step) {
        const b = blinkAt(t, seed);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(1);
        if (b > 0.5 && was <= 0.5) blinks++;
        if (b > 0.5) closed += step;
        was = b;
        peak = Math.max(peak, b);
      }
      expect(blinks, `seed ${seed}`).toBeGreaterThanOrEqual(Math.floor(200 / cell) - 1);
      expect(blinks).toBeLessThanOrEqual(Math.ceil(200 / cell));
      expect(peak).toBeGreaterThan(0.95);
      expect(closed / blinks).toBeLessThan(shut); // shut for less than the length of a blink
    }
    const at = (seed: number): number => { let t = 0; while (blinkAt(t, seed) < 0.5) t += 0.01; return t; };
    expect(new Set([1, 2, 3, 4, 5, 6].map((s) => at(s).toFixed(2))).size).toBeGreaterThan(3); // no two alike
  });

  it('is held nearly shut by a doze, and wakes into the blinks', () => {
    expect(lidAt(0, 1)).toBeCloseTo(FIGURE_LIFE.blink.doze, 6);
    expect(lidAt(1, 1)).toBeCloseTo(FIGURE_LIFE.blink.doze, 6);
    expect(lidAt(0.8, 0)).toBeCloseTo(0.8, 6);
    expect(lidAt(0, 0)).toBe(0);
  });
});

describe('the people as figures', () => {
  it('have their hat, shawl, scarf and eyes on joints of their own, and the eyes where they were', () => {
    const hatted = NPCS.find((n) => ['fedora', 'bowler', 'cap', 'band'].includes(n.look.hat))!;
    const f = npcFigure(hatted.id);
    expect(f.loose?.hat?.group.parent).toBe(f.head);
    expect(f.loose?.hat?.group.position.y).toBeCloseTo(0.2, 6);
    expect(f.loose!.hat!.k).toBeGreaterThan(0);
    expect(f.loose?.eyes?.parent).toBe(f.head);
    const mesh = f.loose!.eyes!.children.find((c) => c instanceof THREE.Mesh) as THREE.Mesh;
    mesh.geometry.computeBoundingBox();
    const middle = mesh.geometry.boundingBox!.getCenter(new THREE.Vector3()); // (built about the eye line, so they sit where they always did)
    expect(Math.hypot(middle.x, middle.y, middle.z)).toBeLessThan(0.01);
    expect(f.loose!.eyes!.position.toArray()).toEqual([0, 0.15, 0.125]);
    expect(npcFigure('akeley').loose?.shawl).toBeDefined();
    expect(npcFigure('gilman').loose?.scarf).toBeDefined();
    expect(npcFigure('kuranes').loose?.scarf).toBeDefined(); // a robe's sash
    expect(npcFigure('peaslee').loose?.shawl).toBeUndefined();
  });

  it('are the people only: the investigator has none of it', () => {
    expect(buildFigure('player').loose).toBeUndefined();
  });

  it('take the realm\'s matter on what faces up, and the investigator does not', () => {
    expect(WORLD_FRAG).toMatch(/uCharacter > 0\.5 && uCharacter < 1\.5/);
    for (const m of npcFigure('akeley').materials) expect(m.uniforms.uCoatOn.value, 'a person').toBe(1);
    for (const m of buildFigure('player').materials) expect(m.uniforms.uCoatOn.value, 'the investigator').toBe(0);
  });

  it('show the rare wares a merchant still holds, and only a merchant', () => {
    const morgan = npcFigure('morgan');
    expect(Object.keys(morgan.loose?.wares ?? {}).sort()).toEqual(['star_stone', 'vial']);
    expect(npcFigure('curtis').loose?.wares).toBeUndefined(); // cartridges are not rare
    expect(npcFigure('peaslee').loose?.wares).toBeUndefined();
    expect(WARE_SHOWN.star_stone.glow).toBeGreaterThan(0);
  });
});

describe('livePerson', () => {
  const standing = (over: Partial<Standing> = {}): Standing => ({ id: 7, dt: 1 / 60, time: 5, speed: 0, y: 0, free: 1, me: null, sheltered: false, dozing: false, stock: () => 1, ...over });
  const wind = worldUniforms.uWind.value;
  const clock = worldUniforms.uTime.value;
  afterEach(() => { worldUniforms.uWind.value = wind; worldUniforms.uTime.value = clock; });

  it('lays the breeze on a shawl, which a roof takes away', () => {
    worldUniforms.uWind.value = FIGURE_LIFE.gale;
    worldUniforms.uTime.value = 5;
    const [out, under] = [npcFigure('akeley'), npcFigure('akeley')];
    const [a, b] = [newLife(), newLife()];
    for (let i = 0; i < 240; i++) {
      livePerson(out, a, standing());
      livePerson(under, b, standing({ sheltered: true }));
    }
    expect(Math.abs(out.loose!.shawl!.rotation.z) + Math.abs(out.loose!.shawl!.rotation.x)).toBeGreaterThan(0.1);
    expect(Math.abs(under.loose!.shawl!.rotation.z) + Math.abs(under.loose!.shawl!.rotation.x)).toBeLessThan(0.03);
  });

  it('adds to the swing of the coat\'s tails and does not accumulate it', () => {
    worldUniforms.uWind.value = FIGURE_LIFE.gale;
    const f = npcFigure('peaslee');
    expect(f.skirt.length).toBe(2);
    const life = newLife();
    const run = (): number[] => {
      for (const p of f.skirt) p.rotation.set(0.3, 0, 0); // (the pose gives the panels the swing of the thighs each frame)
      livePerson(f, life, standing());
      return f.skirt.map((p) => p.rotation.x);
    };
    for (let i = 0; i < 300; i++) run();
    const [x1, x2] = [run(), run()];
    expect(Math.abs(x1[0] - x2[0])).toBeLessThan(0.01);
    expect(Math.abs(x1[0] - 0.3)).toBeLessThan(FIGURE_LIFE.loose.tail.most * 1.2 + 1e-9);
  });

  it('blinks, and dozes shut', () => {
    const f = npcFigure('peaslee');
    const life = newLife();
    let [low, high] = [1, 0];
    for (let t = 0; t < 12; t += 1 / 60) {
      livePerson(f, life, standing({ time: t }));
      low = Math.min(low, f.loose!.eyes!.scale.y);
      high = Math.max(high, f.loose!.eyes!.scale.y);
    }
    expect(low).toBeLessThan(0.3);
    expect(high).toBe(1);
    for (let t = 12; t < 18; t += 1 / 60) livePerson(f, life, standing({ time: t, dozing: true }));
    expect(f.loose!.eyes!.scale.y).toBeLessThan(0.3);
    for (let t = 18; t < 24; t += 1 / 60) livePerson(f, life, standing({ time: t, dozing: true, free: 1, me: { x: 0, y: 0, z: 2 } })); // someone to look at: awake
    expect(life.gaze.weight).toBeGreaterThan(0.1);
  });

  it('shows a merchant\'s wares while any are left, and hides them when they are sold', () => {
    const f = npcFigure('morgan');
    const life = newLife();
    let left = 3;
    livePerson(f, life, standing({ stock: () => left }));
    expect(f.loose!.wares!.star_stone!.visible).toBe(true);
    left = 0;
    livePerson(f, life, standing({ stock: () => left }));
    expect(f.loose!.wares!.star_stone!.visible).toBe(false);
    expect(f.loose!.wares!.vial!.visible).toBe(false);
  });
});
