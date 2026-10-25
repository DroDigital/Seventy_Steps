# The investigator, made in Blender (round 81)

The investigator's figure and every clip he plays (the carried gaits, each weapon's blows and parry, the roll and backstep, the revolver, the swallow, the Reagent, the flask, the
Powder, the match, the incantation, the helm, the staggers and the fall) are made in Blender from code in `tools/player/`, baked to compact data in `src/data/player/`, and played
by the game's own figure (`src/render/playerClips.ts`, `playerPose.ts`). The game still has no skeletal animation (CLAUDE.md, out of scope): a clip is a track of **joint
quaternions for every 60 Hz frame of the move**, sampled with slerp onto the same rigid-part `Figure` the people and the creatures use (`docs/DECISIONS.md`, round 81).
Nothing about a move's timing, hit sphere, motion or stamina is changed: the clips are made for the numbers in `src/data/moves.ts` and `weapons.ts`, and `tests/playerClips.test.ts`
keeps each one to them.

## The pipeline

```
node tools/player/export_data.mjs        game's numbers (moves, weapons, colours)   -> build/game.json
python3 tools/player/build_blend.py      the model, rig and props                    -> build/investigator.blend
python3 tools/player/animate.py          clips/*.py solved -> an Action each, read back through Blender's own evaluation (--check)
python3 tools/player/bake_player.py      model parts -> src/data/player/playerIndex.ts + playerPack.ts
python3 tools/player/clipbake.py         the Actions -> src/data/player/playerClips.ts
```

`build/` is gitignored: the `.blend` is regenerated from code. Blender is the `bpy` module (`pip install bpy numpy scipy pillow`; headless; the previews need
`libegl1 libgl1-mesa-dri`). Run each tool with `python3 -I` from the repository root.

Without Blender, `python3 -I tools/player/check.py <clip id> --module <module>` solves a clip, prints the QA report (`qa.py`) and draws a contact sheet (stick figure, the weapon, the
game's hit sphere, the tip's trail) in seconds. **That is what you run again and again while keying.** The modelled figure's own picture is
`preview.py sheet` (Workbench, from the keyed Actions); the game's picture is `tools/player_shots.mjs` (from the running game, `?arena&debug`, `window.fxlab`).

## What a clip is

`tools/player/clips/<module>.py` has `build() -> [Clip]`. Modules: `locomotion` (idle, walk, run, sprint, `<weapon>.guard`), `cane`, `axe`, `razor`, `cutlass`, `rapier`
(`light1`…, `heavy1`…, `parry`), `actions` (roll, backstep, shoot, reload, drink, inject, throw), `rites` (scatter, kindle, chant, helm), `reactions` (stagger, guardBreak, parried,
death). A clip's id is what the game looks up: `<weapon>.<move>` for `light*`, `heavy*`, `parry` and `guard`, else the move's own name (`playerPose.ts`: `idOf`). Start from
`clips/cane.py::light1`, the worked example; `clips/common.py` has the helpers; `clipkit.py`'s docstring is the full DSL.

```python
m = timing('cane', 'light1')        # the game's numbers: m.frames, m.hit0/hit1/arc, m.item, m.shot, m.volley, m.parry, m.iframes, m.cancel, m.release, m.motion, m.hold
c = Clip(m, 'cane.light1')          # frames = m.frames; Clip(m, id, loop=True, root_speed=...) for a cycle
c.drawn = True                      # the sword-cane's blade is out for it (the stick swaps for the sword as the move begins)
c.props = ['flask']                 # what the left hand holds: flask, laudanum, syringe, powder, match, book; 'gun' is the revolver (left hand, muzzle flash by the game)
c.mark(hit0=m.hit0, hit1=m.hit1)    # the frames this clip puts the game's markers at (see Markers)
c.key(t, ease='cr', still=False, pelvis=(x,y,z), pelvis_rot=(x,y,z), torso=..., head=..., look=..., armR=..., armL=..., footR=..., footL=...)
```

Units: metres and degrees, the game's axes (+z ahead, his right is **−x**, up +y), 'YXZ' Euler (x pitches forward). Positions are in the **actor's frame**, which travels with him
through the move's `motion` window (so the clip's world is where he started): except a boot's, which is in the **clip's world** (it stays put on the floor while he travels past it),
or `space='root'` for the actor's frame.

* `pelvis` = where the hips are (standing: 0.912 high), `pelvis_rot`, `torso`, `head` = angles, `look` = a point the head turns to (adds to `head`).
* `armR` / `armL`: `Swing(reach=(az, el, dist), blade=(az, el), toward=…, roll=…, pole=…)` puts the wrist `dist` (≤ 0.58) from the shoulder at that bearing, the weapon pointing along
  `blade`, its edge facing `toward` (a direction: the way a cut goes; use `toward=tangent(az)` for each key of a cut) or rolled; `Grip(pos, aim, edge, pole)` the same by vectors;
  `Arm(arm=(x,y,z), elbow=x, hand=(x,y,z))` the joints' own angles (the off-hand's gestures). **az is degrees toward his RIGHT** (the game's hit arcs: an arc [70, −70] sweeps right
  to left), el is up. The elbow bends toward `pole`.
* `footR` / `footL`: `Foot(x, z, yaw, pitch, lift, space, out)` a boot placed on the floor (the solver bends the leg to it and brings the pelvis down to where the legs reach:
  `Clip.auto_pelvis`), or `Leg(thigh, knee, foot)` the joints' own angles (a kick, a fall). `c.steps(side, start, moves)` does footwork: lift, swing, plant heel first.
  `stand_feet(clip, t)` both boots flat as at ease. A planted boot (lift 0) must not slide (QA says).
* `ease`: how the stretch **ending** at a key moves: `'cr'` a spline through the keys (carries speed through them: the default), `'linear'` (a blow's constant pace: use it through the
  hit window), `'out'` (fast then settling), `'in'` (slow then fast: the wind-up into a blow), `'smooth'`, `'snap'`, `'hold'`. `still=True` brings a key to rest.
* Every clip begins and ends at (or near) the **carried pose**, `at_rest(...)` and `stand_feet`: the game crossfades 0.12 s between moves (`poseBlend`), so a clip that begins
  where he stands needs nothing hidden. A move that **chains** (`combo` in the data) is entered from its predecessor's `cancel` frame, with the crossfade: begin each attack from
  a ready stance, not mid-swing of the last.
* The lantern's pendulum is simulated for every clip afterwards (`lantern.py`); do not key it.

### Markers

`c.mark(...)` says which clip frame is the game's frame, by name: `hit0`, `hit1` (the hit window), `item` (the swallow, the Reagent, the reload's last round), `shot`, `volley` (the
flask leaves), `parry0`, `parry1`. `playerClips.clipTime` retimes the clip through them if the data is changed later, so **what the clip draws at a marker is what the game does
then**: mark them where the clip puts them (normally the very frames of the data: `c.mark(hit0=m.hit0, hit1=m.hit1)`). `c.mark(props=frame)`: the off-hand's prop is gone from this
frame (a flask once thrown, a match once the lamp is lit).

### What the game does with a clip

* Blows (`light*`, `heavy*`): the hit sphere sits at `hit['reach']` along `hit['arc']` (a sweep from `arc[0]` to `arc[1]` over the window, `hit_path`) at `hit['height']`, radius
  `hit['radius']`. The weapon's outer half must pass through it through the window: QA reports the distance. Don't change the data. `motion` is where the root travels (the clip sees
  it: `Clip.root`). The tip may go a little faster than the sphere (QA allows 1.4×) and slower is fine: slowing before the window and then a fast cut reads best.
* `stagger`, `guardBreak`, `parried` are reactions to a blow: a flinch is added on top (`f.body.rotateX`), the figure is knocked back by the game.
* `reload`, `drink`, `inject` (data: `walk` > 0): the figure keeps **walking**: the clip's **torso, head and arms only** are laid over the carried gait (`playerMove`); its pelvis and
  legs are not used. So key their arms and torso so they read over a walking body, with the legs at ease.
* `guard`: a 120-frame loop of the upper body only, laid over idle/walk/run for each weapon (raised weapon, held steady).
* A weapon in the right hand (`handR`) is the model's `arm:<weapon>` group, its grip on (0, y, 0.02) of the hand, its business end down −y; the revolver and every prop is in the **left**
  hand (`handL`). `LENGTH` in `clipkit.py` is each weapon's reach from the wrist.
* `death` holds its last frame (`m.hold`): end lying still. `chant` and `helm` are `iframes` for their whole length: they are long, slow and must be able to loop their middle (no
  pop at the ends; the game plays frames `0 … frames`).

## Style

True to the game: retro 3D at a tiny resolution, flat-shaded rigid parts, a scholar who has learned to fight, not a knight. Poses must **read as silhouettes** at 100 px high: big
arms and weapon arcs, a clear wind-up (anticipation), the cut, then the follow-through and recovery. Weight: the pelvis drops into a blow and rises out of it, the torso leads the arm,
the head looks at what he cuts, the off-arm balances. Each weapon has its own hand: the cane-sword is a fencer's flick and thrust; the axe heavy and wide with the body behind it; the
razor quick, close and low, short steps; the cutlass a sailor's broad slash with a swaying stance; the rapier a duellist's line, front foot first, the off-hand back. Heavy blows hang
longer in their wind-up and carry further after. Nothing may look like another NPC's pose copied: they are his.

## QA (qa.py): what to get clean

`check.py` prints `WARN` lines for: a limb asked for what it cannot reach, the pelvis pulled below where it was keyed (boots too far from the hips), the weapon not passing through the
hit sphere, a one-edged weapon's edge not leading its cut, an elbow/knee/thigh/head/torso past what a body does, a hand through the chest, the tip or the pelvis below the floor, a
joint turning more than 75° in a frame or the tip moving implausibly fast, a planted boot sliding. **Get every `WARN` out, or say in your report why one stays** (a roll's whole-body
spin and a death's fall are exempt as the code says). Then look at the picture: the stick sheet (`check.py … --out`), and the modelled figure
(`preview.py sheet`, below). QA does not catch what looks wrong: look at every clip from the side and the front.

## Gotchas the first clips found

* **A channel is held back to frame 0.** `Series.at` returns a channel's first key's value before it. So an arm's `pole` or `toward`, a boot's `space`, first named in a mid-clip key is
  already turned at frame 0: name them on the frame-0 key (`cane.HANG_EDGE`). QA's `carried` line catches the result.
* **One arm, one kind.** Within a clip an arm is all `Swing`, all `Arm` or all `Grip`: once any `Swing` key exists its `reach` wins everywhere, so an `Arm` rest at the ends is silently
  replaced. Write the rest as a `Swing` (`HANG`), as the cane's and axe's modules do. Likewise give `edge` on every key of a `Grip` or on none.
* **The edge flips.** `toward` is interpolated as a vector and projected perpendicular to the blade: where the blade sweeps through the direction `toward` points, or `toward` turns
  through near-opposite directions between two keys, the hand flips 80–170° in one frame (QA `pops: handR`). Give an intermediate key about 90° round, or choose `toward` along the
  natural roll (`tangent`). A `pole` nearly along the arm, or nearly opposite a raised arm, flips the upper arm's roll the same way: keep poles about perpendicular to the wrist's direction.
  `edge_of` also flips above about 72° of blade elevation.
* **Angles interpolate raw.** A whole-body spin that passes 360° (a whirl) swings `Swing` az, blade az and `Foot` yaw a full turn between keys unless the numbers are unwrapped: key
  such a clip every frame or two with unwrapped values.
* **Hit sphere versus shoulder.** The hit sphere's bearing is about the root, but the shoulders are 0.28 m to each side: the weapon's `az` is offset by 12–17° from the sphere's to pass through it.
* **`Clip.steps` keys frame 0 and has no `out`**: a boot that does more than one run of footwork needs `cane.steps_on` (copy it), and a flight where a boot must keep up with a long `motion`
  is keyed per frame from `Clip.root(f)`. `Foot(space=…)` is one string for a clip: a boot cannot change between the actor's frame and the world's within it.
* **`look` clamps** the head at 40° pitch and 63° yaw, and flips sign through 180°; in a deep lean or a full spin key `head` itself.
* **Rapier and the others' carried tilt.** The game tips a carried rapier (0.8 rad), cutlass (0.2) and axe (0.15) forward in the carried gait only (`playerPose.ts CARRY`), not in a clip and not over a guard clip (a guard's weapon is held as the clip made it):
  a clip begins and ends in the idle's hold and the 0.12 s crossfade takes up the difference. The rapier's clips begin and end with the arm raised a little so the long point clears the floor.
  Through the walk's speeds the cane and the axe are tipped a further `WALK_TIP` (the walk clip lets the hand hang lower than the idle's, and a stick half tilted walks there), and at the kneel `poses.ts KNEEL_AIM` turns the weapon in his hand to where it clears the floor; `tests/playerPose.test.ts` measures the lowest point of every weapon over every speed, stride phase and kneel.
* **Parts are wound outward.** `kit.loft` turns a shape whose volume comes out negative inside out again (a loft given from the top down, a skirt on the left) so the faces the game draws are the outer ones; `tests/playerWinding.test.ts` checks every baked piece.
* **Previews crop.** `preview.py sheet` frames a 2.15 m portrait tile, which crops a lunge or a raised blade: widen `preview.aim`'s `height` in a throwaway wrapper.
* `__pycache__` goes stale if a clip file is edited to the same length within a second of a run: delete `tools/player/clips/__pycache__/<module>*.pyc` if numbers do not move.

## Working in parallel (agents)

Several people (or agents) key different modules at once. Each: edits **only its own `clips/<module>.py`** (new module → add it to `MODULES` in `clips/__init__.py` once), never the
shared toolkit (`clipkit.py`, `solve.py`, `rigmath.py`, `qa.py`, `common.py`, `locomotion.py`, `check.py`, `animate.py`, …): if one has a bug or lacks a helper, put a helper in your own
module and report the bug. Never touch `build/investigator.blend`, `src/data/player/` or commit. For Blender, work on **a private copy** of the blend and a private scratch:

```
S=<your scratch dir>; export PLAYER_SCRATCH=$S/shots; mkdir -p $PLAYER_SCRATCH
cp tools/player/build/investigator.blend $S/mine.blend
$PY -I tools/player/animate.py --blend $S/mine.blend --module <module> [--only <clip id>]       # keys the Actions (and reports 'out of reach')
$PY -I tools/player/preview.py sheet --blend $S/mine.blend --clip <clip id> --frames 0,4,8,… --views q34,side --out $S/<id>.png
```

(`$PY` is a Python with `bpy`.) `python3 -I tools/player/check.py <id> --module <module>` needs no Blender. The shared 4-view sheet of a whole clip: `--every 3`. Look at the pictures.

## Tests

`tests/playerClips.test.ts` (the everyday set): every move of every weapon has a clip (once all are made), the baked data decodes, no joint is NaN, the markers are the game's frames,
clips begin and end at the carried pose, a loop closes, the rig's maths round-trips. `tests/gait.test.ts` and `tests/poseBlend.test.ts` keep the figure's feet on the ground and its crossfades continuous with the clips in.
