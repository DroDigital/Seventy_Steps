/**
 * How hard the wind drives the sea (round 30; moved here round 55): R'lyeh's lies restless, Innsmouth's a little, a gale and rain raise any. The wind
 * does not take the sea at once: `seaChopNow` is the value the sea has risen to, eased toward `seaChop` once a step (`easeSeaChop`, in `stepGame`), and it
 * is the one number the picture raises the swell by (render/worldLife.ts hands it to the shader and the tentacles) and a body that falls into the water
 * meets the surface at (systems/waterFall.ts), so what is drawn and what is floated on are one water. Pure.
 */

import type { Game } from './components';

const EASE = 0.02; // the share of the way to the wind's chop it comes in a step: a fifth of a minute to settle, as in round 30

/** What the realm and the weather would raise the sea to. */
export function seaChop(g: Game): number {
  const wx = g.overworld?.weather;
  const wind = wx ? (wx.kind === 'gale' ? 0.9 : wx.kind === 'storm' ? 1.1 : wx.kind === 'rain' ? 0.3 : 0) * wx.amount : 0;
  return (g.overworld?.region === 'rlyeh' ? 1.5 : g.overworld?.region === 'innsmouth' ? 1.15 : 1) * (1 + wind);
}

const NOW = new WeakMap<Game, number>();

/** What the sea has risen to: where the wind would have it, until the first step has eased it. */
export const seaChopNow = (g: Game): number => NOW.get(g) ?? seaChop(g);

/** One step of the sea coming up to the wind (or down from it). */
export function easeSeaChop(g: Game): void {
  const now = seaChopNow(g);
  NOW.set(g, now + (seaChop(g) - now) * EASE);
}
