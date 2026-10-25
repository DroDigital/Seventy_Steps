/**
 * The great words (playtest round 14: a death, a horror's fall and a region's name were small
 * monospace lines, and a death's were gone under the veil within a second): drawn in the period face
 * across a dark band that fades in while the words slowly widen, as soulslikes mark their moments.
 * A death's words stand above the veil (z 9), so they stay while the dark falls; the others sit
 * under the menus. Round 80: a realm's name, a place's and the night's hours are inked in a letter at
 * a time (ui/inkTitle.ts); a realm met for the first time is tinted toward its own colour, with a
 * hairline drawn out beneath it and an epigraph a beat after; a card of lower rank waits for one
 * of higher (a place found does not cut a realm's name short, an hour's turn cuts nothing).
 */

import { captionSize } from './captions';
import { CARD, HOUR, INK, readSeconds } from '../data/uiMood';
import { BONE, SERIF } from './hudKit';
import { inkLetters, inkSeed, playIn, playOut } from './inkTitle';

export type Tone = 'death' | 'victory' | 'place' | 'realm' | 'hour';

export interface Banner {
  show(text: string, tone: Tone, sub?: string, line?: string, tint?: string): void; // `line`: a sentence read under it (a horror's epitaph, a realm's epigraph); `tint`: the colour of a realm's name
  hide(): void;
}

interface Look {
  color: string;
  size: number; // px at UI scale 1
  top: number; // % of the screen's height
  hold: number; // seconds shown before it fades (Infinity: until hidden)
  band: number; // the dark band's strength
  rise: number; // ms to fade in
  z: number;
  ink?: boolean; // the words are inked in a letter at a time
  space?: readonly [from: number, to: number]; // em of space between the letters, at the card's rise and at its end (the words slowly widen)
  rank: number; // a card waits for one of higher rank
}

const LOOK: Record<Tone, Look> = {
  death: { color: '#9b2a20', size: 56, top: 44, hold: Infinity, band: 0.85, rise: 1500, z: 9, rank: 4 },
  victory: { color: '#c9a45c', size: 42, top: 40, hold: 5, band: 0.75, rise: 900, z: 2, rank: 3 },
  realm: { color: BONE, size: 38, top: 22, hold: CARD.realmHold, band: 0.55, rise: 900, z: 2, ink: true, space: [0.12, 0.2], rank: 2 },
  place: { color: BONE, size: 30, top: 20, hold: 2.6, band: 0.45, rise: 700, z: 2, ink: true, rank: 1 },
  hour: { color: BONE, size: 22, top: 14, hold: HOUR.hold, band: 0, rise: 1400, z: 2, ink: true, rank: 0 },
};
const FADE_MS = 1200; // a card's fade at its end
const FIT = 22; // a name of more letters than this is set a little smaller, so the longest of the realms' fits between the minimap and the vitals

type Args = Parameters<Banner['show']>;

export function createBanner(): Banner {
  const root = document.createElement('div');
  root.style.cssText = `position:fixed;left:0;right:0;pointer-events:none;text-align:center;opacity:0;font-family:${SERIF};padding:calc(14px * var(--ui, 1)) 0`;
  const words = document.createElement('div');
  words.style.cssText = 'text-shadow:0 0 14px #000,0 0 4px #000;white-space:nowrap';
  const rule = document.createElement('div'); // a realm's hairline (round 80), drawn out from the middle
  rule.style.cssText = `height:1px;margin:calc(11px * var(--ui, 1)) auto 0;width:min(calc(${INK.rule.width}px * var(--ui, 1)), 70vw);display:none`;
  const sub = document.createElement('div');
  sub.style.cssText = `font-size:calc(13px * var(--ui, 1));letter-spacing:.32em;color:${BONE};opacity:.7;margin-top:calc(6px * var(--ui, 1))`;
  const said = document.createElement('div');
  said.style.cssText = `font-size:${captionSize(15, true)};font-style:italic;color:${BONE};opacity:.8;max-width:min(720px,86vw);margin:calc(10px * var(--ui, 1)) auto 0;line-height:1.5;text-shadow:0 0 8px #000,0 0 3px #000`;
  root.append(words, rule, sub, said);
  document.body.append(root);
  let anims: Animation[] = [];
  let ink: Animation[] = [];
  let letters: HTMLSpanElement[] = [];
  let seed = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let flushTimer: ReturnType<typeof setTimeout> | undefined;
  let current: Tone | null = null;
  let liveUntil = 0; // when the card up now begins to fade (performance.now() ms)
  let waiting: Args | null = null; // a card of lower rank kept back until the one up has gone

  const hide = (): void => {
    clearTimeout(timer);
    liveUntil = 0;
    const from = Number(getComputedStyle(root).opacity) || 0;
    if (from <= 0) return;
    anims.push(root.animate([{ opacity: from }, { opacity: 0 }], { duration: FADE_MS, easing: 'ease-in', fill: 'forwards' }));
    if (letters.length) ink.push(...playOut(letters, seed));
  };

  const flush = (): void => {
    const next = waiting;
    waiting = null;
    if (next) self.show(...next);
  };

  const self: Banner = {
    show(text, tone, under = '', line = '', tint) {
      const L = LOOK[tone];
      const now = performance.now();
      if (current && now < liveUntil && L.rank < LOOK[current].rank) { // a card of higher rank is up: this one waits for it, as the latest of those waiting
        if (!waiting || L.rank >= LOOK[waiting[1]].rank) waiting = [text, tone, under, line, tint];
        clearTimeout(flushTimer);
        flushTimer = setTimeout(flush, liveUntil - now + FADE_MS + 100);
        return;
      }
      clearTimeout(timer);
      clearTimeout(flushTimer);
      if (L.rank >= 3) waiting = null; // (a death or a fall leaves nothing waiting)
      for (const a of [...anims, ...ink]) a.cancel();
      ink = [];
      const hold = tone === 'realm' && !line ? CARD.realmHold - 1.2 : tone === 'realm' ? Math.max(L.hold, INK.epigraph.delay + INK.epigraph.rise + readSeconds(line)) : L.hold; // (a realm's epigraph is kept up as long as it takes to read)
      current = tone;
      liveUntil = Number.isFinite(hold) ? now + hold * 1000 : Infinity;
      if (waiting && Number.isFinite(hold)) flushTimer = setTimeout(flush, hold * 1000 + FADE_MS + 100); // a card kept back for the one this replaces is still owed its turn
      if (L.ink) {
        seed = inkSeed(text);
        letters = inkLetters(words, text);
        ink = playIn(letters, seed);
      } else {
        letters = [];
        words.textContent = text;
      }
      sub.textContent = under;
      sub.style.display = under ? 'block' : 'none';
      said.textContent = line;
      said.style.display = line ? 'block' : 'none';
      const colour = tint && L.rank < 3 ? tint : L.color; // (a death's and a fall's words keep their own)
      rule.style.display = tone === 'realm' ? 'block' : 'none';
      rule.style.background = `linear-gradient(90deg,#0000,${colour},#0000)`;
      Object.assign(root.style, { top: `${L.top}%`, zIndex: String(L.z), transform: 'translateY(-50%)' });
      root.style.background = L.band > 0 ? `linear-gradient(90deg,#0000,#000${Math.round(L.band * 15).toString(16)} 22%,#000${Math.round(L.band * 15).toString(16)} 78%,#0000)` : 'none';
      const fit = L.ink ? Math.min(1, FIT / Math.max(1, text.length)) : 1;
      Object.assign(words.style, { color: colour, fontSize: `calc(${(L.size * fit).toFixed(1)}px * var(--ui, 1))` });
      const life = (Number.isFinite(L.hold) ? hold + 2 : 8) * 1000;
      anims = [
        root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: L.rise, easing: 'ease-out', fill: 'forwards' }),
        words.animate([{ transform: 'scale(0.97)', letterSpacing: `${L.space?.[0] ?? 0.26}em` }, { transform: 'scale(1.03)', letterSpacing: `${L.space?.[1] ?? 0.4}em` }], { duration: life, easing: 'linear', fill: 'forwards' }),
      ];
      if (tone === 'realm') {
        anims.push(rule.animate([{ transform: 'scaleX(0)', opacity: 0 }, { transform: 'scaleX(1)', opacity: 0.85 }], { duration: INK.rule.draw * 1000, delay: INK.rule.delay * 1000, easing: 'ease-out', fill: 'both' }));
        if (line) anims.push(said.animate([{ opacity: 0 }, { opacity: 0.8 }], { duration: INK.epigraph.rise * 1000, delay: INK.epigraph.delay * 1000, fill: 'both' }));
      }
      if (Number.isFinite(hold)) timer = setTimeout(hide, hold * 1000);
    },
    hide,
  };
  return self;
}
