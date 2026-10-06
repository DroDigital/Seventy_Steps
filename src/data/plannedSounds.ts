/**
 * The recordings the game is ready for (round 40): sounds that a recording improves on the recipe that stands in for them.
 * Most have been found, CC0, on Freesound (public/audio/CREDITS.md); those with no files yet (pipeDraw) wait to be made
 * with Suno Sounds, from the prompt each carries. A recording improves on the recipe that stands in for it now (data/foleySounds.ts, data/doorSounds.ts). Each is a set of takes, named
 * `<file>1`, `<file>2` under public/audio/sfx. The game plays nothing of them until the files are there: drop them in,
 * credit them in public/audio/CREDITS.md, run `python3 tools/audio_levels.py`, and each stands in front of the recipe it
 * answers (which stays beneath it, a third as loud, so what a recording lacks the recipe lends). A set marked `fit` is
 * played faster or slower to last exactly as long as the motion it sounds with (a door's swing, the mist's walk).
 * Each carries the prompt to make it with Suno Sounds (those with no takes yet are the ones to make). Gains place the recorded takes in front of the recipe's level (tests/soundMix.test.ts). Data only.
 */

export interface Planned {
  id: string;
  file: string; // under sfx/, before the take's number
  takes: number;
  gain: number; // the set's level, as data/samples.ts sets are
  for: readonly string[]; // the recipes (by key: render/audio/gameAudio.ts `recipe`) it stands in front of
  seconds: readonly [number, number]; // how long to make it
  fit?: boolean; // played to last as long as its motion
  prompt: string; // for Suno Sounds, One Shot: sound, action, place, perspective, length
}

const NO_MUSIC = ', no music, no voices';

export const PLANNED: readonly Planned[] = [
  { id: 'doorOakOpen', file: 'door_oak_open', takes: 3, gain: 0.23, for: ['door:oak:open', 'door:lacquer:open', 'door:bronze:open'], seconds: [0.7, 1.1], fit: true, prompt: `Heavy old oak door creaking open slowly on dry iron hinges, the latch lifting first, a deep wooden groan, empty stone corridor, close perspective, 1 second duration${NO_MUSIC}` },
  { id: 'doorOakClose', file: 'door_oak_close', takes: 3, gain: 0.79, for: ['door:oak:close', 'door:lacquer:close', 'door:bronze:close'], seconds: [0.7, 1.1], fit: true, prompt: `Heavy old oak door swinging shut and meeting its frame with a dull wooden thud, an iron latch dropping into its keeper, empty stone corridor, close perspective, 1 second duration${NO_MUSIC}` },
  { id: 'doorIronOpen', file: 'door_iron_open', takes: 3, gain: 0.29, for: ['door:iron:open', 'door:timber:open'], seconds: [0.5, 0.8], fit: true, prompt: `Rusted iron grille gate dragged open, a bolt drawn back first, then one long shrieking squeal of dry hinges, damp crypt, close perspective, 0.7 second duration${NO_MUSIC}` },
  { id: 'doorIronClose', file: 'door_iron_close', takes: 3, gain: 0.97, for: ['door:iron:close', 'door:timber:close'], seconds: [0.8, 1.4], fit: true, prompt: `Rusted iron gate slamming shut, one hard clang of metal that rings and fades, a short rattle of its bars, damp crypt, close perspective, 1.2 second duration${NO_MUSIC}` },
  { id: 'doorStoneOpen', file: 'door_stone_open', takes: 3, gain: 0.39, for: ['door:stone:open', 'door:grind:open'], seconds: [1.3, 1.8], fit: true, prompt: `Massive stone slab sliding open across a stone floor, a deep grinding rumble with gritty texture, dust shaken loose, ancient tomb, close perspective, 1.5 second duration${NO_MUSIC}` },
  { id: 'doorStoneClose', file: 'door_stone_close', takes: 2, gain: 0.63, for: ['door:stone:close', 'door:grind:close'], seconds: [1.3, 1.8], fit: true, prompt: `Massive stone slab settling shut, a long low grinding and then one very heavy impact into the floor, dust and grit falling after it, ancient tomb, close perspective, 1.5 second duration${NO_MUSIC}` },
  { id: 'doorFleshOpen', file: 'door_flesh_open', takes: 2, gain: 0.62, for: ['door:flesh:open'], seconds: [0.9, 1.3], fit: true, prompt: `Wet fleshy membrane doors parting slowly, slick squelching and stretching, a deep slow pulse underneath, alien organic cavern, close perspective, 1.1 second duration${NO_MUSIC}` },
  { id: 'doorFleshClose', file: 'door_flesh_close', takes: 3, gain: 0.55, for: ['door:flesh:close'], seconds: [0.9, 1.3], fit: true, prompt: `Wet fleshy valves closing together with a heavy slap and a squelch, a low pulse fading, alien organic cavern, close perspective, 1.1 second duration${NO_MUSIC}` },
  { id: 'doorCloth', file: 'door_cloth', takes: 3, gain: 0.32, for: ['door:cloth:open', 'door:cloth:close'], seconds: [0.5, 0.8], fit: true, prompt: `Heavy velvet curtain drawn aside along a rod, small rings sliding, soft fabric rustle, quiet candlelit room, close perspective, 0.6 second duration${NO_MUSIC}` },
  { id: 'swallow', file: 'swallow', takes: 3, gain: 0.34, for: ['hands:swallow', 'act:gulp'], seconds: [0.4, 0.7], prompt: `A man swallowing a bitter draught, two throat gulps, then a glass bottle set down on stone, close perspective, 0.6 second duration${NO_MUSIC}` },
  { id: 'syringe', file: 'syringe', takes: 2, gain: 0.28, for: ['hands:plunger'], seconds: [0.3, 0.5], prompt: `The plunger of a hypodermic syringe pressed slowly, a thin hiss of liquid and a tiny click at the end, close perspective, 0.4 second duration${NO_MUSIC}` },
  { id: 'flaskBurst', file: 'flask_burst', takes: 3, gain: 0.64, for: ['hands:burst'], seconds: [1, 1.6], prompt: `A glass flask of lamp oil shattering on stone, tinkling shards, a soft whump as the oil ignites, then crackling flames spreading, outdoors at night, medium perspective, 1.3 second duration${NO_MUSIC}` },
  { id: 'coins', file: 'coins', takes: 3, gain: 0.26, for: ['hands:coins'], seconds: [0.4, 0.8], prompt: `A few old copper and silver coins counted one by one into an open palm, small metallic clinks, close perspective, 0.6 second duration${NO_MUSIC}` },
  { id: 'anvil', file: 'anvil', takes: 2, gain: 1.0, for: ['hands:anvil'], seconds: [1.2, 1.6], prompt: `Three hammer blows on an iron anvil, each ringing and fading, the last one ringing longest, a quiet old forge, close perspective, 1.4 second duration${NO_MUSIC}` },
  { id: 'mistPass', file: 'mist_pass', takes: 2, gain: 0.83, for: ['mist:pass'], seconds: [2, 4], fit: true, prompt: `A wall of cold mist parting as someone walks through it, a soft airy swell of wind with faint whispering grain and a low hum underneath, dreamlike and ominous, medium perspective, 3 second duration${NO_MUSIC}` },
  { id: 'mistClose', file: 'mist_close', takes: 2, gain: 0.78, for: ['mist:close'], seconds: [0.8, 1.3], prompt: `Cold mist closing behind someone, one long soft exhale of wind and a low settling hum, dreamlike and ominous, medium perspective, 1 second duration${NO_MUSIC}` },
  { id: 'pipeDraw', file: 'pipe_draw', takes: 2, gain: 0.35, for: ['act:inhale'], seconds: [0.4, 0.7], prompt: `A man drawing on a clay pipe, air through the stem and the soft crackle of burning tobacco, quiet night air, close perspective, 0.6 second duration${NO_MUSIC}` },
  { id: 'pipeBreath', file: 'pipe_breath', takes: 3, gain: 0.14, for: ['act:exhale'], seconds: [0.8, 1.3], prompt: `A man slowly breathing out pipe smoke, one long soft exhale, quiet night air, close perspective, 1 second duration${NO_MUSIC}` },
  { id: 'knifeScrape', file: 'knife_scrape', takes: 3, gain: 0.22, for: ['act:scrape'], seconds: [0.12, 0.3], prompt: `A pocket knife shaving one short stroke along a stick of dry wood, close perspective, 0.2 second duration${NO_MUSIC}` },
  { id: 'quillScratch', file: 'quill_scratch', takes: 3, gain: 0.42, for: ['act:scratch'], seconds: [0.08, 0.2], prompt: `A steel nib scratching a few quick strokes on rough paper, close perspective, 0.15 second duration${NO_MUSIC}` },
  { id: 'keyChime', file: 'key_chime', takes: 2, gain: 0.32, for: ['act:keys'], seconds: [0.2, 0.4], prompt: `A small silver key turned slowly in lamplight, a few tiny bright chimes of its ward, close perspective, 0.3 second duration${NO_MUSIC}` },
  { id: 'vialRing', file: 'vial_ring', takes: 2, gain: 0.16, for: ['act:glass'], seconds: [0.2, 0.4], prompt: `A small glass vial tapped against a lamp, one clear high ring that fades, close perspective, 0.3 second duration${NO_MUSIC}` },
];

export type PlannedId = string;
