/** Die Worte der Seiten des Spiels, auf Deutsch (pages/en.ts). */

import type { PageKey } from './en';

export const DE_PAGES: Readonly<Record<PageKey, string>> = {
  'journal.title': 'TAGEBUCH',
  'journal.tab.quests': 'Unterwegs',
  'journal.tab.docs': 'Schriften',
  'journal.tab.guide': 'Feldführer',
  'journal.tab.bestiary': 'Bestiarium',
  'journal.nothing': 'Noch nichts. Sprecht mit den Menschen, denen ihr begegnet.',
  'journal.following': 'Auf der Karte verfolgt',
  'journal.follow': 'Auf der Karte verfolgen',
  'journal.stop': '◇ Beenden',
  'journal.pin': '◇ Anheften  ›',
  'journal.storyAgain': 'Minikarte und Karte führen wieder zur Geschichte.',
  'journal.leadsHere': 'Die ◇ auf Minikarte und Karte führt hierhin, statt zur Geschichte.',
  'journal.done': 'ERLEDIGT · {n}',
  'journal.doneLine': '{title}. {done}',
  'journal.read': '{n} von {of} gefunden und gelesen',
  'journal.noDocs': 'Folianten, Notizen und Briefe werden hier aufbewahrt, sobald sie gelesen sind.',
  'journal.tomes': 'FOLIANTEN · {n}',
  'journal.notes': 'NOTIZEN UND BRIEFE · {n}',
  'journal.beheld': '{n} von {of} erblickt',
  'journal.creatures': 'Die erblickten Wesen',
  'journal.creaturesNote': 'Jedes Wesen, dem ihr begegnet seid: eine Feldnotiz, seine Gewohnheiten, seine Schwäche und wo es zu finden ist.',
  'lead.fallen': '({n} von {of} sind gefallen.)',
  'lead.speak': 'Sprecht mit {name}, beim Ältesten Zeichen: {sign}.',
  'lead.anySign': 'ein Ältestes Zeichen',
  'lead.rite': 'Nähert euch einem Licht, um es zu entzünden, oder interagiert in seiner Nähe. Die Markierung folgt dem nächsten Licht.',
  'journey.theSign': 'DAS ÄLTESTE ZEICHEN',
  'map.wakingWorld': 'Die Wache Welt',
};
