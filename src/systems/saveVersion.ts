/**
 * Which saves a build can read (round 47, towards 1.0): a save carries the format it was written in and the
 * game's version that wrote it. One of an older format is carried forward a step at a time (`STEPS`), so a
 * dream begun on a release candidate goes on after 1.0; one older than the oldest step is of another world
 * (version 1: before the world doubled) and is not read; one of a newer format is not read either, but is
 * known for what it is (`newerSave`), so the title neither calls it empty nor lets it be overwritten unasked.
 */

declare const __APP_VERSION__: string | undefined;

/** The format saves are written in. Raise it, and add the step from the last, when a saved field changes its meaning. */
export const SAVE_VERSION = 2;
/** The oldest format that can still be carried forward. */
export const OLDEST_SAVE = 2;
/** The game's version that writes a save (kept in it, for a crash report or a migration's judgement). */
export const GAME_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';

type Raw = Record<string, unknown>;

/** Each step takes a save of format n to n + 1 (none yet: format 2 is the one 1.0 ships with). */
export const STEPS: Record<number, (o: Raw) => Raw> = {};

const isObj = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const versionOf = (o: Raw): number | null => (typeof o.version === 'number' && Number.isInteger(o.version) ? o.version : null);

/** A parsed save carried forward to the current format, or null when it cannot be (of another world, newer, or a step missing). */
export function carryForward(o: unknown, steps = STEPS, current = SAVE_VERSION, oldest = OLDEST_SAVE): Raw | null {
  if (!isObj(o)) return null;
  let v = versionOf(o);
  if (v === null || v < oldest || v > current) return null;
  let at: Raw = o;
  while (v < current) {
    const step = steps[v];
    if (!step) return null;
    at = { ...step(at), version: v + 1 };
    v++;
  }
  return at;
}

/** Whether `json` is a save written by a newer build than this one (it is kept, not read). */
export function newerSave(json: string | null, current = SAVE_VERSION): boolean {
  if (!json) return false;
  try {
    const o: unknown = JSON.parse(json);
    const v = isObj(o) ? versionOf(o) : null;
    return v !== null && v > current;
  } catch {
    return false;
  }
}
