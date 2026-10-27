# Attack effects

How a horror's blows look, sound and feel (round 51). Everything here is render side: it reads the simulation's
events and moves and never writes to it. The blows themselves (their windows, reach, damage) are unchanged.

## The idea

A blow is made of three things, and each has one place:

| | where | what it is |
|---|---|---|
| **colours** | `data/bossAttackTheme.ts` → `render/attackLook.ts` | four colours per horror as its author chose them (often near black), and `lookOf(id)`: the same lifted to a floor of brightness so a mark is found against any ground, plus a hot `core`, a cooling `ember` and the dark `ink` it leaves |
| **element** | `render/aoeLook.ts` (`ASSIGN`) → `render/fxKit.ts` (`ELEMENTS`), `data/attackSounds.ts` (`TIMBRE`) | what it is made of: tide, glyph, crack, flame, spore, coil, eye, root, star, frost, ash, stain (and plain). The same twelve name the mark its ground wears, the matter of its bursts and the timbre of its sounds |
| **path** | `render/attackFx.ts`, `meleeFx.ts`, `telegraphs.ts`, `beams.ts` | what is done with them: the same for every horror |
| **signature** (round 60) | `data/attackSignatures.ts` → `render/fxForms.ts` | whose a blow is: a form (18: tendrils, bubbles, runes, eyes, forked arcs, fangs, feathers, a swarm, crystals, petals, voids, a prism's sparks, sand, chains, grasping hands of smoke, notes, cinders, motes), a motion (6: a fountain, a spiral, drawn in, a rain, an orbit, scattered) and an accent light, drawn over the element at every flash, burst, landing, trail, gathering and column |

A new horror needs its four colours (`bossAttackTheme`), a motif (`aoeLook` `ASSIGN`) and a signature (`attackSignatures`).
It then has telegraphs, bolts, bursts, scars, beams, a summoning, an arrival and a gaze of its own, and the sounds of its
element. Every other creature (the lesser and greater creatures, the allies and the two plain named ones: 51 in all) has no
theme and no signature: since round 90 it draws a **quiet blow** of its own, below.

### Distinct (round 60)

Asked: "make it very distinct from each other, and also with more fidelity". An element was shared by up to six horrors,
and every common foe of one hide threw the same matter in the same colours. Now no two creatures of one element share form,
motion and accent all, and no two horrors of one element share a form (`tests/attackSignatures.test.ts`): Hypnos rains
petals where the Haunter of the Dark opens voids that orbit, both of the eye. What falls (a crown of rock, a fountain's
matter, a landing's spray, crystals, feathers, petals, sand) lands and lies on the ground a moment instead of sinking
through it. A signature adds at most 64 particles to a burst, 24 to a landing, 36 to a column, 8 to a flash, 4 to a
gathering's step and 1 to a bolt's step (`BUDGET` in `fxForms.ts`): a colossus's burst drawn of tendrils, seven particles
to the stalk, had been 280 of them over the element's own.

### Legibility

`lift(colour, floor)` raises a colour to a Rec. 709 luma of at least `DANGER_FLOOR` (0.42; telegraphs, rings, gazes) or
`LIGHT_FLOOR` (0.58; bolts and beams) keeping its hue. Cthulhu's danger colour was 0x0b3a32, a teal that is nearly black on
a dark floor and was not seen at all; it is now a clear teal. The author's dark stays as `look.ink`, the scar's and the
pool's. `tests/attackLook.test.ts` holds every horror to the floors, in its own hue, and no two alike.

### Quiet marks (round 70)

A telegraph says where a blow falls without covering the floor: `INDICATOR` (`data/fxTuning.ts`) sets its edge's width and how much of
its light the edge, the fill, the flash and the outline keep, and how long a scar (30%) and a sigil (60%) of what a blow leaves
last. The lifted colours, the whole shape from the first frame and the filling front are not touched, so a mark is still read on any
ground. A pool, a fire and a cloud's reach are not marks but what hurts, and keep their own looks and lives.

### Quiet blows (round 90)

Asked: "many of the lower-tier creatures' attack animations and telegraphs appear acceptable but overly elaborate; in high-density
combat scenarios, this detracts from the intended eerie atmosphere. Several animations are visually redundant; each creature should
instead feature a distinct, high-fidelity, subtle animation with optional graphic accents. Reevaluate overused color palettes".
*What was wrong:* a creature that was not a horror drew through the horror's machinery (a signature's crown, fountain and column, a
lit flash, scars, sector decals, an element's cloud), 86 particles a move on average, 200 to 525 for a caster, and nearly every
one in the same few amber and violet hues. *What it is now:* a creature that is not in `BOSS_ATTACK_THEME` (the shoggoth and the flying
polyp are, and keep their signatures) is routed away from all of that to `render/foeFx.ts`, and says what its blow is in one line of
`data/foeBlows.ts`. (The horrors' telegraphs, the decals of `telegraphs.ts`, were never drawn for these: what stood in a crowd was their
attack effects. A slow, heavy blow's warning is now its mark in miniature, once.)

| | what | the choices |
|---|---|---|
| **mark** | the one graphic the blow leaves, drawn by the particle batch | `rake` (claw lines), `jaws` (two closing arcs), `crescent` (a blade's sweep), `lash` (an S that cracks back), `splat` (an ink blot), `swirl` (an open ring turning like a wheel), `glint` (a hairline cross), `dash` (a row of ticks), `ripple` (a ring on the ground), `sigil` (a small rune that kindles and goes out), `eye` (an eye opening), `plume` (a rising puff of smoke) |
| **tempo** | how it moves | `snap`, `drag` (strokes lag one another), `bloom`, `settle` (it sinks), `flutter` (it turns and wanders), `pulse` (two beats) |
| **matter** | the few specks it throws, what the creature is made of | none, brine, ash, dust, spore, frost, ichor, ember, mote, down |
| **accent** | an optional second mark | any of the twelve, never the same |
| **hues** | start, middle and end | pale to a colour to a dark, drifting through the particle's life (`ParticleSpec.colorMid`); each particle's own hue and light is jittered a little, so no two are alike |

`tests/foeBlows.test.ts` keeps the table apart: every mark, tempo and matter is used, no (mark, tempo, hue bucket) repeats, no more than
six middles are amber (it was a third of the roster) or five pale, no more than seven fall in one 30 degree bucket of hue, each leg of a
path really turns, a bite is a `jaws` and a slam a `ripple` only where the creature has them, and two creatures that can be met in one
realm and share a mark have middles at least 40 degrees of hue apart (25 if their tempos differ).
The blow's size is the body's (`FOE_FX.size`); a blow's look in `attackLook` is derived from its hues (`sig` is null for these, its
motif, punch, twist and pitch are unchanged, so no sound moved).

**What it draws** (`FOE_FX` in `data/foeTuning.ts`: the counts, sizes, lives and budgets): a sweep lays up to three strokes along the tip as it goes (a mark that is not a stroke is stamped once, midway), a thrust
or a bite one stamp where its tip is, a slam a ripple and a stamp; a blow that lands on the investigator marks the wound; a
slow blow has its tell (the mark in miniature, once); a lunge leaves faint smears; a caster gathers nine motes, looses a bolt with a
mark at the muzzle and one where it lands, a beam a mark at each end, a summoning one faint sigil, a teleport two swirls, a gaze an
eye and motes along its look, a roar a front of motes. **What it never draws:** a crown, a fountain, a cloud, a scar, a lit arc, a
flash or a column. It keeps one thing of the old path: the small, short light every foe's blow and bolt lays on the ground it falls on
(round 87, `FLASH_LIGHTS`; `fxKit.glow`, laid by `meleeFx.ts` and `attackFx.ts` for these creatures, none for an ally's, as before).

**A crowd** (`render/foeCrowd.ts`): the three nearest creatures draw all of their blow, the next five only its marks, the rest only
within 10 m, and none beyond the range of its tier; the whole crowd shares one rolling budget of 56 particles in half a second, of
which the optional things (specks, trails, tells, motes) may spend 65% and only for the full tier, so a pack of twelve spends what a
pack of four would, and the nearest creatures' marks are never crowded out by the farthest. Measured over the 51 creatures' every
move, with the render side running: the median was 86 particles and is 14, a caster's blow 200 to 525 and is about 20.

**Free art or code?** Assessed, and code won almost everywhere. Four more masks were baked at first, three cut from Kenney's Particle
Pack 1.1 (CC0: a claw's three lines, grit, a wavering thread) and a spiral made in code; the marks they were for (the rake, a swirl)
are drawn as crescents and arcs in the shader instead, exact at any size, so no recipe drew them and they were left out. What the atlas holds (`tools/marks/bake_marks.py` into `data/markAtlas.ts`, 2 KB) is two
organic things that no formula draws well, both made in the baker: `splat`, an ink blot with droplets, and `smear`, the frayed tail of a
wet drag, whose fray takes its mottle from the pack's `smoke_05` (credited). Anything geometric with hairline strokes or a point (the
crescent, the lash, the cross, the dash, the arc) is drawn in the particle shader (`render/shaders/particleMasks.ts`): exact at any size
and not chunked by the dither. Animated flipbooks were not taken: the fine frames would be lost, so motion comes from spin, growth,
the hue's drift and the timing of strokes. (The one flipbook worth it, fire, is already `data/flameAtlas.ts`.) The aligned shapes
(`crescent`, `lash`, `dash`, `trace`) lie along their flight on the screen; `mark` and `trace` pick a cell of the atlas by `thick`,
which is `markCell(name)`.

The effects lab can lay any of them for the eye: `fxlab.spawn({ shape: 'crescent', ... })` (`ui/fxLab.ts`), and
`fxlab.fire(move)` fires a creature's own move as any other. Seen only in a software renderer so far: `FOE_FX.marks.*.alpha` and `size`
are the knobs if the marks are too quiet or too loud.

## The pieces

- **Particles** (`render/particles.ts`): one instanced batch of 4 096 camera-facing sprites (2 400 before round 60). Shapes:
  disc, shard, streak (lies along its flight, stretched by its speed), ring, spark (four-point) and wisp, and (round 60) rune,
  eye, fang, bubble, bolt (forked), feather, petal and note, and (round 90) crescent, lash, cross, dash, arc, and mark and trace
  (a cell of the two-mask atlas). They spin, hold their brightness before they fade, change colour
  over a life (an ember from white to red to black), and (round 60) may have a floor: they bounce a little, skid and lie still
  on it. The floor is the ground under the blow (`Particles.ground`, the world's; `groundUnder` in `fxForms.ts`), so what a
  blow on a body or a wall throws down falls to the ground, not to the height it struck. Dithered like the sprites, so no sorting.
- **Element kit** (`fxKit.ts`): `burst` (a flash, a crown of matter thrown out, a fountain, a cloud, glints, rays), `impact`
  (a bolt's landing, its spray thrown back), `trail` (a halo of light, matter shed, sparks), `charge` (matter drawn in to a
  caster before its release), `column` (a summoning's or an arrival's pillar), `flash`.
- **Decals** (`decals.ts`): flat marks on the ground, one instanced batch of 256. Telegraphs: disc, sector, lane, ring,
  swirl. Each has a bright edge with a dark outline, a hatched promise of the whole of it from the first frame, a fill that
  gathers its light at the front, and a flash when it is full; a lane runs chevrons the way it points. Added: `scar` (burnt
  ground: ragged, its cracks glowing and cooling) and `sigil` (rings, ticks and turning spokes, drawn in from the centre).
- **Ground marks** (`groundFx.ts`): the scar of a burst, slam or landed bolt; shock rings racing out; the sigil of a
  summoning or arrival; the slash a swing has just swept. Each has its own clock and the horror's own mark.
- **Bolts** (`boltViews.ts`, `shotLook.ts`; round 69): five stock solids (a cone among them) were every caster's shot. Each creature that
  shoots now throws a thing from its own tale (`data/shotForms.ts`, the body built in `shotShapes*.ts` from `shotKit.ts`): Dagon's
  priests a silver fish, Keziah the crooked knife of the Walpurgis rite, Wilbur a leaf torn from the Necronomicon, the Haunter its
  trilobed eye, Yig a diamond-backed snake, Hutchinson a rimed chain, Zkauba the Silver Key, Hastur the Yellow Sign, Yog-Sothoth its
  congeries of globes (forty-one in all; a creature with no shot of its own throws a `shard`, or a `glob` if it spits). A body is
  flat-shaded in four tones (the tint lit, a white-hot heart, a dark, a pale) and some parts sway, swell or flap in the vertex shader;
  `FLIGHT` says whether it points where it goes, tumbles, flips or turns, and how large it is drawn. `tests/shotLook.test.ts` holds
  that every creature that shoots has one, that no two horrors share one, and that no shot is a cone.
- **Beams** (`beams.ts`, `data/beamStyles.ts`; round 69): the two ribbons carry a pattern of the caster's own: a braid, running beads,
  a crackle, a slow wave, bands of colour, a flame's tongue, dashes of ice, a dark core with a bright rim.
- **Melee** (`meleeFx.ts`): a blow's window opening (`Swung`) lights the arc of a swing, bursts a slam or ring, tears the ground
  behind a charge; a blow that lands on the investigator flares at the wound in the horror's own light.
- **Sound** (`data/attackSounds.ts`, `render/audio/attackAudio.ts`): see below.
- **Camera** (`presence.ts`): `felt()` jolts the camera by distance for a burst, a slam, a phase change and a gaze.

## The new attacks (round 70)

Seven attacks of the tales (`data/attacks.ts`; the rules and who has them: `docs/DECISIONS.md`, round 70). Ground that has a `look` (`MarkLook`:
`tentacle`, `star`, `flame`, `bolt`) is drawn as that matter whoever strikes it (`matterLook.ts`: a conflagration is orange under every horror, a star pale gold, a
bolt the storm's blue; only a tentacle keeps the horror's own colours), and sounded by it (`MATTER`: a wet crack, a strike, a gust, thunder).

- **Tidal surge** (`surgeView.ts`): a wall of water as wide as the lane (`wallGeometry`: a breaking wave with a ragged white crest, the world's water texture), run over
  the ground with spray thrown off its crest. Its lane is drawn on the ground from the first frame of the wind-up (`telegraphs.ts`, a `lane` decal toward the target), and once
  it runs, the lane stays faint and the band the water holds is bright. A roll through the band slips it; the gurgle and the rumble sound as it leaves.
- **Tentacles** (`strikeTentacles.ts`): where a `tentacle` mark bursts, a tube of the deep's own centreline (`tentacleShape.ts`, `tentacleMesh.ts`) comes up in a fifth of a second,
  writhes with its tip curling and sinks, in the horror's ink and light. The creeping mark is the ordinary disc, moving; when it locks it turns white-hot and takes a ring.
- **Stars and lightning** (`matterFx.ts`): in its last half second a star's mark has a streak of gold come down on it on a slant, sparks behind; lightning is a bolt from the
  sky (`beams.bolt`, `boltPath`) with a flash.
- **Flame**: the marks are lines, drawn from the first frame as lanes out from the horror; each leaves a fire (a `fire` hazard), drawn by the flask's flames (`flaskFx.ts`).
- **Clouds** (`matterFx.ts`): billows (soft, wide, slow wisps) and motes in the bank's colours (`CLOUDS`: bile green with bubbles rising; violet with pale stars adrift), a disc on the
  ground for its reach, and a puff where it rises. A cloud is not a pool: `fightViews.ts` draws none for it. The dreaming one also raises the anomaly proximity (`fxController.ts`), so
  the picture warps and the whispers come as they do near a glowing horror.
- Budgets: a cloud spawns about `radius² x 0.1` billows a frame; a surge about `half x 1.4` spray; a star two streaks a frame for its last thirty. `tests/newAttacks.test.ts`
  holds the simulation's side, and `tests/bossFx.test.ts` the picture's.

## What is heard

Each of the blows below is played at its place as its element: a bolt leaving and landing, a burst (and the boom of a
recording under it), a swing's opening, a summoning, an arrival and the departure from where it was, a phase change, the
dark, the gaze landing. What is kept up is a hum laid end to end (a sweeping beam, a vortex, a gaze that builds, its pitch
rising with the mind giving way). Before a caster's blow comes its gathering, a rising whine and a breath drawn, over the
same last 28 frames as the light that gathers (`render/windup.ts`). A volley of five is one sound.
Levels (`ATTACK_MIX`) put a landing in the range of a landed blow (-22 to -10 dBFS rms); `tests/attackSounds.test.ts` holds
them.

## Looking at it: the effects lab

`?spawn=<id>&debug` exposes `window.fxlab` (`ui/fxLab.ts`): the game held still and stepped by hand, so a script can fire
any move of any creature and photograph it frame by frame from where it chooses:

```
fxlab.hold(true); fxlab.target('cthulhu'); fxlab.place({ dist: 14, bearing: 0.35 })
fxlab.look({ yaw: 1.2, dist: 14, up: 6, aim: 0.5, fov: 50, mix: 0.9 })   // mix: how far from the horror toward the investigator
fxlab.moves(); fxlab.fire('eruption'); await fxlab.advance(1.0)           // then screenshot
```

Real horrors only (`?spawn=<id>`, not `&variant=boss`, which is for creatures that have a boss variant and otherwise falls
back to the training Deep One). A headless Chromium (software GL) shows a shader that does not compile as a console error:
a stage that reads an undeclared uniform silently draws nothing.

## Tests

- `tests/particles.test.ts`, `attackLook.test.ts`, `groundFx.test.ts`, `fxKit.test.ts`: the pieces. `attackSignatures.test.ts`:
  every creature has its signature, none alike within an element, each form sheds its own things within its budget.
- `tests/attackEvents.test.ts`: the events the effects keep to. `tests/attackSounds.test.ts`: levels, and each sound where
  it belongs.
- `tests/bossFx.test.ts`: one horror of each element fires every move with the render side running beside the simulation
  (stand-ins for the batches): nothing throws or is left not a number, and the particle and decal budgets hold.
  `tests/bossFxAudit.test.ts` (`npm run audit`) does it for every creature.
- Round 90: `tests/foeBlows.test.ts` (the table: coverage, vocabulary, the spread of hues and marks), `foeKit.test.ts` (what each mark, tempo and
  matter draws, within its budget, never a crown or a scar, and only a small short light), `foeFx.test.ts` (the events: a blow, a wound, a bolt, a beam, a
  summoning, a gaze; a horror's path untouched), `foeCrowd.test.ts` (the tiers and the rolling budget), `particleShapes.test.ts` (the new
  shapes and the atlas: every cell has coverage and a zero border, the shader names the shapes it draws) and `attackLook.test.ts` (a blow's look from its hues).
