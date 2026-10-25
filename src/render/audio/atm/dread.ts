/**
 * Round 78, atmosphere: the failing mind heard: ringing ears, a step behind that is not the investigator's, the lantern guttering
 * out. One of the atmosphere audio hub's parts (render/audio/atmosphereAudio.ts): made once with the game's audio and updated each
 * frame, read-only on the simulation.
 */

import type { AtmAudioContext, AtmAudioPart } from '../atmosphereAudio';

export function createMindEars(_ctx: AtmAudioContext): AtmAudioPart {
  return { update() {} };
}
