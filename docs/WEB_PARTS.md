# Parts taken from free web sources (round 78)

Asked: "include many more websourced asset parts to use online because the ones we currently have are not enough, then revisit already constructed ones for possible adjustments with the new assets".
Eight Haiku sourcers searched the free hosts that answer from the build machine (Kenney, OpenGameArt, Quaternius, Poly Haven, 3dassets.dev and others; Sketchfab and poly.pizza refuse downloads without a sign-in) for the gaps the arena and hall surveys named
(`docs/ARENA_MIXES.md`, `docs/HALL_MIXES.md`), checked each licence on its page, and downloaded what they kept. Rules: CC0, public domain, CC BY 3.0/4.0 and OGA-BY are taken; anything NonCommercial, NoDerivatives, ShareAlike, GPL, "no redistribution", editorial, or a store-only licence is not.
I then looked at the sizes and shapes of the ones I meant to use, baked **24**, all CC0, and stood them in nine places that round 75 (#176) does not rebuild.

**Why only 24:** `tests/arenaSets.test.ts` fails a baked model that no place stands, and the picture of a place is what the part is for. The rest are listed below with their pages, so they can be baked when something is to stand them
(`tools/models/boss/manifest_web.py` is the pattern; its docstring says how the work dir is laid out). The eleven places round 75 rewrites and the 27 dungeon halls (on #174) are waiting for those branches to land.

Baked into `src/data/models/webIndex.ts` + `webPack.ts` (a set of its own, so it never touches the generated boss and gate files other branches rewrite), credited in `src/data/models/CREDITS.md`:

| id | what | source | stands in |
| --- | --- | --- | --- |
| `wk_coffin` | a lidded old coffin, 2.1 m | Kenney Graveyard Kit: coffin-old | Simon Orne (three, half out of the ground) |
| `wk_skeleton` | a skeleton, six objects made one, 1.8 m | Kenney Graveyard Kit: character-skeleton | Simon Orne |
| `wk_crypt` | a roofless family crypt, 3.4 m | Kenney Graveyard Kit: crypt-large | Simon Orne (a mausoleum by the chapel) |
| `wk_cross` | a large cross gravestone, 2 m | Kenney Graveyard Kit: gravestone-cross-large | Simon Orne (by the chapel) |
| `wk_keeper` | a hooded keeper in his robe, 2.1 m | Kenney Graveyard Kit: character-keeper | Black Man (the sabbat, ten between the stones) |
| `wk_meteor` | the fallen meteorite, 4.2 m | Kenney Space Kit: meteor_detailed | Colour Out of Space (sunk in its crater) |
| `wk_crater` | a crater, 12 m across | Kenney Space Kit: craterLarge | Colour Out of Space |
| `wk_crystals` | a cluster of crystals, 2.8 m | Kenney Space Kit: rock_crystalsLargeA | Colour Out of Space; Hutchinson (salt grown to crystal) |
| `wk_crystal` | a large crystal cluster, 3.2 m | Kenney Tower Defense Kit: detail-crystal-large | Colour Out of Space; Hutchinson |
| `wk_mushroom_a / _b` | a tall mushroom, 1.7 m and 2.3 m | Kenney Nature Kit: mushroom_redTall, mushroom_tanTall | Shub-Niggurath (along the wall foot, tinted pink) |
| `wk_egg` | an egg, 1.7 m | OpenGameArt: Strange Egg, by Umplix | Shub-Niggurath (nests of three) |
| `wk_tree_spikes / _spiral` | alien trees, 7 m and 6 m | Quaternius, Ultimate Space Kit: Tree Spikes, Tree Spiral | Shub-Niggurath (among the dead trees beyond the wall) |
| `wk_horse` | a rearing horse on its plinth, 4 m | Quaternius, Modular Dungeon pack: Statue_Horse | Gorgon (one of the stone people) |
| `wk_knight` | a knight kneeling on a plinth, 2.6 m | OpenGameArt: Knight statue, by yd | Gorgon (at the porch) |
| `wk_statue` | a small statue on a plinth, 2.6 m | Kenney Mini Arena: statue | Gorgon (on the garden wall piers) |
| `wk_well` | a well with its roof, 2.6 m | Quaternius, Medieval Village Pack: Well | Gorgon (the garden) |
| `wk_candelabrum` | a tall candelabrum, 2.2 m, five flames | Quaternius, Modular Dungeon: Candelabrum_tall | Simon Orne (either side of the altar) |
| `wk_generator` | a generator, 3 m | Kenney Space Kit: machine_generatorLarge | Hutchinson (before the laboratory) |
| `wk_pipe_ring` | a ring of pipe on a stem, 3.4 m | Kenney Space Kit: pipe_ringHigh | Hutchinson |
| `wk_tank` | a storage tank, 2.8 m | Kenney City Kit (Industrial): detail-tank-large | Hutchinson |
| `wk_throne` | a stone throne, 4.6 m | OpenGameArt: Barbarian throne, by eugeneloza (OpenDungeons) | Hastur (the King on the stage) |
| `wk_pyramid` | a stepped pyramid, 26 m | OpenGameArt: Pyramid 3d, by Intrix | Nyarlathotep (two, black, far beyond the wall); Colossus (two, sand) |

## Where they stand (what each change was for)

- **Simon Orne** (richest gain in the arena survey): coffins half out of the ground, one of the dead risen, crosses by the chapel's path, a candelabrum either side of the lit altar: "what is dug up is not what was put down".
- **The Colour Out of Space:** the meteorite half sunk in a crater at the basin's rear corner, crystals of the Colour grown about it, magenta sparks.
- **The Black Man:** ten robed keepers stand still between the thirteen stones, all turned in, none on the ford's side: the sabbat caught at its rite.
- **Shub-Niggurath:** mushrooms along the wall's foot, nests of eggs, strange trees among the dead ones over the wall: the thousand young.
- **The Gorgon:** a horse reared on its plinth, a knight on his knee, figures on the garden wall's piers, a real well: more kinds of stone person than the five forms she had.
- **Hutchinson:** generators, a ring of pipe and a tank before the laboratory, crystals of salt at the donjon's foot.
- **Hastur:** the King's stone throne on the stage floor before the proscenium arch, and (an existing model) the black ring risen over the stage wall: the black sun the way's omen names.
- **Nyarlathotep and the Colossus:** pyramids far off beyond the walls (black for the Black Pharaoh, sand for the Colossus), sunk 3 m so that nothing hovers if the land falls away.

## Not used, and why

- `the-dark-pyramid` (OpenGameArt, CC0): its FBX does not import in Blender 5 (`pyramid-3d` stood in for it).
- Quaternius's `Wizard`: a rigged character whose FBX is scaled oddly, 5,400 faces; Kenney's `character-keeper` does the robed figure.
- The medieval Innansorra statue: 26,000 faces of one marble figure; the knight and the horse are lighter.
- `demon-statue`: its Blender file holds a 740 m copy of the statue beside the real one; not cleaned.
- Nothing from the pending #176 arenas (Martin's Beach, Cthulhu, Bokrug, Yig, Nug, Zkauba, Other Gods, Pipers, Yog-Sothoth, Azathoth, Ancient Ones): the giant bones, ships and lighthouses sourced for them wait for #176.

## What the sourcers found

Each table is its sourcer's, as reported: page URL, licence read on the page, rough size, and the arena or hall it was thought to fit (suggestions, not decisions). "Gaps" are the categories of `docs/ARENA_MIXES.md`: G1 bones and remains, G2 dead trees, reeds, G3 fungi, pods, eggs, G4 ships and shore, G5 stone, G6 cosmic, G7 statues, G8 gothic and graveyard, G9 ancient cultures, G10 industrial, G11 rural.

### Kenney's kits (CC0)

| slug (kit/model) | name | author | licence | page URL | formats, MB | what it is | rough triangles, size | gaps | best arena or hall (boss id) |
|---|---|---|---|---|---|---|---|---|---|
| graveyard-kit/character-skeleton | character-skeleton | Kenney | CC0 1.0 | https://kenney.nl/assets/graveyard-kit | GLB, zip 3.5 MB | skeleton figure, standing | 658 tris, 0.76x0.70x0.32 m | G1 | orne |
| graveyard-kit/coffin-old | coffin-old | Kenney | CC0 1.0 | https://kenney.nl/assets/graveyard-kit | GLB, zip 3.5 MB | old lidded coffin | 216 tris, 0.57x0.20x0.84 m | G1 | orne |
| graveyard-kit/crypt-large-door | crypt-large-door | Kenney | CC0 1.0 | https://kenney.nl/assets/graveyard-kit | GLB, zip 3.5 MB | arched stone crypt door | 200 tris, 0.63x0.74x0.13 m | G8 | orne |
| graveyard-kit/crypt-large | crypt-large | Kenney | CC0 1.0 | https://kenney.nl/assets/graveyard-kit | GLB, zip 3.5 MB | large crypt block with roof | 626 tris, 1.85x1.00x2.40 m | G8 | orne |
| graveyard-kit/gravestone-cross-large | gravestone-cross-large | Kenney | CC0 1.0 | https://kenney.nl/assets/graveyard-kit | GLB, zip 3.5 MB | large cross gravestone | 192 tris, 0.45x0.94x0.33 m | G8 | orne |
| graveyard-kit/gravestone-roof | gravestone-roof | Kenney | CC0 1.0 | https://kenney.nl/assets/graveyard-kit | GLB, zip 3.5 MB | roofed grave marker | 172 tris, 0.49x0.61x0.25 m | G8 | orne |
| graveyard-kit/iron-fence-border-gate | iron-fence-border-gate | Kenney | CC0 1.0 | https://kenney.nl/assets/graveyard-kit | GLB, zip 3.5 MB | iron fence gate section | 256 tris, 1.00x0.76x0.22 m | G8 | hutchinson |
| graveyard-kit/lightpost-double | lightpost-double | Kenney | CC0 1.0 | https://kenney.nl/assets/graveyard-kit | GLB, zip 3.5 MB | twin-lamp iron lamp post | 572 tris, 0.21x1.27x0.73 m | G8 | orne |
| graveyard-kit/pillar-obelisk | pillar-obelisk | Kenney | CC0 1.0 | https://kenney.nl/assets/graveyard-kit | GLB, zip 3.5 MB | tapering obelisk | 76 tris, 0.35x1.01x0.35 m | G5 | azathoth |
| graveyard-kit/urn-round | urn-round | Kenney | CC0 1.0 | https://kenney.nl/assets/graveyard-kit | GLB, zip 3.5 MB | round stone urn | 230 tris, 0.26x0.38x0.26 m | G9 | gorgon |
| graveyard-kit/altar-wood | altar-wood | Kenney | CC0 1.0 | https://kenney.nl/assets/graveyard-kit | GLB, zip 3.5 MB | wooden altar table | 306 tris, 1.05x0.54x0.66 m | G5 | blackman |
| graveyard-kit/fire-basket | fire-basket | Kenney | CC0 1.0 | https://kenney.nl/assets/graveyard-kit | GLB, zip 3.5 MB | iron fire basket (brazier) | 196 tris, 0.42x0.17x0.42 m | G5 | hutchinson |
| graveyard-kit/character-keeper | character-keeper | Kenney | CC0 1.0 | https://kenney.nl/assets/graveyard-kit | GLB, zip 3.5 MB | robed figure with a hat | 1141 tris, 0.81x0.86x0.54 m | G7 | nyarlathotep |
| nature-kit/stone_tallJ | stone_tallJ | Kenney | CC0 1.0 | https://kenney.nl/assets/nature-kit | GLB, zip 10.0 MB | tall weathered standing stone | 42 tris, 0.49x0.62x0.54 m | G5 | yig |
| nature-kit/path_stoneCircle | path_stoneCircle | Kenney | CC0 1.0 | https://kenney.nl/assets/nature-kit | GLB, zip 10.0 MB | ring of flat stones on the ground | 164 tris, 0.93x0.05x0.88 m | G5 | pipers |
| nature-kit/cliff_cave_stone | cliff_cave_stone | Kenney | CC0 1.0 | https://kenney.nl/assets/nature-kit | GLB, zip 10.0 MB | stone cave-mouth arch | 64 tris, 1.00x1.00x0.17 m | G5 | nug |
| nature-kit/mushroom_redTall | mushroom_redTall | Kenney | CC0 1.0 | https://kenney.nl/assets/nature-kit | GLB, zip 10.0 MB | tall red-capped mushroom | 48 tris, 0.12x0.25x0.14 m | G3 | shub |
| nature-kit/mushroom_tanTall | mushroom_tanTall | Kenney | CC0 1.0 | https://kenney.nl/assets/nature-kit | GLB, zip 10.0 MB | tall tan-capped mushroom | 48 tris, 0.12x0.25x0.14 m | G3 | shub |
| nature-kit/lily_large | lily_large | Kenney | CC0 1.0 | https://kenney.nl/assets/nature-kit | GLB, zip 10.0 MB | large lily pad | 86 tris, 0.27x0.10x0.31 m | G2 | bokrug |
| nature-kit/hanging_moss | hanging_moss | Kenney | CC0 1.0 | https://kenney.nl/assets/nature-kit | GLB, zip 10.0 MB | hanging moss strand | 52 tris, 0.16x0.48x0.03 m | G2 | bokrug |
| nature-kit/log_stackLarge | log_stackLarge | Kenney | CC0 1.0 | https://kenney.nl/assets/nature-kit | GLB, zip 10.0 MB | large stack of logs | 310 tris, 0.63x0.35x0.71 m | G4 | martins |
| pirate-kit/mast | mast | Kenney | CC0 1.0 | https://kenney.nl/assets/pirate-kit | GLB, zip 3.0 MB | ship mast with yard | 302 tris, 4.39x7.86x1.74 m | G4 | cthulhu |
| pirate-kit/mast-ropes | mast-ropes | Kenney | CC0 1.0 | https://kenney.nl/assets/pirate-kit | GLB, zip 3.0 MB | mast with rigging | 350 tris, 4.39x7.89x2.35 m | G4 | cthulhu |
| pirate-kit/cannon-mobile | cannon-mobile | Kenney | CC0 1.0 | https://kenney.nl/assets/pirate-kit | GLB, zip 3.0 MB | cannon on a wheeled carriage | 472 tris, 1.68x1.38x1.92 m | G4 | cthulhu |
| pirate-kit/ship-ghost | ship-ghost | Kenney | CC0 1.0 | https://kenney.nl/assets/pirate-kit | GLB, zip 3.0 MB | ghostly wrecked ship | 1703 tris, 4.80x9.96x10.60 m | G4 | cthulhu |
| pirate-kit/ship-wreck | ship-wreck | Kenney | CC0 1.0 | https://kenney.nl/assets/pirate-kit | GLB, zip 3.0 MB | wrecked ship hull | 2282 tris, 4.80x9.96x10.60 m | G4 | martins |
| pirate-kit/structure-platform-dock | structure-platform-dock | Kenney | CC0 1.0 | https://kenney.nl/assets/pirate-kit | GLB, zip 3.0 MB | wooden dock platform | 324 tris, 2.50x1.31x2.51 m | G4 | martins |
| watercraft-kit/ship-large | ship-large | Kenney | CC0 1.0 | https://kenney.nl/assets/watercraft-kit | GLB, zip 1.8 MB | large sailing ship | 1849 tris, 4.80x9.96x13.10 m | G4 | cthulhu |
| watercraft-kit/buoy | buoy | Kenney | CC0 1.0 | https://kenney.nl/assets/watercraft-kit | GLB, zip 1.8 MB | red sea buoy | 118 tris, 0.93x1.84x0.93 m | G4 | martins |
| retro-fantasy-kit/dock-corner | dock-corner | Kenney | CC0 1.0 | https://kenney.nl/assets/retro-fantasy-kit | GLB, zip 1.9 MB | stone dock corner | 60 tris, 1.10x0.50x1.10 m | G4 | martins |
| retro-fantasy-kit/battlement | battlement | Kenney | CC0 1.0 | https://kenney.nl/assets/retro-fantasy-kit | GLB, zip 1.9 MB | crenellated stone wall section | 112 tris, 1.00x0.40x0.30 m | G5 | hutchinson |
| retro-fantasy-kit/wall-fortified-gate | wall-fortified-gate | Kenney | CC0 1.0 | https://kenney.nl/assets/retro-fantasy-kit | GLB, zip 1.9 MB | fortified stone gateway | 176 tris, 1.00x1.00x1.00 m | G5 | zkauba |
| retro-fantasy-kit/tower-top | tower-top | Kenney | CC0 1.0 | https://kenney.nl/assets/retro-fantasy-kit | GLB, zip 1.9 MB | round stone tower top | 416 tris, 1.20x0.30x1.20 m | G5 | hutchinson |
| modular-cave-kit/gate-rock | gate-rock | Kenney | CC0 1.0 | https://kenney.nl/assets/modular-cave-kit | GLB, zip 6.7 MB | rock cave gate arch | 360 tris, 4.00x4.05x2.45 m | G5 | nug |
| modular-cave-kit/gate-metal-bars | gate-metal-bars | Kenney | CC0 1.0 | https://kenney.nl/assets/modular-cave-kit | GLB, zip 6.7 MB | barred iron gate in a cave arch | 720 tris, 4.40x4.40x1.40 m | G8 | gorgon |
| modular-dungeon-kit/gate-door-window | gate-door-window | Kenney | CC0 1.0 | https://kenney.nl/assets/modular-dungeon-kit | GLB, zip 6.6 MB | dungeon door with barred window | 1048 tris, 4.40x4.40x1.40 m | G8 | orne |
| modular-dungeon-kit/gate-metal-bars | gate-metal-bars | Kenney | CC0 1.0 | https://kenney.nl/assets/modular-dungeon-kit | GLB, zip 6.6 MB | iron-barred dungeon gate | 720 tris, 4.40x4.40x1.40 m | G8 | hutchinson |
| modular-dungeon-kit/stairs-wide | stairs-wide | Kenney | CC0 1.0 | https://kenney.nl/assets/modular-dungeon-kit | GLB, zip 6.6 MB | wide stone stairway | 3194 tris, 8.40x8.55x8.40 m | G5 | zkauba |
| mini-arena/statue | statue | Kenney | CC0 1.0 | https://kenney.nl/assets/mini-arena | GLB, zip 0.7 MB | small statue on a plinth | 549 tris, 0.70x1.34x0.70 m | G7 | ancients |
| mini-arena/stairs-corner | stairs-corner | Kenney | CC0 1.0 | https://kenney.nl/assets/mini-arena | GLB, zip 0.7 MB | corner stone steps | 84 tris, 1.00x0.50x1.00 m | G9 | gorgon |
| mini-arena/column-damaged | column-damaged | Kenney | CC0 1.0 | https://kenney.nl/assets/mini-arena | GLB, zip 0.7 MB | broken column | 148 tris, 0.60x0.72x0.60 m | G9 | colossus |
| mini-dungeon/gate | gate | Kenney | CC0 1.0 | https://kenney.nl/assets/mini-dungeon | GLB, zip 1.7 MB | dungeon gate with grille | 76 tris, 0.80x0.75x0.20 m | G8 | orne |
| factory-kit/machine-fortified | machine-fortified | Kenney | CC0 1.0 | https://kenney.nl/assets/factory-kit | GLB, zip 4.3 MB | armoured industrial machine | 320 tris, 1.20x1.35x1.60 m | G10 | hutchinson |
| factory-kit/pipe-large-valve | pipe-large-valve | Kenney | CC0 1.0 | https://kenney.nl/assets/factory-kit | GLB, zip 4.3 MB | large pipe with valve wheel | 456 tris, 1.00x1.00x1.02 m | G10 | hutchinson |
| factory-kit/crane-magnet | crane-magnet | Kenney | CC0 1.0 | https://kenney.nl/assets/factory-kit | GLB, zip 4.3 MB | crane electromagnet head | 172 tris, 0.72x0.90x0.72 m | G10 | hutchinson |
| city-kit-industrial/detail-tank-large | detail-tank-large | Kenney | CC0 1.0 | https://kenney.nl/assets/city-kit-industrial | GLB, zip 4.8 MB | large storage tank | 566 tris, 1.51x0.96x1.65 m | G10 | hutchinson |
| city-kit-industrial/chimney-large | chimney-large | Kenney | CC0 1.0 | https://kenney.nl/assets/city-kit-industrial | GLB, zip 4.8 MB | large industrial chimney | 218 tris, 1.08x1.70x1.08 m | G10 | martins |
| city-kit-industrial/water-tower | water-tower | Kenney | CC0 1.0 | https://kenney.nl/assets/city-kit-industrial | GLB, zip 4.8 MB | water tower on legs | 968 tris, 0.85x2.14x0.83 m | G10 | colour |
| space-kit/meteor_detailed | meteor_detailed | Kenney | CC0 1.0 | https://kenney.nl/assets/space-kit | GLB, zip 6.4 MB | fallen meteor rock | 196 tris, 0.87x0.73x0.83 m | G6 | colour |
| space-kit/rock_crystalsLargeA | rock_crystalsLargeA | Kenney | CC0 1.0 | https://kenney.nl/assets/space-kit | GLB, zip 6.4 MB | cluster of large crystals | 384 tris, 0.83x0.54x0.92 m | G6 | colour |
| space-kit/craterLarge | craterLarge | Kenney | CC0 1.0 | https://kenney.nl/assets/space-kit | GLB, zip 6.4 MB | large impact crater rim | 60 tris, 0.89x0.12x0.89 m | G6 | colour |
| space-kit/gate_complex | gate_complex | Kenney | CC0 1.0 | https://kenney.nl/assets/space-kit | GLB, zip 6.4 MB | ring gate with frame | 460 tris, 1.00x1.01x0.50 m | G6 | yog |
| space-kit/bones | bones | Kenney | CC0 1.0 | https://kenney.nl/assets/space-kit | GLB, zip 6.4 MB | pile of bones | 168 tris, 0.86x0.44x0.58 m | G1 | orne |
| space-kit/alien | alien | Kenney | CC0 1.0 | https://kenney.nl/assets/space-kit | GLB, zip 6.4 MB | small alien plant creature | 292 tris, 0.48x0.84x0.33 m | G3 | ancients |
| space-kit/machine_generatorLarge | machine_generatorLarge | Kenney | CC0 1.0 | https://kenney.nl/assets/space-kit | GLB, zip 6.4 MB | large generator machine | 126 tris, 1.00x0.68x1.30 m | G10 | hutchinson |
| space-kit/pipe_ringHigh | pipe_ringHigh | Kenney | CC0 1.0 | https://kenney.nl/assets/space-kit | GLB, zip 6.4 MB | tall ring pipe | 190 tris, 0.92x1.30x1.00 m | G10 | hutchinson |
| prototype-kit/shape-hollow-cylinder | shape-hollow-cylinder | Kenney | CC0 1.0 | https://kenney.nl/assets/prototype-kit | GLB, zip 2.8 MB | hollow cylinder ring | 96 tris, 1.00x1.00x1.00 m | G6 | othergods |
| prototype-kit/column-triangle | column-triangle | Kenney | CC0 1.0 | https://kenney.nl/assets/prototype-kit | GLB, zip 2.8 MB | tall triangular prism spire | 8 tris, 0.20x1.00x0.20 m | G6 | zkauba |
| tower-defense-kit/tower-round-crystals | tower-round-crystals | Kenney | CC0 1.0 | https://kenney.nl/assets/tower-defense-kit | GLB, zip 5.2 MB | round tower with crystals | 688 tris, 1.00x0.82x1.00 m | G6 | hastur |
| tower-defense-kit/detail-crystal-large | detail-crystal-large | Kenney | CC0 1.0 | https://kenney.nl/assets/tower-defense-kit | GLB, zip 5.2 MB | large crystal cluster | 436 tris, 0.89x0.55x0.86 m | G6 | colour |
| fantasy-town-kit/watermill-wide | watermill-wide | Kenney | CC0 1.0 | https://kenney.nl/assets/fantasy-town-kit | GLB, zip 3.7 MB | wide watermill | 600 tris, 1.05x1.80x1.80 m | G11 | shub |
| fantasy-town-kit/wheel | wheel | Kenney | CC0 1.0 | https://kenney.nl/assets/fantasy-town-kit | GLB, zip 3.7 MB | wagon wheel | 192 tris, 0.24x0.48x0.47 m | G11 | orne |
| fantasy-town-kit/cart-high | cart-high | Kenney | CC0 1.0 | https://kenney.nl/assets/fantasy-town-kit | GLB, zip 3.7 MB | high-sided cart | 1028 tris, 0.89x0.86x1.39 m | G11 | orne |
| fantasy-town-kit/windmill | windmill | Kenney | CC0 1.0 | https://kenney.nl/assets/fantasy-town-kit | GLB, zip 3.7 MB | windmill with sails | 732 tris, 0.47x3.11x3.11 m | G11 | shub |
| fantasy-town-kit/fence-broken | fence-broken | Kenney | CC0 1.0 | https://kenney.nl/assets/fantasy-town-kit | GLB, zip 3.7 MB | broken fence section | 124 tris, 0.25x0.38x1.00 m | G11 | orne |
| castle-kit/siege-catapult-demolished | siege-catapult-demolished | Kenney | CC0 1.0 | https://kenney.nl/assets/castle-kit | GLB, zip 2.1 MB | demolished siege catapult (wreck) | 842 tris, 1.68x0.32x1.67 m | G11 | none fixed (any battlefield court) |
| castle-kit/siege-ballista-demolished | siege-ballista-demolished | Kenney | CC0 1.0 | https://kenney.nl/assets/castle-kit | GLB, zip 2.1 MB | demolished ballista (wreck) | 618 tris, 1.75x0.51x1.55 m | G11 | none fixed (any battlefield court) |

NOT FOUND: G1 (giant ribcages, spines, large skulls, sarcophagi, mummies, gibbets), G2 (dead or twisted and swamp trees, mossy rocks), G3 (tentacles, pods, eggs, coral, shells), G7 (heads, masks, idols, totems, gargoyles), G8 (chains, cages, church windows, bell towers), G9 (Egyptian and Mesoamerican reliefs, capitals, sphinx), G10 (tesla coils)

### Quaternius's packs on OpenGameArt (CC0)

| slug | name | author | licence | page URL | formats, MB | what it is | tris (counted) | gaps | best arena (boss id, suggested) |
|---|---|---|---|---|---|---|---|---|---|
| oga-modular-dungeon | Bones | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-dungeon | OBJ 0.04, FBX 0.03 | bone heap | 788 | G1 | orne (strewn bones) |
| oga-modular-dungeon | Bones2 | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-dungeon | OBJ 0.03, FBX 0.02 | second bone heap | 576 | G1 | orne |
| oga-modular-dungeon | Candelabrum_tall | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-dungeon | OBJ 0.04, FBX 0.03 | tall candelabrum | 988 | G5 | orne (lit before the chapel) |
| oga-modular-dungeon | Column_Broken | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-dungeon | OBJ 0.00, FBX 0.02 | broken stone column | 140 | G5, G9 | colossus (colonnade bays) |
| oga-modular-dungeon | ModularColumn_middle | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-dungeon | OBJ 0.00, FBX 0.02 | column shaft | 108 | G9 | colossus |
| oga-modular-dungeon | Stairs | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-dungeon | OBJ 0.01, FBX 0.02 | stone stair | 188 | G5 | zkauba (stair at the back wall) |
| oga-modular-dungeon | Bars | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-dungeon | OBJ 0.01, FBX 0.02 | iron bars | 512 | G8 | any iron gate or cage |
| oga-animated-monsters | Skeleton | Quaternius | CC0 | https://opengameart.org/content/lowpoly-animated-monsters | OBJ 0.08, FBX 0.41 | skeleton figure | 1810 | G1 | orne (a skeleton dug up) |
| oga-animated-monsters | Slime | Quaternius | CC0 | https://opengameart.org/content/lowpoly-animated-monsters | OBJ 0.06, FBX 0.32 | blob creature | 1440 | G3 | bokrug (shallows) |
| oga-pirate-pack | Skull | Quaternius | CC0 | https://opengameart.org/content/low-poly-pirate-pack | OBJ 0.01, FBX 0.03 | skull | 97 | G1 | pipers (skull pyramid) |
| oga-pirate-pack | Cannon | Quaternius | CC0 | https://opengameart.org/content/low-poly-pirate-pack | OBJ 0.03, FBX 0.05 | ship cannon | 726 | G4 | cthulhu (cannon on the quay) |
| oga-lowpoly-modular-dungeon-pack | Skull | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-dungeon-pack | OBJ 0.06, FBX 0.04 | skull | 1392 | G1 | pipers |
| oga-lowpoly-modular-dungeon-pack | Pedestal | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-dungeon-pack | OBJ 0.06, FBX 0.04 | stone pedestal | 1844 | G5 | azathoth (the seat's plinth) |
| oga-lowpoly-modular-dungeon-pack | Arch | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-dungeon-pack | OBJ 0.17, FBX 0.08 | stone arch | 4484 | G5, G8 | nug (gallery mouth) |
| oga-lowpoly-modular-dungeon-pack | Arch_bars | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-dungeon-pack | OBJ 0.04, FBX 0.03 | arch with iron gate | 1603 | G8 | orne (crypt gate) |
| oga-lowpoly-modular-dungeon-pack | Fence_Straight_Modular | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-dungeon-pack | OBJ 0.00, FBX 0.02 | iron fence section | 104 | G8, G11 | hutchinson (bailey fence) |
| oga-lowpoly-modular-dungeon-pack | Column | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-dungeon-pack | OBJ 0.02, FBX 0.02 | stone column | 440 | G9 | colossus |
| oga-lowpoly-modular-dungeon-pack | Statue_Horse | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-dungeon-pack | OBJ 0.06, FBX 0.04 | horse statue | 1850 | G7 | yig (shrine guardians) |
| oga-lowpoly-textured-trees | DeadTree_1 | Quaternius | CC0 | https://opengameart.org/content/lowpoly-textured-trees | OBJ 0.03, FBX 0.03 | stylised dead tree | 444 | G2 | bokrug (drowned wood) |
| oga-lowpoly-textured-trees | DeadBirch_1 | Quaternius | CC0 | https://opengameart.org/content/lowpoly-textured-trees | OBJ 0.08, FBX 0.05 | stylised dead birch | 1210 | G2 | orne (dead trees at the back corners) |
| oga-low-poly-nature-pack-1 | BirchTree_Dead_1 | Quaternius | CC0 | https://opengameart.org/content/low-poly-nature-pack-1 | OBJ 0.04, FBX 0.03 | dead birch | 820 | G2 | hutchinson (dead trees behind the donjon) |
| oga-low-poly-nature-pack-1 | TreeStump | Quaternius | CC0 | https://opengameart.org/content/low-poly-nature-pack-1 | OBJ 0.01, FBX 0.02 | tree stump | 232 | G2 | any wooded court |
| oga-low-poly-nature-pack-1 | Lilypad | Quaternius | CC0 | https://opengameart.org/content/low-poly-nature-pack-1 | OBJ 0.02, FBX 0.02 | lily pad | 372 | G2 | bokrug (lake) |
| oga-low-poly-nature-pack-1 | Rock_Moss_1 | Quaternius | CC0 | https://opengameart.org/content/low-poly-nature-pack-1 | OBJ 0.00, FBX 0.02 | mossy rock | 70 | G2 | bokrug (lake shore) |
| oga-lowpoly-crops-pack | Mushroom_1 | Quaternius | CC0 | https://opengameart.org/content/lowpoly-crops-pack | OBJ 0.01, FBX 0.02 | mushroom | 160 | G3 | yig (behind the coil) |
| oga-ultimate-space-glb | Tree Spiral | Quaternius | CC0 | https://opengameart.org/content/ultimate-space-kit-by-quaternius | GLB 0.03 | spiral alien tree | 748 | G3 | colour (root creeping from the well) |
| oga-ultimate-space-glb | Tree Spikes | Quaternius | CC0 | https://opengameart.org/content/ultimate-space-kit-by-quaternius | GLB 0.06 | spiked alien tree | 1698 | G3 | ancients |
| oga-ultimate-space-glb | Tree Lava | Quaternius | CC0 | https://opengameart.org/content/ultimate-space-kit-by-quaternius | GLB 0.04 | alien tree | 1088 | G3 | nug (no named fit) |
| oga-ultimate-space-glb | Tree Floating | Quaternius | CC0 | https://opengameart.org/content/ultimate-space-kit-by-quaternius | GLB 0.08 | floating alien tree | 2428 | G3, G6 | othergods (over the dais) |
| oga-ultimate-space-glb | House Pod | Quaternius | CC0 | https://opengameart.org/content/ultimate-space-kit-by-quaternius | GLB 0.18 | pod-shaped dwelling | 4938 | G3, G6 | yog (pods) |
| oga-ultimate-space-glb | Planet | Quaternius | CC0 | https://opengameart.org/content/ultimate-space-kit-by-quaternius | GLB 0.05 | sphere planet | 1320 | G6 | zkauba (sphere on the pylon tops) |
| oga-ultimate-space-glb | Geodesic Dome | Quaternius | CC0 | https://opengameart.org/content/ultimate-space-kit-by-quaternius | GLB 0.08 | geodesic dome | 1432 | G6 | azathoth (domes on the flanks) |
| oga-ultimate-space-glb | Roof Radar | Quaternius | CC0 | https://opengameart.org/content/ultimate-space-kit-by-quaternius | GLB 0.04 | radar dish | 972 | G10 | hutchinson (lab roof) |
| oga-lowpoly-modular-sci-fi-environments | Props_Pod | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-sci-fi-environments | OBJ 0.09, FBX 0.05 | sci-fi pod | 2246 | G3, G10 | bokrug (pods in the shallows) |
| oga-lowpoly-modular-sci-fi-environments | Props_Teleporter_1 | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-sci-fi-environments | OBJ 0.03, FBX 0.03 | portal frame | 688 | G6 | yog (portal) |
| oga-lowpoly-modular-sci-fi-environments | Props_Statue | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-sci-fi-environments | OBJ 0.05, FBX 0.04 | sci-fi statue | 1128 | G7 | othergods (the dais) |
| oga-lowpoly-modular-sci-fi-environments | Props_Vessel_Tall | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-sci-fi-environments | OBJ 0.01, FBX 0.02 | tall tank | 316 | G10 | hutchinson (laboratory) |
| oga-lowpoly-modular-sci-fi-environments | Details_Pipes_Long | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-sci-fi-environments | OBJ 0.02, FBX 0.03 | pipe run | 498 | G10 | hutchinson or colour |
| oga-ship-pack | Sail ship | Quaternius | CC0 | https://opengameart.org/content/lowpoly-ship-pack | OBJ 0.15, FBX 0.08 | sailing ship | 3938 | G4 | cthulhu (mast out of the hull) |
| oga-ship-pack | Viking boat | Quaternius | CC0 | https://opengameart.org/content/lowpoly-ship-pack | OBJ 0.07, FBX 0.04 | longship | 1640 | G4 | martins (washed up beyond the basin) |
| oga-survival-pack | Raft | Quaternius | CC0 | https://opengameart.org/content/lowpoly-survival-pack | OBJ 0.05, FBX 0.03 | raft | 1036 | G4 | martins |
| oga-survival-pack | PropaneTank | Quaternius | CC0 | https://opengameart.org/content/lowpoly-survival-pack | OBJ 0.02, FBX 0.02 | propane tank | 516 | G10 | colour (by the well) |
| oga-survival-pack | Tent | Quaternius | CC0 | https://opengameart.org/content/lowpoly-survival-pack | OBJ 0.03, FBX 0.03 | tent | 788 | G11 | none set (camp beside a court) |
| oga-space-pack | Planet2 | Quaternius | CC0 | https://opengameart.org/content/low-poly-space-assets | OBJ 0.03 | planet | 422 | G6 | colour (half sunk at the well's lip) |
| oga-space-pack | BigAsteroid | Quaternius | CC0 | https://opengameart.org/content/low-poly-space-assets | OBJ 0.01 | asteroid | 80 | G6 | ancients (rock in the sky) |
| oga-lowpoly-rpg-characters | Wizard | Quaternius | CC0 | https://opengameart.org/content/lowpoly-rpg-characters | OBJ 0.44, FBX 2.70 | robed wizard | 5376 | G7 | blackman (frozen sabbat) |
| oga-lowpoly-medieval-village-pack | Bell_Tower | Quaternius | CC0 | https://opengameart.org/content/lowpoly-medieval-village-pack | OBJ 0.78, FBX 0.20 | bell tower | 11799 | G8 | orne (over the chapel) |
| oga-lowpoly-medieval-village-pack | Well | Quaternius | CC0 | https://opengameart.org/content/lowpoly-medieval-village-pack | OBJ 0.11, FBX 0.05 | stone well | 1870 | G11 | colour (the well) |
| oga-lowpoly-medieval-village-pack | Cart | Quaternius | CC0 | https://opengameart.org/content/lowpoly-medieval-village-pack | OBJ 0.10, FBX 0.06 | hand cart | 2660 | G11 | orne (cart in the plot) |
| oga-lowpoly-medieval-village-pack | Mill | Quaternius | CC0 | https://opengameart.org/content/lowpoly-medieval-village-pack | OBJ 0.55, FBX 0.15 | mill (windmill) | 8126 | G11 | colour (the farm by the well) |
| oga-lowpoly-medieval-village-pack | House_1 | Quaternius | CC0 | https://opengameart.org/content/lowpoly-medieval-village-pack | OBJ 0.40, FBX 0.11 | medieval house | 5758 | G11 | orne (farmhouse) |
| oga-lowpoly-medieval-village-pack | Stable | Quaternius | CC0 | https://opengameart.org/content/lowpoly-medieval-village-pack | OBJ 0.49, FBX 0.13 | barn or stable | 6246 | G11 | orne (barn beyond the plot) |
| oga-lowpoly-medieval-buildings | WindowGothic | Quaternius | CC0 | https://opengameart.org/content/lowpoly-medieval-buildings | OBJ 0.00, FBX 0.01 | gothic window | 68 | G8 | orne (chapel windows) |
| oga-street-pack | Streetlight_Single | Quaternius | CC0 | https://opengameart.org/content/lowpoly-modular-street-pack | OBJ 0.04 | street lamp post | 1028 | G8, G11 | orne (THE LAMPS ARE LIT) |
| oga-lowpoly-steampunk-turrets | GearCannon_1 | Quaternius | CC0 | https://opengameart.org/content/lowpoly-steampunk-turrets | OBJ 0.06, FBX 0.04 | steam gun turret | 1696 | G10 | hutchinson (bailey gun) |
| oga-lowpoly-steampunk-turrets | Laser_Quad | Quaternius | CC0 | https://opengameart.org/content/lowpoly-steampunk-turrets | OBJ 0.17, FBX 0.08 | laser turret | 4604 | G10 | colour (energy at the well) |

NOT FOUND: G1 (coffins, tombs, mummies, gibbets, ribcages, spines), G2 (reeds, roots), G3 (coral, shells), G4 (fish, nets, anchors, piers, lighthouse), G5 (menhirs, obelisks, monoliths, cairns, thrones, sphinx, ziggurats), G6 (crystals, rings, spires), G7 (heads, masks, idols, totems, gargoyles, crowned kings), G8 (mausoleums, tombstones, chapels, chains), G9 (Egyptian and Mesoamerican pieces, capitals, urns, step pyramids), G10 (tesla coils, boilers, valves), G11 (scarecrows, chimneys, ruined walls).

Notes:
- Quaternius's own Google Drive packs (the pack pages' main download) returned "Google Drive - Quota exceeded" for every file tried this session, including License.txt, so none came from quaternius.com. Retry those links later: piratekit (fish, anchor, dock, bones), medievaldungeon, stylizedtree, survival, farmbuildings, medievalvillage.
- Not downloaded: OGA megakits (fantasy props, medieval village megakit, stylized nature megakit, modular sci-fi megakit, sci-fi essentials, low-poly RPG pack, spaceships pack): zips of 44 to 104 MB, over the 40 MB limit.
- Triangles were counted by me from the OBJ files (n-2 per face) or the GLB index counts; FBX was not counted, and no page states a count. OBJ parts carry no image texture map (flat-coloured); GLB parts embed their texture. "What it is" is read from the file name; no model was viewed.
- REPORT.md was not written, because this run's instructions say not to write report .md files; this table is the report.

### OpenGameArt: horror parts

slug | name | author | licence | page URL | formats, MB | what it is | rough triangles | gaps | best fit
3d-dungeon-debris-skull-and-bones | 3D dungeon debris - skull and bones | Paul Wortmann | CC0 | https://opengameart.org/content/3d-dungeon-debris-skull-and-bones | blend, obj, png, 5.8 | bone and skull debris, OBJ per piece | not stated | G1 | Simon Orne; Shub-Niggurath
boneman | Boneman | ScoutingNinja (model), sandsound (anims) | CC0 | https://opengameart.org/content/boneman | blend (md5 unused), 6.9 | animated skeleton | not stated | G1 | Simon Orne; Daemon Pipers
coffin-0 | Coffin | Paul Wortmann | CC0 | https://opengameart.org/content/coffin-0 | blend, obj, 2.2 | low-poly coffin, 3 pieces | not stated | G1 | Simon Orne
decorated-skeleton | Decorated Skeleton (Calaca) | Teh_Bucket | CC0 | https://opengameart.org/content/decorated-skeleton | blend, fbx, 1.1 | Day-of-the-Dead skeleton, rigged | ~600 (page) | G1 | Daemon Pipers
human-skull-0 | Human Skull | CDmir | CC0 | https://opengameart.org/content/human-skull-0 | obj, 9.5 | single human skull | 4,538 (page) | G1, G7 | Shub-Niggurath; Simon Orne (skull pyramid)
tomb | tomb | zerberros | CC0 | https://opengameart.org/content/tomb | blend, 0.6 | plain stone tomb | not stated | G1, G8 | Simon Orne
poorly-made-bone | Poorly Made Bone | Ouren | CC0 | https://opengameart.org/content/poorly-made-bone | blend, 0.5 | one long bone | not stated | G1 | Martin's Beach
crocodile-bone-statue | Crocodile Bone Statue | the_mazander_man | CC-BY 3.0 | https://opengameart.org/content/crocodile-bone-statue | glb, blend, 3.1 | bone crocodile statue, textured | 6.9k (page) | G1, G7 | Bokrug
mort-safe | mort safe - low poly | Paul Wortmann | CC0 | https://opengameart.org/content/mort-safe | blend, obj, 4.7 | grave safe | not stated | G1, G8 | Simon Orne
3-dead-trees | 3 dead trees | p0ss | CC-BY 3.0 | https://opengameart.org/content/3-dead-trees | blend, 0.7 | three L-system dead trees | ~1,000 faces each (page) | G2 | Bokrug; Yig
entangled-roots | Entangled Roots | piacenti | CC-BY 3.0 | https://opengameart.org/content/entangled-roots | blend, 23.2 | tangled roots (needs decimating) | not stated | G2 | Colour Out of Space (creeping root at the well)
stump | Stump | Mish7913 | CC0 | https://opengameart.org/content/stump | obj, 0.1 | low-poly stump | 78 (page) | G2 | Bokrug shore
lowpoly-wooden-stump | LowPoly Wooden Stump | Aredon | CC0 | https://opengameart.org/content/lowpoly-wooden-stump | fbx, obj, 0.2 | wooden stump | not stated | G2 | Colour Out of Space (by the well)
low-poly-trees-stumps-branches | Low-poly trees, stumps, branches | Lamoot | CC-BY 3.0 | https://opengameart.org/content/low-poly-trees-stumps-branches | blend, 3.7 | trees, stumps, branches | 300-1,600 per model (page) | G2 | Bokrug; Yig
free-low-poly-nature-project-pack-2-swamp | Free Low Poly Nature Project Pack 2 Swamp | EmacEArt | CC-BY 4.0 | https://opengameart.org/content/free-low-poly-nature-project-pack-2-swamp | blend, 2.6 | swamp biome pack (contents not itemised) | not stated | G2 | Bokrug (drowned wood)
free-mid-poly-stylized-swamp-remastered | Free Mid Poly Stylized Swamp Remastered | EmacEArt | CC-BY 4.0 | https://opengameart.org/content/free-mid-poly-stylized-swamp-remastered | fbx (228), 17.3 | swamp kit: broken trees, roots, dead grass, mossy rocks, fences | ~218 prefabs (page) | G2, G11 | Bokrug (shore); Colour Out of Space
medieval-statue | Medieval Statue (Sun Goddess) | Daniel Andersson (hreikin) | CC0 | https://opengameart.org/content/medieval-statue | blend, dae, 3.2 | marble goddess statue | not stated | G7 | The Colossus (colonnade bays)
demon-statue | Demon statue | yd | CC0 | https://opengameart.org/content/demon-statue | blend, 1.9 | demon statue (page: from a public-domain BlendSwap model) | not stated | G7 | Daemon Pipers (by the drums); Black Man
knight-statue | Knight statue | yd | CC0 | https://opengameart.org/content/knight-statue | blend, 2.0 | granite kneeling knight | not stated | G7 | Yig (shrine guardian)
statue-holding-lightpost | Statue holding Lightpost | Colorado Stark | CC0 | https://opengameart.org/content/statue-holding-lightpost | obj, tga, jpg, 54.3 | statue holding a lamp post | not stated | G7, G8 | Edward Hutchinson (bailey)
cemetery | Cemetery | Savino | CC0 | https://opengameart.org/content/cemetery | obj, <0.1 | six gravestones, no textures | not stated | G8 | Simon Orne (churchyard)
church-0 | Church (interior) | stereoscopic | CC0 | https://opengameart.org/content/church-0 | blend, 6.8 | church interior | not stated | G8 | Simon Orne (chapel)
medieval-church | Medieval Church | Daniel Andersson (hreikin) | CC0 | https://opengameart.org/content/medieval-church | blend, dae, 19.8 | medieval church, door and tower | not stated | G8 | Simon Orne; Ancient Ones
cage-opendungeons | Cage [OpenDungeons] | eugeneloza (texture Nobiax) | CC0 | https://opengameart.org/content/cage-opendungeons | blend, tga, 3.5 | cage bed | 244 (page) | G8 | Nug (gallery cell)
free-necropoly-graveyard-halloween-exterior-kit | Free NecroPoly Graveyard Halloween Exterior Kit | EmacEArt | CC-BY 4.0 | https://opengameart.org/content/free-necropoly-graveyard-halloween-exterior-kit | fbx (76), 6.4 | graveyard kit: monuments, obelisk, arch ruins, gate, swamp roots | not stated | G8, G2, G11 | Simon Orne; Bokrug
mausoleum1 | mausoleum_1 | Paul Wortmann | CC0 | https://opengameart.org/content/mausoleum1 | blend, obj, 23.2 | mausoleum | not stated | G8, G1 | Simon Orne
high-poly-church-bell | High-poly church bell | Lamoot | CC0 | https://opengameart.org/content/high-poly-church-bell | blend, 0.3 | church bell | not stated | G8 | Simon Orne (tower)
lamp-post-bench-trashcan | Lamp Post Bench TrashCan | loafbrr_1 | CC0 | https://opengameart.org/content/lamp-post-bench-trashcan | fbx (14), gltf, blend, 16.1 | lamp posts, bench, cans | not stated | G8, G11 | Martin's Beach (promenade)
street-sign-with-light-post | Street Sign with Light Post | Ouren | CC-BY 3.0 | https://opengameart.org/content/street-sign-with-light-post | blend, 1.0 | street sign on light post | not stated | G11, G8 | Gorgon (drive gate)
covered-well | Covered well | Iconoclast | CC0 | https://opengameart.org/content/covered-well | blend, 3.9 | covered well | not stated | G11 | Colour Out of Space (the well)
stone-well | Stone well | 13black_cat69 | CC0 | https://opengameart.org/content/stone-well | blend, 1.1 | low-poly stone well | not stated | G11 | Edward Hutchinson (court)
medieval-well | Medieval Well | Daniel Andersson (hreikin) | CC0 | https://opengameart.org/content/medieval-well | blend, 3.3 | medieval well | not stated | G11 | Gorgon (garden); Hutchinson
free-tent | Free Tent (TowerShack) | Rakshi Games | CC-BY 3.0 | https://opengameart.org/content/free-tent | fbx, 19.2 | tent | not stated | G11 | Martin's Beach (camp)
hand-cart-lowpoly | Hand Cart lowpoly | WeaponGuy | CC-BY 3.0 | https://opengameart.org/content/hand-cart-lowpoly | blend, 1.4 | hand cart | not stated | G11 | Gorgon (cart at garden wall)
handwagon | Handwagon | plaggy | CC0 | https://opengameart.org/content/handwagon | fbx, obj, dae, 3.0 | hand wagon | not stated | G11 | Gorgon; Colour Out of Space
old-windmill | old windmill | yd | CC0 | https://opengameart.org/content/old-windmill | blend, 1.4 | windmill | not stated | G11 | a farm court (none in ARENA_MIXES)
free-windmill | Free Windmill | Rakshi Games | CC-BY 3.0 | https://opengameart.org/content/free-windmill | fbx, 9.6 | windmill | not stated | G11 | Colour Out of Space (farm)
3d-wood-fence | 3D Wood Fence | exocet | CC-BY 3.0 | https://opengameart.org/content/3d-wood-fence | obj, 0.5 | wooden fence | not stated | G11 | Gorgon (garden wall)
low-poly-steel-fence-with-concrete-modular | Low Poly Steel Fence with Concrete - Modular | Hernandack | CC0 | https://opengameart.org/content/low-poly-steel-fence-with-concrete-modular | obj, 0.4 | steel and concrete fence modules | not stated | G8, G11 | Simon Orne (iron fence); Gorgon
industrial-extension-pack-3-factory-chimneys | Industrial Extension Pack 3: Factory Chimneys | rubberduck | CC0 | https://opengameart.org/content/industrial-extension-pack-3-factory-chimneys | blend, 9.0 | two factory chimneys (industrial) | not stated | G11 | Martin's Beach (stacks)
destroyed-walls-3d-models | Destroyed Walls - 3D models | LFA | CC-BY 3.0 | https://opengameart.org/content/destroyed-walls-3d-models | fbx, obj, 12.4 | broken wall pieces | not stated | G11 | Gorgon (ruined wall); Ancient Ones
medieval-farm-house | Medieval Farm House | T Allen Studios | CC-BY 4.0 | https://opengameart.org/content/medieval-farm-house | fbx, 0.1 | farmhouse | 1,684 (page) | G11 | Colour Out of Space (farm)
medieval-gatehouse | Medieval Gatehouse | Daniel Andersson (hreikin) | CC0 | https://opengameart.org/content/medieval-gatehouse | blend, dae, 7.0 | gatehouse with doors | not stated | G8 | Edward Hutchinson (gate); Gorgon

Boss ids for the fits: simon_orne, bokrug, colour_out_of_space, edward_hutchinson, medusa_gorgon, martins_beach_horror, shub_niggurath, yig, nug, daemon_pipers, ancient_ones, black_man, colossus_pyramids.

NOT FOUND: G1 giant ribcage, spine, mummy, gibbet, sarcophagus, grave slab; G2 reeds, lily pads; G7 masks, totems, gargoyles, robed figures, crowned kings; G8 crypt doors, church windows, chains; G11 scarecrows, barns.

Rejected (not kept): licence chain unread or non-standard (low-poly-retro-psx-skeleton, skull-mask, tree-stump-1, fantasy-tombstone, medieval-tents, medieval-fence, old-metal-fence, gibbet-0, chain-link-fence); COLLADA-only (old-stone-well, old-wood-barn); too big (dead-tree-0, 53 MB); 7z-only, no extractor here (stone-coffin, gibbet, beast-chains, low-poly-skeleton-head, well-of-lost-souls, broken-stone-slab); SA, GPL or NC (tent-0, cart-1, celtic-cross, gnarled-old-tree, gravestones, wood-cart, human-skull, old-skull, blood-altar, old-stone-altar, piles-of-stuff, dragon-skull, well-1, scarecrow-character, savinos-cemetery-redux).

REPORT.md was not written: this run's rules forbid report files, so the table above is the report.

### OpenGameArt: cosmic and architectural parts

| slug | name | author | licence | page URL | formats, MB | what it is | rough triangles | gaps | best fit |
|---|---|---|---|---|---|---|---|---|---|
| lowpoly-mushroom | LowPoly Mushroom | Aredon | CC0 | https://opengameart.org/content/lowpoly-mushroom | fbx, obj, 0.1 | one low-poly mushroom, one texture | - | G3 | shub (spore sites) |
| mushroom-3 | Mushroom | JeremyWoods | CC0 | https://opengameart.org/content/mushroom-3 | blend, 2.7 | one mushroom, three alternate colour textures | - | G3 | shub |
| mushroom-5 | Mushroom (Cogumelo) | amaralzin9309 | CC BY 4.0 | https://opengameart.org/content/mushroom-5 | blend, 0.5 | one mushroom | - | G3 | shub |
| strange-egg | Strange Egg | Umplix | CC0 | https://opengameart.org/content/strange-egg | fbx, 0.01 | one egg | - | G3 | bokrug (eggs in the shallows) |
| egg-3 | Egg | Blocky Modeler | CC0 | https://opengameart.org/content/egg-3 | obj, 0.01 | one plain egg | - | G3 | bokrug |
| cryo-pod | Cryo-pod | FacadeGaikan | CC0 | https://opengameart.org/content/cryo-pod | blend, 1.0 | sci-fi cryo pod (pod form, machine) | - | G3, G6, G10 | hutchinson (laboratory) |
| low-poly-pirate-ship | Low-Poly Pirate Ship | JamesWhite | CC0 | https://opengameart.org/content/low-poly-pirate-ship | blend, 0.1 | very low-poly pirate ship | - | G4 | cthulhu (the Alert's mast and hull) |
| pirate-ship-0 | Pirate Ship | Daniel Quevedo | CC0 | https://opengameart.org/content/pirate-ship-0 | obj, 0.5 | galleon, author says incomplete (ngons, overlapping verts) | - | G4 | cthulhu (quay) |
| ship-cannon | Ship Cannon | JamesWhite | CC0 | https://opengameart.org/content/ship-cannon | blend, 0.3 | low-poly ship cannon | - | G4 | cthulhu (quay cannon) |
| low-poly-lighthouse-scene | Low-Poly Lighthouse Scene | ultr4vis1tor | CC0 | https://opengameart.org/content/low-poly-lighthouse-scene | blend, 1.6 | lighthouse tower with trees and a torch | - | G4 | martins (the shore) |
| lighthouse-model | Lighthouse Model | hansolo | CC BY 3.0 | https://opengameart.org/content/lighthouse-model | blend, 0.5 | textured lighthouse | 232 | G4 | martins |
| anchor | Anchor | magicink | CC BY 4.0 | https://opengameart.org/content/anchor | blend, 1.2 | ship's anchor | - | G4 | martins (wreck on the sand) |
| metal-barrels-pack | Metal Barrels Pack | Yughues | CC0 | https://opengameart.org/content/metal-barrels-pack | fbx, obj, 22.3 | metal barrels with textures | - | G4 | cthulhu (quay crates) |
| wood-barrels-pack | Wood Barrels Pack | Yughues | CC0 | https://opengameart.org/content/wood-barrels-pack | fbx, obj, 11.5 | big and mini wood barrels | - | G4 | martins (washed-up cargo) |
| simple-wood-boat | Simple Wood Boat | mikeask | CC0 | https://opengameart.org/content/simple-wood-boat | blend, 0.5 | small wooden boat | - | G4 | martins (washed-up boat) |
| whale-lowpoly | Whale (lowpoly) | Teh_Bucket | CC0 | https://opengameart.org/content/whale-lowpoly | blend, 0.9 | low-poly whale | - | G4 | martins (the washed-up thing) |
| piranha | Piranha | JamesWhite | CC0 | https://opengameart.org/content/piranha | obj, 0.2 | piranha with texture | - | G4 | bokrug (the lake's fish) |
| trout | Trout | sandsound | CC BY 3.0 | https://opengameart.org/content/trout | blend, 0.5 | trout | - | G4 | bokrug (the lake) |
| the-dark-pyramid | The Dark Pyramid | Umplix | CC0 | https://opengameart.org/content/the-dark-pyramid | fbx, 0.02 | pyramid with a red light | - | G5, G9 | nyarlathotep (the dais) |
| star-altar-opendungeons | Star Altar [OpenDungeons] | eugeneloza | CC0 | https://opengameart.org/content/star-altar-opendungeons | blend, 0.5 | star altar, 227 verts | 408 | G5 | azathoth (the seat's floor) |
| dwarven-altar | Dwarven Altar | bobjh | CC BY 4.0 | https://opengameart.org/content/dwarven-altar | blend, 0.8 | low-poly dwarven stone altar | 342 quads | G5 | orne (altar before the chapel) |
| medieval-stone-temple | Medieval Stone Temple | AnyRPG | CC0 | https://opengameart.org/content/medieval-stone-temple | blend, 1.5 | stone temple (derivative of blendswap 2612) | 3062 | G5 | yig (the shrine) |
| mysterious-monolith | Mysterious Monolith | bobjh | CC BY 4.0 | https://opengameart.org/content/mysterious-monolith | blend, 8.5 | rock monolith with glowing runes at its base | 106 quads | G5, G6 | othergods (posts of light) |
| opendungeons-barbarian-throne | [OpenDungeons] Barbarian throne | eugeneloza | CC0 | https://opengameart.org/content/opendungeons-barbarian-throne | blend, 2.1 | barbarian throne | - | G5 | hastur (the King's seat) |
| mage-throne-opendungeons | Mage Throne [OpenDungeons] | eugeneloza | CC0 | https://opengameart.org/content/mage-throne-opendungeons | blend, 2.3 | mage throne | - | G5 | azathoth (blind god's seat) |
| rocky-arch | rocky arch | Paul Wortmann | CC0 | https://opengameart.org/content/rocky-arch | blend, 4.8 | natural rock arch | - | G5 | nug (the mound's mouth) |
| acient-ruins | Acient ruins | killyoverdrive | CC BY 3.0 | https://opengameart.org/content/acient-ruins | blend, 3.5 | ruined entrance | - | G5, G9 | zkauba (stair into the wall) |
| lowpoly-crystals | LowPoly Crystals | Aredon | CC0 | https://opengameart.org/content/lowpoly-crystals | fbx, obj, 0.4 | crystals in three colours | - | G6 | hutchinson (salt grown to crystal) |
| 3d-mese-crystal | 3D (Mese) Crystal | rubberduck | CC0 | https://opengameart.org/content/3d-mese-crystal | blend, 0.4 | mese crystal | - | G6 | colour (the well) |
| large-crystal | Large Crystal | AnyRPG | CC0 | https://opengameart.org/content/large-crystal | blend, 1.3 | large solid crystal | 60 | G6 | colour (the well's lip) |
| low-poly-portal | Low Poly Portal | HippoDevelopment | CC0 | https://opengameart.org/content/low-poly-portal | blend, glb, obj, 0.1 | simple portal | - | G6 | yog (frame in place of the rings) |
| alien-buildingbase-set | alien-building/base set | rubberduck | CC0 | https://opengameart.org/content/alien-buildingbase-set | blend, 20.3 | about 30 alien base parts: UFO, rooms, cables, tower | - | G6 | ancients (far city of the Elder Things) |
| space-kit-remade | Space Kit (remade) | Kenney | CC0 | https://opengameart.org/content/space-kit-remade | fbx, glb, obj (+dae, stl), 6.7 | 153 space models: turrets, monorail, pipes, corridors, rocks, craft | - | G6, G10 | cthulhu (beyond the walls) |
| reactor | Reactor | nazzyc | CC BY 3.0 | https://opengameart.org/content/reactor | blend, 0.1 | reactor | - | G6, G10 | colour (the well) |
| chichen-itza-el-castillo | Chichen Itza - El Castillo | elopez7 | CC0 | https://opengameart.org/content/chichen-itza-el-castillo | fbx, 34.2 | stepped Mesoamerican pyramid, PBR textures (WIP per author) | - | G5, G9 | yig (stepped gate) |
| simple-mayan-temple | Simple Mayan Temple | TitaniumFalcon | CC0 | https://opengameart.org/content/simple-mayan-temple | blend, 0.5 | simple Mayan temple | - | G9 | nug (back gallery) |
| pyramid-3d | Pyramid 3d | Intrix | CC0 | https://opengameart.org/content/pyramid-3d | blend, 0.9 | stone pyramid about 10 m tall | - | G5, G9 | zkauba (stair into the wall) |
| egyptian-pyramids-low-poly | Egyptian Pyramids Low Poly | SUMO STUDIOS | CC BY 4.0 | https://opengameart.org/content/egyptian-pyramids-low-poly | blend, 5.9 | Egyptian pyramids, low poly | - | G9, G5 | nug (the mound) |
| lowpoly-trajans-column-model | Lowpoly Trajan's column model | Micket | CC0 | https://opengameart.org/content/lowpoly-trajans-column-model | blend, 0.1 | Trajan's column, no texture | - | G9 | colossus (colonnade's bays) |
| toscan-column-low-poly | Toscan column (low poly) | XaosXV | CC0 | https://opengameart.org/content/toscan-column-low-poly | blend, 8.3 | crackled Tuscan column, baked normals | - | G9 | colossus (colonnade's bays) |
| cremation-urn | Cremation Urn | ARoachIFoundOnMyPillow | CC0 | https://opengameart.org/content/cremation-urn | blend, 0.4 | cremation urn, low and high poly | - | G9 | orne (the crypt) |
| aztec-buildings | Aztec Buildings | Kuvrot | CC0 | https://opengameart.org/content/aztec-buildings | blend, fbx, glb, gltf, obj, 21.7 | mining camp, archery range and more (20 models) | - | G9 | yig (Aztec courtyard) |
| stylized-vases-and-pots | Stylized Vases And Pots | FabinhoSC | CC0 | https://opengameart.org/content/stylized-vases-and-pots | blend, fbx, obj, 6.4 | 61 stylised vases and pots | - | G9 | orne (the crypt's urns) |
| energy-pipe | Energy Pipe | musdasch | CC0 | https://opengameart.org/content/energy-pipe | blend, 0.5 | energy cell or pipe for a sci-fi machine | - | G10 | hutchinson (the lab) |
| cast-iron-pipe | Cast Iron Pipe | bobjh | CC BY 4.0 + CC BY 3.0 | https://opengameart.org/content/cast-iron-pipe | blend, 3.6 | cast-iron pipe section | 442 faces | G10 | hutchinson (the lab) |
| 3d-lowpoly-modular-pipes | 3d lowpoly modular pipes | Godzillanaynay | CC BY 4.0 | https://opengameart.org/content/3d-lowpoly-modular-pipes | blend, 1.7 | modular pipes, UV unwrapped, no textures | about 300 per pipe | G10 | hutchinson (the lab) |
| power-generator | Power Generator | Ouren | CC BY 3.0 | https://opengameart.org/content/power-generator | blend, 0.5 | power generator | - | G10 | hutchinson (second conductor on the roof) |
| gaz-tank-pack | Gaz Tank Pack | Yughues | CC0 | https://opengameart.org/content/gaz-tank-pack | fbx, obj, 5.9 | gas tank with textures | - | G10 | hutchinson (the lab) |
| kind-of-a-gas-tank | Kind of a Gas Tank | moxomo | CC0 | https://opengameart.org/content/kind-of-a-gas-tank | fbx, 4.7 | gas tank with maps | - | G10 | hutchinson (the lab) |
| modularsewersystem | Modular_Sewer_System | elopez7 | CC0 | https://opengameart.org/content/modularsewersystem | blend, 2.5 | six modular sewer pieces (pipes, slopes, junctions) | - | G10 | hutchinson (the drains) |
| industrial-extension-pack-4-more-tanks | Industrial Extension Pack 4: more tanks | rubberduck | CC0 | https://opengameart.org/content/industrial-extension-pack-4-more-tanks | blend, 33.3 | industrial tanks | - | G10 | hutchinson (the lab) |
| industrial-extension-pack-1-tanks | Industrial Extension Pack 1: tanks | rubberduck | CC0 | https://opengameart.org/content/industrial-extension-pack-1-tanks | blend, 36.5 | industrial tanks, pack 1 | - | G10 | hutchinson (the lab) |

NOT FOUND: G3 tentacle, coral, shells; G4 masts, rigging, nets, piers, crates; G5 standing stones, cairns, braziers, candelabra, sphinx, stairs; G6 floating rocks, orbs, rings, spires, tubes; G9 capitals, reliefs, braziers, Egyptian statuary; G10 tesla coils, glass tanks, valves.
Rejected: licence (SA, GPL, OGA-BY 4.0 listed, or no files): giant-egg-sack, tentacle-monster, ancient-temple-0, old-stone-altar, roman-vase, four-science-fiction-buildings, gateway-ark, shrine-shinto-japan, hextraction-base-player-pod, floating-tank, barrels-0, eldritch-portal-model-with-pbr-textures, glowing-column, big-wine-barrel, space-base-platforms, spinning-pharaoh. Over 40 MB: low-poly-mushroom-kit, alien-artifacts-sculptures-high-poly, terraforming-building-pack, scifi-generator, high-quality-industrial-asset-pack, modular-industrial-pipes-kit. No importable format (DAE/DTS only): 3td-harbour-pack, 3td-fantasy-ruins-pack, 3td-industrial-pack. Archives in 7z or rar with no extractor on this machine (CC0 unless noted): free-pillars-models, lowpoly-pirate-props, free-wooden-crates, medieval-props-pack, basic-fish-low-poly, carinated-stone-jar (CC BY 4.0), alien-bug-egg (CC BY 3.0), reactor-0, ruins-v11, ruins-0.
REPORT.md not written: the agent rules bar report .md files, so this table is the report.

### Poly Haven: nature (CC0)

| slug | name | author | licence | page URL | formats, MB | what it is | rough triangles | gaps | best arena or hall |
|---|---|---|---|---|---|---|---|---|---|
| large_castle_door | Large Castle Door | Tina | CC0 1.0 | https://polyhaven.com/a/large_castle_door | glTF 1k, 3.27 | arched wooden castle door, iron straps and studs | 12,640 | G8 | simon_orne (crypt door; guess) |
| large_iron_gate | Large Iron Gate | Josh Dean | CC0 1.0 | https://polyhaven.com/a/large_iron_gate | glTF 1k, 3.13 | pair of tall wrought-iron gates, vertical bars | 38,140 (decimate) | G8 | simon_orne (churchyard gate; guess) |
| street_lamp_01 | Street Lamp 01 | Josh Dean | CC0 1.0 | https://polyhaven.com/a/street_lamp_01 | glTF 1k, 2.17 | 3.9 m cast-iron lamp post with lantern head | 30,610 | G8 | simon_orne (chapel path; guess) |
| street_lamp_02 | Street Lamp 02 | Josh Dean | CC0 1.0 | https://polyhaven.com/a/street_lamp_02 | glTF 1k, 1.87 | shorter iron lamp on fluted post, glass lantern | 20,338 | G8 | edward_hutchinson (court lamps; guess) |
| Chandelier_02 | Chandelier 02 | Kirill Sannikov | CC0 1.0 | https://polyhaven.com/a/Chandelier_02 | glTF 1k, 1.18 | brass chandelier, ring of shaded lamps on arms | 21,514 | G5, G8 | simon_orne (chapel nave; guess) |
| wooden_lantern_01 | Wooden Lantern 01 | James Ray Cock | CC0 1.0 | https://polyhaven.com/a/wooden_lantern_01 | glTF 1k, 3.77 | wooden framed lantern with glass panes | 8,321 | G8 | any court path (no single fit) |
| gothic_statue | Gothic Statue | Benny Weimer | CC0 1.0 | https://polyhaven.com/a/gothic_statue | glTF 1k, 3.98 | robed, crowned figure with staff, dark metal | 27,739 | G7 | yig (shrine guardians, ARENA_MIXES) |
| marble_bust_01 | Marble Bust 01 | Rico Cilliers | CC0 1.0 | https://polyhaven.com/a/marble_bust_01 | glTF 1k, 0.90 | white marble bust of a bearded classical man | 17,456 | G7 | medusa_gorgon (statue head in drive; by analogy) |
| bull_head | Bull Head | Tina | CC0 1.0 | https://polyhaven.com/a/bull_head | glTF 1k, 2.02 | bronze bull head with horns on a plinth | 17,148 | G7 | colossus_pyramids (bull idol; guess) |
| horse_head | Horse Head | Tina | CC0 1.0 | https://polyhaven.com/a/horse_head | glTF 1k, 1.77 | bronze horse head with flowing mane | 12,068 | G7 | medusa_gorgon (drive; guess) |
| concrete_cat_statue | Concrete Cat Statue | Rico Cilliers, Riley Queen | CC0 1.0 | https://polyhaven.com/a/concrete_cat_statue | glTF 1k, 3.10 | seated stone cat, idol-like | 11,950 | G7, G9 | colossus_pyramids (cat idol; guess) |
| bronze_whale_statue | Bronze Whale Statue | Tina | CC0 1.0 | https://polyhaven.com/a/bronze_whale_statue | glTF 1k, 2.19 | arched bronze whale on small base | 3,816 | G4, G7 | martins_beach_horror (washed-up thing; guess) |
| stone_fire_pit | Stone Fire Pit | Sebastian Platen | CC0 1.0 | https://polyhaven.com/a/stone_fire_pit | glTF 1k, 2.54 | low round ring of rough stone, a brazier | 3,887 | G5, G11 | nug (lit brazier at mound mouth, ARENA_MIXES) |
| brass_vase_02 | Brass Vase 02 | Rico Cilliers | CC0 1.0 | https://polyhaven.com/a/brass_vase_02 | glTF 1k, 1.83 | tall brass pedestal vase or stand | 6,890 | G5, G9 | simon_orne (altar stand; guess) |
| wine_barrel_01 | Wine Barrel 01 | James Ray Cock | CC0 1.0 | https://polyhaven.com/a/wine_barrel_01 | glTF 1k, 0.92 | oak wine barrel, iron hoops, lid | 10,820 | G4 | cthulhu (quay; guess) |
| wooden_bucket_01 | Wooden Bucket 01 | James Ray Cock | CC0 1.0 | https://polyhaven.com/a/wooden_bucket_01 | glTF 1k, 2.33 | wooden well bucket, iron hoops, bail handle | 5,116 | G11 | colour_out_of_space (at the well, ARENA_MIXES) |
| cannon_01 | Cannon 01 | Yann Kervran, James Ray Cock | CC0 1.0 | https://polyhaven.com/a/cannon_01 | glTF 1k, 3.49 | iron cannon on wooden carriage | 41,444 (decimate) | G4 | cthulhu (cannon on quay, ARENA_MIXES) |
| lateral_sea_marker | Lateral Sea Marker | James Ray Cock, Kuutti Siitonen | CC0 1.0 | https://polyhaven.com/a/lateral_sea_marker | glTF 1k, 2.48 | red navigation beacon on platform with tower | 13,014 | G4 | cthulhu (harbour beacon; guess) |
| bunsen_burner | Bunsen Burner | BKS | CC0 1.0 | https://polyhaven.com/a/bunsen_burner | glTF 1k, 2.13 | laboratory tripod stand, blue-based burner | 8,434 | G10 | edward_hutchinson (laboratory, ARENA_MIXES) |
| industrial_microscope | Industrial Microscope | Lukas Walzer | CC0 1.0 | https://polyhaven.com/a/industrial_microscope | glTF 1k, 2.46 | grey laboratory microscope | 16,598 | G10 | edward_hutchinson (laboratory; guess) |
| vintage_spacecraft_instrument | Vintage Spacecraft Instrument | Michal Wisniewski | CC0 1.0 | https://polyhaven.com/a/vintage_spacecraft_instrument | glTF 1k, 3.67 | retro green instrument cabinet, porthole dial | 13,279 | G10 | colour_out_of_space (guess) |
| modular_industrial_pipes_01 | Modular Industrial Pipes 01 | Jorge Camacho | CC0 1.0 | https://polyhaven.com/a/modular_industrial_pipes_01 | glTF 1k, 4.82 | kit of steel pipe runs, valves, flanges | 12,340 | G10 | edward_hutchinson (lab roof conductors; guess) |
| modular_airduct_circular_01 | Modular Airduct Circular 01 | Riley Queen | CC0 1.0 | https://polyhaven.com/a/modular_airduct_circular_01 | glTF 1k, 1.99 | kit of round silver duct sections and bends | 14,280 | G10 | colour_out_of_space (tubes; guess) |
| planter_pot_clay | Planter Pot Clay | Amal Kumar | CC0 1.0 | https://polyhaven.com/a/planter_pot_clay | glTF 1k, 1.80 | round terracotta clay pot (small urn) | 3,080 | G9 | no single fit (any court's shrine) |
| rusted_wheel_rim_01 | Rusted Wheel Rim 01 | John Hutcheson | CC0 1.0 | https://polyhaven.com/a/rusted_wheel_rim_01 | glTF 1k, 2.60 | rusted steel wheel rim, a wreck piece | 16,440 | G11 | martins_beach_horror (wreck on sand; guess) |

NOT FOUND: G1 (Poly Haven has no bones, coffins, tombs, gibbets or mummies); G5 only partly (no standing stones, obelisks, thrones, altars or stairs); G9 only partly (two vessels, no columns, capitals, reliefs or steps); G11 only partly (no wagons, carts, fences, wells, windmills, barns or signposts).

### Poly Haven: props (CC0)

slug | name | author | licence | page URL | formats, MB | what it is | tris (counted; page figure if different) | gaps | best arena or hall fit
dead_tree_trunk | Dead Tree Trunk | Rob Tuytel | CC0 1.0 | https://polyhaven.com/a/dead_tree_trunk | glTF 1k, 4.8 | long weathered dead log, cracked bark, broken ends, moss | 102k | G2, G4 (driftwood) | orne (Simon Orne): felled in the flat plot
dead_tree_trunk_02 | Dead Tree Trunk 02 | Jenelle van Heerden, Rico Cilliers | CC0 1.0 | https://polyhaven.com/a/dead_tree_trunk_02 | glTF 1k, 4.9 | decayed dry log, rough bark, lichen, broken stub | 83k (page 156k) | G2, G4 (driftwood) | bokrug: drowned log in the shallows of the far-corner wood
tree_stump_01 | Tree Stump 01 | Rob Tuytel | CC0 1.0 | https://polyhaven.com/a/tree_stump_01 | glTF 1k, 3.9 | decayed stump, exposed roots, bark, moss, leaf litter | 41k | G2, G11 (stumps) | gorgon: cut stump in the garden
tree_stump_02 | Tree Stump 02 | Rob Tuytel | CC0 1.0 | https://polyhaven.com/a/tree_stump_02 | glTF 1k, 4.5 | mossy decayed stump, exposed roots, leaf-littered floor | 62k | G2, G11 (stumps) | shub: among the spore sites in the black wood
single_root | Single Root | Jenelle van Heerden | CC0 1.0 | https://polyhaven.com/a/single_root | glTF 1k, 3.9 | one exposed tree root with bark and soil | 61k (page 114k) | G2 (roots) | shub: a standing root where the pack's roots lie flat
dead_quiver_trunk | Dead Quiver Trunk | James Ray Cock, Dario Barresi, Rico Cilliers | CC0 1.0 | https://polyhaven.com/a/dead_quiver_trunk | glTF 1k, 2.3 | dried, decayed Karoo quiver-tree trunk, knotted stump | 18k (page 34k) | G2, G11 (stumps) | colour: charred dead trunk by the well
quiver_tree_02 | Quiver Tree 02 | Dario Barresi, Rico Cilliers | CC0 1.0 | https://polyhaven.com/a/quiver_tree_02 | glTF 1k, 4.6 | sculpted, forked quiver tree with aloe-like rosettes | 82k (page 154k) | G2 (twisted trees) | no clear fit in the mixes; far silhouette on ancients' back arc
rock_moss_set_01 | Rock Moss Set 01 | Kless Gyzen | CC0 1.0 | https://polyhaven.com/a/rock_moss_set_01 | glTF 1k, 1.9 | six mossy weathered stones of varied silhouette | 63k | G2 (mossy rocks) | martins: stones at the water line
boulder_01 | Boulder 01 | Rico Cilliers | CC0 1.0 | https://polyhaven.com/a/boulder_01 | glTF 1k, 5.8 | jagged boulder, lichen and rust streaks, cliff-like face | 66k (page 124k) | G2 (mossy rocks) | cthulhu: rock beyond the back wall
lambis_shell | Lambis Shell | Kuutti Siitonen | CC0 1.0 | https://polyhaven.com/a/lambis_shell | glTF 1k, 2.3 | glossy ridged shell with curved spines | 12k | G3 (shells) | martins: washed up among the ribcage
dutch_ship_medium | Dutch Ship Medium | James Ray Cock, Rico Cilliers, Nicolò Zubbini | CC0 1.0 | https://polyhaven.com/a/dutch_ship_medium | glTF 1k, 8.7 | medium wooden Dutch ship, weathered hull, rigging, sails | 69k | G4 (hull, masts, rigging) | martins: stranded hull on the sand
ship_pinnace | Ship Pinnace | James Ray Cock, Rico Cilliers, Nicolò Zubbini, Yann Kervran | CC0 1.0 | https://polyhaven.com/a/ship_pinnace | glTF 1k, 21.1 | rigged colonial pinnace, hull, masts, rigging | 168k (page 184k) | G4 (masts, rigging) | cthulhu: the Alert's missing mast and hull on the quay
cannon_01 | Cannon 01 | Yann Kervran, James Ray Cock | CC0 1.0 | https://polyhaven.com/a/cannon_01 | glTF 1k, 3.5 | rigged cast-iron ship cannon on wooden carriage | 41k | G4 (cannons) | cthulhu: on the quay beside the wreck
wooden_barrels_01 | Wooden Barrels 01 | James Ray Cock | CC0 1.0 | https://polyhaven.com/a/wooden_barrels_01 | glTF 1k, 7.5 | weathered wooden barrels and loose staves | 33k | G4 (barrels) | hutchinson: in the bailey by the donjon
wooden_crate_01 | Wooden Crate 01 | James Ray Cock | CC0 1.0 | https://polyhaven.com/a/wooden_crate_01 | glTF 1k, 2.3 | vintage wooden crate, rope handles, rivets, latch | 6.6k | G4 (crates) | martins: cargo from the wreck on the sand
ocean_buoy | Ocean Buoy | Mateusz Sadek | CC0 1.0 | https://polyhaven.com/a/ocean_buoy | glTF 1k, 3.0 | red sea buoy with cage light, bell and ring guard | 12k | G4 (buoy, shore) | cthulhu: harbour marker off the quay
stone_fire_pit | Stone Fire Pit | Sebastian Platen | CC0 1.0 | https://polyhaven.com/a/stone_fire_pit | glTF 1k, 2.5 | rough boulder fire pit, soot-darkened basin, lichen | 3.9k | G5 (braziers) | nug: lit in the back gallery's bay between the two braziers
modular_fort_01 | Modular Fort 01 | Rico Cilliers | CC0 1.0 | https://polyhaven.com/a/modular_fort_01 | glTF 1k, 10.6 | weathered colonial stone fort: battlements, towers, ramparts, arched gate | 28k | G5 (gateway, arch, ramparts) | ancients: far walls on the back arc
brass_candleholders | Brass Candleholders | Tina | CC0 1.0 | https://polyhaven.com/a/brass_candleholders | glTF 1k, 9.5 | ornate antique brass candelabra, scrolled arms, lit tapers | 42k | G5 (candelabra) | orne: lit before the chapel
modular_chainlink_fence | Modular Chainlink Fence | James Ray Cock, Amal Kumar | CC0 1.0 | https://polyhaven.com/a/modular_chainlink_fence | glTF 1k, 7.3 | rusted chain-link fence panels, posts and gate | 89k | G11 (fences) | none in the mixes: modern chain-link

NOT FOUND: G2 (reeds, lily pads, swamp trees); G3 (giant mushrooms, pods and eggs, alien plants, coral; only the shell); G4 (anchors, nets, fish, lighthouse); G5 (standing stones, menhirs, obelisks, cairns, monoliths, thrones, altars, stairs, sphinx, step pyramids, broken columns); G11 (wells, carts and wagons, tents, signposts, scarecrows, windmills, barns, farmhouses, ruined walls, chimneys).

### Other hosts (3dassets.dev, ToxSam, Khronos samples, NASA: CC0)

| slug | name | author | licence | page URL | formats, MB | what it is | rough triangles | gaps | best arena or hall |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| skull-jaw-open | Skull Jaw Open (Human Anatomy and Education Kit) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/38941 | GLB, 0.05 | a human skull, jaw open | 1532 | G1 | orne, pipers |
| dragon-skull | Dragon Skull (Dragons and Wyverns) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/36743 | GLB, 0.02 | a giant beast skull | 332 | G1 | bokrug, yig |
| skull-pile-arena | Skull Pile (Arena Shooter Map Kit) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/23146 | GLB, 0.20 | a heap of skulls | 4212 | G1 | orne, pipers |
| spine-column-anatomy | Spine Column (Human Anatomy and Education Kit) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/38939 | GLB, 0.06 | a vertebral column standing upright | 2296 | G1 | shub, yig |
| ribcage-anatomy | Ribcage (Human Anatomy and Education Kit) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/38942 | GLB, 0.05 | a ribcage | 2604 | G1 | martins |
| gothic-stone-sarcophagus | Gothic stone sarcophagus (Hollowwick Halloween) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/21629 | GLB, 0.04 | carved stone sarcophagus with lid | 528 | G1, G8 | orne, dungeon halls |
| sphinx-statue-greek | Sphinx Statue (Greek Mythology: Underworld and Olympus) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/21441 | GLB, 0.05 | seated stone sphinx | 1102 | G9, G7 | nyarlathotep, hastur |
| jaguar-statue-jungle | Jaguar Statue (Jungle Temple and Stone City) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/36129 | GLB, 0.09 | Mesoamerican jaguar statue | 1998 | G9, G7 | yig, nug |
| serpent-statue-jungle | Serpent Statue (Jungle Temple and Stone City) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/36130 | GLB, 0.25 | Mesoamerican serpent statue | 7968 | G7, G9 | yig |
| medusa-bust | Medusa Bust (Greek Mythology: Underworld and Olympus) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/21453 | GLB, 0.12 | bust of a woman with serpent hair | 2500 | G7 | gorgon |
| gargoyle-statue | Gargoyle Statue (Arena Shooter Map Kit) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/23147 | GLB, 0.14 | gargoyle on a plinth | 1960 | G7, G8 | orne |
| fallen-statue-torso | Fallen Statue Torso (Sunken City and Underwater Ruins) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/36965 | GLB, 0.02 | toppled statue torso | 338 | G7 | cthulhu, zkauba |
| obelisk-sunken-city | Obelisk (Sunken City and Underwater Ruins) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/36964 | GLB, 0.07 | stone obelisk | 1392 | G5 | azathoth, zkauba |
| pyramid-base-tier | Pyramid Base Tier (Jungle Temple and Stone City) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/36100 | GLB, 0.31 | base tier of a stepped pyramid | 6096 | G5, G9 | nug, yig |
| pyramid-upper-tier | Pyramid Upper Tier (Jungle Temple and Stone City) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/36099 | GLB, 0.22 | upper tier of the same pyramid | 4392 | G5, G9 | nug |
| imperial-throne-chair | Imperial Throne Chair (Imperial China Palace and Garden) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/36199 | GLB, 0.07 | throne | 3548 | G5 | azathoth, othergods |
| coral-head-branching | Coral Head Branching (Sunken City and Underwater Ruins) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/36987 | GLB, 0.07 | branching coral head | 1408 | G3 | bokrug, cthulhu |
| stylised-mushroom-group | Stylized Mushroom Group (Stylized Trees and Rocks Kit) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/38752 | GLB, 0.04 | group of stylised giant mushrooms | 1177 | G3 | shub |
| glowing-crystal-cluster | Glowing Crystal Cluster (Sunken City and Underwater Ruins) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/36999 | GLB, 0.02 | glowing crystal cluster | 424 | G6 | colour |
| hollow-crystal-crown | Hollow crystal crown (Alien Planet Plants and Terrain) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/22752 | GLB, 0.10 | hollow crystal crown | 2144 | G6, G7 | othergods, yog |
| comms-satellite | Comms Satellite (Solar System and Astronauts) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/39247 | GLB, 0.11 | communications satellite | 3376 | G6 | nyarlathotep, hastur |
| crew-ferry-capsule | Crew ferry capsule and service module (Space Station and Docking) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/24565 | GLB, 0.40 | spacecraft capsule with service module | 8620 | G6 | nyarlathotep, ancients |
| ships-anchor | Ships Anchor (Sunken City and Underwater Ruins) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/36978 | GLB, 0.02 | ship anchor | 304 | G4 | cthulhu |
| windmill-tower | Windmill Tower (Greek Island Village and Harbour) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/37117 | GLB, 0.11 | windmill tower with sails | 1396 | G11 | gorgon |
| stylised-dead-tree-tall | Stylized Dead Tree Tall (Stylized Trees and Rocks Kit) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/38730 | GLB, 0.02 | tall dead tree | 339 | G2 | blackman, hutchinson |
| boiler-tank-setting | Boiler Tank and Setting (Roman Bathhouse and Palaestra) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/37878 | GLB, 0.04 | boiler tank on its setting | 1064 | G10 | hutchinson |
| pipework-run-valves | Pipework Run with Valves (Distillery and Bonded Warehouse) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/38680 | GLB, 0.06 | pipe run with valves | 1468 | G10 | hutchinson, colour |
| diesel-backup-generator | Diesel Backup Generator (Nuclear Power Station and Control Room) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/36940 | GLB, 0.26 | diesel generator set | 6828 | G10 | hutchinson |
| mausoleum-gothic | Mausoleum (Vampire Crypt and Gothic Cathedral) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/23044 | GLB, 0.04 | stone mausoleum | 628 | G8 | orne |
| mausoleum-door | Mausoleum Door (Haunted House and Ghost Hunting Kit) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/26890 | GLB, 0.13 | iron-banded crypt door | 2376 | G8 | orne |
| chain-run-sunken | Chain Run (Sunken City and Underwater Ruins) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/36977 | GLB, 0.06 | run of heavy chain | 1248 | G8 | orne, pipers |
| wide-portal-arena | Wide Portal (Arena Shooter Map Kit) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/23071 | GLB, 0.09 | portal frame | 1432 | G6, G5 | yog, zkauba |
| narrow-neck-vase | Narrow Neck Vase (Ceramics Pottery Studio) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/29517 | GLB, 0.03 | narrow-necked vase | 1792 | G9 | nug |
| prayer-hall-column | Prayer Hall Column (Desert Mosque and Madrasa Courtyard) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/38098 | GLB, 0.02 | column with capital | 756 | G9 | colossus, azathoth |
| stone-marker-cairn | Stone Marker Cairn (Lighthouse and Rocky Coast) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/36635 | GLB, 0.01 | stone cairn marker | 276 | G5 | martins, ancients |
| stone-urn-pedestal | Stone urn on pedestal, 1.7 m (Botanical Glasshouse and Palm House) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/38574 | GLB, 0.02 | stone urn on pedestal | 324 | G9 | nug, azathoth |
| deck-cannon-truck-carriage | Deck Cannon on Truck Carriage (Pirate Port and Tall Ships) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/30158 | GLB, 0.07 | ship cannon on carriage | 1272 | G4 | cthulhu |
| lighthouse-light-station | Light Station and Rocky Point (Lighthouse and Rocky Coast) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/36636 | GLB, 0.91 | lighthouse station on rocks | 18912 | G4 | cthulhu, martins |
| kraken-tentacle | Kraken Tentacle (Greek Mythology: Underworld and Olympus) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/21457 | GLB, 0.07 | single tentacle rising from water | 1472 | G3 | cthulhu, bokrug |
| egg-clutch-on-rock | Egg Clutch On A Rock (Dragons and Wyverns) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/36737 | GLB, 0.03 | eggs on a rock | 604 | G3 | bokrug, nug |
| statue-plinth-draped-figure | Statue Plinth with Draped Figure (Roman Bathhouse and Palaestra) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/37902 | GLB, 0.03 | robed figure on a plinth | 728 | G7, G9 | orne, gorgon |
| well-head-windlass | Well Head With Windlass (Desert Mosque and Madrasa Courtyard) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/38131 | GLB, 0.03 | well head with windlass | 1280 | G11 | gorgon, colour |
| scarecrow-allotment | Smiling allotment scarecrow (Almanac Gardens: Country Gardens) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/22083 | GLB, 0.07 | scarecrow on a post | 1340 | G11 | gorgon |
| town-signpost-boards | Town Signpost Blank Boards (Canal Town and Windmill) | 3dassets.dev (unnamed) | CC0 1.0 | https://3dassets.dev/api/assets/36692 | GLB, 0.08 | signpost with blank boards | 910 | G11 | gorgon, blackman |
| pm-tomb-obelisk | Obelisk (Polygonal Mind, tomb-chaser-1) | Polygonal Mind (ToxSam repo) | CC0 1.0 | https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/tomb-chaser-1 | GLB, 0.46 | Egyptian obelisk | 236 | G5 | azathoth |
| pm-tomb-god-ra | God Ra statue (Polygonal Mind, tomb-chaser-1) | Polygonal Mind (ToxSam repo) | CC0 1.0 | https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/tomb-chaser-1 | GLB, 0.22 | seated Egyptian god statue | 1650 | G7 | nyarlathotep |
| pm-tomb-god-anubis | God Anubis statue (Polygonal Mind, tomb-chaser-1) | Polygonal Mind (ToxSam repo) | CC0 1.0 | https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/tomb-chaser-1 | GLB, 0.21 | jackal-headed god statue | 1468 | G7 | nyarlathotep |
| pm-tomb-jar-01 | Jar 01 (Polygonal Mind, tomb-chaser-1) | Polygonal Mind (ToxSam repo) | CC0 1.0 | https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/tomb-chaser-1 | GLB, 0.60 | Egyptian storage jar | 192 | G9 | nug |
| pm-tomb-column | Column (Polygonal Mind, tomb-chaser-1) | Polygonal Mind (ToxSam repo) | CC0 1.0 | https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/tomb-chaser-1 | GLB, 0.61 | Egyptian temple column | 204 | G9 | colossus |
| pm-tomb-temple-arch | Temple arch 01 (Polygonal Mind, tomb-chaser-1) | Polygonal Mind (ToxSam repo) | CC0 1.0 | https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/tomb-chaser-1 | GLB, 0.36 | temple arch, a gateway | 220 | G5, G9 | zkauba |
| pm-crystal-broken-column | Column small broken 01 (Polygonal Mind, crystal-crossroads) | Polygonal Mind (ToxSam repo) | CC0 1.0 | https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/crystal-crossroads | GLB, 0.32 | broken column | 564 | G5 | ancients |
| pm-crystal-scifi-capsule | SciFi Capsule (Polygonal Mind, crystal-crossroads) | Polygonal Mind (ToxSam repo) | CC0 1.0 | https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/crystal-crossroads | GLB, 0.48 | sci-fi capsule | 4111 | G6 | yog |
| khr-iridescence-abalone | Iridescence Abalone (glTF-Sample-Assets) | Abby Crawford, Eric Chadwick | CC BY 4.0 | https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/IridescenceAbalone | GLB, 8.87 | abalone shell, iridescent | 6036 | G3 | bokrug |
| khr-mosquito-in-amber | Mosquito in Amber (glTF-Sample-Assets) | Loic Norgeot, Geoffrey Marchal (Sketchfab) | CC BY 4.0 | https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/MosquitoInAmber | GLB, 23.11 | mosquito preserved in amber | 14349 | G6, G3 | hutchinson, colour |
| nasa-agena-target-vehicle | Agena Target Vehicle (NASA 3D Resources) | NASA | NASA public domain | https://science.nasa.gov/3d-resources/agena-target-vehicle/ | GLB, 1.10 | space target vehicle | 31290 | G6 | nyarlathotep, hastur |
| nasa-acrimsat-a | AcrimSAT satellite, A (NASA 3D Resources) | NASA | NASA public domain | https://science.nasa.gov/3d-resources/active-cavity-irradiance-monitor-satellite-acrimsat-a/ | GLB, 2.02 | satellite | 11551 | G6 | nyarlathotep |

### Sketchfab: CC BY 4.0, for downloading by hand

Sketchfab asks for a sign-in to download, so none of these could be fetched here. If the owner downloads any (glTF is best) into a folder, `tools/models/boss/manifest_web.py` takes them as it took the three of `docs/GATES.md`; each would be credited as CC BY 4.0.

35 candidates, all verified as CC BY 4.0 with a "Download 3D Model" button (nothing downloaded). Columns: name | author | licence | page URL | faces | what it is | gaps | fits (suggested).

| # | name | author | licence | page URL | faces | what it is | gaps | fits (suggested) |
|---|---|---|---|---|---|---|---|---|
| 1 | Rib-cage bones low poly prop | Eirik Sundby | CC BY 4.0 | https://sketchfab.com/3d-models/rib-cage-bones-low-poly-prop-0390dbf638c94cefa14b2d608b015e48 | 2.3k tris | low-poly ribcage, rigged to flex | G1 | Simon Orne; Shub-Niggurath |
| 2 | Ribcage and Pelvis | chummy-island | CC BY 4.0 | https://sketchfab.com/3d-models/ribcage-and-pelvis-9b24894e318d4f37b7a10692d77b8343 | 578 tris | simplified ribs with pelvis | G1 | Martin's Beach |
| 3 | Stylized Coffin | Adam Glachan | CC BY 4.0 | https://sketchfab.com/3d-models/stylized-coffin-74e132b8ad5140bca2088629cc2ed3be | 136 tris | stylised coffin | G1 | Simon Orne (crypt) |
| 4 | Low Poly Coffin (Halloween) | Jacob Smith | CC BY 4.0 | https://sketchfab.com/3d-models/low-poly-coffin-46857460b1fc4d2ea63c2c51f3aabdb8 | 352 tris | Halloween-style coffin | G1 | Simon Orne |
| 5 | Low-poly skeleton | TenderMeatPopsicle | CC BY 4.0 | https://sketchfab.com/3d-models/low-poly-skeleton-e42fe0e1a8f44e04b0d21db676073dde | 3k tris | whole skeleton figure | G1 | Black Man; Hastur |
| 6 | LOW POLY BONES ASSET PACK | TANDA | CC BY 4.0 | https://sketchfab.com/3d-models/low-poly-bones-asset-pack-b08c4568b2c5464fb1ab40cd871e40dc | 5.6k tris (21 pieces) | bone set for piles | G1 | Shub-Niggurath; Ancient Ones |
| 7 | shipwreck low poly | compost the second | CC BY 4.0 | https://sketchfab.com/3d-models/shipwreck-low-poly-dc14bf79a89042b097f04ab83102e856 | 4.7k tris | wreck with rigged, animated sail | G4 | Martin's Beach; Cthulhu |
| 8 | Cthulhu Stone Gargoyle | INGSOC1984 | CC BY 4.0 | https://sketchfab.com/3d-models/cthulhu-stone-gargoyle-eldritch-monolith-813612f6d2cb496c8a8b46faeba6af3a | 9.7k tris | hunched stone Cthulhu-like figure | G7 | Cthulhu; Ancient Ones |
| 9 | Altar (low-poly) | Bitbom | CC BY 4.0 | https://sketchfab.com/3d-models/altarlow-poly-00619c9de6f14f03940b6cf72575d822 | 10.2k tris | ancient magic altar | G5 | Nug; Other Gods |
| 10 | Stylized Low-poly Jade Obelisk | Rocco Giandomenico | CC BY 4.0 | https://sketchfab.com/3d-models/stylized-low-poly-jade-obelisk-a3ed0785266640cbb96c04a29c94c840 | 328 tris | stylised obelisk | G5 | Azathoth; Yog-Sothoth |
| 11 | Low Poly Stone Portal | Que3D | CC BY 4.0 | https://sketchfab.com/3d-models/low-poly-stone-portal-62a7c61caba8462782b5ed6cf9cf56cd | 741 tris | stone and crystal portal | G6 | Yog-Sothoth; Other Gods |
| 12 | Tesla Coil | Kim Tsyhanovskyi | CC BY 4.0 | https://sketchfab.com/3d-models/tesla-coil-13fd21edb4a94195889f9f90e2ed36ba | 4k tris | tesla coil (tagged fanart, redalert3: check IP) | G10 | Edward Hutchinson |
| 13 | Low-Poly Sci-fi Pod | adriansade98 | CC BY 4.0 | https://sketchfab.com/3d-models/low-poly-sci-fi-pod-9f12b644ec3a42a09834f7b8bbb66d0c | 1.3k tris | sci-fi pod | G3 | Bokrug |
| 14 | Dragon Egg LowPoly | SamuelLK | CC BY 4.0 | https://sketchfab.com/3d-models/dragon-egg-lowpoly-dbf1dce0df2945abab58732490252612 | 960 tris | textured egg | G3 | Bokrug; Shub-Niggurath |
| 15 | Stylized Mushrooms - Low Poly | Camille Barral | CC BY 4.0 | https://sketchfab.com/3d-models/stylized-mushrooms-low-poly-33e4073b371a4fbd93e65bfb16473032 | 1.3k tris (3 mushrooms) | three stylised mushrooms | G3 | Shub-Niggurath |
| 16 | Low Poly Sphinx | Adrian21 | CC BY 4.0 | https://sketchfab.com/3d-models/low-poly-sphinx-3822cf4d12584c729533f4ca068172d6 | 468 tris | Egyptian sphinx | G9 | Colossus |
| 17 | Egypt Column | Samuel F. Angrick-Johanns | CC BY 4.0 | https://sketchfab.com/3d-models/egypt-column-57d3d0ac7bbd407e973671198e737dc3 | 19.3k tris | Egyptian column, 2K textures | G9 | Colossus |
| 18 | Windmill, Low-Poly | FLAREMEDIA | CC BY 4.0 | https://sketchfab.com/3d-models/windmill-low-poly-ed577ce3d4db49a283924c2ec27e65e8 | 592 tris | low-poly windmill | G11 | Gorgon |
| 19 | Lighthouse, Low Poly | FLAREMEDIA | CC BY 4.0 | https://sketchfab.com/3d-models/lighthouse-low-poly-8cbfa6920c8e45a9a9abf37adb74dbf8 | 1k tris | lighthouse | G4 | Martin's Beach; Cthulhu |
| 20 | Lighthouse Challenge (Lighthouse Scene Low Poly) | Warhead980 | CC BY 4.0 | https://sketchfab.com/3d-models/lighthouse-challenge-7cbe570389734bc0894e72dea22d186b | 5.5k tris | lighthouse scene (check for ground) | G4 | Martin's Beach |
| 21 | Low Poly Wagon | Cassara.Kennedy | CC BY 4.0 | https://sketchfab.com/3d-models/low-poly-wagon-e9f32a64a90349ef8f6cc97f1b5a9d98 | 4.6k tris | wooden wagon | G11 | Gorgon |
| 22 | Low poly scarecrow | dasWarder | CC BY 4.0 | https://sketchfab.com/3d-models/low-poly-scarecrow-e29853035d764c76b79b1b4be9916791 | 492 tris | stylised scarecrow | G11 | Gorgon; Shub-Niggurath |
| 23 | Low Poly Stone Pillar | zentha | CC BY 4.0 | https://sketchfab.com/3d-models/low-poly-stone-pillar-3a0aed500b9f451283fe04c911a85207 | 108 tris | standing stone pillar | G5 | Ancient Ones; Colossus |
| 24 | Low-Poly STONE pack | Mahdi.G | CC BY 4.0 | https://sketchfab.com/3d-models/low-poly-stone-pack-e43cce5fc20c4e81bc5de7f1db7cc54b | 7.1k tris (40 stones) | forty game-ready stones | G2, G5 | Bokrug; Martin's Beach |
| 25 | Statue - Low poly | lightguard | CC BY 4.0 | https://sketchfab.com/3d-models/statue-low-poly-cb550e47e83647549d2f85dfc98380f5 | 114 tris | stone statue | G7 | Yig; Gorgon |
| 26 | Gargoyle Head Sculpt | scrampunk | CC BY 4.0 | https://sketchfab.com/3d-models/gargoyle-head-sculpt-free-download-26a9fda6f2dc430c8a481cf7d0fc5cee | 2.9k tris | gargoyle head | G7 | Simon Orne; Gorgon |
| 27 | Floating Rock | roxyspring | CC BY 4.0 | https://sketchfab.com/3d-models/floating-rock-665c5f6265c540b1a19574ff03f6a2ce | 302 tris | floating rock | G6 | Colour Out of Space |
| 28 | Low Poly Crystal Rock | EchoCG | CC BY 4.0 | https://sketchfab.com/3d-models/low-poly-crystal-rock-369a6bc4af03411b8116af1d8838f53b | 628 tris | rock with crystal | G6 | Edward Hutchinson; Colour |
| 29 | Low-Poly Monolith | dvnc.tech | CC BY 4.0 | https://sketchfab.com/3d-models/low-poly-monolith-bf36c11984cb49c1a7ae5c488a3ff30a | 222 tris | monolith | G5, G6 | Other Gods; Ancient Ones |
| 30 | Prison cell door (old prison bars) | Rivaldragon | CC BY 4.0 | https://sketchfab.com/3d-models/prison-cell-door-f8148fab4dc44903b9644170edf0e58c | 1.5k tris | iron bars and door | G8 | Simon Orne (crypt door) |
| 31 | Low-Poly Prison Cage | BuntyS | CC BY 4.0 (page says credit "not mandatory"; CC BY still requires it) | https://sketchfab.com/3d-models/low-poly-prison-cage-free-game-asset-133ab66f21de45f0848b2602e014a00f | 2.3k tris | barred cell with door | G8 | Black Man; Simon Orne |
| 32 | Statue (gargoyle-statue tag) | DJMaesen | CC BY 4.0 | https://sketchfab.com/3d-models/statue-ecd586875a8845cebb74aa9ea11756ed | 1.5k tris | game-ready statue | G7 | Cthulhu; Ancient Ones |
| 33 | Mossy Tree Trunk | martinwaters | CC BY 4.0 (JSON: isDownloadable true) | https://sketchfab.com/3d-models/mossy-tree-trunk-6f3d6914e2b4435dbf0e8da3a45b8197 | 19,202 faces | low-poly roots and trunk, moss | G2 | Bokrug; Shub-Niggurath |
| 34 | Low-Poly Tree Stump | jwilson32 | CC BY 4.0 (JSON: isDownloadable true) | https://sketchfab.com/3d-models/low-poly-tree-stump-912c9caf318d469884d8a00acf496ac5 | 616 faces | tree stump | G2 | Bokrug; Gorgon |
| 35 | Low Poly Purple Crystal Cluster | shinypeach69 | CC BY 4.0 (JSON: isDownloadable true) | https://sketchfab.com/3d-models/low-poly-purple-crystal-cluster-6747200d4b844367a04a75b5c5665775 | 288 faces | crystal cluster on rock | G6 | Colour Out of Space; Edward Hutchinson |

NOT FOUND: G1 (mummy, gibbet, giant ribcage), G2 (swamp trees, reeds, lily pads), G3 (giant mushroom, coral, shell, tentacle), G4 (cannon, anchor, nets, barrels, boats, piers), G5 (ziggurat, throne, stairs, braziers, gateway), G7 (crowned king, robed figure), G8 (mausoleum, crypt door, iron fence, bell tower, chains), G9 (Mesoamerican, Greek columns), G10 (glass tank, generator, boiler, pipes), G11 (well, barn, farmhouse, ruined wall, tent, chimney).

Notes:
- REPORT.md was not written: the Write tool refused it as a subagent report file. The table above is the full content; the file can be saved from this text.
- Rows 33 to 35 did not render in the page reader; their licence, isDownloadable and face count come from Sketchfab's public JSON (api.sketchfab.com/v3/models/<uid>). Sketchfab has no per-model "Downloadable" badge, so the download button (or isDownloadable) is the evidence used.
- Rejected after reading the page: Jorma Rysky's coffin (CC BY with a NoAI clause, an added restriction), Subtixx's tree stump (same NoAI clause), JustinC's lighthouse, Londal's shipwreck, Art-Teeves's obelisk and Nicksketch's tank (no licence shown and no download button). Rejected from snippets: CC BY-SA, NC and ND variants (Starfall Archive dead tree, Onekro monolith, SimplePolygon crystals, Jellypack xenomorph, Maf'j Alvarez egg, miholecz column, Daniel Patyk altar).
- Ten pages did not load and are unchecked (VX-Designs gravestone, BeaBea wagon, libblekibble Greek ruins, BranHelsing altar, Gustavo Farias Greek temple, Strifey7 windmill, AscoreDev tombstone, Nodaris mushroom, berkay.tari sci-fi lab, rkmorello windmill). A hand check would add to the list.
- Calls: about 74, over the soft budget of 50, because many page reads returned empty and 35 verified rows needed about 40 page checks.
