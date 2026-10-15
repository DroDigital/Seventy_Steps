# Walk batches for ChatGPT

174 sheets in 19 batches of up to 10: every two- and four-legged creature, front, back and left (and right for the one-sided), from the original (v1) frames. The project instructions go into the ChatGPT project once; each batch is one message with its references attached. Made by `tools/sprites/batches.py`.

## Project instructions

```text
You make pixel-art WALK CYCLE sprite sheets for a game: one sheet per job. When a message lists several jobs, make every one of them, each as its own separate image, in the order listed.

INPUT: each job has one attached reference: a 64x64 pixel-art sprite enlarged to 1024x1024 (every pixel a 16x16 block) on a transparent background, showing the creature standing still in the job's view (FRONT, BACK, LEFT or RIGHT).

OUTPUT: one square image per job, 1024x1024: a 2x2 grid of four equal 512x512 cells on a transparent background. Nothing else: no borders, grid lines, text, numbers, labels, ground line, shadows or glow.

SAME CREATURE, SAME VIEW: each cell is the reference picture shrunk to exactly half size (512x512) with only the walking parts moved. The creature keeps the reference's place and size in the cell, its feet on the same row. Same face, design, proportions, colours and outline: never redesign it, never change its colours, never turn it to another view, never flip it.

PIXELS: every pixel of the 64x64 sprite is one crisp 8x8 block in its cell, the same block size in all four cells. Only the reference's colours. Hard edges, no anti-aliasing, no blur, no smoothing, no new detail.

A REAL WALK, NOT A STILL. Measured in the sprite's own 64x64 pixels: steps reach 4 to 8 px from the body's centre; hands swing 4 to 7 px; the body rises 1 to 2 px at the passing poses. The four cells loop, read left to right, top to bottom.

SIDE VIEW (LEFT or RIGHT; it faces the way the reference faces):
1. Contact: the near leg (lighter) forward with the heel down, the far leg (darker, behind) back with the toe down; the far arm forward, the near arm back.
2. Passing: the near leg straight under the body; the far leg bent and swinging forward past it, foot lifted; body 1 to 2 px higher; arms by the hips.
3. Contact on the other leg: the far leg forward, the near leg back; the arms swapped. The mirror of cell 1, NOT a copy.
4. Passing: the far leg straight; the near leg bent and swinging past; body higher; arms by the hips.

FRONT VIEW (facing the viewer):
1. Contact: the creature's right leg (on the viewer's left) steps toward the viewer: its foot 1 to 2 px lower and a little wider, the knee slightly bent; the other foot behind, 2 to 3 px higher, heel lifted. The body shifts 1 px over the stepping leg. The arm on the other side swings forward (its hand 2 to 3 px lower), the arm on the stepping side swings back (its hand shorter, partly behind the hip).
2. Passing: the right leg straight, carrying the weight; the left foot lifted 2 to 3 px with the knee bent, passing beside it; body 1 to 2 px higher; arms by the hips.
3. Contact on the other leg: the creature's left leg steps toward the viewer, the right one behind; the arms swapped. The legs and arms mirror cell 1; the face, the light and the markings do NOT flip.
4. Passing: the left leg straight; the right foot lifted and passing; body higher.

BACK VIEW (seen from behind): as the front view, but the stepping foot goes away from the viewer: at contact the leading foot sits 2 to 3 px higher (further off) and the trailing foot nearer and lower, its heel lifted and sole showing. The arms swing the same way.

BODY TYPES (each job names one):
- two legs: as above.
- hunched, two legs: knees bent, heavy steps, the long arms swing low; the body leans the same amount in every cell.
- robed: the robe hides the legs, so each step shows in the hem and the foot tips. At contact the stepping foot shows under the hem and pushes it out (front and back: the hem's lower edge tilts 3 to 4 px toward the stepping side; side: pushed forward over the shin and trailing back behind). At passing the hem swings back the other way and the folds bunch at the knee. The sleeves swing with the arms.
- four legs: diagonal pairs. Cell 1: the near front leg and the far hind leg reach forward (front and back views: the creature's right foreleg and its left hind leg step). Cell 2: the legs gather under the body, 1 px higher. Cell 3: the other pair. Cell 4: gathered again. The head bobs 1 px.
- four legs, toad-like: a squat crawl, the short legs in diagonal pairs, the body low and rocking 1 px (side to side in front and back views, forward and back in side views).
- penguin: a waddle: the whole body tilts 2 px toward the stepping foot, the feet alternate, the flippers swing out.

CLOTH, HAIR AND LOOSE PARTS follow through, a beat behind the body: hems, coat tails, sleeves, capes, stoles, tatters, hair, tentacles and tails swing and trail, with a different outline in every cell. Heavy cloth swings less, but always moves.

CHECK EACH SHEET before answering: lay cell 1 over cell 3, and the legs, the arms and the hem are clearly in different places; cells 2 and 4 lift different feet; no two cells are the same picture; every cell matches the reference's size, colours and view.
```

## B01

```text
Batch B01: make these 9 jobs as 9 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B01-01: Esoteric Order of Dagon Priest, FRONT view, robed: a tall figure in a heavy grey-brown robe with a long dark stole down the front and a tall pointed, fish-like hood; the hands hang at the sides.
2. B01-02: Esoteric Order of Dagon Priest, BACK view, robed: a tall figure in a heavy grey-brown robe with a long dark stole down the front and a tall pointed, fish-like hood; the hands hang at the sides.
3. B01-03: Esoteric Order of Dagon Priest, LEFT view (facing left), robed: a tall figure in a heavy grey-brown robe with a long dark stole down the front and a tall pointed, fish-like hood; the hands hang at the sides.
4. B01-04: Esoteric Order of Dagon Priest, eldritch form, FRONT view, robed: the same tall grey-brown robed priest with a dark stole and a pointed hood, now with glowing violet eyes and a violet glow on its head.
5. B01-05: Esoteric Order of Dagon Priest, eldritch form, BACK view, robed: the same tall grey-brown robed priest with a dark stole and a pointed hood, now with glowing violet eyes and a violet glow on its head.
6. B01-06: Esoteric Order of Dagon Priest, eldritch form, LEFT view (facing left), robed: the same tall grey-brown robed priest with a dark stole and a pointed hood, now with glowing violet eyes and a violet glow on its head.
7. B01-07: Cthulhu Cultist, FRONT view, robed: a figure in a plain black hooded robe that falls to the ground, the face in shadow, the hands hidden in the sleeves.
8. B01-08: Cthulhu Cultist, BACK view, robed: a figure in a plain black hooded robe that falls to the ground, the face in shadow, the hands hidden in the sleeves.
9. B01-09: Cthulhu Cultist, LEFT view (facing left), robed: a figure in a plain black hooded robe that falls to the ground, the face in shadow, the hands hidden in the sleeves.
```

## B02

```text
Batch B02: make these 9 jobs as 9 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B02-01: The Black Man, FRONT view, robed: a tall, thin figure in a black cloak and hood with two glowing violet eyes.
2. B02-02: The Black Man, BACK view, robed: a tall, thin figure in a black cloak and hood with two glowing violet eyes.
3. B02-03: The Black Man, LEFT view (facing left), robed: a tall, thin figure in a black cloak and hood with two glowing violet eyes.
4. B02-04: Edward Hutchinson, FRONT view, robed: a figure in a long black hooded cloak with the face hidden.
5. B02-05: Edward Hutchinson, BACK view, robed: a figure in a long black hooded cloak with the face hidden.
6. B02-06: Edward Hutchinson, LEFT view (facing left), robed: a figure in a long black hooded cloak with the face hidden.
7. B02-07: Charles le Sorcier, FRONT view, robed: a figure in a long black hooded robe with glowing red eyes in the dark hood.
8. B02-08: Charles le Sorcier, BACK view, robed: a figure in a long black hooded robe with glowing red eyes in the dark hood.
9. B02-09: Charles le Sorcier, LEFT view (facing left), robed: a figure in a long black hooded robe with glowing red eyes in the dark hood.
```

## B03

```text
Batch B03: make these 10 jobs as 10 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B03-01: Keziah Mason, FRONT view, robed: a hunched old witch with grey hair in a long, tattered dark-brown robe, one hand held out in front. Keep whatever she holds exactly as in the reference. She walks hunched, with short steps.
2. B03-02: Keziah Mason, BACK view, robed: a hunched old witch with grey hair in a long, tattered dark-brown robe, one hand held out in front. Keep whatever she holds exactly as in the reference. She walks hunched, with short steps.
3. B03-03: Keziah Mason, LEFT view (facing left), robed: a hunched old witch with grey hair in a long, tattered dark-brown robe, one hand held out in front. Keep whatever she holds exactly as in the reference. She walks hunched, with short steps.
4. B03-04: Keziah Mason, RIGHT view (facing right), robed: a hunched old witch with grey hair in a long, tattered dark-brown robe, one hand held out in front. Keep whatever she holds exactly as in the reference. She walks hunched, with short steps.
5. B03-05: K'n-yan Dweller, FRONT view, robed: a figure in a long dark coat-robe with gold trim at the collar and hem and black hair, standing upright.
6. B03-06: K'n-yan Dweller, BACK view, robed: a figure in a long dark coat-robe with gold trim at the collar and hem and black hair, standing upright.
7. B03-07: K'n-yan Dweller, LEFT view (facing left), robed: a figure in a long dark coat-robe with gold trim at the collar and hem and black hair, standing upright.
8. B03-08: The Terrible Old Man, FRONT view, two legs: an old white-haired man in a beige-grey coat and trousers, standing upright.
9. B03-09: The Terrible Old Man, BACK view, two legs: an old white-haired man in a beige-grey coat and trousers, standing upright.
10. B03-10: The Terrible Old Man, LEFT view (facing left), two legs: an old white-haired man in a beige-grey coat and trousers, standing upright.
```

## B04

```text
Batch B04: make these 10 jobs as 10 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B04-01: Nyarlathotep, FRONT view, two legs: a slender man in a tan suit with a blank pale bald face and glowing violet eyes.
2. B04-02: Nyarlathotep, BACK view, two legs: a slender man in a tan suit with a blank pale bald face and glowing violet eyes.
3. B04-03: Nyarlathotep, LEFT view (facing left), two legs: a slender man in a tan suit with a blank pale bald face and glowing violet eyes.
4. B04-04: Simon Orne, FRONT view, two legs: a pale, white-faced bald man in a black coat and black trousers.
5. B04-05: Simon Orne, BACK view, two legs: a pale, white-faced bald man in a black coat and black trousers.
6. B04-06: Simon Orne, LEFT view (facing left), two legs: a pale, white-faced bald man in a black coat and black trousers.
7. B04-07: The Outsider, FRONT view, two legs: a ragged, decayed green-black humanoid in tattered clothes with pale bone showing in patches. Keep the torn clothes and the pale patches as they are. A stiff, shambling walk, the arms hanging loose.
8. B04-08: The Outsider, BACK view, two legs: a ragged, decayed green-black humanoid in tattered clothes with pale bone showing in patches. Keep the torn clothes and the pale patches as they are. A stiff, shambling walk, the arms hanging loose.
9. B04-09: The Outsider, LEFT view (facing left), two legs: a ragged, decayed green-black humanoid in tattered clothes with pale bone showing in patches. Keep the torn clothes and the pale patches as they are. A stiff, shambling walk, the arms hanging loose.
10. B04-10: The Outsider, RIGHT view (facing right), two legs: a ragged, decayed green-black humanoid in tattered clothes with pale bone showing in patches. Keep the torn clothes and the pale patches as they are. A stiff, shambling walk, the arms hanging loose.
```

## B05

```text
Batch B05: make these 9 jobs as 9 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B05-01: Serpent Man of Valusia, FRONT view, two legs: a slender olive-green, serpent-headed humanoid in a dark loincloth, with thin limbs and clawed feet.
2. B05-02: Serpent Man of Valusia, BACK view, two legs: a slender olive-green, serpent-headed humanoid in a dark loincloth, with thin limbs and clawed feet.
3. B05-03: Serpent Man of Valusia, LEFT view (facing left), two legs: a slender olive-green, serpent-headed humanoid in a dark loincloth, with thin limbs and clawed feet.
4. B05-04: Hybrid Mummy, FRONT view, two legs: a mummy in brown-striped bandages with a dark crocodile-like head. Keep it facing straight at the viewer in every cell.
5. B05-05: Hybrid Mummy, BACK view, two legs: a mummy in brown-striped bandages with a dark crocodile-like head. Keep it facing straight away from the viewer in every cell.
6. B05-06: Hybrid Mummy, LEFT view (facing left), two legs: a mummy in brown-striped bandages with a dark crocodile-like head. Keep it strictly in profile in all four cells: never turned toward the viewer, no three-quarter view, no raised knee facing the viewer.
7. B05-07: Venusian Man-Lizard, FRONT view, two legs: an upright green lizard-man with a flat hammer-shaped head and a bundle of tentacles hanging over its chest. Keep the two legs clearly told apart: the far leg a darker green, with a visible gap between the legs in the contact poses (1 and 3).
8. B05-08: Venusian Man-Lizard, BACK view, two legs: an upright green lizard-man with a flat hammer-shaped head and a bundle of tentacles hanging over its chest. Keep the two legs clearly told apart: the far leg a darker green, with a visible gap between the legs in the contact poses (1 and 3).
9. B05-09: Venusian Man-Lizard, LEFT view (facing left), two legs: an upright green lizard-man with a flat hammer-shaped head and a bundle of tentacles hanging over its chest. Keep the two legs clearly told apart: the far leg a darker green, with a visible gap between the legs in the contact poses (1 and 3).
```

## B06

```text
Batch B06: make these 10 jobs as 10 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B06-01: Man of Leng, FRONT view, two legs: a short, stocky figure in a rust-red hooded tunic with a grey, horned, animal-like face and bare grey legs.
2. B06-02: Man of Leng, BACK view, two legs: a short, stocky figure in a rust-red hooded tunic with a grey, horned, animal-like face and bare grey legs.
3. B06-03: Man of Leng, LEFT view (facing left), two legs: a short, stocky figure in a rust-red hooded tunic with a grey, horned, animal-like face and bare grey legs.
4. B06-04: Ephraim Waite, eldritch form, FRONT view, two legs: a stooped, green-skinned corpse-like man in a dark green suit with a bald head and long arms.
5. B06-05: Ephraim Waite, eldritch form, BACK view, two legs: a stooped, green-skinned corpse-like man in a dark green suit with a bald head and long arms.
6. B06-06: Ephraim Waite, eldritch form, LEFT view (facing left), two legs: a stooped, green-skinned corpse-like man in a dark green suit with a bald head and long arms.
7. B06-07: Innsmouth Hybrid, FRONT view, two legs: a gaunt, pale-green humanoid in a long olive coat, trousers and boots, with a flat fish-like face, standing upright.
8. B06-08: Innsmouth Hybrid, BACK view, two legs: a gaunt, pale-green humanoid in a long olive coat, trousers and boots, with a flat fish-like face, standing upright.
9. B06-09: Innsmouth Hybrid, LEFT view (facing left), two legs: a gaunt, pale-green humanoid in a long olive coat, trousers and boots, with a flat fish-like face, standing upright.
10. B06-10: Innsmouth Hybrid, RIGHT view (facing right), two legs: a gaunt, pale-green humanoid in a long olive coat, trousers and boots, with a flat fish-like face, standing upright.
```

## B07

```text
Batch B07: make these 10 jobs as 10 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B07-01: Innsmouth Hybrid, eldritch form, FRONT view, two legs: a stooped, grey-blue-skinned humanoid in a long open dark coat, trousers and boots, with a flat fish-like face.
2. B07-02: Innsmouth Hybrid, eldritch form, BACK view, two legs: a stooped, grey-blue-skinned humanoid in a long open dark coat, trousers and boots, with a flat fish-like face.
3. B07-03: Innsmouth Hybrid, eldritch form, LEFT view (facing left), two legs: a stooped, grey-blue-skinned humanoid in a long open dark coat, trousers and boots, with a flat fish-like face.
4. B07-04: Innsmouth Hybrid, eldritch form, RIGHT view (facing right), two legs: a stooped, grey-blue-skinned humanoid in a long open dark coat, trousers and boots, with a flat fish-like face.
5. B07-05: Reanimated Corpse, FRONT view, two legs: a pale grey-skinned man in a plain grey shirt and dark trousers, barefoot, the arms hanging. A stiff, slightly dragging shamble.
6. B07-06: Reanimated Corpse, BACK view, two legs: a pale grey-skinned man in a plain grey shirt and dark trousers, barefoot, the arms hanging. A stiff, slightly dragging shamble.
7. B07-07: Reanimated Corpse, LEFT view (facing left), two legs: a pale grey-skinned man in a plain grey shirt and dark trousers, barefoot, the arms hanging. A stiff, slightly dragging shamble.
8. B07-08: Wilbur Whateley, FRONT view, two legs: a tall figure in a long red-brown coat with a goat-like head, thin legs and writhing tentacles on his torso. Keep the torso tentacles; they sway a little.
9. B07-09: Wilbur Whateley, BACK view, two legs: a tall figure in a long red-brown coat with a goat-like head, thin legs and writhing tentacles on his torso. Keep the torso tentacles; they sway a little.
10. B07-10: Wilbur Whateley, LEFT view (facing left), two legs: a tall figure in a long red-brown coat with a goat-like head, thin legs and writhing tentacles on his torso. Keep the torso tentacles; they sway a little.
```

## B08

```text
Batch B08: make these 9 jobs as 9 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B08-01: Ephraim Waite, FRONT view, two legs: a stern grey-green man in a long jacket and trousers, standing upright.
2. B08-02: Ephraim Waite, BACK view, two legs: a stern grey-green man in a long jacket and trousers, standing upright.
3. B08-03: Ephraim Waite, LEFT view (facing left), two legs: a stern grey-green man in a long jacket and trousers, standing upright.
4. B08-04: Lilith, FRONT view, two legs: a very thin, pale, bald, nude-looking humanoid with red eyes.
5. B08-05: Lilith, BACK view, two legs: a very thin, pale, bald, nude-looking humanoid with red eyes.
6. B08-06: Lilith, LEFT view (facing left), two legs: a very thin, pale, bald, nude-looking humanoid with red eyes.
7. B08-07: Dr. Muñoz, FRONT view, two legs: a grey-haired, bearded man in a grey three-piece suit.
8. B08-08: Dr. Muñoz, BACK view, two legs: a grey-haired, bearded man in a grey three-piece suit.
9. B08-09: Dr. Muñoz, LEFT view (facing left), two legs: a grey-haired, bearded man in a grey three-piece suit.
```

## B09

```text
Batch B09: make these 9 jobs as 9 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B09-01: The Gorgon of Medusa's Coil, FRONT view, two legs: a figure in dark clothes and boots with snake-like tentacle hair and white glowing eyes.
2. B09-02: The Gorgon of Medusa's Coil, BACK view, two legs: a figure in dark clothes and boots with snake-like tentacle hair and white glowing eyes.
3. B09-03: The Gorgon of Medusa's Coil, LEFT view (facing left), two legs: a figure in dark clothes and boots with snake-like tentacle hair and white glowing eyes.
4. B09-04: Hypnos, FRONT view, two legs: a bearded man in a tan jacket and trousers with violet eyes.
5. B09-05: Hypnos, BACK view, two legs: a bearded man in a tan jacket and trousers with violet eyes.
6. B09-06: Hypnos, LEFT view (facing left), two legs: a bearded man in a tan jacket and trousers with violet eyes.
7. B09-07: The Great Ones, FRONT view, two legs: a grey stone giant of cracked plates with thick limbs and glowing yellow eyes. Heavy and stiff: a stomping walk on thick legs.
8. B09-08: The Great Ones, BACK view, two legs: a grey stone giant of cracked plates with thick limbs and glowing yellow eyes. Heavy and stiff: a stomping walk on thick legs.
9. B09-09: The Great Ones, LEFT view (facing left), two legs: a grey stone giant of cracked plates with thick limbs and glowing yellow eyes. Heavy and stiff: a stomping walk on thick legs.
```

## B10

```text
Batch B10: make these 10 jobs as 10 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B10-01: Joseph Curwen, FRONT view, two legs: a gentleman in an olive colonial coat, knee breeches, stockings and buckled shoes, with a white wig.
2. B10-02: Joseph Curwen, BACK view, two legs: a gentleman in an olive colonial coat, knee breeches, stockings and buckled shoes, with a white wig.
3. B10-03: Joseph Curwen, LEFT view (facing left), two legs: a gentleman in an olive colonial coat, knee breeches, stockings and buckled shoes, with a white wig.
4. B10-04: Joseph Curwen, RIGHT view (facing right), two legs: a gentleman in an olive colonial coat, knee breeches, stockings and buckled shoes, with a white wig.
5. B10-05: Ghoul, eldritch form, FRONT view, hunched, two legs: a hulking, hunched olive-green ghoul with long arms, clawed hands, a hooked dog-like snout and three glowing green eyes.
6. B10-06: Ghoul, eldritch form, BACK view, hunched, two legs: a hulking, hunched olive-green ghoul with long arms, clawed hands, a hooked dog-like snout and three glowing green eyes.
7. B10-07: Ghoul, eldritch form, LEFT view (facing left), hunched, two legs: a hulking, hunched olive-green ghoul with long arms, clawed hands, a hooked dog-like snout and three glowing green eyes.
8. B10-08: Ym-bhi, FRONT view, hunched, two legs: a pale grey, smooth, stone-like hulking giant with huge arms hanging low, a hunched back and a small head.
9. B10-09: Ym-bhi, BACK view, hunched, two legs: a pale grey, smooth, stone-like hulking giant with huge arms hanging low, a hunched back and a small head.
10. B10-10: Ym-bhi, LEFT view (facing left), hunched, two legs: a pale grey, smooth, stone-like hulking giant with huge arms hanging low, a hunched back and a small head.
```

## B11

```text
Batch B11: make these 10 jobs as 10 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B11-01: Martense Degenerate, FRONT view, hunched, two legs: a hulking, shaggy black ape-like creature with dim amber eyes and long arms.
2. B11-02: Martense Degenerate, BACK view, hunched, two legs: a hulking, shaggy black ape-like creature with dim amber eyes and long arms.
3. B11-03: Martense Degenerate, LEFT view (facing left), hunched, two legs: a hulking, shaggy black ape-like creature with dim amber eyes and long arms.
4. B11-04: Martense Degenerate, RIGHT view (facing right), hunched, two legs: a hulking, shaggy black ape-like creature with dim amber eyes and long arms.
5. B11-05: Gnoph-keh, FRONT view, hunched, two legs: a hulking black fur-covered ape-beast with arms reaching to the ground and glowing white eyes.
6. B11-06: Gnoph-keh, BACK view, hunched, two legs: a hulking black fur-covered ape-beast with arms reaching to the ground and glowing white eyes.
7. B11-07: Gnoph-keh, LEFT view (facing left), hunched, two legs: a hulking black fur-covered ape-beast with arms reaching to the ground and glowing white eyes.
8. B11-08: Gug, FRONT view, hunched, two legs: a huge, hunched black giant with ochre spots on its body and pink-tipped claws. Keep the ochre spots and the pink claw tips.
9. B11-09: Gug, BACK view, hunched, two legs: a huge, hunched black giant with ochre spots on its body and pink-tipped claws. Keep the ochre spots and the pink claw tips.
10. B11-10: Gug, LEFT view (facing left), hunched, two legs: a huge, hunched black giant with ochre spots on its body and pink-tipped claws. Keep the ochre spots and the pink claw tips.
```

## B12

```text
Batch B12: make these 9 jobs as 9 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B12-01: Zkauba the Wizard, FRONT view, hunched, two legs: a hulking grey stone golem of cracked plates with violet eyes, a ribbed chest and huge arms that hang to the ground.
2. B12-02: Zkauba the Wizard, BACK view, hunched, two legs: a hulking grey stone golem of cracked plates with violet eyes, a ribbed chest and huge arms that hang to the ground.
3. B12-03: Zkauba the Wizard, LEFT view (facing left), hunched, two legs: a hulking grey stone golem of cracked plates with violet eyes, a ribbed chest and huge arms that hang to the ground.
4. B12-04: Exham Priory Troglodyte, FRONT view, hunched, two legs: a gaunt, hunched, bone-pale humanoid with long limbs, a ragged loincloth, a bald head and sunken eyes.
5. B12-05: Exham Priory Troglodyte, BACK view, hunched, two legs: a gaunt, hunched, bone-pale humanoid with long limbs, a ragged loincloth, a bald head and sunken eyes.
6. B12-06: Exham Priory Troglodyte, LEFT view (facing left), hunched, two legs: a gaunt, hunched, bone-pale humanoid with long limbs, a ragged loincloth, a bald head and sunken eyes.
7. B12-07: Gnorri, FRONT view, hunched, two legs: a hulking, hunched teal-grey creature with a mass of tentacles over its face, a row of fin-like spines down its back and long arms. Keep the face tentacles and the back spines; the tentacles sway a little.
8. B12-08: Gnorri, BACK view, hunched, two legs: a hulking, hunched teal-grey creature with a mass of tentacles over its face, a row of fin-like spines down its back and long arms. Keep the face tentacles and the back spines; the tentacles sway a little.
9. B12-09: Gnorri, LEFT view (facing left), hunched, two legs: a hulking, hunched teal-grey creature with a mass of tentacles over its face, a row of fin-like spines down its back and long arms. Keep the face tentacles and the back spines; the tentacles sway a little.
```

## B13

```text
Batch B13: make these 9 jobs as 9 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B13-01: Ghoul, FRONT view, hunched, two legs: a hunched olive-brown, dog-faced ghoul with long arms, clawed hands and glowing pale eyes.
2. B13-02: Ghoul, BACK view, hunched, two legs: a hunched olive-brown, dog-faced ghoul with long arms, clawed hands and glowing pale eyes.
3. B13-03: Ghoul, LEFT view (facing left), hunched, two legs: a hunched olive-brown, dog-faced ghoul with long arms, clawed hands and glowing pale eyes.
4. B13-04: Star-spawn of Cthulhu, FRONT view, hunched, two legs: a hulking pale-green brute with an octopus-like face of tentacles, thick limbs, big claws and small wings folded behind.
5. B13-05: Star-spawn of Cthulhu, BACK view, hunched, two legs: a hulking pale-green brute with an octopus-like face of tentacles, thick limbs, big claws and small wings folded behind.
6. B13-06: Star-spawn of Cthulhu, LEFT view (facing left), hunched, two legs: a hulking pale-green brute with an octopus-like face of tentacles, thick limbs, big claws and small wings folded behind.
7. B13-07: Deep One, FRONT view, hunched, two legs: a hunched, bulging-eyed grey-green frog-fish humanoid with webbed hands and feet, a fin ridge down its back and a pale belly. Keep it upright as in the reference, not a crouched lope.
8. B13-08: Deep One, BACK view, hunched, two legs: a hunched, bulging-eyed grey-green frog-fish humanoid with webbed hands and feet, a fin ridge down its back and a pale belly. Keep it upright as in the reference, not a crouched lope.
9. B13-09: Deep One, LEFT view (facing left), hunched, two legs: a hunched, bulging-eyed grey-green frog-fish humanoid with webbed hands and feet, a fin ridge down its back and a pale belly. Keep it upright as in the reference, not a crouched lope.
```

## B14

```text
Batch B14: make these 9 jobs as 9 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B14-01: Deep One, eldritch form, FRONT view, hunched, two legs: the same hunched grey-green frog-fish humanoid, now with a glowing green eye and green glow. Keep it upright as in the reference, not a crouched lope.
2. B14-02: Deep One, eldritch form, BACK view, hunched, two legs: the same hunched grey-green frog-fish humanoid, now with a glowing green eye and green glow. Keep it upright as in the reference, not a crouched lope.
3. B14-03: Deep One, eldritch form, LEFT view (facing left), hunched, two legs: the same hunched grey-green frog-fish humanoid, now with a glowing green eye and green glow. Keep it upright as in the reference, not a crouched lope.
4. B14-04: Ghast, FRONT view, four legs: a long, pale cream beast with brown stripes and dark hooves, four long legs and no clear face.
5. B14-05: Ghast, BACK view, four legs: a long, pale cream beast with brown stripes and dark hooves, four long legs and no clear face.
6. B14-06: Ghast, LEFT view (facing left), four legs: a long, pale cream beast with brown stripes and dark hooves, four long legs and no clear face.
7. B14-07: Cat from Saturn, FRONT view, four legs: a sleek black panther-like cat with a tall curled tail and faint violet markings. The tail sways a little.
8. B14-08: Cat from Saturn, BACK view, four legs: a sleek black panther-like cat with a tall curled tail and faint violet markings. The tail sways a little.
9. B14-09: Cat from Saturn, LEFT view (facing left), four legs: a sleek black panther-like cat with a tall curled tail and faint violet markings. The tail sways a little.
```

## B15

```text
Batch B15: make these 9 jobs as 9 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B15-01: Gyaa-yothn, FRONT view, four legs: a huge white four-legged bear-like beast with a black domed shell over its back and a flat white face.
2. B15-02: Gyaa-yothn, BACK view, four legs: a huge white four-legged bear-like beast with a black domed shell over its back and a flat white face.
3. B15-03: Gyaa-yothn, LEFT view (facing left), four legs: a huge white four-legged bear-like beast with a black domed shell over its back and a flat white face.
4. B15-04: Bokrug, FRONT view, four legs: a teal-grey, hound-like lizard with a skeletal ribcage, spines along its back, a long tail and four legs.
5. B15-05: Bokrug, BACK view, four legs: a teal-grey, hound-like lizard with a skeletal ribcage, spines along its back, a long tail and four legs.
6. B15-06: Bokrug, LEFT view (facing left), four legs: a teal-grey, hound-like lizard with a skeletal ribcage, spines along its back, a long tail and four legs.
7. B15-07: The Hound, FRONT view, four legs: a skeletal bone-grey winged dog with a visible ribcage, bat wings, glowing green eyes and a long tail. The wings stay folded and held high on its back (they may lift 1 pixel at the passing poses). It walks on the ground at the same height as the reference.
8. B15-08: The Hound, BACK view, four legs: a skeletal bone-grey winged dog with a visible ribcage, bat wings, glowing green eyes and a long tail. The wings stay folded and held high on its back (they may lift 1 pixel at the passing poses). It walks on the ground at the same height as the reference.
9. B15-09: The Hound, LEFT view (facing left), four legs: a skeletal bone-grey winged dog with a visible ribcage, bat wings, glowing green eyes and a long tail. The wings stay folded and held high on its back (they may lift 1 pixel at the passing poses). It walks on the ground at the same height as the reference.
```

## B16

```text
Batch B16: make these 9 jobs as 9 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B16-01: Shantak, FRONT view, four legs: a grey-black beast with a horse-like head and neck, a feathered body, large wings and bird claws. It walks on the ground with its wings folded against its sides, at the same height as the reference standing pose in every cell: no crouch, no raised wings.
2. B16-02: Shantak, BACK view, four legs: a grey-black beast with a horse-like head and neck, a feathered body, large wings and bird claws. It walks on the ground with its wings folded against its sides, at the same height as the reference standing pose in every cell: no crouch, no raised wings.
3. B16-03: Shantak, LEFT view (facing left), four legs: a grey-black beast with a horse-like head and neck, a feathered body, large wings and bird claws. It walks on the ground with its wings folded against its sides, at the same height as the reference standing pose in every cell: no crouch, no raised wings.
4. B16-04: Brown Jenkin, FRONT view, four legs: a brown-furred rat with a bearded human face, a long thin tail and four small clawed legs. The tail trails behind and sways a little.
5. B16-05: Brown Jenkin, BACK view, four legs: a brown-furred rat with a bearded human face, a long thin tail and four small clawed legs. The tail trails behind and sways a little.
6. B16-06: Brown Jenkin, LEFT view (facing left), four legs: a brown-furred rat with a bearded human face, a long thin tail and four small clawed legs. The tail trails behind and sways a little.
7. B16-07: The Beast in the Cave, FRONT view, four legs: a pale, white-haired, feral man-thing that crouches on all fours, in a ragged loincloth. It goes on all fours: the hands and the feet are its four legs.
8. B16-08: The Beast in the Cave, BACK view, four legs: a pale, white-haired, feral man-thing that crouches on all fours, in a ragged loincloth. It goes on all fours: the hands and the feet are its four legs.
9. B16-09: The Beast in the Cave, LEFT view (facing left), four legs: a pale, white-haired, feral man-thing that crouches on all fours, in a ragged loincloth. It goes on all fours: the hands and the feet are its four legs.
```

## B17

```text
Batch B17: make these 9 jobs as 9 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B17-01: Winged Hybrid, FRONT view, four legs: a small, black, bat-winged creature with a round body and dim eyes, crouched, its wings folded on its back. The wings stay folded on its back (they may lift 1 pixel at the passing poses). It walks in a low crouch at the same height as the reference.
2. B17-02: Winged Hybrid, BACK view, four legs: a small, black, bat-winged creature with a round body and dim eyes, crouched, its wings folded on its back. The wings stay folded on its back (they may lift 1 pixel at the passing poses). It walks in a low crouch at the same height as the reference.
3. B17-03: Winged Hybrid, LEFT view (facing left), four legs: a small, black, bat-winged creature with a round body and dim eyes, crouched, its wings folded on its back. The wings stay folded on its back (they may lift 1 pixel at the passing poses). It walks in a low crouch at the same height as the reference.
4. B17-04: Zoog, FRONT view, four legs, toad-like: a squat rust-brown, frog-like creature with a domed, ridged back, four bent legs and small pale eyes.
5. B17-05: Zoog, BACK view, four legs, toad-like: a squat rust-brown, frog-like creature with a domed, ridged back, four bent legs and small pale eyes.
6. B17-06: Zoog, LEFT view (facing left), four legs, toad-like: a squat rust-brown, frog-like creature with a domed, ridged back, four bent legs and small pale eyes.
7. B17-07: Moon-beast, FRONT view, four legs, toad-like: a huge, pale, toad-like mass with grey spots, short stubby legs and a cluster of pink tentacles on its face. Keep the pink tentacles on its face; they sway a little.
8. B17-08: Moon-beast, BACK view, four legs, toad-like: a huge, pale, toad-like mass with grey spots, short stubby legs and a cluster of pink tentacles on its face. Keep the pink tentacles on its face; they sway a little.
9. B17-09: Moon-beast, LEFT view (facing left), four legs, toad-like: a huge, pale, toad-like mass with grey spots, short stubby legs and a cluster of pink tentacles on its face. Keep the pink tentacles on its face; they sway a little.
```

## B18

```text
Batch B18: make these 9 jobs as 9 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B18-01: Being of Ib, FRONT view, four legs, toad-like: a squat green, toad-like creature with blotchy patterns, big purple-pink ears and lips, and four stubby webbed feet.
2. B18-02: Being of Ib, BACK view, four legs, toad-like: a squat green, toad-like creature with blotchy patterns, big purple-pink ears and lips, and four stubby webbed feet.
3. B18-03: Being of Ib, LEFT view (facing left), four legs, toad-like: a squat green, toad-like creature with blotchy patterns, big purple-pink ears and lips, and four stubby webbed feet.
4. B18-04: Nameless City Reptile, FRONT view, four legs, toad-like: a squat tan, toad-like reptile with a wide mouth, hunched on four legs.
5. B18-05: Nameless City Reptile, BACK view, four legs, toad-like: a squat tan, toad-like reptile with a wide mouth, hunched on four legs.
6. B18-06: Nameless City Reptile, LEFT view (facing left), four legs, toad-like: a squat tan, toad-like reptile with a wide mouth, hunched on four legs.
7. B18-07: Tsathoggua, FRONT view, four legs, toad-like: a bloated, black, toad-like god with a spotted back, pale round eyes with cross-shaped pupils and a wide flat mouth.
8. B18-08: Tsathoggua, BACK view, four legs, toad-like: a bloated, black, toad-like god with a spotted back, pale round eyes with cross-shaped pupils and a wide flat mouth.
9. B18-09: Tsathoggua, LEFT view (facing left), four legs, toad-like: a bloated, black, toad-like god with a spotted back, pale round eyes with cross-shaped pupils and a wide flat mouth.
```

## B19

```text
Batch B19: make these 6 jobs as 6 separate images, in this order, following the project instructions. The references are attached, named by job.
1. B19-01: Rhan-Tegoth, FRONT view, four legs, toad-like: a squat pale grey-beige, toad-like idol-creature covered in round bumps, with large eyes, a wide mouth and short stubby legs.
2. B19-02: Rhan-Tegoth, BACK view, four legs, toad-like: a squat pale grey-beige, toad-like idol-creature covered in round bumps, with large eyes, a wide mouth and short stubby legs.
3. B19-03: Rhan-Tegoth, LEFT view (facing left), four legs, toad-like: a squat pale grey-beige, toad-like idol-creature covered in round bumps, with large eyes, a wide mouth and short stubby legs.
4. B19-04: Blind Albino Penguin, FRONT view, penguin: a tall, blind, pale grey-white penguin with a smooth body and no eyes.
5. B19-05: Blind Albino Penguin, BACK view, penguin: a tall, blind, pale grey-white penguin with a smooth body and no eyes.
6. B19-06: Blind Albino Penguin, LEFT view (facing left), penguin: a tall, blind, pale grey-white penguin with a smooth body and no eyes.
```

## Bringing the sheets back
- The author saves each batch's images in order as `Bnn/01.png` … `Bnn/10.png`; `jobs.csv` (written with the
  references) names each one's creature and view: `fromsheet.py Bnn/kk.png <v1 pack> <key> <view>` (it keys a
  transparent or magenta ground), then `sprite_review.py audit` and a look at each walk beside its idle.
- The base is the author's unchanged backup, which is v1 (the published site): the walks drawn since
  (walk4, ElevenLabs v5 and v6) are set aside at the author's word, as unlike their references.
- v1's facing mistakes are mended in the references, not in the pack: the Innsmouth Hybrid's LEFT job shows
  v1's right idle and its RIGHT job v1's left (the sets are swapped in v1; `v1fixes.py` swaps the folders), and
  the Deep One's LEFT jobs (both forms) show v1's left idle mirrored. Their frames go to the side the job names,
  after the swap.
- Not in these batches: the many-legged (Wamp, Thousand Young, the Whisperer's eldritch form, Yekubian), the
  Night-gaunt (a flier), the legless and the colossi.
