/**
 * The dungeons' traps heard (2026-11-27; data/trapSounds.ts the recipes, systems/dungeonTraps.ts the events): each mechanism's warning at
 * the place it comes from (the slot in the wall, the far end of a boulder's lane, the nozzle), and its stroke. Darts in a volley and a
 * blade's passes are rate-limited, so a room of blades is a rhythm and not a din. Render only.
 */

import type { TrapKind } from '../../data/dungeonTraps';
import { TRAP_MIX, TRAP_SPRUNG, TRAP_WARN } from '../../data/trapSounds';
import type { Game } from '../../systems/components';
import type { GameAudio } from './gameAudio';

const GAP = 5; // frames: two of one kind's sounds this close are one

export function createTrapAudio(g: Game, play: GameAudio['recipe']): void {
  const last = new Map<string, number>();
  const once = (key: string): boolean => {
    if (g.frame - (last.get(key) ?? -99) < GAP) return false;
    last.set(key, g.frame);
    return true;
  };
  g.events.on('TrapWarned', ({ kind, at }) => {
    const s = TRAP_WARN[kind as TrapKind];
    if (s && once(`w:${kind}`)) play(`trap:warn:${kind}`, s, { at, gain: TRAP_MIX.gain, range: TRAP_MIX.range, vary: 0.6 });
  });
  g.events.on('TrapSprung', ({ kind, at }) => {
    const s = TRAP_SPRUNG[kind as TrapKind];
    if (s && once(`s:${kind}`)) play(`trap:sprung:${kind}`, s, { at, gain: kind === 'blades' ? TRAP_MIX.blades : TRAP_MIX.gain, range: TRAP_MIX.range, vary: 0.6 });
  });
}
