/**
 * The candles before the fog (round 45; Elden Ring's Stakes of Marika, in the dream's own terms): before the fog
 * of each horror, on the way in, a stub of tallow stands in a saucer ringed in chalk, left by an earlier sleeper. Pass
 * near and it takes the flame (nothing is pressed). A lit candle is a place to rise: fall within its reach and you
 * may wake there, a few steps from the fog, instead of at the Elder Sign a long way back (a screen asks which: ui/riseMenu.ts). It gives no rest (only an Elder
 * Sign does: levels, doses, the creatures come back as on any death), and the map's travel is still there to carry
 * you to an Elder Sign when you would grow stronger instead. Lit candles are kept in the save.
 */

import { t } from '../core/i18n';
import { distXZ } from '../core/geom';
import type { Place } from '../data/arena';
import { gatePlan } from '../world/gatePlan';
import { worldLayout } from '../world/placements';
import type { Game } from './components';

export const CANDLE = {
  light: 6, // metres from which passing takes the flame
  reach: 100, // metres from a lit candle within which a fall wakes the investigator there (a horror's arena is within it)
  every: 8, // frames between looks
};

export interface Candle {
  id: string;
  x: number;
  z: number;
  yaw: number; // looking at the fog
  wall: string; // the fog wall it stands before
  region: string;
}

let all: readonly Candle[] | null = null;
/** Every candle of the world, one before each fog. */
export function candlesOf(): readonly Candle[] {
  all ??= gatePlan(worldLayout()).fogs.map((f) => ({ id: `candle:${f.id}`, x: f.stake.x, z: f.stake.z, yaw: f.stake.yaw, wall: f.id, region: f.region }));
  return all;
}

/** After a fall at `at`: the nearest lit candle that reaches it, or null (the Elder Sign it is). */
export function candleFor(g: Game, at: { x: number; z: number }): (Place & { wall: string }) | null {
  const ow = g.overworld;
  if (!ow || ow.candles.size === 0) return null;
  let best: { c: Candle; d: number } | null = null;
  for (const c of candlesOf()) {
    if (!ow.candles.has(c.id)) continue;
    const d = distXZ(c, at);
    if (d <= CANDLE.reach && (!best || d < best.d)) best = { c, d };
  }
  return best ? { x: best.c.x, z: best.c.z, yaw: best.c.yaw, wall: best.c.wall } : null;
}

/** Takes the flame to any candle the investigator passes. */
export function candleSystem(g: Game): void {
  const ow = g.overworld;
  if (!ow || g.frame % CANDLE.every !== 0) return;
  const me = g.ecs.c.transform.get(g.player.id)?.pos;
  if (!me || g.ecs.c.actor.get(g.player.id)?.move === 'death') return;
  for (const c of candlesOf()) {
    if (ow.candles.has(c.id) || distXZ(c, me) > CANDLE.light) continue;
    ow.candles.add(c.id);
    g.events.emit('CandleLit', { id: c.id, x: c.x, z: c.z });
    g.events.emit('Notice', { text: t('n.candle') });
  }
}
