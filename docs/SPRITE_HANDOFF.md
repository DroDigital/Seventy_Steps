# Sprite walks: handoff (2026-10-07)

Where the work on the creature library's walks stands, for whoever picks it up next.

## Done
- Review tooling: `tools/sprite_review.py` (audit, sheets, fix) and `docs/SPRITE_QA.md` (the walk rules).
- `tools/sprites/walk4.py`: 4-frame side walks for 13 two-legged creatures (18 sides), made from their own pixels.
  Delivered to the author as `walk_fix_v2.zip` (frames plus an updated `previews/library.html`), to unzip into
  their local pack folder `Seventy-Steps-105-Creature-Art-Library-quality-oct6-v1`.
- Codex drew 4-frame walks for the Deep One (both forms, left) and Joseph Curwen (left and right). They are in the
  author's folder and in the zip's `library.html`.
- `tools/sprites/fromsheet.py`: turns an image model's 2x2 sheet (four walk frames on flat magenta) into the pack's
  64x64 frames: keyed, scaled to the idle's height, snapped to the creature's own palette, standing on its ground
  line, listed in the gallery. Pilot: the Ghoul's left walk, made with ElevenLabs `gpt-image-2.5-sunburst`
  (1:1, 1K, quality medium, 1 generation, about 340 credits / 6 cents), passes every check in the audit.

## Rebuilding walk_fix_v2.zip (it lived only in the first session's scratchpad)
1. `python3 tools/sprite_review.py fetch <site> pack` (about 1,400 small frames, four at a time).
2. `python3 tools/sprites/walk4.py pack`: the same 18 sides, from the same v1 frames.
3. Codex's four walks (deep_one left, deep_one#eldritch left, joseph_curwen left and right) exist only in the
   author's folder: do not redraw them; add `move_2`/`move_3` entries for those sides to `pack-data`, by the paths of
   their `move_0` (e.g. `../sprites/deep_one/64x64/left/move_2.png`).
4. Drop the host's injected `/cdn-cgi/` script from the end of the fetched `index.html` and save the page as
   `previews/library.html`. The final zip holds only changed frames plus that page; the author lays it over a folder
   that already has Codex's frames.

## To do: 47 sides, one generation each (about 16,000 credits)
Left side only for the mirror-safe; both sides for those marked *own right*.
dagon_priest, dagon_priest#eldritch, cthulhu_cultist, ghoul#eldritch, ghast, zoog, night_gaunt, moon_beast, man_of_leng,
cat_from_saturn, wamp, gnorri, serpent_man, ym_bhi, gyaa_yothn, martense_degenerate (left only; its right is done),
exham_troglodyte, winged_hybrid, being_of_ib, nameless_city_reptile, hybrid_mummy, venusian_man_lizard,
beast_in_the_cave, albino_penguin, gnoph_keh, gug, shantak, yekubian, thousand_young, keziah_mason (*own right*),
brown_jenkin, black_man, simon_orne, edward_hutchinson, ephraim_waite#eldritch, whisperer#eldritch, the_hound,
charles_le_sorcier, the_outsider (*own right*), terrible_old_man, zkauba, tsathoggua, rhan_tegoth, bokrug, nyarlathotep.
The 35 creatures marked `motion: glide` in `tools/sprites/notes.json` need no walk (the engine moves them).

## How each one is made
1. The pack: `python3 tools/sprite_review.py fetch https://seventy-steps-creature-library.qhtgcxfp8h.chatgpt.site <dir>`
   (v1, published). The author's folder differs only by the zip above and Codex's four walks.
2. Reference: the creature's `contacts.animation` sheet from the pack data (for example
   `<site>/contact_sheets/ghoul-animation.png`; an eldritch form is `<id>-eldritch-animation.png`), attached to an
   ElevenLabs flow with `creative_attach_reference_file`.
3. An `image-generation` node, `gpt-image-2.5-sunburst`, `{"aspect_ratio":"1:1","resolution":"1K","quality":"medium"}`,
   wired to the reference, run with `generations_count: 1` (up to 20 nodes per `creative_run_flow_nodes`). Prompt
   (the pilot's; replace the name, the description and LEFT/"left" as needed):

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
   Off model (notes.json `eye`): hybrid_mummy strictly in profile; shantak walking on the ground, wings folded, at its
   idle's height; venusian_man_lizard with the legs clearly told apart.
4. Download the result's `content_url` (signed, valid two hours), then
   `python3 tools/sprites/fromsheet.py <sheet.png> <pack dir> <key> <side>`.
5. `python3 tools/sprite_review.py audit <pack dir>` and look at each walk; regenerate only what fails.
6. Hand the author a zip of the changed `sprites/...` frames plus `previews/library.html`, built on the zip above
   (keep Codex's Deep One and Curwen entries).
