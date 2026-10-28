import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { LIGHTING } from '../src/data/fxTuning';
import { portrayOn } from '../src/render/portray';
import { createPostPass } from '../src/render/postPass';
import { POST_FRAG } from '../src/render/shaders/post';

describe('the portrayal pass', () => {
  it('lights from the depth before the palette, and stays off when asked', () => {
    expect(portrayOn(null)).toBe(1);
    expect(portrayOn('0')).toBe(0);
    expect(portrayOn('off')).toBe(0);
    expect(POST_FRAG).toContain('uniform vec4 uPortray;');
    expect(POST_FRAG).toContain('nPaint');
    expect(POST_FRAG).not.toContain('bounce +=');
    expect(POST_FRAG).toContain('portray(');
    const i = POST_FRAG.indexOf('portray(vec3(a.r');
    expect(i).toBeGreaterThan(0);
    expect(i).toBeLessThan(POST_FRAG.indexOf('quantize(col, cell)'));
    const u = createPostPass(new THREE.Texture()).uniforms.uPortray.value;
    expect(u.x).toBe(LIGHTING.portray.form);
    expect(u.y).toBe(LIGHTING.portray.bounce);
    expect(u.z).toBe(LIGHTING.portray.glint);
    expect(u.w).toBe(LIGHTING.portray.reach);
  });
});
