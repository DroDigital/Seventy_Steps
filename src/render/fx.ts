/**
 * Pure FX model (no Three.js): sanity, accessibility cap and debug toggles in,
 * per-effect parameters out. Every effect intensifies as sanity falls (spec §2, Phase 0), and so
 * does the audio's detune and distortion (the FX controller's audio half, spec §3A), but for the
 * low resolution and its vertex snap, which hold (playtest round 7: madness warps, it does not
 * coarsen the pixels). Round 22: the warping slows past FX.warpCap of the stress (the picture stayed
 * torn all the way to madness: `warpOf`); what a failing mind does besides is dread's: the edges of
 * sight lose their focus and the stars go wrong (round 23: no darkened edges and no eyes). Round 58: the warp is no longer a steady wobble
 * over the whole screen: it is flow at the edges (the middle holds), a lens that splits the colours outward, a faint second picture, and
 * at the edge of Unmoored now and then a tear, all of it in waves (`surge`, warpWaves.ts) and a ring sent out as a band is lost.
 */

import { FX, RENDER, type Ramp } from '../data/tuning';
import { driftAt, ringAt, surgeAt } from './warpWaves';

export const EFFECTS = [
  'pixelate',
  'snap',
  'affine',
  'fog',
  'isolate',
  'quantize',
  'warp',
  'displace',
  'lens',
  'dread',
] as const;
export type EffectId = (typeof EFFECTS)[number];

export interface FxState {
  sanity: number; // 0..100
  cap: number; // 0..1, caps stress for accessibility
  anomalyProximity: number; // 0..1
  enabled: Record<EffectId, boolean>;
  pulse?: number; // 0..1: a band change for the worse, fading (fxController.ts)
  time?: number; // seconds of render time: the waves of the warp run on it (0 if none: a test's)
}

export interface FxParams {
  stress: number;
  lowRes: boolean;
  snapPixels: number;
  affine: number;
  fogNear: number;
  fogFar: number;
  fogAmount: number;
  isolate: boolean;
  desaturate: number;
  anomalyProximity: number;
  anomalyStress: number;
  quantize: boolean;
  ditherSpread: number;
  ripple: number;
  chroma: number;
  displace: number;
  ghost: number; // 0..1: how much of a second picture, a little to one side, the mind sees double with (at a surge's height)
  tear: number; // 0..1: how likely the picture is to tear in slices now (the edge of Unmoored, at a surge's height)
  surge: number; // 0..1: how strong this moment of the warp is (warpWaves.ts): the picture swells and lulls
  shock: number; // UV units: how far the ring a band lost sends out of the middle pushes the picture as it passes (FX.shock at most)...
  shockAt: number; // ...and how far it has gone, in picture heights
  blur: number; // low-res pixels the edges blur by
  strange: number; // 0..1: how wrong the stars are
  fovBreatheDeg: number;
  skew: number;
  detune: number; // cents
  wobble: number; // cents of drift around the detune
  distortion: number; // 0..1
  mind: number; // 0..1: how far the creatures slip, a texel or two at a time, and their eyes swell (round 78: the warp's onset; shaders/sprite.ts)
}

/** The FxParams fields each effect drives (the sanity slider moves all but the STEADY ones'). */
export const EFFECT_PARAMS: Record<EffectId, readonly (keyof FxParams)[]> = {
  pixelate: ['lowRes'],
  snap: ['snapPixels'],
  affine: ['affine'],
  fog: ['fogNear', 'fogFar'],
  isolate: ['desaturate', 'anomalyStress'],
  quantize: ['ditherSpread'],
  warp: ['ripple', 'chroma', 'ghost', 'tear', 'shock', 'mind'],
  displace: ['displace'],
  lens: ['fovBreatheDeg', 'skew'],
  dread: ['blur', 'strange'],
};

/** The effects that hold at every sanity. */
export const STEADY: readonly EffectId[] = ['pixelate', 'snap'];

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const at = (r: Ramp, t: number): number => r[0] + (r[1] - r[0]) * t;
const smooth = (a: number, b: number, x: number): number => {
  const k = clamp01((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};

export function allEffectsOn(): Record<EffectId, boolean> {
  return Object.fromEntries(EFFECTS.map((id) => [id, true])) as Record<EffectId, boolean>;
}

/** 0 when lucid, 1 at sanity 0; never above the accessibility cap. */
export function sanityStress(sanity: number, cap: number): number {
  return Math.min(clamp01(1 - sanity / 100), clamp01(cap));
}

/** How far the picture has taken up a failing mind's effects at `stress`: none until FX.calm of it is spent, easing in to the whole at FX.warpCap (round 32). */
export const onsetOf = (stress: number): number => smooth(FX.calm, FX.warpCap, stress);

/** How much the picture warps at `stress`: nothing until FX.calm, then in step with it up to FX.warpCap, past it only FX.warpSlope as fast (round 23). */
export const warpOf = (stress: number): number => onsetOf(stress) * (Math.min(stress, FX.warpCap) + Math.max(0, stress - FX.warpCap) * FX.warpSlope);

export function computeFx(s: FxState): FxParams {
  const t = sanityStress(s.sanity, s.cap);
  const w = warpOf(t);
  const seen = t * onsetOf(t); // the stress as the picture shows it: the fog, the colour drained, the hues boosted and the dither wait for it as the warp does
  const on = s.enabled;
  const pulse = clamp01(s.pulse ?? 0) * clamp01(s.cap);
  const surge = surgeAt(s.time ?? 0, t);
  const ring = ringAt(clamp01(s.pulse ?? 0));
  return {
    stress: t,
    lowRes: on.pixelate,
    snapPixels: on.snap ? FX.snapPixels : 0,
    affine: on.affine ? at(FX.affine, w) : 0,
    fogNear: at(FX.fogNear, seen),
    fogFar: at(FX.fogFar, seen),
    fogAmount: on.fog ? 1 : 0,
    isolate: on.isolate,
    desaturate: at(FX.desaturate, seen),
    anomalyProximity: clamp01(s.anomalyProximity),
    anomalyStress: at(FX.anomalyStress, seen),
    quantize: on.quantize,
    ditherSpread: at(FX.ditherSpread, seen),
    ripple: on.warp ? at(FX.ripple, w) + FX.pulseRipple * pulse : 0,
    chroma: on.warp ? at(FX.chroma, w) + FX.pulseChroma * pulse : 0,
    displace: on.displace ? at(FX.displace, w) : 0,
    ghost: on.warp ? at(FX.ghost, w) : 0,
    tear: on.warp ? smooth(FX.tearFrom, 1, t) * smooth(0.7, 1, surge) : 0,
    surge,
    shock: on.warp ? ring.strength * clamp01(s.cap) * FX.shock : 0,
    shockAt: ring.radius,
    blur: on.dread ? at(FX.blur, smooth(FX.dreadFrom, 1, t)) : 0,
    strange: on.dread ? at(FX.strange, smooth(FX.dreadFrom, 1, t)) : 0,
    fovBreatheDeg: on.lens ? at(FX.fovBreatheDeg, w) : 0,
    skew: on.lens ? at(FX.skew, w) : 0,
    detune: at(FX.detune, t),
    wobble: at(FX.wobble, t),
    distortion: at(FX.distortion, t),
    mind: on.warp ? onsetOf(t) : 0,
  };
}

/** Camera FOV "breathing" and projection skew at a moment in time: an uneven drift, not a sine, and strongest as the warp surges (round 58). */
export function lensAt(fx: FxParams, time: number, fov: number = RENDER.fovDeg): { fovDeg: number; skew: number } {
  const k = 0.35 + 0.65 * fx.surge;
  return {
    fovDeg: fov + fx.fovBreatheDeg * driftAt(time * FX.breatheHz * 4.3) * k,
    skew: fx.skew * driftAt(time * FX.skewHz * 9, 5) * k,
  };
}

/** 1 when within FX.anomalyNear metres of an anomaly, fading to 0 at FX.anomalyFar. */
export function anomalyProximity(distance: number): number {
  return clamp01(1 - (distance - FX.anomalyNear) / (FX.anomalyFar - FX.anomalyNear));
}
