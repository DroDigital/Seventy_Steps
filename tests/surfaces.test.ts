import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { MODEL_INFO } from '../src/data/models/index';
import { KIND, loadModels } from '../src/render/modelKit';
import { planeOf } from '../src/render/mirrorMath';
import type { PropMat } from '../src/render/propShapes';
import { setPieces } from '../src/render/setShapes';
import { SURFACE_APPLY, SURFACE_UNIFORMS } from '../src/render/shaders/surfaces';
import { WORLD_FRAG } from '../src/render/shaders/world';
import { createWorldMaterial } from '../src/render/worldMaterial';
import type { Prop, SetLook } from '../src/world/props';

beforeAll(loadModels);

const prop = (id: string, look: Partial<SetLook> = {}): Prop => ({ kind: 'set', x: 0, y: 0, z: 0, w: 1, d: 1, h: 1, yaw: 0, seed: 1, set: { id, scale: 1, ...look } });
const mats = (id: string, look: Partial<SetLook> = {}): Set<string> => new Set(setPieces(prop(id, look), [0.8, 0.8, 0.8]).map((p) => p.mat));

describe('what the models are made of (round 74: glass, liquid, a mirror, wax)', () => {
  it('keeps the four classes the renderer draws as their own materials', () => {
    expect([KIND.glass, KIND.liquid, KIND.mirror, KIND.wax]).toEqual([12, 13, 14, 15]);
  });

  it.each([
    ['mg_jar', ['glassware', 'liquid']], // a brain in its fluid, in the jar's glass
    ['mg_case', ['glassware']],
    ['ph_bottle', ['glassware', 'liquid']],
    ['lb_florence', ['glassware', 'liquid']],
    ['lb_round', ['glassware', 'liquid']],
    ['lb_reagent', ['glassware', 'liquid']],
    ['al_still', ['glassware']],
    ['uv_hourglass', ['glassware']],
    ['ph_mirror', ['mirror']],
    ['pd_candle_a', ['wax']],
    ['pd_candle_b', ['wax']],
  ])('%s is drawn in %j', (id, want) => {
    expect(MODEL_INFO[id], id).toBeTruthy();
    const got = mats(id);
    for (const m of want) expect(got.has(m), `${id}: ${m} in ${[...got]}`).toBe(true);
  });

  it('draws a wax figure\'s stone, cloth and wood as wax, and leaves its metal and flame as they are', () => {
    const plain = mats('rl_priest');
    const waxen = mats('rl_priest', { wax: true });
    expect(waxen.has('wax')).toBe(true);
    expect(plain.has('wax')).toBe(false);
    for (const m of plain) if (m === 'metal' || m === 'glow') expect(waxen.has(m)).toBe(true);
    for (const m of ['stone', 'cloth', 'wood', 'bone']) expect(waxen.has(m), m).toBe(false);
  });

  it('has a mirror whose glass is one flat panel that faces the front of the piece', () => {
    const glass = setPieces(prop('ph_mirror'), [0.8, 0.8, 0.8]).find((p) => p.mat === 'mirror')!;
    const s = planeOf(glass.geo)!;
    expect(s.nz).toBeGreaterThan(0.99); // toward +z, the way a hung piece faces its room
    const pos = glass.geo.getAttribute('position');
    const zs = Array.from({ length: pos.count }, (_, i) => pos.getZ(i));
    expect(Math.max(...zs) - Math.min(...zs)).toBeLessThan(0.02); // flat
    glass.geo.computeBoundingBox();
    const size = glass.geo.boundingBox!.getSize(new THREE.Vector3());
    expect(size.x).toBeGreaterThan(1.5); // most of the frame's face, not a corner of it
    expect(size.y).toBeGreaterThan(2.2);
  });

  it('holds each liquid inside its glass', () => {
    for (const id of ['mg_jar', 'lb_florence', 'lb_round', 'lb_reagent']) {
      const pieces = setPieces(prop(id), [0.8, 0.8, 0.8]);
      const box = (m: PropMat): THREE.Box3 => new THREE.Box3().setFromBufferAttribute(pieces.find((p) => p.mat === m)!.geo.getAttribute('position') as THREE.BufferAttribute);
      const [glass, liquid] = [box('glassware'), box('liquid')];
      expect(glass.clone().expandByScalar(0.001).containsBox(liquid), id).toBe(true);
      expect(liquid.max.y).toBeLessThan(glass.max.y); // it does not fill the neck
    }
  });
});

describe('the materials that draw them', () => {
  it('makes glass and liquid see-through, drawn on their front faces (a model bakes both sides of a shell), and the rest opaque', () => {
    for (const surface of ['glass', 'liquid'] as const) {
      const m = createWorldMaterial({ texture: 'cloth', vertexColors: true, opacity: 0.3, surface });
      expect(m.transparent, surface).toBe(true);
      expect(m.depthWrite).toBe(false);
      expect(m.side).toBe(THREE.FrontSide);
      expect(m.defines).toHaveProperty(`SURF_${surface.toUpperCase()}`);
    }
    for (const surface of ['wax', 'mirror'] as const) {
      const m = createWorldMaterial({ texture: 'cloth', vertexColors: true, surface });
      expect(m.transparent, surface).toBe(false);
      expect(m.defines).toHaveProperty(`SURF_${surface.toUpperCase()}`);
    }
  });

  it('puts each surface in the world shader, and the mirror\'s uniforms beside the rest', () => {
    for (const s of ['GLASS', 'LIQUID', 'WAX', 'MIRROR']) expect(SURFACE_APPLY, s).toContain(`#ifdef SURF_${s}`);
    expect(WORLD_FRAG).toContain('uMirrorMap');
    expect(WORLD_FRAG).toContain('float alpha = ');
    expect(WORLD_FRAG.indexOf(SURFACE_APPLY.trim().slice(0, 30))).toBeGreaterThan(WORLD_FRAG.indexOf('vec3 col = eldritch'));
    expect(SURFACE_UNIFORMS).toContain('uniform mat4 uMirrorMat');
  });

  it('balances every #ifdef in the surfaces', () => {
    const [open, close] = [(SURFACE_APPLY + SURFACE_UNIFORMS).match(/#ifdef/g)!.length, (SURFACE_APPLY + SURFACE_UNIFORMS).match(/#endif/g)!.length];
    expect(open).toBe(close);
  });
});
