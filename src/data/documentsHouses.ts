/**
 * The pages set down in the courts before the open-world boss arenas (world/discoveryPlan.ts lays them where they lie): brief lore
 * extracts from Lovecraft's tales about each horror, kept short so they read cleanly on the burnt paper before the fight. These are
 * the waking world's, dream-lands' and outer arenas' pages; the Beyond's are in documentsBeyond.ts. Keyed by name, as the others are
 * (data/documents.ts). Data only.
 */

import type { Document } from './documents';

const note = (...text: string[]): Document => ({ kind: 'note', text });

/** The deposition of 1692 (the court's page): the demo's title names no one of the rest of the game. */
export const DEPOSITION = __DEMO__ ? "Goodwife's Deposition" : "Goodwife Pickman's Deposition";

export const HOUSE_DOCUMENTS: Readonly<Record<string, Document>> = {
  "The Surveyors' Report": note(
    'Pencilled inside a Reservoir Commission survey of the old Gardner farm:',
    '“It was just a colour out of space—a frightful messenger from unformed realms of infinity beyond all Nature as we know it; from realms whose mere existence stuns the brain and numbs us with the black extra-cosmic gulfs it throws open before our frenzied eyes.”',
  ),
  [DEPOSITION]: note(
    'Salem court record, 1692. Keziah Mason spoke of meetings at the white stone beyond Meadow Hill and on the unpeopled island in the river—and of the tall, lean Black Man who waited there.',
    '“The man did not speak, and bore no trace of expression on his small, regular features. He merely pointed to a book of prodigious size which lay open on the table.”',
  ),
  'A Tax Assessor’s Memorandum': note(
    'A stained leaf from a county valuation book, drifted far beyond any earthly parish. The woods have no boundary left to map.',
    '“From the wells of night to the gulfs of space, and from the gulfs of space to the wells of night—ever Their praises, and abundance to the Black Goat of the Woods. Iä! Shub-Niggurath! The Goat with a Thousand Young!”',
  ),
  'The Overseer’s Letter': note(
    'To Mr. de Russy, from the plantation house. Since the young master brought Marceline back from Paris, none of the household will cross the porch.',
    'Her black hair coils and hisses in the dusk as though every lock were a living serpent, and the portrait she sat for does not look at the wall—it watches the room.',
  ),
  'The Coastguard’s Log': note(
    'Torn from a station log, stiff with salt. Fishermen harpooned a fifty-foot sea-beast and hauled its corpse onto the sand to show the crowd.',
    'By nightfall the water began to pull with a living weight. Something far larger—its mother—rose unseen beyond the breakers, drawing the shore out into the black tide.',
  ),
  "Orne's Letter to Curwen": note(
    'A folded sheet from Salem, sealed in black wax, in a crisp eighteenth-century hand.',
    '“And againe I ask that you shalle write me as Jedediah and not Simon. In this Community a Man may not live too long, and you knowe my Plan by which I came back as my Son.”',
  ),
  'The Sexton’s Ledger': note(
    'Salem burying-ground entry, struck through in red ink: “Simon Orne, interred 1751; estate claimed by his son Jedediah on papers in Simon Orne’s own known hand.”',
    'Added in modern pencil: “Vanished from Salem in 1771. Found alive a century and a half later in the oldest quarter of Prague—still writing in the very same hand.”',
  ),
  'The Pawtuxet Rod': note(
    '“Curwen’s only close friends had been one Edward Hutchinson of Salem-Village and one Simon Orne of Salem.”',
    'Like Curwen, Hutchinson never grew old—vanishing from Salem to a dark crag in Transylvania, yet still trading Essential Saltes to this stone keep on the Pawtuxet road, whose high iron rod draws down the storms.',
  ),
  'A Letter from Gizeh': note(
    'Scrawled on Cairo hotel paper, the hand shaking:',
    '“Accursed is the sight, be it in dream or not, that revealed to me the supreme horror—the Unknown God of the Dead, which licks its colossal chops in the unsuspected abyss… The five-headed monster that emerged… that five-headed monster as large as a hippopotamus… and that of which it is the merest fore paw.”',
  ),
  'The Settler’s Warning': note(
    'Scratched on the back of an Oklahoma feed-store ledger. Every autumn, when the rattlers grow wild, the drums pound all night across the plains.',
    'Yig, the Father of Serpents, forgets nothing. Harm one of his children, and he comes in the dark—not merely to kill, but to leave what survives crawling and spotted like a snake.',
  ),
  'A Priest’s Reckoning of the Pit': note(
    'A strip of dressed hide from blue-litten K’n-yan, glossed in Zamacona’s cramped Spanish.',
    'Even the priests who keep the shrines of Tulu and Yig turn pale at the twin pits of Nug and Yeb—the dark spawn of the Black Goat, whose ceremonies in the lower vaults drove a conquistador to pray for the upper sun.',
  ),
  'The Ib-Folk’s Complaint': note(
    'Cut in sea-green stone by the lake of Mnar, where the men of Sarnath slew the folk of Ib and stole the idol of Bokrug:',
    '“Where once had risen walls of 300 cubits and towers yet higher, now stretched only the marshy shore, and where once had dwelt fifty millions of men now crawled only the detestable green water-lizard. Not even the mines of precious metal remained, for DOOM had come to Sarnath.”',
  ),
  'Atal’s Account of Barzai': note(
    'Set down by Atal of Ulthar, who halted below the peak of Hatheg-Kla while Barzai the Wise climbed to see earth’s gods:',
    '“The other gods! The other gods! The gods of the outer hells that guard the feeble gods of earth!… Look away!… Do not see!… Merciful gods of earth, I am falling into the sky!”',
  ),
  'The Alert’s Log': note(
    'Torn from the Norwegian mate’s account of the Alert, off risen R’lyeh:',
    '“It lumbered slobberingly into sight and gropingly squeezed Its gelatinous green immensity through the black doorway… The Thing cannot be described—there is no language for such abysms of shrieking and immemorial lunacy, such eldritch contradictions of all matter, force, and cosmic order. A mountain walked or stumbled.”',
  ),
};
