"""The 105 library entries for `prompts.py`: (key, name, gait, how it looks, an extra line or '').
The looks were written from the sprites themselves. SECTIONS says which are still without a four-frame
side walk (NEEDED), which already have one (HAVE), which have no legs (NO_LEGS) and the colossi."""

NEEDED = [
    # robed
    ('dagon_priest', 'Esoteric Order of Dagon Priest', 'robed', 'a tall figure in a heavy grey-brown robe with a long dark stole down the front and a tall pointed, fish-like hood; the hands hang at the sides', ''),
    ('dagon_priest#eldritch', 'Esoteric Order of Dagon Priest, eldritch form', 'robed', 'the same tall grey-brown robed priest with a dark stole and a pointed hood, now with glowing violet eyes and a violet glow on its head', ''),
    ('cthulhu_cultist', 'Cthulhu Cultist', 'robed', 'a figure in a plain black hooded robe that falls to the ground, the face in shadow, the hands hidden in the sleeves', ''),
    ('black_man', 'The Black Man', 'robed', 'a tall, thin figure in a black cloak and hood with two glowing violet eyes', ''),
    ('edward_hutchinson', 'Edward Hutchinson', 'robed', 'a figure in a long black hooded cloak with the face hidden', ''),
    ('charles_le_sorcier', 'Charles le Sorcier', 'robed', 'a figure in a long black hooded robe with glowing red eyes in the dark hood', ''),
    ('keziah_mason', 'Keziah Mason', 'robed', 'a hunched old witch with grey hair in a long, tattered dark-brown robe, one hand held out in front', 'Keep whatever she holds exactly as in the reference. She walks hunched, with short steps.'),
    # upright on two legs
    ('terrible_old_man', 'The Terrible Old Man', 'biped', 'an old white-haired man in a beige-grey coat and trousers, standing upright', ''),
    ('nyarlathotep', 'Nyarlathotep', 'biped', 'a slender man in a tan suit with a blank pale bald face and glowing violet eyes', ''),
    ('simon_orne', 'Simon Orne', 'biped', 'a pale, white-faced bald man in a black coat and black trousers', ''),
    ('the_outsider', 'The Outsider', 'biped', 'a ragged, decayed green-black humanoid in tattered clothes with pale bone showing in patches', 'Keep the torn clothes and the pale patches as they are. A stiff, shambling walk, the arms hanging loose.'),
    ('serpent_man', 'Serpent Man of Valusia', 'biped', 'a slender olive-green, serpent-headed humanoid in a dark loincloth, with thin limbs and clawed feet', ''),
    ('hybrid_mummy', 'Hybrid Mummy', 'biped', 'a mummy in brown-striped bandages with a dark crocodile-like head', 'Keep it strictly in profile in all four cells: never turned toward the viewer, no three-quarter view, no raised knee facing the viewer.'),
    ('venusian_man_lizard', 'Venusian Man-Lizard', 'biped', 'an upright green lizard-man with a flat hammer-shaped head and a bundle of tentacles hanging over its chest', 'Keep the two legs clearly told apart: the far leg a darker green, with a visible gap between the legs in the contact poses (1 and 3).'),
    ('man_of_leng', 'Man of Leng', 'biped', 'a short, stocky figure in a rust-red hooded tunic with a grey, horned, animal-like face and bare grey legs', ''),
    ('ephraim_waite#eldritch', 'Ephraim Waite, eldritch form', 'biped', 'a stooped, green-skinned corpse-like man in a dark green suit with a bald head and long arms', ''),
    # hunched, heavy, long arms
    ('ghoul#eldritch', 'Ghoul, eldritch form', 'hunched', 'a hulking, hunched olive-green ghoul with long arms, clawed hands, a hooked dog-like snout and three glowing green eyes', ''),
    ('ym_bhi', 'Ym-bhi', 'hunched', 'a pale grey, smooth, stone-like hulking giant with huge arms hanging low, a hunched back and a small head', ''),
    ('martense_degenerate', 'Martense Degenerate', 'hunched', 'a hulking, shaggy black ape-like creature with dim amber eyes and long arms', ''),
    ('gnoph_keh', 'Gnoph-keh', 'hunched', 'a hulking black fur-covered ape-beast with arms reaching to the ground and glowing white eyes', ''),
    ('gug', 'Gug', 'hunched', 'a huge, hunched black giant with ochre spots on its body and pink-tipped claws', 'Keep the ochre spots and the pink claw tips.'),
    ('zkauba', 'Zkauba the Wizard', 'hunched', 'a hulking grey stone golem of cracked plates with violet eyes, a ribbed chest and huge arms that hang to the ground', ''),
    ('exham_troglodyte', 'Exham Priory Troglodyte', 'hunched', 'a gaunt, hunched, bone-pale humanoid with long limbs, a ragged loincloth, a bald head and sunken eyes', ''),
    ('gnorri', 'Gnorri', 'hunched', 'a hulking, hunched teal-grey creature with a mass of tentacles over its face, a row of fin-like spines down its back and long arms', 'Keep the face tentacles and the back spines; the tentacles sway a little.'),
    # four legs
    ('ghast', 'Ghast', 'quad', 'a long, pale cream beast with brown stripes and dark hooves, four long legs and no clear face', ''),
    ('cat_from_saturn', 'Cat from Saturn', 'quad', 'a sleek black panther-like cat with a tall curled tail and faint violet markings', 'The tail sways a little.'),
    ('gyaa_yothn', 'Gyaa-yothn', 'quad', 'a huge white four-legged bear-like beast with a black domed shell over its back and a flat white face', ''),
    ('bokrug', 'Bokrug', 'quad', 'a teal-grey, hound-like lizard with a skeletal ribcage, spines along its back, a long tail and four legs', ''),
    ('the_hound', 'The Hound', 'quad', 'a skeletal bone-grey winged dog with a visible ribcage, bat wings, glowing green eyes and a long tail', 'The wings stay folded and held high on its back (they may lift 1 pixel at the passing poses). It walks on the ground at the same height as the reference.'),
    ('shantak', 'Shantak', 'quad', 'a grey-black beast with a horse-like head and neck, a feathered body, large wings and bird claws', 'It walks on the ground with its wings folded against its sides, at the same height as the reference standing pose in every cell: no crouch, no raised wings.'),
    ('brown_jenkin', 'Brown Jenkin', 'quad', 'a brown-furred rat with a bearded human face, a long thin tail and four small clawed legs', 'The tail trails behind and sways a little.'),
    ('beast_in_the_cave', 'The Beast in the Cave', 'quad', 'a pale, white-haired, feral man-thing that crouches on all fours, in a ragged loincloth', 'It goes on all fours: the hands and the feet are its four legs.'),
    ('winged_hybrid', 'Winged Hybrid', 'quad', 'a small, black, bat-winged creature with a round body and dim eyes, crouched, its wings folded on its back', 'The wings stay folded on its back (they may lift 1 pixel at the passing poses). It walks in a low crouch at the same height as the reference.'),
    # squat toads and crawlers
    ('zoog', 'Zoog', 'toad', 'a squat rust-brown, frog-like creature with a domed, ridged back, four bent legs and small pale eyes', ''),
    ('moon_beast', 'Moon-beast', 'toad', 'a huge, pale, toad-like mass with grey spots, short stubby legs and a cluster of pink tentacles on its face', 'Keep the pink tentacles on its face; they sway a little.'),
    ('being_of_ib', 'Being of Ib', 'toad', 'a squat green, toad-like creature with blotchy patterns, big purple-pink ears and lips, and four stubby webbed feet', ''),
    ('nameless_city_reptile', 'Nameless City Reptile', 'toad', 'a squat tan, toad-like reptile with a wide mouth, hunched on four legs', ''),
    ('tsathoggua', 'Tsathoggua', 'toad', 'a bloated, black, toad-like god with a spotted back, pale round eyes with cross-shaped pupils and a wide flat mouth', ''),
    ('rhan_tegoth', 'Rhan-Tegoth', 'toad', 'a squat pale grey-beige, toad-like idol-creature covered in round bumps, with large eyes, a wide mouth and short stubby legs', ''),
    # many legs
    ('wamp', 'Wamp', 'multi', 'a brown, flat-bodied creature with a frog-like head and eight webbed legs', ''),
    ('thousand_young', 'Thousand Young of Shub-Niggurath', 'multi', 'a low black creature on thick, trunk-like legs, with tentacles rising from its back and a row of pale dots on its front', 'Keep the tentacles on its back; they sway a little while the legs walk.'),
    ('whisperer#eldritch', 'The Whisperer, eldritch form', 'multi', 'a pale pink spider-fly: a round body, antennae, insect wings and eight thin legs', 'The wings stay folded up on its back; the antennae sway a little.'),
    ('yekubian', 'Yekubian', 'multi', 'a pale, segmented, centipede-like creature on many legs, with one large round eye on a stalk-like head and a fan-shaped tail', 'Its long body flexes a little with the leg wave; keep its head at the same height in every cell.'),
    # the rest
    ('albino_penguin', 'Blind Albino Penguin', 'waddle', 'a tall, blind, pale grey-white penguin with a smooth body and no eyes', ''),
    ('night_gaunt', 'Night-gaunt', 'flap', 'a faceless, slender black horned demon with big bat wings, a barbed tail and thin limbs with curled claws, hovering', ''),
]

HAVE = [
    ('innsmouth_hybrid', 'Innsmouth Hybrid', 'biped', 'a gaunt, pale-green humanoid in a long olive coat, trousers and boots, with a flat fish-like face, standing upright', ''),
    ('innsmouth_hybrid#eldritch', 'Innsmouth Hybrid, eldritch form', 'biped', 'a stooped, grey-blue-skinned humanoid in a long open dark coat, trousers and boots, with a flat fish-like face', ''),
    ('ghoul', 'Ghoul', 'hunched', 'a hunched olive-brown, dog-faced ghoul with long arms, clawed hands and glowing pale eyes', ''),
    ('kn_yan_dweller', "K'n-yan Dweller", 'robed', 'a figure in a long dark coat-robe with gold trim at the collar and hem and black hair, standing upright', ''),
    ('reanimated_corpse', 'Reanimated Corpse', 'biped', 'a pale grey-skinned man in a plain grey shirt and dark trousers, barefoot, the arms hanging', 'A stiff, slightly dragging shamble.'),
    ('star_spawn', 'Star-spawn of Cthulhu', 'hunched', 'a hulking pale-green brute with an octopus-like face of tentacles, thick limbs, big claws and small wings folded behind', ''),
    ('wilbur_whateley', 'Wilbur Whateley', 'biped', 'a tall figure in a long red-brown coat with a goat-like head, thin legs and writhing tentacles on his torso', 'Keep the torso tentacles; they sway a little.'),
    ('ephraim_waite', 'Ephraim Waite', 'biped', 'a stern grey-green man in a long jacket and trousers, standing upright', ''),
    ('lilith', 'Lilith', 'biped', 'a very thin, pale, bald, nude-looking humanoid with red eyes', ''),
    ('dr_munoz', 'Dr. Muñoz', 'biped', 'a grey-haired, bearded man in a grey three-piece suit', ''),
    ('medusa_gorgon', "The Gorgon of Medusa's Coil", 'biped', 'a figure in dark clothes and boots with snake-like tentacle hair and white glowing eyes', ''),
    ('hypnos', 'Hypnos', 'biped', 'a bearded man in a tan jacket and trousers with violet eyes', ''),
    ('great_ones', 'The Great Ones', 'biped', 'a grey stone giant of cracked plates with thick limbs and glowing yellow eyes', 'Heavy and stiff: a stomping walk on thick legs.'),
    ('deep_one', 'Deep One', 'hunched', 'a hunched, bulging-eyed grey-green frog-fish humanoid with webbed hands and feet, a fin ridge down its back and a pale belly', 'Keep it upright as in the reference, not a crouched lope.'),
    ('deep_one#eldritch', 'Deep One, eldritch form', 'hunched', 'the same hunched grey-green frog-fish humanoid, now with a glowing green eye and green glow', 'Keep it upright as in the reference, not a crouched lope.'),
    ('joseph_curwen', 'Joseph Curwen', 'biped', 'a gentleman in an olive colonial coat, knee breeches, stockings and buckled shoes, with a white wig', ''),
]

NO_LEGS = [
    ('serpent_man#eldritch', 'Serpent Man of Valusia, eldritch form', 'slither', 'a dark grey cobra coiled in loops with its upper body reared and a flared hood', 'Keep the reared, hooded head at one height; the coils shift as it glides.'),
    ('child_of_yig', 'Child of Yig', 'slither', 'a writhing nest of tan-brown snakes with one head raised', 'Each snake slithers; the nest shifts forward as one.'),
    ('dhole', 'Dhole', 'slither', 'a huge pale grey worm with a rounded head, in loose coils', ''),
    ('martins_beach_horror', "The Horror at Martin's Beach", 'slither', 'a dark teal giant sea-serpent worm with a small head raised', ''),
    ('yig', 'Yig', 'slither', 'a tan-brown giant serpent with a raised head and pale eyes', ''),
    ('rat_swarm', 'Rat Swarm', 'swarm', 'a heap of black rats with glowing amber eyes and thin pink tails', ''),
    ('shoggoth', 'Shoggoth', 'ooze', 'a black heap of bubbling spheres with glowing green eyes dotted over it', ''),
    ('shoggoth#boss', 'Elder Shoggoth', 'ooze', 'a larger, darker black heap of bubbling spheres with many glowing green eyes', ''),
    ('formless_spawn', 'Formless Spawn of Tsathoggua', 'ooze', 'a flat, dark purple-black mass with two curled horn-like tentacles', ''),
    ('the_unnamable', 'The Unnamable', 'ooze', 'a flat dark blob with horn-shaped tentacles and white square eyes', ''),
    ('shunned_house_entity', 'The Shunned House Entity', 'ooze', 'a pale pink, lumpy, cloud-like mass with a single green eye', ''),
    ('curwen_pit_thing', "Thing in Curwen's Pits", 'ooze', 'a pinkish-tan lumpy mound with a gaping hole on top and tentacles at its base', 'The base tentacles pull it along in turns.'),
    ('high_priest#eldritch', 'High Priest Not to Be Described, eldritch form', 'ooze', 'a beige, bulbous mass of tangled tentacles', ''),
    ('nug', 'Nug', 'ooze', 'a white, lumpy, cloud-like heap with small eyes', ''),
    ('yeb', 'Yeb', 'ooze', 'a dark grey-black heaving mass with one small pale eye', ''),
    ('nyarlathotep#eldritch', 'Nyarlathotep, the Crawling Chaos', 'ooze', 'a heap of dark-violet spheres with a single violet eye', ''),
    ('moon_bog_wraith', 'Moon-Bog Wraith', 'float', 'a pale, long-haired wraith in a flowing white-grey gown with the hands held out in front', ''),
    ('voice_in_the_tomb', 'The Voice in the Tomb', 'float', 'a dark grey hooded cloak-wraith with a ragged hem', ''),
    ('high_priest', 'High Priest Not to Be Described', 'float', 'a tall tan hooded robe with big sleeves and a blank dark hood', ''),
    ('hastur', 'Hastur', 'float', 'a tall tattered yellow-brown hooded robe whose hem ends in thin tentacles', 'The hem tentacles ripple.'),
    ('daemon_pipers', 'The Daemon Pipers', 'float', 'a tall black hooded cloak with a ragged hem', ''),
    ('other_gods', 'The Other Gods', 'float', 'a pale grey-white hooded figure in a ragged white cloak ending in thin tentacle-like feet', ''),
    ('umr_at_tawil', "'Umr at-Tawil", 'float', 'a tall dark-grey hooded robe with a vertical dark seam down the front', ''),
    ('ancient_ones', 'The Ancient Ones', 'float', 'a tall pale grey-white hooded robe', ''),
    ('elder_thing', 'Elder Thing', 'sway', 'a grey-green barrel-shaped creature with a five-pointed star-shaped head, fan-like leaves at its base and tentacle arms', ''),
    ('yithian', 'Yithian', 'sway', 'a cone-shaped, ridged cream body with claws and two stalk-like heads', ''),
    ('whisperer', "The Whisperer in Akeley's Chair", 'sway', 'a pale grey bandaged figure in a robe, seated in an armchair', 'The chair and the figure move as one rigid piece: the whole chair rocks and bobs; the figure stays seated; there are no legs walking.'),
    ('flying_polyp', 'Flying Polyp', 'drift', 'a black, beetle-like star-shaped body with long curved tentacle limbs', ''),
    ('flying_polyp#boss', 'Polyp Swarm', 'drift', 'a larger black, beetle-like body with many long curved tentacle limbs', ''),
    ('zann_window_thing', "The Thing Beyond Erich Zann's Window", 'drift', 'a black sphere with glowing purple marks and thin black tentacle legs', ''),
    ('being_from_beyond', 'Being from Beyond', 'jelly', 'a pale lavender jellyfish with a domed bell and trailing tentacles', ''),
    ('colour_out_of_space', 'The Colour Out of Space', 'pulse', 'a swirling grey-white striped orb with red-magenta veins', ''),
    ('mi_go', 'Mi-Go', 'flap', 'a pink-mauve winged crustacean-fungus creature with an egg-like ridged head, bat-like wings, a segmented body and many clawed limbs', 'The limbs dangle and sway a little.'),
    ('mi_go#eldritch', 'Mi-Go, eldritch form', 'flap', 'the same pink-mauve winged crustacean-fungus creature with glowing violet eyes', 'The limbs dangle and sway a little.'),
    ('haunter_of_the_dark', 'The Haunter of the Dark', 'flap', 'a black bat-winged flier with a glowing magenta heart-shaped eye', ''),
]

COLOSSI = [
    ('dunwich_horror', 'The Dunwich Horror', 'multi', 'a vast, ridged purple-black bulk of ropy trunks with rows of round mouths, a crest of pale spikes on top and stubby legs along the bottom edge', 'It is colossal and slow: the legs step in the wave, the whole mass rocks a little.'),
    ('colossus_pyramids', 'The Colossus Beneath the Pyramids', 'lumber', 'a huge tan-brown, dark-veined, gourd-shaped giant with a ring of white eyes on its face and tentacle arms', ''),
    ('cthulhu', 'Cthulhu', 'hunched', 'a green-grey winged giant with an octopus head, long face tentacles, thick limbs and big claws, hunched, the wings folded', 'It is colossal: a slow, heavy walk, the wings folded the whole time.'),
    ('father_dagon', 'Father Dagon', 'lumber', 'a huge olive-camouflage, purple-blotched gourd-shaped giant with white eyes', ''),
    ('mother_hydra', 'Mother Hydra', 'lumber', 'a dark gourd-shaped giant with many writhing tentacle arms and white eyes', ''),
    ('ghatanothoa', 'Ghatanothoa', 'lumber', 'a dark purple mountain-like giant with tentacle arms and a pale eye', ''),
    ('azathoth', 'Azathoth', 'ooze', 'a low, dark-purple, churning mass with star-like sparks around it', 'The sparks drift along with it.'),
    ('yog_sothoth', 'Yog-Sothoth', 'ooze', 'a cluster of glowing teal, white and black spheres with coloured sparks', 'The spheres roll over one another; the sparks drift along with it.'),
    ('shub_niggurath', 'Shub-Niggurath', 'ooze', 'a low, dark-purple mass with stubby tendril legs and coloured sparks', 'The tendril legs pull it along in turns; the sparks drift along with it.'),
]

SECTIONS = [
    ('A', 'Still without a four-frame side walk (do these first)', NEEDED),
    ('B', 'Already have a four-frame side walk (only if you want it redrawn)', HAVE),
    ('C', 'No legs: a four-frame move cycle (slither, ooze, float, wingbeat)', NO_LEGS),
    ('D', 'The nine colossi (128x128 frames; last, and only if you want them)', COLOSSI),
]
ALL = NEEDED + HAVE + NO_LEGS + COLOSSI
RIGHT_TOO = ('keziah_mason', 'the_outsider')
