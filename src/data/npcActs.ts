/**
 * What the people do while they wait (round 39: they strolled to and fro about the sign, all alike, and
 * paced like a guard). Each has the one thing the story gives them: the professor reads, the old man of
 * Innsmouth sits at the water with a line, the doctor holds a vial to the light. Seated acts sit on
 * whatever is to hand; the walk is kept for a breather now and then. Data only; systems/npcLife.ts keeps
 * them at it, render/npcActs.ts draws it.
 */

export type ActKind =
  | 'read' | 'write' | 'smoke' | 'gaze' | 'drink' | 'whittle' | 'map'
  | 'polish' | 'mend' | 'brood' | 'key' | 'vial' | 'watch' | 'lean' | 'lounge';

/** A place of their own, in the world's own coordinates, with something there to sit on or lean against (round 39). */
export interface Post {
  x: number;
  z: number;
  yaw: number; // the way they face
  fixture: 'chair' | 'post'; // a chair set with a table and a book, or a street lamp's post at their back
  rise: number; // metres they step forward as they stand up from it, so the chair or the post is not in them
}

export interface Act {
  kind: ActKind;
  post?: Post; // those with one keep to it, all night: no breathers, no dozing at the sign
}

export const ACTS: Readonly<Record<string, Act>> = {
  // "I was reading when it happened. I remember turning a page": in a chair by the quad's eastern lamp, out of sight of where the investigator wakes
  peaslee: { kind: 'read', post: { x: 267.75, z: 225.2, yaw: -1.62, fixture: 'chair', rise: 0.7 } },
  gilman: { kind: 'write' }, // counting the corners of the street, and setting the sums down
  // anatomy and medicine, and the smoker's one vice: against the southern lamp's post, his pipe in hand, behind the one who wakes
  morgan: { kind: 'lounge', post: { x: 252.6, z: 237.3, yaw: 2.79, fixture: 'post', rise: 0.45 } },
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
export const SEATED: ReadonlySet<ActKind> = new Set(['read', 'write', 'smoke', 'drink', 'whittle', 'polish', 'mend', 'brood']);
