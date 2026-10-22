/**
 * The ways played (round 62; data/arenaWays.ts says what each is, world/arenaWay.ts where it lies): the things on the trail to an open
 * arena that answer to the one who walks it. A plate underfoot wakes and bursts a moment after (a step aside or a roll clears it); a vent
 * erupts of itself, in a round, and shows it first; a wave sweeps a stretch of the way now and then, column after column; blighted ground
 * wears at the mind or the breath; a field of plates has one safe in each row, the one that bears the rune on the tablet at its head; a rite's
 * lights are lit in the order the place tells, and the wrong one puts them all out. Omens are said as the way is passed, and its head is
 * named when found. Everything is outside the fight, none of it is kept in a save but what is told once (`ow.told`: an omen said, a rite
 * done), and a rite that is done stills the way's hazards for good if it says so. All of it is from the game's own random stream and frame
 * count, so a replay sees the same ways. Pure: no Three.js.
 */

import type { V3 } from '../core/geom';
import type { Hazard, Look } from '../data/arenaWays';
import { REGIONS } from '../data/regions';
import { SIM } from '../data/tuning';
import { along, pointAt, type WayPlan } from '../world/arenaWay';
import { regionPlan } from '../world/regionPlan';
import { blast } from './blasts';
import type { Game } from './components';
import { changeInsight } from './insight';
import { loseSanity } from './sanity';
import type { FightAction } from './signatures';
import { spend } from './stamina';

/** The numbers of the ways. */
export const WAYS = {
  active: 90, // metres from a way within which anything on it is played
  trigger: 1.05, // metres from a plate's middle that wakes it
  ward: { burst: 2.4, damage: 26, warn: 42, cool: 240 },
  vent: { burst: 3, damage: 28, warn: 60 },
  wave: { burst: 2.3, damage: 24, warn: 48, step: 16, span: 4.6, lateral: 3.7, near: 48 }, // frames between its columns, metres between them and across, and how near the strip it must be to rise
  field: { cols: 2.4, plate: 0.95, burst: 2.2 }, // metres between the plates of a row, and a plate's own wake
  poise: 60,
  light: 1.6, // metres a light is taken from
  interact: 2.6, // the E prompt appears before proximity takes its flame
  fail: { burst: 2.6, damage: 0, warn: 40, cool: 120 }, // what goes up at a wrong light: a flare, and no harm in it (round 68: "remove all traps"; it was 14)
  clue: 16, // metres from a rite's lights the clue is said
  heard: 44, // metres from the investigator within which a way's omens are listened for (it is a corridor)
} as const;

export interface Plate {
  x: number;
  y: number;
  z: number;
  look: Look;
  rune: number; // 0..3: the sign it bears (a field's)
  safe: boolean;
  burst: number;
  damage: number;
  warn: number;
  cool: number;
  state: 'idle' | 'warn' | 'cool';
  left: number; // frames until its next state
}

export interface Vent {
  x: number;
  y: number;
  z: number;
  look: Look;
  burst: number;
  damage: number;
  warn: number;
  every: readonly [number, number];
  left: number; // frames until it next erupts (counted down only when the investigator is near)
}

export interface Strip {
  look: Look;
  rings: V3[][]; // the rings of a wave, a column after another
  damage: number;
  every: readonly [number, number];
  left: number;
  centre: V3;
}

export interface Patch {
  x: number;
  y: number;
  z: number;
  r: number;
  rate: number;
  of: 'sanity' | 'stamina';
  look: Look;
}

export interface Light {
  x: number;
  y: number;
  z: number;
  height: number; // how tall it stands
  rank: number; // the turn it is to be lit in, from 0
  lit: boolean;
}

export interface Tablet {
  x: number;
  y: number;
  z: number;
  yaw: number;
  rune: number;
}

interface Burst {
  at: V3;
  radius: number;
  look: Look;
  damage: number;
  warnAt: number; // the frame its ring is marked
  landAt: number;
  warned: boolean;
}

export interface WayRun {
  plan: WayPlan;
  plates: Plate[];
  vents: Vent[];
  strips: Strip[];
  patches: Patch[];
  lights: Light[];
  tablet: Tablet | null;
  progress: number; // how many lights are lit, of a rite not yet done
  cool: number; // frame before which a wrong light is not taken again
  missed: number; // wrong lights taken: after one, the light whose turn it is beckons (render/wayViews.ts; round 65)
  bursts: Burst[];
  near: boolean; // the investigator is near it (the picture makes what it holds only then)
}

interface State {
  region: string | null;
  runs: WayRun[];
}

const states = new WeakMap<Game, State>();

const hashOf = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
};

const done = (g: Game, run: WayRun): boolean => !!run.plan.way.rite && !!g.overworld?.told.has(`rite:${run.plan.boss}`);
/** Whether the way's hazards are stilled: its rite is done, and it was one that stills. */
export const calmed = (g: Game, run: WayRun): boolean => !!run.plan.way.rite?.stills && done(g, run);

const between = (g: Game, [lo, hi]: readonly [number, number]): number => Math.round((lo + (hi - lo) * g.rng()) * SIM.hz);

function build(g: Game, plan: WayPlan): WayRun {
  const run: WayRun = { plan, plates: [], vents: [], strips: [], patches: [], lights: [], tablet: null, progress: 0, cool: 0, missed: 0, bursts: [], near: false };
  const place = (s: { d: number; side: number }): V3 => {
    const p = pointAt(plan, s.d, s.side);
    return { x: p.x, y: g.world.ground(p.x, p.z), z: p.z };
  };
  for (const h of plan.way.hazards ?? []) hazard(g, run, h, place);
  const rite = plan.way.rite;
  if (rite) {
    const n = rite.at.length;
    const spots = rite.at.map((s) => ({ ...place(s), d: s.d }));
    const heights = rite.at.map((_, i) => 0.9 + (1.2 * i) / Math.max(1, n - 1)); // the sizes they stand at
    const shuffled = heights.map((h, i) => ({ h, k: hashOf(`${plan.boss}:${i}`) })).sort((a, b) => a.k - b.k).map((x) => x.h);
    const order = spots.map((s, i) => ({ s, h: shuffled[i]! })).sort((a, b) => (rite.order === 'near' ? b.s.d - a.s.d : rite.order === 'falling' ? b.h - a.h : a.h - b.h));
    run.lights = order.map(({ s, h }, rank) => ({ x: s.x, y: s.y, z: s.z, height: rite.order === 'near' ? 1.4 : h, rank, lit: false }));
  }
  if (done(g, run)) for (const l of run.lights) l.lit = true;
  return run;
}

/** Sets one hazard on a run (the authored ways have none since round 68; tests/ways.test.ts makes the machinery's own). */
export function hazard(g: Game, run: WayRun, h: Hazard, place: (s: { d: number; side: number }) => V3): void {
  const plan = run.plan;
  if (h.kind === 'ward') {
    for (const s of h.plates) {
      const at = place(s);
      run.plates.push({ ...at, look: h.look, rune: 0, safe: false, burst: h.burst ?? WAYS.ward.burst, damage: h.damage ?? WAYS.ward.damage, warn: h.warn ?? WAYS.ward.warn, cool: h.cool ?? WAYS.ward.cool, state: 'idle', left: 0 });
    }
  } else if (h.kind === 'field') {
    for (let r = 0; r < h.rows; r++) {
      const d = h.rows === 1 ? h.from : h.from + ((h.to - h.from) * r) / (h.rows - 1);
      const safe = Math.floor(hashOf(`${plan.boss}:row:${r}`) * h.cols);
      for (let c = 0; c < h.cols; c++) {
        const at = place({ d, side: (c - (h.cols - 1) / 2) * WAYS.field.cols });
        const rune = c === safe ? h.key : (h.key + 1 + ((r + c) % 3)) % 4;
        run.plates.push({ ...at, look: h.look, rune, safe: c === safe, burst: WAYS.field.burst, damage: h.damage ?? WAYS.ward.damage, warn: WAYS.ward.warn, cool: WAYS.ward.cool, state: 'idle', left: 0 });
      }
    }
    const at = place(h.at);
    run.tablet = { ...at, yaw: pointAt(plan, h.at.d, h.at.side).yaw + Math.PI, rune: h.key };
  } else if (h.kind === 'vent') {
    for (const s of h.at) {
      const at = place(s);
      run.vents.push({ ...at, look: h.look, burst: h.burst ?? WAYS.vent.burst, damage: h.damage ?? WAYS.vent.damage, warn: h.warn ?? WAYS.vent.warn, every: h.every, left: between(g, h.every) });
    }
  } else if (h.kind === 'tide') {
    const rings: V3[][] = [];
    for (let d = h.to; d >= h.from; d -= WAYS.wave.span) {
      const col: V3[] = [];
      for (let s = -h.width / 2; s <= h.width / 2 + 0.01; s += WAYS.wave.lateral) col.push(place({ d, side: s }));
      rings.push(col);
    }
    run.strips.push({ look: h.look, rings, damage: h.damage ?? WAYS.wave.damage, every: h.every, left: between(g, h.every), centre: place({ d: (h.from + h.to) / 2, side: 0 }) });
  } else {
    for (const s of h.at) run.patches.push({ ...place(s), r: h.r, rate: h.rate, of: h.of ?? 'sanity', look: h.look });
  }
}

/** The ways of the region the investigator is in, made as it is entered. */
export function wayRuns(g: Game): readonly WayRun[] {
  const ow = g.overworld;
  let st = states.get(g);
  if (!st) states.set(g, (st = { region: null, runs: [] }));
  const region = ow?.region ?? null;
  if (st.region !== region) {
    st.region = region;
    const def = REGIONS.find((r) => r.id === region);
    st.runs = def ? regionPlan(def).ways.map((p) => build(g, p)) : [];
  }
  return st.runs;
}

/** A ring marked now that falls in `delay` frames. */
function fire(g: Game, run: WayRun, at: V3, radius: number, look: Look, damage: number, delay: number, warnAfter = 0): void {
  run.bursts.push({ at: { ...at }, radius, look, damage, warnAt: g.frame + warnAfter, landAt: g.frame + warnAfter + delay, warned: false });
}

function settle(g: Game, run: WayRun): void {
  for (let i = run.bursts.length - 1; i >= 0; i--) {
    const b = run.bursts[i]!;
    if (!b.warned && g.frame >= b.warnAt) {
      b.warned = true;
      g.events.emit('WardWarned', { at: { ...b.at }, radius: b.radius, frames: b.landAt - g.frame, look: b.look });
    }
    if (g.frame < b.landAt) continue;
    run.bursts.splice(i, 1);
    g.events.emit('WardLanded', { at: { ...b.at }, radius: b.radius, look: b.look });
    if (b.damage > 0) blast(g, b.at, b.radius, { player: b.damage, foe: [30, 0.15, 220], poise: WAYS.poise });
  }
}

function plates(g: Game, run: WayRun, me: V3, calm: boolean): void {
  for (const p of run.plates) {
    if (calm) {
      p.state = 'idle';
      continue;
    }
    if (p.state !== 'idle') {
      if (--p.left > 0) continue;
      if (p.state === 'warn') {
        p.state = 'cool';
        p.left = p.cool;
      } else p.state = 'idle';
      continue;
    }
    if (p.safe || Math.hypot(me.x - p.x, me.z - p.z) > WAYS.trigger || Math.abs(me.y - p.y) > 1.6) continue;
    p.state = 'warn';
    p.left = p.warn;
    fire(g, run, p, p.burst, p.look, p.damage, p.warn);
  }
}

function vents(g: Game, run: WayRun, me: V3, calm: boolean): void {
  if (calm) return;
  for (const v of run.vents) {
    if (Math.hypot(me.x - v.x, me.z - v.z) > WAYS.active) continue;
    if (--v.left > 0) continue;
    v.left = between(g, v.every) + v.warn;
    fire(g, run, v, v.burst, v.look, v.damage, v.warn);
  }
}

function strips(g: Game, run: WayRun, me: V3, calm: boolean): void {
  if (calm) return;
  for (const s of run.strips) {
    if (Math.hypot(me.x - s.centre.x, me.z - s.centre.z) > WAYS.wave.near + (s.rings.length * WAYS.wave.span) / 2) continue;
    if (--s.left > 0) continue;
    s.left = between(g, s.every) + s.rings.length * WAYS.wave.step + WAYS.wave.warn;
    s.rings.forEach((col, k) => col.forEach((at) => fire(g, run, at, WAYS.wave.burst, s.look, s.damage, WAYS.wave.warn, k * WAYS.wave.step)));
  }
}

function patches(g: Game, run: WayRun, me: V3, calm: boolean): void {
  if (calm) return;
  for (const p of run.patches) {
    if (Math.hypot(me.x - p.x, me.z - p.z) > p.r) continue;
    if (p.of === 'sanity') loseSanity(g, p.rate / SIM.hz);
    else {
      const s = g.ecs.c.stamina.get(g.player.id);
      if (s) spend(s, (p.rate / SIM.hz) * 10); // (the spending holds recovery off: else the ordinary regen, 32 a second at the least, outruns the frost's 28 and a body stands in it untouched)
    }
  }
}

function rite(g: Game, run: WayRun, me: V3): void {
  const r = run.plan.way.rite;
  const ow = g.overworld!;
  if (!r || run.lights.length === 0 || done(g, run)) return;
  const nearest = Math.min(...run.lights.map((l) => Math.hypot(me.x - l.x, me.z - l.z)));
  if (nearest < WAYS.clue && !ow.told.has(`rite:clue:${run.plan.boss}`)) {
    ow.told.add(`rite:clue:${run.plan.boss}`);
    g.events.emit('WayOmen', { words: r.clue, sound: 'whisper', shake: 0, pitch: 0.7 });
  }
  if (g.frame < run.cool) return;
  for (const l of run.lights) {
    if (l.lit || Math.hypot(me.x - l.x, me.z - l.z) > WAYS.light) continue;
    takeLight(g, run, l);
    return;
  }
}

/** Proximity and the interaction button take the same flame and obey the same order. */
function takeLight(g: Game, run: WayRun, l: Light): void {
  const r = run.plan.way.rite;
  const ow = g.overworld;
  if (!r || !ow || l.lit || done(g, run) || g.frame < run.cool) return;
  if (l.rank === run.progress) {
    l.lit = true;
    run.progress++;
    g.events.emit('RiteLit', { at: { x: l.x, y: l.y, z: l.z }, look: r.look, glow: r.glow, rank: l.rank, of: run.lights.length });
    if (run.progress === run.lights.length) {
      ow.told.add(`rite:${run.plan.boss}`);
      g.player.echoes += r.reward.echoes;
      g.events.emit('Echoes', { change: 'earned', amount: r.reward.echoes, total: g.player.echoes });
      if (r.reward.insight) changeInsight(g, r.reward.insight, 'quest', 'rite');
      g.events.emit('RiteDone', { boss: run.plan.boss, at: { x: l.x, y: l.y, z: l.z } });
      g.events.emit('Notice', { text: r.done });
    }
  } else {
    for (const k of run.lights) k.lit = false; // the wrong one: they all go out, and a flare goes up at it
    run.progress = 0;
    run.missed++;
    run.cool = g.frame + WAYS.fail.cool;
    g.events.emit('RiteFailed', { at: { x: l.x, y: l.y, z: l.z }, look: r.look });
    fire(g, run, l, WAYS.fail.burst, lookOfGlow(r.glow), WAYS.fail.damage, WAYS.fail.warn);
  }
}

/** A rite's unlit candle, lamp or fire offers an explicit E prompt as the investigator approaches. */
export function riteAction(g: Game): FightAction | null {
  if (!g.overworld || g.cutscene || (g.ecs.c.health.get(g.player.id)?.hp ?? 0) <= 0) return null;
  const me = g.ecs.c.transform.get(g.player.id)?.pos;
  if (!me) return null;
  let nearest: { run: WayRun; light: Light; distance: number } | null = null;
  for (const run of wayRuns(g)) {
    if (!run.plan.way.rite || done(g, run) || g.frame < run.cool) continue;
    for (const light of run.lights) {
      if (light.lit) continue;
      const distance = Math.hypot(me.x - light.x, me.z - light.z);
      if (distance <= WAYS.interact && (!nearest || distance < nearest.distance)) nearest = { run, light, distance };
    }
  }
  if (!nearest) return null;
  const { run, light } = nearest;
  const look = run.plan.way.rite!.look;
  return { label: look === 'glow' ? 'kindle the light' : `light the ${look}`, run: () => takeLight(g, run, light) };
}

const lookOfGlow = (glow: 'magenta' | 'purple' | 'green'): Look => (glow === 'magenta' ? 'stain' : glow === 'purple' ? 'star' : 'void');

/** What the one who walks a court hears of it: the omens it says as they pass them. */
function tell(g: Game, run: WayRun, me: V3): void {
  const ow = g.overworld!;
  const a = along(run.plan, me.x, me.z);
  if (a.dist > WAYS.heard) return;
  const key = (i: number): string => `way:${run.plan.boss}:${i}`;
  run.plan.way.omens.forEach((o, i) => {
    const at = Math.min(o.at, run.plan.length - 8); // (a way shorter than its words reach is told at its end)
    if (ow.told.has(key(i)) || a.d > at || a.d < at - 36) return; // as they pass it, coming in: not as they are set down past it
    ow.told.add(key(i));
    g.events.emit('WayOmen', { words: o.words, sound: o.sound, shake: o.shake ?? 0, pitch: o.pitch ?? 1 });
  });
}

export function waySystem(g: Game): void {
  const ow = g.overworld;
  if (!ow || g.cutscene) return;
  const me = g.ecs.c.transform.get(g.player.id)?.pos;
  if (!me || (g.ecs.c.health.get(g.player.id)?.hp ?? 0) <= 0) return;
  for (const run of wayRuns(g)) {
    const a = along(run.plan, me.x, me.z);
    run.near = a.dist < WAYS.active;
    settle(g, run); // what is marked falls though the investigator has gone
    if (!run.near) continue;
    const calm = calmed(g, run);
    plates(g, run, me, calm);
    vents(g, run, me, calm);
    strips(g, run, me, calm);
    patches(g, run, me, calm);
    rite(g, run, me);
    if (g.frame % 6 === 0) tell(g, run, me);
  }
}
