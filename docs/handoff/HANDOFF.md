# Handoff: a different place for every main boss (22 Oct 2026)

For a fresh session picking this up (another account, no memory of the thread). Branch: `claude/relaxed-curie-w5lwve`, PR #152 (open, CI green on its head, mergeable). Read `CLAUDE.md` and `docs/SPEC.md` first as usual. **Nothing below has been built: it is planning. Show Dro the plan and get a go-ahead before editing code for it.**

## What Dro asked for (verbatim, in order)

1. "Why only houses? create a very different structure or and/or accompanying area for each boss. think of: castles, ruins, huge cemeteries, mazes, underground megastructures, weird incomprehensible structures, maybe one out in the sea (cthulu?), and/or portals that lead into another boss dimension that is full of fitting vfx and atmosphere like all the other places, each one should be lore fitting and include fitting external free assets if needed"
2. "each horrors boss arena outside should be enclosed by a structure or building of any kind that is thematically lore accurate, its very important to make it thematically fitting, instead of random buildings or ruins, etc."
3. "Each structure should incorporate extensive visual effects, dynamic animation, and stylized elements that reflect the boss and overarching theme. These enhancements—applied both internally and externally—are intended to heighten visual vitality and immersion."
4. "not only the ones on the outside open world but all 27 main bosses (including all the outer gods too) should be overhauled accordingly."
5. "the outer gods boss arenas should have particularly unique and incomprehensible way of how they are portrayed and discovered, just like in the original lore."

Earlier (before this thread): "also do 1.-3." meaning PR 152's three follow-ups: (1) measure performance, (2) look at every court and the five turned gates, (3) a Field Guide hint for a shut gate and a ring for a vigil.

## Done

- **PR 152, item 3 (pushed, CI green):** `hint.gate` in four languages + Field Guide entry *Shut gates*, raised by `ui/hintWatch.ts` near any shut `minFound` gate; a vigil's ring on the ground (`systems/discovery.ts` `vigilsNear`, `render/vigilMarks.ts`, `GroundFx.steady`). Tests in `tests/hintWatch.test.ts` and `tests/discovery.test.ts`; logged in `docs/DECISIONS.md` (round 64) and `CHANGELOG.md`.
- **PR 152 review fix (pushed, thread resolved):** the Other Gods' frost drained stamina that the ordinary regen refilled the same frame; now through `stamina.spend` (`systems/ways.ts`), test in `tests/ways.test.ts`.
- **Item 1, performance:** `PERF-arenas-main-vs-pr152.md` in this folder. The houses add about 52k triangles at an arena's heart on average and nothing measurable at the court; the PR's 802k was not reproduced. Software rendering, one run, about ±250k noise.
- **Item 2, stills:** 76 stills (court from 30 m, gate from 9 m, side, inside) of all 19 houses, as ten contact sheets in project files `/mnt/project-files/seventy-steps/house-stills/` (not in git). What they show: every house reads as a near-black slab wall and a near-black slab gate, much alike from outside (Yog-Sothoth's and Azathoth's gates are the same dark slab as the Black Man's), the great-words banner covers many shots, no broken geometry or gaps were seen in the ten sheets looked at (sheets 4 to 6, 9 and 10 were not looked at). The five gates turned away from the Elder Sign are the Gorgon, Simon Orne, Hutchinson, the Sphinx and Nug (`plan.json` was not kept; the run printed `TURNED` for them).
- **Planning (the big task):** three workflows each read the code, drew two independent designs and merged them: Plan A (the 19 open arenas), Plan B (the 27 dungeon and lair boss halls and the bosses with neither), Plan C (the eight Outer Gods; 'Umr at-Tawil has a hall, Nyarlathotep's place is part of the plan). Merged drafts are `plan-A-open-arenas.md`, `plan-B-boss-halls.md`, `plan-C-outer-gods.md` (and `.draft.json`) here. The raw reader and designer outputs (about 1.1 MB) are in project files `/mnt/project-files/seventy-steps/handoff/*.raw.json`.

## Not done

- **Skeptical reviews (feasibility, lore, anything alike, anything unfair, corrections) are done for all three plans:** `plan-A-open-arenas.critique.md`, `plan-B-boss-halls.critique.md`, `plan-C-outer-gods.critique.md` (each also `.json`). The drafts themselves were not rewritten: the merged document has to apply the corrections. Plan C's lore reader (`understand:lore`) failed once, so its lore section rests on the designers' own knowledge; its critique lists the points to check against the texts.
- **The merged plan for Dro is written:** `MERGED-PLAN.md` here (also a Claude Doc, https://claude.ai/artifact/Ls42B3o2ZXEsGmNXgM7nuA), with the reviews applied and 13 decisions put to him. **Waiting on Dro's answers (in particular decisions 1 to 4, 6 and 13).** Nothing has been built.
- Reconcile the three plans: A's houses, B's halls and C's gods overlap (six Outer Gods are open arenas in A; Plan C should win for them). Keep the discoveries/gates/courts machinery of round 63 where a plan says keep.
- Five turned gates and the remaining contact sheets: not examined closely.
- Building any of it: not started, and not to be started before Dro agrees to a plan.

## How things were run (to repeat)

- `npm ci`, `npm run check` (300 files, 2846 tests, about 3 min), dev server `npx vite --port 5173`, Chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` with `--use-gl=swiftshader --enable-unsafe-swiftshader`, Playwright installed in a scratch folder (`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i playwright`). Open `?fresh&debug`; `window.game`, `window.pipeline` exist; `import('/src/systems/checkpoints.ts')` inside `page.evaluate` gives `teleport(game, {x, z, yaw})`; `import('/src/world/placements.ts').worldLayout().arenas` gives each arena's `x, z, radius, front, house`; the debug panel covers the left of the picture (H hides it).
- Software rendering is about 1 frame a second: allow 25 s after a teleport for chunks to build.
- Free asset path already in the repo: `tools/models/bake_models.py` bakes CC0 Kenney kits into `src/data/models` (59 models, credited in `src/data/models/CREDITS.md`); anything else needs the same treatment and Dro's say-so (CLAUDE.md: ask before adding dependencies; no loaded asset files).

## Ground rules from the project

Ask Dro before pushing anything beyond this branch, merging, or opening a new PR. Commits end with the Co-Authored-By and Claude-Session lines. PR bodies begin with the attribution block the project gave.
