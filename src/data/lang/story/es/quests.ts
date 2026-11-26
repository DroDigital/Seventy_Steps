/** The quests, in Spanish (data/quests.ts): each one's title, its stages' lines in the journal and its line once done, by quest. */

import type { StoryTable } from '..';

export const ES_QUESTS: StoryTable = {
  borrowed_reins: {
    "The Borrowed Reins": "Las Riendas prestadas",
    "Speak with Wingate Peaslee on the Miskatonic Quad. A chariot from the university stables is waiting to be borrowed.": "Habla con Wingate Peaslee en el patio de la Miskatonic. Un carro de las cuadras de la universidad espera a que alguien lo tome prestado.",
    "Find the Sleeper’s Sign, southwest across the university grounds. The reins of the chariot wait there; no horror need fall, and nothing is owed.": "Encuentra el Signo del Durmiente, al suroeste, al otro lado del recinto de la universidad. Allí esperan las riendas del carro; no hace falta que caiga ningún horror, y no se debe nada.",
    "The borrowed reins answer my call on dry open ground. The chariot is mine. A motor car may also be chosen at an Elder Sign; it is no faster.": "Las riendas prestadas responden a mi llamada en terreno seco y despejado. El carro es mío. En un Signo Arcano también puede elegirse un automóvil; no es más rápido.",
  },
  sleepers: {
    "The Sleepers": "Los Durmientes",
    "Peaslee says Walter Gilman, the second sleeper, is in Arkham, west of the university. Find him.": "Peaslee dice que Walter Gilman, el segundo durmiente, está en Arkham, al oeste de la universidad. Encuéntralo.",
    "Found Gilman on the streets of Arkham. The tall man visited him too, the night before he slept.": "Encontré a Gilman en las calles de Arkham. El hombre alto también lo visitó a él, la noche antes de que se durmiera.",
  },
  witch_house: {
    "The Witch House": "La Casa de la Bruja",
    "Gilman says the police went into the Witch House on the third of October. Officer Riley's report is lying somewhere in Arkham. Read what he found before going in.": "Gilman dice que la policía entró en la Casa de la Bruja el tres de octubre. El informe del agente Riley está tirado en algún lugar de Arkham. Lee lo que encontró antes de entrar.",
    "Riley found a hole in the attic wall and small footprints with fingers. Take it to Gilman: he knows what it means.": "Riley encontró un agujero en la pared del desván y unas huellas pequeñas con dedos. Llévaselo a Gilman: él sabe lo que significa.",
    "Gilman has shown you how to look at a corner until it gives. Climb the Witch House to the stair landing, where an Elder Sign stands, and rest there before the attic.": "Gilman te ha enseñado a mirar una esquina hasta que cede. Sube por la Casa de la Bruja hasta el rellano de la escalera, donde hay un Signo Arcano, y descansa allí antes del desván.",
    "Her formulae are in a closet off the landing that only a mind that has learned to look can see (it wants 1 insight). Read them: Gilman says they tell what she is doing, and when. If the insight is spent, go on: the garret does not wait for them.": "Sus fórmulas están en un cuartito junto al rellano que solo puede ver una mente que haya aprendido a mirar (pide 1 de discernimiento). Léelas: Gilman dice que revelan lo que está haciendo, y cuándo. Si el discernimiento se ha gastado, sigue adelante: la buhardilla no las espera.",
    "Keziah Mason is in the garret above the landing, with the rat thing with the little hands. Gilman cannot think straight while she is there.": "Keziah Mason está en la buhardilla sobre el rellano, con esa cosa de rata con las manitas. Gilman no puede pensar con claridad mientras ella esté allí.",
    "Keziah Mason is gone from the Witch House.": "Keziah Mason ya no está en la Casa de la Bruja.",
  },
  descent: {
    "The Stair": "La Escalera",
    "Find a dreamer called Kuranes: down the stair from the Sleeper's Sign on the university grounds, and on through the Gate of Deeper Slumber.": "Encuentra a un soñador llamado Kuranes: baja la escalera desde el Signo del Durmiente, en el recinto de la universidad, y sigue a través de la Puerta del Sueño Profundo.",
    "Kuranes told me what the key opens.": "Kuranes me dijo qué abre la llave.",
  },
  kadath: {
    "The Gate": "La Puerta",
    "Kadath's door is sealed by the great horrors of the waking world. Kuranes says four must fall before it opens; Keziah Mason was one.": "La puerta de Kadath está sellada por los grandes horrores del mundo de la vigilia. Kuranes dice que deben caer cuatro antes de que se abra; Keziah Mason era uno.",
    "Kadath's door stands open. The Great Ones and the Crawling Chaos hold the hall beyond it, and the Ultimate Gate will not open while a horror holds you. Put them down, and pass through to the Threshold of the Silver Key.": "La puerta de Kadath está abierta. Los Grandes y el Caos Reptante ocupan la sala que hay detrás, y la Puerta Última no se abrirá mientras un horror te retenga. Abátelos y pasa al Umbral de la Llave de Plata.",
    "I have reached the Threshold. What happens now is my choice.": "He llegado al Umbral. Lo que ocurra ahora es elección mía.",
  },
  zadok: {
    "A Drink for Zadok": "Un trago para Zadok",
    "Zadok Allen, in Innsmouth Square, will talk for a swallow of Laudanum.": "Zadok Allen, en la plaza de Innsmouth, hablará a cambio de un trago de láudano.",
    "Zadok told me about Devil Reef and the Marshes, and gave me a Silver Vial.": "Zadok me habló del Arrecife del Diablo y de los Marsh, y me dio un frasco de plata.",
  },
  akeley: {
    "Akeley's Chair": "El sillón de Akeley",
    "Something sits in Henry Akeley's chair at the farmhouse up the road in Vermont. Wilmarth does not think it is Akeley.": "Algo está sentado en el sillón de Henry Akeley, en la granja camino arriba, en Vermont. Wilmarth no cree que sea Akeley.",
    "The thing in the chair is finished. Wilmarth gave me Akeley's notes.": "La cosa del sillón ha terminado. Wilmarth me dio las notas de Akeley.",
  },
  curwen: {
    "The Curwen Business": "El asunto Curwen",
    "Joseph Curwen is back, in the catacombs under Pawtuxet in Providence. Dr. Willett asks me to finish what he started.": "Joseph Curwen ha vuelto, en las catacumbas bajo Pawtuxet, en Providence. El Dr. Willett me pide que termine lo que él empezó.",
    "Curwen is dust again. Willett gave me the formula he used.": "Curwen vuelve a ser polvo. Willett me dio la fórmula que usó.",
  },
  dunwich: {
    "Sentinel Hill": "Sentinel Hill",
    "Something nobody can see walks the hills around Dunwich at night. Curtis Whateley asks me to finish it.": "Algo que nadie puede ver camina de noche por las colinas de Dunwich. Curtis Whateley me pide que acabe con ello.",
    "The whippoorwills around Dunwich have gone quiet.": "Los chotacabras de Dunwich han callado.",
  },
  elder_city: {
    "The City Past the Ridge": "La ciudad tras la cresta",
    "One of the Elder Things' servants still lives in their city past the ridge. Professor Dyer warns me not to let it get between me and the way out.": "Uno de los siervos de los Antiguos sigue vivo en su ciudad tras la cresta. El profesor Dyer me advierte que no deje que se interponga entre la salida y yo.",
    "The servant in the Elder city is dead. Dyer gave me his drawings of the murals.": "El siervo de la ciudad de los Antiguos está muerto. Dyer me dio sus dibujos de los murales.",
  },
  archives: {
    "In His Own Hand": "De su puño y letra",
    "Nathaniel Peaslee says an account in his own hand lies in the Archives of the Great Race, under the desert. Find the Archive Reading Hall.": "Nathaniel Peaslee dice que una crónica de su puño y letra está en los Archivos de la Gran Raza, bajo el desierto. Encuentra la Sala de Lectura de los Archivos.",
    "The polyps the Great Race walled in below the archives are loose. Nathaniel asks me to put down the swarm that leads them, in the vault below.": "Los pólipos que la Gran Raza emparedó bajo los archivos andan sueltos. Nathaniel me pide que abata al enjambre que los guía, en la cripta de abajo.",
    "The whistling below the archives has stopped. Nathaniel Peaslee remembers a little more of what he was.": "Los silbidos bajo los archivos han cesado. Nathaniel Peaslee recuerda un poco más de lo que fue.",
  },
  zamacona: {
    "The Toad of N'kai": "El Sapo de N'kai",
    "Zamacona says Tsathoggua sleeps in black N'kai, below Tsath, and while it sleeps nothing in K'n-yan can leave. The way is past the temple stair.": "Zamacona dice que Tsathoggua duerme en el negro N'kai, bajo Tsath, y que mientras duerma nada en K'n-yan puede marcharse. El camino pasa por la escalera del templo.",
    "Tsathoggua is still. Zamacona gave me his espada; he says he cannot lift it here.": "Tsathoggua está quieto. Zamacona me dio su espada; dice que aquí no puede levantarla.",
  },
  alert: {
    "Where Johansen Stood": "Donde estuvo Johansen",
    "Johansen says the Alert still lies at R'lyeh's edge. When the thing comes out of the great door, take her helm and put her bows into it.": "Johansen dice que el Alert sigue en la orilla de R'lyeh. Cuando la cosa salga por la gran puerta, toma su timón y clávale la proa.",
    "The Alert struck it, as she did once before, and R'lyeh went down again. Johansen gave me the stones that came up with the island.": "El Alert la golpeó, como ya lo hizo una vez, y R'lyeh volvió a hundirse. Johansen me dio las piedras que subieron con la isla.",
  },
  cylinders: {
    "The Cylinders": "Los Cilindros",
    "Akeley says the Outer Ones keep brains in metal cylinders in their Fungoid Cities, his among them. Find the cities, east of the landing.": "Akeley dice que los de Fuera guardan cerebros en cilindros de metal en sus Ciudades Fúngicas, el suyo entre ellos. Encuentra las ciudades, al este del lugar de aterrizaje.",
    "The Outer Ones feed Rhan-Tegoth in the hall of cylinders. Akeley says none will open while it lives.": "Los de Fuera alimentan a Rhan-Tegoth en la sala de los cilindros. Akeley dice que ninguno se abrirá mientras viva.",
    "Rhan-Tegoth is dead in the hall of cylinders, and they are opening. Akeley gave me a vial and the Outer Ones' stones.": "Rhan-Tegoth yace muerto en la sala de los cilindros, y se están abriendo. Akeley me dio un frasco y las piedras de los de Fuera.",
  },
  silver_key: {
    "The Gate and the Key": "La Puerta y la Llave",
    "'Umr at-Tawil, the Guide, keeps the last gate in the Ultimate Void, across the span north of the First Gate. When his strength fails he may offer to go through the Gate with you: that is an ending. Strike him down instead, and the way goes on to Yog-Sothoth and the Court.": "'Umr at-Tawil, el Guía, guarda la última puerta en el Vacío Último, al otro lado del puente, al norte de la Primera Puerta. Cuando le fallen las fuerzas puede ofrecerse a cruzar la Puerta contigo: eso es un final. Abátelo en su lugar, y el camino sigue hacia Yog-Sothoth y la Corte.",
    "Randolph Carter says Yog-Sothoth is the gate and the key and the guardian, and while it holds, the tall man's way stays open. It waits in the Gate of Spheres, past 'Umr at-Tawil and four dimensions of the Outer Dark: take the storm gate on the Last Shore.": "Randolph Carter dice que Yog-Sothoth es la puerta, la llave y el guardián, y que mientras resista, el camino del hombre alto sigue abierto. Espera en la Puerta de las Esferas, más allá de 'Umr at-Tawil y de cuatro dimensiones de la Oscuridad Exterior: toma la puerta de la tormenta en la Última Orilla.",
    "Azathoth waits in its Court at the centre of all, past the Gate of Spheres, blind, and answers every shot and every sprint. Its blows are aimed at no one but fall over the whole court, in rings, beats and boils: read each by where it will fall and when, and strike it at the flank between them until the piping fades.": "Azathoth espera en su Corte, en el centro de todo, más allá de la Puerta de las Esferas, ciego, y responde a cada disparo y a cada carrera. Sus golpes no apuntan a nadie, sino que caen sobre toda la corte, en anillos, latidos y burbujas: lee cada uno por dónde y cuándo caerá, y golpéalo en el flanco entre ellos hasta que se apague el son de las flautas.",
    "The piping has faded. The silver key hangs before the Elder Sign in Azathoth's Court: close your hand on it to wake and seal the Gate. The tall man waits aside: attend him, and the knee bends.": "El son de las flautas se ha apagado. La llave de plata cuelga ante el Signo Arcano, en la Corte de Azathoth: cierra la mano sobre ella para despertar y sellar la Puerta. El hombre alto espera a un lado: atiéndelo, y la rodilla se dobla.",
    "The dream is ended, and the choice was my own.": "El sueño ha terminado, y la elección fue mía.",
  },
};
