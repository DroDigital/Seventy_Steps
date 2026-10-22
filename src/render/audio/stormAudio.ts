/**
 * A thunderstorm's bolts on the ground, heard (round 52): the ring's crackle where it stands as it fills, and the crack where the bolt falls:
 * since round 59 a recording of a close strike (`strike`: four CC0 takes, the crack, the air tearing and the crash), with the low boom under
 * it; round 66 added the snap of the charge (`zap`) over it and made the ring a recorded hum (`charge`); the recipes of round 52, which
 * were heard as blips, only until the recordings have loaded. (The thunder after it is the sky's own:
 * render/lightning.ts, struck by the same bolt.) Not rate-limited: they are rare.
 */
import { STORM_MIX, STRIKE_CRACK, STRIKE_WARN } from '../../data/stormSounds';
import type { Game } from '../../systems/components';
import type { GameAudio } from './gameAudio';

export function createStormAudio(g: Game, play: GameAudio['recipe'], sampleAt: GameAudio['sampleAt']): void {
  g.events.on('StrikeWarned', ({ at, radius }) => {
    const range = 70 + radius * 4;
    if (!sampleAt('charge', at, { gain: STORM_MIX.charge, range })) play('storm:warn', STRIKE_WARN, { at, gain: STORM_MIX.warn, range, vary: 0.4 });
  });
  g.events.on('StrikeLanded', ({ at }) => {
    if (!sampleAt('strike', at, { gain: STORM_MIX.strike, range: 220 })) play('storm:crack', STRIKE_CRACK, { at, gain: STORM_MIX.crack, range: 160, vary: 0.4 });
    else sampleAt('zap', at, { gain: STORM_MIX.zap, range: 200 });
    sampleAt('boom', at, { gain: 0.35, pitch: 0.7 + 0.1 * Math.random(), range: 160 });
  });
}
