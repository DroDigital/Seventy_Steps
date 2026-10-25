# Arenas that would gain from mixing the assets we already have (a survey)

Asked: look for other arenas that could be improved a lot by mixing existing assets, as the gates were. Ten read-only surveyors (Haiku, two arenas each) read each place's
planner, set, way, house and gate against `models_catalog` (every baked model: 181 boss, 51 Kenney, 11 gate) and proposed up to three mixes each. I then checked that every
model id they named exists in the catalogue (all do) and ranked the proposals. **Read this as a shortlist, not a plan:** the surveyors read code, not renders; their positions come from
the planners, and none was checked against the land, the fight's circle or the closure tests (`tests/bossPlaces.test.ts`, the 110,000-triangle budget). They were also told the
candidate uploads by name, which made them ask for those more than a fresh eye would.

Round 75 (#176, not merged when this was written) rebuilds six places and shapes the ground of five; the surveys of those eleven judged what is still missing after it. Several
of the proposals below touch `src/world/places/*.ts`, which #176 also edits: do the eleven after it lands, and the nine untouched ones (Colour, Black Man, Shub-Niggurath,
Gorgon, Simon Orne, Hutchinson, Colossus, Hastur, Nyarlathotep) whenever.

## The shortlist, by what each gains for how little

| Arena | Gap | Best mix (existing ids) | Upload that fits |
| --- | --- | --- | --- |
| **Simon Orne** (richest gain; weakest place) | flat dirt, only the gate moves | `bn_pile_skull`, `bn_leg`, `bn_ribcage` strewn in the plot and a skull pyramid by the crypt door ("what is dug up is not what was put down"); Kenney `altar_stone` + `candles` + `chalice` before the chapel, lit ("THE LAMPS ARE LIT"); `gt_dead_5`/`_9` outside the back corners | Sunken Doorway sunk to its lintel as the crypt door, but its Mesoamerican carving sits badly in Salem: no |
| **Hastur** | no centre of gravity over the theatre | `px_ring` (6.4 m, dark) upright behind the stage wall, centre 17 m up: the black sun the way's omen names; `fg_dance_b`/`_c` as a couple on the stage; `gt_dead_5`/`_9` on the far shore | Energy gate in the proscenium as the King's lit door |
| **Nyarlathotep** | 34 seated figures, nothing moves or runs | `fg_dance_a`-`_d` as the running crowd the set's note promises, either side of the road beyond the gate; `tp_stairs` in two flights up to the dais | Energy gate on the dais as the show's screen between the rods |
| **Cthulhu** | nothing stands beyond the walls; the Alert has no mast | `px_mast` out of `px_hull` with Kenney `cannon` on the quay (Johansen's ship); two `ay_pylon` at 36 m beyond the back wall (the house record's spires); `px_chimney` as a vent | Alien Temple front beyond the back wall as the drowned city's skyline |
| **Nug** | the mound's mouth the planner promises is never placed | `tp_doorway` in the back gallery's middle bay between two lit `px_brazier`; `cs_temple_tower` behind it | Energy gate's plasma sheet in the mouth (red light from below) |
| **Martin's Beach** | the horror itself is absent | `bn_ribcage` (about 6x) and `bn_spine` (5x) half-buried beyond the basin, the washed-up thing; twelve Kenney `fish` all yawed to the sea (the omen); `px_chimney` stacks | Wyrm's Head half-sunk (too large, with a castle: no) |
| **Bokrug** | nothing in the lake moves or shows from afar | `gt_dead_3`/`_9` at the lake's far corners (a drowned wood); three `px_pod` lit green in the shallows (the eggs); `bn_skull_pyramid` at the steps | **Wyrm's Head** half-sunk with its jaws over the water, castle cut away: Bokrug is the great water-lizard of Ib (The Doom That Came to Sarnath), and this is the best fit it has |
| **Daemon Pipers** | nothing at the centre they play for | `bn_skull_pyramid` at 4x as the fight's one heart (the boss spawns about the centre: its ring must clear it); `tr_statue_b`/`_d` by the four drums; `px_mask` on the great flutes | none |
| **Zkauba** | the house line promises "a stair that goes into the wall" | two `tp_stairs` against the back wall; `px_sphere` on the pylon tops the arcs leap between | Alien Temple front on the gate's axis behind the back wall |
| **Azathoth** | the floor the planner's comment promises is never laid | `fg_seat` at 2.2x before the middle flute (the blind god's seat); two `ay_dome`, half sunk, on the back flanks | (the temple front is the Threshold's now) |
| **Yog-Sothoth** | one tint on every piece (read before the temple front hung in its gate) | `ay_portal` dark, framing the crossed rings; `tp_stairs` into the light that goes nowhere | Energy gate in place of the crossed rings |
| **Colour Out of Space** | one ash grey, no meteor | `px_sphere` half-sunk at the well's lip, `px_prism` by the well (it splits light, as the horror's beams do), `px_root` creeping from it | Energy gate at the well |
| **Edward Hutchinson** | court flat cobble | two `px_prism` by the laboratory (salt grown to crystal), `gt_dead_5`/`_9` behind the donjon, `px_ring` in the bailey (his circle) | Energy gate as a second conductor on the lab roof |
| **Other Gods** | "no body": light between posts | `ay_portal` on the dais's back with the rings inside; `fg_dance_a`/`_c` turned apart | Energy gate on the dais in place of three discs |
| **Yig** | nothing signals above the coil | `gt_dead_5` x3 behind the coil, or `ar_arcade` (the temple, CC BY pack 29); `tr_statue_b`/`_d` as the shrine's guardians | Wyrm's Head behind the coil as its other head (the gate now has the Aztec one) |
| **Ancient Ones** | no rise, no far silhouette | three `gt_dead_8` on the back arc; two `hx_tower` | Alien Temple front far off, a city of the Elder Things |
| **Black Man** (already rich) | | two `px_mask` behind the white stone; four `fg_dance` as a frozen sabbat | Wyrm's Head beyond the far bank: too large for the island |
| **Colossus** (already rich) | | `tr_statue_a`-`_e` in the colonnade's bays; two `hs_col_tall` outside the back wall; `tp_stairs` to the sanctuary door | none that fits |
| **Shub-Niggurath** | | Kenney `mushroom_tall` (tinted pod-pink) at the spore sites; `bn_pile_skull` and ribs at the wall's foot | none (a wyrm is the wrong beast for the Goat) |
| **Gorgon** | | Kenney `statue_head` on its side in the drive; Kenney `cart` tipped against the garden wall; a roofless `ms_shed_a` | none |

## What the candidates turn out to be (looked at, not yet baked)

- **Energy gate** (CC BY 4.0, 4,000 faces: two obelisks, a thin ring, a plasma sheet): wanted by seven arenas (Colour, Hutchinson, Nug, Other Gods, Nyarlathotep, Hastur, Yog-Sothoth), so one bake would serve them: a lit door on a dais or in a mouth. The sheet is one flat glow colour in our pipeline (no texture animation).
- **Wyrm's Head** (CC BY 4.0, 22,000 faces): a mountain-sized hill shaped like a gaping wyrm's head with a castle on its back. It needs cutting down to the head. Only Bokrug (the lake's water-lizard) takes it well; the surveyors also offered it for the Black Man, Martin's Beach and Yig, where a hill-sized head is out of scale.
- **Alien Temple front** (CC BY 4.0): now the Threshold's gate (docs/GATES.md); the surveyors also asked for it behind Cthulhu, Zkauba and Ancient Ones as a far city, which would need its 17 by 17 m front to stand outside the walls.
- **Sunken Ancient Temple Doorway** (1.9 million faces) and the **Blockbench Quetzalcoatl** (voxel, no jaw): nobody's best fit.

## Cautions

- Several proposals reuse the same pieces (`fg_dance_*` for Azathoth, Nyarlathotep, Hastur, Black Man and Other Gods; `ay_portal` for Zkauba, Yog-Sothoth and Other Gods;
  `tp_stairs`, `px_mask`, `gt_dead_*` for many): the courts would start to look alike. Tint and place them differently, or give each court one of them, not all.
- A proposal that stands a solid in the fight's circle (the Pipers' skull heart) must be declared the place's `heart`, and the boss's spawn ring must clear it.
- Pieces outside a court's wall change what a body can see, not what it can reach: `closure` and the enclosure audits still apply.
- Not one of these changes a horror's health, blows, script, radius or reward.
