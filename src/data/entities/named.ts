/**
 * Named tier (spec §4): individual horrors, sorcerers and avatars. Region bosses use the boss
 * archetype; the rest are optional bosses with their own temperament. All but the two stationary
 * horrors fight by phase scripts (spec §3E) of their own blows (data/bossMoves*.ts, each built on the
 * shared attack library; 2026-11-24) and reality hooks; the Colour, the Dunwich Horror and the Haunter also have signature mechanics (systems/).
 */

import { ph, phases, scripted, st, tier } from './kit';

export const NAMED = tier('named', [
  {
    id: 'colour_out_of_space', name: 'The Colour Out of Space', source: 'The Colour Out of Space', regions: ['arkham'], canonLooks: false,
    sprite: { silhouette: 'orb', palette: 'pallid', scale: 5, eyes: 0, glow: 'magenta', outside: true },
    ...scripted('boss', phases(ph(1, { colour_shaft: 2, colour_well: 2, colour_bloom: 1, colour_blight: 1 }, { hooks: ['camera_warp'] }), ph(0.5, { colour_shaft: 2, colour_well: 1, colour_bloom: 2, colour_globules: 2, colour_flicker: 1, colour_column: 2, colour_blight: 1 }, { hooks: ['camera_warp'] }))),
    stats: st(1300, 400, 22, 3, 4, 10), resist: ['slash', 'blunt', 'shot'], drops: { echoes: 3000 }, insightOnSight: 2, // (round 97, asked back: health 1150 to 2400, its pre-history value; round 12 had it at 2400 before the 0.9 × hp^0.9 compression to 1000)
  },
  {
    id: 'wilbur_whateley', name: 'Wilbur Whateley', source: 'The Dunwich Horror', regions: ['dunwich'], canonLooks: true,
    sprite: { silhouette: 'giant', palette: 'rust', scale: 3.2, eyes: 2, tentacles: 8, limbs: 2 },
    ...scripted('caster', phases(ph(1, { wilbur_words: 2, wilbur_hands: 1, summon: 1, wilbur_sabbat: 1 }, { summons: ['thousand_young'] }), ph(0.4, { wilbur_hands: 2, wilbur_feelers: 2, wilbur_bleat: 1, wilbur_draw: 1 }))),
    stats: st(2400, 150, 59, 3.4, 2, 6), drops: { echoes: 1800 }, insightOnSight: 1, // (round 97: damage 54 to 52, so his vortex takes at most 30% of a person's health where he is met: his new place in the first band, after the Terrible Old Man's health moved him earlier, has him met at a standing where the blow was 30.2%)
  },
  {
    id: 'dunwich_horror', name: 'The Dunwich Horror', source: 'The Dunwich Horror', regions: ['dunwich'], canonLooks: true,
    assembly: { body: 'lathe', palette: 'rubber', scale: 9, tentacles: 10, eyes: 12 },
    ...scripted('boss', { ...phases(ph(1, { dunwich_ropes: 2, dunwich_tread: 2, dunwich_crash: 1, dunwich_furrow: 1 }), ph(0.55, { dunwich_tread: 2, dunwich_crash: 2, dunwich_cry: 1, dunwich_rush: 1, dunwich_furrow: 1, dunwich_thunder: 1, dunwich_tendrils: 1 }), ph(0.12, { dunwich_tread: 1, dunwich_ropes: 1, dunwich_cry: 2, dunwich_furrow: 1 }, { hooks: ['camera_warp'] })), unseen: true }),
    stats: st(2950, 500, 58, 3, 4, 10), resist: ['shot'], drops: { echoes: 6000 }, insightOnSight: 2,
  },
  {
    id: 'keziah_mason', name: 'Keziah Mason', source: 'The Dreams in the Witch House', regions: ['arkham'], canonLooks: true,
    sprite: { silhouette: 'robed', palette: 'charcoal', scale: 2, eyes: 2, gear: ['witch'] },
    ...scripted('boss', phases(ph(1, { keziah_hex: 2, keziah_step: 1, summon: 1, keziah_angles: 2, keziah_gust: 2 }, { summons: ['rat_swarm'] }), ph(0.5, { keziah_fan: 2, keziah_step: 2, keziah_eye: 1, summon: 1, keziah_corners: 1, keziah_daggers: 1, keziah_sabbath: 1, keziah_gust: 1, keziah_knife: 1 }, { summons: ['rat_swarm'], hooks: ['arena_reconnect', 'camera_warp'] })), { range: [6, 12], strafe: 0.5 }), // 2026-11-03: a gust that shoves the investigator off (and, past half, one slash of her knife) at close quarters, where the 360-degree volley was all she had within 4 m
    stats: st(1600, 120, 28, 3.4, 2, 8), drops: { echoes: 2500 }, insightOnSight: 1, // (round 97, asked back: health 1100 to 1600, its pre-history value; round 12 had it at 1600 before the compression to 700) (round 107: health 1350 to 1600: her first barrage gone, the bot took 0.11 lives of her)
  },
  {
    id: 'brown_jenkin', name: 'Brown Jenkin', source: 'The Dreams in the Witch House', regions: ['arkham'], canonLooks: true,
    sprite: { silhouette: 'quadruped', palette: 'rust', scale: 1, eyes: 2 },
    ...scripted('skirmisher', { ...phases(ph(1, { jenkin_nip: 2, jenkin_hands: 1, jenkin_gnaw: 1 }), ph(0.4, { jenkin_nip: 3, jenkin_scurry: 1, jenkin_gnaw: 2 })), joins: { with: 'keziah_mason', below: 0.5 } }), // in the walls until she is half spent
    stats: st(450, 40, 19, 5.5, 1.5, 5), drops: { echoes: 800 }, insightOnSight: 1, // (round 97: health 650 to 700, a buff: the bot took 0.39 lives of him, under the early horrors' 0.4)
  },
  {
    id: 'black_man', name: 'The Black Man', source: 'The Dreams in the Witch House', regions: ['arkham'], canonLooks: true,
    sprite: { silhouette: 'humanoid', palette: 'charcoal', scale: 2.6, eyes: 2, glow: 'purple', gear: ['tall', 'coat'] },
    ...scripted('mind_thief', phases(ph(1, { blackman_ink: 1, blackman_ricochet: 1, blackman_regard: 1, blackman_door: 1, blackman_sweep: 1, blackman_files: 1 }), ph(0.5, { blackman_regard: 1, blackman_fan: 1, blackman_sabbath: 1, blackman_files: 2, blackman_crosses: 1, blackman_ricochet: 2, blackman_draw: 1 }, { hooks: ['decoys'] }))),
    stats: st(2500, 200, 45, 3.8, 3, 10), drops: { echoes: 2500 }, insightOnSight: 2, // (round 107: health 3100 to 2500: with the barrage gone his court patterns are dodged slowly and the bot's fight ran 122 s) (round 97: health 1500 to 2700, a buff: the bot took 0.28 lives of him, under the early horrors' 0.4) (round 83: health 1150 to 1500: the longer pauses after his blows left the bot 0.12 lives of him, under the 0.2 floor, and his vortex is already the 30% a heaviest blow may take)
  },
  {
    id: 'joseph_curwen', name: 'Joseph Curwen', source: 'The Case of Charles Dexter Ward', regions: ['providence'], canonLooks: true,
    sprite: { silhouette: 'humanoid', palette: 'sand', scale: 2.1, eyes: 2, gear: ['tricorn', 'coat'] },
    ...scripted('boss', phases(
      ph(1, { curwen_formula: 1, curwen_salts: 1, summon: 1, curwen_rise: 1, curwen_pyre: 3 }, { summons: ['reanimated_corpse'] }),
      ph(0.5, { curwen_fan: 2, curwen_lance: 1, summon: 1, curwen_rise: 1, curwen_vaults: 2, curwen_salts: 1, curwen_echo: 2 }, { summons: ['reanimated_corpse'] }),
      ph(0.2, { curwen_lance: 2, curwen_fan: 1, curwen_invocation: 1, curwen_scythe: 2, curwen_pyre: 2 }, { hooks: ['camera_warp'] }),
    ), { range: [5, 11], strafe: 0.4 }),
    stats: st(2200, 180, 68, 3.4, 2, 8), drops: { echoes: 4000 }, insightOnSight: 2,
  },
  {
    id: 'simon_orne', name: 'Simon Orne', source: 'The Case of Charles Dexter Ward', regions: ['providence'], canonLooks: true,
    sprite: { silhouette: 'humanoid', palette: 'charcoal', scale: 2.1, eyes: 2, gear: ['brim', 'coat'] },
    ...scripted('caster', phases(ph(1, { orne_salts: 2, orne_thrust: 1, summon: 1, orne_riposte: 1 }, { summons: ['reanimated_corpse'] }), ph(0.4, { orne_fan: 2, orne_thrust: 1, orne_vanish: 1, orne_circle: 1, orne_flasks: 1 }))),
    stats: st(1700, 140, 33, 3.4, 1.5, 6), drops: { echoes: 1600 }, insightOnSight: 1,
  },
  {
    id: 'edward_hutchinson', name: 'Edward Hutchinson', source: 'The Case of Charles Dexter Ward', regions: ['providence'], canonLooks: true,
    sprite: { silhouette: 'robed', palette: 'charcoal', scale: 2.2, eyes: 2, gear: ['cowl'] },
    ...scripted('caster', phases(ph(1, { hutchinson_bolt: 2, hutchinson_bat: 1, summon: 1, hutchinson_castle: 1 }, { summons: ['reanimated_corpse'] }), ph(0.4, { hutchinson_fan: 1, hutchinson_ray: 1, hutchinson_bat: 2, hutchinson_arc: 1 }))),
    stats: st(1700, 140, 50, 3.4, 1.5, 6), drops: { echoes: 1600 }, insightOnSight: 1,
  },
  {
    id: 'curwen_pit_thing', name: "Thing in Curwen's Pits", source: 'The Case of Charles Dexter Ward', regions: ['providence'], canonLooks: false,
    sprite: { silhouette: 'blob', palette: 'flesh', scale: 2.4, eyes: 3, tentacles: 3 },
    behavior: { archetype: 'stationary_horror', attacks: ['pit_reach', 'pit_thrash'] },
    stats: st(900, 120, 30, 0, 2.5, 8), drops: { echoes: 900 }, insightOnSight: 1,
  },
  {
    id: 'ephraim_waite', name: 'Ephraim Waite', source: 'The Thing on the Doorstep', regions: ['innsmouth', 'arkham'], canonLooks: true,
    sprite: { silhouette: 'humanoid', palette: 'sea', scale: 2, eyes: 2, gear: ['coat'] },
    ...scripted('mind_thief', phases(ph(1, { ephraim_stare: 1, ephraim_bolt: 1, ephraim_hold: 1, ephraim_knock: 2 }, { hooks: ['control_swap'] }), ph(0.5, { ephraim_stare: 1, ephraim_hold: 2, ephraim_glare: 1, ephraim_drawn: 1, ephraim_knock: 1 }, { hooks: ['control_swap', 'camera_warp'] }))),
    stats: st(800, 120, 31, 3.6, 2.5, 9), drops: { echoes: 1800 }, insightOnSight: 1,
    eldritchVariant: { sprite: { palette: 'mold' } },
  },
  {
    id: 'haunter_of_the_dark', name: 'The Haunter of the Dark', source: 'The Haunter of the Dark', regions: ['providence'], canonLooks: true,
    sprite: { silhouette: 'winged', palette: 'rubber', scale: 4, eyes: 3, wings: 2, glow: 'magenta' },
    ...scripted('boss', phases(ph(1, { haunter_stoop: 2, haunter_talon: 1, haunter_snuff: 1, haunter_storm: 1 }, { hooks: ['light_dependency'], arena: 'lamps' }), ph(0.5, { haunter_stoop: 2, haunter_talon: 1, haunter_snuff: 2, haunter_wingbeat: 1, haunter_eclipse: 1 }, { hooks: ['light_dependency'] })), { hover: 2 }),
    stats: st(1050, 260, 40, 4.6, 4, 10), weak: ['light'], drops: { echoes: 4000 }, insightOnSight: 2,
  },
  {
    id: 'whisperer', name: "The Whisperer in Akeley's Chair", source: 'The Whisperer in Darkness', regions: ['vermont'], canonLooks: true,
    sprite: { silhouette: 'humanoid', palette: 'pallid', scale: 2, eyes: 2 },
    ...scripted('boss', phases(ph(1, { whisperer_buzz: 2, whisperer_needle: 1, summon: 1, whisperer_scan: 1 }, { summons: ['mi_go'] }), ph(0.5, { whisperer_buzz: 2, whisperer_cylinders: 1, summon: 1, whisperer_wires: 1 }, { summons: ['mi_go'], hooks: ['darkness'] })), { mobile: false, range: [0, 30] }),
    stats: st(2950, 200, 79, 1.5, 3, 10), drops: { echoes: 3500 }, insightOnSight: 2,
    eldritchVariant: { sprite: { silhouette: 'crustacean', palette: 'fungus', wings: 2 } },
  },
  {
    id: 'the_hound', name: 'The Hound', source: 'The Hound', regions: ['arkham'], canonLooks: false, voice: 'bay',
    sprite: { silhouette: 'quadruped', palette: 'bone', scale: 2.4, eyes: 2, wings: 2, glow: 'green' },
    ...scripted('pack_hunter', phases(ph(1, { hound_snap: 2, hound_pounce: 1, hound_wings: 1, hound_maul: 1 }), ph(0.4, { hound_snap: 2, hound_pounce: 2, hound_wings: 1, hound_bay: 1, hound_maul: 2 }))),
    stats: st(1450, 140, 33, 5.4, 2, 8), drops: { echoes: 1500 }, insightOnSight: 1,
  },
  {
    id: 'the_unnamable', name: 'The Unnamable', source: 'The Unnamable', regions: ['arkham'], canonLooks: false,
    sprite: { silhouette: 'blob', palette: 'rubber', scale: 3.2, eyes: 6, tentacles: 5 },
    ...scripted('invisible_stalker', phases(ph(1, { unnamable_engulf: 2, unnamable_lash: 1, unnamable_shriek: 1, unnamable_boards: 1 }), ph(0.5, { unnamable_engulf: 1, unnamable_lash: 2, unnamable_shriek: 1, unnamable_rush: 1, unnamable_maw: 1 }, { hooks: ['camera_warp'] }))),
    stats: st(2000, 160, 39, 4, 4, 12), drops: { echoes: 1800 }, insightOnSight: 2,
  },
  {
    id: 'shunned_house_entity', name: 'The Shunned House Entity', source: 'The Shunned House', regions: ['providence'], canonLooks: true,
    sprite: { silhouette: 'blob', palette: 'fungus', scale: 3, eyes: 1, glow: 'green', body: [0.5625, 0.28] }, // 1.6875 m at its tallest idle breath; keep the established 0.84 m radius (round 56)
    ...scripted('stationary_horror', phases(ph(1, { shunned_mould: 2, shunned_nitre: 1, shunned_elbow: 1, shunned_vapour: 1 }), ph(0.5, { shunned_nitre: 2, shunned_mould: 2, shunned_elbow: 1, shunned_vapour: 1, shunned_fungus: 1, shunned_tremor: 1 }, { hooks: ['darkness'] }))),
    stats: st(1950, 300, 50, 0, 3, 8), weak: ['fire'], drops: { echoes: 1600 }, insightOnSight: 1,
  },
  {
    id: 'lilith', name: 'Lilith', source: 'The Horror at Red Hook', regions: ['providence'], canonLooks: true,
    sprite: { silhouette: 'humanoid', palette: 'bone', scale: 2.1, eyes: 2, glow: 'magenta', gear: ['horns'], body: [0.9, 0.14] }, // 0.29, a slender woman (round 56)
    ...scripted('caster', phases(ph(1, { lilith_embrace: 1, lilith_curse: 2, summon: 1, lilith_talons: 1 }, { summons: ['cthulhu_cultist'] }), ph(0.5, { lilith_hymn: 2, lilith_embrace: 1, summon: 1, lilith_step: 1, lilith_rite: 1, lilith_waters: 1 }, { summons: ['cthulhu_cultist'] }))),
    stats: st(1900, 160, 42, 3.8, 3, 9), drops: { echoes: 2200 }, insightOnSight: 2,
  },
  {
    id: 'zann_window_thing', name: "The Thing Beyond Erich Zann's Window", source: 'The Music of Erich Zann', regions: ['beyond'], canonLooks: false, voice: 'viol',
    sprite: { silhouette: 'orb', palette: 'charcoal', scale: 4, eyes: 0, tentacles: 4, glow: 'purple' },
    ...scripted('stationary_horror', phases(ph(1, { zann_gale: 2, zann_blackout: 1, zann_shriek: 1, zann_notes: 2 }, { hooks: ['darkness'] }), ph(0.5, { zann_gale: 2, zann_shriek: 2, zann_music: 1, zann_frenzy: 1, zann_notes: 1, zann_bow: 1 }, { hooks: ['darkness', 'camera_warp'] }))),
    stats: st(4750, 1000, 97, 0, 4, 12), resist: ['slash', 'blunt', 'shot'], drops: { echoes: 2000 }, insightOnSight: 2, // (round 83: damage 64 to 69: the last band's blows are as they were, and its pauses cost him 0.02 lives under the 0.2 floor)
  },
  {
    id: 'voice_in_the_tomb', name: 'The Voice in the Tomb', source: __DEMO__ ? 'A Statement from Arkham' : 'The Statement of Randolph Carter', regions: ['arkham'], canonLooks: false, voice: 'whisper',
    sprite: { silhouette: 'spectre', palette: 'charcoal', scale: 2.6, eyes: 0 },
    behavior: { archetype: 'stationary_horror', attacks: ['tomb_voice', 'tomb_hand'] },
    stats: st(1000, 1000, 26, 0, 3, 10), drops: { echoes: 1000 }, insightOnSight: 1,
  },
  {
    id: 'high_priest', name: 'High Priest Not to Be Described', source: 'The Dream-Quest of Unknown Kadath', regions: ['dreamlands'], canonLooks: true,
    sprite: { silhouette: 'robed', palette: 'sand', scale: 2.4, eyes: 0, gear: ['mask'] },
    ...scripted('boss', phases(
      ph(1, { priest_flute: 2, priest_veil: 1, summon: 1, priest_mask: 1, priest_monastery: 1 }, { summons: ['man_of_leng'] }),
      ph(0.5, { priest_mask: 2, priest_fan: 1, priest_veil: 1, summon: 1, priest_incense: 1 }, { summons: ['man_of_leng'], hooks: ['camera_warp'], eldritch: true }),
      ph(0.2, { priest_lamp: 2, priest_mask: 2, priest_veil: 1, priest_sweep: 2, priest_void: 1 }, { hooks: ['darkness'], eldritch: true }),
    ), { range: [5, 12], strafe: 0.3 }),
    stats: st(4700, 220, 73, 3, 3, 10), drops: { echoes: 3500 }, insightOnSight: 2,
    eldritchVariant: { sprite: { silhouette: 'blob', tentacles: 6, body: [0.7, 0.23] } }, // its true form stands as tall as a blob does and half as wide: a metre of air either side of the drawn body (round 56)
  },
  {
    id: 'colossus_pyramids', name: 'The Colossus Beneath the Pyramids', source: 'Under the Pyramids', regions: ['pnakotus'], canonLooks: true,
    assembly: { body: 'lathe', palette: 'sand', scale: 14, tentacles: 5, eyes: 10 },
    ...scripted('boss', phases(ph(1, { colossus_paw: 2, colossus_grasp: 1, colossus_lumber: 1, colossus_sands: 1, colossus_hammer: 1 }), ph(0.5, { colossus_paw: 2, colossus_jaws: 2, colossus_lumber: 1, colossus_heave: 1, colossus_sands: 2, colossus_dunes: 1, colossus_columns: 1 }, { hooks: ['darkness'] }))),
    stats: st(3950, 600, 51, 2.4, 4, 10), drops: { echoes: 5000 }, insightOnSight: 2, // (round 97: health 3300 to 3950, its highest in the tables)
  },
  {
    id: 'martins_beach_horror', name: "The Horror at Martin's Beach", source: "The Horror at Martin's Beach", regions: ['innsmouth'], canonLooks: true,
    sprite: { silhouette: 'serpent', palette: 'sea', scale: 7, eyes: 2, body: [0.734375, 0.25] }, // the head and neck rise 5.1 m out of the coils, not a serpent's 3.5 m (round 57)
    ...scripted('mind_thief', phases(ph(1, { martin_eye: 2, martin_rope: 1, martin_coils: 1, martin_undertow: 1 }, { hooks: ['flood'] }), ph(0.5, { martin_eye: 2, martin_rope: 1, martin_spray: 1, martin_breaker: 1, martin_undertow: 1 }, { hooks: ['flood', 'camera_warp'] }))),
    stats: st(3400, 400, 63, 2, 3, 10), drops: { echoes: 3000 }, insightOnSight: 2, // (round 83: health 1450 to 1850, for the same reason as the Black Man's)
  },
  {
    id: 'dr_munoz', name: 'Dr. Muñoz', source: 'Cool Air', regions: ['hub'], canonLooks: true,
    sprite: { silhouette: 'humanoid', palette: 'pallid', scale: 2, eyes: 2, gear: ['coat', 'pipes'] },
    ...scripted('caster', phases(ph(1, { munoz_chill: 2, munoz_clasp: 1, munoz_scalpel: 1 }), ph(0.5, { munoz_clasp: 2, munoz_ammonia: 1, munoz_chill: 1, munoz_thaw: 1 }))),
    stats: st(500, 80, 15, 2.6, 2, 6), weak: ['fire'], drops: { echoes: 800 }, insightOnSight: 1, // (round 97: health 550 to 600, a buff: the bot took 0.36 lives of him, under the early horrors' 0.4)
  },
  {
    id: 'charles_le_sorcier', name: 'Charles le Sorcier', source: 'The Alchemist', regions: ['hub'], canonLooks: true,
    sprite: { silhouette: 'robed', palette: 'charcoal', scale: 2.1, eyes: 2, glow: 'magenta', gear: ['cowl', 'staff'] },
    ...scripted('caster', phases(ph(1, { charles_vial: 2, charles_vanish: 1, charles_staff: 1 }), ph(0.5, { charles_vials: 2, charles_vanish: 1, charles_elixir: 1, charles_torches: 1, charles_brand: 1 }))),
    stats: st(550, 120, 21, 3.4, 2, 7), drops: { echoes: 1400 }, insightOnSight: 1, // 690 to 699 keeps the ten-second cap fight after the progression rebalance, below Brown Jenkin in meet order
  },
  {
    id: 'medusa_gorgon', name: "The Gorgon of Medusa's Coil", source: "Medusa's Coil", regions: ['dunwich'], canonLooks: true,
    sprite: { silhouette: 'humanoid', palette: 'charcoal', scale: 2.1, eyes: 2, tentacles: 10 },
    ...scripted('mind_thief', phases(ph(1, { gorgon_coil: 1, gorgon_glance: 1, gorgon_strike: 2, gorgon_dance: 1 }), ph(0.5, { gorgon_glance: 1, gorgon_coil: 2, gorgon_tresses: 1, gorgon_portrait: 1, gorgon_dance: 1 }))),
    stats: st(1600, 160, 53, 4, 3, 10), drops: { echoes: 2400 }, insightOnSight: 2, // (round 97: health 1200 to 1600, a buff: the bot took 0.38 lives of her, under the early horrors' 0.4)
  },
  {
    id: 'hypnos', name: 'Hypnos', source: 'Hypnos', regions: ['dreamlands'], canonLooks: true,
    sprite: { silhouette: 'humanoid', palette: 'bone', scale: 2.3, eyes: 2, glow: 'purple', gear: ['halo'] },
    ...scripted('mind_thief', phases(ph(1, { hypnos_eyes: 1, hypnos_drift: 1, hypnos_slumber: 1, hypnos_crown: 1, hypnos_hours: 1 }, { hooks: ['time_skip'] }), ph(0.5, { hypnos_eyes: 1, hypnos_ray: 1, hypnos_drift: 1, hypnos_circle: 1, hypnos_abyss: 2 }, { hooks: ['time_skip', 'camera_warp'] }))),
    stats: st(3450, 140, 68, 3.4, 3, 10), drops: { echoes: 2000 }, insightOnSight: 2, // (round 83: health 1300 to 1900 and damage 48 to 60, as far as his vortex may go: with his skips no longer taking the time from a person he fell in 23 seconds and cost 0.13 lives, where he had cost 0.30)
  },
  {
    id: 'the_outsider', name: 'The Outsider', source: 'The Outsider', regions: ['hub'], canonLooks: true,
    sprite: { silhouette: 'humanoid', palette: 'mold', scale: 2, eyes: 2, gear: ['tatters'] },
    ...scripted('brute', phases(ph(1, { outsider_clutch: 1, outsider_rake: 2, outsider_shriek: 1, outsider_topple: 1, outsider_maul: 1 }), ph(0.4, { outsider_clutch: 2, outsider_rake: 1, outsider_stumble: 1, outsider_shriek: 1, outsider_maul: 1, outsider_flags: 1 }))),
    stats: st(950, 120, 31, 3, 3, 10), drops: { echoes: 1200 }, insightOnSight: 1,
  },
  {
    id: 'terrible_old_man', name: 'The Terrible Old Man', source: 'The Terrible Old Man', regions: ['providence'], canonLooks: true,
    sprite: { silhouette: 'humanoid', palette: 'bone', scale: 1.8, eyes: 2, gear: ['brim', 'beard', 'cane'] },
    ...scripted('caster', phases(ph(1, { summon: 2, oldman_bottle: 1, oldman_cutlass: 1 }, { summons: ['moon_bog_wraith'] }), ph(0.5, { summon: 1, oldman_pendulums: 1, oldman_fog: 1, oldman_shipmates: 1 }, { summons: ['moon_bog_wraith'] }))),
    stats: st(1500, 80, 45, 2.4, 1.5, 6), drops: { echoes: 1500 }, insightOnSight: 1, // (round 97: health 1150 to 1850, a buff: the bot took 0.25 lives of him, the least of any early horror)
  },
  {
    id: 'zkauba', name: 'Zkauba the Wizard', source: 'Through the Gates of the Silver Key', regions: ['beyond'], canonLooks: true,
    sprite: { silhouette: 'hunched', palette: 'stone', scale: 2.6, eyes: 2, glow: 'purple', gear: ['staff'], body: [0.703125, 0.22] }, // 1.83 m to the crown, not a hunched figure's 2.2 (round 57)
    ...scripted('caster', phases(ph(1, { zkauba_spell: 2, zkauba_rays: 1, zkauba_clock: 1, zkauba_prism: 1 }), ph(0.5, { zkauba_rays: 2, zkauba_fan: 1, zkauba_clock: 1, zkauba_sweep: 1, zkauba_suns: 1 }, { hooks: ['arena_reconnect'] }))),
    stats: st(4150, 160, 84, 3.4, 2.5, 9), drops: { echoes: 2200 }, insightOnSight: 2, // (round 97: health 2250 to 2850, its highest in the tables)
  },
]);
