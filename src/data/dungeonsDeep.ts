/**
 * The deep world's legacy dungeons (split from dungeons.ts in round 125): the Elder Thing city, the Great Race's archives, Tsath, the
 * Stairs of Slumber and the way from Ulthar to Kadath, as room graphs over the primitive kit, with the second ways that close them into
 * loops (round 125: docs/LEVEL_DESIGN.md; the Stairs of Slumber keep their one descent, as the tale counts its steps). Data only.
 */

import type { Dir, DungeonDef, RoomDef, Veil } from './dungeons';
import type { KitId } from './kits';
import { link, room, stair } from './roomBuild';
import { SEALS } from './tuning';

/** The Stairs of Slumber's flights (round 104): risers of 16 cm, seventy steps of light slumber in two flights, seven hundred of deeper slumber in fourteen. */
export const SLUMBER_STEPS = { riser: 0.16, light: 35, deep: 50 } as const;
const LIGHT_FLIGHT = -SLUMBER_STEPS.riser * SLUMBER_STEPS.light;
const DEEP_FLIGHT = -SLUMBER_STEPS.riser * SLUMBER_STEPS.deep;
/** A flight of the seven hundred steps (round 104): over the void, its words said as it is entered, its kit by depth, and (rounds 120, 121) what waits on it, if anything; (round 123) the veil on the way into it. */
const deep = (id: string, from: string, dir: Dir, o: { words?: string; kit?: KitId; foes?: readonly string[]; hidden?: Veil } = {}): RoomDef =>
  stair(id, from, dir, DEEP_FLIGHT, { steps: SLUMBER_STEPS.deep, abyss: true, kit: o.kit ?? 'dreamdeep', ...(o.foes?.length && { spawns: o.foes }), ...(o.words && { words: o.words }), ...(o.hidden && { hidden: o.hidden }) });


export const DEEP_DUNGEONS: readonly DungeonDef[] = [
  {
    // Round 125: the ramp down from the plaza's sign is barred at its head, and the way to the abyss is the long one: up the spire to
    // the observatory, down the deep stair beyond it to the hatchery, east through the tunnels and the warren to the gallery at the
    // span. From the gallery the ramp climbs to its bar; lifted, the shoggoth is four rooms from the sign, and the way out is short.
    id: 'elder_city', name: 'Elder Thing City', region: 'mountains', rooms: [
      room('gate', 'corridor', undefined, 's'),
      room('plaza', 'hall', 'gate', 'n', { sign: { id: 'mountains_city', name: 'Elder Thing City' } }),
      room('arcade', 'corridor', 'plaza', 'w', { spawns: ['albino_penguin', 'elder_thing'] }),
      stair('spire', 'arcade', 'w', 4),
      room('observatory', 'hall', 'spire', 'w', { spawns: ['gnoph_keh'], words: 'THE STAR-HEADED CITY' }),
      stair('deep_stair', 'observatory', 'n', -8, { spawns: ['elder_thing'] }),
      room('hatchery', 'pit', 'deep_stair', 'n', { spawns: ['elder_thing'] }),
      room('tunnels', 'corridor', 'hatchery', 'e', { spawns: ['albino_penguin', 'albino_penguin', 'albino_penguin'] }),
      room('warren', 'corridor', 'tunnels', 'e', { lurk: ['elder_thing'] }),
      room('gallery', 'corridor', 'warren', 'e', { spawns: ['albino_penguin', 'albino_penguin'] }),
      room('span', 'bridge', 'gallery', 'n'),
      room('abyss', 'hall', 'span', 'n', { wide: true, boss: ['shoggoth'], variant: 'boss' }),
      stair('ramp', 'gallery', 's', 4, { spawns: ['elder_thing', 'elder_thing'] }), // up to its barred head in the plaza
      room('murals', 'hall', 'plaza', 'e', { tome: { name: 'Elder Thing Murals', insight: 1 }, spawns: ['gnoph_keh'] }),
      room('frieze', 'corridor', 'murals', 'n', { spawns: ['elder_thing'] }),
      room('sketches', 'hall', 'frieze', 'n', { hidden: { minInsight: 4 }, tome: { name: "Danforth's Sketches", insight: 1 } }),
    ],
    links: [link('ramp', 'plaza', 'shortcut')],
  },
  {
    // Round 125: the reading hall keeps its sign (Peaslee's: "past the reading hall"), and the way down past it is round by the catalogue,
    // the hall of machines and the gallery to the trapdoor, down to the deep passage at the walled-in vault (the basalt deeps below the
    // trapdoor are a corner of their own). From the deep passage the return stair climbs to a door barred into the reading hall.
    id: 'archives', name: 'Archives of the Great Race', region: 'pnakotus', rooms: [
      room('stacks', 'corridor', undefined, 'e'),
      room('annex', 'corridor', 'stacks', 'n', { spawns: ['nameless_city_reptile'] }),
      room('reading', 'hall', 'stacks', 'w', { sign: { id: 'pnakotus_archives', name: 'Archive Reading Hall' }, ally: 'yithian_archivist' }),
      room('shelves', 'corridor', 'reading', 's', { spawns: ['nameless_city_reptile', 'nameless_city_reptile'] }),
      room('earth_race', 'hall', 'shelves', 's', { hidden: { minInsight: 4 }, tome: { name: 'The Case of the Earth Race', insight: 1 } }),
      room('catalogue', 'corridor', 'reading', 'n', { spawns: ['yithian'] }),
      room('machines', 'hall', 'catalogue', 'n', { spawns: ['yithian', 'hybrid_mummy'], words: 'THE HALL OF MACHINES' }),
      room('gallery', 'corridor', 'machines', 'w', { lurk: ['nameless_city_reptile'] }),
      room('trapdoor', 'well', 'gallery', 'w', { spawns: ['flying_polyp'] }),
      stair('shaft', 'trapdoor', 'n', -8, { spawns: ['hybrid_mummy'] }),
      room('basalt', 'corridor', 'shaft', 'n', { spawns: ['hybrid_mummy', 'hybrid_mummy'], words: 'THE BASALT DEEPS' }),
      stair('down', 'trapdoor', 's', -4, { spawns: ['yithian'] }),
      room('deep', 'corridor', 'down', 's', { spawns: ['nameless_city_reptile'], tome: { name: 'Pnakotic Manuscripts', insight: 1 } }),
      room('sill', 'corridor', 'deep', 's', { spawns: ['nameless_city_reptile'] }), // (the vault a cell south of the stair: a wall between a sunk hall and a stair rose over the hall's heap)
      room('vault', 'hall', 'sill', 'w', { wide: true, boss: ['flying_polyp'], variant: 'boss' }),
      stair('return', 'deep', 'e', 4), // up to its barred head in the reading hall
    ],
    links: [link('return', 'reading', 'shortcut')],
  },
  {
    // Round 125: the temple stands north of the avenue's sign, its door into the avenue barred on the temple's side; the way to it is
    // down through Yoth and red-litten Yoth, along the dark way and up into the cloister, where the serpent folk wait (a grille in the
    // cloister looks down into the Yoth pit). Past the temple, the temple stair and the span go down to N'kai, as Zamacona says.
    id: 'tsath', name: 'Tsath', region: 'kn_yan', rooms: [
      room('blue_gate', 'corridor', undefined, 's', { spawns: ['kn_yan_dweller', 'kn_yan_dweller'] }),
      room('guardhouse', 'hall', 'blue_gate', 'w', { spawns: ['ym_bhi', 'kn_yan_dweller'] }),
      room('avenue', 'hall', 'blue_gate', 'n', { sign: { id: 'knyan_tsath', name: 'Avenue of Tsath' } }),
      room('market', 'hall', 'avenue', 'e', { spawns: ['kn_yan_dweller', 'kn_yan_dweller', 'ym_bhi'] }),
      room('baths', 'corridor', 'market', 'e', { spawns: ['serpent_man'] }),
      room('yoth', 'pit', 'avenue', 'w', { spawns: ['gyaa_yothn'] }),
      stair('yoth_steps', 'yoth', 'w', -4, { spawns: ['beast_in_the_cave'] }),
      room('red_yoth', 'hall', 'yoth_steps', 'w', { spawns: ['gyaa_yothn', 'serpent_man'], words: 'RED-LITTEN YOTH' }),
      room('serpent_vault', 'corridor', 'red_yoth', 'w', { hidden: { minInsight: 4 }, tome: { name: "Zamacona's Manuscript", insight: 1 } }),
      room('dark_way', 'corridor', 'red_yoth', 'n', { spawns: ['beast_in_the_cave'] }),
      stair('rise', 'dark_way', 'e', 4),
      room('cloister', 'corridor', 'rise', 'e', { lurk: ['serpent_man', 'serpent_man'] }),
      room('temple', 'hall', 'cloister', 'e', { spawns: ['kn_yan_dweller'], words: 'THE TEMPLE OF TSATH' }),
      stair('temple_stair', 'temple', 'n', -4),
      room('span', 'bridge', 'temple_stair', 'n'),
      room('nkai', 'hall', 'span', 'n', { wide: true, boss: ['tsathoggua'] }),
    ],
    links: [link('temple', 'avenue', 'shortcut'), link('cloister', 'yoth', 'window')],
  },
  {
    id: 'slumber', name: 'Stairs of Slumber', region: 'slumber_stairs', sealed: true, rooms: [ // (round 123: a realm of their own, data/regions.ts)
      // Round 12: the descent was a 30-second walk through nine empty rooms. Now it is said as it goes,
      // and the dream's lesser things wait on the flights. Round 104: the steps are as many as the tale says, each one cut:
      // seventy (two flights of 35, risers of 16 cm) to the Cavern of Flame, then seven hundred (fourteen flights of 50) down a
      // switchback, across a span over the dreamless dark, to the Gate of Deeper Slumber. Round 120 (asked: the 44 foes made the
      // descent a gauntlet run at a sprint on potions) left six lone things in the mist; round 121 (asked: "way too few", 15 to 25)
      // sets twenty: one or two on a flight, three at a landing, worse the deeper, and never more than two rooms in a row hold any. Round 122
      // (asked: no notice every fifty steps, only at the important places): the words name the two stairs, the cavern and the gate alone.
      room('threshold', 'hall', undefined, 'n'),
      stair('light_1', 'threshold', 'n', LIGHT_FLIGHT, { steps: 35, abyss: true, words: 'THE SEVENTY STEPS OF LIGHT SLUMBER', spawns: ['zoog'] }),
      stair('light_2', 'light_1', 'n', LIGHT_FLIGHT, { steps: 35, abyss: true, spawns: ['zoog', 'zoog'] }),
      // Round 123 (asked: the priests must not be stuck anywhere when first come to; "it should have a fixed location in the cavern and you need to talk
      // to them to progress further down the steps and then they follow and help you"): they stand between their effigies before the way on down, and
      // that way is sealed until they are spoken with (`met`); then they go with the investigator (systems/allyTrail.ts).
      room('cavern', 'hall', 'light_2', 'n', { wide: true, sign: { id: 'dream_cavern', name: 'Cavern of Flame' }, ally: 'nasht_kaman_thah', allyAt: [0, 13], words: 'THE CAVERN OF FLAME', kit: 'dreamflame' }),
      deep('deep_1', 'cavern', 'n', { words: 'THE SEVEN HUNDRED STEPS OF DEEPER SLUMBER', hidden: { met: 'nasht' } }),
      deep('deep_2', 'deep_1', 'n', { foes: ['night_gaunt'] }),
      deep('deep_3', 'deep_2', 'n', { foes: ['ghoul'] }),
      deep('deep_4', 'deep_3', 'n', ),
      room('landing_1', 'hall', 'deep_4', 'n', { kit: 'dreamdeep', spawns: ['ghast', 'ghoul', 'zoog'] }),
      deep('deep_5', 'landing_1', 'n'),
      deep('deep_6', 'deep_5', 'n', { foes: ['wamp', 'wamp'] }),
      deep('deep_7', 'deep_6', 'n', { foes: ['man_of_leng'] }),
      room('turn_1', 'hall', 'deep_7', 'n', { kit: 'dreamdeep' }),
      room('span', 'bridge', 'turn_1', 'e', { kit: 'dreamabyss', spawns: ['night_gaunt'] }),
      room('turn_2', 'hall', 'span', 'e', { kit: 'dreamabyss' }),
      deep('deep_8', 'turn_2', 's', { kit: 'dreamabyss', foes: ['ghast'] }),
      deep('deep_9', 'deep_8', 's', { kit: 'dreamabyss' }),
      deep('deep_10', 'deep_9', 's', { kit: 'dreamabyss', foes: ['being_of_ib'] }),
      room('landing_2', 'hall', 'deep_10', 's', { kit: 'dreamabyss', spawns: ['moon_beast', 'ghast', 'ghast'] }),
      deep('deep_11', 'landing_2', 's', { kit: 'dreamabyss' }),
      deep('deep_12', 'deep_11', 's', { kit: 'dreamabyss', foes: ['man_of_leng', 'ghoul'] }),
      deep('deep_13', 'deep_12', 's', { kit: 'dreamabyss' }),
      deep('deep_14', 'deep_13', 's', { kit: 'dreamabyss', foes: ['moon_beast'] }),
      room('deeper', 'hall', 'deep_14', 's', { kit: 'dreamabyss', gate: { id: 'dream_deeper', name: 'Gate of Deeper Slumber', to: 'dream_wood_gate' }, words: 'THE GATE OF DEEPER SLUMBER' }),
    ],
  },
  {
    id: 'ulthar_kadath', name: 'Ulthar to Kadath', region: 'dreamlands', rooms: [
      room('ulthar_gate', 'corridor', undefined, 's'),
      room('ulthar', 'hall', 'ulthar_gate', 'n', { sign: { id: 'dream_ulthar', name: 'Ulthar' }, ally: 'cats_of_ulthar' }),
      room('cats_lane', 'corridor', 'ulthar', 'w', { spawns: ['cat_from_saturn'] }),
      room('elder_temple', 'hall', 'cats_lane', 'w', { tome: { name: 'The Pnakotic Fragments', insight: 1 }, spawns: ['zoog', 'zoog'], words: 'THE TEMPLE OF THE ELDER ONES' }),
      // Round 125: the road north out of Ulthar is barred on the road's side; the way to it is east by the docks and the wharf, where the
      // black galleys of the men of Leng tie up, and through Dylath-Leen. Lifted, Leng is a climb from Ulthar's sign.
      room('docks', 'corridor', 'ulthar', 'e', { spawns: ['zoog'] }),
      room('wharf', 'hall', 'docks', 'e', { spawns: ['moon_beast', 'zoog'] }),
      room('galleys', 'corridor', 'wharf', 'n', { lurk: ['man_of_leng'], words: 'THE BLACK GALLEYS' }),
      room('dylath_leen', 'hall', 'galleys', 'w', { spawns: ['moon_beast', 'man_of_leng'], words: 'DYLATH-LEEN' }),
      room('road', 'corridor', 'dylath_leen', 'w', { spawns: ['zoog', 'zoog'] }),
      stair('leng_climb', 'road', 'n', 5),
      room('leng', 'hall', 'leng_climb', 'n', { wide: true, boss: ['high_priest'], spawns: ['man_of_leng'] }),
      room('monastery', 'corridor', 'leng', 'n', { spawns: ['man_of_leng', 'man_of_leng'] }),
      room('zin_steps', 'stair', 'leng', 'e', { rise: -5, spawns: ['gug', 'ghast'] }),
      room('zin', 'pit', 'zin_steps', 'e', { sign: { id: 'dream_zin', name: 'Vaults of Zin' }, ally: 'pickman' }),
      room('gug_city', 'hall', 'zin', 's', { spawns: ['gug', 'ghast', 'ghast'], words: 'THE CITY OF THE GUGS' }),
      stair('koth', 'gug_city', 's', 5, { spawns: ['ghast'], words: 'THE TOWER OF KOTH' }),
      room('koth_top', 'corridor', 'koth', 's', { spawns: ['zoog', 'zoog', 'ghoul'] }),
      room('zin_span', 'bridge', 'zin', 'e'),
      stair('kadath_climb', 'zin_span', 'e', 6),
      room('kadath', 'hall', 'kadath_climb', 'e', {
        wide: true, boss: ['great_ones'], gate: { id: 'dream_ultimate', name: 'The Ultimate Gate', to: 'beyond_gate' },
        hidden: { minSeals: SEALS.kadath }, // the Great Ones' door: sealed until the waking world's horrors fall (round 12)
      }),
    ],
    links: [link('road', 'ulthar', 'shortcut')],
  },
];
