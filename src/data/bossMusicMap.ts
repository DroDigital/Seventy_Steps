/**
 * Where each boss theme plays, loops and heats (round 44): found offline by `python3 tools/boss_music.py`
 * (do not edit; mend a loop point in data/bossMusic.ts OVERRIDES). Seconds into the file. `bpm` and `beats`
 * a bar (0: no pulse found), `bar` the loop's bar in seconds, `entry` where playing begins and `lead` the
 * seconds from there to full drive, `loop` its two ends and the crossfade between passes (null: the realms'
 * kind of loop, found as it loads), `hot` the last phase's stretch (null: none stands clear), `gain` what
 * brings the body to BOSS_MUSIC.target without a peak over the ceiling (linear), `hotGain` the hot stretch's own trim to the ceiling (× the gain; 1: none), `rms` and `peak` the body's
 * before it (dBFS), `seam` the level step and the spectral-flux jump across the loop's seam, each against the
 * track's own variation (1: as large as its own largest). Data only.
 */

import type { BossTrackId } from './bossMusic';

export interface BossMap {
  dur: number;
  bpm: number;
  beats: number;
  bar: number;
  entry: number;
  lead: number;
  loop: readonly [number, number, number] | null;
  hot: readonly [number, number, number] | null;
  gain: number;
  hotGain: number;
  rms: number;
  peak: number;
  seam: readonly [step: number, flux: number];
}

export const BOSS_MAP: Readonly<Partial<Record<BossTrackId, BossMap>>> = {
  alien_boss_battle: { dur: 180.0, bpm: 100.7, beats: 3, bar: 1.788, entry: 0.0, lead: 4.5, loop: [29.44, 115.275, 1.788], hot: [149.045, 163.264, 1.777], gain: 0.5544, hotGain: 1.000, rms: -17.9, peak: -3.6, seam: [0.87, 0.90] },
  b_locios_venom: { dur: 239.1, bpm: 88.0, beats: 3, bar: 2.033, entry: 0.0, lead: 2.5, loop: [129.376, 210.699, 2.033], hot: null, gain: 0.5585, hotGain: 1.000, rms: -17.9, peak: -4.8, seam: [0.88, 0.99] },
  bells_in_the_dark: { dur: 180.0, bpm: 100.1, beats: 3, bar: 1.800, entry: 0.0, lead: 6.0, loop: [104.949, 155.349, 1.8], hot: null, gain: 0.5159, hotGain: 1.000, rms: -17.3, peak: -3.5, seam: [0.37, 0.68] },
  bonfire_of_the_void: { dur: 121.6, bpm: 104.5, beats: 3, bar: 1.727, entry: 0.0, lead: 2.5, loop: [22.283, 105.184, 1.727], hot: null, gain: 0.6468, hotGain: 1.000, rms: -19.2, peak: -5.4, seam: [0.92, 1.40] },
  canal_blood_ritual: { dur: 178.8, bpm: 101.1, beats: 3, bar: 0.000, entry: 0.0, lead: 2.0, loop: null, hot: null, gain: 0.4909, hotGain: 1.000, rms: -16.8, peak: -3.2, seam: [7.23, 1.79] },
  colossal_footfalls: { dur: 179.6, bpm: 103.4, beats: 3, bar: 1.740, entry: 0.0, lead: 2.5, loop: [80.981, 150.581, 1.74], hot: [152.299, 166.048, 1.719], gain: 0.5116, hotGain: 1.000, rms: -17.2, peak: -3.8, seam: [1.29, 1.10] },
  daemon_pipers: { dur: 239.7, bpm: 103.9, beats: 4, bar: 2.300, entry: 0.0, lead: 2.5, loop: [107.147, 162.357, 2.3], hot: [169.28, 182.912, 2.272], gain: 0.5373, hotGain: 1.000, rms: -17.6, peak: -3.8, seam: [1.44, 0.72] },
  dripping_stone: { dur: 129.6, bpm: 0, beats: 0, bar: 0.000, entry: 0.0, lead: 2.5, loop: null, hot: null, gain: 0.3590, hotGain: 1.000, rms: -14.1, peak: -3.3, seam: [16.66, 2.69] },
  fragile_defiance: { dur: 122.4, bpm: 103.9, beats: 3, bar: 0.000, entry: 0.0, lead: 0.5, loop: null, hot: null, gain: 0.6146, hotGain: 1.000, rms: -18.8, peak: -4.2, seam: [5.71, 1.62] },
  hasturs_waltz: { dur: 239.9, bpm: 90.5, beats: 3, bar: 2.012, entry: 0.0, lead: 8.0, loop: [68.875, 117.173, 2.012], hot: null, gain: 0.7134, hotGain: 1.000, rms: -20.1, peak: -5.8, seam: [1.23, 0.91] },
  hollow_bone_ritual: { dur: 182.0, bpm: 100.1, beats: 4, bar: 2.400, entry: 0.0, lead: 3.0, loop: [83.957, 141.557, 2.4], hot: null, gain: 0.4348, hotGain: 1.000, rms: -15.8, peak: -2.9, seam: [1.34, 1.11] },
  hounds_of_the_mist: { dur: 154.0, bpm: 102.4, beats: 3, bar: 1.740, entry: 0.0, lead: 2.5, loop: [53.728, 109.397, 1.74], hot: null, gain: 0.6082, hotGain: 1.000, rms: -18.7, peak: -4.6, seam: [0.87, 0.95] },
  moonlit_ravine: { dur: 132.4, bpm: 100.9, beats: 3, bar: 1.784, entry: 0.0, lead: 2.5, loop: [58.101, 86.645, 1.784], hot: null, gain: 0.5491, hotGain: 1.000, rms: -17.8, peak: -4.6, seam: [1.07, 0.80] },
  pendulum_of_madness: { dur: 127.6, bpm: 101.0, beats: 3, bar: 1.792, entry: 0.0, lead: 4.5, loop: [30.571, 87.925, 1.792], hot: null, gain: 0.5928, hotGain: 1.000, rms: -18.5, peak: -4.4, seam: [1.24, 1.19] },
  phrygian_waltz: { dur: 179.2, bpm: 100.1, beats: 3, bar: 1.790, entry: 0.0, lead: 7.5, loop: [55.979, 113.259, 1.79], hot: null, gain: 0.5284, hotGain: 1.000, rms: -17.5, peak: -4.9, seam: [0.85, 0.98] },
  rotting_cellar_boss: { dur: 118.4, bpm: 99.6, beats: 3, bar: 1.800, entry: 0.0, lead: 2.5, loop: [19.904, 102.72, 1.8], hot: null, gain: 0.5438, hotGain: 1.000, rms: -17.7, peak: -4.0, seam: [1.09, 0.97] },
  sub_zero_protocol: { dur: 121.6, bpm: 100.6, beats: 3, bar: 1.795, entry: 0.0, lead: 4.5, loop: [25.867, 68.949, 1.795], hot: null, gain: 0.5939, hotGain: 1.000, rms: -18.5, peak: -4.1, seam: [1.09, 0.88] },
  tekeli_lis_last_stand: { dur: 179.9, bpm: 105.4, beats: 3, bar: 1.692, entry: 0.0, lead: 2.5, loop: [105.813, 159.947, 1.692], hot: null, gain: 0.6298, hotGain: 1.000, rms: -19.0, peak: -4.9, seam: [0.60, 0.79] },
  the_alchemists_oath: { dur: 120.8, bpm: 101.0, beats: 3, bar: 0.000, entry: 0.0, lead: 0.5, loop: null, hot: null, gain: 0.5535, hotGain: 1.000, rms: -17.9, peak: -3.9, seam: [3.79, 1.87] },
  the_ancient_ones: { dur: 240.0, bpm: 115.0, beats: 3, bar: 1.561, entry: 0.0, lead: 1.5, loop: [53.483, 128.395, 1.561], hot: [167.424, 179.904, 1.56], gain: 0.6194, hotGain: 1.000, rms: -18.8, peak: -5.4, seam: [0.77, 1.03] },
  the_betrayal_of_kadath: { dur: 239.6, bpm: 90.7, beats: 3, bar: 1.989, entry: 0.0, lead: 5.5, loop: [120.757, 168.491, 1.989], hot: [202.059, 217.856, 1.975], gain: 0.6470, hotGain: 1.000, rms: -19.2, peak: -5.8, seam: [0.97, 1.07] },
  the_blind_idiot_god: { dur: 239.6, bpm: 75.0, beats: 4, bar: 3.200, entry: 0.0, lead: 6.5, loop: [80.341, 137.941, 2.4], hot: null, gain: 0.5718, hotGain: 1.000, rms: -18.1, peak: -4.5, seam: [1.39, 1.19] },
  the_cosmic_gate: { dur: 240.4, bpm: 80.7, beats: 3, bar: 2.226, entry: 0.0, lead: 6.0, loop: [101.675, 164, 2.226], hot: null, gain: 0.6460, hotGain: 1.000, rms: -19.2, peak: -5.3, seam: [0.89, 1.09] },
  the_crawling_chaos: { dur: 239.2, bpm: 115.0, beats: 4, bar: 2.118, entry: 6.571, lead: 5.93, loop: [159.232, 184.651, 2.118], hot: [201.621, 214.325, 2.117], gain: 0.6424, hotGain: 1.000, rms: -19.2, peak: -4.7, seam: [1.08, 1.09] },
  the_drowned_pantheon: { dur: 239.2, bpm: 139.8, beats: 3, bar: 1.279, entry: 0.0, lead: 0.5, loop: [127.637, 189.013, 2.557], hot: null, gain: 0.5825, hotGain: 1.000, rms: -18.3, peak: -4.1, seam: [0.62, 1.19] },
  the_drowned_sarnath: { dur: 239.6, bpm: 87.1, beats: 4, bar: 2.757, entry: 0.0, lead: 5.0, loop: [66.4, 132.576, 2.757], hot: [195.915, 212.373, 2.743], gain: 0.6162, hotGain: 0.819, rms: -18.8, peak: -4.8, seam: [1.03, 0.93] },
  the_formless_one: { dur: 124.2, bpm: 100.6, beats: 3, bar: 1.785, entry: 0.0, lead: 0.0, loop: [80.896, 109.451, 1.785], hot: null, gain: 0.5454, hotGain: 1.000, rms: -17.7, peak: -4.6, seam: [1.03, 0.98] },
  the_goat_of_the_deep_woods: { dur: 239.6, bpm: 109.7, beats: 3, bar: 1.645, entry: 10.059, lead: 4.94, loop: [132.139, 184.768, 1.645], hot: [197.664, 213.685, 1.602], gain: 0.5476, hotGain: 1.000, rms: -17.8, peak: -4.8, seam: [1.23, 1.00] },
  the_hollow_bell: { dur: 121.1, bpm: 100.3, beats: 4, bar: 0.000, entry: 0.0, lead: 1.5, loop: null, hot: null, gain: 0.5392, hotGain: 1.000, rms: -17.6, peak: -4.6, seam: [5.24, 2.18] },
  the_house_that_haunts_you: { dur: 122.6, bpm: 100.1, beats: 4, bar: 2.399, entry: 0.0, lead: 5.0, loop: [54.155, 90.144, 2.399], hot: null, gain: 0.5228, hotGain: 1.000, rms: -17.4, peak: -4.2, seam: [1.20, 1.07] },
  the_last_confession: { dur: 183.2, bpm: 99.4, beats: 3, bar: 1.802, entry: 0.0, lead: 4.5, loop: [67.68, 168.608, 1.802], hot: [67.68, 89.173, 1.791], gain: 0.5862, hotGain: 1.000, rms: -18.4, peak: -3.7, seam: [1.22, 1.36] },
  the_lurching_vault: { dur: 178.8, bpm: 103.5, beats: 3, bar: 1.724, entry: 0.0, lead: 1.0, loop: [112.693, 167.872, 1.724], hot: null, gain: 0.6144, hotGain: 1.000, rms: -18.8, peak: -4.1, seam: [0.90, 1.01] },
  the_necromancers_duel: { dur: 179.8, bpm: 102.6, beats: 3, bar: 1.754, entry: 0.0, lead: 7.0, loop: [53.803, 123.957, 1.754], hot: [132.576, 146.368, 1.724], gain: 0.5103, hotGain: 1.000, rms: -17.2, peak: -4.0, seam: [0.67, 0.90] },
  the_obelisk_awakens: { dur: 121.2, bpm: 103.3, beats: 4, bar: 2.308, entry: 0.0, lead: 5.0, loop: [54.944, 110.347, 2.308], hot: null, gain: 0.6547, hotGain: 1.000, rms: -19.3, peak: -6.0, seam: [1.27, 1.10] },
  the_other_gods: { dur: 239.8, bpm: 84.2, beats: 3, bar: 2.158, entry: 0.0, lead: 1.0, loop: [74.069, 125.856, 2.158], hot: [177.173, 198.443, 2.127], gain: 0.7114, hotGain: 1.000, rms: -20.0, peak: -6.4, seam: [0.65, 0.96] },
  the_pendulums_last_waltz: { dur: 120.4, bpm: 101.7, beats: 3, bar: 0.000, entry: 0.0, lead: 7.0, loop: null, hot: null, gain: 0.5745, hotGain: 1.000, rms: -18.2, peak: -4.4, seam: [5.49, 1.20] },
  the_phrygian_fugue: { dur: 119.6, bpm: 100.1, beats: 4, bar: 2.400, entry: 0.0, lead: 3.5, loop: [63.957, 107.157, 2.4], hot: null, gain: 0.5400, hotGain: 1.000, rms: -17.6, peak: -3.3, seam: [1.36, 1.07] },
  the_pyramids_stomp: { dur: 168.5, bpm: 104.3, beats: 3, bar: 1.725, entry: 0.0, lead: 2.5, loop: [81.045, 108.64, 1.725], hot: null, gain: 0.5792, hotGain: 1.000, rms: -18.3, peak: -4.8, seam: [0.74, 0.95] },
  the_ruawns_grasp: { dur: 152.6, bpm: 100.0, beats: 4, bar: 2.401, entry: 0.0, lead: 3.5, loop: [31.253, 88.875, 2.401], hot: null, gain: 0.6468, hotGain: 1.000, rms: -19.2, peak: -4.1, seam: [1.29, 1.21] },
  the_slumbering_toad_god: { dur: 239.8, bpm: 87.9, beats: 3, bar: 2.039, entry: 0.0, lead: 0.0, loop: [130.112, 179.04, 2.039], hot: null, gain: 0.5461, hotGain: 1.000, rms: -17.7, peak: -4.5, seam: [1.24, 1.00] },
  the_sunken_leviathan: { dur: 239.8, bpm: 87.9, beats: 3, bar: 2.057, entry: 0.0, lead: 5.5, loop: [70.101, 152.384, 2.057], hot: [195.285, 207.52, 2.039], gain: 0.5890, hotGain: 0.959, rms: -18.4, peak: -4.6, seam: [0.81, 1.00] },
  the_swarm_awakens: { dur: 180.0, bpm: 100.1, beats: 4, bar: 0.000, entry: 0.0, lead: 2.0, loop: null, hot: null, gain: 0.3934, hotGain: 1.000, rms: -14.9, peak: -3.5, seam: [20.76, 1.73] },
  the_temple_of_mu: { dur: 240.0, bpm: 91.6, beats: 3, bar: 1.987, entry: 6.293, lead: 5.21, loop: [74.624, 138.208, 1.987], hot: [212.107, 227.445, 1.917], gain: 0.5831, hotGain: 0.947, rms: -18.3, peak: -5.0, seam: [1.17, 0.95] },
  the_wax_museum: { dur: 239.5, bpm: 88.7, beats: 3, bar: 2.035, entry: 0.0, lead: 7.0, loop: [137.536, 186.368, 2.035], hot: null, gain: 0.6295, hotGain: 1.000, rms: -19.0, peak: -4.6, seam: [0.96, 1.04] },
  the_wrong_waltz_of_swapped: { dur: 122.0, bpm: 104.7, beats: 3, bar: 1.713, entry: 0.0, lead: 7.0, loop: [54.656, 82.069, 1.713], hot: null, gain: 0.6563, hotGain: 1.000, rms: -19.3, peak: -5.1, seam: [1.04, 1.13] },
  twin_gods_of_the_nether: { dur: 239.2, bpm: 89.1, beats: 4, bar: 2.684, entry: 0.0, lead: 5.5, loop: [68.992, 133.408, 2.684], hot: null, gain: 0.5625, hotGain: 1.000, rms: -18.0, peak: -4.0, seam: [1.14, 0.80] },
  umr_at_tawil: { dur: 239.5, bpm: 82.0, beats: 3, bar: 2.195, entry: 0.0, lead: 7.5, loop: [69.44, 139.669, 2.195], hot: null, gain: 0.6045, hotGain: 1.000, rms: -18.6, peak: -3.7, seam: [0.99, 0.90] },
  yaddiths_sorcerer: { dur: 158.5, bpm: 102.9, beats: 3, bar: 1.753, entry: 0.0, lead: 4.0, loop: [57.301, 113.408, 1.753], hot: null, gain: 0.6420, hotGain: 1.000, rms: -19.2, peak: -5.0, seam: [1.08, 1.30] },
};
