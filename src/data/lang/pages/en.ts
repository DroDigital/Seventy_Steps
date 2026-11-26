/**
 * The words of the game's pages in English (1.5.0): the journal, the quest lead, and what the other pages say about what they show.
 * Spread into the English table (data/lang/en.ts), so `t('journal.title')` reads them like any other line; each language holds the
 * same keys (pages/de.ts, fr.ts, es.ts), which their compile asks for.
 */

export const EN_PAGES = {
  // the journal (ui/journal.ts)
  'journal.title': 'JOURNAL',
  'journal.tab.quests': 'Under way',
  'journal.tab.docs': 'Documents',
  'journal.tab.guide': 'Field Guide',
  'journal.tab.bestiary': 'Bestiary',
  'journal.nothing': 'Nothing yet. Talk to the people you meet.',
  'journal.following': 'Following on map',
  'journal.follow': 'Follow on the map',
  'journal.stop': '◇ Stop',
  'journal.pin': '◇ Pin  ›',
  'journal.storyAgain': 'The minimap and the map lead to the story again.',
  'journal.leadsHere': 'The ◇ on the minimap and the map leads to this, in place of the story.',
  'journal.done': 'DONE · {n}',
  'journal.doneLine': '{title}. {done}',
  'journal.read': '{n} of {of} found and read',
  'journal.noDocs': 'Tomes, notes and letters are kept here once read.',
  'journal.tomes': 'TOMES · {n}',
  'journal.notes': 'NOTES AND LETTERS · {n}',
  'journal.beheld': '{n} of {of} beheld',
  'journal.creatures': 'The creatures beheld',
  'journal.creaturesNote': 'Each creature met: a field note, its habits, its weakness, and where it is found.',
  // where the story leads (systems/lead.ts)
  'lead.fallen': '({n} of {of} have fallen.)',
  'lead.speak': 'Speak with {name}, by the Elder Sign at {sign}.',
  'lead.anySign': 'an Elder Sign',
  'lead.rite': 'Approach a light to kindle it, or interact when nearby. The marker follows the next light.',
  // travel and the map's realms (ui/journeys.ts, ui/mapRealms.ts)
  'journey.theSign': 'THE ELDER SIGN',
  'map.wakingWorld': 'The Waking World',
} as const satisfies Record<string, string>;

export type PageKey = keyof typeof EN_PAGES;
