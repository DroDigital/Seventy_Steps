/**
 * The first steps' card (round 102, ui/firstSteps.ts): at the lower left, a small head and a row for each control it teaches, the
 * button for the device in hand boxed as a key, the words beside it; a row done is ticked and dimmed. It comes in and goes with a fade.
 * Drawn only when what it says changes.
 */

import { t } from '../core/i18n';
import type { Key } from '../data/lang';
import { glyph } from './glyphs';
import { BONE, el, GOLD, LEAF, setStyle } from './hudKit';
import { TIP_ROWS, type TipView } from './firstSteps';

/** 'the mouse', 'the left stick': a key's face begins with a capital. */
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

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
      const key = view ? `${view.id}|${view.rows.join()}|${view.rows.map((_, i) => glyph(TIP_ROWS[view.id][i].act)).join()}` : '';
      setStyle(card, 'opacity', view ? '1' : '0');
      card.style.transform = view ? 'none' : 'translateY(6px)';
      if (!view || key === drawn) return;
      drawn = key;
      head.textContent = t(`tip.head.${view.id}` as Key);
      list.textContent = '';
      TIP_ROWS[view.id].forEach((row, i) => {
        const done = view.rows[i];
        const line = el(`display:flex;align-items:center;gap:9px;margin-top:3px;opacity:${done ? '.5' : '1'};transition:opacity .3s`, '', list);
        el(`flex:none;min-width:16px;padding:1px 6px;border:1px solid ${BONE}99;border-radius:3px;background:#0008;font-size:11px;letter-spacing:1px;text-align:center;line-height:1.35`, cap(glyph(row.act)), line);
        el('font-size:13px', t(row.label), line);
        if (done) el(`color:${LEAF};font-size:13px`, '✓', line);
      });
    },
  };
}
