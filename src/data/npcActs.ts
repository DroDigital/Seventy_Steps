/**
 * What the people do while they wait (round 39: they strolled to and fro about the sign, all alike, and
 * paced like a guard). Each has the one thing the story gives them: the professor reads, the old man of
 * Innsmouth sits at the water with a line, the doctor holds a vial to the light. Seated acts sit on
 * whatever is to hand; the walk is kept for a breather now and then. Data only; systems/npcLife.ts keeps
 * them at it, render/npcActs.ts draws it.
 */

export type ActKind =
  | 'read' | 'write' | 'smoke' | 'gaze' | 'drink' | 'whittle' | 'map'
  | 'polish' | 'mend' | 'brood' | 'key' | 'vial' | 'watch' | 'lean';

export interface Act {
  kind: ActKind;
}

export const ACTS: Readonly<Record<string, Act>> = {
  peaslee: { kind: 'read' }, // "I was reading when it happened. I remember turning a page"
  gilman: { kind: 'write' }, // counting the corners of the street, and setting the sums down
  morgan: { kind: 'vial' }, // anatomy and medicine: a specimen held to the light
  kuranes: { kind: 'gaze' }, // a dreamer who stayed, looking up into the dream
  zadok: { kind: 'drink' }, // ninety-six, of Innsmouth, and has told the tale a hundred times to a bottle
  wilmarth: { kind: 'smoke' }, // folklore and a long night of letters: his pipe
  willett: { kind: 'watch' }, // a physician, counting by the hour
  curtis: { kind: 'whittle' }, // of Dunwich: a knife and a stick, on a stump
  dyer: { kind: 'map' }, // geology: the chart of the range spread out
  nathaniel: { kind: 'lean' }, // leaning on his cane, weighing what the Great Race showed him
  zamacona: { kind: 'polish' }, // a conquistador, four centuries on, keeping a blade bright
  johansen: { kind: 'mend' }, // second mate: a line to splice
  akeley: { kind: 'brood' }, // as the Outer Ones keep him: too still, and turning his head by degrees
  carter: { kind: 'key' }, // the silver key, turned over and over
};

/** The acts done sitting down. */
export const SEATED: ReadonlySet<ActKind> = new Set(['write', 'smoke', 'drink', 'whittle', 'polish', 'mend', 'brood']);
