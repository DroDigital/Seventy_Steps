# The dungeons' models (round 79)

The asset brief for every dungeon (*Seventy Steps: free assets for every dungeon and boss room*, 28 dungeons, 290 rooms, 43 free sources) names models for each place and says what to make of them. This is what of it is in the game, how it was brought in, and what is not.

## How a model comes in

The rule is the boss places' (docs/BOSS_PLACES.md, `src/data/models/CREDITS.md`): a source model is **baked**, never loaded.

1. A pack is unpacked to `<work>/pNN/` (the ten Sketchfab models were downloaded by the game's author, since they need a sign-in; the itch.io, Kenney, Poly Haven and OpenGameArt packs were downloaded as the brief links them) and a manifest `tools/models/boss/manifest_pNN.py` says which piece of it is a model, how large it stands, what it is made of and what a body cannot walk through.
2. `python3 -I tools/models/bake_boss_models.py <work> --only <ids> --sheet out.png` reads it with Blender's importers and writes the model into `src/data/models/bossIndex.ts` and `bossPack.ts`. New in this round: `drop_alpha` leaves out the faces of a glass whose texture is mostly clear, so a brain shows in its jar.
3. `python3 -I tools/models/boss/mapping.py > docs/BOSS_MODELS.md` lists every model, its pack, its size and where it stands.
4. The model is stood by a *set*: `data/hallSets*.ts` for the boss halls, **`data/roomSets.ts` (new) for the rooms that are no boss's**, by the same machinery (`world/hallSet.ts`, `world/arenaSet.ts`), so that a piece keeps off the walls, the doorways, the room's own things and the fight's circle.

`tests/arenaSets.test.ts` keeps every baked model stood by some set, `tests/hallSets.test.ts` and `tests/roomSets.test.ts` keep each set inside its walls and under its roof, and `tests/hallSets.test.ts` keeps every model of these packs that a set names standing in some dungeon (a put can be written and never fit its hall: a great piece with no room in the fight's circle is written as a `heart` at the hall's edge, clear of the gate's side).

## What is in

| Pack | By | Licence | Models | Stands in |
|---|---|---|---|---|
| 30 Alembic | FlukierJupiter | CC BY | `al_still` | Charles le Sorcier's laboratory |
| 31 American Old Barn | andrewriddle | CC BY | `wf_barn` | the Whateley loft |
| 32 Armillary sphere | KRei | CC BY | `uv_armillary` | the Archives, the Ultimate Void |
| 33 Brain in a Jar | Mad_Lobster_Workshop | CC BY | `mg_jar` | Akeley's study, the Mi-Go cylinders |
| 34 Brazier | Jochon | CC BY | `ss_brazier` | the Stairs of Slumber (threshold, cavern, gate) |
| 35 Coral | rkuhlf | CC BY | `yh_coral_a/b/c` | Y'ha-nthlei, the Elder City |
| 36 Gothic Cloaked Figure | INGSOC1984 | CC BY | `rl_priest` | Ghatanothoa's temple |
| 37 Hourglass | carismah | CC BY | `uv_hourglass` | the Ultimate Void, Hypnos' studio |
| 38 Museum Showcase | Oneironauticus | CC BY | `mg_case` | Rhan-Tegoth's wax museum |
| 39 Stone Altar | TheoClarke | CC BY | `sh_altar` | Sentinel Hill's summit |
| 40 PSX Dungeon | Goblinatron | CC BY | `pd_*` (8) | the Outsider's ballroom, the Hound's tombs, Lilith's shrine, Curwen's vault |
| 42 Modular Cathedral Kit | SigilsVault | CC0 | `ca_*` (3) | the steeple, the ballroom |
| 43 Sewers Modular Assets | RotoPoly | CC0 | `sw_*` (6) | Y'ha-nthlei, Curwen's pens, the swamp tomb |
| 44 Kyle's Mushroom Pack | Kyle Fuji | CC0 | `mu_*` (5) | Nkai, the Mi-Go cities |
| 45 Poly Haven | Poly Haven | CC0 | `ph_mirror`, `ph_pipes`, `ph_compressor`, `ph_bottle`, `ph_roots` | the ballroom, Lilith, the Waite study, the cold plant (pipes and compressors), the bottle gallery, the cellars |
| 46 Lab Assets | MilkAndBanana | CC0 | `lb_*` (7) | Curwen's laboratory, the alchemist's, the Shunned House's cellar |
| 47 Retro Modular House | Elegant Crow | CC0 | `rh_*` (7) | the lodgings and farmhouses' halls |
| 48 Modular Cave Kit | Kenney | CC0 | `kc_gate_rock`, `kc_gate_bars` | Nkai and the Elder City's tunnel mouths, Curwen's pens |
| 49 Retro Fantasy Kit | Kenney | CC0 | `kf_*` (4) | Leng, Kadath, the Whateley loft, the captain's house |
| 50 Curtains | Heliona | CC BY | `cu_curtains` | Lilith's shrine |
| 51 Prayer Wheel | Özlem Çandır | CC BY | `pw_wheel` | the High Priest's monastery on Leng |
| 52 Old Gramophone | KIFIR | CC BY | `og_gramophone` | Akeley's study |
| 53 Old Church Bell | vertexgrocer | CC BY | `cb_bell` | the Starry Wisdom steeple |
| 54 Bust of Apollo | davdadams | CC BY | `ba_bust` | Hypnos' studio |

Pieces are placed as render dressing with colliders only where a body would stand in them (the pieces named `solids='none'` are walked through: glass, boards, rubble, candles). Hall pieces are never in the fight's circle (but a `heart`'s: the great pieces at a hall's edge) and never across a doorway.

New machinery in the set placer: `wall(r, step, {walls})` lays a row of candidates along the walls of a room, `face: 'wall'` turns each square to its wall, and `hung` stands a piece against a wall instead of clear of it (a shelf, a boarded window); an ordinary room's set draws the fight's circle smaller (`ROOM_INNER`) and keeps clear only the spots its own things use.

## What is clear, wet, silvered and waxen (round 79)

A face of a baked model has a class byte, and four classes beside the old ones are drawn as what they are (`GLASS` 12, `LIQUID` 13, `MIRROR` 14, `WAX` 15: tools/models/boss/sources.py, render/modelKit.ts). The bake finds them three ways: by a material's name (`classes={'Architectural_Glass': S.GLASS}`), by a texture's clearness (`glass_alpha`: a jar's wall, an hourglass's bulbs, the faces whose texture is clearer than the given share are glass and are kept), and by geometry (`plane`: the flat panel in a mirror's frame, found as the faces that face the front at the depth of the glass). `fill` builds a liquid inside a vessel as a body of revolution under its glass, from the vessel's own profile (tools/models/boss/fill.py). Each is a material of its own in propMeshes (`glassware`, `liquid`, `wax`, `mirror`), the world shader with a `SURF_*` define (shaders/surfaces.ts):

- **Glass** is clear until seen aslant or when it catches a lamp; a pale band crosses it as the eye moves.
- **Liquid** is lit from within, ripples at its top, turns slowly and has the odd bubble rising; it is drawn under its glass.
- **Wax** takes the lamps through itself, warm at its edges (a put's `wax: true` draws a whole figure so: the museum's effigies).
- **A mirror is a mirror**: when the eye stands before a hall's mirror and looks toward it, the scene is drawn once more from the eye's image behind the glass, small, with the mirror left out and what lies behind the wall cut away by an oblique near plane (render/mirrorView.ts, mirrorMath.ts), and the glass shows that, dimmed, cooled and a little tarnished; where none is drawn it is a dark silvered panel. One mirror at a time, the nearest; it is drawn only while its glass is in the picture, and every other frame; the player and the horror are in it.

Models that wear them: the brain jars and museum cases (glass, fluid), the retort, flasks and bottles of the laboratories (glass, liquid), the bottle gallery (glass, wine, cork), the still, the hourglass, the compressor's gauge, the candles (wax), the ballroom's, the Waite study's and Lilith's mirrors.

## What is not in, and why

- **Supplied, not yet in** (the Drive folder 'missing assets - seventy steps'): Menhirs (DragonJojo: Sentinel Hill's ring and Ghatanothoa's court), Victorian Gothic Hallway (BenKiplinger: Muñoz's rooms, the Waite house), Modular Props - House Interior (JordanPowell: the Witch House, the alchemist's cellars, the Waite house, Zann's garret) and Stage Curtains (daedaljs: the Kadath hall, the Outsider's ballroom). The folder is a Google Drive one, which the connector gives up only as inline text, and archives of tens of megabytes cannot go that way; attached to the chat as the first fifteen were, they go in through the same manifests.
- **Not supplied:** Crookes X-ray Tube (Jagiellonian University Museum: the Shunned House cellar; the brief says its 842,886-triangle scan is to be rebuilt and baked, never imported raw) and Environment - Library (anaroeto: the University Library; a donor of over a million triangles to take apart).
- **Taken from its source:** the Old Military Compressor (Poly Haven, CC0) is baked as `ph_compressor` for the cold plant, its gauge's glass made glass; the brief asks for its military markings to go, and a baked face keeps one colour, so they went with the texture.
- **Glass, liquid, reflection and wax are drawn** (render/shaders/surfaces.ts; see below). Not done: the hourglass's sand does not run (it needs a per-grain animation the bake does not carry) and the glass does not crack. The bespoke forms the brief asks for (Keziah's impossible angles, the Voice's telephone, Zann's viol, the Elder Things' fivefold columns, Kadath's domes, Umr's causeways) were not made.
- **The Bust of Apollo** is the model as made, reduced and recoloured as stone; no laurel, poppy crown or other change to what it shows was made, since the licence's change notice names only what was done.
- **Left out after baking:** the PSX Dungeon's skull wall, whose skulls are in its texture (a baked face keeps one colour, so it came out a plain slab).
- **Left out for its licence:** Pack 41, Munchkin Gaming's PSX Shelves (Horror) (free for commercial use but "not to be resold or redistributed as assets", and AI-assisted by its own listing). A baked model is the game's data, shipped with every build, which is a redistribution of the asset in a different form; the repo already keeps pack 07 out for the same reason, and `tests/bossPlaces.test.ts` now keeps pack 41 out too. The University Library's cases and shelves, the Archives' record cases and the garret's book piles are built in code instead (`render/setShapesBooks.ts`).
