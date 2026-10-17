/**
 * How hard the wind drives the sea (round 30; moved here round 55): R'lyeh's lies restless, Innsmouth's a little, a gale and rain raise any. The renderer
 * eases toward this (`SEA.chop`, render/worldLife.ts) and scales the swell by it, and a body that falls into the water meets the surface at the same
 * height (systems/waterFall.ts), so both read it from here. Pure.
 */

import type { Game } from './components';

export function seaChop(g: Game): number {
  const wx = g.overworld?.weather;
  const wind = wx ? (wx.kind === 'gale' ? 0.9 : wx.kind === 'storm' ? 1.1 : wx.kind === 'rain' ? 0.3 : 0) * wx.amount : 0;
  return (g.overworld?.region === 'rlyeh' ? 1.5 : g.overworld?.region === 'innsmouth' ? 1.15 : 1) * (1 + wind);
}
