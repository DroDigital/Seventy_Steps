/**
 * The frame of each gate between realms (round 104, asked: "make all the frames of the portals in the game look way better and more
 * themed into the environment/region they are leading"): every gate stood in the one grey frame of two boxes and a lintel. Each now
 * wears the look of where it leads (render/gateFrames*.ts build them): the expedition's sledge-gate is crusted with the ice of the
 * Mountains of Madness, the Alert's opens through R'lyeh's leaning cyclopean stone, the gate out of the Stairs of Slumber is the
 * gnarled wood it opens on. Keyed by the gate's id; the model a gate is put with is `gate:<frame>`. Data only.
 */

export const GATE_FRAMES = [
  'miskatonic', 'antarctic', 'pnakotic', 'serpent', 'dolmen', 'fungoid', 'farmstead', 'cyclopean', 'reef',
  'wood', 'ivory', 'onyx', 'void', 'storm', 'goat', 'crystal', 'pipes', 'spheres', 'chaos',
] as const;
export type GateFrame = (typeof GATE_FRAMES)[number];

/** Each gate's frame: the look of the realm it opens onto. */
export const GATE_FRAME: Readonly<Record<string, GateFrame>> = {
  hub_antarctic: 'antarctic', // to the Mountains of Madness
  hub_australia: 'pnakotic', // to Pnakotus
  mountains_gate: 'miskatonic', // home to the university
  pnakotus_gate: 'miskatonic',
  dunwich_mound: 'serpent', // down into blue-litten K'n-yan
  knyan_gate: 'dolmen', // up into the Round Hills
  vermont_cylinder: 'fungoid', // to Yuggoth
  yuggoth_gate: 'farmstead', // home to Akeley's hills
  innsmouth_alert: 'cyclopean', // to R'lyeh
  rlyeh_gate: 'reef', // home to Devil Reef
  dream_deeper: 'wood', // out of the stairs into the Enchanted Wood
  dream_wood_gate: 'ivory', // back up the Stairs of Slumber: the gate of horn and ivory
  beyond_gate: 'onyx', // to Kadath's onyx castle
  dream_ultimate: 'void', // through to the Ultimate Void
  cloud_in: 'void',
  beyond_cloud: 'storm', // to the Cloud Summit
  wood_in: 'storm',
  cloud_out: 'goat', // to the Black Wood
  lattice_in: 'goat',
  wood_out: 'crystal', // to the Pale Lattice
  flute_in: 'crystal',
  lattice_out: 'pipes', // to the Piping Dark
  spheres_in: 'pipes',
  flute_out: 'spheres', // to the Gate of Spheres
  court_in: 'spheres',
  spheres_out: 'chaos', // to the Court at the Centre
};

export const isGateFrame = (s: string): s is GateFrame => (GATE_FRAMES as readonly string[]).includes(s);

/** The model a gate is put with: its frame's. */
export const gateModel = (id: string): string => `gate:${GATE_FRAME[id] ?? 'miskatonic'}`;
