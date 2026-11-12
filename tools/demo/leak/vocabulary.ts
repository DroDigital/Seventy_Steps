/**
 * Words that are both a content id and plain vocabulary of English or of the engine (a material, a kit, a model's name, a sound), so
 * a whole-word match would flag the engine. Each is exempt from the leak check's id scan: the content they name is cut by its table
 * (docs/DEMO_BUILD.md), and a name is still checked by its display name. Keep it short; a word goes here only when the check flags it
 * for the English or the engine's own sake.
 */

export const VOCABULARY: ReadonlySet<string> = new Set([
  // English words that are also ids: an achievement, a quest, an ending or a region's key
  'again', 'deep', 'every', 'people', 'steps', 'through', 'armed', 'chaos', 'piping', 'alert', 'descent', 'beyond', 'herald',
  'seal', 'seals', 'sealed', 'shub', 'void', 'slumber', 'archives',
  // kits and materials of the dungeons' looks (data/kits.ts)
  'brick', 'church', 'marble', 'onyx', 'basalt', 'cyclopean', 'drowned', 'elder', 'dream', 'hill', 'mine', 'sunken', 'fungoid',
  // the names of models a place or a way stands (data/models): plain nouns
  'log', 'column', 'fish', 'cannon', 'fountain', 'hedge', 'lightpost', 'wreck', 'rowboat',
  // a weapon's id (cut from the demo) and the plain word of an epigraph ("no axe has ever cut")
  'axe',
  // the Mi-Go's brain cylinders, a wall item the engine draws (render/loreItems); the dungeon of that id is cut by its own table
  'cylinders',
]);
