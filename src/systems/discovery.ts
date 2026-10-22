/**
 * The discoveries played (round 63; data/discoveries.ts says what each is, world/discoveryPlan.ts where its things stand): a horror's
 * house is first seen from a way off, and its quest begins; its acts are done in order (a page read, a rite of lights lit, a vigil kept
 * where it is asked and in the hour, the weather or the state of mind it asks for, a gift laid on its altar with E), each told once under
 * `disc:<horror>:<n>` in `ow.told` (so they are in the save); when the last is done the gate's seal is lifted for good (`found:<horror>`,
 * which `hiddenLayer.ts` reads), and a horror put down opens it too. A vigil is not saved: it ebbs when it is not kept, and begins again.
 * Pure: no Three.js.
 */

import { distXZ, type XZ } from '../core/geom';
import { ARENA_HOUSES } from '../data/arenaHousesAll';
import { FOUND, foundKey, stepKey, type Gift, type Offer, type Step, type Vigil, type When } from '../data/discoveries';
import { DISCOVERIES } from '../data/discoveriesAll';
import { SIM } from '../data/tuning';
import { discoveryOf, stepPlace } from '../world/discoveryPlan';
import { worldLayout, type ArenaPlace } from '../world/placements';
import { hourOf, phaseOf } from './clock';
import type { Game } from './components';
import { isFound } from './found';
import { startQuest, track } from './quests';
import { bandIndex, loseSanity } from './sanity';
import { refreshSeals } from './seals';
import type { FightAction } from './signatures';
import { answer, leave } from './vigilCall';

/** The quest of a discovery: its id. */
export const questOf = (boss: string): string => `discover_${boss}`;

const stateOf = new WeakMap<Game, { region: string | null; arenas: ArenaPlace[]; kept: Map<string, number>; hushed: Map<string, number> }>();

/** The arenas of the investigator's region that have a house with a discovery. */
function arenasHere(g: Game): readonly ArenaPlace[] {
  const region = g.overworld?.region ?? null;
  let st = stateOf.get(g);
  if (!st) stateOf.set(g, (st = { region: null, arenas: [], kept: new Map(), hushed: new Map() }));
  if (st.region !== region) {
    st.region = region;
    st.arenas = worldLayout().arenas.filter((a) => a.region === region && discoveryOf(a));
  }
  return st.arenas;
}

const told = (g: Game, key: string): boolean => !!g.overworld?.told.has(key);


/** The act of a discovery that is next to be done (all those before it done), or -1 when they all are. */
export function currentStep(g: Game, boss: string): number {
  const steps = DISCOVERIES[boss]?.steps ?? [];
  const i = steps.findIndex((_, k) => !told(g, stepKey(boss, k)));
  return i;
}

/** Whether a vigil's hour is the one it asks for. */
export function holds(g: Game, when: When): boolean {
  const ow = g.overworld!;
  if (when.hour && !when.hour.includes(hourOf(phaseOf(g.frame / SIM.hz)))) return false;
  if (when.sky && !(when.sky.includes(ow.weather.kind) && ow.weather.amount >= 0.45)) return false;
  if (when.mind) {
    const b = bandIndex(g.mind.band);
    if (b < bandIndex(when.mind.from) || b > bandIndex(when.mind.to)) return false;
  }
  if (when.dark) {
    const at = g.ecs.c.transform.get(g.player.id)!.pos;
    if ((g.lit?.(at) ?? 0) > 0.18) return false;
  }
  return true;
}

function mark(g: Game, a: ArenaPlace, i: number): void {
  const boss = a.bosses[0]!;
  const ow = g.overworld!;
  if (ow.told.has(stepKey(boss, i))) return;
  ow.told.add(stepKey(boss, i));
  const d = DISCOVERIES[boss]!;
  if (d.steps.every((_, k) => ow.told.has(stepKey(boss, k)))) open(g, a);
}

/** The gate gives: the horror has been found. */
function open(g: Game, a: ArenaPlace): void {
  const boss = a.bosses[0]!;
  g.overworld!.told.add(foundKey(boss));
  refreshSeals(g);
  g.events.emit('GateOpened', { boss, at: { x: a.house!.gate.x, y: a.y + 1, z: a.house!.gate.z } });
  g.events.emit('Notice', { text: DISCOVERIES[boss]!.opens });
}

/** A house come within sight: its name, and its quest begins (followed, if none is). */
function see(g: Game, a: ArenaPlace, me: XZ): void {
  const boss = a.bosses[0]!;
  const ow = g.overworld!;
  const key = `seen:${boss}`;
  if (ow.told.has(key) || distXZ(me, a) > a.house!.radius + FOUND.see) return;
  ow.told.add(key);
  const h = ARENA_HOUSES[boss]!;
  g.events.emit('HouseSeen', { boss, name: h.name, line: h.line });
  if (isFound(g, boss) || ow.slain.has(`boss:${boss}`)) return;
  if (startQuest(g, questOf(boss)) && !ow.tracked) track(g, questOf(boss));
}

/** A vigil: kept while the investigator stands at its mark in the hour it asks for, ebbing otherwise. */
function keep(g: Game, a: ArenaPlace, i: number, v: Vigil, me: XZ): void {
  const boss = a.bosses[0]!;
  const st = stateOf.get(g)!;
  const key = `${boss}:${i}`;
  const at = stepPlace(a, v)!;
  const [near, want] = [distXZ(me, at) <= FOUND.vigil, SIM.hz * v.seconds];
  const held = near && holds(g, v.when);
  if (near) answer(g, key, v.when, held); // the place calls what it asks (vigilCall.ts; round 65)
  else leave(g, key);
  const before = st.kept.get(key) ?? 0;
  const now = held ? before + 1 : Math.max(0, before - FOUND.ebb);
  if (now === before) return;
  st.kept.set(key, now);
  const share = (n: number): number => Math.min(1, n / want);
  const at3 = { x: at.x, y: a.y + 1, z: at.z };
  if (before === 0 && now > 0) {
    g.events.emit('VigilKept', { boss, at: at3, share: 0 });
    g.events.emit('Notice', { text: v.words });
  }
  if (share(before) < 0.5 && share(now) >= 0.5) g.events.emit('VigilKept', { boss, at: at3, share: 0.5 });
  if (now >= want) {
    st.kept.delete(key);
    g.events.emit('VigilKept', { boss, at: at3, share: 1 });
    mark(g, a, i);
  }
}

/** A mark or an altar come to before its turn: it says so (once in a while), and nothing is done there. */
function unready(g: Game, a: ArenaPlace, i: number, s: Vigil | Offer, me: XZ): void {
  const at = stepPlace(a, s);
  const st = stateOf.get(g)!;
  const key = `${a.bosses[0]}:${i}`;
  if (!at || distXZ(me, at) > (s.kind === 'vigil' ? FOUND.vigil : FOUND.altar) || g.frame - (st.hushed.get(key) ?? -Infinity) < FOUND.hush * SIM.hz) return;
  st.hushed.set(key, g.frame);
  const first = DISCOVERIES[a.bosses[0]!]!.steps[currentStep(g, a.bosses[0]!)];
  g.events.emit('Notice', { text: `NOTHING STIRS HERE YET. ${first ? FIRST[first.kind] : 'SOMETHING IS ASKED FIRST'}` }); // what is asked first (round 65: it said only that something was)
}

/** What a mark or an altar come to early says is asked first. */
const FIRST: Readonly<Record<Step['kind'], string>> = {
  read: 'A PAGE IN THE COURT IS STILL TO BE READ',
  rite: 'THE LIGHTS OF THE COURT ARE STILL TO BE LIT',
  vigil: 'A VIGIL IN THE COURT IS STILL TO BE KEPT',
  offer: 'A GIFT IS STILL TO BE LAID',
};

/** How much of a vigil is kept, 0..1 (the picture and the sound read it). */
export function vigilShare(g: Game, boss: string, i: number): number {
  const v = DISCOVERIES[boss]?.steps[i];
  return v?.kind === 'vigil' ? Math.min(1, (stateOf.get(g)?.kept.get(`${boss}:${i}`) ?? 0) / (SIM.hz * v.seconds)) : 0;
}

/** A vigil whose turn has come, near the investigator: where its mark is, how much of it is kept and whether the hour holds now (the picture draws it, render/vigilMarks.ts; round 64). */
export interface VigilNear { x: number; z: number; share: number; holds: boolean }

export function vigilsNear(g: Game, reach: number): VigilNear[] {
  const me = g.overworld && !g.cutscene ? g.ecs.c.transform.get(g.player.id)?.pos : undefined;
  if (!me) return [];
  const out: VigilNear[] = [];
  for (const a of arenasHere(g)) {
    const boss = a.bosses[0]!;
    const i = isFound(g, boss) ? -1 : currentStep(g, boss);
    const v = i < 0 ? undefined : DISCOVERIES[boss]!.steps[i];
    const at = v?.kind === 'vigil' ? stepPlace(a, v) : null;
    if (v?.kind === 'vigil' && at && distXZ(me, at) <= reach) out.push({ x: at.x, z: at.z, share: vigilShare(g, boss, i), holds: holds(g, v.when) });
  }
  return out;
}

/** Every frame: the houses in sight are seen, the pages read and the rites done are counted, the vigil being kept goes on. */
export function discoverySystem(g: Game): void {
  const ow = g.overworld;
  if (!ow || g.cutscene) return;
  const me = g.ecs.c.transform.get(g.player.id)?.pos;
  if (!me || (g.ecs.c.health.get(g.player.id)?.hp ?? 0) <= 0) return;
  for (const a of arenasHere(g)) {
    const boss = a.bosses[0]!;
    if (distXZ(me, a) > a.house!.radius + FOUND.court + 40) continue;
    see(g, a, me);
    if (isFound(g, boss)) continue;
    const steps = DISCOVERIES[boss]!.steps;
    let turn = true; // every act before this one is done
    steps.forEach((s: Step, i) => {
      if (ow.told.has(stepKey(boss, i))) return;
      if (s.kind === 'read' && ow.read.has(s.doc)) return mark(g, a, i);
      if (s.kind === 'rite' && ow.told.has(`rite:${boss}`)) return mark(g, a, i);
      if (turn && s.kind === 'vigil') keep(g, a, i, s, me);
      else if (!turn && (s.kind === 'vigil' || s.kind === 'offer')) unready(g, a, i, s, me);
      turn = false;
    });
  }
}

/** Whether a gift can be given, and the line that says what it costs or why not. */
function canGive(g: Game, gift: Gift): boolean {
  const hp = g.ecs.c.health.get(g.player.id)!;
  if (gift.kind === 'dose') return g.player.laudanum > 0;
  if (gift.kind === 'echoes') return g.player.echoes >= gift.n;
  if (gift.kind === 'mind') return g.mind.sanity > gift.n + 4;
  return hp.hp > gift.n + 1;
}

function give(g: Game, gift: Gift): void {
  if (gift.kind === 'dose') g.player.laudanum--;
  else if (gift.kind === 'echoes') {
    g.player.echoes -= gift.n;
    g.events.emit('Echoes', { change: 'spent', amount: gift.n, total: g.player.echoes });
  } else if (gift.kind === 'mind') loseSanity(g, gift.n);
  else {
    const hp = g.ecs.c.health.get(g.player.id)!;
    hp.hp = Math.max(1, hp.hp - gift.n);
  }
}

/** E at an altar whose turn has come: the gift is laid on it. */
export function discoveryAction(g: Game): FightAction | null {
  const ow = g.overworld;
  if (!ow) return null;
  const me = g.ecs.c.transform.get(g.player.id)!.pos;
  for (const a of arenasHere(g)) {
    const boss = a.bosses[0]!;
    const i = isFound(g, boss) ? -1 : currentStep(g, boss);
    const s = i < 0 ? undefined : DISCOVERIES[boss]!.steps[i];
    if (!s || s.kind !== 'offer') continue;
    const at = stepPlace(a, s)!;
    if (distXZ(me, at) > FOUND.altar) continue;
    return offering(g, a, i, s);
  }
  return null;
}

function offering(g: Game, a: ArenaPlace, i: number, s: Offer): FightAction {
  const boss = a.bosses[0]!;
  return {
    label: canGive(g, s.give) ? s.label : `${s.label} (${lack(s.give)})`,
    run() {
      if (!canGive(g, s.give)) return void g.events.emit('Notice', { text: lack(s.give).toUpperCase() });
      give(g, s.give);
      const at = stepPlace(a, s)!;
      g.events.emit('Offered', { boss, at: { x: at.x, y: a.y + 1, z: at.z }, gift: s.give.kind });
      g.events.emit('Notice', { text: s.words });
      mark(g, a, i);
    },
  };
}

const lack = (gift: Gift): string => (gift.kind === 'dose' ? 'you carry none' : gift.kind === 'echoes' ? `${gift.n} Echoes are asked` : gift.kind === 'mind' ? 'the mind has too little to give' : 'too hurt to give');
