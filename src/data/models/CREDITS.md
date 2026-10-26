# Credits: the arena models

> Seventy Steps itself is © 2026 Alessandro A. Foddis (DigitalDro), all rights reserved (see `LICENSE`). This file credits the work of others:
> the licences named here (CC0, CC BY, OFL, Apache and the like) apply to that work only, never to the game.

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

# Credits: the dungeon models (round 79)

Models for the dungeons' rooms and boss halls, from the asset brief for every dungeon (`docs/DUNGEON_MODELS.md`), baked by the same tool as the packs above (`tools/models/bake_boss_models.py`, manifests `tools/models/boss/manifest_p30.py` to `manifest_p54.py`) into `bossIndex.ts` and `bossPack.ts`. Each was **modified for the game**: read from its source with Blender's importers, its meshes selected and joined, textures reduced to each face's colour and a material class, decimated, welded, scaled to the metres it stands at, recoloured where noted and given its colliders; nothing is loaded as a source file at run time. The fifteen Sketchfab models were downloaded by the game's author (they need a sign-in) and are credited as their licence asks, with the changes made.

## Pack 30 — Alembic
This work is based on "Alembic" (https://sketchfab.com/3d-models/alembic-811618ea79ba4aac95d7f7312a2128ec) by FlukierJupiter (https://sketchfab.com/FlukierJupiter) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Changes: scaled to a still of a metre and a half, given one collider and recoloured copper; used in Charles le Sorcier's laboratory.

`al_still`

## Pack 31 — American Old Barn
This work is based on "American Old Barn" (https://sketchfab.com/3d-models/american-old-barn-1d0b768a8e2449de990b3f69f94c5db6) by andrewriddle (https://sketchfab.com/andrewriddle) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Changes: decimated to 1,500 faces, scaled to eleven metres across and given colliders about its timbers; stood in the Whateley loft.

`wf_barn`

## Pack 32 — Armillary sphere
This work is based on "Armillary sphere" (https://sketchfab.com/3d-models/armillary-sphere-534e240ac6b0412cb526dd2b14bf8909) by KRei (https://sketchfab.com/krei1012) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Changes: decimated from 19,800 to 2,600 faces, scaled and given a collider; stood in the Archives of the Great Race and at the Ultimate Void.

`uv_armillary`

## Pack 33 — Brain in a Jar
This work is based on "Brain in a Jar" (https://sketchfab.com/3d-models/brain-in-a-jar-b95791959dc74dc6a0d39bd4f563ab90) by Mad_Lobster_Workshop (https://sketchfab.com/Mad_Lobster_Workshop) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Changes: the glass faces left out so that the brain shows, scaled and given a collider; tinted as a metal cylinder in the halls of the Mi-Go and at Akeley's.

`mg_jar`

## Pack 34 — Brazier
This work is based on "Brazier" (https://sketchfab.com/3d-models/brazier-4240c44c853e42429fa9ac35de2300b9) by Jochon (https://sketchfab.com/jochon) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Changes: scaled and given a collider and a flame anchor at its bowl; the eternal fires of the Stairs of Slumber.

`ss_brazier`

## Pack 35 — Coral
This work is based on "Coral" (https://sketchfab.com/3d-models/coral-dbf4bee13bf84396815073e5cabf8ac3) by rkuhlf (https://sketchfab.com/rkuhlf) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Changes: three of its corals taken singly, scaled, given colliders and recoloured pale; Y'ha-nthlei and the Elder City.

`yh_coral_a`, `yh_coral_b`, `yh_coral_c`

## Pack 36 — Gothic Cloaked Figure - Building Wall Statue
This work is based on "Gothic Cloaked Figure - Building Wall Statue" (https://sketchfab.com/3d-models/gothic-cloaked-figure-building-wall-statue-e9c199b05aea4e88abe830be0b154195) by INGSOC1984 (https://sketchfab.com/INGSOC1984) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Changes: decimated to 2,400 faces, scaled to a figure of three and a half metres and given a collider; the priests of Mu in the temple of Ghatanothoa.

`rl_priest`

## Pack 37 — Hourglass
This work is based on "Hourglass" (https://sketchfab.com/3d-models/hourglass-f480fadf47424bc4ae37bfa16a4de924) by carismah (https://sketchfab.com/carismah) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Changes: decimated to 2,200 faces, scaled and given a collider; at the Ultimate Void and in the sculptor's studio.

`uv_hourglass`

## Pack 38 — Museum Showcase - Die Vitrine
This work is based on "Museum Showcase - Die Vitrine" (https://sketchfab.com/3d-models/museum-showcase-die-vitrine-8ac020233ece4deabdb308e19b1453ba) by Samuel Francis Johnson (Oneironauticus) (https://sketchfab.com/oneironauticus) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Changes: the glass left out, scaled and given a collider; the cases of the wax museum of Rhan-Tegoth.

`mg_case`

## Pack 39 — Stone Altar
This work is based on "Stone Altar" (https://sketchfab.com/3d-models/stone-altar-3d4f2edb18e4424cabb41b60aa160cb5) by TheoClarke (https://sketchfab.com/TheoClarke) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Changes: decimated to 1,800 faces, scaled to four and a half metres and given a collider; the table-stone of Sentinel Hill.

`sh_altar`

## Pack 40 — PSX Dungeon
By Goblinatron, https://goblinatron.itch.io/psx-dungeon, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: eight of its crypt pieces taken singly (the broken and fallen pillars, a chain, a chandelier, spikes, two candles, rubble), their textures reduced to a colour for each face, scaled and given colliders where they stand in the way.

`pd_pillar_broken`, `pd_pillar_fallen`, `pd_chain`, `pd_chandelier`, `pd_spikes`, `pd_candle_a`, `pd_candle_b`, `pd_debris`

## Pack 42 — Modular Cathedral Kit
By SigilsVault, https://sigilsvault.itch.io/modular-cathedral-kit, CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/): asks for nothing, credited for provenance. Changes: two columns and a railing taken singly, scaled and given colliders.

`ca_column`, `ca_column_small`, `ca_railing`

## Pack 43 — Sewers Modular Assets
By RotoPoly, https://rotopoly.itch.io/sewers-modular-assets, CC0 1.0: credited for provenance. Changes: a pipe stood upright, the huge pipe, two barred grilles, a support and brick rubble taken singly, scaled and given colliders.

`sw_pipe_big`, `sw_pipe_huge`, `sw_grille`, `sw_bars`, `sw_support`, `sw_rubble`

## Pack 44 — Kyle's Mushroom Pack
By Kyle Fuji, https://kyle-fuji.itch.io/kyles-mushroom-pack, CC0 1.0: credited for provenance. Changes: five mushrooms (a turkey tail, a reishi, a blue oyster, a morel, a lantern mushroom) grown to the height of a knee and more and tinted by each place.

`mu_bracket`, `mu_reishi`, `mu_oyster`, `mu_morel`, `mu_lantern`

## Pack 45 — Poly Haven
'Ornate Mirror 01', 'Modular Industrial Pipes 01', 'Old Military Compressor', 'Wine Bottles 01' and 'Pine Roots', https://polyhaven.com, CC0 1.0: credited for provenance. Changes: each reduced hard (the mirror to 1,100 faces, the pipes to 2,500, the compressor to 700, the roots to 2,800), the bottle taken singly with its label left out and its glass, wine and cork given the classes of glassware, liquid and wood, the mirror's glass made a mirror, the compressor's gauge glass made glass, scaled and given colliders where they stand in the way.

`ph_mirror`, `ph_pipes`, `ph_compressor`, `ph_bottle`, `ph_roots`

## Pack 46 — Lab Assets
By MilkAndBanana, https://opengameart.org/content/lab-assets, CC0 1.0: credited for provenance. Changes: a retort, a Florence flask, a round-bottomed flask, a reagent bottle, a ring stand, a Bunsen burner and a microscope taken singly (none of the counters, electronics or safety gear), their glass tinted amber and grey, scaled.

`lb_retort`, `lb_florence`, `lb_round`, `lb_reagent`, `lb_stand`, `lb_burner`, `lb_microscope`

## Pack 47 — Retro Modular House Pack
By Elegant Crow, https://elegantcrow.itch.io/retro-modular-house-pack, CC0 1.0 (the photographs that ship beside it, which have terms of their own, are not used): credited for provenance. Changes: a boarded door and window, closed shutters, a loose plank, a double window, a door and a flight of stairs taken singly and scaled; the stairs given a collider.

`rh_boarded_door`, `rh_boarded_window`, `rh_shutter`, `rh_plank`, `rh_window`, `rh_door`, `rh_stair`

## Pack 48 — Modular Cave Kit
By Kenney, https://kenney.nl/assets/modular-cave-kit, CC0 1.0: credited for provenance. Changes: the rock gate and the barred gate taken singly, scaled and given colliders about their openings.

`kc_gate_rock`, `kc_gate_bars`

## Pack 49 — Retro Fantasy Kit
By Kenney, https://kenney.nl/assets/retro-fantasy-kit, CC0 1.0: credited for provenance. Changes: a column, a broken column, a barrel stack and a pulley taken singly and scaled; the first three given colliders.

`kf_column`, `kf_column_broken`, `kf_barrels`, `kf_pulley`

## Pack 50 — Curtains
This work is based on "Curtains" (https://sketchfab.com/3d-models/curtains-a83e1baf822a4442b0f50ed70d449198) by Heliona (https://sketchfab.com/Heliona) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Changes: decimated, scaled to four and a half metres across and coloured by the game's cloth and metal; hung in Lilith's shrine.

`cu_curtains`

## Pack 51 — Prayer Wheel
This work is based on "Prayer Wheel" (https://sketchfab.com/3d-models/prayer-wheel-8da83b65c713447586d7e6182d78dd06) by Özlem Çandır (https://sketchfab.com/OzlemCandir) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Changes: turned upright on its post, scaled to one and a half metres, coloured by the game's metal and given a collider on its post; the wheels of the High Priest's monastery on Leng.

`pw_wheel`

## Pack 52 — Old Gramophone
This work is based on "Old Gramophone" (https://sketchfab.com/3d-models/old-gramophone-5e892fc786db4ca1b36738ab5e40e64d) by KIFIR (https://sketchfab.com/kifir) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Changes: decimated, scaled to a metre and a little more and given a box collider; the phonograph in Akeley's study.

`og_gramophone`

## Pack 53 — Old Church Bell
This work is based on "old church bell" (https://sketchfab.com/3d-models/old-church-bell-8aa10771481c4a0d83f7a47af6fdf9e1) by vertexgrocer (https://sketchfab.com/vertexgrocer) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Changes: decimated to 1,500 faces, scaled to one and a half metres and coloured by the game's metal; the bell of the Starry Wisdom steeple.

`cb_bell`

## Pack 54 — Bust of Apollo
This work is based on "Bust of Apollo" (https://sketchfab.com/3d-models/bust-of-apollo-fdaf490184d04e45bbd2afe8a1555a67) by davdadams (https://sketchfab.com/davdadams) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Changes: decimated to 2,000 faces, scaled to a metre and a tenth, coloured as stone and given a box collider. It is the bust as made, reduced and recoloured, with no laurel, crown or other change to what it shows; it stands in Hypnos' studio.

`ba_bust`

## Flames, smoke and surface patterns (round 79)

- **Pixel flames.** 'Fire' by ZomBCool, https://opengameart.org/content/fire-0, CC0 1.0: credited for provenance. Changes: its four frames of `fire_3.gif` reduced to a heat mask and a coverage mask (`tools/flames/bake_flames.py`, `src/data/flameAtlas.ts`) and coloured in code (`src/render/flames.ts`).
- **Smoke puffs.** 'Smoke Particles' by Kenney (Kenney Vleugels), https://kenney.nl/assets/smoke-particles, CC0 1.0: credited for provenance. Changes: four of the white puffs reduced to 24 x 24 coverage masks, in the same atlas.
- **PS1 surface patterns.** The 64 x 64 textures `TEX_Wall_03`, `TEX_Ground_04` and `TEX_Planks_01` of Pack 40 (Goblinatron's PSX Dungeon, https://goblinatron.itch.io/psx-dungeon, licensed CC BY 4.0, https://creativecommons.org/licenses/by/4.0/). Changes: reduced to each texel's brightness against the texture's own average (`tools/psx/bake_psx_textures.py`, `src/data/psxDetail.ts`), laid over the world's procedural stone, flagstone and plank textures (`src/render/textures.ts`) and coloured by the realms' grades.

## Particle marks (round 87, the quiet blows)

- **Marks of a blow.** 'Particle Pack' (1.1) by Kenney (Kenney Vleugels), https://kenney.nl/assets/particle-pack, CC0 1.0: credited for provenance (its `License.txt` reads: Creative Commons Zero, CC0). Changes: three sprites of it, `scratch_01.png` (the 'scratch' mark), `dirt_01.png` (the 'dust' mark) and `trace_04.png` (the 'wisp' mark), are turned along +x, thickened, levelled and reduced to 32 x 32 coverage masks, and the mottle of `smoke_05.png` gives the fray of the 'smear' mark (`tools/marks/bake_marks.py`, `src/data/markAtlas.ts`, drawn by `src/render/particles.ts` and `src/render/markAtlas.ts`, coloured in code). The 'splat' and 'twirl' marks are made in the baker and are not from any sprite.
