/**
 * Boss music (playtest round 4; recorded in round 44): while a boss fight is engaged its theme sounds
 * (bossThemes.ts: a recording of the track that scores it, on a seamless loop, rising with the
 * phases), and the procedural score (bossScore.ts: a bowed ostinato, timpani, a choir) plays where
 * there is no recording yet: a horror with no theme, a file that is missing or failed, or one still
 * loading when the fight begins (the score plays at once, and the theme takes over from it by a
 * crossfade when it is ready). This is the one entry gameAudio.ts calls.
 */

import { BOSS_MUSIC, type BossTrackId } from '../../data/bossMusic';
import type { Scored } from './bossPlan';
import { createBossScore } from './bossScore';
import { createBossThemes } from './bossThemes';
import type { AudioEngine } from './engine';

export type { Scored };

/** What the sound needs to know of the fights each frame. */
export interface BossState {
  fights: readonly Scored[]; // engaged
  warm: BossTrackId | null; // the theme of the nearest horror yet to be met
  scene: boolean; // a cutscene has the screen
}

export interface BossMusic {
  update(state: BossState): void;
  /** A horror's line is spoken for `seconds`: the theme goes low under it. */
  duck(seconds: number): void;
}

/** What the procedural score is told: the first fight while no theme sounds; else nothing, and to give way over the takeover. */
export const scoreFor = (state: Pick<BossState, 'fights'>, sounding: BossTrackId | null): [Scored | null, number | undefined] => (sounding ? [null, BOSS_MUSIC.takeover] : [state.fights[0] ?? null, undefined]);

export function createBossMusic(e: AudioEngine): BossMusic {
  const score = createBossScore(e);
  const themes = createBossThemes(e);
  return {
    duck: (seconds) => themes.duck(seconds),
    update(state) {
      const { sounding } = themes.update({ ...state, replacing: score.playing });
      const [fight, release] = scoreFor(state, sounding); // a theme that sounds takes over from the procedural score
      score.update(fight, release);
    },
  };
}
