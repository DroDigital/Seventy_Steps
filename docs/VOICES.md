# The voices

Every line the people of the realms and the horrors that speak say is spoken by a recording in
`public/voice`: 177 clips of ElevenLabs' **Eleven v4** (`eleven_v4`), about 24 minutes, 25.7 MB. 123 are
the lines of the fifteen people met at the Elder Signs (`npc:<id>`, written in `data/npcs.ts` and
`npcsFar.ts`); 54 are those of the horrors that speak in their own stories (`boss:<roster id>`, written for
this: no horror spoke before): a line as it arrives and a last as it falls. Two have no scene, the Dunwich
Horror (unseen), who says only a last, shown as a notice. (Brown Jenkin had a last line too; it was given up in round 46 to free a voice's place in the workspace, and he is wordless now.)
A line with no recording is shown and not heard, as every line was before.

## Where it is

| | |
|---|---|
| `data/speech.ts` | `clipOf(speaker, text)`: a recording's name, the speaker and a hash of the line's words (`wordsOf`: lower case, letters only, tags out); `plain` (tags out), `shown` (tags out and a leaned-on CAPITAL let down again) |
| `data/speechNpcs.ts`, `speechFar.ts`, `speechBosses.ts` | each line as it is **performed**, with its [audio tags] |
| `data/speechLines.ts` | every line said aloud, gathered (`speechLines()`); `spokenFor`: how long a caption is held |
| `data/speechCast.ts` | who speaks in which voice, and how the game plays it |
| `render/audio/speech.ts` | the player: `public/voice/index.json` once, a recording fetched and decoded when its line is first said (a talk's next five are fetched ahead), ten decoded ones kept, one voice at a time (the next cuts off the last in 0.14 s), the cast's playback rate (lowers and slows a great voice) and echo |
| `render/audio/engine.ts`, `gameAudio.ts` | the speech bus (before the limiter, after the sanity shaper and the muffle, so a failing mind does not smear the voices; `AUDIO.speech`, a make-up gain of 1.5); the `Said`, `Silenced` and `Talked` events |
| `render/cinemaDirector.ts`, `cinema.ts` | a horror's scene: `speaking()` lays a caption beat and a voice beat over its arrival and its fall and holds the last shot until it is said; skipping a scene silences it |
| `ui/dialogue.ts`, `ui/menuPages.ts` | a person's line is said as it is shown; Settings › Audio › **Voices** |
| `tests/speech*.test.ts`, `voiceCoverage.test.ts` | the words performed are the words shown; every speaker is cast; the names are stable; the folder, `index.json` and the lines agree; the sizes |

## How a line is performed

Eleven v4 is directed with square-bracket **audio tags** in the text. Its own guidance, which the lines follow
(`speechNpcs.ts`' header has it): a tag says *how* a line is spoken (`[weary]`, `[whispers]`, `[low voice]`,
`[sighs]`), never what the speaker does; it sits where the delivery changes, before the words it changes, and
tags stack (`[low voice] [elderly voice]`); the word leaned on is written in capitals; a trailing off is an
ellipsis; a beat is `[pause]` or `[long pause]`; no hyphens, commas or digits inside a tag (v4 reads them as
words: a test holds this). A hard name is given in IPA between slashes where v4 says it wrongly: in the request
only (never in the data), *Yog-Sothoth*, *Dunwich* and *Pawtuxet* (`/ˈjɒɡ ˈsɒθoʊθ/`, `/ˈdʌnɪtʃ/`, `/pɔːˈtʌksɪt/`).

**The words are never changed.** A performed line is the shown line with tags and capitals added, and
`tests/speech.test.ts` holds `wordsOf(performed) === wordsOf(shown)` for every line. A boss's caption is made
from its performed line (`shown`); a person's is the text in `data/npcs.ts`, unchanged.

A recording is named by its speaker and its **words**: a changed word is a new recording (the old file is
then of no line, and `voiceCoverage` says so); changed capitals, marks or tags keep the name, so a line's
performance can be tried again over the same file.

## The cast

The narrator of a new game's opening (`narrator:intro`, `data/intro.ts`) is *The Archivist (Intro Narrator)* (`uqOnApI3a2RVj8rEwlAi`), a voice **designed for the game** in round 46 (Voice Design, so no library licence is in between): a late-fifties English baritone from the north, long settled in the south, a low rounded chest tone with a faint dry rasp, slow, with real pauses, understated, an archivist reading from his own notes. It replaced the library voice Finley - Articulate Anchor, which the author found widely used by other creators and recognised as synthetic. Set in a stone chamber (`room`); his five cards are one take each, made in `eleven_v4` on 6 October 2026 (the design model, `eleven_ttv_v3`, is the only one Voice Design offers; v4 speaks it). He was chosen by the author from six previews of two descriptions (the author's, then a fresh one of Claude's: preview F of the second).

**Licence (round 41).** Only ElevenLabs' own **premade** voices, or voices **designed for this game** in its Voice
Design (ours), are used: a library voice's licence cannot be told through the tools (they show a voice's category,
not what its owner allows), so the library voices the cast once had (Josef Hammer, Desmond, Jessie, Diego, Birk,
Rick, Mossbeard, Malvoryx, the Parasyte pair, and the rest of the horrors' set) are gone from it. Thirty voices
were designed (the workspace's limit is thirty custom voices, so Yog-Sothoth, 'Umr at-Tawil and Shub-Niggurath speak in
the Great Ones', the priests' and Hydra's, played lower and with their own hall). Each was described from the
speaker's years, tongue and temper (Peaslee: a deep, old, dry professor of seventy, who with Eric had sounded too
young), the previews could not be heard, so one of three was kept by what could be measured (slowest and lowest for the
old, the great and the drowsy; briskest for the clipped Norwegian), and 112 lines were made again in them. The nine
premade voices that stay (Will, Roger, Brian, Callum, Chris, Bill, Daniel, George, Harry) were each checked to be
of the premade category. The narrator, once left open as a library voice, was recast in round 46 with a voice designed for the game (above), so the cast now holds only premade and designed voices, but for Morgan's library voice (Josef Hammer: licence unchecked). `rate` lowers a voice and slows it (playback rate: pitch and pace together); `echo` puts some hall behind it. They are
the game's, applied at playback, so a recast does not need them again.

| speaker | voice (ElevenLabs) | voice id | played with |
|---|---|---|---|
| `narrator:intro` | The Archivist (Intro Narrator) (designed, round 46) | `uqOnApI3a2RVj8rEwlAi` | room |
| `npc:peaslee` | Wingate Peaslee (designed) | `tFaKZ4OQAewSluuxn7RB` | clips lowered to ~95 Hz, 12% brisker (round 42) |
| `npc:gilman` | Will - Relaxed Optimist (premade) | `bIHbv24MWmeRgasZH58o` | — |
| `npc:morgan` | Josef Hammer - Deep & Expressive (library; the author's pick after auditioning it against Julian and Jay Anderson) | `AFtA63zAzQAlNDuzSRKy` | clips as recorded, ~105 Hz (round 45). Its licence was not readable through the tools: confirm it, and its notice period, on its library page |
| `npc:kuranes` | Kuranes (designed) | `bY8puK6S3RGlr0wikENe` | — |
| `npc:zadok` | Zadok Allen (designed) | `oS1Ldc1OhmULV32wNtyv` | — |
| `npc:wilmarth` | Roger - Laid-Back, Casual, Resonant (premade) | `CwhRBWXzGAHq8TQ4Fs17` | — |
| `npc:willett` | Brian - Deep, Resonant and Comforting (premade) | `nPczCjzI2devNBz1zQrb` | — |
| `npc:curtis` | Callum - Husky Trickster (premade) | `N2lVS1w4EtoT3dr4eOWO` | — |
| `npc:dyer` | Chris - Charming, Down-to-Earth (premade) | `iP95p4xoKVk53GoZ742B` | — |
| `npc:nathaniel` | Bill - Wise, Mature, Balanced (premade) | `pqHfZKP75CvOlQylNhV4` | — |
| `npc:zamacona` | Zamacona (designed) | `SCr2sXbLg0vczYt19ZiV` | — |
| `npc:johansen` | Gustaf Johansen (designed) | `OJZxDfzqJBxrmTREQJcK` | — |
| `npc:akeley` | Henry Akeley (designed) | `brfCSgEWKhVUk7i3sPp9` | — |
| `npc:carter` | Daniel - Steady Broadcaster (premade) | `onwK4e9ZLuTAKqWW03F9` | — |
| `npc:nasht` | Nasht and Kaman-Thah (designed) | `t08TssFOUzUklDhgSgD1` | echo: 0.2 |
| `boss:wilbur_whateley` | Harry - Fierce Warrior (premade) | `SOYHLrjzK2X1ezoPC6cr` | rate: 0.96 |
| `boss:dunwich_horror` | Harry - Fierce Warrior (premade) | `SOYHLrjzK2X1ezoPC6cr` | rate: 0.72, echo: 0.5 |
| `boss:keziah_mason` | Keziah Mason (designed) | `BbF0R6lcyCsZVwnjHzwi` | — |
| `boss:black_man` | The Black Man (designed) | `gdQL6olVLhkRDvue4G8n` | rate: 0.97, echo: 0.25 |
| `boss:joseph_curwen` | Joseph Curwen (designed) | `ttJ9Yma2EKpRou0MKpVX` | — |
| `boss:simon_orne` | Simon Orne (designed) | `MN6OV4FaLTmDyt2HbvDM` | — |
| `boss:edward_hutchinson` | Edward Hutchinson (designed) | `d5fMF4XN1xXNbhcn2sVN` | — |
| `boss:ephraim_waite` | Ephraim Waite (designed) | `uLSdhli8Nh3oecMulCST` | — |
| `boss:whisperer` | The Whisperer (designed) | `GhTAOZ6TpanaXZ2BebFG` | — |
| `boss:voice_in_the_tomb` | Voice in the Tomb (designed) | `8sQoC7ywyRWufwwkpxmi` | echo: 0.35 |
| `boss:lilith` | Lilith (designed) | `ZpcPectqj6jA7upy2ds6` | rate: 0.96, echo: 0.3 |
| `boss:dr_munoz` | Dr. Munoz (designed) | `znCQdZ10eP9TPmKFUBiB` | — |
| `boss:charles_le_sorcier` | Charles Le Sorcier (designed) | `XbbZLJxYknwZpVDBF8yd` | — |
| `boss:medusa_gorgon` | Medusa (designed) | `mxxi4y139JdJkcoAWz38` | — |
| `boss:hypnos` | Hypnos (designed) | `2By09Lf6hdgEqSaKjF6R` | — |
| `boss:terrible_old_man` | Terrible Old Man (designed) | `z0Hf7ohJe76SmjpHcSB1` | — |
| `boss:zkauba` | Zkauba (designed) | `FtER3HTVunb98SClCpA6` | — |
| `boss:cthulhu` | Cthulhu (designed) | `4BurENwzMIaL1Rien7nO` | rate: 0.9, echo: 0.6 |
| `boss:father_dagon` | Father Dagon (designed) | `e6kNUrNTHrY2UHszWVOb` | rate: 0.94, echo: 0.45 |
| `boss:mother_hydra` | Mother Hydra (designed) | `H6EAxZnCzTPJJFGIm1N0` | rate: 0.96, echo: 0.45 |
| `boss:hastur` | Hastur (designed) | `sTz0TrsMTkIY2GFiSKEd` | echo: 0.5 |
| `boss:tsathoggua` | Tsathoggua (designed) | `h66CqFXHNxmKocuuHudR` | rate: 0.9, echo: 0.4 |
| `boss:great_ones` | The Great Ones (designed) | `feMEuaYQx2ITBOZd0ZFG` | rate: 0.92, echo: 0.6 |
| `boss:yog_sothoth` | The Great Ones (designed; shared) | `feMEuaYQx2ITBOZd0ZFG` | rate: 0.84, echo: 0.7 |
| `boss:umr_at_tawil` | Nasht and Kaman-Thah (designed; shared) | `t08TssFOUzUklDhgSgD1` | rate: 0.97, echo: 0.12 |
| `boss:shub_niggurath` | Mother Hydra (designed; shared) | `H6EAxZnCzTPJJFGIm1N0` | rate: 0.84, echo: 0.55 |
| `boss:nyarlathotep` | George - Warm, Captivating Storyteller (premade) | `JBFqnCBsd6RMkjVDRZzb` | rate: 0.97, echo: 0.15 |

## Making the recordings, and making them again

1. `VOICES_TODO=todo.json npx vitest run tests/voiceCoverage.test.ts` writes every line that has no recording:
   its clip name, speaker, voice and the performed text.
2. Make one take of each in its voice with model `eleven_v4`: in ElevenLabs' Text to Speech, or through the
   ElevenLabs connector (`creative_generate_speech`, one generation each, the voice id from the table, the
   performed text as the prompt, with the three names above respelt in IPA). A take that sounds wrong is made
   again, not cut.
3. Save the MP3 (128 kbit/s, 44.1 kHz, as ElevenLabs gives it) as `public/voice/<clip name>.mp3`.
4. `VOICES_INDEX=1 npx vitest run tests/voiceCoverage.test.ts` rewrites `index.json`; `npm run check`.

To **recast** a speaker: change its voice in `speechCast.ts`, make its lines again (the names do not change),
run the tests. To change a **performance**: edit the line's tags in the `speech*.ts` file and make it again.
To change a **word**: change `data/npcs.ts` (or the line in `speechBosses.ts`) and its performed form together,
delete the old recording and make the new one. A person's line added to `data/npcs.ts` fails `speech.test.ts`
until its performed form is added, and is shown and not heard until its recording is made.

A designed voice is made with `creative_design_voice` (a description and a line of the speaker's own words, 100 to
1000 characters; three previews), kept with `creative_save_designed_voice`, then used as any voice id. Its safety filter
refused one description once (Brown Jenkin's, which said a man trapped in a rat; it passed said plainly as a creature).

## What was checked, and what was not

The takes were made on 1 October 2026 on a Creator plan; v4 then cost no credits.

- Every file is an MP3 of 3.4 to 20.7 seconds (23.6 minutes in all) and at most 350 KB (25.7 MB in all); its
  length is the one ElevenLabs reported for it, to within 0.1 s; the speaking rate (letters a second) of each
  speaker's lines is even, and the five slow ones are the lines with a `[long pause]`.
- **Read back by a machine.** An offline speech-to-text pass (faster-whisper, `base.en`, with `small` for the
  doubtful) over all 177: no `[tag]` was spoken as a word; 97 match the words letter for letter and 172 to 0.9
  or better. The five below that are a chant in an invented tongue (Cthulhu's), a number written in digits
  (Charles's "six hundred") and three names the recogniser could not know (Zamacona, Shub-Niggurath,
  Yog-Sothoth). Five takes whose plain words were misheard (the Black Man's two, Carter's, Zadok's, Curtis's)
  were made again, and by both models together each new take read back closer than the old and replaced it.
  This says what was spoken, not how well. (ElevenLabs' own transcribe node is no use for it: given a speech
  node it hands back the prompt.)
- **Not heard.** Nobody has auditioned the takes or the casting: whether a voice suits its speaker, whether the
  great ones are great enough, whether a `rate` and an `echo` are right, whether a line is acted as it is
  written. The level was measured against the bed (the `AUDIO.speech` make-up gain), not judged by ear. Listen
  to them (the flows below hold every take, with its prompt), then recast or re-perform what is wrong.

The takes are in these ElevenLabs flows (open one to hear each with its prompt; they hold some strays: a
failed take from the free plan, a transcription node):

| the takes of | flow |
|---|---|
| Peaslee | https://elevenlabs.io/app/flows/1TqtoOE11p9jPy5K7yBl |
| Gilman | https://elevenlabs.io/app/flows/i7qeWNwDSuXuJIcXHnpx |
| Morgan | https://elevenlabs.io/app/flows/WyzCqqSa5kd4vnsoN4qK |
| Kuranes | https://elevenlabs.io/app/flows/0Jj6WIeAKV52w3MwMK3o |
| Zadok | https://elevenlabs.io/app/flows/IAH3scJorZ5JL0RpNfzs |
| Wilmarth | https://elevenlabs.io/app/flows/daiFFCALezrPVstxAD5R |
| Willett | https://elevenlabs.io/app/flows/fGCpd3EC5aqNpuo8fOPw |
| Curtis | https://elevenlabs.io/app/flows/Rox5Daq6zOrf9t72VRFE |
| Dyer | https://elevenlabs.io/app/flows/w1Pi37BtbbwbN2qBSdf3 |
| the narrator (the opening's five cards, round 46; one take each: flows VUOCILGa3nlTPHEwIwek, eywQHrG4a5BGk6DzK6P9, hHMX21aLEo88On8B9fYh, QoK9xCLHCINjTJUo6reJ, TOqVv3yBFD48pWelyKZz on elevenlabs.io/app/flows/) | (earlier: https://elevenlabs.io/app/flows/OQnEi4aA8UBUVUPPBTzx) |
| Nathaniel | https://elevenlabs.io/app/flows/z9vwDPvzyk9HQrKFoDFf |
| Zamacona | https://elevenlabs.io/app/flows/EZHSLpdOLz3biacgvxGi |
| Johansen | https://elevenlabs.io/app/flows/iCM4caRlch6txnH3ED7P |
| Akeley | https://elevenlabs.io/app/flows/bJcmDdpjp5QLapux1Vfl |
| Carter | https://elevenlabs.io/app/flows/jaV5DlUOWZe9HqySKsdS |
| Nasht | https://elevenlabs.io/app/flows/Cy5uUNSC9NKiC9sLQcxY |
| Wilbur, the Dunwich Horror, Keziah Mason, (Brown Jenkin: removed), the Black Man, Curwen, Orne | https://elevenlabs.io/app/flows/9BYp05KTnTyJHuTy1Ges |
| Hutchinson, Waite, the Whisperer, the Voice in the Tomb, Lilith, Dr Muñoz, Charles le Sorcier | https://elevenlabs.io/app/flows/w90PhVB7eVQVdLnZf8gJ |
| Cthulhu, Dagon, Hydra, Medusa, Hypnos, the Terrible Old Man, Zkauba | https://elevenlabs.io/app/flows/dOQRzJQiBkgIgsQwY5NL |
| Hastur, Tsathoggua, the Great Ones, Yog-Sothoth, 'Umr at-Tawil, Shub-Niggurath, Nyarlathotep | https://elevenlabs.io/app/flows/StyntZxdbmkjrFApkjsc |

## Licence and disclosure

**Voices to check (round 39).** The ElevenLabs connector gives no licence or usage terms for a voice, so which of these carry the library's "free, unlimited use" mark has to be read in the app (Voices › Explore, each voice's page). Ten are ElevenLabs' own premade voices (Eric, Will, Roger, Brian, Callum, Chris, Bill, Daniel, George, Harry), which any plan can use. The others are library voices, each with its author's licence, still to be confirmed one by one: Finley - Articulate Anchor (the narrator), Josef Hammer, Desmond (UK), Jessie, Diego, Birk, Rick, The Ancient Evil, Parasyte (Whispers from the Deep Dark; Dweller in the Deep-Dark), Hellin, Matthew Schmitz (Ancient Sage Dragon Wizard; The Demon), Peter, GERALD, Mora, Ezekiel Wren, Eleanor, Kevo, Declan Graves, Harriet, Rodo, Frederick, Kalen, Blue, Katie, Justin, Beatrice, Mossbeard, Malvoryx. Any that is not free for a commercial game is recast in `speechCast.ts` and its lines recorded again (the clip names do not change with the voice, only the files do).

Recordings made under a plan carry that plan's terms, and a library voice has its own licence: check both
before the game is sold (`public/voice/CREDITS.md`). The credits (`data/credits.ts`) say the voices are
synthetic and whose. Steam asks that AI-generated content be disclosed on a game's store page.
