/**
 * Round 124, every dungeon's own sound (asked: "in almost every dungeon you always hear a loud splashing/dripping sound which is nice
 * inherently but can be boring because of overusage in a lot of different dungeons across different areas"). The vaults were three
 * soundscapes by their kit's sound (data/samples.ts DUNGEON_AMBIENCE), and the "cave" one, a cave's roar under a grotto's drips (five and a
 * half drops a second, the brightest and sharpest thing in the room), was every crypt, cellar, brick vault, mine, archive and stair of the
 * dream. Now each roofed kit has its own beds and spots (KIT_AMBIENCE): the beds are the recordings and those made in code
 * (render/audio/bedTextures.ts: `gen_still`, `gen_trickle`, `gen_embers`, `gen_hum`, `gen_abyss`), the spots the recorded sets and the
 * recipes of data/roomSounds.ts; and a dungeon may add a voice of its own tale to its kit's (DUNGEON_ACCENTS, by the dungeon or by
 * `dungeon/kit`). Water drips where there is water: the drowned halls keep the grotto (breathing, at under half its level), the brick vaults run
 * with it, and elsewhere a drop is a seep, one drop from one place a few times over, now and then, and then still. render/audio/roomAmbience.ts
 * puts a room's together. The beds of each kit sum to within a few decibels of the old cave and grotto, A-weighted (-32 to -37 dB against
 * its -33), without the grotto's sharp drops, so a footfall carries over them. Data only.
 */

import type { KitId } from './kits';
import type { RoomSoundId } from './roomSounds';
import type { Ambience, SampleSetId, Spot } from './samples';

type Range = readonly [number, number];

/** A recipe now and then, at `gain`, through `lowpass` (Hz) if it comes through a wall. */
const R = (recipe: RoomSoundId, every: Range, gain: number, lowpass?: number): Spot => ({ recipe, every, gain, ...(lowpass && { lowpass }) });
/** A recording now and then, the same way. */
const S = (set: SampleSetId, every: Range, gain: number, lowpass?: number): Spot => ({ set, every, gain, ...(lowpass && { lowpass }) });
/** A seep: drops from one place, three to seven of them a couple of seconds apart, at one pitch (a big drop or a small one), then still. */
const seep = (gain = 0.65, every: Range = [45, 100]): Spot => ({ recipe: 'drop', every, gain, pitch: [0.75, 1.3], run: { count: [3, 7], gap: [1.6, 3.4] } });
const room = (beds: Ambience['beds'], spots: readonly Spot[]): Ambience => ({ beds, spots, roofed: true });

/** Each roofed kit's soundscape (a kit under the sky has none: its rooms keep the region's own). */
export const KIT_AMBIENCE: Readonly<Partial<Record<KitId, Ambience>>> = {
  // Dressed stone under a vault: the cave far off, the shut air, a seep now and then, the stones taking their weight.
  masonry: room([['gen_still', 0.5], ['cave', 0.3]], [seep(), R('settle', [40, 90], 0.75), R('dust', [35, 80], 0.5), S('chains', [70, 150], 1)]),
  // A tomb: dry and dead still, a faint moan of air under its door. Dust, the stones, a rat in the wall, bones shifting; water hardly ever.
  crypt: room([['gen_still', 0.6], ['wind_ghost', 0.1]], [R('dust', [30, 70], 0.55), R('settle', [40, 90], 0.75), R('skitter', [50, 110], 0.55, 4500), S('rattle', [80, 170], 0.25, 2600), seep(0.5, [90, 180])]),
  // A house's cellar: damp brick and earth under the boards; the house above creaking and something heavy moving up there, rats, a drip.
  cellar: room([['gen_still', 0.55], ['cave', 0.15]], [seep(0.6), R('skitter', [35, 80], 0.6, 4500), S('squeak', [70, 150], 0.7, 3500), S('creak', [25, 60], 0.8, 1600), R('thud', [70, 160], 0.9, 700)]),
  // Old brick vaults and sewers: water running in a channel, drops, chains, rats, a gurgle in a drain.
  brick: room([['gen_trickle', 0.32], ['cave', 0.3]], [seep(0.6, [30, 70]), S('gurgle', [40, 90], 0.8, 2200), S('chains', [60, 130], 1), R('skitter', [40, 90], 0.55, 4500)]),
  // The Mi-Go's tunnels: the hum of what they keep running, grit loosed from the rock, the props taking the weight, their buzzing far off.
  mine: room([['cave', 0.55], ['gen_hum', 0.32]], [R('pebbles', [25, 60], 0.6), S('timber', [40, 90], 0.9), R('whir', [45, 100], 0.55, 2200), S('buzz', [60, 140], 0.45, 2000), seep(0.5, [80, 160])]),
  // The Great Race's archives: basalt, dry and vast; the desert's wind down some shaft far above, the stone settling, dust, a far thud.
  basalt: room([['gen_still', 0.5], ['wind_ghost', 0.16], ['cave', 0.2]], [R('settle', [35, 75], 0.8), R('dust', [30, 70], 0.5), R('thud', [60, 140], 1, 600), R('draught', [45, 100], 0.7)]),
  // The drowned halls: here the water drips (the grotto, breathing, at under half its old level) and runs, and something turns in it beyond the wall.
  drowned: room([['cave', 0.45], ['drips', 0.42], ['gen_trickle', 0.2]], [S('gurgle', [20, 45], 1), S('chains', [60, 120], 1), R('swell', [60, 140], 1, 500)]),
  // The seventy steps of light slumber: warm stone, the dream's murmur below, a draught, a small bell somewhere.
  dream: room([['murmur', 0.35], ['gen_still', 0.35]], [R('draught', [30, 70], 0.65), R('chime', [45, 100], 0.5), R('settle', [70, 150], 0.6)]),
  // The Cavern of Flame: a great fire's roar, its snaps, a sheet of flame rolling up the wall, the priests' chant far off.
  dreamflame: room([['gen_embers', 0.8], ['cave', 0.22]], [R('crackle', [10, 25], 0.7, 5000), R('flare', [25, 60], 0.9), S('chant', [70, 150], 0.35, 800)]),
  // The seven hundred steps: grey air moving down the stair, the murmur thinner, a whisper, the bell again far below.
  dreamdeep: room([['wind_ghost', 0.3], ['gen_still', 0.4], ['murmur', 0.15]], [R('draught', [25, 60], 0.7), S('whisper', [80, 170], 0.8, 2000), R('chime', [60, 140], 0.4), R('settle', [50, 110], 0.6)]),
  // The span over the dreamless dark: the void's wind, wings in it, something vast moving far below.
  dreamabyss: room([['gen_abyss', 0.55], ['wind_ghost', 0.35]], [S('wings', [35, 80], 1.6), S('rumble', [60, 130], 0.8, 300), R('draught', [25, 60], 0.75), S('whisper', [90, 180], 0.7, 1800)]),
  // A house of boards: the wind outside, the frame creaking, a shutter knocking, mice in the walls.
  timber: room([['wind', 0.3]], [S('creak', [18, 45], 1), S('timber', [30, 70], 1), R('knock', [50, 120], 0.6, 2200), R('skitter', [50, 110], 0.45, 4000)]),
  // A townhouse: the street's wind muffled, the boards, the house's own quiet, a mouse, a shutter.
  townhouse: room([['wind', 0.22], ['gen_still', 0.3]], [S('creak', [20, 50], 1), S('timber', [40, 90], 1), R('skitter', [60, 130], 0.4, 4000), R('knock', [80, 160], 0.45, 1800)]),
  // The library: books drink the sound; a page turned somewhere, the boards, a draught at the tall windows.
  library: room([['gen_still', 0.4], ['wind', 0.15]], [R('leaf', [40, 90], 0.6, 3000), S('creak', [30, 70], 0.9), R('draught', [60, 130], 0.5)]),
  // A church: high and hollow, the wind at the broken windows, wings in the steeple, the old wood.
  church: room([['wind', 0.3], ['gen_still', 0.3]], [S('creak', [25, 60], 1), S('timber', [45, 100], 1), S('wings', [50, 110], 1.4), R('draught', [30, 70], 0.7)]),
  // A marble tower in the dream: stillness, a draught, a small bell, dust in the light.
  marble: room([['wind', 0.25], ['murmur', 0.2]], [R('draught', [30, 70], 0.65), R('chime', [50, 110], 0.5), R('dust', [40, 90], 0.45)]),
};

/** What a dungeon of its own tale adds to its kit's (by the dungeon's id, or `dungeon/kit` for its rooms of one kit). */
export const DUNGEON_ACCENTS: Readonly<Record<string, Partial<Pick<Ambience, 'beds' | 'spots'>>>> = {
  curwen_catacombs: { spots: [S('chant', [80, 170], 0.4, 700), S('chains', [60, 130], 1)] }, // Curwen's rites under Pawtuxet
  outsider_crypt: { spots: [S('whisper', [70, 150], 0.8, 2200)] },
  hound_churchyard: { spots: [S('farHowl', [90, 190], 0.5, 650), S('bat', [60, 130], 0.4, 3000)] }, // the hound baying above, and the bats it comes apart into
  swamp_tomb: { spots: [S('frog', [50, 110], 0.35, 900), seep(0.6, [40, 90])] }, // the swamp seeping in
  alchemist_cellars: { spots: [S('gurgle', [45, 100], 0.6, 1800), R('clink', [70, 150], 0.45, 5000)] }, // the alchemist's retorts
  red_hook_vaults: { spots: [S('chant', [70, 150], 0.45, 800)] }, // the rites under Red Hook
  witch_house: { spots: [S('squeak', [50, 110], 0.8, 3800), R('skitter', [30, 70], 0.6, 4500)] }, // Brown Jenkin in the walls
  yhanthlei: { spots: [S('chant', [80, 170], 0.4, 650)] }, // the Deep Ones at their rites
  starry_wisdom: { spots: [S('whisper', [80, 170], 0.7, 2000)] }, // what waits in the dark of the steeple
  munoz_rooms: { spots: [R('pump', [40, 90], 0.9, 900)] }, // "Cool Air": the machine that keeps Dr. Muñoz cold, behind the wall
  whateley_farm: { spots: [R('thud', [40, 90], 1, 600)] }, // something heavy shifting upstairs
  old_man_house: { spots: [R('clink', [50, 110], 0.5, 5000)] }, // the Terrible Old Man's bottles
  waite_house: { beds: [['surf', 0.2]] }, // Innsmouth's sea beyond the walls
  shunned_cellar: { spots: [S('groan', [80, 170], 0.6, 500)] }, // what lies under the Shunned House
  rue_dauseil: { beds: [['wind_ghost', 0.22]] }, // the wind from Zann's window, which opens on nothing
};
