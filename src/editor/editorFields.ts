/**
 * The world editor's fields for what is held (round 110, development builds only): a prop's place,
 * turn, size, look, flame and seed; a foe's post and creature; a site's place and facing. Each change
 * is handed on as the patch it makes.
 */

import type { Dir } from '../data/dungeons';
import { HOUSE_STYLES } from './editorKinds';
import { ROSTER_IDS } from '../data/roster';
import type { LightKind } from '../data/tuning';
import type { LookPatch, PropPatch, SpawnPatch } from '../world/edits/editTypes';
import type { Item } from './editorItems';

export type FieldPatch = { prop: PropPatch } | { foe: SpawnPatch } | { site: { x?: number; z?: number; face?: Dir } };

const LIGHTS: readonly (LightKind | '')[] = ['', 'lamp', 'fire', 'torch', 'window', 'sigil'];
const DEG = 180 / Math.PI;
const r2 = (v: number): string => (Math.round(v * 100) / 100).toString();

export const CSS = 'display:grid;grid-template-columns:5.5em 1fr;gap:3px 6px;align-items:center;margin:6px 0';
const INPUT = 'background:#1b1b20;color:#e8e2d0;border:1px solid #444;border-radius:3px;padding:2px 4px;font:12px monospace;min-width:0';

export function row(box: HTMLElement, label: string, input: HTMLElement): void {
  const l = document.createElement('label');
  l.textContent = label;
  input.style.cssText = INPUT;
  box.append(l, input);
}

export function numberField(box: HTMLElement, label: string, value: number, change: (v: number) => void, step = 0.1): void {
  const i = Object.assign(document.createElement('input'), { type: 'number', step: String(step), value: r2(value) });
  i.addEventListener('change', () => Number.isFinite(i.valueAsNumber) && change(i.valueAsNumber));
  row(box, label, i);
}

export function selectField<T extends string>(box: HTMLElement, label: string, options: readonly T[], value: T, change: (v: T) => void): void {
  const s = document.createElement('select');
  for (const o of options) s.append(Object.assign(document.createElement('option'), { value: o, textContent: o || '(none)', selected: o === value }));
  s.addEventListener('change', () => change(s.value as T));
  row(box, label, s);
}

const hex = (c: readonly number[]): string => `#${c.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('')}`;
const unhex = (s: string): [number, number, number] => [1, 3, 5].map((i) => Math.round((parseInt(s.slice(i, i + 2), 16) / 255) * 1000) / 1000) as [number, number, number];

/** The fields of what is held into `box`. */
export function fieldsOf(box: HTMLElement, it: Item, patch: (p: FieldPatch) => void): void {
  const grid = document.createElement('div');
  grid.style.cssText = CSS;
  box.append(grid);
  if (it.type === 'foe') {
    const s = it.spawn;
    selectField(grid, 'creature', [...ROSTER_IDS].sort(), s.entity, (entity) => patch({ foe: { entity } }));
    numberField(grid, 'x', s.at.x, (x) => patch({ foe: { x } }));
    numberField(grid, 'z', s.at.z, (z) => patch({ foe: { z } }));
    numberField(grid, 'yaw °', s.at.yaw * DEG, (v) => patch({ foe: { yaw: v / DEG } }), 5);
    return;
  }
  if (it.type === 'site') {
    numberField(grid, 'x', it.x, (x) => patch({ site: { x } }));
    numberField(grid, 'z', it.z, (z) => patch({ site: { z } }));
    if (it.face) selectField<Dir>(grid, 'faces', ['n', 'e', 's', 'w'], it.face, (face) => patch({ site: { face } }));
    return;
  }
  const p = it.prop;
  numberField(grid, 'x', p.x, (x) => patch({ prop: { x } }));
  numberField(grid, 'y', p.y, (y) => patch({ prop: { y } }));
  numberField(grid, 'z', p.z, (z) => patch({ prop: { z } }));
  numberField(grid, 'yaw °', p.yaw * DEG, (v) => patch({ prop: { yaw: v / DEG } }), 5);
  numberField(grid, 'w', p.w, (w) => patch({ prop: { w } }), 0.05);
  numberField(grid, 'd', p.d, (d) => patch({ prop: { d } }), 0.05);
  numberField(grid, 'h', p.h, (h) => patch({ prop: { h } }), 0.1);
  if (p.kind === 'house') selectField(grid, 'style', HOUSE_STYLES, p.style ?? 'clapboard', (style) => patch({ prop: { style } }));
  if (p.set) {
    const set = p.set;
    const scale = set.scale ?? 1;
    numberField(grid, 'scale', scale, (v) => v > 0 && patch({ prop: { w: (p.w * v) / scale, d: (p.d * v) / scale, h: (p.h * v) / scale, look: { scale: v } } }), 0.05);
    const tint = Object.assign(document.createElement('input'), { type: 'color', value: hex(set.tint ?? [0.5, 0.5, 0.5]) });
    tint.addEventListener('change', () => patch({ prop: { look: { tint: unhex(tint.value) } } }));
    row(grid, set.tint ? 'tint' : 'tint (none)', tint);
    selectField(grid, 'flame', LIGHTS, set.lit ?? '', (v) => patch({ prop: { look: { lit: (v || null) as LookPatch['lit'] } } }));
    const walk = Object.assign(document.createElement('input'), { type: 'checkbox', checked: !!set.walk });
    walk.addEventListener('change', () => patch({ prop: { look: { walk: walk.checked } } }));
    row(grid, 'walk over', walk);
  }
  const seed = document.createElement('button');
  seed.textContent = `seed ${p.seed} · new`;
  seed.addEventListener('click', () => patch({ prop: { seed: Math.floor(Math.random() * 1e6) } }));
  row(grid, 'look', seed);
}
