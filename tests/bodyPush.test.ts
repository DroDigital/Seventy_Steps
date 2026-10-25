/**
 * The ground answers the body (round 80, render/bodyPush.ts, render/trample.ts, the world shader's SWAY block and footRings): the
 * investigator and the nearest three bodies awake part the grass; the unseen, the hidden, the dead, the hovering and the fx do not; a lane
 * stays laid down and rises again; a boot rings a puddle only in soaked weather. Nothing here writes the simulation.
 */
import { describe, expect, it } from 'vitest';
import type { Entity } from '../src/core/ecs';
import { BODY_PUSH, FOOT_RINGS, TRAMPLE } from '../src/data/groundSkin';
import { chooseBodies, createBodyPush, type Pushed } from '../src/render/bodyPush';
import { WORLD_FRAG, WORLD_VERT } from '../src/render/shaders/world';
import { Trample } from '../src/render/trample';
import { wetness } from '../src/render/wetness';
import { worldUniforms } from '../src/render/worldMaterial';
import type { Game } from '../src/systems/components';
import { createWorldGame } from '../src/systems/game';

const slots = (): Pushed[] => Array.from({ length: BODY_PUSH.slots }, () => ({ x: 0, y: 0, z: 0, r: 0 }));

/** A standing body of `radius` at (x, z). */
function body(g: Game, x: number, z: number, radius = 0.4): Entity {
  const id = g.ecs.spawn();
  g.ecs.c.body.set(id, { radius, height: 1.8, aimHeight: 1.2, fixed: false });
  g.ecs.c.transform.set(id, { pos: { x, y: 2, z }, prev: { x, y: 2, z }, yaw: 0, prevYaw: 0 });
  g.ecs.c.model.set(id, 'creature');
  return id;
}

function atPlayer(g: Game, x: number, z: number): void {
  const tr = g.ecs.c.transform.get(g.player.id)!;
  tr.pos = { x, y: 1, z };
  tr.prev = { ...tr.pos };
}

describe('the bodies that part the grass', () => {
  it('are the investigator first, then the nearest three awake within reach of the eye', () => {
    const g = createWorldGame();
    atPlayer(g, 100, 100);
    const near = [body(g, 102, 100), body(g, 104, 100), body(g, 101, 100), body(g, 107, 100), body(g, 110, 100)];
    const far = body(g, 100 + BODY_PUSH.reach + 5, 100);
    const out = slots();
    const n = chooseBodies(g, { x: 100, z: 100 }, 1, out);
    expect(n).toBe(BODY_PUSH.slots);
    expect(out[0]).toMatchObject({ x: 100, y: 1, z: 100, r: BODY_PUSH.foot });
    expect(out.slice(1).map((b) => b.x)).toEqual([101, 102, 104]); // the nearest, nearest first
    expect(near).toHaveLength(5);
    expect(out.every((b) => b.x < 100 + BODY_PUSH.reach)).toBe(true);
    expect(far).toBeGreaterThan(0);
  });

  it('leave out the unseen, the hidden, the dead, the hovering and the fx, and the body drawn between steps is where it is drawn', () => {
    const g = createWorldGame();
    atPlayer(g, 0, 0);
    const [unseen, hidden, dead, fx, flying, ok] = [1, 2, 3, 4, 5, 6].map((i) => body(g, i, 0));
    g.ecs.c.unseen.set(unseen, { revealed: 0 });
    g.ecs.c.brain.set(hidden, { state: 'hidden', def: { params: {} } } as never);
    g.ecs.c.dead.set(dead, { at: 0 } as never);
    g.ecs.c.model.set(fx, 'fx:flask');
    g.ecs.c.brain.set(flying, { state: 'idle', def: { params: { hover: 2 } } } as never);
    const tr = g.ecs.c.transform.get(ok)!;
    tr.prev = { x: 6, y: 2, z: 0 };
    tr.pos = { x: 8, y: 2, z: 0 };
    const out = slots();
    const n = chooseBodies(g, { x: 0, z: 0 }, 0.5, out);
    expect(n).toBe(2);
    expect(out[1].x).toBeCloseTo(7, 6);
  });

  it('give a rig the width of its horses, and no body more than the most or less than the least', () => {
    const g = createWorldGame();
    atPlayer(g, 0, 0);
    body(g, 3, 0, 9);
    body(g, 4, 0, 0.05);
    g.player.mount.active = 'horse' as never;
    const out = slots();
    chooseBodies(g, { x: 0, z: 0 }, 1, out);
    expect(out[0].r).toBe(BODY_PUSH.rig);
    expect(out[1].r).toBe(BODY_PUSH.most);
    expect(out[2].r).toBe(BODY_PUSH.least);
  });
});

describe('the uniforms it fills', () => {
  const eye = { x: 0, z: 0 };

  it('hold the bodies, with the empty slots far away and of no radius, and are emptied under a roof', () => {
    const g = createWorldGame();
    atPlayer(g, 20, 20);
    body(g, 21, 20);
    const push = createBodyPush(g);
    push.update({ x: 20, z: 20 }, 1, false, 1);
    const [a, b, c] = worldUniforms.uBodies.value;
    expect(a.x).toBe(20);
    expect(a.w).toBe(BODY_PUSH.foot);
    expect(b.x).toBe(21);
    expect(c.w).toBe(0);
    expect(c.y).toBeLessThan(-1000);
    expect(worldUniforms.uTrampleBox.value.w).toBe(TRAMPLE.size / 2);
    push.update({ x: 20, z: 20 }, 1.02, true, 1);
    expect(worldUniforms.uBodies.value.every((v) => v.w === 0 && v.y < -1000)).toBe(true);
    expect(worldUniforms.uTrampleBox.value.w).toBe(0);
  });

  it('lay a ring a stride on in soaked weather, and none in dry, standing still, or after a leap', () => {
    const g = createWorldGame();
    atPlayer(g, 0, 0);
    const push = createBodyPush(g);
    const rings = (): number => worldUniforms.uStep.value.filter((s) => s.w > 0).length;
    let t = 0;
    const walk = (metres: number, seconds: number): void => {
      const tr = g.ecs.c.transform.get(g.player.id)!;
      for (let i = 0; i < seconds * 60; i++) {
        tr.prev = { ...tr.pos };
        tr.pos = { ...tr.pos, x: tr.pos.x + metres / (seconds * 60) };
        push.update(eye, (t += 1 / 60), false, 1);
      }
    };
    wetness.value = 0;
    push.update(eye, (t += 1 / 60), false, 1);
    walk(9, 6);
    expect(rings()).toBe(0); // dry
    wetness.value = 1;
    walk(0.001, 2); // standing
    expect(rings()).toBe(0);
    walk(9.5, 6);
    expect(rings()).toBe(FOOT_RINGS.slots); // about ten strides: the slots are all in use, round the ring
    const first = worldUniforms.uStep.value.map((s) => s.z);
    expect(Math.max(...first) - Math.min(...first)).toBeLessThan(FOOT_RINGS.slots * 1.2); // and each a stride apart in time
    const tr = g.ecs.c.transform.get(g.player.id)!;
    const stamped = worldUniforms.uStep.value.map((s) => s.z).join();
    tr.pos = { ...tr.pos, x: tr.pos.x + 500 }; // a leap
    push.update(eye, (t += 1 / 60), false, 1);
    expect(worldUniforms.uStep.value.map((s) => s.z).join()).not.toBe(stamped);
    expect(rings()).toBe(0);
    wetness.value = 0;
  });
});

describe('the lane laid down', () => {
  it('is stamped where a body is, rises again over its hold, and is cleared in the cells that come into the window', () => {
    const t = new Trample();
    t.recentre(0, 0);
    t.stamp(0, 0, 0.8);
    expect(t.at(0, 0)).toBe(1);
    expect(t.at(0.6, 0)).toBeGreaterThan(0);
    expect(t.at(3, 0)).toBe(0);
    t.decay(TRAMPLE.hold / 2);
    expect(t.at(0, 0)).toBeCloseTo(0.5, 5);
    t.decay(TRAMPLE.hold);
    expect(t.at(0, 0)).toBe(0);
    t.stamp(0, 0, 0.8);
    t.recentre(TRAMPLE.cell * 12, 0); // walked 12 cells on: the lane behind is still there...
    expect(t.at(0, 0)).toBe(1);
    t.recentre(TRAMPLE.cell * (12 + TRAMPLE.size - 6), 0); // ...and far on, where it aliases with the cells that came in, it is not
    t.stamp(TRAMPLE.cell * (12 + TRAMPLE.size - 6), 0, 0.8);
    expect(t.at(TRAMPLE.cell * (12 + TRAMPLE.size - 6), 0)).toBe(1);
    expect(t.at(0, 0)).toBe(0);
    t.recentre(1e5, 1e5); // a journey: nothing of it is kept
    expect(t.at(TRAMPLE.cell * (12 + TRAMPLE.size - 6), 0)).toBe(0);
    t.stamp(1e5, 1e5, 1);
    t.upload();
    expect(t.bytes.some((b) => b === 255)).toBe(true);
    t.clear();
    t.upload();
    expect(t.bytes.every((b) => b === 0)).toBe(true);
  });
});

describe('the shaders', () => {
  it('part the grass in the sway block only, below the head, and leave the wet-ground lines the tests pin', () => {
    const sway = WORLD_VERT.slice(WORLD_VERT.indexOf('#ifdef SWAY'));
    expect(sway).toContain('uBodies');
    expect(sway).toContain('uTrample');
    expect(sway).toMatch(/smoothstep\(0\.9, 1\.7, wp\.y - b\.y\)/);
    expect(WORLD_VERT.slice(0, WORLD_VERT.indexOf('#ifdef SWAY'))).not.toContain('uBodies');
    expect(WORLD_FRAG).toMatch(/uWet > 0\.01 && uEmissive < 0\.5 && uCharacter < 0\.5/);
    expect(WORLD_FRAG).toContain('smoothstep(0.86, 0.97, n.y)');
    expect(WORLD_FRAG).toContain('footRings(vWorld.xz) * pud');
  });
});
