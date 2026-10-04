/**
 * The new game's opening (playtest round 1; round 39: short cards, a narrator, mist): a telegram and the
 * investigator's notebook, a card at a time out of the mist over black, each read aloud (data/intro.ts), before
 * they wake in the dream. A card's words fade in out of the mist, the narrator reads them, and they fade out again
 * before the next comes; the last fades away with the mist itself. A card turns by itself when its reading is done;
 * E, Enter or Space (pad A) turns it sooner, Esc (pad B) skips to the end. With no recording to hear, a card waits
 * as long as it takes to read. One page throughout, its place never moving: the cards are its own to change (a
 * page change would drift the old words away over the new). The world waits until it is done (main.ts).
 */

import { INTRO, NARRATOR, introText } from '../data/intro';
import { createSpeech } from '../render/audio/speech';
import type { AudioEngine } from '../render/audio/engine';
import { BONE, TYPEWRITER } from './hudKit';
import { createScreen, el, type Page } from './menuKit';
import { keyLayout } from '../core/bindings';
import { glyph } from './glyphs';

export interface Intro {
  readonly open: boolean;
}

const BEFORE = 2; // seconds from a card's first word showing to its voice: the words come out of the mist first
const AFTER = 1.6; // and after the voice, the card is let rest
const READ = 0.34; // seconds a word takes to read, for a card with no voice
const LATE = 3; // a recording that has not begun this many seconds after it was asked for will not
const IN = 1600; // ms for a line to come out of the mist
const OUT = 1300; // ms for a card's words to sink back into it
const GAP = 450; // ms of mist alone between one card and the next
const CLOSE = 1800; // ms for the mist to fade to black after the last card (a skip: half of it)
const PAD_A = 0;

export function showIntro(done: () => void, engine?: AudioEngine): Intro {
  const screen = createScreen(9, '#000'); // the menus' mist skin
  let i = 0;
  let over = false;
  let turning = false;
  let timer = 0;
  let stage: HTMLElement | null = null;
  let hint: HTMLElement | null = null;
  let row: HTMLElement | null = null;
  let padWas = false;
  let rest: (seconds: number) => void = () => undefined; // sets the card's turn, from when its voice begins
  const voice = engine ? createSpeech(engine, undefined, (_s, _t, buf, rate) => rest(buf.duration / rate)) : null;
  const later = (ms: number, fn: () => void): void => void (timer = window.setTimeout(fn, ms));

  /** The mist and all fade to black, and the world is let in. */
  const finish = (skipped: boolean): void => {
    if (over) return;
    over = true;
    clearTimeout(timer);
    voice?.stop();
    const ms = skipped ? CLOSE / 2 : CLOSE;
    screen.root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: 'ease-in-out', fill: 'forwards' }).finished.catch(() => undefined).then(() => {
      screen.close();
      screen.root.getAnimations().forEach((a) => a.cancel());
      done();
    });
  };

  /** Card `i`'s words on the stage (faded in out of the mist, or at once when the page is only drawn again). */
  function show(fade: boolean): void {
    if (!stage || !hint) return;
    const c = INTRO[i];
    const telegram = !!c.telegram;
    stage.replaceChildren();
    const heading = el(stage, 'div', c.heading, `letter-spacing:2px;font-size:12px;color:${BONE};opacity:.7;margin-bottom:16px`);
    const text = el(stage, 'p', introText(c), `margin:0;font-size:${telegram ? 16 : 18}px;line-height:1.75;${telegram ? `font-family:${TYPEWRITER};letter-spacing:1px` : ''}`);
    if (fade) [heading, text].forEach((n, k) => n.animate([{ opacity: 0, filter: 'blur(3px)', transform: 'translateY(5px)' }, { opacity: n === heading ? 0.7 : 1, filter: 'blur(0)', transform: 'none' }], { duration: IN, delay: k * 550, easing: 'cubic-bezier(.25,.6,.3,1)', fill: 'backwards' }));
    hint.textContent = `${glyph('interact')} · ${i < INTRO.length - 1 ? 'go on' : 'wake'}`;
  }

  /** Card `i`, its lines coming out of the mist one after another, and its reading after a breath. */
  function card(): void {
    if (!stage) return;
    const c = INTRO[i];
    show(true);
    screen.stir();
    turning = false;
    rest = (seconds) => {
      clearTimeout(timer);
      later((seconds + AFTER) * 1000, turn);
    };
    const words = introText(c).split(/\s+/).length;
    later(BEFORE * 1000, () => {
      voice?.say(NARRATOR, c.say);
      later(LATE * 1000, () => rest(Math.max(2, words * READ - LATE))); // no voice began: read it by eye
    });
  }

  /** The card's words sink back into the mist; then the next, or the end. */
  function turn(): void {
    if (over || turning || !stage) return;
    turning = true;
    screen.stir(); // the mist gathers as the words sink into it
    clearTimeout(timer);
    voice?.stop();
    const last = i === INTRO.length - 1;
    const fading = [...stage.children, ...(last && row ? [row] : [])].map((n) => (n as HTMLElement).animate([{ opacity: getComputedStyle(n).opacity, filter: 'blur(0)', transform: 'none' }, { opacity: 0, filter: 'blur(3px)', transform: 'translateY(-4px)' }], { duration: OUT, easing: 'ease-in', fill: 'forwards' }));
    void Promise.all(fading.map((a) => a.finished.catch(() => undefined))).then(() => {
      if (over) return;
      if (last) return finish(false); // the words gone first, then the mist (the loading under it is not seen through the last of them)
      i++;
      later(GAP, card);
    });
  }

  const page: Page = {
    back: () => finish(true),
    keys: (e) => void (e.type === 'keydown' && !e.repeat && (e.code === keyLayout.interact || e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') && turn()),
    pad: (p) => {
      const down = !!p.buttons[PAD_A]?.pressed;
      if (down && !padWas) turn();
      padWas = down;
    },
    build(p) {
      const again = stage !== null; // drawn again (the player took up the other device: its buttons are named): the card stays where it is in its reading
      // A stage of one height for every card, so nothing moves as they change: the heading always where it was.
      stage = el(p, 'div', '', 'height:13.5em;display:flex;flex-direction:column;justify-content:flex-start');
      // the keys, in the screen's two lower corners (on the root, not the panel: the panel is the words' own)
      screen.root.querySelector('[data-keys]')?.remove();
      row = document.createElement('div');
      row.dataset.keys = '';
      row.style.cssText = 'position:absolute;left:28px;right:28px;bottom:22px;display:flex;justify-content:space-between;align-items:center;font-size:12px;letter-spacing:2px;opacity:0';
      screen.root.append(row);
      if (again) row.style.opacity = '0.4';
      else row.animate([{ opacity: 0 }, { opacity: 0.4 }], { duration: 2400, delay: 1800, fill: 'forwards' }); // what the keys do, faint, once the first words are out
      el(row, 'div', `${glyph('back')} · skip`);
      hint = el(row, 'div', '');
      hint.style.cursor = 'pointer';
      hint.addEventListener('click', turn);
      if (!again) card();
      else if (!turning) show(false);
    },
  };
  screen.show(page);
  return {
    get open() {
      return screen.open;
    },
  };
}
