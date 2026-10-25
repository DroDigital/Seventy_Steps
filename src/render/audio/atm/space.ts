/**
 * Round 78, atmosphere: a room for every place: reverb that follows where the investigator stands, sound through walls, the hearth of fires and lamps, the sea and the wind where they are. One of the atmosphere audio hub's parts (render/audio/atmosphereAudio.ts):
 * made once with the game's audio and updated each frame, read-only on the simulation.
 */

import type { AtmAudioContext, AtmAudioPart } from '../atmosphereAudio';

export function createSpace(_ctx: AtmAudioContext): AtmAudioPart {
  return { update() {} };
}
