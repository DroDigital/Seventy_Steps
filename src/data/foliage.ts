/**
 * Round 116, the land as thick with growth as its climate allows (render/nearGrass.ts, render/groundCover.ts, render/understory.ts). About the
 * investigator's feet a field of grass clumps stands thick where the ground is grass (instanced, recycled a row at a time as they walk). The ground's cover was
 * set by its texture alone and sparse (a tuft to every twenty square metres of a field); now each realm says how thick its cover grows
 * over its ground's own, and what stands above it, knee to head high, where anything can: the shrubs, saplings and fern beds of the New
 * England woods, the reed beds of the Innsmouth marsh, a dry scrub in the Pnakotic sand, the fungus stalks of K'n-yan, the pods and stalks
 * of Yuggoth, the kelp of the raised sea floor. The ice, the void and the courts of the gods grow nothing more. Render only: it is laid
 * with the chunk's own random stream, after the plan, so no prop, foe or secret moves; nothing in it collides. Data only.
 */

/** What stands above the cover: a leafy shrub, a sapling with its crown, a young fir, a bed of ferns, a bed of cattails, a dry thorn scrub, a fungus stalk, a spore stalk, a standing kelp, a dead twiggy brush. */
export type Under = 'shrub' | 'sapling' | 'fir' | 'ferns' | 'cattails' | 'scrub' | 'stalk' | 'sporestalk' | 'kelp' | 'brush';

export interface Climate {
  near: number; // the grass at the investigator's feet (render/nearGrass.ts): the share of its cells that hold a clump where the ground is grass, at the most (0: none)
  cover: number; // the ground's cover, times its texture's own count (1: as it was)
  under: number; // pieces of undergrowth to a chunk
  kinds: readonly [Under, number][]; // which, by weight
}

export const CLIMATES: Readonly<Record<string, Climate>> = {
  hub: { near: 0.62, cover: 2.2, under: 26, kinds: [['shrub', 0.5], ['sapling', 0.3], ['ferns', 0.2]] }, // a college town's lawns and its elms' undergrowth
  arkham: { near: 0.45, cover: 2, under: 22, kinds: [['brush', 0.45], ['shrub', 0.3], ['sapling', 0.25]] }, // the blasted heath: dead brush where the Colour fell
  dunwich: { near: 0.85, cover: 2.8, under: 70, kinds: [['shrub', 0.35], ['ferns', 0.25], ['sapling', 0.25], ['brush', 0.15]] }, // rank, overgrown hills
  innsmouth: { near: 0.7, cover: 2.6, under: 46, kinds: [['cattails', 0.75], ['scrub', 0.25]] }, // the salt marsh's reed beds
  providence: { near: 0.55, cover: 2, under: 24, kinds: [['shrub', 0.5], ['sapling', 0.3], ['ferns', 0.2]] },
  vermont: { near: 0.9, cover: 3, under: 80, kinds: [['ferns', 0.3], ['shrub', 0.25], ['fir', 0.25], ['sapling', 0.2]] }, // the deep woods of the Vermont hills
  mountains: { near: 0, cover: 1, under: 0, kinds: [] }, // ice
  pnakotus: { near: 0.12, cover: 1.3, under: 8, kinds: [['scrub', 1]] }, // desert
  kn_yan: { near: 0, cover: 2.2, under: 36, kinds: [['stalk', 1]] }, // the fungal caverns
  dreamlands: { near: 0.85, cover: 2.8, under: 60, kinds: [['shrub', 0.35], ['ferns', 0.3], ['sapling', 0.25], ['fir', 0.1]] },
  rlyeh: { near: 0, cover: 1.6, under: 20, kinds: [['kelp', 1]] }, // the sea floor raised
  yuggoth: { near: 0, cover: 2.2, under: 34, kinds: [['sporestalk', 0.7], ['stalk', 0.3]] },
  beyond: { near: 0, cover: 0, under: 0, kinds: [] },
  cloud_summit: { near: 0, cover: 1, under: 0, kinds: [] },
  black_wood: { near: 0.75, cover: 2.6, under: 64, kinds: [['shrub', 0.45], ['brush', 0.3], ['sapling', 0.25]] }, // a wood that is a body
  pale_lattice: { near: 0, cover: 1.2, under: 0, kinds: [] },
  piping_dark: { near: 0, cover: 1.2, under: 6, kinds: [['brush', 1]] },
  spheres: { near: 0, cover: 0, under: 0, kinds: [] },
  court_centre: { near: 0, cover: 1, under: 0, kinds: [] },
};
