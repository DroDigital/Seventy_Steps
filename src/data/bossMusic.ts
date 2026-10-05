/**
 * The boss themes (round 44): every horror fights to a theme of its own, made with Suno, from the
 * "Boss themes" folder, served from `public/music/bosses/` as MP3 (untouched: the gain is applied at
 * runtime). While a fight is engaged its theme comes in with it, loops with no audible seam, rises
 * with the phases (and, in the last, moves to its hottest stretch) and fades out when the fight ends;
 * render/audio/bossMusic.ts still plays the procedural score where a file is missing, loading or
 * fails. Which theme sounds is decided by the track, not the boss: a pair shares one. Where in each
 * file it plays, loops and heats is found offline (tools/boss_music.py -> data/bossMusicMap.ts), and
 * OVERRIDES beats it, so a loop point can be mended by ear without touching code. A track with no
 * entry in the map is analysed as it loads, as the realms' are. The numbers here are the whole of
 * the tuning (and each is logged, with how it was measured, in docs/DECISIONS.md). Data only.
 */

/** Track id (the title in snake_case, accents and apostrophes dropped) -> title, and the roster ids it scores. */
export const BOSS_TRACKS = {
  alien_boss_battle: { title: 'Alien Boss Battle', bosses: ['colour_out_of_space'] },
  phrygian_waltz: { title: 'Phrygian Waltz', bosses: ['keziah_mason', 'brown_jenkin'] },
  colossal_footfalls: { title: 'Colossal Footfalls', bosses: ['dunwich_horror'] },
  the_necromancers_duel: { title: "The Necromancer's Duel", bosses: ['joseph_curwen'] },
  bells_in_the_dark: { title: 'Bells in the Dark', bosses: ['haunter_of_the_dark'] },
  the_swarm_awakens: { title: 'The Swarm Awakens', bosses: ['whisperer'] },
  tekeli_lis_last_stand: { title: "Tekeli-li's Last Stand", bosses: ['shoggoth'] },
  the_lurching_vault: { title: 'The Lurching Vault', bosses: ['flying_polyp'] },
  hollow_bone_ritual: { title: 'Hollow Bone Ritual', bosses: ['high_priest'] },
  the_house_that_haunts_you: { title: 'The House That Haunts You', bosses: ['wilbur_whateley'] },
  moonlit_ravine: { title: 'Moonlit Ravine', bosses: ['black_man'] },
  the_phrygian_fugue: { title: 'The Phrygian Fugue', bosses: ['simon_orne'] },
  the_obelisk_awakens: { title: 'The Obelisk Awakens', bosses: ['edward_hutchinson'] },
  dripping_stone: { title: 'Dripping Stone', bosses: ['curwen_pit_thing'] },
  the_wrong_waltz_of_swapped: { title: 'The Wrong Waltz of Swapped', bosses: ['ephraim_waite'] },
  hounds_of_the_mist: { title: 'Hounds of the Mist', bosses: ['the_hound'] },
  the_formless_one: { title: 'The Formless One', bosses: ['the_unnamable'] },
  rotting_cellar_boss: { title: 'Rotting Cellar Boss', bosses: ['shunned_house_entity'] },
  canal_blood_ritual: { title: 'Canal Blood Ritual', bosses: ['lilith'] },
  the_pendulums_last_waltz: { title: "The Pendulum's Last Waltz", bosses: ['terrible_old_man'] },
  the_hollow_bell: { title: 'The Hollow Bell', bosses: ['voice_in_the_tomb'] },
  bonfire_of_the_void: { title: 'Bonfire of the Void', bosses: ['martins_beach_horror'] },
  the_ruawns_grasp: { title: "The Ruawn's Grasp", bosses: ['medusa_gorgon'] },
  the_pyramids_stomp: { title: "The Pyramid's Stomp", bosses: ['colossus_pyramids'] },
  sub_zero_protocol: { title: 'Sub-Zero Protocol', bosses: ['dr_munoz'] },
  the_alchemists_oath: { title: "The Alchemist's Oath", bosses: ['charles_le_sorcier'] },
  the_last_confession: { title: 'The Last Confession', bosses: ['the_outsider'] },
  pendulum_of_madness: { title: 'Pendulum of Madness', bosses: ['hypnos'] },
  fragile_defiance: { title: 'Fragile defiance', bosses: ['zann_window_thing'] },
  yaddiths_sorcerer: { title: "Yaddith's Sorcerer", bosses: ['zkauba'] },
  the_sunken_leviathan: { title: 'The Sunken Leviathan', bosses: ['cthulhu'] },
  the_drowned_pantheon: { title: 'The Drowned Pantheon', bosses: ['father_dagon', 'mother_hydra'] },
  the_temple_of_mu: { title: 'The Temple of Mu', bosses: ['ghatanothoa'] },
  b_locios_venom: { title: 'B Locios Venom', bosses: ['yig'] },
  the_slumbering_toad_god: { title: 'The Slumbering Toad-God', bosses: ['tsathoggua'] },
  twin_gods_of_the_nether: { title: 'Twin Gods of the Nether', bosses: ['nug', 'yeb'] },
  the_drowned_sarnath: { title: 'The Drowned Sarnath', bosses: ['bokrug'] },
  the_betrayal_of_kadath: { title: 'The Betrayal of Kadath', bosses: ['great_ones'] },
  the_wax_museum: { title: 'The wax museum', bosses: ['rhan_tegoth'] },
  hasturs_waltz: { title: "Hastur's Waltz", bosses: ['hastur'] },
  the_goat_of_the_deep_woods: { title: 'The Goat of the Deep Woods', bosses: ['shub_niggurath'] },
  the_crawling_chaos: { title: 'The Crawling Chaos', bosses: ['nyarlathotep'] },
  the_other_gods: { title: 'The Other Gods', bosses: ['other_gods'] },
  the_cosmic_gate: { title: 'The Cosmic Gate', bosses: ['yog_sothoth'] },
  umr_at_tawil: { title: 'Umr at-Tawil', bosses: ['umr_at_tawil'] },
  the_ancient_ones: { title: 'The Ancient Ones', bosses: ['ancient_ones'] },
  daemon_pipers: { title: 'Daemon Pipers', bosses: ['daemon_pipers'] },
  the_blind_idiot_god: { title: 'The Blind Idiot God', bosses: ['azathoth'] },
} as const satisfies Record<string, { title: string; bosses: readonly string[] }>;
export type BossTrackId = keyof typeof BOSS_TRACKS;
export const BOSS_TRACK_IDS = Object.keys(BOSS_TRACKS) as BossTrackId[];

/** Where a track's file is, beside the page (public/music/bosses/<id with dashes>.mp3). */
export const bossFile = (id: BossTrackId): string => `music/bosses/${id.replace(/_/g, '-')}.mp3`;

const BY_BOSS: Readonly<Record<string, BossTrackId>> = Object.fromEntries(BOSS_TRACK_IDS.flatMap((id) => BOSS_TRACKS[id].bosses.map((b) => [b, id] as const)));

/** The theme that scores a roster id's fight, or null (a horror with none fights to the procedural score). */
export const bossTrackOf = (rosterId: string): BossTrackId | null => BY_BOSS[rosterId] ?? null;

/** What mends a track by ear: each beats the map and the analysis. Seconds into the file; `trim` in dB; `hot: null` turns the hot stretch off. */
export interface BossOverride {
  entry?: number; // where playing begins
  loop?: readonly [start: number, end: number, overlap?: number]; // the loop's two ends, and the crossfade between passes
  hot?: readonly [start: number, end: number, overlap?: number] | null; // the last phase's stretch
  trim?: number; // dB added to the track's level (negative: thinner, left dynamic)
}
export const OVERRIDES: Readonly<Partial<Record<BossTrackId, BossOverride>>> = {
  // the author's thin, dynamic ones (docs/DECISIONS.md, round 44): not pumped up to the others' body
  the_blind_idiot_god: { trim: -2 },
  bells_in_the_dark: { trim: -2 },
  the_ancient_ones: { trim: -2 },
};

export const BOSS_MUSIC = {
  /** Loudness: a track's body is brought to this RMS (dBFS, as render/audio/loudness.ts reads it), with no peak over the ceiling (linear). */
  target: -23, // measured at the output (headless Chromium, 25 s of four fights with their effects and ambience): the procedural score's total is -21.8 dBFS; a theme at -18 made it -17.7, at -21 made it -18.9 (+2.9 dB), at -23 -19.6 (+2.3 dB): the fight is the loudest part and still sits under the blows
  ceiling: 0.8,
  level: 1, // the scores' bus (the music setting, the sanity FX, the muffle), times this
  fadeIn: 2.5, // seconds a theme takes to come in with a fight (the procedural score's: data/playTuning.ts MUSIC)
  fadeQuick: 0.8, // ... where the entry is already driving (within `quickLead` seconds of the entry)
  quickLead: 3,
  fadeOut: 3.5, // ... to go when the fight ends
  handover: 3, // seconds one theme takes to give way to another while a fight goes on (Kadath: the Great Ones, then Nyarlathotep)
  takeover: 2.5, // ... a theme takes to replace the procedural score that began a fight before its file had loaded
  hotBars: 1, // bars the move to the hot stretch (the last phase) takes, begun at a bar line
  hotRise: 3, // dB the hot stretch may sound over the loop: more is trimmed (tools/boss_music.py), so the climax is not a shout
  keep: 2, // decoded themes held in memory (the one sounding and the one coming)
  retry: 45, // seconds before a file that failed to load is asked for again
  warm: 160, // metres from a living, unengaged boss's ring within which its theme is fetched and decoded
  /** Under a horror's spoken line (arrival, fall): `db` down, quick in (time constant `attack`), slow out (`release`). */
  duck: { db: -5, attack: 0.12, release: 1.1 },
  /** Under the first arrival scene: `db` down until the scene ends, then back over `rise` seconds from the next bar line. */
  scene: { db: -14, rise: 0.4 },
  /** Each later phase lifts the theme by this much (dB) in level and in the highs (a shelf above `shelf` Hz), up to `steps` phases. */
  lift: { level: 1, bright: 1, steps: 2, shelf: 3000, settle: 1.5 },
  /** Where there is no pulse to cut on, a bar is this long (seconds), and the loops are the realms' kind. */
  bar: 4,
};
