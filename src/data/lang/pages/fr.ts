/** Les mots des pages du jeu, en français (pages/en.ts). */

import type { PageKey } from './en';

export const FR_PAGES: Readonly<Record<PageKey, string>> = {
  'journal.title': 'JOURNAL',
  'journal.tab.quests': 'En cours',
  'journal.tab.docs': 'Documents',
  'journal.tab.guide': 'Guide de terrain',
  'journal.tab.bestiary': 'Bestiaire',
  'journal.nothing': 'Rien pour l’instant. Parlez aux gens que vous rencontrez.',
  'journal.following': 'Suivi sur la carte',
  'journal.follow': 'Suivre sur la carte',
  'journal.stop': '◇ Arrêter',
  'journal.pin': '◇ Épingler  ›',
  'journal.storyAgain': 'La mini-carte et la carte mènent de nouveau à l’histoire.',
  'journal.leadsHere': 'Le ◇ de la mini-carte et de la carte mène ici, à la place de l’histoire.',
  'journal.done': 'ACCOMPLI · {n}',
  'journal.doneLine': '{title}. {done}',
  'journal.read': '{n} sur {of} trouvés et lus',
  'journal.noDocs': 'Les grimoires, notes et lettres sont gardés ici une fois lus.',
  'journal.tomes': 'GRIMOIRES · {n}',
  'journal.notes': 'NOTES ET LETTRES · {n}',
  'journal.beheld': '{n} sur {of} contemplées',
  'journal.creatures': 'Les créatures contemplées',
  'journal.creaturesNote': 'Chaque créature rencontrée : une note de terrain, ses habitudes, sa faiblesse, et où on la trouve.',
  'lead.fallen': '({n} sur {of} sont tombées.)',
  'lead.speak': 'Parlez à {name}, près du Signe des Anciens : {sign}.',
  'lead.anySign': 'un Signe des Anciens',
  'lead.rite': 'Approchez-vous d’une lumière pour l’allumer, ou interagissez quand vous êtes près. Le repère suit la lumière suivante.',
  'journey.theSign': 'LE SIGNE DES ANCIENS',
  'map.wakingWorld': 'Le Monde de l’éveil',
};
