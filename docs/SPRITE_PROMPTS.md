# Walk prompts for ChatGPT image generation

One prompt for each of the library's 105 entries (96 creature sets and 9 colossi), left side only: the game
flips it for the right (`keziah_mason` and `the_outsider`, which are one-sided, also have an optional
right-hand prompt). Idle, attack, hurt, front and back are not touched.

Do them in this order: **A** first (the 45 that have no proper side walk at all), then **C** (the 35 without
legs, which get a four-frame move cycle), then **B** (the 16 that already have a four-frame walk: only if you
are not happy with it) and **D** (the colossi).

## How to use it
1. A new chat for each entry (a fresh chat keeps one creature's style from leaking into the next).
2. Attach the two reference images named under the heading (from `refs_x8.zip`, or take the entry's own
   `front/idle_0.png` and `left/idle_0.png` from the pack; the second one matters: it shows the side
   design the walk must keep). Paste the prompt. Ask for **image generation** (square, 1024x1024).
3. Look at the sheet (the four checks below). If one fails, say so in one line (the fixes below) rather
   than starting over; if it is still wrong after two tries, start a new chat and try again.
4. Save each good sheet as the name under the heading, in one folder, and give me the folder (a Google
   Drive link, as before). I key out the magenta, bring each cell to the pack's frames in the
   creature's own colours, run the review (`tools/sprite_review.py audit`) and hand back a zip.

## What to check on every sheet
1. **Four cells, all facing left**, on flat magenta (no checkerboard, no border lines, no text).
2. **Legged creatures: the legs swap.** The leg that is forward in cell 1 is **back** in cell 3 (and cell 4
   is cell 2 with the other leg lifted). If cell 3 looks like cell 1, it fails: that is the walk that reads
   as one leg dragging. **Creatures without legs:** four different poses of one smooth loop, cell 4 leading
   back into cell 1.
3. **One size:** the creature is the same height and scale in all four cells, standing on one level.
4. **Pure profile:** no cell turned toward you; the design is the reference's, not a new one.

## One-line fixes (paste as a reply)
- Wrong background: `Redo it on a flat solid #FF00FF background with no gradient, no borders, no shadows.`
- Facing the wrong way: `Redo it with the creature facing LEFT in all four cells.`
- Cell 3 copies cell 1: `Cell 3 must be the mirror of cell 1's legs: the leg that is forward in cell 1 must be back in cell 3, and the other leg forward. Cell 4 likewise against cell 2. Redo the sheet.`
- Sizes differ: `Redo it with the creature exactly the same size and the same height in all four cells, standing on the same line.`
- Turned toward you: `Redo it with every cell in strict side profile, like a flat 2D side view.`
- Redesigned: `Keep the creature exactly as in the attached images: same shapes, same colours, nothing new.`

## A. Still without a four-frame side walk (do these first) (45)

### 001. Esoteric Order of Dagon Priest  (`001_dagon_priest`)

Attach `001_dagon_priest_front.png` and `001_dagon_priest_side.png`. Save the result as `001_dagon_priest.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Esoteric Order of Dagon Priest, as shown in the attached reference image: a tall figure in a heavy grey-brown robe with a long dark stole down the front and a tall pointed, fish-like hood; the hands hang at the sides. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
The long robe hides the legs, so the walk is told by the hem and the shoes. The robe's outline keeps one size in every cell; only the hem, the shoe tips and the cloth swing.
1. CONTACT: the near foot (toward the viewer) steps forward out of the hem, heel down; the hem pushes forward over it; the far foot's toe shows behind and the robe's back edge trails backward.
2. PASSING: the feet are together under the body; the hem hangs almost straight, swaying a little; the sleeves sway; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: the far foot (darker) now steps forward out of the hem and the near foot shows behind, the cloth swung the same way: the mirror of cell 1's feet, NOT a copy.
4. PASSING ON THE OTHER FOOT: the feet together again, the hem swaying the opposite way to cell 2; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 002. Esoteric Order of Dagon Priest, eldritch form  (`002_dagon_priest-eldritch`)

Attach `002_dagon_priest-eldritch_front.png` and `002_dagon_priest-eldritch_side.png`. Save the result as `002_dagon_priest-eldritch.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Esoteric Order of Dagon Priest, eldritch form, as shown in the attached reference image: the same tall grey-brown robed priest with a dark stole and a pointed hood, now with glowing violet eyes and a violet glow on its head. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
The long robe hides the legs, so the walk is told by the hem and the shoes. The robe's outline keeps one size in every cell; only the hem, the shoe tips and the cloth swing.
1. CONTACT: the near foot (toward the viewer) steps forward out of the hem, heel down; the hem pushes forward over it; the far foot's toe shows behind and the robe's back edge trails backward.
2. PASSING: the feet are together under the body; the hem hangs almost straight, swaying a little; the sleeves sway; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: the far foot (darker) now steps forward out of the hem and the near foot shows behind, the cloth swung the same way: the mirror of cell 1's feet, NOT a copy.
4. PASSING ON THE OTHER FOOT: the feet together again, the hem swaying the opposite way to cell 2; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 003. Cthulhu Cultist  (`003_cthulhu_cultist`)

Attach `003_cthulhu_cultist_front.png` and `003_cthulhu_cultist_side.png`. Save the result as `003_cthulhu_cultist.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Cthulhu Cultist, as shown in the attached reference image: a figure in a plain black hooded robe that falls to the ground, the face in shadow, the hands hidden in the sleeves. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
The long robe hides the legs, so the walk is told by the hem and the shoes. The robe's outline keeps one size in every cell; only the hem, the shoe tips and the cloth swing.
1. CONTACT: the near foot (toward the viewer) steps forward out of the hem, heel down; the hem pushes forward over it; the far foot's toe shows behind and the robe's back edge trails backward.
2. PASSING: the feet are together under the body; the hem hangs almost straight, swaying a little; the sleeves sway; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: the far foot (darker) now steps forward out of the hem and the near foot shows behind, the cloth swung the same way: the mirror of cell 1's feet, NOT a copy.
4. PASSING ON THE OTHER FOOT: the feet together again, the hem swaying the opposite way to cell 2; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 004. The Black Man  (`004_black_man`)

Attach `004_black_man_front.png` and `004_black_man_side.png`. Save the result as `004_black_man.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Black Man, as shown in the attached reference image: a tall, thin figure in a black cloak and hood with two glowing violet eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
The long robe hides the legs, so the walk is told by the hem and the shoes. The robe's outline keeps one size in every cell; only the hem, the shoe tips and the cloth swing.
1. CONTACT: the near foot (toward the viewer) steps forward out of the hem, heel down; the hem pushes forward over it; the far foot's toe shows behind and the robe's back edge trails backward.
2. PASSING: the feet are together under the body; the hem hangs almost straight, swaying a little; the sleeves sway; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: the far foot (darker) now steps forward out of the hem and the near foot shows behind, the cloth swung the same way: the mirror of cell 1's feet, NOT a copy.
4. PASSING ON THE OTHER FOOT: the feet together again, the hem swaying the opposite way to cell 2; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 005. Edward Hutchinson  (`005_edward_hutchinson`)

Attach `005_edward_hutchinson_front.png` and `005_edward_hutchinson_side.png`. Save the result as `005_edward_hutchinson.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Edward Hutchinson, as shown in the attached reference image: a figure in a long black hooded cloak with the face hidden. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
The long robe hides the legs, so the walk is told by the hem and the shoes. The robe's outline keeps one size in every cell; only the hem, the shoe tips and the cloth swing.
1. CONTACT: the near foot (toward the viewer) steps forward out of the hem, heel down; the hem pushes forward over it; the far foot's toe shows behind and the robe's back edge trails backward.
2. PASSING: the feet are together under the body; the hem hangs almost straight, swaying a little; the sleeves sway; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: the far foot (darker) now steps forward out of the hem and the near foot shows behind, the cloth swung the same way: the mirror of cell 1's feet, NOT a copy.
4. PASSING ON THE OTHER FOOT: the feet together again, the hem swaying the opposite way to cell 2; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 006. Charles le Sorcier  (`006_charles_le_sorcier`)

Attach `006_charles_le_sorcier_front.png` and `006_charles_le_sorcier_side.png`. Save the result as `006_charles_le_sorcier.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Charles le Sorcier, as shown in the attached reference image: a figure in a long black hooded robe with glowing red eyes in the dark hood. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
The long robe hides the legs, so the walk is told by the hem and the shoes. The robe's outline keeps one size in every cell; only the hem, the shoe tips and the cloth swing.
1. CONTACT: the near foot (toward the viewer) steps forward out of the hem, heel down; the hem pushes forward over it; the far foot's toe shows behind and the robe's back edge trails backward.
2. PASSING: the feet are together under the body; the hem hangs almost straight, swaying a little; the sleeves sway; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: the far foot (darker) now steps forward out of the hem and the near foot shows behind, the cloth swung the same way: the mirror of cell 1's feet, NOT a copy.
4. PASSING ON THE OTHER FOOT: the feet together again, the hem swaying the opposite way to cell 2; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 007. Keziah Mason  (`007_keziah_mason`)

Attach `007_keziah_mason_front.png` and `007_keziah_mason_side.png`. Save the result as `007_keziah_mason.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Keziah Mason, as shown in the attached reference image: a hunched old witch with grey hair in a long, tattered dark-brown robe, one hand held out in front. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
The long robe hides the legs, so the walk is told by the hem and the shoes. The robe's outline keeps one size in every cell; only the hem, the shoe tips and the cloth swing.
1. CONTACT: the near foot (toward the viewer) steps forward out of the hem, heel down; the hem pushes forward over it; the far foot's toe shows behind and the robe's back edge trails backward.
2. PASSING: the feet are together under the body; the hem hangs almost straight, swaying a little; the sleeves sway; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: the far foot (darker) now steps forward out of the hem and the near foot shows behind, the cloth swung the same way: the mirror of cell 1's feet, NOT a copy.
4. PASSING ON THE OTHER FOOT: the feet together again, the hem swaying the opposite way to cell 2; the body is 1 pixel higher.

Keep whatever she holds exactly as in the reference. She walks hunched, with short steps.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

Optional, only if you want its own right side (otherwise the game flips the left walk, which only switches what it carries or wears): save as `007_keziah_mason_right.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Keziah Mason, as shown in the attached reference image: a hunched old witch with grey hair in a long, tattered dark-brown robe, one hand held out in front. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing RIGHT (its face toward the right edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
The long robe hides the legs, so the walk is told by the hem and the shoes. The robe's outline keeps one size in every cell; only the hem, the shoe tips and the cloth swing.
1. CONTACT: the near foot (toward the viewer) steps forward out of the hem, heel down; the hem pushes forward over it; the far foot's toe shows behind and the robe's back edge trails backward.
2. PASSING: the feet are together under the body; the hem hangs almost straight, swaying a little; the sleeves sway; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: the far foot (darker) now steps forward out of the hem and the near foot shows behind, the cloth swung the same way: the mirror of cell 1's feet, NOT a copy.
4. PASSING ON THE OTHER FOOT: the feet together again, the hem swaying the opposite way to cell 2; the body is 1 pixel higher.

Keep whatever she holds exactly as in the reference. She walks hunched, with short steps.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 008. The Terrible Old Man  (`008_terrible_old_man`)

Attach `008_terrible_old_man_front.png` and `008_terrible_old_man_side.png`. Save the result as `008_terrible_old_man.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Terrible Old Man, as shown in the attached reference image: an old white-haired man in a beige-grey coat and trousers, standing upright. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 009. Nyarlathotep  (`009_nyarlathotep`)

Attach `009_nyarlathotep_front.png` and `009_nyarlathotep_side.png`. Save the result as `009_nyarlathotep.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Nyarlathotep, as shown in the attached reference image: a slender man in a tan suit with a blank pale bald face and glowing violet eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 010. Simon Orne  (`010_simon_orne`)

Attach `010_simon_orne_front.png` and `010_simon_orne_side.png`. Save the result as `010_simon_orne.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Simon Orne, as shown in the attached reference image: a pale, white-faced bald man in a black coat and black trousers. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 011. The Outsider  (`011_the_outsider`)

Attach `011_the_outsider_front.png` and `011_the_outsider_side.png`. Save the result as `011_the_outsider.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Outsider, as shown in the attached reference image: a ragged, decayed green-black humanoid in tattered clothes with pale bone showing in patches. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

Keep the torn clothes and the pale patches as they are. A stiff, shambling walk, the arms hanging loose.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

Optional, only if you want its own right side (otherwise the game flips the left walk, which only switches what it carries or wears): save as `011_the_outsider_right.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Outsider, as shown in the attached reference image: a ragged, decayed green-black humanoid in tattered clothes with pale bone showing in patches. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing RIGHT (its face toward the right edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

Keep the torn clothes and the pale patches as they are. A stiff, shambling walk, the arms hanging loose.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 012. Serpent Man of Valusia  (`012_serpent_man`)

Attach `012_serpent_man_front.png` and `012_serpent_man_side.png`. Save the result as `012_serpent_man.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Serpent Man of Valusia, as shown in the attached reference image: a slender olive-green, serpent-headed humanoid in a dark loincloth, with thin limbs and clawed feet. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 013. Hybrid Mummy  (`013_hybrid_mummy`)

Attach `013_hybrid_mummy_front.png` and `013_hybrid_mummy_side.png`. Save the result as `013_hybrid_mummy.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Hybrid Mummy, as shown in the attached reference image: a mummy in brown-striped bandages with a dark crocodile-like head. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

Keep it strictly in profile in all four cells: never turned toward the viewer, no three-quarter view, no raised knee facing the viewer.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 014. Venusian Man-Lizard  (`014_venusian_man_lizard`)

Attach `014_venusian_man_lizard_front.png` and `014_venusian_man_lizard_side.png`. Save the result as `014_venusian_man_lizard.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Venusian Man-Lizard, as shown in the attached reference image: an upright green lizard-man with a flat hammer-shaped head and a bundle of tentacles hanging over its chest. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

Keep the two legs clearly told apart: the far leg a darker green, with a visible gap between the legs in the contact poses (1 and 3).

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 015. Man of Leng  (`015_man_of_leng`)

Attach `015_man_of_leng_front.png` and `015_man_of_leng_side.png`. Save the result as `015_man_of_leng.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Man of Leng, as shown in the attached reference image: a short, stocky figure in a rust-red hooded tunic with a grey, horned, animal-like face and bare grey legs. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 016. Ephraim Waite, eldritch form  (`016_ephraim_waite-eldritch`)

Attach `016_ephraim_waite-eldritch_front.png` and `016_ephraim_waite-eldritch_side.png`. Save the result as `016_ephraim_waite-eldritch.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Ephraim Waite, eldritch form, as shown in the attached reference image: a stooped, green-skinned corpse-like man in a dark green suit with a bald head and long arms. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 017. Ghoul, eldritch form  (`017_ghoul-eldritch`)

Attach `017_ghoul-eldritch_front.png` and `017_ghoul-eldritch_side.png`. Save the result as `017_ghoul-eldritch.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Ghoul, eldritch form, as shown in the attached reference image: a hulking, hunched olive-green ghoul with long arms, clawed hands, a hooked dog-like snout and three glowing green eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, hunched, shambling walk on bent knees; the long arms swing opposite to the legs and the hands hang low. The body leans forward by the same amount in every cell and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near leg (lighter) steps forward, foot flat; the far leg (darker, behind it) trails with the toe down; the far arm swings forward, the near arm back.
2. PASSING: the near leg is straight under the body taking the weight; the far leg is bent and swinging forward past it, foot lifted; the arms hang close to the body.
3. CONTACT ON THE OTHER FOOT: the far leg (darker) steps forward and the near leg trails behind; the near arm swings forward, the far arm back: the mirror of cell 1, NOT a copy.
4. PASSING ON THE OTHER FOOT: the far leg is straight under the body; the near leg is bent and swinging forward past it; the arms hang close to the body.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 018. Ym-bhi  (`018_ym_bhi`)

Attach `018_ym_bhi_front.png` and `018_ym_bhi_side.png`. Save the result as `018_ym_bhi.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Ym-bhi, as shown in the attached reference image: a pale grey, smooth, stone-like hulking giant with huge arms hanging low, a hunched back and a small head. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, hunched, shambling walk on bent knees; the long arms swing opposite to the legs and the hands hang low. The body leans forward by the same amount in every cell and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near leg (lighter) steps forward, foot flat; the far leg (darker, behind it) trails with the toe down; the far arm swings forward, the near arm back.
2. PASSING: the near leg is straight under the body taking the weight; the far leg is bent and swinging forward past it, foot lifted; the arms hang close to the body.
3. CONTACT ON THE OTHER FOOT: the far leg (darker) steps forward and the near leg trails behind; the near arm swings forward, the far arm back: the mirror of cell 1, NOT a copy.
4. PASSING ON THE OTHER FOOT: the far leg is straight under the body; the near leg is bent and swinging forward past it; the arms hang close to the body.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 019. Martense Degenerate  (`019_martense_degenerate`)

Attach `019_martense_degenerate_front.png` and `019_martense_degenerate_side.png`. Save the result as `019_martense_degenerate.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Martense Degenerate, as shown in the attached reference image: a hulking, shaggy black ape-like creature with dim amber eyes and long arms. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, hunched, shambling walk on bent knees; the long arms swing opposite to the legs and the hands hang low. The body leans forward by the same amount in every cell and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near leg (lighter) steps forward, foot flat; the far leg (darker, behind it) trails with the toe down; the far arm swings forward, the near arm back.
2. PASSING: the near leg is straight under the body taking the weight; the far leg is bent and swinging forward past it, foot lifted; the arms hang close to the body.
3. CONTACT ON THE OTHER FOOT: the far leg (darker) steps forward and the near leg trails behind; the near arm swings forward, the far arm back: the mirror of cell 1, NOT a copy.
4. PASSING ON THE OTHER FOOT: the far leg is straight under the body; the near leg is bent and swinging forward past it; the arms hang close to the body.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 020. Gnoph-keh  (`020_gnoph_keh`)

Attach `020_gnoph_keh_front.png` and `020_gnoph_keh_side.png`. Save the result as `020_gnoph_keh.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Gnoph-keh, as shown in the attached reference image: a hulking black fur-covered ape-beast with arms reaching to the ground and glowing white eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, hunched, shambling walk on bent knees; the long arms swing opposite to the legs and the hands hang low. The body leans forward by the same amount in every cell and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near leg (lighter) steps forward, foot flat; the far leg (darker, behind it) trails with the toe down; the far arm swings forward, the near arm back.
2. PASSING: the near leg is straight under the body taking the weight; the far leg is bent and swinging forward past it, foot lifted; the arms hang close to the body.
3. CONTACT ON THE OTHER FOOT: the far leg (darker) steps forward and the near leg trails behind; the near arm swings forward, the far arm back: the mirror of cell 1, NOT a copy.
4. PASSING ON THE OTHER FOOT: the far leg is straight under the body; the near leg is bent and swinging forward past it; the arms hang close to the body.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 021. Gug  (`021_gug`)

Attach `021_gug_front.png` and `021_gug_side.png`. Save the result as `021_gug.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Gug, as shown in the attached reference image: a huge, hunched black giant with ochre spots on its body and pink-tipped claws. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, hunched, shambling walk on bent knees; the long arms swing opposite to the legs and the hands hang low. The body leans forward by the same amount in every cell and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near leg (lighter) steps forward, foot flat; the far leg (darker, behind it) trails with the toe down; the far arm swings forward, the near arm back.
2. PASSING: the near leg is straight under the body taking the weight; the far leg is bent and swinging forward past it, foot lifted; the arms hang close to the body.
3. CONTACT ON THE OTHER FOOT: the far leg (darker) steps forward and the near leg trails behind; the near arm swings forward, the far arm back: the mirror of cell 1, NOT a copy.
4. PASSING ON THE OTHER FOOT: the far leg is straight under the body; the near leg is bent and swinging forward past it; the arms hang close to the body.

Keep the ochre spots and the pink claw tips.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 022. Zkauba the Wizard  (`022_zkauba`)

Attach `022_zkauba_front.png` and `022_zkauba_side.png`. Save the result as `022_zkauba.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Zkauba the Wizard, as shown in the attached reference image: a hulking grey stone golem of cracked plates with violet eyes, a ribbed chest and huge arms that hang to the ground. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, hunched, shambling walk on bent knees; the long arms swing opposite to the legs and the hands hang low. The body leans forward by the same amount in every cell and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near leg (lighter) steps forward, foot flat; the far leg (darker, behind it) trails with the toe down; the far arm swings forward, the near arm back.
2. PASSING: the near leg is straight under the body taking the weight; the far leg is bent and swinging forward past it, foot lifted; the arms hang close to the body.
3. CONTACT ON THE OTHER FOOT: the far leg (darker) steps forward and the near leg trails behind; the near arm swings forward, the far arm back: the mirror of cell 1, NOT a copy.
4. PASSING ON THE OTHER FOOT: the far leg is straight under the body; the near leg is bent and swinging forward past it; the arms hang close to the body.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 023. Exham Priory Troglodyte  (`023_exham_troglodyte`)

Attach `023_exham_troglodyte_front.png` and `023_exham_troglodyte_side.png`. Save the result as `023_exham_troglodyte.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Exham Priory Troglodyte, as shown in the attached reference image: a gaunt, hunched, bone-pale humanoid with long limbs, a ragged loincloth, a bald head and sunken eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, hunched, shambling walk on bent knees; the long arms swing opposite to the legs and the hands hang low. The body leans forward by the same amount in every cell and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near leg (lighter) steps forward, foot flat; the far leg (darker, behind it) trails with the toe down; the far arm swings forward, the near arm back.
2. PASSING: the near leg is straight under the body taking the weight; the far leg is bent and swinging forward past it, foot lifted; the arms hang close to the body.
3. CONTACT ON THE OTHER FOOT: the far leg (darker) steps forward and the near leg trails behind; the near arm swings forward, the far arm back: the mirror of cell 1, NOT a copy.
4. PASSING ON THE OTHER FOOT: the far leg is straight under the body; the near leg is bent and swinging forward past it; the arms hang close to the body.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 024. Gnorri  (`024_gnorri`)

Attach `024_gnorri_front.png` and `024_gnorri_side.png`. Save the result as `024_gnorri.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Gnorri, as shown in the attached reference image: a hulking, hunched teal-grey creature with a mass of tentacles over its face, a row of fin-like spines down its back and long arms. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, hunched, shambling walk on bent knees; the long arms swing opposite to the legs and the hands hang low. The body leans forward by the same amount in every cell and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near leg (lighter) steps forward, foot flat; the far leg (darker, behind it) trails with the toe down; the far arm swings forward, the near arm back.
2. PASSING: the near leg is straight under the body taking the weight; the far leg is bent and swinging forward past it, foot lifted; the arms hang close to the body.
3. CONTACT ON THE OTHER FOOT: the far leg (darker) steps forward and the near leg trails behind; the near arm swings forward, the far arm back: the mirror of cell 1, NOT a copy.
4. PASSING ON THE OTHER FOOT: the far leg is straight under the body; the near leg is bent and swinging forward past it; the arms hang close to the body.

Keep the face tentacles and the back spines; the tentacles sway a little.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 025. Ghast  (`025_ghast`)

Attach `025_ghast_front.png` and `025_ghast_side.png`. Save the result as `025_ghast.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Ghast, as shown in the attached reference image: a long, pale cream beast with brown stripes and dark hooves, four long legs and no clear face. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A four-legged trot, the legs moving in diagonal pairs. The legs on the far side of the body are drawn darker and partly behind the near ones. The body stays level and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near front leg and the far hind leg reach forward; the far front leg and the near hind leg are pushed back: the widest stride.
2. PASSING: all four legs gather beneath the body, bent, the lifted pair swinging forward; the body is 1 pixel higher.
3. CONTACT WITH THE OTHER PAIR: the far front leg and the near hind leg reach forward; the near front leg and the far hind leg are pushed back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the legs gather beneath the body, the other pair now swinging forward; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 026. Cat from Saturn  (`026_cat_from_saturn`)

Attach `026_cat_from_saturn_front.png` and `026_cat_from_saturn_side.png`. Save the result as `026_cat_from_saturn.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Cat from Saturn, as shown in the attached reference image: a sleek black panther-like cat with a tall curled tail and faint violet markings. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A four-legged trot, the legs moving in diagonal pairs. The legs on the far side of the body are drawn darker and partly behind the near ones. The body stays level and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near front leg and the far hind leg reach forward; the far front leg and the near hind leg are pushed back: the widest stride.
2. PASSING: all four legs gather beneath the body, bent, the lifted pair swinging forward; the body is 1 pixel higher.
3. CONTACT WITH THE OTHER PAIR: the far front leg and the near hind leg reach forward; the near front leg and the far hind leg are pushed back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the legs gather beneath the body, the other pair now swinging forward; the body is 1 pixel higher.

The tail sways a little.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 027. Gyaa-yothn  (`027_gyaa_yothn`)

Attach `027_gyaa_yothn_front.png` and `027_gyaa_yothn_side.png`. Save the result as `027_gyaa_yothn.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Gyaa-yothn, as shown in the attached reference image: a huge white four-legged bear-like beast with a black domed shell over its back and a flat white face. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A four-legged trot, the legs moving in diagonal pairs. The legs on the far side of the body are drawn darker and partly behind the near ones. The body stays level and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near front leg and the far hind leg reach forward; the far front leg and the near hind leg are pushed back: the widest stride.
2. PASSING: all four legs gather beneath the body, bent, the lifted pair swinging forward; the body is 1 pixel higher.
3. CONTACT WITH THE OTHER PAIR: the far front leg and the near hind leg reach forward; the near front leg and the far hind leg are pushed back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the legs gather beneath the body, the other pair now swinging forward; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 028. Bokrug  (`028_bokrug`)

Attach `028_bokrug_front.png` and `028_bokrug_side.png`. Save the result as `028_bokrug.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Bokrug, as shown in the attached reference image: a teal-grey, hound-like lizard with a skeletal ribcage, spines along its back, a long tail and four legs. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A four-legged trot, the legs moving in diagonal pairs. The legs on the far side of the body are drawn darker and partly behind the near ones. The body stays level and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near front leg and the far hind leg reach forward; the far front leg and the near hind leg are pushed back: the widest stride.
2. PASSING: all four legs gather beneath the body, bent, the lifted pair swinging forward; the body is 1 pixel higher.
3. CONTACT WITH THE OTHER PAIR: the far front leg and the near hind leg reach forward; the near front leg and the far hind leg are pushed back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the legs gather beneath the body, the other pair now swinging forward; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 029. The Hound  (`029_the_hound`)

Attach `029_the_hound_front.png` and `029_the_hound_side.png`. Save the result as `029_the_hound.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Hound, as shown in the attached reference image: a skeletal bone-grey winged dog with a visible ribcage, bat wings, glowing green eyes and a long tail. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A four-legged trot, the legs moving in diagonal pairs. The legs on the far side of the body are drawn darker and partly behind the near ones. The body stays level and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near front leg and the far hind leg reach forward; the far front leg and the near hind leg are pushed back: the widest stride.
2. PASSING: all four legs gather beneath the body, bent, the lifted pair swinging forward; the body is 1 pixel higher.
3. CONTACT WITH THE OTHER PAIR: the far front leg and the near hind leg reach forward; the near front leg and the far hind leg are pushed back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the legs gather beneath the body, the other pair now swinging forward; the body is 1 pixel higher.

The wings stay folded and held high on its back (they may lift 1 pixel at the passing poses). It walks on the ground at the same height as the reference.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 030. Shantak  (`030_shantak`)

Attach `030_shantak_front.png` and `030_shantak_side.png`. Save the result as `030_shantak.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Shantak, as shown in the attached reference image: a grey-black beast with a horse-like head and neck, a feathered body, large wings and bird claws. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A four-legged trot, the legs moving in diagonal pairs. The legs on the far side of the body are drawn darker and partly behind the near ones. The body stays level and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near front leg and the far hind leg reach forward; the far front leg and the near hind leg are pushed back: the widest stride.
2. PASSING: all four legs gather beneath the body, bent, the lifted pair swinging forward; the body is 1 pixel higher.
3. CONTACT WITH THE OTHER PAIR: the far front leg and the near hind leg reach forward; the near front leg and the far hind leg are pushed back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the legs gather beneath the body, the other pair now swinging forward; the body is 1 pixel higher.

It walks on the ground with its wings folded against its sides, at the same height as the reference standing pose in every cell: no crouch, no raised wings.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 031. Brown Jenkin  (`031_brown_jenkin`)

Attach `031_brown_jenkin_front.png` and `031_brown_jenkin_side.png`. Save the result as `031_brown_jenkin.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Brown Jenkin, as shown in the attached reference image: a brown-furred rat with a bearded human face, a long thin tail and four small clawed legs. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A four-legged trot, the legs moving in diagonal pairs. The legs on the far side of the body are drawn darker and partly behind the near ones. The body stays level and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near front leg and the far hind leg reach forward; the far front leg and the near hind leg are pushed back: the widest stride.
2. PASSING: all four legs gather beneath the body, bent, the lifted pair swinging forward; the body is 1 pixel higher.
3. CONTACT WITH THE OTHER PAIR: the far front leg and the near hind leg reach forward; the near front leg and the far hind leg are pushed back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the legs gather beneath the body, the other pair now swinging forward; the body is 1 pixel higher.

The tail trails behind and sways a little.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 032. The Beast in the Cave  (`032_beast_in_the_cave`)

Attach `032_beast_in_the_cave_front.png` and `032_beast_in_the_cave_side.png`. Save the result as `032_beast_in_the_cave.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Beast in the Cave, as shown in the attached reference image: a pale, white-haired, feral man-thing that crouches on all fours, in a ragged loincloth. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A four-legged trot, the legs moving in diagonal pairs. The legs on the far side of the body are drawn darker and partly behind the near ones. The body stays level and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near front leg and the far hind leg reach forward; the far front leg and the near hind leg are pushed back: the widest stride.
2. PASSING: all four legs gather beneath the body, bent, the lifted pair swinging forward; the body is 1 pixel higher.
3. CONTACT WITH THE OTHER PAIR: the far front leg and the near hind leg reach forward; the near front leg and the far hind leg are pushed back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the legs gather beneath the body, the other pair now swinging forward; the body is 1 pixel higher.

It goes on all fours: the hands and the feet are its four legs.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 033. Winged Hybrid  (`033_winged_hybrid`)

Attach `033_winged_hybrid_front.png` and `033_winged_hybrid_side.png`. Save the result as `033_winged_hybrid.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Winged Hybrid, as shown in the attached reference image: a small, black, bat-winged creature with a round body and dim eyes, crouched, its wings folded on its back. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A four-legged trot, the legs moving in diagonal pairs. The legs on the far side of the body are drawn darker and partly behind the near ones. The body stays level and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near front leg and the far hind leg reach forward; the far front leg and the near hind leg are pushed back: the widest stride.
2. PASSING: all four legs gather beneath the body, bent, the lifted pair swinging forward; the body is 1 pixel higher.
3. CONTACT WITH THE OTHER PAIR: the far front leg and the near hind leg reach forward; the near front leg and the far hind leg are pushed back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the legs gather beneath the body, the other pair now swinging forward; the body is 1 pixel higher.

The wings stay folded on its back (they may lift 1 pixel at the passing poses). It walks in a low crouch at the same height as the reference.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 034. Zoog  (`034_zoog`)

Attach `034_zoog_front.png` and `034_zoog_side.png`. Save the result as `034_zoog.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Zoog, as shown in the attached reference image: a squat rust-brown, frog-like creature with a domed, ridged back, four bent legs and small pale eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, low, waddling crawl: the squat body rocks a little as the short legs take turns in diagonal pairs. The body stays low and keeps one height in every cell (it rises only 1 pixel at the passing poses 2 and 4). The legs on the far side are drawn darker and partly behind.
1. CONTACT: the near front leg and the far hind leg reach forward and are planted; the far front leg and the near hind leg are back.
2. PASSING: the body moves forward over bent legs, the lifted pair swinging forward; the body is 1 pixel higher.
3. CONTACT WITH THE OTHER PAIR: the far front leg and the near hind leg reach forward; the near front leg and the far hind leg are back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the other pair swinging forward; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 035. Moon-beast  (`035_moon_beast`)

Attach `035_moon_beast_front.png` and `035_moon_beast_side.png`. Save the result as `035_moon_beast.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Moon-beast, as shown in the attached reference image: a huge, pale, toad-like mass with grey spots, short stubby legs and a cluster of pink tentacles on its face. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, low, waddling crawl: the squat body rocks a little as the short legs take turns in diagonal pairs. The body stays low and keeps one height in every cell (it rises only 1 pixel at the passing poses 2 and 4). The legs on the far side are drawn darker and partly behind.
1. CONTACT: the near front leg and the far hind leg reach forward and are planted; the far front leg and the near hind leg are back.
2. PASSING: the body moves forward over bent legs, the lifted pair swinging forward; the body is 1 pixel higher.
3. CONTACT WITH THE OTHER PAIR: the far front leg and the near hind leg reach forward; the near front leg and the far hind leg are back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the other pair swinging forward; the body is 1 pixel higher.

Keep the pink tentacles on its face; they sway a little.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 036. Being of Ib  (`036_being_of_ib`)

Attach `036_being_of_ib_front.png` and `036_being_of_ib_side.png`. Save the result as `036_being_of_ib.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Being of Ib, as shown in the attached reference image: a squat green, toad-like creature with blotchy patterns, big purple-pink ears and lips, and four stubby webbed feet. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, low, waddling crawl: the squat body rocks a little as the short legs take turns in diagonal pairs. The body stays low and keeps one height in every cell (it rises only 1 pixel at the passing poses 2 and 4). The legs on the far side are drawn darker and partly behind.
1. CONTACT: the near front leg and the far hind leg reach forward and are planted; the far front leg and the near hind leg are back.
2. PASSING: the body moves forward over bent legs, the lifted pair swinging forward; the body is 1 pixel higher.
3. CONTACT WITH THE OTHER PAIR: the far front leg and the near hind leg reach forward; the near front leg and the far hind leg are back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the other pair swinging forward; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 037. Nameless City Reptile  (`037_nameless_city_reptile`)

Attach `037_nameless_city_reptile_front.png` and `037_nameless_city_reptile_side.png`. Save the result as `037_nameless_city_reptile.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Nameless City Reptile, as shown in the attached reference image: a squat tan, toad-like reptile with a wide mouth, hunched on four legs. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, low, waddling crawl: the squat body rocks a little as the short legs take turns in diagonal pairs. The body stays low and keeps one height in every cell (it rises only 1 pixel at the passing poses 2 and 4). The legs on the far side are drawn darker and partly behind.
1. CONTACT: the near front leg and the far hind leg reach forward and are planted; the far front leg and the near hind leg are back.
2. PASSING: the body moves forward over bent legs, the lifted pair swinging forward; the body is 1 pixel higher.
3. CONTACT WITH THE OTHER PAIR: the far front leg and the near hind leg reach forward; the near front leg and the far hind leg are back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the other pair swinging forward; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 038. Tsathoggua  (`038_tsathoggua`)

Attach `038_tsathoggua_front.png` and `038_tsathoggua_side.png`. Save the result as `038_tsathoggua.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Tsathoggua, as shown in the attached reference image: a bloated, black, toad-like god with a spotted back, pale round eyes with cross-shaped pupils and a wide flat mouth. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, low, waddling crawl: the squat body rocks a little as the short legs take turns in diagonal pairs. The body stays low and keeps one height in every cell (it rises only 1 pixel at the passing poses 2 and 4). The legs on the far side are drawn darker and partly behind.
1. CONTACT: the near front leg and the far hind leg reach forward and are planted; the far front leg and the near hind leg are back.
2. PASSING: the body moves forward over bent legs, the lifted pair swinging forward; the body is 1 pixel higher.
3. CONTACT WITH THE OTHER PAIR: the far front leg and the near hind leg reach forward; the near front leg and the far hind leg are back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the other pair swinging forward; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 039. Rhan-Tegoth  (`039_rhan_tegoth`)

Attach `039_rhan_tegoth_front.png` and `039_rhan_tegoth_side.png`. Save the result as `039_rhan_tegoth.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Rhan-Tegoth, as shown in the attached reference image: a squat pale grey-beige, toad-like idol-creature covered in round bumps, with large eyes, a wide mouth and short stubby legs. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, low, waddling crawl: the squat body rocks a little as the short legs take turns in diagonal pairs. The body stays low and keeps one height in every cell (it rises only 1 pixel at the passing poses 2 and 4). The legs on the far side are drawn darker and partly behind.
1. CONTACT: the near front leg and the far hind leg reach forward and are planted; the far front leg and the near hind leg are back.
2. PASSING: the body moves forward over bent legs, the lifted pair swinging forward; the body is 1 pixel higher.
3. CONTACT WITH THE OTHER PAIR: the far front leg and the near hind leg reach forward; the near front leg and the far hind leg are back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the other pair swinging forward; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 040. Wamp  (`040_wamp`)

Attach `040_wamp_front.png` and `040_wamp_side.png`. Save the result as `040_wamp.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Wamp, as shown in the attached reference image: a brown, flat-bodied creature with a frog-like head and eight webbed legs. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
Many legs walking in a wave: in every cell some legs are planted and some are lifted and reaching forward. Count the near-side legs from the head: the odd-numbered legs step together, the even-numbered legs step together, and they take turns. The legs on the far side are drawn darker and partly behind. The body keeps one height and moves level, rising 1 pixel at the passing poses (2 and 4).
1. CONTACT: the odd-numbered legs reach forward and are planted; the even-numbered legs are pushed back.
2. PASSING: the planted legs take the weight; the other set is lifted and swinging forward.
3. CONTACT, THE OTHER SET: the even-numbered legs reach forward and are planted; the odd-numbered legs are pushed back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the odd-numbered legs are lifted and swinging forward.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 041. Thousand Young of Shub-Niggurath  (`041_thousand_young`)

Attach `041_thousand_young_front.png` and `041_thousand_young_side.png`. Save the result as `041_thousand_young.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Thousand Young of Shub-Niggurath, as shown in the attached reference image: a low black creature on thick, trunk-like legs, with tentacles rising from its back and a row of pale dots on its front. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
Many legs walking in a wave: in every cell some legs are planted and some are lifted and reaching forward. Count the near-side legs from the head: the odd-numbered legs step together, the even-numbered legs step together, and they take turns. The legs on the far side are drawn darker and partly behind. The body keeps one height and moves level, rising 1 pixel at the passing poses (2 and 4).
1. CONTACT: the odd-numbered legs reach forward and are planted; the even-numbered legs are pushed back.
2. PASSING: the planted legs take the weight; the other set is lifted and swinging forward.
3. CONTACT, THE OTHER SET: the even-numbered legs reach forward and are planted; the odd-numbered legs are pushed back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the odd-numbered legs are lifted and swinging forward.

Keep the tentacles on its back; they sway a little while the legs walk.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 042. The Whisperer, eldritch form  (`042_whisperer-eldritch`)

Attach `042_whisperer-eldritch_front.png` and `042_whisperer-eldritch_side.png`. Save the result as `042_whisperer-eldritch.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Whisperer, eldritch form, as shown in the attached reference image: a pale pink spider-fly: a round body, antennae, insect wings and eight thin legs. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
Many legs walking in a wave: in every cell some legs are planted and some are lifted and reaching forward. Count the near-side legs from the head: the odd-numbered legs step together, the even-numbered legs step together, and they take turns. The legs on the far side are drawn darker and partly behind. The body keeps one height and moves level, rising 1 pixel at the passing poses (2 and 4).
1. CONTACT: the odd-numbered legs reach forward and are planted; the even-numbered legs are pushed back.
2. PASSING: the planted legs take the weight; the other set is lifted and swinging forward.
3. CONTACT, THE OTHER SET: the even-numbered legs reach forward and are planted; the odd-numbered legs are pushed back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the odd-numbered legs are lifted and swinging forward.

The wings stay folded up on its back; the antennae sway a little.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 043. Yekubian  (`043_yekubian`)

Attach `043_yekubian_front.png` and `043_yekubian_side.png`. Save the result as `043_yekubian.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Yekubian, as shown in the attached reference image: a pale, segmented, centipede-like creature on many legs, with one large round eye on a stalk-like head and a fan-shaped tail. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
Many legs walking in a wave: in every cell some legs are planted and some are lifted and reaching forward. Count the near-side legs from the head: the odd-numbered legs step together, the even-numbered legs step together, and they take turns. The legs on the far side are drawn darker and partly behind. The body keeps one height and moves level, rising 1 pixel at the passing poses (2 and 4).
1. CONTACT: the odd-numbered legs reach forward and are planted; the even-numbered legs are pushed back.
2. PASSING: the planted legs take the weight; the other set is lifted and swinging forward.
3. CONTACT, THE OTHER SET: the even-numbered legs reach forward and are planted; the odd-numbered legs are pushed back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the odd-numbered legs are lifted and swinging forward.

Its long body flexes a little with the leg wave; keep its head at the same height in every cell.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 044. Blind Albino Penguin  (`044_albino_penguin`)

Attach `044_albino_penguin_front.png` and `044_albino_penguin_side.png`. Save the result as `044_albino_penguin.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Blind Albino Penguin, as shown in the attached reference image: a tall, blind, pale grey-white penguin with a smooth body and no eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A penguin's waddle: the whole body rocks, tipping forward over the stepping foot, and the small flippers swing opposite to the feet.
1. CONTACT: the near foot steps forward, flat on the ground, the body tipped slightly forward; the far foot is behind with its toes down; the near flipper swings back, the far flipper forward.
2. PASSING: the body is upright and 1 pixel higher; the lifted foot passes beside the standing foot; the flippers hang by the body.
3. CONTACT ON THE OTHER FOOT: the far foot steps forward, the near foot is behind, the body tipped slightly forward, the flippers swapped: the mirror of cell 1, NOT a copy.
4. PASSING ON THE OTHER FOOT: upright, 1 pixel higher, the near foot lifted and passing beside the standing one.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 045. Night-gaunt  (`045_night_gaunt`)

Attach `045_night_gaunt_front.png` and `045_night_gaunt_side.png`. Save the result as `045_night_gaunt.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Night-gaunt, as shown in the attached reference image: a faceless, slender black horned demon with big bat wings, a barbed tail and thin limbs with curled claws, hovering. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
It does not walk: it hovers and beats its wings. Only the wings (and 1 pixel of body bob) move; the head, the body, the limbs and the tail keep the reference's pose and place in every cell. Keep every wing position inside the cell with a margin.
1. WINGS UP: the wings raised high behind the back; the body at its lowest.
2. DOWNSTROKE: the wings level, spread out and pointing back; the body 1 pixel higher.
3. WINGS DOWN: the wings swept down below the body; the body at its highest, 2 pixels above cell 1; the tail swung slightly.
4. UPSTROKE: the wings level again, rising; the body 1 pixel higher than cell 1.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

## B. Already have a four-frame side walk (only if you want it redrawn) (16)

### 046. Innsmouth Hybrid  (`046_innsmouth_hybrid`)

Attach `046_innsmouth_hybrid_front.png` and `046_innsmouth_hybrid_side.png`. Save the result as `046_innsmouth_hybrid.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Innsmouth Hybrid, as shown in the attached reference image: a gaunt, pale-green humanoid in a long olive coat, trousers and boots, with a flat fish-like face, standing upright. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 047. Innsmouth Hybrid, eldritch form  (`047_innsmouth_hybrid-eldritch`)

Attach `047_innsmouth_hybrid-eldritch_front.png` and `047_innsmouth_hybrid-eldritch_side.png`. Save the result as `047_innsmouth_hybrid-eldritch.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Innsmouth Hybrid, eldritch form, as shown in the attached reference image: a stooped, grey-blue-skinned humanoid in a long open dark coat, trousers and boots, with a flat fish-like face. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 048. Ghoul  (`048_ghoul`)

Attach `048_ghoul_front.png` and `048_ghoul_side.png`. Save the result as `048_ghoul.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Ghoul, as shown in the attached reference image: a hunched olive-brown, dog-faced ghoul with long arms, clawed hands and glowing pale eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, hunched, shambling walk on bent knees; the long arms swing opposite to the legs and the hands hang low. The body leans forward by the same amount in every cell and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near leg (lighter) steps forward, foot flat; the far leg (darker, behind it) trails with the toe down; the far arm swings forward, the near arm back.
2. PASSING: the near leg is straight under the body taking the weight; the far leg is bent and swinging forward past it, foot lifted; the arms hang close to the body.
3. CONTACT ON THE OTHER FOOT: the far leg (darker) steps forward and the near leg trails behind; the near arm swings forward, the far arm back: the mirror of cell 1, NOT a copy.
4. PASSING ON THE OTHER FOOT: the far leg is straight under the body; the near leg is bent and swinging forward past it; the arms hang close to the body.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 049. K'n-yan Dweller  (`049_kn_yan_dweller`)

Attach `049_kn_yan_dweller_front.png` and `049_kn_yan_dweller_side.png`. Save the result as `049_kn_yan_dweller.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: K'n-yan Dweller, as shown in the attached reference image: a figure in a long dark coat-robe with gold trim at the collar and hem and black hair, standing upright. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
The long robe hides the legs, so the walk is told by the hem and the shoes. The robe's outline keeps one size in every cell; only the hem, the shoe tips and the cloth swing.
1. CONTACT: the near foot (toward the viewer) steps forward out of the hem, heel down; the hem pushes forward over it; the far foot's toe shows behind and the robe's back edge trails backward.
2. PASSING: the feet are together under the body; the hem hangs almost straight, swaying a little; the sleeves sway; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: the far foot (darker) now steps forward out of the hem and the near foot shows behind, the cloth swung the same way: the mirror of cell 1's feet, NOT a copy.
4. PASSING ON THE OTHER FOOT: the feet together again, the hem swaying the opposite way to cell 2; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 050. Reanimated Corpse  (`050_reanimated_corpse`)

Attach `050_reanimated_corpse_front.png` and `050_reanimated_corpse_side.png`. Save the result as `050_reanimated_corpse.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Reanimated Corpse, as shown in the attached reference image: a pale grey-skinned man in a plain grey shirt and dark trousers, barefoot, the arms hanging. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

A stiff, slightly dragging shamble.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 051. Star-spawn of Cthulhu  (`051_star_spawn`)

Attach `051_star_spawn_front.png` and `051_star_spawn_side.png`. Save the result as `051_star_spawn.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Star-spawn of Cthulhu, as shown in the attached reference image: a hulking pale-green brute with an octopus-like face of tentacles, thick limbs, big claws and small wings folded behind. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, hunched, shambling walk on bent knees; the long arms swing opposite to the legs and the hands hang low. The body leans forward by the same amount in every cell and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near leg (lighter) steps forward, foot flat; the far leg (darker, behind it) trails with the toe down; the far arm swings forward, the near arm back.
2. PASSING: the near leg is straight under the body taking the weight; the far leg is bent and swinging forward past it, foot lifted; the arms hang close to the body.
3. CONTACT ON THE OTHER FOOT: the far leg (darker) steps forward and the near leg trails behind; the near arm swings forward, the far arm back: the mirror of cell 1, NOT a copy.
4. PASSING ON THE OTHER FOOT: the far leg is straight under the body; the near leg is bent and swinging forward past it; the arms hang close to the body.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 052. Wilbur Whateley  (`052_wilbur_whateley`)

Attach `052_wilbur_whateley_front.png` and `052_wilbur_whateley_side.png`. Save the result as `052_wilbur_whateley.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Wilbur Whateley, as shown in the attached reference image: a tall figure in a long red-brown coat with a goat-like head, thin legs and writhing tentacles on his torso. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

Keep the torso tentacles; they sway a little.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 053. Ephraim Waite  (`053_ephraim_waite`)

Attach `053_ephraim_waite_front.png` and `053_ephraim_waite_side.png`. Save the result as `053_ephraim_waite.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Ephraim Waite, as shown in the attached reference image: a stern grey-green man in a long jacket and trousers, standing upright. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 054. Lilith  (`054_lilith`)

Attach `054_lilith_front.png` and `054_lilith_side.png`. Save the result as `054_lilith.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Lilith, as shown in the attached reference image: a very thin, pale, bald, nude-looking humanoid with red eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 055. Dr. Muñoz  (`055_dr_munoz`)

Attach `055_dr_munoz_front.png` and `055_dr_munoz_side.png`. Save the result as `055_dr_munoz.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Dr. Muñoz, as shown in the attached reference image: a grey-haired, bearded man in a grey three-piece suit. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 056. The Gorgon of Medusa's Coil  (`056_medusa_gorgon`)

Attach `056_medusa_gorgon_front.png` and `056_medusa_gorgon_side.png`. Save the result as `056_medusa_gorgon.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Gorgon of Medusa's Coil, as shown in the attached reference image: a figure in dark clothes and boots with snake-like tentacle hair and white glowing eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 057. Hypnos  (`057_hypnos`)

Attach `057_hypnos_front.png` and `057_hypnos_side.png`. Save the result as `057_hypnos.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Hypnos, as shown in the attached reference image: a bearded man in a tan jacket and trousers with violet eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 058. The Great Ones  (`058_great_ones`)

Attach `058_great_ones_front.png` and `058_great_ones_side.png`. Save the result as `058_great_ones.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Great Ones, as shown in the attached reference image: a grey stone giant of cracked plates with thick limbs and glowing yellow eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

Heavy and stiff: a stomping walk on thick legs.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 059. Deep One  (`059_deep_one`)

Attach `059_deep_one_front.png` and `059_deep_one_side.png`. Save the result as `059_deep_one.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Deep One, as shown in the attached reference image: a hunched, bulging-eyed grey-green frog-fish humanoid with webbed hands and feet, a fin ridge down its back and a pale belly. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, hunched, shambling walk on bent knees; the long arms swing opposite to the legs and the hands hang low. The body leans forward by the same amount in every cell and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near leg (lighter) steps forward, foot flat; the far leg (darker, behind it) trails with the toe down; the far arm swings forward, the near arm back.
2. PASSING: the near leg is straight under the body taking the weight; the far leg is bent and swinging forward past it, foot lifted; the arms hang close to the body.
3. CONTACT ON THE OTHER FOOT: the far leg (darker) steps forward and the near leg trails behind; the near arm swings forward, the far arm back: the mirror of cell 1, NOT a copy.
4. PASSING ON THE OTHER FOOT: the far leg is straight under the body; the near leg is bent and swinging forward past it; the arms hang close to the body.

Keep it upright as in the reference, not a crouched lope.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 060. Deep One, eldritch form  (`060_deep_one-eldritch`)

Attach `060_deep_one-eldritch_front.png` and `060_deep_one-eldritch_side.png`. Save the result as `060_deep_one-eldritch.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Deep One, eldritch form, as shown in the attached reference image: the same hunched grey-green frog-fish humanoid, now with a glowing green eye and green glow. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, hunched, shambling walk on bent knees; the long arms swing opposite to the legs and the hands hang low. The body leans forward by the same amount in every cell and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near leg (lighter) steps forward, foot flat; the far leg (darker, behind it) trails with the toe down; the far arm swings forward, the near arm back.
2. PASSING: the near leg is straight under the body taking the weight; the far leg is bent and swinging forward past it, foot lifted; the arms hang close to the body.
3. CONTACT ON THE OTHER FOOT: the far leg (darker) steps forward and the near leg trails behind; the near arm swings forward, the far arm back: the mirror of cell 1, NOT a copy.
4. PASSING ON THE OTHER FOOT: the far leg is straight under the body; the near leg is bent and swinging forward past it; the arms hang close to the body.

Keep it upright as in the reference, not a crouched lope.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 061. Joseph Curwen  (`061_joseph_curwen`)

Attach `061_joseph_curwen_front.png` and `061_joseph_curwen_side.png`. Save the result as `061_joseph_curwen.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Joseph Curwen, as shown in the attached reference image: a gentleman in an olive colonial coat, knee breeches, stockings and buckled shoes, with a white wig. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

## C. No legs: a four-frame move cycle (slither, ooze, float, wingbeat) (35)

### 062. Serpent Man of Valusia, eldritch form  (`062_serpent_man-eldritch`)

Attach `062_serpent_man-eldritch_front.png` and `062_serpent_man-eldritch_side.png`. Save the result as `062_serpent_man-eldritch.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Serpent Man of Valusia, eldritch form, as shown in the attached reference image: a dark grey cobra coiled in loops with its upper body reared and a flared hood. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs: it slithers in an S-wave that travels along the body from the head to the tail. Its length and thickness stay the same in every cell; only the curves move. The head stays at one height (within 1 pixel) and the lowest part of the body stays on the ground line.
1. WAVE PHASE 0: the body in an S-curve, its crests and dips at set places along the length.
2. QUARTER WAVE LATER: the crests and dips have moved a quarter of a wavelength toward the tail.
3. HALF WAVE LATER: the curve is the mirror of cell 1: where the body arched up in cell 1 it now dips, and the other way round.
4. THREE-QUARTER WAVE LATER: the crests have moved on again; the next step brings it back to cell 1, so the four cells loop.

Keep the reared, hooded head at one height; the coils shift as it glides.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 063. Child of Yig  (`063_child_of_yig`)

Attach `063_child_of_yig_front.png` and `063_child_of_yig_side.png`. Save the result as `063_child_of_yig.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Child of Yig, as shown in the attached reference image: a writhing nest of tan-brown snakes with one head raised. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs: it slithers in an S-wave that travels along the body from the head to the tail. Its length and thickness stay the same in every cell; only the curves move. The head stays at one height (within 1 pixel) and the lowest part of the body stays on the ground line.
1. WAVE PHASE 0: the body in an S-curve, its crests and dips at set places along the length.
2. QUARTER WAVE LATER: the crests and dips have moved a quarter of a wavelength toward the tail.
3. HALF WAVE LATER: the curve is the mirror of cell 1: where the body arched up in cell 1 it now dips, and the other way round.
4. THREE-QUARTER WAVE LATER: the crests have moved on again; the next step brings it back to cell 1, so the four cells loop.

Each snake slithers; the nest shifts forward as one.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 064. Dhole  (`064_dhole`)

Attach `064_dhole_front.png` and `064_dhole_side.png`. Save the result as `064_dhole.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Dhole, as shown in the attached reference image: a huge pale grey worm with a rounded head, in loose coils. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs: it slithers in an S-wave that travels along the body from the head to the tail. Its length and thickness stay the same in every cell; only the curves move. The head stays at one height (within 1 pixel) and the lowest part of the body stays on the ground line.
1. WAVE PHASE 0: the body in an S-curve, its crests and dips at set places along the length.
2. QUARTER WAVE LATER: the crests and dips have moved a quarter of a wavelength toward the tail.
3. HALF WAVE LATER: the curve is the mirror of cell 1: where the body arched up in cell 1 it now dips, and the other way round.
4. THREE-QUARTER WAVE LATER: the crests have moved on again; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 065. The Horror at Martin's Beach  (`065_martins_beach_horror`)

Attach `065_martins_beach_horror_front.png` and `065_martins_beach_horror_side.png`. Save the result as `065_martins_beach_horror.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Horror at Martin's Beach, as shown in the attached reference image: a dark teal giant sea-serpent worm with a small head raised. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs: it slithers in an S-wave that travels along the body from the head to the tail. Its length and thickness stay the same in every cell; only the curves move. The head stays at one height (within 1 pixel) and the lowest part of the body stays on the ground line.
1. WAVE PHASE 0: the body in an S-curve, its crests and dips at set places along the length.
2. QUARTER WAVE LATER: the crests and dips have moved a quarter of a wavelength toward the tail.
3. HALF WAVE LATER: the curve is the mirror of cell 1: where the body arched up in cell 1 it now dips, and the other way round.
4. THREE-QUARTER WAVE LATER: the crests have moved on again; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 066. Yig  (`066_yig`)

Attach `066_yig_front.png` and `066_yig_side.png`. Save the result as `066_yig.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Yig, as shown in the attached reference image: a tan-brown giant serpent with a raised head and pale eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs: it slithers in an S-wave that travels along the body from the head to the tail. Its length and thickness stay the same in every cell; only the curves move. The head stays at one height (within 1 pixel) and the lowest part of the body stays on the ground line.
1. WAVE PHASE 0: the body in an S-curve, its crests and dips at set places along the length.
2. QUARTER WAVE LATER: the crests and dips have moved a quarter of a wavelength toward the tail.
3. HALF WAVE LATER: the curve is the mirror of cell 1: where the body arched up in cell 1 it now dips, and the other way round.
4. THREE-QUARTER WAVE LATER: the crests have moved on again; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 067. Rat Swarm  (`067_rat_swarm`)

Attach `067_rat_swarm_front.png` and `067_rat_swarm_side.png`. Save the result as `067_rat_swarm.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Rat Swarm, as shown in the attached reference image: a heap of black rats with glowing amber eyes and thin pink tails. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
A scurrying heap: the whole pile shuffles forward while the individual animals scramble. The number of animals, their size and their colours stay the same; the pile keeps one overall size and sits on the ground line.
1. The front animals' paws reach forward; the pile low and stretched slightly forward; a few tails whip back.
2. The animals bunch together; the pile shorter and 1 or 2 pixels higher.
3. Different animals lead (the lumps of the pile rearranged: not a copy of cell 1); the pile stretched forward again; tails the other way.
4. The animals bunch again, 1 or 2 pixels higher; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 068. Shoggoth  (`068_shoggoth`)

Attach `068_shoggoth_front.png` and `068_shoggoth_side.png`. Save the result as `068_shoggoth.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Shoggoth, as shown in the attached reference image: a black heap of bubbling spheres with glowing green eyes dotted over it. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs: it crawls by flowing. The mass keeps about the same size in every cell, with one flat base on the ground line; it heaves forward in surges. Any eyes, horns, tentacles or orbs keep their colours and sizes; nothing new grows.
1. STRETCH: the front of the mass reaches forward, low and long; the rear gathers; the highest point sits toward the rear.
2. GATHER: the rear pulls up toward the middle: the whole mass shortens and rises about 2 pixels; the surface features have moved forward.
3. SECOND SURGE: a different lobe or tentacle reaches forward (not the same shape as cell 1); the highest point sits toward the front.
4. GATHER AGAIN: the mass bunches and rises, the surface features moved forward again; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 069. Elder Shoggoth  (`069_shoggoth-boss`)

Attach `069_shoggoth-boss_front.png` and `069_shoggoth-boss_side.png`. Save the result as `069_shoggoth-boss.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Elder Shoggoth, as shown in the attached reference image: a larger, darker black heap of bubbling spheres with many glowing green eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs: it crawls by flowing. The mass keeps about the same size in every cell, with one flat base on the ground line; it heaves forward in surges. Any eyes, horns, tentacles or orbs keep their colours and sizes; nothing new grows.
1. STRETCH: the front of the mass reaches forward, low and long; the rear gathers; the highest point sits toward the rear.
2. GATHER: the rear pulls up toward the middle: the whole mass shortens and rises about 2 pixels; the surface features have moved forward.
3. SECOND SURGE: a different lobe or tentacle reaches forward (not the same shape as cell 1); the highest point sits toward the front.
4. GATHER AGAIN: the mass bunches and rises, the surface features moved forward again; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 070. Formless Spawn of Tsathoggua  (`070_formless_spawn`)

Attach `070_formless_spawn_front.png` and `070_formless_spawn_side.png`. Save the result as `070_formless_spawn.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Formless Spawn of Tsathoggua, as shown in the attached reference image: a flat, dark purple-black mass with two curled horn-like tentacles. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs: it crawls by flowing. The mass keeps about the same size in every cell, with one flat base on the ground line; it heaves forward in surges. Any eyes, horns, tentacles or orbs keep their colours and sizes; nothing new grows.
1. STRETCH: the front of the mass reaches forward, low and long; the rear gathers; the highest point sits toward the rear.
2. GATHER: the rear pulls up toward the middle: the whole mass shortens and rises about 2 pixels; the surface features have moved forward.
3. SECOND SURGE: a different lobe or tentacle reaches forward (not the same shape as cell 1); the highest point sits toward the front.
4. GATHER AGAIN: the mass bunches and rises, the surface features moved forward again; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 071. The Unnamable  (`071_the_unnamable`)

Attach `071_the_unnamable_front.png` and `071_the_unnamable_side.png`. Save the result as `071_the_unnamable.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Unnamable, as shown in the attached reference image: a flat dark blob with horn-shaped tentacles and white square eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs: it crawls by flowing. The mass keeps about the same size in every cell, with one flat base on the ground line; it heaves forward in surges. Any eyes, horns, tentacles or orbs keep their colours and sizes; nothing new grows.
1. STRETCH: the front of the mass reaches forward, low and long; the rear gathers; the highest point sits toward the rear.
2. GATHER: the rear pulls up toward the middle: the whole mass shortens and rises about 2 pixels; the surface features have moved forward.
3. SECOND SURGE: a different lobe or tentacle reaches forward (not the same shape as cell 1); the highest point sits toward the front.
4. GATHER AGAIN: the mass bunches and rises, the surface features moved forward again; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 072. The Shunned House Entity  (`072_shunned_house_entity`)

Attach `072_shunned_house_entity_front.png` and `072_shunned_house_entity_side.png`. Save the result as `072_shunned_house_entity.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Shunned House Entity, as shown in the attached reference image: a pale pink, lumpy, cloud-like mass with a single green eye. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs: it crawls by flowing. The mass keeps about the same size in every cell, with one flat base on the ground line; it heaves forward in surges. Any eyes, horns, tentacles or orbs keep their colours and sizes; nothing new grows.
1. STRETCH: the front of the mass reaches forward, low and long; the rear gathers; the highest point sits toward the rear.
2. GATHER: the rear pulls up toward the middle: the whole mass shortens and rises about 2 pixels; the surface features have moved forward.
3. SECOND SURGE: a different lobe or tentacle reaches forward (not the same shape as cell 1); the highest point sits toward the front.
4. GATHER AGAIN: the mass bunches and rises, the surface features moved forward again; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 073. Thing in Curwen's Pits  (`073_curwen_pit_thing`)

Attach `073_curwen_pit_thing_front.png` and `073_curwen_pit_thing_side.png`. Save the result as `073_curwen_pit_thing.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Thing in Curwen's Pits, as shown in the attached reference image: a pinkish-tan lumpy mound with a gaping hole on top and tentacles at its base. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs: it crawls by flowing. The mass keeps about the same size in every cell, with one flat base on the ground line; it heaves forward in surges. Any eyes, horns, tentacles or orbs keep their colours and sizes; nothing new grows.
1. STRETCH: the front of the mass reaches forward, low and long; the rear gathers; the highest point sits toward the rear.
2. GATHER: the rear pulls up toward the middle: the whole mass shortens and rises about 2 pixels; the surface features have moved forward.
3. SECOND SURGE: a different lobe or tentacle reaches forward (not the same shape as cell 1); the highest point sits toward the front.
4. GATHER AGAIN: the mass bunches and rises, the surface features moved forward again; the next step brings it back to cell 1, so the four cells loop.

The base tentacles pull it along in turns.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 074. High Priest Not to Be Described, eldritch form  (`074_high_priest-eldritch`)

Attach `074_high_priest-eldritch_front.png` and `074_high_priest-eldritch_side.png`. Save the result as `074_high_priest-eldritch.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: High Priest Not to Be Described, eldritch form, as shown in the attached reference image: a beige, bulbous mass of tangled tentacles. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs: it crawls by flowing. The mass keeps about the same size in every cell, with one flat base on the ground line; it heaves forward in surges. Any eyes, horns, tentacles or orbs keep their colours and sizes; nothing new grows.
1. STRETCH: the front of the mass reaches forward, low and long; the rear gathers; the highest point sits toward the rear.
2. GATHER: the rear pulls up toward the middle: the whole mass shortens and rises about 2 pixels; the surface features have moved forward.
3. SECOND SURGE: a different lobe or tentacle reaches forward (not the same shape as cell 1); the highest point sits toward the front.
4. GATHER AGAIN: the mass bunches and rises, the surface features moved forward again; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 075. Nug  (`075_nug`)

Attach `075_nug_front.png` and `075_nug_side.png`. Save the result as `075_nug.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Nug, as shown in the attached reference image: a white, lumpy, cloud-like heap with small eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs: it crawls by flowing. The mass keeps about the same size in every cell, with one flat base on the ground line; it heaves forward in surges. Any eyes, horns, tentacles or orbs keep their colours and sizes; nothing new grows.
1. STRETCH: the front of the mass reaches forward, low and long; the rear gathers; the highest point sits toward the rear.
2. GATHER: the rear pulls up toward the middle: the whole mass shortens and rises about 2 pixels; the surface features have moved forward.
3. SECOND SURGE: a different lobe or tentacle reaches forward (not the same shape as cell 1); the highest point sits toward the front.
4. GATHER AGAIN: the mass bunches and rises, the surface features moved forward again; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 076. Yeb  (`076_yeb`)

Attach `076_yeb_front.png` and `076_yeb_side.png`. Save the result as `076_yeb.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Yeb, as shown in the attached reference image: a dark grey-black heaving mass with one small pale eye. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs: it crawls by flowing. The mass keeps about the same size in every cell, with one flat base on the ground line; it heaves forward in surges. Any eyes, horns, tentacles or orbs keep their colours and sizes; nothing new grows.
1. STRETCH: the front of the mass reaches forward, low and long; the rear gathers; the highest point sits toward the rear.
2. GATHER: the rear pulls up toward the middle: the whole mass shortens and rises about 2 pixels; the surface features have moved forward.
3. SECOND SURGE: a different lobe or tentacle reaches forward (not the same shape as cell 1); the highest point sits toward the front.
4. GATHER AGAIN: the mass bunches and rises, the surface features moved forward again; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 077. Nyarlathotep, the Crawling Chaos  (`077_nyarlathotep-eldritch`)

Attach `077_nyarlathotep-eldritch_front.png` and `077_nyarlathotep-eldritch_side.png`. Save the result as `077_nyarlathotep-eldritch.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Nyarlathotep, the Crawling Chaos, as shown in the attached reference image: a heap of dark-violet spheres with a single violet eye. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs: it crawls by flowing. The mass keeps about the same size in every cell, with one flat base on the ground line; it heaves forward in surges. Any eyes, horns, tentacles or orbs keep their colours and sizes; nothing new grows.
1. STRETCH: the front of the mass reaches forward, low and long; the rear gathers; the highest point sits toward the rear.
2. GATHER: the rear pulls up toward the middle: the whole mass shortens and rises about 2 pixels; the surface features have moved forward.
3. SECOND SURGE: a different lobe or tentacle reaches forward (not the same shape as cell 1); the highest point sits toward the front.
4. GATHER AGAIN: the mass bunches and rises, the surface features moved forward again; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 078. Moon-Bog Wraith  (`078_moon_bog_wraith`)

Attach `078_moon_bog_wraith_front.png` and `078_moon_bog_wraith_side.png`. Save the result as `078_moon_bog_wraith.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Moon-Bog Wraith, as shown in the attached reference image: a pale, long-haired wraith in a flowing white-grey gown with the hands held out in front. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs, no steps: it glides forward just above the ground, bobbing gently. The cloak's hem and any ragged edges ripple in a wave that trails behind it (to the right). Its outline and size stay the same in every cell; its lowest point stays at the reference's level, plus the bob.
1. LOW: the figure at its lowest; the hem swept back to the right and fairly flat.
2. RISING: the figure 1 pixel higher; the hem's ripple has moved a quarter of the way up the cloth; the lower hem hangs down more.
3. HIGH: the figure at its highest, 2 pixels above cell 1; the hem rippled the other way, its edge curling forward, the cloak billowing slightly.
4. FALLING: the figure 1 pixel lower than cell 3; the hem swinging back to trail; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 079. The Voice in the Tomb  (`079_voice_in_the_tomb`)

Attach `079_voice_in_the_tomb_front.png` and `079_voice_in_the_tomb_side.png`. Save the result as `079_voice_in_the_tomb.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Voice in the Tomb, as shown in the attached reference image: a dark grey hooded cloak-wraith with a ragged hem. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs, no steps: it glides forward just above the ground, bobbing gently. The cloak's hem and any ragged edges ripple in a wave that trails behind it (to the right). Its outline and size stay the same in every cell; its lowest point stays at the reference's level, plus the bob.
1. LOW: the figure at its lowest; the hem swept back to the right and fairly flat.
2. RISING: the figure 1 pixel higher; the hem's ripple has moved a quarter of the way up the cloth; the lower hem hangs down more.
3. HIGH: the figure at its highest, 2 pixels above cell 1; the hem rippled the other way, its edge curling forward, the cloak billowing slightly.
4. FALLING: the figure 1 pixel lower than cell 3; the hem swinging back to trail; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 080. High Priest Not to Be Described  (`080_high_priest`)

Attach `080_high_priest_front.png` and `080_high_priest_side.png`. Save the result as `080_high_priest.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: High Priest Not to Be Described, as shown in the attached reference image: a tall tan hooded robe with big sleeves and a blank dark hood. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs, no steps: it glides forward just above the ground, bobbing gently. The cloak's hem and any ragged edges ripple in a wave that trails behind it (to the right). Its outline and size stay the same in every cell; its lowest point stays at the reference's level, plus the bob.
1. LOW: the figure at its lowest; the hem swept back to the right and fairly flat.
2. RISING: the figure 1 pixel higher; the hem's ripple has moved a quarter of the way up the cloth; the lower hem hangs down more.
3. HIGH: the figure at its highest, 2 pixels above cell 1; the hem rippled the other way, its edge curling forward, the cloak billowing slightly.
4. FALLING: the figure 1 pixel lower than cell 3; the hem swinging back to trail; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 081. Hastur  (`081_hastur`)

Attach `081_hastur_front.png` and `081_hastur_side.png`. Save the result as `081_hastur.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Hastur, as shown in the attached reference image: a tall tattered yellow-brown hooded robe whose hem ends in thin tentacles. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs, no steps: it glides forward just above the ground, bobbing gently. The cloak's hem and any ragged edges ripple in a wave that trails behind it (to the right). Its outline and size stay the same in every cell; its lowest point stays at the reference's level, plus the bob.
1. LOW: the figure at its lowest; the hem swept back to the right and fairly flat.
2. RISING: the figure 1 pixel higher; the hem's ripple has moved a quarter of the way up the cloth; the lower hem hangs down more.
3. HIGH: the figure at its highest, 2 pixels above cell 1; the hem rippled the other way, its edge curling forward, the cloak billowing slightly.
4. FALLING: the figure 1 pixel lower than cell 3; the hem swinging back to trail; the next step brings it back to cell 1, so the four cells loop.

The hem tentacles ripple.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 082. The Daemon Pipers  (`082_daemon_pipers`)

Attach `082_daemon_pipers_front.png` and `082_daemon_pipers_side.png`. Save the result as `082_daemon_pipers.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Daemon Pipers, as shown in the attached reference image: a tall black hooded cloak with a ragged hem. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs, no steps: it glides forward just above the ground, bobbing gently. The cloak's hem and any ragged edges ripple in a wave that trails behind it (to the right). Its outline and size stay the same in every cell; its lowest point stays at the reference's level, plus the bob.
1. LOW: the figure at its lowest; the hem swept back to the right and fairly flat.
2. RISING: the figure 1 pixel higher; the hem's ripple has moved a quarter of the way up the cloth; the lower hem hangs down more.
3. HIGH: the figure at its highest, 2 pixels above cell 1; the hem rippled the other way, its edge curling forward, the cloak billowing slightly.
4. FALLING: the figure 1 pixel lower than cell 3; the hem swinging back to trail; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 083. The Other Gods  (`083_other_gods`)

Attach `083_other_gods_front.png` and `083_other_gods_side.png`. Save the result as `083_other_gods.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Other Gods, as shown in the attached reference image: a pale grey-white hooded figure in a ragged white cloak ending in thin tentacle-like feet. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs, no steps: it glides forward just above the ground, bobbing gently. The cloak's hem and any ragged edges ripple in a wave that trails behind it (to the right). Its outline and size stay the same in every cell; its lowest point stays at the reference's level, plus the bob.
1. LOW: the figure at its lowest; the hem swept back to the right and fairly flat.
2. RISING: the figure 1 pixel higher; the hem's ripple has moved a quarter of the way up the cloth; the lower hem hangs down more.
3. HIGH: the figure at its highest, 2 pixels above cell 1; the hem rippled the other way, its edge curling forward, the cloak billowing slightly.
4. FALLING: the figure 1 pixel lower than cell 3; the hem swinging back to trail; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 084. 'Umr at-Tawil  (`084_umr_at_tawil`)

Attach `084_umr_at_tawil_front.png` and `084_umr_at_tawil_side.png`. Save the result as `084_umr_at_tawil.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: 'Umr at-Tawil, as shown in the attached reference image: a tall dark-grey hooded robe with a vertical dark seam down the front. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs, no steps: it glides forward just above the ground, bobbing gently. The cloak's hem and any ragged edges ripple in a wave that trails behind it (to the right). Its outline and size stay the same in every cell; its lowest point stays at the reference's level, plus the bob.
1. LOW: the figure at its lowest; the hem swept back to the right and fairly flat.
2. RISING: the figure 1 pixel higher; the hem's ripple has moved a quarter of the way up the cloth; the lower hem hangs down more.
3. HIGH: the figure at its highest, 2 pixels above cell 1; the hem rippled the other way, its edge curling forward, the cloak billowing slightly.
4. FALLING: the figure 1 pixel lower than cell 3; the hem swinging back to trail; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 085. The Ancient Ones  (`085_ancient_ones`)

Attach `085_ancient_ones_front.png` and `085_ancient_ones_side.png`. Save the result as `085_ancient_ones.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Ancient Ones, as shown in the attached reference image: a tall pale grey-white hooded robe. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs, no steps: it glides forward just above the ground, bobbing gently. The cloak's hem and any ragged edges ripple in a wave that trails behind it (to the right). Its outline and size stay the same in every cell; its lowest point stays at the reference's level, plus the bob.
1. LOW: the figure at its lowest; the hem swept back to the right and fairly flat.
2. RISING: the figure 1 pixel higher; the hem's ripple has moved a quarter of the way up the cloth; the lower hem hangs down more.
3. HIGH: the figure at its highest, 2 pixels above cell 1; the hem rippled the other way, its edge curling forward, the cloak billowing slightly.
4. FALLING: the figure 1 pixel lower than cell 3; the hem swinging back to trail; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 086. Elder Thing  (`086_elder_thing`)

Attach `086_elder_thing_front.png` and `086_elder_thing_side.png`. Save the result as `086_elder_thing.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Elder Thing, as shown in the attached reference image: a grey-green barrel-shaped creature with a five-pointed star-shaped head, fan-like leaves at its base and tentacle arms. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No stepping legs: it shuffles forward rigidly in a rocking, waddling glide. The body keeps its shape; it tilts about its base by 1 or 2 pixels and bobs 1 pixel; any arms, fans, heads or limbs swing after it, a little behind the body's motion.
1. TILT FORWARD: the top leans forward (to the left) 1 or 2 pixels, the front of the base pressing down; the limbs trail back.
2. UPRIGHT, RISING: the body upright and 1 pixel higher; the limbs hang straight.
3. TILT FORWARD ON THE OTHER SIDE: the top leans forward again with the other side of the base leading and the limbs swung the other way: the mirror of cell 1, NOT a copy.
4. UPRIGHT, RISING: upright and 1 pixel higher, the limbs hanging the other way to cell 2.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 087. Yithian  (`087_yithian`)

Attach `087_yithian_front.png` and `087_yithian_side.png`. Save the result as `087_yithian.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Yithian, as shown in the attached reference image: a cone-shaped, ridged cream body with claws and two stalk-like heads. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No stepping legs: it shuffles forward rigidly in a rocking, waddling glide. The body keeps its shape; it tilts about its base by 1 or 2 pixels and bobs 1 pixel; any arms, fans, heads or limbs swing after it, a little behind the body's motion.
1. TILT FORWARD: the top leans forward (to the left) 1 or 2 pixels, the front of the base pressing down; the limbs trail back.
2. UPRIGHT, RISING: the body upright and 1 pixel higher; the limbs hang straight.
3. TILT FORWARD ON THE OTHER SIDE: the top leans forward again with the other side of the base leading and the limbs swung the other way: the mirror of cell 1, NOT a copy.
4. UPRIGHT, RISING: upright and 1 pixel higher, the limbs hanging the other way to cell 2.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 088. The Whisperer in Akeley's Chair  (`088_whisperer`)

Attach `088_whisperer_front.png` and `088_whisperer_side.png`. Save the result as `088_whisperer.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Whisperer in Akeley's Chair, as shown in the attached reference image: a pale grey bandaged figure in a robe, seated in an armchair. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No stepping legs: it shuffles forward rigidly in a rocking, waddling glide. The body keeps its shape; it tilts about its base by 1 or 2 pixels and bobs 1 pixel; any arms, fans, heads or limbs swing after it, a little behind the body's motion.
1. TILT FORWARD: the top leans forward (to the left) 1 or 2 pixels, the front of the base pressing down; the limbs trail back.
2. UPRIGHT, RISING: the body upright and 1 pixel higher; the limbs hang straight.
3. TILT FORWARD ON THE OTHER SIDE: the top leans forward again with the other side of the base leading and the limbs swung the other way: the mirror of cell 1, NOT a copy.
4. UPRIGHT, RISING: upright and 1 pixel higher, the limbs hanging the other way to cell 2.

The chair and the figure move as one rigid piece: the whole chair rocks and bobs; the figure stays seated; there are no legs walking.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 089. Flying Polyp  (`089_flying_polyp`)

Attach `089_flying_polyp_front.png` and `089_flying_polyp_side.png`. Save the result as `089_flying_polyp.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Flying Polyp, as shown in the attached reference image: a black, beetle-like star-shaped body with long curved tentacle limbs. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
It hovers and drifts forward, with no steps: the limbs or tentacles ripple in a wave and the body bobs 1 pixel. The body keeps one shape and size; only the limbs, the tentacles and the bob change.
1. LIMBS BACK: the limbs and tentacles swept back and down; the body at its lowest.
2. RISING: the limbs halfway; the body 1 pixel higher.
3. LIMBS FORWARD: the limbs swept forward and up, the near-side and far-side limbs swapped from cell 1; the body at its highest, 2 pixels above cell 1.
4. FALLING: the limbs halfway again, mid-ripple; the body 1 pixel lower than cell 3; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 090. Polyp Swarm  (`090_flying_polyp-boss`)

Attach `090_flying_polyp-boss_front.png` and `090_flying_polyp-boss_side.png`. Save the result as `090_flying_polyp-boss.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Polyp Swarm, as shown in the attached reference image: a larger black, beetle-like body with many long curved tentacle limbs. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
It hovers and drifts forward, with no steps: the limbs or tentacles ripple in a wave and the body bobs 1 pixel. The body keeps one shape and size; only the limbs, the tentacles and the bob change.
1. LIMBS BACK: the limbs and tentacles swept back and down; the body at its lowest.
2. RISING: the limbs halfway; the body 1 pixel higher.
3. LIMBS FORWARD: the limbs swept forward and up, the near-side and far-side limbs swapped from cell 1; the body at its highest, 2 pixels above cell 1.
4. FALLING: the limbs halfway again, mid-ripple; the body 1 pixel lower than cell 3; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 091. The Thing Beyond Erich Zann's Window  (`091_zann_window_thing`)

Attach `091_zann_window_thing_front.png` and `091_zann_window_thing_side.png`. Save the result as `091_zann_window_thing.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Thing Beyond Erich Zann's Window, as shown in the attached reference image: a black sphere with glowing purple marks and thin black tentacle legs. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
It hovers and drifts forward, with no steps: the limbs or tentacles ripple in a wave and the body bobs 1 pixel. The body keeps one shape and size; only the limbs, the tentacles and the bob change.
1. LIMBS BACK: the limbs and tentacles swept back and down; the body at its lowest.
2. RISING: the limbs halfway; the body 1 pixel higher.
3. LIMBS FORWARD: the limbs swept forward and up, the near-side and far-side limbs swapped from cell 1; the body at its highest, 2 pixels above cell 1.
4. FALLING: the limbs halfway again, mid-ripple; the body 1 pixel lower than cell 3; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 092. Being from Beyond  (`092_being_from_beyond`)

Attach `092_being_from_beyond_front.png` and `092_being_from_beyond_side.png`. Save the result as `092_being_from_beyond.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Being from Beyond, as shown in the attached reference image: a pale lavender jellyfish with a domed bell and trailing tentacles. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
It swims forward by pulsing: the bell contracts and opens while the tentacles trail and sweep. The creature keeps one overall size and colour.
1. RELAXED: the bell wide and low; the tentacles trailing straight down and back.
2. CONTRACTING: the bell narrowing and taller; the tentacles drawn up toward it.
3. CONTRACTED: the bell at its narrowest and the body at its highest, 2 pixels above cell 1; the tentacles bunched, then swept back.
4. OPENING: the bell widening again; the tentacles reaching out and down; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 093. The Colour Out of Space  (`093_colour_out_of_space`)

Attach `093_colour_out_of_space_front.png` and `093_colour_out_of_space_side.png`. Save the result as `093_colour_out_of_space.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Colour Out of Space, as shown in the attached reference image: a swirling grey-white striped orb with red-magenta veins. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
It tumbles and glides forward, pulsing: the surface pattern (stripes, veins, marks) turns a quarter turn from cell to cell, always moving forward (to the left), while the whole body squashes 1 pixel and bobs 1 pixel. Its outline, colours and size stay the same.
1. The pattern at its starting angle; the body at its lowest, slightly squashed.
2. The pattern turned a quarter turn forward; the body 1 pixel higher.
3. The pattern turned another quarter (half a turn from cell 1); the body at its highest, rounder.
4. The pattern turned another quarter; the body coming down; the next step brings it back to cell 1, so the four cells loop.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 094. Mi-Go  (`094_mi_go`)

Attach `094_mi_go_front.png` and `094_mi_go_side.png`. Save the result as `094_mi_go.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Mi-Go, as shown in the attached reference image: a pink-mauve winged crustacean-fungus creature with an egg-like ridged head, bat-like wings, a segmented body and many clawed limbs. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
It does not walk: it hovers and beats its wings. Only the wings (and 1 pixel of body bob) move; the head, the body, the limbs and the tail keep the reference's pose and place in every cell. Keep every wing position inside the cell with a margin.
1. WINGS UP: the wings raised high behind the back; the body at its lowest.
2. DOWNSTROKE: the wings level, spread out and pointing back; the body 1 pixel higher.
3. WINGS DOWN: the wings swept down below the body; the body at its highest, 2 pixels above cell 1; the tail swung slightly.
4. UPSTROKE: the wings level again, rising; the body 1 pixel higher than cell 1.

The limbs dangle and sway a little.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 095. Mi-Go, eldritch form  (`095_mi_go-eldritch`)

Attach `095_mi_go-eldritch_front.png` and `095_mi_go-eldritch_side.png`. Save the result as `095_mi_go-eldritch.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Mi-Go, eldritch form, as shown in the attached reference image: the same pink-mauve winged crustacean-fungus creature with glowing violet eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
It does not walk: it hovers and beats its wings. Only the wings (and 1 pixel of body bob) move; the head, the body, the limbs and the tail keep the reference's pose and place in every cell. Keep every wing position inside the cell with a margin.
1. WINGS UP: the wings raised high behind the back; the body at its lowest.
2. DOWNSTROKE: the wings level, spread out and pointing back; the body 1 pixel higher.
3. WINGS DOWN: the wings swept down below the body; the body at its highest, 2 pixels above cell 1; the tail swung slightly.
4. UPSTROKE: the wings level again, rising; the body 1 pixel higher than cell 1.

The limbs dangle and sway a little.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 096. The Haunter of the Dark  (`096_haunter_of_the_dark`)

Attach `096_haunter_of_the_dark_front.png` and `096_haunter_of_the_dark_side.png`. Save the result as `096_haunter_of_the_dark.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Haunter of the Dark, as shown in the attached reference image: a black bat-winged flier with a glowing magenta heart-shaped eye. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 64x64 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
It does not walk: it hovers and beats its wings. Only the wings (and 1 pixel of body bob) move; the head, the body, the limbs and the tail keep the reference's pose and place in every cell. Keep every wing position inside the cell with a margin.
1. WINGS UP: the wings raised high behind the back; the body at its lowest.
2. DOWNSTROKE: the wings level, spread out and pointing back; the body 1 pixel higher.
3. WINGS DOWN: the wings swept down below the body; the body at its highest, 2 pixels above cell 1; the tail swung slightly.
4. UPSTROKE: the wings level again, rising; the body 1 pixel higher than cell 1.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

## D. The nine colossi (128x128 frames; last, and only if you want them) (9)

### 097. The Dunwich Horror  (`097_dunwich_horror`)

Attach `097_dunwich_horror_front.png` and `097_dunwich_horror_side.png`. Save the result as `097_dunwich_horror.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Dunwich Horror, as shown in the attached reference image: a vast, ridged purple-black bulk of ropy trunks with rows of round mouths, a crest of pale spikes on top and stubby legs along the bottom edge. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 128x128 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
Many legs walking in a wave: in every cell some legs are planted and some are lifted and reaching forward. Count the near-side legs from the head: the odd-numbered legs step together, the even-numbered legs step together, and they take turns. The legs on the far side are drawn darker and partly behind. The body keeps one height and moves level, rising 1 pixel at the passing poses (2 and 4).
1. CONTACT: the odd-numbered legs reach forward and are planted; the even-numbered legs are pushed back.
2. PASSING: the planted legs take the weight; the other set is lifted and swinging forward.
3. CONTACT, THE OTHER SET: the even-numbered legs reach forward and are planted; the odd-numbered legs are pushed back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the odd-numbered legs are lifted and swinging forward.

It is colossal and slow: the legs step in the wave, the whole mass rocks a little.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 098. The Colossus Beneath the Pyramids  (`098_colossus_pyramids`)

Attach `098_colossus_pyramids_front.png` and `098_colossus_pyramids_side.png`. Save the result as `098_colossus_pyramids.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: The Colossus Beneath the Pyramids, as shown in the attached reference image: a huge tan-brown, dark-veined, gourd-shaped giant with a ring of white eyes on its face and tentacle arms. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 128x128 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
A colossal, slow, heavy lumbering walk, as though every step moves the whole mass: the huge body rocks forward and back about its base and rises at the passing poses. It is one colossal creature: keep its size, outline, colours, markings and every limb or tentacle exactly as in the reference.
1. STEP: the body tilts forward and sinks 2 pixels, its weight on the leading side; the arms or tentacles swing forward and down; the trailing edge lags behind.
2. PASSING: the body upright and 2 pixels higher; the weight in the middle; the arms or tentacles hanging near it.
3. STEP ON THE OTHER SIDE: the body tilts forward and sinks 2 pixels on the other side, the arms or tentacles swung the other way: the mirror of cell 1, NOT a copy.
4. PASSING: upright and 2 pixels higher again, the arms or tentacles hanging the other way to cell 2.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 099. Cthulhu  (`099_cthulhu`)

Attach `099_cthulhu_front.png` and `099_cthulhu_side.png`. Save the result as `099_cthulhu.png`.

```text
Make ONE square image (1:1) of a pixel-art walk-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Cthulhu, as shown in the attached reference image: a green-grey winged giant with an octopus head, long face tentacles, thick limbs and big claws, hunched, the wings folded. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 128x128 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE walk cycle, read left to right, top to bottom.
A heavy, hunched, shambling walk on bent knees; the long arms swing opposite to the legs and the hands hang low. The body leans forward by the same amount in every cell and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near leg (lighter) steps forward, foot flat; the far leg (darker, behind it) trails with the toe down; the far arm swings forward, the near arm back.
2. PASSING: the near leg is straight under the body taking the weight; the far leg is bent and swinging forward past it, foot lifted; the arms hang close to the body.
3. CONTACT ON THE OTHER FOOT: the far leg (darker) steps forward and the near leg trails behind; the near arm swings forward, the far arm back: the mirror of cell 1, NOT a copy.
4. PASSING ON THE OTHER FOOT: the far leg is straight under the body; the near leg is bent and swinging forward past it; the arms hang close to the body.

It is colossal: a slow, heavy walk, the wings folded the whole time.

The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of cells 1 and 2, never copies.
```

### 100. Father Dagon  (`100_father_dagon`)

Attach `100_father_dagon_front.png` and `100_father_dagon_side.png`. Save the result as `100_father_dagon.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Father Dagon, as shown in the attached reference image: a huge olive-camouflage, purple-blotched gourd-shaped giant with white eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 128x128 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
A colossal, slow, heavy lumbering walk, as though every step moves the whole mass: the huge body rocks forward and back about its base and rises at the passing poses. It is one colossal creature: keep its size, outline, colours, markings and every limb or tentacle exactly as in the reference.
1. STEP: the body tilts forward and sinks 2 pixels, its weight on the leading side; the arms or tentacles swing forward and down; the trailing edge lags behind.
2. PASSING: the body upright and 2 pixels higher; the weight in the middle; the arms or tentacles hanging near it.
3. STEP ON THE OTHER SIDE: the body tilts forward and sinks 2 pixels on the other side, the arms or tentacles swung the other way: the mirror of cell 1, NOT a copy.
4. PASSING: upright and 2 pixels higher again, the arms or tentacles hanging the other way to cell 2.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 101. Mother Hydra  (`101_mother_hydra`)

Attach `101_mother_hydra_front.png` and `101_mother_hydra_side.png`. Save the result as `101_mother_hydra.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Mother Hydra, as shown in the attached reference image: a dark gourd-shaped giant with many writhing tentacle arms and white eyes. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 128x128 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
A colossal, slow, heavy lumbering walk, as though every step moves the whole mass: the huge body rocks forward and back about its base and rises at the passing poses. It is one colossal creature: keep its size, outline, colours, markings and every limb or tentacle exactly as in the reference.
1. STEP: the body tilts forward and sinks 2 pixels, its weight on the leading side; the arms or tentacles swing forward and down; the trailing edge lags behind.
2. PASSING: the body upright and 2 pixels higher; the weight in the middle; the arms or tentacles hanging near it.
3. STEP ON THE OTHER SIDE: the body tilts forward and sinks 2 pixels on the other side, the arms or tentacles swung the other way: the mirror of cell 1, NOT a copy.
4. PASSING: upright and 2 pixels higher again, the arms or tentacles hanging the other way to cell 2.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 102. Ghatanothoa  (`102_ghatanothoa`)

Attach `102_ghatanothoa_front.png` and `102_ghatanothoa_side.png`. Save the result as `102_ghatanothoa.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Ghatanothoa, as shown in the attached reference image: a dark purple mountain-like giant with tentacle arms and a pale eye. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 128x128 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
A colossal, slow, heavy lumbering walk, as though every step moves the whole mass: the huge body rocks forward and back about its base and rises at the passing poses. It is one colossal creature: keep its size, outline, colours, markings and every limb or tentacle exactly as in the reference.
1. STEP: the body tilts forward and sinks 2 pixels, its weight on the leading side; the arms or tentacles swing forward and down; the trailing edge lags behind.
2. PASSING: the body upright and 2 pixels higher; the weight in the middle; the arms or tentacles hanging near it.
3. STEP ON THE OTHER SIDE: the body tilts forward and sinks 2 pixels on the other side, the arms or tentacles swung the other way: the mirror of cell 1, NOT a copy.
4. PASSING: upright and 2 pixels higher again, the arms or tentacles hanging the other way to cell 2.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 103. Azathoth  (`103_azathoth`)

Attach `103_azathoth_front.png` and `103_azathoth_side.png`. Save the result as `103_azathoth.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Azathoth, as shown in the attached reference image: a low, dark-purple, churning mass with star-like sparks around it. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 128x128 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs: it crawls by flowing. The mass keeps about the same size in every cell, with one flat base on the ground line; it heaves forward in surges. Any eyes, horns, tentacles or orbs keep their colours and sizes; nothing new grows.
1. STRETCH: the front of the mass reaches forward, low and long; the rear gathers; the highest point sits toward the rear.
2. GATHER: the rear pulls up toward the middle: the whole mass shortens and rises about 2 pixels; the surface features have moved forward.
3. SECOND SURGE: a different lobe or tentacle reaches forward (not the same shape as cell 1); the highest point sits toward the front.
4. GATHER AGAIN: the mass bunches and rises, the surface features moved forward again; the next step brings it back to cell 1, so the four cells loop.

The sparks drift along with it.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 104. Yog-Sothoth  (`104_yog_sothoth`)

Attach `104_yog_sothoth_front.png` and `104_yog_sothoth_side.png`. Save the result as `104_yog_sothoth.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Yog-Sothoth, as shown in the attached reference image: a cluster of glowing teal, white and black spheres with coloured sparks. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 128x128 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs: it crawls by flowing. The mass keeps about the same size in every cell, with one flat base on the ground line; it heaves forward in surges. Any eyes, horns, tentacles or orbs keep their colours and sizes; nothing new grows.
1. STRETCH: the front of the mass reaches forward, low and long; the rear gathers; the highest point sits toward the rear.
2. GATHER: the rear pulls up toward the middle: the whole mass shortens and rises about 2 pixels; the surface features have moved forward.
3. SECOND SURGE: a different lobe or tentacle reaches forward (not the same shape as cell 1); the highest point sits toward the front.
4. GATHER AGAIN: the mass bunches and rises, the surface features moved forward again; the next step brings it back to cell 1, so the four cells loop.

The spheres roll over one another; the sparks drift along with it.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```

### 105. Shub-Niggurath  (`105_shub_niggurath`)

Attach `105_shub_niggurath_front.png` and `105_shub_niggurath_side.png`. Save the result as `105_shub_niggurath.png`.

```text
Make ONE square image (1:1) of a pixel-art movement-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: Shub-Niggurath, as shown in the attached reference image: a low, dark-purple mass with stubby tendril legs and coloured sparks. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing LEFT (its face toward the left edge of each cell). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a 128x128 sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE movement cycle, read left to right, top to bottom.
No legs: it crawls by flowing. The mass keeps about the same size in every cell, with one flat base on the ground line; it heaves forward in surges. Any eyes, horns, tentacles or orbs keep their colours and sizes; nothing new grows.
1. STRETCH: the front of the mass reaches forward, low and long; the rear gathers; the highest point sits toward the rear.
2. GATHER: the rear pulls up toward the middle: the whole mass shortens and rises about 2 pixels; the surface features have moved forward.
3. SECOND SURGE: a different lobe or tentacle reaches forward (not the same shape as cell 1); the highest point sits toward the front.
4. GATHER AGAIN: the mass bunches and rises, the surface features moved forward again; the next step brings it back to cell 1, so the four cells loop.

The tendril legs pull it along in turns; the sparks drift along with it.

The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.
```


## After the sheets
Name them as above (`001_dagon_priest.png`, ...) and put them in one folder. I run, per sheet,
`python3 tools/sprites/fromsheet.py <sheet> <pack> <key> left`, then the review, and look at every walk.
What fails the review goes back to you as a short list with the reason. (The colossi are 128x128; the tool
takes the frame size from the idle.)

