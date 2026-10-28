# Dungeon boss halls that would gain from the models we have, and from new ones (a survey)

Asked ("ALL other boss arenas and assets currently in use"; "swarm it with haiku agents"): look at every boss hall and say what stands there, what is weak, and what mixes would help. Six read-only surveyors (Haiku) took
the 27 boss halls, the original `?arena` ground and the library's and the Stairs of Slumber's room sets, as they stand on #174's branch (the working tree has the older sets), against the catalogue of 307 baked models
(`px_*` shapes made in code, `pd_*` PSX dungeon pieces and the rest) and the hall rules (`world/hallSet.ts`: a heart may stand in the fight circle, one solid heart at most; nothing else in it, off the doors, off the walls).
They were told which categories of web part the game lacked (`docs/WEB_PARTS.md`, G1 to G11).

**Read this as a shortlist, not a plan.** They read code and the catalogue, not renders; none of their positions was checked against the halls' walls, doors and the closure audits. The halls' sets are on #174, which is not merged: nothing here is built, and
the web parts baked for the arenas (`wk_*`, `src/data/models/webIndex.ts`) are not yet stood in any hall. After #174 lands, the useful first step is the weak-piece column: a procedural `px_*` shape standing where a real model would read better.

| hall | the horror, the place | richness (1 to 5) | best mix (as reported) |
| --- | --- | --- | --- |
| `the_outsider` | The Outsider, The Crypt Below the Castle | 3 | ph_mirror (heart, 150°, as now) + rn_wall_broken, a pair either side at 0.9 radius (side 3 m, face wall) + candles x3, lit, scattered 0.85–0.9 in arc 120–180°, in front of the glass: a ruined wall framing a mirror that holds the flames. |
| `the_hound` | The Hound, The Old Churchyard | 3 | bn_skull_pyramid x2 and bn_pile_skull x2, scattered 0.86–0.95 in the back half where the skeletons stood: the ossuary's bones, heaped by robbers. |
| `the_unnamable` | The Unnamable, The Deserted House | 3 | kf_pulley hung from the roof beam beside the stair (30°, 0.85 radius, lift 2.4 m) + rh_shutter x2 hung on the side walls, clear of the boards: a hoist and shutters, hung rather than standing. |
| `voice_in_the_tomb` | The Voice in the Tomb, The Tomb in the Swamp | 3 | tp_rubble_1 x2 and tp_rubble_2 x2, scattered 0.82–0.97, walk-over, in place of sw_rubble; bn_skull_pyramid x2 at 0.9, arc 80–280, at the niches' feet: the dead the Voice keeps. |
| `shunned_house_entity` | The Shunned House entity, The Shunned House | 2 | mu_bracket x3, hung on the brick wall at 0.93, arc 60–300, and mu_oyster x4, scattered 0.85–0.95 at the wall foot, in place of mushroom_tall: pale shelf fungus from Kyle's pack (CC0). |
| `zann_window_thing` | The Thing Beyond Erich Zann's Window, Rue d'Auseil | 3 | ms_barricade at 180°, between the rh_window panes; rh_shutter as a pair over the panes, closed (rh_shutter also stands in other halls). The viol held the thing back; a barricade and shutters are what would. |
| `tsathoggua` | Tsathoggua, Tsath | 3 | bn_pile_skull ×2 at 150° and 210°, bn_skull_pyramid ×1 at 180°, all at r 0.88: what he ate, heaped about the sleeper. |
| `high_priest` | High Priest Not to Be Described, Ulthar to Kadath | 4 | tp_flag_sun ×4 (cloth, 2.4 m) at r 0.95, 60°, 120°, 240°, 300°, hung between the columns: the silk the priest hides behind. |
| `great_ones` | The Great Ones, Ulthar to Kadath | 3 | hs_curtain (16 m weathered yellow drape, CC BY) on the far wall at 180°, r 0.9, as the throne's hanging; tr_statue_b and tr_statue_d (stone worshippers) at r 0.85, 150° and 210°. |
| `ghatanothoa` | Ghatanothoa, Risen R'lyeh | 3 | tr_statue_a, tr_statue_c, tr_statue_e (stone men, CC BY) at r 0.9, 100° to 260°, between the stones, facing in: men turned to stone by its sight. |
| `whisperer` | Whisperer in Darkness, Akeley Farmhouse | 4 | og_gramophone (in, 120°, kept); mg_jar ring (0.9, 60–300°, kept); fh_shelf ×3 hung on the far wall (180°, face 'wall', at 0.972); fh_table at 0.9, 180° (the desk beside the chair). Why: Akeley's records and cylinders in a study of shelves and a desk, the voice coming from its records. |
| `shoggoth` | Shoggoth, Elder Thing City | 3 | kc_gate_rock heart (90°, 0.57, kept); bs_b ×5 ring at 0.92 (arc 40–320°) in place of the column ring (CC BY, credited); statue_obelisk (130°, kept); statue_head at 0.95, 180° (a face on the far side looking at the way in). Why: basalt columns of a city "of a cut that is no one's", and a face for a thing that makes eyes and mouths at will. |
| `flying_polyp` | Flying Polyp, Archives of the Great Race | 4 | uv_armillary heart (150°, kept); statue_ring (180°, kept); tr_pillar_b and tr_pillar_vb scatter ×4 at 0.88–0.99 (arc 60–300°) in place of column (CC BY, credited); bookcase ring kept. Why: the Great Race's bronze resonator among pillars broken before their time. |
| `dr_munoz` | Dr Muñoz, Muñoz's Rooms | 3 | ph_compressor pair (130° and 230°, in, kept); ph_pipes ring (0.95, 60–300°, kept); kf_barrels ×4 scatter 0.84–0.97 (80–280°) in place of the crates and barrels; built pipes dropped; lantern kept. Why: the ammonia engine, its pipework and its drums. |
| `charles_le_sorcier` | Charles le Sorcier, Cellars of the Castle | 4 | al_still heart (150°); lb_stand (130°); lb_retort ×3, lb_round ×3, lb_florence ×2 scatter 0.8–0.95; altar_stone pair (130° and 230°); skeleton (180°); candles ×8 lit; lb_burner ×3 and lb_reagent ×3 scatter 0.82–0.97 in place of the urns, barrels, chalices and bowls. Why: an alchemist's bench of flasks, burners and reagents around the still. |
| `rhan_tegoth` | Rhan-Tegoth, Mi-Go Cities | 4 | statue_head (CC0) at 180 deg, 0.97, in place of the idol; ba_bust x2 (CC BY, credited) between the cases at 90 and 270 deg; cu_curtains (CC BY, credited) hung behind the head: the god among a museum's busts. |
| `umr_at_tawil` | Umr at-Tawil, The Ultimate Void | 3 | tr_pillar_tall x6 (CC BY, credited) at 0.8 on the ring at 0.97, arc 50-310, in place of the six column: the city's own columns. |
| `arena` | the ?arena ground, no horror | 1 | kf_column (CC0) x20 at 1.9x (1.5 m across, 8 m tall) on the colonnade spots. |
| `roomSets` | no horror: University Library, five rooms; Stairs of Slumber, three | 2 | rh_window x3 (CC0) hung high on the reading hall's walls between the bays: the room under its high windows. |
| `keziah_mason` | Keziah Mason, The Witch House | 3 | fh_bed at 0.92/265 (the bedroll's spot); fh_trunk on ring 0.93, arc 60-300 (the chests); fh_crate scattered 0.82-0.97, arc 50-310 (the crates). A hag's pallet and trunks in the house's own timber. |
| `dunwich_horror` | the Dunwich Horror, Sentinel Hill | 3 | nt_menhir_a and nt_menhir_c, six on ring 0.84-0.98, arc 40-320, in place of rock_tall: the hill's own standing stones about the table-stone, outside the fight circle. |
| `father_dagon` | Father Dagon, Y'ha-nthlei's temple | 3 | tp_col_mid on ring 0.96, arc 60-300, in place of column; tp_rubble_1 and tp_rubble_2 scattered 0.85-0.97, face free, in place of rocks_sand_a: the drowned temple's own fallen stone (CC0). |
| `joseph_curwen` | Joseph Curwen, Curwen's Catacombs | 4 | ph_bottle x6 scattered 0.8-0.94, face free, in place of urn: glass vessels the candles catch, as on his tables (CC0). |
| `haunter_of_the_dark` | the Haunter of the Dark, Starry Wisdom Church | 4 | cu_curtains hung on the far wall (180, wall face, join, size 1.2): drawn across the louvres, the dark the Haunter cannot leave (CC BY, credited). |
| `lilith` | Lilith, The Vaults under Red Hook | 4 | tp_col_base + tp_col_mid (mid lifted 2.4 m, 4.8 m total, under the roof's 5 m) at ring 0.92, arc 60-300, replacing column: a half-Eastern colonnade (0 deg = entry, r a share of 23 m). |
| `terrible_old_man` | The Terrible Old Man, The Old Captain's House | 3 | fish, hung on the shutter walls (wall helper, walls 90 and 270, size 1.4), and rowboat at(0.9, 200, face in): a boat kept indoors (0 deg = entry, r a share of 23 m). |
| `wilbur_whateley` | Wilbur Whateley, The Whateley Farmhouse | 4 | fh_post at(0.9, 110) and at(0.9, 250), each with an fh_beam_lean at lift 2.0: the farmhouse's timber frame in wf_barn's place (0 deg = entry, r a share of 23 m). |
| `ephraim_waite` | Ephraim Waite, The Waite House | 4 | mg_jar x3 (brain in a jar, CC BY), scatter 3 at r 0.84-0.94, arc 100-260 (0 deg = entry, r a share of 23 m): glass vessels holding the bodies he left. |
| `hypnos` | Hypnos, The Sculptor's Tower | 4 | tr_statue_b at(0.9, 180, face in) in place of statue_head; one ba_bust at(0.9, 215); tp_col_base + tp_col_mid (mid lifted 2.4 m) at ring 0.92, arc 60-300, in place of column: a marble figure and Greek columns (0 deg = entry, r a share of 23 m). |

## The six surveys, as reported

One block for each hall: what it stands now and how it reads, the weak pieces, up to three mixes with exact ids, the web parts it wants (categories G1 to G11 of `docs/WEB_PARTS.md`), and the risk.

```
HALL the_outsider (The Outsider, The Crypt Below the Castle) -- richness 3
Now: ph_mirror (heart, 150°, far wall), ca_column and column (two rings of six, whole), pd_chandelier (two, floating 3 m up), statue_head, coffin (x3), iron_gate, grave_broken (x5), skeleton: 9 kinds around one focal mirror, no light, nothing hung. It reads as a tidy hall, not the ruin its notes describe.
Weak in use: pd_chandelier -> a fallen iron candelabra on the floor, 1.5 m, G5; ca_column and column (whole, though the set calls them broken) -> kf_column_broken, a broken shaft, G9; ph_mirror is also in the lilith and ephraim_waite halls.
Mix 1 (best): ph_mirror (heart, 150°, as now) + rn_wall_broken, a pair either side at 0.9 radius (side 3 m, face wall) + candles x3, lit, scattered 0.85–0.9 in arc 120–180°, in front of the glass: a ruined wall framing a mirror that holds the flames.
Mix 2: kf_column_broken x4, ring at 0.95, arc 50–310, size 1.0–1.2, replacing ca_column and column.
Mix 3: pd_chandelier at lift 0, x2, scattered 0.86–0.97, arc 90–270: fallen, as its own note says.
Wanted web part(s): a fallen iron candelabra on its side with broken arms, about 1.5 m, G5.
Risk: judged from catalogue sizes, triangle counts and names, not renders; ph_mirror repeats in two other halls.
```

```
HALL the_hound (The Hound, The Old Churchyard) -- richness 3
Now: pd_pillar_broken (x3), pd_pillar_fallen (x2), pd_debris (x4), pd_spikes (x2), coffin (x6 in a ring, facing out), skeleton (x4), urn (x5), cross, grave_cross (x3), chest (140°, 0.94, face in), bench: 11 kinds. The stone reads and the chest gives a focus, but there is no light and nothing hangs.
Weak in use: skeleton (x4, standing kenney figures) -> bone heaps for an ossuary, G1; chest (kenney pirate-kit chest, a ship's prop in a churchyard) -> an iron-bound reliquary casket for the jade charm, about 0.8 m, G8.
Mix 1 (best): bn_skull_pyramid x2 and bn_pile_skull x2, scattered 0.86–0.95 in the back half where the skeletons stood: the ossuary's bones, heaped by robbers.
Mix 2: bn_ribcage x1, bn_spine x1, bn_leg x2, walk-over, scattered 0.86–0.95 by the coffins: remains thrown from the opened coffins.
Mix 3: none.
Wanted web part(s): an open stone sarcophagus with its lid pushed aside, about 2.5 m, G1; an iron-bound reliquary casket with a hinged lid, about 0.8 m, G8.
Risk: judged from catalogue sizes, triangle counts and names, not renders; the solid heaps may be pushed out of their band by the coffin ring at 0.92.
```

```
HALL the_unnamable (The Unnamable, The Deserted House) -- richness 3
Now: rh_boarded_window (boards on both side walls), rh_plank (x6), ph_roots (x4), chest (x5, ring), crate (x5), hay_bale (x3), barrel (x3), grave_wide (230°, 0.95), candles (x8, lit): 9 kinds. The boards and candles make a room, but the chests, crates and barrels are a ship's kit, and nothing focal or hung sits in it.
Weak in use: chest, barrel and crate (kenney pirate-kit props) in an Arkham attic -> a leather-strapped steamer trunk, about 0.9 m, G11; ph_roots (also in voice_in_the_tomb and shunned_house_entity) -> keep it, since the only other root, px_root, is 9 m wide.
Mix 1 (best): kf_pulley hung from the roof beam beside the stair (30°, 0.85 radius, lift 2.4 m) + rh_shutter x2 hung on the side walls, clear of the boards: a hoist and shutters, hung rather than standing.
Mix 2: bn_leg x2 and bn_ribcage x1, scattered 0.86–0.95 among the chests: the dead the tale does not name.
Mix 3: kf_barrels x2, arc 90–270, 0.85–0.95, in place of the pirate barrels.
Wanted web part(s): a leather-strapped steamer trunk, about 0.9 m, G11; a dead willow's root mass, 2–3 m, G2.
Risk: judged from catalogue sizes and names, not renders; the attic's roof height is not in the data, so a pulley topping out at 4 m may meet a low beam.
```

```
HALL voice_in_the_tomb (The Voice in the Tomb, The Tomb in the Swamp) -- richness 3
Now: ph_roots (x5), sw_rubble (x4), sw_pipe_huge (heart, 150°, tinted dark), crypt_small (x4 in a ring, facing in), coffin (x3), urn (x5), wall_ruin (a pair at 130°), grave_cross (x3), candles (x7, lit): 9 kinds. The niches and candles make a tomb, but its focus is a sewer culvert, its rubble is sewer concrete, and nothing moves or hangs.
Weak in use: sw_pipe_huge (heart) -> a wooden telegraph pole with a slack wire, about 6 m, G10, since the wire's end is the tale's point; sw_rubble -> tp_rubble_1 and tp_rubble_2 (temple stone rubble, CC0).
Mix 1 (best): tp_rubble_1 x2 and tp_rubble_2 x2, scattered 0.82–0.97, walk-over, in place of sw_rubble; bn_skull_pyramid x2 at 0.9, arc 80–280, at the niches' feet: the dead the Voice keeps.
Mix 2: pd_chain (CC BY, already credited) 3.6 m, at 0.92, 170°, lift 2.6 m, beside the culvert: a thin line from the vault down to the pipe, the wire.
Mix 3: none.
Wanted web part(s): a wooden telegraph pole with a slack wire down a wall, about 6 m, G10; a stone sarcophagus with a closed lid, about 2.5 m, G1.
Risk: judged from catalogue sizes and names, not renders; a pole would take the culvert's one heart slot, so the culvert must go if the pole is used.
```

```
HALL shunned_house_entity (The Shunned House entity, The Shunned House) -- richness 2
Now: rh_stair (heart, 150°, far wall), ph_roots (x6), lb_reagent (x4 carboys), lb_stand, lb_microscope, barrel (x6), crate (x4), mushroom_tall (x6), shovel_dirt, wall_ruin, log: 11 kinds. A crowd of lab kit, casks and roots, with no light, nothing hung and no focal piece in the fight's circle.
Weak in use: mushroom_tall (48 triangles, the only fungus, 1.6–2.6 m) -> the G3 growth in Mix 1; lb_microscope at size 2.2 (1.8 m tall) and lb_reagent at 2.0–2.4 (1.4–1.7 m) are far too large -> size 0.5 (0.4 m) and size 1.0 (0.7 m); barrel and crate are pirate-kit props.
Mix 1 (best): mu_bracket x3, hung on the brick wall at 0.93, arc 60–300, and mu_oyster x4, scattered 0.85–0.95 at the wall foot, in place of mushroom_tall: pale shelf fungus from Kyle's pack (CC0).
Mix 2: px_pod x3, scattered 0.86–0.95, arc 160–230, near the heart: the growth's pods, under the house.
Mix 3: bn_pile_skull x2, scattered 0.85–0.93 by the shovel, arc 60–300: what the thing fed on.
Wanted web part(s): a cluster of spongy egg-sacs on a stalk, about 1.5 m, G3.
Risk: judged from catalogue sizes and names, not renders; px_pod is procedural, the kind the brief warns can look cheap, so drop Mix 2 if it reads as a barrel.
```

```
HALL zann_window_thing (The Thing Beyond Erich Zann's Window, Rue d'Auseil) -- richness 3
Now: rh_window (mirrored pair), bookpile (built), bedroll, chest, crate, iron_fence_broken, skeleton, bowl, candles (eight, lit); nine kinds. A lit storeroom with two dark windows: light and a focal piece, but the rest reads as clutter.
Weak in use: iron_fence_broken (2.2 m graveyard fence) -> a wrought-iron window grille about 1 m, G8.
Mix 1 (best): ms_barricade at 180°, between the rh_window panes; rh_shutter as a pair over the panes, closed (rh_shutter also stands in other halls). The viol held the thing back; a barricade and shutters are what would.
Mix 2: fg_seat at about 150°, r 0.85, arms forward as if bowing a viol.
Mix 3: none.
Wanted web part(s): a bass viol with bow on a stool, 1.9 m, G8 (no instrument category exists; nearest).
Risk: the barricade and the seated figure may block the line from the door to the windows.
```

```
HALL tsathoggua (Tsathoggua, Tsath) -- richness 3
Now: kc_gate_rock (cave-mouth heart, 90°), mu_reishi, mu_bracket, mu_oyster, mu_lantern, mu_morel, mushroom_tall, idol (built), rocks_tall, skeleton, bowl; six groups. A grotto of fungus around one black cave mouth, nothing lit or moving, under the open sky of a cobbled court.
Weak in use: idol (built, a Bokrug-style saurian at 0.6) -> a squat black stone toad-god with bulging eyes, 1.2 m, G7; skeleton -> a heap of skulls and long bones, G1 (mix 1).
Mix 1 (best): bn_pile_skull ×2 at 150° and 210°, bn_skull_pyramid ×1 at 180°, all at r 0.88: what he ate, heaped about the sleeper.
Mix 2: ss_brazier ×2 at r 0.9, 60° and 300°, lit: 'torch' (CC BY): a sated sleeper in brazier light.
Mix 3: none.
Wanted web part(s): a squat black stone toad-god idol, bulging eyes, 1.2 m, G7.
Risk: the cave reading depends on the kit (an open-roofed cobbled court) this brief does not touch.
```

```
HALL high_priest (High Priest Not to Be Described, Ulthar to Kadath) -- richness 4
Now: pw_wheel (five), kf_column (six), kf_column_broken (mirrored pair), banner (built, six), bench, statue_head, column, bowl, candles (nine, lit); nine kinds. Wheels, hung banners and lit candles give the monastery life; the stone head at the far wall is the one focal piece.
Weak in use: statue_head (generic human head) -> a stone head under a yellow silk mask, 2.5 m, G7; banner (built torn strip) -> a yellow silk banner with a long fringe, 2.5 m, G9.
Mix 1 (best): tp_flag_sun ×4 (cloth, 2.4 m) at r 0.95, 60°, 120°, 240°, 300°, hung between the columns: the silk the priest hides behind.
Mix 2: tp_vase_2 ×2 and tp_vase_3 ×1 at r 0.9, 90° and 270°, by the wheels: offering jars.
Mix 3: wf_flute at 180° in place of statue_head (12 m bone flute stood on end, CC BY): the flute he plays; one does not look at his hands.
Wanted web part(s): a stone priest's head under a yellow silk mask, 2.5 m, G7.
Risk: the 12 m flute belongs to the Daemon Pipers' court, and tp_flag_sun's colour is not in its manifest.
```

```
HALL great_ones (The Great Ones, Ulthar to Kadath) -- richness 3
Now: kf_column (six, onyx tint), column (eight), statue_column (four), statue_obelisk (mirrored pair), hexped (five, built, purple glow), banner (four, built); six kinds. Glowing pedestals and hung banners give light and life, but there is no seat and one column kind repeats eight times.
Weak in use: statue_obelisk (nature-kit obelisk, 5 m), the focal pair -> a seated colossal god on a stone throne, face worn away, 5 m, G7; column ×8 -> broken onyx pillars (mix 2).
Mix 1 (best): hs_curtain (16 m weathered yellow drape, CC BY) on the far wall at 180°, r 0.9, as the throne's hanging; tr_statue_b and tr_statue_d (stone worshippers) at r 0.85, 150° and 210°.
Mix 2: tr_pillar_tall ×2 (7 m) and tr_pillar_tall_b ×2 (5 m, broken) at r 0.93, 60°, 120°, 240°, 300°: great columns in pairs.
Mix 3: none.
Wanted web part(s): a seated colossal god on a stone throne, face worn away, 5 m, G7.
Risk: the drape and the worshippers take the far wall at r 0.9, so a 5 m seat must be the hall's one heart or be left out.
```

```
HALL ghatanothoa (Ghatanothoa, Risen R'lyeh) -- richness 3
Now: rl_priest (five, hooded in relief), trilith (five, built), skull_pole (nine, built), idol (built, far wall), totem (three, built), skeleton (three); six kinds. Two rings of stones and skulls make a strong circle, but nothing is lit or hung and the far idol is too small to hold the eye.
Weak in use: idol (a built saurian at 0.55) -> a stone idol of a shapeless mass with one great eye, 2.5 m, G7; trilith (built) -> real standing stones (mix 3).
Mix 1 (best): tr_statue_a, tr_statue_c, tr_statue_e (stone men, CC BY) at r 0.9, 100° to 260°, between the stones, facing in: men turned to stone by its sight.
Mix 2: bn_pile_skull ×2 and bn_skull_pyramid ×1 at r 0.88, 150° to 210°, in place of two skull poles: the bones of those who looked.
Mix 3: nt_menhir_a ×2 (2.7 × 5.2 × 3.1 m) at r 0.93, 60° and 300°, in place of two trilithons: Mu's standing stones, real ones.
Wanted web part(s): a stone idol of a shapeless mass with one great eye, 2.5 m, G7.
Risk: the menhirs and stone men at the ring may hide the far idol from the door, leaving the one focal piece unseen.
```

```
HALL whisperer (Whisperer in Darkness, Akeley Farmhouse) -- richness 4
Now: og_gramophone (in, 120°), rh_window and rh_shutter (hung on the side walls), rh_plank ×4, mg_jar (ring of 6 at 0.9, 3 scattered), pipes ×7 (built, green glow), crate ×5, chest, barrel ×3, lantern ×4 (lit), bench (235°). Eleven kinds in a timber study: lamps, glow and a gramophone make a focal, but the pirate-kit boxes read as a ship's hold.
Weak in use: pipes (built round column) -> a brass phonograph horn, about 2 m, G10; crate, chest, barrel (pirate kit) -> a farmhouse dresser or trunk, about 1.2 m, G11; bench (graveyard kit) -> a rocking chair, about 1 m, G11.
Mix 1 (best): og_gramophone (in, 120°, kept); mg_jar ring (0.9, 60–300°, kept); fh_shelf ×3 hung on the far wall (180°, face 'wall', at 0.972); fh_table at 0.9, 180° (the desk beside the chair). Why: Akeley's records and cylinders in a study of shelves and a desk, the voice coming from its records.
Mix 2: fh_hearth hung on the far wall (180°, lit) in place of the shelves, with fh_stove at 0.95, 150°. Why: a hearth beside the empty chair, a warm light the room lacks.
Mix 3: none.
Wanted web part(s): a high-backed farmhouse armchair with a seated mannequin, about 1.6 m, G7; a brass phonograph horn, about 2 m, G10.
Risk: a new seat or horn nearer than 0.85 of the radius reaches the fight circle (0.78), so keep new pieces at 0.85 and beyond.
```

```
HALL shoggoth (Shoggoth, Elder Thing City) -- richness 3
Now: kc_gate_rock (heart at 0.57, 90°: the only solid in the fight circle), yh_coral_c (pair at 60° and 300°), yh_coral_a ×2, column ring ×6, statue_obelisk (130°), statue_ring ×4, hexped ×5 (built, purple glow), rocks_tall ×3. Eight kinds under an open sky: a stone court lit by purple plinths, its dark coral reading as sea life rather than a city.
Weak in use: column ×6 (a graveyard Gothic column in a basalt city) -> columnar basalt (Mix 1); yh_coral_a and yh_coral_c (sea coral) -> black ice spires, about 3 m, G6; hexped ×5 (built plinth, shared with flying_polyp) -> a cyclopean basalt drum with a carved rim, about 1.5 m, G5; rocks_tall's scatter runs to 1.15 of the radius, past the wall.
Mix 1 (best): kc_gate_rock heart (90°, 0.57, kept); bs_b ×5 ring at 0.92 (arc 40–320°) in place of the column ring (CC BY, credited); statue_obelisk (130°, kept); statue_head at 0.95, 180° (a face on the far side looking at the way in). Why: basalt columns of a city "of a cut that is no one's", and a face for a thing that makes eyes and mouths at will.
Mix 2: ss_brazier ×3 lit (scatter 0.84–0.92, arc 60–300°) in place of the five hexped. Why: pale fire among the stone where the city has no sun.
Mix 3: none.
Wanted web part(s): a cyclopean basalt drum with a carved rim, about 1.5 m, G5; a cluster of glossy black pods, about 2 m, G3.
Risk: kc_gate_rock is about 4.8 m across at 0.57 of the radius, so any larger heart in the circle would block the fight.
```

```
HALL flying_polyp (Flying Polyp, Archives of the Great Race) -- richness 4
Now: uv_armillary (heart at 0.95, 150°, bronze tint), bookcase ring ×5 (built record cases), meteor ring ×4 (built, purple glow), hexped ring ×5 (built, purple), statue_ring (180°), column ×4 (scattered). Six kinds: a focal bronze sphere and purple light among record cases, a vault of tidy stone with fallen star-stone.
Weak in use: meteor (built round stone, purple glow) -> an unlit iron meteorite fragment, about 1.5 m, G6; column ×4 (intact graveyard columns, where the tale has them broken) -> broken pillar stubs (Mix 1); hexped ×5 (built plinth, shared with shoggoth) -> a cyclopean basalt drum, about 1.5 m, G5.
Mix 1 (best): uv_armillary heart (150°, kept); statue_ring (180°, kept); tr_pillar_b and tr_pillar_vb scatter ×4 at 0.88–0.99 (arc 60–300°) in place of column (CC BY, credited); bookcase ring kept. Why: the Great Race's bronze resonator among pillars broken before their time.
Mix 2: st_rock_5 ×3 ring at 0.9 (arc 70–290°, jitter 10) in place of meteor; sw_grille ×2 hung on the side walls (90° and 270°, at 0.972). Why: unlit fallen stone, and vents for the wind that comes before the polyp.
Mix 3: none.
Wanted web part(s): a dark iron meteorite fragment, about 1.5 m, G6; a broken Cyclopean column with a splintered top, about 3 m, G5.
Risk: the Archives' basalt vault caps height, so the armillary (about 4.8 m) and any taller piece need checking against the roof.
```

```
HALL dr_munoz (Dr Muñoz, Muñoz's Rooms) -- richness 3
Now: rh_door (hung on the side wall, 90°), ph_pipes ring ×6 (icy tint), ph_compressor (mirrored pair at 130° and 230°, the focal), pipes ring ×6 (built, at 0.93), crate ×5, barrel ×4, bench (270°), urn ×5 (icy), lantern ×3 (lit). Nine kinds that read as a cold plant, but two pipe rings share one arc and the crates and barrels are a ship's stores.
Weak in use: pipes (built ring at 0.93, on the same arc as ph_pipes at 0.95) -> drop it; crate and barrel (pirate kit) -> steel refrigerant drums, about 1.2 m, G10; urn ×5 (graveyard funerary urn) -> frosted glass vessels, G10 (Mix 2).
Mix 1 (best): ph_compressor pair (130° and 230°, in, kept); ph_pipes ring (0.95, 60–300°, kept); kf_barrels ×4 scatter 0.84–0.97 (80–280°) in place of the crates and barrels; built pipes dropped; lantern kept. Why: the ammonia engine, its pipework and its drums.
Mix 2: ph_bottle ×5 at size 2.5 (about 2.2 m glass vats with liquid), scatter 0.8–0.96, in place of the urns; lb_reagent ×3 on the bench (270°). Why: cold vessels for a man who keeps himself alive by cold.
Mix 3: none.
Wanted web part(s): a refrigeration tank with frosted copper coils, about 2 m, G10.
Risk: the townhouse's beam roof caps height, and dropping the built pipes thins the cold plant's pipework, so check the room still reads as one.
```

```
HALL charles_le_sorcier (Charles le Sorcier, Cellars of the Castle) -- richness 4
Now: al_still (heart at 0.95, 150°, about 4.4 m), lb_stand (130°), lb_retort ×3, lb_round ×3, lb_florence ×2, altar_stone (130° and 230°), skeleton (180°), coffin (270°), urn ×9, barrel ×3, chalice ×3, bowl ×3, candles ×8 (lit). Thirteen kinds, the most of the five: a laboratory with a focal still and candles, but nine identical urns and the small chalices and bowls repeat.
Weak in use: urn ×9 (one graveyard urn nine times) -> glass vats (Mix 2); coffin (wooden graveyard coffin) -> a stone sarcophagus with a closed lid, about 2.5 m, G1; barrel (pirate kit) -> a wooden alchemist's cask, about 1 m, G11; chalice and bowl (0.5 and 0.75 m after scale) -> too small for a 23 m hall, drop them.
Mix 1 (best): al_still heart (150°); lb_stand (130°); lb_retort ×3, lb_round ×3, lb_florence ×2 scatter 0.8–0.95; altar_stone pair (130° and 230°); skeleton (180°); candles ×8 lit; lb_burner ×3 and lb_reagent ×3 scatter 0.82–0.97 in place of the urns, barrels, chalices and bowls. Why: an alchemist's bench of flasks, burners and reagents around the still.
Mix 2: ph_bottle ×4 at size 2.5, scatter 0.84–0.96, in place of the urns. Why: Michel Mauvais's elixir kept in vessels.
Mix 3: lb_microscope ×2 beside the altars at 0.9 (130° and 230°). Why: his notes read under the glass.
Wanted web part(s): a stone sarcophagus with a closed lid, about 2.5 m, G1.
Risk: about thirty-four small pieces fill the 0.8–0.97 band, so swapping in many large vessels there would crowd the walls.
```

```
HALL rhan_tegoth (Rhan-Tegoth, Mi-Go Cities) -- richness 4
Now: mg_case x6 (ring at 0.92, facing in), mg_jar x2 (100 and 260 deg), rl_priest x2 (wax, 70 and 290 deg), mu_reishi x4 and mu_oyster x3 on the floor; built pipes x8, hexped x4 (both purple) and idol (far wall); the style's block at the heart. Eight kinds, five baked.
Weak in use: pipes -> a riveted brass tube with a valve wheel, about 3 m, G10; idol -> a seated six-limbed stone idol with a ruff, about 3.5 m, G7.
Mix 1 (best): statue_head (CC0) at 180 deg, 0.97, in place of the idol; ba_bust x2 (CC BY, credited) between the cases at 90 and 270 deg; cu_curtains (CC BY, credited) hung behind the head: the god among a museum's busts.
Mix 2: lb_stand x2 with lb_retort and lb_reagent (CC0) at 0.85, 120 and 240 deg: where the brains are kept in fluid.
Mix 3: sw_pipe_big x8 (CC0) on the ring at 0.93, in place of the built pipes: real pipework, without the purple glow.
Wanted web part: a seated six-limbed stone idol with a ruff, about 3.5 m, G7.
Risk: the style's block is the only solid inside the fight circle and no put is a declared heart, so a new centre piece would break the one-heart rule.
```

```
HALL umr_at_tawil (Umr at-Tawil, The Ultimate Void) -- richness 3
Now: uv_armillary (heart, 150 deg, 0.95), the focal piece; uv_hourglass x3 on the floor; column x6 and statue_ring x4 (Kenney) on the walls; built hexped x5 (magenta) and trilith; the style's pillar at the heart. Six kinds, four baked.
Weak in use: column (a cemetery column with a plain cap, against slab walls) -> a cracked basalt column with spiral glyphs, about 5 m, G9; hexped (built stubs) -> a stepped stone plinth, about 1.5 m, G5.
Mix 1 (best): tr_pillar_tall x6 (CC BY, credited) at 0.8 on the ring at 0.97, arc 50-310, in place of the six column: the city's own columns.
Mix 2 (instead of Mix 1): kf_column_broken x2 (CC0) mirrored at 0.93, 60 and 300 deg: broken, as the city fell.
Mix 3: tr_statue_b x4 (CC BY, credited) on the ring at 0.9, arc 80-280, face in, in place of the four statue_ring: the statues of the city that was.
Wanted web part: a black stone orb on a broken pedestal, about 3 m, G6.
Risk: the style's 2x pillar may be a second solid in the fight circle beside the declared heart, so no mix may add a centre piece; uv_armillary also stands in flying_polyp's hall.
```

```
HALL arena (the ?arena ground, no horror) -- richness 1
Now: no baked model: a slab floor, six free pillars (one broken, at -2.5,-4), 20 colonnade columns at r 24.2 m (8 m, box capitals), two low walls, the Elder Sign slab, two hidden pieces. No braziers: createArenaScene reads no fires; main.ts:163 uses it when no world exists.
Weak in use: colonnade and pillars (built, box capitals) -> a fluted grey stone column, about 8 m, G9.
Mix 1 (best): kf_column (CC0) x20 at 1.9x (1.5 m across, 8 m tall) on the colonnade spots.
Mix 2: kf_column_broken (CC0) at -2.5,-4 in place of the built broken stub.
Mix 3: ss_brazier x4 (CC BY, credited, lit) at 0, 90, 180 and 270 deg, r about 20 m, between colonnade columns: the fires the test never had.
Wanted web part: a fluted grey stone column with a plain capital, about 8 m, G9.
Risk: the colliders in world/arena.ts are the built radii (0.7 m for the colonnade), so a model's footprint must match them; kf_column at 1.9x is 1.5 m across.
```

```
HALL roomSets (no horror: University Library, five rooms; Stairs of Slumber, three) -- richness 2
Now: the library is built throughout: bookcase, bookcase_low and bookshelf on the walls, bookpile on the floor, the same bays in every room. Each slumber room stands the same two ss_brazier (CC BY, lit) at 0.74 on its side walls.
Weak in use: bookcase, bookcase_low, bookshelf, bookpile (identical built boxes) -> a tall oak library case with glazed doors, about 2.4 m, furniture; ss_brazier -> a carved stone fire-altar, about 2.5 m, G5.
Mix 1 (best): rh_window x3 (CC0) hung high on the reading hall's walls between the bays: the room under its high windows.
Mix 2: lb_stand x2 with lb_burner and lb_reagent (CC0) on the bindery's free floor at 0.6 share: glue pots and a spirit lamp on worktables.
Mix 3: fh_hearth (credited, pack 01) square to the cavern's side walls at 0.9, lit, in place of the two ss_brazier: an eternal fire in a hearth.
Wanted web part: a tall oak library case with glazed doors, about 2.4 m, furniture.
Risk: the three stair rooms share one stair, so a changed brazier must keep off the doorway's 2.8 m pace.
```

```
HALL keziah_mason (Keziah Mason, The Witch House) -- richness 3
Now: rh_plank, rh_boarded_window, rh_shutter, chest, crate, barrel, bedroll, bench, skeleton, bowl, candles: 11 kinds, the candles the only light. Boards and a pallet read as a garret, but pirate trade goods make it a storeroom; nothing hangs or moves.
Weak in use: chest, crate, bedroll -> timber trade goods from the CC0 medieval kit: fh_trunk, fh_crate, fh_bed (G11).
Mix 1 (best): fh_bed at 0.92/265 (the bedroll's spot); fh_trunk on ring 0.93, arc 60-300 (the chests); fh_crate scattered 0.82-0.97, arc 50-310 (the crates). A hag's pallet and trunks in the house's own timber.
Mix 2: fh_shelf hung on the far wall beside rh_shutter: her jars and formulae.
Mix 3: bn_pile_skull x3, scattered 0.82-0.96, arc 110-250: what her rat has gnawed clean, by the skeleton.
Wanted web part(s): an iron cauldron on three legs, 0.9 m, G5; a spinning wheel with one spoke gone, 1.2 m, G11.
Risk: the candles are the garret's only light, so any swap keeps their lit flag.
```

```
HALL dunwich_horror (the Dunwich Horror, Sentinel Hill) -- richness 3
Now: sh_altar (the one heart, the table-stone at 0.95/150), trilith and skull_pole (built in code), rock_tall, rocks_tall: 5 kinds. A ring of stones about a table reads as the summit's rite, but the rocks are grey lumps and nothing lights, hangs or moves.
Weak in use: rock_tall, rocks_tall -> boulders where the ring wants standing stones: nt_menhir_a/c (Kenney, CC0, already baked), 4 to 6 m tall, G5.
Mix 1 (best): nt_menhir_a and nt_menhir_c, six on ring 0.84-0.98, arc 40-320, in place of rock_tall: the hill's own standing stones about the table-stone, outside the fight circle.
Mix 2: ss_brazier x2 (lit: torch) at 0.9 on 20 and 340, either side of the door and clear of the skull arc: the people's fires on the summit, the hall's only light (CC BY, credited).
Mix 3: none (more kit would crowd the ring at 0.93).
Wanted web part(s): a holed standing stone (a hag-stone menhir), 3 m, G5.
Risk: four menhirs of 4 to 6 m beside seven built trilithons may crowd the ring; check spacing in tests/hallSets.test.ts and keep sh_altar the only heart.
```

```
HALL father_dagon (Father Dagon, Y'ha-nthlei's temple) -- richness 3
Now: yh_coral_a/b/c, sw_pipe_big, sw_support, rowboat, rocks_sand_a, statue_head, fish, lily, barrel, column, and two heart grilles, sw_bars (150) and sw_grille (210): 14 kinds, all sunken. Plenty of pieces, but the fish and lily pad are survival and pond props, and nothing here is an idol or a light.
Weak in use: lily (a pond lily pad) -> kelp fronds, G2 (nt_reed is the nearest baked stand-in); fish (a whole survival fish) -> a fish skeleton, G4; column (graveyard) -> tp_col_mid.
Mix 1 (best): tp_col_mid on ring 0.96, arc 60-300, in place of column; tp_rubble_1 and tp_rubble_2 scattered 0.85-0.97, face free, in place of rocks_sand_a: the drowned temple's own fallen stone (CC0).
Mix 2: tp_vase_1, tp_vase_2, tp_vase_3 scattered 0.82-0.96, arc 50-310, in place of barrel: the jars of the drowned city (CC0).
Mix 3: tr_statue_b at 0.93/180, face in, between the two grilles: the idol still upright, its statue_head fallen at its foot (CC BY, credited).
Wanted web part(s): a fish skeleton on the seabed, 1.2 m, G4; a kelp frond cluster rooted in rock, 2.5 m, G2.
Risk: sw_bars and sw_grille are both heart puts and the brief allows one solid heart, so confirm neither is solid before tr_statue_b goes between them.
```

```
HALL joseph_curwen (Joseph Curwen, Curwen's Catacombs) -- richness 4
Now: kc_gate_bars and sw_grille (hearts, the barred pens), lb_retort, lb_florence, lb_round, lb_reagent, lb_stand, lb_burner (his glass), pd_chain (six from the vault), altar_stone, urn (eight), coffin (two), barrel, skeleton, shovel_dirt, chalice, candles: 17 kinds, lit and hung. Glass and chains make a working vault; the eight churchyard urns are the odd kind out.
Weak in use: urn -> glass carboys in wicker, G10 (none baked; Mix 1 stands glass in their place).
Mix 1 (best): ph_bottle x6 scattered 0.8-0.94, face free, in place of urn: glass vessels the candles catch, as on his tables (CC0).
Mix 2: ph_pipes x2 hung on the side walls (wall face, 0.95, arcs 60-120 and 240-300): the pipes that carry his work to the pens (CC0).
Mix 3: lb_microscope at 0.9/100, face free, by lb_stand: his instruments for the vigil (CC0).
Wanted web part(s): a tesla coil of brass rods on a wooden stand, 2.5 m, G10; a closed iron sarcophagus, 2.2 m, G1.
Risk: Charles le Sorcier's hall (hallSetsLairs) already stands lb_retort, lb_round, lb_florence and lb_stand, and this hall has two heart puts where the brief allows one solid heart; confirm both before adding.
```

```
HALL haunter_of_the_dark (the Haunter of the Dark, Starry Wisdom Church) -- richness 4
Now: cb_bell (lifted 3.3 m, the one hanging piece), ca_column_small (six), ca_railing (six), bench (two arcs of six), cross, statue_column (four), urn (four), grave_broken: 8 kinds in a dark steeple. The nave's columns and a bell suit the story, but the pews are park benches and the cross stands upright where the story has it taken down.
Weak in use: bench -> high-backed oak church pews, G8; cross -> cross_wood laid flat on the floor (Kenney, CC0); urn -> a stone font, G8.
Mix 1 (best): cu_curtains hung on the far wall (180, wall face, join, size 1.2): drawn across the louvres, the dark the Haunter cannot leave (CC BY, credited).
Mix 2: tr_wall_win_b hung on the side walls (90 and 270, wall face): shuttered stone windows of the steeple (CC BY, credited).
Mix 3: none (the columns and railing already fill the walls).
Wanted web part(s): a row of high-backed oak church pews, 2.5 m, G8; a headless stone saint on a plinth, 2 m, G7.
Risk: the bell is kept out of the fight only by its 3.3 m lift, so any heavier replacement must keep that height.
```

```
HALL lilith (Lilith, The Vaults under Red Hook) -- richness 4
Now: cu_curtains, ph_mirror x2, fountain, lily, statue_head, column, urn (7 kinds). A drapery wall and dark mirrors at the back, torchlight about; it reads as a shrine, but the water is a dry town fountain.
Weak in use: fountain -> sunken stone basin of black water, 3 m (G5); statue_head (shared with three other halls) -> veiled basalt head, 1 m (G7); column -> lotus-capped column, 4 m (G9).
Mix 1 (best): tp_col_base + tp_col_mid (mid lifted 2.4 m, 4.8 m total, under the roof's 5 m) at ring 0.92, arc 60-300, replacing column: a half-Eastern colonnade (0 deg = entry, r a share of 23 m).
Mix 2: pd_chandelier, size 0.8, lift 3, walk, at(0.45, 200): candles in rows over the water, no collider.
Mix 3: sh_altar, heart, at(0, 0): the bride's altar, the hall's one solid heart.
Wanted web part(s): sunken stone basin of black water, 3 m, G5; veiled basalt head, 1 m, G7.
Risk: sh_altar would be the only solid inside the 18 m fight circle, so keep it optional.
```

```
HALL terrible_old_man (The Terrible Old Man, The Old Captain's House) -- richness 3
Now: rh_shutter, kf_barrels, ph_bottle x16, urn, chest, bench, cannon, barrel, flag_pirate, lantern (10 kinds). A lamp-lit captain's hall, but the bottles stand as a heap on the floor and nothing hangs or swings.
Weak in use: ph_bottle (1.3-1.8 m, on the floor) -> glass demijohn with a lead pendulum on a cord, 0.5 m (G10); flag_pirate (full colour) -> grey, moth-eaten ensign, 1.5 m (G4).
Mix 1 (best): fish, hung on the shutter walls (wall helper, walls 90 and 270, size 1.4), and rowboat at(0.9, 200, face in): a boat kept indoors (0 deg = entry, r a share of 23 m).
Mix 2: ph_bottle, size 0.45, lift 2.2, scatter 8 at r 0.84-0.95, arc 60-300: bottles hung on their cords, tops under the roof.
Mix 3: none (a second boat would crowd the way in).
Wanted web part(s): glass demijohn with lead pendulum on a cord, 0.5 m, G10; grey ensign, 1.5 m, G4.
Risk: no catalogue piece has a pendulum, so Mix 2 stands in until that part is found.
```

```
HALL wilbur_whateley (Wilbur Whateley, The Whateley Farmhouse) -- richness 4
Now: rh_boarded_door, kf_pulley, kf_barrels, wf_barn (heart, at 0.82 r), hay_bale, crate, chest, barrel, bedroll, cart, lantern (11 kinds). Boarded stalls, hay and lamps make a loft, but the barn at 5.7 m reads as a building set inside one.
Weak in use: wf_barn (American barn at 0.52) -> open king-post roof truss of a barn loft, 5 m (G11); cart (whole) -> cartwheel leaning on a wall, 1.2 m (G11).
Mix 1 (best): fh_post at(0.9, 110) and at(0.9, 250), each with an fh_beam_lean at lift 2.0: the farmhouse's timber frame in wf_barn's place (0 deg = entry, r a share of 23 m).
Mix 2: og_gramophone on a crate, at(0.84, 100, face in): the grandfather's voice on a record, the Necronomicon read aloud.
Mix 3: cb_bell, lift 2.5, walk, at(0.5, 200): a bell swung over the hay, no collider.
Wanted web part(s): open king-post roof truss of a barn loft, 5 m, G11; cartwheel leaning on a wall, 1.2 m, G11.
Risk: wf_barn is the hall's only heart and sits just outside the fight circle, so Mix 1 leaves the loft with no heart unless a new one is found.
```

```
HALL ephraim_waite (Ephraim Waite, The Waite House) -- richness 4
Now: rh_window, rh_door, ph_mirror x2 (a mirrored pair, heart), bench, chest, cross_wood, statue_head, urn, candles (9 kinds). The pair of mirrors shows whoever stands before them, between hung windows and torches; the upright cross and the generic head are the weak notes.
Weak in use: cross_wood (upright) -> inverted wooden cross on a wall, 2 m (G8); statue_head (shared with three other halls) -> bust of a man in a high collar, 0.8 m (G7).
Mix 1 (best): mg_jar x3 (brain in a jar, CC BY), scatter 3 at r 0.84-0.94, arc 100-260 (0 deg = entry, r a share of 23 m): glass vessels holding the bodies he left.
Mix 2: fg_dance_a, size 1, at(0.9, 230, face in): a standing figure in pale tint, the young woman's body he last wore.
Mix 3: rl_priest (cloaked figure, CC BY) at(0.95, 60, face wall): a robed man-shape on the wall, the coat he changed.
Wanted web part(s): inverted wooden cross, 2 m, G8; bust of a man in a high collar, 0.8 m, G7.
Risk: no catalogue piece can be turned upside down, so the cross needs a new web part, and the mirror pair (heart at 0.94 r) is the hall's focus and should stay.
```

```
HALL hypnos (Hypnos, The Sculptor's Tower) -- richness 4
Now: ba_bust x4, uv_hourglass, statue_head, column x4, bedroll x3, bench, lily x6 (tinted red), chalice x3, candles x8 (9 kinds). A focal hourglass at the edge and torches, but four busts of one model repeat one face, red lilies stand in for poppies, and the hourglass's sand does not run.
Weak in use: statue_head and ba_bust x4 -> half-carved marble block with a sleeper's face emerging, 1.6 m (G7); column -> fluted Doric column, 4 m (G9); lily (red) -> red poppy clump, 0.6 m (G2).
Mix 1 (best): tr_statue_b at(0.9, 180, face in) in place of statue_head; one ba_bust at(0.9, 215); tp_col_base + tp_col_mid (mid lifted 2.4 m) at ring 0.92, arc 60-300, in place of column: a marble figure and Greek columns (0 deg = entry, r a share of 23 m).
Mix 2: fh_bed (a couch, 1.8 x 0.6 x 1.7 m) at(0.93, 270, face 90) in place of bench: the couch the tale names.
Mix 3: nt_bush x3, tinted poppy red, at ring 0.84, arc 80-280: poppy shrubs.
Wanted web part(s): half-carved marble block with a face emerging, 1.6 m, G7; red poppy clump, 0.6 m, G2.
Risk: uv_hourglass at 2.2x stands 4.4 m, close to the 5 m limit every piece must meet.
```

