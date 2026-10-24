/**
 * Tunable numbers for play feel and presentation (re-exported by tuning.ts): the look test's orbit,
 * audio, the settings menu, consumables, hit feedback, overhead health bars and particles.
 */

import { LANGS } from './lang';
import type { Tier } from './schema';
import type { Ramp, Vec3 } from './tuning';

/** Debug orbit camera of the Phase 0 look-test scene. */
export const ORBIT = {
  target: [0, 2.2, 0] as Vec3,
  radius: [9, 34] as Ramp, // auto-orbit breathes between these (metres)
  radiusPeriod: 45, // seconds
  yawSpeed: 0.07, // rad/s
  pitch: 0.18, // rad
  pitchMin: -0.05,
  pitchMax: 1.2,
  dragSensitivity: 0.005, // rad per pixel
  zoomSensitivity: 0.001, // per wheel delta unit
  zoomMin: 0.3,
  zoomMax: 2.5,
  minHeightAboveGround: 1.5,
};

/** Procedural audio (Phase 6): the recipes are data/sounds.ts and data/voices.ts. Times in seconds. */
export const AUDIO = {
  fade: 4, // a region's drone crossfades into the next over this long...
  bossFade: 2, // ...and a boss fight's bed swells in and out over this
  swellHz: 0.06, // drones breathe this slowly...
  swell: 0.3, // ...by this share of their level
  polyphony: 24, // one-shot sounds at once; more are dropped
  near: 3, // metres: sounds are whole this close, fading to nothing at their range
  eventRange: 40, // the range of event stingers (blows, shots) away from the investigator
  callGap: 2.5, // a creature calls at most this often, even when it turns on the investigator
  pan: 0.8, // the widest stereo placement
  speech: 1.5, // the spoken lines' make-up gain: a recording's speech averages some −20 dB below full scale, about 10 dB over the bed, and the bus joins before the limiter
  muffle: [16000, 2400] as readonly [number, number], // near death the world's sound dulls: the low-pass on it (Hz), at the line and at death's door (the heart itself is low, and stays)
  whisper: { from: 0.6, every: [22, 9] as readonly [number, number], gain: [0.22, 0.45] as readonly [number, number] }, // a failing mind hears a whisper at one ear (round 22): from this stress on, every so many seconds (the slow end at that stress, the quick at madness), this loud; nothing else is added to the sound
};

/** The title's theme (render/audio/music.ts; playtest rounds 5 and 6). Times in seconds. */
export const THEME = {
  from: 3.3, // where the track first swells: its first three seconds are a near-silent lead-in (the first hit lands at 3.85)
  fadeIn: 0.4, // so starting mid-phrase does not click
  sink: 7, // spawning in, it sinks away over this long: an equal-power fade...
  sinkTo: 280, // ...under a low-pass closing to this (Hz), as the world's ambience rises beneath it (AUDIO.fade)
  wait: 4, // the title opens by itself after this long if the theme has neither sounded nor been refused (a slow line)
  wake: 0.35, // seconds it gives WebAudio to start running once the theme may play, before it counts as refused (round 20)
  hit: 3.85, // where the first hit lands (playtest round 9)
  overlap: 3.6, // looping, each pass gives way to the next over this long: the ending's decay fades out as the lead-in, from `hit − overlap`, fades in, and the first hit lands as it ends (round 22, themeLoop.ts)
  trim: 0.25, // the last of the file, its encoder's padding, is left out of the crossfade
  prepare: 30, // the whole track is decoded this long before its ending, for the crossfade to play from (never, if the title is left sooner)
  leap: [1.1, 3.2] as const, // where a pass not yet decoded leaps, as a last resort (round 9): from this long before the end, where the ending has decayed to about −20 dB, back to here, where the lead-in has swelled to the same
};

/** Boss music (playtest round 4, render/audio/bossMusic.ts; the scores are data/music.ts). Times in seconds. */
export const MUSIC = {
  level: 0.45, // the music's share of the drones' bus (offline renders: it sits under the blows' stingers)
  fadeIn: 2.5,
  fadeOut: 3.5,
  ahead: 0.25, // notes are scheduled this far ahead on the audio clock
};

/** Extra resolution scales offered only after opening the optional higher resolutions and their immersion warning. */
export const HIGH_RESOLUTIONS = [2.4] as const; // 960 × 540 (twice over on a 1080p screen; 800 × 450 is a standard step and the default since round 58)

/** The settings menu (Phase 6): [min, standard max, step, default]. */
export const SETTINGS = {
  fxCap: [0, 1, 0.05, 1], // caps every sanity effect (accessibility); the default is FX.capDefault's
  sensitivity: [0.25, 3, 0.05, 1], // look speed: mouse, stick and arrows
  invertY: [0, 1, 1, 0], // 1: up looks down (round 12)
  resolution: [0.8, 2, 0.4, 2], // internal resolution, × RENDER's 400 × 225, in steps of 160 × 90: 320 × 180, 480 × 270, 640 × 360 and 800 × 450, the default (round 58, asked: before it was 640 × 360, which a 720p, 1080p, 1440p and 4K screen each held a whole number of times over, 2, 3, 4 and 6, so that every pixel was drawn the same size; 800 × 450 is 1.6, 2.4, 3.2 and 4.8 times over on them, so some rows and columns are drawn wider than others)
  brightness: [0.7, 1.6, 0.05, 1], // lifts the dark (a gamma, after the grade; round 12)
  fog: [0, 1, 0.25, 1], // the volumetric fog's strength (0: none, for slower machines; round 16)
  shadows: [0, 1, 1, 1], // 0: neither the moon nor the lantern casts shadows (a second and a third pass over the scene each frame, for slower machines; round 34)
  uiScale: [0.75, 1.5, 0.05, 1], // × the scale the window's height gives (ui/uiScale.ts; round 12)
  shake: [0, 1, 0.25, 1], // the camera's jolts when struck and at hitstop (round 12)
  captions: [0.8, 1.6, 0.1, 1], // the size of what is said aloud and shown: cutscene lines, a talk, what is overheard (round 47)
  captionBack: [0, 1, 1, 0], // 1: a dark band behind them
  flashes: [0, 1, 0.25, 1], // lightning's brightness; below 1 its strobe softens into one swell (photosensitivity)
  cutscenes: [0, 1, 1, 1], // 0: none play: a new game's wake, a horror's arrival and fall, an ending's (round 20)
  questTracker: [0, 1, 1, 1], // 0: the quest followed is not written at the side of the screen (it is still in the journal and on the map)
  padSwap: [0, 1, 1, 0], // 1: the pad's A and B are read the other way round (round 45: a pad that reports them swapped; Settings › Controls)
  // The sound's levels (round 61, asked with a picture of Settings › Sound: all five at 100%; round 60 had 0.5, 0.5, 1, 0.45 and 0.55, the best mix a
  // player had found, and before it the volume was 0.7 and the others 1)
  volume: [0, 1, 0.05, 1], // everything
  music: [0, 1, 0.05, 1], // the title's theme, the realms' tracks and the boss scores (round 12)
  sfx: [0, 1, 0.05, 1], // blows, steps, the world's sounds
  ambience: [0, 1, 0.05, 1], // the drones and the recorded ambience
  speech: [0, 1, 0.05, 1], // the people's and the horrors' spoken lines (the voices)
  language: [0, LANGS.length - 1, 1, 0], // its place in data/lang (round 46); a first launch takes the browser's
} satisfies Record<string, readonly [number, number, number, number]>;

/**
 * How hard the dream is (round 38), chosen once, when a new dream begins, and never after (it is kept in the save and carried into
 * a second journey): the weight on every enemy's blow. Health, Echoes and everything else are the same at every difficulty.
 */
export const DIFFICULTIES = {
  light: { name: 'Light Slumber', foe: 0.6, note: 'For the story and the dream\u2019s places. Its creatures strike gently; everything else is as it is.' },
  deep: { name: 'Deep Slumber', foe: 1, note: 'The dream as it was made.' },
  nightmare: { name: 'Nightmare', foe: 1.5, note: 'Every blow lands half as hard again. For those who have died here before.' },
} as const;
export type DifficultyId = keyof typeof DIFFICULTIES;
export const DIFFICULTY_IDS = Object.keys(DIFFICULTIES) as DifficultyId[];
export const DEFAULT_DIFFICULTY: DifficultyId = 'deep';
export const isDifficulty = (v: unknown): v is DifficultyId => typeof v === 'string' && v in DIFFICULTIES;

/** The UI's scale (ui/uiScale.ts): 1 at a window this tall, and never below or above these. */
export const UI = { baseHeight: 720, least: 1, most: 2.5 };
/** A first launch on a Steam Deck (round 47): its 1280 × 800 seven inches show the picture at 720 lines, the UI at ×1; larger text and captions. */
export const DECK = { uiScale: 1.15, captions: 1.2 };

/** Levels bought with Echoes at an Elder Sign (playtest round 4): what one level of each attribute adds, and the most levels. */
export const LEVELS: Record<'vigour' | 'endurance' | 'might', { max: number; hp?: number; stamina?: number; regen?: number; damage?: number }> = {
  vigour: { max: 30, hp: 12 }, // round 68: thirty, not twenty: the last ten cost 100,000 Echoes apiece, which is what hunting is for, and the horrors grow to meet them (BOSS_OVERMATCH)
  endurance: { max: 30, stamina: 8, regen: 0.8 }, // a bigger bar, and stamina regained faster (per second): all thirty levels reach 56 a second
  might: { max: 30, damage: 0.04 }, // share added to the investigator's blows and shots
};
export type LevelId = keyof typeof LEVELS;

/**
 * Round 71 ("Souls-style soft caps ... full gains up to about level 15 to 20, roughly half after that, very little near the cap of 30"): past `after`
 * levels of one attribute, each further level is worth `worth` of a whole one in what `LEVELS` gives (systems/levelWorth.ts): health, stamina and its
 * recovery, the weight of blows. The first eighteen count whole, which is as far as any horror's standing goes (data/bossStanding.ts: 18 Vigour and 17
 * Might for the last), so the journey as it is made is as it was and what the caps soften is the hunt past it: thirty levels of one attribute are
 * worth 22.6. A level costs what it costs (`LEVEL_COST`), and the horrors grow to meet the worth, not the count (bossScaling.ts).
 */
export const SOFT_CAP: readonly { after: number; worth: number }[] = [
  { after: 18, worth: 0.5 },
  { after: 26, worth: 0.15 },
];

/** Boss health and damage gained per purchased player level; level one keeps the authored stats. */
export const BOSS_LEVEL_SCALING = { health: 0.0075, damage: 0.003 };

/**
 * Round 68 ("all bosses remain demanding regardless of player level"): past the standing a horror is made to be met at (data/bossStanding.ts), the
 * share of the investigator's growth in blows (Might) that its health takes up, and of their growth in health (Vigour) that its blows take up.
 * The rest of the growth is theirs: a level farmed is still a level gained, but no longer a fight lost. Round 71: 0.8, not 0.7. The soft caps
 * (SOFT_CAP) leave less growth to meet, and the horrors' level scaling follows the worth of the levels; at 0.7 a bot at the cap fought them
 * about 6% easier than before, and at 0.8 as before (tests/balance.test.ts: the lives of the cap table, the mean of nine starts, 1.01 of the old).
 */
export const BOSS_OVERMATCH = { share: 0.8 };

/**
 * Echoes the next level costs: base + step·n + curve·n², n being the levels bought so far. Round 60 (a playthrough found
 * the levels few: at level 26 one cost 35 of R'lyeh's foes): 250, 90 and 9, so a level costs about half as much from the
 * twentieth on, and a short spell of hunting near an Elder Sign buys one (tests/levelPace.test.ts).
 */
export const LEVEL_COST = { base: 200, step: 60, curve: 4.5 };

/** Reinforcing a weapon at an Elder Sign (round 12): the most levels, the share each adds to its blows, and the star-stones each level costs. */
export const REINFORCE = { max: 5, damage: 0.2, cost: [1, 1, 2, 2, 3] as readonly number[], moveEchoes: 600 };
// `moveEchoes` (round 61): moving a level from one weapon to another is not free: each level moved costs this many Echoes for each star-stone it would cost to set in afresh in the weapon it goes to (so 600 for the first level, 1800 for the fifth, 5400 to move five into a bare weapon). Stones set directly into the other weapon cost no Echoes, and the stones a boss leaves are there to be set, not shuffled.

/** Each new journey through the dream (NG+, round 12): what it adds to foes' health, their blows and the Echoes they leave, and the last journey counted. */
export const NEW_GAME_PLUS = { health: 0.6, damage: 0.35, echoes: 0.5, most: 7 };

/** Flasks of lamp oil (round 12): the most carried. What one does is its move (data/moves.ts `throw`). */
export const OIL = { carry: 5 };

/**
 * The revolver (round 22: it had no limit, seven damage and twenty-two metres, and was spammed from
 * afar). A cylinder of six and spare rounds carried, found in caches and boxes or bought from the
 * merchants; a shot (its damage is the move's, data/moves.ts `shoot`) is whole up close and falls away with
 * distance in damage and in aim, so it hits what stands near, and far off only by luck, the small foes
 * least of all. Levels set into it at an Elder Sign, in star-stones, put that fall-off further off.
 */
export const GUN = {
  chamber: 6, // rounds the cylinder holds
  carry: 12, // two spare cylinders carried, beyond the six already loaded
  start: 6, // spare rounds a new investigator carries (and the cylinder starts full)
  box: 6, // rounds in a box bought
  find: 4, // rounds in a box lying about the open world...
  cache: 4, // ...and in each dungeon's caches
  reach: { near: 3, far: 15, floor: 0.12, curve: 1.6 }, // damage: whole to `near` metres, then falling to `floor` of it at `far`, by this power of the way there (1 is evenly; more, sooner)
  scatter: { base: 0.6, perMetre: 0.9 }, // aim: the cone the bullet may stray in, in degrees, `base` up to `near` metres and the more for each metre past it
  level: { max: 5, damage: 0.15, reach: 1.5, scatter: 0.1, cost: [1, 1, 2, 2, 3] as readonly number[] }, // each level set in: its share of damage, the metres it puts `near` and `far` off, its share less scatter; the star-stones each costs
};

/** Star-stones a boss or optional boss leaves when it falls for good, by tier (round 12). */
export const STAR_STONES: Partial<Record<Tier, number>> = { greater: 1, named: 1, great_old_one: 2, outer_god: 3 };

export interface SkyDef {
  moon: number; // the moon's radius, radians (0: none)
  stars: number; // their density
  clouds: number; // cover
  haze: number; // the horizon's moonlit glow
  milky: number; // the Milky Way's strength (round 34)
  aurora: number; // curtains of cold light low in the north (round 34)
  meteors: number; // falling stars: how many of the turns that come every eleven seconds have one (round 34)
}

/** The night sky over each realm (playtest round 4, render/sky.ts). */
export const SKY = {
  base: { moon: 0.034, stars: 1, clouds: 0.5, haze: 1, milky: 0.8, aurora: 0, meteors: 1 } as SkyDef,
  regions: {
    innsmouth: { clouds: 0.7 }, // sea mist
    mountains: { stars: 1.6, clouds: 0.15, haze: 0.8, milky: 1, aurora: 1 }, // the cold air, and lights over the pole
    pnakotus: { stars: 1.4, clouds: 0.1, milky: 1.3 }, // desert air
    kn_yan: { moon: 0, stars: 0, clouds: 0, haze: 0.35, milky: 0, meteors: 0 }, // under the earth
    dreamlands: { moon: 0.075, stars: 1.3, clouds: 0.3, haze: 1.3, milky: 1.2, aurora: 0.45, meteors: 1.6 }, // the Dreamlands' moon hangs near, and the sky is busier than it should be
    rlyeh: { stars: 0.5, clouds: 0.8, haze: 0.7, milky: 0.3, meteors: 0.4 },
    yuggoth: { moon: 0, stars: 1.8, clouds: 0, haze: 0.3, milky: 1.5, meteors: 0.6 }, // no moon over Yuggoth: the sun a star among the rest
    beyond: { moon: 0, stars: 0.5, clouds: 0, haze: 0, milky: 0.4, aurora: 0.6, meteors: 0.3 },
  } as Readonly<Record<string, Partial<SkyDef>>>,
  fade: 3, // seconds to ease into another realm's sky...
  jump: 30, // ...unless the camera leapt this many metres at once (a journey): then at once
  close: 0.6, // seconds for a dungeon's walls to close it off
  farAngle: 34, // degrees: the most of the sky a far silhouette fills (render/skyline.ts; round 19: Kadath rose 50° over the Dreamlands' north)
  farFoot: 0.45, // share of a far silhouette's height its foot fades into the haze over (no hard line along the horizon)
};

export type LightKind = 'lamp' | 'window' | 'fire' | 'torch' | 'sigil';

export interface LightDef {
  color: Vec3;
  strength: number; // of the light it casts...
  range: number; // ...out to here (metres)
  halo: number; // the glow about it: its radius (metres)...
  haloGain: number; // ...and brightness
  haloColor?: Vec3; // the glow's own colour, when it is not the light's
  flicker: number; // share its light wavers by (flames)
}

/** The world's lights (playtest round 5, render/worldLights.ts): street lamps, fires, torches and lit windows. */
export const LIGHTS = {
  reach: 42, // metres: the farthest a light is chosen to light the world about it
  haloReach: 120, // metres: the farthest a halo is drawn (round 32: was 75; a town's windows are seen lit from across the fields)
  haloFog: 0.55, // halos pierce the fog: they fade by only this share of it
  paneHalo: 0.55, // metres: a lit window's glow, on its glass (round 13; the window kind's halo was a ball before the wall)
  sight: { perFrame: 10, pull: 0.1, lift: 0.4, rise: 12, fall: 16, forget: 1 }, // what the eye sees of them (render/lightSight.ts, round 37): lights looked at a frame, the metres before a light and above it that the ray is sent to, the share's ease in and out (a second), and the seconds out of reach before one starts afresh
  lantern: { color: [1, 0.82, 0.58] as Vec3, halo: 0.34, haloGain: 0.6 }, // the investigator's own, which lights by its own rules (lantern.ts)
  kinds: {
    lamp: { color: [1, 0.8, 0.52], strength: 2.6, range: 11, halo: 1.4, haloGain: 0.8, flicker: 0.03 }, // a pool about six metres across under a lamp three and a half up, and the walls about it
    window: { color: [1, 0.76, 0.48], strength: 1.1, range: 6.5, halo: 0.9, haloGain: 0.38, flicker: 0 }, // a warm patch on the wall and ground before it
    fire: { color: [1, 0.66, 0.36], strength: 1.8, range: 9, halo: 1.1, haloGain: 0.45, flicker: 0.2 },
    torch: { color: [1, 0.72, 0.42], strength: 1.1, range: 6.5, halo: 0.65, haloGain: 0.4, flicker: 0.1 }, // local warm pools, with dark stone between sconces
    // A lit Elder Sign: a pale violet light, too grey to count as an anomaly hue, so madness's colour
    // isolation never floods its ground (playtest round 12); its halo and carving keep Cosmic Purple.
    sigil: { color: [0.8, 0.72, 1], strength: 1.1, range: 8, halo: 1.3, haloGain: 0.3, haloColor: [0.62, 0.26, 1], flicker: 0 },
  } satisfies Record<LightKind, LightDef>,
};

/** The Elder Signs' shrines (playtest round 7, render/signViews.ts). */
export const SIGIL = {
  wake: 1.2, // seconds a sign found takes to come to its glow
  breatheHz: 0.3, // its glow breathes this often
  turn: 0.06, // radians a second its ring of runes turns
  motes: 5, // motes rising a second about a lit sign...
  moteReach: 40, // ...within this many metres of the eye
  flare: 1.8, // seconds a flare (a sign found; resting, softer) takes to die away
  wave: [1.5, 8] as const, // its ring of light: seconds to run out, and how far (metres)
  burst: 40, // motes a sign found throws up (resting, half as many)
};

/** Echo caches (playtest round 4): what the casket at a dungeon's dead end holds. */
export const CACHE = {
  bounties: 3, // times the richest bounty among the dungeon's creatures...
  least: 150, // ...but never less...
  most: 6000, // ...nor more
};

/** Consumables: Laudanum steadies the mind (tuning.ts), West's Reagent closes wounds. */
export const REAGENT = {
  doses: 4, // at the start; each Silver Vial found adds one
  maxDoses: 10, // the start's four and six vials (round 68: fourteen doses of 45% were six and a third bars of health in the pocket; a vial found past the most is Echoes)
  heal: 0.4, // share of full health restored (round 68: it was 0.45)
  surplus: 600, // Echoes a Silver Vial is worth to one whose kit holds no more
  mend: 8, // seconds after a shot in which lingering hurts (pools, the void) do no harm (playtest round 7)
};

/** How a blow taken reads without making the investigator blink: a red edge from the blow's side, a shake, a health bar that drains behind. */
/** Volumetric fog (round 16; render/volumetricFog.ts, the regions' mists in data/fogs.ts). */
export const FOG = {
  steps: 10, // samples along each pixel's ray (their start dithered, as the picture is)
  far: 56, // metres the march reaches; the far fog (FX.fogFar) takes over past it
  hazeHeight: 9, // metres over which the thin haze (FogDef.haze) thins to a third: the lamps' height and above (round 23)
  glow: 1, // how strongly the lamps shine in the mist (round 23: the mist is lower, so they meet less of it)...
  lantern: 0.35, // ...and the investigator's own lantern, that is in the low mist itself, and would wash the stones about them
  start: 5, // metres from the lens where the mist begins to gather...
  full: 24, // ...and where it is whole: the ground about the investigator, where a fight is, keeps its contrast (round 23)
  madness: 0.6, // a failing mind thickens it: this much more at full stress
  ease: 0.5, // share a second by which it turns to a new place's mist
};

export const HURT = {
  seconds: 0.7, // the red edge fades over this long
  strength: [0.35, 1] as const, // its strength for a grazing blow and for one taking a third of full health
  shake: 0.07, // metres the camera jitters at full strength
  chipDelay: 0.6, // seconds before the lost health drains away from the bar
  chipRate: 45, // percent of the bar per second
  low: 0.3, // below this share of health the heart is heard, and the edge of the picture stays a dark red that swells with it (round 14; round 23: it was a flash, and rarely seen)...
  beats: [0.95, 1.6] as const, // ...beating this often a second at that line and at death's door, quickening between (round 23: it was 1, then 1.45 below half of it)...
  dub: 0.26, // ...a second, softer stroke this long after each (the sound's own gap, data/sounds.ts), each fading over...
  fade: 0.14, // ...this long...
  lowBase: 0.16, // ...the red that stays about the edge at death's door...
  lowPulse: 0.34, // ...how much it swells at a full stroke (less nearer the line)...
  lowDrain: 0.3, // ...and the share of its colour the picture has lost by then
};

/** How a loss of sanity reads on its bar (ui/mindHud.ts), as a wound does on health's. */
export const MIND_HUD = {
  chipDelay: 0.9, // seconds before the lost sanity drains away from the bar
  chipRate: 30, // percent of the bar per second
  joltSeconds: 0.6, // a sudden loss (SANITY.jolt) shakes the bar and lights its frame this long
};

/** Health bars over ordinary foes (bosses keep theirs at the bottom of the screen). */
export const FOE_BARS = {
  max: 8, // at once, nearest first
  range: 22, // metres
  height: 0.35, // metres above the head
};

/** The map (playtest round 1): what the investigator has seen stays drawn; the rest lies under fog. */
export const EXPLORE = {
  cell: 16, // metres: the fog's grain
  sight: 56, // metres around the investigator that come to be known
  every: 8, // frames between looks around
  minimap: 110, // metres from the centre to the minimap's edge
};

/** The card for a weapon or a relic found (round 60, ui/findCard.ts): the milliseconds a find waits before it opens, once the investigator is free. A weapon's pickup is felt first; a relic's horror has fallen, and its banner and its Echoes are read. */
export const FINDS = {
  wait: { weapon: 900, relic: 5200 },
};

/** The map's markers (round 60, systems/marker.ts): how near the investigator must come for one to be reached, and so cleared (metres), and how many may stand at once (round 68: it was one). */
export const MARKER = { arrive: 10, most: 12 };

/**
 * Secret passages (round 61, systems/passages.ts): the metres from a passage within which it wakes (a bridge's from its middle, and half
 * its length more), the frames each kind takes to open, and how far open it must be for the way to be passable (a door's seal leaves the
 * world, a bridge's deck stands): the picture is at that moment well on.
 */
export const PASSAGE = { wake: 7, frames: { door: 96, sealed: 120, bridge: 72 }, solidAt: 0.62, stood: 3 }; // stood: metres within which a passage met standing at it, when the world is made, is already open

/** The seals on Kadath's door (playtest round 12, systems/seals.ts). */
export const SEALS = {
  exempt: ['hub', 'dreamlands', 'beyond'] as readonly string[], // regions holding no seal
  kadath: 4, // seals broken before the Great Ones' door opens (Keziah's, on the main line, is one)
  warn: 6, // metres: this close to a sealed door, the investigator is told what it waits for...
  again: 20, // ...at most every this many seconds while it stays near...
  away: 3, // ...and again at once on coming back to it, once it has been this many seconds out of reach (round 58: a door walked away from was not told again for twenty seconds)
  after: { yog_sothoth: 'umr_at_tawil', azathoth: 'yog_sothoth' } as Readonly<Record<string, string>>, // the Beyond's order: each waits for the one before to fall
};

/** The edge (round 54, systems/falls.ts): stepping past a ledge is a fall of its own, and the death comes at the bottom of it. */
export const FALL = {
  foot: 0.18, // metres: the feet's hold, a ring this wide about the body's centre. While any of it is on the floor the body stands, balanced on the very edge if need be, and can step back; the fall begins when none of it is
  gravity: 22, // m/s²: the drop is a drop (a pit is 12 m: a second and a bit)
  frames: 66, // the fall lasts this long (1.1 s: the death move then plays at the foot, in the dark)
  carry: 4.5, // m/s: the most of the run-up the body keeps as it goes over...
  drag: 10, // ...per second it is lost over the void: a run takes the body 0.45 m past the lip (4.5 / 10), not across the pit
  follow: 0.65, // the camera follows the falling body this share of the way down...
  lookPitch: 1.42, // ...and swings up over the hole to look down after them (radians: the ledge would hide a body that fell from a camera behind it)
  dark: [0.4, 1] as readonly [from: number, to: number], // the share of the fall in which the picture goes dark, edges first
  spin: 3.4, // rad/s: the tumble, head first
};

/**
 * The sea (round 55, systems/waterFall.ts): a body that goes off the land's edge into the water does not drop through the seabed: it meets
 * the surface where the waves have it, throws up a splash by how hard it came, floats chest-deep for a moment, and something from the deep
 * takes hold and drags it down.
 */
export const WATER = {
  gravity: 9.81, // m/s²: in the air above the water it falls as a body does (a pit's drop is the game's own, FALL.gravity)
  entryKeep: 0.42, // the share of its fall's speed it keeps on meeting the water (the rest is the water's: a body does not plunge on at a walk's speed)
  entryAcross: 0.38, // ...and of its run-up
  afloat: 1.0, // metres: how deep the feet hang when it floats, chest-deep: the lungs' air holds a body up there...
  spring: 9, // m/s² per metre of depth it is off that, ...
  damp: 5.5, // ...per second of its speed in the water: it settles in a second or so
  swim: 3.2, // per second: the speed it has across the water is lost, but for what is drawn on it
  seize: 40, // frames after it meets the water that the tentacle has hold of it (the tentacle rises in the first 0.5 s, and coils on it by this)
  pull: 17, // m/s²: how hard it is drawn down once it has hold, over `ramp` frames (the seabed is under it: where the sea is shallow it is dragged along the bottom)...
  ramp: 14,
  draw: 17, // ...and out along the way the tentacle lies, into the deep, m/s² (the water holds it to about 5 m/s)
  drag: 1.9, // quadratic drag in the water (per metre)
  held: 96, // frames it is held before the death: dragged out and under, and gone
  max: 220, // frames: it is over by now whatever happens
  root: 4, // metres: the tentacle rises this far from the body, ahead of it and to one side (out of deeper water), and stays this far ahead as it draws it out
  follow: 0.92, // the camera follows the body this far down: it sees the surface close over it
  lookPitch: 0.95, // radians: and looks down at it, not straight down (the water is not a hole)
  dark: [34, 90] as readonly [from: number, to: number], // frames held between which the picture goes to black
};
