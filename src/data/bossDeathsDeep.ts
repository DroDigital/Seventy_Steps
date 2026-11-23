/**
 * The deaths of the Great Old Ones and the Outer Gods (data/bossDeaths.ts reads them; its header says what each part is). Few of
 * them die in any tale: a god struck down here goes back to where its tale keeps it (under the sea, into N'kai, to Kadath, into
 * slumber), and the line says where a death is drawn from the tale's hints rather than its words.
 */

import type { BossDeath } from './bossDeaths';

export const DEEP_DEATHS: Readonly<Record<string, BossDeath>> = {
  cthulhu: {
    lore: 'The Call of Cthulhu: the Alert drove into him, a bursting as of an exploded bladder, a slushy nastiness as of a cloven sunfish, and a green acrid cloud over the eddying, foaming brine; the scattered plasticity recombined, and R\'lyeh went down. He sinks slowly in the foam and the green cloud, his body seething as it goes back together.',
    body: { order: 'feet', motion: 'boil', first: 0.1, rim: [0.84, 0.9, 0.88], tint: [0.12, 0.18, 0.17], tintBy: 0.5 },
    move: { y: -1.1, from: 0.05 },
    cues: [{ at: 0, burst: 'acrid', n: 14 }, { at: 0.05, until: 0.85, stream: 'foam', n: 60, where: 'ground' }, { at: 0.1, ring: [0.84, 0.9, 0.88], to: 9, life: 1.6 }, { at: 0.4, set: 'gurgle', gain: 0.8, pitch: 0.5 }, { at: 0.5, ring: [0.84, 0.9, 0.88], to: 7, life: 1.8 }, { at: 0.55, until: 0.98, stream: 'bubbles_sea', n: 40, where: 'feet' }],
  },
  father_dagon: {
    lore: 'Dagon: vast, Polyphemus-like, it darted to the monolith, flung its gigantic scaly arms about it and bowed its hideous head; he is the Father of the Deep Ones. He bows his head once more and goes down beneath the reef, the sea rising over him from below in a heave of brine.',
    body: { order: 'sweep', motion: 'sink', strength: 0.8, dir: Math.PI / 2, rim: [0.8, 0.86, 0.86], tint: [0.12, 0.16, 0.16], tintBy: 0.4 },
    move: { y: -1.2, sy: 0.9, ease: 'in', from: 0.15 },
    cues: [{ at: 0.12, sting: 'splash', gain: 1 }, { at: 0.14, ring: [0.8, 0.86, 0.86], to: 8, life: 1.3 }, { at: 0.15, until: 0.6, stream: 'spray', n: 40 }, { at: 0.5, until: 0.95, stream: 'bubbles_sea', n: 30, where: 'feet' }],
  },
  mother_hydra: {
    lore: 'The Shadow over Innsmouth: Mother Hydra, with Father Dagon the oldest of the Deep Ones, whose city Y\'ha-nthlei lies under the reef. She coils down into a whirl of the deep she rose from, turning as she goes under, and her brood are let go of, and rise.',
    body: { order: 'centre', motion: 'spiral', strength: 1.2, rim: [0.6, 0.78, 0.76], tint: [0.1, 0.15, 0.16], tintBy: 0.4 },
    move: { y: -0.9, sx: 0.85, ease: 'in', from: 0.1 },
    cues: [{ at: 0.1, sting: 'splash', gain: 0.8, pitch: 0.8 }, { at: 0.1, until: 0.8, stream: 'whirl', n: 60, where: 'feet' }, { at: 0.3, ring: [0.6, 0.78, 0.76], to: 5, life: 1.6 }, { at: 0.7, burst: 'brood', n: 20 }],
  },
  hastur: {
    lore: 'The Whisperer in Darkness names Hastur the Unspeakable beside the Yellow Sign among the Outer Ones\' secrets, and Chambers set him by the Lake of Hali in Carcosa (from those hints). The tatters of his yellow mantle stream off band by band on a wind not of this world, toward Carcosa, and the Yellow Sign burns out over him.',
    body: { order: 'rows', motion: 'tatter', strength: 1.1, dir: 1, rim: [0.86, 0.74, 0.3], lit: true, tint: [0.5, 0.44, 0.24], tintBy: 0.3 },
    move: { y: 0.25, ease: 'in', from: 0.2 },
    cues: [{ at: 0.05, set: 'gust', gain: 0.8, pitch: 0.55 }, { at: 0.08, until: 0.9, stream: 'tatters', n: 50 }, { at: 0.62, burst: 'yellow_sign', n: 1, where: 'head' }, { at: 0.63, light: [0.9, 0.78, 0.36], strength: 1.4, range: 10, seconds: 1 }],
  },
  tsathoggua: {
    lore: 'The Mound (and Smith\'s tales): Tsathoggua, black and furry, toad-like and sleepy, in lightless N\'kai, tended by his formless spawn of black slime. Sated and sleepy, his eye shuts, and his body slackens into the black ooze of his spawn, running off into the dark of N\'kai.',
    body: { order: 'lids', motion: 'spread', first: 0.25, rim: [0.22, 0.18, 0.28], tint: [0.03, 0.03, 0.04], tintBy: 0.85 },
    move: { sx: 1.35, sy: 0.45, ease: 'out', from: 0.2 },
    cues: [{ at: 0.3, set: 'slime', gain: 0.7, pitch: 0.5 }, { at: 0.3, until: 0.95, stream: 'ooze', n: 40, where: 'ground' }, { at: 0.92, scar: [0.03, 0.03, 0.04], r: 3, life: 26 }],
  },
  ghatanothoa: {
    lore: 'Out of the Aeons: Ghatanothoa in the fortress under Yaddith-Gho in Mu, whose sight turned the living to leathery stone; Mu went down, and the fortress with it. Its eyes close and it goes down into the fortress under the mountain, the stone shutting over it in rubble and grey dust.',
    body: { order: 'top', motion: 'drain', first: 0.3, rim: [0.46, 0.45, 0.42], tint: [0.38, 0.37, 0.35], tintBy: 0.7 },
    move: { y: -0.7, shake: 0.06, ease: 'in', from: 0.2 },
    cues: [{ at: 0.08, ring: [0.42, 0.41, 0.38], to: 10, life: 1.5 }, { at: 0.2, until: 0.85, stream: 'rubble', n: 50, where: 'head' }, { at: 0.5, burst: 'stone_dust', n: 14, where: 'feet' }, { at: 0.9, scar: [0.36, 0.35, 0.33], r: 4.5, life: 30 }],
  },
  rhan_tegoth: {
    lore: 'The Horror in the Museum: Rogers\'s god out of the Arctic ruin, taken by the museum\'s visitors for a waxwork; it killed Rogers, was shot, and became one of the waxworks, holding a mangled man. It sets into the glossy wax it was taken for, and the waxwork sags in drips like a figure too near the stove.',
    body: { order: 'columns', motion: 'drip', strength: 1.2, first: 0.45, rim: [0.95, 0.92, 0.82], tint: [0.84, 0.78, 0.62], tintBy: 0.85 },
    move: { sy: 0.75, ease: 'in', from: 0.45 },
    cues: [{ at: 0.05, set: 'groan', gain: 0.7, pitch: 0.6 }, { at: 0.5, until: 0.95, stream: 'wax', n: 40 }, { at: 0.94, scar: [0.82, 0.76, 0.6], r: 1.6, life: 30 }],
  },
  yig: {
    lore: 'The Curse of Yig: Yig, Father of Serpents, half human, whose curse the rattlesnakes carry; a god, and no tale has him die. His coils slacken and he slides off into the grass, leaving his sloughed skin lying pale behind him, and the rattling stops.',
    body: { order: 'sweep', motion: 'ripple', strength: 0.8, rim: [0.74, 0.7, 0.58] },
    move: { away: 1.3, sy: 0.9, ease: 'in', from: 0.15 },
    cues: [{ at: 0.1, burst: 'grass', n: 18, where: 'feet' }, { at: 0.35, burst: 'skin', n: 5, where: 'ground' }, { at: 0.4, until: 0.8, stream: 'grass', n: 24, where: 'feet' }],
  },
  bokrug: {
    lore: 'The Doom that Came to Sarnath: Bokrug, the great water-lizard of Ib, whose sea-green stone idol the men of Sarnath carried off; on the night of their feast the doom came, and only the mist and the lake were left. He sets into the sea-green stone of his idol and goes down into the still lake as its mist comes up.',
    body: { order: 'top', motion: 'none', first: 0.55, rim: [0.5, 0.62, 0.55], tint: [0.36, 0.5, 0.42], tintBy: 1 },
    move: { y: -0.8, ease: 'in', from: 0.5 },
    cues: [{ at: 0.3, set: 'crunch', gain: 0.6, pitch: 0.6 }, { at: 0.45, until: 0.95, stream: 'lake_mist', n: 34 }, { at: 0.55, ring: [0.6, 0.7, 0.68], to: 6, life: 1.8 }, { at: 0.6, set: 'gurgle', gain: 0.6, pitch: 0.6 }],
  },
  nug: {
    lore: 'The Mound names Nug and Yeb, the twin blasphemies worshipped in K\'n-yan, and Lovecraft\'s letters make them children of Shub-Niggurath who beget in their turn (from those hints). The pale twin divides and divides again, as its line begets, until it is a brood of pale things that crawl apart and are gone.',
    body: { order: 'cells', motion: 'scatter', strength: 1.4, rim: [0.82, 0.8, 0.74], tint: [0.78, 0.76, 0.7], tintBy: 0.4 },
    move: { sx: 1.2, sy: 0.7, ease: 'out' },
    cues: [{ at: 0.08, set: 'slime', gain: 0.6, pitch: 1.3 }, { at: 0.2, until: 0.85, stream: 'brood_pale', n: 40, where: 'feet' }, { at: 0.5, set: 'squeak', gain: 0.3, pitch: 0.8 }],
  },
  yeb: {
    lore: 'The Mound\'s other twin blasphemy, Yeb, black as Nug is pale, of the line that came to rest in N\'kai (from the hints). The black twin is drawn down into the earth from its edges inward, toward the dark below, its drops falling into the ground as if pulled.',
    body: { order: 'rim', motion: 'drain', strength: 1.1, rim: [0.1, 0.09, 0.12], tint: [0.04, 0.04, 0.05], tintBy: 0.6 },
    move: { y: -0.4, ease: 'in' },
    cues: [{ at: 0.1, set: 'rumble', gain: 0.6, pitch: 0.6 }, { at: 0.1, until: 0.9, stream: 'drops_black', n: 50 }, { at: 0.9, scar: [0.04, 0.04, 0.05], r: 2.4, life: 26 }],
  },
  great_ones: {
    lore: 'The Dream-Quest of Unknown Kadath and The Other Gods: the mild and feeble gods of earth, who dance in the clouds on the high peaks and flee from men, their faces as the face carved on Ngranek. They set as that face is set, into grey stone, and the cloud they dance in comes down over the stone and carries them back to Kadath.',
    body: { order: 'even', motion: 'rise', strength: 0.8, first: 0.5, rim: [0.86, 0.86, 0.9], tint: [0.36, 0.36, 0.38], tintBy: 1 },
    move: { y: 0.3, ease: 'in', from: 0.55 },
    cues: [{ at: 0.05, set: 'choral', gain: 0.6, pitch: 0.8 }, { at: 0.35, set: 'crunch', gain: 0.5, pitch: 0.7 }, { at: 0.5, until: 0.98, stream: 'cloud', n: 30 }],
  },
  azathoth: {
    lore: 'The Dream-Quest of Unknown Kadath: the blind idiot god, the daemon sultan who gnaws in unlit chambers beyond time to the muffled beating of vile drums and the thin whine of accursed flutes; it is not slain, it slumbers. Its seething slows as it sinks back into slumber, the drums beat slower and stop, and the dark closes over it.',
    body: { order: 'rim', motion: 'boil', strength: 1.3, first: 0.3, rim: [0.18, 0.12, 0.26], tint: [0.03, 0.02, 0.05], tintBy: 0.75 },
    move: { sy: 0.85, ease: 'out' },
    cues: [{ at: 0, until: 0.6, stream: 'notes', n: 20 }, { at: 0.02, set: 'boom', gain: 0.7, pitch: 0.5 }, { at: 0.2, set: 'boom', gain: 0.55, pitch: 0.45 }, { at: 0.45, set: 'boom', gain: 0.4, pitch: 0.4 }, { at: 0.75, set: 'boom', gain: 0.25, pitch: 0.38 }],
  },
  daemon_pipers: {
    lore: 'The Dream-Quest of Unknown Kadath: the mindless daemon flute-players about Azathoth\'s throne, piping the thin monotonous whine of accursed flutes. The piping holds one thin note and the pipers thin with it, shaking like a plucked string, until the note breaks and they are gone.',
    body: { order: 'even', motion: 'ripple', strength: 1.6, rim: [0.78, 0.68, 1], lit: true, tint: [0.5, 0.46, 0.6], tintBy: 0.3 },
    move: { sx: 0.55, sy: 1.1, ease: 'in' },
    cues: [{ at: 0, until: 0.7, stream: 'notes', n: 26 }, { at: 0.72, set: 'snap', gain: 0.8, pitch: 2 }, { at: 0.72, light: [0.78, 0.68, 1], strength: 1.2, range: 6, seconds: 0.5 }],
  },
  other_gods: {
    lore: 'The Other Gods: on Hatheg-Kla the moon went into an eclipse foretold in no book, and the Other Gods who guard the feeble gods of earth drew Barzai screaming into the sky. A shadow sweeps across them as the eclipse crossed the moon, and when it has gone by so have they, and the moon comes out again.',
    body: { order: 'sweep', motion: 'none', rim: [0.02, 0.02, 0.03], tint: [0.03, 0.03, 0.04], tintBy: 0.4 },
    cues: [{ at: 0, sting: 'darkness', gain: 0.8 }, { at: 0.4, set: 'thunder', gain: 0.6, pitch: 0.7 }, { at: 0.4, until: 0.9, stream: 'cloud', n: 20 }, { at: 0.95, light: [0.86, 0.88, 0.95], strength: 1, range: 30, seconds: 2.2 }],
  },
  yog_sothoth: {
    lore: 'The Dunwich Horror and the Silver Key: Yog-Sothoth is the gate, the key and the guardian of the gate, a congeries of iridescent globes. Its globes go out one by one, each drawn in on itself, and the gate it is closes to a point of violet.',
    body: { order: 'cells', motion: 'shrink', rim: [0.72, 0.52, 1], lit: true, tint: [0.5, 0.4, 0.7], tintBy: 0.3 },
    move: { sx: 0.2, sy: 0.2, ease: 'in', from: 0.5 },
    cues: [{ at: 0.05, until: 0.75, stream: 'globes', n: 30 }, { at: 0.94, light: [0.6, 0.35, 0.95], strength: 2.4, range: 10, seconds: 0.7 }, { at: 0.94, sting: 'vanish', gain: 0.7 }],
  },
  umr_at_tawil: {
    lore: 'Through the Gates of the Silver Key: \'Umr at-Tawil, the Prolonged of Life, the Guide, a shape veiled before the Ultimate Gate. The veil falls back over nothing (what stood behind it was never there to strike), and its empty folds settle to the floor in the light of the Gate.',
    body: { order: 'centre', motion: 'sink', rim: [0.92, 0.86, 0.66], lit: true },
    cues: [{ at: 0.05, light: [0.95, 0.88, 0.66], strength: 1.6, range: 12, seconds: 2 }, { at: 0.05, set: 'choral', gain: 0.6, pitch: 1.2 }, { at: 0.1, until: 0.6, stream: 'gate_motes', n: 30 }],
  },
  ancient_ones: {
    lore: 'Through the Gates of the Silver Key: the Ancient Ones, cloaked on hexagonal pedestals, rocking as one, their sceptres lit. Their rocking stops, their sceptres go out, and the cloaked shapes sink down into the pedestals they sat on, thinning as they go.',
    body: { order: 'even', motion: 'none', rim: [0.88, 0.8, 0.6], tint: [0.4, 0.38, 0.34], tintBy: 0.3 },
    move: { y: -0.9, from: 0.1 },
    cues: [{ at: 0, light: [0.95, 0.85, 0.5], strength: 1.4, range: 8, seconds: 1.6 }, { at: 0.05, set: 'choral', gain: 0.5, pitch: 0.6 }, { at: 0.4, ring: [0.88, 0.8, 0.6], to: 2.6, life: 1.6 }],
  },
  shub_niggurath: {
    lore: 'The Whisperer in Darkness: "Iä! Shub-Niggurath! The Black Goat of the Woods with a Thousand Young!" The great mound lies down and comes apart into her thousand young, which scatter outward into the black wood, and the wood goes quiet.',
    body: { order: 'blocks', motion: 'diffuse', strength: 1.3, rim: [0.1, 0.1, 0.09], tint: [0.05, 0.05, 0.05], tintBy: 0.5 },
    move: { sx: 1.3, sy: 0.5, ease: 'out' },
    cues: [{ at: 0.1, until: 0.85, stream: 'young', n: 70, where: 'feet' }, { at: 0.2, set: 'growl', gain: 0.5, pitch: 1.4 }, { at: 0.5, ring: [0.12, 0.12, 0.1], to: 9, life: 1.6 }],
  },
  nyarlathotep: {
    lore: 'Nyarlathotep: the crawling chaos, tall and swarthy as a pharaoh, the soul and messenger of the Outer Gods, who is not ended by any tale. He is not struck: he smiles and steps back into his shadow, which pools at his feet, spreads, and crawls off along the floor in black threads.',
    body: { order: 'feet', motion: 'spread', rim: [0.06, 0.05, 0.07], tint: [0.03, 0.03, 0.04], tintBy: 0.7 },
    move: { away: 0.3, ease: 'out' },
    cues: [{ at: 0.05, set: 'laugh', gain: 0.4, pitch: 0.7 }, { at: 0.4, until: 0.95, stream: 'threads', n: 60, where: 'ground' }],
  },
};
