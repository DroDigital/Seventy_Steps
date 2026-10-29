# Seventy Steps

A Lovecraftian open-world soulslike in retro 3D: Doom-style billboarded sprites in PS1-era low-poly
worlds, from Miskatonic University and Arkham down the Seventy Steps into the Dreamlands and out past
the Ultimate Gate. Its textures, effects and most sounds are generated in code; the creatures' pictures, the
music and the voices are made with generative AI tools, and the code and text were written with Claude (see
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)). The spec is [`docs/SPEC.md`](docs/SPEC.md) and every
judgment call is logged in [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Run it

```sh
npm install
npm run dev        # in the browser, at http://localhost:5173/
npm run check      # typecheck and the tests (Vitest)
npm run build      # a production build into dist/
npm run desktop    # build, then open it in the desktop shell (Electron): what ships on Steam
npm run icon       # write the icon, drawn in code, to build/icon.png for packaging
```

Routes for testing: `?fresh` (a new game, no title), `?arena` (the combat arena), `?bestiary` (every
creature), `?spawn=<id>`, `?look`, `?debug` (the debug panel).

## Play it

| | Keyboard and mouse | Pad |
| --- | --- | --- |
| Move / look | WASD / the mouse | left / right stick |
| Light, heavy attack | LMB, Shift+LMB | RB, RT |
| Block, parry | RMB, Shift+RMB | LB, LT |
| Dodge (hold: sprint) | Space | B |
| Revolver | F | X |
| Lock on | Q | R3 |
| West's Reagent / Laudanum / lamp oil | R / T / G | Y / D-pad ↓ / D-pad ↑ |
| Rest, talk, act | E | A |
| Summon / dismiss mount | B | L3 |
| Map / pause | M / Esc | View / Menu |
| Developer console | ` (backquote) | D-pad Right twice |

Every keyboard action can be rebound under Controls. Prompts name the buttons of whichever device you
used last.

The developer console provides searchable commands and a controller-navigable list for visiting boss
entrances and rooms, spawning creatures, clearing showcase spawns, and toggling free flight. Enter
`help` for command syntax. In flight, move and look with the usual controls; hold Space / B to rise
and right mouse / LB to descend. The world pauses while the console or free camera is active. A
teleport moves the investigator in the current game and can be saved; demo boundaries still apply.

Speak with Peaslee, then find the Sleeper’s Sign to complete **The Borrowed Reins** and unlock the plain chariot,
one horse drawing a wooden coach of the spectral chariot's pattern. Choose a mount at an Elder Sign’s Mounts tab; hold the dodge button while moving to gallop.
The spectral chariot and the $0.99 automobile are optional appearances with the same traversal. Their Steam DLCs need
release configuration before either can be owned: [`docs/MOUNTS.md`](docs/MOUNTS.md).
Inspect the three animated models in the read-only coach house at `?mounts`. The automobile follows a researched
circa-1914 touring design within the requested 1890–1940 range: [`reference research`](docs/MOUNT_CAR_REFERENCES.md).

## Saves

Three slots. In the browser they live in its storage; in the desktop shell they are files in the
user's data folder (`saves/`), alongside the settings and the records of endings and achievements,
where Steam Cloud can keep them.

## Credits

See the in-game Credits, [`public/audio/CREDITS.md`](public/audio/CREDITS.md) and
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Copyright © 2026 Alessandro A. Foddis (DigitalDro). All rights reserved. Source code is publicly viewable for portfolio and evaluation purposes only. No permission is granted to copy, redistribute, modify, or commercially use this project. See [`LICENSE`](LICENSE).
