/**
 * Outer Gods (spec §4): the court of Azathoth and the powers beyond the Gate. Each fights by a phase
 * script (spec §3E); the region's four have signature mechanics (systems/signatures/): Shub-Niggurath's
 * spawning roots, Yog-Sothoth's sphere gates, Nyarlathotep's avatars and borrowed movesets, and
 * blind Azathoth, outlasted rather than slain. 'Umr at-Tawil yields, offering one of the endings.
 */

import { ph, phases, scripted, st, tier } from './kit';

export const OUTER_GODS = tier('outer_god', [
  {
    id: 'azathoth', name: 'Azathoth', source: 'The Dream-Quest of Unknown Kadath', regions: ['beyond'], canonLooks: false, voice: 'pipes',
    assembly: { body: 'mound', palette: 'charcoal', scale: 30, tentacles: 12, eyes: 0, glow: 'purple' },
    ...scripted('boss', phases(
      // Blind: nothing it does is aimed. The piping swells and the dark comes; its blows fall only where it hears (signatures/azathoth.ts; round 12).
      ph(1, { roar: 1, darkness: 1 }, { hooks: ['darkness'] }),
      ph(0.66, { roar: 1, darkness: 1 }, { hooks: ['darkness', 'camera_warp'] }),
      ph(0.33, { roar: 2, darkness: 1 }, { hooks: ['darkness', 'camera_warp', 'arena_reconnect'] }),
    ), { mobile: false, range: [0, 60], aggro: 0, fov: 0, cooldown: [240, 360] }), // slow, vast swells: the song took a still mind whole in 15 s
    stats: st(6700, 5000, 150, 0.5, 10, 5), drops: { echoes: 50000 }, insightOnSight: 5,
  },
  {
    id: 'daemon_pipers', name: 'The Daemon Pipers', source: 'The Dream-Quest of Unknown Kadath', regions: ['beyond'], canonLooks: false, voice: 'pipes',
    sprite: { silhouette: 'spectre', palette: 'charcoal', scale: 2.8, eyes: 0, glow: 'purple' },
    ...scripted('caster', phases(ph(1, { roar: 2, projectile: 1, barrage: 1 }), ph(0.5, { roar: 1, projectile_fan: 2, darkness: 1, barrage: 2 }, { hooks: ['camera_warp'] }))),
    stats: st(3900, 300, 86, 2, 6, 14), drops: { echoes: 4000 }, insightOnSight: 4,
  },
  {
    id: 'other_gods', name: 'The Other Gods', source: 'The Other Gods', regions: ['beyond', 'dreamlands'], canonLooks: false,
    sprite: { silhouette: 'spectre', palette: 'pallid', scale: 6, eyes: 0, tentacles: 4, glow: 'magenta' },
    ...scripted('brute', phases(ph(1, { slam: 2, roar: 1, aoe_ring: 1, quake: 1 }), ph(0.5, { slam: 2, charge: 1, aoe_ring: 1, roar: 1, quake: 1, eruption: 1 }, { hooks: ['darkness'] }))),
    stats: st(3700, 800, 60, 2.6, 7, 16), drops: { echoes: 6000 }, insightOnSight: 4,
  },
  {
    id: 'yog_sothoth', name: 'Yog-Sothoth', source: 'The Dunwich Horror', regions: ['beyond'], canonLooks: true,
    assembly: {
      body: 'spheres', palette: 'pallid', scale: 20, spheres: 14, glow: 'green',
      hit: [[0.01, 0.718, 0.092], [-0.184, 0.544, 0.175], [0.199, 0.544, 0.165], [0.01, 0.398, 0.218], [-0.262, 0.223, 0.18], [0.248, 0.228, 0.184], [0, 0.107, 0.107]], // fitted to the front view's painted spheres: across from the picture's middle, up from the physical sphere cluster's foot, which the renderer grounds through REVIEWED_GROUND
    },
    ...scripted('boss', phases(
      ph(1, { beam: 2, teleport: 1, aoe_ring: 1, barrage: 1, eruption: 1, crushing_blow: 1 }, { hooks: ['arena_reconnect'], arena: 'spheres' }),
      ph(0.6, { beam: 2, projectile_fan: 1, teleport: 1, summon: 1, sweep_beam: 1, barrage: 1, crushing_blow: 1 }, { summons: ['dhole'], hooks: ['arena_reconnect', 'camera_warp'] }),
      ph(0.25, { beam: 3, aoe_ring: 1, teleport: 1, sweep_beam: 2, vortex: 1, crushing_blow: 1 }, { hooks: ['arena_reconnect', 'camera_warp', 'time_skip'] }),
    ), { mobile: false, range: [0, 40] }),
    stats: st(5200, 5000, 46, 1, 10, 25), drops: { echoes: 40000 }, insightOnSight: 5, // (round 25: damage was 120; the balance table had it at 7.6 lives) (round 60: health 6100 and damage 62, which cost the balance bot 2.56 lives where a person first meets it; then 4400 and 38, no blow over 15% of a person's health: a crushing blow on any who stand at its edge)
  },
  {
    id: 'umr_at_tawil', name: "'Umr at-Tawil", source: 'Through the Gates of the Silver Key', regions: ['beyond'], canonLooks: true,
    sprite: { silhouette: 'robed', palette: 'charcoal', scale: 4, eyes: 0, glow: 'purple', gear: ['cowl', 'staff'] },
    ...scripted('boss', phases(
      ph(1, { gaze: 2, teleport: 1, beam: 1, sweep_beam: 1 }, { hooks: ['time_skip'] }),
      ph(0.6, { gaze: 2, beam: 2, teleport: 1, summon: 1, eruption: 1 }, { summons: ['ancient_ones'], hooks: ['time_skip', 'hidden_platforms'] }),
      ph(0.25, { teleport: 1 }), // it yields
    ), { range: [4, 14] }),
    stats: st(3800, 2000, 80, 3, 8, 18), drops: { echoes: 25000 }, insightOnSight: 5,
  },
  {
    id: 'ancient_ones', name: 'The Ancient Ones', source: 'Through the Gates of the Silver Key', regions: ['beyond'], canonLooks: true,
    sprite: { silhouette: 'robed', palette: 'pallid', scale: 3.2, eyes: 0, gear: ['cowl'] },
    ...scripted('stationary_horror', phases(ph(1, { gaze: 2, roar: 1, sweep_beam: 1 }), ph(0.5, { gaze: 2, roar: 1, beam: 1, barrage: 1 }, { hooks: ['time_skip'] }))),
    stats: st(4050, 1000, 80, 0, 6, 14), drops: { echoes: 5000 }, insightOnSight: 4,
  },
  {
    id: 'shub_niggurath', name: 'Shub-Niggurath', source: 'The Whisperer in Darkness', regions: ['dunwich'], canonLooks: false,
    assembly: { body: 'mound', palette: 'rubber', scale: 18, tentacles: 12, eyes: 8 },
    ...scripted('boss', phases(
      ph(1, { tentacle_burst: 2, charge: 1, pool: 1, summon: 1, eruption: 2, crushing_blow: 1 }, { summons: ['thousand_young'], arena: 'roots' }),
      ph(0.5, { tentacle_burst: 2, pool: 2, charge: 1, summon: 1, roar: 1, eruption: 1, quake: 1, vortex: 1, crushing_blow: 1 }, { summons: ['thousand_young'], hooks: ['darkness'] }),
    )),
    stats: st(3100, 3000, 36, 1.2, 9, 20), drops: { echoes: 30000 }, insightOnSight: 5, // (round 60: health 5450 and damage 100, which cost the balance bot 4.13 lives where a person first meets it; then 3800 and 34, no blow over 17% of a person's health, and a crushing blow given it)
  },
  {
    id: 'nyarlathotep', name: 'Nyarlathotep', source: 'Nyarlathotep', regions: ['dreamlands', 'beyond'], canonLooks: true,
    sprite: { silhouette: 'humanoid', palette: 'sand', scale: 2.6, eyes: 2, glow: 'purple', gear: ['tall', 'coat', 'chain'] },
    ...scripted('boss', phases(
      ph(1, { projectile: 2, teleport: 1, summon: 1, beam: 1, barrage: 1, great_mark: 1 }, { summons: ['night_gaunt'], hooks: ['decoys'] }),
      ph(0.6, { projectile_fan: 2, beam: 2, teleport: 1, gaze: 1, sweep_beam: 1, eruption: 1, great_mark: 1 }, { hooks: ['decoys', 'camera_warp'] }),
      ph(0.3, { tentacle_burst: 2, grab: 1, roar: 1, vortex: 1, quake: 1, crushing_blow: 1 }, { hooks: ['darkness', 'camera_warp'] }), // the Crawling Chaos: it borrows the slain bosses' attacks too
    ), { range: [3, 10], strafe: 0.4 }),
    stats: st(4300, 3000, 43, 3.4, 8, 20), drops: { echoes: 35000 }, insightOnSight: 5, // (round 60: health 5150 and damage 100, which cost the balance bot 2.01 lives where a person first meets it; then damage 42, no blow over 18% of a person's health: a great mark from afar, a crushing blow in its last form)
    // its true form is drawn a lanky figure five metres tall, not a mass: struck at its legs' stance, its body and upper arms (1.2 m either side; the long hands hang out of it), up to its shoulders and neck; the curl over them is out of reach
    eldritchVariant: { name: 'Nyarlathotep, the Crawling Chaos', sprite: { silhouette: 'blob', palette: 'ichor', scale: 6, tentacles: 10, eyes: 1, body: [0.7, 0.2] } },
  },
]);
