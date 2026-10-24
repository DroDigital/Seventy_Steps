/**
 * The skies of the Outer Dark (round 73; data/cosmos.ts says which hangs where): the GLSL that shaders/sky.ts takes in. Each feature is a function of the direction alone, so
 * it is the same from every place in its dimension and costs the sphere nothing but its own pixels, and each is scaled by its uniform, which render/sky.ts eases as a gate is
 * crossed. Gas behind the stars; a wall of storm on the horizon; black limbs and eyes overhead; a lattice of facets; a staff, its notes and rings; iridescent globes; a black
 * hole and its ring of fire. Where a feature draws a colour it keeps it pale or dim, so the post pass's 64 colours take it whole and no anomaly hue is made by accident. Render only.
 */

export const COSMOS_GLSL = /* glsl */ `
uniform float uNebula;
uniform vec3 uNebA;
uniform vec3 uNebB;
uniform float uStorm;
uniform float uCanopy;
uniform float uLattice;
uniform float uStaff;
uniform float uOrbs;
uniform float uHole;
uniform vec3 uAuroraTint;

// A circle of direction about the vertical, for noise that has no seam at the back of the sky.
vec2 around(vec3 d) { return normalize(d.xz + 1e-4); }

// Gas: two layers of slow noise folded over each other, in two colours, brightest where they agree.
vec3 nebula(vec3 d, float t) {
  vec2 p = vec2(d.x * 2.2 + d.y * 1.4, d.z * 2.2 - d.y * 1.9);
  float a = fbm(p * 1.1 + vec2(t * 0.004, 0.0));
  float b = fbm(p * 2.3 + 11.0 - vec2(0.0, t * 0.006) + a * 1.4);
  float dens = smoothstep(0.36, 0.86, a * 0.6 + b * 0.55);
  return mix(uNebA, uNebB, smoothstep(0.3, 0.8, b)) * dens * dens;
}

// A wall of storm along the horizon with a light inside it, the cloud-sea's edge, and sheet lightning in a place now and then.
vec3 storm(vec3 d, float t, vec3 col) {
  vec2 c = around(d);
  float n = fbm(c * 2.6 + 3.0);
  float top = 0.05 + 0.34 * n * n;
  float body = 1.0 - smoothstep(top - 0.025, top + 0.004, d.y);
  float inner = fbm(c * 5.5 + vec2(d.y * 8.0, t * 0.05));
  float turn = floor(t / 2.9);
  float phase = fract(t / 2.9);
  float az = hash(vec3(turn, 5.0, 8.0)) * 6.2832;
  float where = exp(-pow(length(c - vec2(cos(az), sin(az))) / 0.7, 2.0));
  float flash = exp(-phase * 6.0) * step(0.3, hash(vec3(turn, 2.0, 3.0))) * where;
  vec3 gold = vec3(1.0, 0.82, 0.48);
  vec3 wall = mix(vec3(0.05, 0.045, 0.09), gold * 0.34, smoothstep(0.35, 0.85, inner) * (0.4 + 0.6 * smoothstep(0.0, top, d.y)));
  wall += gold * flash * (0.5 + 0.9 * inner);
  float rim = exp(-pow((d.y - top) / 0.02, 2.0)) * 0.5; // the top of the wall caught by the moon
  return mix(col, wall + gold * rim * n, body);
}

// A canopy: limbs of a black wood drawn across the vault as ridged noise, leaf between them, and here and there an eye that opens and shuts.
vec3 canopy(vec3 d, float t, vec3 col) {
  float up = smoothstep(0.1, 0.55, d.y);
  vec2 p = d.xz / (d.y + 0.4) * 1.5;
  float warp = fbm(p * 0.8 + t * 0.003);
  float limb = pow(1.0 - abs(2.0 * fbm(p * 1.2 + warp * 1.6) - 1.0), 5.0);
  float leaf = smoothstep(0.35, 0.75, fbm(p * 3.6 + 7.0 - warp));
  float cover = smoothstep(0.3, 0.62, limb * 1.35 + leaf * 0.5) * up; // crisp, so a limb reads as a limb
  vec3 dark = vec3(0.012, 0.004, 0.006);
  float lit = 0.35 + 0.65 * fbm(p * 0.7 + 3.0 + warp); // the red of the sky between the limbs, thickest where the leaf is thin
  vec3 back = col + vec3(0.5, 0.11, 0.07) * lit * up;
  vec3 c = mix(back, dark, cover * 0.96);
  vec2 cell = floor(p * 2.4);
  float h = hash(vec3(cell, 4.0));
  vec2 inCell = (fract(p * 2.4) - 0.5) * vec2(0.55, 1.0); // a slit, wider than it is tall
  float open = smoothstep(0.45, 0.75, 0.5 + 0.5 * sin(t * (0.5 + h) + h * 40.0));
  float eye = step(0.9, h) * (1.0 - smoothstep(0.05, 0.12, length(inCell))) * open * up;
  c += vec3(1.0, 0.5, 0.22) * eye * (0.9 + 0.6 * cover);
  return c;
}

// A lattice: the vault tiled in triangles that shrink toward the horizon, each its own pale tone, their edges thin lines of light. Time does not pass between them.
vec3 lattice(vec3 d, float t, vec3 col) {
  vec2 p = d.xz / (d.y + 0.22) * 1.25;
  vec2 q = vec2(p.x + p.y * 0.57735, p.y * 1.1547);
  vec2 id = floor(q);
  vec2 f = fract(q);
  float low = step(f.x + f.y, 1.0);
  float k = hash(vec3(id, low));
  float edge = low > 0.5 ? min(min(f.x, f.y), 1.0 - f.x - f.y) : min(min(1.0 - f.x, 1.0 - f.y), f.x + f.y - 1.0);
  float line = 1.0 - smoothstep(0.0, 0.04, edge);
  vec3 facet = mix(vec3(0.5, 0.48, 0.62), vec3(0.95, 0.94, 1.0), k) * (0.1 + 0.1 * k + 0.04 * sin(t * 0.04 + k * 30.0));
  float band = smoothstep(0.04, 0.3, d.y);
  return col + (facet + vec3(0.85, 0.88, 1.0) * line * 0.22) * band;
}

// A staff: five thin lines across the dark, a note on them every twelfth of the way round that is lit in its turn, and rings of sound going out from a point of the sky.
vec3 staff(vec3 d, float t, vec3 col) {
  float lines = 0.0;
  for (int i = 0; i < 5; i++) lines += 1.0 - smoothstep(0.0, 0.0045, abs(d.y - (0.16 + 0.07 * float(i))));
  float az = atan(d.x, d.z);
  float cell = floor(az / 0.5236);
  float slot = fract(az / 0.5236) - 0.5;
  float pitch = floor(hash(vec3(cell, 3.0, 1.0)) * 9.0);
  float note = 1.0 - smoothstep(0.016, 0.026, length(vec2(slot * 0.5236 * 0.8, d.y - (0.12 + 0.035 * pitch))));
  float beat = 0.5 + 0.5 * sin(t * 1.1 - cell * 0.9);
  vec3 c = col + vec3(0.7, 0.75, 0.5) * (lines * 0.3 + note * (0.4 + 0.9 * beat));
  vec3 centre = normalize(vec3(0.0, 0.45, 1.0));
  float a = acos(clamp(dot(d, centre), -1.0, 1.0));
  float ring = smoothstep(0.9, 1.0, 0.5 + 0.5 * sin(a * 52.0 - t * 2.2)) * exp(-a * 1.6) * (0.5 + 0.5 * sin(t * 1.1));
  return c + vec3(0.62, 0.66, 0.42) * ring * 0.22;
}

// Globes: nine of them, slow in their orbits, each a clear sphere with a film on it that runs through the colours of oil.
vec3 orbs(vec3 d, float t, vec3 col) {
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    float h1 = hash(vec3(fi, 1.3, 7.1));
    float h2 = hash(vec3(fi, 4.7, 2.9));
    float h3 = hash(vec3(fi, 9.1, 5.3));
    float az = fi * 0.7 + h1 * 6.0 + t * (0.004 + 0.01 * h2);
    float el = 0.14 + 0.7 * h2 + 0.03 * sin(t * 0.07 + fi);
    vec3 c = normalize(vec3(sin(az) * cos(el), sin(el), cos(az) * cos(el)));
    float r = 0.035 + 0.15 * h3 * h3;
    float a = acos(clamp(dot(d, c), -1.0, 1.0));
    col += vec3(0.5, 0.62, 0.7) * exp(-a / (r * 1.6)) * 0.07; // a glow about it
    if (a < r) {
      vec3 t1 = normalize(cross(c, vec3(0.0, 1.0, 0.0)));
      vec3 t2 = cross(t1, c);
      vec2 q = vec2(dot(d, t1), dot(d, t2)) / r;
      float z = sqrt(max(1.0 - dot(q, q), 0.0));
      vec3 n = vec3(q, z);
      float film = fract(dot(n, vec3(1.7, 2.3, 1.1)) + t * 0.03 + h1);
      vec3 irid = 0.62 + 0.2 * cos(6.2832 * (film + vec3(0.0, 0.33, 0.67)));
      float rim = pow(1.0 - z, 2.4);
      vec3 body = mix(col * 0.55 + vec3(0.03, 0.05, 0.07), irid * 0.8, 0.28 + 0.72 * rim);
      body += vec3(0.95) * pow(max(dot(n, normalize(vec3(-0.4, 0.6, 0.7))), 0.0), 22.0) * 0.5;
      col = mix(col, body, 1.0 - smoothstep(r * 0.94, r, a));
    }
  }
  return col;
}

// The black centre: a shadow with a ring of white fire at its rim, a disc of it drawn out to a slant and red at its far edge, a halo, and two jets. It sits low over the north.
vec3 hole(vec3 d, float t, vec3 col) {
  vec3 c = normalize(vec3(-0.18, 0.3, 1.0));
  float a = acos(clamp(dot(d, c), -1.0, 1.0));
  if (a > 0.8) return col;
  vec3 t1 = normalize(cross(c, vec3(0.0, 1.0, 0.0)));
  vec3 t2 = cross(t1, c);
  vec2 q = vec2(dot(d, t1), dot(d, t2));
  float rs = 0.085;
  float slant = length(vec2(q.x, q.y * 4.2));
  float turb = 0.7 + 0.6 * fbm(vec2(atan(q.y * 4.2, q.x) * 4.0 + t * 0.5, slant * 70.0));
  float disc = smoothstep(rs * 1.2, rs * 1.6, slant) * (1.0 - smoothstep(rs * 3.0, rs * 4.8, slant)) * (0.55 + 0.9 * smoothstep(-1.0, 1.0, -q.x / max(slant, 0.001))) * turb;
  vec3 heat = mix(vec3(1.0, 0.95, 0.9), vec3(1.0, 0.3, 0.16), smoothstep(rs * 1.5, rs * 4.2, slant));
  float photon = exp(-pow((a - rs * 1.1) / 0.0055, 2.0));
  float arc = exp(-pow((a - rs * 1.45) / 0.02, 2.0)) * smoothstep(-0.2, 0.7, q.y / max(a, 0.001)); // the far side of the disc, bent over the top
  float halo = exp(-a * 4.5);
  float jet = exp(-pow(q.x / 0.014, 2.0)) * exp(-abs(q.y) * 2.4) * step(rs, abs(q.y));
  col += vec3(1.0, 0.36, 0.26) * halo * 0.42 + heat * disc * 1.6 + vec3(1.0, 0.97, 0.95) * (photon * 2.4 + arc * 0.9) + vec3(0.86, 0.88, 1.0) * jet * 0.7;
  return col * smoothstep(rs * 0.96, rs, a);
}
`;
