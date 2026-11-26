/**
 * Creature skins for the sprite generator (pure): each a brightness pattern over the cell's
 * pixels, worked into a shape's shading — overlapping scales, streaked fur, warts, dark veins,
 * chitin plates, cracked stone, wrinkled hide, cloth folds, smooth wet sheen and trailing wisps.
 * A creature's skin comes from its palette and body plan.
 */

import { hash2 } from '../../core/rng';
import type { CreaturePalette, Silhouette } from '../../data/schema';
import type { Skin } from './raster';

/** How bright the skin is at (x, y): about 1, darker in its seams and lines. */
export function skinAt(skin: Skin, x: number, y: number, seed: number): number {
  switch (skin) {
    case 'scales': {
      const row = y >> 2, lx = (x + 3 * (row & 1) + seed) % 6, ly = y & 3;
      const lip = lx === 0 || lx === 5 ? 1 : lx === 1 || lx === 4 ? 2 : 3;
      if (ly === lip) return 0.72;
      return ly === lip - 1 && lx < 3 ? 1.19 : 1;
    }
    case 'fur': {
      const slant = x + (y >> 1);
      return 0.88 + 0.26 * hash2(slant >> 1, (y + slant % 5) >> 2, seed);
    }
    case 'warts': {
      const lx = (x + 2 * ((y >> 2) & 1)) & 3, ly = y & 3;
      if (hash2((x + 2 * ((y >> 2) & 1)) >> 2, y >> 2, seed) < 0.56) return 1;
      if (lx === 1 && ly === 1) return 1.34;
      return (lx === 2 && ly === 2) || (lx === 1 && ly === 3) ? 0.73 : 1;
    }
    case 'veins': {
      const trunk = (x + Math.round(2 * Math.sin(y * 0.27 + seed))) % 11;
      if (trunk === 0 || (y % 10 < 4 && trunk === (y % 10) + 1)) return 0.74;
      return trunk === 1 && y % 7 < 4 ? 1.2 : 1;
    }
    case 'plates': {
      const joint = (y + Math.floor(Math.abs((x % 12) - 5.5) * 0.5)) % 6;
      return joint === 0 ? 0.65 : joint === 1 ? 1.2 : 1;
    }
    case 'cracks':
      return Math.abs(Math.sin(x * 0.5 + y * 0.9) * Math.sin(y * 0.7 - x * 0.3)) < 0.06 ? 0.7 : 1;
    case 'wrinkles':
      return y % 4 === 0 && hash2(x >> 2, y, seed) > 0.4 ? 0.82 : 1;
    case 'cloth':
      return 0.94 + 0.15 * Math.sin(x * 0.6 + Math.sin(y * 0.16) * 1.25);
    case 'wisp':
      return 0.85 + 0.25 * hash2(x, Math.floor(y / 5), seed);
    case 'sheen': {
      const streak = (x + (y >> 2)) % 12;
      return streak === 0 && y % 11 < 5 ? 1.24 : 1;
    }
  }
}

const BY_PALETTE: Partial<Record<CreaturePalette, Skin>> = { sea: 'scales', mold: 'warts', fungus: 'plates', ichor: 'veins', flesh: 'veins', rubber: 'sheen', stone: 'cracks' };
const BY_BODY: Partial<Record<Silhouette, Skin>> = {
  humanoid: 'cloth', robed: 'cloth', giant: 'wrinkles', hunched: 'wrinkles', quadruped: 'fur', winged: 'fur', serpent: 'scales', toad: 'warts',
  crustacean: 'plates', blob: 'veins', cone: 'veins', barrel: 'plates', orb: 'veins', spectre: 'wisp', cephalopod: 'veins',
};
const WET = new Set<Skin>(['scales', 'veins', 'sheen', 'warts']);

/** A creature's skin, and whether it is wet. */
export function skinOf(palette: CreaturePalette, body: Silhouette): { skin?: Skin; wet: boolean } {
  const skin = BY_PALETTE[palette] ?? BY_BODY[body];
  return { skin, wet: !!skin && WET.has(skin) };
}
