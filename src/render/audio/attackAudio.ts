/**
 * A horror's blows, heard (round 51). Before this a boss's bolt, eruption, summoning, teleport and gaze
 * had only the attack library's motion sound (a whoosh, a boom); now each is also heard as its matter
 * (`data/attackSounds`: the sea splashes, stone cracks, fire crackles, frost shatters...), where it
 * happens: a bolt as it leaves and as it lands, a burst, a swing's opening, a summoning, an arrival
 * and the departure from where it was, a phase change; what is kept up (a beam, a vortex, a gaze) as
 * a hum laid end to end; and the gathering that comes before a caster's blow, rising to its release
 * (the same frames as the light that gathers, `render/windup`). Rate-limited so a volley of five is one
 * sound, not five. The ground of the sound is the horror's own element (`render/attackLook`).
 */

import type { V3 } from '../../core/geom';
import { ATTACK_MIX, TIMBRE, arrive, burst, DARKNESS, depart, gather, GAZE_BURST, gazeTone, hum, landed, loosed, phase, summon, swing, type Timbre } from '../../data/attackSounds';
import { moveDef } from '../../systems/actions';
import { isAbsent, type Game } from '../../systems/components';
import { creatureOf } from '../../systems/creatures';
import { attackLook, isThemed } from '../attackLook';
import { GATHER, releaseFrame } from '../windup';
import type { GameAudio } from './gameAudio';

export interface AttackAudio {
  /** Keeps up the hums and gathers; `seconds` since the last call. */
  update(seconds: number): void;
}

type Play = GameAudio['recipe'];
type Sample = GameAudio['sampleAt'];

const RANGE = { bolt: 70, burst: 110, phase: 170 } as const;

export function createAttackAudio(g: Game, play: Play, sampleAt: Sample): AttackAudio {
  const c = g.ecs.c;
  const timbreOf = (id: number): { t: Timbre; key: string } => {
    const motif = attackLook(g, id).motif;
    return { t: TIMBRE[motif], key: motif };
  };
  const loose = new Map<number, number>(); // owner → frame of its last bolt sound
  let now = 0;
  const humAt = new Map<string, number>(); // what kept up → second of its last breath
  const gathered = new Map<number, string>(); // actor → the move whose gathering has begun

  g.events.on('BoltLoosed', ({ owner, at, fire, conjured }) => {
    if (fire || g.frame - (loose.get(owner) ?? -99) < 8) return; // a fan of bolts is one sound
    loose.set(owner, g.frame);
    const { t, key } = timbreOf(owner);
    play(`atk:loose:${key}`, loosed(t), { at, gain: ATTACK_MIX.loosed * (conjured ? 0.5 : 1), range: RANGE.bolt });
  });
  g.events.on('BoltLanded', ({ owner, at, on, radius, fire, conjured }) => {
    if (fire || on === 'spent') return;
    const { t, key } = timbreOf(owner);
    play(`atk:land:${key}`, landed(t, Math.min(1, radius / 0.9)), { at, gain: ATTACK_MIX.landed * (on === 'body' ? 0.55 : 1) * (conjured ? 0.5 : 1), range: RANGE.bolt });
  });
  g.events.on('Shot', ({ shooter, to }) => {
    if (shooter === g.player.id) return;
    const { t, key } = timbreOf(shooter);
    play(`atk:land:${key}`, landed(t, 0.7), { at: to, gain: ATTACK_MIX.landed, range: RANGE.bolt });
  });
  g.events.on('Erupted', ({ at, radius, by }) => {
    const { t, key } = timbreOf(by);
    play(`atk:burst:${key}`, burst(t, Math.min(1, radius / 4)), { at, gain: ATTACK_MIX.burst, range: RANGE.burst });
    sampleAt('boom', at, { gain: 0.35 + 0.08 * radius, pitch: 0.75 + 0.1 * Math.random(), range: RANGE.burst });
  });
  g.events.on('Quaked', ({ at, by }) => {
    const { t, key } = timbreOf(by);
    play(`atk:burst:${key}`, burst(t, 0.9), { at, gain: ATTACK_MIX.burst * 0.9, range: RANGE.burst });
  });
  g.events.on('Swung', ({ entity, at }) => {
    const h = moveDef(c.actor.get(entity)!)?.hit;
    if (!h || entity === g.player.id || !isThemed(creatureOf(g, entity)?.id)) return;
    const { t, key } = timbreOf(entity);
    if (h.reach < 0.05 || Math.abs(h.arc[0] - h.arc[1]) < 1) {
      play(`atk:burst:${key}`, burst(t, Math.min(1, (h.radius + 0.4) / 4)), { at, gain: ATTACK_MIX.burst * 0.8, range: RANGE.burst });
    } else play(`atk:swing:${key}`, swing(t, Math.min(1, h.reach / 4)), { at, gain: ATTACK_MIX.swing, range: RANGE.bolt });
  });
  g.events.on('Summoned', ({ entity, by }) => {
    const p = c.transform.get(entity)?.pos;
    if (!p) return;
    const { t, key } = timbreOf(by);
    play(`atk:summon:${key}`, summon(t), { at: p, gain: ATTACK_MIX.summon, range: RANGE.burst });
  });
  g.events.on('Teleported', ({ entity, from, to }) => {
    const { t, key } = timbreOf(entity);
    play(`atk:depart:${key}`, depart(t), { at: from, gain: ATTACK_MIX.depart, range: RANGE.bolt });
    play(`atk:arrive:${key}`, arrive(t), { at: to, gain: ATTACK_MIX.arrive, range: RANGE.bolt });
  });
  g.events.on('Darkened', () => void play('atk:dark', DARKNESS, { gain: ATTACK_MIX.dark }));
  g.events.on('GazeBurst', () => void play('atk:gaze', GAZE_BURST, { gain: ATTACK_MIX.gazeBurst }));
  g.events.on('BossPhase', ({ entity, phase: n }) => {
    const p = c.transform.get(entity)?.pos;
    if (!p || n === 0) return;
    const { t, key } = timbreOf(entity);
    play(`atk:phase:${key}`, phase(t), { at: p, gain: ATTACK_MIX.phase, range: RANGE.phase });
  });

  /** One breath of a kept-up hum if `every` seconds have passed since the last of `key`. */
  const breathe = (key: string, every: number, at: V3 | null, sound: () => Parameters<Play>[1], gain: number): void => {
    if (now - (humAt.get(key) ?? -99) < every) return;
    humAt.set(key, now);
    play(`atk:hum:${key.split(':')[0]}`, sound(), { at, gain, range: RANGE.bolt, vary: 0.4 });
  };

  return {
    update(seconds) {
      now += seconds;
      for (const [id, a] of c.actor) {
        const def = moveDef(a);
        if (id === g.player.id || !def || a.frozen || isAbsent(g, id) || c.dead.has(id)) continue;
        const rel = releaseFrame(def);
        if (rel !== undefined && a.frame >= rel - GATHER && a.frame < rel) {
          if (gathered.get(id) !== a.move) {
            gathered.set(id, a.move ?? '');
            const p = c.transform.get(id)?.pos;
            const { t, key } = timbreOf(id);
            if (p) play(`atk:gather:${key}`, gather(t, GATHER / 60), { at: p, gain: ATTACK_MIX.gather, range: RANGE.bolt });
          }
        } else if (gathered.has(id) && a.frame < (rel ?? 0) - GATHER) gathered.delete(id);
        const p = c.transform.get(id)?.pos;
        if (!p) continue;
        const sw = def.sweep;
        if (sw && a.frame >= sw.window[0] && a.frame < sw.window[1]) breathe(`beam:${id}`, 0.17, p, () => hum(timbreOf(id).t, 'beam', 0.2), ATTACK_MIX.hum);
        const pl = def.pull;
        if (pl && a.frame >= pl.window[0] - 20 && a.frame < pl.window[1]) breathe(`vortex:${id}`, 0.28, p, () => hum(timbreOf(id).t, 'vortex', 0.3), ATTACK_MIX.hum * 1.4);
        const ef = def.effect;
        if (ef?.kind === 'gaze' && a.frame >= ef.window[0] && a.frame < ef.window[1] && g.reality.gaze > 0.02) breathe(`gaze:${id}`, 0.22, null, () => gazeTone(g.reality.gaze), ATTACK_MIX.gaze);
      }
      if (gathered.size > 24) for (const id of gathered.keys()) if (!c.actor.has(id)) gathered.delete(id);
    },
  };
}
