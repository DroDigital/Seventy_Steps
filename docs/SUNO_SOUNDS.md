# Sounds to make with Suno Sounds

The game plays well without these: each answers a sound the game makes already, from a recipe written in code
(`src/data/foleySounds.ts`, `src/data/doorSounds.ts`). A recording would give it the grain a synthesised sound lacks.
Most have been found as CC0 recordings on Freesound and are in the game (credited in `public/audio/CREDITS.md`); this
lists only those for which none could be found, each described to be made with **Suno Sounds** (Create › Custom ›
Sounds (Beta); One Shot; 2 credits a take; a Pro or Premier plan). Suno's prompts read best as *sound, action, place,
perspective, length*, and each below is written so.

## How to put one in the game

1. Make 2 or 3 takes of each (the file names below), at the length asked, and trim silence off both ends.
2. Export each as **mono MP3**, 44.1 kHz, 96 kbps, named exactly as listed, into `public/audio/sfx/`.
3. Credit them in `public/audio/CREDITS.md` as rows of its *Made with Suno Sounds* table (the plan they were made on matters:
   Suno grants commercial use only to what a paid plan made; keep the date and plan in the row).
4. Run `python3 tools/audio_levels.py` (it measures every file; the game levels the takes of a set to one another by it).
5. `npm run check`. Nothing else is wired by hand: a set with its files present plays in front of the recipe it answers
   (the recipe stays beneath it, a third as loud), played to last as long as its motion where marked **fit**.

Until a set's files are there, the game does not ask for them.

## The sounds

### pipeDraw
- **files:** `sfx/pipe_draw1.mp3`, `sfx/pipe_draw2.mp3`
- **length:** 0.4–0.7 s
- **answers:** `act:inhale`
- **prompt:** A man drawing on a clay pipe, air through the stem and the soft crackle of burning tobacco, quiet night air, close perspective, 0.6 second duration, no music, no voices
