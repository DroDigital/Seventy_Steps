"""The four cells of a walk (or move) cycle, by body plan, as `prompts.py` asks an image model for them.
LEGGED gaits end with 'the other leg leads' in cells 3 and 4; the others are one smooth loop."""

LEGGED = ('biped', 'hunched', 'robed', 'quad', 'toad', 'multi', 'waddle')

CELLS = {
    'biped': """\
1. CONTACT: the near leg (toward the viewer, drawn lighter) reaches forward with the heel down and the far leg (drawn darker, partly behind the near one) trails behind with the toe down: the widest stride. The arms swing the opposite way to the legs (the far arm forward).
2. PASSING: the near leg stands straight under the body taking the weight; the far leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: now the far leg (darker) reaches forward with the heel down and the near leg (lighter) trails behind: the mirror of cell 1's legs, NOT a copy of it. The arms swap too.
4. PASSING ON THE OTHER FOOT: the far leg stands straight under the body; the near leg is bent, its foot lifted, swinging forward past it; the body is 1 pixel higher.""",
    'hunched': """\
A heavy, hunched, shambling walk on bent knees; the long arms swing opposite to the legs and the hands hang low. The body leans forward by the same amount in every cell and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near leg (lighter) steps forward, foot flat; the far leg (darker, behind it) trails with the toe down; the far arm swings forward, the near arm back.
2. PASSING: the near leg is straight under the body taking the weight; the far leg is bent and swinging forward past it, foot lifted; the arms hang close to the body.
3. CONTACT ON THE OTHER FOOT: the far leg (darker) steps forward and the near leg trails behind; the near arm swings forward, the far arm back: the mirror of cell 1, NOT a copy.
4. PASSING ON THE OTHER FOOT: the far leg is straight under the body; the near leg is bent and swinging forward past it; the arms hang close to the body.""",
    'robed': """\
The long robe hides the legs, so the walk is told by the hem and the shoes. The robe's outline keeps one size in every cell; only the hem, the shoe tips and the cloth swing.
1. CONTACT: the near foot (toward the viewer) steps forward out of the hem, heel down; the hem pushes forward over it; the far foot's toe shows behind and the robe's back edge trails backward.
2. PASSING: the feet are together under the body; the hem hangs almost straight, swaying a little; the sleeves sway; the body is 1 pixel higher.
3. CONTACT ON THE OTHER FOOT: the far foot (darker) now steps forward out of the hem and the near foot shows behind, the cloth swung the same way: the mirror of cell 1's feet, NOT a copy.
4. PASSING ON THE OTHER FOOT: the feet together again, the hem swaying the opposite way to cell 2; the body is 1 pixel higher.""",
    'quad': """\
A four-legged trot, the legs moving in diagonal pairs. The legs on the far side of the body are drawn darker and partly behind the near ones. The body stays level and rises 1 pixel at the passing poses (2 and 4).
1. CONTACT: the near front leg and the far hind leg reach forward; the far front leg and the near hind leg are pushed back: the widest stride.
2. PASSING: all four legs gather beneath the body, bent, the lifted pair swinging forward; the body is 1 pixel higher.
3. CONTACT WITH THE OTHER PAIR: the far front leg and the near hind leg reach forward; the near front leg and the far hind leg are pushed back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the legs gather beneath the body, the other pair now swinging forward; the body is 1 pixel higher.""",
    'toad': """\
A heavy, low, waddling crawl: the squat body rocks a little as the short legs take turns in diagonal pairs. The body stays low and keeps one height in every cell (it rises only 1 pixel at the passing poses 2 and 4). The legs on the far side are drawn darker and partly behind.
1. CONTACT: the near front leg and the far hind leg reach forward and are planted; the far front leg and the near hind leg are back.
2. PASSING: the body moves forward over bent legs, the lifted pair swinging forward; the body is 1 pixel higher.
3. CONTACT WITH THE OTHER PAIR: the far front leg and the near hind leg reach forward; the near front leg and the far hind leg are back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the other pair swinging forward; the body is 1 pixel higher.""",
    'multi': """\
Many legs walking in a wave: in every cell some legs are planted and some are lifted and reaching forward. Count the near-side legs from the head: the odd-numbered legs step together, the even-numbered legs step together, and they take turns. The legs on the far side are drawn darker and partly behind. The body keeps one height and moves level, rising 1 pixel at the passing poses (2 and 4).
1. CONTACT: the odd-numbered legs reach forward and are planted; the even-numbered legs are pushed back.
2. PASSING: the planted legs take the weight; the other set is lifted and swinging forward.
3. CONTACT, THE OTHER SET: the even-numbered legs reach forward and are planted; the odd-numbered legs are pushed back: the swap of cell 1, NOT a copy of it.
4. PASSING AGAIN: the odd-numbered legs are lifted and swinging forward.""",
    'waddle': """\
A penguin's waddle: the whole body rocks, tipping forward over the stepping foot, and the small flippers swing opposite to the feet.
1. CONTACT: the near foot steps forward, flat on the ground, the body tipped slightly forward; the far foot is behind with its toes down; the near flipper swings back, the far flipper forward.
2. PASSING: the body is upright and 1 pixel higher; the lifted foot passes beside the standing foot; the flippers hang by the body.
3. CONTACT ON THE OTHER FOOT: the far foot steps forward, the near foot is behind, the body tipped slightly forward, the flippers swapped: the mirror of cell 1, NOT a copy.
4. PASSING ON THE OTHER FOOT: upright, 1 pixel higher, the near foot lifted and passing beside the standing one.""",
    'flap': """\
It does not walk: it hovers and beats its wings. Only the wings (and 1 pixel of body bob) move; the head, the body, the limbs and the tail keep the reference's pose and place in every cell. Keep every wing position inside the cell with a margin.
1. WINGS UP: the wings raised high behind the back; the body at its lowest.
2. DOWNSTROKE: the wings level, spread out and pointing back; the body 1 pixel higher.
3. WINGS DOWN: the wings swept down below the body; the body at its highest, 2 pixels above cell 1; the tail swung slightly.
4. UPSTROKE: the wings level again, rising; the body 1 pixel higher than cell 1.""",
    'slither': """\
No legs: it slithers in an S-wave that travels along the body from the head to the tail. Its length and thickness stay the same in every cell; only the curves move. The head stays at one height (within 1 pixel) and the lowest part of the body stays on the ground line.
1. WAVE PHASE 0: the body in an S-curve, its crests and dips at set places along the length.
2. QUARTER WAVE LATER: the crests and dips have moved a quarter of a wavelength toward the tail.
3. HALF WAVE LATER: the curve is the mirror of cell 1: where the body arched up in cell 1 it now dips, and the other way round.
4. THREE-QUARTER WAVE LATER: the crests have moved on again; the next step brings it back to cell 1, so the four cells loop.""",
    'ooze': """\
No legs: it crawls by flowing. The mass keeps about the same size in every cell, with one flat base on the ground line; it heaves forward in surges. Any eyes, horns, tentacles or orbs keep their colours and sizes; nothing new grows.
1. STRETCH: the front of the mass reaches forward, low and long; the rear gathers; the highest point sits toward the rear.
2. GATHER: the rear pulls up toward the middle: the whole mass shortens and rises about 2 pixels; the surface features have moved forward.
3. SECOND SURGE: a different lobe or tentacle reaches forward (not the same shape as cell 1); the highest point sits toward the front.
4. GATHER AGAIN: the mass bunches and rises, the surface features moved forward again; the next step brings it back to cell 1, so the four cells loop.""",
    'float': """\
No legs, no steps: it glides forward just above the ground, bobbing gently. The cloak's hem and any ragged edges ripple in a wave that trails behind it (to the right). Its outline and size stay the same in every cell; its lowest point stays at the reference's level, plus the bob.
1. LOW: the figure at its lowest; the hem swept back to the right and fairly flat.
2. RISING: the figure 1 pixel higher; the hem's ripple has moved a quarter of the way up the cloth; the lower hem hangs down more.
3. HIGH: the figure at its highest, 2 pixels above cell 1; the hem rippled the other way, its edge curling forward, the cloak billowing slightly.
4. FALLING: the figure 1 pixel lower than cell 3; the hem swinging back to trail; the next step brings it back to cell 1, so the four cells loop.""",
    'sway': """\
No stepping legs: it shuffles forward rigidly in a rocking, waddling glide. The body keeps its shape; it tilts about its base by 1 or 2 pixels and bobs 1 pixel; any arms, fans, heads or limbs swing after it, a little behind the body's motion.
1. TILT FORWARD: the top leans forward (to the left) 1 or 2 pixels, the front of the base pressing down; the limbs trail back.
2. UPRIGHT, RISING: the body upright and 1 pixel higher; the limbs hang straight.
3. TILT FORWARD ON THE OTHER SIDE: the top leans forward again with the other side of the base leading and the limbs swung the other way: the mirror of cell 1, NOT a copy.
4. UPRIGHT, RISING: upright and 1 pixel higher, the limbs hanging the other way to cell 2.""",
    'drift': """\
It hovers and drifts forward, with no steps: the limbs or tentacles ripple in a wave and the body bobs 1 pixel. The body keeps one shape and size; only the limbs, the tentacles and the bob change.
1. LIMBS BACK: the limbs and tentacles swept back and down; the body at its lowest.
2. RISING: the limbs halfway; the body 1 pixel higher.
3. LIMBS FORWARD: the limbs swept forward and up, the near-side and far-side limbs swapped from cell 1; the body at its highest, 2 pixels above cell 1.
4. FALLING: the limbs halfway again, mid-ripple; the body 1 pixel lower than cell 3; the next step brings it back to cell 1, so the four cells loop.""",
    'jelly': """\
It swims forward by pulsing: the bell contracts and opens while the tentacles trail and sweep. The creature keeps one overall size and colour.
1. RELAXED: the bell wide and low; the tentacles trailing straight down and back.
2. CONTRACTING: the bell narrowing and taller; the tentacles drawn up toward it.
3. CONTRACTED: the bell at its narrowest and the body at its highest, 2 pixels above cell 1; the tentacles bunched, then swept back.
4. OPENING: the bell widening again; the tentacles reaching out and down; the next step brings it back to cell 1, so the four cells loop.""",
    'pulse': """\
It tumbles and glides forward, pulsing: the surface pattern (stripes, veins, marks) turns a quarter turn from cell to cell, always moving forward (to the left), while the whole body squashes 1 pixel and bobs 1 pixel. Its outline, colours and size stay the same.
1. The pattern at its starting angle; the body at its lowest, slightly squashed.
2. The pattern turned a quarter turn forward; the body 1 pixel higher.
3. The pattern turned another quarter (half a turn from cell 1); the body at its highest, rounder.
4. The pattern turned another quarter; the body coming down; the next step brings it back to cell 1, so the four cells loop.""",
    'swarm': """\
A scurrying heap: the whole pile shuffles forward while the individual animals scramble. The number of animals, their size and their colours stay the same; the pile keeps one overall size and sits on the ground line.
1. The front animals' paws reach forward; the pile low and stretched slightly forward; a few tails whip back.
2. The animals bunch together; the pile shorter and 1 or 2 pixels higher.
3. Different animals lead (the lumps of the pile rearranged: not a copy of cell 1); the pile stretched forward again; tails the other way.
4. The animals bunch again, 1 or 2 pixels higher; the next step brings it back to cell 1, so the four cells loop.""",
    'lumber': """\
A colossal, slow, heavy lumbering walk, as though every step moves the whole mass: the huge body rocks forward and back about its base and rises at the passing poses. It is one colossal creature: keep its size, outline, colours, markings and every limb or tentacle exactly as in the reference.
1. STEP: the body tilts forward and sinks 2 pixels, its weight on the leading side; the arms or tentacles swing forward and down; the trailing edge lags behind.
2. PASSING: the body upright and 2 pixels higher; the weight in the middle; the arms or tentacles hanging near it.
3. STEP ON THE OTHER SIDE: the body tilts forward and sinks 2 pixels on the other side, the arms or tentacles swung the other way: the mirror of cell 1, NOT a copy.
4. PASSING: upright and 2 pixels higher again, the arms or tentacles hanging the other way to cell 2.""",
}
