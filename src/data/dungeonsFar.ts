/**
 * The dungeons of the far realms (split from dungeons.ts in playtest round 24): Risen R'lyeh, the
 * Mi-Go Cities of Yuggoth and the Ultimate Void beyond. Room graphs like the others'.
 */

import type { DungeonDef } from './dungeons';
import { link, room, stair } from './roomBuild';

export const FAR_DUNGEONS: readonly DungeonDef[] = [
  {
    id: 'risen_rlyeh', name: "Risen R'lyeh", region: 'rlyeh', rooms: [
      room('shore', 'corridor', undefined, 's'),
      room('tide_pools', 'corridor', 'shore', 'e', { spawns: ['deep_one', 'deep_one'] }),
      stair('drowned_stair', 'tide_pools', 'e', -4, { spawns: ['dagon_priest'] }),
      room('sunken_court', 'hall', 'drowned_stair', 'e', { spawns: ['deep_one', 'innsmouth_hybrid', 'star_spawn'], words: 'THE SUNKEN COURT' }),
      room('angles', 'hall', 'shore', 'n', { spawns: ['deep_one', 'star_spawn'] }),
      room('crypts', 'well', 'angles', 'w', { spawns: ['cthulhu_cultist'] }),
      room('star_tomb', 'corridor', 'crypts', 'w', { spawns: ['star_spawn'] }),
      room('monolith', 'hall', 'star_tomb', 's', { hidden: { minInsight: 5 }, tome: { name: "Johansen's Narrative", insight: 1 } }),
      room('wrong', 'bridge', 'angles', 'e', { hidden: { maxSanity: 40 } }),
      room('reliquary', 'hall', 'wrong', 'e', { tome: { name: "R'lyehian Tablet", insight: 1 } }),
      stair('climb', 'angles', 'n', 4),
      // Round 127: Mu lies beyond its antechamber, and the way to it from the vestibule's sign is the angled one: west along the
      // gallery into the leaning hall, up the tilted stair to the angle-top and down again to the antechamber. The antechamber's
      // passage comes back south to a door barred into the vestibule: lifted, Ghatanothoa is two rooms from the sign.
      room('vestibule', 'corridor', 'climb', 'n', { sign: { id: 'rlyeh_vestibule', name: 'Vestibule of Mu' } }),
      room('angled_gallery', 'corridor', 'vestibule', 'w', { spawns: ['star_spawn', 'cthulhu_cultist'] }),
      room('leaning_hall', 'hall', 'angled_gallery', 'w', { lurk: ['cthulhu_cultist', 'deep_one'], words: 'THE ANGLES ARE WRONG' }),
      stair('tilted_stair', 'leaning_hall', 'n', 4, { spawns: ['deep_one'] }),
      room('angle_top', 'corridor', 'tilted_stair', 'n', { spawns: ['star_spawn'] }),
      stair('descent', 'angle_top', 'e', -4),
      room('antechamber', 'corridor', 'descent', 'e', { words: 'THE TOMB OF MU' }),
      room('mu', 'hall', 'antechamber', 'n', { wide: true, boss: ['ghatanothoa'] }),
      room('passage', 'corridor', 'antechamber', 's'),
    ],
    links: [link('passage', 'vestibule', 'shortcut')],
  },
  {
    id: 'migo_cities', name: 'Mi-Go Cities', region: 'yuggoth', rooms: [
      room('landing', 'corridor', undefined, 'w', { spawns: ['mi_go', 'mi_go'] }),
      room('docks', 'corridor', 'landing', 'n', { spawns: ['mi_go'] }),
      room('fungus', 'hall', 'landing', 'e', { sign: { id: 'yuggoth_cities', name: 'Fungoid Cities' } }),
      room('hive', 'corridor', 'fungus', 's', { spawns: ['mi_go', 'yekubian'] }),
      room('surgery', 'hall', 'hive', 's', { spawns: ['mi_go', 'mi_go', 'being_from_beyond'], words: 'THE SURGERY OF THE OUTER ONES' }),
      room('brain_rack', 'corridor', 'surgery', 'e', { hidden: { minInsight: 5 }, tome: { name: "The Outer Ones' Ledger", insight: 1 } }),
      room('pits', 'pit', 'fungus', 'n', { spawns: ['venusian_man_lizard'] }),
      room('spore_field', 'hall', 'pits', 'n', { spawns: ['venusian_man_lizard', 'venusian_man_lizard'] }),
      room('pitch_bridge', 'bridge', 'spore_field', 'n', { spawns: ['mi_go'] }),
      room('black_tower', 'hall', 'pitch_bridge', 'n', { spawns: ['yekubian', 'mi_go'], words: 'THE BLACK TOWERS' }),
      // Round 127: the cylinders' hall is reached the long way, north over the spore field and the pitch bridge to the black towers and
      // back south down the chute and the conduit to its antechamber; the antechamber's passage comes to a door barred into the Fungoid
      // Cities, beside the sign (Akeley's: the cities east of the landing).
      room('spire', 'corridor', 'black_tower', 'e', { spawns: ['mi_go'] }),
      room('chute', 'corridor', 'spire', 's', { lurk: ['mi_go'] }),
      room('conduit', 'hall', 'chute', 's', { spawns: ['mi_go', 'venusian_man_lizard'] }),
      room('antechamber', 'corridor', 'conduit', 's', { words: 'THE CYLINDERS' }),
      room('cylinders', 'hall', 'antechamber', 'e', { wide: true, boss: ['rhan_tegoth'] }),
      room('passage', 'corridor', 'antechamber', 's'),
    ],
    links: [link('passage', 'fungus', 'shortcut')],
  },
  {
    id: 'ultimate_void', name: 'The Ultimate Void', region: 'beyond', rooms: [
      room('first_gate', 'corridor', undefined, 's', { spawns: ['yekubian'] }),
      room('antechamber', 'hall', 'first_gate', 'n', { sign: { id: 'beyond_first', name: 'The First Gate' } }),
      room('drift', 'corridor', 'antechamber', 'w', { spawns: ['being_from_beyond', 'being_from_beyond'] }),
      room('spheres', 'well', 'drift', 'w', { spawns: ['dhole'] }),
      stair('eddies', 'spheres', 'w', -5),
      room('nadir', 'hall', 'eddies', 'w', { spawns: ['cat_from_saturn', 'cat_from_saturn', 'flying_polyp'], words: 'THE NADIR' }),
      room('lattice', 'corridor', 'antechamber', 'e', { spawns: ['being_from_beyond'], lurk: ['yekubian'] }), // (round 127: 'Umr's hall stays across the span north of the First Gate, the quest's own words: a bridge is entered only at its ends)
      room('mirrors', 'hall', 'lattice', 'e', { hidden: { maxSanity: 40 }, tome: { name: "The Silver Key's Inscription", insight: 2 } }),
      room('span', 'bridge', 'antechamber', 'n'), // round 70: the only way to 'Umr's hall, so no insight is asked of it (it was minInsight 3, and a mind that had spent its insight could not reach any ending)
      room('ultimate', 'hall', 'span', 'n', { wide: true, boss: ['umr_at_tawil'] }),
    ],
  },
];
