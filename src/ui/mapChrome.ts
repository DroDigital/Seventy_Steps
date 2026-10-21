/**
 * What stands about the full map (round 60): its key, drawn with the very figures the map draws (it was a list of type glyphs that
 * were not the ones on the map), its row of keys (each key in a box, each word beside it), the compass, and the hover card that says
 * what a mark is, what it is called and what can be done with it. The map's picture and its choices are mapScreen.ts's.
 */

import { SERIF } from './hudKit';
import { BONE, DIM, drawMark, type MarkKind, type MarkState } from './mapIcons';
import type { Mark } from './mapMarks';
import { el } from './menuKit';

/** The key's rows: a figure and its words (the second line, dim, says what to do with it). */
export const KEY_ROWS: readonly { kind: MarkKind; state?: MarkState; words: string; hint?: string }[] = [
  { kind: 'you', words: 'You' },
  { kind: 'sign', state: { lit: true }, words: 'Elder Sign', hint: 'rest here; click it to travel' },
  { kind: 'sign', words: 'Unlit sign', hint: 'walk up to it to light it' },
  { kind: 'gate', words: 'Gate', hint: 'walk through it' },
  { kind: 'dungeon', words: 'Dungeon' },
  { kind: 'boss', words: "Horror's lair", hint: 'a closed eye: slain' },
  { kind: 'person', state: { met: true }, words: 'Someone you met' },
  { kind: 'echo', words: 'Your lost Echoes', hint: 'walk over them' },
  { kind: 'lead', state: { now: 0 }, words: 'Where the story leads', hint: 'an arrow at the edge points to it' },
  { kind: 'marker', words: 'Your marker', hint: 'right-click, F or Y sets it; the minimap points to it' },
];

const ICON = 26; // CSS pixels a key's figure is drawn in (at the UI's scale)

/** The key, in the panel's lower left; the returned element is shown or hidden as a whole. */
export function buildKey(panel: HTMLElement): HTMLElement {
  const box = el(panel, 'div', '', 'position:absolute;left:16px;bottom:calc(52px * var(--ui, 1));background:#050506d9;padding:8px 12px 6px;border:1px solid #d9d0b822;font-size:calc(11px * var(--ui, 1));line-height:1.25');
  el(box, 'div', 'KEY', `letter-spacing:4px;font-size:calc(9px * var(--ui, 1));color:${DIM};margin-bottom:4px`);
  const dpr = Math.min(3, Math.max(1, globalThis.devicePixelRatio || 1));
  for (const row of KEY_ROWS) {
    const line = el(box, 'div', '', 'display:flex;align-items:center;gap:9px;min-height:calc(26px * var(--ui, 1))');
    const c = document.createElement('canvas');
    [c.width, c.height] = [ICON * 2 * dpr, ICON * 2 * dpr];
    c.style.cssText = 'width:calc(26px * var(--ui, 1));height:calc(26px * var(--ui, 1));flex:none';
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.scale(2 * dpr, 2 * dpr);
      drawMark(ctx, row.kind, ICON / 2, row.kind === 'marker' ? ICON / 2 - 4 : ICON / 2, row.kind === 'person' ? 9 : row.kind === 'marker' ? 6.5 : 8, row.state);
    }
    line.append(c);
    const words = el(line, 'div', row.words, `color:${BONE}`);
    if (row.hint) el(words, 'div', row.hint, `color:${DIM};font-size:calc(9.5px * var(--ui, 1))`);
  }
  return box;
}

/** What each key does, for the keyboard or for the pad: groups of keys and the words beside them. */
export function hintsFor(pad: boolean, mapKey: string): readonly (readonly [readonly string[], string])[] {
  return pad
    ? [[['LT', 'RT'], 'Zoom'], [['Stick'], 'Pan'], [['LB', 'RB'], 'Pick a sign'], [['A'], 'Find me / travel'], [['Y'], 'Marker'], [['B'], 'Close']]
    : [[['Wheel', '+', '−'], 'Zoom'], [['Drag', 'WASD'], 'Pan'], [['C'], 'Find me'], [['Click', 'Tab'], 'Pick a sign'], [['Right-click', 'F'], 'Marker'], [['L'], 'Key'], [[mapKey], 'Close']];
}

/** The row of keys along the bottom edge. */
export function buildHints(panel: HTMLElement, pad: boolean, mapKey: string): void {
  const bar = el(panel, 'div', '', 'position:absolute;left:0;right:0;bottom:0;display:flex;flex-wrap:wrap;justify-content:center;gap:4px 20px;padding:12px 16px 12px;background:linear-gradient(transparent,#050506e6);pointer-events:none');
  for (const [keys, words] of hintsFor(pad, mapKey)) {
    const item = el(bar, 'div', '', 'display:flex;align-items:center;gap:4px;font-size:calc(11px * var(--ui, 1))');
    for (const k of keys) el(item, 'span', k, `border:1px solid ${BONE}55;border-radius:3px;padding:0 5px;font-size:calc(10px * var(--ui, 1));color:${BONE};background:#d9d0b81a;letter-spacing:.5px`);
    el(item, 'span', words, `color:${DIM};margin-left:3px`);
  }
}

/** A compass at (x, y): north is up on this map, and the needle says so. */
export function drawCompass(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(11,10,14,0.7)';
  ctx.strokeStyle = 'rgba(217,208,184,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BONE;
  ctx.beginPath(); // the north arm, long and bright
  ctx.moveTo(0, -r * 0.85);
  ctx.lineTo(r * 0.24, 0);
  ctx.lineTo(-r * 0.24, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(217,208,184,0.4)';
  ctx.beginPath(); // the south arm, short and dim
  ctx.moveTo(0, r * 0.6);
  ctx.lineTo(r * 0.24, 0);
  ctx.lineTo(-r * 0.24, 0);
  ctx.closePath();
  ctx.fill();
  ctx.font = `${Math.round(r * 0.62)}px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = BONE;
  ctx.fillText('N', 0, -r - 3);
  ctx.restore();
}

/** A small cross at (x, y): where the pad's button would set the marker, the pad having no pointer. */
export function drawCrosshair(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(217,208,184,0.7)';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 3;
  ctx.beginPath();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    ctx.moveTo(x + dx * r * 0.35, y + dy * r * 0.35);
    ctx.lineTo(x + dx * r, y + dy * r);
  }
  ctx.stroke();
  ctx.restore();
}

/** The card a hovered mark opens: what it is, what it is called, what can be done with it. At the mark, kept on the screen. */
export function drawTip(ctx: CanvasRenderingContext2D, m: Mark, w: number, h: number, k: number): void {
  const lines: [string, string, string][] = [[m.title.toUpperCase(), `${9.5 * k}px`, DIM]];
  if (m.name) lines.push([m.name, `${14 * k}px`, BONE]);
  if (m.note) lines.push([m.note, `italic ${11 * k}px`, DIM]);
  const pad = 9 * k;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const sized = lines.map(([text, size, colour]) => {
    ctx.font = `${size} ${SERIF}`;
    return { text, size, colour, width: ctx.measureText(text).width + (text === lines[0][0] ? text.length * 1.6 * k : 0) };
  });
  const lineH = (s: string): number => parseFloat(s.replace('italic ', '')) * 1.35;
  const boxW = Math.max(...sized.map((l) => l.width)) + pad * 2;
  const boxH = sized.reduce((a, l) => a + lineH(l.size), 0) + pad * 2 - 2;
  let x = m.x + m.r * 1.2 + 10;
  if (x + boxW > w - 8) x = m.x - m.r * 1.2 - 10 - boxW;
  const y = Math.min(h - boxH - 8, Math.max(8, m.y - boxH / 2));
  ctx.fillStyle = 'rgba(8,8,10,0.94)';
  ctx.strokeStyle = 'rgba(217,208,184,0.3)';
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, boxW, boxH);
  ctx.strokeRect(x + 0.5, y + 0.5, boxW - 1, boxH - 1);
  let cy = y + pad;
  for (const l of sized) {
    ctx.font = `${l.size} ${SERIF}`;
    if (l === sized[0]) ctx.letterSpacing = `${1.6 * k}px`;
    ctx.fillStyle = l.colour;
    ctx.fillText(l.text, x + pad, cy);
    ctx.letterSpacing = '0px';
    cy += lineH(l.size);
  }
  ctx.textBaseline = 'alphabetic';
}
