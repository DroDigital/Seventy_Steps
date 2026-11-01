/**
 * First steps (round 102, asked): the core controls written on the screen as the waking investigator first needs each, not in a list
 * before play. Walking and looking at once, on waking; running once they are walking; the light and the heavy blow when a foe first
 * closes in; the roll when one is near and swinging (or once the blows are learned); West's Reagent when the body is first badly hurt;
 * calling the chariot on open ground once running is learned. One card at a time, its rows ticked off as each is done; a card done is
 * kept in the save (`tip:<id>` in `ow.told`) and never shown again. A save loaded that had already been told the Field Guide's hint a
 * card teaches (`move`, `fight`, `hurt`, `mount`), before it kept its cards (`tips:kept`), is not shown it. Pure: the game is read, only `told` is written (ui/tipCard.ts draws it).
 */

import { distXZ } from '../core/geom';
import { FIRST_STEPS as F } from '../data/tuning';
import { hintGiven, type HintId } from '../data/fieldGuide';
import type { Key } from '../data/lang';
import { moveDef } from '../systems/actions';
import { isAbsent, type Game } from '../systems/components';
import { mountBar } from '../systems/mounts';
import type { Act } from './glyphs';

export type TipId = 'walk' | 'run' | 'strike' | 'dodge' | 'heal' | 'mount';
export const TIP_IDS: readonly TipId[] = ['walk', 'run', 'strike', 'dodge', 'heal', 'mount'];
/** What the save holds once a card is done. */
export const TIP_KEPT = 'tip:';
/** What a world that keeps its cards in the save holds from the first look (a save from before has not: it goes by the hints it was given). */
export const TIPS_KEPT = 'tips:kept';

export interface TipRow {
  act: Act;
  label: Key;
}
export const TIP_ROWS: Readonly<Record<TipId, readonly TipRow[]>> = {
  walk: [{ act: 'move', label: 'tip.walk.move' }, { act: 'look', label: 'tip.walk.look' }],
  run: [{ act: 'dodge', label: 'tip.run.hold' }],
  strike: [{ act: 'light', label: 'tip.strike.light' }, { act: 'heavy', label: 'tip.strike.heavy' }],
  dodge: [{ act: 'dodge', label: 'tip.dodge.roll' }],
  heal: [{ act: 'heal', label: 'tip.heal.inject' }],
  mount: [{ act: 'mount', label: 'tip.mount.call' }],
};

/** The Field Guide hint whose having been given, in a save loaded, means the card need not be shown. */
const KNOWN: Readonly<Record<TipId, HintId>> = { walk: 'move', run: 'move', strike: 'fight', dodge: 'fight', heal: 'hurt', mount: 'mount' };
/** Most urgent first: a wound before a blow coming, a blow coming before striking, and the open road's lessons last. */
const URGENCY: readonly TipId[] = ['heal', 'dodge', 'strike', 'run', 'walk', 'mount'];

export interface Steps {
  rows: Set<string>; // `<tip>:<row>` done, this session or before
  skip: Set<TipId>; // told before this session began
  shown: TipId | null;
  since: number; // frame the card shown came up
  lapsed: number; // frame its reason to be shown went (or Infinity while it holds)
  doneAt: Partial<Record<TipId, number>>; // frame each card was finished
  walked: number;
  turned: number;
  sprint: number;
  last: { x: number; z: number; yaw: number; frame: number } | null;
}

export function createSteps(g: Game): Steps {
  const told = g.overworld?.told;
  const before = !!told && !told.has(TIPS_KEPT); // a new game, or a save from before the cards: its hints say what it already knows
  const skip = new Set<TipId>(TIP_IDS.filter((id) => !!told && (told.has(TIP_KEPT + id) || (before && hintGiven(told, KNOWN[id])))));
  told?.add(TIPS_KEPT);
  return { rows: new Set(), skip, shown: null, since: 0, lapsed: Infinity, doneAt: {}, walked: 0, turned: 0, sprint: 0, last: null };
}

/** Whether a foe is closing on the investigator within `r` metres (and, with `swinging`, has a blow under way). */
function foeNear(g: Game, me: { x: number; z: number }, r: number, swinging = false): boolean {
  const c = g.ecs.c;
  for (const [id, br] of c.brain) {
    if (br.target !== g.player.id || br.state !== 'engage' || isAbsent(g, id) || c.minion.has(id)) continue;
    const at = c.transform.get(id)?.pos;
    if (!at || distXZ(at, me) > r) continue;
    const a = c.actor.get(id);
    if (!swinging || (a && moveDef(a)?.hit)) return true;
  }
  return false;
}

const isDone = (s: Steps, id: TipId): boolean => s.skip.has(id) || TIP_ROWS[id].every((_, i) => s.rows.has(`${id}:${i}`));

/** Marks what the hand has just done, whichever card is shown. */
function watchHands(g: Game, s: Steps, me: { x: number; z: number }): void {
  const p = g.player;
  const move = g.ecs.c.actor.get(p.id)?.move ?? '';
  const yaw = g.camera.yaw;
  const l = s.last;
  if (!l || g.frame > l.frame) { // measured once a step of the game (the picture may look more often)
    if (l) {
      const step = Math.hypot(me.x - l.x, me.z - l.z);
      if (step < F.jump) s.walked += step; // a journey or a rising is not a walk
      s.turned += Math.abs(Math.atan2(Math.sin(yaw - l.yaw), Math.cos(yaw - l.yaw)));
      if (p.sprinting && !p.mount.active) s.sprint += Math.min(g.frame - l.frame, 10); // a long stall of the picture does not count as running
    }
    s.last = { x: me.x, z: me.z, yaw, frame: g.frame };
  }
  const mark = (key: string, on: boolean): void => void (on && s.rows.add(key));
  mark('walk:0', s.walked >= F.walked);
  mark('walk:1', s.turned >= F.turned);
  mark('run:0', s.sprint >= F.sprint);
  mark('strike:0', move.startsWith('light'));
  mark('strike:1', move.startsWith('heavy'));
  mark('dodge:0', move === 'roll' || move === 'backstep');
  mark('heal:0', move === 'inject');
  mark('mount:0', !!p.mount.active);
}

/** Whether the card has reason to be shown now. */
function due(g: Game, s: Steps, id: TipId, me: { x: number; z: number }): boolean {
  const c = g.ecs.c;
  const h = c.health.get(g.player.id)!;
  switch (id) {
    case 'walk':
      return !g.player.mount.active;
    case 'run': {
      const m = c.mover.get(g.player.id);
      return isDone(s, 'walk') && !g.player.mount.active && !!m && Math.hypot(m.vx, m.vz) > 0.5;
    }
    case 'strike':
      return foeNear(g, me, F.foe);
    case 'dodge':
      return foeNear(g, me, F.swing, true) || (isDone(s, 'strike') && foeNear(g, me, F.close));
    case 'heal':
      return h.hp < h.max * F.hurt && g.player.reagent > 0;
    case 'mount': {
      const ran = s.doneAt.run ?? (s.skip.has('run') ? -Infinity : undefined);
      return ran !== undefined && g.frame - ran >= F.mountAfter && !foeNear(g, me, F.foe) && (!!g.player.mount.active || mountBar(g) === null);
    }
  }
}

export interface TipView {
  id: TipId;
  rows: readonly boolean[];
}

/** The card to show this frame, if any, and which of its rows are done. Writes `tip:<id>` to `told` as a card is finished. */
export function stepTips(g: Game, s: Steps): TipView | null {
  const ow = g.overworld;
  const me = g.ecs.c.transform.get(g.player.id)?.pos;
  if (!ow || !me || (g.ecs.c.health.get(g.player.id)?.hp ?? 0) <= 0) return (s.shown = null), null;
  watchHands(g, s, me);
  for (const id of TIP_IDS) {
    if (s.doneAt[id] === undefined && !s.skip.has(id) && isDone(s, id)) {
      s.doneAt[id] = g.frame;
      ow.told.add(TIP_KEPT + id);
    }
  }
  const cur = s.shown;
  if (cur) {
    const finished = s.doneAt[cur];
    if (finished !== undefined && g.frame - finished >= F.linger) s.shown = null; // its ticks are seen, then it goes
    else if (finished === undefined) {
      if (due(g, s, cur, me)) s.lapsed = Infinity;
      else if (s.lapsed === Infinity) s.lapsed = g.frame;
      else if (g.frame - s.lapsed >= F.lapse) s.shown = null;
    }
  }
  const held = s.shown !== null && (s.doneAt[s.shown] !== undefined || g.frame - s.since < F.minShow);
  if (!held) {
    const next = URGENCY.find((id) => !isDone(s, id) && due(g, s, id, me)) ?? null;
    if (next && next !== s.shown) Object.assign(s, { shown: next, since: g.frame, lapsed: Infinity });
  }
  const id = s.shown;
  return id ? { id, rows: TIP_ROWS[id].map((_, i) => s.rows.has(`${id}:${i}`)) } : null;
}

/** Whether a card has yet to be finished (the HUD keeps its own mount line back until the card has taught it). */
export const tipWaiting = (s: Steps, id: TipId): boolean => !isDone(s, id);
