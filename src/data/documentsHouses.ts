/**
 * The pages set down in the courts of the horrors' houses (round 63; data/discoveries.ts names them, world/discoveryPlan.ts lays them
 * where they lie): each says what once happened at the place, as someone who was there, or came after, would have set it down, and
 * leaves the reader to find what the gate asks. These are the waking world's and the dream-lands'; the Beyond's are in
 * documentsBeyond.ts. Keyed by name, as the others are (data/documents.ts). Data only.
 */

import type { Document } from './documents';

const note = (...text: string[]): Document => ({ kind: 'note', text });

export const HOUSE_DOCUMENTS: Readonly<Record<string, Document>> = {
  "The Surveyors' Report": note(
    'A report to the Reservoir Commission, typewritten, unsigned, its margins foxed with a pale bloom that is not mildew. “The old Gardner place lies in the line of the basin. The well water is sweet by every test, and kills the shrubs it is poured on. For two hundred yards about it the ground is a fine grey ash that takes no footprint and grows nothing.”',
    'A pencilled postscript: “Mr. Pierce says it was not so before the stone came down in the June of ’82, and that the gentlemen from Miskatonic who weighed it never printed a line. He keeps a lamp lit in the window at dusk, one for each of the family, so the hollow will know the house is still kept. We advise the dam be raised high, and the gates kept shut.”',
  ),
  "Goodwife Pickman's Deposition": note(
    'A court paper of 1692, the hand cramped, the ink pale. “Being asked what she saw on Meadow Hill upon the night before the first of May, she saith that there was a Fire, and a ring about it, and Keziah Mason in the ring; that a Tall Man in black stood where the light did not reach, and that she knew him for the Black Man; that he had a Book, and a pen, and that no one wrote with ink.”',
    '“She saith that those who wrote their names in it did so with their own blood and went home easier, and slept; and that a name once written was given away, not lost, so that the one who bore it walked after as one that is not quite remembered. She saith she did not sign, and ran, and that the river closed behind her like a hand.” In another ink, later: “Three candles of black tallow were found upon the stone. They had been lit in order.”',
  ),
  'A Tax Assessor’s Memorandum': note(
    'From the county assessor’s office, 1913, concerning a parcel on the north side of Sentinel Hill. “I was unable to value the wood. It has no boundary I could walk, for the trees stand closer every time I come, and the owner, if there is one, was never seen by anyone I asked. The bark of the oldest is cut with hoof-marks, high up, where no goat could reach.”',
    '“On the second visit it blew a gale from the west, and I heard what I take to be the farmers’ account of the Wood, that in a high wind the whole of it speaks, one tree after another, in a kind of rising bleat. The Whateley people say the wind is only the wood waking, and that She takes a pledge of the living from those who come to her door, whether they will it or no. I have declined to revisit, and advise that the parcel be left unassessed.”',
  ),
  'The Overseer’s Letter': note(
    'To Mr. de Russy, in New Orleans, from the man he left to keep the place. “The porch is finished, as you ordered, and the people stand upon it as if they had been set there: the cook, the two grooms, the girl from the quarters, and the gentleman from Tulane who came to see the Mistress. I will say plainly that I did not set them there, and that I will not go on to the porch at dusk, when she walks.”',
    '“She does not look at you, sir. That is the whole of her art. I am told one may go to her at dusk and live if one keeps one’s head clear and one’s eyes upon the floor, and not otherwise. The floor has been marked in the old way where she lays the stones. I did not follow it.”',
  ),
  'The Coastguard’s Log': note(
    'A page torn from a station log, salt-stained, the entries running together. “Beached in the night, a half mile south of the point: a thing of the sea, forty feet if it was a foot, which the fishermen would not name. They took axes to it, and were sorry. By morning the tide had stopped coming in at the usual hour.”',
    '“Third night. A wind from the south-east, and in it the sound of something very large asking for something very large. The sea wall is holding. The tower keeps its lamp. Old Pettigrew says the thing will be answered, if the sea is paid, and that the water takes coin, and takes it gladly. I put two pounds on the wall at the foot of the lamp and the wind dropped by a degree. God forgive me, it dropped.”',
  ),
  "Orne's Letter to Curwen": note(
    'A letter of a hundred years ago and more, in a fine slanting hand, sealed once with a black wafer. “My dear C. — You ask how I keep my years. I keep them as you do, in a small and well-ordered cabinet, and I take them out from time to time to see that none are spoiled. I have not been in Salem since the year of the trials, though they say I was seen there last month, in the street, in a good coat.”',
    '“You will be wise to look to your own burying place. The sexton there is no fool and will have noticed that two of the graves are tenanted only by their stones. I do not blame you. I only say that a grave that is empty should, for the courtesy of the neighbourhood, be kept as though it were not, and watched on the hour before dawn, when the living look away.”',
  ),
  'The Sexton’s Ledger': note(
    'The ledger of a burying ground, its columns ruled by hand, its entries in the sexton’s spidery pounds-and-pence. “To digging, one grave, Mr. S. Orne, wholly paid. To filling same. To digging, one grave, Mr. S. Orne, again; the family were not satisfied. To filling same, with what the family sent.”',
    'A marginal note in a different pen: “The Orne stone has been moved four times in my father’s memory and twice in mine, and the ground under it is firm in every season. I will not dig there again. If I am asked I say the stone is a good one. If I am pressed I say that Mr. Orne is a gentleman who is particular about his rest, and I go and stand by it an hour before sunrise, to show that someone is keeping the watch.”',
  ),
  'The Pawtuxet Rod': note(
    'An account given by a neighbour to a Providence paper, never printed. “The old Hutchinson house has a rod on the gatehouse roof as tall as a ship’s mast, and ground wire that goes down into the yard further than any well. Before a storm the farmers on the Pawtuxet road would look to see whether the rod was bright; and when it was, they would lay lamps along the lane to the house.”',
    '“Four lamps, and lit from the road toward the door, never the other way, for the house does not like to be approached by the dark end first. The lightning came down the rod in the great storms as if it were called, and he stood under it in the yard on those nights with his arms out, like a man drawing water. I saw him do it. It is not a thing I wish to see again, and I have gone back to see it.”',
  ),
  'A Letter from Gizeh': note(
    'On the paper of a Cairo hotel, a hurried, uneven hand. “I have been under the great sphinx, and I will say no more than that the people I went with are not coming back. There is a stair that leads down from the paw, and an avenue of braziers in the old way, four of them, and the priests, if there are any, light them as the stars set, the great one first and the small last. I did not know this; I have only seen it done.”',
    '“A cup stands at the head of the stair, a stone basin as broad as a well. They told me, before I forgot them, that the sleep one takes in it is not a sleep, and that the one who sleeps there with an easy mind will wake to find that the way is open. I drank it. I was struck on the head, and I was dropped down a shaft, and I woke. I wish to be believed, and I do not expect it.”',
  ),
  'The Settler’s Warning': note(
    'Scratched on the back of a feed-store ledger, in a hand that grew less steady as it went. “If you kill a snake in this country you will be known for it. They tell it so in the Territory: that Yig keeps the account of all his children, and that the man who kills one without need will find a snake in his bed within the season, and another, until he is a thing that crawls.”',
    '“The old people of the place used to go out in the spring to the mound where the serpents den, with a little of their own blood on a flat stone, and to say a word they would not teach us. I thought it a savage superstition. My wife is dead of it. If you read this, do not carry a hoe to the mound. Carry a small knife, and be prepared to be sorry for it.”',
  ),
  'A Priest’s Reckoning of the Pit': note(
    'A strip of dressed hide, written in a script one reads without learning, the way one reads a face. “Let it be remembered that the mound was raised in three lifts, and that each lift was blessed with its own fire, burning from the deepest outward, so that the god below might be warmed in his sleep and not wakened in his anger.”',
    '“And let it be remembered that at the foot of the third lift there is a stair, and the stair is red from what was spent on it. The god takes his meat from the hand that offers it, in the old way, a little at a time: no more than a man can spare, and no less than a man will miss. Whoever will come before him must come so, and no other.”',
  ),
  'The Ib-Folk’s Complaint': note(
    'Cut in green stone, in letters that run like water. “The people of Ib came out of the grey lake in the years before the years, and they were not men, but they were fond of one another. They had a green idol, and its name was Bokrug, the great water-lizard, and they sang to it at the setting of the moon, and it was kind.”',
    '“Then the men of Sarnath came and drove them from their shore, and killed them all, and carried off the idol, and set it in a temple. Let it be written that the quay was left standing, and that four green fires are lit on it in the hour before the dawn as the lake comes up the steps, the smallest first, for the water rises by degrees. Let it be written that a thousand years is not so long to the ones who wait.”',
  ),
  'Atal’s Account of Barzai': note(
    'Set down by the priest of Ulthar as he was told it, and then as he was not told it. “Barzai the Wise went up Hatheg-Kla in the cold of the year to see the gods of earth dance, as they do on clear nights when the moon is out. I went with him as far as the last cairn. He would not wait. He was a proud man, and he said that a man who is afraid will see nothing, and that he was not afraid.”',
    '“I stayed in the cairn. I saw the moon, and the motes come down into the air as they do before the gods begin; I saw the clouds close from behind, and the sky go black. Barzai’s voice came down to me, very clear, once. The gods of earth are not the only gods who dance on that peak. The wise man must be afraid, and keep a steady head, and stand where the stones are opened, and wait for the gloaming and the lights, as I did. He did not wait.”',
  ),
  'The Alert’s Log': note(
    'Entries in a ship’s log, in a mate’s upright hand, the ink going to a sailor’s scrawl. “The island rose in the night. It was not an island; it was a coast, and the coast was a wall, and the wall was set about with angles that did not meet. We landed, six of us, and found a door the size of a barn’s, with the lintel carved in a script that gave Johansen a headache.”',
    '“Before we dared put a hand to it we lit four lamps along the landing, low to high, in the order the water had been going out, for the old stones were slick with it and Johansen would have it so. Then Donovan, who was the bravest and the stupidest, pressed a panel, and the door swung down. I will not write what the sea took from us as the toll. The log ends here, as the ship must have.”',
  ),
};
