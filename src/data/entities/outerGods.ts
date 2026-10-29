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
      // Blind: nothing it does is aimed at the investigator. The piping swells in rings of sound, the drums beat the ground to boils, the thirteen dance, the chaos seethes and the
      // centre draws all in: rhythms over the whole court, read by where they fall and when. What it does aim is an answer to a noise (signatures/azathoth.ts). 2026-10-29: it had
      // been an ordeal of silence, invulnerable, its health bar a song that drained; it is the hardest fight there is (the pauses shrink with each phase, the last hears everything).
      ph(1, { dirge: 3, drumbeat: 2, seethe: 2, roar: 1 }),
      ph(0.72, { dirge: 2, drumbeat: 2, dance: 3, seethe: 1, miasma: 1, roar: 1 }, { hooks: ['darkness'] }),
      ph(0.45, { dirge: 2, drumbeat: 2, dance: 2, seethe: 2, maelstrom: 3, miasma: 1, roar: 1 }, { hooks: ['darkness', 'camera_warp'] }),
      ph(0.2, { dirge: 3, drumbeat: 2, dance: 3, seethe: 2, maelstrom: 3, crescendo: 3, miasma: 1, roar: 1 }, { hooks: ['darkness', 'camera_warp', 'arena_reconnect'] }),
    ), { mobile: false, range: [0, 60], aggro: 0, fov: 0, cooldown: [60, 110] }),
    stats: st(6700, 5000, 56, 0.5, 10, 5), drops: { echoes: 50000 }, insightOnSight: 5, // (2026-10-29: damage 150 to 56, which the library's powers now multiply: its heaviest blow, the maelstrom's burst, is a quarter of a person's health where it is met)
  },
  {
    id: 'daemon_pipers', name: 'The Daemon Pipers', source: 'The Dream-Quest of Unknown Kadath', regions: ['piping_dark'], canonLooks: false, voice: 'pipes',
    sprite: { silhouette: 'spectre', palette: 'charcoal', scale: 2.8, eyes: 0, glow: 'purple' },
    ...scripted('caster', phases(ph(1, { roar: 2, projectile: 1, barrage: 1 }), ph(0.5, { roar: 1, projectile_fan: 2, darkness: 1, barrage: 2 }, { hooks: ['camera_warp'] }))),
    stats: st(3900, 300, 86, 2, 6, 14), drops: { echoes: 4000 }, insightOnSight: 4, // (round 97: health 3200 to 3900, its highest in the tables)
  },
  {
    id: 'other_gods', name: 'The Other Gods', source: 'The Other Gods', regions: ['cloud_summit'], canonLooks: false,
    sprite: { silhouette: 'spectre', palette: 'pallid', scale: 6, eyes: 0, tentacles: 4, glow: 'magenta' },
    ...scripted('brute', phases(ph(1, { slam: 2, roar: 1, aoe_ring: 1, quake: 1 }), ph(0.5, { slam: 2, charge: 1, aoe_ring: 1, roar: 1, quake: 1, eruption: 1 }, { hooks: ['darkness'] }))),
    stats: st(3700, 800, 60, 2.6, 7, 16), drops: { echoes: 6000 }, insightOnSight: 4, // (round 97: health 3250 to 3700, its highest in the tables)
  },
  {
    id: 'yog_sothoth', name: 'Yog-Sothoth', source: 'The Dunwich Horror', regions: ['spheres'], canonLooks: true,
    assembly: {
      body: 'spheres', palette: 'pallid', scale: 20, spheres: 14, glow: 'green',
      hit: [[0.01, 0.718, 0.092], [-0.184, 0.544, 0.175], [0.199, 0.544, 0.165], [0.01, 0.398, 0.218], [-0.262, 0.223, 0.18], [0.248, 0.228, 0.184], [0, 0.107, 0.107]], // fitted to the front view's painted spheres: across from the picture's middle, up from the physical sphere cluster's foot, which the renderer grounds through REVIEWED_GROUND
    },
    ...scripted('boss', phases(
      ph(1, { beam: 2, teleport: 1, aoe_ring: 1, barrage: 1, thunderfall: 1, crushing_blow: 1 }, { hooks: ['arena_reconnect'], arena: 'spheres' }),
      ph(0.6, { beam: 2, projectile_fan: 1, teleport: 1, summon: 1, sweep_beam: 1, barrage: 1, crushing_blow: 1 }, { summons: ['dhole'], hooks: ['arena_reconnect', 'camera_warp'] }),
      ph(0.25, { beam: 3, starfall: 1, teleport: 1, sweep_beam: 2, vortex: 1, crushing_blow: 1 }, { hooks: ['arena_reconnect', 'camera_warp', 'time_skip'] }),
    ), { mobile: false, range: [0, 40], cooldown: [120, 180] }),
    stats: st(6100, 5000, 30, 1, 10, 25), drops: { echoes: 40000 }, insightOnSight: 5, // (round 97: health 2700 to 6100, its highest in the tables) (round 25: damage was 120; the balance table had it at 7.6 lives) (round 60: health 6100 and damage 62, which cost the balance bot 2.56 lives where a person first meets it; then 4400 and 38, no blow over 15% of a person's health: a crushing blow on any who stand at its edge)
  },
  {
    id: 'umr_at_tawil', name: "'Umr at-Tawil", source: 'Through the Gates of the Silver Key', regions: ['beyond'], canonLooks: true,
    sprite: { silhouette: 'robed', palette: 'charcoal', scale: 4, eyes: 0, glow: 'purple', gear: ['cowl', 'staff'] },
    ...scripted('boss', phases(
      ph(1, { gaze: 2, teleport: 1, beam: 1, sweep_beam: 1 }, { hooks: ['time_skip'] }),
      ph(0.6, { gaze: 2, beam: 2, teleport: 1, summon: 1, eruption: 1 }, { summons: ['ancient_ones'], hooks: ['time_skip', 'hidden_platforms'] }),
      ph(0.25, { teleport: 1 }), // it yields
    ), { range: [4, 14] }),
    stats: st(3800, 2000, 80, 3, 8, 18), drops: { echoes: 25000 }, insightOnSight: 5, // (round 97: health 3650 to 3800, its highest in the tables)
  },
  {
    id: 'ancient_ones', name: 'The Ancient Ones', source: 'Through the Gates of the Silver Key', regions: ['pale_lattice'], canonLooks: true,
    sprite: { silhouette: 'robed', palette: 'pallid', scale: 3.2, eyes: 0, gear: ['cowl'] },
    ...scripted('stationary_horror', phases(ph(1, { gaze: 2, roar: 1, sweep_beam: 1 }), ph(0.5, { gaze: 2, roar: 1, beam: 1, barrage: 1 }, { hooks: ['time_skip'] }))),
    stats: st(4050, 1000, 80, 0, 6, 14), drops: { echoes: 5000 }, insightOnSight: 4, // (round 97: health 2850 to 4050, its highest in the tables)
  },
  {
    id: 'shub_niggurath', name: 'Shub-Niggurath', source: 'The Whisperer in Darkness', regions: ['black_wood'], canonLooks: false,
    assembly: { body: 'mound', palette: 'rubber', scale: 18, tentacles: 12, eyes: 8 },
    ...scripted('boss', phases(
      ph(1, { tentacle_burst: 2, charge: 1, pool: 1, summon: 1, eruption: 1, toxic_cloud: 1, crushing_blow: 1 }, { summons: ['thousand_young'], arena: 'roots' }),
      ph(0.5, { tentacle_burst: 2, pool: 2, charge: 1, summon: 1, roar: 1, tentacle_rise: 1, toxic_cloud: 1, vortex: 1, crushing_blow: 1 }, { summons: ['thousand_young'], hooks: ['darkness'] }),
    )),
    stats: st(5450, 3000, 41, 1.2, 9, 20), drops: { echoes: 30000 }, insightOnSight: 5, // (round 97: health 3600 to 5450, its highest in the tables) (round 83: health 3100 to 3600, which the longer pauses after her blows had left 0.36 lives and 0.33 at the cap; round 73: damage 36 to 41: she is met in the Black Wood, the last ring, so a person at the cap has outgrown her less and the bot lost 0.35 lives of her at it, under the 0.4 floor; round 60: health 5450 and damage 100, which cost the balance bot 4.13 lives where a person first meets it; then 3800 and 34, no blow over 17% of a person's health, and a crushing blow given it)
  },
  {
    id: 'nyarlathotep', name: 'Nyarlathotep', source: 'Nyarlathotep', regions: ['court_centre'], canonLooks: true,
    sprite: { silhouette: 'humanoid', palette: 'sand', scale: 2.6, eyes: 2, glow: 'purple', gear: ['tall', 'coat', 'chain'] },
    ...scripted('boss', phases(
      ph(1, { projectile: 2, teleport: 1, summon: 1, beam: 1, thunderfall: 1, great_mark: 1 }, { summons: ['night_gaunt'], hooks: ['decoys'] }),
      ph(0.6, { projectile_fan: 2, beam: 2, teleport: 1, gaze: 1, sweep_beam: 1, dream_cloud: 1, great_mark: 1 }, { hooks: ['decoys', 'camera_warp'] }),
      ph(0.3, { tentacle_burst: 2, grab: 1, roar: 1, vortex: 1, starfall: 1, crushing_blow: 1 }, { hooks: ['darkness', 'camera_warp'] }), // the Crawling Chaos: it borrows the slain bosses' attacks too
    ), { range: [3, 10], strafe: 0.4 }),
    stats: st(5150, 3000, 43, 3.4, 8, 20), drops: { echoes: 35000 }, insightOnSight: 5, // (round 97: health 4300 to 5150, its highest in the tables) (round 60: health 5150 and damage 100, which cost the balance bot 2.01 lives where a person first meets it; then damage 42, no blow over 18% of a person's health: a great mark from afar, a crushing blow in its last form)
    // its true form is drawn a lanky figure five metres tall, not a mass: struck at its legs' stance, its body and upper arms (1.2 m either side; the long hands hang out of it), up to its shoulders and neck; the curl over them is out of reach
    eldritchVariant: { name: 'Nyarlathotep, the Crawling Chaos', sprite: { silhouette: 'blob', palette: 'ichor', scale: 6, tentacles: 10, eyes: 1, body: [0.7, 0.2] } },
  },
]);
