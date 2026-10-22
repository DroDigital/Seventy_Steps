/** The sets of the realms' open arenas (round 61; data/arenaSets.ts): the Dreamlands, the Beyond, and what lies under the sea. Data only. */

import { at, lane, put, ring, type ArenaSet } from './arenaSets';

export const BEYOND_SETS: Readonly<Record<string, ArenaSet>> = {
  // R'lyeh: cyclopean masonry whose angles are wrong, green with the ooze of the deep, a door that opens from the inside.
  cthulhu: {
    candle: 'votive',
    ground: { texture: 'rock', tint: [0.24, 0.34, 0.3], gain: 1.15, reach: 16, bands: [{ r0: 0.2, r1: 0.3, k: 0.6 }, { r0: 0.55, r1: 0.62, k: 0.65 }], spokes: { n: 12, width: 2.5, k: 0.6, r0: 0.1, r1: 1 } },
    puts: [
      put('slab', at(0.88, 180, { face: 'in' }), { heart: true, size: [2.2, 2.4], glow: 'green' }), // the door
      put('slab', ring(0.98, 11, { jitter: 10, face: 'in' }), { size: [0.9, 1.4], glow: 'green' }),
      put('slab', ring(1.3, 9, { jitter: 14, face: 'in' }), { size: [1.6, 2.3], glow: 'green' }),
      put('prop:spire', ring(1.55, 8, { jitter: 10 }), { size: 0.9 }),
      put('slab', lane([1.2, 1.7], 3, 4.4, 90), { size: 1.4, glow: 'green' }),
    ],
    air: { kind: 'spore', color: [0.2, 0.9, 0.6], rate: 18 },
  },
  // Carcosa behind the moon: a plaza of pallid stone, tattered banners, a pallid mask fallen, towers against a black sun.
  hastur: {
    candle: 'votive',
    ground: { texture: 'slab', tint: [0.7, 0.66, 0.5], gain: 1.25, reach: 14, bands: [{ r0: 0.55, r1: 0.62, k: 0.65 }] },
    puts: [
      put('prop:obelisk', at(0.95, 130, { face: 'in' }), { size: 2.4 }),
      put('prop:obelisk', at(0.95, 230, { face: 'in' }), { size: 2.4 }),
      put('banner', ring(0.97, 10, { jitter: 8 }), { size: [0.9, 1.2] }),
      put('statue_head', at(0.62, 180, { face: 'in' }), { heart: true, size: 2.0 }), // the pallid mask
      put('prop:tower', ring(1.4, 7, { jitter: 8 }), { size: 0.45 }),
      put('lightpost', lane([1.15, 1.8], 4, 3.4), { lit: 'lamp' }),
      put('column', ring(1.15, 6, { arc: [140, 220] }), { join: true, size: 1.1 }),
    ],
    air: { kind: 'flake', color: [0.92, 0.82, 0.5], rate: 26 },
  },
  // Yog-Sothoth at the Threshold: a floor of black glass ringed with light, spheres that hang in the air, the pedestals of the Key and the Gate.
  yog_sothoth: {
    ground: { texture: 'slab', tint: [0.2, 0.2, 0.3], gain: 1.15, reach: 14, bands: [{ r0: 0.18, r1: 0.26, k: 1.7 }, { r0: 0.5, r1: 0.58, k: 1.7 }, { r0: 0.82, r1: 0.9, k: 1.7 }], spokes: { n: 8, width: 1.6, k: 1.8, r0: 0.1, r1: 0.95, twist: 40 } },
    puts: [
      put('prop:globe', ring(0.95, 8, { jitter: 6 })),
      put('hexped', ring(0.88, 6, { jitter: 0 }), { glow: 'purple', size: 1.1 }),
      put('trilith', at(1.25, 180), { size: 2.2 }),
      put('hexped', lane([1.15, 1.7], 3, 3.6), { glow: 'purple', lit: 'sigil' }),
    ],
    air: { kind: 'mote', color: [0.85, 0.8, 1], rate: 34 },
  },
  // The Court of Azathoth at the centre of all: a floor cracked into wrong tiles over nothing, the pipers' pipes, cones of the void.
  azathoth: {
    ground: { texture: 'slab', tint: [0.22, 0.2, 0.26], gain: 1.1, reach: 14, bands: [{ r0: 0.3, r1: 0.36, k: 1.6 }, { r0: 0.7, r1: 0.76, k: 1.6 }], spokes: { n: 7, width: 2.5, k: 1.5, r0: 0.1, r1: 1, twist: -90 } },
    puts: [
      put('pipes', ring(0.93, 9, { jitter: 4 }), { size: [1.0, 1.3] }),
      put('prop:cone', ring(1.3, 9, { jitter: 8 }), { size: 1.3 }),
      put('ziggurat', at(0.82, 180, { face: 'in' }), { heart: true, size: 1.4 }), // the throne
      put('pipes', lane([1.15, 1.7], 3, 4.2), { size: 0.9 }),
    ],
    air: { kind: 'ember', color: [1, 0.92, 0.9], rate: 22 },
  },
  // Yaddith: terraces of pale metal-stone, pylons of a gate older than the world, cones that hum.
  zkauba: {
    ground: { texture: 'rock', tint: [0.42, 0.5, 0.44], gain: 1.25, reach: 12, bands: [{ r0: 0.4, r1: 0.48, k: 1.5, tint: [0.7, 0.8, 0.72] }] },
    puts: [
      put('hexped', ring(0.95, 6), { glow: 'green', size: 1.0 }),
      put('prop:cone', ring(1.25, 8, { jitter: 8 }), { size: 0.9 }),
      put('pylon', at(1.28, 0, { side: 5, mirror: true }), { size: 0.9, lit: 'torch' }),
      put('ziggurat', at(0.6, 180, { face: 'in' }), { heart: true, size: 0.9 }),
      put('prop:firepit', ring(0.8, 2, { arc: [100, 260] }), { size: 1.2 }),
    ],
    air: { kind: 'spore', color: [0.4, 0.95, 0.7], rate: 18 },
  },
  // The daemon pipers: black reeds of stone in a ring, spheres hung between them, dark tiles and the sound of the flutes.
  daemon_pipers: {
    ground: { texture: 'slab', tint: [0.18, 0.17, 0.22], gain: 1.15, reach: 12, bands: [{ r0: 0.35, r1: 0.43, k: 1.6 }], spokes: { n: 9, width: 3, k: 1.4, r0: 0.1, r1: 1, twist: 60 } },
    puts: [
      put('pipes', ring(0.97, 10, { jitter: 4 }), { size: [1.1, 1.4] }),
      put('prop:globe', ring(1.3, 8, { jitter: 6 }), { size: 0.8 }),
      put('pipes', lane([1.15, 1.8], 3, 3.8), { size: 1.2 }),
    ],
    air: { kind: 'mote', color: [0.8, 0.7, 1], rate: 24 },
  },
  // The hexagonal pedestals beyond the Gate: a floor of pale stone, the Ultimate Gate standing at its far side.
  ancient_ones: {
    ground: { texture: 'slab', tint: [0.56, 0.56, 0.66], gain: 1.3, reach: 12, bands: [{ r0: 0.5, r1: 0.58, k: 0.7 }] },
    puts: [
      put('hexped', ring(0.94, 6), { glow: 'purple', size: 1.3, lit: 'sigil' }),
      put('trilith', at(0.98, 180, { face: 'in' }), { heart: true, size: 1.6 }), // the Gate
      put('prop:pillar', ring(1.35, 8, { jitter: 8 }), { size: 1.6 }),
      put('hexped', lane([1.15, 1.7], 3, 3.8), { glow: 'purple', size: 0.9 }),
    ],
    air: { kind: 'mote', color: [0.95, 0.95, 1], rate: 30 },
  },
};
