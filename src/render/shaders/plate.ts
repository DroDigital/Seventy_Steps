/**
 * A last plate over the finished picture (asked for as three concepts, off until one is chosen).
 * It reads the scene's own edges, the sky (depth written by nothing: sky.ts), and how far the
 * ground is, and lays one of three layers on the models, the sky, the mist and the pixel grid.
 * `uPlate` 1 silver (a hand-tinted print), 2 etch (a burin plate), 3 sheen (oil of the anomaly hues).
 */

export const PLATE_GLSL = /* glsl */ `
float plateSky(vec2 uv) {
  return step(0.9985, texture(tDepth, uv).x);
}

float plateKeep(vec3 col, float l) {
  vec3 hsv = rgb2hsv(col);
  float dye = smoothstep(0.14, 0.4, hsv.y) * smoothstep(0.06, 0.28, hsv.z);
  float lamp = smoothstep(0.06, 0.24, col.r - max(col.g, col.b)) * smoothstep(0.15, 0.5, l);
  return clamp(dye * 0.95 + lamp * 0.75, 0.0, 1.0);
}

vec3 silverPlate(vec3 col, vec2 uv, vec2 cell, float l, float edge, vec2 grad, float sky) {
  float y = pow(max(l, 0.0), 0.7);
  y = y * 0.82 + 0.045;
  vec3 split = mix(vec3(0.78, 0.80, 0.83), vec3(1.04, 0.86, 0.62), smoothstep(0.18, 0.72, y));
  vec3 silver = split * y;
  vec3 dyed = mix(silver, col, plateKeep(col, l));
  dyed += vec3(0.85, 0.78, 0.66) * clamp(-grad.x * 0.7 + grad.y * 0.45, -0.8, 0.8) * (1.0 - sky);
  float halo = 0.0;
  vec2 px = 1.0 / uRes;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.785;
    float r = i < 4 ? 2.5 : 5.5;
    halo += max(0.0, dot(texture(tScene, uv + vec2(cos(a), sin(a)) * px * r).rgb, LUMA) - 0.12);
  }
  dyed += vec3(1.0, 0.52, 0.16) * (halo / 8.0) * 1.35 * (1.0 - plateKeep(col, l));
  float grain = hash21(cell + vec2(floor(uTime * 4.0), 3.0)) - 0.5;
  dyed += grain * (0.065 + sky * 0.03) * smoothstep(0.04, 0.2, y);
  float corner = smoothstep(0.5, 1.1, length((uv - 0.5) * vec2(1.2, 0.92)));
  return dyed * (1.0 - corner * 0.22);
}

vec3 etchPlate(vec3 col, vec2 cell, float l, float edge, vec2 grad, float sky) {
  float y = pow(max(l, 0.0), 0.85) * 0.9 + 0.07;
  vec3 paper = vec3(y * 1.02, y * 0.93, y * 0.74);
  vec3 base = mix(mix(col, paper, 0.8), col, plateKeep(col, l) * 0.65);
  float h1 = step(0.86, fract((cell.x * 0.5 + cell.y) * 0.16));
  float h2 = step(0.9, fract((-cell.x * 0.42 + cell.y) * 0.19));
  float mass = (1.0 - smoothstep(0.015, 0.09, l)) * (1.0 - smoothstep(0.03, 0.1, edge));
  float hatch = max(sky * (h1 * 0.9 + h2 * 0.55), mass * h1 * 0.8);
  base = mix(base, vec3(0.03, 0.027, 0.024), hatch);
  float bite = smoothstep(0.04, 0.14, edge);
  base = mix(base, vec3(0.015, 0.013, 0.012), bite * (sky > 0.5 ? 0.25 : 0.95));
  base += vec3(0.9, 0.82, 0.64) * clamp(-grad.x * 0.65 + grad.y * 0.5, 0.0, 1.0) * (1.0 - sky) * (1.0 - bite) * 0.45;
  return base;
}

vec3 sheenPlate(vec3 col, vec2 uv, float l, float edge, vec2 grad, float sky, float air, float z) {
  float n1 = vnoise(uv * vec2(1.5, 1.05) + vec2(2.0, 0.6));
  float n2 = vnoise(uv * vec2(3.2, 2.4) + vec2(7.0, 1.4));
  float pick = fract(n1 * 2.1 + n2 * 1.4);
  vec3 pool = pick < 0.34 ? vec3(0.46, 0.03, 0.24) : pick < 0.67 ? vec3(0.16, 0.04, 0.36) : vec3(0.03, 0.30, 0.20);
  vec3 rim = pick < 0.34 ? vec3(0.86, 0.04, 0.40) : pick < 0.67 ? vec3(0.42, 0.08, 0.72) : vec3(0.12, 0.70, 0.42);
  float stain = (sky * 0.7 + air * (1.0 - sky) * 0.22) * (1.0 - smoothstep(0.16, 0.5, l));
  vec3 outc = mix(col, pool, stain);
  float fringe = smoothstep(0.08, 0.2, edge) * (1.0 - smoothstep(0.2, 0.48, l));
  outc = mix(outc, rim, fringe * mix(0.35, 0.9, smoothstep(1.5, 8.0, z)));
  float wet = smoothstep(0.045, 0.12, edge) * (1.0 - smoothstep(0.12, 0.28, edge)) * smoothstep(0.05, 0.3, l) * (1.0 - sky);
  outc += vec3(0.93, 0.9, 0.82) * wet * 0.22 * (1.0 - fringe);
  outc += vec3(0.12, 0.1, 0.08) * clamp(-grad.x + grad.y, -0.35, 0.35) * (1.0 - sky);
  return outc;
}

vec3 plateOf(vec3 col, vec2 uv, vec2 cell) {
  if (uPlate < 0.5) return col;
  vec2 o = 1.0 / uRes;
  float sx = dot(texture(tScene, uv + vec2(o.x, 0.0)).rgb, LUMA) - dot(texture(tScene, uv - vec2(o.x, 0.0)).rgb, LUMA);
  float sy = dot(texture(tScene, uv + vec2(0.0, o.y)).rgb, LUMA) - dot(texture(tScene, uv - vec2(0.0, o.y)).rgb, LUMA);
  vec2 grad = vec2(sx, sy);
  float edge = length(grad);
  float sky = plateSky(uv);
  float z = sky > 0.5 ? 90.0 : viewZ(uv, min(texture(tDepth, uv).x, 0.998));
  float air = max(sky, smoothstep(12.0, 42.0, z));
  float l = dot(col, LUMA);
  if (uPlate < 1.5) return silverPlate(col, uv, cell, l, edge, grad, sky);
  if (uPlate < 2.5) return etchPlate(col, cell, l, edge, grad, sky);
  return sheenPlate(col, uv, l, edge, grad, sky, air, z);
}
`;
