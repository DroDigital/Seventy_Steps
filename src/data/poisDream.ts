/**
 * The points of interest of the Dreamlands (round 61; data/pois.ts), a realm four times the area of any other and the sparsest on the
 * map: the Zoogs' wood, Ulthar's cats, the feast of the ghouls, Barzai's ledge on Hatheg-Kla, Ngranek's carved face, the shore of Ib,
 * Celephaïs' stair, the plateau of Leng, the Moon-beasts' quay. Three of them heal rather than hurt: the cats' circle, the Onyx stair and Kuranes' hollow.
 */

import type { PoiDef } from './pois';

export const POIS_DREAM: readonly PoiDef[] = [
  { id: 'dream_zoog_council', region: 'dreamlands', at: { feature: 'circle', nth: 0 }, name: "The Zoogs' Council", kind: 'den', story: 'The Dream-Quest of Unknown Kadath',
    line: 'A ring of small brown shapes falls silent. One of them seems to know your name.', foes: { ids: ['zoog'], n: 8 }, hoard: 2000 },
  { id: 'dream_hatheg_ledge', region: 'dreamlands', at: { near: [110, 680], as: 'cliff' }, name: "Barzai's Last Ledge", kind: 'anomaly', story: 'The Other Gods',
    line: 'Here a philosopher stood to watch the gods of Earth dance, and learned that the others were nearer.', again: 'Nothing here casts a shadow, but the ledge has one.', fx: { form: 'column', hue: 'magenta' }, aura: -0.4, insight: 1, hoard: 1200 },
  { id: 'dream_cats_circle', region: 'dreamlands', at: { feature: 'ruin', nth: 0 }, name: "The Cats' Circle", kind: 'tale', story: 'The Cats of Ulthar',
    line: 'Every cat on the terrace has turned to face you. None of them is afraid.', again: 'They arrange themselves a little, to make you room.', aura: 0.7, hoard: 1600, insight: 1 },
  { id: 'dream_ghoul_feast', region: 'dreamlands', at: { feature: 'circle', nth: 1 }, name: "The Ghouls' Feast Stones", kind: 'den', story: 'The Dream-Quest of Unknown Kadath',
    line: 'Bones, a lamp of corpse-fat and a painter\'s easel, all left in a hurry.', foes: { ids: ['ghoul', 'ghast'], n: 7 }, hoard: 3600 },
  { id: 'dream_ngranek_face', region: 'dreamlands', at: { feature: 'outcrop', nth: 0 }, name: "Ngranek's Carved Face", kind: 'anomaly', story: 'The Dream-Quest of Unknown Kadath',
    line: 'A mountain-side with a face in it, and the face wears the look of one who has recognised you.', again: 'The face is nearer than the mountain.', fx: { form: 'ring', hue: 'bone' }, aura: -0.3, insight: 1, hoard: 1200 },
  { id: 'dream_ib_shore', region: 'dreamlands', at: { near: [6, 420], as: 'shore' }, name: 'The Shore of Ib', kind: 'rite', story: 'The Doom That Came to Sarnath',
    line: 'A green idol at the water\'s edge, and under the sound of the surf: Bokrug, Bokrug, Bokrug.', foes: { ids: ['being_of_ib', 'gnorri'], n: 6 }, hoard: 4400, fx: { form: 'motes', hue: 'green' }, aura: -0.25 },
  { id: 'dream_onyx_stair', region: 'dreamlands', at: { feature: 'ruin', nth: 3 }, name: "Celephaïs' Onyx Stair", kind: 'anomaly', story: 'Celephaïs',
    line: 'A gate of onyx on a stair of many steps. It sings softly with a dream-king\'s mercy.', again: 'For a moment you were not tired, and had never been.', fx: { form: 'sheet', hue: 'bone' }, aura: 0.55, insight: 1, hoard: 1200 },
  { id: 'dream_leng_edge', region: 'dreamlands', at: { feature: 'ruin', nth: 1 }, name: 'The Edge of Leng', kind: 'rite', story: 'The Dream-Quest of Unknown Kadath',
    line: 'A stone village, a yellow silk mask on the sill. Something not to be described fills the window behind it.', foes: { ids: ['man_of_leng', 'moon_beast', 'shantak'], n: 6 }, hoard: 6000, fx: { form: 'column', hue: 'purple' }, aura: -0.3 },
  { id: 'dream_moonbeast_quay', region: 'dreamlands', at: { feature: 'outcrop', nth: 1 }, name: "The Moon-beasts' Quay", kind: 'den', story: 'The Dream-Quest of Unknown Kadath',
    line: 'A black galley\'s rope, cut and left. Wet, pale shapes rise from under the quay as one.', foes: { ids: ['moon_beast', 'night_gaunt'], n: 5 }, hoard: 5200 },
  { id: 'dream_wamp_fen', region: 'dreamlands', at: { feature: 'ruin', nth: 2 }, name: "The Wamps' Fen", kind: 'hoard', story: 'The Dream-Quest of Unknown Kadath',
    line: 'Pale, hairless things on thick legs, nesting in a drowned temple\'s upper floor.', foes: { ids: ['wamp', 'gnorri'], n: 5 }, hoard: 3600 },
  { id: 'dream_sleepers_hollow', region: 'dreamlands', at: { feature: 'grove', nth: 0 }, name: "Kuranes' Hollow", kind: 'tale', story: 'Celephaïs',
    line: 'A man-shaped hollow in the grass, where someone lay down to sleep and woke in a better place.', again: 'The grass is still warm, a little.', aura: 0.4, insight: 1, fx: { form: 'motes', hue: 'bone' }, hoard: 1200 },
];
