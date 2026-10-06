/**
 * The new game's opening (playtest round 1; round 39: short cards, a narrator, mist): a telegram and the
 * investigator's notebook, a card at a time out of the mist over black, each read aloud (data/intro.ts), before
 * they wake in the dream. A card's words gather out of ash (ui/ashFx.ts), the narrator reads them, and they blow
 * away as ash before the next comes back; the last goes, and then the mist itself. A card turns by itself when its reading is done;
 * E, Enter or Space (pad A) turns it sooner, Esc (pad B) skips to the end. With no recording to hear, a card waits
 * as long as it takes to read. One page throughout, its place never moving: the cards are its own to change (a
 * page change would drift the old words away over the new). The world waits until it is done (main.ts).
 */

import { INTRO, NARRATOR, introText } from '../data/intro';
import { createSpeech } from '../render/audio/speech';
import type { AudioEngine } from '../render/audio/engine';
import { createAshCard, type AshCard } from './ashCard';
import { createScreen, el, muteMenus, type Page } from './menuKit';
import { keyLayout } from '../core/bindings';
import { PAD_BUTTON } from '../core/padMap';
import { glyph } from './glyphs';

export interface Intro {
  readonly open: boolean;
}

const BEFORE = 2.2; // seconds from a card's first grain returning to its voice: the words gather out of the ash first
const AFTER = 1.6; // and after the voice, the card is let rest
const READ = 0.34; // seconds a word takes to read, for a card with no voice
const LATE = 3; // a recording that has not begun this many seconds after it was asked for will not
const IN = 2400; // ms for a card's words to come back out of the ash
const OUT = 2200; // ms for them to blow away
const GAP = 400; // ms of mist alone between one card and the next
const CLOSE = 1800; // ms for the mist to fade to black after the last card (a skip: half of it)
const PAD_A = PAD_BUTTON.a;

export function showIntro(done: () => void, engine?: AudioEngine): Intro {
  muteMenus(true); // the opening has its theme and its narrator: the menus' sounds are not heard through it
  const screen = createScreen(9, '#000'); // the menus' mist skin
  let i = 0;
  let over = false;
  let turning = false;
  let timer = 0;
  let stage: HTMLElement | null = null;
  let hint: HTMLElement | null = null;
  let row: HTMLElement | null = null;
  let ash: AshCard | null = null; // the card on the stage, drawn on a canvas (ui/ashCard.ts)
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
      screen.close(true);
      muteMenus(false);
      screen.root.getAnimations().forEach((a) => a.cancel());
      done();
    });
  };

  /** Card `i`'s words on the stage (coming back out of the ash, or whole at once when the page is only drawn again). */
  function show(fade: boolean): void {
    if (!stage || !hint) return;
    const c = INTRO[i];
    stage.replaceChildren();
    ash = createAshCard(stage, { heading: c.heading, body: introText(c), telegram: !!c.telegram }, i + 1);
    if (fade) void ash.form(IN);
    else ash.hold();
    hint.textContent = `${glyph('interact')} · ${i < INTRO.length - 1 ? 'go on' : 'wake'}`;
  }

  /** Card `i`, its lines coming out of the mist one after another, and its reading after a breath. */
  function card(): void {
    if (!stage) return;
    const c = INTRO[i];
    show(true);
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

  /** The card's words blow away as ash; then the next comes back out of it, or the end. */
  function turn(): void {
    if (over || turning || !stage || !ash) return;
    turning = true;
    clearTimeout(timer);
    voice?.stop();
    const last = i === INTRO.length - 1;
    const fading = last && row ? [row.animate([{ opacity: getComputedStyle(row).opacity }, { opacity: 0 }], { duration: OUT, easing: 'ease-in', fill: 'forwards' }).finished.catch(() => undefined)] : [];
    void Promise.all([ash.dissolve(OUT), ...fading]).then(() => {
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
