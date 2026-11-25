/**
 * Round 124, what is heard now and then inside: the dungeons' spot sounds as recipes (render/audio/ambience.ts plays them over a place's
 * beds, data/dungeonAmbience.ts says whose they are). The vaults had one recording of a grotto's drips for all of them; now a crypt has
 * dust, settling stone and a rat, a mine its pebbles and a machine, the Cavern of Flame its pops and the roar of a flame rolling up, the
 * span over the dark its wind through a crack, and a drop of water is one drop from one place, now and then, a few times, and then still
 * (a `run` in the table). Each is short, soft and dry: the room's own reverb and the distance (a low-pass drawn at random, a share of the
 * level) are the ambience's; each play is drawn a little anew (render/audio/vary.ts), so no two drops are one. Levelled by `ROOM_MIX` to
 * about -30 dBFS rms before the spot's own gain (tests/roomSounds.test.ts renders each). Data only.
 */

import { noise, tone, type Layer, type Sound } from './sounds';

export type RoomSoundId = 'drop' | 'pebbles' | 'settle' | 'thud' | 'draught' | 'dust' | 'skitter' | 'crackle' | 'flare' | 'whir' | 'clink' | 'pump' | 'knock' | 'chime' | 'swell' | 'leaf';

const lp = (hz: number, to?: number): Layer['filter'] => ({ type: 'lowpass', hz, to });

/** A sound and a fainter, duller copy of it a moment later (a hard room's first answer, kept in the recipe: the bed's share of the reverb is small). */
const answered = (sound: Sound, delay: number, k: number): Sound => [...sound, ...sound.map((l): Layer => ({ ...l, at: (l.at ?? 0) + delay, gain: l.gain * k, ...(l.filter && { filter: { ...l.filter, hz: l.filter.hz * 0.7, ...(l.filter.to && { to: l.filter.to * 0.7 }) } }) }))];

const RAW: Readonly<Record<RoomSoundId, Sound>> = {
  // A drop into a pool: the plink of the bubble it makes (a note that climbs), the tick of its striking, and a smaller drop after it.
  drop: answered([tone('sine', 1180, 0.09, 0.32, { to: 1820, attack: 0.002 }), noise('bandpass', 3200, 0.012, 0.12, { q: 2 }), tone('sine', 760, 0.07, 0.1, { at: 0.035, to: 1120, attack: 0.002 })], 0.12, 0.22),
  // Grit loosed somewhere: small stones ticking down a slope, quick and then slower, each softer, and the last settling.
  pebbles: [
    ...[0, 0.07, 0.12, 0.19, 0.24, 0.33, 0.45, 0.6].map((at, k) => noise('bandpass', 2300 + 420 * ((k * 3) % 5), 0.014, 0.5 * 0.86 ** k, { at, q: 4 })),
    ...[0, 0.12, 0.33].map((at, k) => noise('bandpass', 850, 0.035, 0.22 * 0.8 ** k, { at, q: 2 })),
    noise('lowpass', 420, 0.14, 0.12, { at: 0.66, attack: 0.004 }),
  ],
  // A vault's stones taking their weight: a grinding creak in the stone, a knock, and a little grit after it.
  settle: [
    noise('bandpass', 430, 0.55, 0.22, { to: 300, q: 5, attack: 0.18 }),
    tone('sawtooth', 68, 0.48, 0.05, { to: 62, attack: 0.16, vibrato: [11, 60], filter: lp(320) }),
    tone('sine', 62, 0.36, 0.34, { at: 0.44, to: 40, attack: 0.004 }),
    noise('lowpass', 520, 0.2, 0.24, { at: 0.44, attack: 0.003 }),
    noise('highpass', 3000, 0.45, 0.025, { at: 0.52, attack: 0.12 }),
  ],
  // Something heavy set down deeper in, or upstairs: one thud and a smaller one after it, through stone or boards.
  thud: [
    tone('sine', 56, 0.5, 0.42, { to: 38, attack: 0.006 }),
    noise('lowpass', 280, 0.36, 0.36, { to: 90, attack: 0.005 }),
    noise('bandpass', 720, 0.08, 0.08, { q: 1.5 }),
    tone('sine', 50, 0.4, 0.22, { at: 0.34, to: 36, attack: 0.006 }),
    noise('lowpass', 240, 0.3, 0.18, { at: 0.34, to: 80, attack: 0.005 }),
  ],
  // Air through a crack: a breath that swells and falls over three seconds, with a whistle in it too faint to be a note.
  draught: [
    noise('bandpass', 680, 3.2, 0.24, { to: 880, q: 1.2, attack: 1.4 }),
    noise('lowpass', 260, 3, 0.14, { attack: 1.5 }),
    tone('sine', 1180, 2.6, 0.012, { at: 0.6, attack: 1.2, to: 1240, vibrato: [0.7, 25] }),
  ],
  // Dust and grit sifting from the vault: a soft hiss and a few grains.
  dust: [
    noise('highpass', 2800, 1.2, 0.06, { attack: 0.3 }),
    noise('bandpass', 1500, 0.9, 0.035, { attack: 0.2, q: 0.8 }),
    ...[0.1, 0.32, 0.55, 0.8].map((at, k) => noise('bandpass', 4200 - 300 * k, 0.01, 0.07, { at, q: 3 })),
  ],
  // Small claws in the wall or along the floor: two quick runs of ticks with a pause between, and the brush of a body.
  skitter: [
    ...[0, 0.03, 0.065, 0.09, 0.13, 0.155, 0.36, 0.385, 0.42, 0.445, 0.48].map((at, k) => noise('bandpass', 3100 + 380 * ((k * 2) % 5), 0.008, 0.32, { at, q: 5 })),
    noise('bandpass', 1800, 0.22, 0.04, { q: 1 }),
    noise('bandpass', 1700, 0.18, 0.035, { at: 0.36, q: 1 }),
  ],
  // A great fire's snap: a crack, its thump, and sparks after it.
  crackle: [
    noise('bandpass', 2400, 0.03, 0.42, { q: 1.5 }),
    noise('lowpass', 900, 0.08, 0.26, { attack: 0.002 }),
    ...[0.05, 0.12, 0.2, 0.31].map((at, k) => noise('highpass', 3800 + 400 * k, 0.006, 0.09 * 0.85 ** k, { at })),
  ],
  // A sheet of flame rolling up the cavern's wall: a deep whoosh that rises, and falls back.
  flare: [
    noise('lowpass', 380, 1.8, 0.4, { to: 900, attack: 0.6 }),
    noise('bandpass', 1200, 1.5, 0.1, { to: 1800, q: 0.8, attack: 0.7 }),
    tone('sine', 48, 1.6, 0.16, { attack: 0.6, to: 56 }),
  ],
  // A machine of the Mi-Go wakes, whirs up and stops with a click: no tune, a rising buzz behind a wall.
  whir: [
    tone('sawtooth', 110, 1.6, 0.05, { to: 220, attack: 0.5, filter: { type: 'bandpass', hz: 700, q: 2 } }),
    tone('sine', 880, 1.4, 0.022, { to: 1320, attack: 0.5, vibrato: [7, 25] }),
    noise('bandpass', 2000, 0.03, 0.12, { at: 1.5, q: 3 }),
    noise('lowpass', 600, 0.15, 0.1, { at: 1.5, attack: 0.004 }),
  ],
  // Glass on glass: a bottle swinging against another (the Terrible Old Man's), or a retort set down; two small clinks.
  clink: [
    tone('sine', 2650, 0.25, 0.08, { attack: 0.001 }),
    tone('sine', 4120, 0.15, 0.04, { attack: 0.001 }),
    tone('sine', 2810, 0.2, 0.05, { at: 0.14, attack: 0.001 }),
    tone('sine', 4370, 0.12, 0.025, { at: 0.14, attack: 0.001 }),
  ],
  // Dr. Muñoz's machine behind the wall ("Cool Air"): the pump's slow strokes, each a thrum and a sigh of the gas.
  pump: [0, 0.62, 1.24, 1.86].flatMap((at) => [
    tone('sine', 58, 0.28, 0.3, { at, to: 44, attack: 0.03 }),
    noise('lowpass', 320, 0.22, 0.2, { at: at + 0.02, attack: 0.01 }),
    noise('highpass', 3500, 0.42, 0.016, { at: at + 0.25, attack: 0.14 }),
  ]),
  // A loose shutter knocking in the wind, twice and then a softer third.
  knock: answered([0, 0.36, 0.58].flatMap((at, k) => [tone('sine', 180, 0.09, 0.3 * 0.75 ** k, { at, to: 120, attack: 0.002 }), noise('bandpass', 900, 0.05, 0.2 * 0.75 ** k, { at, q: 2.2 })]), 0.09, 0.2),
  // Somewhere in the dream a small bell no one rang: one note and its shimmer, a long fall.
  chime: [
    tone('sine', 1046.5, 2.4, 0.07, { attack: 0.004 }),
    tone('sine', 2722, 1.2, 0.025, { attack: 0.003 }),
    tone('sine', 1049.6, 2.2, 0.04, { attack: 0.006 }),
    noise('bandpass', 3400, 0.03, 0.04, { q: 3 }),
  ],
  // Something enormous turning in the water beyond the wall: a low surge and the slosh it makes.
  swell: [
    noise('lowpass', 200, 3, 0.32, { to: 120, attack: 1.2 }),
    tone('sine', 41, 3, 0.3, { attack: 1.1, to: 34 }),
    noise('bandpass', 600, 2, 0.05, { attack: 0.8, q: 2, to: 420 }),
  ],
  // A page turned far off, where no one should be reading.
  leaf: [
    noise('bandpass', 2400, 0.22, 0.12, { to: 1600, q: 0.9, attack: 0.03 }),
    noise('highpass', 3500, 0.12, 0.05, { at: 0.08, attack: 0.02 }),
    noise('lowpass', 700, 0.06, 0.05, { at: 0.2, attack: 0.004 }),
  ],
};

/** How much each is lifted or let down against its recipe as written, so that all sit alike: rms about -30 dBFS, measured by an offline render (tests/roomSounds.test.ts keeps them there). The spots' own gains in data/dungeonAmbience.ts place them. */
export const ROOM_MIX: Readonly<Record<RoomSoundId, number>> = { drop: 0.56, pebbles: 1.88, settle: 0.6, thud: 0.35, draught: 1.64, dust: 2.2, skitter: 2, crackle: 1.58, flare: 0.53, whir: 3.85, clink: 1.5, pump: 0.52, knock: 0.72, chime: 1.41, swell: 0.31, leaf: 2.24 };

const mixed = (sound: Sound, k: number): Sound => sound.map((l): Layer => ({ ...l, gain: Math.min(1, l.gain * k) }));

export const ROOM_SOUNDS: Readonly<Record<RoomSoundId, Sound>> = Object.fromEntries((Object.keys(RAW) as RoomSoundId[]).map((id) => [id, mixed(RAW[id], ROOM_MIX[id])])) as Record<RoomSoundId, Sound>;
