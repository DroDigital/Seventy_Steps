# Sprite walks: handoff (2026-10-07)

Where the work on the creature library's walks stands, for whoever picks it up next. Every side the audit asked
to be four frames is four frames, except the ones that are not to be drawn (below); 27 of the 31 sheet-made walks
whose two contacts were one picture now exchange their legs, and four still do not.

## Done
- Review tooling: `tools/sprite_review.py` (audit, sheets, fix) and `docs/SPRITE_QA.md` (the walk rules). The
  audit's `turned` check finds a side frame that faces the other way from its idle.
- `tools/sprites/walk4.py`: 4-frame side walks for 13 two-legged creatures (18 sides), made from their own pixels.
- Codex drew 4-frame walks for the Deep One (both forms, left) and Joseph Curwen (left and right). They exist only
  in the author's folder; the gallery page lists them (`move_2`/`move_3` by the paths of their `move_0`).
- `tools/sprites/fromsheet.py`: an image model's 2x2 sheet (four walk frames on flat magenta) to the pack's 64x64
  frames (docs/SPRITE_QA.md says how). Used for **48 sides**; six symmetrical creatures that list a right set
  (Terrible Old Man, Zkauba, Tsathoggua, Rhan-Tegoth, Bokrug, Nyarlathotep) have it as their left, flipped
  (`--mirror-right`): 54 sides in all.
- The sheets: ElevenLabs `gpt-image-2.5-sunburst` (1:1, 1K, quality medium), one generation per try: **108 in
  all, about 36,800 credits** (340 each), kept in three ElevenLabs flows (A `xxs21sloIhwgH2eXW5QE`, B
  `jxB0JSq3Gr6tOiofWOVf`, C `7JT6s9L2XFThTJagbisX`); a node's `content_url` is signed and lasts two hours.
- `tools/sprites/v1fixes.py`: the v1 defects that need no drawing (the Innsmouth Hybrid's swapped sides,
  Cthulhu's swapped views, the gallery's load error that never cleared and its "complete" banner).
- `tools/sprites/deliver.py`: the hand-over, **`walk_fix_v5.zip`** (13 MB): `previews/library.html` (host script
  dropped, Codex's four sides listed, v1fixes' page mends) and the 54 creature folders the new walks are in,
  whole: 276 changed frames and the 1,459 other files the page lists in those folders, as published.

## The leg exchange (walk_fix_v5)
Codex's review of the author's folder found the sheet-made walks' second contact repeating the first (the same
leading leg, the same hem), and the countercheck found it in 31 sides. The model, asked for "the legs exchanged",
drew the same contact again; the audit's `same-leg` check only catches copies and near-copies, so it passed them.
- **The prompt that worked** names each leg by its colour (the near leg light, the far leg dark), says where each
  foot goes (toward the cell's left or right edge), and asks for cell 3 as cell 1 with the colours of the legs
  exchanged, and cell 4 as cell 2 exchanged. Four-legged creatures count their feet from the front edge (cell 1:
  light, dark, dark, light; cell 3: dark, light, light, dark). The retries added "draw cell 3 by recolouring
  cell 1" and "cells 2 and 4 must not be the same picture either". The text is below (Making a sheet again).
- **Round one** (31 sides): 20 exchange their legs. A three-sheet pilot came first (Terrible Old Man, Dagon
  Priest, Bokrug); the first two passed, Bokrug's four legs did not, and the four-legged prompt was rewritten
  before the rest were run. **Round two** (the 11 that failed): 7 more pass (Gug, Gnoph-keh, the Outsider's
  right, Simon Orne, Edward Hutchinson, the Yekubian, Ephraim Waite's eldritch form).
- **Still repeating after two tries**: the Ghoul, Brown Jenkin, Rhan-Tegoth and the Wamp. They keep their v4
  frames (one failed redraw for another would only churn the author's folder). Bokrug's hind legs exchange, its
  forelegs only half.
- **How it was judged**: by eye, on the contacts' lower 40% at 8x, brightened (black robes and coats hide the
  near/far shading), beside the passing poses; a measure of which foot leads (the two lowest blobs' luminance)
  helped, but was fooled by four-legged walks and by robes. Then the audit: no frame turned, and two new
  advisory findings (Simon Orne and Ephraim Waite: `move_0` and `move_1` differ by 18-19% in area, contact
  against passing, over the 15% the check allows).
- **Checked**: the 133 files that differ from v4 are exactly the 27 sides, the 3 mirrored rights, Innsmouth's 12
  frames and the page. Laid over a simulation of the author's folder (as v4 left it, and as v3 had damaged it),
  merged or by replacing folders: no listed file missing, Codex's frames untouched, every new frame in place,
  and every image the page lists loads in Chromium (Codex's stand-ins aside). The page fixes were exercised there.

## What became of walk_fix_v3
`walk_fix_v3.zip` held only the 270 changed frames. Laid over the author's folder by replacing each creature
folder (Finder's "Replace") instead of merging into it, it deleted everything else in those 54 folders: the
1,465 files the page lists that Codex's review found missing, and whatever the page does not list (a creature's
`QA.json`; the published site does not serve those, so only the author's own copy, such as the Drive upload made
before v3, can bring them back). v4 and v5 bring back the listed ones whichever way they are laid over. Unzip by
merging: `ditto -x -k walk_fix_v5.zip <folder>` on a Mac, or `unzip -o walk_fix_v5.zip -d <folder>`.

## Left, none of it for the model
- The four walks above whose legs still repeat: a third try, the colour exchange done in code on their own pixels
  (each frame's lower legs relit), or drawing by hand.
- Codex's four sides: the audit of the author's own folder, not of this pack, is their check.
- The by-eye notes (`tools/sprites/notes.json`): the Deep One's facing and posture (both forms), Curwen's two,
  the dhole's two shapes, the whisperer's chair.
- v1 art (Codex's review, counterchecked): the Dhole's left walk 23/27 px against a 32 px idle; the Elder
  Shoggoth's front, the Polyp swarm's, Formless Spawn's and Being from Beyond's left, and the Curwen Pit Thing
  (which also floats in its move frames) out of size; the Colossus of the Pyramids' right `move_0` squashed; the
  Shoggoth's idle 31 px from the front against 35 from the sides; Being from Beyond and the Elder Shoggoth
  drawn two ways from frame to frame. The 35 gliders keep two keys (the engine moves them).
- `docs/SPRITE_REVIEW.md` is still the audit of v1; regenerate it from the author's folder (`audit <dir>
  --report docs/SPRITE_REVIEW.md`), not from this pack, which lacks Codex's frames.

## Rebuilding walk_fix_v5.zip (the scratch folders go with the session)
1. `python3 tools/sprite_review.py fetch <site> published --all` (every file the page lists, about 3,000, four
   at a time), then `cp -r published pack` and `python3 tools/sprites/walk4.py pack`: the same 18 sides.
2. For each of the 48 sides, the sheet chosen, from the flows (the n-th generation for that side; the rest are
   the first): Terrible Old Man, Dagon Priest (both forms), Cthulhu Cultist, Exham Troglodyte, Cat from Saturn,
   Ghast, Moon-beast, Y'm-bhi, Martense degenerate, Charles le Sorcier, Whisperer (eldritch), Keziah Mason (both
   sides), Shantak, Night-gaunt, Zoog, Thousand Young: 2; Gnorri, Gug, Gnoph-keh, Simon Orne, Edward Hutchinson,
   the Yekubian, Black Man, Venusian man-lizard, the Outsider (both sides): 3; Beast in the Cave, Bokrug,
   Nyarlathotep, Ephraim Waite (eldritch): 4. `python3 tools/sprites/fromsheet.py <sheet.png> pack <key> left`,
   with `--mirror-right` for the six symmetrical ones; Keziah Mason and the Outsider also take a sheet for
   `right`. Convert each side once, from a pack that still has its old frames: they lend their colours.
3. `python3 tools/sprites/v1fixes.py pack` (once).
4. `python3 tools/sprite_review.py audit pack`: no `turned`, and nothing new beyond the two `pair-size` notes.
5. `python3 tools/sprites/deliver.py pack published walk_fix_v5.zip --theirs deep_one:left
   'deep_one#eldritch:left' joseph_curwen:left joseph_curwen:right`. The same pack gives the same zip, byte for byte.

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
   cell 1, the other way in cell 3, every leg angled well forward or back. Never call a cell "the mirror" of
   another: the model reads it as a flip of the whole figure.
3. What the earlier retries added: a short stride and the figure the same width in every cell (a long stride
   is cut at the cell's edge); the colours "exactly as in the reference" and the ones to leave out (Gnorri came
   back tan); "its glowing eyes stay visible in every cell" (Black Man); Nyarlathotep's passing foot "bent at the
   knee under the hip, never swung behind the body like a tail"; the Night-gaunt's legs and tail described cell
   by cell in place of a stride.
4. `fromsheet.py` the result; `sprite_review.py audit`; look at each walk beside its idle, and at its two
   contacts side by side, brightened: the audit sees neither a figure turned to the viewer nor a leg exchange.
