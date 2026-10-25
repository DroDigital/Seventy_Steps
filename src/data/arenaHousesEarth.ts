/**
 * The houses of the waking world's and the dream-lands' open horrors (round 63; data/arenaHouses.ts): each built of what its own story
 * leaves standing: a reservoir's dam, a ravine's cliff, a grove grown together, a plantation's porch, a sea wall, a burying ground's
 * wall, a manor's, a temple's, a serpent's mound, a ziggurat, a lake's quay, a ring of stones. Data only.
 */

import { house, type House } from './arenaHouses';

export const EARTH_HOUSES: Readonly<Record<string, House>> = {
  colour_out_of_space: house({
    name: 'THE RESERVOIR', line: 'The water was to cover the Gardner place. It never quite did.',
    wall: 'dam', height: 6, thick: 4.4, tint: [0.62, 0.63, 0.66], glow: 'magenta',
    tower: { kind: 'square', every: 9, height: 9 }, gate: { width: 8, height: 6.5, flank: 12, sealed: true },
    basin: { ahead: 18, side: 24, behind: 16, wobble: 1.6, spill: { at: 22, width: 5 } }, // a dam across the heath, a bank about the Gardner place, a spillway, and a sluice lifted into its housing
  }),
  black_man: house({
    name: 'THE BLACK RIVER', line: 'The river runs black about an island of white earth, and the one ford to it has been stopped with a stone.',
    wall: 'kerb', height: 1.3, thick: 1.4, tint: [0.34, 0.32, 0.38], glow: 'purple', reach: 30,
    tower: { kind: 'round', every: 6, height: 5, lit: true }, gate: { width: 7, height: 3.4, flank: 8, sealed: true },
    river: { island: 17, depth: 1.6, ford: 7 }, // the island in the river (Lovecraft: "the unpeopled island in the river"), its bank kerbed, a ford of flat stones, the balefires on the bank
  }),
  shub_niggurath: house({
    name: 'THE BLACK GROVE', line: 'The trees have grown together, and what grew them is not done.',
    wall: 'grove', height: 13, thick: 5, glow: 'magenta',
    tower: { kind: 'horn', every: 7, height: 16 }, gate: { width: 9, height: 8, flank: 18 }, place: true,
  }),
  medusa_gorgon: house({
    name: 'THE PLANTATION HOUSE', line: 'The porch is all that stands of it, and on the porch people stand.',
    wall: 'colonnade', height: 8, thick: 3.4, tint: [0.75, 0.72, 0.66], glow: 'magenta',
    tower: { kind: 'square', every: 10, height: 11 }, gate: { width: 8, height: 4.6, flank: 8 }, place: true,
  }),
  martins_beach_horror: house({
    name: 'THE SEA WALL', line: 'It was built to keep the sea out, and the sea has been let in by someone who knew the way.',
    wall: 'dam', height: 7, thick: 4, tint: [0.5, 0.62, 0.58], glow: 'green',
    tower: { kind: 'round', every: 8, height: 11, lit: true }, gate: { width: 8, height: 4.6, flank: 8 }, place: true,
  }),
  simon_orne: house({
    name: 'THE BURYING GROUND', line: 'The wall is low and the gate is old, and neither was built to keep the living out.',
    wall: 'ashlar', height: 5.5, thick: 0.9, tint: [0.42, 0.46, 0.4], glow: 'purple',
    tower: { kind: 'spire', every: 9, height: 8 }, gate: { width: 7, height: 4.2, flank: 9 },
    place: true, // (round 71: laid from the packs' models, world/places/orne.ts)
  }),
  edward_hutchinson: house({
    name: 'THE KEEP ON THE ROAD', line: 'A curtain of old stone, a donjon behind it, and a gatehouse with a rod on it that has drawn the lightning for a hundred years.',
    wall: 'ashlar', height: 9, thick: 2.8, tint: [0.5, 0.42, 0.38], glow: 'purple',
    tower: { kind: 'round', every: 7, height: 12, lit: true }, gate: { width: 8, height: 6, flank: 12 },
    place: true,
    bailey: { ahead: 18, side: 16, behind: 16, keep: { width: 30, depth: 16, height: 30, rod: 12 }, gatehouse: { height: 14, rod: 9 } },
  }),
  colossus_pyramids: house({
    name: 'THE TEMENOS OF THE SPHINX', line: 'A wall as thick as a street is wide, and the pylons of a door that was not made for men.',
    wall: 'ashlar', height: 11, thick: 5.5, tint: [0.85, 0.72, 0.5], glow: 'purple',
    tower: { kind: 'spire', every: 8, height: 16 }, gate: { width: 9, height: 9, flank: 18, sealed: true }, place: true,
  }),
  yig: house({
    name: 'THE SERPENT MOUND', line: 'An earthwork in a ring, and a gap in it as wide as a jaw.',
    wall: 'dam', height: 7, thick: 6, tint: [0.45, 0.4, 0.3], glow: 'green',
    tower: { kind: 'round', every: 10, height: 9 }, gate: { width: 8, height: 6, flank: 11 }, place: true,
  }),
  nug: house({
    name: 'THE BLACK ZIGGURAT', line: 'Terraces of black stone, narrowing as they climb, and a mouth at the foot of them.',
    wall: 'terrace', height: 12, thick: 6, tint: [0.3, 0.3, 0.36], glow: 'green',
    tower: { kind: 'square', every: 8, height: 16 }, gate: { width: 8, height: 8, flank: 18, sealed: true }, place: true,
  }),
  bokrug: house({
    name: 'THE QUAY OF IB', line: 'The stones of the quay are green with something older than moss, and the water at their foot does not move.',
    wall: 'dam', height: 6, thick: 4, tint: [0.45, 0.62, 0.55], glow: 'green',
    tower: { kind: 'round', every: 9, height: 10 }, gate: { width: 8, height: 6, flank: 12 }, place: true,
  }),
  other_gods: house({
    name: 'THE CIRCLE OF HATHEG-KLA', line: 'Standing stones in a ring on the peak, close as teeth, and a gap where two of them were drawn apart.',
    wall: 'slabs', height: 12, thick: 4, tint: [0.5, 0.48, 0.58], glow: 'purple',
    tower: { kind: 'spire', every: 6, height: 17 }, gate: { width: 9, height: 9, flank: 19, sealed: true }, place: true,
  }),
};
