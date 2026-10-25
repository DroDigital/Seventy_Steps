/**
 * Round 78, atmosphere: the rooms the investigator's ears are in, and the walls between them and what sounds (numbers only;
 * render/audio/spacePlan.ts reads where the investigator stands against SPACES, render/audio/space.ts plays them, and
 * render/audio/occlusion.ts reads OCCLUSION). Before this every one-shot went dry to the bus: a footfall in a vault and a
 * footfall in a field were one sound, and a ghoul behind a wall was as clear as one in the room.
 *
 * A space sends a share of the one-shots (and of the bed) into two convolution reverbs made in code, a short ROOM (wood,
 * plaster, a close corner) and a long HALL (stone, a vault, a drowned hall), and says how dark their answer is. The impulses
 * are made to carry one unit of energy, so `room` and `hall` are the share of a sound's amplitude that comes back: 0.2 is a
 * reverb 14 dB under the dry.
 */

import type { KitId } from './kits';
import type { RoomKind } from './dungeons';

export interface SpaceRow {
  room: number; // amplitude into the short reverb
  hall: number; // amplitude into the long one
  dark: number; // Hz at which the answer is low-passed
  pre: number; // ms before the room answers
  bed: number; // how much of the bed (drones, ambience, far calls) is sent
}

/** The places a sound can be heard in. */
export const SPACES = {
  open: { room: 0.025, hall: 0.055, dark: 6500, pre: 12, bed: 0.08 }, // the fields: nearly dry, a thin far slap
  ruin: { room: 0.07, hall: 0.15, dark: 5000, pre: 16, bed: 0.14 }, // walls but no roof: a ruin's courts
  timber: { room: 0.22, hall: 0.035, dark: 5000, pre: 8, bed: 0.15 }, // a house of boards: short and woody
  library: { room: 0.16, hall: 0.05, dark: 4200, pre: 9, bed: 0.12 }, // books drink the tail
  nave: { room: 0.09, hall: 0.34, dark: 4800, pre: 26, bed: 0.22 }, // a church or a marble hall: high, hard, long
  vault: { room: 0.08, hall: 0.36, dark: 3400, pre: 22, bed: 0.25 }, // dressed stone under a roof of stone: the dark tail
  cave: { room: 0.06, hall: 0.42, dark: 2600, pre: 30, bed: 0.28 }, // rock all round, and an end nowhere
  drowned: { room: 0, hall: 0.5, dark: 1500, pre: 34, bed: 0.3 }, // everything held long and dull, as under water
  cosmos: { room: 0, hall: 0.28, dark: 2400, pre: 44, bed: 0.3 }, // the Outer Dark and the Beyond: an endless faint hall
  fight: { room: 0.04, hall: 0.24, dark: 4200, pre: 20, bed: 0.2 }, // a horror's fog closed behind: one sealed hall of its own
} satisfies Record<string, SpaceRow>;

export type SpaceId = keyof typeof SPACES;

/** What each dungeon kit sounds like inside (data/kits.ts). A kit under the open sky is a ruin, not a room. */
export const KIT_SPACE: Readonly<Record<KitId, SpaceId>> = {
  masonry: 'vault',
  library: 'library',
  timber: 'timber',
  townhouse: 'timber',
  cellar: 'vault',
  mine: 'cave',
  brick: 'vault',
  crypt: 'vault',
  church: 'nave',
  marble: 'nave',
  hill: 'open',
  drowned: 'drowned',
  sunken: 'drowned',
  elder: 'ruin',
  basalt: 'vault',
  tsath: 'ruin',
  dream: 'vault',
  onyx: 'ruin',
  cyclopean: 'drowned', // sunken R'lyeh, whose geometry does not behave
  fungoid: 'ruin',
  void: 'cosmos',
};

/** Regions whose open air is a space of its own (the rest are `open`). */
export const REGION_SPACE: Readonly<Record<string, SpaceId>> = {
  beyond: 'cosmos',
  cloud_summit: 'cosmos',
  black_wood: 'cosmos',
  pale_lattice: 'cosmos',
  piping_dark: 'cosmos',
  spheres: 'cosmos',
  court_centre: 'cosmos',
};

/** How the shape of a dungeon room changes its space: a corridor is close, a wide hall opens, a pit or a well rings. */
export const ROOM_SHAPE: Readonly<Record<RoomKind, { room: number; hall: number; dark: number }>> = {
  corridor: { room: 1.3, hall: 0.6, dark: 1 },
  hall: { room: 1, hall: 1, dark: 1 },
  stair: { room: 1, hall: 0.9, dark: 1 },
  pit: { room: 0.8, hall: 1.6, dark: 0.8 },
  bridge: { room: 0.6, hall: 1.2, dark: 1 },
  well: { room: 0.8, hall: 1.6, dark: 0.8 },
};
export const WIDE_HALL = 1.4; // a great hall of three cells to a side: its long reverb x this

/** The reverbs and how they are played. */
export const SPACE = {
  room: { seconds: 0.9, rt60: 0.55, early: [5, 9, 14, 20, 27, 36], damp: 1.0 }, // the impulse's length, its fall of 60 dB, its early reflections (ms) and how soon its highs die
  hall: { seconds: 4.2, rt60: 3.1, early: [11, 19, 31, 47, 68, 96], damp: 0.8 },
  hallMost: 0.7, // the long reverb's wet is never more than this, whatever a room's shape adds to a space's
  hpHz: 180, // the send's low cut: a rumble is not sent into a vault
  slide: 0.4, // seconds: the time constant of a space's gains and tone (a threshold is heard over about a second)
  preSlide: 0.9, // and of the pre-delay, which glides slower (a glide in a delay bends the pitch of what it carries)
  paused: 0.4, // the share of the wet kept in a menu: a vault's tail does not carry the menu's sounds
  every: 0.1, // seconds between looks at where the investigator stands
  sfx: 1, // the one-shots' tap into the send
  safety: { low: 28, hold: 6, back: 40, backHold: 20 }, // the convolvers go off when the frames average under `low` for `hold` seconds, and back when over `back` for `backHold`
};

/** Walls between the investigator and a sound (render/audio/occlusion.ts). */
export const OCCLUSION = {
  gain: 0.45, // the share of a sound's level a wall takes at its fullest: never silent
  cutoff: [18000, 700] as readonly [number, number], // Hz: the low-pass of a sound heard clear (none), and of one wholly behind stone; between, by octaves, along `curve` (a wall in the line, 0.7, comes to about 1.5 kHz)
  curve: 0.75,
  blocked: 0.7, // a wall, a hill or a great stone in the line
  roof: 0.4, // one of the two under a roof and the other not, the line clear (through a doorway)
  roofBlocked: 0.8, // and with a wall in the line as well
  fog: 1, // a horror's fog wall between: a wall indeed
  near: 3, // metres: nearer than this nothing is shut off (the investigator's own sounds, what is at their elbow)
  keepFrames: 15, // simulation frames a look is kept (a quarter second)
  cell: 0.5, // metres: a sound's place is the cell it falls in, for the keeping
  perFrame: 12, // rays cast in a frame at most
  thick: 0.45, // metres: a wall is a box this thick and...
  tall: 2, // ...this tall (a fence, a low wall and a post do not stop a sound), or a column of this radius
  great: 1.2,
};
