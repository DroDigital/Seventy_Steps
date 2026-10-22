/**
 * The discoveries of the Beyond's open horrors (round 63; data/discoveries.ts): the second act of a play, the toll of a gate, a court
 * where a sound is heard only by a mind that is coming loose, a wizard's tithe, an organ played by the pipers that cannot be heard from a
 * mind that is not kept, and the pale prisms that receive only the lucid. Data only.
 */

import { piece, spot } from './arenaWays';
import { leaf, offer, read, rite, vigil, type Discovery } from './discoveries';

export const BEYOND_DISCOVERIES: Readonly<Record<string, Discovery>> = {
  hastur: {
    title: 'The Second Act',
    start: 'Towers behind the moon, and a wall the colour of an old bruise. A banner hangs from nothing, and does not stir.',
    steps: [
      read('A Page of the Second Act', 'A single yellowed leaf lies in the court before the gates. It is from a play, and it says when a man may safely look at the Sign.'),
      vigil(spot(16, -5.4), piece('banner', { size: 0.9 }), 34, { hour: ['waning'], mind: { from: 'fractured', to: 'unmoored' } }, 'THE BLACK STARS ARE NOT STARS. THE LAKE OF HALI IS NOT A LAKE. THE SIGN IS SHOWN', 'Stand by the banner in the last hour, with a mind already come loose. Carcosa shows its gates to those who have begun to unravel, and to no one else.'),
    ],
    leaves: [leaf('A Page of the Second Act', 8, 3.6)],
    shut: 'The gates of Carcosa show nothing, and the nothing is patient. They will open to one who has already read the second act.',
    opens: 'THE GATES SHOW THEIR OTHER FACE. THE YELLOW KING HAS BEEN EXPECTING AN AUDIENCE',
    done: 'Hastur has gone from Carcosa, or has stopped being watched. The towers behind the moon are dark.',
    reward: { echoes: 1500, insight: 1 },
  },
  yog_sothoth: {
    title: 'The Toll of the Gate',
    start: 'A wall of crystal that shows nothing, and a gate that shows everything. There is a mark beside it for where one should stand.',
    steps: [
      read('On Gates, and the One Who Is a Gate', 'A copied page lies in the court before the threshold. It says what the gate asks of one who would pass, and what it takes in the end.'),
      rite('Four lights on the threshold. Light them from the outside toward the inside, as one goes in, so that the gate may know how you walk.'),
      offer(spot(12, 5.2), piece('hexped', { glow: 'purple', size: 0.9 }), { kind: 'mind', n: 18 }, 'give the gate a measure of your mind', 'THE TOLL IS PAID. THE GATE KNOWS WHERE YOU HAVE BEEN, AND WHERE YOU ARE GOING', 'The gate takes a measure of what is carried in the head as its toll. It is a fair toll, and not to be bargained with. Lay it on the pedestal.'),
    ],
    leaves: [leaf('On Gates, and the One Who Is a Gate', 9, -3.6)],
    shut: 'The gate shows you every place you have been, and every place you will go, and none of them is through it. It is shut.',
    opens: 'THE GATE SHOWS A FLOOR UNDER YOUR FEET. IT IS THE ONE YOU ARE STANDING ON',
    done: 'Yog-Sothoth has been passed, and has passed. The threshold is only crystal, and shows what it is.',
    reward: { echoes: 1700, insight: 1 },
  },
  azathoth: {
    title: 'The Piping',
    start: 'No wall could hold what is at the centre of all. This one is here to keep the rest of us from knowing it.',
    steps: [
      read('A Dreamer’s Note on the Court', 'A dreamer’s note lies in the court before the wall. It says when the piping is heard, and that it is heard only by those who are coming loose.'),
      vigil(spot(16, 5.4), piece('hexped', { glow: 'magenta', size: 0.9 }), 38, { dark: true, mind: { from: 'fractured', to: 'unmoored' } }, 'IT BEGINS AT THE LEFT EAR. IT IS THIN AND MONOTONOUS, AND IT IS NOT A BAD SOUND, AND THAT IS THE HORROR', 'Stand where the wall is thinnest, in the dark, with no lamp near and a mind already coming loose. There is nothing there that will be understood.'),
    ],
    leaves: [leaf('A Dreamer’s Note on the Court', 8, -3.8)],
    shut: 'The wall is of a stone so dark that it takes the light, and does not give it back. It has no gate that a steady mind can see.',
    opens: 'THE WALL IS FOUND TO HAVE ALWAYS BEEN OPEN. THE PIPING HAS STOPPED',
    done: 'Azathoth is gone from the Court, or has never been there. The piping is quiet for the first time in all the ages.',
    reward: { echoes: 2000, insight: 1 },
  },
  zkauba: {
    title: 'The Wizard’s Tithe',
    start: 'Terrace on terrace of a city that was left in a hurry, and a stair that goes into the wall. A hearth burns on the lowest terrace, and no one tends it.',
    steps: [
      read('The Tally of the Terraces', 'A thin sheet of no metal lies in the court before the stair. It is a tally in Carter’s hand, and it says what the wizard takes from those who pass.'),
      offer(spot(13, -5), piece('urn', { size: 1.4 }), { kind: 'echoes', n: 500 }, 'pay the wizard’s tithe: 500 Echoes', 'THE WIZARD WEIGHS IT, AND IS SATISFIED. THE STAIR OPENS', 'The wizard weighs what you carry, and cannot be cheated. Pay 500 Echoes into the urn at the foot of the stair, plainly.'),
    ],
    leaves: [leaf('The Tally of the Terraces', 8, 3.6)],
    shut: 'The stair goes into a wall that has no door, and every terrace above it is watching the place where a door would be.',
    opens: 'THE WALL OPENS ON A STAIR. THE WIZARD KEEPS IT STILL',
    done: 'Zkauba is gone from Yaddith, and the hearths of the terraces are still out.',
    reward: { echoes: 1800 },
  },
  daemon_pipers: {
    title: 'The Organ of the Pipers',
    start: 'Pipes of black stone, as tall as towers, all of them open at the top. They are not sounding. They are being listened to.',
    steps: [
      read('A Choirmaster’s Instruction', 'A copied score lies in the court before the organ. It says in what order the four pipes are lit, and what a head must be to stand near them.'),
      rite('Four lights for four pipes. The great note before the small, and a pipe lit out of its turn puts all the others out.'),
      vigil(spot(15, -5.4), piece('pipes', { size: 0.8 }), 36, { mind: { from: 'lucid', to: 'uneasy' } }, 'THE GREAT NOTE SOUNDS. SAY YOUR NAME TO YOURSELF, AND DO NOT STOP', 'Stand by the great pipe while it sounds, and keep a clear head. A head that is lost in it will be taken by the dancing, and the dancing does not end.'),
    ],
    leaves: [leaf('A Choirmaster’s Instruction', 9, 3.6)],
    shut: 'The gate between the pipes is a gap in a tune. It will open at the end of the phrase, for one who has stood in the whole of it.',
    opens: 'THE GAP BETWEEN THE PIPES WIDENS ON THE LAST NOTE. THE DANCING BEGINS WITHIN',
    done: 'The Daemon Pipers are silent. The organ stands open at the top, and the wind goes through it, and makes no tune.',
    reward: { echoes: 1900, insight: 1 },
  },
  ancient_ones: {
    title: 'The Empty Place',
    start: 'Pale prisms, set edge to edge in a ring, and one of them has been left out. Nothing stands in the gap, and it is clearly waiting.',
    steps: [
      read('A Note on the Prisms', 'A cold vellum slip lies in the court before the ring. It says the prisms will receive only a lucid mind, and what is to be laid in the empty place.'),
      vigil(spot(16, 5.2), piece('slab', { glow: 'green', size: 0.7 }), 30, { mind: { from: 'lucid', to: 'lucid' } }, 'THE RING HAS A PLACE IN IT. IT HAS BEEN KEPT, WITHOUT HURRY, FOR WHOEVER COMES', 'Stand by the pale slab with a lucid mind, and keep it so. The prisms do not turn away a troubled mind; they are simply not there.'),
      offer(spot(12, -4.8), piece('hexped', { glow: 'green', size: 0.9 }), { kind: 'dose' }, 'lay a dose of the Laudanum in the empty place', 'THE WORLD IS NOT DULLED. THE ONE THAT WAS LEFT OUT TAKES ITS PLACE', 'Lay a dose of the soothing that dulls the world in the empty place, as a sign that you mean to look at them undimmed.'),
    ],
    leaves: [leaf('A Note on the Prisms', 8, -3.6)],
    shut: 'The empty place in the ring is a gap exactly the size of a person, and the prisms on either side lean toward it, and do not close.',
    opens: 'THE SEVENTH PRISM COMES IN FROM WHEREVER IT WAS. THE RING IS WHOLE',
    done: 'The Ancient Ones have been met, and have been what they are. The ring of pale prisms is whole, and has gone quiet.',
    reward: { echoes: 2200, insight: 1 },
  },
};
