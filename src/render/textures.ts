/**
 * Procedural 128×128 world textures (spec §2): rock all of a piece (standing stones, playtest round 7),
 * wet flesh, a horse's hide, water and figure cloth here; the natural ground (grass, dirt, mud, blighted earth, sand,
 * snow, gravel, leaf litter; round 32) in textureGround.ts; masonry, flagstones, brick, cobbles,
 * clapboard, shingles and wood in textureMasonry.ts. Pure (no Three.js): tileable RGBA8 pixels built
 * of muted colours. A texture spans twice the texels of the old 64-texel set at the same density, so it repeats
 * half as often; world materials also vary it in world space (shaders/world.ts).
 */

import { fbm } from '../core/noise';
import { hash2 } from '../core/rng';
import { PSX_DETAIL, PSX_SIZE } from '../data/psxDetail';
import { BASE, mixRgb, scaleRgb, type Rgb } from './palette';
import { dirt, grass, gravel, leaves, mud, rot, sand, snow } from './textureGround';
import { brick, clapboard, cobble, shingle, slab, stone, wood, type TexelFn } from './textureMasonry';

export const TEXTURE_SIZE = 128;
/** UV units per texture repeat: geometry UVs count 64 texels to the unit, as they always have. */
export const UV_PER_TEXTURE = TEXTURE_SIZE / 64;
export const TEXTURE_KINDS = [
  'stone', 'slab', 'wood', 'rot', 'flesh', 'hide', 'water', 'cloth', 'grass', 'mud', 'sand', 'snow', 'cobble', 'brick', 'clapboard', 'shingle', 'rock', 'dirt', 'gravel', 'leaves',
] as const;
export type TextureKind = (typeof TEXTURE_KINDS)[number];

/** Weathered rock, all of a piece: faint strata, grain and pits, dark cracks, pale lichen in blotches. */
const rock: TexelFn = (u, v, seed) => {
  const warp = fbm(u * 3, v * 3, seed, 3, 3);
  const strata = 0.5 + 0.5 * Math.sin((v * 6 + warp * 1.5) * Math.PI * 2);
  const grain = fbm(u * 24, v * 24, seed + 3, 3, 24);
  const crack = 1 - Math.abs(2 * fbm(u * 6, v * 6, seed + 7, 4, 6) - 1);
  const lichen = fbm(u * 10, v * 10, seed + 11, 3, 10);
  let c = mixRgb(mixRgb(BASE.charcoal, BASE.seaGrey, 0.6), BASE.bone, 0.1 + 0.14 * strata);
  c = scaleRgb(c, 0.8 + 0.34 * grain);
  if (crack > 0.94) c = scaleRgb(c, 0.55);
  if (lichen > 0.64) c = mixRgb(c, mixRgb(BASE.bone, BASE.seaGrey, 0.35), Math.min(0.6, (lichen - 0.64) * 2.2));
  if (grain < 0.3 && hash2(Math.floor(u * 128), Math.floor(v * 128), seed) < 0.35) c = scaleRgb(c, 0.72); // pits
  return c;
};

/** Wet flesh: pale meat, dark branching veins, glossy glints. */
const flesh: TexelFn = (u, v, seed) => {
  const vein = 1 - Math.abs(2 * fbm(u * 8, v * 8, seed, 4, 8) - 1);
  const meat = fbm(u * 16, v * 16, seed + 3, 3, 16);
  const gloss = fbm(u * 32, v * 32, seed + 9, 2, 32);
  let c = mixRgb(BASE.rust, BASE.bone, 0.35 + 0.35 * meat);
  if (vein > 0.86) c = scaleRgb(BASE.rust, 0.45);
  if (gloss > 0.72) c = mixRgb(c, BASE.bone, 0.6);
  return c;
};

/**
 * Horse hide: a soft mottle, nearly one value and only slightly warm. No hair lines:
 * a sine of strands read as stripes once the picture was quantized. The bay, the points
 * and the muzzle are vertex colour, not this picture.
 */
const hide: TexelFn = (u, v, seed) => {
  const patch = fbm(u * 2, v * 3, seed, 3, 2, 3);
  const lay = fbm(u * 5, v * 7, seed + 3, 2, 5, 7);
  const pore = fbm(u * 11, v * 13, seed + 8, 2, 11, 13);
  let k = 0.8 + 0.16 * (patch - 0.5) + 0.1 * (lay - 0.5) + 0.05 * (pore - 0.5);
  k = Math.min(0.94, Math.max(0.66, k));
  return [k * 0.99, k * 0.96, k * 0.92];
};

/** Dark still water: wavy ripples with pale crests. */
const water: TexelFn = (u, v, seed) => {
  const warp = fbm(u * 8, v * 8, seed, 3, 8);
  const wave = 0.5 + 0.5 * Math.sin((v * 10 + warp * 1.2) * Math.PI * 2);
  let c = mixRgb(scaleRgb(BASE.seaGrey, 0.3), BASE.seaGrey, 0.2 + 0.5 * wave * warp);
  if (wave > 0.93) c = mixRgb(c, BASE.bone, 0.3);
  return c;
};

/** Figure cloth: near-flat mid grey in broad value blocks (4-texel folds, 8-texel patches), so tinted parts read as shapes. */
const cloth: TexelFn = (u, v, seed) => {
  const fold = hash2(Math.floor(u * 32), 0, seed);
  const patch = hash2(Math.floor(u * 16), Math.floor(v * 16), seed + 1);
  const k = 0.5 * (0.86 + 0.16 * fold + 0.12 * patch);
  return [k, k, k];
};

/** The PS1 patterns (data/psxDetail.ts), decoded once: each a 64 × 64 brightness against its own average (100 is average). */
const psxPatterns = new Map<string, Uint8Array>();
function psxPattern(name: string): Uint8Array {
  let p = psxPatterns.get(name);
  if (!p) {
    const raw = atob(PSX_DETAIL[name]);
    p = Uint8Array.from(raw, (c) => c.charCodeAt(0));
    psxPatterns.set(name, p);
  }
  return p;
}

/** Where along an axis a pattern may start so that the wrap of the texture (a seam one texel wide, the same at every repeat) falls where the pattern is quiet, not on a joint: the places it changes less than it does on average. */
function quietStarts(pat: Uint8Array, alongX: boolean): number[] {
  const step = Array.from({ length: PSX_SIZE }, (_, i) => {
    let sum = 0;
    for (let k = 0; k < PSX_SIZE; k++) {
      const [a, b] = alongX ? [pat[k * PSX_SIZE + i], pat[k * PSX_SIZE + ((i + PSX_SIZE - 1) % PSX_SIZE)]] : [pat[i * PSX_SIZE + k], pat[((i + PSX_SIZE - 1) % PSX_SIZE) * PSX_SIZE + k]];
      sum += Math.abs(a - b);
    }
    return sum / PSX_SIZE;
  });
  const mean = step.reduce((a, b) => a + b, 0) / step.length;
  return step.flatMap((s, i) => (s < mean * 0.8 ? [i] : []));
}

/**
 * A kind drawn as a PlayStation texture artist drew it (round 74, asked for: "the best and fitting PS1 era textures"): the texture keeps the average
 * colour and light of the procedural one (so the realms' grades and the lamps see what they always saw) and takes its structure from a 64 × 64 pattern
 * of Goblinatron's 'PSX Dungeon' (CC BY 4.0), laid twice across and down so that a block or a slab is as large as it was; each material starts
 * it at its own place (the seed), and a little of the procedural grain stays so that two walls of one kit are not one picture.
 */
function psx(base: TexelFn, pattern: string): TexelFn {
  const means = new Map<number, Rgb>();
  const meanOf = (seed: number): Rgb => {
    let m = means.get(seed);
    if (!m) {
      let [r, g, b] = [0, 0, 0];
      for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) { const c = base((i + 0.5) / 12, (j + 0.5) / 12, seed); r += c[0]; g += c[1]; b += c[2]; }
      m = [r / 144, g / 144, b / 144];
      means.set(seed, m);
    }
    return m;
  };
  const quiet: { x: number[]; y: number[] } = { x: [], y: [] };
  return (u, v, seed) => {
    const pat = psxPattern(pattern);
    if (!quiet.x.length) [quiet.x, quiet.y] = [quietStarts(pat, true), quietStarts(pat, false)];
    const [ox, oy] = [quiet.x[Math.floor(hash2(seed, 5, 17) * quiet.x.length)], quiet.y[Math.floor(hash2(seed, 9, 23) * quiet.y.length)]];
    const [x, y] = [(Math.floor(u * TEXTURE_SIZE) + ox) % PSX_SIZE, (Math.floor(v * TEXTURE_SIZE) + oy) % PSX_SIZE];
    const grain = 0.94 + 0.12 * fbm(u * 16, v * 16, seed + 31, 2, 16);
    return scaleRgb(meanOf(seed), (pat[y * PSX_SIZE + x] / 100) * grain);
  };
}

const TEXELS: Record<TextureKind, TexelFn> = {
  stone: psx(stone, 'stone'), slab: psx(slab, 'slab'), wood: psx(wood, 'wood'),
  rot, flesh, hide, water, cloth, grass, mud, sand, snow, cobble, brick, clapboard, shingle, rock, dirt, gravel, leaves,
};

const to8 = (x: number): number => Math.round(Math.min(1, Math.max(0, x)) * 255);

/** RGBA8 pixels, TEXTURE_SIZE × TEXTURE_SIZE, row-major. */
export function generateTexture(kind: TextureKind, seed: number): Uint8Array {
  const s = TEXTURE_SIZE;
  const out = new Uint8Array(s * s * 4);
  const texel = TEXELS[kind];
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const c = texel((x + 0.5) / s, (y + 0.5) / s, seed);
      const i = (y * s + x) * 4;
      out[i] = to8(c[0]);
      out[i + 1] = to8(c[1]);
      out[i + 2] = to8(c[2]);
      out[i + 3] = 255;
    }
  }
  return out;
}
