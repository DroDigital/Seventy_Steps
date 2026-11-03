/**
 * The last pass (2026-11-03): the post pass's low-res picture put onto the canvas. Even pixels (render/evenPixels.ts, the same
 * sum in TypeScript): each picture pixel is drawn flat over its span on the screen's own pixels but for the one it shares with
 * its neighbour, which the bilinear filter weighs by coverage, so every picture pixel is drawn the same size. Off: a copy, one
 * picture pixel to one canvas pixel, which the browser blows up nearest-neighbour as before.
 */

export const PRESENT_VERT = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const PRESENT_FRAG = /* glsl */ `
uniform sampler2D tPicture;
uniform vec2 uSrc; // the picture's size, in its own pixels
uniform vec2 uOut; // the canvas's, in the screen's
uniform float uEven;

void main() {
  vec2 texel = gl_FragCoord.xy * uSrc / uOut; // where this screen pixel's middle falls on the picture, in its pixels
  if (uEven < 0.5) {
    gl_FragColor = texelFetch(tPicture, ivec2(min(floor(texel), uSrc - 1.0)), 0);
    return;
  }
  vec2 scale = uOut / uSrc;
  vec2 base = floor(texel);
  vec2 f = texel - base - 0.5;
  vec2 hold = max(0.5 - 0.5 / scale, 0.0);
  gl_FragColor = texture(tPicture, (base + 0.5 + (f - clamp(f, -hold, hold)) * scale) / uSrc);
}
`;
