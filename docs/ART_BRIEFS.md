# Art briefs for the next two redraws

Prompts for the image model (GPT / Codex) that drew the 105-creature library and the colossi's stoop. Each is
written to be pasted whole. What they ask for is what `tools/add_reviewed_frames.py` checks, so a frame that
breaks a rule is refused at import, not found later in the game. Where the numbers come from:
`public/creatures/reviewed/index.json` (canvas, bounds, frame counts).

Conventions both briefs rely on: a view is named by where the camera is. In the **left** view the creature faces
toward the left edge of the picture (as in its `left/idle_0.png`); the **right** view is the left one mirrored by
the game, so it is never drawn. In the **back** view the camera sees its back. `bounds` is `[x0, y0, x1, y1]`
as PIL's `Image.getbbox()` gives it on the alpha channel (x1, y1 exclusive).

## 1. The seven in-between stoop frames (7 PNGs)

```text
TASK
Draw ONE in-between pose, "stoop_mid", for each of the 7 colossi whose bow and hold you drew earlier
(Seventy-Steps-Colossi-Bow-Hold, manifest COLOSSI-STOOP-MANIFEST.json): Cthulhu, Father Dagon, Mother Hydra,
Ghatanothoa, the Colossus Beneath the Pyramids, Azathoth, Shub-Niggurath. Seven PNGs in all.

WHY
When a colossus is hurt its head comes down. In the game it now cuts straight from the idle to your bow pose,
and cuts straight back. The new frame is shown for about 0.1 s on the way down AND on the way up, so it must
read as "halfway": a silhouette that is neither the idle's nor the bow's, in the middle of the movement.

INPUTS (per creature)
Its front idle_0.png from the 105-creature library (the idle the bow was drawn from), and your own
stoop_0.png (bow) and stoop_1.png (hold). Do not change any of them.

DRAW
The same creature, front view, caught halfway between idle_0 and stoop_0: head, shoulders and arms about half
way down, weight shifting, the body mid-motion. Not a cross-fade of the two images: a drawn pose. Keep its
design, markings, limbs, tentacles and eyes exactly as in the idle. Azathoth and Shub-Niggurath are formless;
for them the bow changes the shape of the mass rather than its height, so their mid frame is the half-collapsed
shape between the two, with the drifting motes kept as in idle and bow.

HARD RULES (the importer refuses a frame that breaks one)
- The canvas of that creature's idle: Cthulhu 128x160, the other six 128x128. RGBA PNG, transparent background.
- The idle's ground line: the bottom of the painted area stays where the idle's is (bounds[3] in the table);
  the feet or base do not move.
- Pixel art at the idle's own pixel size, as you did for the bow: no resampling blur, no anti-aliased edges, no
  semi-transparent pixels except where the idle has them, and only colours that occur in that creature's idle.
- Painted height (bounds[3] - bounds[1]) strictly between the idle's and the bow's, near the target below.
  (Azathoth and Shub-Niggurath are the exception: their heights barely change, so differ in shape instead.)
- The pixels must differ from the idle's, from the bow's and from the hold's.

TARGETS  key: canvas | idle bounds (h) | bow bounds (h) | target mid height
cthulhu:            128x160 | [9,13,118,150] (137)  | [11,54,120,150] (96) | about 116
father_dagon:       128x128 | [11,7,117,123] (116)  | [12,35,117,123] (88) | about 102
mother_hydra:       128x128 | [14,17,114,118] (101) | [14,33,114,118] (85) | about 93
ghatanothoa:        128x128 | [17,12,111,124] (112) | [18,47,112,124] (77) | about 94
colossus_pyramids:  128x128 | [30,16,98,118] (102)  | [31,64,99,118] (54)  | about 78
azathoth:           128x128 | [8,24,121,124] (100)  | [9,25,122,124] (99)  | about 99, a half-collapsed shape
shub_niggurath:     128x128 | [6,37,122,124] (87)   | [7,37,123,124] (87)  | about 87, a half-collapsed shape

OUTPUT
1. A zip of PNGs only: bosses/<key>/movement/front/stoop_mid_0.png (7 files).
2. A full zip: those, plus COLOSSI-STOOP-MID-MANIFEST.json, a comparison sheet (idle | mid | bow | hold for each
   creature, enlarged 4x) and VALIDATION.json. The manifest:
   {
     "format": "seventy-steps-colossi-front-stoop-mid-v1",
     "action": "stoop_mid",
     "entities": [ {
       "key": "cthulhu", "width": 128, "height": 160,
       "idleSha256": "<SHA-256 of the library's front idle_0.png bytes, the same as in COLOSSI-STOOP-MANIFEST.json>",
       "frames": [ { "name": "stoop_mid_0.png", "path": "bosses/cthulhu/movement/front/stoop_mid_0.png",
                     "sha256": "<of the PNG's bytes>", "bounds": [x0, y0, x1, y1] } ]
     } ]
   }
Check every rule yourself and say which frames, if any, you could not make pass.
```

## 2. Side and back attack and hurt for the nine bosses (126 PNGs)

```text
TASK
Draw the SIDE (left) and BACK views of the attack and hurt animations for the nine boss forms of the
105-creature library. Today the library has them from the front only, so a boss that swings while the player
circles it is drawn facing the camera. Per boss and view you draw the same number of frames the front has:

boss                canvas   attack  hurt   (frames per view; 63 per view, 126 in all)
cthulhu             128x160    3      2
father_dagon        128x128    4      4
mother_hydra        128x128    4      4
ghatanothoa         128x128    4      4
colossus_pyramids   128x128    4      4
azathoth            128x128    3      2
shub_niggurath      128x128    4      4
yog_sothoth         128x128    3      2
dunwich_horror      128x128    4      4

Do the left view and the back view, not the right: the game mirrors the left one for the right. If one run
cannot hold 126 frames at the library's quality, do it in three batches, one manifest each: (1) cthulhu,
father_dagon, mother_hydra; (2) ghatanothoa, colossus_pyramids, azathoth; (3) shub_niggurath, yog_sothoth,
dunwich_horror.

INPUTS (per boss)
From the library: movement/front/attack_*.png and hurt_*.png (what the move IS, frame by frame), and
movement/left/idle_*.png, move_*.png and movement/back/idle_*.png, move_*.png (how this boss looks from those
two sides, its proportions and which way it faces). Do not change any existing file.

DRAW
The SAME action as the front frames, in the SAME order, seen from the side or the back:
- attack_0 is the wind-up, the middle frame(s) the strike at full extension, the last the recovery: the same beats
  as the front's, because the game plays them across the same windup, strike and recovery.
- hurt_0 is the flinch at its sharpest, the later frames the recovery toward the idle: as the front's.
- LEFT view: the creature faces toward the LEFT edge of the picture, as in its left idle. It strikes toward that
  edge; a hurt flinch recoils to the right.
- BACK view: we see its back, as in its back idle. It strikes away from us, so the arms, tentacles or head move
  and foreshorten as they would from behind; the silhouette must still change clearly from frame to frame. Its
  hurt flinch is the same seen from behind.
- Same creature: same design, markings, limbs, tentacles, eyes, size of the body (the head, torso and mass keep
  the idle's size; limbs, tentacles and the head's angle are what move). Azathoth and Shub-Niggurath are formless
  masses: their attack is the mass surging and their hurt the mass shrinking back, with the idle's drifting
  motes kept. Yog-Sothoth is a cluster of spheres: keep its sphere count and sizes, move the cluster.
- The body only: no slash arcs, impact stars, dust, glows or beams drawn outside it (the game adds those).

HARD RULES (the importer refuses a frame that breaks one)
- The canvas of that boss's idle (table above). RGBA PNG, transparent background.
- The ground line of that VIEW's idle: the bottom of the painted area (bounds[3]) within 2 pixels of it
  (within 4 for yog_sothoth, whose base drifts). Table of bounds[3] of left idle / back idle:
  cthulhu 150/150, father_dagon 123/123, mother_hydra 118/118, ghatanothoa 124/124,
  colossus_pyramids 118/118, azathoth 124/124, shub_niggurath 123/124, yog_sothoth 123/119,
  dunwich_horror 118/118.
- Pixel art at the library's own pixel size: no resampling blur, no anti-aliased edges, no semi-transparent
  pixels except where the library's frames of that boss have them, and only colours that occur in that boss's
  idle frames.
- Every frame differs from that view's idle, and consecutive frames of an action differ from each other.

OUTPUT
1. A zip of PNGs only, in the library's tree:
   bosses/<key>/movement/<left|back>/<attack|hurt>_<n>.png
2. A full zip: those, plus SIDE-BACK-COMBAT-MANIFEST.json, a comparison sheet per boss (rows: front attack,
   left attack, back attack, front hurt, left hurt, back hurt, enlarged 3x) and VALIDATION.json. The manifest:
   {
     "format": "seventy-steps-boss-side-back-combat-v1",
     "entities": [ {
       "key": "cthulhu", "width": 128, "height": 160,
       "views": [ {
         "direction": "left",
         "idleSha256": "<SHA-256 of the library's movement/left/idle_0.png bytes>",
         "actions": {
           "attack": [ { "name": "attack_0.png", "path": "bosses/cthulhu/movement/left/attack_0.png",
                         "sha256": "<of the PNG's bytes>", "bounds": [x0, y0, x1, y1] }, ... ],
           "hurt":   [ ... ]
         } }, { "direction": "back", ... } ]
     } ]
   }
Check every rule yourself and say which frames, if any, you could not make pass.
```
