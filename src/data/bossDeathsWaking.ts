/**
 * The deaths of the horrors of the waking world (data/bossDeaths.ts reads them; its header says what each part is). Each `lore`
 * says what its tale makes of it; where the tale leaves it alive or unspoken, what its hints allow, and the line says so.
 */

import type { BossDeath } from './bossDeaths';

export const WAKING_DEATHS: Readonly<Record<string, BossDeath>> = {
  'shoggoth#boss': {
    lore: 'At the Mountains of Madness: a shapeless congeries of protoplasmic bubbles, its temporary eyes forming and unforming as pustules of greenish light; it left black, iridescent slime on the Elder Things. Its eyes go out, its bubbles burst, and it runs out over the floor as that slime.',
    body: { order: 'cells', motion: 'spread', first: 0.15, rim: [0.3, 0.9, 0.56], lit: true, tint: [0.04, 0.05, 0.06], tintBy: 0.7 },
    move: { sx: 1.5, sy: 0.4, ease: 'out' },
    cues: [{ at: 0, burst: 'eyes_green', n: 14 }, { at: 0.05, until: 0.7, stream: 'bubbles_black', n: 40 }, { at: 0.1, set: 'squeal', gain: 0.5, pitch: 1.5 }, { at: 0.35, set: 'slime', gain: 0.8, pitch: 0.7 }, { at: 0.55, until: 0.95, stream: 'slime_black', n: 30, where: 'feet' }, { at: 0.92, scar: [0.06, 0.07, 0.08], r: 2.2 }],
  },
  'flying_polyp#boss': {
    lore: 'The Shadow out of Time: only partly material, they could pass out of sight; they whistled and struck with winds, and the Great Race shut them below, where men found only their round five-toed prints. It flickers out of the seen world, a last gale goes out from it, and only its prints are left.',
    body: { order: 'even', motion: 'flicker', rim: [0.78, 0.8, 0.82], tint: [0.5, 0.52, 0.55], tintBy: 0.4 },
    move: { y: -0.25, shake: 0.06, ease: 'in' },
    cues: [{ at: 0, set: 'shriek', gain: 0.35, pitch: 1.9 }, { at: 0.08, set: 'gust', gain: 0.9, pitch: 1.3 }, { at: 0.1, blast: 0.8 }, { at: 0.1, ring: [0.78, 0.8, 0.82], to: 9, life: 0.9 }, { at: 0.1, until: 0.6, stream: 'wind_dust', n: 60, where: 'ground' }, { at: 0.9, prints: 5, r: 1.4 }],
  },
  colour_out_of_space: {
    lore: 'The Colour Out of Space: it left the well as a shapeless stream that poured straight up into the sky; Ammi saw a little of it break away and sink back into the well, and the land it fed on was grey dust, dying in widening circles. It goes up like a beam, a little falls back, and the grey spreads out from where it was.',
    body: { order: 'feet', motion: 'rise', strength: 1.3, rim: [0.86, 0.32, 0.72], lit: true, tint: [0.52, 0.52, 0.5], tintBy: 0.5 },
    move: { y: 1.6, sx: 0.35, sy: 3.2, ease: 'in' },
    cues: [{ at: 0, light: [0.85, 0.45, 0.85], strength: 2.2, range: 16, seconds: 1.6 }, { at: 0.03, until: 0.8, stream: 'colour_stream', n: 150 }, { at: 0.3, set: 'gust', gain: 0.8, pitch: 1.5 }, { at: 0.7, burst: 'colour_remnant', n: 4, where: 'head' }, { at: 0.75, ring: [0.52, 0.52, 0.5], to: 6, life: 2.4 }, { at: 0.85, ring: [0.48, 0.48, 0.46], to: 11, life: 3.2 }, { at: 0.9, scar: [0.5, 0.5, 0.48], r: 4, life: 26 }, { at: 0.9, burst: 'grey_dust', n: 30, where: 'ground' }],
  },
  wilbur_whateley: {
    lore: 'The Dunwich Horror: the watchdog tore him in the library; below the waist he was no man, and he bled a greenish-yellow ichor; before help came he had melted away to a sticky whitish mass on the painted boards. Torn (a blade may part him), he collapses and goes to that mass.',
    body: { order: 'char', motion: 'sink', strength: 1.1, first: 0.3, rim: [0.5, 0.48, 0.16], tint: [0.82, 0.8, 0.7], tintBy: 0.85 },
    gore: true,
    cues: [{ at: 0.02, burst: 'ichor_yellow', n: 16 }, { at: 0.2, until: 0.9, stream: 'stench', n: 24, where: 'feet' }, { at: 0.4, set: 'slime', gain: 0.7, pitch: 0.6 }, { at: 0.92, scar: [0.8, 0.78, 0.68], r: 1.3, life: 30 }],
  },
  dunwich_horror: {
    lore: 'The Dunwich Horror: the powder of Ibn Ghazi let the watchers on Sentinel Hill see it, a vast thing of ropes and eyes with half a face; under the chant it cried out in English to its father, Yog-Sothoth, and the spell destroyed it, leaving a great burned swath. Seen whole in the powder, it cries for its father, the sky answers, and it is torn back up into the dark.',
    body: { order: 'columns', motion: 'rise', strength: 1.1, rim: [0.86, 0.9, 1], lit: true, tint: [0.2, 0.2, 0.18], tintBy: 0.3 },
    move: { y: 0.5, sy: 1.5, shake: 0.08, ease: 'in' },
    cues: [{ at: 0, burst: 'powder', n: 36 }, { at: 0.1, set: 'shriek', gain: 0.9, pitch: 0.55 }, { at: 0.38, bolt: [0.62, 0.78, 1] }, { at: 0.39, blast: 0.9 }, { at: 0.4, ring: [0.86, 0.9, 1], to: 10, life: 0.8 }, { at: 0.45, until: 0.95, stream: 'stench', n: 30, where: 'feet' }, { at: 0.9, scar: [0.18, 0.16, 0.14], r: 6, life: 30 }],
  },
  keziah_mason: {
    lore: 'The Dreams in the Witch House: she went out of Salem gaol by angles that lead through the walls of space, and at the Walpurgis rite Gilman strangled her with the chain of the crucifix. The chain takes her by the throat, and she slips out by the angle she came, drawn small into the garret\'s corner.',
    body: { order: 'corner', motion: 'fold', dir: 1, rim: [0.62, 0.32, 0.95], lit: true },
    move: { shake: 0.07 },
    cues: [{ at: 0, burst: 'chain', n: 18, where: 'head' }, { at: 0.05, set: 'cackle', gain: 0.5, pitch: 0.6 }, { at: 0.35, until: 0.9, stream: 'angles', n: 40 }, { at: 0.95, light: [0.62, 0.32, 0.95], strength: 1.2, range: 6, seconds: 0.8 }],
  },
  brown_jenkin: {
    lore: 'The Dreams in the Witch House: the rat-thing with human hands; Gilman kicked it over the gulf\'s brink and heard it whimper far below, and when the house came down its skeleton was found. Kicked, it goes over the brink into the dark, whimpering far below; a few small bones are left.',
    body: { order: 'feet', motion: 'none', rim: [0.2, 0.17, 0.15], tint: [0.04, 0.04, 0.05], tintBy: 0.6 },
    move: { away: 1.2, y: -1.4, ease: 'in', from: 0.05 },
    cues: [{ at: 0, set: 'squeal', gain: 0.7, pitch: 1.3 }, { at: 0.05, burst: 'dust', n: 8, where: 'feet' }, { at: 0.5, burst: 'bone', n: 6, where: 'ground' }, { at: 0.75, set: 'squeak', gain: 0.35, pitch: 0.6 }],
  },
  black_man: {
    lore: 'The Dreams in the Witch House: the Black Man of the witch-cult, of a dead black, with the book to be signed, the messenger of what lies outside. He is not wounded: the black of him runs out of his shape like ink into the dark, and the book is shut.',
    body: { order: 'rim', motion: 'diffuse', first: 0.35, rim: [0.06, 0.05, 0.08], tint: [0.02, 0.02, 0.03], tintBy: 1 },
    move: { sx: 1.35, sy: 1.12, ease: 'out' },
    cues: [{ at: 0, sting: 'darkness', gain: 0.6 }, { at: 0.12, set: 'page', gain: 0.7, pitch: 0.7 }, { at: 0.3, until: 0.9, stream: 'ink', n: 36 }, { at: 0.92, burst: 'violet_motes', n: 8, where: 'head' }],
  },
  joseph_curwen: {
    lore: 'The Case of Charles Dexter Ward: Willett said the formula of the Dragon\'s Tail against him, and Curwen fell to a thin coating of fine bluish-grey dust, his essential salts. He greys, falls in from the head down, and is a little of that dust on the floor.',
    body: { order: 'top', motion: 'fall', strength: 1.3, first: 0.25, rim: [0.6, 0.64, 0.7], tint: [0.56, 0.6, 0.66], tintBy: 0.9 },
    cues: [{ at: 0.02, set: 'whisper', gain: 0.6, pitch: 0.8 }, { at: 0.25, until: 0.95, stream: 'salts', n: 80 }, { at: 0.95, scar: [0.56, 0.6, 0.66], r: 0.9, life: 40 }],
  },
  simon_orne: {
    lore: 'The Case of Charles Dexter Ward: Jedediah Orne, back as Simon and in Prague as Josef Nadek, lived a hundred years under other names; Willett\'s letters saw him and his house destroyed (his end is told only in a clipping: from its hints). The names he wore come off him a line at a time, like a signature struck through.',
    body: { order: 'rows', motion: 'fall', strength: 0.9, rim: [0.14, 0.12, 0.1], tint: [0.3, 0.28, 0.24], tintBy: 0.4 },
    cues: [{ at: 0.05, set: 'whisper', gain: 0.5, pitch: 1.15 }, { at: 0.15, until: 0.85, stream: 'letters', n: 36 }, { at: 0.9, set: 'page', gain: 0.6, pitch: 0.9 }],
  },
  edward_hutchinson: {
    lore: 'The Case of Charles Dexter Ward: Hutchinson lived on as Baron Ferenczy in his castle at Rakus; at the end he was killed and his lair destroyed. Rakus comes down on him: he bursts from the heart out in fire and stone, the air thrown wide, and smoke and a scorch are left.',
    body: { order: 'centre', motion: 'scatter', strength: 2.2, rim: [1, 0.5, 0.15], lit: true, tint: [0.22, 0.18, 0.15], tintBy: 0.6 },
    move: { sx: 1.25, sy: 1.15, ease: 'out', from: 0.06 },
    cues: [{ at: 0.08, light: [1, 0.6, 0.25], strength: 3, range: 18, seconds: 1.2 }, { at: 0.08, blast: 1 }, { at: 0.08, set: 'boom', gain: 1, pitch: 0.85 }, { at: 0.08, burst: 'embers', n: 40 }, { at: 0.1, burst: 'debris', n: 24 }, { at: 0.12, ring: [1, 0.6, 0.25], to: 8, life: 0.7 }, { at: 0.2, until: 0.95, stream: 'smoke', n: 30 }, { at: 0.5, scar: [0.12, 0.1, 0.09], r: 2.8, life: 30 }],
  },
  ephraim_waite: {
    lore: 'The Thing on the Doorstep: Edward killed the body Ephraim wore and buried it in the cellar; Ephraim came back in it, a nearly liquescent thing in Edward\'s clothes, with a note in Edward\'s hand. The body cannot hold him: it slumps in its coat, rotting from the feet up, and leaves the note.',
    body: { order: 'feet', motion: 'sink', first: 0.3, rim: [0.2, 0.17, 0.1], tint: [0.27, 0.28, 0.18], tintBy: 0.8 },
    cues: [{ at: 0.05, set: 'gurgle', gain: 0.5, pitch: 0.8 }, { at: 0.3, until: 0.85, stream: 'rot', n: 30 }, { at: 0.8, burst: 'note', n: 1, where: 'head' }, { at: 0.9, scar: [0.18, 0.16, 0.1], r: 1.1, life: 30 }],
  },
  haunter_of_the_dark: {
    lore: 'The Haunter of the Dark: it could not live in light; it came for Blake when the storm put out the city\'s lamps and was gone when they came back; its eye was three-lobed and burning. Light finds it: white eats in from its edges, its wings fray up as smoke, and the burning eye is the last of it.',
    body: { order: 'rim', motion: 'rise', strength: 0.7, rim: [1, 0.98, 0.9], lit: true, tint: [0.05, 0.05, 0.06], tintBy: 0.4 },
    move: { shake: 0.04 },
    cues: [{ at: 0, light: [1, 0.98, 0.9], strength: 2.4, range: 20, seconds: 1.4 }, { at: 0.05, set: 'hiss', gain: 0.7, pitch: 0.7 }, { at: 0.05, until: 0.85, stream: 'black_smoke', n: 50 }, { at: 0.72, burst: 'burning_eye', n: 1, where: 'head' }, { at: 0.97, sting: 'lampLit', gain: 0.7 }],
  },
  whisperer: {
    lore: 'The Whisperer in Darkness: in Akeley\'s chair the narrator found at the last the face and hands of Henry Wentworth Akeley; the fungus from Yuggoth that wore them had gone, and its buzzing voice. The buzzing stops, the face and hands fall into the chair, and what wore them goes up on its wings toward Yuggoth.',
    body: { order: 'centre', motion: 'rise', rim: [0.72, 0.52, 0.5], tint: [0.7, 0.5, 0.48], tintBy: 0.55 },
    move: { y: 0.9, sx: 0.8, sy: 0.9, ease: 'in', from: 0.3 },
    cues: [{ at: 0.02, set: 'buzz', gain: 0.7, pitch: 0.6 }, { at: 0.12, burst: 'flesh', n: 10 }, { at: 0.3, set: 'wings', gain: 0.8, pitch: 0.8 }, { at: 0.35, until: 0.9, stream: 'spores_pink', n: 26 }],
  },
  the_hound: {
    lore: 'The Hound: in the reopened coffin the ghoul lay blood-caked and baying, a close-packed retinue of huge sleeping bats about it, the green jade amulet in its claw. It comes apart into its bats, which scatter up into the night, the baying going far off; the jade amulet lies where it stood.',
    body: { order: 'blocks', motion: 'rise', strength: 1.2, rim: [0.08, 0.07, 0.08], tint: [0.06, 0.05, 0.06], tintBy: 0.5 },
    cues: [{ at: 0.05, set: 'bat', gain: 0.8, pitch: 0.8 }, { at: 0.08, until: 0.75, stream: 'bats', n: 46 }, { at: 0.6, set: 'farHowl', gain: 0.7, pitch: 0.9 }, { at: 0.85, burst: 'jade', n: 1, where: 'ground' }],
  },
  the_unnamable: {
    lore: 'The Unnamable: "It was everywhere — a gelatin — a slime — yet it had shapes, a thousand shapes of horror beyond all memory. There were eyes — and a blemish." It boils through its thousand shapes, its eyes opening and shutting, and is only a slime soaking into the old burying ground.',
    body: { order: 'char', motion: 'boil', strength: 1.6, rim: [0.12, 0.13, 0.11], tint: [0.14, 0.15, 0.13], tintBy: 0.6 },
    move: { sx: 1.15, sy: 0.35, ease: 'in', from: 0.4 },
    cues: [{ at: 0.02, set: 'gargle', gain: 0.7, pitch: 0.7 }, { at: 0.05, burst: 'eyes_pale', n: 9 }, { at: 0.4, until: 0.9, stream: 'slime_dark', n: 30, where: 'feet' }, { at: 0.9, scar: [0.08, 0.09, 0.08], r: 2, life: 24 }],
  },
  shunned_house_entity: {
    lore: 'The Shunned House: under the cellar the narrator dug to a semi-putrid congealed jelly, the elbow of something vast, and poured in sulphuric acid; the yellowish vapours rose, and the cellar\'s fungi withered into greyish powder. It hisses yellow, shrinks back down into its pit, and the fungus about it goes to grey powder.',
    body: { order: 'char', motion: 'drain', rim: [0.82, 0.78, 0.3], lit: true, tint: [0.4, 0.38, 0.26], tintBy: 0.5 },
    move: { y: -0.25, ease: 'in' },
    cues: [{ at: 0, set: 'hiss', gain: 1, pitch: 0.8 }, { at: 0.02, until: 0.9, stream: 'acid_fume', n: 46 }, { at: 0.3, set: 'slime', gain: 0.5, pitch: 1.2 }, { at: 0.75, ring: [0.62, 0.62, 0.58], to: 3.5, life: 2 }, { at: 0.85, burst: 'nitre', n: 24, where: 'ground' }],
  },
  lilith: {
    lore: 'The Horror at Red Hook: a tittering phosphorescent thing that squatted on a golden pedestal by the sticky water under Red Hook; Suydam\'s corpse shoved the pedestal into the water, and it was never dredged up. She goes over with it into the black water, sinking from the feet, her phosphorescence going out.',
    body: { order: 'feet', motion: 'ripple', rim: [0.78, 0.95, 0.82], lit: true, tint: [0.04, 0.06, 0.07], tintBy: 0.6 },
    move: { y: -0.9, away: 0.15, ease: 'in', from: 0.1 },
    cues: [{ at: 0.04, set: 'cackle', gain: 0.4, pitch: 1.4 }, { at: 0.1, burst: 'gold', n: 14, where: 'feet' }, { at: 0.18, sting: 'splash', gain: 0.9 }, { at: 0.2, ring: [0.14, 0.2, 0.2], to: 4, life: 1.4 }, { at: 0.25, until: 0.95, stream: 'oily_bubbles', n: 30, where: 'feet' }, { at: 0.5, until: 0.9, stream: 'phosphor', n: 18 }],
  },
  zann_window_thing: {
    lore: 'The Music of Erich Zann: past the high window there was no city, only the blackness of space illimitable, alive with motion and music, and the wind took Zann\'s manuscript out into it. The viol\'s shriek breaks off, the dark draws back into its own space, and the wind takes the pages after it.',
    body: { order: 'rim', motion: 'shrink', rim: [0.72, 0.74, 0.9], lit: true, tint: [0.02, 0.02, 0.04], tintBy: 0.5 },
    move: { y: 0.15, sx: 0.3, sy: 0.3, ease: 'in' },
    cues: [{ at: 0, set: 'snap', gain: 0.9, pitch: 1.3 }, { at: 0.05, set: 'gust', gain: 0.8, pitch: 0.9 }, { at: 0.08, until: 0.65, stream: 'pages', n: 28 }, { at: 0.3, until: 0.9, stream: 'void_stars', n: 30 }],
  },
  high_priest: {
    lore: 'The Dream-Quest of Unknown Kadath: the high-priest not to be described keeps the windowless monastery of Leng, a yellow silken mask over its face, and in its domed room a well goes down toward the vaults of Zin. The mask slips, and before what it hid is seen the priest is drawn down into the dark as the well goes down; the silk is left.',
    body: { order: 'centre', motion: 'drain', strength: 1.1, rim: [0.86, 0.74, 0.32], tint: [0.06, 0.05, 0.04], tintBy: 0.7 },
    move: { y: -0.35, ease: 'in', from: 0.15 },
    cues: [{ at: 0.05, burst: 'silk', n: 1, where: 'head' }, { at: 0.08, set: 'whisper', gain: 0.6, pitch: 0.65 }, { at: 0.2, until: 0.8, stream: 'ink', n: 20 }, { at: 0.6, ring: [0.1, 0.09, 0.08], to: 2.5, life: 1.2 }],
  },
  colossus_pyramids: {
    lore: 'Under the Pyramids: below the Sphinx, a colossal five-headed thing as large as a hippopotamus, of which Houdini saw the paw, in the temple dug out under the first face. It crumbles back to the sand it was dug out of, pouring away in streams into the dark under the Sphinx.',
    body: { order: 'columns', motion: 'fall', strength: 1.6, rim: [0.78, 0.68, 0.5], tint: [0.74, 0.64, 0.46], tintBy: 0.7 },
    move: { y: -0.35, sx: 1.12, ease: 'in' },
    cues: [{ at: 0.05, ring: [0.74, 0.64, 0.46], to: 7, life: 1.2 }, { at: 0.08, until: 0.92, stream: 'sand', n: 110 }, { at: 0.6, burst: 'sand_cloud', n: 10, where: 'feet' }, { at: 0.9, scar: [0.7, 0.6, 0.44], r: 3.4, life: 30 }],
  },
  martins_beach_horror: {
    lore: 'The Horror at Martin\'s Beach: the sailors killed its young, a fifty-foot thing with one great eye; in an abrupt thunderstorm the mother took hold of the minds of those on the lifeline and drew them into the sea. The hold breaks; it goes down into the waves in bands of brine under a thunderclap, its great eye the last of it.',
    body: { order: 'rows', motion: 'ripple', strength: 1.2, rim: [0.84, 0.9, 0.9], tint: [0.1, 0.14, 0.15], tintBy: 0.5 },
    move: { y: -0.8, ease: 'in', from: 0.1 },
    cues: [{ at: 0.05, bolt: [0.62, 0.78, 1] }, { at: 0.1, set: 'whale', gain: 0.8, pitch: 0.7 }, { at: 0.15, until: 0.7, stream: 'brine', n: 50 }, { at: 0.2, ring: [0.84, 0.9, 0.9], to: 6, life: 1.2 }, { at: 0.75, burst: 'eye_great', n: 1, where: 'head' }],
  },
  dr_munoz: {
    lore: 'Cool Air: he had been dead eighteen years, kept by the cold of his machine; when it failed, a dark, slimy trail led to the couch, and a note said the end was here, with no more ice. The cold fails: frost breaks off him in a white breath, and he runs down in dark slime from the head, leaving a trail.',
    body: { order: 'top', motion: 'drip', strength: 1.3, first: 0.2, rim: [0.86, 0.93, 1], tint: [0.13, 0.11, 0.09], tintBy: 0.7 },
    move: { away: 0.4, sy: 0.9, from: 0.3 },
    cues: [{ at: 0.02, burst: 'frost', n: 22 }, { at: 0.02, set: 'hiss', gain: 0.6, pitch: 1.3 }, { at: 0.05, until: 0.5, stream: 'cold_breath', n: 22 }, { at: 0.4, until: 0.95, stream: 'slime_dark', n: 30 }, { at: 0.5, set: 'slime', gain: 0.6, pitch: 0.8 }, { at: 0.93, scar: [0.1, 0.09, 0.07], r: 1.2, life: 30 }],
  },
  charles_le_sorcier: {
    lore: 'The Alchemist: he would have thrown his phial; Antoine flung the torch, the tunic soaked in his trade\'s chemicals took fire, and the body found was blackened and distorted. The torch takes him: he burns where he stands, flames licking up him, and the phial breaks at his feet.',
    body: { order: 'char', motion: 'rise', strength: 0.8, rim: [1, 0.5, 0.15], lit: true, tint: [0.16, 0.13, 0.11], tintBy: 0.8 },
    move: { sy: 0.85, shake: 0.06, ease: 'out' },
    cues: [{ at: 0, light: [1, 0.62, 0.28], strength: 2.4, range: 12, seconds: 2.4 }, { at: 0, set: 'gust', gain: 0.8, pitch: 0.6 }, { at: 0.02, burst: 'embers', n: 30 }, { at: 0.05, until: 0.85, stream: 'flames', n: 70 }, { at: 0.4, burst: 'glass', n: 8, where: 'feet' }, { at: 0.4, set: 'snap', gain: 0.5, pitch: 1.8 }, { at: 0.5, until: 0.95, stream: 'smoke', n: 20 }],
  },
  medusa_gorgon: {
    lore: 'Medusa\'s Coil: Denis killed Marceline with a machete, and her hair lived on: a braid of coarse black hair that coiled about Frank Marsh and killed him. A blade may take her as the machete did; the braid goes on alone, crawling off into the dark, and the rest of her runs down in black strands.',
    body: { order: 'columns', motion: 'sink', first: 0.15, rim: [0.1, 0.08, 0.09], tint: [0.05, 0.04, 0.05], tintBy: 0.75 },
    gore: true,
    cues: [{ at: 0.02, set: 'hiss', gain: 0.8, pitch: 0.8 }, { at: 0.08, until: 0.7, stream: 'hair', n: 26, where: 'feet' }, { at: 0.3, set: 'whip', gain: 0.5, pitch: 0.7 }],
  },
  hypnos: {
    lore: 'Hypnos: the friend who sought what sleep holds was found at the last a bust of marble, a godlike head, with the word HYPNOS on its pedestal. He sets into white marble from the feet up, the face last; then the rest falls away in chips, and the bust is what is left.',
    body: { order: 'feet', motion: 'fall', first: 0.55, rim: [0.82, 0.81, 0.76], tint: [0.88, 0.87, 0.82], tintBy: 1 },
    cues: [{ at: 0, set: 'whisper', gain: 0.5, pitch: 1.2 }, { at: 0.4, set: 'crunch', gain: 0.5, pitch: 1.3 }, { at: 0.58, until: 0.95, stream: 'marble', n: 40 }, { at: 0.95, scar: [0.8, 0.79, 0.74], r: 1, life: 30 }],
  },
  the_outsider: {
    lore: 'The Outsider: it put out its paw to the thing in the gilded frame and touched the cold and unyielding surface of polished glass, and knew itself; now it rides with the ghouls on the night-wind. Its picture breaks like that mirror, in falling shards, and the night-wind takes them.',
    body: { order: 'blocks', motion: 'fall', strength: 1.2, rim: [0.9, 0.95, 1], lit: true },
    cues: [{ at: 0, light: [0.9, 0.95, 1], strength: 1.2, range: 6, seconds: 0.5 }, { at: 0.04, set: 'snap', gain: 0.8, pitch: 1.5 }, { at: 0.08, until: 0.6, stream: 'glass', n: 44 }, { at: 0.55, set: 'gust', gain: 0.7, pitch: 0.8 }, { at: 0.55, until: 0.95, stream: 'night_wind', n: 24 }],
  },
  terrible_old_man: {
    lore: 'The Terrible Old Man: he talks to his bottles, each with a little lead pendulum named for a captain of his old ship, and the robbers who came for his gold were found slashed as with many cutlasses. He does not die (the tale leaves him living): he goes back into the Kingsport fog, and the pendulums ring on without him.',
    body: { order: 'even', motion: 'diffuse', strength: 0.8, first: 0.35, rim: [0.7, 0.72, 0.74], tint: [0.66, 0.68, 0.7], tintBy: 0.8 },
    move: { y: 0.1, sx: 1.1, ease: 'out' },
    cues: [{ at: 0.05, until: 0.95, stream: 'sea_fog', n: 34 }, { at: 0.15, set: 'bell', gain: 0.35, pitch: 2.2 }, { at: 0.3, burst: 'glass_glints', n: 6 }, { at: 0.4, set: 'bell', gain: 0.3, pitch: 2.5 }, { at: 0.65, set: 'bell', gain: 0.25, pitch: 2 }],
  },
  zkauba: {
    lore: 'Through the Gates of the Silver Key: Zkauba, wizard of Yaddith, in whose clawed body Carter came back as the Swami Chandraputra to the room of the coffin-shaped clock that told no earthly time, and went from it by the clock (the end is the Swami\'s; from its hints). He steps back into the clock\'s tall dark, the door shuts on him, the ticking stops.',
    body: { order: 'doors', motion: 'narrow', rim: [0.55, 0.45, 0.25], tint: [0.1, 0.09, 0.08], tintBy: 0.4 },
    cues: [{ at: 0.05, set: 'click', gain: 0.6, pitch: 0.9 }, { at: 0.25, set: 'click', gain: 0.55, pitch: 0.9 }, { at: 0.45, set: 'click', gain: 0.5, pitch: 0.9 }, { at: 0.65, set: 'creak', gain: 0.6 }, { at: 0.92, set: 'thud', gain: 0.6, pitch: 0.7 }, { at: 0.93, burst: 'dust', n: 10, where: 'feet' }],
  },
  voice_in_the_tomb: {
    lore: 'The tale of the tomb in the swamp (its title names a man the demo does not hold): Warren went down into the tomb, and up the telephone wire came at last a voice that was not his, deep, hollow, gelatinous, remote: "You fool, Warren is dead!" It says its last up the wire and goes back down where it came from, drawn line by line into the dark under the slab.',
    body: { order: 'rows', motion: 'drain', rim: [0.2, 0.2, 0.24], tint: [0.03, 0.03, 0.04], tintBy: 0.6 },
    move: { y: -0.3, ease: 'in' },
    cues: [{ at: 0, set: 'click', gain: 0.7, pitch: 1.5 }, { at: 0.05, set: 'whisper', gain: 0.8, pitch: 0.5 }, { at: 0.3, until: 0.9, stream: 'ink', n: 26 }, { at: 0.85, set: 'thud', gain: 0.5, pitch: 0.5 }, { at: 0.88, burst: 'dust', n: 8, where: 'feet' }],
  },
  curwen_pit_thing: {
    lore: 'The Case of Charles Dexter Ward: in the pits under Curwen\'s farm Willett found what had been raised from imperfect salts, moaning in the dark, and the formula that raised them put them down. It is laid down again: it sinks back into its pit in lumps, crumbling to the salts it was raised from.',
    body: { order: 'blocks', motion: 'sink', first: 0.2, rim: [0.6, 0.62, 0.6], tint: [0.5, 0.53, 0.52], tintBy: 0.7 },
    move: { y: -0.5, ease: 'in' },
    cues: [{ at: 0.05, set: 'groan', gain: 0.7, pitch: 0.7 }, { at: 0.2, until: 0.9, stream: 'salts_pit', n: 50 }, { at: 0.92, scar: [0.48, 0.5, 0.5], r: 1.6, life: 30 }],
  },
};

