/**
 * The points of interest of the waking world (round 61; data/pois.ts): the university, Arkham, the Round Hills of Dunwich, Innsmouth
 * under its reef, Providence and Kingsport, the Vermont hills. Each is a place Lovecraft wrote, set where the land has one of its
 * kind to give it (a graveyard, a ring of stones, a ruin, a grove, an outcrop, a shore, a cliff). The lines are the game's own.
 */

import type { PoiDef } from './pois';

export const POIS_WAKING: readonly PoiDef[] = [
  // The university (the first hour is kept gentle: only its rats and corpses, a few of them).
  { id: 'hub_potters_field', region: 'hub', at: { feature: 'graveyard', nth: 0 }, name: "West's Potter's Field", kind: 'den', story: 'Herbert West—Reanimator',
    line: 'The earth is turned, and not by any sexton. Someone needed what lay below it, fresh.', foes: { ids: ['reanimated_corpse', 'rat_swarm'], n: 4 }, hoard: 350 },
  { id: 'hub_laboratory', region: 'hub', at: { feature: 'ruin', nth: 0 }, name: 'The Burned Laboratory', kind: 'anomaly', story: 'Herbert West—Reanimator',
    line: 'Phials in the ash still glow a faint, wrong green. Something worked here, by night, and was not finished.',
    again: 'The glow stirs, as though a needle had been drawn through it.', fx: { form: 'motes', hue: 'green' }, aura: -0.3, hoard: 100 },

  // Arkham and the Blasted Heath.
  { id: 'arkham_meadow_hill', region: 'arkham', at: { feature: 'outcrop', nth: 0 }, name: 'Meadow Hill', kind: 'rite', story: 'The Dreams in the Witch House',
    line: 'A bare hill where witches met on the eve of May, and the Black Man held out his book.', foes: { ids: ['ghoul', 'moon_bog_wraith'], n: 5 }, hoard: 1100, fx: { form: 'column', hue: 'purple' }, aura: -0.25 },
  { id: 'arkham_blasted_well', region: 'arkham', at: { feature: 'ruin', nth: 0 }, name: 'The Well on the Blasted Heath', kind: 'anomaly', story: 'The Colour Out of Space',
    line: 'Grey dust where nothing grows. The well breathes a colour you cannot name.', again: 'The colour has no place in the spectrum, and it knows your face.',
    fx: { form: 'sheet', hue: 'magenta' }, aura: -0.5, insight: 1, hoard: 300 },
  { id: 'arkham_ghoul_warren', region: 'arkham', at: { feature: 'graveyard', nth: 1 }, name: 'The Ghoul-Warren under Hill Street', kind: 'den', story: "Pickman's Model",
    line: 'A slab stands ajar over a stair no sexton dug. Below, a lamp that has never been trimmed.', foes: { ids: ['ghoul', 'reanimated_corpse'], n: 6 }, hoard: 1000 },
  { id: 'arkham_brown_jenkin', region: 'arkham', at: { feature: 'ruin', nth: 2 }, name: "Brown Jenkin's Run", kind: 'hoard', story: 'The Dreams in the Witch House',
    line: 'Small teeth in the wainscot, and something behind them that almost speaks.', foes: { ids: ['rat_swarm'], n: 4 }, hoard: 900 },
  { id: 'arkham_doorstep', region: 'arkham', at: { feature: 'ruin', nth: 3 }, name: 'The Crowninshield Door', kind: 'tale', story: 'The Thing on the Doorstep',
    line: 'Three knocks and two, on a door that is not in its frame any longer.', again: 'It knocks again, in a hand you had once known.', aura: -0.2, insight: 1, hoard: 300 },

  // Dunwich and the Round Hills.
  { id: 'dunwich_sentinel_altar', region: 'dunwich', at: { feature: 'circle', nth: 1 }, name: 'The Altar on Sentinel Hill', kind: 'rite', story: 'The Dunwich Horror',
    line: 'Seven stones and a slab, and the hill itself trembling at a sound beneath hearing.', foes: { ids: ['martense_degenerate', 'thousand_young'], n: 5 }, hoard: 2100, fx: { form: 'column', hue: 'green' }, aura: -0.3 },
  { id: 'dunwich_hop_yard', region: 'dunwich', at: { feature: 'circle', nth: 0 }, name: "The Devil's Hop Yard", kind: 'anomaly', story: 'The Dunwich Horror',
    line: 'Nothing has grown here in a hundred years. The ground is the colour of old ash and feels hollow.', again: 'The whippoorwills come near, and wait.', fx: { form: 'motes', hue: 'purple' }, aura: -0.35, insight: 1, hoard: 500 },
  { id: 'dunwich_farmhouse', region: 'dunwich', at: { feature: 'ruin', nth: 0 }, name: 'The Old Bishop Farm', kind: 'den', story: 'The Dunwich Horror',
    line: 'The barn is stove outward, not in. Beyond it the grass lies flat in a wide track of round prints, each as large as a hogshead.', foes: { ids: ['martense_degenerate', 'rat_swarm'], n: 6 }, hoard: 1800 },
  { id: 'dunwich_old_plot', region: 'dunwich', at: { feature: 'graveyard', nth: 0 }, name: "Old Whateley's Plot", kind: 'hoard', story: 'The Dunwich Horror',
    line: 'One headstone faces north, away from the others and from the church.', foes: { ids: ['martense_degenerate'], n: 3 }, hoard: 1950 },
  { id: 'dunwich_whippoorwills', region: 'dunwich', at: { feature: 'outcrop', nth: 1 }, name: "The Whippoorwills' Ridge", kind: 'tale', story: 'The Dunwich Horror',
    line: 'Hundreds of them, calling in time with your own breath: they wait for a soul that cannot get free.', again: 'The birds fall silent all at once.', aura: -0.2, insight: 1, fx: { form: 'motes', hue: 'bone' }, hoard: 500 },
  { id: 'dunwich_round_stones', region: 'dunwich', at: { feature: 'circle', nth: 2 }, name: 'The Round Mountain Stones', kind: 'rite', story: 'The Dunwich Horror',
    line: 'Where the old farmers say the hills answer the calling: Yog-Sothoth is the gate.', foes: { ids: ['thousand_young', 'martense_degenerate'], n: 5 }, hoard: 2400, fx: { form: 'ring', hue: 'magenta' } },

  // Innsmouth.
  { id: 'innsmouth_devil_reef', region: 'innsmouth', at: { near: [500, 150], as: 'shore' }, name: "The Devil Reef Landing", kind: 'rite', story: 'The Shadow over Innsmouth',
    line: 'Black rock breaks the swell a mile out. The lights on it are not a ship\'s.', foes: { ids: ['deep_one', 'dagon_priest', 'innsmouth_hybrid'], n: 6 }, hoard: 2700, fx: { form: 'ring', hue: 'green' }, aura: -0.3 },
  { id: 'innsmouth_gilman', region: 'innsmouth', at: { feature: 'ruin', nth: 1 }, name: 'The Gilman House', kind: 'den', story: 'The Shadow over Innsmouth',
    line: 'A hotel with no guests, and every window watched. The night clerk has no neck to speak of.', foes: { ids: ['innsmouth_hybrid', 'deep_one'], n: 7 }, hoard: 2400 },
  { id: 'innsmouth_dagon_hall', region: 'innsmouth', at: { feature: 'ruin', nth: 2 }, name: "The Order of Dagon's Hall", kind: 'rite', story: 'The Shadow over Innsmouth',
    line: 'A Masonic hall with its pillars stained by what is not rust. Chanting, wet and patient.', foes: { ids: ['dagon_priest', 'innsmouth_hybrid'], n: 6 }, hoard: 3000, fx: { form: 'column', hue: 'green' } },
  { id: 'innsmouth_refinery', region: 'innsmouth', at: { feature: 'ruin', nth: 0 }, name: 'The Marsh Refinery', kind: 'hoard', story: 'The Shadow over Innsmouth',
    line: 'Bars of a gold that no mint made: the design is of things with fins and frogs\' feet.', foes: { ids: ['innsmouth_hybrid', 'deep_one'], n: 4 }, hoard: 2700 },
  { id: 'innsmouth_slip', region: 'innsmouth', at: { near: [200, 500], as: 'shore' }, name: "Zadok's Weedy Slip", kind: 'anomaly', story: 'The Shadow over Innsmouth',
    line: 'Where an old man told the tale, drunk and low, of the night the swimmers came ashore.', again: 'The tide goes out a long way, and a long way in.', fx: { form: 'motes', hue: 'green' }, aura: -0.3, insight: 1, hoard: 500 },

  // Providence and Kingsport.
  { id: 'providence_catacombs', region: 'providence', at: { feature: 'graveyard', nth: 0 }, name: "The Curwen Vault", kind: 'den', story: 'The Case of Charles Dexter Ward',
    line: 'A vault door the sexton swears is welded shut stands slightly open, and breathes.', foes: { ids: ['ghoul', 'cthulhu_cultist'], n: 6 }, hoard: 1950 },
  { id: 'providence_chapel', region: 'providence', at: { feature: 'ruin', nth: 0 }, name: 'The Starry Wisdom Chapel', kind: 'rite', story: 'The Haunter of the Dark',
    line: 'Someone has swept the nave and set candles in the dark. The trapezohedron is not here; they hope.', foes: { ids: ['cthulhu_cultist', 'winged_hybrid'], n: 6 }, hoard: 2400, fx: { form: 'column', hue: 'magenta' }, aura: -0.25 },
  { id: 'providence_high_house', region: 'providence', at: { near: [470, 165], as: 'cliff' }, name: 'The Strange High House in the Mist', kind: 'anomaly', story: 'The Strange High House in the Mist',
    line: 'A gambrel house hangs over the cliff, and the mist beneath it is a sea no chart shows.', again: 'From under the cliff a door opens in the fog, and shuts.', fx: { form: 'sheet', hue: 'purple' }, aura: -0.25, insight: 1, hoard: 500 },
  { id: 'providence_pawtuxet', region: 'providence', at: { feature: 'grove', nth: 1 }, name: "Curwen's Pawtuxet Farm", kind: 'den', story: 'The Case of Charles Dexter Ward',
    line: 'A bungalow in a field of salt-burned earth. Its cellar was never built, and has two floors.', foes: { ids: ['ghoul', 'cthulhu_cultist', 'winged_hybrid'], n: 6 }, hoard: 2250 },
  { id: 'providence_warren', region: 'providence', at: { feature: 'outcrop', nth: 1 }, name: "Copp's Hill Warrens", kind: 'hoard', story: "Pickman's Model",
    line: 'A well, a stair cut in clay, and a painter\'s canvas pinned to the wall: the faces look back.', foes: { ids: ['ghoul'], n: 4 }, hoard: 1800 },
  { id: 'providence_festival', region: 'providence', at: { feature: 'graveyard', nth: 1 }, name: 'The Yule Festival Crypt', kind: 'rite', story: 'The Festival',
    line: 'Lights move in the crypt below in time with a chant too old for any tongue here.', foes: { ids: ['ghoul', 'winged_hybrid'], n: 6 }, hoard: 2250, fx: { form: 'ring', hue: 'green' }, aura: -0.25 },

  // The Vermont hills.
  { id: 'vermont_cache', region: 'vermont', at: { feature: 'outcrop', nth: 0 }, name: 'The Round Hill Cache', kind: 'hoard', story: 'The Whisperer in Darkness',
    line: 'A hollow in the hillside, brushed clean of snow. Whatever came here took something and left no track.', foes: { ids: ['mi_go'], n: 2 }, hoard: 2250 },
  { id: 'vermont_martense', region: 'vermont', at: { feature: 'ruin', nth: 0 }, name: 'The Martense Mansion', kind: 'den', story: 'The Lurking Fear',
    line: 'A black hulk on the mountain, its stair worn smooth by feet that did not wear shoes.', foes: { ids: ['martense_degenerate', 'rat_swarm'], n: 7 }, hoard: 2400 },
  { id: 'vermont_brook', region: 'vermont', at: { feature: 'grove', nth: 7 }, name: 'The Brook of Strange Bodies', kind: 'anomaly', story: 'The Whisperer in Darkness',
    line: 'After the flood, they say, the river carried something pink and many-limbed past the farms.', again: 'Something in the water shifts, many-jointed and careful.', fx: { form: 'sheet', hue: 'purple' }, aura: -0.3, insight: 1, hoard: 500 },
  { id: 'vermont_black_stone', region: 'vermont', at: { near: [160, 430], as: 'cliff' }, name: 'The Black Stone of Dark Mountain', kind: 'rite', story: 'The Whisperer in Darkness',
    line: 'A black stone covered in writing, where the Outer Ones come to cut and bear away.', foes: { ids: ['mi_go', 'moon_bog_wraith'], n: 4 }, hoard: 2850, fx: { form: 'column', hue: 'magenta' }, aura: -0.25 },
  { id: 'vermont_farm', region: 'vermont', at: { feature: 'grove', nth: 3 }, name: "The Lonely Farm", kind: 'tale', story: 'The Whisperer in Darkness',
    line: 'The dog is chained and has not barked. The letters in the box all end the same way.', again: 'The wind has a buzzing in it, as of a voice using a machine.', aura: -0.2, insight: 1, hoard: 500 },
];
