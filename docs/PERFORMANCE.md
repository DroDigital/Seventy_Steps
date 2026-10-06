# Performance

How the game is measured, what it sets by itself, and what to expect. **Numbers for real machines are not in here yet:**
every run so far was in a cloud container with software rendering (about 1 frame a second), which says nothing about hardware.
Run the benchmark below on the machines you care about and write the results into the table at the end.

## Measuring

- **F3** (or `?perf`): the frame meter, in any build: frames a second, the 1% low (the frame rate of the slowest hundredth of
  the frames: stutter, which an average hides), the worst frame, and draw calls and triangles.
- **`?bench`** (with `?fresh`, for a new world): carries the camera through eight places in turn (the town's lamps, the moor
  and its weather, the reef's water, the ice city, the vaults and their torches, the sunken city and its colossus, the fungus
  cities, the court beyond), 5 s to settle (the land is being made about it) and 8 s measured at each, and prints a table and a verdict in plain words. The result is
  also in `window.__bench`. In the desktop shell: `npm run desktop`, then open the game with the benchmark's address, or run the
  dev build in it (`npm run desktop:dev`, `http://localhost:5173/?fresh&bench`).
- **Targets:** the verdict is *smooth* at 55 fps average with a 1% low of 40 or more everywhere; *playable* at 40 / 25.

## What the game sets by itself

On a first launch (no settings kept, no choice made) the first seconds of play are measured (4 s to settle, 5 s measured). If the
average is under 50 fps the picture steps down a rung of this ladder, and is measured again (1.5 s to settle, 5 s measured), up to
four steps; under 28 fps it steps down two. `render/autoQuality.ts`:

| Rung | Resolution | Volumetric fog | Shadows |
| --- | --- | --- | --- |
| 0 (default) | 2× (800 × 450) | 100% | on |
| 1 | 2× | 100% | off |
| 2 | 1.5× | 75% | off |
| 3 | 1× | 50% | off |
| 4 | 0.75× | 25% | off |
| 5 | 0.5× | off | off |

It says so once (*PICTURE SET FOR THIS COMPUTER · SETTINGS › DISPLAY*). A player who has any setting kept is never touched, and one
who changes a setting while it measures is left alone. It does not run in `?debug`, `?bench` or the arena.

## Where the time goes (read from the code, not measured)

The picture is drawn in one pass at 400 × 225 × the resolution setting, then graded and upscaled. The costs a setting turns off:
the moon's and the lantern's shadows (two more passes over the scene), the volumetric fog (a march against the depth buffer), the
sea's reflection (only where the sea is about), and the lamps' shadow maps (the nearest few). The sim runs at 60 Hz and
the draw count of a busy place is in the low hundreds.

## Results (to fill)

| Machine | GPU | Result | 1% low | Notes |
| --- | --- | --- | --- | --- |
| | | | | |
