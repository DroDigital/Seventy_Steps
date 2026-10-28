import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { plateFrom } from '../src/data/plates';
import { createPostPass } from '../src/render/postPass';
import { POST_FRAG } from '../src/render/shaders/post';

describe('the three plates over the picture', () => {
  it('names silver, etch and sheen, and leaves the picture alone otherwise', () => {
    expect(plateFrom(null)).toBe(0);
    expect(plateFrom('silver')).toBe(1);
    expect(plateFrom('1')).toBe(1);
    expect(plateFrom('etch')).toBe(2);
    expect(plateFrom('sheen')).toBe(3);
    expect(plateFrom('nope')).toBe(0);
    expect(POST_FRAG).toContain('uniform float uPlate;');
    expect(POST_FRAG).toContain('plateOf(');
    expect(createPostPass(new THREE.Texture()).uniforms.uPlate.value).toBe(0);
  });
});
