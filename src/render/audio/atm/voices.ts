/**
 * Round 78, atmosphere: the night's own voices: far sounds by the hour and by the realm, the failing mind heard, something that walks behind, the breath of a sleeping colossus. One of the atmosphere audio hub's parts (render/audio/atmosphereAudio.ts):
 * made once with the game's audio and updated each frame, read-only on the simulation.
 */

import type { AtmAudioContext, AtmAudioPart } from '../atmosphereAudio';

export function createNightVoices(_ctx: AtmAudioContext): AtmAudioPart {
  return { update() {} };
}
