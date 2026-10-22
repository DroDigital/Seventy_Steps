/** The sets of the boss halls of the dream-lands' and the far realms' dungeons (round 62; data/hallSetsEarth.ts says how they are read). Data only. */

import { at, put, ring, scatter, type ArenaSet } from './arenaSets';

export const FAR_HALLS: Readonly<Record<string, ArenaSet>> = {
  // Nkai's black hall, the cavern of the toad-god: idols of him in the stone, bones, bowls of what was offered, pale fungus, black rock.
  tsathoggua: {
    puts: [
      put('idol', ring(0.95, 3, { arc: [90, 270], face: 'in' }), { size: 0.6, tint: [0.3, 0.3, 0.34] }),
      put('rocks_tall', scatter(5, [0.88, 1.15], { arc: [60, 300] }), { size: [0.45, 0.6], tint: [0.34, 0.34, 0.38] }),
      put('skeleton', scatter(4, [0.82, 0.97], { face: 'free' }), { size: 0.9 }),
      put('bowl', scatter(4, [0.8, 0.94], { face: 'free' }), { walk: true, size: 1.6 }),
      put('mushroom_tall', scatter(5, [0.82, 0.98], { face: 'free' }), { size: [0.5, 0.8], tint: [0.62, 0.7, 0.66] }),
    ],
  },
  // The monastery of the High Priest on Leng: banners of yellow silk, monks' benches, candles, masks of stone, columns.
  high_priest: {
    puts: [
      put('banner', ring(0.97, 6, { arc: [60, 300] }), { size: 0.85 }),
      put('bench', ring(0.92, 4, { arc: [80, 280], face: 'in' }), { size: 1.2 }),
      put('statue_head', at(0.95, 180, { face: 'in' }), { size: 0.6, tint: [0.7, 0.62, 0.4] }),
      put('column', scatter(4, [0.88, 0.98], { arc: [60, 300] }), { size: 0.8 }),
      put('bowl', scatter(3, [0.8, 0.94], { face: 'free' }), { walk: true, size: 1.5 }),
      put('candles', scatter(2, [0.8, 0.97], { face: 'free' }), { lit: 'torch', walk: true, size: 1.3 }),
    ],
  },
  // The onyx castle's throne hall on Kadath: great columns in pairs, statues, pedestals with the glow of a dream, banners of no house.
  great_ones: {
    puts: [
      put('column', ring(0.97, 8, { arc: [40, 320] }), { size: 0.85 }),
      put('statue_column', ring(0.9, 4, { arc: [70, 290] }), { size: 0.9 }),
      put('statue_obelisk', at(1.0, 180, { face: 'front' }), { size: 0.85 }),
      put('hexped', scatter(5, [0.82, 0.96], { face: 'free' }), { size: 1.3, glow: 'purple' }),
      put('banner', scatter(4, [0.9, 0.99], { arc: [80, 280], face: 'in' }), { size: 0.85 }),
    ],
  },
  // The temple on Yaddith-Gho: a circle of standing stones brought indoors, skulls on poles, idols and totems of the old rite, bones.
  ghatanothoa: {
    puts: [
      put('trilith', ring(0.93, 5, { jitter: 5, face: 'in' }), { size: 0.8 }),
      put('skull_pole', ring(0.88, 9, { arc: [40, 320], jitter: 8 }), { size: 1.1 }),
      put('idol', at(0.96, 180, { face: 'in' }), { size: 0.55 }),
      put('totem', scatter(3, [0.88, 0.98], { arc: [70, 290] }), { size: 0.8 }),
      put('skeleton', scatter(3, [0.82, 0.97], { face: 'free' }), { size: 0.9 }),
    ],
  },
  // The cylinders' vault of Rhan-Tegoth: tall cylinders like those in which the Yuggoth things keep brains, pedestals and the idol of the god.
  rhan_tegoth: {
    puts: [
      put('pipes', ring(0.93, 8, { arc: [50, 310] }), { size: 0.5, glow: 'purple' }),
      put('hexped', scatter(4, [0.84, 0.97], { face: 'free' }), { size: 1.3, glow: 'purple' }),
      put('idol', at(0.97, 180, { face: 'in' }), { size: 0.55, tint: [0.3, 0.3, 0.36] }),
    ],
  },
  // The last hall at the end of the dream: columns and ring-statues of the city that was, pedestals of the old stone, a glow in each.
  umr_at_tawil: {
    puts: [
      put('column', ring(0.97, 6, { arc: [50, 310] }), { size: 0.8 }),
      put('statue_ring', ring(0.9, 4, { arc: [80, 280], face: 'in' }), { size: 1.3 }),
      put('hexped', scatter(5, [0.82, 0.96], { face: 'free' }), { size: 1.3, glow: 'magenta' }),
      put('trilith', at(0.95, 180, { face: 'in' }), { size: 0.85 }),
    ],
  },
};
