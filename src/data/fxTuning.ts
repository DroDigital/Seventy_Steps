/**
 * The look of the game's moments (playtest round 20): what a slain foe's Echoes do on their way to the
 * investigator (render/echoFx.ts, echoPath.ts), and the weight a blow has where it lands
 * (render/impactFx.ts). Lengths in metres, times in seconds.
 */

/** A foe's bounty comes away from its body as wisps, hangs a moment, then is drawn into the investigator. */
export const ECHO_FX = {
  wisps: [3, 12] as const, // fewest and most it is parted into: the fewest for a scrap, one more for each 1.6 doublings of Echoes
  doubling: 1.6,
  rise: [0.55, 1] as const, // seconds a wisp unspools upward out of the body...
  hold: [0.1, 0.5] as const, // ...and hangs there, bobbing, before it is drawn
  lift: [1.1, 2.2] as const, // metres a second it leaves the body at, slowing as it rises
  sway: 0.4, // metres a second it circles about where it left, while it rises
  speed: [2.5, 13] as const, // metres a second it is drawn at: at first, and at the most
  quicken: 9, // metres a second, each second
  turn: 5.5, // how sharply it follows its aim: the share of the way to it made good each second
  spiral: 3.2, // metres a second it turns from a straight line, easing as it nears
  arrive: 0.5, // metres from the chest that takes it in
  give: 4.5, // seconds drawn before it is taken in wherever it is
  far: 60, // metres: left this far behind (a long journey) it is taken in at once
  chest: 1.25, // metres above the feet: where the investigator takes it in
  trail: 0.8, // motes it drops a frame (at 60 a second)
  gap: 0.05, // seconds between the sounds of one gathering
};

/** The weight of the investigator's blows as they land (playtest round 20: render/audio/impact.ts and render/impactFx.ts). */
export const IMPACT = {
  weight: { base: 0.5, damage: 0.35, full: 50, heavy: 0.2, stagger: 0.1, riposte: 0.25, kill: 0.3, most: 1.4 }, // a blow's weight: where it starts, what its damage adds (up to `full` of it), what each kind of blow adds; never past `most`
  big: 0.9, // metres of body radius from which a foe is big: a kill of one booms
  sparks: [6, 18] as const, // fewest and most sparks a blow throws, by its weight
  chunks: [2, 7] as const, // and the ichor it flings
  kick: { push: 0.14, shake: 0.025, seconds: 0.22 }, // the camera's: metres it is pushed toward the blow at a weight of 1, how much it is shaken, and how long it takes to settle
  finisher: 3, // frames more hitstop for a blow that kills or lands as a riposte
};

/** Flasks of lamp oil (round 29): the glass in flight, its trail, the burst where it lands and the fire it leaves. Render only. */
export const FLASK = {
  trail: { embers: 34, smoke: 16 }, // particles a second behind a flask in flight
  burst: { fire: 40, ring: 24, shards: 16, smoke: 9, flash: 0.35 }, // particles at a landing; seconds of its flash
  fire: { tongues: 10, embers: 1.6, smoke: 0.5, glow: 2.2, fade: 0.25 }, // a burning pool: tongues, embers and smoke a second per m²; its halo (× its radius); the last share of its life it dies down in
  colour: { flame: [1, 0.55, 0.16], core: [1, 0.86, 0.45], glass: [0.5, 0.62, 0.5], smoke: [0.26, 0.24, 0.22] } as const,
  capacity: 8, // flasks drawn at once
};

/** The lantern's shadows (round 34, render/lanternShadow.ts): where the moon casts none (under a roof, in a dungeon, a moon below the horizon), one depth map is drawn from the investigator's chest in the way the camera looks, of the solid things about them. Lengths in metres. */
export const LANTERN_SHADOW = {
  size: 1024, // texels a side
  fov: 150, // degrees the map looks through: outside it a surface is lit (and the shadows fade out toward its edge)
  notch: (10 * Math.PI) / 180, // radians the map's aim steps by, and...
  hold: (17 * Math.PI) / 180, // ...how far the look must go from the aim held before it steps (round 35: so the shadows' edges do not crawl)
  near: 0.35,
  reach: 2, // how far past the lantern's own range the map looks
  height: 1.25, // above the investigator's feet that the map is drawn from: their chest, which is never inside a wall
  strength: 0.88, // the share of the lantern's light a shadow takes away (the rest leaks round: a wall is not black)
  bias: 0.06, // metres a surface is held from its own shadow, and 1 cm more for each metre from the lantern (a texel grows so)
  offset: 0.04, // metres a point is pushed off its surface along the normal before it is looked up
};

/** The lamps' shadows (round 35, render/lampShadows.ts): the nearest few torches, braziers and street lamps each cast. */
export const LAMP_SHADOWS = {
  count: 3, // lamps at a time
  size: 512, // texels a side
  fov: 150, // degrees, drawn from the flame toward the investigator
  near: 0.3,
  reach: 2, // metres past the lamp's own range the map looks
  strength: 0.85, // the share of that lamp's light a shadow takes
  bias: 0.08, // metres a surface is held from its own shadow
  offset: 0.05, // metres a point is pushed off its surface before it is looked up
  fade: 0.35, // seconds a lamp's shadow takes to come in
};

/** The moon's shadows (round 34, render/moonShadow.ts): one depth map drawn from the moon over the investigator. Lengths in metres. */
export const SHADOW = {
  size: 1536, // texels a side: with `range`, a texel is 4.4 cm (round 54: it was 1024 and 6.6 cm, which a house's foot and a trunk's are within)
  range: 34, // half the width of ground the map covers about the investigator (the shadows fade out toward its edge)
  depth: 160, // how far the map looks along the moon's rays, about the investigator
  strength: 0.94, // the share of the moon's light a shadow takes away (the rest is the sky's, and what the land gives back)
  bias: 0.035, // metres a surface is held from its own shadow, more where it turns from the moon (round 54: 0.07, which left a hand's breadth of lit ground, a gap, under a wall's foot)
  offset: 0.06, // metres a point is pushed off its surface along the normal before it is looked up (round 54: 0.12)
};

/** Eyes out of the mist (round 35, render/creatureViews.ts): in a mist, a creature that sees the investigator shows its eyes from far off, glowing out of it. */
export const FOG_EYES = {
  from: 0.03, // the mist's thickness (density at the ground) from which they come
  span: 0.05, // ...to full over this much more
  reach: 38, // metres past the usual eye glow range at full mist
  boost: 0.55, // more glow
  swell: 0.9, // and a larger halo
  sees: 0.3, // how plainly it must see the investigator (perception.ts `sight`)
  rise: 1.4, // per second: the eyes come out over a second...
  fall: 0.7, // ...and go back over two
};

/**
 * The marks a boss's blow lays on the ground (round 70, asked: "more subtle in design and fade away quicker after the attack landed";
 * render/decals.ts, groundFx.ts). The edge is thinner and the fill, the hatching, the flash and the outline are quieter, so a mark
 * says where the blow falls without covering the floor; what a blow leaves goes sooner. Each is a share of what it was.
 */
export const INDICATOR = {
  edge: 0.1, // metres: the width of a mark's bright edge (0.16)
  line: 0.72, // how much of its light the edge and the front of the fill keep
  body: 0.6, // ...the fill, the ring band, the swirl and the hatching
  flash: 0.5, // ...the flash and pulse of a mark that is full, as the blow falls
  outline: 0.6, // ...the dark line about an edge
  scar: 0.3, // a scar's life (seconds): burnt ground goes in a third of the time
  sigil: 0.6, // a sigil's life, held and let go
};

/** How the picture is lit and finished (round 39, render/shaders/post.ts and world.ts): what the shadow maps cannot give. */
export const LIGHTING = {
  ao: { strength: 0.85, radius: 0.75, reach: 55 }, // contact shadow: the share of light a crease, a foot, the base of a wall loses at most; metres it looks about; metres from the lens it fades out by
  bloom: { strength: 0.95, from: 0.58, knee: 0.3, radius: 7 }, // what shines bleeds into what is about it: the strength, the brightness it begins at, how soft the start is, low-res pixels it spreads
  vignette: 0.42, // how much the picture's corners darken, so the eye is kept toward the middle
  sky: 1.05, // the ambient on a surface facing straight up (the sky's), against... (round 54: 1.3 and 0.55, which left shade too bright against what the light reaches)
  ground: 0.38, // ...one facing straight down (what the dark ground gives back)
  sheen: { stone: 0.35, power: 30 }, // stone catches a restrained glint; rain adds its own wet sheen
  flicker: { lantern: 0.045, speed: 7 }, // how much the lantern's light breathes, and how fast
};

/**
 * Where things meet the ground (round 54; world/groundContact.ts, render/terrainMesh.ts, render/baseCover.ts): a house, a tree or a stone is not set
 * on the land like a model on a table. The terrain about its foot is darkened and turned toward bare earth in its vertices, an irregular
 * edge to it, and a few roots, tufts and pebbles stand where the two meet. Lengths in metres.
 */
export const GROUND_CONTACT = {
  dark: 0.62, // the share of its light the ground loses at the very foot of a thing, falling away smoothly to its reach (no ring, no halo)
  soil: 0.7, // how far the ground's tint is turned to bare earth at the foot
  earth: [0.5, 0.38, 0.28] as readonly [number, number, number], // the earth's tint (the terrain's own tints are about this bright)
  reach0: 1.1, // how far from a footprint's edge the ground is touched: this, ...
  reachPer: 0.55, // ...and this much more for each metre of the thing's own size (its radius, or the root of its two half-sides)...
  reachMax: 3.4, // ...at most this far
  wobble: 0.45, // metres by which the earth's edge is broken up by noise: a patch, not a ring
  minSize: 0.2, // things slimmer than this (a lamp post, a cross, a fence) leave no mark
  cover: { tufts: 0.7, roots: 4 }, // the plants about a base: tufts to each metre of reach, and roots about a tree's foot (render/baseCover.ts)
};


/**
 * Lights that last a moment (round 83, render/flashLights.ts): the flash at the heart of a foe's blow and a foe's bolt in flight light the ground, the bodies and the mist about them. They take the slots of the farthest of the world's own lamps, so no shader gets a loop longer.
 * Round 84 (XDro: the hit flashes were too much, and a blow of the investigator's already lights the creature it lands on): the investigator's shot and blow lay no light, only a foe's blows, shots and bolts do, and the lights are small and short: the strongest is about a torch's (1.1; a fire is 1.8, a street lamp 2.6), the usual about half of it.
 */
export const FLASH_LIGHTS = {
  slots: 2, // the most at once
  reach: 46, // metres from the investigator: farther, none is chosen
  attack: 0.03, // seconds a flash takes to come to its height (a fall as quick and as long as its life follows)
  burst: { strength: 0.7, per: 0.12, most: 1.2, range: 3, rangePer: 1.2, rangeMost: 10, seconds: 0.2 }, // the flash at the heart of a foe's blow: by its radius
  bolt: { strength: 0.5, per: 0.25, most: 1, range: 3, rangePer: 1.2, rangeMost: 6.5, seconds: 0.1 }, // a foe's bolt of light or fire in flight, kept up each frame
  white: 0.35, // how much of white is mixed into a blow's colour (a light is not a hue: nothing it falls on reads as an anomaly)
} as const;

/** The mist a moving body carves (round 83, render/mistWakes.ts, shaders/fog.ts): the low mist parts before and about whatever moves through it, closes slowly behind it in a trail, and turns about its edge. Metres. */
export const MIST_WAKES = {
  slots: 8, // the most at once (the nearest moving bodies; the investigator's is always one)
  reach: 44, // metres from the lens: farther, none is laid
  minSpeed: 0.7, // metres a second a body must move at to part it
  fullSpeed: 4.5, // ...and the pace at which it parts it wholly
  radius: [0.9, 6] as readonly [number, number], // its breadth: the body's own, at least and at most
  trail: 1.1, // seconds of its travel the trail behind it is long...
  trailMost: 4.5, // ...at most this many metres
  strength: 0.72, // the share of the mist it clears at its heart, at the most
  turn: 0.9, // how far the mist is turned about its edge: this much of its breadth
  height: 3.2, // the height the mist is parted to
} as const;

/**
 * Prints in soft ground and what a body's breath and feet raise (round 83; render/creatureTracks.ts, render/creatureAir.ts). The ground a
 * region has underfoot decides it: how dark a print is, how long it keeps, the colour it is pressed in; only soft ground keeps one.
 */
export const PRINTS = {
  capacity: 220, // the most prints at once (the oldest is taken over)
  reach: 32, // metres from the lens that bodies are tracked and prints laid
  minSpeed: 0.5, // metres a second a body must move at to leave one
  stride: [0.45, 1.1] as readonly [number, number], // metres between the prints of one body: this, and this much more for each metre of its radius
  soft: {
    snow: { strength: 0.62, seconds: 80, tint: [0.2, 0.23, 0.34] },
    mud: { strength: 0.7, seconds: 55, tint: [0.075, 0.06, 0.05] },
    sand: { strength: 0.4, seconds: 26, tint: [0.34, 0.26, 0.18] },
    dirt: { strength: 0.34, seconds: 20, tint: [0.13, 0.1, 0.075] },
    leaves: { strength: 0.26, seconds: 14, tint: [0.1, 0.07, 0.05] },
    grass: { strength: 0.16, seconds: 9, tint: [0.06, 0.1, 0.07] },
  } as Readonly<Record<string, { strength: number; seconds: number; tint: readonly [number, number, number] }>>,
  fade: 0.45, // the share of a print's life it fades over at the end
} as const;

/** The cold breath and the dust of a hard run (render/creatureAir.ts). */
export const BODY_AIR = {
  reach: 14, // metres from the lens that a body breathes a cloud
  breathSeconds: [2.2, 3.4] as readonly [number, number], // between one breath and the next: this, and this much more, by the body
  breath: { color: [0.82, 0.86, 0.9] as readonly [number, number, number], alpha: 0.26, size: 0.16, grow: 3, seconds: 1.15 },
  dustSpeed: 3.6, // metres a second a body must run at to raise dust from dry ground
  dustSeconds: 0.5, // between its puffs
  dustReach: 22,
} as const;

/** A horror's presence in the picture (render/bossPresence.ts, bossFootfalls.ts, creatureViews.ts). */
export const BOSS_PRESENCE = {
  height: 4, // metres: a body this tall, or any that is fought as a horror, leaves footfalls
  minSpeed: 1.2, // metres a second it must walk at
  stride: 0.55, // a stride's length, in its heights
  least: 0.12, // the least presence (render/presence.ts presenceOf) at which a stride is felt
  shake: 0.035, // metres of camera jolt at a stride, for a body of eight metres at its foot
  voiceAttack: 0.06, // seconds a voice's loudness takes to rise in the picture...
  voiceRelease: 0.2, // ...and to fall
  breathe: 0.016, // the share of its height a picture swells by at the loudest of its voice, its feet kept where they are
  eyes: 1.6, // how much brighter its eyes burn at the loudest, and
  glints: 2.4, // its glints' gain
  deepGlints: 0.8, // the share more its glints burn in its last phase than in its first
  bodyGlow: 0.12, // how much brighter a colossus's built body is lit in its last phase and in a loud word
  halo: { size: 0.9, gain: 0.34 }, // the halo about its body in the colour of its blows, in its heights, and how bright in its last phase
} as const;

/** What a person has that moves of itself (render/figureGaze.ts, figureSway.ts, figureBlink.ts, personLife.ts, the world shader; round 83): the people met only. No run-lean, no breathing, no sway of the body. The investigator's lantern and scarf are the player rebuild's. */
export const FIGURE_LIFE = {
  gaze: {
    range: 7, // metres a person sees the investigator from
    near: 0.6, // and does not look at them closer than
    turn: 0.9, // rad a head turns, at most; beyond it the body is the body's
    reach: 2.4, // rad off their front at which the eyes let go, fading from `turn`
    pitch: 0.25, // rad, up or down
    follow: 7, release: 4, // per second: how quick the head comes round, and goes back
  },
  wet: [0.05, 0.09] as readonly [flat: number, up: number], // how much darker a person's cloth is in a soaking rain, and the more that surfaces facing the sky take (the world shader)
  dust: 0.8, // the share of the realm's matter (snow, drifted sand, soot) that lies on what faces up on a person met out of doors (the world shader)
  /** What hangs loose, by kind: the lean (rad) a whole breeze, a walking pace and a hard turn each give it, the most it leans, its spring (per s²) and damping (per s), and how it flutters (rad, per s). A hat is carried on the head, so it leans the other way. */
  loose: {
    hat: { wind: 0.07, walk: 0.05, turn: 0.035, most: 0.13, spring: 120, damp: 10, flutter: [0.012, 2.3] },
    shawl: { wind: 0.16, walk: 0.1, turn: 0.07, most: 0.3, spring: 55, damp: 6.5, flutter: [0.02, 1.7] },
    scarf: { wind: 0.34, walk: 0.24, turn: 0.15, most: 0.55, spring: 40, damp: 4.5, flutter: [0.05, 2.9] },
    tail: { wind: 0.1, walk: 0.0, turn: 0.1, most: 0.22, spring: 50, damp: 6, flutter: [0.015, 1.9] },
  },
  slice: 1 / 120, // seconds: the spring is stepped in slices this long, so it settles the same at any frame rate
  gale: 2.2, // the world's wind (uWind) at which the cloth is blown as hard as it goes
  blink: { cell: 4.2, shut: 0.14, doze: 0.88 }, // seconds in which each person blinks once (somewhere in it), the length of a blink, and how nearly shut the eyes of one dozing on their feet are
} as const;

/** What a merchant shows of the wares they still have to sell (render/personLife.ts; round 83): the rare ones, in their coat, while any is left. */
export const WARE_SHOWN = {
  star_stone: { x: 0.095, y: 0.47, z: 0.143, size: 0.05, glow: 0.55 }, // a star-stone pinned to the lapel
  vial: { x: -0.115, y: 0.33, z: 0.14, glow: 0.12 }, // a silver vial in the breast pocket
} as const;

/** The blob shadow's shape (render/blobShape.ts; round 83). */
export const BLOB = {
  dark: 0.55, // how dark at its heart
  base: 1.7, // its radius, in the radii of the body's capsule
  grow: 1.8, // the most a body painted wider than its capsule widens it (the colossi are painted 1.3 to 1.65 times wider)
  draw: 1.0, // how much longer it is drawn out away from the moon at the horizon than from the zenith
  most: 1.8, // and the most it is drawn out
  shift: 0.6, // the share of what it is drawn out by that its middle moves, away from the moon
  thin: 0.25, // how much lighter it is for each whole length drawn out
} as const;

/** The track of a blow (render/swingTrails.ts; round 83). */
export const SWING_TRAIL = {
  samples: 14, // the last few edges kept
  life: 0.2, // seconds a sample lasts
  alpha: 0.55, // its brightness when laid
  width: 0.45, // metres of the weapon's length, back from its point, that the ribbon spans
  color: [0.82, 0.86, 0.96] as readonly [number, number, number],
  lead: 2, tail: 3, // frames before the blow's first active frame and after its last that the edge is followed
} as const;
