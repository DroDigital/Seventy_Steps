/**
 * Each horror's death of its own (2026-11-23, asked for: "a unique death animation for each boss that is lore accurate"; render
 * only, read by render/creatureFx.ts, render/creatureLook.ts, render/bossDeathFx.ts, render/gore.ts and shaders/spriteFx.ts).
 * What the tale makes of each, or where it says nothing (a god that does not die), what its hints allow: the curse said backward
 * and the dust (Curwen), the colour going up out of the well (the Colour), the bats of the grave (the Hound), the waxwork (Rhan-
 * Tegoth). Nothing of the drawn art is changed. A death is made of four things:
 *   body   how the picture goes, texel by texel (shaders/spriteFx.ts): the order its texels go in, how what is left moves, what
 *          it turns to first (`tint`, over the share `first` of the going) and the edge of what is left (`rim`)
 *   move   how the whole of it moves through its death: up, down, stretched, flattened, away from the investigator, trembling
 *   cues   what it lets loose in the world as it goes, at shares of its death (render/bossDeathFx.ts): matter, rings and scars on
 *          the ground, light, a bolt from the sky, a blast's wave, a sound
 *   gore   whether a blade's killing cut may part it and it pools its blood (round 113's gore): only where the tale is one of a
 *          blade or a tearing (asked for: "the dismemberment shouldn't work then, or only in fitting ones")
 * Its death move is a creature's own 80 frames; every share here is of those.
 */

import type { SampleSetId } from './samples';
import type { StingerId } from './sounds';
import { DEEP_DEATHS } from './bossDeathsDeep';
import { WAKING_DEATHS } from './bossDeathsWaking';
import type { MatterId } from './bossDeathMatter';

type Rgb = readonly [number, number, number];

/** The orders a body's texels can go in, by the number the shader is told: the head first, the feet first, a noise of char, a block at a time, the middle out, the rim in, swept across from one side (`dir`), band by band across, round cells each from its middle out, nearest a corner first (`dir`), band by band up and down, from the top and the bottom to a line across the middle (an eye shutting), from the sides to a line up the middle (a door shutting), all of it at once and evenly. */
export const DEATH_ORDERS = ['top', 'feet', 'char', 'blocks', 'centre', 'rim', 'sweep', 'rows', 'cells', 'corner', 'columns', 'lids', 'doors', 'even'] as const;
/** How what is left of it moves: not at all, its columns falling, sinking into itself, flying apart in blocks, streaming up, whirling into its middle, drawing off to a point, in waves, its bands blown aside (`dir`), flattening over the ground, drawn into a corner (`dir`), squeezed to a slit, running down in drips, seething, blinking in and out of sight, spreading out of itself like ink, drawn down into a hole under it. */
export const DEATH_MOTIONS = ['none', 'fall', 'sink', 'scatter', 'rise', 'spiral', 'shrink', 'ripple', 'tatter', 'spread', 'fold', 'narrow', 'drip', 'boil', 'flicker', 'diffuse', 'drain'] as const;
export type DeathOrder = (typeof DEATH_ORDERS)[number];
export type DeathMotion = (typeof DEATH_MOTIONS)[number];

/** The style numbers past the five of data/creatureFx.ts: a horror's own is this, plus its place in DEATH_KEYS. */
export const DEATH_STYLE_BASE = 16;

export interface DeathBody {
  order: DeathOrder;
  motion: DeathMotion;
  strength?: number; // how far it moves (1)
  first?: number; // the share of its going that its tint takes before a texel goes (0: both at once)
  dir?: number; // sweep: the side it comes from, radians (0 the left, π/2 below); tatter: the wind, +1 or -1; corner, fold: 0 upper left, 1 upper right, 2 lower left, 3 lower right
  rim: Rgb; // the edge of what is left
  lit?: boolean; // the edge shines of itself (embers, light), not by the light it stands in (dust, slime)
  tint?: Rgb; // what the body turns to as it goes, its own light and dark kept
  tintBy?: number; // how far (1)
}

export interface DeathMove {
  y?: number; // its heights moved up by the end (less than nought: down)
  sx?: number; // its breadth by the end (× 1)
  sy?: number; // its height by the end (× 1)
  away?: number; // its breadths moved away from the investigator by the end
  shake?: number; // breadths of a tremble that dies away
  ease?: 'in' | 'out' | 'both'; // slow then fast (a fall, a rocket), fast then slow (settling), or smooth (both)
  from?: number; // the share of its death before it moves (0.08: the blow's own beat)
}

/** Where on the body a cue lets its matter loose: over all its height, about its feet, about its head, or on the ground about it. */
export type Where = 'body' | 'feet' | 'head' | 'ground';
type At = { at: number };
export type DeathCue = At &
  (
    | { burst: MatterId; n: number; where?: Where }
    | { until: number; stream: MatterId; n: number; where?: Where } // `n` over the whole of it, however fast the death plays
    | { ring: Rgb; to: number; life?: number }
    | { scar: Rgb; r: number; life?: number }
    | { light: Rgb; strength: number; range: number; seconds: number }
    | { bolt: Rgb }
    | { blast: number }
    | { prints: number; r: number }
    | { set: SampleSetId; gain?: number; pitch?: number }
    | { sting: StingerId; gain?: number; pitch?: number }
  );

export interface BossDeath {
  lore: string; // what the tale makes of it, and so what its death is
  body: DeathBody;
  move?: DeathMove;
  cues: readonly DeathCue[];
  gore?: boolean;
}

/** Every horror that is vanquished (each `boss:` spawn of the world: tests/bossDeaths.test.ts), by its picture's key; a boss version of a common creature by its own. */
export const DEATHS: Readonly<Record<string, BossDeath>> = { ...WAKING_DEATHS, ...DEEP_DEATHS };
/** Their order in the shader's tables. */
export const DEATH_KEYS: readonly string[] = Object.keys(DEATHS).sort();

/** The key of the death a picture `key` (`id` or `id#variant`) dies, if it has one of its own: an eldritch form dies as its horror does, a boss version of a common creature only as itself. */
export function deathKey(key: string): string | undefined {
  if (DEATHS[key]) return key;
  const [id, variant] = key.split('#');
  return variant && variant !== 'boss' && DEATHS[id] ? id : undefined;
}
export const deathOf = (key: string): BossDeath | undefined => {
  const k = deathKey(key);
  return k === undefined ? undefined : DEATHS[k];
};
/** The style number the shader is told for a picture that dies its own death. */
export const deathStyleOf = (key: string): number | undefined => {
  const k = deathKey(key);
  return k === undefined ? undefined : DEATH_STYLE_BASE + DEATH_KEYS.indexOf(k);
};

/** Where its move has the body `t` (0..1) through its death, at `time` seconds (the tremble's clock). */
export interface MoveAt {
  lift: number; // heights up
  sx: number;
  sy: number;
  away: number; // breadths away from the investigator
  shake: number; // breadths aside, this moment
}
const NONE: MoveAt = { lift: 0, sx: 1, sy: 1, away: 0, shake: 0 };
export function deathMoveAt(move: DeathMove | undefined, t: number, time: number): MoveAt {
  if (!move) return NONE;
  const from = move.from ?? 0.08;
  const k = Math.min(1, Math.max(0, (t - from) / (1 - from)));
  const e = move.ease === 'in' ? k * k : move.ease === 'out' ? 1 - (1 - k) * (1 - k) : k * k * (3 - 2 * k);
  const tremble = (move.shake ?? 0) * (1 - t) * Math.min(1, t * 12) * (0.6 * Math.sin(time * 41) + 0.4 * Math.sin(time * 23.3));
  return { lift: (move.y ?? 0) * e, sx: 1 + ((move.sx ?? 1) - 1) * e, sy: 1 + ((move.sy ?? 1) - 1) * e, away: (move.away ?? 0) * e, shake: tremble };
}
