# A place for every horror: the merged plan

(Export of the Claude Doc made for Dro, kept here so another session can pick it up. The full per-boss detail is in the plan-A, plan-B and plan-C files beside it.)

Oct 22, 2026 · Dro · Decided: see *The answers* below (XDro handed the thirteen questions to Claude with two rules). Round 65 (the discoveries made fair) is built; the rest is not yet.

## Read this first

Every boss gets a place of its own kind, with its own motion and its own reason to be there, and none of it is built until you confirm. There are 46 places in three families.

- **19 open-world arenas.** Each stops being a ring of wall and becomes a structure from its own story: a dry reservoir, a serpent earthwork, a burned plantation house, a metal labyrinth, a colonnade of bone flutes. They stay enclosed, gated and found by the round 63 discoveries.
- **27 dungeon and lair boss halls**, plus Brown Jenkin, Mother Hydra, Nyarlathotep and the Pit Thing who fight in them. The playable hall stays 48 m square. Around it each gets a skin that carries the walls up past the roofline, a precinct on the land outside, and a landmark on top.
- **The eight Outer Gods** are found by breaking a rule no other boss asks you to break (stand still, do not look, wait for the hour, follow a sound). Six of them are among the 19 arenas, so they are designed once, here, and not twice. 'Umr at-Tawil and Nyarlathotep are hall bosses.
- **One shared living layer** gives every place motion inside and out: shader sway and pulse, instanced crowds, light chases, particles, and sound. Every place gets at least two moving parts you can see from the court, 30 to 80 m away.

Three independent reviews checked the drafts against the code and the stories and raised about 170 findings. The ones that change the plan are applied below. The biggest: the fog wall of a fight hides everything under 7 to 11 m, water drowns you, nothing can be dug below about 1 m under the land, a view reaches 140 m, and 18 of 27 halls have a solid 6 m ceiling. So the plan builds up and outward, never down, and it offers a place that *looks* like another dimension rather than a new walkable one (section 2, decision 2).

This is months of work, not weeks. The proposal is three pilots first (a keep, a reservoir with a river island, a machine hall), measured on cost and look, and a go or no-go before the rest.

## What I need from you

Six answers unblock the pilots; the rest I will take as recommended unless you say otherwise. Every row has my pick, so a bare "all as recommended" is a valid reply.

| # | Question | My recommendation | Needed |
| --- | --- | --- | --- |
| 1 | Scope. I read "all 27 main bosses, outer gods too" as every boss place: the 19 open arenas, the 27 halls with their companions, and the eight Outer Gods (six of them inside the 19). | Yes, 46 places, Outer Gods designed once. | Now |
| 2 | Portals into another boss dimension. (a) A place skin: grade, mist, sky and light ease in around the structure, no new region, cheap. (b) One flagship walkable portal built from parts that exist (the veil shader, the gate walk, the ultimate\_void dungeon). (c) A new region per boss: needs a recorded track from you each, about 25 files touched. | (a) everywhere, (b) for yog\_sothoth as the showpiece, never (c). | Now |
| 3 | Water kills by drowning. Moats and the lagoon stay lethal, but every causeway and quay is at least 7 m wide with a low kerb collider, so a dodge roll cannot drop you. | Yes. | Now |
| 4 | cthulhu "out in the sea". (a) A platform in a lagoon inside the island's own tile. (b) Move the arena to the coast and sit it in open water: truer, needs the containment audits redone and may shift the site by tens of metres. | (a) first; (b) later if you want it. | Now |
| 5 | hastur is a called boss: the third lost-sanity band spawns him 12 m in front of you wherever you stand, so no building can hold his first fight. Change it so the call lights the way to the theatre and he rises in the orchestra. | Yes (a small sim change, round 76). | Before hastur |
| 6 | Free assets. Extend the bake tool for KayKit (CC0, reachable from here) with a line in CLAUDE.md, and you put unpacked Kenney kits (Castle, Pirate, Furniture) on disk as before. Every structure is code-built either way; models are dressing. | Yes to both. | Before round 67 |
| 7 | Nyarlathotep stays in the Kadath hall beside the Great Ones, as the main quest and an achievement expect. The handbill-and-door Exhibition becomes an optional prelude that calls him out early. | Yes. | Later |
| 8 | Outer Gods rules (stand still, do not look, follow a sound, wait for the hour). A "Strange places" setting with Full, Assist and Off in the Accessibility tab, default Full with a one-line first-hour notice. | Yes. | Later |
| 9 | Mazes. Three (shub\_niggurath, simon\_orne, zkauba) is one too many for the foe AI and the camera. | Two mazes; zkauba becomes an open field of metal towers. | Later |
| 10 | Site nudges of up to 20 m for a few places so structures fit (daemon\_pipers, zkauba, ancient\_ones, edward\_hutchinson, martins\_beach\_horror, simon\_orne). Three demo halls (dr\_munoz, the\_outsider, voice\_in\_the\_tomb) sit 16 to 32 m from the demo's mist and stay inside their footprint. | Yes. | Later |
| 11 | The demo. Both arenas (colour\_out\_of\_space, black\_man) and the seven demo halls are the first impression and the riskiest to change. | They ship the new places, and they are the pilots. | Later |
| 12 | Real underground. Nothing can be dug below about 1 m under the land, so colossus\_pyramids' buried hypostyle becomes a dune skirt and a colonnade. Alternative: host it as a small dungeon, which gives a true underground hall and the existing walk audits. | Dune and colonnade now; revisit after the pilots. | Later |
| 13 | Process. Merge PR 152 first (rounds 63 and 64), then one PR per phase from round 65, each with its DECISIONS.md lines. Lore divergences in section 9 are accepted or corrected before any art. | Yes. | Now |

## The answers (22 Oct 2026)

XDro's word: "decide each question yourself, just make sure the game will be highly enjoyable and entertaining, without any of the new puzzles, discovery processes etc. being too hard and frustrating for any kind of player", and then "also make sure everything you decide is lore accurate and visually and mechanically entertaining and impressive". So every answer below is the recommendation, bent where needed toward those two rules, and one rule is added over all of them:

**The fairness rule.** No discovery, ordeal, maze or strange rule waits on chance or punishes a wrong try with lost progress or goods. The place answers the one who keeps faith with it: a vigil's hour, sky and state of mind are called by the place when it is kept (round 65, built), a strange rule eases itself after two failed tries or ninety seconds at the court (Assist without being asked, with a line that says so), the next act is always said on screen and in the Journal, and a wrong light shows the right one. Strange in look and in story, never in difficulty.

| # | Answer |
| --- | --- |
| 1 | All 46 places; the Outer Gods designed once, in section 5. |
| 2 | (a) a place skin everywhere, and (b) one walkable portal, Yog-Sothoth's, since the god is the gate; never (c). |
| 3 | Water stays lethal beyond the kerb; every causeway and quay is 7 m or wider with a low kerb collider, so no dodge roll drops anyone in. |
| 4 | (a) Cthulhu's platform in a lagoon inside the island's tile first; (b) only if the pilots leave room. |
| 5 | Yes: the third band's call lights the way to the theatre and he rises in the orchestra (a fight in a built place beats one sprung anywhere). |
| 6 | Extend the bake for KayKit (CC0, reachable from here). Nothing waits on Kenney kits put on disk: every enclosing form is built in code, and the kits are used only if they arrive. |
| 7 | Nyarlathotep stays in the Kadath hall; the handbill and door are an optional prelude. |
| 8 | The Strange places setting (Full, Assist, Off), default Full, and Full itself eases after two failed tries or ninety seconds (the fairness rule). |
| 9 | Two mazes, kept small and kind: lanes 6 m or wider, three choices at most to the heart, the heart's light always seen over the walls, a lit thread after a minute lost, foes only in fixed bays. zkauba is an open field of towers. |
| 10 | Yes to the site nudges. |
| 11 | Yes: the demo's places are the pilots. |
| 12 | The dune and colonnade now; a true underground hall only if the pilots argue for it. |
| 13 | Merge PR 152 first (it now holds round 65 too), then one PR per round from round 66; every round's calls in DECISIONS.md. The lore defaults of section 9 are taken as written, each checked against the text before its art. |

Round numbers below are as first drafted; round 65 was spent on the fairness rule, so each later round in the plan (the groundwork, the pilots, the waves, the close-out) is one number higher.

## The 19 open-world arenas

Each arena keeps its gate sealed until found, its court, its discovery and its fight circle; only the enclosure changes, from a wall ring to a structure of the horror's own kind. The six marked OG are Outer Gods and are specified in section 5.

| Arena | The place | What moves, seen from the court | What the review changed |
| --- | --- | --- | --- |
| colour\_out\_of\_space | A dry reservoir: a grey dam bank with a valve tower and sluice round a dust floor. The Gardner ruin (chimney, cellar, well, dead orchard) is what the dam encloses. | Stake lamps pulse in sequence like a tide that never rises; dust pours down the spillway; the dead apple trees sway. | The floor cannot sink: rim raised, floor at land height. Dam face is dressed masonry so it does not read as colossus\_pyramids' dune. Demo pilot. |
| black\_man | A round island of white earth in a black river, thirteen standing stones lit by balefires, the old white stone as its heart. | Mist wraiths slide over the water; balefires lean; runes in the boulder gate glow as pages are read. | Crossed by a ford of flat stones with a kerb. The reflection pass the river switches on needs measuring first. Demo pilot. |
| shub\_niggurath (OG) | A living wood that breathes, with a horn-tree maze and a gate that opens on the exhale. | Canopy and palisade swell in slow waves; pods burst spores. | Section 5. One of the two mazes. |
| medusa\_gorgon | The burned plantation house as a U round a lawn: portico with a fallen pillar, black rafters, an empty stair window. | The household statues along the avenue turn their heads as you pass; black hair creeps on the gate. | U open on the lawn side, not four walls. Statues stand above the fog line or on the lawn. |
| martins\_beach\_horror | A bathing esplanade crescent of cabins and festoon lamps, closed on the sea side by the holding hulk. | Festoon bulbs run in a wave round the crescent; the hulk rocks on its chains; brine tide rolls up the court. | Crowd silhouettes go on the esplanade roofs, above the fog crown. Canon is thin, so the dressing is the game's own. |
| simon\_orne | A cemetery of tomb lots on a street grid, low enough (3 m) to see the sky and the central green. | Candle flames lean toward you; wisps drift down the lanes; twin tombs swap inscriptions. | Maze two of two; foes stay in fixed bays; lanes 6 m wide. A "Roman wall" is to be checked in the letter first. West third lost to curwen\_catacombs. |
| edward\_hutchinson | A stone keep with a lightning-rod mast, a lean-to laboratory and a stack-chimney farmhouse. Pilot for the outline planner. | Lightning leaps to the rod every 6 to 8 s with a thunder ring; bats wheel round the keep. | Do not build the Pawtuxet farm: joseph\_curwen's hall lies beneath it. Seat (a castle or his own house) waits on the lore check. |
| colossus\_pyramids | A colonnade of colossal hieroglyphed bundle-columns, 22 m tall in two ranks, round a floor behind a dune skirt and a trench. | Sand pours down the trench; torch statues light in sequence; hieroglyph bands run light upward. | Not underground (decision 12). Torch statues stand on capitals above the fog line. |
| yig | A serpent effigy of red-sandstone scale courses winding round the circle; the open jaws are the gate. | Scale courses scroll along the body; eye pits dilate; a forked tongue of light flickers from the jaws. | The mouth is 5 to 6 m high, or the camera pins to your back. |
| nug | A paired shrine of two joined basalt halves with slime troughs between them, for Nug and Yeb. | Slime flows in the troughs and surges when either twin attacks; vents glow; a red line shows at the sill. | Not a blank cube: that cella is the Tsathoggua temple. Needs two outdoor moving parts. |
| bokrug | The bronze gates of a marble city burst open at midnight, the lake behind them, the idol half buried in the marsh. | Green fires, drifting mist, lily pads, moon-path on the lake; eyes of stone lions flicker. | One moment only, not two cities at once. Flood hook: the floor floods 0.7 m, so the charge runway must work under it. |
| other\_gods (OG) | The carved summit of Hatheg-Kla under a wall of cloud. | Silent lightning throws dancing shapes on the cloud. | Section 5. |
| cthulhu | A drowned forecourt: a cyclopean platform in a lagoon, one wide quay, the Great Door that tilts open. | Lagoon swells; six feelers rise and sink; leaning slabs shear slowly; the Door seam glows. | Lethal lagoon with a kerbed quay (decision 3). Reflection cost measured first. Sinks when it falls. |
| hastur | A theatre of stone: orchestra, tiers of masked audience, a skene bearing the pale mask. | Audience still until the Yellow Sign, then every head turns with the sound of stone on stone. | Needs decision 5. Audience goes on the upper tiers and the drum, above the fog. |
| yog\_sothoth (OG) | A bay of abnormal masonry holding a living arch of light onto the void. | Iridescent globes turn in the arch; the court's hum rises. | Section 5. The flagship portal option (decision 2). |
| azathoth (OG) | Thirteen vast blind dancers as the wall. | Slow stamping on one beat. | Section 5. |
| zkauba | A field of tall metal towers (8 to 20 m) with overhead tunnels and floating cylinders, over a plate floor. | Cylinders drift at 8 to 14 m with sweeping lights; tunnels exhale dust. | An open field, not a third maze. Needs a metal plate texture. |
| daemon\_pipers (OG) | A graded colonnade of hollow bone-and-ivory flutes. | Notes light the mouths of the flutes in turn. | Section 5. Flutes, not an organ. |
| ancient\_ones (OG) | A ring of pale hexagonal prisms with one place left empty. | Time stills inside the ring. | Section 5. |

To keep the nineteen from reading alike: only black\_man and cthulhu use a lethal water ring, and they differ in layout; "lights chase round a ring" is kept for one or two arenas and "every head turns" for two; each arena gets its own dominant material, and about six new generated textures are added (marble, bark, strata sandstone, bone, black glass, metal plate) because the house stills found every wall a near-black slab.

## The 27 boss halls and their companions

The fight hall stays 48 m square with a 23 m circle, so the places grow around and above it: a precinct on the land outside, a skin that carries the walls up past 6 m, and a crown on the roofline. Halls are listed by their first boss. Companions fought inside the same hall: brown\_jenkin (keziah\_mason), mother\_hydra (father\_dagon), curwen\_pit\_thing (joseph\_curwen) and nyarlathotep (great\_ones).

| Hall | Place and outside | What moves | Review notes |
| --- | --- | --- | --- |
| keziah\_mason | Garret of the Witch House: a second, wrongly angled gable grows from the roof. Hall panels lean inward above 6 m; rat-holes ring the skirting. | Prisms and polyhedra orbit; rafters breathe; the holes blink. Demo. | Roof must become a shaft roof, or the folding is hidden. Keep the `joins` link so brown\_jenkin still spawns. |
| dunwich\_horror | Crown of Sentinel Hill: a plinth hill with a spiral path, stone ring and table-stone under a standing storm. | Lightning forks to the menhirs on each slam; rune channels chase round the ring. | Open roof already. The storm and hill are a skyline piece: a prop is invisible past 140 m. |
| father\_dagon | The reef-temple: an island ringed by a moat, a causeway to the coast; hall is a basalt hypostyle with a bas-relief course and mother\_hydra's brood pool in the north arc. | Tide sheet, foam, weed banners; the brood pool ripples answer her song. | Water is a shallow sheet with a kerbed causeway of 7 m or more (decision 3). The causeway is the game's own geometry, labelled invented. |
| joseph\_curwen | A bluff homestead on a courtyard plan; the cellar bulkhead behind the barn is the mouth. Hall is the laboratory; the pit room is grated shafts. | Jar banks swirl, vats bubble, chains draw taut, grilles rattle at each grab. | Keeps the 6 m ceiling. The portrait that hides the passage belongs to a different house and is left out. |
| haunter\_of\_the\_dark | A black church with a windowless tower and steeple, boarded louvres. Hall is the inside of the steeple, a 36 m shaft. | Slat light follows the lightning; bell and rope sway; the crystal turns in its seven-banded box. | Shaft roof. The crystal is an even-faced irregular stone, not seven-faced. Bats and moths, not pigeons. Steeple is a skyline piece. |
| whisperer | A hill farm above a brook (a hillside layout, not a courtyard); the study with phonograph and cylinders behind sliding panels. | Cylinder racks chase to his voice; the wax face sags as it is hit. | Keeps the ceiling. The aerial mast is the game's invention. |
| shoggoth | The plaza where the great tunnel meets the abyss, under open polar sky; a crown of star-section cones. | Shaft ripples and steams; murals light in sequence; eyes open in time with the beast. | Open roof. Cones go in the skyline, not as props. |
| flying\_polyp | A dig site over half-buried basalt: a trench maze with a straight route always open. Hall is a ring of sealed trapdoors over a drum shaft. | Slabs lift and slide on bars; a dust vortex stands over each ajar slab. | Shaft roof. Keep its `decoys` hook. |
| tsathoggua | Blue-gate avenue to a funnel shaft above a pit of ichor, with a red glow far overhead. The squat plain basalt temple with a vacant onyx pedestal belongs in this hall. | Ichor heaves; embers fall from the red ring; the idol breathes mist. | Open roof. The descent uses the existing pit rooms, not a new pad. |
| high\_priest | A windowless monastery range on the plateau with a village of windowless huts. Hall of silk: sixteen gilt posts hang six-metre panels. | The cloth follows the boss's cast clock; prayer wheels spin; bowls shiver with the piping. | Open roof. The flute is the game's invention. |
| great\_ones | The onyx rotunda: twelve gold-capped pillars, a dome lit once per broken seal. nyarlathotep's playhouse dressing is added to the same hall. | Gold chases up the pillars; the zodiac turns; four corner coils arc for nyarlathotep. | Kadath is seen only on the climb, never from the lowlands. The carved god-faces belong on Ngranek, a skyline piece. One door serves both Ulthar halls. |
| ghatanothoa | A basalt mountain temple: a plinth about 12 m high, a stair up the flank between hooded statues, terraced amphitheatre. | Ember rain; floor cracks glow and creep where it looks. | Open roof. Mountain is a skyline piece. Check the source texts for the mountain temple first. |
| rhan\_tegoth | The Mi-Go's fungoid copy of a waxworks: flesh-walled frontage, a sign in no known script, eight wax cases round the hall. | Blood channels flow; wax droops; the cases crack at half health. | Open roof. A lore patch that needs your yes (section 9). |
| umr\_at\_tawil | A disc of black glass in a starfield with thirteen empty tall seats and a ring gate. | Armillary rings spin and reverse; the star-wheel drifts. | Open roof (void). Section 5. |
| dr\_munoz | A brownstone grafted onto the hub: stoop, frosted windows, icicles, an ammonia plume. Hall is the cold plant. | Flywheel and pistons turn; frost grows; icicles drip. | Demo, 24 m from the mist, so it stays inside its footprint. Pilot for the machine halls. |
| charles\_le\_sorcier | A moated château in forest with drawbridge, curtain wall and four towers. Hall is the vault laboratory with three alembic towers. | Vats bubble; portrait eyes follow; rooks circle. Demo. | Moat is a shallow ring with a wide deck. Keeps the 6 m ceiling. |
| the\_outsider | A lonely windowless castle whose tower is cut off by cloud, a stone lid propped open in a crooked graveyard. Hall is a gilded mirror ballroom. | Chandelier flames pulse; the mirror arch shows a decaying silhouette. Demo. | 32 m from the mist, so the castle is dressing, not a new footprint. |
| the\_hound | The old churchyard: wall, hedge, avenues of mausolea, a lychgate. Hall is an ossuary nave of skull niches. | Eyes glimmer in the niches; baying moves; mist trails. Demo. | One burial district shared with the\_unnamable, two sections; the gap between them is 20 m. |
| the\_unnamable | A roofless attic overgrown by a willow, behind a burying ground of tilted slate stones. | Fronds sway with no wind; slime strings swing. Demo. | Its own plan: tilted stones, not the hound's grid. |
| voice\_in\_the\_tomb | A cypress swamp cemetery with drowned plots. Hall is a stair-well to a lantern far above, a telephone wire hanging the full height. | The wire carries standing waves and sparks; the horn breathes. Demo. | Shaft roof. Fireflies, not frogs. The epitaph names the wrong tomb: fix. 16 m from the mist. |
| shunned\_house\_entity | A sunken house on a slope lot with a dead elm. Hall is the excavation beneath, shored with timber. | Pale nitre grows like fur with the boss's health; tube arcs. | A house by its own story; distinguished by the growth front. |
| lilith | A tenement church turned dance hall; hall is a canal vault with a ring canal and two footbridges. | The canal turns slowly; the boat bobs; dancers in the windows turn together. | Shallow water sheet with a kerbed quay. |
| terrible\_old\_man | A leaning clapboard house on the harbour front, painted boulders in the yard; hall hung with about 150 bottles on pendulums. | Pendulums swing in waves with no wind; boulders turn a little. | A house by its own story; distinguished by the pendulum field. |
| wilbur\_whateley | A farm compound that has grown sheds in every direction; hall is the boarded upper floor with the hole. | A whippoorwill flock thins with his health; boards flex. | Not a barn nave: the barn room already exists in this dungeon. |
| ephraim\_waite | The Waite house alone; hall is a mirrored study. | Mirror faces cycle; a twin of the actors appears. | The second house belongs to another town: it becomes a room, not a building across a lane. |
| hypnos | A white marble tower in a poppy field with an open crown of gilded ribs; hall is a studio under a dome iris. | Busts' eyes open; petals rise; couch sleepers breathe. | Needs a shaft roof, or the dome iris is invisible. |
| zann\_window\_thing | A steep street climbing from a black river between leaning houses; hall is an attic with a huge window onto the void. | Void swirl; the pane bulges and cracks; a candle bends toward it. | River is a kerbed strip, not a swimmable one. Roofed: trusses stay under 6 m. |

What the review changed across the halls:

- **Every hall states its roof.** Nine halls already have an open roof (dunwich\_horror, father\_dagon, shoggoth, tsathoggua, high\_priest, great\_ones, ghatanothoa, rhan\_tegoth, umr\_at\_tawil). Eighteen have a solid ceiling at 6 m; a few of those (keziah\_mason, haunter\_of\_the\_dark, flying\_polyp, voice\_in\_the\_tomb, hypnos) switch to a shaft roof, and the rest keep the ceiling and put their art outside, on the walls and on the floor.
- **Landmarks that must read from afar are skyline silhouettes**, not props: the view reaches 140 m and fog 132 m.
- **Water drowns**, so moats, canals and rivers are shallow visual sheets or kerbed strips; the old "swim through a moat" is out.
- **Not just houses.** Eleven halls are houses by their own stories. They differ by their one big moving part (flywheel engine, growth front, bottle pendulums, flock, canal, mirror twin) and by a compound that is true to the tale, not by a reskin. The castles, graveyards, farmsteads and void rooms each get their own plan so no two read alike.
- **No second pocket region.** Five halls (keziah\_mason, nyarlathotep, umr\_at\_tawil, hypnos, zann\_window\_thing) swell into a pocket look when a fight phase turns; each has its own language (angles and prisms, a showman's apparatus, a starfield and armillary, poppies, a void window).

## The eight Outer Gods

Each Outer God is a different kind of incomprehensible, and each is found by breaking a rule every other boss obeys. These designs replace the open-arena rows above for the six that are arenas. The fight itself stays fair: only the arrival, the shown form and the way in are strange.

| God | How it is portrayed | How it is found (the rule broken) | Review changes |
| --- | --- | --- | --- |
| azathoth | An absence: a hole in the sky where no star shows, a body drawn unlit with a boiling rim that beats with the drum; thirteen blind dancers 28 m tall are the wall. | Hush. The court road carries one who stands still and refuses one who moves loudly (the same noise rule the fight uses). The map hides and misplaces the Court until you are near. | Drift is defined in the court's own frame with a side width, so it cannot push a body into a wall. The vents and blight on the strip move. The map lie is one shared table, not five. |
| daemon\_pipers | Sound as place: a thin flute piping with no source; notes hang in the air as glowing glyphs, a score of the road you walked. The wall is a colonnade of bone-and-ivory flutes. | Dance across the court on the flute's accents, seen as a pulse on the ground as well as heard. | Flutes, not an organ. Not the same "follow a thing" as 'umr\_at\_tawil. The court's drum stays out of the colonnade, the flute out of the Court. |
| other\_gods | Never bodies: silent lightning lights the cloud wall from inside and throws huge dancing shapes that vanish when stared at. A trilith stands in the wall. | Avert. The way opens only for one who does not look; the stones part behind your back. An optional tier lets you look up, which costs mind. | Honours the Flashes setting and caps lightning at 2 a second. The look-up tier is optional and says the return is the game's mercy. |
| yog\_sothoth | Time: spheres on an oil-slick material whose hue slides with the hour, a bay of abnormal masonry holding a living arch of light. | A page names the hour; in the waning hour of the night a sphere settles beside you wherever you stand. The shipped core is page, vigil and 18 mind. A later tier makes three passes through the arch move the night a third each. | Wording follows the gate-and-key litany, not the idiom of another tale. The clock shift is session-only or the whole clock is saved. The passes do not depend on the hour. The flagship portal option (decision 2). |
| umr\_at\_tawil | The veiled guide: a robed figure whose face is never shown. The hall is the room you fell asleep in, ordinary on purpose. | A guide only you see stands one room ahead at fixed stops. The door is a plain wooden one, the dreamer's own. | Prefer finding the door by resting at the Beyond's Elder Sign with the page read: no second guide mechanic, no untargetable phantom to build. The old live mind rule becomes a one-time carry-forward for old saves. |
| ancient\_ones | The mind as key: a ring of seven pale hexagonal prisms with one place left empty, exactly the size of a person. Inside it, time stills. | Only a clear head sees the lattice and the gate (the lost see less here, the opposite of the Beyond). You sit in the empty place. | Seven, not thirteen, so it does not repeat the dancers. The gate opens for a clear mind or a found horror, not both. The time ease finishes before the boss wakes. The journal says rest at a sign restores the mind. |
| shub\_niggurath | Lost is found: the wood is her body and cannot be mapped. A breathing grove, a horn-tree maze, roots lifting, a gate that opens on the exhale. | You find the arena by being lost; the map blanks inside the grove. The breath ships first, the maze only after a safety net exists. | The creep-when-unwatched figures are another franchise's idea and are removed. Maze starts at 24 m from the gate. Travel stays available with the map blanked. |
| nyarlathotep | He finds you: after the second seal, each region boss's fall leaves a handbill; the quest lead lies late; a door of cloth stands at a shrine you trust. The fight is a three-act show in masks. | Read the bills, answer the door, see the show. The fight stays in the Kadath hall beside the Great Ones (decision 7). | Bills persist and are kept out of the "read everything" count. The mask swaps the model and the name only, never the stats. The in-place scene fits the cinema format. |

Fairness rules that apply to all eight: every sense-gated rule has a second channel (a caption, a ground pulse, a streak of motes) and an Assist and Off form under the Strange places setting; nothing flashes faster than 3 Hz and all of it respects the Flashes, shake and effects-cap settings; ground effects never touch a fight's telegraphs; and because hints stopped showing on screen in round 58, each strange rule gets an on-screen notice at first contact, with the Field Guide as the record.

## What is built once and shared

The three drafts each invented their own foundation for motion, looks and doors. Merged, there are eleven shared pieces and every place uses them; none of them is a boss. Rounds are numbered from 66, since PR 152 holds 63 to 65 (65: the discoveries made fair).

| Piece | What it does | Replaces in the drafts | Round |
| --- | --- | --- | --- |
| Enclosure seam | The round 63 house becomes a general plan: a kind, a bound, an `inside()` test, a gate, a front, and the stake and candle spots, so a wall ring is one kind among many. Also fixes every circle-hardwired place the review found (candle and stake, foe posts, mounts, map). Behaviour-neutral, all 19 rings pass the old tests first. | The arena draft's seam; the hall draft's separate precinct code | 66 |
| Pad and collider contract | One source of truth for pad heights (the terrain calls the same function the planner does), all pads built before any structure reads them, every gate ends on land at or above 1 m under the land, and each collider carries a vertical range that follows a sloped bank. | Both drafts' pad ideas, which disagreed | 66 |
| Living layer | One system for motion and light: shader terms on the world material (sway, pulse, flow, droop, breathe), view modules in the wayViews pattern (made within 100 m, put away past 135 m), instanced crowds, a hall air source, light chases from halos, a sound scheduler. Per-place caps: 2 views, 600 particles, 48 halos, 1 beam, 15,000 animated triangles, 3 extra draw calls. | The arena draft's living layer, the hall draft's kinetics, the Outer Gods' Living Houses | 67 |
| Place skin | A named look eased in by distance, like realms are: grade, mist, sky colour, a sky figure, light. No new region, so no new music track. In a roofed hall it is drawn on a dome inside the room. | The hall draft's pocket key, the arena draft's place looks, the Outer Gods' skin | 68 |
| Hall spec and stages | One record per hall: its roof, skin profile, precinct, moving parts, and stages that follow the fight's phases. Stage is derived from the saved fight, so no save change. | The hall draft's foundation | 69 |
| Gate looks | A registry of gate pictures (sluice, jaws, burst bronze, tilting door, iris, and so on) in place of the one uniform door. | The arena draft | 67 |
| Ordeal | The one new discovery step type, with rules hush, follow, avert, pass and sit, told as `ord:<boss>:<rule>` and with stable step ids so old saves are not mis-credited. | Five separate step types | 70 |
| Strange places setting | Full, Assist or Off in the Accessibility tab, read by every Outer God rule; a rule is off during a fight, a hunt, a cutscene or while mounted. | New | 66 |
| Lying map | One table of lies that the map, minimap, lead, beacons and marker all obey, so they agree. | Five scattered tricks | 70 |
| Planners | Outline (a polygon or curve closed with chained boxes), ground (stacked pads, raised banks, kerbed islands), wall graph (two mazes, solvability proven by search), assembly (figures on a ring, tiers or curve), precinct plans and a grave field for halls. | Per-boss one-offs | 67 to 76 |
| Reaction to the fall | When a horror falls, its place answers: lights die, the veil closes, the moat drains, the loop stops, through the same view. The review noted this is cheap and nothing planned it. | New | 85 |

Cut from the drafts, on purpose: a road that teleports you (risky), Memory Plates (a save change for little), a per-god pocket region (each would need its own recorded track and touch about 40 tests), a void drop outside the Court, and the Exhibition as a separate dungeon (kept as a later option). Rift-lite, a run-time door, is built only if you pick the flagship portal in decision 2.

## What the engine cannot do, and what is offered instead

The reviewers checked each ask against the code. These limits are measured, not guessed, and they are why the plan builds up and outward and fakes depth with skins.

| You asked for | The limit in the code | What the plan does |
| --- | --- | --- |
| Underground megastructures, sunken courts | The sea plane sits 2 m under the land and anything below 1.6 m under drowns you, so a floor cannot go lower than about 1 m under. | Raised rims, dune skirts and colonnades round a floor at land height. A true underground hall is possible only as a small dungeon (decision 12). |
| Moats, a place in the sea | Water drowns. A lagoon or river ring is a lethal ring, and it switches on the reflection pass, which redraws the scene. | Kerbed causeways and quays at least 7 m wide; lethal water beyond the kerb; reflection cost measured on black\_man and cthulhu before the demo ships. |
| Spectacle you see in the fight | The fog ring is opaque up to four-fifths of its 6 to 11 m height and holds you inside, so nothing low is seen from the circle. | Show-pieces stand above about 12 m or on the floor inside the circle. Every place gets a screenshot from the fight circle as its acceptance test. |
| Landmarks you see from far away | A view reaches 140 m and fog 132 m (55 m when the mind fails); chunks stream two away. | Anything meant to read from afar is a skyline silhouette, not a prop. |
| Towers and skins over a hall | Eighteen halls have a solid ceiling at 6 m; the roof of a pitched-roof shell is already raised over timber and church halls. | Each hall states its roof (open, shaft, or keep the ceiling), and the shell's own roof is switched off where a skin replaces it. |
| A portal into another boss dimension | A hall is one 48 m box; a new region needs its own recorded track and about 25 files. | Place skin everywhere; one flagship walkable portal if you choose it. |
| Banks and slopes as walls | Movement has no slope limit and a collider only works inside its vertical range, so a bank without chords is an open field. | Each wall chord carries a vertical range; the closure test walks with feet on the real ground. |
| Mazes | There is no path-finding for foes; a hunter pins on the first corner of a lane. | Two mazes, not three; foes stay in fixed bays; mounts refused; lanes 6 m or more so the camera works. |
| Fine motion | The picture is 400 by 225 with vertex snapping; at 30 m a pixel is about 0.1 m, so tiny motion jitters or vanishes. | Minimum amplitudes, silhouette-level motion, checked at 400 by 225. |
| Detail | The current houses cost 14k to 45k triangles in one pass but 112k to 667k at an arena's heart once every pass is counted, with 80 to 280 draws. There are 12 lamps and 400 halos. | A cap per structure counted over all passes from the renderer, a quality rung that switches structure views, crowds and reflection off, and halos in place of lamps. |
| Free assets for the structures | The bake keeps light and dark per face, flat shaded, no glow, only stone, wood and leaf. | Every enclosing form is built in code; baked models are dressing. See section 10. |

## Order of work, effort and the performance budget

Three pilot rounds covering five places go first, then a go or no-go, then everything else in waves, one pull request per round.

&#91;embedded content: roadmap · 5 stages, 1 gate\]

Rounds are not to scale. Each round is its own pull request with its own audit run.

Roadmap (rounds are not to scale; each round is its own pull request with its own audit run):

1. Round 66, groundwork: enclosure seam, pad and collider contract, Strange places setting, measured-budget script. No visible change.
2. Rounds 67 to 69, three pilots: edward_hutchinson (a keep); colour_out_of_space and black_man (reservoir and river island, both in the demo); dr_munoz and terrible_old_man (machine halls).
3. Gate: go or no-go on measured cost per place in every render pass, a screenshot from the fight circle that reads, and Dro's yes. If no, keep the places that work and stop.
4. Rounds 70 to 77, open arenas and Outer Gods: azathoth first, then outline buildings, earthworks, two mazes, more Outer Gods, ground, and hastur's theatre.
5. Rounds 78 to 84, boss halls: tide, shafts, burial grounds and castles, machines, monuments, pockets, living houses; nyarlathotep's invitation last.
6. Round 85, close-out: retire the ring planner, reactions to the fall, a measured pass of all 46, docs, and the full audit.

**Effort, honestly.** Each draft estimated its own part and the reviewers found every one too low: the arena draft needs about 40 kits, two mazes, five ground profiles, three assemblies, 19 gate looks and about ten new test files; the hall draft's five to six months solo became nine to fourteen once the audits are counted. Together, expect well over a year of one engineer's work for all 46 places. That is why the pilots come first: if they show that fewer places at higher quality is what you want, the later waves shrink.

**Performance budget.** All numbers so far come from software rendering with about 250k triangles of run-to-run noise; no real GPU has been tried, so the caps below are provisional until one is.

| Measure | Today | Rule for every new place |
| --- | --- | --- |
| Triangles at an arena's heart, all passes | PR 152 adds about 52k on average over main; busiest reading 667k (black\_man) against main's 639k and the sea benchmark's 553k | A cap per place from the pilots, counted over every pass from the renderer, never the 60k single-pass figure. The busiest reading may not rise. |
| Draw calls | 80 to 280 | At most 3 extra per place; wide structures split into at most 3 sectors. |
| Reflection pass | Switched on by any water below 2.5 m under the land; today only daemon\_pipers' east edge trips it | Measured on black\_man and cthulhu before the demo ships; a quality rung that turns it off. |
| Lamps and halos | 12 lamps, 400 halos | New glow is halos and emissive, never lamps. |
| Ground decals | 256 shared with boss telegraphs | A steady budget of 24 of 56 per place, and a test that telegraphs keep their reserve. |

**Tests added with the work.** Pairwise checks on the Beyond tile, where the courts of azathoth and yog\_sothoth meet at the beyond\_court sign; a save made inside a hall before it changed must land on safe footing; the demo test and the demo border; every arrival and fall camera checked against the new geometry (46 places); and each place's screenshot from the fight circle.

## Lore to check before any art is made

The lore stage for the Outer Gods failed once in this run, so their lore rests on the designers' memory and the reviewers' checks. Nothing below has been confirmed against the stories; each row is either a point to read in the text or an invention that needs your yes. Where I could not decide, the default column says what I will do.

| Horror | The point | Default if you do not say |
| --- | --- | --- |
| edward\_hutchinson | The draft dropped a castle seat in the old country as unverified, but the game's own epitaph relies on it. Do not build the farm over joseph\_curwen's catacombs. | Check the novel; castle if canon, else his own house. |
| simon\_orne | The vault letter's "Roman wall" may not be a Massachusetts place. | Check; if not, keep the cemetery grid and draw the vault only. |
| ancient\_ones | Seven prisms or thirteen; the arena draft said thirteen, the Outer God draft seven. | Seven. |
| ghatanothoa | The mountain temple and hooded priests. | Check the text before art. |
| rhan\_tegoth | The game has the museum on Yuggoth; the tale puts it in a city. | A copy of the museum built by the Mi-Go: needs your yes. |
| high\_priest | Monastery interior and the flute, which the draft took from another court. | Flute kept as the game's own. |
| yog\_sothoth | Wording of the gate and the hour. | Gate-and-key litany; no borrowed idiom. |
| other\_gods | The cry of the climbing priest and who turns back. | Check the wording before the omen. |
| hypnos | The studio in the tale has no dome. | Dome kept as the game's own. |
| charles\_le\_sorcier | The castle in the tale has no moat. | Shallow moat kept as the game's own. |
| daemon\_pipers | The tale gives flutes and drums, never an organ. | Flute colonnade. |
| nug | A blank basalt cella with an empty onyx pedestal is another horror's temple. | Paired shrine for Nug; the cella moves to tsathoggua. |
| bokrug | Two cities that never stood together. | The burst gates and marsh only. |
| shub\_niggurath | A maze is your request, not the story's; the story has a hilltop ring and altar stone. | Maze plus the ring as its heart. |
| wilbur\_whateley | The tale kills him in a library, the game arrives him in a barn and fights him upstairs. | Upstairs, as the game has it. |
| voice\_in\_the\_tomb | The epitaph (src/data/epitaphs.ts) names a tomb from a different tale. | Fix the text. |
| hastur, martins\_beach\_horror, medusa\_gorgon | Hastur is from another author; the other two have thin canon, so their dressing is the game's own. | Accepted as the game's. |

Inventions already in the plan and labelled as such: the dagon causeway, the aerial mast at the whisperer's farm, the statue household at medusa\_gorgon, black\_man's ford and standing stones, yig's effigy shape, and every moat.

## Free assets, and where the detail lives

Every enclosing form (gates, keeps, columns, flutes, tiers, courses of masonry, the serpent, the Great Door) is built in code, because the bake keeps only light and dark per face, flat shaded, with no glow, and only stone, wood and leaf classes. Baked CC0 models are dressing on top.

- **Reachable from here:** KayKit by git (Dungeon Remastered, Halloween Bits, Medieval Hexagon, Space Base Bits), CC0 by its own licence file. The bake tool needs a KayKit entry and a reader for its file type, a line in CLAUDE.md's asset exception, THIRD\_PARTY\_NOTICES, and DECISIONS. The worthwhile pieces are dead trees, an arch gate, a rib cage, and the Hexagon castle towers, walls and gates, which are the nearest thing to a real castle.
- **Not reachable from here:** kenney.nl, Quaternius, Poly Pizza, OpenGameArt, Sketchfab, itch.io. More Kenney kits (Castle, Pirate dock and pier, Furniture, Industrial) only arrive if you put them on disk as an unpacked folder, as before.
- **Already baked and enough for most dressing:** 59 Kenney models (graveyard stones, crypt, coffin, iron fence, columns, statues, hedge, wreck, rowboat, pines, rocks, cliffs, lilies, mushrooms). KayKit gravestones and crypts would only duplicate them, so they are not re-baked.
- **Textures and sound:** about six new textures (marble, bark, strata sandstone, bone, black glass, metal plate) are generated in code, and new sounds are synthesised; recordings of the Beyond's drum and flute, a clock and a wood's breath are optional and listed in `plannedSounds`. No new music, voices or regions are needed.
- **Order:** the bake runs before round 67, not after, so the pilots are not re-touched.

**Where the detail lives.** On the branch `claude/relaxed-curie-w5lwve`, in `docs/handoff/`: `HANDOFF.md` (how to pick this up in another session), the three full plans (`plan-A-open-arenas`, `plan-B-boss-halls`, `plan-C-outer-gods`, each as `.md` and `.draft.json`), their three skeptical reviews (`.critique.md`), and `PERF-arenas-main-vs-pr152.md`. The 76 house stills are in the project files under `seventy-steps/house-stills`. The full plans hold the per-boss concepts, lore notes, motion lists and tests that this page only summarises.
