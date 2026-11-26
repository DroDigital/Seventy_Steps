/** The tomes, notes and letters, in Spanish (data/documents.ts): each one's name and paragraphs, by name; the rest are in documentsMore.ts. */

import type { StoryTable } from '..';

export const ES_DOCUMENTS: StoryTable = {
  Necronomicon: {
    "Necronomicon": "Necronomicon",
    "The Latin of Olaus Wormius, the 1623 printing: the university's own copy. Someone has been reading it with a pencil in hand.": "El latín de Olaus Wormius, la edición de 1623: el ejemplar de la universidad. Alguien lo ha estado leyendo con un lápiz en la mano.",
    ...(__DEMO__
      ? { "In the margin beside the passage on the Gate, in Peaslee's small, neat writing: \"Y. is the gate and the key and the guardian. Then who holds the key now? Ask A. about the key.\" The last line is underlined twice.": "En el margen, junto al pasaje sobre la Puerta, con la letra pequeña y pulcra de Peaslee: «Y. es la puerta, la llave y el guardián. ¿Quién tiene entonces la llave ahora? Preguntar a A. por la llave.» La última línea está subrayada dos veces." }
      : {
          "In the margin beside the passage on the Gate, in Peaslee's small, neat writing: \"Y. is the gate and the key and the guardian. Then who holds the key now? Ask A. about Carter.\" The last line is underlined twice.": "En el margen, junto al pasaje sobre la Puerta, con la letra pequeña y pulcra de Peaslee: «Y. es la puerta, la llave y el guardián. ¿Quién tiene entonces la llave ahora? Preguntar a A. por Carter.» La última línea está subrayada dos veces.",
        }),
  },
  "Keziah's Formulae": {
    "Keziah's Formulae": "Las fórmulas de Keziah",
    "Loose sheets in a woman's hand, very old, the ink gone brown. Most of it is arithmetic. Some of the figures describe angles that add up to more than a corner should.": "Hojas sueltas con letra de mujer, muy antiguas, la tinta vuelta parda. Casi todo es aritmética. Algunas de las figuras describen ángulos que suman más de lo que debería sumar una esquina.",
    "Set out plainly, the method wants four things: a sleeper's name, a knife, a candle lit from the black man's flame, and the right angle on Walpurgis Night. The rat carries the name. The angle does the rest. She has set the night in the margin, and it is soon.": "Expuesto con sencillez, el método pide cuatro cosas: el nombre de un durmiente, un cuchillo, una vela encendida con la llama del hombre negro y el ángulo justo en la Noche de Walpurgis. La rata lleva el nombre. El ángulo hace el resto. Ha anotado la noche en el margen, y es pronto.",
    "On the last sheet, in a much newer hand: \"It works. God help me, it works. W.G.\"": "En la última hoja, con una letra mucho más reciente: «Funciona. Dios me asista, funciona. W.G.»",
  },
  "Curwen's Journal": {
    "Curwen's Journal": "El diario de Curwen",
    "Joseph Curwen's hand, dated 1754: \"Rec'd this day from H. the Essential Saltes of one I had long sought. Must be carefull in the words. Never call up any that you can not put downe.\"": "La letra de Joseph Curwen, fechada en 1754: «Recibí hoy de H. las Sales Esenciales de uno que largo tiempo busqué. Hai que tener cuydado con las palabras. Nunca invoques a ninguno que no puedas devolver abajo.»",
    "Below it, in modern pencil: \"He did not listen to himself either. M.B.W.\"": "Debajo, a lápiz moderno: «Él tampoco se hizo caso a sí mismo. M.B.W.»",
  },
  "Akeley's Phonograph Record": {
    "Akeley's Phonograph Record": "El cilindro fonográfico de Akeley",
    "A wax cylinder in a cardboard sleeve, labelled \"May Eve 1915, Dark Mountain\". You do not need a machine to hear it. It plays in your head as you hold it.": "Un cilindro de cera en una funda de cartón, rotulado «Víspera de Mayo de 1915, Dark Mountain». No hace falta ninguna máquina para oírlo. Suena en tu cabeza mientras lo sostienes.",
    "A man's voice reads a kind of service. A buzzing answers him, trying hard to sound like speech. It says: \"To Nyarlathotep, Mighty Messenger, must all things be told.\"": "Una voz de hombre lee una especie de oficio. Un zumbido le responde, esforzándose mucho por sonar como el habla. Dice: «A Nyarlathotep, Poderoso Mensajero, todo ha de serle contado.»",
  },
  "Elder Thing Murals": {
    "Elder Thing Murals": "Los murales de los Antiguos",
    "A photograph of a carved wall, drawn over in pencil to bring out the lines. Star-shaped figures build a city. Then black, shapeless things do the building for them. Then the black things pull the builders apart.": "La fotografía de un muro tallado, repasada a lápiz para resaltar las líneas. Figuras en forma de estrella construyen una ciudad. Después, unas cosas negras y sin forma construyen por ellas. Después, las cosas negras despedazan a los constructores.",
    "Written underneath: \"Shoggoths. Their own servants. Do not go further in. W.D.\"": "Escrito debajo: «Shoggoths. Sus propios siervos. No sigas adentrándote. W.D.»",
  },
  "Pnakotic Manuscripts": {
    "Pnakotic Manuscripts": "Los Manuscritos Pnakóticos",
    "Fragments of something older than writing, copied into English by a careful hand: \"The Great Race sends its minds across time and takes the bodies of others for a while, to study their age. The borrowed ones remember nothing afterwards but dreams of a library.\"": "Fragmentos de algo más antiguo que la escritura, copiados al inglés por una mano cuidadosa: «La Gran Raza envía sus mentes a través del tiempo y toma por un tiempo los cuerpos de otros, para estudiar su época. Los tomados en préstamo no recuerdan después nada, salvo sueños de una biblioteca.»",
    "A note at the foot of the page: \"This is what happened to my father in 1908. I am sure of it now. W.P.\"": "Una nota al pie de la página: «Esto es lo que le pasó a mi padre en 1908. Ahora estoy seguro. W.P.»",
  },
  "R'lyehian Tablet": {
    "R'lyehian Tablet": "La tablilla de R'lyeh",
    "A greenish stone tablet, cold and slightly greasy. The characters are no alphabet you know, but you can read them, which is worse.": "Una tablilla de piedra verdosa, fría y algo grasienta. Los caracteres no son de ningún alfabeto que conozcas, pero puedes leerlos, y eso es peor.",
    "They say the same thing over and over: that in his house at R'lyeh the dead one waits, dreaming. Every sleeper in Arkham is dreaming too. You wonder whose dream this is.": "Dicen lo mismo una y otra vez: que en su casa de R'lyeh el muerto espera soñando. Todos los durmientes de Arkham sueñan también. Te preguntas de quién es este sueño.",
  },
  "Michel Mauvais's Notes": {
    "Michel Mauvais's Notes": "Las notas de Michel Mauvais",
    "Notes in old French with a later owner's translation in the margin. The wizard Michel Mauvais was burned by the Count de C—, and his son swore that no heir of the Count would live past thirty-two.": "Notas en francés antiguo con la traducción de un propietario posterior en el margen. El brujo Michel Mauvais fue quemado por el conde de C—, y su hijo juró que ningún heredero del conde viviría más allá de los treinta y dos años.",
    "\"The curse is carried out by the son himself,\" the translator writes, \"who has kept alive six hundred years by an elixir. The heirs never guessed who he was.\"": "«La maldición la cumple el propio hijo», escribe el traductor, «que se ha mantenido con vida seiscientos años gracias a un elixir. Los herederos nunca adivinaron quién era.»",
  },
  "Carter's Account": {
    "Carter's Account": "El relato de Carter",
    "Pages in Randolph Carter's hand, from his years in Arkham. \"I told Manton there was nothing unnamable. I was wrong.\"": "Páginas con la letra de Randolph Carter, de sus años en Arkham. «Le dije a Manton que no había nada innombrable. Me equivocaba.»",
    "Between the pages, a newer card: \"R. Carter, 2 Parker Place, Arkham.\" On the back, in pencil: \"He asked for the key very politely. I said no. He will come back.\"": "Entre las páginas, una tarjeta más reciente: «R. Carter, 2 Parker Place, Arkham.» En el reverso, a lápiz: «Me pidió la llave con mucha educación. Le dije que no. Volverá.»",
  },
  "Suydam's Papers": {
    "Suydam's Papers": "Los papeles de Suydam",
    "Robert Suydam's papers, water-stained. Lists of names and addresses in Red Hook, most of them crossed out. The draft of a wedding announcement.": "Los papeles de Robert Suydam, manchados de agua. Listas de nombres y direcciones de Red Hook, casi todas tachadas. El borrador de una participación de boda.",
    "At the bottom of the last page: \"The tall gentleman says the gate will be open by the autumn, and I may bring my bride through.\"": "Al pie de la última página: «El caballero alto dice que la puerta estará abierta para el otoño, y que podré hacer pasar por ella a mi novia.»",
  },
  "Liber Ivonis": {
    "Liber Ivonis": "Liber Ivonis",
    "The Latin Book of Eibon, a fifteenth-century copy chained to its shelf. The chain has been cut.": "El Libro de Eibon en latín, una copia del siglo XV encadenada a su estante. La cadena ha sido cortada.",
    ...(__DEMO__
      ? { "A slip marks the chapter on Zhothaqquah, \"who dwelleth in N'kai beneath the mound\". Someone has written in the margin: \"the mound in the hills? or the one at Binger?\"": "Un papelito marca el capítulo sobre Zhothaqquah, «que mora en N'kai bajo el túmulo». Alguien ha escrito en el margen: «¿el túmulo de las colinas? ¿o el de Binger?»" }
      : {
          "A slip marks the chapter on Zhothaqquah, \"who dwelleth in N'kai beneath the mound\". Someone has written in the margin: \"the mound at Dunwich? or the one at Binger?\"": "Un papelito marca el capítulo sobre Zhothaqquah, «que mora en N'kai bajo el túmulo». Alguien ha escrito en el margen: «¿el túmulo de Dunwich? ¿o el de Binger?»",
        }),
  },
  "Gilman's Dream-Diary": {
    "Gilman's Dream-Diary": "El diario de sueños de Gilman",
    "A student's notebook, water-stained, found in a rat-hole. Walter Gilman's hand, getting worse page by page.": "El cuaderno de un estudiante, manchado de agua, hallado en una ratonera. La letra de Walter Gilman, peor página tras página.",
    "\"March 30. The little thing with the man's face came again last night. It nuzzled my hand. I am afraid of the angles of this room. I am more afraid of the day I stop being afraid of them.\"": "«30 de marzo. La cosita con cara de hombre volvió anoche. Me hocicó la mano. Tengo miedo de los ángulos de esta habitación. Me da más miedo el día en que deje de tenerles miedo.»",
  },
  "Old Whateley's Ledger": {
    "Old Whateley's Ledger": "El libro de cuentas del viejo Whateley",
    "A farm account-book: cattle bought, cattle bought, cattle bought. Never a head sold.": "Un libro de cuentas de granja: ganado comprado, ganado comprado, ganado comprado. Ni una cabeza vendida.",
    "On the inside cover, in a different ink: \"Enlarge the shed agin. He grows faster than they told. Yog-Sothoth is the gate. The boy must learn the words.\"": "En el interior de la tapa, con otra tinta: «Agrandar el cobertizo otra vé. Crece más rápido de lo que dijeron. Yog-Sothoth es la puerta. El chico tiene que aprender las palabras.»",
  },
  "Obed Marsh's Log": {
    "Obed Marsh's Log": "El cuaderno de bitácora de Obed Marsh",
    "The captain's log of the Sumatra Queen, 1838 to 1846, swollen with seawater.": "La bitácora del capitán del Sumatra Queen, de 1838 a 1846, hinchada de agua de mar.",
    "\"Walakea says they will give fish and gold for young folk. I told him Innsmouth has plenty of both kinds of young folk, and the ones that go down to them will not die, only change. Signed it at the reef tonight.\"": "«Walakea dice que darán pescado y oro a cambio de gente joven. Le dije que en Innsmouth hay de sobra de ambas clases de gente joven, y que los que bajen con ellos no morirán, solo cambiarán. Firmado esta noche en el arrecife.»",
  },
  "Bowen's Journal": {
    "Bowen's Journal": "El diario de Bowen",
    "Professor Enoch Bowen, Providence, 1844, on his return from Egypt: a list of what he brought home in his crates.": "El profesor Enoch Bowen, Providence, 1844, a su regreso de Egipto: una lista de lo que trajo a casa en sus cajas.",
    "\"The box with the stone. Keep it closed. The stone must not be left in darkness, and it must not be left in light. I have not decided which is worse.\"": "«La caja con la piedra. Mantenerla cerrada. La piedra no debe quedarse a oscuras, y no debe quedarse a la luz. No he decidido qué es peor.»",
  },
  "Danforth's Sketches": {
    "Danforth's Sketches": "Los bocetos de Danforth",
    "Pencil drawings from the Miskatonic Antarctic Expedition's second flight. The later sheets are not of buildings.": "Dibujos a lápiz del segundo vuelo de la expedición antártica de la Miskatonic. Las últimas hojas no son de edificios.",
    "The last sketch is of a black, bubbling mass filling a tunnel from wall to wall, lit by the plane's lamp. Written under it, over and over: \"Tekeli-li. Tekeli-li.\"": "El último boceto es de una masa negra y burbujeante que llena un túnel de pared a pared, iluminada por el faro del avión. Escrito debajo, una y otra vez: «Tekeli-li. Tekeli-li.»",
  },
  "The Case of the Earth Race": {
    "The Case of the Earth Race": "El caso de la raza terrestre",
    "Metal-bound pages in a script like hooked marks, and, pressed between them, a sheet of University letterhead.": "Páginas encuadernadas en metal, en una escritura como de marcas en gancho, y, prensada entre ellas, una hoja con membrete de la universidad.",
    "Peaslee's hand: \"It is my own writing. I wrote this, in their script, in 1908 to 1913, in a body that was not mine. I have now seen the shelf it was kept on. I wish I had not.\"": "La letra de Peaslee: «Es mi propia letra. Escribí esto, en su escritura, de 1908 a 1913, en un cuerpo que no era el mío. Ahora he visto el estante donde lo guardaban. Ojalá no lo hubiera visto.»",
  },
  "Zamacona's Manuscript": {
    "Zamacona's Manuscript": "El manuscrito de Zamacona",
    "A roll of parchment in sixteenth-century Spanish, found in a clay cylinder. Pánfilo de Zamacona y Nuñez's account of K'n-yan.": "Un rollo de pergamino en español del siglo XVI, hallado en un cilindro de arcilla. La relación de K'n-yan de Pánfilo de Zamacona y Nuñez.",
    "\"They have given up the gods of the upper world, and even Yig and Tulu they keep only as a habit. But of what lies beneath red-litten Yoth, in black N'kai, they will not speak at all.\"": "«Han renunciado a los dioses del mundo de arriba, y aun a Yig y a Tulu los guardan solo por costumbre. Mas de lo que yace bajo Yoth, la de las luces rojas, en el negro N'kai, no quieren hablar en absoluto.»",
  },
  "The Pnakotic Fragments": {
    "The Pnakotic Fragments": "Los fragmentos pnakóticos",
    "Loose leaves the elder priests of Ulthar keep behind a grille. They are older than Ulthar.": "Hojas sueltas que los sacerdotes ancianos de Ulthar guardan tras una reja. Son más antiguas que Ulthar.",
    "\"Seek not Kadath, for the gods of earth are weak, and dwell there under the guard of the Other Gods from outside, whose soul and messenger is the crawling chaos Nyarlathotep.\"": "«No busques Kadath, pues los dioses de la tierra son débiles y moran allí bajo la custodia de los Otros Dioses de fuera, cuya alma y mensajero es el caos reptante Nyarlathotep.»",
  },
  "Johansen's Narrative": {
    "Johansen's Narrative": "El relato de Johansen",
    "The Norwegian mate's account of the Emma and the Alert, the copy his widow sent to Professor Angell.": "La relación del oficial noruego sobre el Emma y el Alert, la copia que su viuda envió al profesor Angell.",
    "\"The angles were all wrong. A man went in over a corner that was not there, and did not come out. Then the great door opened, and It came out, and I steered for It.\"": "«Los ángulos estaban todos mal. Un hombre entró por una esquina que no estaba allí, y no volvió a salir. Entonces se abrió la gran puerta, y Ello salió, y puse rumbo hacia Ello.»",
  },
  "The Outer Ones' Ledger": {
    "The Outer Ones' Ledger": "El registro de los de Fuera",
    "A list scratched on a thin sheet of some metal that is not any metal, in English, in a hand that tried hard to be human.": "Una lista rayada en una hoja fina de un metal que no es ningún metal, en inglés, con una letra que se esforzaba mucho por ser humana.",
    "\"Received for the journey: one brain, H.W.A., in cylinder 12. Condition good. He asks for his son. We have told him the son will come.\"": "«Recibido para el viaje: un cerebro, H.W.A., en el cilindro 12. Buen estado. Pregunta por su hijo. Le hemos dicho que el hijo vendrá.»",
  },
  "The Silver Key's Inscription": {
    "The Silver Key's Inscription": "La inscripción de la Llave de Plata",
    "Nine lines in no known alphabet, rubbed from the key itself onto a sheet of paper by someone who could not read them either.": "Nueve líneas en ningún alfabeto conocido, calcadas de la propia llave sobre una hoja de papel por alguien que tampoco sabía leerlas.",
    "Beneath, in pencil: \"Randolph Carter turned it at the Snake Den on his fifty-fourth birthday. He was never found. He was never quite lost either.\"": "Debajo, a lápiz: «Randolph Carter la giró en la Cueva de la Serpiente el día que cumplió cincuenta y cuatro años. Nunca lo encontraron. Tampoco estuvo nunca del todo perdido.»",
  },
  "St John's Diary": {
    "St John's Diary": "El diario de St John",
    "A pocket diary with a green jade amulet pressed into its last pages, so that the shape of it stays in the paper.": "Una agenda de bolsillo con un amuleto de jade verde prensado entre sus últimas páginas, de modo que su forma queda en el papel.",
    "\"We should never have opened that grave in Holland. The baying follows us across the moor now. St John says it is only a dog. There are no dogs within ten miles.\"": "«Nunca debimos abrir aquella tumba en Holanda. Ahora los ladridos nos siguen por el páramo. St John dice que es solo un perro. No hay perros en diez millas a la redonda.»",
  },
  "Asenath's Notes": {
    "Asenath's Notes": "Las notas de Asenath",
    "Loose sheets in a heavy, forceful hand that does not match the woman's signature at the bottom.": "Hojas sueltas con una letra pesada y enérgica que no casa con la firma de mujer del pie.",
    "\"The body is young but it is a woman's, and a woman cannot enter the Order's inner circle. Edward Derby is weak. Edward Derby will do.\"": "«El cuerpo es joven, pero es de mujer, y una mujer no puede entrar en el círculo interior de la Orden. Edward Derby es débil. Edward Derby servirá.»",
  },
  "Cultes des Goules": {
    "Cultes des Goules": "Cultes des Goules",
    "The Comte d'Erlette's book on the ghoul cults of France, in a cheap later printing. A railway ticket marks the chapter on New England. The name on the ticket is Pickman.": "El libro del conde d'Erlette sobre los cultos necrófagos de Francia, en una reimpresión barata. Un billete de tren marca el capítulo sobre Nueva Inglaterra. El nombre del billete es Pickman.",
    "The chapter says the ghouls were men once, and still keep some of the habits of men, including a taste for good paintings.": "El capítulo dice que los necrófagos fueron hombres una vez, y que aún conservan algunas costumbres de los hombres, entre ellas el gusto por la buena pintura.",
  },
  "Unaussprechlichen Kulten": {
    "Unaussprechlichen Kulten": "Unaussprechlichen Kulten",
    "Von Junzt's Nameless Cults, the Düsseldorf edition of 1839, with the iron clasps. The page on the Black Goat of the Woods has been folded down.": "Los Cultos sin nombre de von Junzt, la edición de Düsseldorf de 1839, con los cierres de hierro. La página sobre la Cabra Negra de los Bosques tiene la esquina doblada.",
    "Beside it, in a farmer's big letters: \"Wizard W. read this out loud on the hill every May Eve and Lammas. That is when the noises started.\"": "Al lado, con letras grandes de granjero: «El brujo W. leía esto en voz alta en la colina cada Víspera de Mayo y en Lammas. Entonces empezaron los ruidos.»",
  },
  "Seven Cryptical Books of Hsan": {
    "Seven Cryptical Books of Hsan": "Los Siete Libros Crípticos de Hsan",
    "A book of dream-lore from Ulthar, the pages brown and soft: \"The gods of earth dwell upon Kadath in the cold waste. They are weak and mild, and they are watched by the Other Gods from outside, whose messenger is the crawling chaos.\"": "Un libro de saber onírico de Ulthar, de páginas pardas y blandas: «Los dioses de la tierra moran sobre Kadath, en el yermo helado. Son débiles y mansos, y los vigilan los Otros Dioses de fuera, cuyo mensajero es el caos reptante.»",
    "Someone has pressed a flower between these pages. It is still fresh.": "Alguien ha prensado una flor entre estas páginas. Sigue fresca.",
  },
  "Arkham Advertiser, October 2nd": {
    "Arkham Advertiser, October 2nd": "Arkham Advertiser, 2 de octubre",
    "SLEEPING SICKNESS AT UNIVERSITY. Professor Wingate Peaslee of the Department of Psychology was found asleep at a table in the Orne Library on Monday morning and has not woken.": "ENFERMEDAD DEL SUEÑO EN LA UNIVERSIDAD. El profesor Wingate Peaslee, del Departamento de Psicología, fue hallado dormido sobre una mesa de la Biblioteca Orne el lunes por la mañana y no ha despertado.",
    "Dr. Hartwell of St. Mary's Hospital calls the professor's condition \"unusual but not alarming\". Four more cases have been reported in Arkham since.": "El Dr. Hartwell, del Hospital St. Mary, califica el estado del profesor de «inusual pero no alarmante». Desde entonces se han registrado cuatro casos más en Arkham.",
  },
  "Frank's Letter Home": {
    "Frank's Letter Home": "La carta de Frank a casa",
    "Dear Mother, don't worry about the news, they say it isn't catching. Everyone here is on edge though. Old Armitage has had the restricted room locked, and he sleeps in the library himself now, on a cot.": "Querida madre, no te preocupes por las noticias, dicen que no se contagia. Aun así, aquí todo el mundo anda con los nervios de punta. El viejo Armitage ha hecho cerrar con llave la sala reservada, y ahora él mismo duerme en la biblioteca, en un catre.",
    "Last night I walked past at midnight and saw him standing at the window, looking out at the quad as if he was waiting for somebody. Your loving son, Frank.": "Anoche pasé por allí a medianoche y lo vi de pie junto a la ventana, mirando el patio como si esperara a alguien. Tu hijo que te quiere, Frank.",
  },
  "Officer Riley's Report": {
    "Officer Riley's Report": "El informe del agente Riley",
    "Report of Officer D. Riley, Arkham Police, October 3rd. Called to the Witch House regarding noises. Found the upper floor empty.": "Informe del agente D. Riley, Policía de Arkham, 3 de octubre. Llamado a la Casa de la Bruja por unos ruidos. Encontré vacía la planta de arriba.",
    "In the attic room there is a hole where the ceiling meets the wall. I could not see the end of it with my torch. Small footprints in the dust, like a rat's, but with fingers. I recommend the house be boarded up.": "En el cuarto del desván hay un agujero donde el techo se junta con la pared. No pude ver dónde acababa con mi linterna. Huellas pequeñas en el polvo, como de rata, pero con dedos. Recomiendo tapiar la casa.",
  },
  "Ammi Pierce's Letter": {
    "Ammi Pierce's Letter": "La carta de Ammi Pierce",
    "They're building the new reservoir over the old Gardner place, and I say good riddance. Don't you drink the water up there when it's done.": "Están construyendo el nuevo embalse sobre la vieja finca de los Gardner, y digo que mejor así. No bebas el agua de allá arriba cuando lo terminen.",
    "Something came down in the Gardners' well in '82 and it never went away. It just changed colour. Your loving father, Ammi.": "Algo cayó en el pozo de los Gardner en el 82 y nunca se fue. Solo cambió de color. Tu padre que te quiere, Ammi.",
  },
  "Postcard from Kingsport": {
    "Postcard from Kingsport": "Postal desde Kingsport",
    "Don't come up here, Ellie. There's an old man on Water Street who keeps bottles on a shelf and talks to them, and they swing without any wind.": "No subas aquí, Ellie. Hay un viejo en Water Street que guarda botellas en un estante y les habla, y se balancean sin que sople ningún viento.",
    "Three sailors went to rob him last week. Nobody has seen them since. T.": "La semana pasada tres marineros fueron a robarle. Nadie los ha vuelto a ver. T.",
  },
  "Sheriff's Notebook": {
    "Sheriff's Notebook": "El cuaderno del sheriff",
    "Aylesbury Pike, Sept. 9. Seth Bishop's cattle gone, eleven head. No tracks, but a trail flattened through the brush as if somebody had dragged a barn along it.": "Aylesbury Pike, 9 de sept. Desaparecido el ganado de Seth Bishop, once cabezas. Sin huellas, pero un rastro aplastado entre la maleza, como si alguien hubiera arrastrado un granero por allí.",
    "Whateley farm boarded up since the boy died. Whippoorwills very loud. Selina Frye says they are waiting to catch a soul.": "La granja Whateley, tapiada desde que murió el chico. Los chotacabras, muy ruidosos. Selina Frye dice que esperan atrapar un alma.",
  },
  "Railway Notice": {
    "Railway Notice": "Aviso del ferrocarril",
    "NOTICE. Owing to lack of custom, the Arkham to Innsmouth branch line is suspended until further notice.": "AVISO. Por falta de clientela, el ramal Arkham–Innsmouth queda suspendido hasta nuevo aviso.",
    "Travellers to Innsmouth should use Joe Sargent's bus from Newburyport. The company takes no responsibility for delays on the Innsmouth road.": "Los viajeros a Innsmouth deberán tomar el autobús de Joe Sargent desde Newburyport. La compañía no se hace responsable de los retrasos en la carretera de Innsmouth.",
  },
  "Treasury Memorandum": {
    "Treasury Memorandum": "Memorando del Tesoro",
    "Confidential. February 1928 raid on Innsmouth: two hundred persons removed to camps. A submarine was sent out to Devil Reef. The crew's report is withheld.": "Confidencial. Redada en Innsmouth en febrero de 1928: doscientas personas trasladadas a campos. Se envió un submarino al Arrecife del Diablo. El informe de la tripulación queda reservado.",
    "Several of the removed persons have since died in custody of what the camp doctor calls \"a change in the skin\".": "Varias de las personas trasladadas han muerto desde entonces bajo custodia de lo que el médico del campo llama «un cambio en la piel».",
  },
  "Akeley's Last Letter": {
    "Akeley's Last Letter": "La última carta de Akeley",
    "Townshend, Vermont. Dear Mr. Wilmarth, I have been out on the hills again and there are more tracks than ever, all of them pointing toward my house.": "Townshend, Vermont. Estimado señor Wilmarth: he vuelto a salir a las colinas y hay más huellas que nunca, todas apuntando hacia mi casa.",
    "They have been leaving my dogs alone, which worries me more than if they had not. If I stop writing, do not come up here. Yours, Henry W. Akeley.": "Están dejando en paz a mis perros, lo que me preocupa más que si no lo hicieran. Si dejo de escribir, no suba usted aquí. Suyo, Henry W. Akeley.",
  },
  "Ordinance of Ulthar": {
    "Ordinance of Ulthar": "Ordenanza de Ulthar",
    "It is the law in Ulthar that no man may kill a cat. It has been the law since the old cottager and his wife were found with their bones picked clean, the morning after the caravan left.": "Es ley en Ulthar que ningún hombre puede matar a un gato. Es ley desde que hallaron al viejo labriego y a su mujer con los huesos mondos, la mañana después de que partiera la caravana.",
    "A merchant who laughed at the law last spring left town in a hurry. His mule came back without him.": "Un mercader que se rio de la ley la primavera pasada salió de la ciudad a toda prisa. Su mula volvió sin él.",
  },
  "Lake's Notebook": {
    "Lake's Notebook": "El cuaderno de Lake",
    "A field notebook with a split spine, the last page in pencil: \"Specimen 4 is warm to the touch. Dissected the third. Nobody has lit the stove since the dogs began. Gedney says the sixth is no longer on the table.\"": "Un cuaderno de campo con el lomo partido, la última página a lápiz: «El espécimen 4 está tibio al tacto. Diseccioné el tercero. Nadie ha encendido la estufa desde que empezaron los perros. Gedney dice que el sexto ya no está en la mesa.»",
    "Under it, in a steadier hand, Danforth's: \"We found eight of them afterwards, set upright in the snow, each in a perfect five-pointed mound. Whoever buried them had a great deal of respect for the dead.\"": "Debajo, con una mano más firme, la de Danforth: «Después encontramos a ocho de ellos, puestos de pie en la nieve, cada uno en un túmulo perfecto de cinco puntas. Quien los enterró tenía un gran respeto por los muertos.»",
  },
  "A Sledge Driver's Note": {
    "A Sledge Driver's Note": "Nota de un conductor de trineo",
    "Dogs will not go past the ridge. Not for the whip, not for fish. Pierce says it is the wind. I say the wind never played a tune before.": "Los perros no pasan de la cresta. Ni con el látigo, ni con pescado. Pierce dice que es el viento. Yo digo que el viento nunca había tocado una melodía.",
    "Someone has added in a thick pencil: \"It has a very wide range, the tune. I counted the notes from a sledge and I could not count them all.\"": "Alguien ha añadido con un lápiz grueso: «Tiene una extensión muy amplia, la melodía. Conté las notas desde un trineo y no pude contarlas todas.»",
  },
  "Freeborn's Survey Book": {
    "Freeborn's Survey Book": "El cuaderno de agrimensura de Freeborn",
    "Western Australia, 1935. Block 17: basalt, cyclopean, not cut but ground. The sand has been blown off it more than once; the drift shows two kinds of wind. Mackenzie wants to dig. I would rather not.": "Australia Occidental, 1935. Bloque 17: basalto, ciclópeo, no tallado sino pulido. La arena se ha barrido de él más de una vez; los depósitos muestran dos clases de viento. Mackenzie quiere excavar. Yo preferiría que no.",
    "On the facing page, in another hand: \"Peaslee dreamed of this place for fifteen years before he saw it. At the fork he knew which way the stairs went, and said so, and then asked us to forget he had.\"": "En la página de enfrente, con otra letra: «Peaslee soñó con este lugar durante quince años antes de verlo. En la bifurcación supo hacia dónde iban las escaleras, y lo dijo, y luego nos pidió que olvidáramos que lo había dicho.»",
  },
  "A Receipt in the Archivist's Hand": {
    "A Receipt in the Archivist's Hand": "Un recibo de mano del Archivero",
    "Received for the Great Race: one mind of the dominant form of the third planet, 1.7 of its years, held for the study of its age. Returned with most of its memory, as agreed. The borrowed body is marked in good condition.": "Recibido para la Gran Raza: una mente de la forma dominante del tercer planeta, por 1,7 de sus años, retenida para el estudio de su época. Devuelta con la mayor parte de su memoria, según lo acordado. El cuerpo prestado consta en buen estado.",
    "A line is added in English, a good deal more slowly written: \"The borrower asks it be noted that the exchange student wept at the end of the term, and did not say for what.\"": "Hay una línea añadida en inglés, escrita con mucha más lentitud: «El prestatario pide que conste que el estudiante de intercambio lloró al final del curso, y no dijo por qué.»",
  },
  "A Judge's Notice": {
    "A Judge's Notice": "Aviso de un juez",
    "NOTICE OF THE THIRD HALL. The sitting is adjourned for want of a god. The Judge records that Tulu is again the fashion and the old Serpent unfashionable, and reminds the citizens that the Serpent is unfashionable at its pleasure.": "AVISO DE LA TERCERA SALA. Se aplaza la sesión por falta de un dios. El juez hace constar que Tulu vuelve a estar de moda y la vieja Serpiente pasada de moda, y recuerda a los ciudadanos que la Serpiente está pasada de moda a su propio gusto.",
    "Below, in a sharper script: \"Citizens are asked to leave the lower stair clear. What is kept beneath red Yoth is not our concern, and we would like it to remain so.\"": "Debajo, con una letra más afilada: «Se ruega a los ciudadanos que dejen libre la escalera inferior. Lo que se guarda bajo la roja Yoth no es asunto nuestro, y nos gustaría que siguiera sin serlo.»",
  },
  "Tally of the Red Stairs": {
    "Tally of the Red Stairs": "Cuenta de la Escalera Roja",
    "Nine steps to red-litten Yoth. The light is warm to the sixth and begins to fail at the seventh. It does not fail further, for what lies below it is not dark, being the absence of any light and so beyond the reach of its dimming.": "Nueve escalones hasta Yoth, la de las luces rojas. La luz es cálida hasta el sexto y empieza a fallar en el séptimo. No falla más, pues lo que hay debajo no es oscuro, sino la ausencia de toda luz, y por tanto queda fuera del alcance de su desvanecerse.",
    "A child has scratched a little figure with six arms beside the ninth step, and the words: \"He waves.\"": "Un niño ha rayado una figurita de seis brazos junto al noveno escalón, y las palabras: «Saluda.»",
  },
};
