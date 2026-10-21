# The bestiary in 3D: design and animation concepts

Every creature and boss of the roster (`src/data/roster.ts`, spec §4) gets a custom low-poly 3D model with its own
skeleton, surfaces and animations, made in Blender by script (`tools/blender`, docs/MODELS.md). These pages are the
concept for each one, written before any of them is modelled: what it is, how it is built, what it is made of, and
how it moves, attack by attack. A model is made from its entry, and checked against it.

| File | Entries |
|---|---|
| [lesser-1.md](lesser-1.md) | Deep One … Serpent Man of Valusia (15 lesser) |
| [lesser-2.md](lesser-2.md) | K'n-yan Dweller … Gnoph-keh (16 lesser) |
| [greater.md](greater.md) | Mi-Go … Thousand Young of Shub-Niggurath (13 greater) |
| [named-1.md](named-1.md) | The Colour Out of Space … Edward Hutchinson (9 named) |
| [named-2.md](named-2.md) | Things in Curwen's Pits … The Voice in the Tomb (10 named) |
| [named-3.md](named-3.md) | High Priest Not to Be Described … Z'kauba (10 named) |
| [great-old-ones-1.md](great-old-ones-1.md) | Cthulhu … Ghatanothoa (6 great old ones) |
| [great-old-ones-2.md](great-old-ones-2.md) | Rhan-Tegoth … the Great Ones (6 great old ones) |
| [outer-gods.md](outer-gods.md) | Azathoth … Nyarlathotep (8 outer gods) |
| [allies.md](allies.md) | Nodens … the Yithian Archivist (7 allies) |

## What holds for all of them

**The look.** Retro 3D (spec §2): PS1-era low-poly bodies, segmented, flat-shaded where hard and Gouraud where soft,
under the game's own pipeline (600×338, vertex snapping, affine texture wobble, fog, 64-colour palette, Bayer
dither, sanity warp). Detail goes into the silhouette and the motion, not the triangle count: a man-sized body is
seen at 100-200 pixels tall. Colour is charcoal, bone, rust and sea-grey; saturation is only for the anomaly hues
(Eldritch Magenta, Cosmic Purple, Void Green), and only where something is wrong: eyes, markings, a sheen, a wound.

**Lore first.** Each design starts from Lovecraft's text (and his revisions), quoted where he describes it; where he
barely does (`canonLooks: false`), from the hints he gives, said so. The reviewed 2D sprites (`public/creatures/reviewed`,
`python3 tools/blender/refs.py <id>`) and their prompts (docs/SPRITE_PROMPTS.md) are the author's reading of the same
creatures: the models keep faith with their palette and their best ideas, but are designed in three dimensions, from
the story, not traced from 64 pixels. No later-mythos additions (spec §3C).

**Readable as a fight.** It is a soulslike. Every attack has a tell the player can learn: an anticipation that
starts at frame 0 and builds through the wind-up, held (a "hang") just before the strike; the strike itself fast
(3–6 frames); a follow-through that carries the weight past the target; a recovery that shows the opening (a colossus's
head comes down within reach: hurt.ts). Two attacks of one creature must not share a wind-up silhouette. The same
attack id on two creatures is two different motions, made from each body.

**Timed by the game.** The fight decides when a blow lands; the picture follows it. Each clip's length and its
`strike` frame are the game's (`tools/blender/timing.json`, written by `tests/modelTiming.test.ts`, 60 frames a
second): for a melee blow the strike is the first frame of the hit window and `end` its last; for a bolt, a beam, a
pool, a summons or a spell, the frame it leaves or takes. The game lays the clip on the move frame by frame
(render/models/modelPose.ts). What the data says of each attack is in its entry:

- **arc** `[from, to]` in degrees: where the hit sweeps, from → to, positive on the creature's **right**. A sweep of
  `[80, -60]` is a forehand from its right to its left.
- **lunge** `[from, to, metres]`: the fight carries the body that far over those frames. The clip does not move the
  body forward itself (it would go twice as far); it shows the leap, the charge, the slither.
- **reach** and **height**: where the hitbox is (metres from the body's centre, metres up).
- Bolts (`projectile`, `projectile_fan`, `spit`, `barrage`) leave from about 0.6 × the body's height, a radius in
  front of it: the casting hand, the mouth, the eye or the organ that throws them is there on the strike frame.
- Ground attacks (`eruption`, `quake`, `pool`, `aoe_ring`, `vortex`) are drawn by the effects (render/bossFx.ts); the
  body's part is the gesture that calls them up: a stamp, a slam, a hand pressed down, a scream into the ground.

**The clips** every model has: `idle` (loop), `move` (loop, with its `stride`: metres one cycle carries the body,
so the feet do not slide), `hurt` (34 frames: a stagger), `reel` (96, or 64 for a boss: knocked open by a parry or
a broken guard; it recovers by the end), `death` (80: the body falls, then the game fades it), `evade` where it slips
blows (26: a sidestep or hop with i-frames), `stoop` for the colossi (a loop: bowed after a blow, head within
reach), and one `atk.<id>` for every attack in its list, its boss phases and its variants.

**Variants.** The eldritch variant (at Fractured sanity or below) shows parts drawn only then (a model layer: more
eyes, a split jaw, a growth) and its anomaly glow; a boss variant (Elder Shoggoth, Polyp Swarm) is the same model
drawn at its size, with what its entry adds.

**Budgets.** Triangles: lesser 1600, greater 2400, named 2600, great old ones and outer gods 5000, allies 2200.
Bones: at most 64. Materials: at most 4 (each is a draw call). The world allows 150 draw calls in all.

**Axes** (for the poses written in the entries): the creature faces its front; "its right" is its own right.

## Surfaces: textures and finishes

A model's surface is a **texture** (the grain: generated in code at 128×128, tileable, like the world's) times its
**vertex colours** (the palette tone of each part, so the texture never sets the colour), lit by the world shader,
plus up to three **finishes** (shader features). A part's material is written `texture+finish+finish`, e.g.
`scales+wet`; a model has at most four materials.

**Creature textures** (new; to be generated in code beside the world's, `src/render/textures.ts`):

| Texture | Grain | Typical wearers |
|---|---|---|
| `scales` | overlapping rounded scales, darker rims, rows that follow the length | fish-folk, serpents, lizards |
| `slick` | mottled amphibian skin, pores, blotches | bellies, toads, slugs, wet flesh |
| `rubber` | smooth skin with faint creases and stretch marks | night-gaunts, ghouls, polyps |
| `chitin` | plates with ridged seams, pits and scratches | Mi-Go, crustaceans, carapaces |
| `fungal` | spongy and pitted, fine radial gills | Mi-Go flesh, mould, the Shunned House |
| `fur` | strands in clumps, combed one way | rats, cats, Brown Jenkin, the gnoph-keh, apes |
| `robe` | woven cloth, long folds, worn hems | cultists, priests, sorcerers |
| `wrap` | bandage strips crossing, stained | mummies, a pharaoh's linen |
| `bone` | porous ivory, hairline cracks | horns, claws, skulls, beaks |
| `necrotic` | bruised mottling, dark veins | the dead, the degenerate, the eaten |
| `bark` | fibrous ridges and knots | the Thousand Young, roots, hooves |
| `protoplasm` | oily dark ripples and bubbles | shoggoths, formless spawn, the Court |
| `coral` | barnacles, crusts and holes | Dagon, Hydra, the star-spawn, Cthulhu |
| `membrane` | thin skin over branching veins | wings, fins, webbing, hoods |
| `stoneflesh` | cracked stone with lichen, as if flesh set hard | Ghatanothoa, the Colossus, the Great Ones |
| `metal` | hammered gold or bronze, dents | tiaras, crowns, devices, the Yithian's tools |

The world's own (`flesh`, `hide`, `cloth`, `stone`, `rock`, `wood`, `rot`) stay available.

**Finishes** (per material, in a creature variant of the world shader; none breaks the palette: highlights are the
lights' own colour, and any hue is an anomaly hue):

| Finish | What it does |
|---|---|
| `wet` | a soft highlight of the lantern, the lamps and the moon, and the colour a little darker: slime, sea-skin, a tongue |
| `gloss` | a tight highlight: chitin, metal, a polished horn, an eye |
| `oil` | a thin film of the anomaly hues at grazing angles, crawling: shoggoth-skin, a void-thing's hide |
| `rim` | the silhouette lifted at grazing angles, so a black body reads against the dark: night-gaunts, the Haunter |
| `fuzz` | velvet: brighter toward the edges, softer at the centre: fur, moss, spore-dust |
| `pulse` | the glowing parts (vertex glow) breathe in and out, slowly or in a racing beat |
| `veins` | the glow runs in the texture's veins and cracks rather than over whole faces: a lit wound, a sigil |
| `flow` | the grain crawls across the surface: protoplasm, liquid flame, the Colour's churning |
| `ghost` | partly see-through (dithered, never blended) with a pale edge: wraiths, voices, the half-there |
| `void` | patches open onto the starry void behind the body (the eldritch shader's, placed by the texture) |
| `outside` | a hue outside the palette, cycling and spared by the post pass: the Colour Out of Space alone |

## The entry

Every entry has these parts, in this order (the Deep One below is the worked example):

1. **Heading** — `### Name · \`id\`` and a line in italics: tier · story · body height (and capsule radius) ·
   archetype · palette · glow · canon look or designed from hints.
2. **Concept** — two or three sentences: what it is, how it should feel, the one-look read that tells it apart
   from every other entry.
3. **Lore anchors** — the lines of the story it is built from (quoted short, or paraphrased), or the hints, if
   `canonLooks` is false.
4. **Anatomy and silhouette** — the body plan, proportions in metres, the features that make it, and the rig: its
   bones and chains.
5. **Surfaces** — each region's material (`texture+finishes`) and palette tone; its glow: where, which hue, why.
6. **Variants** — eldritch (what grows or changes; from its data), boss variant if any.
7. **Motion** — `idle`, `move` (gait, stride), `hurt`, `reel`, `death`, and `evade` / `stoop` where it has them:
   a sentence or two of beats each.
8. **Attacks** — one paragraph per attack clip, headed with its data (`atk.sweep` — 50 f, strike 22, end 28,
   arc 80→−60): its beats by frame (anticipation, hang, strike, follow-through, recovery), the tell, and what makes
   it this creature's own.
9. **Boss** (bosses only) — how the phases show on the body, its signature mechanic (spec §3E) as the body plays
   it, and how it arrives and falls.
10. **Budget** — triangles, bones, materials.

---

### Deep One · `deep_one`

*lesser · The Shadow over Innsmouth · 1.96 m (r 0.51) · pack hunter · sea · eyes pale, Void Green when eldritch · canon*

**Concept.** A frog-mouthed fish-man of Devil Reef, hunched and long-armed, always wet. It should feel like
something that would rather be swimming: it lopes and hops on land, its arms swing low, its eyes never close.
One look: the wide flat fish head sunk into the shoulders, the bulging eyes, the crest of fin down a hunched back.

**Lore anchors.** "They were mostly shiny and slippery, but the ridges of their backs were scaly … their heads were
the heads of fish, with prodigious bulging eyes that never closed. At the sides of their necks were palpitating
gills, and their long paws were webbed. They hopped irregularly, sometimes on two legs and sometimes on four."
Greyish-green, white-bellied (Zadok Allen's account and the narrator's at the Gilman House).

**Anatomy and silhouette.** Hips at 0.86 m, torso pitched forward 25°, so the head (top at 1.85) sits ahead of
the feet. A pot belly; broad shoulders humped like a toad's. The head is wide (0.48 m) and flat, no neck to speak of,
a mouth across its whole front lined with needle teeth, and a hinged lower jaw that drops a hand's width. Eyes the
size of fists on the upper sides of the head, in bulges. Three gill slits each side behind the jaw. A crest of
spined fin from the small of the back over the skull. Arms long enough that the hands hang at the knee: four thick
webbed fingers with hooked claws. Short, bowed, frog-like legs on flat webbed feet with three long toes.
Rig (19 bones): root, hips, belly, chest, neck, head, jaw; upper arm, forearm, hand ×2; thigh, shin, foot ×2.

**Surfaces.** Back, limbs and head `scales+wet` (sea mid, darkening to sea dark down the spine); belly, throat and
under-jaw `slick+wet` (sea mid toward bone, countershaded); fin crest and webbing `membrane+wet` (sea dark,
translucent at the edges); teeth and claws `bone+gloss`. Eyes: pale bone-green beads, glowing faintly (they catch the
lantern and shine out of the mist).

**Variants.** Eldritch (4 eyes, Void Green): a second, smaller pair of eyes opens above the snout, wet and new, and
all four burn Void Green; the gill slits glow faintly green (`pulse`, slow, like breathing).

**Motion.**
- `idle` (120 f): a hunched crouch; the chest heaves every second, the jaw works open and shut as if croaking, the
  head turns a little side to side; the arms hang and sway.
- `move` (40 f, stride 2.13 m): the hop the story gives it: a loping run with a long flight phase, the body dipping
  low as each foot lands and the arms swinging long against the legs; the crest bounces.
- `hurt` (34): snaps upright, head thrown back and jaw wide, arms flung out; settles back into the crouch.
- `reel` (96): staggers a step back, arms windmilling; folds over itself, gasping, head shaking; gathers.
- `death` (80): rears up with a croak, sinks onto its knees, topples forward onto its face, arms splayed.

**Attacks.**
- `atk.sweep` — 50 f, strike 22, end 28, arc 80→−60. Frames 0–13: it coils to its right, the right arm swinging
  out and back wide, the webbed claw spread, the head staying on its prey; 13–20: the hang, a little further back,
  the jaw opening (the tell: the wide-flung arm). 22: the claw rakes across, the body whipping round after it; 22–28:
  it carries through to its left, crossing in front of the body; 28–50: it settles, arm dragging back down.
- `atk.lunge` — 72 f, strike 28, end 38, carried 4.3 m over 22–38. 0–16: it sinks into a frog's crouch, arms back,
  head low (the tell: the drop); 16–22: the hang, coiled; 22: it springs, legs straightening behind it; 28: in the
  air, both claws thrown forward and the maw gaping at full stretch; 38: it lands crouched on its prey, claws raking
  down; 38–72: it rises from the crouch.

**Budget.** ~1500 tris · 19 bones · 3 materials.
