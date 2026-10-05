/** Writes docs/SUNO_SOUNDS.md from data/plannedSounds.ts: `npx tsx tools/suno_sounds_doc.ts` (tests/plannedSounds.test.ts keeps the two one). */
import { existsSync, writeFileSync } from 'node:fs';
import { PLANNED } from '../src/data/plannedSounds';

export const head = `# Sounds to make with Suno Sounds

The game plays well without these: each answers a sound the game makes already, from a recipe written in code
(\`src/data/foleySounds.ts\`, \`src/data/doorSounds.ts\`). A recording would give it the grain a synthesised sound lacks.
Most have been found as CC0 recordings on Freesound and are in the game (credited in \`public/audio/CREDITS.md\`); this
lists only those for which none could be found, each described to be made with **Suno Sounds** (Create › Custom ›
Sounds (Beta); One Shot; 2 credits a take; a Pro or Premier plan). Suno's prompts read best as *sound, action, place,
perspective, length*, and each below is written so.

## How to put one in the game

1. Make 2 or 3 takes of each (the file names below), at the length asked, and trim silence off both ends.
2. Export each as **mono MP3**, 44.1 kHz, 96 kbps, named exactly as listed, into \`public/audio/sfx/\`.
3. Credit them in \`public/audio/CREDITS.md\` as rows of its *Made with Suno Sounds* table (the plan they were made on matters:
   Suno grants commercial use only to what a paid plan made; keep the date and plan in the row).
4. Run \`python3 tools/audio_levels.py\` (it measures every file; the game levels the takes of a set to one another by it).
5. \`npm run check\`. Nothing else is wired by hand: a set with its files present plays in front of the recipe it answers
   (the recipe stays beneath it, a third as loud), played to last as long as its motion where marked **fit**.

Until a set's files are there, the game does not ask for them.

## The sounds
`;

const missing = PLANNED.filter((p) => !existsSync(new URL(`../public/audio/sfx/${p.file}1.mp3`, import.meta.url)));
const rows = missing.map((p) => `### ${p.id}
- **files:** ${Array.from({ length: p.takes }, (_, k) => `\`sfx/${p.file}${k + 1}.mp3\``).join(', ')}
- **length:** ${p.seconds[0]}–${p.seconds[1]} s${p.fit ? ' (**fit**: played to last exactly as long as the motion it sounds with, within a third either way, so make it close to this)' : ''}
- **answers:** ${p.for.map((k) => `\`${k}\``).join(', ')}
- **prompt:** ${p.prompt}
`).join('\n');

writeFileSync(new URL('../docs/SUNO_SOUNDS.md', import.meta.url), `${head}\n${rows}`);
