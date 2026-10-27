/**
 * What an ordinary creature's blow looks like (round 90; asked: "many of the lower-tier creatures' attack animations and telegraphs appear
 * acceptable but overly elaborate; in high-density combat scenarios, this detracts from the intended eerie atmosphere ... each creature should
 * instead feature a distinct, high-fidelity, subtle animation with optional graphic accents ... reevaluate overused color palettes and consider
 * blending or animating varied hues"). The horrors keep their own look (`bossAttackTheme`, `attackSignatures`); every other creature
 * (lesser, greater, ally and the plain named) has one entry here and nothing else: a graphic `mark` it leaves where its blow falls, the `tempo` that
 * mark moves in, the few specks of `matter` it sheds, an optional second `accent` (drawn at the wound and in the tell) and three `hues` the mark
 * drifts through as it fades. Drawn by `render/foeFx.ts` with the vocabulary of `render/blowKit.ts`. Data only: no Three.js.
 */

/** The graphic a blow leaves. Drawn in particles (render/blowKit.ts); a ripple is the one that lies on the ground. */
export const MARKS = [
  'rake', // three curved scratches, drawn in one after another along the swing (claws)
  'jaws', // two crescents closing on a point (teeth)
  'crescent', // one tapering arc that follows the tip of a sweep (a blade, an edge, a limb)
  'lash', // a tapering S-curve that cracks out and back (a tentacle, a tail, a whip)
  'splat', // an ink blot with flicks that opens and sinks (ichor, ooze, spawn)
  'swirl', // an open ring that turns about the point as it fades (a spell, a mind, a pull)
  'glint', // a thin cross of cold light that opens and closes (steel, glass, crystal)
  'dash', // short ticks stitched along the blow (a stinger, a needle, a thread)
  'ripple', // a thin ring running out along the ground (water, a slam's tremor)
  'sigil', // a small rune that kindles and goes out (a rite, a cult's sign)
  'eye', // an eye that opens where the blow falls and closes (a watcher, a gaze)
  'plume', // a rising wisp of smoke (ash, spores, a breath, an exhalation)
] as const;
export type Mark = (typeof MARKS)[number];

/** How a mark moves: the rhythm of its life. */
export const TEMPOS = [
  'snap', // there at once, sharp and gone in a few frames
  'drag', // laid along the swing as it goes, each stroke a frame behind the last
  'bloom', // soft, it swells as it fades
  'settle', // it hangs and sinks, the ground taking what it carries
  'flutter', // it turns and drifts like something winged
  'pulse', // twice, a beat apart
] as const;
export type Tempo = (typeof TEMPOS)[number];

/** The few specks a blow sheds besides its mark. */
export const MATTERS = [
  'none', // the mark alone
  'brine', // drops of sea-water, falling
  'ash', // grey flecks, drifting down
  'dust', // fine sand and grit, falling
  'spore', // pale motes, rising
  'frost', // glints of ice, hanging
  'ichor', // dark beads, falling
  'ember', // sparks, rising and cooling
  'mote', // soft lights, hanging
  'down', // feathers or fur, drifting
] as const;
export type Matter = (typeof MATTERS)[number];

export interface FoeBlow {
  mark: Mark;
  tempo: Tempo;
  matter: Matter;
  accent?: Mark; // a second graphic, smaller, at the wound and in the tell
  /** 0xrrggbb: where a mark starts (bright: at least `LIGHT_FLOOR` of luma), what it passes through and where it ends (cooler, darker). */
  hues: readonly [number, number, number];
}

const blow = (mark: Mark, tempo: Tempo, matter: Matter, hues: FoeBlow['hues'], accent?: Mark): FoeBlow => ({ mark, tempo, matter, hues, ...(accent && { accent }) });

/**
 * By roster id, for every creature that is not one of the horrors with a look of its own (`BOSS_ATTACK_THEME`): the 31 lesser, 11 greater, 7 allies and the 2 plain named,
 * 51 in all (`tests/foeBlows.test.ts` holds the coverage and the spread of marks, tempos, matters and hues). Each line says what the creature strikes with and so what
 * is drawn, then the three colours the mark fades through (a bright start, the creature's own middle, a deeper end). The middles are spread about the wheel, about four to each thirty
 * degrees of hue, and kept muted (the world is nearly colourless: colour means something is wrong); amber is only for what burns or is sand and gold (man of Leng, K'n-yan,
 * mummy, the light-being), and five are pale on purpose, the bone and ash things (ghast, troglodyte, the cave beast, the penguin, the voice).
 */
export const FOE_BLOWS: Readonly<Record<string, FoeBlow>> = {
  // The sea: Innsmouth, R'lyeh and the deeps (sea-foam and teal fade to the dark water; the sigil and the knife are the cult's)
  deep_one: blow('crescent', 'drag', 'brine', [0xc5f0da, 0x4faabd, 0x182e61], 'ripple'), // webbed claws sweeping, a lunge from the water: a crescent along the arm, ripples at the wound; sea-foam, teal, the deep
  innsmouth_hybrid: blow('rake', 'snap', 'brine', [0xdef0c5, 0x62a873, 0x4b4c22]), // half-human, it claws and grabs: a quick rake, brine on the hands; the sick jade of the Innsmouth look, going to brackish murk
  dagon_priest: blow('sigil', 'pulse', 'mote', [0xc5e6f0, 0x6b88d6, 0x4b256b], 'swirl'), // a rite spoken over the water, a thing summoned: a pulsing sigil with a swirl at the wound; sea-blue to violet
  cthulhu_cultist: blow('sigil', 'snap', 'ember', [0xf0d1c5, 0xb85367, 0x491f4c], 'crescent'), // a knife and a rite: the cult's sigil, a blade's arc at the wound, embers of the fire it kneels at; crimson to plum
  gnorri: blow('splat', 'bloom', 'brine', [0xecf0c5, 0x7dad65, 0x235750], 'ripple'), // a labyrinth-builder of the sea floor, it spits and sweeps: a splat, a ring on the water; kelp-olive to the deep green
  tritons: blow('dash', 'snap', 'brine', [0xc5f0e9, 0x88b9db, 0x372e66], 'glint'), // ally; a trident's points stitch the blow, a glint at the tines; pearl blue to dusk indigo
  star_spawn: blow('lash', 'settle', 'ichor', [0xc5f0c5, 0x4ca891, 0x233857], 'eye'), // Cthulhu's kin, tentacles bursting and slamming: a lash, one eye opening at the wound; drowned green to ink
  elder_thing: blow('glint', 'snap', 'frost', [0xc5d8f0, 0x6dc7c4, 0x23572b], 'lash'), // a barrel of cold crystal, five-lobed and piping, tentacles and a bolt: a glint, a tentacle's lash; aqua frost to dark moss
  // The Dreamlands (the old dream-creatures; Kadath's bestiary)
  ghoul: blow('rake', 'drag', 'spore', [0xf0e9c5, 0x9db064, 0x442a4c], 'jaws'), // claws and teeth at a grave's edge: a rake dragged, jaws at the wound, mould spores; bone to sickly olive to bruise
  ghast: blow('jaws', 'snap', 'frost', [0xd4e7f0, 0xb8b298, 0x465730]), // pale hoofed biter, hurt by the light: a snapping bite, frost; bone-grey to mouldering olive
  zoog: blow('dash', 'snap', 'down', [0xecf0c5, 0x6fa85d, 0x47361d]), // small, furtive, forest-brown nippers: needle-quick ticks, a little fur; moss to umber
  night_gaunt: blow('lash', 'flutter', 'none', [0xc5e4f0, 0x6d73bd, 0x3b1545], 'dash'), // faceless, rubbery, winged; it grabs and dives with a barbed tail: a lash, fluttering; lavender to black-violet
  moon_beast: blow('ripple', 'bloom', 'ichor', [0xf0c5da, 0xab75bd, 0x232457], 'lash'), // toad-flesh and tentacles bursting from the galley's dark: a slam's ripple, a lash at the wound, ichor; moon-lilac to deep blue
  man_of_leng: blow('crescent', 'settle', 'dust', [0xe3f0c5, 0xccbd5c, 0x571f1a]), // the turbaned, cloven-hoofed traders of Leng, a curved knife: a crescent settling in dust; saffron to oxblood
  cat_from_saturn: blow('rake', 'pulse', 'mote', [0xf0c5d5, 0xb375bd, 0x234157]), // a strange cat leaping from the rings: a rake, pulsing motes; orchid to slate
  wamp: blow('jaws', 'drag', 'dust', [0xf0e6c5, 0xa85e4c, 0x57233d]), // a rust-coloured biter, jaws dragged along the lunge; rust to wine
  gug: blow('ripple', 'pulse', 'dust', [0xf0ebc5, 0xb25d50, 0x4c3f17]), // giant, split-mouthed, it slams and seizes: a ripple on the ground, a stomp and a stomp; oxide red to umber
  dhole: blow('jaws', 'bloom', 'dust', [0xf0e1c5, 0x9ba858, 0x235745], 'ripple'), // a burrowing worm, bite, slam and spit: jaws bloom in the dust, a ripple at the wound; earth-olive to deep green
  shantak: blow('rake', 'flutter', 'dust', [0xd1f0c5, 0x65ad87, 0x302357]), // the scaled horse-headed bird of the Plateau, it dives and rakes: wings turning, grit from the stone; sea-stone green to indigo
  being_of_ib: blow('plume', 'settle', 'spore', [0xe6f0c5, 0x67a365, 0x234e57]), // Sarnath's old gelatinous things, it spits and bites: a plume of spores settling; mould green to deep teal
  nodens: blow('swirl', 'bloom', 'mote', [0xc5e7f0, 0x7c88d6, 0x275c61], 'glint'), // ally; the lord of the great abyss, a slam, a beam, a wind that pushes: a swirl, a glint; silver-blue to abyssal teal
  nasht_kaman_thah: blow('sigil', 'bloom', 'ember', [0xc5dcf0, 0x8b77d9, 0x522718], 'swirl'), // ally; two priests who send and are gone: a sigil that blooms, a swirl where they step, rite-embers; violet to coal
  cats_of_ulthar: blow('eye', 'snap', 'down', [0xdaf0c5, 0x65a870, 0x235755], 'jaws'), // ally; the avenging cats, bite and leap: an eye opening in the dark, jaws at the wound, fur; cat-eye green to deep teal
  pickman: blow('dash', 'drag', 'ash', [0xf0d1c5, 0xbd6d8b, 0x235727], 'jaws'), // ally; the painter turned ghoul, a hand that draws the blow: ticks like charcoal strokes, jaws at the wound, grave ash; madder rose to bottle green
  // K'n-yan and the Mound (the blue-lit dark under the earth)
  serpent_man: blow('swirl', 'bloom', 'none', [0xc5ebf0, 0x5da885, 0x305723], 'eye'), // a Valusian serpent, spit, bite and a mind's bolt: a swirl blooming, an eye at the wound; emerald to deep moss
  kn_yan_dweller: blow('glint', 'snap', 'none', [0xc5d7f0, 0xc7ac5a, 0x542819], 'swirl'), // gold-skinned, blade and a vanishing: a glint, a swirl where it goes; the blue light of Yoth, then gold, then bronze
  ym_bhi: blow('ripple', 'settle', 'ash', [0xc5f0de, 0x74a2c2, 0x3d2357]), // a hunched brute of the blue-lit dark, slam and grab: a ripple settling, ash; steel blue to dark violet
  gyaa_yothn: blow('jaws', 'settle', 'frost', [0xf0ccc5, 0xcc7e9f, 0x2b2357]), // a pallid brute of the blue-lit dark, it charges and bites: jaws, settling, frost; flesh-rose to dusk
  formless_spawn: blow('splat', 'bloom', 'ichor', [0xc5ccf0, 0x7d4f9e, 0x421433]), // Tsathoggua's spawn, tentacle, grab and spit: a splat blooming, ichor; violet-black to dark magenta
  beast_in_the_cave: blow('rake', 'settle', 'dust', [0xedf0d3, 0x9ca8b8, 0x3c5c4c]), // blind, pallid, an ambusher: a rake that settles in dust; cave-slate to dark green
  child_of_yig: blow('dash', 'pulse', 'ichor', [0xeff0c5, 0x769e5c, 0x23574a]), // a snake-child, many small bites of venom: ticks, pulsing; venom green to deep green
  // The waking world: Arkham, Providence, Vermont and Dunwich
  reanimated_corpse: blow('splat', 'settle', 'ichor', [0xf0eac5, 0x9ebd68, 0x235755]), // West's work, grab and sweep: a splat of ichor settling; the reagent's acid lime to teal
  martense_degenerate: blow('rake', 'snap', 'ash', [0xf0e6c5, 0xb2674b, 0x572338]), // mutated cannibals, claws: a quick rake, ash; burnt sienna to wine
  exham_troglodyte: blow('jaws', 'pulse', 'ash', [0xd5e7f0, 0xbdb39f, 0x515734]), // the priory's cannibals, bite and grab: jaws in two beats, ash; bone to dark moss
  rat_swarm: blow('dash', 'flutter', 'down', [0xc5f0ca, 0x62a89f, 0x473a20]), // a hundred nips: ticks, fluttering, fur; phosphorescent teal to filth brown
  winged_hybrid: blow('crescent', 'flutter', 'down', [0xc5cff0, 0x9673c7, 0x57234a]), // the Festival's not-quite-birds, grab and dive: a crescent of wing, down; lilac to dark magenta
  moon_bog_wraith: blow('plume', 'bloom', 'frost', [0xc5f0e9, 0x88a6d1, 0x382357], 'swirl'), // bog-mist and moonlight, it roars and grabs: a plume blooming, a swirl, frost; moon-blue to violet
  curwen_pit_thing: blow('splat', 'pulse', 'ichor', [0xf0c5c8, 0xb26ba7, 0x572327], 'lash'), // a half-formed horror in the pits, grab and tentacle: a splat in two beats, a lash; orchid to old blood
  voice_in_the_tomb: blow('plume', 'settle', 'ash', [0xd5ebf0, 0xa59cb8, 0x533057], 'swirl'), // a voice from the grave's dark: a plume of ash settling, a swirl; ash-lilac to plum
  thousand_young: blow('lash', 'snap', 'ichor', [0xf0ecc5, 0x9e473f, 0x451539], 'jaws'), // Shub-Niggurath's black spawn, charge and bite: a lash, snapping, ichor, jaws at the wound; oxblood to dark magenta
  // Pnakotus, Eryx, Greenland, the Mountains and the stars
  nameless_city_reptile: blow('jaws', 'drag', 'dust', [0xf0eec5, 0x8db262, 0x23574a]), // a fanged desert reptile, bite and lunge: jaws dragged, dust; desert olive to deep teal
  hybrid_mummy: blow('ripple', 'settle', 'dust', [0xeef0c5, 0xc29d5d, 0x572324]), // a sand-and-gold mummy under the pyramids, slam and grab: a ripple settling, dust; gold to oxide
  venusian_man_lizard: blow('lash', 'drag', 'none', [0xdff0c5, 0x65a36d, 0x234757], 'glint'), // a lizard of Eryx's crystal walls, a tail's sweep and a bolt: a lash, a glint at the wound; fern green to deep cyan
  albino_penguin: blow('crescent', 'flutter', 'down', [0xd5def0, 0xa4b9bd, 0x2e3366]), // blind, white, a flipper's slap: a crescent, fluttering, down; snow to midnight
  gnoph_keh: blow('rake', 'drag', 'frost', [0xc5f0e0, 0x63a9c7, 0x2a2357]), // the hairy white horror of the ice, sweep and bite: a rake dragged, frost; glacier cyan to indigo
  mi_go: blow('swirl', 'pulse', 'spore', [0xe3c5f0, 0xc280aa, 0x3a2459], 'dash'), // winged fungi of Yuggoth, bolt, grab and a beam: a swirl in two beats, spores, a tick; pale orchid to violet
  yithian: blow('glint', 'drag', 'mote', [0xc5dff0, 0x7b76cc, 0x4a2357], 'swirl'), // the Great Race's cone, bolt, beam and sweep: a glint dragged, a swirl at the wound, motes; periwinkle to violet
  yithian_archivist: blow('eye', 'bloom', 'mote', [0xd3c5f0, 0xbd79b7, 0x57232b], 'glint'), // ally; the archivist's gaze and bolt: an eye blooming, a glint, motes; orchid to wine
  algol_light_being: blow('glint', 'pulse', 'ember', [0xc5e9f0, 0xe6dc6e, 0x592116]), // ally; a being of light, beam and bolt: a glint pulsing, embers; cold white to star gold to coal
  yekubian: blow('eye', 'pulse', 'mote', [0xc5e1f0, 0x7770c2, 0x234e57]), // a mind from Yekub, bolt, gaze and grab: an eye in two beats, motes; periwinkle to deep teal
  being_from_beyond: blow('lash', 'pulse', 'mote', [0xf0c5cf, 0xaf78c2, 0x232b57], 'eye'), // unseen filaments pulling at the flesh: a lash in two beats, an eye at the wound; the resonator's orchid to blue
};

/** The blow of roster id `id`, or undefined for a horror and anything not drawn this way. */
export const blowOf = (id: string | undefined): FoeBlow | undefined => (id ? FOE_BLOWS[id] : undefined);
