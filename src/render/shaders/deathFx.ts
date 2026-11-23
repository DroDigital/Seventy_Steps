/**
 * A horror's own death in its picture (2026-11-23; data/bossDeaths.ts): the style numbers from DEATH_STYLE_BASE on, each a row of
 * four tables made from the data, so a death is told to the shader by the number it already reads (aFx.y) and no attribute is added
 * (the batches are at the GPU's most). A row is its order and motion, how far it moves and the share of its going its tint takes
 * first, the edge of what is left (lit of itself or by the light it stands in), what it turns to, and its side or corner or wind.
 * `deathSource` moves the texel a pixel shows by the motion; `deathKeep` turns it, drops it in its order, and lays the edge. Needs
 * `uAtlas`, `vCell`, `vFx`, `vSize`, `uTime`, `fxCell` and the noise (shaders/common.ts) before it.
 */

import { DEATHS, DEATH_KEYS, DEATH_MOTIONS, DEATH_ORDERS, DEATH_STYLE_BASE, type BossDeath } from '../../data/bossDeaths';

const f = (n: number): string => n.toFixed(4);
const v4 = (a: readonly number[]): string => `vec4(${a.map(f).join(', ')})`;
const rows = DEATH_KEYS.map((k) => DEATHS[k]);
const table = (type: string, name: string, row: (d: BossDeath) => string): string => {
  const list = rows.length ? rows.map(row) : [type === 'float' ? '0.0' : 'vec4(0.0)']; // (a build with no death of its own keeps one empty row)
  return `const ${type} ${name}[${list.length}] = ${type}[${list.length}](\n  ${list.join(',\n  ')}\n);`;
};

/** The motion's number, by name, for the shader's branches. */
const M = (name: (typeof DEATH_MOTIONS)[number]): string => f(DEATH_MOTIONS.indexOf(name) + 0.5);
const O = (name: (typeof DEATH_ORDERS)[number]): string => f(DEATH_ORDERS.indexOf(name) + 0.5);

export const DEATH_FX_GLSL = /* glsl */ `
${table('vec4', 'DEATH_BODY', (d) => v4([DEATH_ORDERS.indexOf(d.body.order), DEATH_MOTIONS.indexOf(d.body.motion), d.body.strength ?? 1, d.body.first ?? 0]))}
${table('vec4', 'DEATH_RIM', (d) => v4([...d.body.rim, d.body.lit ? 1 : 0]))}
${table('vec4', 'DEATH_TINT', (d) => v4([...(d.body.tint ?? [0, 0, 0]), d.body.tint ? (d.body.tintBy ?? 1) : 0]))}
${table('float', 'DEATH_DIR', (d) => f(d.body.dir ?? 0))}

int deathIndex() { return clamp(int(vFx.y + 0.5) - ${DEATH_STYLE_BASE}, 0, ${Math.max(1, rows.length) - 1}); }
/** How far through its going a body is once its tint has come: 0..1. */
float deathGoing(float s, vec4 body) { return clamp((s - body.w) / max(1.0 - body.w, 0.05), 0.0, 1.0); }
/** A corner of the frame by its number: 0 upper left, 1 upper right, 2 lower left, 3 lower right (y down). */
vec2 deathCorner(float n) { int c = int(n + 0.5); return vec2(c == 1 || c == 3 ? 1.0 : 0.0, c >= 2 ? 1.0 : 0.0); }
vec2 deathTexels() { return (vCell.zw - vCell.xy) * vec2(textureSize(uAtlas, 0)); }

/** The place in the frame whose texel the pixel at p shows, moved by the motion as the body goes (s: how far gone, 0..1). */
vec2 deathSource(vec2 p, float s0) {
  int k = deathIndex();
  vec4 body = DEATH_BODY[k];
  float s = deathGoing(s0, body);
  float a = s * body.z;
  float m = body.y;
  vec2 px = floor(p * deathTexels());
  float col = hash12(vec2(px.x, 7.0 + vFx.w));
  vec2 mid = vec2(0.5, 0.55);
  if (m < ${M('none')}) return p;
  if (m < ${M('fall')}) { p.y -= a * a * (0.18 + 0.7 * col); return p; }
  if (m < ${M('sink')}) { p.y = 1.0 - (1.0 - p.y) / max(1.0 - 0.78 * a, 0.06); return p; }
  if (m < ${M('scatter')}) return p + (vec2(hash12(floor(p * 11.0) + vFx.w), hash12(floor(p * 11.0) + 3.1)) - 0.5) * 0.08 * a;
  if (m < ${M('rise')}) { p.y += a * a * (0.25 + 0.75 * col); return p; }
  if (m < ${M('spiral')}) {
    vec2 d = p - mid;
    float turn = a * (2.4 + 3.0 * (1.0 - min(1.0, length(d) * 2.0)));
    d = mat2(cos(turn), sin(turn), -sin(turn), cos(turn)) * d;
    return mid + d / max(1.0 - 0.7 * a, 0.08);
  }
  if (m < ${M('shrink')}) return mid + (p - mid) / max(1.0 - 0.9 * a, 0.06);
  if (m < ${M('ripple')}) { p.x += sin(p.y * 24.0 + uTime * 9.0 + vFx.w * 7.0) * 0.045 * a; return p; }
  if (m < ${M('tatter')}) { p.x -= DEATH_DIR[k] * a * a * (0.12 + 0.88 * hash12(vec2(floor(px.y / 3.0), 11.0 + vFx.w))); return p; }
  if (m < ${M('spread')}) { p.y = 1.0 - (1.0 - p.y) / max(1.0 - 0.8 * a, 0.1); p.x = 0.5 + (p.x - 0.5) * (1.0 - 0.45 * a); return p; }
  if (m < ${M('fold')}) { vec2 c = deathCorner(DEATH_DIR[k]); return c + (p - c) / max(1.0 - 0.92 * a, 0.05); }
  if (m < ${M('narrow')}) { p.x = 0.5 + (p.x - 0.5) / max(1.0 - 0.95 * a, 0.04); return p; }
  if (m < ${M('drip')}) { p.y -= a * a * (0.08 + 0.55 * col) * (0.35 + 0.65 * p.y); return p; }
  if (m < ${M('boil')}) return p + (vec2(vnoise(p * 7.0 + uTime * 2.3), vnoise(p * 7.0 + 9.1 - uTime * 1.9)) - 0.5) * 0.09 * a * (1.0 - 0.5 * s);
  if (m < ${M('flicker')}) return p;
  if (m < ${M('diffuse')}) return mid + (p - mid) * (1.0 - 0.3 * a) + (vec2(hash12(px + 1.7), hash12(px + 5.3)) - 0.5) * 0.1 * a;
  vec2 hole = vec2(0.5, 1.0); // drain: drawn down into a hole under its middle
  return hole + (p - hole) / max(1.0 - 0.9 * a, 0.06);
}

/** When the texel at p goes, 0 (first) to 1 (last), by the order. */
float deathOrder(vec2 p, vec2 px, float h) {
  int k = deathIndex();
  float o = DEATH_BODY[k].x;
  if (o < ${O('top')}) return 0.78 * p.y + 0.22 * h; // (a sharper front than the plain crumble's: the head plainly first, or plainly last)
  if (o < ${O('feet')}) return 0.78 * (1.0 - p.y) + 0.22 * h;
  if (o < ${O('char')}) return 0.3 * h + 0.55 * vnoise(px * 0.16 + vFx.w * 9.0) + 0.15 * p.y;
  if (o < ${O('blocks')}) return hash12(floor(px / 3.0) + vFx.w * 5.0);
  float r = clamp(length((p - vec2(0.5, 0.55)) * vec2(1.0, 0.8)) / 0.6, 0.0, 1.0);
  if (o < ${O('centre')}) return 0.75 * r + 0.25 * h;
  if (o < ${O('rim')}) return 0.75 * (1.0 - r) + 0.25 * h;
  if (o < ${O('sweep')}) { float d = DEATH_DIR[k]; return 0.8 * clamp(dot(vec2(p.x - 0.5, 0.5 - p.y), vec2(cos(d), sin(d))) + 0.5, 0.0, 1.0) + 0.2 * h; }
  if (o < ${O('rows')}) return 0.75 * hash12(vec2(floor(px.y / 3.0), 3.0 + vFx.w * 13.0)) + 0.25 * h;
  if (o < ${O('cells')}) {
    vec2 q = p * vec2(6.0, 6.0 * vSize.y / max(vSize.x, 0.01));
    vec2 id = floor(q);
    vec2 inCell = fract(q) - 0.5 - (vec2(hash12(id + 2.3), hash12(id + 7.1)) - 0.5) * 0.4;
    return 0.7 * hash12(id + vFx.w * 3.0) + 0.3 * clamp(length(inCell) * 1.6, 0.0, 1.0);
  }
  if (o < ${O('corner')}) return 0.85 * clamp(length(p - deathCorner(DEATH_DIR[k])) / 1.2, 0.0, 1.0) + 0.15 * h;
  if (o < ${O('columns')}) return 0.75 * hash12(vec2(floor(px.x / 3.0), 5.0 + vFx.w * 17.0)) + 0.25 * h;
  if (o < ${O('lids')}) return 0.85 * (1.0 - abs(p.y - 0.5) * 2.0) + 0.15 * h;
  if (o < ${O('doors')}) return 0.85 * (1.0 - abs(p.x - 0.5) * 2.0) + 0.15 * h;
  return h; // even
}

/** False where the texel at uv is gone; what is left takes on its tint first, and at its edge the death's own (lit of itself, or by the light). */
bool deathKeep(vec2 uv, inout vec3 col, float s0) {
  int k = deathIndex();
  vec4 body = DEATH_BODY[k];
  vec4 tint = DEATH_TINT[k];
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float turned = tint.w * (body.w > 0.01 ? smoothstep(0.0, body.w, s0) : s0);
  col = mix(col, tint.rgb * clamp(lum * 1.5, 0.0, 1.1), turned); // (lit as it stood: a little paler than cloth for a pale matter, never a glow)
  float s = deathGoing(s0, body);
  if (s <= 0.0) return true;
  if (s >= 0.995) return false;
  if (body.y > ${M('boil')} && body.y < ${M('flicker')} && hash12(vec2(floor(uTime * 16.0), vFx.w * 31.0 + 3.0)) < 0.2 + 0.75 * s) return false; // it blinks out of sight, more often as it goes
  vec2 p = fxCell(uv);
  vec2 px = floor(p * deathTexels());
  float o = deathOrder(p, px, hash12(px + vFx.w * 17.0));
  if (o < s) return false;
  vec4 rim = DEATH_RIM[k];
  float edge = 1.0 - smoothstep(0.0, 0.08, o - s);
  float flick = 0.7 + 0.3 * hash12(floor(uv * 400.0) + floor(uTime * 14.0));
  vec3 lit = rim.w > 0.5 ? rim.rgb * (0.8 + 0.45 * flick) : rim.rgb * clamp(0.45 + 1.4 * lum, 0.0, 1.3);
  col = mix(col, lit, edge * (rim.w > 0.5 ? 1.0 : 0.75));
  return true;
}
`;
