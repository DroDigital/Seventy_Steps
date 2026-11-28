/**
 * The dungeons' traps played (2026-11-27; data/dungeonTraps.ts says which, world/trapPlan.ts where, systems/trapHits.ts how a blow lands).
 * Every mechanism shows itself before it strikes (`TrapWarned`: a click, a rattle, a hiss, dust, a rumble, a ring) and then strikes
 * (`TrapSprung`); render/trapViews.ts moves the hardware and audio/trapAudio.ts sounds it. Only the dungeon the investigator is in is
 * played, and only its pieces within `NEAR` of them; nothing wakes while they are sheltered, in a cutscene or down. What its first room
 * is like is said once (`trap:<dungeon>:<n>` in `ow.told`). From the game's own random stream and frame count. Pure: no Three.js.
 */

import type { V3 } from '../core/geom';
import { SIM, TRAP } from '../data/tuning';
import { trapPlan, type TrapLayout, type TrapPiece } from '../world/trapPlan';
import { worldLayout } from '../world/placements';
import { dungeonRoomAt } from '../world/terrain';
import { isSheltered, type Game } from './components';
import { loseSanity } from './sanity';
import { spend } from './stamina';
import { nearSegment, trapStrike } from './trapHits';

const NEAR = 34; // metres: a piece further than this from the investigator waits

export interface LiveTrap {
  p: TrapPiece;
  state: 'idle' | 'warn' | 'on' | 'rest';
  left: number; // frames left in its state
  t: number; // frames into its state (a volley's, a roll's, a slab's fall)
  mark: V3 | null; // a watcher's: where it will strike
  darts: { pos: V3; left: number }[]; // a volley in flight
}

export interface TrapRun {
  plan: TrapLayout;
  live: LiveTrap[];
}

const runs = new WeakMap<Game, TrapRun | null>();
const range = (g: Game, [lo, hi]: readonly [number, number]): number => Math.round(lo + (hi - lo) * g.rng());

/** The traps of the dungeon the investigator is in, or null. */
export function trapRun(g: Game): TrapRun | null {
  return runs.get(g) ?? null;
}

function build(g: Game, plan: TrapLayout): TrapRun {
  const live = plan.pieces.map((p): LiveTrap => {
    const rhythm = p.kind === 'flames' ? TRAP.flames.rest : p.kind === 'crusher' ? TRAP.crusher.rest : p.kind === 'gas' ? TRAP.gas.rest : p.kind === 'watcher' ? TRAP.watcher.every : TRAP.tide.every;
    const pressedBy = p.kind === 'spikes' || p.kind === 'darts' || p.kind === 'boulder'; // a plate waits for a foot; the rest keep their rhythm
    return { p, state: pressedBy ? 'idle' : 'rest', left: pressedBy ? 0 : Math.round(range(g, rhythm) * (0.3 + p.phase)), t: 0, mark: null, darts: [] };
  });
  return { plan, live };
}

const pressed = (me: V3, p: TrapPiece, r: number): boolean => Math.hypot(me.x - p.at.x, me.z - p.at.z) <= r && Math.abs(me.y - p.at.y) < 1;
const onTile = (q: V3, c: V3, half: number, body: number): boolean => Math.abs(q.x - c.x) < half + body * 0.5 && Math.abs(q.z - c.z) < half + body * 0.5;
const lerp = (a: V3, b: V3, t: number): V3 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });

/** Where a blade's edge is now, along its swing (from `from` to `to`), and how far through its swing (−1..1). */
export function bladeAt(g: Game, p: TrapPiece): { pos: V3; swing: number } {
  const swing = Math.sin(((g.frame / SIM.hz) / TRAP.blades.period + p.phase) * Math.PI * 2);
  return { pos: lerp(p.from!, p.to!, (swing + 1) / 2), swing };
}

/** Where a boulder is on its roll (a share of its run). */
export const boulderAt = (l: LiveTrap): V3 => {
  const run = Math.hypot(l.p.to!.x - l.p.from!.x, l.p.to!.z - l.p.from!.z);
  return lerp(l.p.from!, l.p.to!, Math.min(1, (l.t * TRAP.boulder.speed) / SIM.hz / Math.max(run, 0.1)));
};

function warn(g: Game, l: LiveTrap, frames: number, at: V3 = l.p.at, to?: V3): void {
  l.state = 'warn';
  l.left = frames;
  l.t = 0;
  g.events.emit('TrapWarned', { kind: l.p.kind, at: { ...at }, look: l.p.look, frames, ...(to && { to: { ...to } }) });
}

const sprung = (g: Game, l: LiveTrap, at: V3, to?: V3): void => g.events.emit('TrapSprung', { kind: l.p.kind, at: { ...at }, look: l.p.look, ...(to && { to: { ...to } }) });

/** One piece's frame. */
function step(g: Game, l: LiveTrap, me: V3, inRoom: boolean): void {
  const p = l.p;
  l.t++;
  if (p.kind === 'blades') {
    const now = bladeAt(g, p);
    const before = Math.sin((((g.frame - 1) / SIM.hz) / TRAP.blades.period + p.phase) * Math.PI * 2);
    if (Math.sign(before) !== Math.sign(now.swing)) sprung(g, l, now.pos); // its pass through the bottom of its swing: a whoosh
    trapStrike(g, now.pos, (q, body) => Math.hypot(q.x - now.pos.x, q.z - now.pos.z) < TRAP.blades.width + body, TRAP.blades.damage);
    return;
  }
  for (const d of l.darts) {
    const dir = { x: p.to!.x - p.from!.x, z: p.to!.z - p.from!.z };
    const len = Math.hypot(dir.x, dir.z) || 1;
    const v = TRAP.darts.speed / SIM.hz;
    d.pos = { x: d.pos.x + (dir.x / len) * v, y: d.pos.y, z: d.pos.z + (dir.z / len) * v };
    d.left--;
    if (trapStrike(g, d.pos, (q, body) => Math.hypot(q.x - d.pos.x, q.z - d.pos.z) < TRAP.darts.reach + body * 0.5, TRAP.darts.damage).length) d.left = 0;
  }
  l.darts = l.darts.filter((d) => d.left > 0);
  if (l.state === 'rest' || l.state === 'idle') {
    if (l.left > 0) l.left--;
    if (l.left > 0) return;
    l.state = 'idle';
    switch (p.kind) {
      case 'spikes': if (onTile(me, p.at, TRAP.spikes.half, 0.4) && Math.abs(me.y - p.at.y) < 1) warn(g, l, TRAP.spikes.warn); return;
      case 'darts': if (pressed(me, p, TRAP.plate)) warn(g, l, TRAP.darts.warn, p.from!, p.to!); return;
      case 'boulder': if (pressed(me, p, TRAP.plate)) warn(g, l, TRAP.boulder.warn, p.from!, p.to!); return;
      case 'flames': return warn(g, l, TRAP.flames.warn, p.from!, p.to!);
      case 'crusher': return warn(g, l, TRAP.crusher.warn);
      case 'gas': return warn(g, l, TRAP.gas.warn);
      case 'tide': if (inRoom) warn(g, l, TRAP.tide.warn, p.rows![0]![0]!); else l.left = 30; return;
      case 'watcher':
        if (!inRoom) { l.left = 30; return; }
        l.mark = { ...me };
        g.events.emit('WardWarned', { at: { ...me }, radius: TRAP.watcher.burst, frames: TRAP.watcher.warn, look: p.look });
        return warn(g, l, TRAP.watcher.warn, me);
    }
    return;
  }
  if (l.state === 'warn') {
    if (--l.left > 0) return;
    l.state = 'on';
    l.t = 0;
    l.left = p.kind === 'spikes' ? TRAP.spikes.up : p.kind === 'flames' ? TRAP.flames.burn : p.kind === 'crusher' ? TRAP.crusher.fall + TRAP.crusher.down + TRAP.crusher.rise
      : p.kind === 'gas' ? TRAP.gas.puff : p.kind === 'darts' ? TRAP.darts.volley * TRAP.darts.gap : p.kind === 'boulder' ? Infinity : p.kind === 'tide' ? p.rows!.length * TRAP.tide.step + 1 : 1;
    if (p.kind === 'spikes' || p.kind === 'flames' || p.kind === 'gas') sprung(g, l, p.kind === 'flames' ? p.from! : p.at, p.to);
    if (p.kind === 'watcher' && l.mark) {
      const m = l.mark;
      trapStrike(g, m, (q, body) => Math.hypot(q.x - m.x, q.z - m.z) < TRAP.watcher.burst + body * 0.5, TRAP.watcher.damage);
      g.events.emit('WardLanded', { at: m, radius: TRAP.watcher.burst, look: p.look });
      sprung(g, l, m);
    }
  }
  if (l.state !== 'on') return;
  switch (p.kind) {
    case 'spikes': trapStrike(g, p.at, (q, body) => onTile(q, p.at, TRAP.spikes.half, body), TRAP.spikes.damage); break;
    case 'flames': trapStrike(g, p.from!, (q, body) => nearSegment(q, p.from!, p.to!, TRAP.flames.width / 2 + body * 0.5), TRAP.flames.damage); break;
    case 'crusher':
      if (l.t === TRAP.crusher.fall) {
        trapStrike(g, p.at, (q, body) => onTile(q, p.at, TRAP.crusher.half, body), TRAP.crusher.damage);
        sprung(g, l, p.at);
      }
      break;
    case 'gas':
      if (Math.hypot(me.x - p.at.x, me.z - p.at.z) < TRAP.gas.r && Math.abs(me.y - p.at.y) < 2 && !isSheltered(g)) {
        if (p.of === 'sanity') loseSanity(g, TRAP.gas.sanity / SIM.hz);
        else {
          const s = g.ecs.c.stamina.get(g.player.id);
          if (s) spend(s, (TRAP.gas.stamina / SIM.hz) * 10);
        }
      }
      break;
    case 'darts':
      if ((l.t - 1) % TRAP.darts.gap === 0 && l.t <= TRAP.darts.volley * TRAP.darts.gap) {
        const run = Math.hypot(p.to!.x - p.from!.x, p.to!.z - p.from!.z);
        l.darts.push({ pos: { ...p.from! }, left: Math.round((run / TRAP.darts.speed) * SIM.hz) });
        sprung(g, l, p.from!, p.to);
      }
      break;
    case 'boulder': {
      const b = boulderAt(l);
      trapStrike(g, b, (q, body) => Math.hypot(q.x - b.x, q.z - b.z) < TRAP.boulder.radius + body, TRAP.boulder.damage);
      if (Math.hypot(b.x - p.to!.x, b.z - p.to!.z) < 0.05) {
        sprung(g, l, b);
        g.events.emit('WardLanded', { at: { ...b, y: p.at.y }, radius: 1.6, look: p.look });
        l.left = 0;
      }
      break;
    }
    case 'tide': {
      const k = (l.t - 1) / TRAP.tide.step;
      const row = Number.isInteger(k) ? p.rows![k] : undefined;
      for (const at of row ?? []) {
        trapStrike(g, at, (q, body) => Math.hypot(q.x - at.x, q.z - at.z) < TRAP.tide.burst + body * 0.5, TRAP.tide.damage);
        g.events.emit('WardLanded', { at, radius: TRAP.tide.burst, look: p.look, hush: at !== row![0] }); // (every point of the row is seen; the row is heard once)
      }
      break;
    }
  }
  if (--l.left > 0) return;
  l.state = 'rest';
  l.t = 0;
  l.left = p.kind === 'spikes' ? TRAP.spikes.rest : p.kind === 'darts' ? TRAP.darts.rest : p.kind === 'boulder' ? TRAP.boulder.rest
    : range(g, p.kind === 'flames' ? TRAP.flames.rest : p.kind === 'crusher' ? TRAP.crusher.rest : p.kind === 'gas' ? TRAP.gas.rest : p.kind === 'watcher' ? TRAP.watcher.every : TRAP.tide.every);
}

export function dungeonTrapSystem(g: Game): void {
  const ow = g.overworld;
  const me = g.ecs.c.transform.get(g.player.id)?.pos;
  if (!ow || !me || g.cutscene || (g.ecs.c.health.get(g.player.id)?.hp ?? 0) <= 0) return;
  const here = dungeonRoomAt(me.x, me.z);
  let run = runs.get(g) ?? null;
  if (here && run?.plan.dungeon !== here.layout.def.id) {
    const d = worldLayout().dungeons.find((x) => x.layout === here.layout);
    const plan = d ? trapPlan(d) : null;
    runs.set(g, (run = plan ? build(g, plan) : null));
  } else if (!here && run && !run.live.some((l) => Math.hypot(l.p.at.x - me.x, l.p.at.z - me.z) < NEAR)) runs.set(g, (run = null));
  if (!run) return;
  const room = here?.room.index ?? -1;
  for (const r of run.plan.rooms) {
    const key = `trap:${run.plan.dungeon}:${r.trap}`;
    if (r.room === room && !ow.told.has(key)) {
      ow.told.add(key);
      g.events.emit('WayOmen', { words: run.plan.defs[r.trap]!.words, shake: 0, pitch: 1 });
    }
  }
  if (isSheltered(g)) return; // (the peace of an arrival, a talk: the mechanisms wait)
  for (const l of run.live) if (Math.hypot(l.p.at.x - me.x, l.p.at.z - me.z) < NEAR || l.darts.length || l.state === 'on') step(g, l, me, l.p.room === room);
}
