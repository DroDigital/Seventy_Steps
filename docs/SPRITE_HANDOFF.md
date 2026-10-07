# Sprite walks: handoff (2026-10-07)

Where the work on the creature library's walks stands, for whoever picks it up next. The walks are done:
every side the audit asked to be four frames is four frames, except the ones that are not to be drawn (below).

## Done
- Review tooling: `tools/sprite_review.py` (audit, sheets, fix) and `docs/SPRITE_QA.md` (the walk rules).
- `tools/sprites/walk4.py`: 4-frame side walks for 13 two-legged creatures (18 sides), made from their own pixels.
- Codex drew 4-frame walks for the Deep One (both forms, left) and Joseph Curwen (left and right). They exist only
  in the author's folder; the gallery page lists them (`move_2`/`move_3` by the paths of their `move_0`).
- `tools/sprites/fromsheet.py`: an image model's 2x2 sheet (four walk frames on flat magenta) to the pack's 64x64
  frames (docs/SPRITE_QA.md says how). Used for **48 sides**: the 47 of the earlier list and the Ghoul's left (the
  pilot's frames were not kept). Six symmetrical creatures that list a right set (Terrible Old Man, Zkauba,
  Tsathoggua, Rhan-Tegoth, Bokrug, Nyarlathotep) have it as their left, flipped (`--mirror-right`): 54 sides in all.
- The sheets: ElevenLabs `gpt-image-2.5-sunburst` (1:1, 1K, quality medium), one generation per side, then the
  retries below: 62 generations, about 21,000 credits (340 each). They stay in three ElevenLabs flows (A
  `xxs21sloIhwgH2eXW5QE`, B `jxB0JSq3Gr6tOiofWOVf`, C `7JT6s9L2XFThTJagbisX`); a node's `content_url` is signed
  and lasts two hours.
- Nine sides took a retry (the number is the sheet that passed; the flows hold all of them): shantak (2),
  night_gaunt (2: the fourth passed the audit but faced the viewer), venusian_man_lizard (3), beast_in_the_cave (3),
  gnorri (2), black_man (2), ephraim_waite#eldritch (2), bokrug (2), nyarlathotep (3). Every other side is its first.
- Audit of the pack: 194 findings on v1, 177 after walk4, **100 now, none new**; 77 fewer than after walk4 (54
  walk-frames, 13 height, 4 pair-size, 4 torso-drift, 2 off-model). Each new walk was also looked at by eye, at
  5x beside its idle: the audit cannot see a figure turned to the viewer or a changed palette.
- `tools/sprites/deliver.py`: the hand-over, `walk_fix_v3.zip`: `previews/library.html` (host script dropped, Codex's
  four sides listed) and the 270 frames that differ from the published pack, in 72 folders (the 54 new sides,
  four frames each, and walk4's 18, three each: `move_1`..`move_3`). The author lays it over their folder, which
  already has Codex's frames. Opened in Chromium over the published pack with the zip on top: all 1,564 idle and
  move frames the page lists load at 64x64, but Codex's eight, which are in the author's folder only.

## Left, none of it for the model
- Codex's four sides: the audit of the author's own folder, not of this pack, is their check (this pack lacks
  their `move_2`/`move_3`, so its audit counts them as two-frame walks: the four `walk-frames` findings).
- The by-eye notes (`tools/sprites/notes.json`): the Deep One's facing and posture (both forms), Curwen's two,
  the dhole's two shapes, the whisperer's chair. The notes for the hybrid mummy and the shantak are gone (redrawn).
- The 35 gliders (`motion: glide`): two keys, the engine moves them (49 `glide-frames` advice items).
- Front and back views (30 findings, all in v1) and the right set of martense_degenerate (5 px short of its idle,
  a v1 frame): nothing here redraws them.
- `docs/SPRITE_REVIEW.md` is still the audit of v1; a report of the working pack alone would count Codex's four
  walks as missing. Regenerate it from the author's folder (`audit <dir> --report docs/SPRITE_REVIEW.md`).

## Rebuilding walk_fix_v3.zip (the scratch folders were lost with the session)
1. `python3 tools/sprite_review.py fetch <site> published` (about 1,400 small frames, four at a time), then
   `cp -r published pack` and `python3 tools/sprites/walk4.py pack`: the same 18 sides, from the same v1 frames.
2. For each of the 48 sides, the sheet that passed, from the flows: `python3 tools/sprites/fromsheet.py <sheet.png>
   pack <key> left`, with `--mirror-right` for the six symmetrical ones; keziah_mason and the_outsider also
   take a sheet for `right`. Convert each side once, from a pack that still has its old frames: they lend their
   colours, and a second conversion would borrow the first one's.
3. `python3 tools/sprite_review.py audit pack`: no new finding against the lists above.
4. `python3 tools/sprites/deliver.py pack published walk_fix_v3.zip --theirs deep_one:left
   'deep_one#eldritch:left' joseph_curwen:left joseph_curwen:right`. (The page it zips has the host's injected
   `/cdn-cgi/` script cut out, so it opens anywhere.)

## Making a sheet again
1. Reference: the creature's `contacts.animation` sheet from the pack data (for example
   `<site>/contact_sheets/ghoul-animation.png`; an eldritch form is `<id>-eldritch-animation.png`), attached to an
   ElevenLabs flow with `creative_attach_reference_file`.
2. An `image-generation` node, `gpt-image-2.5-sunburst`, `{"aspect_ratio":"1:1","resolution":"1K","quality":"medium"}`,
   wired to the reference, run with `generations_count: 1` (up to 20 nodes per `creative_run_flow_nodes`; poll
   `creative_get_flow_run_status` with up to 20 session ids). Prompt (replace the name, the description and
   LEFT/"left" as needed):

   > Pixel-art game sprite sheet, a 2x2 grid of four equal square cells on a flat solid magenta (#FF00FF) background,
   > no borders, no text, no labels, no shadows on the ground. Subject: the {creature} from the reference sheet (the
   > frames labelled "left idle_0", "left move_0", "left move_1"): {one line on its look}, seen exactly side-on, facing
   > LEFT. Keep its exact design, proportions, palette, chunky low-resolution pixel style and size from the reference;
   > same scale in every cell, feet on the same ground line in every cell, body centred in each cell. The four cells
   > are one walk cycle, read left-to-right, top-to-bottom: 1. Contact: near (lighter) leg forward, far (darker) leg
   > back, widest stride. 2. Passing: near leg straight under the body bearing weight; far leg bent, swinging forward
   > beside it, foot lifted; body slightly higher. 3. Contact: far (darker) leg forward, near (lighter) leg back,
   > widest stride, the mirror of cell 1, not a copy. 4. Passing: far leg straight under the body; near leg bent,
   > swinging forward beside it, foot lifted. Arms swing opposite to the legs. The far leg and far arm are always 2-3
   > shades darker than the near ones and drawn behind the body. Constraints: do not redesign the creature, no extra
   > limbs, no new colours, crisp hard pixel edges, no anti-aliasing, no blur.

   Four-legged creatures: add that the legs move in diagonal pairs and cells 3 and 4 swap which pair leads.
3. What the retries added, when a first sheet failed: a short stride and the figure the same width and bulk in
   every cell (a long stride fills the cell, is cut at its edge or is drawn as another animal); the colours "exactly
   as in the reference" and the ones to leave out (Gnorri came back with tan); "its glowing eyes stay visible in
   every cell" (Black Man); for Nyarlathotep, the passing foot "bent at the knee under the hip, never swung behind
   the body like a tail"; for the Night-gaunt, which does not stride, the legs and the tail described in the
   cells in place of a stride. First sheets that had asked for it already: the hybrid mummy strictly in profile, the
   shantak walking on the ground with its wings held as in its idle, the Venusian man-lizard with its legs told apart.
4. `fromsheet.py` the result; `sprite_review.py audit`; look at each walk beside its idle; regenerate only what fails.
