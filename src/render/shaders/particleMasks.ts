/**
 * The particles' shapes (render/particles.ts), as GLSL: `float mask(vec2 q, int shape, float thick)`, q in -1..1 across the sprite, its coverage 0..1
 * (the batch dithers it, so a thin or dim shape is a sparser one, never a blur). `shapeDefines` gives each name of PARTICLE_SHAPES its index as
 * `SH_<NAME>`, so no number here can drift from the list. Round 51 drew the first thirteen, round 79 the puff (a free smoke sprite of
 * data/flameAtlas.ts); round 87 (the quiet blows, data/foeBlows.ts) the crescent, lash, cross, dash and arc, drawn here, and the 'mark' and 'trace'
 * that take one of six masks of data/markAtlas.ts (`uMarks`, one row of N cells; `thick` chooses it). Local +x of the aligned shapes (streak,
 * crescent, lash, dash, trace) is the way the particle flies, set in the vertex shader. Sprites must stay readable at 20 to 60 pixels: no
 * stroke has a half-width under about 0.05 where it is meant to be seen, and a taper to a point is the one place it may.
 */

import { FLAME_ATLAS, PUFF_CELLS } from '../../data/flameAtlas';
import { MARK_ATLAS } from '../../data/markAtlas';

/** `#define SH_DISC 0` and so on, one for each shape in order. */
export const shapeDefines = (shapes: readonly string[]): string => shapes.map((n, i) => `#define SH_${n.toUpperCase()} ${i}`).join('\n');

const OLD_SHAPES = /* glsl */ `
float oldMask(vec2 q, int shape, float thick) {
  float r = length(q);
  if (shape == SH_SHARD) return 1.0 - smoothstep(0.5, 1.0, abs(q.x) + abs(q.y)); // a diamond shard
  if (shape == SH_STREAK) { // a streak: thin and faint at its tail, bright and full at its head
    float t = q.x * 0.5 + 0.5;
    float half_ = mix(0.1, 0.5, t);
    return (1.0 - smoothstep(half_ * 0.55, half_, abs(q.y))) * smoothstep(0.0, 0.55, t) * (1.0 - smoothstep(0.93, 1.0, t));
  }
  if (shape == SH_RING) { // a ring
    float th = max(thick, 0.04);
    return 1.0 - smoothstep(th * 0.45, th, abs(r - (1.0 - th)));
  }
  if (shape == SH_SPARK) return 1.0 - smoothstep(0.55, 1.0, sqrt(abs(q.x)) + sqrt(abs(q.y))); // a four-point spark
  if (shape == SH_WISP) return exp(-3.2 * dot(q, q)); // a soft wisp
  if (shape == SH_RUNE) { // a rune: a ring, a stave and a chevron through it
    float ring = 1.0 - smoothstep(0.07, 0.13, abs(r - 0.8));
    float stave = (1.0 - smoothstep(0.06, 0.11, abs(q.x))) * step(abs(q.y), 0.62);
    float chev = (1.0 - smoothstep(0.05, 0.1, abs(q.y - 0.18 - abs(q.x) * 0.7))) * step(abs(q.x), 0.48);
    return max(ring, max(stave, chev));
  }
  if (shape == SH_EYE) { // an eye: an almond with a slit for its pupil
    float w = 0.52 * (1.0 - q.x * q.x);
    float almond = 1.0 - smoothstep(w * 0.7, w + 0.001, abs(q.y));
    float slit = (1.0 - smoothstep(0.05, 0.1, abs(q.x))) * step(abs(q.y), w * 0.85);
    return almond * (1.0 - slit) * step(abs(q.x), 0.98);
  }
  if (shape == SH_FANG) { // a fang, a claw's crescent
    float outer = 1.0 - smoothstep(0.82, 0.95, r);
    float inner = 1.0 - smoothstep(0.7, 0.82, length(q - vec2(0.32, 0.26)));
    return outer * (1.0 - inner);
  }
  if (shape == SH_BUBBLE) { // a bubble: a thin skin, a faint body and a bright fleck of light
    float skin = 1.0 - smoothstep(0.05, 0.12, abs(r - 0.84));
    float fleck = exp(-34.0 * dot(q - vec2(-0.34, 0.36), q - vec2(-0.34, 0.36)));
    return max(max(skin, fleck), 0.18 * (1.0 - smoothstep(0.7, 0.86, r)));
  }
  if (shape == SH_BOLT) { // a forked bolt along its length
    float zig = (abs(fract(q.x * 1.75 + 0.25) - 0.5) * 2.0 - 0.5) * 0.42;
    float fork = (1.0 - smoothstep(0.04, 0.09, abs(q.y + zig * 0.6 + (q.x - 0.15) * 0.55))) * step(0.15, q.x);
    return max(1.0 - smoothstep(0.05, 0.11, abs(q.y - zig)), fork * 0.8) * (1.0 - smoothstep(0.82, 1.0, abs(q.x)));
  }
  if (shape == SH_FEATHER) { // a feather: a vane parted by its shaft, its barbs in stripes
    float w = 0.34 * (1.0 - q.x * q.x);
    float vane = (1.0 - smoothstep(w * 0.6, w + 0.001, abs(q.y))) * smoothstep(0.015, 0.05, abs(q.y));
    return vane * (0.72 + 0.28 * sin(q.x * 26.0 + abs(q.y) * 18.0)) * step(abs(q.x), 0.98);
  }
  if (shape == SH_PETAL) { // a petal, a teardrop
    vec2 pq = vec2(q.x, q.y * 1.55);
    return 1.0 - smoothstep(0.55 - 0.28 * q.x, 0.72 - 0.28 * q.x, length(pq));
  }
  if (shape == SH_NOTE) { // a note: its head, its stem, its flag
    float head = 1.0 - smoothstep(0.24, 0.32, length(vec2(q.x + 0.28, (q.y + 0.48) * 1.45)));
    float stem = (1.0 - smoothstep(0.05, 0.09, abs(q.x + 0.02))) * step(-0.5, q.y) * step(q.y, 0.78);
    float flag = (1.0 - smoothstep(0.06, 0.11, abs(q.y - 0.66 + q.x * 0.75))) * step(0.0, q.x) * step(q.x, 0.46);
    return max(head, max(stem, flag));
  }
  if (shape == SH_PUFF) { // a puff of smoke: a free sprite's ragged cloud, one of four, its coverage a dithered edge
    float k = floor(clamp(thick, 0.0, 0.999) * ${PUFF_CELLS.at.length}.0);
    vec2 uv = clamp(q * 0.5 + 0.5, 0.0, 1.0);
    vec2 px = vec2(k * ${PUFF_CELLS.w}.0 + uv.x * ${PUFF_CELLS.w}.0, ${PUFF_CELLS.at[0][1]}.0 + (1.0 - uv.y) * ${PUFF_CELLS.h}.0);
    return texture2D(uPuffs, px / vec2(${FLAME_ATLAS.width}.0, ${FLAME_ATLAS.height}.0)).g * (1.0 - smoothstep(0.82, 1.0, r));
  }
  return 1.0 - smoothstep(0.35, 1.0, r); // a disc
}
`;

const NEW_SHAPES = /* glsl */ `
float crescentMask(vec2 q) { // a thin blade-swoosh of about 150 degrees: its crown (the leading edge, +x) bright, its horns trailing to points
  float dOut = 0.957 - length(q - vec2(-0.477, 0.0));
  float dIn = length(q - vec2(-0.935, 0.0)) - 1.155;
  float sd = min(dOut, dIn);
  return smoothstep(0.0, 0.05, sd) * (0.55 + 0.45 * (1.0 - smoothstep(0.02, 0.28, dOut)));
}
float lashMask(vec2 q) { // a whip: an S-curve with its head at +x, thinning to a point behind
  float yc = 0.3 * sin(q.x * 3.14159);
  float slope = 0.3 * 3.14159 * cos(q.x * 3.14159);
  float d = abs(q.y - yc) * inversesqrt(1.0 + slope * slope);
  float w = mix(0.04, 0.15, smoothstep(-1.0, 0.8, q.x));
  float body = (1.0 - smoothstep(w * 0.55, w, d)) * smoothstep(-1.0, -0.8, q.x) * (1.0 - smoothstep(0.9, 1.0, q.x));
  float head = 1.0 - smoothstep(0.09, 0.15, length(q - vec2(0.8, 0.3 * sin(0.8 * 3.14159))));
  return max(body, head);
}
float crossMask(vec2 q) { // a thin cross of light, hairline rays, a tiny soft core
  vec2 a = abs(q);
  float hh = 0.06 + 0.055 * pow(1.0 - a.x, 2.0);
  float hv = 0.06 + 0.055 * pow(1.0 - min(a.y / 0.86, 1.0), 2.0);
  float rayH = (1.0 - smoothstep(hh * 0.6, hh, a.y)) * (1.0 - smoothstep(0.55, 1.0, a.x));
  float rayV = (1.0 - smoothstep(hv * 0.6, hv, a.x)) * (1.0 - smoothstep(0.45, 0.86, a.y));
  return max(max(rayH, rayV), exp(-34.0 * dot(q, q)));
}
float dashMask(vec2 q) { // three ticks in a row along +x, tapering at their ends, brighter toward the head
  float k = clamp(floor((q.x + 1.0) * 1.5), 0.0, 2.0);
  float u = (q.x - (k * 0.667 - 0.667)) / 0.28;
  float hw = (0.07 + 0.015 * k) * pow(max(1.0 - u * u, 0.0), 0.8);
  return (1.0 - smoothstep(hw * 0.55, hw + 0.0001, abs(q.y))) * (0.55 + 0.225 * k) * step(abs(u), 1.0);
}
float arcMask(vec2 q, float thick) { // an open ring: a gap on the -x side, tapered ends, the leading end brighter, so spin turns it like a wheel
  float r = length(q);
  if (r < 0.3) return 0.0;
  float th = max(thick, 0.06);
  const float gap = 1.15;
  float t = (atan(q.y, q.x) + 3.14159265 - gap * 0.5) / (6.2831853 - gap);
  if (t < 0.0 || t > 1.0) return 0.0;
  float s = 4.0 * t * (1.0 - t);
  float w = th * (0.25 + 0.75 * pow(s, 0.7));
  return (1.0 - smoothstep(w * 0.45, w, abs(r - (1.0 - th)))) * (0.5 + 0.5 * t) * smoothstep(0.0, 0.05, min(t, 1.0 - t));
}
float markMask(vec2 q, float thick) { // one cell of the mark atlas, by thick
  float k = floor(clamp(thick, 0.0, 0.999) * ${MARK_ATLAS.names.length}.0);
  vec2 uv = clamp(q * 0.5 + 0.5, 0.0, 0.9999);
  return texture2D(uMarks, vec2((k + uv.x) / ${MARK_ATLAS.names.length}.0, 1.0 - uv.y)).r;
}
`;

/** Declares uPuffs and uMarks and `float mask(vec2 q, int shape, float thick)`; the shape defines come first. */
export const particleMasksGlsl = (shapes: readonly string[]): string => /* glsl */ `
${shapeDefines(shapes)}
uniform sampler2D uPuffs;
uniform sampler2D uMarks;
${OLD_SHAPES}
${NEW_SHAPES}
float mask(vec2 q, int shape, float thick) {
  if (shape == SH_CRESCENT) return crescentMask(q);
  if (shape == SH_LASH) return lashMask(q);
  if (shape == SH_CROSS) return crossMask(q);
  if (shape == SH_DASH) return dashMask(q);
  if (shape == SH_ARC) return arcMask(q, thick);
  if (shape == SH_MARK || shape == SH_TRACE) return markMask(q, thick);
  return oldMask(q, shape, thick);
}
`;
