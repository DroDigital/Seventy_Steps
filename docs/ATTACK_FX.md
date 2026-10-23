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
element. An ordinary creature with no theme throws what it is made of (`MADE_OF` in `attackLook.ts`, from its palette),
in colours of its own drawn from its signature's accent and its hide (before round 60 every one of them was the shared
magenta and green).

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

## The pieces

- **Particles** (`render/particles.ts`): one instanced batch of 4 096 camera-facing sprites (2 400 before round 60). Shapes:
  disc, shard, streak (lies along its flight, stretched by its speed), ring, spark (four-point) and wisp, and (round 60) rune,
  eye, fang, bubble, bolt (forked), feather, petal and note. They spin, hold their brightness before they fade, change colour
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
