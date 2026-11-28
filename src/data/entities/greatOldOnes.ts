/**
 * Great Old Ones (spec §4): region bosses; colossi are primitive assemblies. Each fights by a phase
 * script (spec §3E) of its own blows (data/bossMovesDeep.ts and its kin, built on the shared attack library) and reality hooks. Cthulhu cannot be
 * killed and Hastur must be called by name (signature mechanics, systems/signatures/); Ghatanothoa's
 * petrifying gaze drives the investigator behind its arena's monoliths.
 */

import { ph, phases, scripted, st, tier } from './kit';

export const GREAT_OLD_ONES = tier('great_old_one', [
  {
    id: 'cthulhu', name: 'Cthulhu', source: 'The Call of Cthulhu', regions: ['rlyeh'], canonLooks: true,
    assembly: { body: 'lathe', palette: 'sea', scale: 40, tentacles: 8, wings: 2, eyes: 2, visualBoost: [1.14, 1.12] },
    ...scripted('boss', phases(
      ph(1, { cthulhu_feelers: 3, cthulhu_claw: 2, cthulhu_seize: 1, cthulhu_call: 1, cthulhu_surge: 1, cthulhu_fall: 1 }, { hooks: ['camera_warp'] }),
      ph(0.66, { cthulhu_feelers: 2, cthulhu_claw: 2, cthulhu_wings: 2, cthulhu_call: 1, cthulhu_surge: 1, cthulhu_rise: 2, cthulhu_fall: 1 }, { summons: ['star_spawn', 'star_spawn'], hooks: ['camera_warp', 'flood'] }),
      ph(0.33, { cthulhu_claw: 1, cthulhu_feelers: 2, cthulhu_seize: 1, cthulhu_wings: 1, cthulhu_call: 2, cthulhu_rise: 1, cthulhu_drown: 1, cthulhu_surge: 1, cthulhu_fall: 1 }, { hooks: ['flood', 'camera_warp'], arena: 'ship' }),
    )),
    stats: st(6050, 5000, 31, 2, 10, 20), drops: { echoes: 30000 }, insightOnSight: 4, // (round 97: health 4650 to 5350, its highest in the tables) (round 25: health 6700 and damage 120; the balance table had it at 188 s and 9.3 lives) (round 60: health 4300 and damage 35, no blow over 16% of a person's health where they meet it; a crushing blow restored, held a second)
  },
  {
    id: 'father_dagon', name: 'Father Dagon', source: 'Dagon', regions: ['innsmouth'], canonLooks: true,
    assembly: { body: 'lathe', palette: 'sea', scale: 11, eyes: 2, tentacles: 0 },
    // Both sea gods share the temple: keep the flood and their own attacks, with no darkness
    // hiding Hydra's ground cues and no extra servants crowding the two-boss fight.
    ...scripted('boss', phases(ph(1, { dagon_monolith: 2, dagon_arms: 2, dagon_wake: 1, dagon_tide: 1 }, { hooks: ['flood'] }), ph(0.5, { dagon_monolith: 2, dagon_arms: 1, dagon_bellow: 1, dagon_wade: 1, dagon_breach: 1, dagon_tide: 1 }, { hooks: ['flood'] }))),
    stats: st(2550, 1200, 35, 2.6, 6, 12), drops: { echoes: 12000 }, insightOnSight: 3, // balanced with Hydra as one encounter, rather than two full solo god fights
  },
  {
    id: 'mother_hydra', name: 'Mother Hydra', source: 'The Shadow over Innsmouth', regions: ['innsmouth'], canonLooks: false,
    assembly: { body: 'lathe', palette: 'sea', scale: 10.5, eyes: 4, tentacles: 6 },
    ...scripted('boss', phases(ph(1, { hydra_clasp: 2, hydra_brine: 1, hydra_heads: 2, hydra_spawn: 1 }, { hooks: ['flood'] }), ph(0.5, { hydra_heads: 1, hydra_spawn: 1, hydra_brine: 2, hydra_clasp: 1, hydra_spit: 1, hydra_depths: 1 }, { hooks: ['flood'] }))),
    stats: st(2450, 1100, 38, 2.6, 6, 12), drops: { echoes: 12000 }, insightOnSight: 3, // the pair retains 5000 authored health and its separate tides and tentacles
  },
  {
    id: 'hastur', name: 'Hastur', source: 'The Whisperer in Darkness', regions: ['yuggoth'], canonLooks: false, voice: 'whisper',
    sprite: { silhouette: 'spectre', palette: 'sand', scale: 8, eyes: 0, tentacles: 6 },
    ...scripted('boss', { ...phases(
      ph(1, { hastur_name: 2, hastur_tatters: 1, hastur_sign: 2, hastur_hali: 1 }, { hooks: ['camera_warp'] }),
      ph(0.5, { hastur_mask: 1, hastur_tatters: 2, hastur_sign: 2, hastur_carcosa: 1, hastur_king: 1 }, { hooks: ['camera_warp', 'darkness'] }),
      ph(0.2, { hastur_name: 2, hastur_sign: 2, hastur_star: 1, hastur_stride: 1, hastur_carcosa: 1, hastur_hali: 1 }, { hooks: ['camera_warp', 'darkness', 'time_skip'] }),
    ), called: true }),
    stats: st(7200, 2000, 78, 3, 8, 16), drops: { echoes: 20000 }, insightOnSight: 4, // (round 60: damage 90, which cost the balance bot 1.19 lives where a person first meets it)
  },
  {
    id: 'tsathoggua', name: 'Tsathoggua', source: 'The Mound', regions: ['kn_yan'], canonLooks: true,
    sprite: { silhouette: 'toad', palette: 'charcoal', scale: 6, eyes: 2 },
    ...scripted('boss', phases(
      ph(1, { tsath_tongue: 2, tsath_belly: 1, tsath_slime: 1, tsath_miasma: 1, tsath_slumber: 1 }),
      ph(0.5, { tsath_slime: 2, tsath_ooze: 2, tsath_tongue: 1, tsath_miasma: 1, tsath_slumber: 1 }, { summons: ['formless_spawn', 'formless_spawn'], hooks: ['darkness'] }),
      ph(0.2, { tsath_belly: 2, tsath_tongue: 2, tsath_yawn: 1, tsath_wave: 1, tsath_gulp: 1, tsath_slumber: 1 }, { hooks: ['darkness'] }),
    )),
    stats: st(4350, 1500, 36, 1.8, 6, 12), drops: { echoes: 12000 }, insightOnSight: 3, // (round 25: damage was 70; the balance table had it at 3.3 lives) (round 60: damage 52, which cost the balance bot 1.36 lives where a person first meets it; then health 3250 and damage 30, no blow over 14% of a person's health, and a crushing blow given it)
  },
  {
    id: 'ghatanothoa', name: 'Ghatanothoa', source: 'Out of the Aeons', regions: ['rlyeh'], canonLooks: true,
    assembly: { body: 'lathe', palette: 'charcoal', scale: 20, tentacles: 8, eyes: 4 },
    ...scripted('boss', phases(
      ph(1, { ghatan_stare: 2, ghatan_tentacles: 2, ghatan_crush: 1, ghatan_tremor: 1, ghatan_lava: 1 }, { hooks: ['petrify_buildup'], arena: 'monoliths' }),
      ph(0.5, { ghatan_stare: 2, ghatan_tentacles: 1, ghatan_rise: 1, ghatan_crush: 1, ghatan_roar: 1, ghatan_lava: 1, ghatan_vents: 1 }, { hooks: ['petrify_buildup', 'camera_warp'] }),
    )),
    stats: st(6050, 3000, 52, 1.5, 9, 18), drops: { echoes: 20000 }, insightOnSight: 4, // (round 97: health 3600 to 4850, its highest in the tables) (round 60: damage 90, which cost the balance bot 1.29 lives where a person first meets it)
  },
  {
    id: 'rhan_tegoth', name: 'Rhan-Tegoth', source: 'The Horror in the Museum', regions: ['yuggoth'], canonLooks: true,
    sprite: { silhouette: 'toad', palette: 'bone', scale: 5, eyes: 3, limbs: 6, body: [0.6, 0.3] }, // as wide as its crouch is drawn, not a toad's 1.8 m (round 56)
    ...scripted('boss', phases(ph(1, { rhan_suckers: 2, rhan_proboscis: 2, rhan_claws: 1, rhan_feast: 1 }), ph(0.5, { rhan_suckers: 2, rhan_proboscis: 1, rhan_throne: 1, rhan_hum: 1, rhan_stomp: 1 }, { hooks: ['camera_warp'] }))),
    stats: st(5100, 1000, 73, 3, 5, 12), drops: { echoes: 9000 }, insightOnSight: 3,
  },
  {
    id: 'yig', name: 'Yig', source: 'The Curse of Yig', regions: ['kn_yan'], canonLooks: false,
    sprite: { silhouette: 'serpent', palette: 'sand', scale: 6, eyes: 2, body: [0.75, 0.25] }, // 4.5 m painted idle height, with its established 1.5 m radius
    ...scripted('boss', phases(ph(1, { yig_fangs: 2, yig_strike: 2, yig_venom: 1, yig_coils: 1 }), ph(0.5, { yig_fangs: 2, yig_strike: 1, summon: 1, yig_venom: 1, yig_slither: 1, yig_rattle: 1 }, { summons: ['child_of_yig'] }))),
    stats: st(4300, 1200, 63, 4, 5, 12), drops: { echoes: 10000 }, insightOnSight: 3, // (round 60: damage 70, which cost the balance bot 1.12 lives where a person first meets it)
  },
  {
    id: 'bokrug', name: 'Bokrug', source: 'The Doom that Came to Sarnath', regions: ['dreamlands'], canonLooks: false,
    sprite: { silhouette: 'quadruped', palette: 'sea', scale: 9, eyes: 2 },
    // round 46: too hard in almost every way. Its first phase has no flood (the drag on the feet); its second keeps the flood alone, with no
    // summoning and no camera warp (the view swaying over its charges). Health, damage and the sanity it drains come down into the band of
    // Rhan-Tegoth and Nug.
    ...scripted('boss', phases(ph(1, { bokrug_jaws: 2, bokrug_lunge: 1, bokrug_mire: 1, bokrug_flood: 1 }), ph(0.5, { bokrug_lunge: 1, bokrug_jaws: 2, bokrug_flood: 1, bokrug_doom: 1 }, { hooks: ['flood'] }))),
    stats: st(4550, 1400, 73, 3, 5, 8), drops: { echoes: 12000 }, insightOnSight: 3,
  },
  {
    id: 'nug', name: 'Nug', source: 'The Mound', regions: ['kn_yan'], canonLooks: false,
    sprite: { silhouette: 'blob', palette: 'pallid', scale: 7, eyes: 3, body: [0.83, 0.28] }, // drawn again in round 92: a hulking form 5.8 m high and 4 m across (the heap it was stood 3.3 m), struck as high as its crown and 2.0 m either side of its middle (a blob's capsule is 4.9 m by 2.5), its blows still scaled by a blob's 4.9 m
    ...scripted('boss', phases(ph(1, { nug_maw: 2, nug_pound: 2, nug_drone: 1, nug_rumble: 1 }), ph(0.5, { nug_pound: 2, nug_roll: 1, nug_drone: 1, nug_burst: 1, nug_boils: 1 }, { hooks: ['darkness'] }))),
    stats: st(4500, 1100, 65, 2.4, 5, 12), drops: { echoes: 9000 }, insightOnSight: 3,
  },
  {
    id: 'yeb', name: 'Yeb', source: 'The Mound', regions: ['kn_yan'], canonLooks: false,
    sprite: { silhouette: 'blob', palette: 'charcoal', scale: 7, eyes: 1, tentacles: 6, body: [0.78, 0.24] }, // drawn again in round 92: a narrow form on long legs, 5.5 m high and 3.4 m across, struck as high as its crest and 1.7 m either side of its middle (a blob's capsule is 4.9 m by 2.5), its blows still scaled by a blob's 4.9 m
    ...scripted('boss', phases(ph(1, { yeb_tendrils: 2, yeb_ichor: 2, yeb_veil: 1, yeb_flames: 1 }), ph(0.5, { yeb_tendrils: 2, yeb_bog: 1, yeb_flames: 1, yeb_ichor: 1, yeb_embers: 1 }, { hooks: ['darkness'] }))),
    stats: st(4200, 1100, 84, 2.4, 5, 12), drops: { echoes: 9000 }, insightOnSight: 3,
  },
  {
    id: 'great_ones', name: 'The Great Ones', source: 'The Dream-Quest of Unknown Kadath', regions: ['dreamlands'], canonLooks: true,
    sprite: { silhouette: 'giant', palette: 'stone', scale: 5, eyes: 2, limbs: 2, body: [0.84375, 0.12] }, // a tall slim figure, 0.6 across, not a giant's 1.0 (round 56), struck no higher than the crown is drawn: 4.2 m (round 57)
    ...scripted('boss', phases(ph(1, { greatones_stamp: 2, greatones_reap: 2, greatones_cloud: 1, greatones_dance: 1 }), ph(0.5, { greatones_stamp: 2, greatones_reap: 1, greatones_cloud: 1, greatones_stars: 1, greatones_glance: 1 }, { hooks: ['hidden_platforms'] }))),
    stats: st(4650, 1200, 68, 3.4, 4, 10), drops: { echoes: 10000 }, insightOnSight: 3, // (round 60: damage 70, which cost the balance bot 1.00 lives where a person first meets it)
  },
]);
