# The arenas' gates (round 76)

Asked: replace the generated gates of the boss arenas with free, more thematic, animatable ones, each fitted to its arena's story; audit what
the old generated gates left behind; where nothing suitable is found, keep the gate or remove it.

**What was replaced.** The twenty open arenas each have a house (a wall, towers, a gate). The gate was a `HiddenPieceDef` drawn by
`render/passageViews.ts` from boxes built in code: a stone frame with runes (`passageShapes.doorKit`) and a slab that slid into the wall, or
from round 68 and 71 a `GateLook` (`gateLooks.ts`, `gateMetal.ts`, `gateWild.ts`: sluice, boulder, bars, portcullis, leaves, roots, fangs), all of
them boxes and icospheres of one flat colour each. Those three files, the `GateLook` type, the `look` of each house's gate and the `lift` of a
`DoorKit` are gone. The hidden passages elsewhere (a hidden door in a wall, a bridge) are not gates of an arena and keep `doorKit` and `bridgeKit`.

**What a gate is now.** `data/gateStyles.ts`: one style for each horror, by id: a few parts, each a baked model fitted to a share of the
opening (`span`, -0.5 to 0.5 across it) or stood at its own proportions at a jamb, and a motion: `swing` (about its hinge at the jamb, away from the
side the investigator comes from, `door.out`), `slide` (into the wall), `lift` or `sink` (a row of flutes or trunks sinks one after another), or
`still` (dressing). There is no frame: the towers and walls of the house are the frame. `render/gateRig.ts` fits and colours the parts (the arena's
stone, the wood, metal, bone and cloth dyes, the same words a place's pieces use) and carves the house's glow as runes on a part that asks (`glyphs`:
flat leaves only). `render/gateViews.ts` moves them from `Layer.open`, with dust where a leaf clears its edge and the sound of a dungeon door of the
style's kit (`data/doors.ts`), as the old gate had a stone door's. Every part is clear of the way before the seal's collider is lifted
(`PASSAGE.solidAt`; `GATE_TIMING`, held by `tests/gateStyles.test.ts`).

Rigid motion only: the spec rules skeletal animation out, and a leaf that turns, slides or sinks needs none.

## Sources

Free only: CC0, or CC BY 4.0 with attribution (three models need it, all from Sketchfab, below). Nothing was taken from the supplied zips that fits a
gate; they hold temple doors, menhirs, flutes, basalt and dead trees, which the styles reuse where the story fits.

| Source | Licence | Used for |
| --- | --- | --- |
| Large Iron Gate, Poly Haven (Josh Dean) | CC0 | the burying ground, the plantation and Carcosa |
| Large Castle Door, Poly Haven (Tina) | CC0 | the reservoir, the sea wall, the keep |
| Namaqualand Boulder 03, Poly Haven (Jenelle van Heerden, Dario Barresi) | CC0 | the ford |
| Castle Kit's metal gate, Kenney | CC0 | the keep's portcullis |
| Aztec Double-Headed Serpent for printing, corentin (Sketchfab) | CC BY 4.0 | Yig's jaw: the carved, fanged head of one half |
| Demons Gate, Trockk (Sketchfab) | CC BY 4.0 | the corona of ground spikes before the Court's doors |
| Epic Alien Temple Door, Jungle Jim (Sketchfab, `w22`) | CC BY 4.0 | the Threshold: the carved temple front, split into two sliding halves |
| the supplied packs (already credited) | as credited | temple doors (sun, moon, leaf), menhirs, flutes, basalt, dead trunks |

`python3 -I tools/models/gates/fetch.py <work dir>` fetches the first four (network, standard library only; the licences are read from the assets'
own info and kept). The Sketchfab models (`w20`, `w21`, `w22`) need a sign-in to download, so they are downloaded by hand as glTF and put in `<work dir>/w20`, `/w21` and `/w22`
(`scene.gltf`, `scene.bin`, `license.txt`); the baker then reads them like the rest. `python3 -I tools/models/bake_boss_models.py <work dir> --only gate_iron_l,...` bakes them (`tools/models/boss/manifest_gates.py`,
`set: 'gate'`) into `src/data/models/gateIndex.ts` + `gatePack.ts` (about 144 KB), beside the other sets, which the tool leaves byte for byte as they were.
Credits: `src/data/models/CREDITS.md`.

## Follow-up to round 76: Yig's jaw and the cosmic doors

The fang jaw (a portcullis turned over) and the Outer Dark's reused temple doors were the two gates the first round marked as stand-ins, to be replaced by
modelled ones that had to be uploaded (CC BY is accepted). The candidates uploaded were looked at in turn:

- **Yig, `gate_yig_head`** (Aztec Double-Headed Serpent for printing, corentin, 203,000 faces in three chunks the viewer split at its vertex limit of about 65,000). The model
  is two half-arches, each ending in a head carved on both faces: a scrolled brow, an eye, a gaping mouth of fangs. One head is taken, cut from its neck and coil
  and the cut closed (`cut` and `cap`, `join` for the chunks in `tools/models/boss/sources.py`), decimated to about 8,000 faces (4,500 smeared the brow's scroll, 9,000
  kept it), and turned to face along the wall. In the gate it stands 6.4 m tall and 8.7 wide in the front of the mouth of the mound, before a slab of the mound's
  own earth that fills what the head does not, and both go down into the ground together. Not split into an upper and a lower jaw: the lower front fang rises past
  the tips of the upper ones, so no plane parts the two, and a head that opens upward would hang in the air over the passage.
- **The Court (Azathoth), `gate_demon_ring`** (Demons Gate, Trockk, 7,600 faces: a ring of long spikes about an open middle). Flattened to half the wall, it stands
  before the Court's black doors as the corona of a black sun and sinks with them (violet on black, under the doors' magenta runes).
- **The Threshold (Yog-Sothoth), `gate_alien_l` and `_r`** (Epic Alien Temple Door, Jungle Jim, 75,000 faces for the front alone): a carved biomechanical-gothic temple
  front, two obelisk towers, a rose and a doorway, and nearly the opening's proportions (17 by 17 against 11 by 12). Only the front is taken (its four door leaves, its
  three halls and its ground are left), cut in two down its doorway (`cut` and `cap`), each half decimated to 9,000 faces, the carved side turned to -z where this gate is come
  to from. It stands in front of the sun and moon doors, which slide apart behind it, and each half goes with its leaf, so the front comes apart down its doorway. (The
  first try stood the ring in two halves here; the front suits a wall of crystal that "shows everything" better, and the ring suits the black sun.)
- **`v` is now what its comment said.** A part's `v` is positive toward the side the investigator comes from; `gateRig` took it as the world's +z (or +x), which
  is that side only for the five houses whose gate faces +z or +x (`door.out` +1; the other fifteen are -1, Yig's among them). It is multiplied by `out`. Of the
  styles that had a `v`, the keep's (out +1) is as it was and the two rows of Shub-Niggurath's palisade trade places; `tests/gateStyles.test.ts` keeps the rule.

**Looked at and not used.** The folder was shared by link part-way through, and the four large zips came down: Wyrm's Head is a mountain-sized low-poly hill in the
shape of a gaping wyrm's head with a castle and pines on its back, a landmark and not a gate leaf (a head of that size would stand over a court, not in a gate); the
Energy gate of the northern hemisphere is two obelisks, a thin ring and a plasma sheet (4,000 faces), a good frame but with no door to it; the Sunken Ancient Temple
Doorway is 1.9 million faces of weathered doorway (no decimation keeps its carving); the Blockbench Quetzalcoatl is a voxel serpent whose head is a fan of feathers: no jaw.
The first two are the best of what is left for the courts' skylines and doors, see `docs/ARENA_MIXES.md`.

## Where nothing was found

- Shub-Niggurath's root curtain: Poly Haven's roots are flat ground cover; a palisade of the pack's dead trunks that sinks stands in its place.

## Not verified

GPU frame times (the renders here are a software rasteriser's) and how a gate sounds. Pictures were taken of all twenty gates shut and at 30% open
(a few also at 45%), in a software rasteriser with the lights raised; none of a gate fully open or in a fight, and nobody has played through them.
`dim` (a part's colour scaled down) was tuned by eye from those pictures for the black and dark temple doors, which read as wall colour without it.

## The mist is in the gate (round 78)

The fog that stood in a ring about each fight is gone (it hid the house and its gate from whoever came in). The arena's fog wall is now a doorway wall at the gate (`world/gatePlan.ts`): the width and height of the opening, in it, on the court's side of the leaves and inside the wall's thickness (`FOG.behind`, at most the thickness less 0.25 m), so the leaves swing, slide, lift or sink as before and the mist is what stands in the opening they leave. A shut gate has no prompt (`fogNear` skips a wall whose gate piece has not opened). Passing it is E as at a hall's door; the walk ends 1.8 m inside, in the court, and the horror wakes when the investigator steps into its ring (`Wake`, `wakeBetween`), as before.

