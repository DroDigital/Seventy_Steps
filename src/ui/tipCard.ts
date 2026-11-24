/**
 * The first steps' card (round 102, ui/firstSteps.ts): at the lower left, a small head and a row for each control it teaches, the
 * button for the device in hand boxed as a key, the words beside it; a row done is ticked and dimmed. It comes in and goes with a fade.
 * Drawn only when what it says changes.
 */

import { deviceInUse } from '../core/device';
import { localeId, t } from '../core/i18n';
import type { Key } from '../data/lang';
import { glyph } from './glyphs';
import { BONE, el, GOLD, LEAF, setStyle } from './hudKit';
import { TIP_ROWS, type TipView } from './firstSteps';

/** 'the mouse', 'the left stick': a key's face begins with a capital. */
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
/** Strips a leading article for compact mouse keycap labels ('the mouse' → 'Mouse'). */
const shortMouse = (s: string): string => cap(s.replace(/^(the|die|la|el)\s+/i, ''));

function mouseIcon(): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '10');
  svg.setAttribute('height', '13');
  svg.setAttribute('viewBox', '0 0 10 13');
  svg.style.cssText = 'display:block;flex:none';
  const body = document.createElementNS(ns, 'rect');
  body.setAttribute('x', '1');
  body.setAttribute('y', '1');
  body.setAttribute('width', '8');
  body.setAttribute('height', '11');
  body.setAttribute('rx', '4');
  body.setAttribute('fill', 'none');
  body.setAttribute('stroke', BONE);
  body.setAttribute('stroke-width', '1.15');
  const wheel = document.createElementNS(ns, 'line');
  wheel.setAttribute('x1', '5');
  wheel.setAttribute('y1', '3');
  wheel.setAttribute('x2', '5');
  wheel.setAttribute('y2', '5.8');
  wheel.setAttribute('stroke', GOLD);
  wheel.setAttribute('stroke-width', '1.3');
  wheel.setAttribute('stroke-linecap', 'round');
  svg.append(body, wheel);
  return svg;
}

/** What the card shows, as one string: the card, its ticks, the buttons in hand and the language (a change of any redraws it). */
export const cardKey = (view: TipView | null): string =>
  view ? `${localeId()}|${view.id}|${view.rows.join()}|${TIP_ROWS[view.id].map((row) => glyph(row.act)).join()}` : '';

export interface TipCard {
  show(view: TipView | null): void;
}

export function createTipCard(parent: HTMLElement): TipCard {
  const card = el(`position:absolute;left:18px;bottom:58px;min-width:190px;max-width:320px;padding:8px 14px 9px 12px;border-left:1px solid ${GOLD}aa;background:linear-gradient(90deg,#0b0a09b0,#0b0a0960 70%,#0b0a0900);opacity:0;transform:translateY(6px);transition:opacity .45s,transform .45s`, '', parent);
  card.setAttribute('role', 'status');
  card.setAttribute('aria-live', 'polite');
  const head = el(`font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${GOLD};margin-bottom:5px`, '', card);
  const list = el('', '', card);
  let drawn = '';
  return {
    show(view) {
      const key = cardKey(view);
      setStyle(card, 'opacity', view ? '1' : '0');
      card.style.transform = view ? 'none' : 'translateY(6px)';
      if (!view || key === drawn) return;
      drawn = key;
      head.textContent = t(`tip.head.${view.id}` as Key);
      list.textContent = '';
      TIP_ROWS[view.id].forEach((row, i) => {
        const done = view.rows[i];
        const line = el(`display:flex;align-items:center;gap:9px;margin-top:3px;opacity:${done ? '.5' : '1'};transition:opacity .3s`, '', list);
        const capEl = el(`flex:none;display:inline-flex;align-items:center;justify-content:center;gap:4px;min-width:16px;padding:1px 6px;border:1px solid ${BONE}99;border-radius:3px;background:#0008;font-size:11px;letter-spacing:1px;text-align:center;line-height:1.35`, '', line);
        if (row.act === 'look' && deviceInUse() !== 'pad') {
          capEl.append(mouseIcon(), document.createTextNode(shortMouse(glyph(row.act))));
        } else {
          capEl.textContent = cap(glyph(row.act));
        }
        el('font-size:13px', t(row.label), line);
        if (done) el(`color:${LEAF};font-size:13px`, '✓', line);
      });
    },
  };
}
