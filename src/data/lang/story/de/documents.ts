/** The tomes, notes and letters, in German (data/documents.ts): each one's name and paragraphs, by name; the rest are in documentsMore.ts. */

import type { StoryTable } from '..';

export const DE_DOCUMENTS: StoryTable = {
  Necronomicon: {
    "Necronomicon": "Necronomicon",
    "The Latin of Olaus Wormius, the 1623 printing: the university's own copy. Someone has been reading it with a pencil in hand.": "Das Latein des Olaus Wormius, der Druck von 1623: das Exemplar der Universität. Jemand hat mit einem Bleistift in der Hand darin gelesen.",
    ...(__DEMO__
      ? { "In the margin beside the passage on the Gate, in Peaslee's small, neat writing: \"Y. is the gate and the key and the guardian. Then who holds the key now? Ask A. about the key.\" The last line is underlined twice.": "Am Rand neben der Passage über das Tor, in Peaslees kleiner, sauberer Schrift: „Y. ist das Tor und der Schlüssel und der Hüter. Wer hält dann jetzt den Schlüssel? A. nach dem Schlüssel fragen.“ Die letzte Zeile ist zweimal unterstrichen." }
      : {
          "In the margin beside the passage on the Gate, in Peaslee's small, neat writing: \"Y. is the gate and the key and the guardian. Then who holds the key now? Ask A. about Carter.\" The last line is underlined twice.": "Am Rand neben der Passage über das Tor, in Peaslees kleiner, sauberer Schrift: „Y. ist das Tor und der Schlüssel und der Hüter. Wer hält dann jetzt den Schlüssel? A. nach Carter fragen.“ Die letzte Zeile ist zweimal unterstrichen.",
        }),
  },
  "Keziah's Formulae": {
    "Keziah's Formulae": "Keziahs Formeln",
    "Loose sheets in a woman's hand, very old, the ink gone brown. Most of it is arithmetic. Some of the figures describe angles that add up to more than a corner should.": "Lose Blätter in der Hand einer Frau, sehr alt, die Tinte braun geworden. Das meiste ist Rechnerei. Einige der Figuren beschreiben Winkel, die zusammen mehr ergeben, als eine Ecke sollte.",
    "Set out plainly, the method wants four things: a sleeper's name, a knife, a candle lit from the black man's flame, and the right angle on Walpurgis Night. The rat carries the name. The angle does the rest. She has set the night in the margin, and it is soon.": "Schlicht dargelegt, verlangt das Verfahren vier Dinge: den Namen eines Schläfers, ein Messer, eine Kerze, entzündet an der Flamme des schwarzen Mannes, und den richtigen Winkel in der Walpurgisnacht. Die Ratte trägt den Namen. Der Winkel tut den Rest. Sie hat die Nacht an den Rand geschrieben, und sie ist bald.",
    "On the last sheet, in a much newer hand: \"It works. God help me, it works. W.G.\"": "Auf dem letzten Blatt, in einer viel neueren Hand: „Es funktioniert. Gott steh mir bei, es funktioniert. W.G.“",
  },
  "Curwen's Journal": {
    "Curwen's Journal": "Curwens Tagebuch",
    "Joseph Curwen's hand, dated 1754: \"Rec'd this day from H. the Essential Saltes of one I had long sought. Must be carefull in the words. Never call up any that you can not put downe.\"": "Joseph Curwens Hand, datiert 1754: „Heute von H. empfangen die Essentiellen Saltze eines, den ich lange gesucht. Muß vorsichtig seyn mit den Worten. Rufe niemals einen herauf, den du nicht wieder hinabbannen kannst.“",
    "Below it, in modern pencil: \"He did not listen to himself either. M.B.W.\"": "Darunter, in modernem Bleistift: „Er hat auch nicht auf sich selbst gehört. M.B.W.“",
  },
  "Akeley's Phonograph Record": {
    "Akeley's Phonograph Record": "Akeleys Phonographenwalze",
    "A wax cylinder in a cardboard sleeve, labelled \"May Eve 1915, Dark Mountain\". You do not need a machine to hear it. It plays in your head as you hold it.": "Eine Wachswalze in einer Papphülle, beschriftet „Mai-Vorabend 1915, Dark Mountain“. Ihr braucht keine Maschine, um sie zu hören. Sie spielt in eurem Kopf, während ihr sie haltet.",
    "A man's voice reads a kind of service. A buzzing answers him, trying hard to sound like speech. It says: \"To Nyarlathotep, Mighty Messenger, must all things be told.\"": "Eine Männerstimme liest eine Art Gottesdienst. Ein Summen antwortet ihr und bemüht sich sehr, wie Sprache zu klingen. Es sagt: „Nyarlathotep, dem Mächtigen Boten, muss alles berichtet werden.“",
  },
  "Elder Thing Murals": {
    "Elder Thing Murals": "Wandbilder der Älteren Wesen",
    "A photograph of a carved wall, drawn over in pencil to bring out the lines. Star-shaped figures build a city. Then black, shapeless things do the building for them. Then the black things pull the builders apart.": "Die Fotografie einer gemeißelten Wand, mit Bleistift nachgezogen, um die Linien hervorzuheben. Sternförmige Gestalten bauen eine Stadt. Dann bauen schwarze, formlose Dinge für sie. Dann reißen die schwarzen Dinge die Erbauer in Stücke.",
    "Written underneath: \"Shoggoths. Their own servants. Do not go further in. W.D.\"": "Darunter geschrieben: „Shoggothen. Ihre eigenen Diener. Nicht weiter hineingehen. W.D.“",
  },
  "Pnakotic Manuscripts": {
    "Pnakotic Manuscripts": "Pnakotische Manuskripte",
    "Fragments of something older than writing, copied into English by a careful hand: \"The Great Race sends its minds across time and takes the bodies of others for a while, to study their age. The borrowed ones remember nothing afterwards but dreams of a library.\"": "Bruchstücke von etwas, das älter ist als die Schrift, von sorgfältiger Hand ins Englische übertragen: „Die Große Rasse sendet ihren Geist durch die Zeit und nimmt für eine Weile die Körper anderer, um deren Zeitalter zu studieren. Die Entliehenen erinnern sich danach an nichts als an Träume von einer Bibliothek.“",
    "A note at the foot of the page: \"This is what happened to my father in 1908. I am sure of it now. W.P.\"": "Eine Notiz am Fuß der Seite: „Das ist meinem Vater 1908 geschehen. Ich bin mir jetzt sicher. W.P.“",
  },
  "R'lyehian Tablet": {
    "R'lyehian Tablet": "R'lyehische Tafel",
    "A greenish stone tablet, cold and slightly greasy. The characters are no alphabet you know, but you can read them, which is worse.": "Eine grünliche Steintafel, kalt und leicht schmierig. Die Zeichen sind kein Alphabet, das ihr kennt, aber ihr könnt sie lesen, und das ist schlimmer.",
    "They say the same thing over and over: that in his house at R'lyeh the dead one waits, dreaming. Every sleeper in Arkham is dreaming too. You wonder whose dream this is.": "Sie sagen immer wieder dasselbe: dass in seinem Haus zu R'lyeh der Tote wartet und träumt. Jeder Schläfer in Arkham träumt ebenfalls. Ihr fragt euch, wessen Traum das ist.",
  },
  "Michel Mauvais's Notes": {
    "Michel Mauvais's Notes": "Michel Mauvais' Aufzeichnungen",
    "Notes in old French with a later owner's translation in the margin. The wizard Michel Mauvais was burned by the Count de C—, and his son swore that no heir of the Count would live past thirty-two.": "Notizen in altem Französisch, mit der Übersetzung eines späteren Besitzers am Rand. Der Hexenmeister Michel Mauvais wurde vom Grafen de C— verbrannt, und sein Sohn schwor, dass kein Erbe des Grafen älter als zweiunddreißig werden würde.",
    "\"The curse is carried out by the son himself,\" the translator writes, \"who has kept alive six hundred years by an elixir. The heirs never guessed who he was.\"": "„Der Fluch wird vom Sohn selbst vollstreckt“, schreibt der Übersetzer, „der sich durch ein Elixier sechshundert Jahre am Leben erhalten hat. Die Erben ahnten nie, wer er war.“",
  },
  "Carter's Account": {
    "Carter's Account": "Carters Bericht",
    "Pages in Randolph Carter's hand, from his years in Arkham. \"I told Manton there was nothing unnamable. I was wrong.\"": "Seiten in Randolph Carters Hand, aus seinen Jahren in Arkham. „Ich sagte Manton, es gebe nichts Unnennbares. Ich habe mich geirrt.“",
    "Between the pages, a newer card: \"R. Carter, 2 Parker Place, Arkham.\" On the back, in pencil: \"He asked for the key very politely. I said no. He will come back.\"": "Zwischen den Seiten eine neuere Karte: „R. Carter, 2 Parker Place, Arkham.“ Auf der Rückseite, in Bleistift: „Er bat sehr höflich um den Schlüssel. Ich sagte nein. Er wird wiederkommen.“",
  },
  "Suydam's Papers": {
    "Suydam's Papers": "Suydams Papiere",
    "Robert Suydam's papers, water-stained. Lists of names and addresses in Red Hook, most of them crossed out. The draft of a wedding announcement.": "Robert Suydams Papiere, wasserfleckig. Listen von Namen und Adressen in Red Hook, die meisten durchgestrichen. Der Entwurf einer Hochzeitsanzeige.",
    "At the bottom of the last page: \"The tall gentleman says the gate will be open by the autumn, and I may bring my bride through.\"": "Am Fuß der letzten Seite: „Der hochgewachsene Herr sagt, das Tor werde zum Herbst offen sein, und ich dürfe meine Braut hindurchführen.“",
  },
  "Liber Ivonis": {
    "Liber Ivonis": "Liber Ivonis",
    "The Latin Book of Eibon, a fifteenth-century copy chained to its shelf. The chain has been cut.": "Das lateinische Buch des Eibon, eine Abschrift aus dem fünfzehnten Jahrhundert, an sein Regal gekettet. Die Kette ist durchtrennt.",
    ...(__DEMO__
      ? { "A slip marks the chapter on Zhothaqquah, \"who dwelleth in N'kai beneath the mound\". Someone has written in the margin: \"the mound in the hills? or the one at Binger?\"": "Ein Zettel markiert das Kapitel über Zhothaqquah, „welcher wohnet in N'kai unter dem Hügel“. Jemand hat an den Rand geschrieben: „der Hügel draußen in den Bergen? oder der bei Binger?“" }
      : {
          "A slip marks the chapter on Zhothaqquah, \"who dwelleth in N'kai beneath the mound\". Someone has written in the margin: \"the mound at Dunwich? or the one at Binger?\"": "Ein Zettel markiert das Kapitel über Zhothaqquah, „welcher wohnet in N'kai unter dem Hügel“. Jemand hat an den Rand geschrieben: „der Hügel bei Dunwich? oder der bei Binger?“",
        }),
  },
  "Gilman's Dream-Diary": {
    "Gilman's Dream-Diary": "Gilmans Traumtagebuch",
    "A student's notebook, water-stained, found in a rat-hole. Walter Gilman's hand, getting worse page by page.": "Das Notizbuch eines Studenten, wasserfleckig, in einem Rattenloch gefunden. Walter Gilmans Hand, von Seite zu Seite schlechter.",
    "\"March 30. The little thing with the man's face came again last night. It nuzzled my hand. I am afraid of the angles of this room. I am more afraid of the day I stop being afraid of them.\"": "„30. März. Das kleine Ding mit dem Menschengesicht kam letzte Nacht wieder. Es stupste meine Hand mit der Schnauze an. Ich fürchte mich vor den Winkeln dieses Zimmers. Mehr noch fürchte ich den Tag, an dem ich aufhöre, mich vor ihnen zu fürchten.“",
  },
  "Old Whateley's Ledger": {
    "Old Whateley's Ledger": "Des alten Whateley Kontobuch",
    "A farm account-book: cattle bought, cattle bought, cattle bought. Never a head sold.": "Das Wirtschaftsbuch eines Hofes: Vieh gekauft, Vieh gekauft, Vieh gekauft. Nie ein Stück verkauft.",
    "On the inside cover, in a different ink: \"Enlarge the shed agin. He grows faster than they told. Yog-Sothoth is the gate. The boy must learn the words.\"": "Auf der Innenseite des Deckels, in anderer Tinte: „Den Schuppen widder vergrößern. Er wächst schneller, als sie gesagt ham. Yog-Sothoth ist das Tor. Der Junge muss die Worte lernen.“",
  },
  "Obed Marsh's Log": {
    "Obed Marsh's Log": "Obed Marshs Logbuch",
    "The captain's log of the Sumatra Queen, 1838 to 1846, swollen with seawater.": "Das Logbuch des Kapitäns der Sumatra Queen, 1838 bis 1846, vom Meerwasser aufgequollen.",
    "\"Walakea says they will give fish and gold for young folk. I told him Innsmouth has plenty of both kinds of young folk, and the ones that go down to them will not die, only change. Signed it at the reef tonight.\"": "„Walakea sagt, sie geben Fisch und Gold für junges Volk. Ich sagte ihm, Innsmouth hat reichlich von beiderlei jungem Volk, und die zu ihnen hinabgehen, sterben nicht, sie verwandeln sich nur. Heute Nacht am Riff unterschrieben.“",
  },
  "Bowen's Journal": {
    "Bowen's Journal": "Bowens Tagebuch",
    "Professor Enoch Bowen, Providence, 1844, on his return from Egypt: a list of what he brought home in his crates.": "Professor Enoch Bowen, Providence, 1844, bei seiner Rückkehr aus Ägypten: eine Liste dessen, was er in seinen Kisten heimbrachte.",
    "\"The box with the stone. Keep it closed. The stone must not be left in darkness, and it must not be left in light. I have not decided which is worse.\"": "„Die Schachtel mit dem Stein. Geschlossen halten. Der Stein darf nicht im Dunkeln gelassen werden, und er darf nicht im Licht gelassen werden. Ich habe noch nicht entschieden, was schlimmer ist.“",
  },
  "Danforth's Sketches": {
    "Danforth's Sketches": "Danforths Skizzen",
    "Pencil drawings from the Miskatonic Antarctic Expedition's second flight. The later sheets are not of buildings.": "Bleistiftzeichnungen vom zweiten Flug der Antarktis-Expedition der Miskatonic. Die späteren Blätter zeigen keine Gebäude.",
    "The last sketch is of a black, bubbling mass filling a tunnel from wall to wall, lit by the plane's lamp. Written under it, over and over: \"Tekeli-li. Tekeli-li.\"": "Die letzte Skizze zeigt eine schwarze, brodelnde Masse, die einen Tunnel von Wand zu Wand ausfüllt, im Licht der Flugzeuglampe. Darunter, immer wieder geschrieben: „Tekeli-li. Tekeli-li.“",
  },
  "The Case of the Earth Race": {
    "The Case of the Earth Race": "Der Fall der Erdrasse",
    "Metal-bound pages in a script like hooked marks, and, pressed between them, a sheet of University letterhead.": "Metallgebundene Seiten in einer Schrift wie aus Hakenzeichen, und dazwischengepresst ein Bogen mit dem Briefkopf der Universität.",
    "Peaslee's hand: \"It is my own writing. I wrote this, in their script, in 1908 to 1913, in a body that was not mine. I have now seen the shelf it was kept on. I wish I had not.\"": "Peaslees Hand: „Es ist meine eigene Schrift. Ich habe dies geschrieben, in ihrer Schrift, von 1908 bis 1913, in einem Körper, der nicht meiner war. Ich habe jetzt das Regal gesehen, auf dem es aufbewahrt wurde. Ich wünschte, ich hätte es nicht.“",
  },
  "Zamacona's Manuscript": {
    "Zamacona's Manuscript": "Zamaconas Manuskript",
    "A roll of parchment in sixteenth-century Spanish, found in a clay cylinder. Pánfilo de Zamacona y Nuñez's account of K'n-yan.": "Eine Pergamentrolle in Spanisch des sechzehnten Jahrhunderts, in einem Tonzylinder gefunden. Pánfilo de Zamacona y Nuñez' Bericht über K'n-yan.",
    "\"They have given up the gods of the upper world, and even Yig and Tulu they keep only as a habit. But of what lies beneath red-litten Yoth, in black N'kai, they will not speak at all.\"": "„Sie haben die Götter der oberen Welt aufgegeben, und selbst Yig und Tulu halten sie nur noch aus Gewohnheit. Doch von dem, was unter dem rotbeleuchteten Yoth liegt, im schwarzen N'kai, wollen sie überhaupt nicht sprechen.“",
  },
  "The Pnakotic Fragments": {
    "The Pnakotic Fragments": "Die Pnakotischen Fragmente",
    "Loose leaves the elder priests of Ulthar keep behind a grille. They are older than Ulthar.": "Lose Blätter, die die älteren Priester von Ulthar hinter einem Gitter verwahren. Sie sind älter als Ulthar.",
    "\"Seek not Kadath, for the gods of earth are weak, and dwell there under the guard of the Other Gods from outside, whose soul and messenger is the crawling chaos Nyarlathotep.\"": "„Suche nicht Kadath, denn die Götter der Erde sind schwach und wohnen dort unter der Hut der Anderen Götter von draußen, deren Seele und Bote das kriechende Chaos Nyarlathotep ist.“",
  },
  "Johansen's Narrative": {
    "Johansen's Narrative": "Johansens Bericht",
    "The Norwegian mate's account of the Emma and the Alert, the copy his widow sent to Professor Angell.": "Der Bericht des norwegischen Maats über die Emma und die Alert, die Abschrift, die seine Witwe an Professor Angell schickte.",
    "\"The angles were all wrong. A man went in over a corner that was not there, and did not come out. Then the great door opened, and It came out, and I steered for It.\"": "„Die Winkel waren alle falsch. Ein Mann ging über eine Ecke hinein, die nicht da war, und kam nicht wieder heraus. Dann öffnete sich die große Tür, und Es kam heraus, und ich hielt auf Es zu.“",
  },
  "The Outer Ones' Ledger": {
    "The Outer Ones' Ledger": "Das Kontobuch der Äußeren",
    "A list scratched on a thin sheet of some metal that is not any metal, in English, in a hand that tried hard to be human.": "Eine Liste, eingeritzt in ein dünnes Blatt aus einem Metall, das kein Metall ist, auf Englisch, in einer Hand, die sich sehr bemühte, menschlich zu sein.",
    "\"Received for the journey: one brain, H.W.A., in cylinder 12. Condition good. He asks for his son. We have told him the son will come.\"": "„Erhalten für die Reise: ein Gehirn, H.W.A., in Zylinder 12. Zustand gut. Er fragt nach seinem Sohn. Wir haben ihm gesagt, der Sohn werde kommen.“",
  },
  "The Silver Key's Inscription": {
    "The Silver Key's Inscription": "Die Inschrift des Silbernen Schlüssels",
    "Nine lines in no known alphabet, rubbed from the key itself onto a sheet of paper by someone who could not read them either.": "Neun Zeilen in keinem bekannten Alphabet, vom Schlüssel selbst auf ein Blatt Papier abgerieben, von jemandem, der sie ebenso wenig lesen konnte.",
    "Beneath, in pencil: \"Randolph Carter turned it at the Snake Den on his fifty-fourth birthday. He was never found. He was never quite lost either.\"": "Darunter, in Bleistift: „Randolph Carter drehte ihn an seinem vierundfünfzigsten Geburtstag in der Schlangenhöhle. Er wurde nie gefunden. Ganz verloren war er aber auch nie.“",
  },
  "St John's Diary": {
    "St John's Diary": "St Johns Tagebuch",
    "A pocket diary with a green jade amulet pressed into its last pages, so that the shape of it stays in the paper.": "Ein Taschentagebuch mit einem grünen Jadeamulett, in die letzten Seiten gepresst, sodass seine Form im Papier bleibt.",
    "\"We should never have opened that grave in Holland. The baying follows us across the moor now. St John says it is only a dog. There are no dogs within ten miles.\"": "„Wir hätten dieses Grab in Holland nie öffnen dürfen. Das Bellen folgt uns jetzt über das Moor. St John sagt, es sei nur ein Hund. Im Umkreis von zehn Meilen gibt es keine Hunde.“",
  },
  "Asenath's Notes": {
    "Asenath's Notes": "Asenaths Notizen",
    "Loose sheets in a heavy, forceful hand that does not match the woman's signature at the bottom.": "Lose Blätter in einer schweren, kraftvollen Hand, die nicht zu der Frauenunterschrift am Fuß passt.",
    "\"The body is young but it is a woman's, and a woman cannot enter the Order's inner circle. Edward Derby is weak. Edward Derby will do.\"": "„Der Körper ist jung, aber er ist der einer Frau, und eine Frau kann nicht in den inneren Kreis des Ordens eintreten. Edward Derby ist schwach. Edward Derby wird genügen.“",
  },
  "Cultes des Goules": {
    "Cultes des Goules": "Cultes des Goules",
    "The Comte d'Erlette's book on the ghoul cults of France, in a cheap later printing. A railway ticket marks the chapter on New England. The name on the ticket is Pickman.": "Das Buch des Comte d'Erlette über die Ghul-Kulte Frankreichs, in einem billigen späteren Druck. Eine Eisenbahnfahrkarte markiert das Kapitel über Neuengland. Der Name auf der Fahrkarte ist Pickman.",
    "The chapter says the ghouls were men once, and still keep some of the habits of men, including a taste for good paintings.": "Das Kapitel sagt, die Ghule seien einst Menschen gewesen und behielten noch einige menschliche Gewohnheiten bei, darunter einen Sinn für gute Gemälde.",
  },
  "Unaussprechlichen Kulten": {
    "Unaussprechlichen Kulten": "Unaussprechlichen Kulten",
    "Von Junzt's Nameless Cults, the Düsseldorf edition of 1839, with the iron clasps. The page on the Black Goat of the Woods has been folded down.": "Von Junzts Unaussprechliche Kulte, die Düsseldorfer Ausgabe von 1839, mit den eisernen Schließen. Die Seite über die Schwarze Ziege der Wälder ist eingeknickt.",
    "Beside it, in a farmer's big letters: \"Wizard W. read this out loud on the hill every May Eve and Lammas. That is when the noises started.\"": "Daneben, in den großen Buchstaben eines Bauern: „Zauberer W. hat das jeden Mai-Vorabend und an Lammas laut auf dem Hügel gelesen. Da haben die Geräusche angefangen.“",
  },
  "Seven Cryptical Books of Hsan": {
    "Seven Cryptical Books of Hsan": "Die Sieben Kryptischen Bücher von Hsan",
    "A book of dream-lore from Ulthar, the pages brown and soft: \"The gods of earth dwell upon Kadath in the cold waste. They are weak and mild, and they are watched by the Other Gods from outside, whose messenger is the crawling chaos.\"": "Ein Buch der Traumkunde aus Ulthar, die Seiten braun und weich: „Die Götter der Erde wohnen auf Kadath in der kalten Öde. Sie sind schwach und sanft, und sie werden bewacht von den Anderen Göttern von draußen, deren Bote das kriechende Chaos ist.“",
    "Someone has pressed a flower between these pages. It is still fresh.": "Jemand hat eine Blume zwischen diese Seiten gepresst. Sie ist noch frisch.",
  },
  "Arkham Advertiser, October 2nd": {
    "Arkham Advertiser, October 2nd": "Arkham Advertiser, 2. Oktober",
    "SLEEPING SICKNESS AT UNIVERSITY. Professor Wingate Peaslee of the Department of Psychology was found asleep at a table in the Orne Library on Monday morning and has not woken.": "SCHLAFKRANKHEIT AN DER UNIVERSITÄT. Professor Wingate Peaslee von der Fakultät für Psychologie wurde am Montagmorgen schlafend an einem Tisch der Orne-Bibliothek aufgefunden und ist nicht erwacht.",
    "Dr. Hartwell of St. Mary's Hospital calls the professor's condition \"unusual but not alarming\". Four more cases have been reported in Arkham since.": "Dr. Hartwell vom St. Mary's Hospital nennt den Zustand des Professors „ungewöhnlich, aber nicht besorgniserregend“. Seither wurden in Arkham vier weitere Fälle gemeldet.",
  },
  "Frank's Letter Home": {
    "Frank's Letter Home": "Franks Brief nach Hause",
    "Dear Mother, don't worry about the news, they say it isn't catching. Everyone here is on edge though. Old Armitage has had the restricted room locked, and he sleeps in the library himself now, on a cot.": "Liebe Mutter, mach dir keine Sorgen wegen der Nachrichten, es heißt, es sei nicht ansteckend. Alle hier sind trotzdem nervös. Der alte Armitage hat den gesperrten Raum abschließen lassen, und er schläft jetzt selbst in der Bibliothek, auf einem Feldbett.",
    "Last night I walked past at midnight and saw him standing at the window, looking out at the quad as if he was waiting for somebody. Your loving son, Frank.": "Letzte Nacht ging ich um Mitternacht vorbei und sah ihn am Fenster stehen und auf den Innenhof hinausschauen, als warte er auf jemanden. Dein dich liebender Sohn Frank.",
  },
  "Officer Riley's Report": {
    "Officer Riley's Report": "Officer Rileys Bericht",
    "Report of Officer D. Riley, Arkham Police, October 3rd. Called to the Witch House regarding noises. Found the upper floor empty.": "Bericht von Officer D. Riley, Polizei Arkham, 3. Oktober. Wegen Geräuschen zum Hexenhaus gerufen. Das Obergeschoss leer vorgefunden.",
    "In the attic room there is a hole where the ceiling meets the wall. I could not see the end of it with my torch. Small footprints in the dust, like a rat's, but with fingers. I recommend the house be boarded up.": "Im Dachzimmer ist ein Loch, wo die Decke auf die Wand trifft. Mit meiner Taschenlampe konnte ich sein Ende nicht sehen. Kleine Fußspuren im Staub, wie von einer Ratte, aber mit Fingern. Ich empfehle, das Haus zu vernageln.",
  },
  "Ammi Pierce's Letter": {
    "Ammi Pierce's Letter": "Ammi Pierces Brief",
    "They're building the new reservoir over the old Gardner place, and I say good riddance. Don't you drink the water up there when it's done.": "Sie bauen das neue Staubecken über dem alten Gardner-Hof, und ich sage: gut, dass wir's los sind. Trink das Wasser dort oben nicht, wenn es fertig ist.",
    "Something came down in the Gardners' well in '82 and it never went away. It just changed colour. Your loving father, Ammi.": "Etwas ist '82 in den Brunnen der Gardners gefallen, und es ist nie wieder fortgegangen. Es hat nur die Farbe gewechselt. Dein dich liebender Vater, Ammi.",
  },
  "Postcard from Kingsport": {
    "Postcard from Kingsport": "Postkarte aus Kingsport",
    "Don't come up here, Ellie. There's an old man on Water Street who keeps bottles on a shelf and talks to them, and they swing without any wind.": "Komm nicht hier herauf, Ellie. In der Water Street wohnt ein alter Mann, der Flaschen auf einem Regal hat und mit ihnen spricht, und sie schwingen ohne jeden Wind.",
    "Three sailors went to rob him last week. Nobody has seen them since. T.": "Letzte Woche wollten ihn drei Seeleute ausrauben. Seitdem hat sie niemand mehr gesehen. T.",
  },
  "Sheriff's Notebook": {
    "Sheriff's Notebook": "Notizbuch des Sheriffs",
    "Aylesbury Pike, Sept. 9. Seth Bishop's cattle gone, eleven head. No tracks, but a trail flattened through the brush as if somebody had dragged a barn along it.": "Aylesbury Pike, 9. Sept. Seth Bishops Vieh fort, elf Stück. Keine Spuren, aber eine Schneise durchs Gestrüpp gewalzt, als hätte jemand eine Scheune hindurchgeschleift.",
    "Whateley farm boarded up since the boy died. Whippoorwills very loud. Selina Frye says they are waiting to catch a soul.": "Whateley-Hof vernagelt, seit der Junge tot ist. Ziegenmelker sehr laut. Selina Frye sagt, sie warten darauf, eine Seele zu fangen.",
  },
  "Railway Notice": {
    "Railway Notice": "Bekanntmachung der Eisenbahn",
    "NOTICE. Owing to lack of custom, the Arkham to Innsmouth branch line is suspended until further notice.": "BEKANNTMACHUNG. Mangels Kundschaft wird die Zweiglinie Arkham–Innsmouth bis auf Weiteres eingestellt.",
    "Travellers to Innsmouth should use Joe Sargent's bus from Newburyport. The company takes no responsibility for delays on the Innsmouth road.": "Reisende nach Innsmouth mögen Joe Sargents Bus ab Newburyport benutzen. Die Gesellschaft übernimmt keine Verantwortung für Verspätungen auf der Straße nach Innsmouth.",
  },
  "Treasury Memorandum": {
    "Treasury Memorandum": "Memorandum des Finanzministeriums",
    "Confidential. February 1928 raid on Innsmouth: two hundred persons removed to camps. A submarine was sent out to Devil Reef. The crew's report is withheld.": "Vertraulich. Razzia in Innsmouth im Februar 1928: zweihundert Personen in Lager verbracht. Ein U-Boot wurde zum Teufelsriff ausgesandt. Der Bericht der Besatzung wird zurückgehalten.",
    "Several of the removed persons have since died in custody of what the camp doctor calls \"a change in the skin\".": "Mehrere der verbrachten Personen sind seither in Gewahrsam an etwas gestorben, das der Lagerarzt „eine Veränderung der Haut“ nennt.",
  },
  "Akeley's Last Letter": {
    "Akeley's Last Letter": "Akeleys letzter Brief",
    "Townshend, Vermont. Dear Mr. Wilmarth, I have been out on the hills again and there are more tracks than ever, all of them pointing toward my house.": "Townshend, Vermont. Lieber Mr. Wilmarth, ich war wieder draußen in den Hügeln, und es gibt mehr Spuren denn je, alle auf mein Haus zu gerichtet.",
    "They have been leaving my dogs alone, which worries me more than if they had not. If I stop writing, do not come up here. Yours, Henry W. Akeley.": "Meine Hunde haben sie in Ruhe gelassen, und das beunruhigt mich mehr, als wenn sie es nicht getan hätten. Falls ich nicht mehr schreibe, kommen Sie nicht herauf. Ihr Henry W. Akeley.",
  },
  "Ordinance of Ulthar": {
    "Ordinance of Ulthar": "Verordnung von Ulthar",
    "It is the law in Ulthar that no man may kill a cat. It has been the law since the old cottager and his wife were found with their bones picked clean, the morning after the caravan left.": "In Ulthar ist es Gesetz, dass kein Mensch eine Katze töten darf. Es ist Gesetz, seit der alte Häusler und seine Frau gefunden wurden, die Knochen blank genagt, am Morgen, nachdem die Karawane fortgezogen war.",
    "A merchant who laughed at the law last spring left town in a hurry. His mule came back without him.": "Ein Händler, der im letzten Frühjahr über das Gesetz lachte, verließ die Stadt in großer Eile. Sein Maultier kam ohne ihn zurück.",
  },
  "Lake's Notebook": {
    "Lake's Notebook": "Lakes Notizbuch",
    "A field notebook with a split spine, the last page in pencil: \"Specimen 4 is warm to the touch. Dissected the third. Nobody has lit the stove since the dogs began. Gedney says the sixth is no longer on the table.\"": "Ein Feldnotizbuch mit gebrochenem Rücken, die letzte Seite in Bleistift: „Exemplar 4 fühlt sich warm an. Das dritte seziert. Niemand hat den Ofen angeheizt, seit die Hunde anfingen. Gedney sagt, das sechste liegt nicht mehr auf dem Tisch.“",
    "Under it, in a steadier hand, Danforth's: \"We found eight of them afterwards, set upright in the snow, each in a perfect five-pointed mound. Whoever buried them had a great deal of respect for the dead.\"": "Darunter, in ruhigerer Hand, Danforths: „Wir fanden später acht von ihnen, aufrecht in den Schnee gestellt, jedes in einem vollkommen fünfzackigen Hügel. Wer immer sie begrub, hatte großen Respekt vor den Toten.“",
  },
  "A Sledge Driver's Note": {
    "A Sledge Driver's Note": "Notiz eines Schlittenführers",
    "Dogs will not go past the ridge. Not for the whip, not for fish. Pierce says it is the wind. I say the wind never played a tune before.": "Die Hunde gehen nicht über den Grat. Nicht für die Peitsche, nicht für Fisch. Pierce sagt, es sei der Wind. Ich sage, der Wind hat noch nie eine Melodie gespielt.",
    "Someone has added in a thick pencil: \"It has a very wide range, the tune. I counted the notes from a sledge and I could not count them all.\"": "Jemand hat mit dickem Bleistift hinzugefügt: „Sie hat einen sehr weiten Umfang, die Melodie. Ich habe vom Schlitten aus die Töne gezählt und konnte sie nicht alle zählen.“",
  },
  "Freeborn's Survey Book": {
    "Freeborn's Survey Book": "Freeborns Vermessungsbuch",
    "Western Australia, 1935. Block 17: basalt, cyclopean, not cut but ground. The sand has been blown off it more than once; the drift shows two kinds of wind. Mackenzie wants to dig. I would rather not.": "Westaustralien, 1935. Block 17: Basalt, zyklopisch, nicht behauen, sondern geschliffen. Der Sand ist mehr als einmal davon fortgeweht worden; die Verwehung zeigt zweierlei Wind. Mackenzie will graben. Ich lieber nicht.",
    "On the facing page, in another hand: \"Peaslee dreamed of this place for fifteen years before he saw it. At the fork he knew which way the stairs went, and said so, and then asked us to forget he had.\"": "Auf der gegenüberliegenden Seite, in anderer Hand: „Peaslee träumte fünfzehn Jahre lang von diesem Ort, bevor er ihn sah. An der Gabelung wusste er, wohin die Treppe führte, und sagte es, und dann bat er uns, zu vergessen, dass er es gesagt hatte.“",
  },
  "A Receipt in the Archivist's Hand": {
    "A Receipt in the Archivist's Hand": "Eine Quittung in der Hand des Archivars",
    "Received for the Great Race: one mind of the dominant form of the third planet, 1.7 of its years, held for the study of its age. Returned with most of its memory, as agreed. The borrowed body is marked in good condition.": "Erhalten für die Große Rasse: ein Geist der vorherrschenden Form des dritten Planeten, für 1,7 seiner Jahre, verwahrt zum Studium seines Zeitalters. Mit dem größten Teil seiner Erinnerung zurückgegeben, wie vereinbart. Der entliehene Körper ist als in gutem Zustand vermerkt.",
    "A line is added in English, a good deal more slowly written: \"The borrower asks it be noted that the exchange student wept at the end of the term, and did not say for what.\"": "Eine Zeile ist auf Englisch hinzugefügt, viel langsamer geschrieben: „Der Entleiher bittet zu vermerken, dass der Austauschstudent am Ende des Semesters weinte und nicht sagte, worum.“",
  },
  "A Judge's Notice": {
    "A Judge's Notice": "Bekanntmachung eines Richters",
    "NOTICE OF THE THIRD HALL. The sitting is adjourned for want of a god. The Judge records that Tulu is again the fashion and the old Serpent unfashionable, and reminds the citizens that the Serpent is unfashionable at its pleasure.": "BEKANNTMACHUNG DER DRITTEN HALLE. Die Sitzung ist mangels eines Gottes vertagt. Der Richter vermerkt, dass Tulu wieder in Mode ist und die alte Schlange aus der Mode, und erinnert die Bürger daran, dass die Schlange nach ihrem eigenen Belieben aus der Mode ist.",
    "Below, in a sharper script: \"Citizens are asked to leave the lower stair clear. What is kept beneath red Yoth is not our concern, and we would like it to remain so.\"": "Darunter, in schärferer Schrift: „Die Bürger werden gebeten, die untere Treppe frei zu halten. Was unter dem roten Yoth verwahrt wird, geht uns nichts an, und wir möchten, dass es so bleibt.“",
  },
  "Tally of the Red Stairs": {
    "Tally of the Red Stairs": "Zählung der Roten Treppe",
    "Nine steps to red-litten Yoth. The light is warm to the sixth and begins to fail at the seventh. It does not fail further, for what lies below it is not dark, being the absence of any light and so beyond the reach of its dimming.": "Neun Stufen bis zum rotbeleuchteten Yoth. Das Licht ist warm bis zur sechsten und beginnt an der siebten zu schwinden. Weiter schwindet es nicht, denn was darunter liegt, ist nicht dunkel, sondern die Abwesenheit jeden Lichts und damit jenseits der Reichweite seines Schwindens.",
    "A child has scratched a little figure with six arms beside the ninth step, and the words: \"He waves.\"": "Ein Kind hat neben die neunte Stufe eine kleine Gestalt mit sechs Armen geritzt, und die Worte: „Er winkt.“",
  },
};
