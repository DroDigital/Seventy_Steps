/**
 * The world editor's edit file read, merged and written (round 110; docs/WORLD_EDITOR.md). Imports
 * types alone, so `tools/world_edits.mjs` runs it in Node as it is.
 */

import type { PropRef, WorldEdit, WorldEditFile } from './editTypes';

export const EDIT_FORMAT = 'seventy-steps-world-edits';
export const EDIT_VERSION = 1;

/** Centimetres: how a prop's spot is written and matched. */
export const cm = (v: number): number => Math.round(v * 100) / 100;

export const propKey = (r: PropRef): string => `prop|${r.group}|${r.kind}|${r.piece ?? ''}|${cm(r.at[0]).toFixed(2)}|${cm(r.at[1]).toFixed(2)}`;

/** The one key an edit is known by: a later edit of the same thing replaces it. */
export function editKey(e: WorldEdit): string {
  if ('add' in e) return `add|${e.add}`;
  if ('site' in e) return `site|${e.site.site}|${e.site.region}|${e.site.id}`;
  if ('spawn' in e) return `spawn|${e.spawn}`;
  return propKey(e.prop);
}

/** The spawn id of a foe's post an edit added. */
export const addedFoeId = (add: string): string => `edit:${add}`;

/** `later` over `earlier`, by key, in the order first seen. */
export function mergeEdits(earlier: readonly WorldEdit[], later: readonly WorldEdit[]): WorldEdit[] {
  const out = new Map<string, WorldEdit>();
  for (const e of [...earlier, ...later]) out.set(editKey(e), e);
  return [...out.values()];
}

/** Whether `x` reads as an edit file of this format. */
export function isEditFile(x: unknown): x is WorldEditFile {
  const f = x as Partial<WorldEditFile> | null;
  return !!f && f.format === EDIT_FORMAT && typeof f.version === 'number' && f.version <= EDIT_VERSION && Array.isArray(f.edits);
}

/** What an edit is malformed by, or null. */
export function editProblem(e: unknown): string | null {
  const x = e as Record<string, unknown> | null;
  if (!x || typeof x !== 'object') return 'not an object';
  const num = (v: unknown): boolean => typeof v === 'number' && Number.isFinite(v);
  const at = (v: unknown): boolean => Array.isArray(v) && v.length === 2 && v.every(num);
  if ('add' in x) {
    if (typeof x.add !== 'string' || !x.add) return 'an add with no id';
    const spec = (x.prop ?? x.foe) as Record<string, unknown> | undefined;
    if (!spec || !num(spec.x) || !num(spec.z)) return `add ${String(x.add)}: no place`;
    if (x.prop && (typeof x.region !== 'string' || !num(spec.y))) return `add ${String(x.add)}: no region or height`;
    return null;
  }
  if ('site' in x) {
    const s = x.site as Record<string, unknown>;
    return s && typeof s.id === 'string' && typeof s.region === 'string' && at((x.set as Record<string, unknown> | undefined)?.at) ? null : 'a site with no id, region or place';
  }
  if ('spawn' in x) return typeof x.spawn === 'string' && (x.remove === true || typeof x.set === 'object') ? null : 'a spawn edit with nothing to do';
  const r = x.prop as Record<string, unknown> | undefined;
  if (!r || typeof r.group !== 'string' || typeof r.kind !== 'string' || !at(r.at)) return 'a prop edit with no group, kind or spot';
  return x.remove === true || typeof x.set === 'object' ? null : 'a prop edit with nothing to do';
}

/**
 * The committed edits after an export is taken in: the export holds the editor's whole working set,
 * made over the committed keys it names as `base`; a committed edit it did not know of (committed
 * since) is kept, one it knew and left out is gone.
 */
export function takeExport(committed: readonly WorldEdit[], file: WorldEditFile): WorldEdit[] {
  const known = new Set(file.base ?? []);
  const kept = committed.filter((e) => !known.has(editKey(e)) && !file.edits.some((f) => editKey(f) === editKey(e)));
  return mergeEdits(kept, file.edits);
}

const BEGIN = '/* edits:begin */';
const END = '/* edits:end */';

/** The edit file held in data/worldEdits.ts's text. */
export function readDataFile(text: string): WorldEditFile {
  const [a, b] = [text.indexOf(BEGIN), text.indexOf(END)];
  if (a < 0 || b < a) throw new Error('data/worldEdits.ts: no edits:begin / edits:end markers');
  return JSON.parse(text.slice(a + BEGIN.length, b)) as WorldEditFile;
}

/** data/worldEdits.ts's text with `edits` in place of what it held. */
export function writeDataFile(text: string, edits: readonly WorldEdit[]): string {
  const [a, b] = [text.indexOf(BEGIN), text.indexOf(END)];
  const file = { format: EDIT_FORMAT, version: EDIT_VERSION, edits };
  return `${text.slice(0, a + BEGIN.length)} ${JSON.stringify(file, null, 2)} ${text.slice(b)}`;
}

const f2 = (v: number): string => v.toFixed(2);

/** One line for each edit, for a person: what changes, and where. */
export function describeEdit(e: WorldEdit): string {
  if ('add' in e) {
    if ('foe' in e) return `add a foe's post: ${e.foe.entity} in ${e.foe.region} at (${f2(e.foe.x)}, ${f2(e.foe.z)})`;
    return `add ${e.prop.kind}${e.prop.piece ? ` ${e.prop.piece}` : ''} in ${e.region} at (${f2(e.prop.x)}, ${f2(e.prop.z)})`;
  }
  if ('site' in e) return `move the ${e.site.site} ${e.site.id} (${e.site.region}) to [${e.set.at.join(', ')}] in data/sites.ts's metres${e.set.face ? `, facing ${e.set.face}` : ''}`;
  if ('spawn' in e) return 'remove' in e ? `remove the foe's post ${e.spawn}` : `change the foe's post ${e.spawn}: ${JSON.stringify(e.set)}`;
  const what = `${e.prop.kind}${e.prop.piece ? ` ${e.prop.piece}` : ''} of ${e.prop.group} at (${f2(e.prop.at[0])}, ${f2(e.prop.at[1])})`;
  return 'remove' in e ? `remove the ${what}` : `change the ${what}: ${JSON.stringify(e.set)}`;
}
