/**
 * Hints for a new investigator (playtest round 1): a line at the upper left the first time each
 * thing comes up — moving, where the story leads, a fight, a wound, a failing mind, an Elder Sign, dropped Echoes, the map,
 * a level within reach, a quest, a boss (and what each asks besides striking: blind Azathoth, Cthulhu's ship, the Dunwich Horror's powder, Ghatanothoa's stone, Shub-Niggurath's roots, Yog-Sothoth's spheres, a colossus's stoop; round 25), insight, a doorway only insight shows (and what spending the insight does to it), a relic, a flask of oil bought, a grab, a hallucination — then never again in that save. What has been told is kept in the save, and read again in the Journal's Field Guide (ui/fieldGuide.ts); a save from before took up what this browser had been told.
 * Round 14: a journey taken up again from a save first says where the story had led (the lead's line).
 */

import { t } from '../core/i18n';
import { HINT_KEPT, hintGiven, takeUpBrowser, type HintId } from '../data/fieldGuide';
import type { Key } from '../data/lang';
import type { Entity } from '../core/ecs';
import { moveDef } from '../systems/actions';
import type { Game } from '../systems/components';
import { zonesOf } from '../systems/hurt';
import { mainLead } from '../systems/lead';
import { canLevel, LEVEL_IDS } from '../systems/levels';
import { fill } from './glyphs';
import { watch } from './hintWatch';
import { BONE, el, setStyle, setText } from './hudKit';
import { HINTS_KEY as KEY } from './loreLine';

const SHOW_MS = 9000; // the least a hint stays, however short
const READ_MS = 60; // a character's worth of reading, for the long ones (they stay until the last word can be read)

/** A hint that is followed at once by another: a passage shown by insight, then what spending the insight does to it. */
const THEN: Readonly<Partial<Record<string, HintId>>> = { passage: 'passageCost' };

/** What a boss asks of the investigator besides striking (round 25: only Azathoth's was said before the fight). */
const BOSS_HINTS: Readonly<Record<string, HintId>> = { azathoth: 'blind', cthulhu: 'ship', dunwich_horror: 'powder', ghatanothoa: 'cover', shub_niggurath: 'roots', yog_sothoth: 'spheres' };

/** The hints that belong to a boss that has just been engaged: its own mechanic's, and the colossi's stooping. */
export function bossHints(g: Game, boss: Entity): HintId[] {
  const own = BOSS_HINTS[g.ecs.c.fight.get(boss)?.id ?? ''];
  return [...(own ? [own] : []), ...(zonesOf(g, boss)?.some((z) => z.weak) ? (['stoop'] as const) : [])];
}

export interface Hints {
  update(): void;
}

function load(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

export function createHints(g: Game, root: HTMLElement): Hints {
  const box = el(`position:absolute;left:16px;top:16px;max-width:360px;font-size:11px;line-height:1.5;padding:6px 10px;background:#050506b0;border-left:2px solid ${BONE}66;opacity:0;transition:opacity .6s`, '', root);
  const browser = load(); // what this browser was told: before hints were kept in each save, and still what the lore lines go by (loreLine.ts)
  const told = g.overworld?.told;
  if (told) takeUpBrowser(told, browser); // a save from before: its investigator was not told these there, but this browser had been
  const seen = (id: HintId): boolean => !!told && hintGiven(told, id);
  const queue: HintId[] = [];
  let until = 0;
  const hint = (id: HintId, urgent = false): void => {
    if (!g.overworld || seen(id) || queue.includes(id)) return;
    const then = THEN[id];
    const both = then && !seen(then) && !queue.includes(then) ? [id, then] : [id];
    if (urgent) queue.unshift(...both); // a hint for what is happening now goes before those waiting
    else queue.push(...both);
  };
  g.events.on('Hit', (e) => {
    if (e.target === g.player.id && e.damage > 0) hint('fight');
    if (e.target === g.player.id && e.outcome === 'parried') hint('riposte', true);
    const by = g.ecs.c.actor.get(e.attacker);
    if (e.target === g.player.id && by && moveDef(by)?.hit?.unblockable) hint('grab');
    if (e.target === g.player.id && g.ecs.c.phantom.has(e.attacker)) hint('phantom');
    const h = g.ecs.c.health.get(g.player.id);
    if (e.target === g.player.id && h && h.hp < h.max * 0.6) hint('hurt');
  });
  g.events.on('Shot', (e) => e.shooter === g.player.id && hint('gun'));
  g.events.on('DryFire', () => hint('gun'));
  g.events.on('SanityBandChanged', (e) => (hint('mind'), e.to === 'unmoored' && hint('unmoored')));
  g.events.on('Vanished', (e) => e.struck && hint('phantom'));
  g.events.on('Discovered', () => hint('sign'));
  g.events.on('CandleLit', () => hint('candle'));
  g.events.on('Echoes', (e) => {
    if (e.change === 'dropped') hint('echoes');
    if (e.change === 'spent' && g.player.oil > 0) hint('oil');
    if ((e.change === 'earned' || e.change === 'recovered') && LEVEL_IDS.some((id) => canLevel(g, id))) hint('level');
  });
  g.events.on('RegionEntered', () => hint('map'));
  g.events.on('QuestChanged', () => hint('quest'));
  g.events.on('BossEngaged', (e) => {
    hint('boss');
    for (const id of bossHints(g, e.entity)) hint(id);
  });
  g.events.on('InsightChanged', (e) => e.change > 0 && e.cause !== 'load' && hint('insight'));
  hint('move');
  hint('lead');
  let watched = -Infinity;
  let recap = g.overworld && g.overworld.quests.size > 0 ? mainLead(g)?.text : undefined; // a journey taken up again
  return {
    update() {
      if (g.frame - watched >= 30) { // twice a second of the game's own time (not on a frame that is a multiple of 30: a slow picture steps the game in strides that may never land on one)
        watched = g.frame;
        for (const id of watch(g)) hint(id, true);
      }
      const now = performance.now();
      if (now < until) return;
      setStyle(box, 'opacity', '0');
      if (recap && g.frame > 30) { // once the veil has lifted and the world moves
        setText(box, `Where you left off: ${recap}`);
        [recap, until] = [undefined, now + SHOW_MS];
        return setStyle(box, 'opacity', '1');
      }
      const next = queue.shift();
      if (!next) return;
      told?.add(HINT_KEPT + next);
      browser.add(next);
      try {
        localStorage.setItem(KEY, JSON.stringify([...browser]));
      } catch {
        // No storage: the lore lines lose count of what has come up.
      }
      const words = fill(t(`hint.${next}` as Key)); // the buttons of the device in hand
      setText(box, words);
      setStyle(box, 'opacity', '1');
      until = now + Math.max(SHOW_MS, words.length * READ_MS);
    },
  };
}
