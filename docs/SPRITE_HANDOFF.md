# Sprite walks: handoff (2026-10-07, v6)

Where the work on the creature library's walks stands, for whoever picks it up next. Laid over the author's folder,
`walk_fix_v6.zip` leaves nothing the audit gates on: `sprite_review.py audit --strict` exits 0 there, and what it
still lists are 30 gliders on two keys (advisory: the engine moves them). Codex's own measure (the flags of its
MEASUREMENTS.csv, recomputed) leaves 28, each on a flier or a glider, which keep no ground line, or on a boss
assembly: Dunwich's back, the Colossus, Cthulhu and Father Dagon within the brief's 8% of their idles (Codex's
measure allows 3 px), Azathoth, Yog-Sothoth and Shub-Niggurath measured against idles whose sparkles add height.

## Done
- Review tooling: `tools/sprite_review.py` (audit, sheets, fix) and `docs/SPRITE_QA.md` (the walk rules). The
  audit's `turned` check finds a side frame that faces the other way from its idle.
- `tools/sprites/walk4.py`: 4-frame side walks for 13 two-legged creatures (18 sides), made from their own pixels.
- Codex drew 4-frame walks for the Deep One (both forms, left) and Joseph Curwen (left and right). They exist only
  in the author's folder; the gallery page lists them (`move_2`/`move_3` by the paths of their `move_0`).
- `tools/sprites/fromsheet.py`: an image model's 2x2 sheet (four walk frames on flat magenta) to the pack's frames,
  a sprite's 64x64 or a colossus's movement canvas (docs/SPRITE_QA.md says how): 48 sides in v5, 74 in v6.
- `tools/sprites/ground.py` (every grounded creature on the brief's ground line) and `tools/sprites/legswap.py` (a
  walk's second half from its first, its legs' shades exchanged): v6, no drawing.
- `tools/sprites/v1fixes.py`: the v1 defects that need no drawing (the Innsmouth Hybrid's swapped sides, Cthulhu's
  swapped views, the Colossus's right drawn apart from its left, the gallery's load error and its banner).
- `tools/sprites/deliver.py`: the hand-over, **`walk_fix_v6.zip`** (22 MB): `previews/library.html` and the 76
  creature folders the new frames are in, whole (2,614 files; 727 new frames in 169 sides).
- The sheets: ElevenLabs `gpt-image-2.5-sunburst` (1:1, 1K, quality medium), one generation per try, in four flows
  (A `xxs21sloIhwgH2eXW5QE`, B `jxB0JSq3Gr6tOiofWOVf`, C `7JT6s9L2XFThTJagbisX`, D `FEJIgzgUpUevmy9m7ZVU`); a
  node's `content_url` is signed and lasts two hours. v5: 108 generations, about 36,800 credits. v6: 135
  generations and two image edits (`gemini-3-pro-image`, 1,827 credits each), about 49,600 credits.

## walk_fix_v6: what it mends
Asked to mend everything left (Codex's review and measurements, the four walks whose legs still repeated, every
finding the strict audit gates on), v6 draws 74 sides again and mends the rest in code.
- **Legs** (5 sides): the Ghoul, Brown Jenkin, Rhan-Tegoth and the Wamp, whose legs still repeated after v5, and
  Bokrug, whose forelegs only half exchanged. Brown Jenkin and Bokrug passed on the first sheet. Rhan-Tegoth's
  three sheets repeated; an image edit of one kept its top row and drew the bottom row in the other phase. The
  Ghoul's and the Wamp's sheets drew a good contact and passing pose but repeated them, so those two cells are
  kept (`--frames move_0,move_1,-,-`) and `legswap.py` makes the second half: the Ghoul's two legs exchange their
  shades; the Wamp, a crawler whose legs are alike in tone, has each leg mirrored about its own hip.
- **Area** (8): the two halves of a stride more than 15% apart in area. The left walks of the Dagon Priest
  (eldritch), the Cthulhu Cultist, the Serpent Man, Simon Orne, Ephraim Waite (eldritch), Zkauba and Nyarlathotep,
  and the Martense degenerate's right, drawn again with a short stride and the four cells one width.
- **Front and back** (29): walks a measure flagged (a move frame more than 3 px off the idle's height, the two
  frames apart in area, the legs hardly moving), now four frames each; the Night-gaunt's back is four keys of a
  hovering wingbeat. The first sheets drew both passing poses "feet together", one picture twice, and robes whose
  hem hardly moved; the retries lift a different foot in each passing pose and swing the hem to the stepping side.
- **Gliders** (28): what slithers, oozes or floats and whose two move keys were out of size against the idle
  (taller or shorter by more than 3 px, or apart in area): the Shoggoth in both forms, Being from Beyond, the
  Flying Polyp in both forms, Formless Spawn, the Curwen Pit Thing in all four directions, the Colour, the Elder
  Thing, the Serpent Man's eldritch form, the Shunned House entity, Nug, Yeb, and the two by-eye notes, the Dhole
  (it snapped between two shapes) and the Whisperer's chair: four keys of one motion each. The Shoggoth boss's left
  takes its idle from the first key (`--frames idle_0+move_0,move_1,move_2,move_3`), so idle and motion are one
  drawing.
- **Mother Hydra** (boss, 4): its movement on the 128-px canvas. Its left came out seen from the front, so it is
  its right sheet with each cell mirrored where it stands (`--flip-cells`); the Elder Thing's left sheet, drawn
  facing right, is mended the same way.
- **In code**: every grounded creature on the ground line (`ground.py`; 33 sides needed nothing else), the
  Colossus of the Pyramids' right as its left, flipped (v1's right was drawn apart, `move_0` squashed to 83 px
  against the idle's 95; `v1fixes.py`).

## Checked
- The audit of the v6 pack: 41 findings, 30 of them the advisory gliders and 11 on Codex's four sides, which the
  pack has as published (v1). Laid over a copy of the author's folder (as v5 left it, and as the site has it),
  merged or by replacing folders, with Codex's own frames copied from the author's Drive: `audit --strict` exits
  0, the 30 gliders alone. Codex's measure: 131 flags in v5's pack, 30 in v6's, 28 with Codex's frames in place.
- By eye: every side beside its idle, and its two contacts side by side at 8x, brightened; no frame turned.
- In Chromium, in all four of those folders: the 3,082 images the page lists load, no page error, and the page's
  mends hold (the banner, Cthulhu's views, the load error clearing).
- Codex's frames: the zip ships the Deep One's folder whole, Codex's twelve frames in it byte for byte as the
  author's Drive has them (`deliver.py --theirs-from`), every other file in it as the author has it or as v6
  draws it (the base form's back walk). Curwen's folder holds no change and is not in the zip.

## Accepted, not mended
- The Shoggoth boss's back: its move frames 57 px wide against a 48 px idle (the original `move_0` was 56).
- The Dhole's back: its moves sit about 4 px right of the idle, the head swaying 4.4 px (the tail must clear the
  canvas's edge).
- The Cat from Saturn's back: the tail changes sides from step to step (a sway; see "mirror" below).
- Being from Beyond's, the Flying Polyp's and Formless Spawn's left, the Mother Hydra's back: wider than their
  idles, as their originals were.
- The Ghast's back: the upper body drifts 0.8 px (0.7 before).
- Older walks whose legs exchange only weakly in tone, which Codex did not flag: the Star Spawn, Lilith, Wilbur
  Whateley, the Medusa Gorgon, Ephraim Waite (base). Dr Muñoz exchanges by eye; his dark shoes fool the measure.
- The Whisperer: four keys of his chair's glide. Whether he moves at all is the game's call.

## Codex's sides and the by-eye notes
Codex's redraws, seen from the author's Drive, mend what `tools/sprites/notes.json` said of v1: the Deep One's left
faces left in both forms and walks upright, from its idle; Curwen's left keeps its colours and his right its size.
Those notes are gone, with the Dhole's and the Whisperer's (redrawn in v6): no by-eye note is left. The Deep One's
facing note also told `fix` to mirror its left, which would now turn Codex's redraw the wrong way. The site still
shows v1 for those four sides until the author publishes again.

## Left
- The 30 glider sides on two keys: motion in the engine (a bob, a squash, a sway) or four keys each.
- `docs/SPRITE_REVIEW.md` is still the audit of v1: regenerate it from the author's folder once v6 is laid over it
  (`audit <dir> --report docs/SPRITE_REVIEW.md`).
- Bringing the library into the game (docs/SPRITE_QA.md, the last section).

## Earlier hand-overs
- **v5** (the leg exchange): Codex's review found the sheet-made walks' second contact repeating the first in 31
  sides; asked for "the legs exchanged", the model had drawn the same contact again, and the audit's `same-leg`
  only catches copies. Naming each leg by its colour (the near leg light, the far leg dark), saying where each foot
  goes and asking for cell 3 as cell 1 recoloured got 27 of them in two rounds. Judged by eye on the contacts'
  lower 40% at 8x, brightened; the measure of which foot leads is fooled by four legs, robes and dark shoes.
- **v3** held only the changed frames. Laid over the author's folder by replacing each creature folder (Finder's
  "Replace") instead of merging, it deleted everything else in those 54 folders: 1,465 listed files, and what the
  page does not list (a creature's `QA.json`, which the site does not serve). Since v4 every zip carries its
  folders whole. Unzip by merging: `ditto -x -k walk_fix_v6.zip <folder>` on a Mac, or `unzip -o walk_fix_v6.zip
  -d <folder>`.

## Rebuilding walk_fix_v6.zip (the scratch folders go with the session)
This rebuild was run end to end from the published pack: the zip came out byte for byte the same.
1. `python3 tools/sprite_review.py fetch <site> published --all`, `cp -r published pack`, `mkdir pack/previews`,
   `cp pack/index.html pack/previews/library.html`, then `python3 tools/sprites/walk4.py pack` and
   `python3 tools/sprites/ground.py pack`.
2. v5's sides, each `fromsheet.py <sheet> pack <key> <side>` with the n-th generation of that side in flows A to C
   (the first where none is named), `--mirror-right` for the Terrible Old Man and Tsathoggua: Dagon Priest, Ghast,
   Shantak, Zoog, Night-gaunt, Moon-beast, Cat from Saturn, Y'm-bhi, Martense degenerate, Exham Troglodyte,
   Thousand Young, Keziah Mason (left and right), Whisperer (eldritch), Charles le Sorcier, Terrible Old Man: 2;
   Gnorri, Venusian man-lizard, Gnoph-keh, Gug, Yekubian, Black Man, Edward Hutchinson, the Outsider (left and
   right): 3; Beast in the Cave: 4; Man of Leng, Albino Penguin, Hybrid Mummy, Ghoul (eldritch), Gyaa-Yothn, Winged
   Hybrid, Being of Ib, Nameless City reptile, the Hound, Tsathoggua: 1. All left unless named.
3. v6's 74 sides, from each side's node in flows A to D, the first generation unless named: Brown Jenkin, Bokrug,
   Zkauba, Nyarlathotep (left) and Dagon Priest (eldritch, left): 1; Cthulhu Cultist (left, back), Simon Orne
   (left), Martense degenerate (right), Black Man (back), Edward Hutchinson (front), Ghast (back): 2; Serpent Man
   (left), Flying Polyp (boss, left), the Colour (left), Cat from Saturn (back), Albino Penguin (front), Nyarlathotep
   (back), Dagon Priest (back): 3; Shoggoth (boss, back), Albino Penguin (back), Dagon Priest (front), Rhan-Tegoth
   (left, the image edit): 4; Ephraim Waite (eldritch, left): 5. Flags: `--mirror-right` for Rhan-Tegoth, Bokrug,
   Zkauba, Nyarlathotep, Nug and Yeb (left); `--frames move_0,move_1,-,-` for the Ghoul (its 2nd) and the Wamp
   (its 3rd); `--frames idle_0+move_0,move_1,move_2,move_3` for the Shoggoth boss's left; `--flip-cells` for the
   Elder Thing's left and for the Mother Hydra's left, which takes its right's first sheet. Convert each side once:
   the frames it replaces lend their colours.
4. `python3 tools/sprites/legswap.py pack ghoul left` and `python3 tools/sprites/legswap.py pack wamp left
   --mirror-legs`.
5. `python3 tools/sprites/v1fixes.py pack` (once), then `python3 tools/sprite_review.py audit pack`: 41 findings,
   as above.
6. `python3 tools/sprites/deliver.py pack published walk_fix_v6.zip --theirs-from <Codex's frames> --theirs
   deep_one:left 'deep_one#eldritch:left' joseph_curwen:left joseph_curwen:right`, where `<Codex's frames>` holds
   the Deep One's two left folders as the author has them (`sprites/deep_one/64x64/left`,
   `sprites/deep_one/eldritch/64x64/left`).

## Making a sheet again
1. Reference: the creature's `contacts.animation` sheet from the pack data (for example
   `<site>/contact_sheets/ghoul-animation.png`; an eldritch form is `<id>-eldritch-animation.png`), attached to an
   ElevenLabs flow with `creative_attach_reference_file`.
2. An `image-generation` node, `gpt-image-2.5-sunburst`, `{"aspect_ratio":"1:1","resolution":"1K","quality":"medium"}`,
   wired to the reference, run with `generations_count: 1` (up to 20 nodes per `creative_run_flow_nodes`; poll
   `creative_get_flow_run_status` with up to 20 session ids; a long result is saved to a file, read it with a
   script). The prompt for a two-legged walker facing left (swap left and right for a right side):

   > Pixel-art game sprite sheet, a 2x2 grid of four equal square cells on a flat solid magenta (#FF00FF)
   > background, no borders, no text, no labels, no shadows on the ground. Subject: the {creature} from the
   > reference sheet (the left-facing frames labelled "left idle_0", "left move_0", "left move_1"): {one line on
   > its look}, seen exactly side-on, facing LEFT. Every one of the four cells faces LEFT, its head on the left
   > side of the cell exactly as in the reference's left frames: never flip or mirror the figure from one cell to
   > the next. Keep its exact design, proportions, palette, chunky low-resolution pixel style and size from the
   > reference; same scale in every cell, feet on the same ground line in every cell, body centred in each cell.
   > The two legs must be easy to tell apart in every cell: the NEAR leg in the lighter tones of the reference,
   > drawn on top; the FAR leg in clearly darker shadow tones, drawn behind it. The four cells are one walk cycle,
   > read left-to-right, top-to-bottom. 1. Contact, widest stride: the LIGHT near leg is the front leg, stepping
   > toward the left edge of the cell; the DARK far leg is the back leg, pushing off toward the right edge.
   > 2. Passing: the LIGHT near leg stands straight under the body; the DARK far leg is bent, its foot lifted,
   > swinging forward beside it. 3. Contact, the same stride and outline as cell 1 with the two legs exchanged:
   > the DARK far leg is the front leg and the LIGHT near leg trails, drawn over the dark leg where they cross.
   > 4. Passing, cell 2 with the legs exchanged. Cells 1 and 3 must not be the same picture. The arms swing
   > opposite to the legs. Draw cell 3 by recolouring cell 1: the leg that is light in cell 1 is dark in cell 3
   > and the dark one light; cell 4 is cell 2 recoloured the same way. Use the lightest tones of the reference
   > for the near leg and the darkest for the far leg. Cells 2 and 4 must not be the same picture either.
   > Constraints: do not redesign the creature, no extra limbs, no new colours, crisp hard pixel edges, no
   > anti-aliasing, no blur.

   A robe: only the feet show under the hem, the light foot steps out at the front in cell 1 and trails in cell 3,
   the hem's folds swing the other way. Four legs: count the feet from the front edge (cell 1 light, dark, dark,
   light; cell 3 dark, light, light, dark). Many legs: the light near legs forward and the dark far legs back in
   cell 1, the other way in cell 3, every leg angled well forward or back.
3. What the retries added: a short stride and the figure the same width in every cell (a long stride is cut at the
   cell's edge, and a contact much wider than its passing pose fails `pair-size`); the colours "exactly as in the
   reference" and the ones to leave out (Gnorri came back tan); "its glowing eyes stay visible in every cell";
   Nyarlathotep's passing foot "bent at the knee under the hip, never swung behind the body like a tail"; "keep
   the upright posture and the full height of idle_0" for a walk that stooped.
4. Front and back: seen from the front, cell 1 the figure's own left foot steps forward, cell 2 the weight on the
   straight left leg and the right foot lifted clearly off the ground, two or three pixels higher, cells 3 and 4
   the same on the other foot; the head and body still. Never "feet together" in a passing pose: both passing
   cells come back as one picture. A robe's hem swings and lifts toward the stepping foot and bunches over the
   lifted one; four legs move in diagonal pairs; a waddle leans two pixels to the stepping side.
5. What glides, flies or oozes: "four evenly spaced keys of ONE slow, smooth, looping {motion}: not four different
   poses", each cell the idle's pose and outline changed a little, cell 4 leading back into cell 1, every cell in
   the idle's rendering and solidity, "hovering at the same height" or "resting on the same ground line". A boss:
   the same, "Pixel-art game boss sprite sheet", converted onto its movement canvas.
6. Never call a cell "the mirror" or "a mirror image" of another: the model reads it as a flip of the figure (three
   v5 sheets turned their second half around; the Cat from Saturn's back swings its tail from side to side).
   Name which foot each cell lifts instead.
7. `fromsheet.py` the result; `sprite_review.py audit`; look at each walk beside its idle, and at its two
   contacts side by side, brightened: the audit sees neither a figure turned to the viewer nor a leg exchange.
