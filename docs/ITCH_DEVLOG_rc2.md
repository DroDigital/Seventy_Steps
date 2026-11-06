# Devlog template: 1.0.0-rc.2 (for itch.io)

For the devlog after the one already posted. It covers every change in `CHANGELOG.md` since `1.0.0-rc.1`, in the words a player
would use, from the game's own notes (nothing here is claimed that the changelog and `docs/DECISIONS.md` do not say).
The repository cannot see the page, so I did not know what the posted devlog already told. If it covered some of this, cut that
section; each one stands alone. Replace every `[[…]]`; delete this box and the shot list before posting. itch.io's devlog editor takes
Markdown (headings, bold, lists, links, images).

**Title, pick one:** `Seventy Steps 1.0.0-rc.2: the chariot, the storms, and every horror's attacks` · `1.0.0-rc.2: ride, rain, and read the menu at a glance` ·
`What changed since the release candidate`

**Shots to take** (1920 × 1080; photo mode is P in the game, the frame tools are in `docs/RELEASE.md`):
1. The chariot turning a corner on the road, the horse bending into it. 2. The ring of light on the ground in a thunderstorm, a second before the bolt;
and the bolt itself. 3. A horror's attack mid-telegraph (Cthulhu's talons, Yog-Sothoth's beam, Hastur). 4. The Elder Sign's Relics tab with green and red
effects. 5. The Weapons tab with star-stones lit in the strip. `node tools/itch_art.mjs frames` makes fight frames of five horrors.

---

# 1.0.0-rc.2: [[a one-line name for this update]]

[[One or two sentences, plainly: why this update, and that it is a release candidate, not 1.0. Example: "This is the second release candidate of Seventy Steps. Most of the work since the first is in four places: how a ride feels, the weather, what a horror's attack looks and sounds like, and the Elder Sign's menus."]]

**Version 1.0.0-rc.2.** The itch app updates itself; a download from the page is the same build. A save from 1.0.0-rc.1 goes on as it was.

## Riding

[[screenshot: the chariot in a turn]]

- **You can hear a ride.** Every hoofbeat is a foot coming down in the horse's gait, on dirt, road, stone or in the shallows, with the wheels' low roll, the rush
  of air, the creak of timber and a snort at the gallop. The motor car's engine climbs through its gears; the spectral chariot has a cold drone with a breath of
  wind in it that rises as it quickens.
- **The metallic clatter is gone.** The wheels roll softly now. The brass jingle and the chain rattle that tired the ear are out.
- **A horse turns like a horse.** A rig follows a circle that widens with its pace, slows into a turn and never to a stop, and the horses step round ahead of the
  carriage and bend into it. A standing horse steps round on the spot.
- **It no longer sticks.** A wall that blocked a turn used to hold the mount where it stood, most of all when you changed direction. It now takes what turn it can
  and backs off what it cannot swing into.
- **The chariot's horse is new**: a chestnut draft horse with a flaxen mane and white stockings, in black and brass harness. Its hooves throw dust, spray and sparks.
  The spectral chariot's violet fire is drawn at last (it was not drawn at all), and the skeleton horses use the same gait.
- **Mounts.** The included mount is called the Chariot, and the quest for it (The Borrowed Reins) gives it. A mount drops when the ride reaches a dungeon or a
  boss arena and cannot be summoned in either. Prompts and the Mounts tab are in English, German, French and Spanish.

> The spectral chariot and the motor car are optional appearances; they change nothing about speed or handling. On itch.io they come in a separate **Mounts** project
> whose download holds a code: paste it in the Mounts tab at an Elder Sign (docs/MOUNTS.md). Without it, the itch.io build has the plain chariot.

## Weather

[[screenshot: a storm]]

- **Rain and thunderstorms come round.** A two-hour test found no storm at all: clear spells ran two to seven minutes and the start region had no weather. Clear
  spells are one to three and a half minutes now, every region has rain and thunderstorms, and a thunderstorm can gather anywhere.
- **Lightning can strike the ground.** In a thunderstorm, now and then, a ring of crackling light opens near you (sometimes near a foe). A second and a half later a
  bolt falls on it, and anything standing in it is struck hard and staggered, you and the foes alike. Walk out of the ring, or roll through the last of it. Nothing is
  struck under a roof or in a dungeon.
- **It looks and sounds like weather.** Rain falls in grains and splashes where it lands, and the world closes in under a haze that deepens with the storm. Lightning
  forks on the far ground, white at its heart, and the thunder rolls after it, later and duller the farther the strike. Under a roof the rain is a dull patter on the tiles.

## Every horror's attacks, redrawn

[[screenshot: a telegraph and its blow]]

- **A mark is found on any ground.** The colours that must be seen are lifted to a floor of brightness in the horror's own hue, with a dark outline. (Cthulhu's was a teal
  nearly as dark as the floor.)
- **You see what is coming.** A telegraph shows the whole of the blow from its first frame, fills toward its front, runs chevrons along a charge's lane and flashes as the blow falls.
- **Each horror is made of its element**: the sea throws drops and spray; stone, shards and dust; fire, embers and smoke; frost, splinters and fog; spores and ash;
  ink, black beads; stars and eyes, light.
- **A blow leaves a mark**: burnt ground that glows and cools, shock rings, a summoning's circle, the arc a swing swept. Bolts leave in a flash, trail their light and land in a spray.
  A beam has a hot core in an aura that crawls.
- **A caster gathers before it looses**: light is drawn in to it, and a gaze streams from its eye to your head, thicker as your mind gives way.
- **You can hear them**, each as its element: water splashes, stone cracks, fire crackles, frost shatters, ink slaps. A beam and a vortex hum while they last. The camera jolts by how near a
  burst, a slam, a phase change or a gaze is. The blows themselves, their timing and their damage, are unchanged.
- Casters no longer share one green fireball: each horror has its own shot and its own mark on the ground it strikes.

## The Elder Sign's menus, and the merchant's

[[screenshot: the Relics tab]]

- **What you carry is in one strip** under the title (level, Echoes, insight, star-stones), and the figure the tab spends is lit. Star-stones are always in view.
- **Every row has its price at the right**, boxed: bright when you can pay, red when you cannot, MAX when there is no more to buy. What the next level gives is green under
  its name; a hidden passage that spending insight would shut again is red.
- **Relics show their effects as figures**, green for a gift and red for a price (a hit taken *less* is green). The paragraphs that explained them are gone.
- **The Weapons tab says what a level does** ("Light blow 35 → 40", "Shot 30 → 35, reach 3 → 4.5 m"), and the long line about resting under every tab is one short line.
- The merchant's wares have their price boxed (red when you cannot pay, SOLD OUT, NO ROOM), your Echoes above them, and what you carry of each beneath it.

## Smaller things

- **The land's edge is fatal.** Walking off the land, into the sea, or through a pit, a well or a bridge's gap is a fall. A ride stops short of the edge, as at a wall. The
  Echoes you lose stay on the ground where you stepped off.
- **The allies have their own faces**: Nodens, the Tritons, the Cats of Ulthar, Pickman, Nasht and Kaman-Thah, the Light-Being from Algol and the Yithian Archivist are
  drawn from sprites made for them, from all four sides.
- **Notes and rumours** use the burnt-paper screen, and placed notes are charred.
- **Desktop:** looking for a controller no longer wakes the macOS dock or pauses the game.

## Still to do, and what I have not checked

- The new sounds (the ride, the storm, the horrors' blows) were measured and levelled, not yet judged by ear on many machines. Tell me where they are too loud, too quiet or tiring.
- Mount stalls are tested in simulation; real play may find more. [[If you meet one: where, which mount, which way you were turning.]]
- The interface is in four languages; the story and voices are English. [[A native-speaker read of the German, French and Spanish is still to come.]]
- macOS: the app is not notarised, so a browser download may be stopped by Gatekeeper (System Settings › Privacy & Security › Open Anyway). The itch app is the easier way. Windows
  may show SmartScreen's "unknown publisher" (More info › Run anyway).

## Tell me

[[A line or two: where to leave feedback (comments here, the page's community tab, a Discord), what you most want to hear (boss difficulty, the storm's ground strikes, the menus, performance on your machine), and thanks.]]

*[[Your name / the studio]] · [[date]]*
