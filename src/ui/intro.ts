/**
 * The new game's opening (playtest round 1; round 39: short cards, a narrator, mist): a telegram and the
 * investigator's notebook, a card at a time out of the mist over black, each read aloud (data/intro.ts), before
 * they wake in the dream. A card turns by itself when its reading is done; E, Enter or Space (pad A) turns it
 * sooner, Esc (pad B) skips to the end. With no recording to hear, a card waits as long as it takes to read.
 * The world waits until it is done (main.ts).
 */

import { INTRO, NARRATOR, introText } from '../data/intro';
import { createSpeech } from '../render/audio/speech';
import type { AudioEngine } from '../render/audio/engine';
import { BONE, TYPEWRITER } from './hudKit';
import { button, createScreen, el, type Page } from './menuKit';
import { keyLayout } from '../core/bindings';
import { glyph } from './glyphs';

export interface Intro {
  readonly open: boolean;
}

const BEFORE = 1.6; // seconds of silence before a card's voice: the words come out of the mist first
const AFTER = 1.4; // and after it, the card is let rest
const READ = 0.34; // seconds a word takes to read, for a card with no voice
const LATE = 3; // a recording that has not begun this many seconds after it was asked for will not

export function showIntro(done: () => void, engine?: AudioEngine): Intro {
  const screen = createScreen(9, '#000'); // the menus' mist skin
  let over = false;
  let timer = 0;
  let rest: (seconds: number) => void = () => undefined; // sets the card's turn, from when its voice begins
  const voice = engine ? createSpeech(engine, undefined, (_s, _t, buf, rate) => rest(buf.duration / rate)) : null;
  const finish = (): void => {
    if (over) return;
    over = true;
    clearTimeout(timer);
    voice?.stop();
    screen.close();
    done();
  };
  const pages = INTRO.map((card, i): Page => {
    const last = i === INTRO.length - 1;
    const turn = (): void => {
      clearTimeout(timer);
      voice?.stop();
      if (last) finish();
      else screen.show(pages[i + 1]);
    };
    return {
      back: finish,
      keys: (e) => void (e.code === keyLayout.interact && !e.repeat && turn()),
      build(p) {
        const telegram = !!card.telegram;
        const heading = el(p, 'div', card.heading, `letter-spacing:2px;font-size:12px;color:${BONE};opacity:.7;margin-bottom:14px`);
        const text = el(p, 'p', introText(card), `font-size:${telegram ? 16 : 18}px;line-height:1.75;margin:0 0 12px;${telegram ? `font-family:${TYPEWRITER};letter-spacing:1px` : ''}`);
        const row = el(p, 'div', '', 'display:flex;justify-content:space-between;align-items:center;margin-top:18px');
        [heading, text, row].forEach((n, k) => n.animate([{ opacity: 0 }, { opacity: n === heading ? 0.7 : 1 }], { duration: 1100, delay: 150 + k * 500, easing: 'ease-out', fill: 'backwards' }));
        el(row, 'div', `${glyph('back')} · skip`, 'opacity:.3;font-size:10px');
        button(row, `${glyph('interact')} · ${last ? 'Wake' : 'Go on'}`, turn).style.cssText = 'width:auto;display:inline-block';
        // The reading: the voice after a breath, the turn after the voice (or after the time it takes to read).
        clearTimeout(timer);
        rest = (seconds) => {
          clearTimeout(timer);
          timer = window.setTimeout(turn, (seconds + AFTER) * 1000);
        };
        const words = introText(card).split(/\s+/).length;
        timer = window.setTimeout(() => {
          voice?.say(NARRATOR, card.say);
          timer = window.setTimeout(() => rest(Math.max(2, words * READ - LATE)), LATE * 1000); // no voice began: read it by eye
        }, BEFORE * 1000);
      },
    };
  });
  screen.show(pages[0]);
  return {
    get open() {
      return screen.open;
    },
  };
}
