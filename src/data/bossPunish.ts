/**
 * Round 83, the punish windows ("evaluate boss encounters with inadequate post-attack recovery windows that limit player counterattack
 * opportunities ... lower-tier bosses should provide more generous pauses, whereas higher-tier bosses may feature reduced recovery
 * intervals", XDro; docs/DECISIONS.md). The attack library's recovery (data/attacks.ts) is one number for every creature, and in a boss's
 * script it fell the wrong way: the great old ones that fight with bites, sweeps and slams (20, 22 and 30 frames) were more hurried than
 * the first horrors of the dream, and a god's crushing blow, the heaviest in the game, recovered in the same 30 as a slam. A boss now
 * recovers from the last link of each blow it strikes for a time its band gives, by how far on in the dream it is met and how heavy the
 * blow is. Bosses only: the library's own numbers, and every lesser foe's, are as they were. Pure data.
 *
 * What a window must hold is measured on the investigator's own moves (data/moves.ts, tests/bossPunish.test.ts): a roll read a few
 * frames before the blow frees them about 26 frames after it lands, a late one about 34, and a light blow strikes on its ninth frame. So
 * a recovery under 30 cannot be punished inside itself by anyone, one of 38 can be after a late roll, and the pause between blows
 * (`BOSS.gap`) was then the only opening there was.
 */

export type PunishBand = 'first' | 'middle' | 'deep' | 'last';

export interface Punish {
  scale: number; // the library's recovery, times this...
  least: number; // ...but no blow of the band leaves its horror with fewer frames than this (the ninth frame of a light blow, after a roll read late: 38; a god's, read early: 33)...
  heavy: number; // ...and each point of the blow's power past 1 adds this many frames to the least: the heavier the blow, the more it costs
  evade: number; // the share kept of the horror's chance to slip the investigator's blow (bossArena.ts): the first horrors do not step aside from every counter
  blow: number; // and its blows lighter than its heaviest weigh this much more: the longer pauses cost it a share of its blows (measured on the timeline of every boss), the heaviest is held where the 30% rule has it (`blowWeight`), so the lighter carry what is made up, and what it deals in a minute is what the balance table was fitted to
}

export const PUNISH: Readonly<Record<PunishBand, Punish>> = {
  first: { scale: 1.25, least: 44, heavy: 14, evade: 0.5, blow: 1.07 },
  middle: { scale: 1.15, least: 40, heavy: 12, evade: 0.75, blow: 1.05 },
  deep: { scale: 1.08, least: 38, heavy: 10, evade: 1, blow: 1.12 },
  last: { scale: 1, least: 33, heavy: 8, evade: 1, blow: 1 }, // the blows of the last weigh as they did: the pauses cost them about 2%, and their guard costs (tests/bossStamina.test.ts) are the very figures of their damage
};

/**
 * The band of every horror that fights by a script, by when it is met (the balance model's order, tests/balanceModel.ts: the thirteen
 * of the first hours, fourteen of the middle of the dream, ten of the deep ones, the ten at the end). The Elder Shoggoth and the Polyp
 * Swarm, which have no place in that order, stand with the middle.
 */
export const BOSS_BAND: Readonly<Record<string, PunishBand>> = {
  dr_munoz: 'first', charles_le_sorcier: 'first', the_outsider: 'first', brown_jenkin: 'first', ephraim_waite: 'first', keziah_mason: 'first', black_man: 'first',
  colour_out_of_space: 'first', the_hound: 'first', the_unnamable: 'first', haunter_of_the_dark: 'first', wilbur_whateley: 'first', medusa_gorgon: 'first',
  martins_beach_horror: 'middle', terrible_old_man: 'middle', whisperer: 'middle', edward_hutchinson: 'middle', simon_orne: 'middle', lilith: 'middle',
  shunned_house_entity: 'middle', joseph_curwen: 'middle', dunwich_horror: 'middle', mother_hydra: 'middle', father_dagon: 'middle', hypnos: 'middle',
  high_priest: 'middle', colossus_pyramids: 'middle', shoggoth: 'middle', flying_polyp: 'middle',
  ghatanothoa: 'deep', bokrug: 'deep', nug: 'deep', rhan_tegoth: 'deep', yeb: 'deep', great_ones: 'deep', yig: 'deep', tsathoggua: 'deep', cthulhu: 'deep', hastur: 'deep',
  zkauba: 'last', zann_window_thing: 'last', yog_sothoth: 'last', ancient_ones: 'last', shub_niggurath: 'last', daemon_pipers: 'last', other_gods: 'last',
  umr_at_tawil: 'last', nyarlathotep: 'last', azathoth: 'last',
};

/** The band of a horror by its roster id, if it fights by a script. */
export const bandOf = (id: string): PunishBand | undefined => BOSS_BAND[id];

/**
 * How much more a blow of `power` weighs for a horror of `band` whose heaviest blow has power `top`: the band's `blow`, but never so much
 * that it passes that heaviest one. How hard the heaviest blow of a horror strikes is fixed by what a person carries where they meet it
 * (tests/bossBlows.test.ts: 30% of their health; tests/oneHit.test.ts), and a pause must not be paid for from that.
 */
export const blowWeight = (band: PunishBand, power: number, top: number): number => (power > 0 ? Math.min(PUNISH[band].blow, top / power) : 1);

/** The parts of an attack its recovery is reckoned from (data/attacks.ts `AttackDef`). */
interface Blow {
  kind: 'melee' | 'ranged' | 'area' | 'special';
  recovery: number;
  power: number;
  sanity?: number;
  follow?: string;
}

/**
 * The frames after a blow's last active frame in which its horror is held. A link that runs on into another (a chain's early blows, the
 * vortex's pull) and a special that harms nothing (a teleport, a summons, the dark) recover as the library has them; the rest take the band's.
 */
export function recoveryFor(a: Blow, band?: PunishBand): number {
  if (!band || a.follow || (a.kind === 'special' && !a.sanity)) return a.recovery;
  const p = PUNISH[band];
  return Math.max(Math.round(a.recovery * p.scale), p.least + Math.round(p.heavy * Math.max(0, a.power - 1)));
}
