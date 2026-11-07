/**
 * The world editor's panel (round 110, development builds only): the keys, what is held and its
 * fields, what can be added, the edits made, and the file they go out in.
 */

import { ROSTER_IDS } from '../data/roster';
import type { PropKind } from '../data/regions';
import { describeEdit, editKey } from '../world/edits/editFile';
import type { WorldEdit } from '../world/edits/editTypes';
import type { Item } from './editorItems';
import { fieldsOf, row, selectField, CSS, type FieldPatch } from './editorFields';
import { ADD_KINDS, LIGHT_PRESETS, PIECES } from './editorKinds';

export interface PanelHooks {
  patch(p: FieldPatch): void;
  remove(): void;
  duplicate(): void;
  revert(): void;
  focus(): void;
  addProp(kind: PropKind, piece?: string, preset?: string): void;
  addFoe(entity: string): void;
  revertKey(key: string): void;
  focusKey(key: string): void;
  exportFile(note: string): void;
  copy(note: string): void;
  importFile(file: File): void;
  reload(): void;
  discard(): void;
  close(): void;
}

export interface EditorPanel {
  readonly root: HTMLElement;
  show(on: boolean): void;
  /** Draws what is held (null: nothing), the edits and the status line again. */
  update(held: Item | null, edits: readonly WorldEdit[], fresh: ReadonlySet<string>, status: string): void;
}

const HELP =
  'Click: take hold · Right drag: look, with W A S D Q E (Shift: faster, wheel: pace) · G move (X, Z: along one axis) · R turn · S size · H raise · ' +
  'Ctrl: snap · Click or Enter: keep · Esc or right click: undo the move · Del: remove · Ctrl+D: copy · F: frame · Ctrl+Z / Ctrl+Y · F8: leave';

function button(box: HTMLElement, text: string, click: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.textContent = text;
  b.style.cssText = 'background:#2a2a32;color:#e8e2d0;border:1px solid #555;border-radius:3px;padding:3px 8px;margin:2px 4px 2px 0;font:12px sans-serif;cursor:pointer';
  b.addEventListener('click', click);
  box.append(b);
  return b;
}

const section = (root: HTMLElement, title: string): HTMLElement => {
  const s = document.createElement('div');
  s.style.cssText = 'border-top:1px solid #333;padding:6px 0';
  const h = document.createElement('div');
  h.textContent = title;
  h.style.cssText = 'font-weight:bold;letter-spacing:.05em;margin-bottom:4px;color:#d9c48a';
  s.append(h);
  root.append(s);
  return s;
};

export function createEditorPanel(hooks: PanelHooks): EditorPanel {
  const root = document.createElement('div');
  root.style.cssText = 'position:fixed;top:8px;right:8px;bottom:8px;width:330px;overflow:auto;z-index:9000;background:#0d0d10ee;color:#e8e2d0;font:12px sans-serif;padding:8px 10px;border:1px solid #444;border-radius:4px;display:none;cursor:default';
  const head = document.createElement('div');
  head.style.cssText = 'display:flex;justify-content:space-between;align-items:center';
  head.innerHTML = '<b style="font-size:14px">World editor</b>';
  button(head, 'Leave (F8)', hooks.close);
  const status = document.createElement('div');
  status.style.cssText = 'opacity:.8;margin:4px 0';
  const help = document.createElement('div');
  help.textContent = HELP;
  help.style.cssText = 'opacity:.55;font-size:11px;margin-bottom:6px';
  root.append(head, status, help);

  const heldBox = section(root, 'Held');
  const held = document.createElement('div');
  heldBox.append(held);

  const add = section(root, 'Add (at the middle of the view)');
  const addGrid = document.createElement('div');
  addGrid.style.cssText = CSS;
  add.append(addGrid);
  let [kind, piece, light, foe] = [ADD_KINDS[0] as PropKind, PIECES[0] ?? '', LIGHT_PRESETS[0]?.name ?? '', ROSTER_IDS[0] ?? ''];
  selectField(addGrid, 'prop', ADD_KINDS, kind, (v) => (kind = v));
  const pieceInput = Object.assign(document.createElement('input'), { value: piece, placeholder: 'set piece id' });
  const list = Object.assign(document.createElement('datalist'), { id: 'editor-pieces' });
  for (const p of PIECES) list.append(Object.assign(document.createElement('option'), { value: p }));
  pieceInput.setAttribute('list', list.id);
  pieceInput.addEventListener('change', () => (piece = pieceInput.value.trim()));
  row(addGrid, 'set piece', pieceInput);
  add.append(list);
  selectField(addGrid, 'light', LIGHT_PRESETS.map((l) => l.name), light, (v) => (light = v));
  selectField(addGrid, 'foe', [...ROSTER_IDS].sort(), foe, (v) => (foe = v));
  button(add, 'Prop', () => hooks.addProp(kind));
  button(add, 'Set piece', () => hooks.addProp('set', piece));
  button(add, 'Light', () => hooks.addProp('set', undefined, light));
  button(add, "Foe's post", () => hooks.addFoe(foe));

  const fileBox = section(root, 'Send');
  const note = Object.assign(document.createElement('textarea'), { placeholder: 'A note for the change (optional): what you want, in your words', rows: 3 });
  note.style.cssText = 'width:100%;box-sizing:border-box;background:#1b1b20;color:#e8e2d0;border:1px solid #444;font:12px sans-serif';
  fileBox.append(note);
  button(fileBox, 'Download file', () => hooks.exportFile(note.value));
  button(fileBox, 'Copy as text', () => hooks.copy(note.value));
  const pick = Object.assign(document.createElement('input'), { type: 'file', accept: '.json,application/json' });
  pick.style.display = 'none';
  pick.addEventListener('change', () => pick.files?.[0] && hooks.importFile(pick.files[0]));
  fileBox.append(pick);
  button(fileBox, 'Open file…', () => pick.click());
  button(fileBox, 'Reload world', hooks.reload);
  button(fileBox, 'Discard all', hooks.discard);

  const editsBox = section(root, 'Edits');
  const edits = document.createElement('div');
  editsBox.append(edits);

  return {
    root,
    show(on) {
      root.style.display = on ? 'block' : 'none';
    },
    update(it, list, fresh, line) {
      status.textContent = line;
      held.replaceChildren();
      if (!it) held.append(Object.assign(document.createElement('div'), { textContent: 'Nothing. Click something in the world.', style: 'opacity:.6' }));
      else {
        const what = it.type === 'prop' ? `${it.prop.kind}${it.prop.set ? ` · ${it.prop.set.id}` : ''} · ${it.group}` : it.type === 'foe' ? `foe's post · ${it.spawn.id}` : `${it.ref.site} · ${it.ref.id} · ${it.ref.region} [${it.at.join(', ')}]`;
        held.append(Object.assign(document.createElement('div'), { textContent: what, style: 'font-family:monospace;word-break:break-all' }));
        fieldsOf(held, it, hooks.patch);
        if (it.type !== 'site') button(held, 'Remove', hooks.remove);
        if (it.type !== 'site') button(held, 'Copy', hooks.duplicate);
        button(held, 'Revert', hooks.revert);
        button(held, 'Frame', hooks.focus);
      }
      edits.replaceChildren();
      if (!list.length) edits.append(Object.assign(document.createElement('div'), { textContent: 'None yet.', style: 'opacity:.6' }));
      for (const e of [...list].reverse()) {
        const k = editKey(e);
        const line = document.createElement('div');
        line.style.cssText = `display:flex;gap:4px;align-items:flex-start;margin:2px 0;${fresh.has(k) ? '' : 'opacity:.55'}`;
        const text = Object.assign(document.createElement('span'), { textContent: describeEdit(e) });
        text.style.cssText = 'flex:1;cursor:pointer;font-size:11px;word-break:break-word';
        text.addEventListener('click', () => hooks.focusKey(k));
        const x = document.createElement('button');
        x.textContent = '×';
        x.title = 'Revert';
        x.style.cssText = 'background:none;color:#e88;border:none;cursor:pointer';
        x.addEventListener('click', () => hooks.revertKey(k));
        line.append(text, x);
        edits.append(line);
      }
    },
  };
}
