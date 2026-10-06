# Creature sprites: the walk brief and its review

The creature library (the directional pixel sprites drawn outside the repository, 96 sprite sets and
9 colossi) is reviewed by `tools/sprite_review.py`, not by asking whoever drew it to look again. A
look-again review finds what it is told to find and misses the rest. A measured check misses nothing
it measures, and its numbers can be handed back as they stand. The latest findings are in
`docs/SPRITE_REVIEW.md`.

## Why the side views looked wrong

1. **Every walk has two frames.** `move_0` and `move_1` in every direction. Front and back get away
   with it because the legs overlap. In profile the two frames are the two contacts (left foot forward,
   right foot forward) with no passing pose between, so the creature snaps between them: a hop or a
   skate. Redrawing those two frames cannot cure it, which is why piecemeal fixes looked random.
2. **Frames drawn as separate pictures, not one cycle:** the two strides differ in size, the walk is
   shorter or a different posture than the idle, one frame is in other colours or turned toward the viewer.
3. **A set facing the wrong way:** the Deep One's LEFT faced right (so its mirrored RIGHT faced left).
4. **Small jitters:** the upper body jumping sideways between strides, feet leaving the ground line.

## The walk, as a spec (what each delivery must hold)

- **Profile (left, right): four frames** `move_0..move_3`: contact (front foot heel down, legs widest),
  passing (the swinging leg beside the standing one, body 1 px higher), contact on the other foot,
  passing on the other foot. Bosses may have six (contact, down, passing, up, per foot).
- **The legs swap.** The near leg (toward the viewer) is drawn lighter and whole; the far leg darker,
  partly behind it. In `move_0` the near leg leads, in `move_2` the far leg leads and the near leg is
  behind; under a robe the hem and the shoe that shows swap with them. `move_2` and `move_3` are
  never copies of `move_0` and `move_1`, or one leg stays behind all cycle (the checker's
  `same-leg`; it finds copies and near-copies, not a swap drawn wrongly, so watch the walk too).
- **Front and back:** two frames still pass; four are better.
- **Drawn from `idle_0`:** the same posture, proportions, palette and size. Height within 3 px
  (or 8%) of the idle; the two halves of a stride within 15% of each other in area.
- **Ground:** the lowest pixel of every frame on the idle's ground line (row 62 of 64), within 1 px.
- **Steady body:** the upper body (top 40% of the silhouette) within 3 px across the cycle; the
  legs and arms move, the body does not jump.
- **Facing:** LEFT faces left, RIGHT faces right, idle and walk alike; RIGHT is LEFT mirrored unless
  the creature has one-sided anatomy (the pack's `mirror_safe`).
- **No stride, no walk:** what slithers, oozes, drifts or flies (`motion: glide` in
  `tools/sprites/notes.json`) needs no leg cycle. The engine moves it (a bob, a squash, a sway), or
  it gets four keys of one undulation or wingbeat, never two unrelated poses.
- **Canvas:** 64x64 RGBA, transparent, nothing touching the edge.

## Asking for a fix (paste this, one creature at a time)

> Redraw the walk of **{creature}** in the **{direction}** view as four 64x64 frames, `move_0` to
> `move_3`: contact, passing, contact on the other foot, passing. Start from `idle_0` and keep its
> posture, proportions, palette and size. Feet on row 62 in every frame, the upper body within 3 px
> of the same place in every frame, facing {left/right} like the idle. The review found:
> {paste that creature's lines from docs/SPRITE_REVIEW.md}. Do not change any other frame.

Then run the review on what comes back. It passes when its lines are gone from the report.

## Running it

Needs `pip install pillow numpy`. `<dir>` is the pack's root (the folder holding `previews/library.html`).

```
python3 tools/sprite_review.py fetch <published url> <dir>   # or use the pack on disk as it is
python3 tools/sprite_review.py audit <dir> --report docs/SPRITE_REVIEW.md [--strict]
python3 tools/sprite_review.py sheets <dir> <out> [key,key]  # contact sheets, findings beside each row
python3 tools/sprite_review.py fix <dir> <out>               # the mends that need no drawing, on a copy
```

- `audit --strict` exits 1 while anything remains that `fix` cannot mend (a glider left on two keys for the engine to move is not counted): the gate for a delivery.
- `fix` writes only the frames it changed, at their own paths, plus `fixes.json`. Copy `<out>/sprites`
  over the pack's `sprites` to apply. It mirrors a set that faces the wrong way, moves feet back to the
  ground line and holds a walk's upper body steady. It does not shift frames that are due to be redrawn.
- The sheets put each side view's two strides over each other (move_0 warm, move_1 cold, grey where
  they agree): a walk whose overlay is nearly all grey glides.
- What a measurement cannot see (a frame turned toward the viewer, a repainted coat) is written by eye
  in `tools/sprites/notes.json` under `eye`, with the creatures that have no stride (`motion: glide`)
  and those that fly (`flies`: not held to the ground line). The report merges both.

## Four-frame walks without drawing

`python3 tools/sprites/walk4.py <pack> [--dry-run]` turns the two-frame side walks of the two-legged
creatures it can read (`WALKERS` in it) into four: the two old frames become the contacts (`move_0`,
`move_2`) and a passing pose is made from the pixels of each, legs swung in under the hip, the trailing
foot lifted, the near (lighter) leg over the far, the standing foot on the ground line. The arms keep
the contact's swing. It leaves alone any side that already has a `move_2` (a walk redrawn), keeps
what it replaces in `walk4_backup/`, and adds the frames to the gallery's list. Four-legged creatures,
robes that hide the legs and the off-model sets still need drawing.

## When the sprites come into the game

The library is not in the game yet. The game's creatures are still drawn in code
(`src/render/sprites/`), and a pack of PNGs is an asset, which CLAUDE.md does not allow without the
author's say. Bringing it in still needs three things: choosing the view by the camera's angle to the
creature, mirroring LEFT for RIGHT in the billboard, and stepping the walk by distance covered, not time
(a frame per quarter stride, the stride set so feet do not skate at the creature's speed).
