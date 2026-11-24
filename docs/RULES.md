# Standing rules

What the author has decided, and what stays decided until the author says otherwise. Each line says what it covers and
when it was said; anything not here is open. Change a line only when the author asks, and give it the new date. The
reasoning behind each is in `docs/DECISIONS.md`; the design is `docs/SPEC.md`.

## How the work is done (2026-11-24)
- Do what the message asks and nothing in advance. Plan in 15 lines or fewer, then execute; stop only when blocked.
- Label new work by its date (YYYY-MM-DD) or its PR number, never by a round number: parallel branches claimed the same
  round numbers and renumbered each other at merge. The old round numbers stay where they are.
- `docs/DECISIONS.md` takes one line per judgment call, newest last; longer reasoning goes in the PR description.
- A veto covers what the author named and nothing more. Where its reach is unclear, ask, and write the answer here.
- `CLAUDE.md` is an index: commands, one line per folder, these rules condensed. The detailed folder map is
  `docs/CODEMAP.md` and every tool and route in full is `docs/TOOLS.md`.

## Assets (2026-11-24)
- An asset may be made in code or found, when its licence allows shipping it: CC0, CC BY with credit, or made for the
  game. Each is credited in its folder's `CREDITS.md`.
- For sound effects, icons and interface art, a found recording or drawn piece is the first choice over a generated one.
- Still out: anything whose licence forbids redistributing its files (boss pack 07 and the PSX Shelves pack,
  `tests/bossPlaces.test.ts`), and skeletal animation.
- The creature sprites are the author's: code never redraws them, and improvements are made in the engine
  (round 83: "keep all my sprites, only improve them").

## Bosses and difficulty
- A boss met past its standing grows to meet the investigator at most 1.5 times: its health by Might and the edge of
  the weapon in hand, its blows by Vigour. First journey only; later journeys keep their own scaling (2026-11-24).
- The balance test fails a boss that cannot be beaten or costs more than its band; a fight that costs less than its band
  is a warning in `docs/BALANCE.md`, not a failure (2026-11-24).
- No blow of a foe kills from full health, `BOSS.blowMost` (round 68: "make sure that bosses never one-hit kill").
- No mercy system (round 61: "remove the mercy system entirely").
- Every boss's moveset is its own: no blow is shared between bosses but the summons (2026-11-24,
  `tests/bossMovesets.test.ts`).
- A boss's strongest blows never come twice running and rest a while after; its blows are mostly chosen, a few at
  random (2026-11-06, `systems/attackChoice.ts`).
- Azathoth has no timer and takes no damage over time; it is the hardest fight in the game (2026-10-29).
- No trap on the way to a boss; a rite's wrong light flares harmlessly (round 68). No puzzle before a boss's door
  (round 69).
- No ring of mist about a fight: the fog stands in the arena's gate (round 78). No sigil on a boss hall's floor and no
  wave lines in a boss's aura (2026-11-07); the auras stay faint, each its own (2026-11-15).

## The world and the journey
- Arriving at an Elder Sign, by rising or by travel, the investigator is never attacked at once (round 88).
- The way to each ending is always told and can never be shut (round 70).
- A realm's gate has no key: it is walked into, and nearing one says where it leads; boss fogs keep E (round 60).
- No foe is posted inside a wall or a house (`tests/enclosedAudit.test.ts`).

## Look and sound
- Colour means something is wrong: only the three anomaly hues are saturated near themselves. A scene colour saturated
  past 0.3 is held 36 degrees of hue from each: `FX.hueWidth`, the post pass's own window, which the tests read. A window
  of 18 degrees was tried (2026-11-24): it changed almost nothing seen at five places, would dim lit anomalies under the
  lantern, and adds colour only once colours are made to use it. It waits on the author.
- Falling sanity never coarsens the picture; the wavy morphing stays (playtest round 7).
- Brightness defaults to 100% on the plain gamma, with no toe curve (round 103). There is no brightness calibration
  menu, and the title's backdrop is pure black (2026-11-24).
- The camera's default look is Classic (2026-11-23); there is no Long lens (after round 82).
- A drawn creature's body does not lean, breathe or sway: the lean into a run was declined (round 83: "I think the
  lean in for a run will look cheap") and so were idle breath and sway (2026-11-24). For the investigator and the
  people this is open; round 116 added no lean into a run or a turn.
- Hints stay off the screen, in the Journal's Field Guide (round 58). Only the six control cards show, at the lower
  left, and Settings › Play › Control tips turns them off (2026-11-01).
- Gone and not to come back: the chariot's rein slaps (round 60), Yuggoth's buzzing bed (round 68) and the lantern's
  metal clatter in a walk (round 83). The horse stays sparing with its sounds (round 68).
