/**
 * How each creature comes apart under a blade, and what it bleeds (round 113; render only, read by
 * render/gore*.ts and render/blood*.ts). Asked by XDro: "dismemberment ... visually pleasing and logical
 * for every enemy", "and blood too". Nothing of the drawn art changes: a killing cut parts the creature's
 * own picture along the blow's line, and the part beyond it flies.
 *
 *   break  sever  a limbed body: a clean cut, the head, the upper body or the legs thrown off
 *          split  a soft, shapeless one: a ragged tear, the lumps slide apart and slump
 *          chip   a dry, hard or ancient one: a broken edge, a chunk drops off in dust
 *          none   what has no body to cut (a spectre, a light, an avatar, a god outside): it goes as before
 *   blood  the matter it spills: on a blow, at the cut, and in a pool under it as it dies
 */

type Rgb = readonly [number, number, number];

export type GoreBreak = 'sever' | 'split' | 'chip' | 'none';
export type BloodKind = 'red' | 'dark' | 'ichor' | 'black' | 'pale' | 'yellow' | 'dust' | 'none';

/** Each blood's colour: lit as the ground is, dark, never an anomaly hue (the red sits well off the Eldritch Magenta). */
export const BLOOD: Readonly<Record<Exclude<BloodKind, 'none'>, Rgb>> = {
  red: [0.33, 0.08, 0.03], // a man's, a beast's
  dark: [0.2, 0.065, 0.04], // old, thick, near black: ghouls, the dead, the degenerate
  ichor: [0.1, 0.135, 0.11], // the sea's: the Deep Ones' green-black
  black: [0.045, 0.045, 0.06], // an oil: night-gaunts, shoggoths, what is made of the dark
  pale: [0.42, 0.4, 0.3], // a sap: the fungi of Yuggoth, the cone-bodies, the moon-beasts
  yellow: [0.34, 0.33, 0.1], // the Whateleys' "greenish-yellow ichor"
  dust: [0.46, 0.42, 0.36], // what has long been dry: a mummy, a sorcerer older than his years, stone
};

/** Whether a blood is wet (it pools, drips and shines) or dry (it puffs and settles as dust). */
export const isWet = (b: BloodKind): boolean => b !== 'dust' && b !== 'none';

type Gore = readonly [GoreBreak, BloodKind];
const S = (blood: BloodKind): Gore => ['sever', blood];
const P = (blood: BloodKind): Gore => ['split', blood];
const C = (blood: BloodKind): Gore => ['chip', blood];
const NONE: Gore = ['none', 'none'];

/** Every roster id (tests/gore.test.ts holds the roster to it), by what the tales make of it. */
export const GORE: Readonly<Record<string, Gore>> = {
  // the lesser
  deep_one: S('ichor'), innsmouth_hybrid: S('ichor'), dagon_priest: S('ichor'), cthulhu_cultist: S('red'),
  ghoul: S('dark'), ghast: S('dark'), zoog: S('red'), night_gaunt: S('black'), moon_beast: S('pale'),
  man_of_leng: S('red'), cat_from_saturn: S('black'), wamp: S('red'), gnorri: S('ichor'), serpent_man: S('red'),
  kn_yan_dweller: S('red'), ym_bhi: S('dark'), gyaa_yothn: S('red'), reanimated_corpse: S('dark'),
  martense_degenerate: S('red'), exham_troglodyte: S('red'), rat_swarm: ['none', 'red'], winged_hybrid: S('black'),
  moon_bog_wraith: NONE, being_of_ib: S('ichor'), nameless_city_reptile: S('red'), hybrid_mummy: C('dust'),
  venusian_man_lizard: S('red'), beast_in_the_cave: S('red'), child_of_yig: ['none', 'red'], albino_penguin: S('red'),
  gnoph_keh: S('red'),
  // the greater
  mi_go: S('pale'), elder_thing: S('ichor'), shoggoth: P('black'), star_spawn: S('ichor'), yithian: S('pale'),
  flying_polyp: P('black'), gug: S('red'), dhole: P('pale'), shantak: S('dark'), formless_spawn: P('black'),
  yekubian: S('ichor'), being_from_beyond: P('pale'), thousand_young: P('black'),
  // the named
  colour_out_of_space: NONE, wilbur_whateley: S('yellow'), dunwich_horror: P('yellow'), keziah_mason: S('red'),
  brown_jenkin: S('red'), black_man: NONE, joseph_curwen: C('dust'), simon_orne: S('red'), edward_hutchinson: S('red'),
  curwen_pit_thing: P('dark'), ephraim_waite: S('red'), haunter_of_the_dark: NONE, whisperer: S('pale'),
  the_hound: S('dark'), the_unnamable: P('black'), shunned_house_entity: P('pale'), lilith: S('dark'),
  zann_window_thing: NONE, voice_in_the_tomb: NONE, high_priest: S('pale'), colossus_pyramids: S('dark'),
  martins_beach_horror: S('ichor'), dr_munoz: P('dark'), charles_le_sorcier: S('red'), medusa_gorgon: S('dark'),
  hypnos: C('dust'), the_outsider: S('dark'), terrible_old_man: S('red'), zkauba: S('pale'),
  // the great old ones
  cthulhu: P('ichor'), father_dagon: S('ichor'), mother_hydra: S('ichor'), hastur: P('black'), tsathoggua: P('black'),
  ghatanothoa: S('dark'), rhan_tegoth: S('dark'), yig: S('red'), bokrug: S('ichor'), nug: P('black'), yeb: P('black'),
  great_ones: C('dust'),
  // the outer gods: what is not of matter does not bleed; the Black Goat is all flesh
  azathoth: NONE, daemon_pipers: NONE, other_gods: NONE, yog_sothoth: NONE, umr_at_tawil: NONE, ancient_ones: NONE,
  shub_niggurath: P('black'), nyarlathotep: NONE,
  // allies, should a blow ever take one
  nodens: NONE, tritons: S('ichor'), cats_of_ulthar: S('red'), pickman: S('dark'), nasht_kaman_thah: NONE,
  algol_light_being: NONE, yithian_archivist: S('pale'),
};

/** A creature's gore by its sprite key (`id` or `id#variant`): a variant comes apart as its kind does. */
export function goreOf(key: string): Gore {
  return GORE[key.split('#')[0]] ?? NONE;
}

/** The numbers of the cut, the spray and the pools. */
export const GORE_FX = {
  hold: 0.06, // the share of the death move before the cut parts (the blow's own beat)
  land: 0.62, // the share by which the piece has come to rest
  dissolveFrom: 0.72, // and from which what is left goes as its matter does (crumble, melt...)
  pad: 1.7, // the piece's billboard is this much larger than the body's, so it turns without its corners cut
  speed: [2.2, 3.6], // m/s the severed piece is thrown at, away from the blade, for a man's size
  lift: [2.2, 3.4], // m/s up
  splitSlide: 0.55, // a torn lump slides, it is not thrown: this share of the speed, little lift
  chipDrop: 0.3, // a broken chunk drops off: this share
  turns: [0.22, 0.32], // turns a severed piece spins through before it lies
  jag: { sever: 0.012, split: 0.09, chip: 0.06 }, // how ragged the line is, a share of the frame
  rim: 1.6, // texels of the wet (or dusty) edge along the cut
  pools: 96, // the most pools and spatters lying at once (the oldest go first)
  poolLife: 75, // seconds a pool lies before it has dried away
  poolGrow: 2.2, // seconds a body's pool takes to spread
  poolSize: [0.55, 1.2], // metres across a man's pool, the least and the most (a body's size scales it)
  spatterLife: 40,
  drops: [5, 14], // drops a blow throws, by its weight
  hurtDrops: [3, 7], // of the investigator's own, when struck
  gush: 0.7, // seconds the cut spurts from the stump
} as const;
