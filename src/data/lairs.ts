/**
 * The lesser dungeons: crypts, cellars and deserted houses from the stories, each hiding an optional
 * boss at its far end behind a few rooms of foes, with a Silver Vial (one more dose of West's
 * Reagent) or a tome for whoever gets that far. Placed by sites.ts like the legacy dungeons.
 *
 * Round 125 (asked: the dungeons designed the way Souls levels are; docs/LEVEL_DESIGN.md): a lair has no Elder Sign of its own, so its
 * door is where a fallen investigator comes back from. The straight way from the door to the boss's antechamber (a stair, most often)
 * is barred at its far end, and the first way there is the long one, through the lair's rooms; from the antechamber the straight way
 * is opened, and the boss is then a few rooms from the door. Something lies in wait in each. The Deserted House drops from its attic
 * landing back into its hall, and the Shunned House from its upper floor into its parlour.
 */

import type { DungeonDef } from './dungeons';
import { link, room, stair } from './roomBuild';
import { LINK } from './tuning';

// Round 13: the lairs were two to four rooms; each now has a side way or two, a cellar or a secret.
export const LAIRS: readonly DungeonDef[] = [
  {
    // The street hall's stair up to the cold room's landing is barred at the top; the way up is the back stair beyond the parlour.
    id: 'munoz_rooms', name: "Muñoz's Rooms", region: 'hub', rooms: [
      room('hall', 'corridor', undefined, 's', { spawns: ['rat_swarm'] }),
      room('parlour', 'hall', 'hall', 'e', { spawns: ['rat_swarm', 'reanimated_corpse'] }),
      room('kitchen', 'corridor', 'parlour', 'n', { spawns: ['rat_swarm'] }),
      room('back_hall', 'corridor', 'parlour', 'e', { lurk: ['reanimated_corpse'] }),
      stair('back_stair', 'back_hall', 'n', 4, { spawns: ['exham_troglodyte'] }),
      room('upper_hall', 'corridor', 'back_stair', 'n', { spawns: ['reanimated_corpse'] }),
      room('plant', 'corridor', 'upper_hall', 'w', { spawns: ['reanimated_corpse'], words: 'THE REFRIGERATING PLANT' }),
      room('landing', 'corridor', 'plant', 'w'),
      room('cold', 'hall', 'landing', 'n', { wide: true, boss: ['dr_munoz'], vial: 'Silver Vial of the Cold Room' }),
      stair('stairs', 'landing', 's', -4), // down to its barred foot in the street hall
      stair('boiler', 'hall', 'w', -4),
      room('coal_room', 'hall', 'boiler', 'w', { spawns: ['exham_troglodyte', 'exham_troglodyte'] }),
    ],
    links: [link('stairs', 'hall', 'shortcut')],
  },
  {
    // The stair down from the gate to the laboratory's vault is barred below; the way down is by the cistern, the cells and the dungeon.
    id: 'alchemist_cellars', name: 'Cellars of the Castle', region: 'hub', rooms: [
      room('gate', 'corridor', undefined, 'e'),
      room('cistern', 'well', 'gate', 's', { spawns: ['rat_swarm'] }),
      room('cellarway', 'corridor', 'cistern', 's', { spawns: ['rat_swarm', 'rat_swarm'] }),
      stair('well_stair', 'cellarway', 'w', -4),
      room('cells', 'hall', 'well_stair', 'w', { lurk: ['reanimated_corpse', 'reanimated_corpse'] }),
      room('dungeon', 'corridor', 'cells', 'n', { spawns: ['exham_troglodyte', 'rat_swarm'] }),
      room('vault', 'corridor', 'dungeon', 'n', { spawns: ['exham_troglodyte'] }),
      room('armoury', 'hall', 'vault', 'n', { spawns: ['exham_troglodyte', 'exham_troglodyte'] }),
      room('laboratory', 'hall', 'vault', 'w', { wide: true, boss: ['charles_le_sorcier'], tome: { name: "Michel Mauvais's Notes", insight: 1 } }),
      stair('down', 'vault', 'e', 4), // up to its barred head at the gate
    ],
    links: [link('down', 'gate', 'shortcut')],
  },
  {
    // The climb from the bone-room to the mirror's antechamber is barred above; the way up is by the catacomb and the niches.
    id: 'outsider_crypt', name: 'The Crypt Below the Castle', region: 'hub', rooms: [
      room('door', 'corridor', undefined, 'n'),
      room('bones', 'hall', 'door', 's', { spawns: ['exham_troglodyte', 'exham_troglodyte'] }),
      room('nave', 'corridor', 'bones', 'w', { spawns: ['rat_swarm'] }),
      room('shaft', 'well', 'nave', 'w'),
      room('catacomb', 'corridor', 'bones', 'e', { spawns: ['exham_troglodyte', 'being_from_beyond'] }),
      room('niches', 'hall', 'catacomb', 'e', { lurk: ['reanimated_corpse', 'reanimated_corpse'] }),
      stair('rise', 'niches', 's', 4),
      room('gallery', 'corridor', 'rise', 's', { spawns: ['exham_troglodyte'] }),
      room('cloister', 'corridor', 'gallery', 'w'),
      room('antechamber', 'corridor', 'cloister', 'w', { words: 'THE MIRROR' }),
      room('mirror', 'hall', 'antechamber', 's', { wide: true, boss: ['the_outsider'], vial: 'Silver Vial of the Mirror Room' }),
      stair('climb', 'antechamber', 'n', -4), // down to its barred foot in the bone-room
    ],
    links: [link('climb', 'bones', 'shortcut')],
  },
  {
    // The grave's stair down to the ossuary is barred below; the way down is through the tombs and the mausoleum.
    id: 'hound_churchyard', name: 'The Old Churchyard', region: 'arkham', rooms: [
      room('lychgate', 'corridor', undefined, 'n', { spawns: ['reanimated_corpse'] }),
      room('tombs', 'corridor', 'lychgate', 'e', { spawns: ['ghoul'] }),
      room('mausoleum', 'hall', 'tombs', 'e', { spawns: ['ghoul', 'ghoul'] }),
      stair('vault_steps', 'mausoleum', 's', -4),
      room('catacomb', 'corridor', 'vault_steps', 's', { lurk: ['ghoul'] }),
      room('robbers', 'corridor', 'catacomb', 'w', { spawns: ['reanimated_corpse'] }),
      room('ossuary', 'pit', 'robbers', 'w', { spawns: ['rat_swarm', 'reanimated_corpse'] }),
      room('charnel', 'hall', 'ossuary', 'w', { hidden: { minInsight: 2 }, tome: { name: "St John's Diary", insight: 1 } }),
      room('coffin', 'hall', 'ossuary', 's', { wide: true, boss: ['the_hound'], vial: 'Silver Vial of the Jade Amulet' }),
      stair('grave', 'ossuary', 'n', 4), // up to its barred head at the lychgate
    ],
    links: [link('grave', 'lychgate', 'shortcut')],
  },
  {
    // A low house: the way to the attic is round by the back rooms and up the back stair, and its landing drops back into the stair hall.
    id: 'deserted_house', name: 'The Deserted House', region: 'arkham', rooms: [
      room('porch', 'corridor', undefined, 'w'),
      room('front_room', 'hall', 'porch', 'e', { spawns: ['reanimated_corpse', 'moon_bog_wraith'] }),
      room('stair_hall', 'corridor', 'front_room', 'e'),
      room('back_room', 'corridor', 'front_room', 'n', { spawns: ['rat_swarm'] }),
      room('kitchen', 'hall', 'back_room', 'n', { spawns: ['reanimated_corpse'] }),
      stair('attic_stair', 'kitchen', 'e', LINK.dropMost),
      room('upstairs', 'corridor', 'attic_stair', 'e', { spawns: ['rat_swarm'] }),
      room('bedroom', 'hall', 'upstairs', 's', { lurk: ['moon_bog_wraith'] }),
      room('landing', 'corridor', 'bedroom', 's'),
      room('attic', 'hall', 'landing', 'e', { wide: true, boss: ['the_unnamable'], tome: { name: __DEMO__ ? "Keziah's Formulae" : "Carter's Account", insight: 1 } }),
      stair('cellar_stair', 'front_room', 's', -4),
      room('cellar', 'hall', 'cellar_stair', 's', { spawns: ['moon_bog_wraith', 'moon_bog_wraith'] }),
    ],
    links: [link('landing', 'stair_hall', 'drop')],
  },
  {
    // The steps down from the slab to the passage before the vault are barred below; the way down is by the reeds and the bone pit.
    id: 'swamp_tomb', name: 'The Tomb in the Swamp', region: 'arkham', rooms: [
      room('slab', 'corridor', undefined, 's', { spawns: ['moon_bog_wraith'] }),
      room('reeds', 'corridor', 'slab', 'e', { spawns: ['rat_swarm'] }),
      room('sunken_door', 'corridor', 'reeds', 'e', { spawns: ['moon_bog_wraith'] }),
      stair('drowned_steps', 'sunken_door', 'n', -5),
      room('bone_pit', 'pit', 'drowned_steps', 'n', { spawns: ['rat_swarm', 'rat_swarm'] }),
      room('side_vault', 'corridor', 'bone_pit', 'w', { lurk: ['reanimated_corpse'] }),
      room('passage', 'corridor', 'side_vault', 'w', { spawns: ['rat_swarm', 'reanimated_corpse'] }),
      room('flooded', 'corridor', 'passage', 'w', { spawns: ['moon_bog_wraith'] }),
      room('vault', 'hall', 'passage', 'n', { wide: true, boss: ['voice_in_the_tomb'], vial: 'Silver Vial of the Telephone Wire' }),
      stair('steps', 'passage', 's', 5), // up to its barred head under the slab
    ],
    links: [link('steps', 'slab', 'shortcut')],
  },
  {
    // The cellar door is the house's, as the tale has it; above, the back stair climbs to the bedroom, and the gable drops back into the parlour.
    id: 'shunned_cellar', name: 'The Shunned House', region: 'providence', rooms: [
      room('doorway', 'corridor', undefined, 'e', { spawns: ['ghoul'] }),
      room('parlour', 'hall', 'doorway', 'n', { spawns: ['ghoul', 'cthulhu_cultist'] }),
      room('stairwell', 'corridor', 'parlour', 'w', { lurk: ['ghoul'] }),
      stair('upstairs', 'stairwell', 'n', LINK.dropMost),
      room('bedroom', 'hall', 'upstairs', 'n', { spawns: ['cthulhu_cultist'] }),
      room('upper_landing', 'corridor', 'bedroom', 'e', { spawns: ['ghoul'] }),
      room('gable', 'corridor', 'upper_landing', 's'),
      stair('cellar_stair', 'doorway', 'w', -4),
      room('cellar', 'hall', 'cellar_stair', 'w', { wide: true, boss: ['shunned_house_entity'], vial: 'Silver Vial of the Nitre Stain' }),
      room('nitre', 'corridor', 'cellar', 's', { spawns: ['ghoul'] }),
      room('grave', 'pit', 'nitre', 's', { spawns: ['ghoul', 'ghoul'], words: 'THE SHAPE IN THE NITRE' }),
    ],
    links: [link('gable', 'parlour', 'drop')],
  },
  {
    // The trapdoor's stair down from the dance hall to the quay is barred below; the way down is the back stair, the crypt, the sewer and the canal.
    id: 'red_hook_vaults', name: 'The Vaults under Red Hook', region: 'providence', rooms: [
      room('dance_hall', 'hall', undefined, 'n', { spawns: ['cthulhu_cultist', 'cthulhu_cultist'] }),
      room('bar', 'corridor', 'dance_hall', 'e', { spawns: ['cthulhu_cultist', 'cthulhu_cultist'] }),
      room('back_stair', 'corridor', 'dance_hall', 'w', { spawns: ['cthulhu_cultist', 'winged_hybrid'] }),
      stair('lower_steps', 'back_stair', 'w', -5),
      room('crypt', 'hall', 'lower_steps', 'w', { spawns: ['ghoul', 'ghoul'] }),
      room('sewer', 'corridor', 'crypt', 's', { lurk: ['ghoul'] }),
      room('canal_head', 'corridor', 'sewer', 's', { spawns: ['cthulhu_cultist'] }),
      room('canal', 'bridge', 'canal_head', 'e', { spawns: ['cthulhu_cultist'] }),
      room('landing_stage', 'corridor', 'canal', 'e'),
      room('quay', 'corridor', 'landing_stage', 'e', { words: "LILITH'S SHRINE" }),
      room('shrine', 'hall', 'quay', 's', { wide: true, boss: ['lilith'], tome: { name: "Suydam's Papers", insight: 1 } }),
      stair('trapdoor', 'quay', 'n', 5), // up to its barred head in the dance hall
    ],
    links: [link('trapdoor', 'dance_hall', 'shortcut')],
  },
  {
    // The front hall's door to the gate is barred on the hall's side; the way to it is round by the garden, the well-yard and the kitchen.
    id: 'old_man_house', name: "The Old Captain's House", region: 'providence', rooms: [
      room('gate', 'corridor', undefined, 'w', { spawns: ['cthulhu_cultist'] }),
      room('garden', 'corridor', 'gate', 'n', { spawns: ['winged_hybrid'] }),
      room('well_yard', 'hall', 'garden', 'n', { spawns: ['cthulhu_cultist'] }),
      room('kitchen', 'corridor', 'well_yard', 'e', { lurk: ['ghoul'] }),
      stair('stair', 'kitchen', 'n', 4),
      room('upper', 'corridor', 'stair', 'n', { spawns: ['cthulhu_cultist', 'ghoul'] }),
      room('pantry', 'corridor', 'kitchen', 's', { spawns: ['cthulhu_cultist'] }),
      room('front_hall', 'hall', 'pantry', 's', { words: 'THE TERRIBLE OLD MAN' }),
      room('bottles', 'hall', 'front_hall', 'e', { wide: true, boss: ['terrible_old_man'], vial: 'Silver Vial of the Pendulum Bottle' }),
    ],
    links: [link('front_hall', 'gate', 'shortcut')],
  },
  {
    // The loft stair up from the kitchen is barred at the top; the way up is through the shed, the barn and the stalls to the hayloft.
    id: 'whateley_farm', name: 'The Whateley Farmhouse', region: 'dunwich', rooms: [
      room('yard', 'corridor', undefined, 's', { spawns: ['thousand_young'] }),
      room('shed', 'corridor', 'yard', 'e', { spawns: ['martense_degenerate'] }),
      room('barn', 'hall', 'shed', 'e', { spawns: ['thousand_young', 'martense_degenerate', 'martense_degenerate'] }),
      room('stalls', 'corridor', 'barn', 'n', { lurk: ['thousand_young'] }),
      stair('hay_stair', 'stalls', 'n', 4),
      room('hayloft', 'corridor', 'hay_stair', 'n', { spawns: ['martense_degenerate'] }),
      room('garret', 'corridor', 'hayloft', 'w', { spawns: ['thousand_young'] }),
      room('landing', 'corridor', 'garret', 'w', { words: 'THE BOARDED UPSTAIRS' }),
      room('upstairs', 'hall', 'landing', 'n', { wide: true, boss: ['wilbur_whateley'], vial: 'Silver Vial of the Boarded Rooms' }),
      stair('loft', 'landing', 's', -4), // down to its barred foot in the kitchen
      room('kitchen', 'hall', 'yard', 'n', { weapon: 'axe' }),
      room('boarded', 'corridor', 'kitchen', 'w', { spawns: ['thousand_young'], words: 'THE BOARDED ROOMS' }),
    ],
    links: [link('loft', 'kitchen', 'shortcut')],
  },
  {
    // The stairs up from the parlour to the study's landing are barred at the top; the way up is down through the cellar and up the servants' stair.
    id: 'waite_house', name: 'The Waite House', region: 'innsmouth', rooms: [
      room('stoop', 'corridor', undefined, 'n', { spawns: ['innsmouth_hybrid'] }),
      room('parlour', 'hall', 'stoop', 's', { spawns: ['deep_one', 'innsmouth_hybrid'] }),
      room('library', 'corridor', 'parlour', 'e', { spawns: ['innsmouth_hybrid'] }),
      room('laboratory', 'hall', 'library', 'e', { hidden: { minInsight: 2 }, tome: { name: "Asenath's Notes", insight: 1 } }),
      stair('cellar_stair', 'parlour', 'w', -4),
      room('cellar', 'hall', 'cellar_stair', 'w', { spawns: ['deep_one', 'deep_one'] }),
      stair('servants_stair', 'cellar', 's', 8),
      room('servant_hall', 'corridor', 'servants_stair', 's', { lurk: ['innsmouth_hybrid'] }),
      room('dressing_room', 'corridor', 'servant_hall', 'e', { spawns: ['deep_one'] }),
      room('landing', 'corridor', 'dressing_room', 'e'),
      room('study', 'hall', 'landing', 's', { wide: true, boss: ['ephraim_waite'], vial: 'Silver Vial of the Thing on the Doorstep' }),
      stair('stairs', 'landing', 'n', -4), // down to its barred foot in the parlour
    ],
    links: [link('stairs', 'parlour', 'shortcut')],
  },
  {
    // The turret stair up from the foot is barred at the top; the way up is through the gallery and the atrium to the terrace and the loggia.
    id: 'sculptor_studio', name: "The Sculptor's Tower", region: 'dreamlands', rooms: [
      room('foot', 'corridor', undefined, 's', { spawns: ['zoog'] }),
      room('gallery', 'hall', 'foot', 'e', { spawns: ['zoog', 'zoog', 'cat_from_saturn'] }),
      room('atrium', 'corridor', 'gallery', 'e', { spawns: ['zoog'] }),
      stair('outer_stair', 'atrium', 'n', 5),
      room('terrace', 'hall', 'outer_stair', 'n', { spawns: ['gnorri'] }),
      room('loggia', 'corridor', 'terrace', 'w', { lurk: ['zoog', 'zoog'] }),
      room('landing', 'corridor', 'loggia', 'w'),
      room('studio', 'hall', 'landing', 'n', { wide: true, boss: ['hypnos'], vial: 'Silver Vial of the Laurel Head' }),
      stair('turret', 'landing', 's', -5), // down to its barred foot
      room('garden', 'corridor', 'foot', 'w', { spawns: ['gnorri'] }),
      room('fountain', 'well', 'garden', 'w'),
    ],
    links: [link('turret', 'foot', 'shortcut')],
  },
  {
    // The first flight up from the street is barred at its head; the way up is through the alley and the lodging and up the back stair.
    id: 'rue_dauseil', name: "The Rue d'Auseil", region: 'beyond', rooms: [
      room('street', 'corridor', undefined, 's', { spawns: ['yekubian'] }),
      room('alley', 'corridor', 'street', 'e', { spawns: ['being_from_beyond'] }),
      room('lodging', 'hall', 'alley', 'e', { spawns: ['yekubian', 'being_from_beyond'] }),
      stair('back_stair', 'lodging', 'n', 4),
      room('landlord', 'corridor', 'back_stair', 'n', { lurk: ['yekubian'] }),
      room('hallway', 'corridor', 'landlord', 'w'),
      room('stairhead', 'corridor', 'hallway', 'w'),
      stair('second_flight', 'stairhead', 'n', 4, { spawns: ['dhole'] }),
      room('garret', 'hall', 'second_flight', 'n', { wide: true, boss: ['zann_window_thing'], vial: 'Silver Vial of the Viol' }),
      stair('first_flight', 'stairhead', 's', -4), // down to its barred foot in the street
    ],
    links: [link('first_flight', 'street', 'shortcut')],
  },
];
