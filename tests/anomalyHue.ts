/**
 * Whether a colour would be read as an anomaly by the post pass's colour isolation (`isolate` in render/shaders/post.ts): saturated
 * past `FX.minSaturation`, not near black, and within `FX.hueWidth` of an anomaly hue, the far edge of the shader's own window. One
 * rule for every test that keeps the scene's colours from reading as anomalies, read from the shader's numbers so the two cannot
 * drift apart (2026-11-24: it was copied, with its numbers written out, into eight test files).
 */
import { FX } from '../src/data/tuning';
import { ANOMALY_HUES, rgbToHsv } from '../src/render/palette';

/** The distance between two hues, in 0..1 hue units, the short way round. */
export const hueGap = (a: number, b: number): number => Math.min(Math.abs(a - b), 1 - Math.abs(a - b));

export function readsAsAnomaly(c: readonly [number, number, number]): boolean {
  const [h, s, v] = rgbToHsv(c);
  return s > FX.minSaturation && v > 0.08 && ANOMALY_HUES.some((a) => hueGap(h, a) < FX.hueWidth);
}
