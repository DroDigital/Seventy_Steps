/** The sets of the realms' open arenas (round 61; data/arenaSets.ts): the Dreamlands, the Beyond, and what lies under the sea. Data only. */

import { at, put, type ArenaSet } from './arenaSets';

export const BEYOND_SETS: Readonly<Record<string, ArenaSet>> = {
  // R'lyeh: cyclopean masonry whose angles are wrong, green with the ooze of the deep, a door that opens from the inside.
  cthulhu: {
    candle: 'votive',
    ground: { texture: 'rock', tint: [0.24, 0.34, 0.3], gain: 1.15, reach: 16, bands: [{ r0: 0.2, r1: 0.3, k: 0.6 }, { r0: 0.55, r1: 0.62, k: 0.65 }], spokes: { n: 12, width: 2.5, k: 0.6, r0: 0.1, r1: 1 } },
    puts: [
      put('slab', at(0.88, 180, { face: 'in' }), { heart: true, size: [2.2, 2.4], glow: 'green' }), // the door: all that is left of the first set (round 72); the walls, forecourt, Great Door and lagoon are laid by its place, world/places/cthulhu.ts
    ],
    air: { kind: 'spore', color: [0.2, 0.9, 0.6], rate: 18 },
  },
  // Carcosa behind the moon: a plaza of pallid stone, tattered banners, a pallid mask fallen, towers against a black sun.
  hastur: {
    candle: 'votive',
    ground: { texture: 'slab', tint: [0.7, 0.66, 0.5], gain: 1.25, reach: 14, bands: [{ r0: 0.55, r1: 0.62, k: 0.65 }] },
    puts: [], // (round 72: the tiers, the stage house, the audience, the towers and the passage's braziers are laid by its place, world/places/hastur.ts; the first set's scattered pieces are gone)
    air: { kind: 'flake', color: [0.92, 0.82, 0.5], rate: 26 },
  },
  // Yog-Sothoth at the Threshold: a floor of black glass ringed with light, spheres that hang in the air, the pedestals of the Key and the Gate.
  yog_sothoth: {
    ground: { texture: 'slab', tint: [0.2, 0.2, 0.3], gain: 1.15, reach: 14, bands: [{ r0: 0.18, r1: 0.26, k: 1.7 }, { r0: 0.5, r1: 0.58, k: 1.7 }, { r0: 0.82, r1: 0.9, k: 1.7 }], spokes: { n: 8, width: 1.6, k: 1.8, r0: 0.1, r1: 0.95, twist: 40 } },
    puts: [], // (round 72: the walls of prisms, the arches, the rings and spheres of light and the void are laid by its place, world/places/yog.ts; the first set's scattered pieces are gone)
    air: { kind: 'mote', color: [0.85, 0.8, 1], rate: 34 },
  },
  // The Court of Azathoth at the centre of all: a floor cracked into wrong tiles over nothing, the pipers' pipes, cones of the void.
  azathoth: {
    ground: { texture: 'slab', tint: [0.22, 0.2, 0.26], gain: 1.1, reach: 14, bands: [{ r0: 0.3, r1: 0.36, k: 1.6 }, { r0: 0.7, r1: 0.76, k: 1.6 }], spokes: { n: 7, width: 2.5, k: 1.5, r0: 0.1, r1: 1, twist: -90 } },
    puts: [], // (round 72: the wall and the thirteen blind dancers on it are laid by its place, world/places/azathoth.ts; the first set's scattered pieces are gone)
    air: { kind: 'ember', color: [1, 0.92, 0.9], rate: 22 },
  },
  // Yaddith: terraces of pale metal-stone, pylons of a gate older than the world, cones that hum.
  zkauba: {
    ground: { texture: 'rock', tint: [0.42, 0.5, 0.44], gain: 1.25, reach: 12, bands: [{ r0: 0.4, r1: 0.48, k: 1.5, tint: [0.7, 0.8, 0.72] }] },
    puts: [], // (round 72: the towers, pylons, passages and gantry are laid by its place, world/places/zkauba.ts; the first set's scattered pieces are gone)
    air: { kind: 'spore', color: [0.4, 0.95, 0.7], rate: 18 },
  },
  // The daemon pipers: black reeds of stone in a ring, spheres hung between them, dark tiles and the sound of the flutes.
  daemon_pipers: {
    ground: { texture: 'slab', tint: [0.18, 0.17, 0.22], gain: 1.15, reach: 12, bands: [{ r0: 0.35, r1: 0.43, k: 1.6 }], spokes: { n: 9, width: 3, k: 1.4, r0: 0.1, r1: 1, twist: 60 } },
    puts: [], // (round 72: the organ about it is laid by its place, world/places/pipers.ts; the first set's scattered pieces are gone)
    air: { kind: 'mote', color: [0.8, 0.7, 1], rate: 24 },
  },
  // The hexagonal pedestals beyond the Gate: a floor of pale stone, the Ultimate Gate standing at its far side.
  ancient_ones: {
    ground: { texture: 'slab', tint: [0.56, 0.56, 0.66], gain: 1.3, reach: 12, bands: [{ r0: 0.5, r1: 0.58, k: 0.7 }] },
    puts: [], // (round 72: the hexagon of prisms, its tiles, the basalt boundary and the avenue are laid by its place, world/places/ancients.ts; the first set's scattered pieces are gone)
    air: { kind: 'mote', color: [0.95, 0.95, 1], rate: 30 },
  },
};
