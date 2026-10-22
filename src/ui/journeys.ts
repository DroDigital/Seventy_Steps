/**
 * Journeys (playtest round 2): every long jump happens under the veil (veil.ts), so the world is
 * built out of sight — arriving in a game begun or continued, fast travel, the descent into dream,
 * a gate, waking after death. The veil covers while the world stands still; the jump is made; the
 * world takes one step without the investigator's hand (the creatures about the arrival rise), then
 * waits in the dark while the chunks about it are built at a larger budget, the veil's line filling
 * as they stand (playtest round 10); the shaders the world needs are made ready out of sight (`ready`:
 * nothing is drawn while the veil covers all), and the veil lifts, the world moving again as it does.
 * Dying, the veil falls as the investigator does, and the death throes wait for it before the respawn.
 * Round 60: a gate walked into (systems/gateWalk.ts) is a journey whose veil falls over the walk on into its light, the
 * world still stepping, in the light of the realm beyond, from the middle of the screen out (veil.ts); the gate's own
 * `Travelled` then holds it while the far side is made.
 */

import { candleFor } from '../systems/candles';
import { emptyInput, type InputFrame } from '../core/input';
import { LOOKS } from '../data/looks';
import { WORLD } from '../data/tuning';
import { gatePlace, signPlace } from '../systems/checkpoints';
import type { Game } from '../systems/components';
import { deathLine } from '../systems/deathNotes';
import { regionAt } from '../world/worldMap';
import type { Veil } from './veil';

export interface Journeys {
  /** Covers, makes the jump, and lifts once the world about the investigator stands; a journey with its own `line` falls slower and holds until it can be read. */
  go(words: string, jump: () => void, line?: string): void;
  /** The veil already covers (a game begun, even before its making is done): names the region the investigator stands in, lifts once the world stands, then calls `then`. */
  arrive(then?: () => void): void;
  /** Before a step: the input the world steps with, or null while it stands still. */
  before(frame: InputFrame): InputFrame | null;
  /** Each drawn frame, with the chunk jobs still pending. */
  update(pending: number): void;
  readonly still: boolean; // the world waits (no step this frame)
  readonly busy: boolean; // a journey, an arrival or a fall is under way (the pause menu keeps out of it)
  readonly budget: number; // ms of chunk building this frame
}

const HOLD_MS = [900, 4000] as const; // under the veil after a jump, from its first drawn frame: at least (the sign shows), and at most while chunks build
const READ_MS = 3400; // under the veil at least, when it says a journey's own line (round 17: the descent's)
const BUILD_MS = 24; // chunk building a frame while nothing shows (nothing is drawn under the veil, so it has the frame)
export const DYING_MS = 2600; // the fall shows this long before the veil comes (round 14: UNMADE had a second, then was gone under the dark)

/** `ready` makes the world ready to be seen before the veil lifts (the shaders it needs, main.ts). */
export function createJourneys(g: Game, veil: Veil, ready?: () => Promise<void>): Journeys {
  let phase: 'idle' | 'covering' | 'entering' | 'dying' | 'holding' | 'readying' = 'idle'; // entering: a gate walked into, the walk still going on under the falling veil
  let since = 0;
  let then: (() => void) | undefined;
  let fallen = false; // the veil has begun to fall on a death
  let rise = 0; // steps the world takes on arrival, before it waits
  let [from, peak] = [0, 0]; // the hold's line: the share made before it, and the most chunk jobs it has seen pending
  let least: number = HOLD_MS[0]; // this hold's shortest

  const hold = (after?: () => void): void => {
    [phase, since, then, rise] = ['holding', -1, after, 1];
  };
  const lift = (): void => {
    phase = 'idle';
    void veil.lift(1.4);
    const after = then;
    then = undefined;
    after?.();
  };
  const dyingWaits = (): boolean => {
    const a = g.ecs.c.actor.get(g.player.id)!;
    return phase === 'dying' && !veil.covered && a.move === 'death' && a.frame >= a.moves.death.frames - 2;
  };
  const restPlace = (): string => (g.overworld ? signPlace(g.overworld.sign)?.name : undefined)?.toUpperCase() ?? 'THE ELDER SIGN';

  g.events.on('Died', ({ entity }) => {
    if (entity !== g.player.id || phase !== 'idle') return;
    [phase, since, fallen] = ['dying', performance.now(), false];
  });
  g.events.on('Respawned', () => void (phase === 'dying' && hold()));
  g.events.on('GateEntering', ({ gate, frames }) => {
    if (phase !== 'idle') return;
    const twin = gatePlace(gatePlace(gate)?.to ?? '');
    const look = LOOKS[twin?.region ?? ''] ?? LOOKS.hub;
    const light = [0, 1, 2].map((k) => Math.min(1, look.grade[3][k] * 0.7 + look.accents[0][k] * 0.3 + 0.08)) as [number, number, number];
    [phase, least] = ['entering', HOLD_MS[0]];
    void veil.cover((twin?.name ?? '').toUpperCase(), (frames / 60) * 0.85, undefined, light); // made to close as the walk ends
  });
  g.events.on('Travelled', ({ via }) => void (via === 'gate' && phase === 'entering' && hold()));

  const self: Journeys = {
    go(words, jump, line) {
      if (phase !== 'idle') return;
      [phase, least] = ['covering', line ? READ_MS : HOLD_MS[0]];
      void veil.cover(words, line ? 1.6 : 0.9, line).then(() => {
        jump();
        hold();
      });
    },
    arrive(after) {
      const at = g.ecs.c.transform.get(g.player.id)!.pos;
      if (g.overworld) veil.darken(regionAt(at.x, at.z)?.name.toUpperCase());
      hold(after);
    },
    before(frame) {
      if (phase === 'holding') return rise-- > 0 ? emptyInput() : null;
      if (self.still) return null;
      return frame;
    },
    update(pending) {
      const now = performance.now();
      if (phase === 'entering' && !g.player.gatePass) lift(); // the walk ended and no journey came of it (a fight took hold on the way): the veil draws back
      if (phase === 'dying' && !fallen && now - since > DYING_MS) {
        fallen = true;
        const asked = g.player.ask && candleFor(g, g.ecs.c.transform.get(g.player.id)!.pos) !== null; // a lit candle reaches the fall: the rise menu stands on the veil, with no place's name on it (riseMenu.ts)
        void veil.cover(asked ? '' : restPlace(), 1.2, asked ? undefined : deathLine(g)); // (UNMADE is alone on the screen while it stands; what the last blow teaches is read here, in the dark, round 54)
      }
      if (phase !== 'holding') return;
      if (since < 0) [since, from, peak] = [now, veil.fill, 0];
      peak = Math.max(peak, pending);
      veil.progress(from + (1 - from) * (peak > 0 ? 1 - pending / peak : 1));
      if (now - since < least || (pending > 0 && now - since < Math.max(least, HOLD_MS[1]))) return;
      [phase, least] = ['readying', HOLD_MS[0]];
      if (ready) void ready().then(lift, lift);
      else lift();
    },
    get still() {
      return phase === 'covering' || (phase === 'holding' && rise <= 0) || phase === 'readying' || dyingWaits();
    },
    get busy() {
      return phase !== 'idle';
    },
    get budget() {
      return phase === 'holding' || veil.covered ? BUILD_MS : WORLD.sliceMs;
    },
  };
  return self;
}
