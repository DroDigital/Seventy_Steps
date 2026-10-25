import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { FX } from '../src/data/tuning';
import { createPostPass } from '../src/render/postPass';
import { createRealmLook } from '../src/render/realmLook';
import { gradeTints } from '../src/render/realmPalette';
import { SPRITE_FRAG } from '../src/render/shaders/sprite';
import { SPRITE_GRADE_GLSL } from '../src/render/shaders/spriteGrade';
import { worldUniforms } from '../src/render/worldMaterial';
import { LOOKS } from '../src/data/looks';

const tintsNow = (): number[][] => worldUniforms.uSpriteTints.value.map((v) => [v.x, v.y, v.z]);

describe('the drawn creatures take their realm\'s grade (round 83: render/shaders/spriteGrade.ts)', () => {
  it('is published for every realm: the four stops of its own gradient map, each at brightness 1', () => {
    const look = createRealmLook(createPostPass(new THREE.Texture()));
    const seen = new Set<string>();
    for (const id of Object.keys(LOOKS)) {
      look.update(0, id, false, undefined, true);
      const want = gradeTints(LOOKS[id]);
      tintsNow().forEach((t, i) => t.forEach((c, k) => expect(c, `${id} stop ${i}`).toBeCloseTo(want[i][k], 5)));
      seen.add(tintsNow().flat().map((c) => c.toFixed(3)).join());
    }
    expect(seen.size).toBe(Object.keys(LOOKS).length); // no two realms share one
  });

  it('is a share of the way to the realm, and the anomaly hues are kept as drawn', () => {
    expect(worldUniforms.uSpriteGrade.value).toBe(FX.spriteGrade);
    expect(FX.spriteGrade).toBeGreaterThan(0.4); // below this the sepia still shows in a cold realm
    expect(FX.spriteGrade).toBeLessThan(0.95); // above it every creature is the realm's one hue
    expect(SPRITE_GRADE_GLSL).toMatch(/vec3 spriteGraded\(vec3 c, vec4 tone\)/);
    expect(SPRITE_GRADE_GLSL).toMatch(/vec2 r = mix\(turned, own, keep\)/); // what is drawn in an anomaly hue is left alone
  });

  it('touches the recorded art only, after the light and before the mist; the self-lit marks and the Colour are left alone', () => {
    const src = SPRITE_FRAG.replace(/\s+/g, ' ');
    const at = (s: string): number => src.indexOf(s);
    expect(at('if (uReviewed > 0.5) col = spriteGraded(col, vTone)')).toBeGreaterThan(at('t.rgb * vLight'));
    expect(at('if (uReviewed > 0.5) col = spriteGraded(col, vTone)')).toBeLessThan(at('float fog = vFog * uFogAmount'));
    expect(at('if (vOutside > 0.5 && uReviewed < 0.5)')).toBeGreaterThan(at('spriteGraded(col, vTone)')); // the procedural atlas's colour out of space is not graded: it is not drawn there
  });
});
