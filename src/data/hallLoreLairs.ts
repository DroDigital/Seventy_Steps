/**
 * The lairs' boss halls, each its own (round 108; the types and the great dungeons' halls are in hallLore.ts). Data only.
 */

import type { HallLore } from './hallLore';

export const LAIR_LORE: Readonly<Record<string, HallLore>> = {
  // Muñoz's cold room: the refrigerating plant's pipes on every wall and under the ceiling, icicles.
  dr_munoz: {
    pillars: 'four', pillar: 'pipe', glow: [0.7, 0.85, 0.95],
    walls: [{ what: 'pipes', on: 'all' }],
    roof: ['icicles'],
  },
  // The alchemist's laboratory under the castle: books and his vessels on the walls, an iron wheel of candles overhead.
  charles_le_sorcier: {
    pillars: 'colonnade', pillar: 'cluster', glow: [0.86, 0.56, 0.2],
    walls: [{ what: 'shelves', on: 'sides' }, { what: 'specimens', on: 'far' }, { what: 'chains', on: 'entry', every: 2 }],
    roof: ['chandelier', 'chains'],
  },
  // The castle's lit ballroom where the Outsider saw the mirror: mirrors in gilt frames down its sides, curtained windows,
  // chandeliers.
  the_outsider: {
    pillars: 'colonnade', pillar: 'fluted', glow: [0.96, 0.82, 0.55],
    walls: [{ what: 'mirror', on: 'sides' }, { what: 'drapes', on: 'far', colour: [0.42, 0.1, 0.12] }, { what: 'drapes', on: 'entry', every: 2, colour: [0.42, 0.1, 0.12] }],
    roof: ['chandelier'],
  },
  // St John's tomb and the hound's: skulls in niches, roots overhead.
  the_hound: {
    pillars: 'ring', pillar: 'bones', glow: [0.5, 0.7, 0.42],
    walls: [{ what: 'niche', on: 'all', holds: 'skull' }],
    roof: ['chains'],
  },
  // The deserted house's attic, where it came through the window: the boards slant and ragged, papers.
  the_unnamable: {
    pillars: 'colonnade', pillar: 'post', glow: [0.6, 0.66, 0.55],
    walls: [{ what: 'slant', on: 'sides' }, { what: 'papers', on: 'far' }],
    roof: ['ropes'],
  },
  // Carter's tomb in the swamp: roots through every wall and niches of urns.
  voice_in_the_tomb: {
    pillars: 'four', pillar: 'square', glow: [0.6, 0.72, 0.3],
    walls: [{ what: 'roots', on: 'all' }, { what: 'niche', on: 'far', holds: 'urn' }],
    roof: [],
  },
  // The Shunned House's cellar: roots and the old shelves, and the hearth.
  shunned_house_entity: {
    pillars: 'four', pillar: 'brick', glow: [0.76, 0.8, 0.5],
    walls: [{ what: 'roots', on: 'sides' }, { what: 'growth', on: 'all', every: 2 }, { what: 'shelves', on: 'entry', every: 2 }],
    roof: [],
    far: 'hearth',
  },
  // The vaults under Red Hook, Lilith's: red curtains, chains.
  lilith: {
    pillars: 'four', pillar: 'onyx', glow: [0.86, 0.6, 0.26],
    walls: [{ what: 'drapes', on: 'sides', colour: [0.46, 0.08, 0.1] }, { what: 'niche', on: 'entry', holds: 'idol' }, { what: 'chains', on: 'sides', every: 3 }],
    roof: ['chains', 'lamps'],
  },
  // The Terrible Old Man's house in Kingsport: sea charts, shelves of his bottles, nets; and overhead his bottles hung on their
  // strings, a lead pendulum in each.
  terrible_old_man: {
    pillars: 'ring', pillar: 'mast', glow: [0.7, 0.76, 0.62],
    walls: [{ what: 'charts', on: 'sides' }, { what: 'shelves', on: 'far' }, { what: 'nets', on: 'entry' }],
    roof: ['pendulums'],
  },
  // The Whateleys' upper story, its floors knocked through.
  wilbur_whateley: {
    pillars: 'colonnade', pillar: 'post', glow: [0.56, 0.5, 0.34],
    walls: [{ what: 'slant', on: 'sides', every: 2 }, { what: 'shelves', on: 'far' }],
    roof: ['ropes'],
  },
  // The Waite house study: his books, and the house's windows.
  ephraim_waite: {
    pillars: 'colonnade', pillar: 'post', glow: [0.4, 0.56, 0.64],
    walls: [{ what: 'shelves', on: 'sides' }, { what: 'charts', on: 'entry', every: 2 }],
    roof: ['lamps'],
  },
  // The sculptor's studio in the tower: busts in niches, a window of the night and a dome of painted stars.
  hypnos: {
    pillars: 'colonnade', pillar: 'fluted', glow: [0.76, 0.8, 1],
    walls: [{ what: 'niche', on: 'sides', holds: 'bust' }, { what: 'lancet', on: 'far', colour: [0.16, 0.2, 0.42] }],
    roof: ['dome', 'stars', 'oculus'],
  },
  // Zann's garret in the Rue d'Auseil: his papers pinned up, the rafters low.
  zann_window_thing: {
    pillars: 'ring', pillar: 'post', glow: [0.5, 0.55, 0.76],
    walls: [{ what: 'papers', on: 'all' }],
    roof: ['ropes'],
  },
};
