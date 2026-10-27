/**
 * The investigator's peace on arriving (round 88; asked by XDro: "when respawning or fast traveling to an elder sign, the player should
 * never be immediately attacked by enemies"). The dungeons' Elder Signs have their halls' foes seven to thirteen metres from the stone, awake
 * to anything within a dozen, so a rising or a journey there met a blow as the veil lifted. Now every arrival is sheltered (`isSheltered`: no blow
 * lands, nothing is pushed or worn away, no foe notices them, and any that were on them let go): in the open world the foes are posted well
 * clear of every sign (WORLD.signClear), and in a hall the peace is what keeps them off.
 *
 * It begins on a rising after a fall (`Respawned`), a journey (`Travelled`: fast travel, the descent, a gate), a rest (`Rested`) or a game
 * continued at its stone (`beginPeace`), and holds while they kneel or stand as they came. It is theirs to leave: from their first move or press
 * it holds `PEACE.after` seconds more (waiting while a talk, a trade or the sign's menu is open), and their own blow, shot or thrown flask ends
 * it at once, so it cannot be used to strike from safety. A boss's fog entered, a sleeping horror's ring entered (it wakes there by its own senses, as it always did, which it could not while they were out of reach) or a horror woken ends it too. Pure: no Three.js.
 */

import type { InputFrame } from '../core/input';
import { distXZ, type XZ } from '../core/geom';
import { PEACE, SIM } from '../data/tuning';
import { moveDef } from './actions';
import type { Game } from './components';
import { allWakes } from './fogGates';
import { createBuffer } from './inputBuffer';

/** Begins the peace: a fresh one, not yet risen from (it holds until they move or act). The combat arena has no stones, journeys or veil: a fight there is as the fighter finds it. */
export function beginPeace(g: Game): void {
  if (!g.overworld) return;
  g.player.peace = { since: g.frame, risen: false, left: Math.round(PEACE.after * SIM.hz) };
}

const endPeace = (g: Game): void => void (g.player.peace = null);

/** A journey cuts a swing short and drops a press queued as they set out (as `restore` does the move of a rising), or either would end the peace of the arrival on its first step. */
function leaveMove(g: Game): void {
  const a = g.ecs.c.actor.get(g.player.id)!;
  Object.assign(a, { move: null, frame: 0, hitstop: 0, frozen: false, last: null, idle: 0, guard: false });
  a.hits.clear();
  Object.assign(g.player.buffer, createBuffer());
}

/** Subscribes the peace to the events that begin and end it. Call once per game. */
export function registerPeace(g: Game): void {
  g.events.on('Travelled', () => (leaveMove(g), beginPeace(g)));
  g.events.on('Rested', () => beginPeace(g));
  g.events.on('Respawned', ({ entity }) => void (entity === g.player.id && beginPeace(g)));
  g.events.on('Died', ({ entity }) => void (entity === g.player.id && endPeace(g))); // a fall (falls.ts) ends it too
  for (const event of ['BossEngaged', 'FogPassing'] as const) g.events.on(event, () => endPeace(g)); // a horror woken, or a fog walked into
}

/** Whether `p` stands within the ring of a horror that sleeps: not slain, not woken. It wakes there by what it sees and hears, and nothing it keeps can while the investigator is out of reach. */
function inSleepersRing(g: Game, p: XZ): boolean {
  const ow = g.overworld;
  if (!ow) return false;
  const awake = (bosses: string[]): boolean => [...g.ecs.c.fight.values()].some((f) => f.engaged && bosses.includes(f.id));
  return allWakes().some((w) => distXZ(w, p) <= w.radius && !w.spawns.every((s) => ow.slain.has(s)) && !awake(w.bosses));
}

/** One step: they rise from it on a first move or press; it ends on a blow of their own, or `PEACE.after` seconds after they have risen. Before the foes' turn. */
export function peaceSystem(g: Game, input: InputFrame): void {
  const peace = g.player.peace;
  if (!peace) return;
  const def = moveDef(g.ecs.c.actor.get(g.player.id)!);
  if (def?.hit || def?.shot || def?.volley) return endPeace(g); // a blow, a shot or a flask of their own: the peace is theirs to break
  if (inSleepersRing(g, g.ecs.c.transform.get(g.player.id)!.pos)) return endPeace(g); // a run back to a horror's court is its own to wake, at its ring
  if (g.sheltered || g.cutscene) return; // a talk, a trade or the sign's menu holds it as it is
  if (!peace.risen) {
    if (g.frame > peace.since && (Math.hypot(input.moveX, input.moveY) > 0.1 || Object.values(input.pressed).some(Boolean))) peace.risen = true;
  } else if (--peace.left <= 0) endPeace(g);
}
