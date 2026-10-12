# Reviewed creature artwork

The game uses the accepted 105-entry creature library for every enemy form: 93 base enemies and 12 variants. Its 2,577 registered source PNGs are packed without resizing, trimming, recoloring or changing frame order.

## Runtime files

- `public/creatures/reviewed/index.json`: page rectangles, native canvas sizes, scales, directions, mirror flags and action registrations.
- `public/creatures/reviewed/creatures-0.png` through `creatures-3.png`: four lossless PNG texture pages, with transparent gutters and nearest filtering.
- `public/creatures/reviewed/source-index.json`: the active source registrations used to build this pack.

These files are copied into `dist/creatures/reviewed/` by the normal production build and served by the existing Electron package. No separate sprite folder needs to be installed into the game. The seven allies that have no supplied artwork retain their procedural sprites.

## Animation behavior

Front, back, left and right are selected from the creature's facing relative to the camera, with a ten-degree margin to prevent flickering between views. A right view mirrors its source only when the registration explicitly requests it. The normal Innsmouth Hybrid has its two physical side folders labeled in reverse; its complete idle/walk view registrations are routed to the correct facing, with their pixels intact. Its eldritch variant retains its authored registration. Each accepted walk uses its actual two, four, six or eight frames over one second; direction changes retain the same cycle phase. Idles use their full registered frame count over 1.25 seconds. Combat poses follow the existing windup, strike, recovery and reaction timing. Where the library supplies combat art only for the front, that authored action is used.

All frames of a creature keep one canvas scale and ground anchor taken from its front idle. Boss height follows the existing world scale; Cthulhu retains its 128×160 aspect. Reviewed PNG alpha is transparency, rather than the old procedural eye-glow marker. Procedural row distortion, void replacement and automatic recoloring do not modify these sprites. World lighting, fog, damage flashes and visibility still apply.

## Inspecting the artwork

- `?bestiary` displays all 105 reviewed forms and seven allies, cycling every registered direction and action. Each card identifies the current view, action and frame; clicking it spawns that exact form in the arena.
- `?spawn=deep_one&debug` starts a creature test with read-only animation diagnostics.
- `?spawn=deep_one&variant=eldritch&debug` tests a variant.
- `?spawn=cthulhu&debug` tests the tall boss canvas.

Gameplay definitions, AI, collisions, attack hit windows and saves are unchanged by the artwork import.

## Rebuilding and checking

Run `python3 tools/pack_reviewed_assets.py --source /path/to/accepted/library --output public/creatures/reviewed` with Pillow available. The source folder must contain its current `CURRENT-GAME-ANIMATIONS.json` and every referenced PNG. The packer rejects changed source hashes and verifies every RGBA crop after packing.

`npm run check:all` includes checks for all 105 registry keys, all 1,050 animation scopes, every packed frame's RGBA hash and bounds, native canvases, mirroring, variable animation timing and Electron asset serving. `npm run build` includes the artwork in the production game.
