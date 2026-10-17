/**
 * A thunderstorm's bolts on the ground, heard (round 52): the ring's crackle where it stands as it fills, and the crack where the bolt falls.
 * (The thunder after it is the sky's own: render/lightning.ts, struck by the same bolt.) Not rate-limited: they are rare.
 */
import { STORM_MIX, STRIKE_CRACK, STRIKE_WARN } from '../../data/stormSounds';
import type { Game } from '../../systems/components';
import type { GameAudio } from './gameAudio';

export function createStormAudio(g: Game, play: GameAudio['recipe'], sampleAt: GameAudio['sampleAt']): void {
  g.events.on('StrikeWarned', ({ at, radius }) => void play('storm:warn', STRIKE_WARN, { at, gain: STORM_MIX.warn, range: 70 + radius * 4, vary: 0.4 }));
  g.events.on('StrikeLanded', ({ at }) => {
    play('storm:crack', STRIKE_CRACK, { at, gain: STORM_MIX.crack, range: 160, vary: 0.4 });
    sampleAt('boom', at, { gain: 0.5, pitch: 0.7 + 0.1 * Math.random(), range: 160 });
  });
}
