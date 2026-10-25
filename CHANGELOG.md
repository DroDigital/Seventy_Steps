# Changelog

The game was made in numbered rounds (every judgment call is in [`docs/DECISIONS.md`](docs/DECISIONS.md)); this lists what a
player would notice, newest first. Versions before 1.0 were never released.

## Unreleased

- **The twenty horrors' gates are hung from real models.** The gates of the open arenas were boxes built in code; each is now made of a free model fitted to its arena and moves as it opens: the reservoir's sluice boards drop into their slot, the sea wall's tarred oak and the porch's whitewashed doors swing, the burying ground's rusted iron and Carcosa's black iron swing, the keep's portcullis lifts into the gatehouse while its oak doors part behind it, the Black Man's boulder and the grove's two rows of dead trunks sink into the ground, Yig's bone portcullis sinks into the mound, the temple's, R'lyeh's, Yaddith's and the Dreamlands' stone doors swing or slide, the Other Gods' two standing stones are drawn apart, and the Pipers' flutes and the Ancient Ones' basalt sink one after another. Dust falls where a leaf clears its edge, and each makes the sound of a door of its own kind.
- **Yig's gate is a serpent's head; the Court's and the Threshold's are crowned with spikes.** Yig's gate was a bone portcullis turned over; it is now the carved, fanged head of an Aztec serpent set in the mouth of the mound, which sinks into the earth as the gate opens. The Court's black doors sink with a ring of spikes before them, a black sun's corona, and the Threshold's sun and moon doors each slide apart with half of one.
- **Soft caps on the levels.** Vigour, Endurance and Might count whole up to level 18, half from the 19th to the 26th, and a sliver (15%) from the 27th to the 30th, as in the Souls games: thirty levels of one attribute are worth 22.6. The journey itself is untouched (no horror is met past level 18); what changes is the hunt after it. At the cap you have 431 health (it was 520), 281 stamina (340), 50 stamina a second (56) and blows of 1.9 times (2.2), and the ordinary foes of the world, which do not grow with you, stay a threat. The horrors grow to meet what you have become and not the count of levels, so a soft level does not make them much harder either. The Elder Sign's rows say what the next level really gives and mark one that counts for less.
- Oil flames sit inside the new lantern and hanging lightpost housings, with warmer burners, dark iron, clear lightpost glass and smaller halos. Their light follows the housing when it is turned or scaled.
- Moths circle selected outdoor lanterns and lightposts, including those along boss approaches and in open arenas.

## 1.0.7: desktop startup recovery

- The desktop title opens even when music cannot start. A refused profile-storage read no longer stops launch, and startup failures show a recovery screen and report instead of leaving the window black.

## 1.0.6: seventy secrets, retuned bosses and a quieter ride

- **Seventy secrets, charted on the map.** Places from Lovecraft's tales (the Hop Yard, Gilman's house, Zadok's slip, Johansen's landing, the pit of the Great Race, Barzai's ledge, the shore of Ib) lie in the land's graveyards, rings, ruins, groves, shores, cliffs and two mazes. A grey "?" shows where ground near one has been charted. Coming to it finds it once: its name and line, a little insight, and often a chest of Echoes and a guard of foes. The map then marks it.
- **Bosses are retuned by tier.** Each horror and god has its time to fall and the weight of its heaviest blow kept within a band for its tier. Ghatanothoa, Shub-Niggurath, Cthulhu, Hastur, Nyarlathotep, Yog-Sothoth, Father Dagon, Mother Hydra and 'Umr at-Tawil take less time to fall. The heaviest blows of Nug, Rhan-Tegoth, the Colossus beneath the Pyramids, 'Umr at-Tawil and the Whisperer are eased, and the Thing beyond Zann's Window, Z'kauba, Hypnos, the Ancient Ones and the Daemon Pipers are made harder.
- **Father Dagon and Mother Hydra are smaller**, so a close fight with either reads clearly.
- **The ride is quieter.** The horse and the wheels come down in the mix, with fewer thumps and softer footfall.
- **More foes** in Dunwich, Vermont, the Mountains, Pnakotus, K'n-yan, the Dreamlands, R'lyeh, Yuggoth and the Beyond. Some of them guard the secrets.

- **Hutchinson's house is a keep.** His court is no longer a ring: a curtain of old stone with round towers, a gatehouse over the gate and a donjon behind it, with a lightning rod on each that draws a bolt from the sky every few seconds while you are near. The bolt is a picture and a thunderclap, and hurts nothing.
- **The Colour's house is a reservoir and the Black Man's an island in a black river.** The Colour's court is walled by a dam with the gate in a sluice tower that lifts, a bank curving back about it, and a spillway down which grey dust pours. The Black Man's is white earth ringed by thirteen stones and their fires, in a black river between two kerbs, a ford of flat stones from the gate to it, stopped by a boulder that sinks into the earth once the horror is found.
- **The quest you are following is written at the side of the screen.** Under the minimap, in the game's own small gold capitals: the quest's name, one line of what its open stage asks ("Speak with Walter Gilman", "Slay Keziah Mason", "Keep a vigil at the mark"), and a pointer and the distance to it. It stands out for a few seconds when it is new or moves on and rests quieter after; it is not shown in a menu, a fight with a horror or when you are dying, and Settings › Play › Quest tracker turns it off.
- **Boss discovery gate fixes.** Required candles and the paths to them are cleared of scenery, including houses that could hide a candle outside its activation range. The next light pulses and is marked on the map, pale candles stay visible, and nearby lights offer an interaction prompt. The journal keeps unfinished gate requirements and repairs skipped stages in existing saves. Vigils preserve any weather they already accept instead of changing it and losing progress.
- **Every open horror is walled in, and its gate has to be earned.** Each of the nineteen open arenas now stands inside a house built of its own story (the Colour's reservoir dam, the Black Man's river island, a grove grown together with horned towers, the Gorgon's colonnaded porch, a sea wall with its lit towers, a burying ground's low wall, a manor's gatehouse with its lightning rod, the sphinx's temenos, a serpent's earthwork, a black ziggurat, the quay of Ib, a ring of standing slabs, R'lyeh's leaning wall with its door, Carcosa, a crystal threshold, the Court, Yaddith's terraces, the pipers' organ, the pale hexagons). The wall is closed all round; there is one gate, and it stays shut until the horror has been *found*, so there is no angle to take the fog from.
- **A discovery of its own for each horror.** Coming within sight of a house names it and begins a quest in the Journal (and on the map). Its two or three acts are told in the court before the gate: a page left there to be read (twenty-one new ones, each from someone who was there), the rite of lights where the way has one, a vigil kept at a mark in the hour, the weather or the state of mind the place asks for (the Colour is waited for in the dark in the deep of the night; the sea wall in a storm; Simon Orne's grave in the hour before the dawn; the Gorgon's porch at dusk with a steady head; the Organ against its own piping), or a gift laid on an altar with E (a dose of the Laudanum, Echoes, a measure of the mind or the blood). When the last is done the gate draws aside as you come to it, and stays open; a gate that is come to shut says what it waits for. A second journey keeps the way in.
- **A shut gate is explained, and a vigil shows how far it has come.** The first time you come to a horror's gate while it is still shut, the Journal's Field Guide files a hint (*Shut gates*) saying what opens it and where the Journal and the map say so. A vigil whose turn has come now has a ring on the ground the breadth of where it is kept: cold while the hour, sky or state of mind it asks for is not here, warm and pulsing while it is, and a circle inside it is drawn in as the vigil is kept and drawn back as it ebbs.
- **A vigil does not wait on the clock or the weather.** The marks that ask for the last hour of the night, a storm, a gale, the Dreamlands' motes, or a lucid or a lost mind used to leave a player waiting for the night or the sky to turn. Stand at the mark a few seconds and the place answers: the night runs on to the hour (the moon sinks, the windows go dark), the sky gathers what is asked, the mind is drawn to the state the place wants, each with a line and a tremor. The vigil's own seconds are still to be kept. A mark or altar come to early now says what is asked first, and after a wrong light in a rite of lights the right one beckons.
- **Courts, not roads.** The waymarks, omens, hazards and rites that stood along round 62's trails now stand in a straight court out from each gate; there is no road to them and no trailhead.
- **The candle before a fog is set aside the way, and understated.** It stands a few paces to the side of where you rise, on a cairn, a skull, a gravestone's foot, a piece of driftwood or a votive that belongs to the place (at the foot of a wall in a hall), and burns small. Waking there is where it was.
- **Every boss hall has its own furnishing.** The twenty-seven halls of the dungeons and lairs each hold what their story would put there (the garret's chests and bowl, the sunken temple's hulls and idol heads, Akeley's cylinders, the onyx castle's columns), kept off the doors, the pillars and the middle of the floor.
- **A free demo.** The same game, kept to Miskatonic University and Arkham with the Blasted Heath (six Elder Signs, the Witch House and the horrors of those two realms), ending when Keziah Mason falls: a card says that the stair under the Sleeper's Sign leads into the full game and that your save carries over. A bank of grey mist stands along the edge of the two realms, which holds you at the step and says why; the gates to far realms, the stair, and a sign found beyond them are refused where they begin. The title says DEMO under the name.
- **Sixteen creatures are drawn again.** Yig, the Haunter of the Dark (its wing mended), the High Priest's true form, Rhan-Tegoth, the Dhole, Yog-Sothoth, the Man of Leng, the Serpent Man, the Flying Polyp, the Ym-bhi, the Daemon Pipers, the Other Gods, Lilith, the Being of Ib, the Shunned House's entity and the Great Ones have new art, walking in all four directions. Their blows and hurts are drawn from the front only, so seen from a side a creature strikes as it does from the front. Their hurtboxes follow the new bodies: those whose capsules stood well out from the body (the High Priest, the Flying Polyp, the Great Ones, Rhan-Tegoth) are now as wide as they are drawn, and Yog-Sothoth is struck at the seven spheres it is painted with.
- **The dungeons are dark.** Every roofed room kept most of its ambient, and the lantern was a decoration. Each dungeon kit now has its own dark (crypts, cellars and mines are black; libraries, churches and marble halls keep their candles), corridors, stairs and wells are darker than the halls, and an Elder Sign's room and a horror's arena stay readable. The lantern lights a tighter pool of ground, and if it goes out you still make out the shapes about you. In the open world at night the glow of the mist and the moon's light on the land are as they were; the ground away from the lantern is darker.
- **The default picture is 800 × 450.** Settings › Display steps through 320 × 180, 480 × 270, 640 × 360 and 800 × 450, with 960 × 540 under Higher resolutions. A picture kept at 640 × 360 (the old default) goes to 800 × 450 once; a lower choice, or a sharper one, is kept, and you can pick 640 × 360 again. 800 × 450 is not a whole number of times over on a 720p, 1080p, 1440p or 4K screen, so some rows and columns are drawn wider than others there; 640 × 360 is.
- **A harder mind, fairly.** The small and the middling horrors now weigh on the mind (a ghoul's blow, a named horror's presence, first sight of a new kind of thing), the mind mends slowly in the dark and quickly by a lamp, and Laudanum restores 35 a dose, not 50, and dulls if you swallow again within the minute. Unmoored, the mind clings harder, so the lantern's return is never a long wait in the dark.
- **A finer warp.** As the mind goes the picture no longer wobbles all over: its edges flow, the colours split outward like a lens, a faint second picture drifts beside the first, at the edge of Unmoored it tears now and then, and a ring runs out of the middle as a band is lost; it comes in waves, with lulls, and the middle of the picture, where a fight is, holds.
- **The tips at the lower left are gone.** The box of hints that appeared at the lower left (with its black ground) is removed; what each hint says is still kept in the Journal's Field Guide.
- **The horse sounds like a horse.** The Chariot's horse was a synthesised nicker and breath. Its whinny when it is called, the low whickers, snorts and breaths it passes the time with, and the jingle of its harness are now recordings (CC0, credited in `public/audio/CREDITS.md`). It arrives in a short run of sounds (the whinny, the harness taking your weight, a low whicker), and standing it now and then tosses its head after a breath out, the harness answering. The slap's huff and the haul-up's blow are real breaths too.
- **Notices stay long enough to read, and fade out slowly.** The lines in the middle of the screen (a sealed door, a parry, a quest, a place closed) used to flash for about a second; they now stand for as long as their words take to read (a second or so for a short one, two or three for a long one) and fade out in under a second. A sealed door or a sleeping horror's arena tells you again each time you come back to it, not only every twenty seconds.
- **The lantern fails with the mind.** When your sanity falls to Unmoored the lantern flickers for a moment and goes dark, and stays dark until your mind has climbed back to Fractured; then it catches again.
- **The driver works the reins, and the horse answers.** At a gallop the driver slaps the reins on the horse's back (twice to open it, then now and then): the arms wind up and snap down, a ripple runs down the reins to the bit, and the horse's ears go back as it digs in. Stopping is a haul: both hands drawn to the chest, the body sat back, the reins taut, the horse's head coming up and in, then let go once the rig stands; a turn draws the inside hand. The reins now run from the driver's real hands. Each slap is heard (a crack of leather) and the horse answers some of them; a hard stop is a blow through the nose, hooves braking and the harness shaken; a standing horse breathes out, whickers, shakes its harness, swishes its tail, flutters its lips and puts its hoof down in the pawing it is seen to do.
- **The driver's lantern no longer shines through the seat back.** Seen from behind, the lantern at the driver's hip glowed under and through the leather back of the seat. The back now runs to the deck on a board, and covers the lantern's halo and its light.
- **The chariot has no roof.** The default chariot's roof and posts hid the rider from the camera behind and above. It is open now: the box is lower, with a dashboard before the rider, armrests, fenders over the wheels and a step and rail at the tail, and a lantern on each side hung from an iron crook beside the driver, swinging on its ring as the chariot speeds up, brakes, comes round and bumps along. The spectral chariot keeps its roof. How it rides is unchanged.
- **Nine creatures drawn again.** The Ghouls walk side-on in eight frames; the Dhole's back walk, Lilith's left, the Serpent Man, the Great Ones, Zkauba, the Horror at Martin's Beach and the Polyp Swarm have new art (the Polyp Swarm is pink-grey now, not black). The Horror at Martin's Beach, the Polyp Swarm, the Great Ones, Zkauba and the Serpent Man's serpent form are struck as high as they are drawn, and the Swarm's width follows its narrower body: the Horror's raised head is inside its hitbox now.
- **A crisper default picture: 640 × 360.** Every pixel is now the same size on a 720p, 1080p, 1440p or 4K screen and on the Steam Deck (the old 600 × 338 drew some rows and columns wider than others, which shimmered as the camera turned). The resolution choices step through 320 × 180, 480 × 270 and 640 × 360, with 800 × 450 and 960 × 540 under Higher resolutions; a choice you made is kept at the nearest step.
- **Bodies meet their artwork.** Yig, the Dhole and the Shunned House are struck as tall as they are drawn (4.5 m, 3.9 m and 1.7 m), and Yog-Sothoth's picture rests where its hit spheres do, with no gap beneath it. Their blows and aim reach as far as before.
- **Alternate forms keep their own hitboxes.** The Serpent Man's serpent form keeps its low, wide body and bite, and the Polyp Swarm keeps its boss-sized body when the ordinary Flying Polyp's hitbox is fitted to its new art.
- **Nyarlathotep's true form is struck where it is drawn.** In the last phase of its fight the Crawling Chaos kept the body of the grey heap it replaced, a ball twice as broad as the tall figure now drawn: blows landed on air a metre short of its legs, and you were held off as by a wall. It is now as wide as its legs' stance and upper arms, so you can close in to its legs, and a blow that falls short of them misses.

## 1.0.0-rc.5: the sea, the endings and a new Nyarlathotep

- **An ending is told once.** After any ending, resting at the Court's Elder Sign offered both of the Court's endings again, and a second choice replayed the scene and the card, overwrote the first ending and counted the dream as finished twice. The Court offers nothing once the dream has ended, and a second ending is not told.
- **Walking on after the Gate is walking on.** After passing through the Gate with 'Umr at-Tawil, the card said "walk on", but the fog of the Guide's fight still held you in its ring until you struck it down. The Guide takes no more part once you have gone through with it: it hunts no more, the fight and its fog are let go of at once, and a save keeps it so.
- **The ending is kept when it is chosen.** It reached the disk on the next autosave (up to twenty seconds on), so a quit in between put you back at the Court with both endings offered; and the record of the ending reached was made when the card opened, so a quit during the scene lost it. Both are done at the choice.
- **Gilman wakes with the others.** Under the Gate's sealing and the herald's kneeling the cards say the sleepers at St. Mary's woke, and the epilogue said Walter Gilman, if his favour was left undone, "did not wake". He wakes with them now, and not well; under the passage through the Gate, which says nothing of the sleepers, the line is as it was.

- **The endings are cutscenes, and the narrator speaks them.** Each ending had been nine seconds and a caption or two. Each is now some forty seconds under the Archivist's voice, the one who read the opening's notebook, in three lines of his own (nine new recordings, the same voice and the same treatment as the opening's: untouched takes, set in his stone chamber at playback, his pitch as recorded). *The seal:* out of the dark, the Court after the piping, the figure before the glowing sign, the key let go, a clock striking and the sleepers breathing, and the light. *Through the Gate:* behind you, round the Guide, away from the arena, and through, the lens drawn out. *The herald:* embers and red, the tall man who waited at the foot of every stair, the knee that bends (the investigator goes down on one knee), the flutes that begin again, and the dark. The cards that follow are as they were, and none repeats a sentence of the narration. Esc, Enter, Space or E skips a scene as ever, and a line being said is cut off with it.
- **Nyarlathotep is drawn again, in both forms.** The man in the dun suit is a tall, sinister pharaoh: deep violet-black robes with gold at the collar, hem and double crown, and a face held in shadow. The grey heap of his second form is the Crawling Chaos: a lean, ribbed figure with one curling head tendril, two clawed arms and two bent legs, which now walks in six frames from every side (the old one slid on two from the side). Every pose is the author's: idle, walk, strike and hurt, front, back and sides. They stand on the same ground line and at the same size as before, so the fights are as they were; the Chaos is drawn taller within its frame and narrower than the mass it replaces.
- **The water looks like water.** The sea knows how deep it is. Where the light reaches the bottom it is a pale turquoise and thin enough to see the sand through, going through the greens to black a few metres out; it thins to nothing at the waterline, where a wash of foam runs up the shore and slips back and leaves a lace of it in the shallows. The shallows are calmer than the open sea. The sky is mirrored in it by Schlick's fresnel (dark looking down, a mirror at a glance), the moon in a path of glitter that sparkles, and rain pocks it with rings. Under the surface the ground is tinted by the water over it, darker and greener with depth, and wavering with the light that plays on the bottom.
- **Falling into the sea is a fall into the sea.** You go off the edge in the air under real gravity, meet the water with a splash sized by how fast you hit it (droplets, a crown of spray, rings that spread on the surface and a sound to match, so a drop from a cliff is a great one and a stumble in the shallows a small one), and float, chest deep, bobbing on the swell. The camera follows you in and tilts to the water.
- **Something takes hold of you.** After about two-thirds of a second afloat a tentacle rises out of the sea ahead of you, arches over, coils about your waist and drags you out and down along the line you were swimming, the body thrashing, bubbles and a wake behind it. It holds a second and a half, and the picture goes to black as it takes you under. The Lost Echoes lie on the last of the ground. A death by the sea has its own lines.
- **One sea for the sim and the picture.** The table of waves is shared by the simulation, the shader and the tentacles in the water far out (`world/seaSurface.ts`), so what is seen to rise and fall is what you float on.

## 1.0.0-rc.4: the shore, the wells, slower mounts and things on the ground

- **The world's edge goes down into the sea.** Past the border of the land the ground goes on and slopes away to the water, but the fall began at the border itself, so you dropped through ground that was still there, a few steps before the cliff. The land is taken to end where the water is now: you walk off the border and down the slope, and the fall begins where the ground goes under the sea (still a balance on the last of the ground, and a fall of a second and a bit, and then the death).
- **A well is a hole.** The floor was whole under a dungeon's well, with a dark pan a hand's breadth below the curb that showed its stone, so it looked like a bowl and not a drop. The floor is cut away now where the shaft goes down, and the shaft is drawn all the way down: its wall darkens band by band to black water far below. The rings once laid on the floor about every well are gone.
- **No line where two regions meet.** A road that ran beside the edge of its region lost its cobbles at the border, in a straight line, because the next region did not know of it. It does now. And where two regions' grounds differ (the grass of Vermont and the mud of Innsmouth, or only their tints), one comes over the other in a band of about forty metres, uneven as the ground is, and not along a line; a road changes its style across it, and a patch of other ground fades out toward the border.
- **Mounts are slower.** A gallop was 18 m/s and a cruise 11, against 6.4 for a sprint on foot, and it read as a speed hack. A cruise is 7 m/s now and a gallop 10.5: still a good way across the land (a gallop is about two-thirds faster than a sprint on foot, and it costs stamina as before), and no longer a different game. They come up to speed and stop in the same second or so as before, turn on proportionally tighter circles, and the horse's gait, the hoofbeats and the car's gears follow the new speeds.
- **The shore and the world's rim are no longer instant death.** Walking into the sea or off the land's end killed at once, the one edge round 54 had left as it was. They are edges like a pit's now: stand on the last of the ground and step back, and nothing happens; only when none of your feet has ground under it do you fall, and the death comes at the foot of the drop. Your Lost Echoes lie on the ground where you stepped off.
- **A well has a wall.** You could walk over a well's stone curb and fall in. The curb now stops you as it stops everyone else.
- **Things stand on the ground.** A house, a tree or a stone no longer sits on the land like a model on a table. The ground about its foot is darker and turned to bare earth, with an uneven edge (a patch, not a ring), tufts, ferns, pebbles and the odd toadstool stand thicker about the base, and a tree's roots flare out of its trunk into the earth. Shadows meet the ground more closely: the moon's shadow map is finer (4.4 cm to a texel, and was 6.6) and holds a surface a hair from its own shadow, not a hand's breadth, so there is no lit gap beneath a wall; the contact shadow in the picture is a little gentler, so it darkens a foundation or a stone's foot without a black halo; and shadows thin out over the far half of the map's width instead of the last third.
- **Shade is darker.** The sky's ambient light is lower (1.3 to 1.05 on what faces up, and 0.55 to 0.38 on what faces down), so what the moon and the lantern do not reach is noticeably darker than what they do, and still readable.

## 1.0.0-rc.3: the edge, UNMADE, the run and the rain

- **The edge is a fall, not a wall of death.** A hand's breadth of the body over a pit, a well or a bridge's gap used to kill at once. Now you can stand on the very edge, with your heels over the void, and step back: nothing happens, and no animation begins that would condemn you, while any of your feet has stone under it. Only when none of it does, you fall: the arms fly up, the legs run on in the air, you tumble head first, the camera swings up over the hole to look down after you, the picture closes in to black and a rush of air goes by, and the death comes at the foot of the drop. Your Lost Echoes lie on the ground at the lip. Nothing in the room can strike you while you fall. (The sea and the land's end were still instant; see above.)
- **UNMADE stands alone.** From the moment you fall or die, the bars, notices, prompts, plates and hints leave the screen, no other great words come over it, and the two lines that stood under it ("YOUR ECHOES LIE WHERE YOU FELL" and what the last blow teaches) are gone. What the last blow teaches is read in the dark afterwards, on the veil under where you wake. A fall has its own lines there.
- **The run no longer stops by itself.** Sprinting on foot or galloping on a mount, the character sometimes stood still with the keys held, and no one could say why. (The sprint itself ends at an empty stamina bar, about seven seconds from a full one; that is as it was.) Two causes, both in how the keyboard was read. Holding W and then Space for the sprint, the system repeats only the key pressed last, so W fell silent, and after three and a half seconds the game took it for released. And a blink of the window (a notification, an overlay, focus taken and given back) let go of every key, and only the last pressed came back on its own repeat. Both are mended; a key whose release was truly lost is still let go. On a controller, the correction for a stick that has drifted could take a stick held steady through a sprint for one at rest; it does not while a button is held.
- **Rain is quieter and softer.** It was bands of white noise, which is static to the ear and fought the crickets and the wind. It is a soft wash with drops on it now: a few light ones in a drizzle, a crowd of them in a downpour, a heavy one now and then, and what a roof lets through is the low ones. Heard against the rest of the night it sits at the level of the ambience, a few decibels under what it was.
- **It rains less often.** In the last update it rained or stormed about 45% of the time, a spell every five minutes, and a game could open in the middle of one. It is about a fifth of the time now: a spell every quarter of an hour or so, a thunderstorm every half hour to an hour (more in the sea and the drowned city, fewer in the hills and none on the mountains), clear skies between, and a game or a load opens on clear skies with the first spell some minutes in.

### Blocking balance

- Holding block restores stamina at 35% of the normal rate again. Lower the guard to recover faster; stamina does not regenerate during a guard break.
- An underfunded block absorbs only the share of the hit its remaining stamina can pay for. An empty bar takes the full damage, and a hit that exactly empties the bar is still fully absorbed but breaks the guard.
- Raising block or parrying after an attack lands now waits for its recovery cancel frame. Calling off a wind-up still works, and a blocked hit no longer shortens a longer recovery delay from an action.

## 1.0.0-rc.2: since the release candidate

Everything between the release candidate and this build: mounts you can hear and ride like a horse, a thunderstorm that can strike the ground,
every horror's attacks redrawn, the Elder Sign's menus rewritten to be read at a glance, fatal edges, and the allies drawn from their own sprites.

### Menus

- The Elder Sign's menu says less and shows more. What you carry sits in one strip under the title (level, Echoes, insight, star-stones), and the figure the open tab spends is lit and underlined. Every row has its price boxed at the right, bright when you can pay it, red when you cannot, "MAX" when there is no more to buy. What the next level gives is green under its name, and a passage that spending insight would shut again is red.
- Relics show their effects as figures: green for a gift, red for a price (a hit taken less is green). The paragraph that explained them is gone, here, on the relic page, and on the Arms page.
- The Weapons tab names what each level does ("Light blow 35 → 40", "Shot 30 → 35, reach 3 → 4.5 m") instead of a paragraph about percentages, and the long line about resting that stood under every tab is one short line, different for each tab.
- A merchant's wares have their price boxed (red when you cannot pay, "SOLD OUT", "NO ROOM"), the Echoes you carry above them, and what you carry of each beneath it. The Mounts tab lists each mount with one quiet word at the right (selected, available, the quest it waits on, its price) and says its shared speeds once, in the foot.

### Weather

- Rain and thunderstorms come round. A test of two hours saw no storm: clear spells were two to seven minutes and the hub had no weather at all. They are one to three and a half minutes now, the hub and every other region have rain and thunderstorms, and a thunderstorm gathers anywhere.
- In a thunderstorm a bolt now and then falls on the ground. A ring of crackling light opens near you (sometimes near a foe) a second and a half before it falls, and anything standing in it is struck hard and staggered, you and the foes alike. Walking out is enough; so is a roll through the last of it. Nothing is struck under a roof or in a dungeon.
- Rain falls in grains and splashes where it lands, and closes the world in under a haze that deepens with the storm. A thunderstorm has a wind in it. Lightning is forked on the far ground, white-hot at its heart, and the thunder rolls after it, later and duller the farther the strike. Under a roof the rain is a dull patter on the tiles.

### Riding (round 52)

- A horse-drawn rig, the plain chariot or the spectral one, now turns like a horse: it follows a circle that widens with its pace, slows into a turn and never to a stop, and the horses step round ahead of the carriage and bend into the turn. A standing horse steps round on the spot.
- The mount no longer sticks when you change direction. A wall that blocked its turn used to hold it where it stood; it now takes what turn it can and backs off what it cannot swing into.
- The metallic clatter is gone. The wheels roll softly and low, swelling with their turn, over the rush of air. The motor car's engine climbs through its gears, and the spectral chariot has a cold drone with a breath of wind that rises as it quickens.

### Horrors' attacks

- Every attack of a horror was redrawn. A mark on the ground is now found on any floor (Cthulhu's was a teal nearly as dark as the ground): the colours that must be seen are lifted to a floor of brightness, in the horror's own hue, with a dark outline so they read on pale ground and dark.
- A telegraph shows the whole of what is coming from its first frame, fills toward its front, runs chevrons along a charge's lane, and flashes as the blow falls. A swirl draws a vortex's arms and its eye.
- Each horror's blows are made of its element: the sea throws drops and spray, stone shards and dust, fire embers that cool to black and smoke that climbs, frost splinters and a settling fog, spores and ash drift, ink falls in black beads, stars and eyes flash and shed light.
- A blow leaves its mark: burnt ground whose cracks glow and cool, shock rings racing out, a summoning's circle, the arc a swing swept. Bolts leave in a flash, trail their light and land in a spray and a scar. A beam has a hot core in an aura that crawls, with flares at both ends and a scorch where it crosses the ground.
- A caster gathers before it looses: light is drawn in to it, and a gaze streams from its eye to your head, thicker as your mind gives way. A teleport collapses where it was and arrives under a sigil; a summoning rises as a column of light from a circle; a phase change shakes the arena.
- You can hear them. A bolt as it leaves and lands, a burst, a swing, a summoning, an arrival, a phase change, the gaze and the dark each sound as the horror's element (water splashes, stone cracks, fire crackles, frost shatters, ink slaps); a beam and a vortex hum while they last, and the gathering before a blow rises to its release. A burst, a slam, a phase change and a gaze jolt the camera by how near they are (the Screen shake setting scales it).

### Riding

- You can hear a ride now. Every hoofbeat is a foot coming down in the horse's gait, panned left and right, on dirt, road, stone or in the shallows; under them run the wheels' roar and rattle, the rush of air and, for the motor car, an engine that climbs with its speed; over them the harness' brass, the creak of timber and a snort at the gallop.
- The chariot's horse is a new chestnut draft horse with a flaxen mane and white stockings, in black and brass harness, hitched to the shafts. It walks, trots, canters and gallops with its feet on the ground and stops where it stands. Its hooves throw dust, spray and sparks.
- The spectral chariot's violet fire is visible at last (it was not drawn at all), and the skeleton horses use the same gait.
- The mount's prompts, refusals and the Mounts tab are in English, German, French and Spanish.

### Mounts

- The included mount is called Chariot. The summon and ride prompts leave after a few seconds.
- A mount drops when the ride reaches a dungeon or a boss arena. It cannot be summoned in either place.

### Plain chariot

- The included mount is a one-horse wooden chariot. Its body and seat follow the spectral coach, without the funeral dress or the violet fire. Its horse is a chestnut draft horse (see Riding).
- The save id is still `grey`, so an older journey keeps its mount. The spectral chariot and the motor car are unchanged, and still no faster.
- On the desktop build, looking for a controller no longer closes and reopens the helper process, which was waking the macOS dock and pausing the game.

### Edges and horrors

- Walking off the land, into the sea, or through a pit, a well or a bridge's gap is fatal. A ride stops short of the land's edge, as it does at a wall: it is on foot that the edge is walked off. The Lost Echoes stay on the ground where you stepped off.
- Each horror's attacks keep their motion and take that horror's own colours: the telegraphs, the bursts and the beams.
- Casters no longer share one green fireball. Yog-Sothoth still throws that light. The Colour's orb is its own hue. Other shots are shards, drops, sparks or darts.
- A horror's areas wear its own mark: tide, runes, cracks, flame, spores, coils, an eye, roots, stars, frost, ash or a stain. The ground they cover, and when they land, is unchanged.

### Allied sprites

- Nodens, the Tritons, the Cats of Ulthar, Pickman, Nasht and Kaman-Thah, the Light-Being from Algol and the Yithian Archivist are drawn from authored sprites: idle, walk or glide, attack and hurt, from all four sides.

### Mount update

- The Borrowed Reins unlocks the Borrowed Grey, a plain saddled mare from the university stables.
- The spectral chariot is now optional $0.99 DLC, gated like the motor car. Neither is faster than the grey.
- Mount foley is audible: hooves by gait and ground, wheels, harness, idle breath or wind, summon and dismiss. The recipes are procedural placeholders.
- Violet fire follows each spectral horse. Notes and rumours use the burnt-paper screen; placed notes are charred.
- A read-only coach-house exhibit (`?mounts`) presents all three models. Steam app IDs still require release setup.

## 1.0.0-rc.1: the release candidate

**For the first hour and the way to a release**
- Hints before it costs: a foe closing in, a spent breath, a horror's mist ahead, a person to talk to; a parry says what follows.
  Only gentle foes stand about the first Elder Sign.
- A first launch measures its own first seconds and sets the picture for the computer (shadows, sharpness, fog); never over a
  player's own settings. F3 shows the frame rate and the 1% low; `?bench` measures eight places.
- A save before the last is kept, and a damaged save is mended from it. A break leaves a crash report to copy (and, in the desktop
  game, a file in the logs folder).
- The interface in English, German, French and Spanish (Settings › Display › Language). The story and the voices stay English.

**Combat and the horrors**
- The parry is the cane across the face with the body behind it; a parried foe is knocked back and stoops, open to a riposte.
- A candle before each horror's fog lights as you pass; a fall within 100 m of a lit one lets you rise there or at the Elder Sign.
- Resting at an Elder Sign brings back every foe killed (even where sixty were already standing); the guards about a dungeon's sign
  stay down until you rest at another, so there is nothing to farm.
- Bosses strike no oftener than about once a second; two servants at most, lighter and slower; a summoner calls no oftener than every
  nine seconds. Ranged foes take turns and shoot slower; the Elder Thing is calmer.
- Three difficulties (Light Slumber, Deep Slumber, Nightmare) chosen once, as a new dream begins.

**The picture and the menus**
- Mound dungeons have no notch of sky over the gate and no dashed slit along the ridge; floors have no glitchy inlay edges; the walk
  through a horror's fog is a walk; stars lose their rings.
- The mist is the one look of the menus; they dissolve as they close and between pages. The opening's cards gather out of ash and
  blow away as ash. The vitals are a step less saturated.
- The pad's A and B can never again be read two ways (one table of buttons, and a Swap A / B setting).

**Accessibility, controllers and saves**
- A new Accessibility tab: caption size and a dark band behind captions (cutscene lines, talks, what is overheard), Flashes (lightning dimmer, its strobe softened into one swell, or none), with Screen shake and FX intensity beside them.
- A PlayStation or Nintendo pad has its prompts named as its buttons are printed (✕ ○ □ △, R1; B A Y X, ZR).
- On a Steam Deck the first launch takes larger text; the smallest HUD text is a step larger everywhere.
- Saves carry their format and the version that wrote them; a dream begun on this release candidate goes on after 1.0, and a save from a newer build is kept and named as such, never shown as empty or mended over.

**Steam and balance**
- Steam: achievements reach Steam as they are earned (and those earned before, at the next launch); the Steam overlay; packed for Steam with `npm run package` (docs/STEAM.md).
- The Colour Out of Space heals more slowly (18 health a second, from 30): met early in Arkham, it was a wall.

**Voices**
- Morgan is spoken by the library voice Josef Hammer. The intro narrator is a voice designed for the game (a slow, grave English baritone), where a widely used library voice stood.

## Before this round

The whole game: an open world of thirteen regions from Miskatonic University through Arkham, Dunwich, Innsmouth, Providence, Vermont,
the mountains of madness, Pnakotus and K'n-yan, the Dreamlands, R'lyeh and Yuggoth to the gate beyond; a hundred creatures and forty-seven horrors, each
with its own arena, music and mechanic; sanity and insight; a revolver, Laudanum, lamp oil and West's Reagent; the Elder Signs and
fast travel between them; levels bought with Echoes; star-stones and weapon tempers; three endings and a second journey; people,
quests and documents; photo mode; the desktop shell for Steam; save slots; rebindable keys and pad support. See the rounds in
`docs/DECISIONS.md` and the playtests in `docs/PLAYTEST.md`.

## Before 1.0

- [ ] Run `?bench` on real machines and fill the table in `docs/PERFORMANCE.md`; write the minimum and recommended specs.
- [ ] Native-speaker read of the German, French and Spanish interface (`docs/LOCALIZATION.md`).
- [x] Packaging (`npm run package`) and Steamworks in the shell (achievements, overlay); Auto-Cloud needs no code.
- [ ] The Steamworks partner-site steps: app id into `package.json`, depots, Auto-Cloud roots, the achievements and their icons (`docs/STEAM.md`); pack Windows and macOS on those systems; macOS signing.
- [ ] Confirm the licence of every generated voice and track for a commercial release (`docs/STORE_PAGE.md`, AI disclosure).
- [ ] Capsule art, a trailer and screenshots from a real GPU (`tools/store_shots.mjs`, `?trailer`).
