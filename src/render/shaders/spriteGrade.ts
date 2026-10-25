/**
 * The drawn creatures take their realm's grade (round 78). The older art is sepia whatever the realm,
 * and the post pass lets a character keep most of its own colours (FX.charShare), so a ghoul in the
 * cold of the Mountains of Madness stood in the colours of the Waking World. Here every pixel of a
 * reviewed sprite, once the light has fallen on it and before the mist, is pushed along the realm's own
 * gradient map by `uSpriteGrade`: it keeps its brightness (its drawn volume and its shading) and takes
 * the realm's colour at that brightness, as the post pass's `isolate` does the land. The anomaly hues
 * (the eyes, the markings, the Colour) are left as drawn. The sprite is changed on the way to the
 * screen only; no recording of it is touched. `gradeTint` mirrors realmPalette.ts and post.ts.
 */

export const SPRITE_GRADE_GLSL = /* glsl */ `
uniform vec3 uSpriteTints[4]; // the realm's grade: ink, shade, mid, high (render/realmLook.ts)
uniform float uSpriteGrade; // the share of it a creature takes (FX.spriteGrade)
uniform vec3 uSpriteHues; // the anomaly hues, and
uniform vec2 uSpriteHue; // their window and least saturation

float spriteHueNear(float h, float target) {
  float d = abs(h - target);
  d = min(d, 1.0 - d);
  return 1.0 - smoothstep(uSpriteHue.x * 0.5, uSpriteHue.x, d);
}

/** The hue (0..1), saturation and value of a colour. */
vec3 spriteHsv(vec3 c) {
  vec4 k = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, k.wz), vec4(c.gb, k.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + 1e-10)), d / (q.x + 1e-10), q.x);
}

/** The realm's colour at brightness l: a gradient map over four stops, each at brightness 1. */
vec3 spriteTint(float l) {
  vec3 t = mix(uSpriteTints[0], uSpriteTints[1], smoothstep(0.0, 0.08, l));
  t = mix(t, uSpriteTints[2], smoothstep(0.08, 0.35, l));
  return mix(t, uSpriteTints[3], smoothstep(0.35, 0.8, l));
}

/** A lit creature's colour given its realm's grade, its anomaly hues kept. */
vec3 spriteGraded(vec3 c) {
  vec3 hsv = spriteHsv(c);
  float near = max(max(spriteHueNear(hsv.x, uSpriteHues.x), spriteHueNear(hsv.x, uSpriteHues.y)), spriteHueNear(hsv.x, uSpriteHues.z));
  float keep = near * smoothstep(uSpriteHue.y, uSpriteHue.y + 0.15, hsv.y) * smoothstep(0.03, 0.1, hsv.z);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return mix(c, l * spriteTint(l), uSpriteGrade * (1.0 - keep));
}
`;
