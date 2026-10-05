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
| Music | `public/music` | the title theme, fifteen realm tracks and forty-eight boss themes (Suno), a procedural boss score in code for where a theme is missing |

All of it is royalty free: the recordings are CC0 (a test, `tests/samples.test.ts`, refuses a file with no credit or no CC0 row), and
everything else is made in code. **Two things are not that, and are on the author's list to check:** the title theme
(`public/music/subterranean-pulse.mp3`: author and licence unknown, `public/music/CREDITS.md`) and the realm tracks, the boss themes and any sound
made with Suno (commercial use only if made on a paid plan; the plan and date are to be kept in the credits).

## Boss themes (round 44)

Every horror fights to a theme of its own (`data/bossMusic.ts`: 48 tracks, a pair sharing one; `public/music/bosses`, the MP3s as
Suno made them, untouched). While a fight is engaged its theme plays on the scores' bus (the music setting, the sanity FX, the
near-death muffle): in with the fight (2.5 s; 0.8 s where the entry already drives), on a loop with no audible seam, rising with the
phases, and out when the fight ends (3.5 s). The procedural score (`render/audio/bossScore.ts`) is the fallback: it sounds at once
if a fight begins before the file has loaded, and the theme takes over by a 2.5 s crossfade; it plays on if the file is missing or fails
(asked for again after 45 s), and for a horror with no theme.

- **Which theme** is decided by track, not boss (`bossThemes.ts`): while any engaged fight maps to the theme sounding it stays (Brown
  Jenkin joining Keziah, a partner falling: nothing restarts); going to another while a fight goes on (Kadath: the Great Ones, then
  Nyarlathotep) is a 3 s equal-power crossfade.
- **Where it plays**: `tools/boss_music.py` reads each file offline into `data/bossMusicMap.ts`: its tempo and bar grid (these are
  beat-driven, waltzes among them: 3 or 4 beats a bar, by the autocorrelation of its onsets), `entry` (the first pass begins there;
  full drive within about ten seconds), the loop's two ends on bar lines (whole phrases, at least 25 s, 45 s tried first; the
  candidates ranked by how alike the music is across the seam, the best 24 *tried by sound*: the real crossfade is mixed and its level
  step and spectral-flux jump measured; accepted if the step is at most 1.5 dB and the flux at most 1.5 of the loop's own 99th
  percentile), a crossfade of whole bars (two, else one; at most 3 s; else whole beats, so the drums fall together in it: the realms'
  ten-second crossfade of the body would smear them), `hot` (below) and `gain`. 41 tracks have such a loop; the 7 that have no good
  seam (`canal_blood_ritual`, `dripping_stone`, `fragile_defiance`, `the_alchemists_oath`, `the_hollow_bell`,
  `the_pendulums_last_waltz`, `the_swarm_awakens`; the best cut of each stepped 1.5 to 2.5 dB) loop the realms' way (a long
  crossfade of the body, found as the file loads, `loudness.ts`), and so would a track with no entry in the map. `OVERRIDES` (by
  track id: `entry`, `loop`, `hot`, `trim` in dB) beats all of it.
- **Phases** (`bossScene.ts` reads them; read-only on the simulation): each later phase lifts the theme 1 dB in level and 1 dB in the
  highs (a shelf above 3 kHz), up to two phases. In the last phase a theme with a `hot` stretch (13 have one: at least 12 s, after the
  entry, standing clear of the loop by 0.3 σ of intensity and 1 dB of level, with a seam as good as the loop's) moves to it at the
  next bar line by a one-bar crossfade, and loops it on its own ends; its own gain keeps it within 3 dB of the loop and under the
  ceiling. The `phase` stinger marks each change; no other is added.
- **Voices and scenes**: a horror's spoken line (the `Speaking` event) ducks the theme 5 dB (quick in, 1.1 s out). Under the first
  arrival scene (`cinema.active`) it holds 14 dB down, and comes up over 0.4 s from the next bar line once the scene ends.
- **Ready in time**: the theme of the nearest living, unengaged horror within 160 m of its arena's ring is fetched and decoded
  (`bossScene.ts`); two themes are held at most (`trackCache.ts`, shared with the realms).
- **Level**: a theme's body (of what plays: the first pass and the loop) is brought to **-23 dBFS RMS** with no peak over 0.8
  (`BOSS_MUSIC`; Azathoth, the Haunter and the Ancient Ones are 2 dB under, an `OVERRIDES` trim; the hot stretch has its own trim
  to the ceiling and to 3 dB over its loop). Measured at the output (headless Chromium, 25 s of four fights, with their effects and
  ambience; the procedural score is gappy at headless's low frame rate, so it is the totals that are compared): the procedural fight's
  total is -21.8 dBFS (-21.7, -21.8, -21.6, -22.2); a theme at -18 made it -17.7 (+4.1 dB), at -21 made it -18.9 (+2.9), at -23 made
  it -19.6, **+2.3 dB** (+1.7 to +2.8): within about 2 dB, the fight the loudest part of the game and still under the blows. The
  limiter (-10 dB, 8:1) is barely touched (mean reduction 0.001 to 0.012 dB, at worst 0.17 dB). Each file as the browser renders it
  through the real scheduler: -22.3 to -23.3 dBFS (the trimmed: -24.7 to -24.9), peaks at most -7.8 dBFS.
- **Seams**, rendered through an `OfflineAudioContext` with the real scheduler (two passes of each loop; the level step is the worst
  0.5 s window from a second before the crossfade to a second after it against the median of the 6 s before; the flux the worst
  frame in it against the loop's own 99th percentile): the 41 loops cut on the beat step at most 1.40 dB (flux at most 1.35); the 13
  hot loops 1.34 dB (flux 1.49); every move to a hot stretch lands on a bar line (to 0.002 of a bar). The 7 realm-kind loops step
  3.8 to 20.8 dB across their ten seconds of crossfade (gradually; and drum-smeared, the reason for cutting the others on the beat): they
  are the ones to listen to, with `OVERRIDES.<id>.loop` to mend them.
  `tests/bossMusic.test.ts` keeps the table, the files, the credits and the map in agreement; `tests/bossThemes.test.ts` the player.

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
