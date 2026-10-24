/**
 * The pages left in the dimensions of the Outer Dark (round 73; regions.ts): two in each of the six, found on the ground as the other realms' notes are. Each is
 * what a reader of Lovecraft would expect to find where the god it belongs to has gone: Barzai's last page on the summit, a drover's tally in the black wood,
 * Carter's glimpse of the ones who wait, a bandmaster's complaint, a leaf of the book that says what the gate is, and the handbill of the man who comes
 * before the end. Data only.
 */

import type { Document } from './documents';

const note = (...text: string[]): Document => ({ kind: 'note', text });

export const OUTER_DOCUMENTS: Readonly<Record<string, Document>> = {
  "Barzai's Last Page": note(
    'A leaf of the thick paper of Ulthar, the hand in it very steady, as of one who has stopped being afraid. “The clouds below are a floor, and I have walked on them. The gods of earth are not here. They went down the far side when the Other Gods came up, and I do not blame them. I hear a pipe, and under it a flapping as of great wings, and it is very like a dance.”',
    'The ink goes on a line further and stops in the middle of the word “Kadath”. Beneath, in a hand too neat for the mountain, someone has added: “He was the wiser, and the less well advised.”',
  ),
  "Atal's Warning": note(
    'Scratched with a nail on a flat of grey stone by the way up, in the old speech of Ulthar. “I carried him down as far as I could. He had seen nothing, and then everything, and then he would not look at me. Do not climb to see the gods of earth when the Others dance. The gods of earth are weak and can be pitied. The Others cannot be pitied. They do not know there is anything to pity.”',
    'A second hand has scored beneath it, deeper: “And do not be so sure that the weak ones went down.”',
  ),
  "A Drover's Tally": note(
    'A strip of bark cut with notches in fives, the ends of it going on out of the strip and onto a tree. “One for each that came out of the dark and went into the wood, and the wood did not give any back. I stopped counting at the thousand. I started again at one. It is not that the number is wrong. It is that the wood is counting too, and is not behind.”',
    'In a different knife, in the bark beside the tally: “Ia! Shub-Niggurath! The Black Goat of the Woods with a Thousand Young!” The cut has healed over in the way that skin does, and the letters stand up from it like scars.',
  ),
  "Akeley's Postscript": note(
    'A carbon of a typed letter, the type uneven, on the paper of a Vermont farmhouse. “It is not the Mi-Go I fear, or not now. They have a use for me, and I have been told what it is, and I have not minded as I thought I would. It is the wood that has changed. Last night there were more trees than the night before, and I counted them from the porch. I do not believe I counted them wrong.”',
    'A pencilled postscript: “I have been told I shall be asked to speak to Her. I have said I do not think I can. They say that is all right. They say She does not need me to say anything. She needs only that I be in the room.”',
  ),
  "Carter's Margin": note(
    'Written small down the edge of a sheet of the silver key’s tracing, in a hand that has learned patience. “I came to the pale place by the road that is not a road, and I understood that the lattice is not of stone. It is of the instants. Each facet is an hour, the whole of it held up to the light, and I could walk from one to another, and in each one I was a little different, and in each one I was a little less afraid.”',
    '“The Ancient Ones do not speak. They wait, and are patient, and it is a great kindness in them that they are, for they could be otherwise. I think that I was asked a question, in the place where there are no words. I think I answered it. I do not know the question, and I do not know whether the answer was a good one.”',
  ),
  'Inscription on a Prism': note(
    'Cut in a clear plain hand into the face of a pale prism, that it may be read from the left or the right with the same sense. “This facet holds the hour in which you came. It has not gone by. It will not. You may look into it, and see yourself arriving, and find that you are very little changed, and be comforted. You will be less comforted when the next hour comes up out of the glass to meet you.”',
    'Under it, smaller, a later traveller’s: “It is true. I looked. I was standing just where I am standing now, with my hand on the stone, and I was reading this, and I looked up.”',
  ),
  "A Bandmaster's Complaint": note(
    'On a half-sheet of heavy music paper, in a hurried and offended hand. “I have the honour to report that the band is in the Dark, that it has been in the Dark since before my appointment, and that I cannot get a rest out of it. I am told the rests are kept. I cannot find them. There is a note, and there is a note after it, and there is a note after that; and so on, in a manner I think I can only call thin.”',
    '“I have enquired of the players as to who engaged them. They do not look up. They do not appear to be paid. They have no faces I could address a complaint to, and I will not say what they have in their place. I have the honour to remain, sir, your obedient servant, and I am going to sit down here until it is over.”',
  ),
  'A Finger-Chart for a Tune Without End': note(
    'A strip of reed-paper, ruled in a hundred columns, each with a little figure of a hand and a count of holes stopped. The columns do not repeat. They are numbered from one, and the numbering has been carried past the strip’s end onto the table on which it lay, in chalk, and onto the floor.',
    'A line of ordinary writing on the strip’s edge: “I tried to play the first four columns, and I played them, and my hands went on. They did not need me. I found, after, that I had been standing in the same place for what the sun says would be a day.”',
  ),
  'A Leaf of the Gate': note(
    'Copied by a patient hand, line for line, from a book whose cover is not described. “Yog-Sothoth knows the gate. Yog-Sothoth is the gate. Yog-Sothoth is the key and guardian of the gate. Past, present, future, all are one in Yog-Sothoth. He knows where the Old Ones broke through of old, and where They shall break through again.”',
    'Below, in a quick modern hand: “It is not a metaphor. I thought it was. I stood in front of it and it was a door, and it was a hall of globes, and it was a thing that I will not call by either name; and each of them was looking at me with the same attention, as one might look at a very small letter in a very large book.”',
  ),
  "Wilbur's Cipher": note(
    'A page in the blue ink of the Dunwich schoolhouse, in a script that the schoolmaster could not parse and the reader’s eye parses easily. “I will go through at the hour when the stars are right, and the one who is my father will take me in, and I will be all that he is. He is not a thing that has children as you have. He is a thing that has a door, and the door has had me.”',
    'In the margin, in the same ink, larger and less composed: “They will not let me go through whole. They will want the part that is human to stay. I have told them I will leave them my face.”',
  ),
  'A Handbill': note(
    'A single sheet printed in a clean black type that no press made. “NYARLATHOTEP. Tonight, and tomorrow night, and every night until it is over, in the hall that is open to all. The man will show you what he has seen. There is no charge. No one has asked for his money back. Doors at the hour of your choosing.”',
    'A clerk’s tick beside it, and a note: “Tall, dark, courteous. He shook my hand. I should like to say that it was cold. It was not cold. It was precisely the temperature of my own.”',
  ),
  "A Night-Gaunt's Tally": note(
    'Scratched into the black floor with something that was not a tool, in tallies of five, many hundreds of them. “Carried: one rider. He did not scream. He had already screamed, on the way up, and was done. The faceless ones do not like to be screamed at. They hold their riders very firmly, and bear them past the stars, and do not tire.”',
    'A last mark has been scored below the others, in a different hand, and then crossed out: “Set down at the foot of the throne. The man in the black robe was waiting. He was kind about it.”',
  ),
  "The Court's Roll": note(
    'A roll of names in many hands, on a ribbon of a stuff that was once cloth. The names are not any person’s; they are the names of the places that have been present at the court: Hali, Carcosa, Yaddith, Leng, the Plateau, the Garden of Night. Each has been struck through, and written again beneath, and struck through again.',
    'At the foot, in a hand that does not hurry: “The court is in session. The presiding power has not noticed. The business of the court is to see that it does not.”',
  ),
};
