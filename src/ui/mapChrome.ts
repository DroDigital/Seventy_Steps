/**
 * What stands about the full map (round 60): its key, drawn with the very figures the map draws (it was a list of type glyphs that
 * were not the ones on the map), its row of keys (each key in a box, each word beside it), the compass, and the hover card that says
 * what a mark is, what it is called and what can be done with it. The map's picture and its choices are mapScreen.ts's.
 * 2026-10-25 ("the large box clutters the view heavily"): the key is a small tab in the lower left, shut until it is asked for (L, the pad's
 * X or a click) and remembered; open, it is two short columns of figure and name, the longer word of what to do with one on a card beside it
 * while the pointer is over it.
 */

import { canvasSerif, SERIF } from './hudKit';
import { BONE, DIM, drawMark, type MarkKind, type MarkState } from './mapIcons';
import type { Mark } from './mapMarks';
import { el } from './menuKit';

/** The key's rows: a figure and its name (the second line, dim, says what to do with it, on a card while the pointer is on the row). Read down the first column, then the second. */
export const KEY_ROWS: readonly { kind: MarkKind; state?: MarkState; words: string; hint?: string }[] = [
  { kind: 'you', words: 'You' },
  { kind: 'sign', state: { lit: true }, words: 'Elder Sign', hint: 'rest here; click it to travel' },
  { kind: 'sign', words: 'Unlit sign', hint: 'walk up to it to light it' },
  { kind: 'gate', words: 'Gate', hint: 'walk through it' },
  { kind: 'dungeon', words: 'Dungeon' },
  { kind: 'boss', words: "Horror's lair", hint: 'a closed eye: slain' },
  { kind: 'person', state: { met: true }, words: 'Someone met' },
  { kind: 'echo', words: 'Lost Echoes', hint: 'walk over them' },
  { kind: 'secret', state: { rumour: true }, words: 'Something strange', hint: 'near ground you have charted' },
  { kind: 'secret', state: { poi: 'tale' }, words: 'Secret found', hint: 'ring, square, triangle, star or cross: a tale, a hoard, a rite, an anomaly or a den' },
  { kind: 'lead', state: { now: 0 }, words: 'Story leads here', hint: 'an arrow at the edge points to it' },
  { kind: 'marker', words: 'Your markers', hint: 'right-click, F or Y sets one, or removes the one it is on; the minimap points to each' },
];

const ICON = 24; // CSS pixels a key's figure is drawn in (at the UI's scale)
const OPEN_KEY = 'lovecraft-souls-like/map-key';

/** Whether the key was left open the last time the map was used (shut where nothing was kept). */
export function keyOpenPref(): boolean {
  try {
    return localStorage.getItem(OPEN_KEY) === '1';
  } catch {
    return false; // a profile that refuses storage: the key stays shut, as it does at the first opening
  }
}

export function rememberKeyOpen(open: boolean): void {
  try {
    localStorage.setItem(OPEN_KEY, open ? '1' : '0');
  } catch {
    // (kept for this opening only)
  }
}

export interface KeyPanel {
  toggle(): void;
  /** Whether `target` is part of the key: the pointer there is on the key, not on the map beneath it. */
  holds(target: EventTarget | null): boolean;
}

/**
 * The key, in the panel's lower left: its tab (always shown) and, open, its two columns. `remember` is told each time it is opened or shut;
 * `pad` names the pad's button on the tab, not the key's.
 */
export function buildKey(panel: HTMLElement, startOpen: boolean, remember: (open: boolean) => void, pad: boolean): KeyPanel {
  const ui = 'var(--ui, 1)';
  const root = el(panel, 'div', '', `position:absolute;left:16px;bottom:calc(52px * ${ui});font-size:calc(11px * ${ui});line-height:1.2;user-select:none`);
  root.addEventListener('contextmenu', (e) => e.preventDefault());
  const tip = el(root, 'div', '', `display:none;position:absolute;left:calc(100% + 8px);width:max-content;max-width:calc(280px * ${ui});padding:6px 10px;background:#050506f2;border:1px solid #d9d0b833;color:${DIM};font-style:italic;font-size:calc(10.5px * ${ui});line-height:1.35;pointer-events:none;z-index:1`);
  const body = el(root, 'div', '', `display:none;grid-auto-flow:column;grid-template-rows:repeat(${KEY_ROWS.length / 2},auto);gap:0 16px;margin-bottom:4px;padding:5px 10px;background:linear-gradient(160deg,#0d0c11ee,#050506e0);border:1px solid #d9d0b83a;border-top-color:#d9d0b866;box-shadow:0 3px 14px #000b`);
  const dpr = Math.min(3, Math.max(1, globalThis.devicePixelRatio || 1));
  for (const row of KEY_ROWS) {
    const line = el(body, 'div', '', `display:flex;align-items:center;gap:6px;height:calc(26px * ${ui});padding:0 4px;border-radius:2px`);
    const c = document.createElement('canvas');
    [c.width, c.height] = [ICON * 2 * dpr, ICON * 2 * dpr];
    c.style.cssText = `width:calc(${ICON}px * ${ui});height:calc(${ICON}px * ${ui});flex:none`;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.scale(2 * dpr, 2 * dpr);
      const pin = row.kind === 'marker'; // the pin's point, not its head, is its place: set the head high so the whole stands in the box
      drawMark(ctx, row.kind, ICON / 2, pin ? ICON / 2 - 2.5 : ICON / 2, pin ? 6 : row.kind === 'person' ? 8.5 : row.kind === 'place' || row.kind === 'secret' ? 9 : 7.5, row.state);
    }
    line.append(c);
    el(line, 'div', row.words, `color:${BONE};white-space:nowrap`);
    line.addEventListener('mouseenter', () => {
      line.style.background = '#d9d0b814';
      tip.textContent = row.hint ?? '';
      tip.style.top = `${body.offsetTop + line.offsetTop}px`; // beside its row, so it is never above the screen's edge
      tip.style.display = row.hint ? 'block' : 'none';
    });
    line.addEventListener('mouseleave', () => {
      line.style.background = '';
      tip.style.display = 'none';
    });
  }
  const tab = el(root, 'div', '', `display:inline-flex;align-items:center;gap:7px;height:calc(24px * ${ui});padding:0 9px;background:#050506d0;border:1px solid #d9d0b833;cursor:pointer`);
  tab.setAttribute('role', 'button');
  el(tab, 'span', 'KEY', `pointer-events:none;letter-spacing:3px;font-size:calc(9px * ${ui});color:${DIM}`);
  el(tab, 'span', pad ? 'X' : 'L', `pointer-events:none;border:1px solid ${BONE}55;border-radius:3px;padding:0 5px;font-size:calc(10px * ${ui});color:${BONE};background:#d9d0b81a`);
  const caret = el(tab, 'span', '', `pointer-events:none;font-family:${SERIF};font-size:calc(7px * ${ui});color:${DIM}`);
  let open = false;
  const set = (value: boolean): void => {
    open = value;
    body.style.display = open ? 'grid' : 'none';
    caret.textContent = open ? '\u25BC' : '\u25B2';
    tab.setAttribute('aria-expanded', String(open));
    if (!open) tip.style.display = 'none';
  };
  const toggle = (): void => {
    set(!open);
    remember(open);
  };
  tab.addEventListener('click', toggle);
  set(startOpen);
  return { toggle, holds: (target) => target instanceof Node && root.contains(target) };
}

/** What each key does, for the keyboard or for the pad: groups of keys and the words beside them. */
export function hintsFor(pad: boolean, mapKey: string): readonly (readonly [readonly string[], string])[] {
  return pad
    ? [[['LT', 'RT'], 'Zoom'], [['Stick'], 'Pan'], [['D-pad'], 'Pick a sign'], [['A'], 'Choose / travel'], [['LB', 'RB'], 'Next sign'], [['Y'], 'Marker / remove'], [['X'], 'Key'], [['B'], 'Close']]
    : [[['Wheel', '+', '−'], 'Zoom'], [['Drag', 'WASD'], 'Pan'], [['C'], 'Find me'], [['Click', 'Tab'], 'Pick a sign'], [['Right-click', 'F'], 'Marker / remove'], [['Del'], 'Clear markers'], [['L'], 'Key'], [[mapKey], 'Close']];
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
  ctx.font = `${Math.round(r * 0.62)}px ${canvasSerif()}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = BONE;
  ctx.fillText('N', 0, -r - 3);
  ctx.restore();
}

/** A small cross at (x, y): where the pad sets a marker, and where a lit sign under it is chosen. */
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
    ctx.font = `${size} ${canvasSerif()}`;
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
    ctx.font = `${l.size} ${canvasSerif()}`;
    if (l === sized[0]) ctx.letterSpacing = `${1.6 * k}px`;
    ctx.fillStyle = l.colour;
    ctx.fillText(l.text, x + pad, cy);
    ctx.letterSpacing = '0px';
    cy += lineH(l.size);
  }
  ctx.textBaseline = 'alphabetic';
}
