/**
 * The gates of the open arenas (round 76, asked: replace the generated gates with free ones, more thematic and animatable, each fitted to its
 * arena's story): one style for each horror's house, by the horror's id. A gate is a set of leaves, each a baked model (data/models: Poly Haven's
 * iron gate and castle door, Kenney's portcullis, the supplied packs' temple doors, menhirs, flutes, basalt and dead trees) fitted to a share of the
 * gate's opening, coloured as the arena's own stone, wood and metal are, and moved one of four ways as the investigator comes near: swung about its
 * hinge into the court, slid into the wall, lifted, or sunk into the ground. Dressing stands beside it and does not move. A gate has no frame of its
 * own: the towers and walls of the house are the frame. Rigid motion only (spec: no skeletal animation). Where it hangs, `render/gateRig.ts`; how
 * it moves, `render/gateViews.ts`; what each is and where it came from, docs/GATES.md. Data only.
 */

import type { KitId } from './kits';

type Rgb3 = readonly [number, number, number];

/** How a leaf is moved as the gate opens: swung about the hinge at its jamb into the court, slid sideways into the wall, lifted clear, or sunk into the ground; `still`: it stays. */
export type GateMotion = 'swing' | 'slide' | 'lift' | 'sink' | 'still';

/** What a part is coloured like: the stone it leans toward, how much of its own colour it keeps (0..1), and the dye of its wood, metal, bone, cloth and glow where they are not the region's (the same words as a place's pieces, world/props.ts `SetLook`). */
export interface GateLook {
  tint?: Rgb3;
  keep?: number;
  dye?: Partial<Record<'cloth' | 'metal' | 'bone' | 'glow' | 'wood', Rgb3>>;
}

/** One part of a gate: a baked model, either fitted to a share of the opening (`span`) or stood at its own proportions beside a jamb (`jamb`). */
export interface GatePart extends GateLook {
  model: string;
  span?: readonly [number, number]; // the share of the opening it covers, from -0.5 (the left jamb seen from outside) to 0.5: stretched to fit it and the opening's height
  jamb?: -1 | 0 | 1; // else stood at its own proportions at this jamb, `out` metres beyond it (0: the middle)
  out?: number;
  h?: number; // metres tall, for a part stood at its own proportions
  tall?: number; // times the opening's height, for a part that spans it (a portcullis is taller, to lift clear of it)
  base?: number; // metres it stands below the floor (a spiked foot, or a part that sinks)
  y?: number; // metres off the floor
  v?: number; // metres through the wall from its middle (+ is the side the investigator comes from)
  roll?: number; // degrees about the way through the wall (a portcullis turned over, its points up)
  thin?: number; // at most this share of the wall's thickness (default 0.9)
  move?: GateMotion; // default: the style's
  delay?: number; // 0..0.6 of the opening's time that it waits to begin (a row of pipes, one after another)
  glyphs?: boolean; // the house's glow carved on its faces (a flat leaf's: runes hung on open iron or bare trunks float in the air)
  dim?: number; // times its colours (a black stone door laid over the region's pale stone is a mid grey, not black)
}

export interface GateStyle {
  motion: GateMotion;
  open?: number; // degrees a swung leaf turns (100)
  sound: KitId; // what is heard as it moves: the dungeons' door of this kit (data/doors.ts)
  parts: readonly GatePart[];
}

/** When, in the opening's 0..1 (render/gateViews.ts), a part moves: a part with `delay` d begins at `start + stagger * d`; a swung or slid one goes on to the end, a lifted or sunk one takes `span` and is clear before the seal's collider is lifted (`PASSAGE.solidAt`, tests/gateStyles.test.ts). */
export const GATE_TIMING = { start: 0.05, stagger: 0.3, span: 0.5 } as const;

const IRON_L = 'gate_iron_l';
const IRON_R = 'gate_iron_r';
const TIMBER_L = 'gate_timber_l';
const TIMBER_R = 'gate_timber_r';

/** Two leaves of a pair, left and right seen from outside, sharing a look. */
const pair = (l: string, r: string, look: GateLook & Partial<GatePart> = {}): GatePart[] => [
  { model: l, span: [-0.5, 0], ...look },
  { model: r, span: [0, 0.5], ...look },
];

/** `n` of `models` in a row across the opening, each its own share, beginning one after another; `shift` (a share of a leaf) sets a second row between the first's. */
const row = (models: readonly string[], n: number, look: GateLook & Partial<GatePart> = {}, stagger = 0.4, shift = 0): GatePart[] =>
  Array.from({ length: shift ? n - 1 : n }, (_, i) => ({ model: models[i % models.length]!, span: [-0.5 + (i + shift) / n, -0.5 + (i + shift + 1) / n] as const, delay: (stagger * (i % 2 ? n - 1 - i : i)) / Math.max(1, n - 1), ...look }));

export const GATE_STYLES: Readonly<Record<string, GateStyle>> = {
  // The reservoir's sluice: boards of the dam's gatehouse, grey as everything the Colour touched, that drop into the culvert's slot.
  colour_out_of_space: {
    motion: 'sink', sound: 'timber',
    parts: pair(TIMBER_L, TIMBER_R, { tint: [0.62, 0.63, 0.66], keep: 0.1, base: 0.5, dye: { wood: [0.52, 0.52, 0.55], metal: [0.3, 0.3, 0.34] }, glyphs: true }),
  },
  // The ford is stopped with a stone: a block of rock between two menhirs that sinks into the earth when the sabbat is let be.
  black_man: {
    motion: 'sink', sound: 'masonry',
    parts: [
      { model: 'gate_boulder', span: [-0.5, 0.5], base: 0.5, tint: [0.34, 0.32, 0.38], keep: 0.15, glyphs: true },
      { model: 'nt_menhir_d', jamb: -1, out: 0.55, h: 4.6, move: 'still', tint: [0.34, 0.32, 0.38], keep: 0.3 },
      { model: 'nt_menhir_d', jamb: 1, out: 0.55, h: 4.6, move: 'still', tint: [0.34, 0.32, 0.38], keep: 0.3 },
    ],
  },
  // The grove has grown across its way: dead trunks, shoulder to shoulder, that draw down into the ground as one comes.
  shub_niggurath: {
    motion: 'sink', sound: 'drowned',
    parts: [
      ...row(['gt_dead_5', 'gt_dead_8', 'gt_dead_3', 'gt_dead_9', 'gt_dead_6', 'gt_dead_4'], 7, { tall: 1.25, base: 0.6, keep: 0.2, v: -0.55, dye: { wood: [0.3, 0.22, 0.2] } }, 0.35),
      ...row(['gt_dead_9', 'gt_dead_3', 'gt_dead_8', 'gt_dead_6', 'gt_dead_5', 'gt_dead_4'], 7, { tall: 1.15, base: 0.6, keep: 0.2, v: 0.55, dye: { wood: [0.26, 0.2, 0.18] } }, 0.35, 0.5),
    ],
  },
  // The porch's doors, whitewashed once and flaking, that swing in to the dusk.
  medusa_gorgon: {
    motion: 'swing', open: 105, sound: 'timber',
    parts: pair(TIMBER_L, TIMBER_R, { tint: [0.82, 0.8, 0.74], keep: 0.1, dye: { wood: [0.8, 0.78, 0.72], metal: [0.32, 0.3, 0.3] } }),
  },
  // Weathered oak and iron strap in an arch: the sea wall's gate, tarred against what the sea does to wood.
  martins_beach_horror: {
    motion: 'swing', open: 100, sound: 'drowned',
    parts: [
      ...pair(TIMBER_L, TIMBER_R, { tint: [0.5, 0.62, 0.58], dye: { wood: [0.22, 0.27, 0.25], metal: [0.2, 0.24, 0.22] } }),
      { model: 'gate_timber_frame', span: [-0.5, 0.5], tall: 1.04, move: 'still', dye: { wood: [0.2, 0.25, 0.23] } },
    ],
  },
  // The burying ground's gate: black iron gone to rust, and a little green.
  simon_orne: {
    motion: 'swing', open: 110, sound: 'brick',
    parts: pair(IRON_L, IRON_R, { dye: { metal: [0.3, 0.2, 0.15] }, keep: 0.25 }),
  },
  // A keep's two gates: the portcullis lifted into the gatehouse's span, and behind it the oak doors swung back.
  edward_hutchinson: {
    motion: 'swing', open: 100, sound: 'timber',
    parts: [
      ...pair(TIMBER_L, TIMBER_R, { tint: [0.5, 0.42, 0.38], v: -0.7 }),
      { model: 'gate_portcullis', span: [-0.5, 0.5], tall: 1.12, base: 0.3, v: 0.8, move: 'lift', dye: { metal: [0.26, 0.24, 0.26] } },
    ],
  },
  // The pylon's doors, of the temple pack's cedar and sandstone, sun on the left and the moon on the right, as wide as the door of a god.
  colossus_pyramids: {
    motion: 'swing', open: 85, sound: 'tsath',
    parts: [
      { model: 'tp_door_sun', span: [-0.5, 0], tint: [0.7, 0.58, 0.4], keep: 0.3, dim: 0.8, glyphs: true },
      { model: 'tp_door_moon', span: [0, 0.5], tint: [0.7, 0.58, 0.4], keep: 0.3, dim: 0.8, glyphs: true },
    ],
  },
  // Its jaw: the head of the Aztec serpent in profile, carved and fanged, set in the mouth of the mound before a slab of the mound's own earth, and the two go down together, as a serpent goes into the ground.
  yig: {
    motion: 'sink', sound: 'crypt',
    parts: [
      { model: 'gate_boulder', span: [-0.5, 0.5], thin: 0.3, v: -1.3, base: 0.5, tint: [0.45, 0.4, 0.3], keep: 0.2, dim: 0.7 },
      { model: 'gate_yig_head', jamb: 0, h: 6.4, y: -0.1, v: 1.2, tint: [0.82, 0.76, 0.62], keep: 0.3 },
    ],
  },
  // The mouth at the foot of the ziggurat: two leaves of basalt, green-lit, that part like lips.
  nug: {
    motion: 'slide', sound: 'basalt',
    parts: pair('tp_door_leaf', 'tp_door_leaf', { tint: [0.2, 0.2, 0.26], keep: 0, dim: 0.5, glyphs: true }),
  },
  // The quay's bronze leaves with the moon on them, gone green with the lake.
  bokrug: {
    motion: 'swing', open: 100, sound: 'tsath',
    parts: [
      { model: 'tp_door_moon', span: [-0.5, 0], tint: [0.3, 0.5, 0.42], keep: 0.2, dim: 0.7, dye: { metal: [0.42, 0.34, 0.2] } },
      { model: 'tp_door_moon', span: [0, 0.5], tint: [0.3, 0.5, 0.42], keep: 0.2, dim: 0.7, dye: { metal: [0.42, 0.34, 0.2] } },
    ],
  },
  // The circle on the peak: two of the standing stones, drawn apart.
  other_gods: {
    motion: 'slide', sound: 'cyclopean',
    parts: [
      { model: 'nt_menhir_c', span: [-0.5, 0], tint: [0.5, 0.48, 0.58], keep: 0.1, glyphs: true },
      { model: 'nt_menhir_a', span: [0, 0.5], tint: [0.5, 0.48, 0.58], keep: 0.1, glyphs: true },
    ],
  },
  // R'lyeh's door, carved with a bas-relief of what is behind it: it was not made to swing, and it does, slowly.
  cthulhu: {
    motion: 'swing', open: 80, sound: 'cyclopean',
    parts: pair('tp_door_leaf', 'tp_door_leaf', { tint: [0.35, 0.55, 0.45], keep: 0.1, dim: 0.75, glyphs: true }),
  },
  // Carcosa's gate: tall black-and-brass iron the colour of the Yellow Sign.
  hastur: {
    motion: 'swing', open: 100, sound: 'brick',
    parts: pair(IRON_L, IRON_R, { dye: { metal: [0.62, 0.5, 0.2] }, tint: [0.7, 0.62, 0.78], keep: 0.1 }),
  },
  // The crystal wall's gate: the sun and the moon in two leaves that slide apart behind the front of an alien temple, carved, with obelisks and a rose, that is split down its doorway and comes apart with them. (The front is baked turned to -z, where this gate is come to from.)
  yog_sothoth: {
    motion: 'slide', sound: 'elder',
    parts: [
      { model: 'tp_door_sun', span: [-0.5, 0], tint: [0.55, 0.6, 0.8], keep: 0, dim: 0.85, glyphs: true, v: -1 },
      { model: 'tp_door_moon', span: [0, 0.5], tint: [0.55, 0.6, 0.8], keep: 0, dim: 0.85, glyphs: true, v: -1 },
      { model: 'gate_alien_l', span: [-0.5, 0], thin: 0.7, v: 0.4, base: 0.3, tint: [0.78, 0.88, 0.97], keep: 0 },
      { model: 'gate_alien_r', span: [0, 0.5], thin: 0.7, v: 0.4, base: 0.3, tint: [0.78, 0.88, 0.97], keep: 0 },
    ],
  },
  // The Court's gate: black stone doors that go down into the floor, since nothing at the centre of all needs a hinge, and before them a ring of spikes, the corona of a black sun, that goes down with them.
  azathoth: {
    motion: 'sink', sound: 'onyx',
    parts: [
      ...pair('tp_door_leaf', 'tp_door_leaf', { tint: [0.2, 0.2, 0.32], keep: 0, dim: 0.38, glyphs: true, base: 0.4 }),
      { model: 'gate_demon_ring', span: [-0.5, 0.5], thin: 0.5, v: 1.2, base: 0.4, keep: 0, dye: { metal: [0.5, 0.32, 0.62] } },
    ],
  },
  // Yaddith's door: leaves of the alien metal of its towers, that slide into the terrace wall.
  zkauba: {
    motion: 'slide', sound: 'elder',
    parts: pair('tp_door_leaf', 'tp_door_leaf', { tint: [0.5, 0.42, 0.4], keep: 0.15, dim: 0.8, dye: { metal: [0.4, 0.34, 0.32] } }),
  },
  // The organ: a bank of the black flutes that draw down into the floor one after another, a scale played backwards.
  daemon_pipers: {
    motion: 'sink', sound: 'cyclopean',
    parts: row(['wf_flute_low'], 8, { tint: [0.22, 0.22, 0.26], keep: 0.1, base: 0.5, tall: 1.05 }, 0.5),
  },
  // The precinct of prisms: the one that was left out is a bank of basalt that sinks to make the gap.
  ancient_ones: {
    motion: 'sink', sound: 'elder',
    parts: row(['bs_mid', 'bs_a', 'bs_b', 'bs_c', 'bs_mid'], 5, { tint: [0.75, 0.78, 0.82], keep: 0.1, base: 0.6 }, 0.3),
  },
  // The hall of the black pharaoh: the eclipse of the Black Man's doors, sun and moon in black stone, swung open at the hour of your choosing.
  nyarlathotep: {
    motion: 'swing', open: 100, sound: 'onyx',
    parts: [
      { model: 'tp_door_sun', span: [-0.5, 0], tint: [0.17, 0.16, 0.2], keep: 0, dim: 0.38, glyphs: true },
      { model: 'tp_door_moon', span: [0, 0.5], tint: [0.17, 0.16, 0.2], keep: 0, dim: 0.38, glyphs: true },
    ],
  },
};
