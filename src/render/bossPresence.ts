/**
 * A horror's presence in the picture (round 81; render only, read-only on the simulation). Two things the
 * simulation says and the picture did not show:
 * - how deep in its fight it is: the phases of a fight were one burst of light and a shake, and then the same
 *   body; now each phase is worn (`deep`: its glints and halo burn higher, its aura gives off more);
 * - how loud its voice is: the horrors speak at their arrival and their fall and nothing in the picture
 *   followed the recording; the recording's own loudness (core/pace.ts `voiceLevel`) now makes the picture
 *   breathe and the eyes flare as each word is said (`voice`).
 */

import type { Entity } from '../core/ecs';
import { voiceLevel } from '../core/pace';
import { BOSS_PRESENCE } from '../data/fxTuning';
import type { Game } from '../systems/components';
import { creatureOf } from '../systems/creatures';

export interface BossPresence {
  /** 0 at a horror's first phase to 1 at its last, while it is fought; 0 for every other body. */
  deep(id: Entity): number;
  /** 0..1: how loudly the horror's voice is sounding now, eased (called once a drawn frame for each body). */
  voice(id: Entity, time: number): number;
}

interface Line {
  curve: Float32Array;
  rate: number;
  seconds: number;
  start: number | null; // the render second it began to sound (told at the next frame)
}

export function createBossPresence(g: Game): BossPresence {
  const lines = new Map<string, Line>(); // by the roster id of the speaker
  const eased = new Map<Entity, { level: number; at: number }>();
  g.events.on('Speaking', ({ speaker, curve, rate, seconds }) => {
    if (speaker.startsWith('boss:')) lines.set(speaker.slice(5), { curve, rate, seconds, start: null });
  });
  g.events.on('Silenced', () => lines.clear());
  return {
    deep(id) {
      const f = g.ecs.c.fight.get(id);
      return f?.engaged ? Math.min(1, f.phase / Math.max(1, f.script.phases.length - 1)) : 0;
    },
    voice(id, time) {
      const roster = creatureOf(g, id)?.id;
      const line = roster ? lines.get(roster) : undefined;
      if (!line && !eased.has(id)) return 0; // (the many that never speak keep no state)
      const was = eased.get(id) ?? { level: 0, at: time };
      let raw = 0;
      if (line) {
        line.start ??= time;
        const since = time - line.start;
        if (since > line.seconds + 0.3) lines.delete(roster!);
        else raw = voiceLevel(line.curve, since, line.rate);
      }
      const k = Math.min(1, Math.max(0, time - was.at) / (raw > was.level ? BOSS_PRESENCE.voiceAttack : BOSS_PRESENCE.voiceRelease));
      const level = was.level + (raw - was.level) * k;
      if (level < 0.002 && !line) eased.delete(id);
      else eased.set(id, { level, at: time });
      return level;
    },
  };
}
