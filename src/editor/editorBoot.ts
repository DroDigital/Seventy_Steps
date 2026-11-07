/**
 * The world editor's working set, kept in this browser between loads (round 110, development builds
 * only): put in force before the world is laid, so a load shows (and plays) what is being edited.
 */

import { WORLD_EDITS } from '../data/worldEdits';
import { editKey, isEditFile, takeExport } from '../world/edits/editFile';
import { setActiveEdits } from '../world/edits/editStore';
import type { WorldEdit, WorldEditFile } from '../world/edits/editTypes';

const KEY = 'seventy-steps.worldEdits.working';

/** The working set: the committed edits, with the ones kept in this browser laid over them. */
export function loadWorking(): WorldEdit[] {
  try {
    const raw = localStorage.getItem(KEY);
    const kept: unknown = raw ? JSON.parse(raw) : null;
    if (isEditFile(kept)) return takeExport(WORLD_EDITS.edits, kept);
  } catch {
    // (no storage, or a set that will not read: the committed edits alone)
  }
  return [...WORLD_EDITS.edits];
}

export function saveWorking(list: readonly WorldEdit[]): void {
  const file: WorldEditFile = { format: 'seventy-steps-world-edits', version: 1, base: WORLD_EDITS.edits.map(editKey), edits: [...list] };
  try {
    localStorage.setItem(KEY, JSON.stringify(file));
  } catch {
    // (no storage: the set lives until the page is left)
  }
}

export function clearWorking(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // (no storage)
  }
}

/** Puts the working set in force; returns how many edits differ from the committed ones. */
export function bootEdits(): number {
  const list = loadWorking();
  setActiveEdits(list);
  const committed = new Set(WORLD_EDITS.edits.map((e) => JSON.stringify(e)));
  return list.filter((e) => !committed.has(JSON.stringify(e))).length + WORLD_EDITS.edits.filter((e) => !list.some((x) => editKey(x) === editKey(e))).length;
}
