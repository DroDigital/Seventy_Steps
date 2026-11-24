# CLAUDE.md

Lovecraftian open-world soulslike in retro 3D. **Spec: `docs/SPEC.md`. Standing rules: `docs/RULES.md`.** At session
start read those two and this file, then do only what the message asks. Log judgment calls in `docs/DECISIONS.md`, one
line each, labelled by date (YYYY-MM-DD) or PR number, never by a round number.

## Commands
- `npm run dev`: the game: the title, then the open world saved to localStorage. Routes: `?fresh` (new game), `?demo`,
  `?arena`, `?bestiary`, `?spawn=<id>[&variant=eldritch|boss]`, `?look`, `?perf` (F3 anywhere), `?bench`, `?trailer`,
  `?edit`, `?debug` (panel, and `window.game`, `world`, `audio`, `pipeline`, `scene`, `camera`, `settings`). Every key
  and route in full: `docs/TOOLS.md`.
- `npm run check`: typecheck + the everyday Vitest set; must pass before every commit. `npm run audit`: the slow audits
  (soak, bots against every creature, walks of every dungeon, prop and house, balance → `docs/BALANCE.md` with
  `BALANCE_WRITE=1`, NG+ → `docs/NGPLUS_RESULTS.md` with `NGPLUS_WRITE=1`); run it when a boss, a creature or the world
  changes. `npm run check:all`: both, what CI runs.
- `npm run build`: typecheck + production build into `dist/`. `build:demo`, `check:demo`, `smoke:demo`: the demo as a
  build of its own (`docs/DEMO_BUILD.md`).
- `npm run desktop` (`desktop:dev` on the dev server): the Electron shell. `package[:win|:linux|:mac]`, `smoke`,
  `steam:upload`, `itch:push`, `icon`: packing and shipping (`docs/RELEASE.md`, `docs/STEAM.md`).
- World editor, development builds only: F8 in the open world or `?edit`; `node tools/world_edits.mjs describe|apply
  <export.json>` writes `src/data/worldEdits.ts` (`docs/WORLD_EDITOR.md`).
- Asset pipelines (recording levels, voices, sprites, models, gates, flames, marks, the investigator's clips, boss
  music, store and itch.io art): `docs/TOOLS.md`. Each writes generated data under `src/data`; never edit that by hand.

## Folders (the detailed map, with what each file holds: `docs/CODEMAP.md`)
- `src/core`: the 60 Hz loop, ECS, event bus, input (keys, mouse, pads, rebinding), rumble, rng, noise, i18n.
- `src/systems`: the simulation, no Three.js. `game.ts` builds the world and fixes the system order; combat, stamina,
  AI, sanity, bosses and their scaling, the world, quests, saves.
- `src/render`: the picture and the sound: pipeline and post pass, shaders, world, creature and figure views, FX, the
  atmosphere (`render/atm`), audio (`render/audio`), the sprite generator (`render/sprites`).
- `src/data`: every tunable number (`tuning.ts` and the files it re-exports) and all content as data: roster, entities
  by tier, attacks, boss moves and deaths, regions, looks, music, voices, languages (`data/lang`), baked models
  (`data/models`, `data/player`).
- `src/world`: pure world math: land, placements, regions, dungeons, arenas, the boss places (`world/places`),
  collision, streaming, the editor's edits (`world/edits`).
- `src/ui`: HUD, menus, map, journal, dialogue, settings, the title and the intro.
- `src/editor`: the world editor, development builds only.
- `desktop/`: the Electron shell (window, saves as files, native pads, Steam). `tools/`: the asset pipelines, shot tools
  and the demo build (`tools/demo`). `tests/`: Vitest in Node (helpers, bots, audits). `docs/`: the spec, the rules,
  the decisions and the notes on each part.

## Rules (spec §0 and `docs/RULES.md`, condensed)
- Do only what the message asks; never scaffold ahead. Plan in ≤15 lines, then execute without asking.
- Ambiguity: pick the simplest option that fits the spec and the rules, log one line in `docs/DECISIONS.md`, keep going.
- No file dumps or large diffs in chat. End each piece of work with a ≤10-line summary and a git commit.
- Surgical edits. Files under 300 lines with one responsibility each.
- Verify with `npm run check` and read only the failing output. Never open `node_modules/` or `dist/`.
- Assets: made in code, or found under a licence that allows shipping them (CC0, CC BY with credit, or made for the
  game), each credited in its folder's `CREDITS.md`. Found recordings and drawn art come first for sound effects, icons
  and interface art. The creature sprites are the author's and code never redraws them.
- Creatures are data, not classes (15–30 lines each); boss phase scripts are data too.
- Deps: `three` (+ `@types/three`), `typescript`, `vite`, `vitest`, `electron`, `electron-builder`, `gamepad-node`,
  `steamworks.js`. Ask before adding anything else.
- Simulation code (combat, stamina, sanity, AI, registry, streaming math) must not import Three.js.
- Out of scope: multiplayer, skeletal animation, mobile.

## Conventions
- Sim: fixed system order in `stepGame`; moves are 60 Hz frame windows `[from, to)`; yaw 0 faces +z, right = (−cos, sin).
- Colours are display sRGB end to end (`ColorManagement` off); every material is a `ShaderMaterial`.
- World materials share one uniform set (`worldUniforms`). FX flow: `FxState → computeFx() → update*Uniforms()`.
- Sanity FX are `[calm, mad]` ramps in `tuning.ts`, blended by stress = min(1 − sanity/100, fx cap); hooks listen to `SanityBandChanged`/`InsightChanged`.
- New creature: its id in `roster.ts` + an entry in its tier file (a `voice`, or its tier's); `npm run check` runs `validateRegistry()`.
- New realm: its look in `data/looks.ts` (its grade, accents, mist, sky, light and far colours); `npm run check` makes no two realms grade alike and keeps every colour that lights or fills the scene from reading as an anomaly hue.
