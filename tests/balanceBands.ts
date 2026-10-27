/**
 * What the balance table holds a fight to (rounds 61, 68 and 71), shared by tests/balance.test.ts and, since round 95, tests/ngPlus.test.ts,
 * which holds every later journey to the same bands. Constants only: nothing here fights.
 */

/**
 * Round 61, "no boss insurmountable, none excessively easy": each tier's own band as well, so a fight is held to its kind and not only to the
 * widest bounds. A named horror is over in 7 to 40 seconds and always costs something (a bot that slips most blows still bleeds a little);
 * a god of 2500 health or more takes 18 to 90 (a long tail is for the gaze and the roots, waived and added above) and costs between a third of the Reagent carried
 * and one and a half times it after level scaling. Seconds are the bot's, steady and close in: a person's are about three times as long.
 */
/**
 * Round 68, "restore appropriate difficulty across all levels, even on normal": the bands are raised with the numbers they hold, and a god
 * is told by name, not by its health (the health is no longer a line between the great fights and the rest). A named horror is over in 14 to 50
 * seconds (a person's: 40 to 150) and costs a bot between a twentieth of a life and one and a fifth; a great fight takes 35 to 100 and
 * costs between a third of a life and one and a third, climbing with the rank (`RISE`). Raised again later in the round: a named horror costs at least a fifth of a life, a great fight at least 0.45 (the bot slips most of a gaze, which does no harm: five horrors that leaned on it were given blows in its place).
 */
export const GREAT = new Set('mother_hydra father_dagon shub_niggurath bokrug nug rhan_tegoth yeb great_ones yig tsathoggua nyarlathotep hastur ghatanothoa cthulhu umr_at_tawil yog_sothoth'.split(' '));
export const BANDS = { named: { seconds: [14, 50], lives: [0.2, 1.2] }, god: { seconds: [35, 100], lives: [0.45, 1.5] } } as const;
/**
 * Round 68, "all bosses remain demanding regardless of player level": the same fights again at the cap (every level bought, the cane set to
 * +5), where the horror has grown past the standing it is met at (systems/bossScaling.ts `overmatch`). None may cost a bot less than this,
 * nor be over in fewer seconds, whatever a person has farmed.
 */
export const CAP = { named: { seconds: 10, lives: 0.1 }, god: { seconds: 30, lives: 0.4 }, reinforced: 5, starts: [6, 7, 8, 9, 10, 11, 12, 13, 14] } as const; // (round 71: nine starts, not three: 'Umr at-Tawil cost the same bot 0.28, 0.93 and 0.43 lives from three, and a floor held on three paths was a coin)
/** Azathoth is blind and cannot be wounded (its fight is outlasting the piping; what it costs the bot is the noise the bot makes), and the Haunter is hurt only by lamplight (a person lures it to a lamp; the bot stands where it is). */
export const EXEMPT = ['azathoth', 'haunter_of_the_dark'];
