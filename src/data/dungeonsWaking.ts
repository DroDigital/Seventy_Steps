/**
 * The waking world's legacy dungeons (split from dungeons.ts in round 127): the University Library, the Witch House, Sentinel Hill,
 * Y'ha-nthlei, Curwen's catacombs, the Starry Wisdom church and Akeley's farmhouse, as room graphs over the primitive kit, with the
 * second ways that close them into loops (round 127: docs/LEVEL_DESIGN.md). Data only.
 */

import type { DungeonDef } from './dungeons';
import { link, room, stair } from './roomBuild';
import { LINK } from './tuning';

export const WAKING_DUNGEONS: readonly DungeonDef[] = [
  // Round 13: the dungeons were four to nine rooms in a line. Each now branches: side ways with foes
  // and an Echo cache at their ends, a secret or two behind a veil, and its own named places.
  // Insight is held, not spent to enter: 1 introduces the veil, 2 rewards early exploration,
  // 3 asks for experience of the waking horrors, 4 for the deep world's optional branches.
  // Far-realm secrets ask for 5 (dungeonsFar.ts); no boss or required route waits on insight.
  {
    // Round 127: the way down is round by the west stacks and the periodicals, and the sub-basement is crossed from the charnel pit to
    // the archive's sign; the lift stair behind the sign comes up to a barred door in the circulation room off the reading room, seen
    // shut on the way in and opened from below: then the sign is two rooms from the way out.
    id: 'library', name: 'University Library', region: 'hub', rooms: [
      room('foyer', 'hall', undefined, 's'),
      room('reading', 'hall', 'foyer', 'n', { spawns: ['exham_troglodyte'] }),
      room('circulation', 'corridor', 'reading', 'n', { words: 'THE CIRCULATION DESK' }),
      room('stacks_w', 'corridor', 'reading', 'w', { spawns: ['rat_swarm'] }),
      room('catalogue', 'corridor', 'stacks_w', 'w', { lurk: ['reanimated_corpse'] }),
      room('periodicals', 'hall', 'catalogue', 'n', { spawns: ['rat_swarm', 'exham_troglodyte'] }),
      room('stacks_e', 'corridor', 'reading', 'e'),
      room('restricted', 'hall', 'stacks_e', 'n', { hidden: { minInsight: 1 }, tome: { name: 'Necronomicon', insight: 2 } }),
      room('descent', 'stair', 'periodicals', 'n', { rise: -4, spawns: ['exham_troglodyte', 'rat_swarm'] }),
      room('charnel', 'pit', 'descent', 'n', { spawns: ['rat_swarm', 'rat_swarm'] }),
      room('sealed_stacks', 'corridor', 'charnel', 'w', { hidden: { maxSanity: 40 }, tome: { name: 'Liber Ivonis', insight: 1 } }),
      room('vaults', 'corridor', 'charnel', 'e', { spawns: ['exham_troglodyte', 'reanimated_corpse'], words: 'THE SUB-BASEMENT' }),
      room('archive', 'well', 'vaults', 'e', { sign: { id: 'hub_archive', name: 'Library Archive' } }),
      room('bindery', 'hall', 'archive', 'e', { spawns: ['exham_troglodyte', 'exham_troglodyte', 'rat_swarm'] }),
      stair('lift', 'archive', 's', 4), // the book lift's stair, up behind the sign to the circulation room
    ],
    links: [link('lift', 'circulation', 'shortcut')],
  },
  {
    // Round 127 (asked: the dungeons designed the way Souls levels are): the front stair is barred at its foot, and the first climb is
    // the servants' stair from the hallway, round through the lodgers' rooms to the landing (Peaslee's: the last quiet place, the closet
    // off it to the west, the garret above it); from there the front stair goes down to its bar, and lifted, the parlour and the landing
    // are a flight apart for good. The pantry's floor has rotted through into the cellar, where something waits by the sump.
    id: 'witch_house', name: 'The Witch House', region: 'arkham', rooms: [
      room('hallway', 'corridor', undefined, 'e'),
      room('parlour', 'hall', 'hallway', 'w', { spawns: ['rat_swarm', 'rat_swarm'], weapon: 'razor' }),
      room('kitchen', 'corridor', 'parlour', 'w', { lurk: ['reanimated_corpse'] }),
      room('pantry', 'hall', 'kitchen', 's', { spawns: ['rat_swarm', 'rat_swarm'] }),
      stair('back_stair', 'hallway', 'n', 4, { spawns: ['rat_swarm'], words: "THE SERVANTS' STAIR" }),
      room('lodgers', 'corridor', 'back_stair', 'n', { spawns: ['reanimated_corpse', 'rat_swarm'] }), // the lodgers' rooms, empty of lodgers
      room('dombrowski', 'hall', 'lodgers', 'e', { spawns: ['reanimated_corpse', 'rat_swarm', 'rat_swarm'] }),
      room('landing', 'hall', 'lodgers', 'w', { sign: { id: 'arkham_witch', name: 'Witch House Stair', rest: [-0.6, -3] } }),
      room('closet', 'hall', 'landing', 'w', { hidden: { minInsight: 1 }, tome: { name: "Keziah's Formulae", insight: 1 } }),
      room('garret', 'hall', 'landing', 'n', { wide: true, boss: ['keziah_mason', 'brown_jenkin'] }),
      stair('stair', 'landing', 's', -4, { spawns: ['reanimated_corpse'] }), // the front stair, down to its barred foot in the parlour
      stair('cellar', 'hallway', 's', -LINK.dropMost, { spawns: ['rat_swarm'] }), // round 12: the house was six rooms; the rats come up from below
      room('vault', 'hall', 'cellar', 's', { spawns: ['rat_swarm', 'rat_swarm', 'reanimated_corpse'], words: 'THE CELLAR' }),
      room('cistern', 'well', 'vault', 'w', { spawns: ['rat_swarm'] }),
      room('sump', 'corridor', 'cistern', 'w', { lurk: ['reanimated_corpse'] }),
      room('ratholes', 'corridor', 'vault', 's', { spawns: ['rat_swarm', 'reanimated_corpse'], words: 'THE RAT-HOLES' }),
      room('burrow', 'pit', 'ratholes', 's', { hidden: { minInsight: 2 }, tome: { name: "Gilman's Dream-Diary", insight: 1 } }),
    ],
    links: [link('stair', 'parlour', 'shortcut'), link('pantry', 'sump', 'drop')],
  },
  {
    // Round 127: the sign is the terrace at the hill's foot; the climb goes round by the circle and the standing stones, up the east
    // flank and across to the crown before the summit, and from the crown the sheer path drops straight down to a gate barred at the
    // terrace: opened from above, the summit is one flight from the sign. The west barrow and the lookout are the hill's own corner.
    id: 'sentinel_hill', name: 'Sentinel Hill', region: 'dunwich', rooms: [
      room('path', 'corridor', undefined, 's'),
      room('terrace', 'hall', 'path', 'n', { sign: { id: 'dunwich_sentinel', name: 'Sentinel Terrace' } }),
      room('hollow', 'corridor', 'terrace', 'w', { spawns: ['martense_degenerate'] }),
      room('barrow', 'hall', 'hollow', 'w', { spawns: ['martense_degenerate', 'martense_degenerate', 'rat_swarm'] }),
      stair('scarp', 'barrow', 'n', 4),
      room('ledge', 'corridor', 'scarp', 'n', { spawns: ['thousand_young', 'mi_go'] }),
      room('lookout', 'hall', 'ledge', 'n', { spawns: ['mi_go', 'martense_degenerate'], words: 'THE ROUND HILLS' }),
      room('circle', 'well', 'terrace', 'e', { spawns: ['thousand_young'] }),
      room('altar', 'hall', 'circle', 'n', { hidden: { minInsight: 3 }, tome: { name: "Old Whateley's Ledger", insight: 1 } }),
      room('standing', 'corridor', 'circle', 'e', { lurk: ['thousand_young'] }),
      stair('climb', 'standing', 'n', 4, { spawns: ['thousand_young'] }),
      room('stones', 'corridor', 'climb', 'n', { spawns: ['mi_go', 'martense_degenerate'] }),
      stair('ascent', 'stones', 'w', 4),
      room('crown', 'corridor', 'ascent', 'w', { words: 'THE CROWN OF THE HILL' }),
      room('summit', 'hall', 'crown', 'n', { wide: true, boss: ['dunwich_horror'] }),
      stair('sheer', 'crown', 's', -8), // the sheer path, straight down to the terrace's gate
    ],
    links: [link('sheer', 'terrace', 'shortcut')],
  },
  {
    // Round 127: from the Drowned Hall the way to the temple is the long one: up through the spawning pools, west by the ossuary, down
    // to the oubliette and up the undertow to the causeway at the temple's door. From the causeway the span crosses back east to the
    // sluice, whose door into the Drowned Hall is barred on the sluice's side: lifted, the temple is three rooms from the sign.
    id: 'yhanthlei', name: "Y'ha-nthlei", region: 'innsmouth', rooms: [
      room('mouth', 'corridor', undefined, 'e'),
      stair('sink', 'mouth', 'w', -4),
      room('drowned', 'hall', 'sink', 'w', { sign: { id: 'innsmouth_yhanthlei', name: 'Drowned Hall' } }),
      room('cells', 'corridor', 'drowned', 's', { lurk: ['innsmouth_hybrid'], weapon: 'cutlass' }),
      room('pits', 'pit', 'drowned', 'n', { spawns: ['deep_one'] }),
      room('nursery', 'hall', 'pits', 'n', { spawns: ['deep_one', 'innsmouth_hybrid', 'dagon_priest'], words: 'THE SPAWNING POOLS' }),
      room('reliquary', 'corridor', 'nursery', 'e', { hidden: { minInsight: 3 }, tome: { name: "Obed Marsh's Log", insight: 1 } }),
      room('ossuary', 'corridor', 'nursery', 'w', { spawns: ['deep_one', 'deep_one'] }),
      stair('cells_deep', 'ossuary', 'w', -4, { spawns: ['innsmouth_hybrid'] }),
      room('oubliette', 'pit', 'cells_deep', 'w', { spawns: ['deep_one', 'innsmouth_hybrid'] }),
      stair('undertow', 'oubliette', 's', 4, { spawns: ['deep_one'] }),
      room('causeway', 'corridor', 'undertow', 's', { words: 'THE TEMPLE OF DAGON' }),
      room('temple', 'hall', 'causeway', 's', { wide: true, boss: ['father_dagon', 'mother_hydra'], kit: 'sunken' }),
      room('span', 'bridge', 'causeway', 'e', { spawns: ['deep_one', 'deep_one'] }),
      room('sluice', 'corridor', 'span', 'e'),
    ],
    links: [link('sluice', 'drowned', 'shortcut')],
  },
  {
    // Round 127: the laboratory lies two cells further down, behind its vestibule, and the way to it from the crypt's sign is round by
    // the catacomb, the charnel and the saltes, then along the burial niches, where the dead are not all dead. The vestibule's passage
    // comes back north to a door barred on its own side, in the crypt's south wall: opened, Curwen is three rooms from the sign.
    id: 'curwen_catacombs', name: "Curwen's Catacombs", region: 'providence', rooms: [
      room('cellar', 'corridor', undefined, 'n'),
      room('storeroom', 'corridor', 'cellar', 'e', { spawns: ['ghoul'] }),
      room('cistern', 'well', 'storeroom', 'e', { spawns: ['ghoul', 'winged_hybrid'] }),
      room('steps', 'stair', 'cellar', 's', { rise: -4, spawns: ['ghoul', 'ghoul'] }),
      room('crypt', 'hall', 'steps', 's', { sign: { id: 'prov_catacombs', name: "Curwen's Crypt" } }),
      room('pits', 'pit', 'crypt', 'e', { boss: ['curwen_pit_thing'] }),
      room('pens', 'corridor', 'pits', 'e', { spawns: ['ghoul', 'ghoul'], words: 'THE PITS' }),
      room('catacomb', 'corridor', 'crypt', 'w', { spawns: ['ghoul'] }),
      room('charnel', 'hall', 'catacomb', 'w', { spawns: ['ghoul', 'being_from_beyond'] }),
      room('saltes', 'corridor', 'charnel', 's', { vial: 'Silver Vial of the Essential Saltes' }),
      room('niches', 'hall', 'saltes', 's', { lurk: ['ghoul', 'ghoul'], words: 'THE NICHES' }),
      room('ossuary', 'corridor', 'niches', 's', { hidden: { minInsight: 3 } }), // a way only a mind can see, and his study beyond it
      room('study', 'hall', 'ossuary', 's', { tome: { name: "Curwen's Journal", insight: 1 }, words: "CURWEN'S STUDY" }),
      room('cloister', 'corridor', 'niches', 'e', { spawns: ['winged_hybrid'] }),
      room('vestibule', 'corridor', 'cloister', 'e', { words: "CURWEN'S LABORATORY" }),
      room('laboratory', 'hall', 'vestibule', 's', { wide: true, boss: ['joseph_curwen'] }),
      room('passage', 'corridor', 'vestibule', 'n'),
    ],
    links: [link('passage', 'crypt', 'shortcut')],
  },
  {
    // Round 127: the sign stands at the belfry stair's foot, and the stair is barred there. The first way up is round by the chapel and
    // the cloister, up the organ stair to the loft and along the galleries (a balcony looks down through its grille on the sign below)
    // to the choir and the belfry; from the belfry the tower stair goes down to its bar, and lifted, the steeple is a climb from the sign.
    id: 'starry_wisdom', name: 'Starry Wisdom Church', region: 'providence', rooms: [
      room('nave', 'hall', undefined, 's', { spawns: ['cthulhu_cultist', 'cthulhu_cultist'] }),
      room('aisle', 'hall', 'nave', 'n', { sign: { id: 'prov_church', name: 'Belfry Stair', rest: [-0.6, -3] } }),
      room('vestry', 'corridor', 'nave', 'e', { spawns: ['cthulhu_cultist'] }),
      stair('crypt_stair', 'vestry', 'e', -4),
      room('undercroft', 'hall', 'crypt_stair', 'e', { spawns: ['cthulhu_cultist', 'winged_hybrid'], words: 'THE UNDERCROFT' }),
      room('catacomb', 'corridor', 'undercroft', 's', { spawns: ['ghoul', 'ghoul'] }),
      room('chapel', 'hall', 'nave', 'w', { spawns: ['cthulhu_cultist', 'winged_hybrid'] }),
      room('sacristy', 'corridor', 'chapel', 's', { hidden: { minInsight: 2 }, tome: { name: "Bowen's Journal", insight: 1 } }),
      room('cloister', 'corridor', 'chapel', 'w', { spawns: ['cthulhu_cultist'] }),
      stair('organ', 'cloister', 'n', 3, { spawns: ['winged_hybrid'] }),
      room('loft', 'hall', 'organ', 'n', { spawns: ['cthulhu_cultist', 'cthulhu_cultist'], words: 'THE ORGAN LOFT' }),
      room('gallery', 'corridor', 'loft', 'e', { spawns: ['winged_hybrid', 'winged_hybrid'] }),
      room('balcony', 'corridor', 'gallery', 's'),
      room('choir', 'corridor', 'gallery', 'n', { lurk: ['winged_hybrid'] }),
      room('belfry', 'corridor', 'choir', 'e'),
      stair('spire', 'belfry', 'n', 5),
      room('steeple', 'hall', 'spire', 'n', { wide: true, boss: ['haunter_of_the_dark'] }),
      stair('tower', 'belfry', 's', -3), // the belfry stair, down to its barred foot in the aisle
    ],
    links: [link('tower', 'aisle', 'shortcut'), link('balcony', 'aisle', 'window')],
  },
  {
    // Round 127: the Outer Ones have dug in under the farm. The cellar off the kitchen goes down to the root cellar and their tunnels
    // run east beneath the yard to the outpost and the brain-cylinders; from the cylinders their lift climbs to a trapdoor barred from
    // below in the barn floor, beside the kitchen's sign. The study keeps its one door, off the parlour.
    id: 'akeley', name: 'Akeley Farmhouse', region: 'vermont', rooms: [
      room('porch', 'corridor', undefined, 's'),
      room('parlour', 'hall', 'porch', 'n', { spawns: ['martense_degenerate'] }),
      room('kitchen', 'hall', 'parlour', 'e', { sign: { id: 'vermont_farm', name: 'Akeley Farmhouse', rest: [-0.6, -3] } }),
      room('barn', 'hall', 'kitchen', 'e', { spawns: ['martense_degenerate', 'martense_degenerate', 'rat_swarm'] }),
      room('study', 'hall', 'parlour', 'n', { wide: true, boss: ['whisperer'] }),
      stair('cellar', 'kitchen', 's', -4, { spawns: ['rat_swarm'] }),
      room('root_cellar', 'hall', 'cellar', 's', { spawns: ['martense_degenerate', 'moon_bog_wraith'] }),
      room('tunnel', 'corridor', 'root_cellar', 'e', { lurk: ['mi_go'], kit: 'mine' }),
      stair('shaft', 'tunnel', 'e', -4, { kit: 'mine' }),
      room('outpost', 'well', 'shaft', 'e', { spawns: ['mi_go', 'mi_go'], kit: 'mine', words: 'THE OUTPOST' }),
      room('gallery', 'corridor', 'outpost', 'n', { spawns: ['mi_go'], kit: 'mine' }),
      room('cylinders', 'hall', 'gallery', 'n', { spawns: ['mi_go', 'mi_go'], kit: 'mine', words: 'THE BRAIN-CYLINDERS' }),
      stair('lift', 'cylinders', 'w', 8, { kit: 'mine' }), // their lift's shaft, up to the barn
      room('span', 'bridge', 'outpost', 's', { hidden: { minInsight: 4 }, kit: 'mine' }),
      room('vault', 'hall', 'span', 's', { tome: { name: "Akeley's Phonograph Record", insight: 1 }, spawns: ['mi_go'], kit: 'mine' }),
      room('hangar', 'corridor', 'vault', 's', { spawns: ['mi_go'], kit: 'mine' }),
    ],
    links: [link('lift', 'barn', 'shortcut')],
  },
];
