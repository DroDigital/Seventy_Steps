/**
 * Round 78, atmosphere: what is under the foot: the ground heard, and coat, satchel and lantern as the body moves. One of the atmosphere audio hub's parts (render/audio/atmosphereAudio.ts):
 * made once with the game's audio and updated each frame, read-only on the simulation.
 */

import type { AtmAudioContext, AtmAudioPart } from '../atmosphereAudio';

export function createFooting(_ctx: AtmAudioContext): AtmAudioPart {
  return { update() {} };
}
