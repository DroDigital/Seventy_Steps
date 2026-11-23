/**
 * What the horrors' deaths let loose (data/bossDeaths.ts; render/bossDeathFx.ts spawns them): each a handful of the particles the
 * world already has, sized and sped for a man-sized body and grown with a greater one. Data only.
 *   size, life, rise   [least, most]: metres across, seconds, metres a second up (less than nought: down)
 *   out                metres a second away from the body; `swirl` about it; `wind` along the view, to the right
 *   spread             the share of the body's breadth about the spot it is born in (0.5)
 *   floor              it lands on the ground and lies there, as what falls from a blow does
 */

type Rgb = readonly [number, number, number];
/** The particle shapes a matter may take (render/particles.ts PARTICLE_SHAPES; tests/bossDeaths.test.ts holds them to it). */
export type MatterShape = 'disc' | 'shard' | 'streak' | 'ring' | 'spark' | 'wisp' | 'rune' | 'eye' | 'bubble' | 'feather' | 'petal' | 'note' | 'puff' | 'crescent' | 'lash' | 'dash';

export interface Matter {
  color: readonly Rgb[]; // one of them for each, at random
  end?: Rgb; // the colour it dies in
  shape?: MatterShape; // a disc unless said
  size: readonly [number, number];
  life: readonly [number, number];
  rise: readonly [number, number];
  out?: number;
  spread?: number;
  gravity?: number;
  drag?: number;
  glow?: boolean;
  alpha?: number; // at birth (0.9)
  grow?: number; // × its size at its end (0.4)
  hold?: number; // the share of its life at its full alpha
  spin?: number; // radians a second, either way
  floor?: boolean;
  swirl?: number;
  wind?: number;
}

const m = (o: Matter): Matter => o;
const BLACK: Rgb = [0.04, 0.04, 0.05];

export const MATTER = {
  // the shoggoth: its pustule eyes, the bubbles of it, its black iridescent slime
  eyes_green: m({ color: [[0.3, 0.9, 0.56], [0.24, 0.78, 0.5]], shape: 'eye', size: [0.16, 0.28], life: [0.5, 1.2], rise: [0, 0.2], out: 0.15, spread: 0.6, glow: true, hold: 0.4 }),
  bubbles_black: m({ color: [[0.1, 0.11, 0.13], [0.16, 0.15, 0.2]], shape: 'bubble', size: [0.1, 0.24], life: [0.4, 0.9], rise: [0.2, 0.8], out: 0.4, spread: 0.7, alpha: 0.8, grow: 1.6 }),
  slime_black: m({ color: [BLACK, [0.08, 0.08, 0.12]], size: [0.07, 0.15], life: [2, 3.5], rise: [0.5, 1.6], out: 1.2, gravity: 7, floor: true, hold: 0.6 }),
  // the polyps: the last gale, raising the dust
  wind_dust: m({ color: [[0.72, 0.72, 0.7], [0.6, 0.6, 0.58]], shape: 'dash', size: [0.14, 0.3], life: [0.5, 1], rise: [0, 0.3], out: 7, spread: 0.4, drag: 0.6, alpha: 0.6 }),
  // the Colour: the stream up out of the well, the little of it that falls back, the grey it leaves
  colour_stream: m({ color: [[0.86, 0.32, 0.72], [0.55, 0.32, 0.95], [0.78, 0.86, 0.95]], shape: 'streak', size: [0.08, 0.16], life: [0.7, 1.4], rise: [9, 17], out: 0.3, spread: 0.35, glow: true, hold: 0.5 }),
  colour_remnant: m({ color: [[0.86, 0.32, 0.72]], shape: 'spark', size: [0.12, 0.18], life: [1.6, 2.4], rise: [-1.2, -0.6], out: 0.1, glow: true, hold: 0.6 }),
  grey_dust: m({ color: [[0.55, 0.55, 0.53], [0.47, 0.47, 0.45]], size: [0.05, 0.1], life: [2.5, 4], rise: [0.2, 0.9], out: 0.8, spread: 1.4, gravity: 1, floor: true, drag: 0.8 }),
  // the Whateleys: the greenish-yellow ichor, the stench, the powder of Ibn Ghazi that let it be seen
  ichor_yellow: m({ color: [[0.5, 0.48, 0.16], [0.42, 0.4, 0.12]], size: [0.06, 0.12], life: [1.5, 2.5], rise: [0.8, 2], out: 1.4, gravity: 9, floor: true }),
  stench: m({ color: [[0.42, 0.44, 0.2], [0.36, 0.38, 0.18]], shape: 'wisp', size: [0.4, 0.8], life: [2, 4], rise: [0.2, 0.5], out: 0.3, spread: 0.8, alpha: 0.3, grow: 2.6 }),
  powder: m({ color: [[0.8, 0.74, 0.56], [0.7, 0.66, 0.5]], size: [0.04, 0.08], life: [1.6, 3], rise: [0.3, 1.2], out: 0.9, spread: 1.2, glow: true, drag: 0.9, alpha: 0.7 }),
  // the witch-house: the chain of the crucifix, the angles, a little bone, the motes of the violet light
  chain: m({ color: [[0.86, 0.86, 0.9], [0.7, 0.7, 0.76]], shape: 'spark', size: [0.05, 0.09], life: [0.3, 0.6], rise: [0.2, 0.8], out: 1.4, spread: 0.3, glow: true }),
  angles: m({ color: [[0.62, 0.32, 0.95], [0.48, 0.24, 0.8]], shape: 'dash', size: [0.12, 0.24], life: [0.6, 1.1], rise: [0.4, 1.1], out: 0.6, spread: 0.6, glow: true, spin: 1.5 }),
  bone: m({ color: [[0.82, 0.78, 0.68], [0.7, 0.66, 0.58]], shape: 'shard', size: [0.05, 0.09], life: [3, 4.5], rise: [0.6, 1.4], out: 1, gravity: 9, floor: true, hold: 0.8, spin: 6 }),
  violet_motes: m({ color: [[0.62, 0.32, 0.95], [0.5, 0.3, 0.86]], shape: 'spark', size: [0.06, 0.1], life: [1, 1.8], rise: [0.3, 0.9], out: 0.4, glow: true }),
  dust: m({ color: [[0.6, 0.57, 0.5], [0.5, 0.48, 0.43]], shape: 'puff', size: [0.2, 0.4], life: [1, 2], rise: [0.1, 0.4], out: 0.7, spread: 0.6, alpha: 0.45, grow: 2.2 }),
  // the dark that runs out of a shape, the essential salts, the names struck through
  ink: m({ color: [BLACK, [0.07, 0.06, 0.09]], shape: 'wisp', size: [0.3, 0.6], life: [1.6, 3], rise: [0.05, 0.3], out: 0.7, spread: 0.8, alpha: 0.6, grow: 3 }),
  salts: m({ color: [[0.56, 0.6, 0.66], [0.5, 0.54, 0.6]], size: [0.03, 0.06], life: [2.5, 4], rise: [-0.3, 0.2], out: 0.25, spread: 0.6, gravity: 2.5, floor: true, hold: 0.7 }),
  salts_pit: m({ color: [[0.5, 0.53, 0.52], [0.6, 0.62, 0.6]], size: [0.04, 0.08], life: [2, 3.5], rise: [-0.2, 0.3], out: 0.3, spread: 0.7, gravity: 3, floor: true, hold: 0.7 }),
  letters: m({ color: [[0.14, 0.12, 0.1], [0.22, 0.2, 0.17]], shape: 'rune', size: [0.1, 0.16], life: [1.4, 2.4], rise: [-0.3, 0.2], out: 0.4, spread: 0.6, gravity: 1.2, drag: 1.4, spin: 2, floor: true }),
  // fire: embers, a castle's stones, smoke, a torch's flames, the glass of a phial
  embers: m({ color: [[1, 0.5, 0.15], [0.9, 0.3, 0.1], [1, 0.7, 0.3]], end: [0.2, 0.08, 0.04], shape: 'spark', size: [0.06, 0.11], life: [1.4, 2.8], rise: [1, 3], out: 1.8, glow: true, gravity: -0.3, drag: 0.4 }),
  debris: m({ color: [[0.42, 0.38, 0.33], [0.32, 0.29, 0.26]], shape: 'shard', size: [0.1, 0.22], life: [2, 3], rise: [2, 5], out: 5, gravity: 12, floor: true, spin: 7, hold: 0.7 }),
  smoke: m({ color: [[0.18, 0.17, 0.18], [0.28, 0.27, 0.28]], shape: 'puff', size: [0.4, 0.8], life: [3, 5], rise: [0.6, 1.3], out: 0.4, spread: 0.6, alpha: 0.45, grow: 2.8 }),
  flames: m({ color: [[1, 0.62, 0.22], [1, 0.42, 0.12]], end: [0.3, 0.1, 0.05], shape: 'spark', size: [0.1, 0.2], life: [0.4, 0.9], rise: [1.4, 3], out: 0.4, spread: 0.7, glow: true, gravity: -1, grow: 0.2 }),
  glass: m({ color: [[0.86, 0.92, 0.96], [0.7, 0.8, 0.86]], shape: 'shard', size: [0.04, 0.09], life: [2, 3.5], rise: [0.8, 2.2], out: 1.6, gravity: 10, floor: true, spin: 9, hold: 0.7 }),
  glass_glints: m({ color: [[0.9, 0.95, 1]], shape: 'spark', size: [0.05, 0.08], life: [0.4, 0.8], rise: [0, 0.3], out: 0.2, spread: 0.8, glow: true }),
  // the rotting and the cold: the body that could not hold, the note, the frost, the breath
  rot: m({ color: [[0.2, 0.17, 0.1], [0.26, 0.24, 0.15]], size: [0.06, 0.12], life: [2, 3], rise: [-0.2, 0.4], out: 0.5, gravity: 8, floor: true, hold: 0.6 }),
  note: m({ color: [[0.86, 0.83, 0.72]], shape: 'petal', size: [0.22, 0.3], life: [4, 5], rise: [0.2, 0.6], out: 0.4, gravity: 0.5, drag: 1.6, spin: 2.4, floor: true, hold: 0.8 }),
  frost: m({ color: [[0.86, 0.93, 1], [0.72, 0.84, 0.96]], shape: 'shard', size: [0.04, 0.09], life: [1.5, 3], rise: [0, 0.6], out: 0.8, gravity: 3, floor: true, glow: true }),
  cold_breath: m({ color: [[0.86, 0.9, 0.94]], shape: 'wisp', size: [0.3, 0.6], life: [1.6, 2.8], rise: [0.3, 0.8], out: 0.3, spread: 0.6, alpha: 0.3, grow: 2.4 }),
  slime_dark: m({ color: [[0.1, 0.11, 0.09], [0.14, 0.13, 0.1]], size: [0.06, 0.13], life: [2, 3.5], rise: [-0.2, 0.6], out: 0.6, gravity: 8, floor: true, hold: 0.6 }),
  // light and the dark that flies it: smoke, the burning eye
  black_smoke: m({ color: [BLACK, [0.08, 0.08, 0.1]], shape: 'wisp', size: [0.3, 0.6], life: [1.4, 2.4], rise: [1, 2.4], out: 0.4, spread: 0.7, alpha: 0.65, grow: 2.4 }),
  burning_eye: m({ color: [[1, 0.5, 0.15]], shape: 'eye', size: [0.5, 0.6], life: [1.2, 1.4], rise: [0.1, 0.2], glow: true, hold: 0.5, grow: 0.6 }),
  // the Whisperer: the face and hands it wore, and the fungus of it going up
  flesh: m({ color: [[0.78, 0.62, 0.56], [0.7, 0.56, 0.5]], shape: 'petal', size: [0.12, 0.2], life: [2.5, 3.5], rise: [0, 0.4], out: 0.4, gravity: 4, floor: true, spin: 3, hold: 0.8 }),
  spores_pink: m({ color: [[0.72, 0.52, 0.5], [0.62, 0.44, 0.44]], shape: 'wisp', size: [0.14, 0.26], life: [1.6, 2.6], rise: [0.6, 1.4], out: 0.3, spread: 0.6, alpha: 0.6, grow: 1.8 }),
  // the Hound: the retinue of great bats, the jade amulet
  bats: m({ color: [[0.05, 0.05, 0.06], [0.1, 0.09, 0.1]], shape: 'crescent', size: [0.24, 0.4], life: [1.4, 2.4], rise: [1.6, 3.6], out: 2.6, spread: 0.6, drag: 0.2, spin: 4 }),
  jade: m({ color: [[0.36, 0.72, 0.5]], shape: 'spark', size: [0.12, 0.16], life: [5, 6], rise: [0.6, 1], out: 0.3, gravity: 9, floor: true, glow: true, hold: 0.85 }),
  // eyes that open and shut
  eyes_pale: m({ color: [[0.9, 0.88, 0.75], [0.8, 0.78, 0.66]], shape: 'eye', size: [0.18, 0.32], life: [0.8, 1.6], rise: [0, 0.2], out: 0.2, spread: 0.8, glow: true, hold: 0.4 }),
  eye_great: m({ color: [[0.9, 0.92, 0.8]], shape: 'eye', size: [0.9, 1.1], life: [1.4, 1.6], rise: [-0.3, -0.2], glow: true, hold: 0.5, grow: 0.3 }),
  // acid and its fumes, the fungus withered to grey powder
  acid_fume: m({ color: [[0.76, 0.72, 0.3], [0.66, 0.64, 0.28]], shape: 'wisp', size: [0.3, 0.6], life: [1.6, 2.8], rise: [0.7, 1.5], out: 0.3, spread: 0.7, alpha: 0.45, grow: 2.6 }),
  nitre: m({ color: [[0.7, 0.7, 0.66], [0.6, 0.6, 0.57]], size: [0.04, 0.07], life: [3, 4.5], rise: [0.1, 0.5], out: 0.6, spread: 1.6, gravity: 1.5, floor: true, hold: 0.7 }),
  // Red Hook: the golden pedestal, the oily water, her phosphorescence
  gold: m({ color: [[0.95, 0.78, 0.36], [0.85, 0.66, 0.3]], shape: 'spark', size: [0.06, 0.1], life: [0.6, 1.2], rise: [0.6, 1.6], out: 1, gravity: 6, glow: true }),
  oily_bubbles: m({ color: [[0.14, 0.2, 0.2], [0.2, 0.26, 0.24]], shape: 'bubble', size: [0.08, 0.18], life: [0.6, 1.2], rise: [0.3, 0.8], out: 0.3, spread: 0.8, alpha: 0.75 }),
  phosphor: m({ color: [[0.78, 0.95, 0.82], [0.66, 0.86, 0.74]], size: [0.05, 0.09], life: [1, 2], rise: [0.1, 0.5], out: 0.3, spread: 0.6, glow: true, alpha: 0.8 }),
  // Zann's window: the pages the wind takes, the space alive with motion
  pages: m({ color: [[0.88, 0.85, 0.75], [0.8, 0.77, 0.68]], shape: 'petal', size: [0.2, 0.28], life: [2.4, 3.6], rise: [0.6, 2], out: 0.4, spread: 0.6, drag: 0.3, spin: 3.4, wind: 4.5 }),
  void_stars: m({ color: [[0.78, 0.8, 0.95], [0.6, 0.62, 0.85]], shape: 'spark', size: [0.05, 0.09], life: [0.8, 1.5], rise: [-0.2, 0.2], out: 0.6, spread: 0.8, glow: true }),
  // the high-priest's yellow silken mask
  silk: m({ color: [[0.86, 0.74, 0.32]], shape: 'petal', size: [0.4, 0.5], life: [5, 6], rise: [0.3, 0.5], out: 0.3, gravity: 0.7, drag: 1.8, spin: 1.6, floor: true, hold: 0.85 }),
  // the sand under the Sphinx
  sand: m({ color: [[0.74, 0.64, 0.46], [0.66, 0.56, 0.4]], size: [0.04, 0.08], life: [1.5, 2.5], rise: [-0.6, 0.2], out: 0.3, spread: 0.8, gravity: 6, floor: true }),
  sand_cloud: m({ color: [[0.72, 0.63, 0.47]], shape: 'puff', size: [0.6, 1], life: [2, 3.2], rise: [0.2, 0.6], out: 1, spread: 1, alpha: 0.4, grow: 2.6 }),
  // the sea: spray, brine, foam, bubbles, a whirl, the brood let go
  brine: m({ color: [[0.72, 0.84, 0.9], [0.86, 0.93, 0.96]], shape: 'bubble', size: [0.08, 0.17], life: [1.4, 2.2], rise: [1.6, 3.4], out: 1.4, spread: 0.8, gravity: 7, alpha: 0.8 }),
  spray: m({ color: [[0.8, 0.88, 0.9], [0.9, 0.95, 0.96]], shape: 'disc', size: [0.06, 0.12], life: [1, 1.8], rise: [2, 4.5], out: 2.4, spread: 0.9, gravity: 9, alpha: 0.8 }),
  foam: m({ color: [[0.84, 0.9, 0.88], [0.92, 0.95, 0.94]], shape: 'bubble', size: [0.12, 0.24], life: [1.6, 3], rise: [0, 0.3], out: 1.4, spread: 1.2, floor: true, alpha: 0.8 }),
  bubbles_sea: m({ color: [[0.7, 0.82, 0.86]], shape: 'bubble', size: [0.08, 0.2], life: [0.8, 1.6], rise: [0.6, 1.4], out: 0.3, spread: 1, alpha: 0.75 }),
  whirl: m({ color: [[0.6, 0.78, 0.76], [0.78, 0.88, 0.88]], shape: 'dash', size: [0.14, 0.26], life: [1, 1.8], rise: [-0.2, 0.3], out: 0.1, spread: 1.4, swirl: 4, drag: 0.2, alpha: 0.8 }),
  brood: m({ color: [[0.4, 0.86, 0.72], [0.5, 0.92, 0.8]], shape: 'spark', size: [0.08, 0.14], life: [2, 3.2], rise: [0.6, 1.6], out: 0.6, spread: 1, glow: true }),
  acrid: m({ color: [[0.32, 0.42, 0.3], [0.38, 0.46, 0.34]], shape: 'puff', size: [0.9, 1.6], life: [3, 5], rise: [0.4, 1], out: 0.8, spread: 0.9, alpha: 0.5, grow: 2.6 }),
  // Carcosa's tatters and the Yellow Sign
  tatters: m({ color: [[0.78, 0.68, 0.3], [0.66, 0.58, 0.26]], shape: 'lash', size: [0.2, 0.36], life: [1.4, 2.4], rise: [0.3, 1.2], out: 0.3, spread: 0.7, drag: 0.3, spin: 2, wind: 3.5 }),
  yellow_sign: m({ color: [[0.9, 0.78, 0.36]], shape: 'rune', size: [1, 1.2], life: [1.6, 1.8], rise: [0.1, 0.2], glow: true, hold: 0.5, grow: 1.2 }),
  // N'kai's black ooze, the drops of the black twin, the pale brood of the other
  ooze: m({ color: [BLACK, [0.07, 0.06, 0.1]], shape: 'disc', size: [0.1, 0.2], life: [2.4, 4], rise: [0, 0.2], out: 1.2, spread: 0.8, floor: true, drag: 0.6, hold: 0.7 }),
  drops_black: m({ color: [BLACK, [0.08, 0.08, 0.1]], size: [0.06, 0.12], life: [0.8, 1.4], rise: [-2, -0.6], out: 0.1, spread: 0.7, gravity: 14, floor: true }),
  brood_pale: m({ color: [[0.78, 0.76, 0.7], [0.68, 0.66, 0.6]], shape: 'puff', size: [0.1, 0.18], life: [1.6, 2.6], rise: [0.4, 1], out: 2.2, spread: 0.6, gravity: 6, floor: true }),
  // Mu: the rubble that shuts the fortress, its grey dust
  rubble: m({ color: [[0.34, 0.33, 0.31], [0.42, 0.41, 0.38]], shape: 'shard', size: [0.12, 0.26], life: [1.5, 2.5], rise: [-1, 0.4], out: 0.8, spread: 1, gravity: 12, floor: true, spin: 5 }),
  stone_dust: m({ color: [[0.46, 0.45, 0.42]], shape: 'puff', size: [0.6, 1.1], life: [2, 3.4], rise: [0.2, 0.7], out: 1.2, spread: 1, alpha: 0.45, grow: 2.6 }),
  marble: m({ color: [[0.88, 0.87, 0.82], [0.8, 0.79, 0.74]], shape: 'shard', size: [0.05, 0.11], life: [2.5, 4], rise: [0.2, 1], out: 0.7, gravity: 10, floor: true, spin: 6, hold: 0.7 }),
  // the waxwork, the grass the serpent goes into and the skin it leaves, the lake's mist
  wax: m({ color: [[0.84, 0.78, 0.62], [0.76, 0.7, 0.55]], size: [0.05, 0.1], life: [2, 3.4], rise: [-0.4, 0.1], out: 0.2, spread: 0.7, gravity: 5, floor: true, hold: 0.7 }),
  grass: m({ color: [[0.36, 0.38, 0.28], [0.44, 0.44, 0.32]], shape: 'dash', size: [0.08, 0.14], life: [0.8, 1.4], rise: [0.6, 1.6], out: 1.2, gravity: 6, floor: true, spin: 6 }),
  skin: m({ color: [[0.74, 0.7, 0.58], [0.66, 0.62, 0.5]], shape: 'lash', size: [0.4, 0.6], life: [6, 7], rise: [0, 0.2], out: 0.4, gravity: 6, floor: true, hold: 0.85 }),
  lake_mist: m({ color: [[0.5, 0.6, 0.55], [0.58, 0.66, 0.62]], shape: 'wisp', size: [0.6, 1.1], life: [3, 5], rise: [0.3, 0.7], out: 0.5, spread: 1.2, alpha: 0.35, grow: 2.8 }),
  // the gods' clouds, the flutes' notes, the spheres, the light of the Gate
  cloud: m({ color: [[0.76, 0.76, 0.8], [0.66, 0.66, 0.7]], shape: 'puff', size: [0.8, 1.4], life: [3, 5], rise: [0.2, 0.6], out: 0.5, spread: 1, alpha: 0.45, grow: 2 }),
  notes: m({ color: [[0.86, 0.8, 1], [0.7, 0.6, 0.95]], shape: 'note', size: [0.18, 0.3], life: [1.6, 2.6], rise: [0.4, 1.2], out: 0.9, spread: 0.8, glow: true }),
  globes: m({ color: [[0.72, 0.52, 1], [0.86, 0.76, 1], [0.6, 0.84, 0.9]], shape: 'ring', size: [0.3, 0.6], life: [0.6, 1.2], rise: [-0.2, 0.3], out: 0.4, spread: 1, glow: true, grow: 0.1 }),
  gate_motes: m({ color: [[0.96, 0.88, 0.62], [0.9, 0.8, 0.5]], shape: 'spark', size: [0.06, 0.11], life: [1.6, 2.6], rise: [0.5, 1.2], out: 0.3, spread: 0.7, glow: true }),
  // the Black Goat's thousand young, the crawling chaos's threads
  young: m({ color: [[0.06, 0.06, 0.05], [0.1, 0.1, 0.08]], shape: 'puff', size: [0.14, 0.24], life: [1.4, 2.4], rise: [0.8, 1.6], out: 3.4, spread: 0.6, gravity: 7, floor: true }),
  threads: m({ color: [BLACK, [0.08, 0.07, 0.1]], shape: 'lash', size: [0.3, 0.5], life: [1, 1.8], rise: [0, 0.1], out: 4, spread: 0.3, drag: 0.8, floor: true, alpha: 0.85 }),
  // the Gorgon's braid of black hair, crawling off on its own; the Kingsport fog; the night-wind
  hair: m({ color: [BLACK, [0.1, 0.08, 0.09]], shape: 'lash', size: [0.3, 0.5], life: [2, 3], rise: [0, 0.4], out: 1.6, spread: 0.4, gravity: 4, floor: true, spin: 3, drag: 0.4 }),
  sea_fog: m({ color: [[0.68, 0.7, 0.72], [0.6, 0.62, 0.64]], shape: 'puff', size: [0.7, 1.2], life: [3.5, 5.5], rise: [0.1, 0.4], out: 0.4, spread: 1, alpha: 0.38, grow: 2.4 }),
  night_wind: m({ color: [[0.5, 0.52, 0.56], [0.42, 0.44, 0.48]], shape: 'wisp', size: [0.3, 0.5], life: [1.2, 2], rise: [0.2, 0.6], out: 0.2, spread: 0.8, alpha: 0.4, grow: 2, wind: 4 }),
} as const satisfies Readonly<Record<string, Matter>>;

export type MatterId = keyof typeof MATTER;
