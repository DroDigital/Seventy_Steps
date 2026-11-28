/** The creatures in Spanish, deep_one to shoggoth: their names, sources, field notes, epithets and epitaphs. */

import type { StoryTable } from '..';

export const ES_CREATURES: StoryTable = {
  deep_one: {
    "Deep One": "Profundo",
    "The Shadow over Innsmouth": "La sombra sobre Innsmouth",
    "They come up from Devil Reef in packs and keep to the dark side of every street. The old men of Innsmouth say they will not cross a fire; fire is no more than a nuisance to them.": "Suben del Arrecife del Diablo en manadas y se mantienen en el lado oscuro de cada calle. Los viejos de Innsmouth dicen que no cruzan el fuego; el fuego no es para ellos más que una molestia.",
  },
  innsmouth_hybrid: {
    "Innsmouth Hybrid": "Híbrido de Innsmouth",
    "The Shadow over Innsmouth": "La sombra sobre Innsmouth",
    "A man to the waist and something else about the eyes: the Innsmouth look, the wide unblinking stare, the skin gone rough. Quicker than they seem, and they know the lanes better than you do.": "Un hombre hasta la cintura y otra cosa en los ojos: la pinta de Innsmouth, la mirada ancha que no parpadea, la piel vuelta áspera. Más rápidos de lo que parecen, y conocen los callejones mejor que tú.",
  },
  dagon_priest: {
    "Esoteric Order of Dagon Priest": "Sacerdote de la Orden Esotérica de Dagón",
    "The Shadow over Innsmouth": "La sombra sobre Innsmouth",
    "The Order's priests wear the tiara from the church on New Church Green and chant from behind a screen of others. Kill the singer and the song goes on.": "Los sacerdotes de la Orden llevan la tiara de la iglesia de New Church Green y salmodian tras una pantalla de otros fieles. Mata al cantor y el canto sigue.",
  },
  cthulhu_cultist: {
    "A hooded man with a stone in his pocket and a chant he cannot pronounce. Brave in a crowd; the crowd is not usually far.": "Un encapuchado con una piedra en el bolsillo y un cántico que no sabe pronunciar. Valiente en la multitud; la multitud no suele estar lejos.",
    ...(__DEMO__
      ? { "Cultist": "Sectario", "A Tale of the Deep": "Un relato de las profundidades" }
      : {
          "Cthulhu Cultist": "Sectario de Cthulhu",
          "The Call of Cthulhu": "La llamada de Cthulhu",
        }),
  },
  ghoul: {
    "Ghoul": "Necrófago",
    ...(__DEMO__
      ? { "An Arkham Tale": "Un relato de Arkham", "Their own kind: rubbery, doglike, crouching, fond of graveyards and good paintings. They are not mindless. They simply do not share your opinion of the dead.": "Una ralea aparte: gomosos, perrunos, agazapados, aficionados a los cementerios y a la buena pintura. No carecen de mente. Simplemente no comparten tu opinión sobre los muertos." }
      : {
          "Pickman's Model": "El modelo de Pickman",
          "Pickman's friends: rubbery, doglike, crouching, fond of graveyards and good paintings. They are not mindless. They simply do not share your opinion of the dead.": "Los amigos de Pickman: gomosos, perrunos, agazapados, aficionados a los cementerios y a la buena pintura. No carecen de mente. Simplemente no comparten tu opinión sobre los muertos.",
        }),
  },
  ghast: {
    "Ghast": "Ghast",
    "The Dream-Quest of Unknown Kadath": "La búsqueda onírica de la desconocida Kadath",
    "A ghast hunts by the dark and dies by the sun, which is why the Dreamlands keep their lamps lit. It leaps on its hooves, and it barks when it laughs.": "Un ghast caza en la oscuridad y muere con el sol, por eso las Tierras del Sueño mantienen encendidas sus lámparas. Salta sobre sus pezuñas, y ladra cuando ríe.",
  },
  zoog: {
    "Zoog": "Zoog",
    "The Dream-Quest of Unknown Kadath": "La búsqueda onírica de la desconocida Kadath",
    "Small, brown and everywhere in the Enchanted Wood. Gentle if their mushrooms are left alone; quick, and many, if they are not.": "Pequeños, pardos y por todas partes en el Bosque Encantado. Mansos si se dejan en paz sus setas; rápidos, y muchos, si no.",
  },
  night_gaunt: {
    "Night-gaunt": "Descarnado nocturno",
    "The Dream-Quest of Unknown Kadath": "La búsqueda onírica de la desconocida Kadath",
    "Faceless, horned, silent, with a barbed tail. They carry sleepers off through the dark, tickle them, and set them down in strange places. They do not speak. They never have.": "Sin rostro, con cuernos, silenciosos, con una cola de púas. Se llevan a los durmientes a través de la oscuridad, les hacen cosquillas y los dejan en lugares extraños. No hablan. Nunca lo han hecho.",
  },
  moon_beast: {
    "Moon-beast": "Bestia lunar",
    "The Dream-Quest of Unknown Kadath": "La búsqueda onírica de la desconocida Kadath",
    "Pale, slug-bodied, its blunt feelers never still: it sails its galley out of the Moon and trades slaves for rubies at Dylath-Leen. Stronger than it looks.": "Pálida, con cuerpo de babosa, sus romas antenas nunca quietas: navega en su galera desde la Luna y cambia esclavos por rubíes en Dylath-Leen. Más fuerte de lo que parece.",
  },
  man_of_leng: {
    "Man of Leng": "Hombre de Leng",
    "The Dream-Quest of Unknown Kadath": "La búsqueda onírica de la desconocida Kadath",
    "The Men of Leng wear a turban and keep their mouths covered, and sell what they cannot name to the things in the monastery. They pass for human, which is the worst of it.": "Los hombres de Leng llevan turbante y se tapan la boca, y venden lo que no saben nombrar a las cosas del monasterio. Pasan por humanos, y eso es lo peor.",
  },
  cat_from_saturn: {
    "Cat from Saturn": "Gato de Saturno",
    "The Dream-Quest of Unknown Kadath": "La búsqueda onírica de la desconocida Kadath",
    "Larger than any cat of Earth and unfriendly to a stranger who has never been kind to one. They hunt in rings, and the ring closes from behind.": "Más grande que cualquier gato de la Tierra y hostil con el forastero que nunca fue amable con uno. Cazan en corro, y el corro se cierra por detrás.",
  },
  wamp: {
    "Wamp": "Wamp",
    "The Dream-Quest of Unknown Kadath": "La búsqueda onírica de la desconocida Kadath",
    "No one who describes a wamp agrees on its shape. All agree that it hunts the lanes beyond the Enchanted Wood and that it is quick.": "Nadie que describa un wamp se pone de acuerdo sobre su forma. Todos coinciden en que caza por los senderos más allá del Bosque Encantado y en que es rápido.",
  },
  gnorri: {
    "Gnorri": "Gnorri",
    "The Dream-Quest of Unknown Kadath": "La búsqueda onírica de la desconocida Kadath",
    "The Gnorri build labyrinths under the sea and dislike the sun, and ask nothing of anyone. The ones that wander ashore want something.": "Los gnorri construyen laberintos bajo el mar, no les gusta el sol y no piden nada a nadie. Los que vagan por la orilla quieren algo.",
  },
  serpent_man: {
    "Serpent Man of Valusia": "Hombre serpiente de Valusia",
    "The Haunter of the Dark": "El morador de las tinieblas",
    "The serpent people ruled the Earth before there were men. The ones that remain wear human faces badly, and rule from behind the eyes of the weak.": "El pueblo serpiente gobernó la Tierra antes de que hubiera hombres. Los que quedan llevan mal las caras humanas, y gobiernan desde detrás de los ojos de los débiles.",
  },
  kn_yan_dweller: {
    "K'n-yan Dweller": "Morador de K'n-yan",
    "The Mound": "El túmulo",
    "The people of blue-litten K'n-yan have no use for the surface and little for each other. They are scholars of sensation, and pain is one of the arts.": "El pueblo de K'n-yan, la de las luces azules, no tiene uso para la superficie y poco unos para otros. Son eruditos de la sensación, y el dolor es una de sus artes.",
  },
  ym_bhi: {
    "Y'm-bhi": "Y'm-bhi",
    "The Mound": "El túmulo",
    "Y'm-bhi: the dead of K'n-yan, brought back from their tombs with the fire in the flesh and none of the mind. They are made to labour and they do not tire.": "Los y'm-bhi: los muertos de K'n-yan, traídos de vuelta de sus tumbas con el fuego en la carne y nada de la mente. Se les hace trabajar, y no se cansan.",
  },
  gyaa_yothn: {
    "Gyaa-yothn": "Gyaa-yothn",
    "The Mound": "El túmulo",
    "Hulking things bred in Yoth to carry loads: blind, strong, and loyal to nobody in particular.": "Cosas corpulentas criadas en Yoth para cargar pesos: ciegas, fuertes y leales a nadie en particular.",
  },
  reanimated_corpse: {
    "Reanimated Corpse": "Cadáver reanimado",
    "Herbert West—Reanimator": "Herbert West, reanimador",
    "West's work: a body made to walk by a serum that preferred fresher stock. It strikes without feeling and rots without minding. Fire ends it.": "La obra de West: un cuerpo puesto a caminar por un suero que prefería género más fresco. Golpea sin sentir y se pudre sin que le importe. El fuego acaba con él.",
  },
  martense_degenerate: {
    "Martense Degenerate": "Degenerado Martense",
    "The Lurking Fear": "El miedo que acecha",
    "The Martense line went under the mountain when the house fell and took on the habits of the place. They hunt on all fours in the dark, and thunder wakes them.": "El linaje de los Martense se metió bajo la montaña cuando cayó la casa y adoptó las costumbres del lugar. Cazan a cuatro patas en la oscuridad, y el trueno los despierta.",
  },
  exham_troglodyte: {
    "Exham Priory Troglodyte": "Troglodita del priorato de Exham",
    "The Rats in the Walls": "Las ratas de las paredes",
    "Beneath Exham Priory the cellars and the rats are one tale. These are what the rats were guarding: pale, grey-eyed, and long since unable to say what they descend from.": "Bajo el priorato de Exham, los sótanos y las ratas son un mismo cuento. Esto es lo que guardaban las ratas: pálidos, de ojos grises, y hace mucho incapaces de decir de qué descienden.",
  },
  rat_swarm: {
    "Rat Swarm": "Enjambre de ratas",
    "The Rats in the Walls": "Las ratas de las paredes",
    "A hundred small feet running toward you in a wave and a hundred small voices saying nothing at all. Fire turns them; a lantern held low parts them.": "Cien patitas corriendo hacia ti en una oleada y cien vocecitas que no dicen nada. El fuego las hace retroceder; un farol sostenido bajo las aparta.",
  },
  winged_hybrid: {
    "Winged Hybrid": "Híbrido alado",
    "The Festival": "La fiesta",
    "At the Festival in Kingsport they come up out of the crypt on beaten wings in the shape of men, and nobody in the town will say why the old church bell is so slow.": "En la Fiesta de Kingsport suben de la cripta con alas batientes, con forma de hombres, y nadie en el pueblo quiere decir por qué la vieja campana de la iglesia suena tan despacio.",
  },
  moon_bog_wraith: {
    "Moon-Bog Wraith": "Espectro de la Ciénaga de la Luna",
    "The Moon-Bog": "La ciénaga de la luna",
    "The wraiths of the Moon-Bog: the shapes moonlight takes over a drowned village. Steel goes through them; light does not. They take the mind before the body.": "Los espectros de la Ciénaga de la Luna: las formas que toma la luz de la luna sobre una aldea anegada. El acero los atraviesa; la luz, no. Se llevan la mente antes que el cuerpo.",
  },
  being_of_ib: {
    "Being of Ib": "Ser de Ib",
    "The Doom that Came to Sarnath": "La maldición que cayó sobre Sarnath",
    "Grey, bulging-eyed, froglike and mute: the dead city of Sarnath was built where they lived. They do not remember Sarnath. They have not forgotten it.": "Grises, de ojos saltones, como ranas y mudos: la ciudad muerta de Sarnath se construyó donde ellos vivían. No recuerdan Sarnath. No la han olvidado.",
  },
  nameless_city_reptile: {
    "Nameless City Reptile": "Reptil de la Ciudad sin Nombre",
    "The Nameless City": "La ciudad sin nombre",
    "A crawling thing of the Nameless City, scaly, patient, as old as the desert. It lies in the low passages and moves only when you have gone in too far to turn.": "Una cosa reptante de la Ciudad sin Nombre, escamosa, paciente, tan vieja como el desierto. Yace en los pasadizos bajos y solo se mueve cuando has entrado demasiado para dar la vuelta.",
  },
  hybrid_mummy: {
    "Hybrid Mummy": "Momia híbrida",
    "Under the Pyramids": "Bajo las pirámides",
    "Under the pyramid, in the black chambers: a man's body and a beast's head, wrapped, rising from a niche. Not dead, not alive, and not stopped by a door.": "Bajo la pirámide, en las cámaras negras: un cuerpo de hombre y una cabeza de bestia, vendados, alzándose de un nicho. Ni muerto ni vivo, y no lo detiene ninguna puerta.",
  },
  venusian_man_lizard: {
    "Venusian Man-Lizard": "Hombre lagarto venusiano",
    "In the Walls of Eryx": "En los muros de Eryx",
    "A thing of Venus, if the walls of Eryx are to be believed: a reptile with a man's bearing, speaking in the mind, doing quiet harm with a cold glass look.": "Una cosa de Venus, si hay que creer a los muros de Eryx: un reptil con porte de hombre, que habla en la mente y hace daño en silencio con una fría mirada vidriosa.",
  },
  beast_in_the_cave: {
    "The Beast in the Cave": "La bestia en la cueva",
    "What a guide led a boy toward in the dark of the great cave: white, blind, human in its gait. It is, in its way, still a man.": "Aquello hacia lo que un guía llevó a un muchacho en la oscuridad de la gran cueva: blanca, ciega, humana en su andar. Es, a su manera, todavía un hombre.",
  },
  child_of_yig: {
    "Child of Yig": "Hijo de Yig",
    "The Curse of Yig": "La maldición de Yig",
    "Yig's children are many, and small, and they follow the scent of anyone who has hurt a snake. They are far better than you at finding you.": "Los hijos de Yig son muchos, y pequeños, y siguen el rastro de cualquiera que haya hecho daño a una serpiente. Se les da mucho mejor encontrarte que a ti esconderte.",
  },
  albino_penguin: {
    "Blind Albino Penguin": "Pingüino albino ciego",
    "At the Mountains of Madness": "En las montañas de la locura",
    "A blind white bird that wanders the dark galleries beneath the ice, going toward the sound of its own feet. Miserable things. Their ancestors were bred.": "Un ave blanca y ciega que vaga por las galerías oscuras bajo el hielo, hacia el sonido de sus propios pasos. Criaturas miserables. A sus antepasados los criaron.",
  },
  gnoph_keh: {
    "Gnoph-keh": "Gnoph-keh",
    "Polaris": "Polaris",
    "The hairy, many-limbed horror of the northern ice. It came down with the glaciers and hunted men, and it has not left off.": "El horror peludo de muchos miembros de los hielos del norte. Bajó con los glaciares y cazó hombres, y no ha dejado de hacerlo.",
  },
  mi_go: {
    "Mi-Go": "Mi-Go",
    "The Whisperer in Darkness": "El que susurraba en la oscuridad",
    "The Fungi from Yuggoth: pinkish, crustaceous, winged, with a cluster of waving feelers where a head should be. Careful, quiet and unhurried. They take brains out and never quite finish.": "Los Hongos de Yuggoth: rosados, crustáceos, alados, con un racimo de antenas ondulantes donde debería haber una cabeza. Cuidadosos, silenciosos y sin prisa. Sacan cerebros y nunca acaban del todo.",
  },
  elder_thing: {
    "Elder Thing": "Antiguo",
    "At the Mountains of Madness": "En las montañas de la locura",
    "Barrel-bodied, star-headed, with membranous wings and tubular feelers. Not our enemy by temperament: they built a world and were undone by their own servants. Sometimes they are gentle.": "Con cuerpo de tonel, cabeza de estrella, alas membranosas y antenas tubulares. No son enemigos nuestros por temperamento: construyeron un mundo y fueron deshechos por sus propios siervos. A veces son amables.",
  },
  shoggoth: {
    "Shoggoth": "Shoggoth",
    "Elder Shoggoth": "Shoggoth Antiguo",
    "At the Mountains of Madness": "En las montañas de la locura",
    "A protoplasmic mass that makes eyes and mouths at will. They obeyed once. They remember obeying. They say one thing, over and over, and it is not a word you want to hear near.": "Una masa protoplásmica que se hace ojos y bocas a voluntad. Una vez obedecieron. Recuerdan haber obedecido. Dicen una sola cosa, una y otra vez, y no es una palabra que quieras oír de cerca.",
  },
};
