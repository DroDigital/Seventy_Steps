/**
 * The ending card (spec §5, Phase 5): when one of the three endings is chosen, its title and closing
 * words fill the screen, and the ending is remembered beyond the save (records.ts). Round 12: then
 * what became of the people met (data/epilogues.ts), the credits rolling, and the dream's numbers
 * (systems/tally.ts), with the choice: walk on in the world, or begin anew — asked first, then a new
 * game with its opening, as the title's New game, or a new journey carrying the investigator's
 * strength (NG+, systems/cycles.ts). Round 17: the title's theme sounds again under it, and its
 * words come out of the dark one after another. Round 20: the ending's cutscene plays first
 * (main.ts opens the card once it is done).
 */

import { ENDINGS, type EndingId } from '../data/endings';
import { fateOf } from '../data/epilogues';
import { NPCS } from '../data/npcs';
import { QUESTS } from '../data/quests';
import { REGIONS } from '../data/regions';
import { NEW_GAME_PLUS } from '../data/tuning';
import type { Game } from '../systems/components';
import { carryOf } from '../systems/cycles';
import { levelsBought } from '../systems/levels';
import { isDone } from '../systems/quests';
import { clearCarry, noteEnding, storeCarry, type Records } from '../systems/records';
import type { SaveStore } from '../systems/save';
import { runCard, savePng } from './keepsake';
import { bossesSlain, playTime } from '../systems/tally';
import { placesOf } from '../world/namedPlaces';
import type { Music } from '../render/audio/music';
import { creditsPage } from './credits';
import { BONE, el, SERIF } from './hudKit';
import { button, createScreen, heading, type Page } from './menuKit';

const BUTTON = `display:inline-block;width:auto;text-align:center;margin:28px 10px 0;padding:6px 16px;font:14px ${SERIF};letter-spacing:2px;color:${BONE};background:#141416;border:1px solid ${BONE}55;cursor:pointer`;

/** One of the card's boxed choices: the lozenge that marks the one chosen stands out in the padding (it stood on the first letter). */
const boxed = (b: HTMLButtonElement): HTMLButtonElement => ((b.style.cssText = BUTTON), (b.dataset.chip = ''), b);

/** Set before a reload: the page opens straight into a new game with its opening (main.ts). */
export const NEW_GAME_FLAG = 'lovecraft-souls-like/new-game';

export interface EndingCard {
  readonly open: boolean;
  /** Opens the card for an ending (main.ts: once its cutscene, render/cinema.ts, is over). */
  show(id: string): void;
}

/** Leaves this dream only if the reload flag can be kept; false leaves the current journey open. */
export function beginAnew(): boolean {
  try {
    sessionStorage.setItem(NEW_GAME_FLAG, '1');
    if (sessionStorage.getItem(NEW_GAME_FLAG) !== '1') throw new Error('New game flag was not saved');
    location.href = location.pathname;
    return true;
  } catch {
    try { sessionStorage.removeItem(NEW_GAME_FLAG); } catch { /* Storage is unavailable. */ }
    return false;
  }
}

/** Brings `nodes` out of the dark one after another. */
function staged(nodes: Element[], first = 300, gap = 1100): void {
  nodes.forEach((n, i) => n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1600, delay: first + i * gap, easing: 'ease-out', fill: 'backwards' }));
}

/** The people met, each with what became of them under this ending. */
function fates(g: Game, id: EndingId): string[] {
  const met = g.overworld?.met ?? new Set<string>();
  return NPCS.filter((n) => met.has(n.id)).flatMap((n) => {
    const quest = n.topics.find((t) => t.starts)?.starts;
    const line = fateOf(n.id, id, !quest || !QUESTS[quest] || isDone(g, quest));
    return line ? [line] : [];
  });
}

/** The dream's numbers, a line each. */
function numbers(g: Game, records: Records): [string, string][] {
  const t = g.overworld!.tally;
  const [slain, of] = bossesSlain(g);
  return [
    ['Journey', String(g.player.cycle + 1)],
    ['Time in the dream', playTime(t.frames)],
    ['Level', String(levelsBought(g) + 1)],
    ['Horrors put down', `${slain} of ${of}`],
    ['Foes killed', String(t.kills)],
    ['Deaths', String(t.deaths)],
    ['Echoes earned', String(t.echoes)],
    ['Places found', `${g.overworld!.places.size} of ${REGIONS.reduce((n, r) => n + placesOf(r.id).length, 0)}`], // round 18
    ['Endings reached', `${records.endings.length} of 3`],
  ];
}

/** `theme` sounds the title's theme (main.ts), from the ending until the investigator walks on. */
export function createEndingCard(g: Game, store: SaveStore | null, theme?: () => Music): EndingCard {
  const screen = createScreen(4, '#050506', `left:50%;top:50%;width:min(640px,90vw);max-height:90vh;overflow-y:auto;box-sizing:border-box;padding:12px;transform:translate(-50%,-50%);text-align:center;font:16px/1.8 ${SERIF}`);
  let music: Music | undefined;
  let noted: Records | null = null; // the ending is remembered when it is chosen, not when the card opens (round 55: a quit during the scene lost it)
  g.events.on('Ending', ({ id }) => {
    if (ENDINGS[id as EndingId]) noted = noteEnding(store, id as EndingId);
  });
  const walkOn = (): void => {
    screen.close();
    music?.fadeOut(4);
    music = undefined;
  };
  const show = (id: string): void => {
    const e = ENDINGS[id as EndingId];
    if (!e || !g.overworld) return;
    music ??= theme?.();
    const records = noted ?? noteEnding(store, id as EndingId);
    const told = fates(g, id as EndingId);
    const goOn = (p: HTMLElement, next: Page): void => void (boxed(button(el('', '', p), 'Go on', () => screen.show(next))));
    const card: Page = {
      build(page) {
        const title = el('font-size:26px;letter-spacing:10px;margin-bottom:26px', e.title, page);
        const lines = el('opacity:.85', '', page);
        for (const line of e.lines) el('margin:6px 0', line, lines);
        goOn(page, told.length ? after : credits);
        staged([title, ...lines.children, page.lastElementChild!], 600, 1500);
      },
    };
    const after: Page = {
      back: () => screen.show(card),
      build(page) {
        heading(page, 'AFTERWARDS');
        const fates = told.map((line) => el('opacity:.8;margin:10px 0;font-size:15px;line-height:1.6', line, page));
        goOn(page, credits);
        staged([...fates, page.lastElementChild!]);
      },
    };
    const credits = creditsPage(() => screen.show(end), 'Go on');
    const nextJourney = Math.min(g.player.cycle + 1, NEW_GAME_PLUS.most) + 1;
    const capped = g.player.cycle >= NEW_GAME_PLUS.most;
    const choice = (parent: HTMLElement, label: string, detail: string, next: Page, prominent = false): void => {
      const b = boxed(button(parent, label, () => screen.show(next)));
      b.style.cssText = `display:block;box-sizing:border-box;width:min(100%,500px);margin:8px auto 0;padding:8px 18px;text-align:left;white-space:normal;font:15px/1.3 ${SERIF};letter-spacing:1px;color:${BONE};background:${prominent ? '#29221c' : '#141416'};border:1px solid ${prominent ? BONE + 'aa' : BONE + '55'};cursor:pointer`;
      el('display:block;margin-top:3px;font-size:12px;letter-spacing:0;line-height:1.35;opacity:.72', detail, b);
    };
    /** Every outcome is confirmed on its own page; returning or cancelling does not take the action. */
    const confirmation = (title: string, details: readonly string[], label: string, act: () => string | void): Page => {
      let error = '';
      const page: Page = {
        back: () => screen.show(end),
        build(panel) {
          heading(panel, title);
          for (const line of details) el('opacity:.8;margin:12px auto;max-width:520px;font-size:14px;line-height:1.55', line, panel);
          if (error) el('color:#e6bdb3;margin:12px auto;max-width:520px;font-size:14px;line-height:1.5', error, panel);
          const buttons = el('', '', panel);
          boxed(button(buttons, 'Cancel', () => screen.show(end)));
          boxed(button(buttons, label, () => {
            const problem = act();
            if (problem) { error = problem; screen.show(page); }
          }));
        },
      };
      return page;
    };
    const storageError = 'Unable to start the new journey because storage is unavailable. Your current journey has not been changed.';
    const saveCard = confirmation('SAVE THE ENDING CARD?', ['Download a PNG with this journey’s ending and numbers.'], 'Save card', () => {
      savePng(runCard(e.title, numbers(g, records)), `dream-${g.player.cycle + 1}-${e.title.toLowerCase().replace(/\W+/g, '-')}`);
      screen.show(end);
    });
    const continueJourney = confirmation('CONTINUE THIS JOURNEY?', ['Return to the current world with your progress as it is.'], 'Continue journey', walkOn);
    const newGamePlus = confirmation('START NEW GAME+?', [
      `${capped ? 'The next journey is at the maximum New Game+ difficulty.' : `Begin journey ${nextJourney}.`} Restart the story with your levels, weapons and upgrades, gun, stones, mind upgrades, Reagent capacity, Echoes and difficulty.`,
      'The world, quests and bosses reset. Previously opened boss entrances, hints, endings and achievements remain. The current save slot and its backup are cleared to begin the new journey.',
    ], 'Start New Game+', () => {
      if (!storeCarry(store, carryOf(g))) return storageError;
      if (beginAnew()) return;
      clearCarry(store);
      return storageError;
    });
    const freshStart = confirmation('START A NEW GAME?', [
      'Begin a fresh first journey without your current character’s levels, equipment or progress. Your ending and achievement records remain.',
      'The current save slot and its backup will be cleared.',
    ], 'Start fresh', () => {
      if (!clearCarry(store) || !beginAnew()) return storageError;
    });
    const end: Page = {
      build(page) {
        el('font-size:18px;letter-spacing:8px;margin-bottom:14px', e.title, page);
        const table = el('display:grid;grid-template-columns:1fr auto;gap:0 24px;max-width:340px;margin:0 auto;text-align:left;font-size:13px;line-height:1.45', '', page);
        for (const [k, v] of numbers(g, records)) (el('opacity:.6', k, table), el('', v, table));
        heading(page, 'WHAT NEXT?');
        const buttons = el('', '', page);
        choice(buttons, `New Game+ · Journey ${nextJourney}`, 'Restart the story while carrying your character’s strength forward.', newGamePlus, true);
        choice(buttons, 'Continue this journey', 'Return to the current world with your progress.', continueJourney);
        choice(buttons, 'New Game · Fresh start', 'Start a first journey without your current character.', freshStart);
        choice(buttons, 'Save the ending card', 'Download this summary as a PNG.', saveCard);
      },
    };
    screen.show(card);
  };
  return {
    show,
    get open() {
      return screen.open;
    },
  };
}
