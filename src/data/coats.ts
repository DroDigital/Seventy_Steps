/**
 * Round 78, the coats of the land: what lies on the stones of a realm and gives it away at a glance. Snow caps the ruins of the
 * Mountains of Madness, drifted sand lies on the windward side of Pnakotus, a tide-line of brine and slime stains the walls of
 * Innsmouth and sunken R'lyeh, soot on Yuggoth's pillars. Props only (the terrain has its own ground): the world shader lays the coat
 * on what faces up, what faces the wind and what stands below a line (shaders/world.ts), and render/coat.ts eases one realm's into
 * the next's as the investigator crosses. Colours are display sRGB, muted: the world is nearly colourless and colour means that
 * something is wrong (tests/coat.test.ts keeps them off the anomaly hues). Data only.
 */

import { getRegion } from './regions';

type Rgb = readonly [number, number, number];

/** One realm's coat as written: `line` is metres above the realm's mean ground (the stain's height is its own to the land). */
export interface CoatDef {
  cap?: Rgb; // what lies on whatever faces up (snow, drifted sand, soot, slime): the surface's colour, replacing its own
  capShare?: number; // 0..1: how much of what faces up it covers
  wind?: number; // 0..1: how much of what faces the wind it covers (rime, a film of sand, streaks of soot)
  stain?: Rgb; // what a stained surface's colour is multiplied by (brine and slime darken and green the stone)
  stainShare?: number; // 0..1: how deep the stain is below its line
  line?: number; // metres above the realm's mean ground where the stain ends...
  soft?: number; // ...and the metres it thins over above that...
  wobble?: number; // ...and the metres the line wanders up and down the wall (the tide did not stand level)
  crust?: number; // 0..1: how pale the salt is that dries along the line
}

/** What the shader is given: a def resolved (the line absolute) and how much of it there is now, 0..1. */
export interface CoatLook {
  cap: Rgb;
  stain: Rgb;
  capShare: number;
  wind: number;
  stainShare: number;
  line: number;
  soft: number;
  wobble: number;
  crust: number;
  amount: number;
}

export const COATS: Readonly<Record<string, CoatDef>> = {
  // The ice-sheathed cyclopean ruins of the plateau: a hard white cap on every top, and rime on the face the polar wind comes at.
  mountains: { cap: [0.62, 0.67, 0.77], capShare: 0.92, wind: 0.5 }, // (a pale grey-blue snow: at white a lantern's pool on it clipped to nothing)
  // The summit above the storm: a hoar-frost thinner than the plateau's snow, on stone that is already pale.
  cloud_summit: { cap: [0.84, 0.86, 0.92], capShare: 0.65, wind: 0.3 },
  // The Pnakotic desert: sand drifted on the tops and laid thin on the faces turned to the wind.
  pnakotus: { cap: [0.76, 0.66, 0.5], capShare: 0.7, wind: 0.6 },
  // Innsmouth: the weed-slimed, salt-crusted stone of a drowned quay, stained dark and green to a line the tide kept, a pale crust dried on it.
  innsmouth: { stain: [0.5, 0.64, 0.58], stainShare: 0.9, line: 1.3, soft: 1.0, wobble: 1.3, crust: 0.6 },
  // R'lyeh: the greenish slime of the cyclopean masonry, thicker and higher than the town's, lying dark on the tops as well.
  rlyeh: { cap: [0.27, 0.35, 0.3], capShare: 0.5, stain: [0.44, 0.6, 0.52], stainShare: 1, line: 2.2, soft: 1.4, wobble: 1.8, crust: 0.35 },
  // Yuggoth: soot of the Mi-Go's works laid on the tops, streaked down the wind's face.
  yuggoth: { cap: [0.17, 0.14, 0.15], capShare: 0.8, wind: 0.25 },
};

/** Nothing lying on the world. */
export const NO_COAT: CoatLook = { cap: [1, 1, 1], stain: [1, 1, 1], capShare: 0, wind: 0, stainShare: 0, line: -1e3, soft: 1, wobble: 0, crust: 0, amount: 0 };

/** The coat a realm wears, its stain's line set on the realm's own ground; `amount` is 1 (or 0 where it wears none). */
export function coatOf(region: string | null): CoatLook {
  const def = region ? COATS[region] : undefined;
  if (!def) return NO_COAT;
  const base = getRegion(region!)?.biome.base ?? 0;
  return {
    cap: def.cap ?? NO_COAT.cap,
    stain: def.stain ?? NO_COAT.stain,
    capShare: def.capShare ?? 0,
    wind: def.wind ?? 0,
    stainShare: def.stainShare ?? 0,
    line: def.stain ? base + (def.line ?? 1) : NO_COAT.line,
    soft: def.soft ?? 1,
    wobble: def.wobble ?? 0,
    crust: def.crust ?? 0,
    amount: 1,
  };
}

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const lerp3 = (a: Rgb, b: Rgb, k: number): Rgb => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

/**
 * `from` turned toward `to` by share `k`. A coat that is coming or going keeps its own colours and only its amount moves (snow
 * does not turn to sand on the way: it thins away as the sand thickens in), and one that is changing for another is eased in all.
 */
export function easeCoat(from: CoatLook, to: CoatLook, k: number): CoatLook {
  if (k >= 1) return to;
  if (from.amount < 0.01) return { ...to, amount: lerp(from.amount, to.amount, k) };
  if (to.amount < 0.01) return { ...from, amount: lerp(from.amount, to.amount, k) };
  return {
    cap: lerp3(from.cap, to.cap, k),
    stain: lerp3(from.stain, to.stain, k),
    capShare: lerp(from.capShare, to.capShare, k),
    wind: lerp(from.wind, to.wind, k),
    stainShare: lerp(from.stainShare, to.stainShare, k),
    line: lerp(from.line, to.line, k),
    soft: lerp(from.soft, to.soft, k),
    wobble: lerp(from.wobble, to.wobble, k),
    crust: lerp(from.crust, to.crust, k),
    amount: lerp(from.amount, to.amount, k),
  };
}

/** Seconds a coat takes to settle on the next realm's stones, and to be taken off at a dungeon's door (the roof closes it off at once). */
export const COAT_EASE = { realm: 3, roofed: 0.35 };
