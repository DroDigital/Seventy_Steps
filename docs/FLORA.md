# Flora (round 125)

Every tree, conifer, bush and plant of the open world, remade: the trees, conifers, bushes and the undergrowth's saplings and young
firs are modelled in Blender by code, their light baked by rays through them; every leaf is a card cut out of a leaf atlas made in code;
everything that grows sways in a wind that rolls across the land down the realm's own bearing, casts dappled moon shadows that move with
it, and rustles as the gusts come through it. The theme is kept: low-poly, vertex-lit, PS1 cut-outs and dither, October's colours, fog.

## What is where

| Part | Where |
| --- | --- |
| Species as rules (the realms' hardwoods, conifers, bushes, undergrowth) | `tools/flora/species.py` |
| Growth: trunk, limbs, branches, twigs (Weber and Penn's way: down angles, phyllotaxis, whorls, gnarl, tropism, droop) | `tools/flora/grow.py` |
| Bark: rings carried without twist, buttressed flare, knots, roots, closed boughs | `tools/flora/tubes.py` |
| Leaves: clusters, flat sprays, hanging strands and moss, a cypress's flame, fronds | `tools/flora/cards.py` |
| Fungal caps, a blasted tree's stubs | `tools/flora/shapes.py` |
| The light baked: rays from Blender's BVH, through leaves by their cover, stopped by bark | `tools/flora/bake.py` |
| The bytes (format in its header) | `tools/flora/export.py` → `src/data/flora/floraIndex.ts`, `floraPack.ts` |
| A contact sheet rendered by Cycles | `tools/flora/preview.py` |
| Decoding (loaded once with the arenas' models, `loadFlora` in `main.ts`) | `src/render/floraData.ts` |
| A model stood as a prop: fitted to its height and collider, coloured in its realm | `src/render/floraKit.ts`, `floraColours.ts` |
| The leaf atlas: 16 cells of 32 texels, cut out, coverage-keeping mips | `src/render/textureFoliage.ts`, `foliageCells.ts`, `foliageRaster.ts` |
| Leaf light (crown normals, wrapped moon, light through leaves, lantern wrap, dithered cut) | `src/render/shaders/foliage.ts` |
| The wind (gust fronts, a trunk's lean and ring, boughs' own phases, flutter, sheen) | `src/render/shaders/wind.ts`, `windField.ts` (the same gust on the CPU), `windKit.ts`, `data/windTuning.ts` |
| Leaf shadows, cut out and blown | `src/render/foliageShadow.ts` (drawn by `moonShadow.ts`) |
| The ground's growth: grass clumps, tall grass, reeds, ferns, brambles, fallen leaves | `src/render/groundCover.ts`, `coverBuilder.ts`, `understory.ts`, `nearGrass.ts` |
| The leaves heard | `src/render/audio/leafBed.ts` |
| Pictures of it in the game | `tools/flora_shots.mjs` |

## Making the library again

```bash
pip install bpy numpy pillow
```

```bash
python3 -I tools/flora/build.py --stats
```

```bash
npm run check
```

`--only tree.oak,pine.fir` rebuilds those species and keeps the rest; `--dry` writes nothing. Each model grows from a seed of its own
name and variant, so a rerun makes the same bytes. Some 85 models, about 1 MB of text, read as a module of its own when the world is
made (as the arenas' models are), never as a file.

For a contact sheet, the atlas is needed as a PNG: draw it from the game's own generator (`generateFoliage()` in
`render/textureFoliage.ts`, level 0, rows flipped so v = 0 is the image's foot) and pass it with `--atlas`:

```bash
python3 -I tools/flora/build.py --dry --only tree.oak,tree.maple --sheet sheet.png --atlas atlas.png
```

In the game, with `npm run dev` running and Playwright's Chromium:

```bash
node tools/flora_shots.mjs shots --hour deep --wind 3 --frames 3 vermont_road dunwich_hills
```

## How a model is stood

- **Its variant** is the prop's seed modulo its form's variants (`floraFor`); its colour slots are turned by the seed too, so two oaks of
  one variant turn differently in October.
- **Its height** is the prop's (`sy`); its spread follows its height, wider or narrower by `FLORA.widen`, but never farther from its
  trunk than half its height and `FLORA.reach` (the model's measured reach clamps it).
- **Its trunk's foot** is as thick as its collider: below 80% of its first fork the bark is scaled about its axis to the prop's `w`,
  easing to the model's own girth by the fork.
- **A wind-bent pine** is turned to its realm's wind, whatever its prop's yaw, so the pines of a shore all lean one way.
- **Its colours** are its realm's look (`data/propLooks.ts`): leaves, needles, bark, with a birch's own white and gold, moss, dry
  leaves, a fungus's pale stalk; snow laid on what faces up where the realm is cold; each point times its baked light.

## The wind

Gust fronts about 74 m apart roll down the realm's wind (its mist's drift, `data/fogs.ts`) at some 11 m/s, their line bent across the
wind, with smaller gusts in them and the whole rising and falling over half a minute. A plant leans by its height squared (`aSway`) as a
front reaches it and swings back at its own slow pace (each plant its own phase); each bough sways on a phase of its own, quicker the
finer it is, bobbing as well as swinging (`aWind.y`, `aWind.w`); each leaf card's free corners and each blade's tip shiver about their
facing (`aWind.z`); a bowed leaf or blade catches the moon (a silver wave over a field). A gale (`uWind`, the weather's) drives all of it
harder. The same gust is read on the CPU (`gustAt`) by the leaves let go, the people's coats and the leaves' rustle.
