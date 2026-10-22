/**
 * The points of interest of the realms down the stair and through the gates (round 61; data/pois.ts): the Mountains of Madness, the
 * Great Race's Pnakotus and the Nameless City, K'n-yan under its mound, R'lyeh, Yuggoth and the Gulf beyond the Gate. Two have mazes (the
 * Nameless City's crawlways, R'lyeh's wrong streets); the rest stand at the ruins, rings, outcrops and landmarks the plan has set.
 */

import type { PoiDef } from './pois';

export const POIS_BEYOND: readonly PoiDef[] = [
  // The Mountains of Madness.
  { id: 'mountains_wrecked_camp', region: 'mountains', at: { feature: 'ruin', nth: 2 }, name: "The Wrecked Camp", kind: 'den', story: 'At the Mountains of Madness',
    line: 'Tents flattened from within. Dogs opened with surgical care, and five stars of snow set in a neat row.', foes: { ids: ['gnoph_keh', 'elder_thing'], n: 5 }, hoard: 1100 },
  { id: 'mountains_piping_peaks', region: 'mountains', at: { feature: 'landmark', nth: 1 }, name: 'The Piping Peaks', kind: 'anomaly', story: 'At the Mountains of Madness',
    line: 'The peaks rise sheer, and across them runs a regularity no frost ever drew.', again: 'A piping, high above: musical, wide-ranged, and furious.', fx: { form: 'sheet', hue: 'green' }, aura: -0.4, insight: 1 },
  { id: 'mountains_sculptured_hall', region: 'mountains', at: { feature: 'ruin', nth: 0 }, name: 'The Sculptured Hall', kind: 'tale', story: 'At the Mountains of Madness',
    line: 'The carved walls tell the whole history of those who made the city, down to the last war, and a drawing done in hurrying lines.', foes: { ids: ['elder_thing'], n: 1 }, hoard: 1000, aura: -0.15, insight: 1 },
  { id: 'mountains_shoggoth_tunnel', region: 'mountains', at: { feature: 'outcrop', nth: 3 }, name: "The Shoggoth's Tunnel", kind: 'den', story: 'At the Mountains of Madness',
    line: 'A slime-glazed tunnel wide as a subway. From the dark ahead, a cry: "Tekeli-li! Tekeli-li!"', foes: { ids: ['shoggoth', 'gnoph_keh'], n: 3 }, hoard: 1500, aura: -0.25 },
  { id: 'mountains_danforth', region: 'mountains', at: { feature: 'ruin', nth: 3 }, name: "Danforth's Vista", kind: 'tale', story: 'At the Mountains of Madness',
    line: 'From here, one man looked once into the pass beyond, and has never told what he saw.', again: 'The pass beyond is lit from below, and cold.', aura: -0.3, insight: 1 },

  // The Great Race's Pnakotus and the Nameless City.
  { id: 'pnakotus_archive', region: 'pnakotus', at: { feature: 'ruin', nth: 0 }, name: 'The Archive of Cylinders', kind: 'tale', story: 'The Shadow out of Time',
    line: 'Cyclopean shelves of metal cylinders, a mind in each: every one that ever lived in the last aeon.', foes: { ids: ['yithian', 'hybrid_mummy'], n: 3 }, hoard: 1100, insight: 1 },
  { id: 'pnakotus_trapdoor', region: 'pnakotus', at: { feature: 'ruin', nth: 2 }, name: 'The Basalt Trapdoor', kind: 'anomaly', story: 'The Shadow out of Time',
    line: 'A huge basalt trap, not locked. The dream gave its position years before anyone dug.', again: 'The ground under it is warm, and something below has just stopped moving.', fx: { form: 'column', hue: 'purple' }, aura: -0.45, insight: 1 },
  { id: 'pnakotus_low_doors', region: 'pnakotus', at: { feature: 'ruin', nth: 4 }, name: "The Nameless City's Low Doors", kind: 'den', story: 'The Nameless City',
    line: 'Doorways built for crawling things. The carvings show creatures that crawled back and learned to rule.', foes: { ids: ['nameless_city_reptile', 'hybrid_mummy'], n: 7 }, hoard: 1200 },
  { id: 'pnakotus_maze', region: 'pnakotus', at: { near: [250, 330], as: 'clearing' }, name: "The Crawlway Maze", kind: 'hoard', story: 'The Nameless City',
    line: 'Passages cut low and many, every turning the same, and at some turn a smell of old spice.', foes: { ids: ['nameless_city_reptile', 'hybrid_mummy'], n: 4 }, hoard: 1600, maze: true, aura: -0.2 },
  { id: 'pnakotus_mummies', region: 'pnakotus', at: { feature: 'circle', nth: 1 }, name: "The Mummies' Rest", kind: 'den', story: 'The Nameless City',
    line: 'Rows of embalmed, many-limbed things in white linen, all facing the sunset.', foes: { ids: ['hybrid_mummy', 'nameless_city_reptile'], n: 6 }, hoard: 1000 },
  { id: 'pnakotus_polyp_pit', region: 'pnakotus', at: { feature: 'outcrop', nth: 1 }, name: "The Polyps' Pit", kind: 'rite', story: 'The Shadow out of Time',
    line: 'A pit where no wind should be, and the sand moves in a circle round it. Do not stand between the stars and the hole.', foes: { ids: ['flying_polyp', 'yithian'], n: 3 }, hoard: 1500, fx: { form: 'sheet', hue: 'green' }, aura: -0.3 },

  // K'n-yan.
  { id: 'knyan_blue_terrace', region: 'kn_yan', at: { feature: 'circle', nth: 0 }, name: 'The Blue-Lit Terrace', kind: 'anomaly', story: 'The Mound',
    line: 'The sky here is a roof of blue radiance, and you feel yourself weighed on it.', again: 'The light pauses on you, and takes the measure of what you carry.', fx: { form: 'sheet', hue: 'purple' }, aura: -0.2, insight: 1 },
  { id: 'knyan_counting_house', region: 'kn_yan', at: { feature: 'ruin', nth: 5 }, name: "Tsath's Counting-House", kind: 'den', story: 'The Mound',
    line: 'Gold nuggets used as gravel, and a clerk-thing counting them in a voice like water.', foes: { ids: ['kn_yan_dweller', 'ym_bhi'], n: 6 }, hoard: 1300 },
  { id: 'knyan_yig_altar', region: 'kn_yan', at: { feature: 'landmark', nth: 0 }, name: "The Altar of Yig's Children", kind: 'rite', story: 'The Curse of Yig',
    line: 'The dais stones are warm, and the priest-things sing the old hymn: Yig is father of serpents.', foes: { ids: ['serpent_man', 'child_of_yig'], n: 6 }, hoard: 1000, fx: { form: 'column', hue: 'green' } },
  { id: 'knyan_cave_beasts', region: 'kn_yan', at: { feature: 'ruin', nth: 3 }, name: "The Cave-Beasts' Den", kind: 'den', story: 'The Mound',
    line: 'Bones of cattle and of men, cracked for the marrow, and the marks of something that was once a man.', foes: { ids: ['beast_in_the_cave', 'gyaa_yothn'], n: 4 }, hoard: 1100 },

  // R'lyeh.
  { id: 'rlyeh_wrong_streets', region: 'rlyeh', at: { near: [190, 260], as: 'clearing' }, name: 'The Streets of Wrong Angles', kind: 'rite', story: 'The Call of Cthulhu',
    line: 'Streets whose angles are wrong: you turn left and are in the street you left.', foes: { ids: ['cthulhu_cultist', 'star_spawn', 'deep_one'], n: 5 }, hoard: 2000, maze: true, aura: -0.35 },
  { id: 'rlyeh_open_door', region: 'rlyeh', at: { feature: 'circle', nth: 0 }, name: 'The Door that Swung', kind: 'anomaly', story: 'The Call of Cthulhu',
    line: 'One man touched the carved door, and it swung outward, as a great door swings: heavier than it looked.', again: 'Something behind it is stretching itself.', fx: { form: 'column', hue: 'green' }, aura: -0.5, insight: 1 },
  { id: 'rlyeh_landing', region: 'rlyeh', at: { near: [270, 8], as: 'shore' }, name: "Johansen's Landing", kind: 'tale', story: 'The Call of Cthulhu',
    line: 'A ship\'s rail in the weed, and a log that breaks off mid-word.', again: 'The weed shifts, with the rail, as if the hull were still under it.', aura: -0.25, fx: { form: 'motes', hue: 'bone' }, insight: 1 },
  { id: 'rlyeh_bayou_rite', region: 'rlyeh', at: { feature: 'circle', nth: 1 }, name: "The Bayou Idol", kind: 'rite', story: 'The Call of Cthulhu',
    line: 'A stone idol on a ring of stakes, and round it a chant: Ph\'nglui mglw\'nafh Cthulhu R\'lyeh wgah\'nagl fhtagn.', foes: { ids: ['cthulhu_cultist', 'dagon_priest'], n: 6 }, hoard: 1600, fx: { form: 'column', hue: 'magenta' }, aura: -0.3 },
  { id: 'rlyeh_sunken_nave', region: 'rlyeh', at: { feature: 'ruin', nth: 6 }, name: 'The Sunken Nave', kind: 'den', story: 'The Call of Cthulhu',
    line: 'Cyclopean masonry, green with slime, and a hall whose vault is the sea.', foes: { ids: ['deep_one', 'dagon_priest', 'innsmouth_hybrid'], n: 7 }, hoard: 1500 },
  { id: 'rlyeh_dreaming', region: 'rlyeh', at: { feature: 'landmark', nth: 1 }, name: 'The Dreaming Chamber', kind: 'anomaly', story: 'The Call of Cthulhu',
    line: 'Here the dreaming is thickest. Every artist and madman for a thousand leagues has felt this.', again: 'In his house at R\'lyeh, dead Cthulhu waits dreaming.', fx: { form: 'sheet', hue: 'green' }, aura: -0.55, insight: 1 },

  // Yuggoth.
  { id: 'yuggoth_pitch_cliffs', region: 'yuggoth', at: { feature: 'outcrop', nth: 2 }, name: 'The Cliffs of Pitch', kind: 'anomaly', story: 'Fungi from Yuggoth',
    line: 'Cliffs over a black river that is not water, and the fungi on them hum a tune you half remember.', again: 'The humming has your own heartbeat in it.', fx: { form: 'motes', hue: 'purple' }, aura: -0.3, insight: 1 },
  { id: 'yuggoth_cylinder_vault', region: 'yuggoth', at: { feature: 'circle', nth: 1 }, name: 'The Vault of Cylinders', kind: 'hoard', story: 'The Whisperer in Darkness',
    line: 'Metal cylinders with sockets for eyes, ears and voice, row on row, all humming agreeably.', foes: { ids: ['mi_go'], n: 3 }, hoard: 1600 },
  { id: 'yuggoth_roost', region: 'yuggoth', at: { feature: 'ruin', nth: 1 }, name: 'The Winged Ones\' Roost', kind: 'den', story: 'Fungi from Yuggoth',
    line: 'Droppings like fused glass, and a roof that was opened from beneath.', foes: { ids: ['venusian_man_lizard', 'yekubian', 'mi_go'], n: 6 }, hoard: 1800 },
  { id: 'yuggoth_fungus_ring', region: 'yuggoth', at: { feature: 'circle', nth: 2 }, name: 'The Ring of Fungi', kind: 'rite', story: 'The Whisperer in Darkness',
    line: 'Fungi in a ring, humming, and the humming has a rhythm that is not the wind\'s.', foes: { ids: ['mi_go', 'venusian_man_lizard'], n: 5 }, hoard: 1700, fx: { form: 'column', hue: 'magenta' }, aura: -0.25 },
  { id: 'yuggoth_tower', region: 'yuggoth', at: { feature: 'landmark', nth: 0 }, name: 'The Lightless Tower', kind: 'tale', story: 'Fungi from Yuggoth',
    line: 'A tower that casts no shadow in the light of its own sun, and keeps its doors toward the earth.', again: 'Something on the top steps has looked down, and nodded.', aura: -0.3, insight: 1 },

  // Beyond the Gate.
  { id: 'beyond_pipers_ring', region: 'beyond', at: { feature: 'circle', nth: 3 }, name: "The Pipers' Ring", kind: 'rite', story: 'The Dream-Quest of Unknown Kadath',
    line: 'A circle of flat stones where something piped once, thin and monotonous: the dancers have worn the rock.', foes: { ids: ['yekubian', 'flying_polyp'], n: 4 }, hoard: 2500, fx: { form: 'ring', hue: 'magenta' }, aura: -0.5 },
  { id: 'beyond_marchers', region: 'beyond', at: { feature: 'circle', nth: 0 }, name: "The Marchers' Road", kind: 'anomaly', story: 'Nyarlathotep',
    line: 'The crowd marched into the dark, drawn by a voice that promised wonders. The footprints go one way.', again: 'The footprints are fresh.', fx: { form: 'sheet', hue: 'purple' }, aura: -0.4, insight: 1 },
  { id: 'beyond_cats_stair', region: 'beyond', at: { feature: 'ruin', nth: 2 }, name: 'The Stair of the Cats', kind: 'den', story: 'The Dream-Quest of Unknown Kadath',
    line: 'The cats of Saturn, who know the way to the throne, and who will not tell.', foes: { ids: ['cat_from_saturn', 'yekubian'], n: 7 }, hoard: 2200 },
  { id: 'beyond_gulf_edge', region: 'beyond', at: { feature: 'outcrop', nth: 0 }, name: 'The Edge of the Gulf', kind: 'anomaly', story: 'The Dream-Quest of Unknown Kadath',
    line: 'Past the edge the dark is not empty. It is busy.', again: 'The dark leans, like a crowd.', fx: { form: 'column', hue: 'bone' }, aura: -0.5, insight: 1 },
];
