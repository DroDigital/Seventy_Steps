/**
 * The menus' cursor (round 39): while a menu is open the mouse is let go, and the arrow that comes with it is a
 * browser's, which belongs to no dream. This draws one of the game's own, a slit eye in a turning diamond that
 * lights over what can be pressed, and hides the system's. It is there only while a menu is open and the mouse is
 * free (a talk keeps the mouse captured, so it has none), and gone in the same moment the last menu closes.
 */

import { deviceInUse, onDeviceChange } from '../core/device';
import { ACCENT, BRIGHT } from './menuParts';

const SIZE = 32;
const PRESSABLE = 'button:not(:disabled),input,a,label,[data-hint],[onclick]';

const CSS = `
body.menu-cursor,body.menu-cursor *{cursor:none!important}
#menu-cursor{position:fixed;left:0;top:0;width:${SIZE}px;height:${SIZE}px;margin:${-SIZE / 2}px 0 0 ${-SIZE / 2}px;z-index:100000;pointer-events:none;display:none;will-change:transform;filter:drop-shadow(0 0 3px ${ACCENT}aa) drop-shadow(0 0 8px ${ACCENT}44);transition:filter .15s}
#menu-cursor svg{display:block;transition:transform .16s cubic-bezier(.2,.7,.25,1)}
#menu-cursor .ring{transform-box:fill-box;transform-origin:center;animation:menu-cursor-turn 14s linear infinite;transition:stroke .15s}
#menu-cursor.on svg{transform:scale(1.28)}
#menu-cursor.on{filter:drop-shadow(0 0 4px ${ACCENT}) drop-shadow(0 0 12px ${ACCENT}88)}
#menu-cursor.on .ring{stroke:${BRIGHT}}
#menu-cursor.down svg{transform:scale(.82)}
@keyframes menu-cursor-turn{to{transform:rotate(90deg)}}
@media (prefers-reduced-motion:reduce){#menu-cursor .ring{animation:none}}`;

const ART = `<svg width="${SIZE}" height="${SIZE}" viewBox="-16 -16 32 32" fill="none">
<path class="ring" d="M0-13 13 0 0 13-13 0Z" stroke="${ACCENT}" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M-6.5 0Q0-5.5 6.5 0 0 5.5-6.5 0Z" fill="#0a0810" stroke="${ACCENT}" stroke-width="1"/>
<ellipse rx="1.1" ry="3.3" fill="${BRIGHT}"/>
</svg>`;

let mark: HTMLDivElement | null = null;
let menus = false;
let at = [0, 0]; // where the mouse was last seen (the middle of the window, till it moves)

function sync(): void {
  const on = menus && document.pointerLockElement === null && deviceInUse() === 'keys';
  document.body.classList.toggle('menu-cursor', on);
  if (!mark) return;
  mark.style.display = on ? 'block' : 'none';
  if (on) mark.style.transform = `translate3d(${at[0]}px,${at[1]}px,0)`;
}

/** The menus: one is open, or none is. Said at the moment it happens, so the cursor never outlasts the last. */
export function menuCursor(open: boolean): void {
  menus = open;
  sync();
}

export function installCursor(): void {
  if (mark) return;
  at = [innerWidth / 2, innerHeight / 2];
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);
  mark = document.createElement('div');
  mark.id = 'menu-cursor';
  mark.innerHTML = ART;
  document.body.append(mark);
  addEventListener('pointermove', (e) => {
    at = [e.clientX, e.clientY];
    if (menus && mark) mark.style.transform = `translate3d(${at[0]}px,${at[1]}px,0)`;
    const el = e.target instanceof HTMLElement ? e.target : null;
    mark?.classList.toggle('on', !!el && (!!el.closest(PRESSABLE) || el.style.cursor === 'pointer')); // (the map sets its own pointer over a lit sign)
  }, true);
  addEventListener('pointerdown', () => mark?.classList.add('down'), true);
  addEventListener('pointerup', () => mark?.classList.remove('down'), true);
  document.addEventListener('pointerlockchange', sync);
  onDeviceChange(sync);
}
