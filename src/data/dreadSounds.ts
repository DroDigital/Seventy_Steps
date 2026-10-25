/**
 * Round 80, atmosphere: the sound recipes of the picture's dread (render/shock.ts). Not stingers (tests/soundMix.test.ts asks every stinger to
 * be heard); a thin ringing that comes in a moment after a sudden large loss of the mind and thins over several seconds, in the head.
 */

import { SHOCK } from './dreadPicture';
import { tone, type Sound } from './sounds';

/** Tinnitus: two sines a few hertz apart, so the tone shimmers as it thins. */
export const RING: Sound = [
  tone('sine', SHOCK.tone.hz, SHOCK.tone.seconds, 0.5, { attack: 0.14, at: SHOCK.ringAt }),
  tone('sine', SHOCK.tone.hz + SHOCK.tone.beat, SHOCK.tone.seconds, 0.5, { attack: 0.14, at: SHOCK.ringAt }),
];
