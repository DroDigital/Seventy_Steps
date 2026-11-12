/**
 * What the demo is (docs/DEMO_BUILD.md): the ids of everything of the game that the demo build keeps, by kind. The demo's bundle
 * is the game with every other entry of every table cut out at build time (tools/demo/rules reads these lists), and its dist holds
 * only the files these ids need (tools/demo/assets.ts). The full game never reads this module; the demo's bundle never holds the
 * ids it leaves out. `tests/demoContent.test.ts` holds each list to the real data, from both sides: an id here that the data does
 * not have, and a thing the demo reaches that is not here, both fail it. No imports: the build's config reads this file before any
 * of the game is built.
 */

/** The realms of the demo (systems/demo.ts reads them too): the university, and Arkham with the Blasted Heath. */
const REGIONS = ['hub', 'arkham'] as const;

export const KEEP = {
  regions: REGIONS,
  signs: ['hub_quad', 'hub_dream', 'hub_archive', 'arkham_streets', 'arkham_heath', 'arkham_witch'],
  gates: ['hub_antarctic', 'hub_australia'],
  dungeons: ['library', 'munoz_rooms', 'alchemist_cellars', 'outsider_crypt', 'witch_house', 'hound_churchyard', 'deserted_house', 'swamp_tomb'],
  /** Dungeon rooms whose set of furniture the demo keeps ('dungeon/room'). */
  roomSets: ['library/foyer', 'library/reading', 'library/periodicals', 'library/restricted', 'library/bindery'],
  /** The horrors of the open arenas, which have a court, a house, a gate and a discovery of their own. */
  arenas: ['colour_out_of_space', 'black_man'],
  /** Every dungeon kit a room of the demo stands in, with the one below and the default (data/kits.ts). */
  kits: ['masonry', 'library', 'timber', 'townhouse', 'cellar', 'crypt'],
  /** Every creature the demo can put on the ground, with the summons and the passers-by. */
  entities: [
    'rat_swarm', 'reanimated_corpse', 'exham_troglodyte', 'ghoul', 'moon_bog_wraith', 'cthulhu_cultist', // lesser
    'being_from_beyond', // greater
    'colour_out_of_space', 'keziah_mason', 'brown_jenkin', 'black_man', 'the_hound', 'the_unnamable', 'voice_in_the_tomb', 'dr_munoz', 'charles_le_sorcier', 'the_outsider', // named
    'algol_light_being', // ally
  ],
  /** The horrors that fall in the demo (the named tier of `entities`). */
  bosses: ['colour_out_of_space', 'keziah_mason', 'brown_jenkin', 'black_man', 'the_hound', 'the_unnamable', 'voice_in_the_tomb', 'dr_munoz', 'charles_le_sorcier', 'the_outsider'],
  /** The horrors with a set, a way and a discovery of their own in the demo's courts and halls (keys of the arena tables). */
  halls: ['keziah_mason', 'dr_munoz', 'charles_le_sorcier', 'the_outsider', 'the_hound', 'the_unnamable', 'voice_in_the_tomb'],
  npcs: ['peaslee', 'gilman', 'morgan'],
  quests: ['borrowed_reins', 'sleepers', 'witch_house'], // (and the two `discover_<horror>` the arenas' discoveries make)
  documents: [
    'Arkham Advertiser, October 2nd', "Frank's Letter Home", 'Necronomicon', 'Liber Ivonis', "Michel Mauvais's Notes", "Officer Riley's Report", "Ammi Pierce's Letter",
    "Gilman's Dream-Diary", "Keziah's Formulae", "St John's Diary", "The Surveyors' Report", "Goodwife's Deposition",
  ],
  pois: ['hub_potters_field', 'hub_laboratory', 'arkham_meadow_hill', 'arkham_blasted_well', 'arkham_ghoul_warren', 'arkham_brown_jenkin', 'arkham_doorstep'],
  wanderings: ['heath_procession', 'burden'],
  achievements: ['signs', 'witch', 'colour', 'growth', 'reader', 'hundred', 'stones', 'strength'],
  weapons: ['cane', 'razor'],
  /** The field-guide hints of the horrors that are not in the demo (the rest of the guide stays). */
  hintsLeftOut: ['ship', 'powder', 'cover', 'roots', 'spheres', 'blind'],
  /** The realm music of each realm (data/realmMusic.ts) and the boss themes (data/bossMusic.ts) the demo plays. */
  realmTracks: ['silent_hours', 'heathwind'],
  bossTracks: [
    'alien_boss_battle', 'phrygian_waltz', 'moonlit_ravine', 'hounds_of_the_mist', 'the_formless_one', 'the_hollow_bell', 'sub_zero_protocol', 'the_alchemists_oath', 'the_last_confession',
  ],
  /** Every baked model a place of the demo stands (data/models: the four sets), by id. */
  models: [
    // boss pack
    'al_still', 'ca_column', 'fh_beam', 'fh_beam_drop', 'fh_beam_lean', 'fh_bed', 'fh_crate', 'fh_floor', 'fh_hearth', 'fh_post', 'fh_roof_c', 'fh_shelf', 'fh_stove', 'fh_table', 'fh_trunk', 'fh_wall',
    'fh_wall_door', 'fh_wall_thin', 'fh_wall_win', 'gt_dead_3', 'gt_dead_4', 'gt_dead_5', 'gt_dead_6', 'gt_dead_8', 'gt_dead_9', 'lb_florence', 'lb_retort', 'lb_round', 'lb_stand', 'nt_canoe', 'nt_lily',
    'nt_log', 'nt_menhir_a', 'nt_menhir_b', 'nt_menhir_c', 'nt_menhir_d', 'nt_reed', 'nt_stone_flat', 'nt_stump', 'pd_chandelier', 'pd_debris', 'pd_pillar_broken', 'pd_pillar_fallen', 'pd_spikes',
    'ph_compressor', 'ph_mirror', 'ph_pipes', 'ph_roots', 'px_chimney', 'px_well', 'rh_boarded_window', 'rh_door', 'rh_plank', 'rh_shutter', 'rn_barrel', 'rn_bricks', 'rn_cart', 'rn_wall_broken',
    'sw_pipe_huge', 'sw_rubble',
    // Kenney's
    'altar_stone', 'barrel', 'bedroll', 'bench', 'bowl', 'candles', 'chalice', 'chest', 'coffin', 'crate', 'cross', 'crypt_small', 'grave_broken', 'grave_cross', 'grave_wide', 'hay_bale', 'iron_gate',
    'lantern', 'signpost', 'skeleton', 'tent', 'urn', 'wall_ruin',
    // the gates'
    'gate_boulder', 'gate_timber_l', 'gate_timber_r',
    // the web's
    'wk_crater', 'wk_crystal', 'wk_crystals', 'wk_keeper', 'wk_meteor',
  ],
  /** The pieces of a court or a hall that are built in code, not baked (data/setKits.ts, render/setShapes.ts). */
  setKits: ['pipes', 'skull_pole', 'meteor', 'bookcase', 'bookcase_low', 'bookshelf', 'bookpile'],
  /** The speakers the demo has recordings of (data/speechCast.ts keys). */
  voices: ['narrator:intro', 'npc:peaslee', 'npc:gilman', 'npc:morgan', 'boss:keziah_mason', 'boss:black_man', 'boss:voice_in_the_tomb', 'boss:dr_munoz', 'boss:charles_le_sorcier'],
} as const satisfies Record<string, readonly string[]>;

export type KeepKind = keyof typeof KEEP;

/** The ids of one kind, as a set to ask of. */
export const keepSet = (kind: KeepKind): ReadonlySet<string> => new Set<string>(KEEP[kind]);

/** The edition's name for the realms the demo stands on: `hub` and `arkham`, and nothing of the others. */
export const DEMO_REGIONS: readonly string[] = REGIONS;
