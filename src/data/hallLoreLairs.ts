/**
 * The lairs' boss halls, each its own (round 108; the types and the great dungeons' halls are in hallLore.ts). Data only.
 */

import type { HallLore } from './hallLore';

export const LAIR_LORE: Readonly<Record<string, HallLore>> = {
  // Muñoz's cold room: the refrigerating plant's pipes on every wall and under the ceiling, frost on the floor about the drain, icicles.
  dr_munoz: {
    pillars: 'four', pillar: 'pipe', reach: 6, glow: [0.7, 0.85, 0.95],
    sigil: [
      { ink: 'iron', shapes: [{ poly: 4, r: 2.4, w: 0.16, turn: 45 }, { line: [-1.5, -0.55, 1.5, -0.55], w: 0.1 }, { line: [-1.5, 0, 1.5, 0], w: 0.1 }, { line: [-1.5, 0.55, 1.5, 0.55], w: 0.1 }] },
      { ink: 'pale', colour: [0.84, 0.9, 0.94], shapes: [{ scatter: 40, from: 4, to: 14, size: 0.9, seed: 3 }] },
    ],
    walls: [{ what: 'pipes', on: 'all' }],
    roof: ['icicles'],
  },
  // The alchemist's laboratory under the castle: the squared circle chalked on the flags, the triangle in it, the elixir's glow at its
  // heart; books and his vessels on the walls, an iron wheel of candles overhead.
  charles_le_sorcier: {
    pillars: 'colonnade', pillar: 'cluster', reach: 14.5, glow: [0.86, 0.56, 0.2],
    sigil: [
      { ink: 'chalk', shapes: [{ poly: 4, r: 12.5, w: 0.25, turn: 45 }, { ring: 8.4, w: 0.2 }, { poly: 3, r: 8.1, w: 0.2 }, { ring: 3.4, w: 0.15 }] },
      { ink: 'glow', shapes: [{ disc: 1.2 }] },
    ],
    walls: [{ what: 'shelves', on: 'sides' }, { what: 'specimens', on: 'far' }, { what: 'chains', on: 'entry', every: 2 }],
    roof: ['chandelier', 'chains'],
  },
  // The castle's lit ballroom where the Outsider saw the mirror: a compass of marquetry in the floor, mirrors in gilt frames down its
  // sides, curtained windows, chandeliers.
  the_outsider: {
    pillars: 'colonnade', pillar: 'fluted', reach: 14.5, glow: [0.96, 0.82, 0.55],
    sigil: [
      { ink: 'gilt', shapes: [{ star: 8, step: 3, r: 11, w: 0.3 }, { poly: 8, r: 12.6, w: 0.2, turn: 22.5 }] },
      { ink: 'pale', shapes: [{ ring: 14, w: 0.5 }] },
      { ink: 'dark', shapes: [{ poly: 8, r: 3, w: 0, fill: true, turn: 22.5 }] },
    ],
    walls: [{ what: 'mirror', on: 'sides' }, { what: 'drapes', on: 'far', colour: [0.42, 0.1, 0.12] }, { what: 'drapes', on: 'entry', every: 2, colour: [0.42, 0.1, 0.12] }],
    roof: ['chandelier'],
  },
  // St John's tomb and the hound's: the jade amulet's winged shape in a green light, a ring of bone, skulls in niches, roots overhead.
  the_hound: {
    pillars: 'ring', pillar: 'bones', reach: 14.5, glow: [0.5, 0.7, 0.42],
    sigil: [
      { ink: 'glow', shapes: [{ ring: 4, w: 0.4 }, { disc: 1.6 }, { rays: 7, from: 4.8, to: 9, w: 0.22, taper: true, arc: [50, 130] }, { rays: 7, from: 4.8, to: 9, w: 0.22, taper: true, arc: [230, 310] }] },
      { ink: 'pale', colour: [0.82, 0.78, 0.68], shapes: [{ ring: 12, w: 0.3 }, { dots: 24, r: 13, size: 0.22 }] },
    ],
    walls: [{ what: 'niche', on: 'all', holds: 'skull' }],
    roof: ['chains'],
  },
  // The deserted house's attic, where it came through the window: gouges of claws across the boards, the boards slant and ragged, papers.
  the_unnamable: {
    pillars: 'colonnade', pillar: 'post', reach: 13, glow: [0.6, 0.66, 0.55],
    sigil: [
      { ink: 'dark', shapes: [
        { line: [-6, -3, -1, 4], w: 0.14 }, { line: [-5.4, -3.4, -0.4, 3.6], w: 0.14 }, { line: [-4.8, -3.8, 0.2, 3.2], w: 0.14 },
        { line: [3, -8, 9, -4], w: 0.14 }, { line: [3.3, -8.6, 9.3, -4.6], w: 0.14 }, { line: [3.6, -9.2, 9.6, -5.2], w: 0.14 },
        { line: [-9, 6, -4, 10], w: 0.12 }, { line: [-8.6, 5.4, -3.6, 9.4], w: 0.12 },
      ] },
      { ink: 'pale', colour: [0.78, 0.76, 0.7], shapes: [{ scatter: 16, from: 6, to: 12, size: 0.4, seed: 11 }] },
    ],
    walls: [{ what: 'slant', on: 'sides' }, { what: 'papers', on: 'far' }],
    roof: ['ropes'],
  },
  // Carter's tomb in the swamp: the slab with its iron ring at the heart, the telephone wire run off across the floor to the way in,
  // pools of the swamp's black water, roots through every wall and niches of urns.
  voice_in_the_tomb: {
    pillars: 'four', pillar: 'square', reach: 14.5, glow: [0.6, 0.72, 0.3],
    sigil: [
      { ink: 'dark', shapes: [{ poly: 4, r: 3.6, w: 0.35, turn: 45 }] },
      { ink: 'iron', shapes: [{ ring: 0.5, w: 0.1 }, { line: [0.4, -2.8, 0.9, -14], w: 0.06 }] },
      { ink: 'tar', shapes: [{ disc: 1.4, at: [7, 4] }, { disc: 1.1, at: [-8, -3] }, { disc: 1.6, at: [-5, 9] }, { disc: 0.9, at: [9, -7] }, { disc: 1.2, at: [3, 11] }] },
    ],
    walls: [{ what: 'roots', on: 'all' }, { what: 'niche', on: 'far', holds: 'urn' }],
    roof: [],
  },
  // The Shunned House's cellar: the shape in the nitre on the earth floor, doubled up as a body is, pale and faintly lit, the
  // fungi's phosphorescence about it, roots and the old shelves.
  shunned_house_entity: {
    pillars: 'four', pillar: 'brick', reach: 14.5, glow: [0.76, 0.8, 0.5],
    sigil: [
      { ink: 'pale', colour: [0.86, 0.86, 0.78], shapes: [{ disc: 0.8, at: [0.3, 3.2] }, { disc: 1.3, at: [-0.4, 1.8] }, { disc: 1.4, at: [-0.6, 0.1] }, { disc: 1.1, at: [0.6, -1.3] }, { disc: 0.9, at: [1.6, -2.2] }, { disc: 0.7, at: [2.4, -1.4] }, { disc: 0.6, at: [1.3, 2.6] }] },
      { ink: 'glow', shapes: [{ scatter: 34, from: 5, to: 13, size: 0.14, seed: 5 }] },
    ],
    walls: [{ what: 'roots', on: 'sides' }, { what: 'growth', on: 'all', every: 2 }, { what: 'shelves', on: 'entry', every: 2 }],
    roof: [],
    far: 'hearth',
  },
  // The vaults under Red Hook: Lilith's crescent in gold over a stain of blood, rays of it out to a gilt ring; red curtains, chains.
  lilith: {
    pillars: 'four', pillar: 'onyx', reach: 14.5, glow: [0.86, 0.6, 0.26],
    sigil: [
      { ink: 'gilt', shapes: [{ ring: 13, w: 0.4 }, { arc: 4.6, w: 1.1, from: 200, to: 340 }] },
      { ink: 'blood', shapes: [{ rays: 12, from: 7, to: 12.4, w: 0.25, taper: true }, { disc: 2 }] },
    ],
    walls: [{ what: 'drapes', on: 'sides', colour: [0.46, 0.08, 0.1] }, { what: 'niche', on: 'entry', holds: 'idol' }, { what: 'chains', on: 'sides', every: 3 }],
    roof: ['chains', 'lamps'],
  },
  // The Terrible Old Man's house in Kingsport: a compass rose in the boards, sea charts, shelves of his bottles, nets; and overhead his
  // bottles hung on their strings, a lead pendulum in each.
  terrible_old_man: {
    pillars: 'ring', pillar: 'mast', reach: 13, glow: [0.7, 0.76, 0.62],
    sigil: [
      { ink: 'dark', shapes: [{ rays: 8, from: 1.9, to: 11, w: 0.5, taper: true }, { ring: 12, w: 0.3 }] },
      { ink: 'pale', shapes: [{ rays: 8, from: 2.6, to: 7.5, w: 0.3, taper: true, turn: 22.5 }] },
    ],
    walls: [{ what: 'charts', on: 'sides' }, { what: 'shelves', on: 'far' }, { what: 'nets', on: 'entry' }],
    roof: ['pendulums'],
  },
  // The Whateleys' upper story, its floors knocked through: Aklo marks in charcoal, a nine-sided figure with its star, a burnt heart.
  wilbur_whateley: {
    pillars: 'colonnade', pillar: 'post', reach: 14.5, glow: [0.56, 0.5, 0.34],
    sigil: [
      { ink: 'soot', shapes: [{ poly: 9, r: 10, w: 0.22 }, { ring: 12.4, w: 0.5 }, { disc: 1.8 }] },
      { ink: 'chalk', shapes: [{ star: 9, step: 4, r: 8.6, w: 0.15 }] },
    ],
    walls: [{ what: 'slant', on: 'sides', every: 2 }, { what: 'shelves', on: 'far' }],
    roof: ['ropes'],
  },
  // The Waite house study: a pentacle in the old red, green sea-lights at its points; his books, and the house's windows.
  ephraim_waite: {
    pillars: 'colonnade', pillar: 'post', reach: 13, glow: [0.4, 0.56, 0.64],
    sigil: [
      { ink: 'blood', shapes: [{ star: 5, step: 2, r: 10, w: 0.25 }, { ring: 10.6, w: 0.2 }] },
      { ink: 'glow', shapes: [{ dots: 5, r: 11.8, size: 0.35 }] },
    ],
    walls: [{ what: 'shelves', on: 'sides' }, { what: 'charts', on: 'entry', every: 2 }],
    roof: ['lamps'],
  },
  // The sculptor's studio in the tower: the Northern Crown laid in light on the floor, a ring of gilt, busts in niches, a window of the
  // night and a dome of painted stars.
  hypnos: {
    pillars: 'colonnade', pillar: 'fluted', reach: 14.5, glow: [0.76, 0.8, 1],
    sigil: [
      { ink: 'glow', shapes: [{ dots: 7, r: 8, size: 0.4, arc: [-70, 70] }, { arc: 8, w: 0.06, from: -70, to: 70 }] },
      { ink: 'gilt', shapes: [{ ring: 12, w: 0.3 }] },
      { ink: 'pale', shapes: [{ poly: 12, r: 13.4, w: 0.25, turn: 15 }] },
    ],
    walls: [{ what: 'niche', on: 'sides', holds: 'bust' }, { what: 'lancet', on: 'far', colour: [0.16, 0.2, 0.42] }],
    roof: ['dome', 'stars', 'oculus'],
  },
  // Zann's garret in the Rue d'Auseil: two staves ruled across the boards with his notes on them, his papers pinned up, the rafters low.
  zann_window_thing: {
    pillars: 'ring', pillar: 'post', reach: 13, glow: [0.5, 0.55, 0.76],
    sigil: [
      { ink: 'dark', shapes: [
        ...[0, 0.5, 1, 1.5, 2].map((k) => ({ line: [-9, 3 + k, 9, 3 + k] as const, w: 0.06 })),
        ...[0, 0.5, 1, 1.5, 2].map((k) => ({ line: [-9, -5 - k, 9, -5 - k] as const, w: 0.06 })),
        ...[[-7, 3.5], [-5, 4.25], [-3, 3.75], [-1, 5], [1.5, 4.5], [4, 3.25], [6.5, 4], [8, 4.75], [-7.5, -5.5], [-5, -6.75], [-2.5, -6], [0, -5.25], [3, -6.5], [5.5, -7], [8, -6.25]].map(([u, v]) => ({ disc: 0.22, at: [u, v] as const })),
      ] },
    ],
    walls: [{ what: 'papers', on: 'all' }],
    roof: ['ropes'],
  },
};
