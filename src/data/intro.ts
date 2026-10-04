/**
 * How a new game begins (playtest round 1; round 39: it was a telegram in capitals and four dense cards): a
 * telegram and four entries from the investigator's notebook, one short card at a time, each read aloud by the
 * narrator (data/speechIntro.ts: the same words, performed) before they wake in the dream. Data only.
 */

import { shown } from './speech';

export interface IntroCard {
  heading: string;
  say: string; // the words as the narrator performs them, with [audio tags] (the voices: data/speech.ts)
  telegram?: boolean; // typed, not written
}

/** The narrator's speaker: a library voice, resonant and mellow (data/speechCast.ts). */
export const NARRATOR = 'narrator:intro';

export const INTRO: readonly IntroCard[] = [
  {
    heading: 'Telegram · Arkham, Massachusetts · October 3rd, 1928',
    telegram: true,
    say: '[low voice] Come at once. [pause] Peaslee found asleep in the library Monday, and cannot be woken. [pause] Six more in town, the same. Will meet the Boston train. [long pause] [quietly] Armitage.',
  },
  {
    heading: 'From the notebook · October 5th',
    say: '[quietly] Eleven sleepers now, two of them children. [pause] Their eyes move under the lids, as if they were READING. [pause] All of them speak of the same things: a stair going down... a key... [low voice] and a tall man in a good coat.',
  },
  {
    heading: 'October 6th',
    say: '[thoughtfully] Armitage thinks Peaslee read what he should have left alone, and that the sleepers are not so much asleep as somewhere ELSE. [pause] He wants me to go after them.',
  },
  {
    heading: 'October 6th, later',
    say: '[quietly] He drew me the sign the old towns cut over their doors, and said that wherever I find it, I may rest. [pause] He gave me a lamp. [long pause] [low voice] I did not ask what it was for.',
  },
  {
    heading: 'October 6th, late',
    say: '[softly] I lay down on a bench in the reading room, a little after eleven, and heard the clock strike. [long pause] [whispers] When I opened my eyes, the lamps were out... and beyond the windows lay a town I did not know.',
  },
];

/** What a card shows: its performed words with the performance taken out. */
export const introText = (card: IntroCard): string => shown(card.say);

/** Under the title: the time and place, and what is wrong there. */
/** The game's name (proposed in playtest round 4; index.html's <title> matches it). */
export const GAME_NAME = 'Seventy Steps';

export const TITLE_LINES = ['Arkham, Massachusetts · October 1928', 'Eleven people in Arkham have fallen asleep and cannot be woken.'] as const;
