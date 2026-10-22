/**
 * The discoveries of the waking world's and the dream-lands' open horrors (round 63; data/discoveries.ts): for each, what is read in
 * the court before its gate, what is done there, and how the place answers, told in the horror's own story. A vigil asks what the story
 * asks (the dark for the Colour, the hour before the dawn for a man who will not be woken, a storm for the lightning, a steady mind for a
 * Gorgon's porch); an offering gives what the horror takes (blood for a god of serpents, the mind for a Black Man's book, a dose for
 * a sleep under the pyramids, Echoes for the sea). Data only.
 */

import { piece, spot } from './arenaWays';
import { leaf, offer, read, rite, vigil, type Discovery } from './discoveries';

export const EARTH_DISCOVERIES: Readonly<Record<string, Discovery>> = {
  colour_out_of_space: {
    title: 'What the Well Gave Back',
    start: 'A dam stands where the Gardner farm was. The water behind it is the wrong colour at the edges.',
    steps: [
      read("The Surveyors' Report", "The reservoir's engineers left a report in the court before the sluice. Read what they found at the old Gardner place."),
      rite('Four lanterns of the Gardner family stand along the court to the dam. They went out one by one, the least before the greatest. Light them as they went.'),
      vigil(spot(17, 5.4), piece('meteor', { glow: 'magenta', size: 0.9 }), 34, { hour: ['deep'], dark: true }, 'THE LIGHT THAT COMES UP FROM THE STONE IS NOT ANY COLOUR YOU HAVE A NAME FOR', 'A shard of the stone lies at the dam’s foot. Stand at it in the deep of the night, with no lamp near, until the colour shows itself.'),
    ],
    leaves: [leaf("The Surveyors' Report", 8, -3.6)],
    shut: 'The seal on the sluice is stained a colour that moves when it is not looked at. It will not open to one who has not seen what the stain is.',
    opens: 'THE SLUICE GIVES. WHATEVER WAS IN THE WELL IS AWAKE',
    done: 'The Colour is gone from the heath, or gone into the ground. The water covers the Gardner place at last.',
    reward: { echoes: 900 },
  },
  black_man: {
    title: 'The Signing',
    start: 'The ravine closes about a cleft, and the cleft is shut with a stone. Someone has been here, and left their candles.',
    steps: [
      read("Goodwife Pickman's Deposition", 'A deposition of 1692 lies in the court before the ravine. It tells what was seen on Meadow Hill, and what was signed there.'),
      rite('Three black candles for the coven. Light the least before the greatest, as the deposition says they were lit.'),
      offer(spot(15, -5), piece('altar_stone', { size: 1.1 }), { kind: 'mind', n: 14 }, 'sign the book with a part of your mind', 'THE NAME IS GIVEN, NOT LOST. THE STONE AT THE CLEFT STIRS', 'A flat stone stands in the court where the book was laid. The Black Man’s book is signed in what a person can least spare. Give him a part of your mind, and he will open the way.'),
    ],
    leaves: [leaf("Goodwife Pickman's Deposition", 9, 3.4)],
    shut: 'The stone in the cleft is set so close that no knife would go between. It has not been moved, and it is waiting to be asked.',
    opens: 'THE STONE IN THE CLEFT TURNS. SOMEONE IS EXPECTING YOU',
    done: 'The Black Man is gone from the ravine. Your name feels, a little, like someone else’s.',
    reward: { echoes: 1000, insight: 1 },
  },
  shub_niggurath: {
    title: 'The Pledge of the Wood',
    start: 'The trees have grown together at the foot of Sentinel Hill. They lean, all of them, toward one gap.',
    steps: [
      read('A Tax Assessor’s Memorandum', 'An assessor’s memorandum lies in the court before the grove. It says what the farmers say of the wood in a high wind.'),
      vigil(spot(16, -5.6), piece('horn_tree', { size: 0.8 }), 28, { sky: ['storm', 'gale'] }, 'THE WHOLE WOOD SPEAKS, ONE TREE AFTER ANOTHER, IN A RISING BLEAT', 'Stand by the tree with the horns when the wind is up, a gale or a storm, and hear the wood speak. It will not answer in a calm.'),
      offer(spot(12, 4.8), piece('altar_stone', { size: 1.2 }), { kind: 'blood', n: 16 }, 'lay your blood on the stone', 'THE WOOD TAKES THE PLEDGE. A THOUSAND THINGS STIR IN THE LEAVES', 'The wood takes a pledge of the living from those who come to its door. Lay a little of your blood on the stone beside the gap.'),
    ],
    leaves: [leaf('A Tax Assessor’s Memorandum', 7, 3.2)],
    shut: 'The trees have closed the gap with a curtain of living wood. It rustles as you come near, and it is not the wind.',
    opens: 'THE WOOD PARTS. SOMETHING VERY LARGE IS WAITING BEYOND IT',
    done: 'The Black Goat is gone from the wood, and the trees stand a little further apart.',
    reward: { echoes: 1100 },
  },
  medusa_gorgon: {
    title: 'The Porch at Dusk',
    start: 'The porch is all that stands of the house. On the porch, people stand, and none of them has moved since you came.',
    steps: [
      read('The Overseer’s Letter', 'The overseer’s last letter lies in the court before the porch. It says when she walks, and how one lives who goes to her.'),
      vigil(spot(15, -4.6), piece('column', { size: 1.1 }), 30, { hour: ['gloaming'], mind: { from: 'lucid', to: 'uneasy' } }, 'THE FLOOR IS MARKED IN THE OLD WAY. KEEP YOUR EYES ON IT, AND YOUR HEAD CLEAR', 'Wait at the foot of the porch in the gloaming, when she walks, with a mind kept clear. A mind that frays loses the hour.'),
    ],
    leaves: [leaf('The Overseer’s Letter', 8, 3.4)],
    shut: 'The door of the porch is shut with a lock no key was ever made for. It will open at dusk, to one who has not looked up.',
    opens: 'THE DOOR OF THE PORCH SWINGS. THE FLOOR WITHIN IS MARKED IN STONE',
    done: 'The Gorgon of Medusa’s Coil is gone, and the people on the porch are only statues.',
    reward: { echoes: 1000 },
  },
  martins_beach_horror: {
    title: 'The Sea’s Account',
    start: 'The sea wall is high, and the gate in it was built to be shut. The water at its foot is colder than the air.',
    steps: [
      read('The Coastguard’s Log', 'The coastguard’s log is in the court before the sea wall. It says what came ashore, and what the water was paid.'),
      vigil(spot(15, -5.2), piece('rowboat', { size: 1.1 }), 26, { sky: ['rain', 'storm', 'gale'] }, 'A WIND FROM THE SOUTH-EAST, AND IN IT SOMETHING VERY LARGE ASKING FOR SOMETHING VERY LARGE', 'Stand by the beached boat when the weather is up, rain or storm or gale, and hear the sea ask. It does not ask in a calm.'),
      offer(spot(11, 5), piece('chest', { size: 1.1 }), { kind: 'echoes', n: 200 }, 'lay 200 Echoes on the wall', 'THE WATER TAKES THE COIN. THE TIDE TURNS IN ITS TIME', 'The water takes coin, and takes it gladly. Leave 200 Echoes in the sea chest at the foot of the wall.'),
    ],
    leaves: [leaf('The Coastguard’s Log', 7, 3.6)],
    shut: 'The sea gate is shut with a bar of old timber, and the sea pushes at it from the other side, patiently, in the dark.',
    opens: 'THE BAR LIFTS OF ITS OWN WEIGHT. THE SEA IS LET IN, BY SOMEONE WHO KNEW THE WAY',
    done: 'The thing from Martin’s Beach has gone back into the water, and the sea wall is quiet.',
    reward: { echoes: 1100 },
  },
  simon_orne: {
    title: 'The Hour Before Sunrise',
    start: 'The wall of the burying ground is low, and the gate is old. Neither was ever meant to keep the living out.',
    steps: [
      read("Orne's Letter to Curwen", 'A letter lies in the court before the gate. It is from Simon Orne to his friend in Providence, and it speaks of two empty graves.'),
      read('The Sexton’s Ledger', 'The sexton’s ledger lies by the gate. It tells which grave is Orne’s, and what the sexton has learned to do about it.'),
      vigil(spot(16, 5), piece('grave_round', { size: 1.1 }), 32, { hour: ['waning'] }, 'THE GROUND UNDER THE STONE IS FIRM, AND IT IS BREATHING', 'Stand by Orne’s stone in the last hour of the night, before the dawn that does not come, as the sexton did. A grave that is empty should be watched.'),
    ],
    leaves: [leaf("Orne's Letter to Curwen", 8, -3.8), leaf('The Sexton’s Ledger', 12, 3.6)],
    shut: 'The iron gate has a padlock on it, and the lock is warm to the hand. It has been kept shut by someone who was courteous about it.',
    opens: 'THE PADLOCK OPENS WITH THE SMALLEST OF SOUNDS. THE SEXTON’S WATCH IS KEPT',
    done: 'Simon Orne is at rest, or has gone somewhere that is not a grave. The stone has stopped moving.',
    reward: { echoes: 1000 },
  },
  edward_hutchinson: {
    title: 'The Rod and the Lamps',
    start: 'A gatehouse with a rod on its roof as tall as a ship’s mast. The rod is bright, though there is no storm.',
    steps: [
      read('The Pawtuxet Rod', 'An account of the Pawtuxet road lies in the court before the gatehouse. It says why the farmers laid lamps along the lane.'),
      rite('Four lamps that do not burn stand along the court. Light them from the road toward the house, never the other way, as the neighbours did.'),
      vigil(spot(14, -5), piece('statue_obelisk', { size: 0.9 }), 14, { sky: ['storm'] }, 'THE ROD IS BRIGHT. STAND IN THE YARD WITH YOUR ARMS OUT, AS HE DID', 'Stand under the obelisk when the sky breaks, a storm, and do not run from it. The lightning comes down the rod as if called.'),
    ],
    leaves: [leaf('The Pawtuxet Rod', 8, 3.8)],
    shut: 'The gate of the manor is bound to the rod by a chain no storm has ever broken. It will not open to one who comes in by the dark end first.',
    opens: 'THE CHAIN FALLS FROM THE ROD. SOMETHING IN THE HOUSE HAS BEEN WAITING ON THE WEATHER',
    done: 'Edward Hutchinson is gone from the Pawtuxet road, and the rod on the gatehouse roof is dark.',
    reward: { echoes: 1100 },
  },
  colossus_pyramids: {
    title: 'The Sleeper at the Paw',
    start: 'A wall as thick as a street is wide. The pylons of its gate were not made for men.',
    steps: [
      read('A Letter from Gizeh', 'A letter on hotel paper lies in the court before the gate. It speaks of a stair beneath the sphinx’s paw, and a cup at the head of it.'),
      rite('Four braziers before the avenue. They are lit as the stars set, the great one first and the small last.'),
      offer(spot(13, -5.2), piece('bowl', { size: 2.2 }), { kind: 'dose' }, 'pour a dose of the Laudanum into the basin', 'THE SLEEP THAT IS NOT A SLEEP. THE GATE OPENS BELOW THE PAW', 'A stone basin as broad as a well stands at the paw. The sleep one takes in it is a drug; pour it a dose of the Laudanum, and wake to find the way open.'),
    ],
    leaves: [leaf('A Letter from Gizeh', 8, 3.6)],
    shut: 'The great door has no handle, no hinge and no seam. It was shut by something that does not need to open it.',
    opens: 'THE GREAT DOOR DRAWS BACK INTO ITS PYLONS. THE AVENUE BEYOND IS DARK AND VERY LONG',
    done: 'The Colossus is gone from beneath the pyramids, and the paw of the sphinx is only stone.',
    reward: { echoes: 1300 },
  },
  yig: {
    title: 'The Account of the Serpents',
    start: 'An earthwork in a ring, and a gap in it as wide as a jaw. Nothing grows on the ring. Something lives in it.',
    steps: [
      read('The Settler’s Warning', 'A settler’s warning lies in the court before the gap. It tells what the old people did in the spring, and what happened to those who did not.'),
      offer(spot(12, -4.8), piece('altar_stone', { size: 1.1 }), { kind: 'blood', n: 14 }, 'lay a little blood on the flat stone', 'THE RATTLING STOPS. THE EARTH OF THE RING SETTLES, AS A THING SETTLES THAT HAS BEEN FED', 'The old people laid a little of their own blood on a flat stone, and said a word. Lay yours on the stone before the gap, and be sorry for it.'),
    ],
    leaves: [leaf('The Settler’s Warning', 7, 3.4)],
    shut: 'The gap in the ring is thick with coiled things that do not move when you come near, and do not need to.',
    opens: 'THE COILS LIE ASIDE. THE GAP IS WIDE ENOUGH FOR ONE',
    done: 'Yig is gone from the mound, and the serpents have gone into the ground after him.',
    reward: { echoes: 1000 },
  },
  nug: {
    title: 'The Three Lifts',
    start: 'Terraces of black stone, narrowing as they climb, and a mouth at the foot of them. The mouth is warm.',
    steps: [
      read('A Priest’s Reckoning of the Pit', 'A strip of dressed hide lies in the court before the mouth. It tells how the mound was raised in three lifts, and how its god is fed.'),
      rite('Three fires for the three lifts of the mound. The deepest burns first, as the hide says it must.'),
      offer(spot(14, 5.4), piece('altar_stone', { size: 1.3 }), { kind: 'blood', n: 20 }, 'give the god his meat from your own hand', 'NO MORE THAN A MAN CAN SPARE. NO LESS THAN A MAN WILL MISS', 'The god takes his meat from the hand that offers it, a little at a time. Lay a measure of your blood on the red stair, no more and no less.'),
    ],
    leaves: [leaf('A Priest’s Reckoning of the Pit', 9, -3.8)],
    shut: 'The mouth of the mound is shut with a slab of black stone, red at the foot of it. The stone is warm, and it has been fed before.',
    opens: 'THE SLAB RISES INTO THE ZIGGURAT. THE STAIR BEYOND IS RED',
    done: 'Nug is gone from the mound. The deepest fire has gone out, and the stair is only stone.',
    reward: { echoes: 1100, insight: 1 },
  },
  bokrug: {
    title: 'The Complaint of Ib',
    start: 'The stones of the quay are green with something older than moss, and the water at their foot does not move.',
    steps: [
      read('The Ib-Folk’s Complaint', 'A green stone cut with letters lies in the court before the quay. It tells how the Ib-folk lost their idol, and what the lake remembers.'),
      rite('Four green fires of Ib stand on the quay. Light them as the water rises, the small before the great.'),
      vigil(spot(15, -5), piece('slab', { glow: 'green', size: 0.7 }), 30, { hour: ['waning'] }, 'THE LAKE COMES UP THE STEPS BY DEGREES. IT HAS BEEN COMING FOR A THOUSAND YEARS', 'Stand at the green slab in the last hour, before the dawn, as the lake comes up the steps. A thousand years is not so long for those who wait.'),
    ],
    leaves: [leaf('The Ib-Folk’s Complaint', 8, 3.6)],
    shut: 'The water at the foot of the quay lies still as glass across the way in, and what it holds is not a reflection.',
    opens: 'THE WATER PARTS AT THE QUAY’S FOOT. SOMETHING GREEN LOOKS UP',
    done: 'Bokrug has gone back into the lake. The green fires of Ib are out, and the water moves again.',
    reward: { echoes: 1200 },
  },
  other_gods: {
    title: 'The Wise Man’s Fear',
    start: 'Standing stones in a ring on the peak, close as teeth, and a gap where two of them were drawn apart.',
    steps: [
      read('Atal’s Account of Barzai', 'Atal’s account lies in the court below the ring. It tells how Barzai the Wise went up Hatheg-Kla, and what he would not wait for.'),
      vigil(spot(15, 5), piece('trilith', { size: 0.8 }), 30, { sky: ['motes'] }, 'THE MOTES COME DOWN INTO THE AIR, AS THEY DO BEFORE THE GODS BEGIN', 'Stand by the three stones when the motes come down into the air, as they do before the gods of earth begin to dance. The wise man must be afraid, and wait.'),
    ],
    leaves: [leaf('Atal’s Account of Barzai', 8, -3.6)],
    shut: 'The two stones that were drawn apart have been drawn together again, and are as close as teeth, and are cold.',
    opens: 'THE TWO STONES DRAW APART. THE GODS OF EARTH ARE NOT THE ONLY ONES WHO DANCE HERE',
    done: 'The Other Gods have gone from the peak of Hatheg-Kla, and the stones stand as they stood.',
    reward: { echoes: 1300, insight: 1 },
  },
  cthulhu: {
    title: 'The Door at R’lyeh',
    start: 'The angles are wrong. The door is the only thing in the wall that is not.',
    steps: [
      read('The Alert’s Log', 'A ship’s log lies in the court before the door. It tells how six men landed, and what was lit before a hand was put to the stone.'),
      rite('Four lamps of the Alert stand along the landing. Light them low to high, in the order the water was going out.'),
      offer(spot(12, -5.2), piece('hexped', { glow: 'green', size: 0.9 }), { kind: 'echoes', n: 400 }, 'lay 400 Echoes on the panel', 'THE SEA TAKES ITS TOLL. THE PANEL TURNS UNDER THE HAND', 'The sea takes its toll at the door. Lay 400 Echoes on the carved panel, and press it as Donovan did.'),
    ],
    leaves: [leaf('The Alert’s Log', 9, 3.6)],
    shut: 'The door is the size of a barn’s, and does not open, and does not look as if it had ever been meant to be opened by men.',
    opens: 'THE DOOR SWINGS DOWN AND OUTWARD, AND THE SEA GOES IN. THE DEAD ONE IS AWAKE',
    done: 'Cthulhu has gone back under the sea, or is only dreaming of coming out. The door of R’lyeh stands open and the sea goes in.',
    reward: { echoes: 1800, insight: 1 },
  },
};
