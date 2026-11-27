/** The creatures in French, deep_one to shoggoth: their names, sources, field notes, epithets and epitaphs. */

import type { StoryTable } from '..';

export const FR_CREATURES: StoryTable = {
  deep_one: {
    "Deep One": "Profond",
    "The Shadow over Innsmouth": "Le Cauchemar d'Innsmouth",
    "They come up from Devil Reef in packs and keep to the dark side of every street. The old men of Innsmouth say they will not cross a fire; fire is no more than a nuisance to them.": "Ils remontent du Récif du Diable en meutes et se tiennent du côté sombre de chaque rue. Les vieux d'Innsmouth disent qu'ils ne franchiront pas un feu ; le feu n'est guère plus qu'une gêne pour eux.",
  },
  innsmouth_hybrid: {
    "Innsmouth Hybrid": "Hybride d'Innsmouth",
    "The Shadow over Innsmouth": "Le Cauchemar d'Innsmouth",
    "A man to the waist and something else about the eyes: the Innsmouth look, the wide unblinking stare, the skin gone rough. Quicker than they seem, and they know the lanes better than you do.": "Un homme jusqu'à la taille, et autre chose dans les yeux : le type d'Innsmouth, le regard large et fixe qui ne cille pas, la peau devenue rugueuse. Plus vifs qu'ils n'en ont l'air, et ils connaissent les ruelles mieux que vous.",
  },
  dagon_priest: {
    "Esoteric Order of Dagon Priest": "Prêtre de l'Ordre ésotérique de Dagon",
    "The Shadow over Innsmouth": "Le Cauchemar d'Innsmouth",
    "The Order's priests wear the tiara from the church on New Church Green and chant from behind a screen of others. Kill the singer and the song goes on.": "Les prêtres de l'Ordre portent la tiare de l'église de New Church Green et psalmodient derrière un écran d'autres fidèles. Tuez le chanteur, et le chant continue.",
  },
  cthulhu_cultist: {
    "A hooded man with a stone in his pocket and a chant he cannot pronounce. Brave in a crowd; the crowd is not usually far.": "Un homme encapuchonné, une pierre dans la poche et une psalmodie qu'il ne sait pas prononcer. Brave dans la foule ; la foule n'est généralement pas loin.",
    ...(__DEMO__
      ? { "Cultist": "Cultiste", "A Tale of the Deep": "Un récit des profondeurs" }
      : {
          "Cthulhu Cultist": "Cultiste de Cthulhu",
          "The Call of Cthulhu": "L'Appel de Cthulhu",
        }),
  },
  ghoul: {
    "Ghoul": "Goule",
    ...(__DEMO__
      ? { "An Arkham Tale": "Un conte d'Arkham", "Their own kind: rubbery, doglike, crouching, fond of graveyards and good paintings. They are not mindless. They simply do not share your opinion of the dead.": "Une engeance à part : caoutchouteux, canins, accroupis, amateurs de cimetières et de bonne peinture. Ils ne sont pas dépourvus d'esprit. Ils ne partagent simplement pas votre opinion sur les morts." }
      : {
          "Pickman's Model": "Le Modèle de Pickman",
          "Pickman's friends: rubbery, doglike, crouching, fond of graveyards and good paintings. They are not mindless. They simply do not share your opinion of the dead.": "Les amis de Pickman : caoutchouteux, canins, accroupis, amateurs de cimetières et de bonne peinture. Ils ne sont pas dépourvus d'esprit. Ils ne partagent simplement pas votre opinion sur les morts.",
        }),
  },
  ghast: {
    "Ghast": "Ghast",
    "The Dream-Quest of Unknown Kadath": "La Quête onirique de Kadath l'inconnue",
    "A ghast hunts by the dark and dies by the sun, which is why the Dreamlands keep their lamps lit. It leaps on its hooves, and it barks when it laughs.": "Un ghast chasse dans l'obscurité et meurt au soleil, c'est pourquoi les Contrées du Rêve gardent leurs lampes allumées. Il bondit sur ses sabots, et il aboie quand il rit.",
  },
  zoog: {
    "Zoog": "Zoog",
    "The Dream-Quest of Unknown Kadath": "La Quête onirique de Kadath l'inconnue",
    "Small, brown and everywhere in the Enchanted Wood. Gentle if their mushrooms are left alone; quick, and many, if they are not.": "Petits, bruns, et partout dans le Bois enchanté. Doux si l'on laisse leurs champignons tranquilles ; vifs, et nombreux, sinon.",
  },
  night_gaunt: {
    "Night-gaunt": "Maigre bête de la nuit",
    "The Dream-Quest of Unknown Kadath": "La Quête onirique de Kadath l'inconnue",
    "Faceless, horned, silent, with a barbed tail. They carry sleepers off through the dark, tickle them, and set them down in strange places. They do not speak. They never have.": "Sans visage, cornues, silencieuses, avec une queue barbelée. Elles emportent les dormeurs à travers l'obscurité, les chatouillent et les déposent en des lieux étranges. Elles ne parlent pas. Elles ne l'ont jamais fait.",
  },
  moon_beast: {
    "Moon-beast": "Bête lunaire",
    "The Dream-Quest of Unknown Kadath": "La Quête onirique de Kadath l'inconnue",
    "Pale, slug-bodied, its blunt feelers never still: it sails its galley out of the Moon and trades slaves for rubies at Dylath-Leen. Stronger than it looks.": "Pâle, au corps de limace, ses antennes émoussées jamais immobiles : elle mène sa galère depuis la Lune et échange des esclaves contre des rubis à Dylath-Leen. Plus forte qu'elle n'en a l'air.",
  },
  man_of_leng: {
    "Man of Leng": "Homme de Leng",
    "The Dream-Quest of Unknown Kadath": "La Quête onirique de Kadath l'inconnue",
    "The Men of Leng wear a turban and keep their mouths covered, and sell what they cannot name to the things in the monastery. They pass for human, which is the worst of it.": "Les hommes de Leng portent un turban et gardent la bouche couverte, et vendent ce qu'ils ne savent nommer aux choses du monastère. Ils passent pour humains, et c'est le pire.",
  },
  cat_from_saturn: {
    "Cat from Saturn": "Chat de Saturne",
    "The Dream-Quest of Unknown Kadath": "La Quête onirique de Kadath l'inconnue",
    "Larger than any cat of Earth and unfriendly to a stranger who has never been kind to one. They hunt in rings, and the ring closes from behind.": "Plus grand que n'importe quel chat de la Terre, et hostile à l'étranger qui n'a jamais été bon pour l'un d'eux. Ils chassent en cercle, et le cercle se referme par-derrière.",
  },
  wamp: {
    "Wamp": "Wamp",
    "The Dream-Quest of Unknown Kadath": "La Quête onirique de Kadath l'inconnue",
    "No one who describes a wamp agrees on its shape. All agree that it hunts the lanes beyond the Enchanted Wood and that it is quick.": "Personne de ceux qui décrivent un wamp ne s'accorde sur sa forme. Tous s'accordent à dire qu'il chasse sur les sentiers au-delà du Bois enchanté et qu'il est rapide.",
  },
  gnorri: {
    "Gnorri": "Gnorri",
    "The Dream-Quest of Unknown Kadath": "La Quête onirique de Kadath l'inconnue",
    "The Gnorri build labyrinths under the sea and dislike the sun, and ask nothing of anyone. The ones that wander ashore want something.": "Les Gnorri bâtissent des labyrinthes sous la mer, n'aiment pas le soleil et ne demandent rien à personne. Ceux qui errent sur le rivage veulent quelque chose.",
  },
  serpent_man: {
    "Serpent Man of Valusia": "Homme-serpent de Valusie",
    "The Haunter of the Dark": "Celui qui hantait les ténèbres",
    "The serpent people ruled the Earth before there were men. The ones that remain wear human faces badly, and rule from behind the eyes of the weak.": "Le peuple serpent régnait sur la Terre avant qu'il y ait des hommes. Ceux qui restent portent mal les visages humains, et règnent derrière les yeux des faibles.",
  },
  kn_yan_dweller: {
    "K'n-yan Dweller": "Habitant de K'n-yan",
    "The Mound": "Le Tertre",
    "The people of blue-litten K'n-yan have no use for the surface and little for each other. They are scholars of sensation, and pain is one of the arts.": "Le peuple de K'n-yan aux lueurs bleues n'a que faire de la surface, et guère plus les uns des autres. Ce sont des savants de la sensation, et la douleur est l'un de leurs arts.",
  },
  ym_bhi: {
    "Y'm-bhi": "Y'm-bhi",
    "The Mound": "Le Tertre",
    "Y'm-bhi: the dead of K'n-yan, brought back from their tombs with the fire in the flesh and none of the mind. They are made to labour and they do not tire.": "Les Y'm-bhi : les morts de K'n-yan, ramenés de leurs tombeaux avec le feu dans la chair et rien de l'esprit. On les fait travailler, et ils ne se fatiguent pas.",
  },
  gyaa_yothn: {
    "Gyaa-yothn": "Gyaa-yothn",
    "The Mound": "Le Tertre",
    "Hulking things bred in Yoth to carry loads: blind, strong, and loyal to nobody in particular.": "Des choses massives élevées à Yoth pour porter des charges : aveugles, fortes, et fidèles à personne en particulier.",
  },
  reanimated_corpse: {
    "Reanimated Corpse": "Cadavre ranimé",
    "Herbert West—Reanimator": "Herbert West, réanimateur",
    "West's work: a body made to walk by a serum that preferred fresher stock. It strikes without feeling and rots without minding. Fire ends it.": "L'œuvre de West : un corps mis en marche par un sérum qui préférait la marchandise plus fraîche. Il frappe sans rien sentir et pourrit sans s'en soucier. Le feu y met fin.",
  },
  martense_degenerate: {
    "Martense Degenerate": "Martense dégénéré",
    "The Lurking Fear": "La Peur qui rôde",
    "The Martense line went under the mountain when the house fell and took on the habits of the place. They hunt on all fours in the dark, and thunder wakes them.": "La lignée des Martense est passée sous la montagne quand la maison est tombée, et a pris les habitudes du lieu. Ils chassent à quatre pattes dans le noir, et le tonnerre les réveille.",
  },
  exham_troglodyte: {
    "Exham Priory Troglodyte": "Troglodyte d'Exham Priory",
    "The Rats in the Walls": "Les Rats dans les murs",
    "Beneath Exham Priory the cellars and the rats are one tale. These are what the rats were guarding: pale, grey-eyed, and long since unable to say what they descend from.": "Sous Exham Priory, les caves et les rats ne font qu'une seule histoire. Voici ce que gardaient les rats : pâles, aux yeux gris, et depuis longtemps incapables de dire de quoi ils descendent.",
  },
  rat_swarm: {
    "Rat Swarm": "Nuée de rats",
    "The Rats in the Walls": "Les Rats dans les murs",
    "A hundred small feet running toward you in a wave and a hundred small voices saying nothing at all. Fire turns them; a lantern held low parts them.": "Cent petites pattes qui courent vers vous en une vague, et cent petites voix qui ne disent rien du tout. Le feu les repousse ; une lanterne tenue bas les fend.",
  },
  winged_hybrid: {
    "Winged Hybrid": "Hybride ailé",
    "The Festival": "La Fête",
    "At the Festival in Kingsport they come up out of the crypt on beaten wings in the shape of men, and nobody in the town will say why the old church bell is so slow.": "À la Fête de Kingsport, ils remontent de la crypte sur des ailes battantes, en forme d'hommes, et personne en ville ne veut dire pourquoi la vieille cloche de l'église sonne si lentement.",
  },
  moon_bog_wraith: {
    "Moon-Bog Wraith": "Spectre du Marais de la Lune",
    "The Moon-Bog": "Le Marais de la Lune",
    "The wraiths of the Moon-Bog: the shapes moonlight takes over a drowned village. Steel goes through them; light does not. They take the mind before the body.": "Les spectres du Marais de la Lune : les formes que prend le clair de lune au-dessus d'un village noyé. L'acier les traverse ; la lumière, non. Ils prennent l'esprit avant le corps.",
  },
  being_of_ib: {
    "Being of Ib": "Être d'Ib",
    "The Doom that Came to Sarnath": "La Malédiction de Sarnath",
    "Grey, bulging-eyed, froglike and mute: the dead city of Sarnath was built where they lived. They do not remember Sarnath. They have not forgotten it.": "Gris, aux yeux saillants, semblables à des grenouilles et muets : la cité morte de Sarnath fut bâtie là où ils vivaient. Ils ne se souviennent pas de Sarnath. Ils ne l'ont pas oubliée.",
  },
  nameless_city_reptile: {
    "Nameless City Reptile": "Reptile de la Cité sans nom",
    "The Nameless City": "La Cité sans nom",
    "A crawling thing of the Nameless City, scaly, patient, as old as the desert. It lies in the low passages and moves only when you have gone in too far to turn.": "Une chose rampante de la Cité sans nom, écailleuse, patiente, aussi vieille que le désert. Elle gît dans les passages bas et ne bouge que lorsque vous êtes allé trop loin pour faire demi-tour.",
  },
  hybrid_mummy: {
    "Hybrid Mummy": "Momie hybride",
    "Under the Pyramids": "Sous les pyramides",
    "Under the pyramid, in the black chambers: a man's body and a beast's head, wrapped, rising from a niche. Not dead, not alive, and not stopped by a door.": "Sous la pyramide, dans les chambres noires : un corps d'homme et une tête de bête, bandés, surgissant d'une niche. Ni mort ni vivant, et qu'aucune porte n'arrête.",
  },
  venusian_man_lizard: {
    "Venusian Man-Lizard": "Homme-lézard vénusien",
    "In the Walls of Eryx": "Dans les murs d'Eryx",
    "A thing of Venus, if the walls of Eryx are to be believed: a reptile with a man's bearing, speaking in the mind, doing quiet harm with a cold glass look.": "Une chose de Vénus, s'il faut en croire les murs d'Eryx : un reptile au port d'homme, qui parle dans l'esprit et fait le mal en silence, d'un regard froid et vitreux.",
  },
  beast_in_the_cave: {
    "The Beast in the Cave": "La Bête de la caverne",
    "What a guide led a boy toward in the dark of the great cave: white, blind, human in its gait. It is, in its way, still a man.": "Ce vers quoi un guide mena un garçon dans l'obscurité de la grande caverne : blanche, aveugle, humaine dans sa démarche. C'est, à sa façon, encore un homme.",
  },
  child_of_yig: {
    "Child of Yig": "Enfant de Yig",
    "The Curse of Yig": "La Malédiction de Yig",
    "Yig's children are many, and small, and they follow the scent of anyone who has hurt a snake. They are far better than you at finding you.": "Les enfants de Yig sont nombreux et petits, et ils suivent l'odeur de quiconque a fait du mal à un serpent. Ils sont bien plus doués pour vous trouver que vous pour vous cacher.",
  },
  albino_penguin: {
    "Blind Albino Penguin": "Manchot albinos aveugle",
    "At the Mountains of Madness": "Les Montagnes hallucinées",
    "A blind white bird that wanders the dark galleries beneath the ice, going toward the sound of its own feet. Miserable things. Their ancestors were bred.": "Un oiseau blanc et aveugle qui erre dans les galeries obscures sous la glace, allant vers le bruit de ses propres pas. De misérables créatures. Leurs ancêtres furent élevés.",
  },
  gnoph_keh: {
    "Gnoph-keh": "Gnoph-keh",
    "Polaris": "Polaris",
    "The hairy, many-limbed horror of the northern ice. It came down with the glaciers and hunted men, and it has not left off.": "L'horreur velue aux nombreux membres des glaces du nord. Elle est descendue avec les glaciers et a chassé les hommes, et elle n'a pas cessé.",
  },
  mi_go: {
    "Mi-Go": "Mi-Go",
    "The Whisperer in Darkness": "Celui qui chuchotait dans les ténèbres",
    "The Fungi from Yuggoth: pinkish, crustaceous, winged, with a cluster of waving feelers where a head should be. Careful, quiet and unhurried. They take brains out and never quite finish.": "Les Fungi de Yuggoth : rosâtres, crustacés, ailés, avec une grappe d'antennes ondulantes là où devrait se trouver une tête. Soigneux, silencieux et sans hâte. Ils retirent les cerveaux et n'en finissent jamais tout à fait.",
  },
  elder_thing: {
    "Elder Thing": "Ancien",
    "At the Mountains of Madness": "Les Montagnes hallucinées",
    "Barrel-bodied, star-headed, with membranous wings and tubular feelers. Not our enemy by temperament: they built a world and were undone by their own servants. Sometimes they are gentle.": "Au corps en tonneau, à la tête en étoile, avec des ailes membraneuses et des antennes tubulaires. Pas nos ennemis par tempérament : ils ont bâti un monde et ont été défaits par leurs propres serviteurs. Parfois, ils sont doux.",
  },
  shoggoth: {
    "Shoggoth": "Shoggoth",
    "Elder Shoggoth": "Shoggoth ancien",
    "At the Mountains of Madness": "Les Montagnes hallucinées",
    "A protoplasmic mass that makes eyes and mouths at will. They obeyed once. They remember obeying. They say one thing, over and over, and it is not a word you want to hear near.": "Une masse protoplasmique qui se fait des yeux et des bouches à volonté. Ils obéissaient, autrefois. Ils se souviennent d'avoir obéi. Ils disent une seule chose, encore et encore, et ce n'est pas un mot qu'on veut entendre de près.",
  },
};
