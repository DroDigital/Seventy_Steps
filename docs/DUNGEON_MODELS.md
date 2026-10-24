# The dungeons' models (round 74)

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
| 41 PSX Shelves (Horror) | Munchkin Gaming | free commercial use, no redistribution as assets | `ps_*` (5) | the University Library's halls, the Archives, Zann's garret |
| 42 Modular Cathedral Kit | SigilsVault | CC0 | `ca_*` (3) | the steeple, the ballroom |
| 43 Sewers Modular Assets | RotoPoly | CC0 | `sw_*` (6) | Y'ha-nthlei, Curwen's pens, the swamp tomb |
| 44 Kyle's Mushroom Pack | Kyle Fuji | CC0 | `mu_*` (5) | Nkai, the Mi-Go cities |
| 45 Poly Haven | Poly Haven | CC0 | `ph_mirror`, `ph_pipes`, `ph_bottle`, `ph_roots` | the ballroom, Lilith, the Waite study, the cold plant, the bottle gallery, the cellars |
| 46 Lab Assets | MilkAndBanana | CC0 | `lb_*` (7) | Curwen's laboratory, the alchemist's, the Shunned House's cellar |
| 47 Retro Modular House | Elegant Crow | CC0 | `rh_*` (7) | the lodgings and farmhouses' halls |
| 48 Modular Cave Kit | Kenney | CC0 | `kc_gate_rock`, `kc_gate_bars` | Nkai and the Elder City's tunnel mouths, Curwen's pens |
| 49 Retro Fantasy Kit | Kenney | CC0 | `kf_*` (4) | Leng, Kadath, the Whateley loft, the captain's house |
| 50 Curtains | Heliona | CC BY | `cu_curtains` | Lilith's shrine |
| 51 Prayer Wheel | Özlem Çandır | CC BY | `pw_wheel` | the High Priest's monastery on Leng |
| 52 Old Gramophone | KIFIR | CC BY | `og_gramophone` | Akeley's study |
| 53 Old Church Bell | vertexgrocer | CC BY | `cb_bell` | the Starry Wisdom steeple |
| 54 Bust of Apollo | davdadams | CC BY | `ba_bust` | Hypnos' studio |

Pieces are placed as render dressing with colliders only where a body would stand in them (the pieces named `solids='none'` are walked through: glass, boards, rubble, candles). Hall pieces are never in the fight's circle and never across a doorway.

New machinery in the set placer: `wall(r, step, {walls})` lays a row of candidates along the walls of a room, `face: 'wall'` turns each square to its wall, and `hung` stands a piece against a wall instead of clear of it (a shelf, a boarded window); an ordinary room's set draws the fight's circle smaller (`ROOM_INNER`) and keeps clear only the spots its own things use.

## What is not in, and why

- **Not supplied or not reachable without a sign-in:** Menhirs (DragonJojo), Crookes X-ray Tube, Stage Curtains (daedaljs), Victorian Gothic Hallway, Modular Props House Interior, Environment Library, Old Military Compressor. Sketchfab needs a sign-in; upload the zips and they go in through the same manifests (the Church Bell, Gramophone, Prayer Wheel, Curtains and Bust of Apollo came in that way, packs 50 to 54).
- **Not done, and said so by the brief itself:** the glass, liquid, reflection, wax and animated sand it asks for need renderer support that the opaque bake does not have; a mirror here is a framed dark panel, the hourglass and jars have no contents that move. The bespoke forms (Keziah's impossible angles, the Voice's telephone, Zann's viol, the Elder Things' fivefold columns, Kadath's domes, Umr's causeways) were not made.
- **The Bust of Apollo** is the model as made, reduced and recoloured as stone; no laurel, poppy crown or other change to what it shows was made, since the licence's change notice names only what was done.
- **Left out after baking:** the PSX Dungeon's skull wall, whose skulls are in its texture (a baked face keeps one colour, so it came out a plain slab).
- **The PSX Shelves pack is AI-assisted** by its own listing: docs/STORE_PAGE.md lists it in the AI disclosure. Its licence forbids reselling or redistributing the assets themselves; the shelves here are modified, baked into the game's own model data and not offered on their own.
