/**
 * Recorded attack sounds, placed where each blow happens. Caster wind-ups, beams, teleports and
 * mind effects add no procedural tones. Recordings play on their own, including while other takes
 * are still loading; an unavailable take stays silent instead of falling back to a synth blip.
 */

import type { V3 } from '../../core/geom';
import { ATTACK_MIX } from '../../data/attackSounds';
import { RECORDED_FOR } from '../../data/samples';
import { moveDef } from '../../systems/actions';
import type { Game } from '../../systems/components';
import { creatureOf } from '../../systems/creatures';
import { attackLook, isThemed } from '../attackLook';
import { MATTER } from '../matterLook';
import type { GameAudio } from './gameAudio';

type Sample = (set: string, at: V3 | null, options?: Parameters<GameAudio['sampleAt']>[2]) => boolean;
const RANGE = { bolt: 70, burst: 110 } as const;

export function createAttackAudio(g: Game, sampleAt: Sample): void {
  const c = g.ecs.c;
  const loose = new Map<number, number>(); // owner → frame of its last bolt sound
  const play = (owner: number, kind: 'loose' | 'land' | 'burst', at: V3, gain: number, range: number): void => {
    const look = attackLook(g, owner);
    const set = RECORDED_FOR[`atk:${kind}:${look.motif}`];
    if (set) sampleAt(set, at, { gain: Math.min(1, gain), range });
  };

  g.events.on('BoltLoosed', ({ owner, at, fire, conjured }) => {
    if (fire || g.frame - (loose.get(owner) ?? -99) < 8) return; // a fan of bolts is one sound
    loose.set(owner, g.frame);
    play(owner, 'loose', at, ATTACK_MIX.loosed * (conjured ? 0.5 : 1), RANGE.bolt);
  });
  g.events.on('BoltLanded', ({ owner, at, on, fire, conjured }) => {
    if (fire || on === 'spent') return;
    play(owner, 'land', at, ATTACK_MIX.landed * (on === 'body' ? 0.55 : 1) * (conjured ? 0.5 : 1), RANGE.bolt);
  });
  g.events.on('Shot', ({ shooter, to }) => {
    if (shooter !== g.player.id) play(shooter, 'land', to, ATTACK_MIX.landed, RANGE.bolt);
  });
  g.events.on('Erupted', ({ at, radius, by, look }) => {
    play(by, 'burst', at, ATTACK_MIX.burst * (look ? 0.7 : 1), RANGE.burst);
    sampleAt('boom', at, { gain: 0.35 + 0.08 * radius, pitch: 0.75 + 0.1 * Math.random(), range: RANGE.burst });
    if (look) sampleAt(MATTER[look].sound, at, { gain: MATTER[look].gain, pitch: 0.85 + 0.2 * Math.random(), range: RANGE.burst }); // (round 70: a tentacle's wet crack, a star's strike, a gust of flame, thunder)
  });
  g.events.on('Quaked', ({ at, by, lane }) => {
    play(by, 'burst', at, ATTACK_MIX.burst * 0.9, RANGE.burst);
    if (lane) {
      sampleAt('gurgle', at, { gain: 0.8, pitch: 0.7, range: RANGE.burst }); // the sea gathering itself, and the roar of it
      sampleAt('rumble', at, { gain: 0.6, pitch: 0.8, range: RANGE.burst });
    }
  });
  g.events.on('Clouded', ({ at, by, kind }) => {
    play(by, 'burst', at, ATTACK_MIX.burst * 0.5, RANGE.burst);
    sampleAt(kind === 'toxic' ? 'hiss' : 'whisper', at, { gain: 0.6, pitch: kind === 'toxic' ? 0.8 : 0.7, range: RANGE.burst });
  });
  g.events.on('Swung', ({ entity, at }) => {
    const a = c.actor.get(entity);
    const h = a && moveDef(a)?.hit;
    if (!h || entity === g.player.id || !isThemed(creatureOf(g, entity)?.id)) return;
    if (h.reach < 0.05 || Math.abs(h.arc[0] - h.arc[1]) < 1) {
      play(entity, 'burst', at, ATTACK_MIX.burst * 0.8, RANGE.burst);
    }
    // Ordinary swings already have recorded foley; no extra synthesized layer.
  });
}
