/**
 * Azathoth (spec §3E): blind, and a fight like any horror's, the hardest of them. (2026-10-29: it had been blind and invulnerable, its health bar a song that drained with the
 * minutes, and the fight an ordeal of silence. The timer, the drain and the ward are gone; it is struck and it falls, and when it does it slumbers.) Nothing it does is aimed at
 * the investigator: its blows are rhythms laid over the whole court (data/attacks.ts: the dirge, the drumbeat, the dance, the seething, the maelstrom), read by where they fall
 * and when. What it does aim is an answer. It hears what is loud, a shot and a sprint, and in its last phase a roll and a swing too; its attention fills, and where the
 * investigator stood when it was full the ground is marked, to burst a moment later and leave a pool (the old fight's blast, made a thing that can be read and left).
 * Its pauses shrink with each phase (`AZATHOTH.pace`). Pure: no Three.js.
 */

import type { Entity } from '../../core/ecs';
import { AZATHOTH, BOSS } from '../../data/tuning';
import type { Fight, Game } from '../components';
import { defOf } from '../creatures';
import type { Signature } from '../signatures';
import { layMark } from '../strikes';

const MOVEMENTS = ['THE DIRGE', 'THE DANCE', 'THE SEETHING', 'THE LAST NOTE'] as const;
const lastPhase = (f: Fight): boolean => f.phase === f.script.phases.length - 1;

/** What this frame of the investigator's noise adds to its attention: a shot, a sprint, and in its last phase a roll or a swing; nothing else carries. */
export function noise(g: Game, last: boolean): number {
  const a = g.ecs.c.actor.get(g.player.id)!;
  const heed = AZATHOTH.heed;
  if (a.move === 'shoot') return heed.shot;
  if (g.player.sprinting) return heed.sprint;
  if (!last) return 0;
  if (a.move === 'roll' || a.move === 'backstep') return heed.dodge;
  return a.move?.startsWith('light') || a.move?.startsWith('heavy') ? heed.swing : 0;
}

/** Where it heard them, it answers: the ground there is marked, and bursts in a moment. */
function answer(g: Game, e: Entity, f: Fight): void {
  const a = AZATHOTH.answer;
  const damage = defOf(g, e)!.stats.damage;
  const pp = g.ecs.c.transform.get(g.player.id)!.pos;
  f.sig.heed = 0;
  f.sig.rest = a.rest;
  layMark(g, e, { x: pp.x, z: pp.z }, {
    radius: a.radius,
    delay: a.delay,
    damage: Math.round(a.power * damage),
    poise: Math.round(a.poise * damage),
    leaves: { radius: a.pool.radius, life: a.pool.life, tick: a.pool.tick, damage: Math.max(1, Math.round(a.pool.power * damage)) },
  });
  if (f.sig.told) return;
  f.sig.told = 1;
  g.events.emit('Notice', { text: 'IT HEARS YOU' });
}

/** What it left on the ground (the seething's pools, an answer's) goes when its fight ends or breaks off. */
function clearPools(g: Game, e: Entity): void {
  for (const [pool, h] of [...g.ecs.c.hazard]) if (h.owner === e) g.ecs.despawn(pool);
}

export const AZATHOTH_SIGNATURE: Signature = {
  engage(g, _e, f) {
    f.sig.rest = Math.round(AZATHOTH.answer.rest / 2); // it does not answer in the first breath
    g.events.emit('Notice', { text: 'IT IS BLIND, AND HEARS · IT ANSWERS A SHOT OR A SPRINT WHERE IT WAS MADE' });
  },
  step(g, e, f) {
    const br = g.ecs.c.brain.get(e);
    if (br && br.cooldown <= BOSS.gap[1]) br.cooldown = Math.min(br.cooldown, AZATHOTH.pace[Math.min(f.phase, AZATHOTH.pace.length - 1)]); // (its own pause; one set on purpose, a long one, is left alone)
    if (f.sig.rest > 0) f.sig.rest--;
    if (g.ecs.c.actor.get(g.player.id)!.move === 'death') return;
    const gain = noise(g, lastPhase(f));
    f.sig.heed = Math.max(0, (f.sig.heed ?? 0) + (gain || -AZATHOTH.heed.fade));
    if (f.sig.heed >= 1 && !(f.sig.rest > 0)) answer(g, e, f);
  },
  reset: clearPools,
  end(g, e) {
    clearPools(g, e);
    g.events.emit('Title', { text: 'THE PIPING FADES · AZATHOTH SLUMBERS' });
  },
  status: (_g, _e, f) => `${MOVEMENTS[Math.min(f.phase, MOVEMENTS.length - 1)]}${(f.sig.heed ?? 0) >= AZATHOTH.listens ? ' · IT LISTENS' : ''}`,
  note(_g, _e, _f, phase) {
    return [null, 'THE THIRTEEN BEGIN TO DANCE · LEAVE THE GROUND THAT FILLS FIRST', 'THE CENTRE DRAWS ALL IN · ROLL AS IT BREAKS', 'IT HEARS EVERYTHING NOW · A ROLL AND A BLOW ARE ANSWERED TOO'][phase] ?? null;
  },
};
