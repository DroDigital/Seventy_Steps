# Sounds to make with Suno Sounds

The game plays well without these: each answers a sound the game makes already, from a recipe written in code
(`src/data/foleySounds.ts`, `src/data/doorSounds.ts`). A recording would give it the grain a synthesised sound lacks.
No search found a recording of any of them under a licence the game may use (the sound libraries it draws on are not
reachable from where this was written), so each is described here to be made with **Suno Sounds** (Create › Custom ›
Sounds (Beta); One Shot; 2 credits a take; a Pro or Premier plan). Suno's prompts read best as *sound, action, place,
perspective, length*, and each below is written so.

## How to put one in the game

1. Make 2 or 3 takes of each (the file names below), at the length asked, and trim silence off both ends.
2. Export each as **mono MP3**, 44.1 kHz, 96 kbps, named exactly as listed, into `public/audio/sfx/`.
3. Credit them in `public/audio/CREDITS.md` as rows of its *Made with Suno Sounds* table (the plan they were made on matters:
   Suno grants commercial use only to what a paid plan made; keep the date and plan in the row).
4. Run `python3 tools/audio_levels.py` (it measures every file; the game levels the takes of a set to one another by it).
5. `npm run check`. Nothing else is wired by hand: a set with its files present plays in front of the recipe it answers
   (the recipe stays beneath it, a third as loud), played to last as long as its motion where marked **fit**.

Until a set's files are there, the game does not ask for them.

## The sounds

### doorOakOpen
- **files:** `sfx/door_oak_open1.mp3`, `sfx/door_oak_open2.mp3`, `sfx/door_oak_open3.mp3`
- **length:** 0.7–1.1 s (**fit**: played to last exactly as long as the motion it sounds with, within a third either way, so make it close to this)
- **answers:** `door:oak:open`, `door:lacquer:open`, `door:bronze:open`
- **prompt:** Heavy old oak door creaking open slowly on dry iron hinges, the latch lifting first, a deep wooden groan, empty stone corridor, close perspective, 1 second duration, no music, no voices

### doorOakClose
- **files:** `sfx/door_oak_close1.mp3`, `sfx/door_oak_close2.mp3`, `sfx/door_oak_close3.mp3`
- **length:** 0.7–1.1 s (**fit**: played to last exactly as long as the motion it sounds with, within a third either way, so make it close to this)
- **answers:** `door:oak:close`, `door:lacquer:close`, `door:bronze:close`
- **prompt:** Heavy old oak door swinging shut and meeting its frame with a dull wooden thud, an iron latch dropping into its keeper, empty stone corridor, close perspective, 1 second duration, no music, no voices

### doorIronOpen
- **files:** `sfx/door_iron_open1.mp3`, `sfx/door_iron_open2.mp3`, `sfx/door_iron_open3.mp3`
- **length:** 0.5–0.8 s (**fit**: played to last exactly as long as the motion it sounds with, within a third either way, so make it close to this)
- **answers:** `door:iron:open`, `door:timber:open`
- **prompt:** Rusted iron grille gate dragged open, a bolt drawn back first, then one long shrieking squeal of dry hinges, damp crypt, close perspective, 0.7 second duration, no music, no voices

### doorIronClose
- **files:** `sfx/door_iron_close1.mp3`, `sfx/door_iron_close2.mp3`, `sfx/door_iron_close3.mp3`
- **length:** 0.8–1.4 s (**fit**: played to last exactly as long as the motion it sounds with, within a third either way, so make it close to this)
- **answers:** `door:iron:close`, `door:timber:close`
- **prompt:** Rusted iron gate slamming shut, one hard clang of metal that rings and fades, a short rattle of its bars, damp crypt, close perspective, 1.2 second duration, no music, no voices

### doorStoneOpen
- **files:** `sfx/door_stone_open1.mp3`, `sfx/door_stone_open2.mp3`, `sfx/door_stone_open3.mp3`
- **length:** 1.3–1.8 s (**fit**: played to last exactly as long as the motion it sounds with, within a third either way, so make it close to this)
- **answers:** `door:stone:open`, `door:grind:open`
- **prompt:** Massive stone slab sliding open across a stone floor, a deep grinding rumble with gritty texture, dust shaken loose, ancient tomb, close perspective, 1.5 second duration, no music, no voices

### doorStoneClose
- **files:** `sfx/door_stone_close1.mp3`, `sfx/door_stone_close2.mp3`, `sfx/door_stone_close3.mp3`
- **length:** 1.3–1.8 s (**fit**: played to last exactly as long as the motion it sounds with, within a third either way, so make it close to this)
- **answers:** `door:stone:close`, `door:grind:close`
- **prompt:** Massive stone slab settling shut, a long low grinding and then one very heavy impact into the floor, dust and grit falling after it, ancient tomb, close perspective, 1.5 second duration, no music, no voices

### doorFleshOpen
- **files:** `sfx/door_flesh_open1.mp3`, `sfx/door_flesh_open2.mp3`, `sfx/door_flesh_open3.mp3`
- **length:** 0.9–1.3 s (**fit**: played to last exactly as long as the motion it sounds with, within a third either way, so make it close to this)
- **answers:** `door:flesh:open`
- **prompt:** Wet fleshy membrane doors parting slowly, slick squelching and stretching, a deep slow pulse underneath, alien organic cavern, close perspective, 1.1 second duration, no music, no voices

### doorFleshClose
- **files:** `sfx/door_flesh_close1.mp3`, `sfx/door_flesh_close2.mp3`, `sfx/door_flesh_close3.mp3`
- **length:** 0.9–1.3 s (**fit**: played to last exactly as long as the motion it sounds with, within a third either way, so make it close to this)
- **answers:** `door:flesh:close`
- **prompt:** Wet fleshy valves closing together with a heavy slap and a squelch, a low pulse fading, alien organic cavern, close perspective, 1.1 second duration, no music, no voices

### doorCloth
- **files:** `sfx/door_cloth1.mp3`, `sfx/door_cloth2.mp3`
- **length:** 0.5–0.8 s (**fit**: played to last exactly as long as the motion it sounds with, within a third either way, so make it close to this)
- **answers:** `door:cloth:open`, `door:cloth:close`
- **prompt:** Heavy velvet curtain drawn aside along a rod, small rings sliding, soft fabric rustle, quiet candlelit room, close perspective, 0.6 second duration, no music, no voices

### swallow
- **files:** `sfx/swallow1.mp3`, `sfx/swallow2.mp3`, `sfx/swallow3.mp3`
- **length:** 0.4–0.7 s
- **answers:** `hands:swallow`, `act:gulp`
- **prompt:** A man swallowing a bitter draught, two throat gulps, then a glass bottle set down on stone, close perspective, 0.6 second duration, no music, no voices

### syringe
- **files:** `sfx/syringe1.mp3`, `sfx/syringe2.mp3`
- **length:** 0.3–0.5 s
- **answers:** `hands:plunger`
- **prompt:** The plunger of a hypodermic syringe pressed slowly, a thin hiss of liquid and a tiny click at the end, close perspective, 0.4 second duration, no music, no voices

### flaskBurst
- **files:** `sfx/flask_burst1.mp3`, `sfx/flask_burst2.mp3`, `sfx/flask_burst3.mp3`
- **length:** 1–1.6 s
- **answers:** `hands:burst`
- **prompt:** A glass flask of lamp oil shattering on stone, tinkling shards, a soft whump as the oil ignites, then crackling flames spreading, outdoors at night, medium perspective, 1.3 second duration, no music, no voices

### coins
- **files:** `sfx/coins1.mp3`, `sfx/coins2.mp3`, `sfx/coins3.mp3`
- **length:** 0.4–0.8 s
- **answers:** `hands:coins`
- **prompt:** A few old copper and silver coins counted one by one into an open palm, small metallic clinks, close perspective, 0.6 second duration, no music, no voices

### anvil
- **files:** `sfx/anvil1.mp3`, `sfx/anvil2.mp3`
- **length:** 1.2–1.6 s
- **answers:** `hands:anvil`
- **prompt:** Three hammer blows on an iron anvil, each ringing and fading, the last one ringing longest, a quiet old forge, close perspective, 1.4 second duration, no music, no voices

### mistPass
- **files:** `sfx/mist_pass1.mp3`, `sfx/mist_pass2.mp3`
- **length:** 2–4 s (**fit**: played to last exactly as long as the motion it sounds with, within a third either way, so make it close to this)
- **answers:** `mist:pass`
- **prompt:** A wall of cold mist parting as someone walks through it, a soft airy swell of wind with faint whispering grain and a low hum underneath, dreamlike and ominous, medium perspective, 3 second duration, no music, no voices

### mistClose
- **files:** `sfx/mist_close1.mp3`, `sfx/mist_close2.mp3`
- **length:** 0.8–1.3 s
- **answers:** `mist:close`
- **prompt:** Cold mist closing behind someone, one long soft exhale of wind and a low settling hum, dreamlike and ominous, medium perspective, 1 second duration, no music, no voices

### pipeDraw
- **files:** `sfx/pipe_draw1.mp3`, `sfx/pipe_draw2.mp3`
- **length:** 0.4–0.7 s
- **answers:** `act:inhale`
- **prompt:** A man drawing on a clay pipe, air through the stem and the soft crackle of burning tobacco, quiet night air, close perspective, 0.6 second duration, no music, no voices

### pipeBreath
- **files:** `sfx/pipe_breath1.mp3`, `sfx/pipe_breath2.mp3`
- **length:** 0.8–1.3 s
- **answers:** `act:exhale`
- **prompt:** A man slowly breathing out pipe smoke, one long soft exhale, quiet night air, close perspective, 1 second duration, no music, no voices

### knifeScrape
- **files:** `sfx/knife_scrape1.mp3`, `sfx/knife_scrape2.mp3`, `sfx/knife_scrape3.mp3`
- **length:** 0.12–0.3 s
- **answers:** `act:scrape`
- **prompt:** A pocket knife shaving one short stroke along a stick of dry wood, close perspective, 0.2 second duration, no music, no voices

### quillScratch
- **files:** `sfx/quill_scratch1.mp3`, `sfx/quill_scratch2.mp3`, `sfx/quill_scratch3.mp3`
- **length:** 0.08–0.2 s
- **answers:** `act:scratch`
- **prompt:** A steel nib scratching a few quick strokes on rough paper, close perspective, 0.15 second duration, no music, no voices

### keyChime
- **files:** `sfx/key_chime1.mp3`, `sfx/key_chime2.mp3`
- **length:** 0.2–0.4 s
- **answers:** `act:keys`
- **prompt:** A small silver key turned slowly in lamplight, a few tiny bright chimes of its ward, close perspective, 0.3 second duration, no music, no voices

### vialRing
- **files:** `sfx/vial_ring1.mp3`, `sfx/vial_ring2.mp3`
- **length:** 0.2–0.4 s
- **answers:** `act:glass`
- **prompt:** A small glass vial tapped against a lamp, one clear high ring that fades, close perspective, 0.3 second duration, no music, no voices
