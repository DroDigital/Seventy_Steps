/**
 * Round 78, atmosphere (render/atm/mist.ts): light in the mist. Moonlight cut into shafts and shadow wedges by whatever stands in it
 * (the moon's own depth map, read by the post pass: shaders/fogShaft.ts, render/moonShafts.ts), the lights that throw their glow somewhere
 * (a window outward, a lamp downward: render/lampAim.ts) and onto the ground (render/windowSpill.ts), and a mist that is not one sheet
 * (volumetricFog.ts, shaders/fog.ts). Every number of them is here.
 */

/** The moon's shafts: the mist's light is dimmed where the moon does not reach it (the shadows of trunks, roofs and stones carry into the air), and a little lifted where it does. */
export const SHAFT = {
  steps: 16, // taps along each pixel's ray, their start dithered as the mist's is
  reach: 34, // metres from the lens the shadows are read (the moon's map covers this much about the investigator)
  gain: 1.1, // how far the mist's light follows the share of its ray the moon reaches (the mist in full shadow keeps a twelfth of its light; the first cut, 1.4 against a floor of 0.8, lifted the gaps by a quarter and glared in the Vermont wood's stills; 3 was glare)
  floor: 0.9, // the share of its ray the moon is taken to reach on average: where the share is this the mist keeps the glow round 58 left it, so a gap in the shafts is lifted by a tenth of it at most and what stands in the moon's way only darkens
  moonLow: 0.18, // the moon's height (sine of its elevation) below which there are no shafts, and
  moonFull: 0.38, // ...from which they are whole (the course of the night keeps the moon between 0.36 and 0.9)
  moonHigh: [0.62, 0.95, 0.5] as const, // from this height the moon stands so high its shadows are short; by that, shafts fall to this share
  mistLeast: 0.012, // the low mist's density at the ground (as drawn) below which there are none, and
  mistFull: 0.05, // ...from which they are whole
  cloud: { rain: 0.55, storm: 1, gale: 0.35 } as Readonly<Record<string, number>>, // how far a spell veils the moon (at its fullest): shafts fade as it comes
  ease: 1.4, // seconds for them to come on or go
};

/** Where a light throws its glow in the mist (render/lampAim.ts): a unit direction and how sharply the light holds to it (0: all round). */
export const BEAM = {
  window: { sharp: 0.85 }, // a lit window pours outward from its glass and none behind its wall
  lamp: { sharp: 0.55 }, // a street lamp's glow hangs in a cone downward
};

/** The light a lit window lays on the ground before it (render/windowSpill.ts): a trapezoid of its colour with the dark cross of its bars. */
export const SPILL = {
  within: 28, // metres from the eye a window's light is laid
  count: 32, // windows at once, nearest first (one draw)
  reach: 4.8, // metres it runs out from the wall, of a window two metres up; it is three quarters of this for a window at the ground, and `tall` more of it for each metre a window stands over it...
  tall: 0.12, // ...(a higher window throws its light farther)
  highest: 5.5, // a window higher than this over the ground lays none
  near: 1.1, // the width it begins with at the wall...
  far: 3.4, // ...and ends with
  gain: 1.05, // its strength where it begins, of the window kind's colour (data/playTuning.ts LIGHTS; the first stills, at 0.55, lay it too faint to find on a dark street)
  fall: 1.15, // how it thins along its length (a power: 1 is even, more is a bright mouth and a long thin tail)
  lift: 0.05, // metres over the ground
  start: 0.12, // metres out from the glass that it begins
  margin: 0.25, // metres it stops short of whatever stands in its way (a wall, a fence, a tree)
  least: 0.9, // metres of room it must have to be laid at all
  bars: [0.09, 0.45, 0.05, 0.3] as const, // the mullion's width (across), where the transom lies (along), its width, and the share of the light the bars leave
  rays: 0.85, // metres over the ground that the lines sent out to find what stands in its way run, once for each window
  soft: 0.08, // the fraction of its length over which it begins (so its edge at the wall is not a cut)
  fog: 0.8, // the share of the fog it fades by (1: as much as the world)
};

/** The mist that lives (volumetricFog.ts, shaders/fog.ts). */
export const LIVING = {
  afterRain: 0.6, // thickens by this much after hard rain (as wet as the ground is, wetness.ts), and settles as the ground dries
  thickMax: 3.4, // however many things thicken it, never past this (full madness in a wood, the thickest it was before)
  gale: 2, // a full gale drives it this much faster again than a calm night (0: it does not)
  gust: 2.4, // what a full gale adds to the wind (render/weather.ts windOf: 1 on a calm night, 3.4 in a gale)
  swell: 0.5, // how much the banks thicken and thin as they roll over the land (0: they do not)
  fine: { speed: 1.5, turn: (25 * Math.PI) / 180 }, // the fine wisps are carried this much quicker than the banks, and turned this far off their way
};
