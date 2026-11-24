/**
 * The pages set down in the courts before the Beyond and Outer Dark boss arenas (documentsHouses.ts has the rest): brief lore extracts
 * about Hastur, Yog-Sothoth, Azathoth, Zkauba, the Daemon Pipers and the Ancient Ones, kept short so they read cleanly before the fight.
 * Data only.
 */

import type { Document } from './documents';

const note = (...text: string[]): Document => ({ kind: 'note', text });

export const BEYOND_DOCUMENTS: Readonly<Record<string, Document>> = {
  'A Page of the Second Act': note(
    'A single yellowed leaf torn from a forbidden play, the ink faintly gilded:',
    '“Camilla: You, sir, should unmask. — Stranger: Indeed? — Cassilda: Indeed it’s time. We have all laid aside disguise but you. — Stranger: I wear no mask. — Camilla (terrified, aside to Cassilda): No mask? No mask!”',
  ),
  'On Gates, and the One Who Is a Gate': note(
    'Copied from a suppressed page of the Necronomicon, beside a diagram of interlocking iridescent spheres:',
    '“The Old Ones were, the Old Ones are, and the Old Ones shall be. Not in the spaces we know, but between them, They walk serene and primal, undimensioned and to us unseen. Yog-Sothoth knows the gate.”',
  ),
  'A Dreamer’s Note on the Court': note(
    'Pencilled on the back of a dreamer’s chart, where the line runs off into blank paper:',
    '“…that last amorphous blight of nethermost confusion which blasphemes and bubbles at the centre of all infinity—the boundless daemon-sultan Azathoth, whose name no lips dare speak aloud, and who gnaws hungrily in inconceivable, unlighted chambers beyond time.”',
  ),
  'The Tally of the Terraces': note(
    'Etched on a thin plate of alien metal from five-sunned Yaddith, with Carter’s hurried gloss in the margin.',
    'Zkauba, wizard of the dying terraces, fought the burrowing dholes for centuries before another traveller’s mind slipped into his body through the Silver Key. He has never forgiven the theft of his flesh.',
  ),
  'A Choirmaster’s Instruction': note(
    'Written across a ruled score whose bars have neither key nor end:',
    '“…Ultimate Chaos, at whose centre sprawls the blind idiot god Azathoth, Lord of All Things, encircled by his flopping horde of mindless and amorphous dancers, and lulled by the thin monotonous piping of a daemoniac flute held in nameless paws.”',
  ),
  'A Note on the Prisms': note(
    'On a cold slip of vellum, in a geometrician’s small hand.',
    'Beyond the First Gate they wait in silence upon lofty hexagonal pedestals—cloaked, ill-defined Shapes that neither speak nor stir. They are the Ancient Ones who keep the passage to the Ultimate Gate, watching every facet of time at once.',
  ),
};
