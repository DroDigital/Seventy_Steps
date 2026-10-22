/**
 * The ways, heard (round 62; systems/ways.ts, render/wayFx.ts): the gathering where a plate, a vent or a wave marks its ring, rising to the
 * burst, each in the timbre of what it is made of (data/attackSounds.ts: the same matters a horror's blows are), and a line said on a way with
 * what is heard under it. Rate-limited, so a wave of twelve rings is a sweep and not twelve sounds. Render only.
 */

import { ATTACK_MIX, burst, gather, TIMBRE } from '../../data/attackSounds';
import type { SampleSetId } from '../../data/samples';
import type { Game } from '../../systems/components';
import { motifOf } from '../wayFx';
import type { GameAudio } from './gameAudio';

const RANGE = 70;
const GAP = 7; // frames: rings marked this close together are one sound

export function createWayAudio(g: Game, play: GameAudio['recipe'], recorded: (set: string, at: { x: number; y: number; z: number } | null, o?: { gain?: number; pitch?: number }) => boolean): void {
  let warned = -99;
  let landed = -99;
  g.events.on('WardWarned', ({ at, look, frames, mute }) => {
    if (mute || g.frame - warned < GAP) return;
    warned = g.frame;
    const motif = motifOf(look);
    play(`way:warn:${motif}`, gather(TIMBRE[motif], Math.min(0.9, frames / 60)), { at, gain: ATTACK_MIX.landed * 0.55, range: RANGE });
  });
  g.events.on('WardLanded', ({ at, radius, look, mute }) => {
    if (mute || g.frame - landed < GAP) return;
    landed = g.frame;
    const motif = motifOf(look);
    play(`way:burst:${motif}`, burst(TIMBRE[motif], Math.min(1, radius / 4)), { at, gain: ATTACK_MIX.burst * 0.8, range: RANGE + 20 });
  });
  g.events.on('WayOmen', ({ sound, pitch }) => void (sound && recorded(sound as SampleSetId, null, { gain: 0.85, pitch })));
}
