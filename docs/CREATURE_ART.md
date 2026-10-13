# Reviewed creature artwork

The game uses the accepted 105-entry creature library for every enemy form: 93 base enemies and 12 variants. Its 2,577 registered source PNGs are packed without resizing, trimming, recoloring or changing frame order; what the author drew afterwards is packed beside them: the stoop of seven colossi (14 frames) and its in-between pose (7), the nine bosses' left and back attack and hurt (126), and 'Umr at-Tawil drawn again whole (his 17 frames put in place of the old, and 4 more for a right view of his own).

## Runtime files

- `public/creatures/reviewed/index.json`: page rectangles, native canvas sizes, scales, directions, mirror flags and action registrations.
- `public/creatures/reviewed/creatures-0.png` through `creatures-3.png`: four lossless PNG texture pages, with transparent gutters and nearest filtering; `creatures-4.png` holds the fourteen stoop frames, `creatures-5.png` the seven in-between frames and `creatures-6.png` the bosses' 126 side and back frames; 'Umr at-Tawil's new frames are in place on `creatures-3.png` (which grew a shelf at its foot for his right view).
- `public/creatures/reviewed/source-index.json`: the active source registrations used to build this pack.

These files are copied into `dist/creatures/reviewed/` by the normal production build and served by the existing Electron package. No separate sprite folder needs to be installed into the game. The seven allies that have no supplied artwork retain their procedural sprites.

## Animation behavior

Front, back, left and right are selected from the creature's facing relative to the camera, with a ten-degree margin to prevent flickering between views. A right view mirrors its source only when the registration explicitly requests it. The normal Innsmouth Hybrid has its two physical side folders labeled in reverse; its complete idle/walk view registrations are routed to the correct facing, with their pixels intact. Its eldritch variant retains its authored registration. Each accepted walk uses its actual two, four, six or eight frames over one second; direction changes retain the same cycle phase. Idles use their full registered frame count over 1.25 seconds. Combat poses follow the existing windup, strike, recovery and reaction timing. Where the library supplies combat art only for the front, that authored action is used; the nine bosses (the colossi, Yog-Sothoth, the Dunwich Horror) also have their attack and hurt drawn from their left and from their back, so a boss that swings while it is circled is drawn from the side it is seen, and its right is its left mirrored once (`reviewedClips`).

All frames of a creature keep one canvas scale and ground anchor taken from its front idle. Boss height follows the existing world scale; Cthulhu retains its 128×160 aspect. Reviewed PNG alpha is transparency, rather than the old procedural eye-glow marker. Procedural row distortion, void replacement and automatic recoloring do not modify these sprites, except on a hallucination (and a boss's decoy), which slips and glitches as it always has: that glitch is the mind's tell that it was never there. World lighting, fog, damage flashes and visibility still apply.

## Inspecting the artwork

- `?bestiary` displays all 105 reviewed forms and seven allies, cycling every registered direction and action. Each card identifies the current view, action and frame; clicking it spawns that exact form in the arena.
- `?spawn=deep_one&debug` starts a creature test with read-only animation diagnostics.
- `?spawn=deep_one&variant=eldritch&debug` tests a variant.
- `?spawn=cthulhu&debug` tests the tall boss canvas.

Gameplay definitions, AI, collisions, attack hit windows and saves are unchanged by the artwork import.

## In-game audit (2026-10-13)

All 105 forms were put in the arena (`?spawn=<id>[&variant=…]&debug`) with the world held still and read through `render_game_to_text()`: four idle views (front, left, back, right), a move, the first attack, a stagger and the death, each checked for the view, state, frame, source file and flip it should show; the nine bosses were also seen whole from a distance, and the rest from beside the investigator. Every form reports what it should, none is left undrawn for want of a clip, every one stands on the ground at a size its body fits (art height against the combat capsule: 0.6–1.7×; Martin's Beach Horror and the Yekubian stand taller than their capsule, Nug and the Formless Spawn shorter), and none is cropped. What looks missing is the game hiding it: the Dunwich Horror until revealed, the ambushers and burrower (Beast in the Cave, Formless Spawn, Nameless City Reptile, Dhole) until the investigator is near, Being from Beyond on its hidden layer, and the invisible stalkers (Flying Polyp, the Unnamable, Being from Beyond) as a shimmer until they strike.

Mended: hallucinations and decoys had lost their glitch (the integration set every form's weirdness to 0), so they looked exactly like real creatures.

Mended afterwards, on the author's asking (none of it redraws a frame):

- The outer gods (Azathoth, Shub-Niggurath, Yog-Sothoth) trail their two dithered echoes again, drawn from the same art at the lag, share and drift the 3D bodies had (`ECHOES`, `echoDrift` in `render/eldritch.ts`).
- Reviewed creatures and bosses keep their authored colours under the world's light. The added pale rims and shading floor have been removed at the author's request.
- The five lathed colossi (Cthulhu, Father Dagon, Mother Hydra, Ghatanothoa, the Colossus) are struck where their picture shows them: `tools/reviewed_look.py` measures the half-width of each boss form's front idle in the three bands its hurt zones are (legs, torso, head; `ZONES` in `data/bossTuning.ts`) as the 75th percentile of its rows, into `REVIEWED_BODY`; `toCombatant` gives it to a lathed body as `assembly.painted`, and `zoneShapes` makes each band at least that wide (never narrower than before). A mound (Azathoth, Shub-Niggurath: a low mass under motes that fill the picture) and a body of spheres (Yog-Sothoth: `hit`) keep their own.
- Yog-Sothoth is struck where its spheres are painted: its recipe carries seven spheres fitted to the front art (`hit`), ringed about the body so they stand as seen from any side, none past a blade's reach of its body, the lowest on the ground (`pictured` in `data/assemblyShape.ts`; `tests/hurtZones.test.ts` ties them to the art's own scale).
- Eyes glow in the dark as the investigator nears, and look out of a mist, for ten forms whose eyes were found and looked at (`REVIEWED_EYES`, same tool; a mark that is a tooth, a gem, a visor or a dim amber was not taken). Front view only: the art holds them nowhere else.

Left as they are, for the author:

- Attack and hurt art exist only from the front, for all 105 forms: seen from the side or behind, a creature that strikes or is struck shows its front. Side and back art for those two states would end it.
- The seven colossi whose weak head comes down after each blow of their own no longer showed it: the stoop hint and the head zone worked, but the picture stood straight. (Mended since: see "The stoop" below.)
- The eight colossi are painted 1.3 to 1.65 times wider than their combat radius, so the investigator can stand inside the painted body; widening the capsules is a balance change, and was not made.
- Eyes of the forms not in `REVIEWED_EYES` (the Shoggoths' green spots, the rat swarm's and Wamp's amber, the Haunter's visor, and any seen from the side) are not given a glow.

## The stoop

Seven colossi (the Colossus, Cthulhu, Father Dagon, Mother Hydra, Ghatanothoa, Azathoth, Shub-Niggurath) have a drawn pose for the moment their head comes down: two front frames, `stoop_0` (the bow) and `stoop_1` (the hold), on the canvas, scale and ground line of their front idle, in the palette of that idle (the author's `Seventy-Steps-Colossi-Front-Bow-Hold-oct13` delivery). A third frame, `stoop_mid` (the author's `Seventy-Steps-Colossi-Stoop-Mid` delivery), is the pose halfway between the idle and the bow, on the same canvas and ground line and no lower than the bow nor taller than the idle (a mound's height barely changes, so its halfway shape differs instead). While `stooped()` (`systems/hurt.ts`: recovering from the creature's own blow and a little after, or reeling from a stagger or a parry) is true, the billboard comes down through that pose for `FEEDBACK.midSeconds`, shows the bow for `FEEDBACK.bowSeconds`, then holds the last frame until the stoop ends; it then stands up through the halfway pose for `FEEDBACK.riseSeconds` and goes back to its idle (without the halfway frame, as it was: the bow at once, the idle at once); the weak-head hit zone is the same, so what is struck is what is shown. The art is front only, so from the side or behind the front pose is used, as for attack and hurt. The outer gods' echoes bow a moment behind. `?bestiary` cycles it with the other actions.

## Later deliveries

The frames are added to the pack by `python3 tools/add_reviewed_frames.py [--dry] <delivery folder>` (Pillow): the folder's one `*MANIFEST.json` names, for a front-only action (the stoop, `stoop_mid`) or by view (the bosses' left and back attack and hurt), each frame's path, hash and bounds. It checks each frame's bytes against the manifest, that the canvas and the idle (`idleSha256`) are those of its view in the pack, and that its ground line stands within two pixels of the idle's (exactly, for the stoop's; four for Yog-Sothoth, whose base drifts); refuses a view that already has the action; puts the frames on a page of their own after the pack's; registers them in `index.json` and `source-index.json`; and the integrity test holds them to the same account as the library (2,728 frames, 1,100 scopes). `--dry` checks everything and writes nothing. A creature the author drew again whole ('Umr at-Tawil: no manifest, the library's tree of PNGs) goes in by `python3 tools/replace_reviewed_sprite.py [--dry] <key> <folder>`: each frame is pasted over the old one's rectangle on its page, a view he had by mirroring (his right) and the delivery draws on its own gets its frames on a new shelf at the foot of the page and no longer mirrors, and the hashes, bounds and both indexes follow. The painted body measured from each boss's idle for its hurt zones, and the look of each form's edge, are regenerated with `python3 tools/reviewed_look.py`. `tools/pack_reviewed_assets.py` rebuilds the pack from the library alone, so after a repack run the tools again on each delivery in the order they came (or add them to the library's registrations first).

## Rebuilding and checking

Run `python3 tools/pack_reviewed_assets.py --source /path/to/accepted/library --output public/creatures/reviewed` with Pillow available. The source folder must contain its current `CURRENT-GAME-ANIMATIONS.json` and every referenced PNG. The packer rejects changed source hashes and verifies every RGBA crop after packing.

`npm run check:all` includes checks for all 105 registry keys, all 1,100 animation scopes (1,050 of the library, the stoop and its halfway pose of seven colossi, and the bosses' left and back attack and hurt), every packed frame's RGBA hash and bounds, native canvases, mirroring, variable animation timing and Electron asset serving. `npm run build` includes the artwork in the production game.
