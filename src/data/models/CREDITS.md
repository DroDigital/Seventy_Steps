# Credits: the arena models

The pieces of the arenas that are models (`pack.ts`, drawn by `src/render/modelKit.ts`) are cut from the kits of **Kenney** (www.kenney.nl),
released under **Creative Commons Zero (CC0 1.0)**, http://creativecommons.org/publicdomain/zero/1.0/ , which asks for no credit; it is given.
They were made again for the game by `tools/models/bake_models.py`: each model welded and flattened, its colours kept only as light and dark
(the game lays the region's own over them), its size fitted to the metres it is stood at.

## Graveyard Kit 5.0
https://kenney.nl/assets/graveyard-kit

`crypt`, `crypt_small`, `grave_cross`, `grave_round`, `grave_wide`, `grave_broken`, `cross`, `cross_wood`, `coffin`, `altar_stone`, `column`, `urn`, `iron_fence`, `iron_fence_broken`, `iron_gate`, `lightpost`, `pine_crooked`, `trunk`, `rocks_tall`, `candles`, `bench`, `pumpkin_carved`, `lantern`, `skeleton`, `hay_bale`, `shovel_dirt`, `chalice`, `bowl`

## Nature Kit
https://kenney.nl/assets/nature-kit

`cactus`, `canoe`, `log`, `stump_old`, `mushroom_tall`, `rock_large`, `rock_tall`, `plant_bush`, `statue_obelisk`, `statue_column`, `statue_head`, `lily`, `statue_ring`, `cliff`

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

The packs' own licences remain authoritative. The two **CC BY 4.0** packs by BlenderVoyage (Packs 05 and 06) and the **CC BY 4.0** Columnar Basalt by bobjh (Pack 17) are credited as asked, with their licence (https://creativecommons.org/licenses/by/4.0/) and the changes above; the rest are CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/), which asks for nothing, and are credited for provenance.

**Pack 07, Jen Abbott's Egyptian Temple Complex (Fab Standard License), is not baked, shipped or committed**: that licence does not allow its raw assets to be republished, and a model baked from it would carry them. The Colossus's temenos is made of Pack 08's temple, Pack 09's ruins and forms built in code instead (docs/BOSS_PLACES.md).

## Pack 01 — 3D Retro Medieval/Fantasy Building Kit
By chilly_durango, https://chilly-durango.itch.io/medieval-building-parts, licensed CC0 1.0.

`fh_wall`, `fh_wall_door`, `fh_wall_win`, `fh_wall_winl`, `fh_wall_thin`, `fh_roof_c`, `fh_hearth`, `fh_beam`, `fh_beam_lean`, `fh_beam_drop`, `fh_post`, `fh_floor`, `fh_table`, `fh_bed`, `fh_trunk`, `fh_crate`, `fh_stove`, `fh_shelf`, `fh_pane`

## Pack 02 — Nature Kit
By Kenney, https://kenney.nl/assets/nature-kit, licensed CC0 1.0.

`nt_menhir_a`, `nt_menhir_b`, `nt_menhir_c`, `nt_menhir_d`, `nt_stone_flat`, `nt_canoe`, `nt_log`, `nt_stump`, `nt_reed`, `nt_lily`, `nt_bush`

## Pack 03 — Ultimate Stylized Nature
By Quaternius, https://quaternius.com/packs/ultimatestylizednature.html, licensed CC0 1.0.

`st_dead_6`, `st_dead_8`, `st_dead_10`, `st_maple_3`, `st_rock_1`, `st_rock_3`, `st_rock_4`, `st_rock_5`

## Pack 04 — 3D Retro Shacks Shanties Sheds & Gantries
By chilly_durango, https://chilly-durango.itch.io/3dretroshacks, licensed CC0 1.0.

`ms_shack`, `ms_leanto`, `ms_shed_a`, `ms_shed_b`, `ms_rail`, `ms_rail_post`, `ms_gantry`, `ms_pallet`, `ms_barrel`, `ms_barricade`, `ms_platform`, `ms_pole`

## Pack 05 — PSX Style Modular Low Poly Graveyard — Free Edition
By BlenderVoyage, https://blendervoyage.itch.io/psx-style-low-poly-modular-graveyard, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); modified as above.

`gy_wall`, `gy_pillar`, `gy_rail`, `gy_stone_1`, `gy_stone_4`, `gy_stone_7`, `gy_coffin`, `gy_coffin_lid`, `gy_grave`, `gy_tree_1`, `gy_tree_2`, `gy_flag`

## Pack 06 — PSX Style Low Poly Modular Castle
By BlenderVoyage, https://blendervoyage.itch.io/psx-style-modular-castle, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); modified as above.

`cs_wall`, `cs_tower_corner`, `cs_tower`, `cs_temple`, `cs_temple_tower`, `cs_stairs_1`

## Pack 08 — Modular Temple Pack
By Keith at Fertile Soil Productions, https://fertile-soil-productions.itch.io/temple-modular-collection, licensed CC0 1.0.

`tp_col_base`, `tp_col_mid`, `tp_col_top`, `tp_beam`, `tp_arch`, `tp_pil_base`, `tp_wall_mid`, `tp_wall_win`, `tp_ruin_half_1`, `tp_doorway`, `tp_door_leaf`, `tp_door_sun`, `tp_door_moon`, `tp_tower_bot`, `tp_tower_top`, `tp_stairs`, `tp_floor`, `tp_floor_ruin_1`, `tp_floor_ruin_2`, `tp_rubble_1`, `tp_rubble_2`, `tp_vase_1`, `tp_vase_2`, `tp_vase_3`, `tp_flag_sun`, `tp_flag_moon`, `tp_flag_stars`, `tp_flag_eclipse`

## Pack 09 — Ultimate Modular Ruins
By Quaternius, https://quaternius.com/packs/ultimatemodularruins.html, licensed CC0 1.0.

`rn_arch_goth`, `rn_wall_broken`, `rn_bricks`, `rn_deadtree_1`, `rn_deadtree_2`, `rn_deadtree_3`, `rn_torch`, `rn_flag`, `rn_cart`, `rn_barrel`

## Pack 10 — Colosseum
By CreativeTrio, https://poly.pizza/m/83ftBPyiSf, licensed CC0 1.0.

`co_seg`

## Pack 11 — Space Base Bits — FREE
By Kay Lousberg, https://kaylousberg.itch.io/space-base-bits, licensed CC0 1.0.

`yd_tower_tall`, `yd_tower_low`, `yd_drill`, `yd_tunnel`, `yd_dome_a`, `yd_dome_e`

## Pack 13 — Human Basemeshes
By pistachio, https://opengameart.org/content/human-basemeshes, licensed CC0 1.0.

`fg_dance_a`, `fg_dance_b`, `fg_dance_c`, `fg_dance_d`, `fg_stone_run`, `fg_stone_shield`, `fg_stone_crouch`, `fg_stone_plead`, `fg_seat`

## Pack 14 — LoFi3D Modular Pipes
By Philip_Erd, https://philip-erd.itch.io/lofi3d-modular-pipes, licensed CC0 1.0.

`dp_pipe_4`, `dp_pipe_open`

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
