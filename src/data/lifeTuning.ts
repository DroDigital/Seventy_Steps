/**
 * Tunable numbers for the world's own life (re-exported by tuning.ts; split from playTuning.ts in
 * playtest round 24): how creatures sense and hunt, the small lives, and lightning.
 */

/** How creatures sense and hunt (playtest round 8, systems/perception.ts, brain.ts, tactics.ts). Metres and seconds. */
export const AI = {
  sure: 12, // what a creature sees in its sight cone this close it knows at once...
  notice: 1.1, // ...beyond, a glimpse takes this long to be sure of (longer the farther, at the edge of its sight about twice)
  side: 6, // beside or behind it, it glimpses only what is this close, slowly
  forget: 6, // an unconfirmed stir fades over this long
  noise: { walk: 5, sprint: 14, roll: 10, blow: 12, shot: 34 }, // how far the investigator's sounds carry...
  muffle: 0.5, // ...a wall between halving them
  call: 16, // a creature that takes up the hunt rouses its kind this far off (those within half come at once)
  track: 1.6, // hunting, it keeps its quarry in sight this far beyond its sight's reach (× its `aggro`)
  lose: 1.5, // out of sight and hearing this long, a hunter goes to look where it last knew its quarry...
  search: 7, // ...and looks about there this long before it goes home
  stalk: 0.55, // share of its pace a stirred creature closes in at
  lookEvery: [3, 7] as const, // an idle creature that keeps its post looks about every so often
  amble: 0.35, // share of its pace a foe on its rounds walks at (round 18: roam.ts; how far, its archetype's `roam`)...
  linger: [3, 9] as const, // ...and seconds it lingers, looking about, before it moves on
  rangedGap: 130, // frames a creature rests after a ranged blow before its next blow of any kind (round 45: a skirmisher fired as fast as it swung)
  volleyGap: 30, // frames between one foe's ranged blow ending and another's beginning at the investigator, and never two at once: a pack shoots in turn
  tokens: 2, // hunters closing in to strike the investigator at once; the rest keep off, circling, waiting their turn
  wait: 4.5, // how far the waiting ones keep (at least this far beyond their reach)
  space: 1.1, // hunters keep this far apart (beyond their bodies)
  punish: 0.5, // a hunter strikes into an opening (a swallow, a blow's recovery, a stagger) once this share of its cooldown has passed
  fallBack: 0.6, // seconds a skirmisher falls back after its blow
  stuck: 0.5, // pushing this long without getting anywhere...
  detour: 0.7, // ...it steps aside this long to get round what blocks it
};

/** The world's small lives (playtest round 18: data/fauna.ts gives each its size, pace and nerve; render/critterLife.ts their ways). */
export const FAUNA = {
  near: 1, // chunks about the investigator's own whose critters live (a 3 × 3 block)
  draw: 70, // metres: drawn this near the lens
  flight: 6, // seconds a startled bird is on the wing before the dark has it...
  goneFor: [18, 45] as const, // ...and seconds before a startled critter may come back...
  backBeyond: 24, // ...then only while the investigator is this far from its haunt
  fade: 1, // seconds it takes to show again
  shot: 32, // metres: a shot sends off every bird and beast this near it...
  blow: 10, // ...a blow struck, those this near
  cryGap: 0.5, // seconds: startled together, only one cries
  fog: 0.4, // share of the world's fog they take: a bird against the night sky is a dark shape, not a pale fleck like a star
  pass: 16, // seconds a flock or a great winged thing takes to cross the sky (data/fauna.ts SKY_VISITORS)...
  passBy: [10, 24] as const, // ...passing this far from the investigator at its nearest, low enough to cross the horizon's haze
};

/** Lightning where storms roll (round 18: render/lightning.ts): now and then the sky flashes, and the thunder follows. */
export const LIGHTNING = {
  every: { dunwich: [35, 100], innsmouth: [50, 140], rlyeh: [20, 60], mountains: [70, 170] } as Readonly<Record<string, readonly [number, number]>>, // the old regions' strikes in rain and gale (a thunderstorm, any region, is stormEvery)
  stormEvery: [12, 38] as const, // seconds between flashes in a thunderstorm (round 52)
  storm: 0.65, // rain or gale must have gathered this much before lightning rolls through it (a thunderstorm: stormGather)
  stormGather: 0.35,
  inside: 0.35, // the share of a thunderclap that reaches through a dungeon's roof
  flash: 0.45, // seconds of flicker
  light: 1.8, // how much it lights the world (added to the moon; the ambient takes half)...
  sky: 7, // ...brightens the sky's haze...
  mist: 0.3, // ...and the mist
  delay: [0.6, 3.2] as const, // seconds before the thunder: the farther the strike, the later and quieter
};

/**
 * A strike that falls on the ground (round 52; systems/skyStrikes.ts): now and then in a thunderstorm a spot near the investigator
 * (sometimes near a foe) is marked by a ring of crackling light, and a bolt falls on it a moment after. It hurts whoever stands in it,
 * the investigator and the foes alike; a body out of the ring is untouched, and a roll through the last moment's fall is as good as a
 * step aside.
 */
export const SKY_STRIKE = {
  gather: 0.6, // how much of a storm must have gathered before the ground is struck
  first: [8, 24] as const, // seconds from a storm's gathering to its first strike
  every: [28, 75] as const, // seconds between strikes after
  warn: 90, // frames the ring is shown before the bolt falls (1.5 s: a walk takes a body 6 m clear)
  radius: 3.4, // metres: the ring, and what the bolt reaches
  near: [3, 24] as const, // metres from the investigator a strike may fall
  hunt: 0.3, // the share of strikes that fall near a foe instead (one within `scan` metres of the investigator)
  scan: 30,
  player: 55, // damage to the investigator (of 160)
  foe: [40, 0.2, 320] as const, // damage to anything else: a base, and a share of its health, to a cap
  poise: 90, // poise damage: the bolt staggers all it strikes
};

/** The night's turn and the weather (round 26; systems/clock.ts, systems/weather.ts): the night is one long night that turns, and the weather rolls over it. */
export const CLOCK = {
  night: 1080, // seconds for the night to turn (the gloaming, the deep of the night, the hour before a dawn that does not come) and begin again
  start: 0.3, // where in it a new journey opens: round 35, the deep of the night, not the gloaming (a bright violet sky and a land lit plain to see were no night)
};

/** The light under a dungeon's roof (round 40: it followed the moon's course, the clock's darkness and the grey of the last hour, so a roofed room was a different place at different hours, and washed out when the moon stood high): fixed at the night's start, whatever the hour, and eased in and out at the door. */
export const DUNGEON_LIGHT = {
  dark: 0.35, // the share of the night's darkness a roofed room with no gloom takes (it keeps its ambient legible)...
  deep: 1, // ...and the share the deepest gloom takes, of all of it (round 58: every room took the first, and the lantern was a decoration; world/gloom.ts, data/kits.ts)
  moon: 0.55, // the share of the moon's light that reaches the stone: it has no roof to shine through, only a high slant from the start of the night...
  moonDeep: 0.06, // ...and in the deepest gloom (round 58)
  refuge: 0.35, // the most gloom a room with an Elder Sign keeps: a place to rest, and to be seen resting (round 58)
  arena: 0.5, // and a horror's arena: a fight is read by what the horror throws and by its braziers (round 58)
  adapt: 0.15, // the eye widens without a lantern: the darkness, in a room or on the road, is this much less of what it was where the lantern has gone out (render/lanternLife.ts; round 58)
  ease: 1.3, // 1/s: how fast the room's light takes over from the open sky's (and back) as the camera passes a door
};

/** How dark the night is kept (round 35: it was too bright to be creepy; render/realmLook.ts): at its deepest the sky, the mist, the far land and both lights are this much of what a realm's look gives them. */
export const NIGHT_DARK = { sky: 0.16, mist: 0.11, far: 0.13, ambient: 0.09, moon: 0.11, fog: 0.2 }; // (round 58, "the open world at night lacks darkness": it was 0.24, 0.28, 0.3, 0.2 and 0.28, and the mist alone lit the road: only the lantern, the lamps and the moon's shapes are seen now; `fog`: what the volumetric mist's own light keeps of itself at the deepest, which no floor reached before, and it was the glow of most of the night's picture)

export const WEATHER = {
  first: [300, 780] as const, // seconds of clear sky at the start of a game or a load, before the weather is first chosen (it was chosen at once: one load in four began in rain)
  calm: [240, 840] as const, // seconds of clear skies between spells (round 52: 60 to 220, from 150 to 420, because a test of two hours saw no storm; round 53: too many, it rained 45% of the time)
  spell: [100, 260] as const, // seconds a spell of rain, a thunderstorm or a gale lasts
  ease: 12, // seconds for a spell to come on or pass
  clear: 1.3, // the odds of clear skies against all the region's weather together: another calm follows a calm 1 time in 4
  // The kinds each region knows, by weight (the rest of the time it is clear): rain, a thunderstorm, a gale, the motes of the dream.
  regions: {
    hub: { rain: 5, storm: 3, gale: 1 },
    arkham: { rain: 4, storm: 3, gale: 1 },
    dunwich: { rain: 3, storm: 3, gale: 2 },
    innsmouth: { rain: 4, storm: 3, gale: 2 },
    providence: { rain: 5, storm: 2, gale: 1 },
    vermont: { rain: 4, storm: 2, gale: 2 },
    mountains: { gale: 5, storm: 1 },
    pnakotus: { gale: 4, storm: 1 },
    rlyeh: { rain: 3, storm: 4, gale: 1 },
    dreamlands: { motes: 3 },
    yuggoth: { motes: 2 },
  } as Readonly<Record<string, Readonly<Partial<Record<'rain' | 'storm' | 'gale' | 'motes', number>>>>>,
  quiet: 0.35, // how much of the investigator's noise is lost in it (a rain hushes footsteps; a gale takes them): at its fullest
  rain: 420, // streaks of rain about the lens at its fullest (a thunderstorm: rainStorm)
  rainStorm: 680,
  soak: 0.3, // per second, how fast the ground takes the wet of a rain falling (render/weather.ts; round 34)...
  dry: 0.04, // ...and how slowly it dries once it has passed: puddles are gone in about a minute
  haze: { rain: 0.32, storm: 0.5, gale: 0.12 } as Readonly<Record<string, number>>, // how much of the fog's reach a spell takes at its fullest: the rain closes the world in
};

/** What the people say to themselves as the investigator passes (round 34; data/overheard.ts, systems/overheard.ts). */
export const HEARD = {
  range: 6.5, // metres within which a muttering is overheard
  every: 1500, // frames between one overheard and the next, whoever it is (25 s): none is a wall of text
  look: 30, // frames between looks for someone near
  seen: 1.55, // metres above the ground that the line of sight is taken at, both ends
  shown: 6, // seconds a line is shown
};

/** The sights that cross the dream (round 26; data/wanderers.ts, systems/wanderers.ts). */
export const WANDER = {
  every: 600, // frames between looks for a moment to send one
  chance: 0.22, // of a look that finds the ground clear
  from: [70, 105] as const, // metres from the investigator a file comes out of the dark at...
  pass: [18, 38] as const, // ...and passes them at, at the nearest
  apart: 2.1, // metres between one and the next in a file
  leave: 150, // metres the investigator may be off before it is gone
  stay: 300, // seconds it lasts at the most
};

/** The first hour's hook (round 26; systems/hook.ts): seconds of play before something vast is first heard, and again. */
export const HOOK = { first: 150, second: 780 };

/** What a page sketches (round 26; systems/survey.ts) and the pale columns over Elder Signs not yet found (render/beacons.ts). */
export const SURVEY = {
  reach: 900, // metres: how far off the nearest unfound sign may be for a page to sketch the way to it
  radius: 70, // metres of ground drawn in about it
  beacon: { see: 340, near: 30, height: 60, width: 1.6 }, // how far a column shows, how near it fades, how tall and broad it is
};
