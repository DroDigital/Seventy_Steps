/**
 * The pages set down in the courts of the Beyond's houses (round 63; documentsHouses.ts has the waking world's and the dream-lands'): the
 * Yellow King's players, the gate that is a god, the court of the blind idiot, the terraces of Yaddith, the pipers' organ and the pale
 * prisms of the ones who wait at the end of the Silver Key. Data only.
 */

import type { Document } from './documents';

const note = (...text: string[]): Document => ({ kind: 'note', text });

export const BEYOND_DOCUMENTS: Readonly<Record<string, Document>> = {
  'A Page of the Second Act': note(
    'A single leaf, torn from a printed play, the paper the yellow of an old tooth. The speeches are in two columns, and the names above them are not names. “CAMILLA: You must not take the mask off. CASSILDA: Why not? — CAMILLA: Because there is nothing behind it that is not already looking at you.”',
    'Pencilled in the margin by a hand that has crossed out its own name: “It is a safe play until the second act. The lake of Hali is not a lake. The black stars are not stars. If you are very steady, and the hour is the last, and you have kept your reason as one keeps a lamp trimmed and low, then nothing will come of it. If you have not, the Sign will be shown, and you will know it at once.”',
  ),
  'On Gates, and the One Who Is a Gate': note(
    'Copied from a book that no library lists, in a copyist’s patient hand. “Yog-Sothoth is the gate, and the key to the gate. Past, present and future are one in him. He knows where the Old Ones broke through, and where they shall break through again; and he stands now at the threshold, which is neither here nor there, but between the two, as a man stands in a door.”',
    '“To one who would pass, the gate asks four lights lit, from the outside toward the inside, as one goes in. It does not ask them for its own sake. It asks them that it may know how you walk. Then it asks a toll, and the toll is a measure of what you carry in the head; and it is a fair toll, and the gate is a fair gate, and it is not to be bargained with.”',
  ),
  'A Dreamer’s Note on the Court': note(
    'In pencil, on the back of a map, in a hand that grows smaller toward the end. “There is a court at the centre of the world, and there is nothing in it but a sound. It is not a bad sound; that is the horror. It is thin and monotonous, and it comes from nowhere, and a mind that has begun to come loose from itself will hear it first, and a mind that is quite firm will hear nothing at all.”',
    '“I went at the hour when the stars have gone out, with no lamp, and I stood where the wall is thinnest. I stood a long while. The piping began at my left ear, and it did not stop, and when it was over I was not the man who had come. If you go, go dark. If you go, go loosened. If you go, do not go in the hope of understanding it. There is nothing there that will be understood.”',
  ),
  'The Tally of the Terraces': note(
    'A reckoning on a thin sheet of a metal that is not any metal, in neat wedge-shaped marks, with a translation in Carter’s hand. “Terraces of Yaddith, counted from the lowest: three hundred and nine, all vacated; three hundred and nine hearths, all out. The great wizard keeps the stair. The wizard takes a tithe of every traveller who passes, according to what he is carrying, and cannot be cheated, for he weighs it.”',
    'Below, in the same hand, a little hurried: “I paid it in what I had, which was Echoes, an old measure of the dream-lands, and the stair opened. I do not think he cared what it was, only that I should be sorry to lose it. Pay it plainly. Do not try to bargain in that house. He has been a wizard longer than there have been bargains.”',
  ),
  'A Choirmaster’s Instruction': note(
    'On ruled paper, copied by one who could not read the original, from a score of fourteen lines. “For the Organ: four pipes, the great first, then the small, in the descending order. Each is lit as it is sounded, and a pipe sounded out of its turn puts all the others out. Rest between. The performance is not to be hurried.”',
    '“A note to those who tend the Organ: the music is for the pipes, and not for you. Whoever stands near while the great note sounds must keep a clear head, for a head that is lost in it will be taken by the dancing, and will dance, and the dancing does not end. Say your name to yourself, over and over. If you do not know it, find it first.”',
  ),
  'A Note on the Prisms': note(
    'On a slip of cold, thin vellum, in the hand of one who has spent a long time among strange mathematics. “They are not hexagons, whatever the eye reports. They are the faces of something that is whole. Six at a time are left in the ring, and the seventh is left out, because the one it belongs to has not yet come, or has come and gone, I cannot tell which.”',
    '“They will not receive a mind that is already troubled, though they will not turn it away either. They will simply not be there. A man who comes to them lucid, and keeps himself so, will find that the ring has a place for him; and he will be asked for one last thing, a dose, a small measure of the soothing that dulls the world, laid down in the empty place, as a sign that he means to look at them undimmed.”',
  ),
};
