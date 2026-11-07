/**
 * Round 111, every recurring prop belongs to its realm: which forms a region's trees, conifers, rocks, bushes, stumps, logs, headstones,
 * pillars and monoliths are drawn in, and in what colours (render/propShapes.ts dispatches on it; render/treeForms.ts, pineForms.ts,
 * rockForms.ts, shrubForms.ts and stoneForms.ts build them). Each prop keeps its kind, size and collider (world/props.ts), so the world's
 * plan, its colliders and the world editor's catalogue are untouched; only the picture changes, chosen by the prop's own seed. Colours are
 * display sRGB, muted, and none an anomaly's hue (tests/propLooks.test.ts). Data only.
 */

type Rgb = readonly [number, number, number];
/** Forms and their weights: a prop's seed picks one. */
export type Weights<F extends string> = Partial<Record<F, number>>;

export type TreeForm = 'dead' | 'oak' | 'maple' | 'elm' | 'birch' | 'willow' | 'swamp' | 'blasted' | 'fungal' | 'sinew';
export type PineForm = 'fir' | 'spruce' | 'windswept' | 'snag' | 'hemlock' | 'cypress';
export type RockForm = 'boulder' | 'split' | 'cluster' | 'strata' | 'shard' | 'columns' | 'crystal' | 'porous' | 'hoodoo' | 'stalagmite' | 'orb';
export type BushForm = 'round' | 'juniper' | 'thorn' | 'bracken' | 'fungus' | 'crystal' | 'tube' | 'scrub' | 'tendril';
export type StumpForm = 'cut' | 'broken' | 'hollow' | 'fungal';
export type LogForm = 'plain' | 'branched' | 'rotten';
export type GraveForm = 'round' | 'shoulder' | 'peak' | 'tablet' | 'slab';
export type PillarForm = 'round' | 'square' | 'drums' | 'twisted';
export type MonolithForm = 'slab' | 'menhir' | 'skew';

export interface PropLook {
  trees: Weights<TreeForm>;
  pines: Weights<PineForm>;
  rocks: Weights<RockForm>;
  bushes: Weights<BushForm>;
  stumps: Weights<StumpForm>;
  logs: Weights<LogForm>;
  graves: Weights<GraveForm>;
  pillars: Weights<PillarForm>;
  monoliths: Weights<MonolithForm>;
  bark: Rgb; // a hardwood's bark (birch keeps its own pale)
  leaves: readonly Rgb[]; // what is left on the boughs
  needles: Rgb; // a conifer's and a bush's green
  top: Rgb; // what lies on top of a rock: lichen, moss, snow, salt, ash
  topShare: number; // how much of a rock's top it covers (0..1)
  snow?: boolean; // the conifers carry snow on their boughs
  rockMat?: 'stone' | 'rock'; // the texture a region's rocks are drawn in
}

const AUTUMN: readonly Rgb[] = [[0.62, 0.34, 0.2], [0.7, 0.52, 0.26], [0.5, 0.28, 0.18], [0.42, 0.42, 0.26]]; // October: rust, ochre, the last of the green
const MAPLE: readonly Rgb[] = [[0.64, 0.34, 0.2], [0.7, 0.46, 0.24], [0.76, 0.58, 0.26], [0.56, 0.3, 0.2]]; // a Vermont hillside in October
const RANK: readonly Rgb[] = [[0.38, 0.38, 0.24], [0.44, 0.36, 0.22], [0.34, 0.32, 0.22]]; // Dunwich's rank, sickly green and brown
const DREAM: readonly Rgb[] = [[0.5, 0.56, 0.32], [0.66, 0.6, 0.3], [0.56, 0.5, 0.52], [0.44, 0.52, 0.36]]; // gold, deep green and a grey lavender
const FLESH: readonly Rgb[] = [[0.38, 0.2, 0.15], [0.32, 0.2, 0.17], [0.44, 0.3, 0.24]]; // the Black Wood's wine-dark growth
const PALE: readonly Rgb[] = [[0.62, 0.6, 0.54], [0.54, 0.56, 0.52], [0.66, 0.6, 0.48]]; // caps and growths under no sun
const SALT: readonly Rgb[] = [[0.46, 0.46, 0.4], [0.52, 0.5, 0.42]]; // what the salt wind left

const BARK: Rgb = [0.4, 0.33, 0.3];
const NEEDLES: Rgb = [0.3, 0.36, 0.36];
const LICHEN: Rgb = [0.48, 0.54, 0.5];

const NE = { // New England's defaults
  stumps: { cut: 3, broken: 2, hollow: 1 },
  logs: { plain: 2, branched: 2, rotten: 1 },
  graves: { round: 3, shoulder: 3, peak: 1, tablet: 1 },
  pillars: { round: 3, drums: 1 },
  monoliths: { slab: 2, menhir: 1 },
} as const;
const ALIEN = { // the realms beyond: no felled wood, cut stone instead of graves
  stumps: { broken: 1, fungal: 2 },
  logs: { rotten: 2, plain: 1 },
  graves: { slab: 3, tablet: 1 },
} as const;

const look = (l: Omit<PropLook, 'stumps' | 'logs' | 'graves' | 'pillars' | 'monoliths'> & Partial<PropLook>): PropLook => ({ ...NE, ...l });

export const PROP_LOOKS: Readonly<Record<string, PropLook>> = {
  hub: look({ trees: { oak: 3, elm: 3, maple: 2, dead: 1 }, pines: { fir: 2, spruce: 1 }, rocks: { boulder: 3, cluster: 1 }, bushes: { round: 3, juniper: 1, bracken: 1 }, bark: BARK, leaves: AUTUMN, needles: NEEDLES, top: LICHEN, topShare: 0.5 }),
  arkham: look({ trees: { dead: 2, blasted: 2, oak: 2, elm: 1, willow: 1 }, pines: { snag: 1, fir: 2 }, rocks: { boulder: 3, split: 1, cluster: 1 }, bushes: { round: 2, thorn: 2, bracken: 1 }, bark: [0.38, 0.34, 0.33], leaves: AUTUMN, needles: NEEDLES, top: [0.56, 0.56, 0.54], topShare: 0.45 }), // the blasted heath: grey ash where the Colour fell
  dunwich: look({ trees: { dead: 3, oak: 2, swamp: 1, elm: 1 }, pines: { hemlock: 2, snag: 1 }, rocks: { boulder: 2, strata: 2, split: 1 }, bushes: { thorn: 3, round: 1, bracken: 2 }, monoliths: { menhir: 3, slab: 1 }, bark: [0.36, 0.3, 0.26], leaves: RANK, needles: [0.27, 0.32, 0.28], top: [0.42, 0.46, 0.36], topShare: 0.6 }), // rank woods, ledges and the hilltop menhirs
  innsmouth: look({ trees: { dead: 3, swamp: 2, blasted: 1 }, pines: { windswept: 2, snag: 2 }, rocks: { porous: 3, boulder: 1, cluster: 2 }, bushes: { scrub: 3, round: 1, thorn: 1 }, bark: [0.42, 0.4, 0.38], leaves: SALT, needles: [0.3, 0.34, 0.32], top: [0.6, 0.6, 0.56], topShare: 0.35 }), // salt-killed, wind-bent, reef stone
  providence: look({ trees: { elm: 3, oak: 2, maple: 1, dead: 1, willow: 1 }, pines: { fir: 1, hemlock: 1 }, rocks: { boulder: 3, cluster: 2 }, bushes: { round: 3, juniper: 2 }, graves: { shoulder: 4, round: 2, tablet: 2, peak: 1 }, bark: BARK, leaves: AUTUMN, needles: NEEDLES, top: LICHEN, topShare: 0.5 }), // old elms and the slate of the burying grounds
  vermont: look({ trees: { maple: 4, birch: 3, oak: 1, dead: 1 }, pines: { spruce: 3, fir: 2, hemlock: 2, snag: 1 }, rocks: { boulder: 3, split: 2, strata: 1 }, bushes: { round: 2, juniper: 2, bracken: 2 }, bark: [0.42, 0.34, 0.28], leaves: MAPLE, needles: [0.26, 0.34, 0.3], top: [0.44, 0.5, 0.4], topShare: 0.6 }), // the hills afire, the birches and the spruce
  mountains: look({ trees: { blasted: 1 }, pines: { snag: 1, windswept: 1 }, rocks: { shard: 3, strata: 2, split: 2, boulder: 1 }, bushes: { scrub: 1, juniper: 1 }, stumps: { broken: 1 }, bark: [0.4, 0.38, 0.38], leaves: SALT, needles: NEEDLES, top: [0.9, 0.9, 0.92], topShare: 0.7, snow: true, rockMat: 'rock' }), // black rock and snow
  pnakotus: look({ trees: { blasted: 1 }, pines: { snag: 1 }, rocks: { strata: 3, hoodoo: 2, boulder: 1 }, bushes: { scrub: 3, thorn: 1 }, ...ALIEN, pillars: { square: 3, drums: 1 }, monoliths: { slab: 3 }, bark: [0.5, 0.44, 0.38], leaves: SALT, needles: [0.4, 0.4, 0.32], top: [0.68, 0.6, 0.48], topShare: 0.4, rockMat: 'rock' }), // wind-carved sandstone about the Great Race's blocks
  kn_yan: look({ trees: { fungal: 1 }, pines: { snag: 1 }, rocks: { stalagmite: 3, boulder: 1, columns: 1 }, bushes: { fungus: 3, crystal: 1 }, ...ALIEN, pillars: { square: 2, drums: 1, round: 1 }, monoliths: { slab: 2, skew: 1 }, bark: [0.5, 0.5, 0.48], leaves: PALE, needles: [0.46, 0.5, 0.5], top: [0.42, 0.46, 0.5], topShare: 0.3 }), // the blue-litten caverns
  dreamlands: look({ trees: { oak: 3, willow: 2, elm: 2, birch: 1, maple: 1 }, pines: { cypress: 3, fir: 1, hemlock: 1 }, rocks: { boulder: 2, cluster: 2, strata: 1, hoodoo: 1 }, bushes: { round: 3, juniper: 1, bracken: 1, fungus: 1 }, graves: { peak: 2, tablet: 2, round: 1 }, pillars: { round: 2, twisted: 1 }, bark: [0.42, 0.36, 0.34], leaves: DREAM, needles: [0.3, 0.38, 0.32], top: [0.5, 0.56, 0.42], topShare: 0.55 }), // Ulthar's gardens and the cypresses of the river Skai
  rlyeh: look({ trees: { swamp: 1 }, pines: { snag: 1 }, rocks: { columns: 3, porous: 2, shard: 1 }, bushes: { tendril: 2, scrub: 1 }, ...ALIEN, pillars: { drums: 3, twisted: 1 }, monoliths: { skew: 3, slab: 1 }, bark: [0.34, 0.38, 0.36], leaves: SALT, needles: [0.3, 0.36, 0.34], top: [0.36, 0.42, 0.36], topShare: 0.45 }), // the angles of R'lyeh: basalt and ooze
  yuggoth: look({ trees: { fungal: 3, sinew: 1 }, pines: { snag: 1 }, rocks: { shard: 2, crystal: 2, cluster: 1 }, bushes: { fungus: 3, tube: 1 }, ...ALIEN, pillars: { twisted: 3, square: 1 }, monoliths: { skew: 2, slab: 1 }, bark: [0.46, 0.4, 0.42], leaves: PALE, needles: [0.4, 0.38, 0.4], top: [0.5, 0.44, 0.46], topShare: 0.3 }), // the fungi from Yuggoth and their black towers
  beyond: look({ trees: { blasted: 1 }, pines: { snag: 1 }, rocks: { shard: 2, orb: 2, crystal: 1 }, bushes: { crystal: 2, tube: 1 }, ...ALIEN, pillars: { square: 2, twisted: 1 }, monoliths: { slab: 2, skew: 1 }, bark: [0.4, 0.4, 0.44], leaves: PALE, needles: [0.4, 0.42, 0.46], top: [0.56, 0.56, 0.6], topShare: 0.3 }),
  cloud_summit: look({ trees: { blasted: 1 }, pines: { snag: 1, windswept: 1 }, rocks: { shard: 3, crystal: 2, strata: 1 }, bushes: { crystal: 2, scrub: 1 }, ...ALIEN, bark: [0.44, 0.44, 0.46], leaves: SALT, needles: NEEDLES, top: [0.92, 0.92, 0.94], topShare: 0.75, snow: true, rockMat: 'rock' }), // ice above the storm
  black_wood: look({ trees: { sinew: 4, dead: 2, swamp: 1 }, pines: { hemlock: 2, snag: 2 }, rocks: { boulder: 2, cluster: 1 }, bushes: { tendril: 3, thorn: 2, fungus: 1 }, stumps: { hollow: 2, fungal: 1, broken: 1 }, bark: [0.3, 0.22, 0.2], leaves: FLESH, needles: [0.24, 0.24, 0.2], top: [0.3, 0.32, 0.24], topShare: 0.7 }), // a wood that is a body
  pale_lattice: look({ trees: { blasted: 1 }, pines: { snag: 1 }, rocks: { crystal: 4, columns: 2 }, bushes: { crystal: 3 }, ...ALIEN, pillars: { square: 2, round: 1 }, monoliths: { slab: 2 }, bark: [0.62, 0.62, 0.6], leaves: PALE, needles: [0.6, 0.62, 0.6], top: [0.8, 0.82, 0.8], topShare: 0.4 }), // prisms in stilled time
  piping_dark: look({ trees: { blasted: 1 }, pines: { snag: 1 }, rocks: { columns: 3, shard: 1 }, bushes: { tube: 3, tendril: 1 }, ...ALIEN, pillars: { round: 2, drums: 1 }, monoliths: { slab: 1, skew: 1 }, bark: [0.3, 0.28, 0.26], leaves: PALE, needles: [0.34, 0.32, 0.3], top: [0.4, 0.38, 0.34], topShare: 0.3 }), // pipes of stone that sound
  spheres: look({ trees: { blasted: 1 }, pines: { snag: 1 }, rocks: { orb: 4, cluster: 1 }, bushes: { crystal: 2, tube: 1 }, ...ALIEN, pillars: { round: 2 }, monoliths: { slab: 2 }, bark: [0.4, 0.42, 0.48], leaves: PALE, needles: [0.4, 0.44, 0.5], top: [0.56, 0.6, 0.66], topShare: 0.35 }), // the iridescent globes
  court_centre: look({ trees: { blasted: 1 }, pines: { snag: 1 }, rocks: { shard: 3, columns: 1, orb: 1 }, bushes: { tendril: 2, tube: 1 }, ...ALIEN, pillars: { twisted: 2, square: 1 }, monoliths: { skew: 2, slab: 1 }, bark: [0.24, 0.24, 0.28], leaves: PALE, needles: [0.26, 0.26, 0.3], top: [0.32, 0.32, 0.38], topShare: 0.3 }),
};

/** Every region's look (a region with none, the hub's). */
export const lookOf = (region?: string): PropLook => (region && PROP_LOOKS[region]) || PROP_LOOKS.hub;

/** The form a roll in [0, 1) picks of weighted forms; `fallback` when there are none. */
export function formOf<F extends string>(weights: Weights<F>, roll: number, fallback: F): F {
  const list = Object.entries(weights) as [F, number][];
  const total = list.reduce((s, [, w]) => s + w, 0);
  let r = roll * total;
  for (const [f, w] of list) if ((r -= w) < 0) return f;
  return list.length ? list[list.length - 1][0] : fallback;
}
