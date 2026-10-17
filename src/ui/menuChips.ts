/**
 * What a choice says beside its name, made quick to read (round 52): its effects as coloured figures (green for what favours the
 * investigator, red for what costs them), its price as a boxed chip at the row's right (bright if it can be met, red if not, "MAX"
 * once there is no more to buy), and the pinned strip of what they carry (Echoes, insight, star-stones) with the one the open tab spends
 * lit. The Elder Sign's tabs, the relics, the arms and the merchant's wares all say their numbers this way.
 */

import { ACCENT, BRIGHT, INK, el } from './menuParts';

export interface Chip {
  text: string;
  tone?: 'good' | 'bad' | 'dim';
}

/** A row of figures under a choice's name (or, with `style`, on a line of its own). */
export function chips(parent: HTMLElement, list: readonly Chip[], style = ''): void {
  if (!list.length) return;
  const row = el(parent, 'span', '', parent.tagName === 'BUTTON' ? '' : `display:flex;flex-wrap:wrap;gap:0 12px;font-size:12px;${style}`); // (a choice's own row is the style sheet's)
  row.className = 'chips';
  for (const c of list) el(row, 'span', c.text).className = c.tone ?? '';
}

/** The price at the right of a choice: `ok` can be paid, `no` cannot, `max` there is nothing more to buy. */
export function price(b: HTMLElement, text: string, state: 'ok' | 'no' | 'max' = 'ok'): void {
  b.classList.add('priced');
  el(b, 'span', text).className = `cost ${state === 'ok' ? '' : state}`;
}

export interface Resource {
  label: string;
  value: number | string;
  /** The tab open spends it: its figure is lit. */
  hot?: boolean;
}

/** The strip of what is carried, pinned over the page: a small name and a figure, the one spent here bright and underlined. */
export function resources(panel: HTMLElement, list: readonly Resource[], lead = ''): HTMLElement {
  const row = el(panel, 'div', '', 'display:flex;justify-content:center;align-items:baseline;flex-wrap:wrap;gap:2px 20px;margin:-6px 0 12px');
  row.dataset.pin = '';
  if (lead) el(row, 'span', lead, `font-size:10px;letter-spacing:2px;color:${ACCENT}`);
  for (const r of list) {
    const one = el(row, 'span', '', `white-space:nowrap;${r.hot ? '' : 'opacity:.78'}`);
    el(one, 'span', r.label, `margin-right:7px;font-size:10px;letter-spacing:2px;color:${r.hot ? ACCENT : INK}`);
    el(one, 'span', String(r.value), `font-size:${r.hot ? 17 : 15}px;letter-spacing:.5px;color:${r.hot ? BRIGHT : INK};font-variant-numeric:lining-nums tabular-nums;${r.hot ? `border-bottom:1px solid ${ACCENT}` : ''}`);
  }
  return row;
}
