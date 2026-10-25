# Credits: the arena models

The pieces of the arenas that are models (`pack.ts`, drawn by `src/render/modelKit.ts`) are cut from the kits of **Kenney** (www.kenney.nl),
released under **Creative Commons Zero (CC0 1.0)**, http://creativecommons.org/publicdomain/zero/1.0/ , which asks for no credit; it is given.
They were made again for the game by `tools/models/bake_models.py`: each model welded and flattened, its colours kept only as light and dark
(the game lays the region's own over them), its size fitted to the metres it is stood at.

## Graveyard Kit 5.0
https://kenney.nl/assets/graveyard-kit

`crypt_small`, `grave_cross`, `grave_round`, `grave_wide`, `grave_broken`, `cross`, `cross_wood`, `coffin`, `altar_stone`, `column`, `urn`, `iron_fence`, `iron_fence_broken`, `iron_gate`, `lightpost`, `pine_crooked`, `rocks_tall`, `candles`, `bench`, `lantern`, `skeleton`, `hay_bale`, `shovel_dirt`, `chalice`, `bowl`

## Nature Kit
https://kenney.nl/assets/nature-kit

`log`, `stump_old`, `mushroom_tall`, `rock_tall`, `statue_obelisk`, `statue_column`, `statue_head`, `lily`, `statue_ring`

## Castle Kit
https://kenney.nl/assets/castle-kit

`wall_ruin`

## Pirate Kit
https://kenney.nl/assets/pirate-kit

`wreck`, `rowboat`, `barrel`, `chest`, `rocks_sand_a`, `rocks_sand_b`, `flag_pirate`, `cannon`, `crate`

## Survival Kit
https://kenney.nl/assets/survival-kit

`signpost`, `tent`, `fish`, `bedroll`

## Fantasy Town Kit 2.0
https://kenney.nl/assets/fantasy-town-kit

`fountain`, `hedge`, `cart`


---

# Credits: the boss places (round 71)

The nineteen outdoor boss places (`src/world/places/`, docs/BOSS_PLACES.md) are built of models cut from the packs below by `tools/models/bake_boss_models.py` (manifests in `tools/models/boss/`), into `bossIndex.ts` and `bossPack.ts`. Each model was **modified for the game**: read from its source with Blender's importers, its meshes selected and joined, textures reduced to the face's colour and a material class, decimated where heavy, welded, flattened, scaled to the metres it stands at, and given its colliders and flame anchors; the figures of Pack 13 were also posed, their heads taken off and their proportions stretched (the blind dancers). Nothing is loaded as a source file at run time. Pieces marked `proc` are built in code (`tools/models/boss/proc*.py`) and owe nothing to a pack.

The packs' own licences remain authoritative. The two **CC BY 4.0** packs by BlenderVoyage (Packs 05 and 06), the **CC BY 4.0** Columnar Basalt by bobjh (Pack 17) and, from round 72, the eight **CC BY 4.0** Sketchfab models of Packs 22 to 29 (Marin PETTE, 3D Vault, Bruno Macchioni, Bl4ckGh0st twice, mynameismary, Animex and zacharykozak) are credited as asked, with their licence (https://creativecommons.org/licenses/by/4.0/) and the changes above; the rest are CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/), which asks for nothing, and are credited for provenance.

**Pack 07, Jen Abbott's Egyptian Temple Complex (Fab Standard License), is not baked, shipped or committed**: that licence does not allow its raw assets to be republished, and a model baked from it would carry them. The Colossus's temenos is made of Pack 08's temple, Pack 09's ruins, forms built in code and, from round 72, the pylon of Pack 24 (a different Egyptian temple, CC BY 4.0) instead (docs/BOSS_PLACES.md).

## Pack 01 — 3D Retro Medieval/Fantasy Building Kit
By chilly_durango, https://chilly-durango.itch.io/medieval-building-parts, licensed CC0 1.0.

`fh_wall`, `fh_wall_door`, `fh_wall_win`, `fh_wall_winl`, `fh_wall_thin`, `fh_roof_c`, `fh_hearth`, `fh_beam`, `fh_beam_lean`, `fh_beam_drop`, `fh_post`, `fh_floor`, `fh_table`, `fh_bed`, `fh_trunk`, `fh_crate`, `fh_stove`, `fh_shelf`, `fh_pane`

## Pack 02 — Nature Kit
By Kenney, https://kenney.nl/assets/nature-kit, licensed CC0 1.0.

`nt_menhir_a`, `nt_menhir_b`, `nt_menhir_c`, `nt_menhir_d`, `nt_stone_flat`, `nt_canoe`, `nt_log`, `nt_stump`, `nt_reed`, `nt_lily`, `nt_bush`

## Pack 03 — Ultimate Stylized Nature
By Quaternius, https://quaternius.com/packs/ultimatestylizednature.html, licensed CC0 1.0.

`st_maple_3`, `st_rock_1`, `st_rock_3`, `st_rock_4`, `st_rock_5`

## Pack 04 — 3D Retro Shacks Shanties Sheds & Gantries
By chilly_durango, https://chilly-durango.itch.io/3dretroshacks, licensed CC0 1.0.

`ms_shack`, `ms_leanto`, `ms_shed_a`, `ms_shed_b`, `ms_rail`, `ms_rail_post`, `ms_pallet`, `ms_barrel`, `ms_barricade`, `ms_platform`, `ms_pole`

## Pack 05 — PSX Style Modular Low Poly Graveyard — Free Edition
By BlenderVoyage, https://blendervoyage.itch.io/psx-style-low-poly-modular-graveyard, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); modified as above.

`gy_wall`, `gy_pillar`, `gy_rail`, `gy_stone_1`, `gy_stone_4`, `gy_stone_7`, `gy_coffin`, `gy_coffin_lid`, `gy_grave`, `gy_tree_1`, `gy_tree_2`, `gy_flag`

## Pack 06 — PSX Style Low Poly Modular Castle
By BlenderVoyage, https://blendervoyage.itch.io/psx-style-modular-castle, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); modified as above.

`cs_wall`, `cs_tower_corner`, `cs_tower`, `cs_temple`, `cs_temple_tower`

## Pack 08 — Modular Temple Pack
By Keith at Fertile Soil Productions, https://fertile-soil-productions.itch.io/temple-modular-collection, licensed CC0 1.0.

`tp_col_base`, `tp_col_mid`, `tp_col_top`, `tp_beam`, `tp_arch`, `tp_wall_mid`, `tp_wall_win`, `tp_doorway`, `tp_door_leaf`, `tp_door_sun`, `tp_door_moon`, `tp_tower_bot`, `tp_tower_top`, `tp_stairs`, `tp_floor`, `tp_floor_ruin_1`, `tp_floor_ruin_2`, `tp_rubble_1`, `tp_rubble_2`, `tp_vase_1`, `tp_vase_2`, `tp_vase_3`, `tp_flag_sun`, `tp_flag_moon`, `tp_flag_stars`, `tp_flag_eclipse`

## Pack 09 — Ultimate Modular Ruins
By Quaternius, https://quaternius.com/packs/ultimatemodularruins.html, licensed CC0 1.0.

`rn_arch_goth`, `rn_wall_broken`, `rn_bricks`, `rn_torch`, `rn_flag`, `rn_cart`, `rn_barrel`

## Pack 13 — Human Basemeshes
By pistachio, https://opengameart.org/content/human-basemeshes, licensed CC0 1.0.

`fg_dance_a`, `fg_dance_b`, `fg_dance_c`, `fg_dance_d`, `fg_seat`

## Pack 15 — 3D dungeon debris — skull and bones
By Paul Wortmann, https://opengameart.org/content/3d-dungeon-debris-skull-and-bones, licensed CC0 1.0.

`bn_pile_skull`, `bn_ribcage`, `bn_spine`, `bn_leg`, `bn_skull_pyramid`

## Pack 16 — Hexagon Kit
By Kenney, https://kenney.nl/assets/hexagon-kit, licensed CC0 1.0.

`hx_tile`, `hx_hill`, `hx_mountain`, `hx_rocks`, `hx_tower`

## Pack 17 — Columnar Basalt
By bobjh, https://opengameart.org/content/columnar-basalt, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); modified as above.

`bs_low`, `bs_mid`, `bs_a`, `bs_b`, `bs_c`

## Pack 18 — Dungeon Pack 1.1 — FREE
By Kay Lousberg, https://kaylousberg.itch.io/kaykit-dungeon-pack, licensed CC0 1.0.

`dg_stairs_wide`

## Pack 19 — Dead trees (Low-poly)
By Goth Scarecrow, https://goth-scarecrow.itch.io/dead-trees, licensed CC0 1.0.

`gt_dead_3`, `gt_dead_4`, `gt_dead_5`, `gt_dead_6`, `gt_dead_8`, `gt_dead_9`

## Pack 20 — Alien buildings extension pack
By rubberduck, https://opengameart.org/content/alien-builings-extension-pack, licensed CC0 1.0. Its paint was thrown away and the light and dark of it kept in a pale metal-stone, its bright technological accents left out.

`ay_wall`, `ay_pylon`, `ay_bastion`, `ay_passage`, `ay_portal`, `ay_dome`, `ay_gantry`

## Pack 21 — Modular Wooden Pier
From Poly Haven, https://polyhaven.com/a/modular_wooden_pier, licensed CC0 1.0.

`mp_deck`, `mp_frame`

## Pack 22 — Roman theater of Palmyra
By Marin PETTE, https://sketchfab.com/3d-models/roman-theater-of-palmyra-d092d5223f424600a9dc06e295782305, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: the cavea cut into a wedge of twenty degrees (its apex and outer rows cut away), scaled, decimated and given its colliders; two of its columns cut out and stood alone.

`hs_cavea`, `hs_col_tall`, `hs_col_mid`

## Pack 23 — Wajia Flute
By 3D Vault, https://sketchfab.com/3d-models/wajia-flute-e6d1c436d3bc41f99f49b5dc2c821b2f, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: stood on end, scaled up many times and stretched, darkened to black bone, decimated, and in one model cut to its foot.

`wf_flute`, `wf_flute_low`

## Pack 24 — Egyptian Temple
By Bruno Macchioni, https://sketchfab.com/3d-models/egyptian-temple-5d71635d05d14a32b58cd852c16752fa, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: the whole temple cut away but its pylon, the two sloping towers and the gate between them, which was scaled to the gate of the court and given its colliders. (This is not Pack 07.)

`eg_pylon`

## Pack 25 — Low Poly Black Castle
By Bl4ckGh0st, https://sketchfab.com/3d-models/low-poly-black-castle-57cd59cff9014e1abbe276457e555413, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: its ground and interior floors left out, every piece decimated and the whole joined, scaled and stretched to the keep it stands as, and given a collider.

`hc_castle`

## Pack 26 — Theatre stage
By mynameismary, https://sketchfab.com/3d-models/theatre-stage-5c53624a0a334242ad04d7a11a2dcf8e, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: only its curtains and valance kept, recoloured from red to a weathered yellow.

`hs_curtain`

## Pack 27 — Snake statue
By Animex, https://sketchfab.com/3d-models/snake-statue-4bb50218740942bf93153cc6910f0924, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: decimated, scaled to eight metres and given a collider about its coil.

`yg_snake`

## Pack 28 — Temple Ruins Asset Pack
By Bl4ckGh0st, https://sketchfab.com/3d-models/temple-ruins-asset-pack-d1e25cdbe51e467a87baf94ead0afa63, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: the pieces taken singly, the statues (24,000 faces each) decimated, all scaled and given colliders.

`tr_statue_a`, `tr_statue_b`, `tr_statue_c`, `tr_statue_d`, `tr_statue_e`, `tr_pillar_tall`, `tr_pillar_tall_b`, `tr_pillar`, `tr_pillar_b`, `tr_pillar_vb`, `tr_arch`, `tr_arch_b`, `tr_wall_win_b`, `tr_wall_b`

## Pack 29 — Ancient Ruins (Modular)
By zacharykozak, https://sketchfab.com/3d-models/ancient-ruins-modular-c277e5acad5849bc913e76d3fdbf32a3, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: its two-storey arcade cut out of the whole (the pier and rubble removed), decimated, scaled and given a collider.

`ar_arcade`


# Credits: the arenas' gates (round 76)

The leaves of the gates of the open arenas (`gateIndex.ts` + `gatePack.ts`, hung by `src/data/gateStyles.ts`, `render/gateRig.ts`) are cut from free models,
**Creative Commons Zero (CC0 1.0)**, which asks for no credit (it is given), but for the serpent's head of Yig's gate (w20), the spiked ring of the Court's (w21) and the temple front of the Threshold's (w22), which are **CC BY 4.0** and credited as it asks. They were made again for the game by `tools/models/bake_boss_models.py`
from `tools/models/boss/manifest_gates.py` (`tools/models/gates/fetch.py` fetches the sources): each leaf taken singly, decimated, its colours kept only as
light and dark (the game lays the arena's own over them) and its size fitted to the metres it hangs at. The gates also hang models of the packs credited above
(the temple doors, the standing stones, the flutes, the basalt and the dead trees). Changes are named for each.

## Gate source w01 — Large Iron Gate
By Josh Dean, Poly Haven, https://polyhaven.com/a/large_iron_gate, licensed CC0 1.0. Changes: its two leaves taken apart, decimated to about 2,600 faces each, the frame left out, recoloured by the arena's dye and stretched to fit the opening.

`gate_iron_l`, `gate_iron_r`

## Gate source w02 — Large Castle Door
By Tina, Poly Haven, https://polyhaven.com/a/large_castle_door, licensed CC0 1.0. Changes: its two leaves and its frame taken apart, the leaves decimated to about 1,600 faces each, the straps and hinges given the metal class and the planks the wood, recoloured by the arena's dye and stretched to fit the opening.

`gate_timber_l`, `gate_timber_r`, `gate_timber_frame`

## Gate source w03 — Namaqualand Boulder 03
By Jenelle van Heerden (modelling) and Dario Barresi (photography), Poly Haven, https://polyhaven.com/a/namaqualand_boulder_03, licensed CC0 1.0. Changes: decimated to about 1,100 faces, given the rock class and stretched to close a ford.

`gate_boulder`

## Gate source w10 — Castle Kit
By Kenney (www.kenney.nl), https://kenney.nl/assets/castle-kit, licensed CC0 1.0. Changes: its metal gate taken singly, turned to face the court, recoloured by the arena's dye (and, for Yig's, turned over) and stretched to fit the opening.

`gate_portcullis`

## Gate source w20 — Aztec Double-Headed Serpent for printing
By corentin (https://sketchfab.com/corentin), https://sketchfab.com/3d-models/aztec-double-headed-serpent-for-printing-0781a78d31914f00a1b19a61b69113d2, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: one of its two halves taken, its head cut from the neck and the coil and the cut closed, the three pieces the viewer split it into joined, decimated to about 8,000 faces, turned to face along the wall, recoloured by the arena's dye and scaled to the gate's opening.

`gate_yig_head`

## Gate source w21 — Demons Gate
By Trockk (https://sketchfab.com/Timrockk), https://sketchfab.com/3d-models/demons-gate-0207f4cafdfa476cb96512a899788c55, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: decimated to about 6,000 faces, given the metal class, recoloured by the gate's dye, and stretched to the gate's opening and flattened to half the wall's thickness.

`gate_demon_ring`

## Gate source w22 — Epic Alien Temple Door (animated)
By Jungle Jim (https://sketchfab.com/jungle_jim), https://sketchfab.com/3d-models/epic-alien-temple-door-animated-1b2860e267b047f38488cf3ca4d3533b, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: only the carved temple front taken (its door leaves, its three halls and its ground left out), cut in two down its doorway and the cuts closed, decimated to about 9,000 faces each, colours kept only as light and dark under the gate's dye, turned about to face the court and stretched to the gate's opening.

`gate_alien_l`, `gate_alien_r`

# Credits: the web parts (round 78)

The `wk_*` models of the `web` set (`webIndex.ts` + `webPack.ts`, baked from `tools/models/boss/manifest_web.py`, stood in nine courts; candidates and licences: `docs/WEB_PARTS.md`) are all CC0 1.0, which asks for no credit; it is given.

## Web source kenney — Kenney's kits
https://kenney.nl/assets (Graveyard Kit, Space Kit, Nature Kit, Tower Defense Kit, Mini Arena, City Kit (Industrial)), **CC0 1.0**.

`wk_coffin` (coffin-old), `wk_crypt` (crypt-large), `wk_skeleton` (character-skeleton), `wk_cross` (gravestone-cross-large), `wk_keeper` (character-keeper), `wk_meteor` (meteor_detailed), `wk_crater` (craterLarge), `wk_crystals` (rock_crystalsLargeA), `wk_crystal` (detail-crystal-large), `wk_mushroom_a`, `wk_mushroom_b` (mushroom_redTall, mushroom_tanTall), `wk_statue` (mini-arena statue), `wk_generator` (machine_generatorLarge), `wk_pipe_ring` (pipe_ringHigh), `wk_tank` (detail-tank-large). Changes: welded and flattened to the game's faces, sized in metres, a figure's separate parts made one.

## Web source quaternius — Quaternius's packs on OpenGameArt
https://opengameart.org/users/quaternius (Ultimate Space Kit, Modular Dungeon, Medieval Village Pack), **CC0 1.0**.

`wk_tree_spikes`, `wk_tree_spiral` (Tree Spikes, Tree Spiral), `wk_horse` (Statue_Horse, with its pedestal), `wk_well` (Well), `wk_candelabrum` (Candelabrum_tall). Changes: decimated, welded and flattened to the game's faces, sized in metres; the candelabrum has five flame anchors.

## Web source oga — single models on OpenGameArt
**CC0** (the licence line of each page read): `wk_egg` (Strange Egg, Umplix, https://opengameart.org/content/strange-egg), `wk_knight` (Knight statue, yd, https://opengameart.org/content/knight-statue), `wk_throne` (Barbarian throne, eugeneloza, https://opengameart.org/content/opendungeons-barbarian-throne), `wk_pyramid` (Pyramid 3d, Intrix, https://opengameart.org/content/pyramid-3d). Changes: the pieces of a statue made one, decimated, welded and flattened to the game's faces, sized in metres.
