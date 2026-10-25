import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { BEAM } from '../src/data/mistLight';
import { aimOf, createLampAim } from '../src/render/lampAim';
import { createPostPass } from '../src/render/postPass';
import { LAMP_SLOTS } from '../src/render/shaders/world';
import { POST_FRAG } from '../src/render/shaders/post';
import { createWorldLights, LIGHT_VIEW, type LightSpot } from '../src/render/worldLights';

const window_ = (x: number, z: number, nx: number, nz: number): LightSpot => ({ x, y: 2, z, kind: 'window', glass: { x: x - 0.52 * nx, y: 2, z: z - 0.52 * nz }, pane: 0.9 });

describe('where a light throws its glow in the mist (round 78)', () => {
  it('a lit window aims outward from its glass, a street lamp down, and every other light stays all round', () => {
    const a = aimOf(window_(5, 3, 0, 1));
    expect([a.x, a.y, a.z, a.w]).toEqual([0, 0, 1, BEAM.window.sharp]);
    const side = aimOf(window_(-4, 1, -1, 0));
    expect(side.x).toBeCloseTo(-1, 6);
    expect(side.w).toBe(BEAM.window.sharp);
    const turned = aimOf(window_(0, 0, Math.SQRT1_2, Math.SQRT1_2));
    expect(Math.hypot(turned.x, turned.z)).toBeCloseTo(1, 6);
    expect(aimOf({ x: 0, y: 3.5, z: 0, kind: 'lamp' }).toArray()).toEqual([0, -1, 0, BEAM.lamp.sharp]);
    for (const kind of ['torch', 'fire', 'sigil'] as const) expect(aimOf({ x: 0, y: 1, z: 0, kind }).w, kind).toBe(0);
    expect(aimOf({ x: 1, y: 2, z: 1, kind: 'window' }).w).toBe(0); // a window with no glass to aim from
  });

  it('is told to the fog slot by slot, from the lights the world chose, and let go at once when none is', () => {
    const post = createPostPass(new THREE.Texture());
    const aims = post.uniforms.uLampAim.value;
    expect(aims).toHaveLength(LAMP_SLOTS);
    const lights = createWorldLights();
    lights.add(1, [{ x: 6, y: 3.5, z: 0, kind: 'lamp' }, window_(2, 2, 0, 1), { x: 0, y: 0.5, z: -3, kind: 'fire' }]);
    lights.update(new THREE.Vector3(0, 1.7, 0), 0, null);
    const aim = createLampAim(post);
    aim.update(true);
    const kinds = LIGHT_VIEW.seen.map((n) => n.s.kind); // nearest first
    expect(kinds).toHaveLength(3);
    LIGHT_VIEW.seen.forEach((n, i) => expect(aims[i].toArray(), n.s.kind).toEqual(aimOf(n.s).toArray()));
    expect(aims.filter((a) => a.w > 0)).toHaveLength(2);
    aim.update(false); // under a roof every light is all round
    expect(aims.every((a) => a.w === 0)).toBe(true);
  });

  it('is read by the fog march: each lamp\'s glow is shaped by it, and the lantern\'s is not', () => {
    expect(POST_FRAG).toContain('uniform vec4 uLampAim[');
    expect(POST_FRAG).toContain('uLampColors[i] * uFogGlow, l.w, k, uLampAim[i]');
    expect(POST_FRAG).toContain('uLanternRange * 1.2, k, vec4(0.0))');
  });
});
