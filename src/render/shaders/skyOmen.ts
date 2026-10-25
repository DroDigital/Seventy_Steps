/**
 * Round 80: the Alignment (render/skyOmen.ts), drawn in the night sky's shader (shaders/sky.ts): now and then a patch of the
 * stars stops crawling and settles into the game's own Elder Sign (ui/veil.ts: a stem with two pairs of branches and a twig at its
 * crown), nine stars joined by faint dotted lines. It is drawn by direction alone and does not wheel with the rest.
 */

export const OMEN_GLSL = /* glsl */ `
uniform float uOmen; // 0..1: how far the stars have settled into the figure
uniform vec3 uOmenAt; // toward its middle
uniform float uOmenSize; // its radius, radians

// the figure's nine stars, in shares of its radius (y up)
vec2 omenPt(int i) {
  if (i == 0) return vec2(0.0, -0.88);
  if (i == 1) return vec2(0.0, -0.29);
  if (i == 2) return vec2(0.0, 0.235);
  if (i == 3) return vec2(0.0, 0.82);
  if (i == 4) return vec2(-0.38, 0.075);
  if (i == 5) return vec2(0.38, 0.075);
  if (i == 6) return vec2(-0.39, 0.75);
  if (i == 7) return vec2(0.39, 0.75);
  return vec2(0.0, 1.08);
}
int omenFrom(int i) { return i == 0 ? 0 : i == 1 ? 1 : i == 2 ? 2 : i == 3 ? 3 : i == 4 ? 1 : i == 5 ? 1 : i == 6 ? 2 : 2; }
int omenTo(int i) { return i == 0 ? 1 : i == 1 ? 2 : i == 2 ? 3 : i == 3 ? 8 : i == 4 ? 4 : i == 5 ? 5 : i == 6 ? 6 : 7; }

// where the figure lies: its plane about the direction, and how far the pixel is inside it (x: its stars, y: its dotted lines, z: a hush for the stars about it)
vec3 omenLight(vec3 d) {
  vec3 o = normalize(uOmenAt);
  vec3 t1 = normalize(cross(o, vec3(0.0, 1.0, 0.0)));
  vec3 t2 = cross(t1, o);
  vec2 p = vec2(dot(d, t1), dot(d, t2)) / uOmenSize;
  float stars = 0.0;
  for (int i = 0; i < 9; i++) stars = max(stars, 1.0 - smoothstep(0.03, 0.085, length(p - omenPt(i))));
  float lines = 0.0;
  for (int i = 0; i < 8; i++) {
    vec2 a = omenPt(omenFrom(i));
    vec2 b = omenPt(omenTo(i));
    vec2 ba = b - a;
    float t = clamp(dot(p - a, ba) / dot(ba, ba), 0.0, 1.0);
    float dash = step(0.45, fract(t * length(ba) * 11.0));
    lines = max(lines, (1.0 - smoothstep(0.012, 0.034, length(p - (a + ba * t)))) * (0.35 + 0.65 * dash));
  }
  return vec3(stars, lines, 1.0 - smoothstep(0.85, 1.45, length(p)));
}
`;
