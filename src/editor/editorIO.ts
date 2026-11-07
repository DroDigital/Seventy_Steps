/**
 * The world editor's file (round 110, development builds only): downloaded, copied as text, or
 * opened again to go on with it.
 */

import { isEditFile } from '../world/edits/editFile';
import type { WorldEdit, WorldEditFile } from '../world/edits/editTypes';
import { exportFile } from './editorSession';

const stamp = (): string => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');

export function download(list: readonly WorldEdit[], committed: readonly WorldEdit[], note: string): void {
  const text = JSON.stringify(exportFile(list, committed, note), null, 2);
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([text], { type: 'application/json' })), download: `world-edits-${stamp()}.json` });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const copyText = (list: readonly WorldEdit[], committed: readonly WorldEdit[], note: string): Promise<void> => navigator.clipboard.writeText(JSON.stringify(exportFile(list, committed, note)));

/** The edit file a picked file holds, or why not. */
export async function openFile(file: File): Promise<WorldEditFile | string> {
  try {
    const f: unknown = JSON.parse(await file.text());
    return isEditFile(f) ? f : 'not a world edit file';
  } catch {
    return 'the file will not read';
  }
}
