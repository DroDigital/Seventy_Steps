/**
 * The demo (round 56): the same game with its world kept to the university and Arkham (`DEMO.regions`), and its story to
 * the Witch House. When Keziah Mason falls, the stair under the Sleeper's Sign opens onto the full game, and the demo says
 * so once (DemoEnded: ui/demoEnd.ts). A walk over the edge of the two is held back at the step, as a boss's fog holds one
 * (fogGates.ts). A leap past it is refused where it begins (checkpoints.ts): a gate to a far realm, the stair, or a sign
 * found in a save from the full game. A save that wakes outside them wakes at the university's sign. Off in the full game
 * (`g.demo` unset). Pure: no Three.js.
 */

import { t } from '../core/i18n';
import type { XZ } from '../core/geom';
import { worldLayout } from '../world/placements';
import { regionAt } from '../world/worldMap';
import type { Game } from './components';

export const DEMO = {
  regions: new Set(['hub', 'arkham']), // the university and Arkham with the Blasted Heath
  lastBoss: 'keziah_mason', // her fall ends the demo
  start: 'hub_quad', // where a save from beyond them wakes
  told: 'demo:end', // kept in the save's `told`: the end is said once
  walk: 3, // a step longer than this (metres) is a leap, not a walk
  noticeFrames: 240, // the refusal is said at most once in four seconds
} as const;

/** Whether the demo lets the investigator stand at `at`. The full game lets them stand anywhere; off the land is for the falls to judge. */
export function demoAllows(g: Game, at: XZ): boolean {
  if (!g.demo) return true;
  const r = regionAt(at.x, at.z);
  return !r || DEMO.regions.has(r.id);
}

const said = new WeakMap<Game, number>();

/** In the demo: says (at most once in a while) that the way leads into the full game, and is true. In the full game: false. */
export function demoRefuses(g: Game): boolean {
  if (!g.demo) return false;
  if (g.frame >= (said.get(g) ?? -Infinity)) {
    g.events.emit('Notice', { text: t('demo.closed') });
    said.set(g, g.frame + DEMO.noticeFrames);
  }
  return true;
}

const startRest = (): { x: number; z: number; yaw: number } => worldLayout().signs.find((s) => s.id === DEMO.start)!.rest;
const lastIn = new WeakMap<Game, XZ>();

/** One step: the investigator kept within the demo's realms, and its end said once Keziah Mason has fallen. */
export function demoSystem(g: Game): void {
  const ow = g.overworld;
  if (!g.demo || !ow) return;
  const p = g.player;
  const tr = g.ecs.c.transform.get(p.id)!;
  if (!demoAllows(g, p.checkpoint)) [p.checkpoint, ow.sign] = [{ ...startRest() }, DEMO.start]; // a save from the full game rises here
  if (demoAllows(g, tr.pos)) lastIn.set(g, { x: tr.pos.x, z: tr.pos.z });
  else {
    const walked = Math.hypot(tr.pos.x - tr.prev.x, tr.pos.z - tr.prev.z) <= DEMO.walk && demoAllows(g, tr.prev);
    const back = walked ? tr.prev : lastIn.get(g) ?? startRest();
    tr.pos = { x: back.x, y: g.world.ground(back.x, back.z), z: back.z };
    tr.prev = { ...tr.pos };
    const m = g.ecs.c.mover.get(p.id);
    if (m) m.vx = m.vz = 0;
    p.mount.speed = 0; // a rig reined in at the edge, not pressing on against it
    demoRefuses(g);
  }
  if (ow.slain.has(`boss:${DEMO.lastBoss}`) && !ow.told.has(DEMO.told)) {
    ow.told.add(DEMO.told);
    g.events.emit('DemoEnded', {});
  }
}
