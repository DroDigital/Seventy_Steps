/**
 * Hints for a new investigator (playtest round 1): the first time each thing comes up — moving, where the story leads, a fight, a wound,
 * a failing mind, an Elder Sign, dropped Echoes, the map, a level within reach, a quest, a boss (and what each asks besides striking: blind
 * Azathoth, Cthulhu's ship, the Dunwich Horror's powder, Ghatanothoa's stone, Shub-Niggurath's roots, Yog-Sothoth's spheres, a colossus's
 * stoop; round 25), insight, a doorway only insight shows (and what spending the insight does to it), a relic, a flask of oil bought, a
 * grab, a hallucination — it is filed. Round 58: it is no longer written on the screen (the box at the lower left, with its
 * black ground, is gone, and with it the line that said where a journey taken up again had led): what has come up is kept in the save, and
 * read in the Journal's Field Guide (ui/fieldGuide.ts) by whoever wants it; a save from before took up what this browser had been told.
 */

import { HINT_KEPT, hintGiven, takeUpBrowser, type HintId } from '../data/fieldGuide';
import type { Entity } from '../core/ecs';
import { moveDef } from '../systems/actions';
import type { Game } from '../systems/components';
import { zonesOf } from '../systems/hurt';
import { canLevel, LEVEL_IDS } from '../systems/levels';
import { watch } from './hintWatch';
import { HINTS_KEY as KEY } from './loreLine';
import { mountUnlocked } from '../systems/mounts';

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

export function createHints(g: Game): Hints {
  const browser = load(); // what this browser was told: before hints were kept in each save, and still what the lore lines go by (loreLine.ts)
  const told = g.overworld?.told;
  if (told) takeUpBrowser(told, browser); // a save from before: its investigator was not told these there, but this browser had been
  const seen = (id: HintId): boolean => !!told && hintGiven(told, id);
  const hint = (id: HintId): void => {
    if (!g.overworld || seen(id)) return;
    for (const one of [id, ...(THEN[id] ? [THEN[id]!] : [])]) {
      told?.add(HINT_KEPT + one);
      browser.add(one);
    }
    try {
      localStorage.setItem(KEY, JSON.stringify([...browser]));
    } catch {
      // No storage: the lore lines lose count of what has come up.
    }
  };
  g.events.on('Hit', (e) => {
    if (e.target === g.player.id && e.damage > 0) hint('fight');
    if (e.target === g.player.id && e.outcome === 'parried') hint('riposte');
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
  return {
    update() {
      if (g.frame - watched < 30) return; // twice a second of the game's own time (not on a frame that is a multiple of 30: a slow picture steps the game in strides that may never land on one)
      watched = g.frame;
      for (const id of watch(g)) hint(id);
      if (mountUnlocked(g)) hint('mount');
    },
  };
}
