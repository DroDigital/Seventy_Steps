/**
 * The drawn creatures take their realm's colours (round 78). The older art is sepia whatever the realm,
 * and the post pass lets a character keep most of its own colours (FX.charShare), so a ghoul in the
 * cold of the Mountains of Madness stood in the colours of the Waking World. Each reviewed form is now
 * recoloured for the realm it stands in, as a script would recolour it by hand: render/spriteTone.ts
 * measures the form's own tone against the realm's and gives its shader a turn of hue, a lift of colour
 * and, for a grey, a cast; here every pixel of the form, once the light has fallen on it and before the
 * mist, is turned the same way about the greys. What the form holds inside itself, its colours' order
 * and distances, its volume and shading, is kept whole, so no creature goes one dim colour (the first
 * versions turned each pixel to the realm's by itself, and they did); and the anomaly hues (the eyes, the
 * markings, the Colour) are left as drawn. The sprite is changed on the way to the screen only; no
 * recording of it is touched.
 */

export const SPRITE_GRADE_GLSL = /* glsl */ `
uniform vec3 uSpriteTints[4]; // the realm's grade: ink, shade, mid, high (render/realmLook.ts); its mid-tone is what a form's hue is turned toward
uniform vec2 uSpriteVivid; // how much more colour, and how much more light in its high lights, than it was drawn with (FX.spriteVivid)
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

const vec3 SPRITE_E1 = vec3(0.7071, -0.7071, 0.0); // the plane of colour, about the greys (render/spriteTone.ts)
const vec3 SPRITE_E2 = vec3(0.4082, 0.4082, -0.8165);

/** A colour's chroma in the plane about the greys (its hue is the angle, its strength the length). */
vec2 spriteChroma(vec3 c) {
  vec3 v = c - dot(c, vec3(1.0 / 3.0));
  return vec2(dot(v, SPRITE_E1), dot(v, SPRITE_E2));
}

/** A lit creature's colour recoloured to its realm, its anomaly hues kept. \`tone\` is its form's own (render/spriteTone.ts): the turn (cos, sin) that takes the form's hue toward the realm's, the lift of its colour and the realm's colour given to a grey, the same for every pixel of the form, so the form's own colours keep their order and their distances from one another and the form takes the realm's. Its brightness is the one it was drawn in (its volume and shading). */
vec3 spriteGraded(vec3 c, vec4 tone) {
  vec3 hsv = spriteHsv(c);
  float near = max(max(spriteHueNear(hsv.x, uSpriteHues.x), spriteHueNear(hsv.x, uSpriteHues.y)), spriteHueNear(hsv.x, uSpriteHues.z));
  float keep = near * smoothstep(uSpriteHue.y, uSpriteHue.y + 0.15, hsv.y) * smoothstep(0.03, 0.1, hsv.z);
  vec3 w = vec3(0.2126, 0.7152, 0.0722);
  float l = dot(c, w);
  vec2 own = spriteChroma(c);
  vec2 realm = spriteChroma(uSpriteTints[2]);
  vec2 turned = vec2(tone.x * own.x - tone.y * own.y, tone.y * own.x + tone.x * own.y) * tone.z + realm / max(length(realm), 1e-4) * tone.w * l;
  vec2 r = mix(turned, own, keep);
  vec3 g = c + (r.x - own.x) * SPRITE_E1 + (r.y - own.y) * SPRITE_E2; // its colour turned, its brightness the one it had...
  g += l - dot(g, w); // ...whatever the plane's two axes give to the luma
  float lg = dot(g, w);
  float open = 1.0 + uSpriteVivid.y * smoothstep(0.18, 0.7, lg); // its high lights opened up: the contrast between one creature and the next, and between them and the mist
  return max(vec3(0.0), lg * open + (g - lg) * uSpriteVivid.x * open);
}
`;
