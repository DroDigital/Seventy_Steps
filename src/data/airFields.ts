/**
 * Round 80, atmosphere: each realm's own air (render/ambientAir.ts). Between spells of weather the land between was empty air: now every
 * realm keeps a field of its own small matter, always a little, in clear weather too, so a still from any of them is known by its air
 * alone: ash settling on the Blasted Heath, russet leaves in the wooded hills, diamond dust and spindrift on the plateau, spores on
 * Yuggoth, sand streaming across Pnakotus, and in the Outer Dark each dimension's own signature. Data only; colours are the realm's
 * (data/looks.ts: its accents and its mist), so they survive the grade and the 64-colour palette.
 */

import type { Vec3 } from './tuning';

/** What a speck is (render/airKinds.ts has the flight and the shape of each). */
export type AirKind = 'ash' | 'ember' | 'spore' | 'mote' | 'drift' | 'brine' | 'dust' | 'flake' | 'leaf' | 'petal' | 'glint' | 'streamer' | 'seed' | 'frozen' | 'note' | 'bubble';

/** The colour of a layer: one of its realm's own, or a colour of its own. */
export type AirTone = 'mist' | 'accent0' | 'accent1' | 'moon' | Vec3;

export interface AirLayer {
  kind: AirKind;
  tone: AirTone;
  /** Specks born a second at their fullest, before the hour, the mist, the wind and the rain have their say. */
  rate: number;
  size?: number; // metres across: the kind's own where left out
  pale?: number; // 0..1: how far the tone is turned toward white (keeps a green mist from reading as the Void's green)
  /** What the rate follows: `wood` (the leaves fall where trees stand), `mist` (the thickness of the realm's mist, and the Fog setting), `gust` (the wind's rolling gusts), `dark` (the deeper the night, the more). */
  by?: 'wood' | 'mist' | 'gust' | 'dark';
  dry?: boolean; // rain washes it from the air
  glow?: boolean; // self-lit where the kind is not, or not where it is
  sea?: boolean; // may be born over open water
  anomaly?: boolean; // wears an anomaly hue on purpose (the heath's rare magenta, Yuggoth's spore): at most ANOMALY_RATE a second
  fast?: boolean; // streaks past: left out when the camera shake is off (the reduced-motion choice)
}

/** The numbers of the fields. */
export const AIR_FIELD = {
  ring: [3, 15] as readonly [number, number], // metres about the investigator that a speck is born
  maxRate: 24, // specks a second, all of a realm's layers together
  anomalyRate: 1, // ...and of those that wear an anomaly hue
  alive: 380, // the most of them in the air at once: the shared pool is 4096, and a fight's bursts come first
  cone: 0.15, // a speck born toward the view (the camera's forward against the bearing, from this) is always kept...
  behind: 0.3, // ...and one born elsewhere is kept this share of the time, so a turn of the head finds air about it
  wood: 0.2, // a wooded layer's share in a clearing
  stand: 40, // metres past a court with an air of its own (data/arenaSets.ts) that its air stands in for ours
  lens: 2.4, // metres about the lens within which no speck is born, and more by size (ambientAir.clearOf)
  madness: 0.5, // from this far gone a mind sees what falls rise (the picture's own; nothing is written)
};

/** Every realm's air, a layer at a time. A realm without a row is a bug (tests/ambientAir.test.ts). */
export const AIR_FIELDS: Readonly<Record<string, readonly AirLayer[]>> = {
  hub: [
    { kind: 'leaf', tone: 'accent0', rate: 2.2, by: 'wood', dry: true }, // October leaves over the quad, russet
    { kind: 'drift', tone: 'mist', rate: 0.08, by: 'mist' },
    { kind: 'mote', tone: 'moon', rate: 0.8, pale: 0.4, by: 'dark' }, // a gnat's glint under the lamps
  ],
  // The Colour Out of Space: the heath crumbling to a fine grey powder, and now and then a spark of the colour itself
  arkham: [
    { kind: 'ash', tone: 'mist', rate: 6.5, pale: 0.4 },
    { kind: 'drift', tone: 'mist', rate: 0.16, by: 'mist' },
    { kind: 'mote', tone: [0.85, 0.12, 0.5], rate: 0.4, glow: true, anomaly: true },
  ],
  dunwich: [
    { kind: 'drift', tone: 'mist', rate: 0.22, by: 'mist' },
    { kind: 'seed', tone: 'mist', rate: 1.2, pale: 0.55, by: 'gust' },
    { kind: 'leaf', tone: 'accent0', rate: 0.6, by: 'wood', dry: true },
  ],
  innsmouth: [
    { kind: 'brine', tone: 'mist', rate: 5, pale: 0.55, sea: true, fast: true, dry: true }, // salt spray along the sea wind
    { kind: 'drift', tone: 'mist', rate: 0.16, pale: 0.3, by: 'mist', sea: true },
  ],
  providence: [
    { kind: 'leaf', tone: 'accent1', rate: 2.6, pale: 0.25, by: 'wood', dry: true },
    { kind: 'drift', tone: 'mist', rate: 0.12, by: 'mist' },
  ],
  vermont: [
    { kind: 'leaf', tone: 'accent1', rate: 5, by: 'wood', dry: true }, // the October woods: gold and rust in every gust
    { kind: 'spore', tone: 'mist', rate: 1.5, pale: 0.4, by: 'dark' },
  ],
  // At the Mountains of Madness: diamond dust in the hard light, spindrift low over the snow, flakes in the wind
  mountains: [
    { kind: 'glint', tone: 'moon', rate: 8, pale: 0.5 },
    { kind: 'streamer', tone: 'mist', rate: 3, pale: 0.7, by: 'gust', fast: true },
    { kind: 'flake', tone: 'mist', rate: 3, pale: 0.7, size: 0.08, dry: true },
  ],
  // The Shadow Out of Time: sand across the dry flat
  pnakotus: [
    { kind: 'dust', tone: 'mist', rate: 4, pale: 0.25, by: 'gust', fast: true },
    { kind: 'mote', tone: 'accent0', rate: 2, pale: 0.45 },
    { kind: 'drift', tone: 'mist', rate: 0.1, by: 'mist' },
  ],
  kn_yan: [
    { kind: 'mote', tone: 'accent0', rate: 4, glow: true, pale: 0.62 }, // blue light hung in the vault's air
    { kind: 'spore', tone: 'accent1', rate: 1.6, pale: 0.5 },
  ],
  dreamlands: [
    { kind: 'petal', tone: 'accent0', rate: 2, pale: 0.35, dry: true },
    { kind: 'mote', tone: 'accent1', rate: 1, glow: true, pale: 0.2 },
  ],
  rlyeh: [
    { kind: 'brine', tone: 'accent0', rate: 2, pale: 0.55, sea: true, fast: true },
    { kind: 'bubble', tone: 'mist', rate: 0.7, pale: 0.6, sea: true },
    { kind: 'drift', tone: 'mist', rate: 0.1, pale: 0.4, by: 'mist', sea: true },
  ],
  // Yuggoth: the spores of the Fungi, rose and rare violet
  yuggoth: [
    { kind: 'spore', tone: 'accent0', rate: 5, glow: true, pale: 0.45 },
    { kind: 'spore', tone: 'accent0', rate: 0.9, glow: true, anomaly: true },
    { kind: 'ember', tone: 'accent1', rate: 0.8, size: 0.06 },
  ],
  beyond: [
    { kind: 'mote', tone: 'accent1', rate: 3, glow: true, pale: 0.2 },
    { kind: 'spore', tone: 'accent0', rate: 1, pale: 0.6, size: 0.12 },
  ],
  // The Outer Dark: each dimension its own matter
  cloud_summit: [
    { kind: 'drift', tone: 'accent0', rate: 0.2, pale: 0.35, by: 'mist' },
    { kind: 'mote', tone: 'accent0', rate: 2, glow: true, pale: 0.2 },
  ],
  black_wood: [
    { kind: 'ash', tone: 'accent0', rate: 3, pale: 0.1 },
    { kind: 'spore', tone: 'accent0', rate: 1.5, glow: true },
  ],
  pale_lattice: [
    { kind: 'frozen', tone: 'accent0', rate: 4, glow: true }, // prisms hung in stilled time
    { kind: 'frozen', tone: 'accent1', rate: 1.5, glow: true },
  ],
  piping_dark: [
    { kind: 'note', tone: 'accent0', rate: 1.2, glow: true },
    { kind: 'spore', tone: 'accent0', rate: 1.5, pale: 0.35 },
  ],
  spheres: [
    { kind: 'bubble', tone: 'accent0', rate: 2, glow: true, pale: 0.45, sea: true },
    { kind: 'bubble', tone: 'accent1', rate: 0.8, glow: true, pale: 0.3, sea: true },
  ],
  court_centre: [
    { kind: 'ember', tone: [1, 0.5, 0.22], rate: 3, glow: true },
    { kind: 'ash', tone: 'accent1', rate: 3, pale: 0.2 },
  ],
};
