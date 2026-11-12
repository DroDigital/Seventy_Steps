# The demo build (round 114)

The demo is a build of its own. `npm run build:demo` (`vite build --mode demo`) writes a `dist/` that holds the demo and
nothing of the rest of the game: its code, data, pictures, sounds, voices and text are left out of the bundle, not hidden at
run time. Before round 114 the demo was the whole game with a flag that closed the other realms, so the full bundle was in
every demo. `npm run check:demo` proves what the demo's build holds and fails when anything of the full game gets in.

## What the demo keeps

`src/data/demoContent.ts` (`KEEP`) lists the ids the demo keeps, by kind: the realms (`regions`), signs and gates, dungeons,
room sets, arenas, kits, creatures (`entities`), the horrors and their halls, the people (`npcs`), quests, documents, points
of interest, wanderings, achievements, weapons, the hints left out, the realm and boss tracks, models, set kits and voices.
The demo's realms are the university, Arkham and the Blasted Heath. Their borders are edge stubs (`d_edge`, `i_edge`,
`p_edge`, `v_edge` in `regions.ts`), and `full_game` is the edge where the demo's end is said (`sites.ts`).
`tests/demoContent.test.ts` holds each list to the full game's data from the other side: a kept id the data lacks fails it.

## How the build cuts

1. **`__DEMO__`.** Vite defines it as `true` in `--mode demo` only (`tools/demo/config.ts`, used by `vite.config.ts` and
   `vitest.config.ts`). Code that names the rest of the game is written `__DEMO__ ? <the demo's> : <the game's>`, or
   `...(__DEMO__ ? [] : [...])`. The bundler folds the condition and drops the side the demo does not use. The declaration is
   `src/demoFlag.d.ts`. Nothing reads it as a runtime lock.
2. **Pruning.** `demoStrip` (`tools/demo/vitePlugin.ts`) runs `pruneModule` (`tools/demo/prune.ts`) over the modules its rules
   name. The rules are in `tools/demo/rules/` (130 of them: world 70, creatures 48, render 4, story 3, ui 3, assets 2). A rule
   names a table, deletes each entry whose id the demo does not keep, and shakes out what only that entry used. A rule fails
   the build when its table has moved, or when it removes nothing (unless it says `mustRemove: false`), so a refactor that
   moves a table has to move its rule.
3. **Tree shaking.** In the demo, a module of `src/` that nothing the demo reaches uses is dropped, except the entry points
   `main.ts` and `boot.ts` (`DEMO_BUILD` in `tools/demo/config.ts`). There are no sourcemaps: a map names every module.
4. **Files.** `public/` is not copied. `demoShip` (`tools/demo/assets.ts`) names what ships: the interface's fonts and the
   title's theme; the realm and boss tracks the keep lists name; every recorded sound (the sample sets name them whole); the
   voice clips whose words the bundle holds (a clip is `clipOf(speaker, words)`, `src/data/speech.ts`), with the voice index
   cut down to them; and the creature art in `tools/demo/art/`. Every CREDITS.md of the full game is left out, since their
   texts name what it holds; the fonts' licence texts ship with the fonts.
5. **Creature art.** `tools/demo/pack_art.py` (needs `pip install pillow`) repacks the kept creatures from the full atlases
   (`public/creatures/reviewed` and `allies`) into `tools/demo/art/creatures/`, in the same schema. Each frame is copied pixel for
   pixel, and each creature's frames share one page. `tests/demo/art.test.ts` checks every frame, name and page against the
   source. Run the script again when the source atlas or `KEEP.entities` changes.

## The leak check

`tools/demo/leak.ts` reads every file of the demo's `dist` and fails on:

- a forbidden id as a whole word in a string or a property name of the JavaScript (the code is parsed, so a minified name is
  not a hit), in the text files (html, json, css), or in a file's own path;
- a forbidden display name of six letters or more, matched without case.

The catalog (`tools/demo/leak/catalog.ts`) is read from the full game's own data, less what the demo keeps and less the
engine's ordinary words (`tools/demo/leak/vocabulary.ts`). A file the build may hold (`tools/demo/leak/allowed.ts`) is its
page, its edition marker, its hashed scripts and styles, or one the demo ships. Any other file is part of the rest of the game.

`tests/demoLeak.test.ts` builds the demo into `node_modules/.cache/demo-leak/demo` and reads it. It also builds the whole game
through the same path, with no rules, and requires that build to fail: a check that passes everything proves nothing. To see
where a hit comes from, build unminified (`buildDemo(dir, undefined, false)`, `tools/demo/build.ts`): the build's source
markers name the module.

## Commands

- `npm run build:demo`: the typecheck, then the demo's build into `dist/`.
- `npm run check:demo`: the demo's tests in demo mode (`tests/demo/`), the leak check and the keep-list test. CI runs it
  (`.github/workflows/demo-edition.yml`).
- `npm run smoke:demo`: serves a built demo (`dist/`, or a directory given), starts a new game with `?fresh`, walks a little,
  and fails on any page error, console error, failed request or missing file. It needs the Chromium of a local Playwright
  install, so run it on a machine that has one, after `build:demo`.

## Adding content

- A new table of content: add its ids to `leak/catalog.ts`, and give its table a rule in `tools/demo/rules/`.
- A new id the demo keeps: add it to `src/data/demoContent.ts`. `tests/demoContent.test.ts` checks that the data has it.
- A new creature the demo keeps: add it to `KEEP.entities`, then run `python3 -I tools/demo/pack_art.py`.
- A word that is also an English or engine word and trips the check: add it to `leak/vocabulary.ts`. Keep that list short:
  the content it names is still checked by its display name.

## What is left as it was

- **The packed demo is not built this way yet.** `npm run package:*` and the release workflow still run the full build and set
  the demo's `edition` in the package's metadata (docs/RELEASE.md). A packed demo for itch.io, Steam or Electron therefore still
  holds the full bundle until its packaging runs `build:demo`. This round changes the browser demo's build and its checks; the packaging scripts are untouched.
- **The Morgan line about Dunwich** (`src/data/npcs.ts`) is gated out of the demo, so its recording is not shipped either.
- **Every recorded sound ships.** The sample sets name their sounds whole, and none of them is part of the story.
- **The demo's cultist is named "Cultist"** (`DEMO_NAMES` in `pack_art.py`; `src/data/entities/lesser.ts`).
- **`archives` and `cylinders` are in the engine's words** (`leak/vocabulary.ts`). The full game's dungeon of `archives` is cut
  from the data, but the word is in the Special Elite licence text the demo ships. `cylinders` is a wall item the engine draws
  (`render/loreItems`), and the dungeon of that id is cut by its own rule.
- **The one CC BY work the demo ships** is Goblinatron's PSX Dungeon: five pieces (`pd_*`) and the surface patterns of
  `psxDetail`. Its author is named on the credits page (`src/data/credits.ts`), which both editions show. The licence link and
  the changes are in `src/data/models/CREDITS.md`, which neither edition ships. Adding them to the credits page is a follow-up.
- **The intro's narrator is a library voice** (*Finley - Articulate Anchor*, `narrator:intro`). The full game casts it too, and
  the demo ships its clips. `public/voice/CREDITS.md` says its licence is to be checked before the game is sold.
