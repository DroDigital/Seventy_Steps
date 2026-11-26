/** Las palabras de las páginas del juego, en español (pages/en.ts). */

import type { PageKey } from './en';

export const ES_PAGES: Readonly<Record<PageKey, string>> = {
  'journal.title': 'DIARIO',
  'journal.tab.quests': 'En curso',
  'journal.tab.docs': 'Documentos',
  'journal.tab.guide': 'Guía de campo',
  'journal.tab.bestiary': 'Bestiario',
  'journal.nothing': 'Nada todavía. Habla con la gente que encuentres.',
  'journal.following': 'Siguiendo en el mapa',
  'journal.follow': 'Seguir en el mapa',
  'journal.stop': '◇ Dejar',
  'journal.pin': '◇ Fijar  ›',
  'journal.storyAgain': 'El minimapa y el mapa vuelven a llevar a la historia.',
  'journal.leadsHere': 'El ◇ del minimapa y del mapa lleva hasta aquí, en lugar de a la historia.',
  'journal.done': 'HECHO · {n}',
  'journal.doneLine': '{title}. {done}',
  'journal.read': '{n} de {of} encontrados y leídos',
  'journal.noDocs': 'Los tomos, notas y cartas se guardan aquí una vez leídos.',
  'journal.tomes': 'TOMOS · {n}',
  'journal.notes': 'NOTAS Y CARTAS · {n}',
  'journal.beheld': '{n} de {of} contempladas',
  'journal.creatures': 'Las criaturas contempladas',
  'journal.creaturesNote': 'Cada criatura encontrada: una nota de campo, sus hábitos, su debilidad y dónde se la encuentra.',
  'lead.fallen': '({n} de {of} han caído.)',
  'lead.speak': 'Habla con {name}, junto al Signo Arcano: {sign}.',
  'lead.anySign': 'un Signo Arcano',
  'lead.rite': 'Acércate a una luz para encenderla, o interactúa cuando estés cerca. El marcador sigue a la luz siguiente.',
};
