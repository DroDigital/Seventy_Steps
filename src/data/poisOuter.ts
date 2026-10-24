/**
 * The points of interest of the Outer Dark (round 73; data/pois.ts): three in each of the six dimensions beyond the Ultimate Void, one guarded and two that
 * are only themselves. Each recalls a tale of Lovecraft's that its god stands in: the Other Gods on Hatheg-Kla, the Black Goat of the Woods, the Silver Key's
 * Ancient Ones, the pipers of the Dream-Quest, the Gate of Dunwich and the blind idiot's court.
 */

import type { PoiDef } from './pois';

export const POIS_OUTER: readonly PoiDef[] = [
  // The Cloud Summit: the Other Gods, on the peak of Hatheg-Kla taken up out of the earth.
  { id: 'cloud_barzai_ledge', region: 'cloud_summit', at: { feature: 'ruin', nth: 0 }, name: "Barzai's Ledge", kind: 'tale', story: 'The Other Gods',
    line: 'A shelf of rock above the cloud, and a scrap of a sage\'s robe. Here a man said: "I shall behold the gods of earth, and I shall be wiser than they."', again: 'The cloud below breathes, once, as if a sleeper turned.', aura: -0.2, insight: 1, hoard: 1800 },
  { id: 'cloud_dancing_floor', region: 'cloud_summit', at: { feature: 'circle', nth: 0 }, name: 'The Dancing Floor', kind: 'rite', story: 'The Other Gods',
    line: 'A ring of flat stone worn smooth by feet that were not feet. The aurora comes down the peak into it, and what dances there is more than the light.', foes: { ids: ['night_gaunt', 'being_from_beyond'], n: 5 }, hoard: 7200, fx: { form: 'ring', hue: 'purple' }, aura: -0.4 },
  { id: 'cloud_sea_edge', region: 'cloud_summit', at: { feature: 'outcrop', nth: 1 }, name: 'The Edge of the Cloud-Sea', kind: 'anomaly', story: 'The Other Gods',
    line: 'Below the lip, the cloud is a floor to the end of sight, lit from within by a lightning that makes no sound. You have the sense of having been walked on.', again: 'Far under the cloud, something very large has turned toward you.', fx: { form: 'sheet', hue: 'bone' }, aura: -0.45, insight: 1, hoard: 1500 },

  // The Black Wood: the Black Goat of the Woods with a Thousand Young.
  { id: 'wood_thousand_young', region: 'black_wood', at: { feature: 'grove', nth: 0 }, name: 'The Grove of the Thousand', kind: 'den', story: 'The Whisperer in Darkness',
    line: 'Dark trunks as thick as barrels, and beneath them the soft, stamping, hoofless sound of a thing that is very young and very many.', foes: { ids: ['thousand_young', 'rat_swarm'], n: 7 }, hoard: 7600 },
  { id: 'wood_black_altar', region: 'black_wood', at: { feature: 'circle', nth: 1 }, name: 'The Goat\'s Altar', kind: 'rite', story: 'The Dunwich Horror',
    line: 'A stone of the dark wood stained black and glossy, and a track of cloven prints around it, going in at the sunset and out at the dawn. Ia! Shub-Niggurath!', foes: { ids: ['thousand_young', 'mi_go'], n: 5 }, hoard: 6800, fx: { form: 'column', hue: 'magenta' }, aura: -0.45 },
  { id: 'wood_that_counts', region: 'black_wood', at: { feature: 'grove', nth: 5 }, name: 'The Tree That Counts', kind: 'anomaly', story: 'The Whisperer in Darkness',
    line: 'One trunk, notched in fives from root to bough, the notches going on out of the bark into the air. The wood is counting, and has been, since long before there was anything to count.', again: 'There is one more notch than there was.', fx: { form: 'motes', hue: 'bone' }, aura: -0.35, insight: 1, hoard: 1500 },

  // The Pale Lattice: the Ancient Ones of the Silver Key, in a place of stilled time.
  { id: 'lattice_first_facet', region: 'pale_lattice', at: { feature: 'landmark', nth: 0 }, name: 'The First Facet', kind: 'tale', story: 'Through the Gates of the Silver Key',
    line: 'A prism the height of a house, clear as water, and inside it a man in a coat of the old cut, walking toward you at the speed of a thing that has not yet moved.', again: 'He has walked a step.', aura: -0.25, insight: 1, hoard: 1800 },
  { id: 'lattice_ring_of_hours', region: 'pale_lattice', at: { feature: 'circle', nth: 2 }, name: 'The Ring of Hours', kind: 'rite', story: 'Through the Gates of the Silver Key',
    line: 'Twelve prisms in a ring, and in each one the same hour, seen from twelve sides. The Ancient Ones do not speak; they wait, and the ring waits with them.', foes: { ids: ['yithian', 'being_from_beyond'], n: 5 }, hoard: 7400, fx: { form: 'ring', hue: 'bone' }, aura: -0.3 },
  { id: 'lattice_stilled_court', region: 'pale_lattice', at: { feature: 'ruin', nth: 1 }, name: 'The Stilled Court', kind: 'anomaly', story: 'Through the Gates of the Silver Key',
    line: 'Dust hangs in the air here and does not fall. A lantern-flame leans, held at the angle of a draught that is no longer blowing.', again: 'The flame has leaned the other way.', fx: { form: 'motes', hue: 'bone' }, aura: -0.2, insight: 1, hoard: 1500 },

  // The Piping Dark: the daemon pipers at the throne of the blind idiot.
  { id: 'flute_rest', region: 'piping_dark', at: { feature: 'circle', nth: 0 }, name: 'The Cracked Reed-Bed', kind: 'rite', story: 'The Dream-Quest of Unknown Kadath',
    line: 'Reeds as tall as a man, cut for flutes, and the cut ends all bleeding the same dark. Somewhere beyond them a thin, monotonous whine is being kept up by no breath.', foes: { ids: ['flying_polyp', 'night_gaunt'], n: 5 }, hoard: 7000, fx: { form: 'ring', hue: 'magenta' }, aura: -0.5 },
  { id: 'flute_zann_stair', region: 'piping_dark', at: { feature: 'ruin', nth: 1 }, name: 'The Stair in the Rue d\'Auseil', kind: 'tale', story: 'The Music of Erich Zann',
    line: 'A stair of black steps going up into nothing, and a viol left on the fourth. The window at the top was never there. Zann played to keep it shut.', again: 'The viol\'s string is drawn tight, and trembles with a note no one is playing.', aura: -0.35, insight: 1, hoard: 1800 },
  { id: 'flute_mute_choir', region: 'piping_dark', at: { feature: 'outcrop', nth: 0 }, name: 'The Mute Choir', kind: 'anomaly', story: 'The Dream-Quest of Unknown Kadath',
    line: 'Figures stand in rows upon the shelf, dancing in place, with nothing on their heads where there should be faces. They dance to the pipes. The pipes are the only sound.', again: 'One of them is a step nearer.', fx: { form: 'column', hue: 'purple' }, aura: -0.5, insight: 1, hoard: 1500 },

  // The Gate of Spheres: Yog-Sothoth, who is the gate.
  { id: 'spheres_wormius_stone', region: 'spheres', at: { feature: 'landmark', nth: 1 }, name: 'The Stone of the Key', kind: 'tale', story: 'The Dunwich Horror',
    line: 'A slab cut with a single line, in no tongue, that you read at once: Yog-Sothoth is the gate, and the key, and the guardian of the gate.', again: 'The line has more in it than before.', aura: -0.3, insight: 1, hoard: 1800 },
  { id: 'spheres_globe_choir', region: 'spheres', at: { feature: 'circle', nth: 1 }, name: 'The Choir of Globes', kind: 'rite', story: 'The Dunwich Horror',
    line: 'Iridescent globes drift in a ring above a basin of black water, each a little larger than the one before. Something is being counted, and you are in the count.', foes: { ids: ['being_from_beyond', 'dhole'], n: 5 }, hoard: 7800, fx: { form: 'ring', hue: 'green' }, aura: -0.4 },
  { id: 'spheres_threshold', region: 'spheres', at: { feature: 'ruin', nth: 0 }, name: 'The Door That Is Everywhere', kind: 'anomaly', story: 'Through the Gates of the Silver Key',
    line: 'A door stands in the open, and from any side it is the door you came in at. It opens on the same place from each. It opens on a different place from each.', again: 'The door has been opened from the other side.', fx: { form: 'sheet', hue: 'green' }, aura: -0.45, insight: 1, hoard: 1500 },

  // The Court at the Centre: the blind idiot god, and the Crawling Chaos who is his soul and messenger.
  { id: 'court_dancers_road', region: 'court_centre', at: { feature: 'circle', nth: 0 }, name: 'The Road of the Dancers', kind: 'rite', story: 'The Dream-Quest of Unknown Kadath',
    line: 'A road of black slabs worn into hollows by feet that went the same way, in the same step, forever. The step is the step of a dance. It is easy to learn.', foes: { ids: ['being_from_beyond', 'night_gaunt'], n: 4 }, hoard: 7200, fx: { form: 'ring', hue: 'magenta' }, aura: -0.55 },
  { id: 'court_the_hall', region: 'court_centre', at: { feature: 'ruin', nth: 1 }, name: 'The Hall of Nyarlathotep', kind: 'tale', story: 'Nyarlathotep',
    line: 'A hall, open to all, with the doors at the hour of your choosing, and a handbill pasted to the jamb. There is no charge. No one has asked for his money back.', again: 'Someone has been in. The seats are warm.', aura: -0.3, insight: 1, hoard: 1800 },
  { id: 'court_the_unnoticed', region: 'court_centre', at: { feature: 'landmark', nth: 2 }, name: 'The Unnoticing', kind: 'anomaly', story: 'The Dream-Quest of Unknown Kadath',
    line: 'The presiding power has not noticed you. It would be a mistake to take this for a kindness. It is the entire shape of the danger, and it is why you are here.', again: 'It has not noticed you again.', fx: { form: 'column', hue: 'bone' }, aura: -0.6, insight: 1, hoard: 1500 },
];
