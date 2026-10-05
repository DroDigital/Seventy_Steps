/**
 * Who speaks with which voice (the voices): an ElevenLabs voice for each person met at an Elder Sign
 * (`npc:<id>`) and each horror that speaks (`boss:<roster id>`). Licence rule (round 41): only ElevenLabs'
 * own **premade** voices, or voices **designed for this game** in its Voice Design (ours, no library
 * licence in between). The library voices the cast once used could not be checked for their licence
 * through the tools, and are gone from it; the narrator's (the author's pick) is the one left, flagged in
 * docs/VOICES.md. Nobody has listened to the casting: the designed voices were described from each
 * speaker's years, tongue and temper and picked by what could be measured (docs/VOICES.md). `rate` and
 * `echo` are the game's own: a playback rate below 1 lowers a voice and slows it (the great and the old),
 * and `echo` puts some hall behind it. Data only.
 */

export interface Voice {
  voice: string; // the ElevenLabs voice id
  name: string; // what the library calls it
  rate?: number; // playback rate, pitch and pace together (default 1)
  echo?: number; // how much of a hall is behind it, 0..1 (default none)
  gain?: number; // a level of its own (default 1)
  room?: boolean; // set in a room: warmed, held level and given a stone chamber's reverb (render/audio/voiceRoom.ts; default none)
}

type Own = Pick<Voice, 'rate' | 'echo' | 'gain' | 'room'>;
/** A voice (id, name) and the way it is played for one speaker. */
const v = (voice: readonly [string, string], more: Own = {}): Voice => ({ voice: voice[0], name: voice[1], ...more });

/** Premade voices (ElevenLabs' own). */
const WILL = ['bIHbv24MWmeRgasZH58o', 'Will - Relaxed Optimist'] as const;
const ROGER = ['CwhRBWXzGAHq8TQ4Fs17', 'Roger - Laid-Back, Casual, Resonant'] as const;
const BRIAN = ['nPczCjzI2devNBz1zQrb', 'Brian - Deep, Resonant and Comforting'] as const;
const CALLUM = ['N2lVS1w4EtoT3dr4eOWO', 'Callum - Husky Trickster'] as const;
const CHRIS = ['iP95p4xoKVk53GoZ742B', 'Chris - Charming, Down-to-Earth'] as const;
const BILL = ['pqHfZKP75CvOlQylNhV4', 'Bill - Wise, Mature, Balanced'] as const;
const DANIEL = ['onwK4e9ZLuTAKqWW03F9', 'Daniel - Steady Broadcaster'] as const;
const GEORGE = ['JBFqnCBsd6RMkjVDRZzb', 'George - Warm, Captivating Storyteller'] as const;
const HARRY = ['SOYHLrjzK2X1ezoPC6cr', 'Harry - Fierce Warrior'] as const;

/** Voices designed for the game (Voice Design), kept for more than one speaker. */
const GREAT_ONES = ['feMEuaYQx2ITBOZd0ZFG', 'The Great Ones (Kadath)'] as const; // Yog-Sothoth speaks in it too: the workspace holds thirty voices
const PRIESTS = ['t08TssFOUzUklDhgSgD1', 'Nasht and Kaman-Thah (Priests)'] as const; // 'Umr at-Tawil too
const HYDRA = ['H6EAxZnCzTPJJFGIm1N0', 'Mother Hydra (Deep One)'] as const; // Shub-Niggurath too

export const CAST: Readonly<Record<string, Voice>> = {
  // the narrator of a new game's opening (round 39): Finley, Articulate Anchor, a crisp and unflappable British voice, chosen by the author; a LIBRARY voice (licence unchecked: docs/VOICES.md); never whispered; set in a stone chamber (a warm, level voice with reverb, no slap-back echo)
  'narrator:intro': v(['fnYMz3F5gMEDGMWcH1ex', 'Finley - Articulate Anchor'], { room: true }),
  // people met at the Elder Signs
  'npc:peaslee': v(['tFaKZ4OQAewSluuxn7RB', 'Wingate Peaslee (Seventy Steps)']), // designed: a deep, old, dry professor (Eric was too young)
  'npc:gilman': v(WILL),
  'npc:morgan': v(['Zu8OeRoG1W5wagFvqvfs', 'Dr. Francis Morgan (Seventy Steps)']), // designed: elderly, low, dry, smoky
  'npc:kuranes': v(['bY8puK6S3RGlr0wikENe', 'Kuranes (Dream Lands)']), // designed: a gentle, dreamy Londoner
  'npc:zadok': v(['oS1Ldc1OhmULV32wNtyv', 'Zadok Allen (Innsmouth)']), // designed: ninety-six, cracked, slurred, a New England drawl
  'npc:wilmarth': v(ROGER),
  'npc:willett': v(BRIAN),
  'npc:curtis': v(CALLUM),
  'npc:dyer': v(CHRIS),
  'npc:nathaniel': v(BILL),
  'npc:zamacona': v(['SCr2sXbLg0vczYt19ZiV', 'Zamacona (Tsath)']), // designed: a weary Castilian hidalgo
  'npc:johansen': v(['OJZxDfzqJBxrmTREQJcK', 'Gustaf Johansen (R\'lyeh)']), // designed: a gruff, haunted Norwegian
  'npc:akeley': v(['brfCSgEWKhVUk7i3sPp9', 'Henry Akeley (Yuggoth)']), // designed: a frail old Vermont farmer
  'npc:carter': v(DANIEL),
  'npc:nasht': v(PRIESTS, { echo: 0.2 }),
  // the horrors that speak
  'boss:wilbur_whateley': v(HARRY, { rate: 0.96 }),
  'boss:dunwich_horror': v(HARRY, { rate: 0.72, echo: 0.5 }),
  'boss:keziah_mason': v(['BbF0R6lcyCsZVwnjHzwi', 'Keziah Mason (Witch)']),
  'boss:brown_jenkin': v(['XAfV6hn6JT4LPatdDizz', 'Brown Jenkin (Familiar)']),
  'boss:black_man': v(['gdQL6olVLhkRDvue4G8n', 'The Black Man (Tempter)'], { rate: 0.97, echo: 0.25 }),
  'boss:joseph_curwen': v(['ttJ9Yma2EKpRou0MKpVX', 'Joseph Curwen (Necromancer)']),
  'boss:simon_orne': v(['MN6OV4FaLTmDyt2HbvDM', 'Simon Orne (Sorcerer)']),
  'boss:edward_hutchinson': v(['d5fMF4XN1xXNbhcn2sVN', 'Edward Hutchinson (Alchemist)']),
  'boss:ephraim_waite': v(['uLSdhli8Nh3oecMulCST', 'Ephraim Waite (Asenath)']),
  'boss:whisperer': v(['GhTAOZ6TpanaXZ2BebFG', 'The Whisperer (Darkness)']),
  'boss:voice_in_the_tomb': v(['8sQoC7ywyRWufwwkpxmi', 'Voice in the Tomb (Sealed)'], { echo: 0.35 }),
  'boss:lilith': v(['ZpcPectqj6jA7upy2ds6', 'Lilith (Dark Queen)'], { rate: 0.96, echo: 0.3 }),
  'boss:dr_munoz': v(['znCQdZ10eP9TPmKFUBiB', 'Dr. Munoz (Cold Apartment)']),
  'boss:charles_le_sorcier': v(['XbbZLJxYknwZpVDBF8yd', 'Charles Le Sorcier (Cursed Lord)']),
  'boss:medusa_gorgon': v(['mxxi4y139JdJkcoAWz38', 'Medusa (Gorgon)']),
  'boss:hypnos': v(['2By09Lf6hdgEqSaKjF6R', 'Hypnos (Sleep)']),
  'boss:terrible_old_man': v(['z0Hf7ohJe76SmjpHcSB1', 'Terrible Old Man (Kingsport)']),
  'boss:zkauba': v(['FtER3HTVunb98SClCpA6', 'Zkauba (Wizard of Yaddith)']),
  'boss:cthulhu': v(['4BurENwzMIaL1Rien7nO', 'Cthulhu (Dreamer of R\'lyeh)'], { rate: 0.9, echo: 0.6 }),
  'boss:father_dagon': v(['e6kNUrNTHrY2UHszWVOb', 'Father Dagon (Deep One)'], { rate: 0.94, echo: 0.45 }),
  'boss:mother_hydra': v(HYDRA, { rate: 0.96, echo: 0.45 }),
  'boss:hastur': v(['sTz0TrsMTkIY2GFiSKEd', 'Hastur (King in Yellow)'], { echo: 0.5 }),
  'boss:tsathoggua': v(['h66CqFXHNxmKocuuHudR', 'Tsathoggua (Toad God)'], { rate: 0.9, echo: 0.4 }),
  'boss:great_ones': v(GREAT_ONES, { rate: 0.92, echo: 0.6 }),
  'boss:yog_sothoth': v(GREAT_ONES, { rate: 0.84, echo: 0.7 }),
  'boss:umr_at_tawil': v(PRIESTS, { rate: 0.97, echo: 0.12 }),
  'boss:shub_niggurath': v(HYDRA, { rate: 0.84, echo: 0.55 }),
  'boss:nyarlathotep': v(GEORGE, { rate: 0.97, echo: 0.15 }),
};
