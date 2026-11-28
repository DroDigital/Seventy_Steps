/**
 * The numbers of the dungeons' level design (round 127, asked: the dungeons designed the way Souls levels are; docs/LEVEL_DESIGN.md):
 * the second ways between rooms (world/dungeonLinks.ts), a shortcut's barred door (systems/shortcuts.ts, render/shortcutViews.ts), the
 * foes that lie in wait (systems/ambush.ts) and a body come off a ledge (systems/drops.ts). Re-exported by tuning.ts. Data only.
 */

/** The second ways between rooms (round 127: data/dungeons.ts `LinkDef`, world/dungeonLinks.ts). */
export const LINK = {
  dropLeast: 1.2, // metres a drop falls at the least (less is a step, and would be climbed)...
  dropMost: 2.4, // ...and at the most: its doorway, lintel and all, stays under the lower room's ceiling (DUNGEON.height - lintel)
  windowMost: 3.2, // metres two rooms a window joins may differ: it stays under the lower one's ceiling
  windowWidth: 2.4,
  windowSill: 1.1, // above the higher floor: a body cannot pass, an eye can
  windowTop: 2.7,
};

/** A shortcut's barred door (round 127: systems/shortcuts.ts, render/shortcutViews.ts). */
export const SHORTCUT = {
  reach: 2.6, // metres from the doorway's middle that E finds it
  barSeconds: 0.55, // the bar lifted, the bolt drawn or the lever thrown...
  swingSeconds: 1.1, // ...and then the leaves swing (a slab sinks)
  solidFor: 70, // frames after the bar is worked that the door's body stands in the doorway: until its leaves are well aside
};

/** Foes that lie in wait (round 127: systems/ambush.ts). */
export const AMBUSH = {
  reach: 4.2, // metres at which one springs on an investigator it can see
  hush: 1.2, // seconds of stillness it springs out of: it rises as an ambusher rises (render/creatureFx.ts)
};

/** A body come off a ledge (round 127: systems/drops.ts). */
export const DROP = {
  snap: 0.6, // metres the ground may fall away under a step before the body falls to it, rather than steps down
  gravity: 22, // m/s² (a short drop is quick: a game's fall, not the world's)
  land: 1.6, // metres fallen at which the landing is heard and felt
};

/**
 * The dungeons' traps (2026-11-27: data/dungeonTraps.ts, systems/dungeonTraps.ts). Fair by their numbers: every one is seen and heard
 * before it strikes (`warn`, frames), none takes more than a sixth of a fresh investigator's health, and a body struck by a trap is not
 * struck by one again for `grace` frames.
 */
export const TRAP = {
  grace: 90,
  plate: 0.75, // metres from a plate's middle that presses it
  spikes: { half: 0.95, warn: 36, up: 40, rest: 150, damage: 18 }, // a tile's half side; frames rattling, standing, sunk again
  darts: { warn: 22, volley: 3, gap: 9, speed: 18, reach: 0.45, damage: 14, rest: 180 }, // a click, then darts `gap` frames apart, at m/s; how near a body one strikes
  blades: { reach: 1.8, period: 3.2, width: 0.5, damage: 18 }, // metres it swings either side of its middle; seconds for a whole swing; the blade's own breadth
  flames: { warn: 48, burn: 60, rest: [140, 200] as const, length: 4.4, width: 1.3, damage: 16 },
  crusher: { half: 1.15, warn: 54, fall: 8, down: 36, rise: 90, rest: [120, 180] as const, damage: 22 },
  boulder: { warn: 70, radius: 0.75, speed: 7, damage: 22, rest: 420 },
  gas: { r: 2.6, puff: 220, rest: [200, 320] as const, warn: 40, sanity: 1.6, stamina: 2.4 }, // a cloud's frames; per second: sanity points, tenths of stamina
  watcher: { warn: 54, every: [300, 420] as const, burst: 1.7, damage: 16 },
  tide: { warn: 60, step: 9, row: 2.6, across: 2.1, burst: 1.5, damage: 16, every: [480, 660] as const },
  clear: { door: 3.2, wall: 1.1 }, // metres a piece keeps from a doorway and from a wall, a pillar or a brink
};
