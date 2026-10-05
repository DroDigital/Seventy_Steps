# Sound

How the game sounds, what it is made of, and how its sound is kept in balance. (Voices: `docs/VOICES.md`. Recordings still to
be made: `docs/SUNO_SOUNDS.md`. Credits and licences: `public/audio/CREDITS.md`, `public/music/CREDITS.md`.)

## What sounds are made of

| Layer | Where | Made of |
| --- | --- | --- |
| Event stingers | `data/sounds.ts` (`STINGERS`), `render/audio/cues.ts` | recipes: oscillators and noise through filters and envelopes, played by `synth.ts`; some with a recording in front (`data/samples.ts` `STINGER_SAMPLES`) |
| Recorded sounds | `data/samples.ts`, `public/audio/sfx` | 291 CC0 recordings (55 of them found in round 40 for the doors, hands, mist and acts: `data/plannedSounds.ts`), a few takes to a set, one drawn at random (never the last twice) at a pitch drawn from the set's range |
| Ambience | `data/samples.ts` `AMBIENCE`, `public/audio/amb`, `render/audio/ambience.ts` | looped beds with spot sounds, breathing |
| Doors | `data/doorSounds.ts`, `render/doorViews.ts` | a recipe made for each swing (below) |
| Menus | `data/foleySounds.ts` `UI`, `ui/menuSounds.ts` | seven small sounds (move, choose, back, tab, open, close, tick), quiet, wood and paper |
| The investigator's hands | `data/foleySounds.ts` `HANDS`, `render/audio/foley.ts` | a guard lifted, a draught swallowed, the Reagent's needle and plunger, a flask lobbed and burst, an arm taken up, an arm reinforced, a knee bent and risen from, coins counted |
| The mist wall | `data/foleySounds.ts` `mistPass`, `render/bossFog.ts` | made for the length of the walk through it |
| The people | `data/actBeats.ts`, `render/audio/actFoley.ts` | each act's sounds on the beat of its pose (a page, a draw on the pipe, a knife's stroke, a nib…) |
| Voices | `data/speech*.ts`, `public/voice` | ElevenLabs recordings (the narrator through a stone chamber's reverb: `render/audio/voiceRoom.ts`) |
| Music | `public/music` | the title theme, fifteen realm tracks (Suno), boss scores in code |

All of it is royalty free: the recordings are CC0 (a test, `tests/samples.test.ts`, refuses a file with no credit or no CC0 row), and
everything else is made in code. **Two things are not that, and are on the author's list to check:** the title theme
(`public/music/subterranean-pulse.mp3`: author and licence unknown, `public/music/CREDITS.md`) and the realm tracks and any sound
made with Suno (commercial use only if made on a paid plan; the plan and date are to be kept in the credits).

## Doors

A door's sound is made for the swing it sounds with (`doorSound(look, seconds, closing, rand)`): the unlatching as the leaf
begins, the movement following its speed (which eases in and out), the stop as it ends, or its latch as it shuts; by its material
(`oak`, `lacquer`, `bronze`, `iron`, `timber`, `stone`, `grind`, `flesh`, `cloth`: from the door's look), open or shut (a door let go of
strikes harder than one let swing). It lasts as long as the swing, from where the door stands, and is drawn anew each time from the
random numbers it is given (a pitch, the creaks' glides and beats, which recording lies under it): no two doors, and no door twice,
sound the same. A CC0 recording of each door (`data/plannedSounds.ts`) plays in front of its recipe (which stays beneath it, a third as loud), played faster or slower to last the swing.

## Variation

Every recipe is drawn a little anew each time it plays (`render/audio/vary.ts`): one pitch for the whole sound (so its layers
stay in tune), each layer's filter, level, start and length a little off, and never the last play's pitch. How far is `STINGER_VARY`:
a blow a good deal, a bell hardly at all. The recorded sets are drawn by take and pitch as before, and now levelled (below).

## The mix

- **Recipes** are measured by an offline render (`tests/soundRender.ts`) and kept in the loudness window of their class
  (`tests/soundMix.test.ts`): menus −44 to −30 dB RMS, the hands −36 to −22, impacts −28 to −14, the people −48 to −28, the mist −32 to
  −22, each door by its weight. `CLASS_GAIN` (`data/foleySounds.ts`) and `DOOR_GAIN` (`data/doorSounds.ts`) place each class.
- **Recordings** are measured by `python3 tools/audio_levels.py` (writes `src/data/sampleLevels.ts`: length, peak, active RMS of each).
  They were each cut to one peak, so a set's takes could differ by up to 13 dB in loudness (a boom, a rattle, a beast, the
  investigator's own stab); `data/takeTrim.ts` brings each take to its set's mean (a boost of at most 6 dB, a cut of at most 12, never
  over −0.5 dBFS), and the set's gain keeps the level it was tuned to. Run the tool again when a file is added or changed.

## Sound and motion

A sound that goes with a motion is made to its length or placed on its frame, and a test says so (`tests/soundSync.test.ts`):
the hands on their moves' frames (`HAND_FRAMES`), the whoosh before each blow's window and over within its move, the reload's rounds
before its item frame, a door's swing, the mist's walk, and each act's cues on its own pulse (`TIMING` in `data/actBeats.ts` is read by
the poses and by the sounds). Change a move or an act's timing and the test says where its sound now lies.

## Adding

- A recipe: a `Sound` in `data/foleySounds.ts` (or `sounds.ts`), a class gain, and its place (an event in `cues.ts`, a frame in
  `foley.ts`, a cue in `actBeats.ts`). `tests/soundMix.test.ts` will want its level.
- A recording: see `docs/SUNO_SOUNDS.md` for the planned ones; for any other, a set in `data/samples.ts`, a row in `public/audio/CREDITS.md`
  (CC0, or made with Suno Sounds with its date and plan), and `python3 tools/audio_levels.py`.
