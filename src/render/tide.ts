/**
 * Round 78, the picture that follows the body: struck down, the colour runs out of the world and the corners close in toward black, so
 * UNMADE rises over a grey, sinking picture (before this the muffled sound had no picture); rising from an Elder Sign after a rest, the
 * corners open and the light swells for a moment, a breath out. Render only: it reads the game's events and the investigator's kneeling
 * and drives the post pass's own uniforms (render/hurtFx.ts writes them). The drain is on the wall clock, since the world stands still
 * for the last of a death. All ramps are slow and monotone, nothing flashes.
 */

import { TIDE } from '../data/uiMood';
import type { Game } from '../systems/components';

const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** The drain of the colour (0..1) `sinceDeath` seconds after a death (null: not dead), and the breath out (0..1) `sinceBreath` seconds after rising from the stone (null: not). */
export function tideAt(sinceDeath: number | null, sinceBreath: number | null): { drain: number; breath: number } {
  const drain = sinceDeath === null ? 0 : smooth(0, TIDE.drain, sinceDeath);
  const { seconds, decay } = TIDE.breath;
  const breath = sinceBreath === null || sinceBreath < 0 || sinceBreath >= seconds ? 0 : smooth(0, 0.25, sinceBreath) * Math.exp(-sinceBreath / decay) * (1 - smooth(seconds - 0.4, seconds, sinceBreath));
  return { drain, breath: Math.min(1, breath * 1.4) };
}

export interface Tide {
  /** Each drawn frame: how far the colour has drained and how deep the breath out is. */
  update(): { drain: number; breath: number };
}

export function createTide(g: Game, clock: () => number = () => performance.now() / 1000): Tide {
  const me = g.player.id;
  let diedAt: number | null = null;
  let breathAt: number | null = null;
  let rested = false; // a rest at an Elder Sign was begun: the rising from it is the breath
  let knelt = false;
  g.events.on('Died', (e) => void (e.entity === me && ((diedAt = clock()), (rested = false), (breathAt = null))));
  g.events.on('Respawned', () => void ((diedAt = null), (breathAt = null), (rested = false)));
  g.events.on('Rested', () => void (rested = true));
  g.events.on('Travelled', () => void (rested = false)); // (arriving on one knee, from under the veil, is not a rising)
  return {
    update() {
      const now = clock();
      if (diedAt !== null && (g.ecs.c.health.get(me)?.hp ?? 0) > 0) diedAt = null; // (alive again, whatever woke them)
      const kneeling = !!g.player.kneeling;
      if (knelt && !kneeling && rested) [breathAt, rested] = [now, false];
      knelt = kneeling;
      return tideAt(diedAt === null ? null : now - diedAt, breathAt === null ? null : now - breathAt);
    },
  };
}
