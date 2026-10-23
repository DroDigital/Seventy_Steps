import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { LIGHTS } from '../src/data/tuning';
import { colliderShadowMesh } from '../src/render/colliderShadow';
import { clearOf, createLightSight, type Sighted } from '../src/render/lightSight';
import { setPiece } from '../src/world/arenaSet';
import { raycast, resolveCapsule, type Collider, type CollisionWorld } from '../src/world/colliders';
import { lanternModelFlame } from '../src/world/lanternModels';
import { propCollider } from '../src/world/props';

const world = (colliders: Collider[], streamed: boolean): CollisionWorld => ({
  colliders: streamed ? [] : colliders, near: streamed ? () => colliders : undefined,
  off: new Set(), ground: () => -100, contain: () => undefined,
});
const wall: Collider = { kind: 'box', min: { x: -3, y: -2, z: 2 }, max: { x: 3, y: 8, z: 2.5 } };

describe('lantern cages transmit light while retaining their movement colliders', () => {
  it.each([false, true])('does not hide the corrected flame behind its own coarse collider (streamed: %s)', (streamed) => {
    for (const id of ['lantern', 'lightpost']) for (const scale of [1, 1.3, 1.8]) {
      const p = setPiece({ of: id, size: scale, lit: 'torch' }, 0, 0, 0, 1.2, createRng(7))!;
      const collider = propCollider(p)!;
      expect(collider.lightPass).toBe(true);
      const flame = lanternModelFlame(p)!;
      const w = world([collider], streamed);
      for (const z of [-5, 5]) {
        const eye = { x: 0, y: 1.7, z };
        expect(clearOf(w, eye, flame, LIGHTS.sight.pull, LIGHTS.sight.lift)).toBe(true);
        expect(raycast(w, eye, flame)).toBeLessThan(1); // combat/ordinary visibility still hit the movement proxy
      }
      const pos = { x: 0, y: 0, z: 0 };
      resolveCapsule(w, pos, 0.2, 1.7);
      expect(Math.hypot(pos.x, pos.z)).toBeGreaterThan(0.2);
      expect(colliderShadowMesh([collider])).toBeNull(); // no sealed shadow volume around the lamp
      const shadow = colliderShadowMesh([collider, wall]);
      expect(shadow).not.toBeNull();
      shadow!.geometry.dispose();
      expect(clearOf(world([collider, wall], streamed), { x: 0, y: 1.7, z: 5 }, flame, LIGHTS.sight.pull, LIGHTS.sight.lift)).toBe(false);
    }
  });

  it('keeps a torch lantern lit in the world-light visibility update, but lets a wall put it out', () => {
    const p = setPiece({ of: 'lantern', size: 1.3, lit: 'torch' }, 0, 0, 0, 0, createRng(2))!;
    const collider = propCollider(p)!;
    const w = world([collider], false);
    const near: Sighted[] = [{ s: { ...lanternModelFlame(p)!, kind: 'torch' }, v: 0 }];
    const sight = createLightSight(() => w);
    const eye = { x: 0, y: 1.7, z: 5 };
    for (let i = 0; i <= 60; i++) sight.update(near, eye, i / 60);
    expect(near[0].v).toBe(1);
    w.colliders.push(wall);
    for (let i = 61; i <= 120; i++) sight.update(near, eye, i / 60);
    expect(near[0].v).toBe(0);
    delete p.set!.lit;
    expect(propCollider(p)!.lightPass).toBe(true); // an unlit cage remains open glass
  });
});
