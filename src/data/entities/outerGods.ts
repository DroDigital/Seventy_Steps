/**
 * Outer Gods (spec §4): the court of Azathoth and the powers beyond the Gate. Each fights by a phase
 * script (spec §3E); the region's four have signature mechanics (systems/signatures/): Shub-Niggurath's
 * spawning roots, Yog-Sothoth's sphere gates, Nyarlathotep's avatars and borrowed movesets, and
 * blind Azathoth, whose blows are rhythms over the court and who answers a noise. 'Umr at-Tawil yields, offering one of the endings.
 */

import { ph, phases, scripted, st, tier } from './kit';

export const OUTER_GODS = tier('outer_god', [
  {
    id: 'azathoth', name: 'Azathoth', source: 'The Dream-Quest of Unknown Kadath', regions: ['court_centre'], canonLooks: false, voice: 'pipes',
    assembly: { body: 'mound', palette: 'charcoal', scale: 30, tentacles: 12, eyes: 0, glow: 'purple' },
    ...scripted('boss', phases(
      // Blind, it lays its rays, rifts and rhythms across the court rather than tracking the investigator. It answers loud sounds; the court deteriorates while the fight lasts.
      ph(1, { blind_rays: 3, rift_tentacles: 3, dirge: 2, dance: 1, drumbeat: 1 }),
      ph(0.72, { blind_rays: 2, rift_tentacles: 2, dance: 2, dirge: 1, seethe: 1, miasma: 1 }, { hooks: ['darkness'] }),
      ph(0.45, { chaos_rays: 3, rift_cascade: 2, dance: 2, seethe: 1, maelstrom: 2, miasma: 1 }, { hooks: ['darkness', 'camera_warp'] }),
      ph(0.2, { blind_rays: 1, chaos_rays: 3, rift_cascade: 3, dance: 2, maelstrom: 2, crescendo: 2, miasma: 1 }, { hooks: ['darkness', 'camera_warp', 'arena_reconnect'] }),
    ), { mobile: false, range: [0, 60], aggro: 0, fov: 0, cooldown: [60, 110] }),
    stats: st(15075, 5000, 56, 0.5, 10, 5), drops: { echoes: 50000 }, insightOnSight: 5, // health increased 50% from 10050; damage remains 56
  },
  {
    id: 'daemon_pipers', name: 'The Daemon Pipers', source: 'The Dream-Quest of Unknown Kadath', regions: ['piping_dark'], canonLooks: false, voice: 'pipes',
    sprite: { silhouette: 'spectre', palette: 'charcoal', scale: 2.8, eyes: 0, glow: 'purple' },
    ...scripted('caster', phases(ph(1, { pipers_drone: 2, pipers_phrase: 1, pipers_whirl: 1 }), ph(0.5, { pipers_drone: 1, pipers_chord: 2, pipers_hush: 1, pipers_whirl: 1, pipers_echo: 1 }, { hooks: ['camera_warp'] }))),
    stats: st(3900, 300, 89, 2, 6, 14), drops: { echoes: 4000 }, insightOnSight: 4, // (round 97: health 3200 to 3900, its highest in the tables)
  },
  {
    id: 'other_gods', name: 'The Other Gods', source: 'The Other Gods', regions: ['cloud_summit'], canonLooks: false,
    sprite: { silhouette: 'spectre', palette: 'pallid', scale: 6, eyes: 0, tentacles: 4, glow: 'magenta' },
    ...scripted('brute', phases(ph(1, { othergods_smite: 2, othergods_scream: 1, othergods_eclipse: 1, othergods_tremor: 1 }), ph(0.5, { othergods_smite: 2, othergods_fall: 1, othergods_eclipse: 1, othergods_scream: 1, othergods_tremor: 1, othergods_spokes: 1 }, { hooks: ['darkness'] }))),
    stats: st(4600, 800, 60, 2.6, 7, 16), drops: { echoes: 6000 }, insightOnSight: 4, // (round 97: health 3250 to 3700, its highest in the tables)
  },
  {
    id: 'yog_sothoth', name: 'Yog-Sothoth', source: 'The Dunwich Horror', regions: ['spheres'], canonLooks: true,
    assembly: {
      body: 'spheres', palette: 'pallid', scale: 20, spheres: 14, glow: 'green',
      hit: [[0.01, 0.718, 0.092], [-0.184, 0.544, 0.175], [0.199, 0.544, 0.165], [0.01, 0.398, 0.218], [-0.262, 0.223, 0.18], [0.248, 0.228, 0.184], [0, 0.107, 0.107]], // fitted to the front view's painted spheres: across from the picture's middle, up from the physical sphere cluster's foot, which the renderer grounds through REVIEWED_GROUND
    },
    ...scripted('boss', phases(
      ph(1, { yog_ray: 2, yog_gate: 1, yog_spheres: 1, yog_quarters: 1, yog_storm: 1, yog_keeper: 1 }, { hooks: ['arena_reconnect'], arena: 'spheres' }),
      ph(0.6, { yog_ray: 2, yog_volley: 1, yog_gate: 1, summon: 1, yog_iris_sweep: 1, yog_globes: 1, yog_keeper: 1 }, { summons: ['dhole'], hooks: ['arena_reconnect', 'camera_warp'] }),
      ph(0.25, { yog_ray: 3, yog_starfall: 1, yog_gate: 1, yog_iris_sweep: 2, yog_maw: 1, yog_keeper: 1 }, { hooks: ['arena_reconnect', 'camera_warp', 'time_skip'] }),
    ), { mobile: false, range: [0, 40], cooldown: [120, 180] }),
    stats: st(6100, 5000, 31, 1, 10, 25), drops: { echoes: 40000 }, insightOnSight: 5, // (round 97: health 2700 to 6100, its highest in the tables) (round 25: damage was 120; the balance table had it at 7.6 lives) (round 60: health 6100 and damage 62, which cost the balance bot 2.56 lives where a person first meets it; then 4400 and 38, no blow over 15% of a person's health: a crushing blow on any who stand at its edge)
  },
  {
    id: 'umr_at_tawil', name: "'Umr at-Tawil", source: 'Through the Gates of the Silver Key', regions: ['beyond'], canonLooks: true,
    sprite: { silhouette: 'robed', palette: 'charcoal', scale: 4, eyes: 0, glow: 'purple', gear: ['cowl', 'staff'] },
    ...scripted('boss', phases(
      ph(1, { umr_veil: 2, umr_step: 1, umr_light: 1, umr_arch: 1 }, { hooks: ['time_skip'] }),
      ph(0.6, { umr_veil: 2, umr_light: 2, umr_step: 1, summon: 1, umr_seals: 1 }, { summons: ['ancient_ones'], hooks: ['time_skip', 'hidden_platforms'] }),
      ph(0.25, { umr_yield: 1 }), // it yields
    ), { range: [4, 14] }),
    stats: st(5850, 2000, 84, 3, 8, 18), drops: { echoes: 25000 }, insightOnSight: 5, // (round 97: health 3650 to 3800, its highest in the tables)
  },
  {
    id: 'ancient_ones', name: 'The Ancient Ones', source: 'Through the Gates of the Silver Key', regions: ['pale_lattice'], canonLooks: true,
    sprite: { silhouette: 'robed', palette: 'pallid', scale: 3.2, eyes: 0, gear: ['cowl'] },
    ...scripted('stationary_horror', phases(ph(1, { ancients_regard: 2, ancients_chant: 1, ancients_arc: 1 }), ph(0.5, { ancients_regard: 2, ancients_chant: 1, ancients_pillar: 1, ancients_pedestals: 1 }, { hooks: ['time_skip'] }))),
    stats: st(5550, 1000, 84, 0, 6, 14), drops: { echoes: 5000 }, insightOnSight: 4, // (round 97: health 2850 to 4050, its highest in the tables)
  },
  {
    id: 'shub_niggurath', name: 'Shub-Niggurath', source: 'The Whisperer in Darkness', regions: ['black_wood'], canonLooks: false,
    assembly: { body: 'mound', palette: 'rubber', scale: 18, tentacles: 12, eyes: 8 },
    ...scripted('boss', phases(
      ph(1, { shub_ropes: 2, shub_stampede: 1, shub_birth: 1, summon: 1, shub_roots: 1, shub_musk: 1, shub_hoof: 1 }, { summons: ['thousand_young'], arena: 'roots' }),
      ph(0.5, { shub_ropes: 2, shub_birth: 2, shub_stampede: 1, summon: 1, shub_bleat: 1, shub_young: 1, shub_musk: 1, shub_womb: 1, shub_hoof: 1 }, { summons: ['thousand_young'], hooks: ['darkness'] }),
    )),
    stats: st(7650, 3000, 31, 1.2, 9, 20), drops: { echoes: 30000 }, insightOnSight: 5, // (round 97: health 3600 to 5450, its highest in the tables) (round 83: health 3100 to 3600, which the longer pauses after her blows had left 0.36 lives and 0.33 at the cap; round 73: damage 36 to 41: she is met in the Black Wood, the last ring, so a person at the cap has outgrown her less and the bot lost 0.35 lives of her at it, under the 0.4 floor; round 60: health 5450 and damage 100, which cost the balance bot 4.13 lives where a person first meets it; then 3800 and 34, no blow over 17% of a person's health, and a crushing blow given it)
  },
  {
    id: 'nyarlathotep', name: 'Nyarlathotep', source: 'Nyarlathotep', regions: ['court_centre'], canonLooks: true,
    sprite: { silhouette: 'humanoid', palette: 'sand', scale: 2.6, eyes: 2, glow: 'purple', gear: ['tall', 'coat', 'chain'] },
    ...scripted('boss', phases(
      ph(1, { nyar_instruments: 2, nyar_vanish: 1, summon: 1, nyar_glare: 1, nyar_sparks: 1, nyar_pharaoh: 1 }, { summons: ['night_gaunt'], hooks: ['decoys'] }),
      ph(0.6, { nyar_fan: 2, nyar_glare: 2, nyar_vanish: 1, nyar_eye: 1, nyar_screen: 1, nyar_dream: 1, nyar_pharaoh: 1 }, { hooks: ['decoys', 'camera_warp'] }),
      ph(0.3, { nyar_chaos: 2, nyar_grip: 1, nyar_howl: 1, nyar_maw: 1, nyar_stars: 1, nyar_fist: 1 }, { hooks: ['darkness', 'camera_warp'] }), // the Crawling Chaos: it borrows the slain bosses' attacks too
    ), { range: [3, 10], strafe: 0.4 }),
    stats: st(5150, 3000, 37, 3.4, 8, 20), drops: { echoes: 35000 }, insightOnSight: 5, // (round 97: health 4300 to 5150, its highest in the tables) (round 60: health 5150 and damage 100, which cost the balance bot 2.01 lives where a person first meets it; then damage 42, no blow over 18% of a person's health: a great mark from afar, a crushing blow in its last form)
    // its true form is drawn a lanky figure five metres tall, not a mass: struck at its legs' stance, its body and upper arms (1.2 m either side; the long hands hang out of it), up to its shoulders and neck; the curl over them is out of reach
    eldritchVariant: { name: 'Nyarlathotep, the Crawling Chaos', sprite: { silhouette: 'blob', palette: 'ichor', scale: 6, tentacles: 10, eyes: 1, body: [0.7, 0.2] } },
  },
]);
