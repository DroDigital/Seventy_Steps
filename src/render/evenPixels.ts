/**
 * Even pixels (2026-11-03; Settings › Display): the low-res picture laid onto the screen's own pixels so that every one of
 * its pixels is drawn the same size, whatever the scale ("sharp bilinear"). Blown up nearest-neighbour 1.6, 2.4 or 3.2 times
 * over (800 × 450 on a 720p, 1080p or 1440p screen), some rows and columns are a screen pixel wider than their neighbours:
 * the dither streaks, and a thing crawls a pixel wider and narrower as the camera turns. Here each picture pixel is drawn
 * flat over its span but for the one screen pixel it shares with its neighbour, which takes each by how much of it each
 * covers. At a whole number of times over nothing is shared and the picture is the nearest-neighbour one exactly.
 * `shaders/present.ts` is this sum in GLSL; this one is for the tests.
 */

/**
 * Where to sample the picture (with bilinear filtering, in its pixels, 0 at its edge) for a screen pixel whose middle falls
 * `texel` picture pixels in, at `scale` screen pixels to a picture pixel.
 */
export function evenSample(texel: number, scale: number): number {
  const base = Math.floor(texel);
  const f = texel - base - 0.5; // from the picture pixel's middle, -0.5..0.5
  const hold = Math.max(0.5 - 0.5 / scale, 0); // drawn flat this far either side of its middle; the rest is the one shared screen pixel
  return base + 0.5 + (f - Math.min(hold, Math.max(-hold, f))) * scale;
}
