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

A new horror needs its four colours (`bossAttackTheme`) and a motif (`aoeLook` `ASSIGN`). It then has telegraphs, bolts,
bursts, scars, beams, a summoning, an arrival and a gaze of its own, and the sounds of its element. An ordinary
creature with no theme throws what it is made of (`MADE_OF` in `attackLook.ts`, from its palette).

### Legibility

`lift(colour, floor)` raises a colour to a Rec. 709 luma of at least `DANGER_FLOOR` (0.42; telegraphs, rings, gazes) or
`LIGHT_FLOOR` (0.58; bolts and beams) keeping its hue. Cthulhu's danger colour was 0x0b3a32, a teal that is nearly black on
a dark floor and was not seen at all; it is now a clear teal. The author's dark stays as `look.ink`, the scar's and the
pool's. `tests/attackLook.test.ts` holds every horror to the floors, in its own hue, and no two alike.

## The pieces

- **Particles** (`render/particles.ts`): one instanced batch of 2 400 camera-facing sprites. Shapes: disc, shard, streak (lies
  along its flight, stretched by its speed), ring, spark (four-point) and wisp. They spin, hold their brightness before they
  fade, and change colour over a life (an ember from white to red to black). Dithered like the sprites, so no sorting.
- **Element kit** (`fxKit.ts`): `burst` (a flash, a crown of matter thrown out, a fountain, a cloud, glints, rays), `impact`
  (a bolt's landing, its spray thrown back), `trail` (a halo of light, matter shed, sparks), `charge` (matter drawn in to a
  caster before its release), `column` (a summoning's or an arrival's pillar), `flash`.
- **Decals** (`decals.ts`): flat marks on the ground, one instanced batch of 256. Telegraphs: disc, sector, lane, ring,
  swirl. Each has a bright edge with a dark outline, a hatched promise of the whole of it from the first frame, a fill that
  gathers its light at the front, and a flash when it is full; a lane runs chevrons the way it points. Added: `scar` (burnt
  ground: ragged, its cracks glowing and cooling) and `sigil` (rings, ticks and turning spokes, drawn in from the centre).
- **Ground marks** (`groundFx.ts`): the scar of a burst, slam or landed bolt; shock rings racing out; the sigil of a
  summoning or arrival; the slash a swing has just swept. Each has its own clock and the horror's own mark.
- **Bolts** (`boltViews.ts`, `shotLook.ts`): five forms (orb, shard, drop, spark, dart) in the horror's light. The simulation
  now says when one leaves (`BoltLoosed`) and when one ends (`BoltLanded`: on a body, the ground, a wall, or spent).
- **Beams** (`beams.ts`): two ribbons to a beam, an aura that crawls and a ragged beam with a steady hot core; energy runs out
  along it from its source. The flares at its ends and the scorch it draws are `attackFx`'s.
- **Melee** (`meleeFx.ts`): a blow's window opening (`Swung`) lights the arc of a swing, bursts a slam or ring, tears the ground
  behind a charge; a blow that lands on the investigator flares at the wound in the horror's own light.
- **Sound** (`data/attackSounds.ts`, `render/audio/attackAudio.ts`): see below.
- **Camera** (`presence.ts`): `felt()` jolts the camera by distance for a burst, a slam, a phase change and a gaze.

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

- `tests/particles.test.ts`, `attackLook.test.ts`, `groundFx.test.ts`, `fxKit.test.ts`: the pieces.
- `tests/attackEvents.test.ts`: the events the effects keep to. `tests/attackSounds.test.ts`: levels, and each sound where
  it belongs.
- `tests/bossFx.test.ts`: one horror of each element fires every move with the render side running beside the simulation
  (stand-ins for the batches): nothing throws or is left not a number, and the particle and decal budgets hold.
  `tests/bossFxAudit.test.ts` (`npm run audit`) does it for every creature.
