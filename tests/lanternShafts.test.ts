/**
 * Round 116, the lantern's shafts in the mist (shaders/fogLantern.ts): its glow is cut by its own depth map, marched only where the halo
 * is bright enough for a cut to show; and the post pass that does it stays within what every WebGL2 device gives a fragment shader.
 */
import { describe, expect, it } from 'vitest';
import { LOOKS } from '../src/data/looks';
import { LANTERN_SHAFT } from '../src/data/mistLight';
import { createPostPass } from '../src/render/postPass';
import { buildRealmPalette } from '../src/render/realmPalette';
import { FOG_LANTERN_GLSL } from '../src/render/shaders/fogLantern';
import { POST_FRAG } from '../src/render/shaders/post';
import { worldUniforms } from '../src/render/worldMaterial';

describe("the lantern's shafts in the mist (round 116)", () => {
  it('the halo is cut by the share of it the lantern reaches, read from its own map, only where it is bright enough to show', () => {
    expect(POST_FRAG).toContain('lanternShaft(uCamPos, dir, len, uLanternRange * 1.2, k, jitter)');
    expect(POST_FRAG).toContain('> LANTERN_SHAFT_LEAST');
    expect(FOG_LANTERN_GLSL).toContain('textureLod(uLShadowMap, uv, 0.0)');
    expect(FOG_LANTERN_GLSL).toContain('uLanternShaft.x <= 0.0 || uLShadow.x <= 0.0'); // (off with the shadows, at no cost)
    expect(FOG_LANTERN_GLSL).toContain('for (int i = 0; i < LANTERN_SHAFT_STEPS; i++)');
    expect(FOG_LANTERN_GLSL).not.toMatch(/\bhalf\b/); // (a word GLSL ES keeps for itself)
  });

  it("the post pass reads the world's own lantern map and its numbers, and is told how many taps to take", () => {
    const post = createPostPass({} as never);
    const u = post.uniforms;
    expect(u.uLShadowMap).toBe(worldUniforms.uLShadowMap);
    expect(u.uLShadowMat).toBe(worldUniforms.uLShadowMat);
    expect(u.uLShadowNF).toBe(worldUniforms.uLShadowNF);
    expect(u.uLShadow).toBe(worldUniforms.uLShadow);
    expect(u.uLanternShaft.value.x).toBe(LANTERN_SHAFT.gain);
    expect(u.uLanternShaft.value.y).toBe(LANTERN_SHAFT.floor);
    const mat = (post.scene.children[0] as unknown as { material: { defines: Record<string, unknown> } }).material;
    expect(mat.defines.LANTERN_SHAFT_STEPS).toBe(LANTERN_SHAFT.steps);
    expect(Number(mat.defines.LANTERN_SHAFT_LEAST)).toBeCloseTo(LANTERN_SHAFT.least, 6);
    expect(LANTERN_SHAFT.floor).toBeGreaterThan(0);
    expect(LANTERN_SHAFT.gain).toBeLessThanOrEqual(1);
  });

  it('the post pass holds no more uniform vectors and samplers than every WebGL2 device gives a fragment shader (224 and 16)', () => {
    const slots: Record<string, number> = { float: 1, int: 1, bool: 1, vec2: 1, vec3: 1, vec4: 1, ivec2: 1, mat3: 3, mat4: 4, sampler2D: 0 };
    const palette = Math.max(...Object.values(LOOKS).map((l) => buildRealmPalette(l).length));
    let [vectors, samplers] = [0, 0];
    for (const m of POST_FRAG.matchAll(/uniform\s+(\w+)\s+(\w+)(\[(\w+)\])?\s*;/g)) {
      const size = m[4] === undefined ? 1 : m[4] === 'PALETTE_SIZE' ? palette : Number(m[4]);
      expect(slots[m[1]], `${m[1]} ${m[2]}`).toBeDefined();
      expect(Number.isFinite(size), m[2]).toBe(true);
      vectors += slots[m[1]] * size;
      if (m[1] === 'sampler2D') samplers += size;
    }
    expect(vectors).toBeGreaterThan(150); // (the count found what is there)
    expect(vectors).toBeLessThanOrEqual(224);
    expect(samplers).toBeLessThanOrEqual(16);
  });
});
