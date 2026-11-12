/**
 * The files of the demo's build (docs/DEMO_BUILD.md): each one ships because the demo reaches it, and nothing else of public/ does.
 *   - the fonts the interface loads, with their licence texts (public/fonts), and the title's theme;
 *   - the realm and boss tracks the demo keeps, named as the game names them (KEEP.realmTracks, KEEP.bossTracks);
 *   - every recorded sound (public/audio): the sample sets name them whole, and none of them is the story's;
 *   - the voice clips of the speakers the demo keeps whose words its bundle holds (a clip is `clipOf(speaker, words)`,
 *     src/data/speech.ts), and the voice index cut down to them;
 *   - the creature art the demo's own atlases hold (tools/demo/art, made by tools/demo/pack_art.py).
 * Left out: every CREDITS.md (their texts name what the full game holds), the source indexes, the full atlases.
 * Paths are relative to the build's root, with forward slashes.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { KEEP } from '../../src/data/demoContent.ts';
import { clipOf } from '../../src/data/speech.ts';

/** The fonts the interface loads (src/ui/fonts.ts), and the licence texts that go with them. */
const FONTS = [
  'fonts/EBGaramond-Italic.woff2',
  'fonts/EBGaramond-Regular.woff2',
  'fonts/IMFellEnglish-Italic.woff2',
  'fonts/IMFellEnglish-Regular.woff2',
  'fonts/SpecialElite-Regular.woff2',
  'fonts/LICENSE-SpecialElite.txt',
  'fonts/OFL-EBGaramond.txt',
  'fonts/OFL-IMFellEnglish.txt',
];

/** The title's theme (src/render/audio/music.ts). */
const TITLE = 'music/subterranean-pulse.mp3';

/** The creature art the demo's own atlases hold, under tools/demo/art (tools/demo/pack_art.py). */
export const ART_ROOT = 'tools/demo/art';

/** What the demo ships: its files (paths under the build's root, as they are written), and the voice index it writes. */
export interface DemoShip {
  files: string[];
  voiceIndex: string[];
}

const dashed = (id: string): string => id.replace(/_/g, '-');

/** The files of a folder whose names match, sorted; none if the folder is not there. */
const listed = (dir: string, match: RegExp): string[] => (existsSync(dir) ? readdirSync(dir).filter((f) => match.test(f)).sort() : []);

/** The voice clips of the speakers the demo keeps, each for every line among `lines` (the strings a build holds). */
export function voiceClipsFor(lines: ReadonlySet<string>): Set<string> {
  const clips = new Set<string>();
  for (const line of lines) for (const speaker of KEEP.voices) clips.add(clipOf(speaker, line));
  return clips;
}

/** What the demo ships from the repository at `root`, given the strings its bundle holds (`literalsOf`, tools/demo/leak.ts). */
export function demoShip(root: string, lines: ReadonlySet<string>): DemoShip {
  const pub = join(root, 'public');
  const art = join(root, ART_ROOT, 'creatures');
  const all = JSON.parse(readFileSync(join(pub, 'voice', 'index.json'), 'utf8')) as string[];
  const clips = voiceClipsFor(lines);
  const voiceIndex = all.filter((clip) => clips.has(clip));
  const files = [
    ...FONTS,
    TITLE,
    ...KEEP.realmTracks.map((id) => `music/realms/${dashed(id)}.mp3`),
    ...KEEP.bossTracks.map((id) => `music/bosses/${dashed(id)}.mp3`),
    ...listed(join(pub, 'audio', 'sfx'), /\.mp3$/).map((f) => `audio/sfx/${f}`),
    ...listed(join(pub, 'audio', 'amb'), /\.mp3$/).map((f) => `audio/amb/${f}`),
    ...voiceIndex.map((clip) => `voice/${clip}.mp3`),
    'voice/index.json',
    ...listed(join(art, 'reviewed'), /^(index\.json|creatures-\d+\.png)$/).map((f) => `creatures/reviewed/${f}`),
    ...listed(join(art, 'allies'), /^(index\.json|allies-\d+\.png)$/).map((f) => `creatures/allies/${f}`),
  ];
  return { files, voiceIndex };
}

/** Where a shipped file is copied from (under the build's root). `voice/index.json` is written from the voice index, not copied. */
export function sourceOf(root: string, file: string): string {
  return file.startsWith('creatures/') ? join(root, ART_ROOT, file) : join(root, 'public', file);
}
