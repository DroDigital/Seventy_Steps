/**
 * The picture's tone curve (round 103; shaders/post.ts `tone` draws it): the brightness setting's gamma (`brightnessGamma`)
 * for the midtones, and below `toe` a rise from black with a slope of one, so the deepest shadows keep their own contrast
 * where a plain gamma crushed them. Pure: the brightness card (ui/brightnessCalibration.ts) draws the same curve.
 */
export function toneCurve(v: number, gamma: number, toe: number): number {
  const t = Math.min(1, Math.max(0, v / Math.max(toe, 1e-4)));
  return v + (Math.pow(v, gamma) - v) * t * t * (3 - 2 * t);
}
