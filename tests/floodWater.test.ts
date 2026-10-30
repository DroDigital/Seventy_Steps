import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { REALITY } from '../src/data/tuning';
import { createFightViews } from '../src/render/fightViews';
import { createGame } from '../src/systems/game';

describe('the arena flood', () => {
  // A telegraph lies on the ground about half a metre under the flood's surface: an opaque sheet hid it, so the water is see-through.
  it('is see-through, so the marks on the ground beneath it still show', () => {
    const scene = new THREE.Scene();
    createFightViews(scene, createGame({ creature: 'father_dagon' }));
    const water = scene.getObjectByName('flood') as THREE.Mesh;
    const material = water.material as THREE.ShaderMaterial;
    expect(REALITY.floodOpacity).toBeLessThan(1);
    expect(material.uniforms.uOpacity!.value).toBe(REALITY.floodOpacity);
    expect(material.transparent).toBe(true);
    expect(material.depthWrite).toBe(false);
  });
});
