/**
 * What the narrator says over each ending's cutscene (round 55): the Archivist, who read the opening's notebook (data/intro.ts), speaks the end of it. Three
 * lines to an ending, in the investigator's second person (the card that follows is too), each performed as the opening's cards are (Eleven v4 [audio tags],
 * never whispered; data/speech.ts) and recorded once in his voice (public/voice, docs/VOICES.md). The cutscenes lay them over their shots (data/cutscenesEndings.ts),
 * so `seconds` is each take's length, as measured on the recording: a take made again is measured again (tests/endingNarration.test.ts holds the two together).
 * The cards say what came after; these say the moment itself, and none repeats a sentence of a card. Data only.
 */

import type { EndingId } from './endings';
import { NARRATOR } from './intro';
import { shown, type Line } from './speech';

export interface Narrated {
  say: string; // the words as performed, with [audio tags] (the voices: data/speech.ts)
  seconds: number; // the recording's length
}

export const ENDING_NARRATION: Readonly<Record<EndingId, readonly Narrated[]>> = {
  seal: [
    { say: '[solemnly] The piping has stopped. [pause] You outlasted it, and now the whole dark is holding its breath, waiting to hear what you will ask of it.', seconds: 10.24 },
    { say: '[gravely] You ask for nothing. [pause] You close your hand around the key, and the key does the last thing a key can do. [pause] [calmly] It lets go of the Gate, and the Gate lets go of YOU.', seconds: 13.12 },
    { say: '[calmly] Far above you a clock is striking, and beneath its slow count there is a sound you had almost forgotten. [pause] [thoughtfully] Sleepers... breathing. [long pause] [solemnly] Wake.', seconds: 13.12 },
  ],
  silver_key: [
    { say: '[solemnly] The Guide does not look back to see whether you follow. [pause] It has walked this road before, and it knows what sort of traveller comes after.', seconds: 9.2 },
    { say: '[gravely] The Gate is not a door. [pause] [calmly] It is the place where the dream runs out of road, and what lies beyond is WIDER than any stair.', seconds: 10.32 },
    { say: '[thoughtfully] You leave the town behind, and the name they called you by. [pause] [heavily] You had thought you would be afraid. [pause] [calmly] You are not. [long pause] [solemnly] You were never meant to stay.', seconds: 11.52 },
  ],
  herald: [
    { say: '[ominously] He has waited at the foot of every stair you ever climbed, in the same good coat, with the same patient smile.', seconds: 8.64 },
    { say: '[gravely] He asks for nothing you have not already offered. [pause] [heavily] And the knee bends before the mind has agreed to it.', seconds: 7.28 },
    { say: '[ominously] Somewhere the blind god turns in its sleep, and the flutes begin again, far off... [pause] [heavily] and you, who silenced them, are the one they play for now.', seconds: 12.72 },
  ],
};

/** Every line the narrator says over the endings: what is shown, and how it is performed. */
export const endingLines = (): Line[] =>
  Object.values(ENDING_NARRATION).flatMap((lines) => lines.map((l): Line => ({ speaker: NARRATOR, text: shown(l.say), say: l.say })));
