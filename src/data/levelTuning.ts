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
