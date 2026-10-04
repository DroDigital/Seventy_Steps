/**
 * The menus' cursor (round 39): while a menu is open the mouse is let go, and the arrow that comes with it is a
 * browser's, which belongs to no dream. This draws one of the game's own, a mote of lantern light with three
 * smaller motes in orbit about it and a wisp of fading light trailing the hand, and hides the system's. The
 * point of it is the middle of the mote. It swells over what can be pressed and bursts softly on a click. It is
 * there only while a menu is open and the mouse is free (a talk keeps the mouse captured, so it has none), and
 * gone in the same moment the last menu closes.
 */

import { deviceInUse, onDeviceChange } from '../core/device';

const SIZE = 40;
const GOLD = '#e9c97a';
const PALE = '#fff4cf';
const PRESSABLE = 'button:not(:disabled),input,a,label,[data-hint],[onclick]';
const WISP = 14; // dots in the trail
const SAMPLE_MS = 16;

const CSS = `
body.menu-cursor,body.menu-cursor *{cursor:none!important}
#menu-cursor{position:fixed;left:0;top:0;width:${SIZE}px;height:${SIZE}px;margin:${-SIZE / 2}px 0 0 ${-SIZE / 2}px;z-index:100001;pointer-events:none;display:none;will-change:transform}
#menu-cursor svg{display:block;overflow:visible}
#menu-cursor .core{transition:r .16s}
#menu-cursor .halo{transition:r .16s,opacity .16s}
#menu-cursor .m{transition:cx .2s cubic-bezier(.2,.7,.25,1)}
#menu-cursor .burst{opacity:0;transition:opacity .3s,r .3s}
#menu-cursor.on .core{r:4.6}
#menu-cursor.on .halo{r:14;opacity:.8}
#menu-cursor.on .m1{cx:8}#menu-cursor.on .m2{cx:6}#menu-cursor.on .m3{cx:10}
#menu-cursor.down .burst{opacity:.9;r:17}
#menu-cursor.down .core{r:2}
#menu-trail{position:fixed;left:0;top:0;z-index:100000;pointer-events:none;display:none}
#menu-trail i{position:absolute;left:0;top:0;width:7px;height:7px;margin:-3.5px;border-radius:50%;background:radial-gradient(${PALE},${GOLD} 55%,transparent 72%);will-change:transform,opacity}`;

/** Three motes in orbit about the middle, at their own radii and paces (turned by SMIL about the origin, where the mote is), and the mote itself. */
const art = (still: boolean): string => {
  const orbit = (cls: string, r: number, size: number, colour: string, dur: number, dir: 1 | -1, phase: number): string =>
    `<g><circle class="m ${cls}" cx="${r}" cy="0" r="${size}" fill="${colour}"/>${still ? '' : `<animateTransform attributeName="transform" type="rotate" from="${phase}" to="${phase + 360 * dir}" dur="${dur}s" repeatCount="indefinite"/>`}</g>`;
  return `<svg width="${SIZE}" height="${SIZE}" viewBox="-20 -20 40 40" fill="none">
<defs><radialGradient id="menu-cursor-glow"><stop offset="0" stop-color="${PALE}"/><stop offset=".35" stop-color="${GOLD}"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient></defs>
<circle class="burst" r="6" stroke="${GOLD}" stroke-width=".9"/>
<g class="all"><g>${still ? '' : '<animate attributeName="opacity" values="1;.6;1" dur="3.2s" repeatCount="indefinite"/>'}<circle class="halo" r="11" fill="url(#menu-cursor-glow)" opacity=".55"/></g><circle class="core" r="3.2" fill="${PALE}"/>
${orbit('m1', 9, 1.1, GOLD, 3.2, 1, 0)}${orbit('m2', 7, 0.9, '#cbb8ee', 4.6, -1, 120)}${orbit('m3', 12, 0.8, GOLD, 6.4, 1, 240)}</g>
</svg>`;
};

let mark: HTMLDivElement | null = null;
let wisp: HTMLElement | null = null;
let menus = false;
let at = [0, 0]; // where the mouse was last seen (the middle of the window, till it moves)
let moved = false; // whether the hand has moved since a menu was opened: till it has, no cursor (round 39: it sat in the middle of the opening's words, where nobody had put it)
const trail: number[][] = []; // where the hand has been, newest first
let frame = 0;
let lastSample = 0;

/** The wisp: dots at where the hand was, each smaller and fainter the longer ago; at rest they gather under the mote and are not seen. */
function wisps(now: number): void {
  frame = requestAnimationFrame(wisps);
  if (now - lastSample >= SAMPLE_MS) {
    lastSample = now;
    trail.unshift([at[0], at[1]]);
    trail.length = Math.min(trail.length, WISP);
  }
  const dots = wisp!.children;
  for (let i = 0; i < dots.length; i++) {
    const d = dots[i] as HTMLElement;
    const p = trail[Math.min(i + 1, trail.length - 1)] ?? at;
    const k = 1 - (i + 1) / (WISP + 1);
    d.style.transform = `translate3d(${p[0]}px,${p[1]}px,0) scale(${k})`;
    d.style.opacity = String(k * 0.55);
  }
}

function sync(): void {
  const on = menus && document.pointerLockElement === null && deviceInUse() === 'keys';
  document.body.classList.toggle('menu-cursor', on); // (the system's arrow is hidden all the same: it is ours or none)
  if (!mark || !wisp) return;
  mark.style.display = on && moved ? 'block' : 'none';
  wisp.style.display = on && moved ? 'block' : 'none';
  if (on) {
    mark.style.transform = `translate3d(${at[0]}px,${at[1]}px,0)`;
    trail.length = 0; // (no wisp from where it was last time)
    if (!frame && !matchMedia('(prefers-reduced-motion: reduce)').matches) frame = requestAnimationFrame(wisps);
  } else if (frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  }
}

/** The menus: one is open, or none is. Said at the moment it happens, so the cursor never outlasts the last. */
export function menuCursor(open: boolean): void {
  if (open && !menus) moved = false;
  menus = open;
  sync();
}

export function installCursor(): void {
  if (mark) return;
  at = [innerWidth / 2, innerHeight / 2];
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  wisp = document.createElement('div');
  wisp.id = 'menu-trail';
  for (let i = 0; i < WISP; i++) wisp.append(document.createElement('i'));
  mark = document.createElement('div');
  mark.id = 'menu-cursor';
  mark.innerHTML = art(reduced);
  document.body.append(wisp, mark);
  addEventListener('pointermove', (e) => {
    at = [e.clientX, e.clientY];
    if (!moved && menus && (e.movementX || e.movementY)) {
      moved = true;
      sync();
    }
    if (menus && mark) mark.style.transform = `translate3d(${at[0]}px,${at[1]}px,0)`;
    const el = e.target instanceof HTMLElement ? e.target : null;
    mark?.classList.toggle('on', !!el && (!!el.closest(PRESSABLE) || el.style.cursor === 'pointer')); // (the map sets its own pointer over a lit sign)
  }, true);
  addEventListener('pointerdown', () => mark?.classList.add('down'), true);
  addEventListener('pointerup', () => mark?.classList.remove('down'), true);
  document.addEventListener('pointerlockchange', sync);
  onDeviceChange(sync);
}
