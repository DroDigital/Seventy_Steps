/** The tomes, notes and letters, in French (data/documents.ts): each one's name and paragraphs, by name; the rest are in documentsMore.ts. */

import type { StoryTable } from '..';

export const FR_DOCUMENTS: StoryTable = {
  Necronomicon: {
    "Necronomicon": "Necronomicon",
    "The Latin of Olaus Wormius, the 1623 printing: the university's own copy. Someone has been reading it with a pencil in hand.": "Le latin d'Olaus Wormius, l'édition de 1623 : l'exemplaire de l'université. Quelqu'un l'a lu un crayon à la main.",
    ...(__DEMO__
      ? { "In the margin beside the passage on the Gate, in Peaslee's small, neat writing: \"Y. is the gate and the key and the guardian. Then who holds the key now? Ask A. about the key.\" The last line is underlined twice.": "Dans la marge, à côté du passage sur la Porte, de la petite écriture soignée de Peaslee : « Y. est la porte, la clé et le gardien. Alors qui détient la clé à présent ? Interroger A. sur la clé. » La dernière ligne est soulignée deux fois." }
      : {
          "In the margin beside the passage on the Gate, in Peaslee's small, neat writing: \"Y. is the gate and the key and the guardian. Then who holds the key now? Ask A. about Carter.\" The last line is underlined twice.": "Dans la marge, à côté du passage sur la Porte, de la petite écriture soignée de Peaslee : « Y. est la porte, la clé et le gardien. Alors qui détient la clé à présent ? Interroger A. sur Carter. » La dernière ligne est soulignée deux fois.",
        }),
  },
  "Keziah's Formulae": {
    "Keziah's Formulae": "Les Formules de Keziah",
    "Loose sheets in a woman's hand, very old, the ink gone brown. Most of it is arithmetic. Some of the figures describe angles that add up to more than a corner should.": "Des feuillets épars d'une main de femme, très anciens, l'encre devenue brune. C'est surtout de l'arithmétique. Certaines figures décrivent des angles dont la somme dépasse ce qu'un coin devrait faire.",
    "Set out plainly, the method wants four things: a sleeper's name, a knife, a candle lit from the black man's flame, and the right angle on Walpurgis Night. The rat carries the name. The angle does the rest. She has set the night in the margin, and it is soon.": "Exposée simplement, la méthode demande quatre choses : le nom d'un dormeur, un couteau, une bougie allumée à la flamme de l'homme noir, et le bon angle la nuit de Walpurgis. Le rat porte le nom. L'angle fait le reste. Elle a noté la nuit dans la marge, et elle est proche.",
    "On the last sheet, in a much newer hand: \"It works. God help me, it works. W.G.\"": "Sur le dernier feuillet, d'une main bien plus récente : « Ça marche. Que Dieu me vienne en aide, ça marche. W.G. »",
  },
  "Curwen's Journal": {
    "Curwen's Journal": "Le Journal de Curwen",
    "Joseph Curwen's hand, dated 1754: \"Rec'd this day from H. the Essential Saltes of one I had long sought. Must be carefull in the words. Never call up any that you can not put downe.\"": "L'écriture de Joseph Curwen, datée de 1754 : « Reçu ce jour de H. les Sels Essentiels d'un que je cherchois depuis longtemps. Doy prendre garde aux mots. N'invoque jamais rien que tu ne puisses renvoyer. »",
    "Below it, in modern pencil: \"He did not listen to himself either. M.B.W.\"": "En dessous, au crayon moderne : « Il ne s'est pas écouté lui-même non plus. M.B.W. »",
  },
  "Akeley's Phonograph Record": {
    "Akeley's Phonograph Record": "Le Cylindre phonographique d'Akeley",
    "A wax cylinder in a cardboard sleeve, labelled \"May Eve 1915, Dark Mountain\". You do not need a machine to hear it. It plays in your head as you hold it.": "Un cylindre de cire dans un étui de carton, étiqueté « Veille de mai 1915, Dark Mountain ». Nul besoin d'appareil pour l'entendre. Il joue dans votre tête quand vous le tenez.",
    "A man's voice reads a kind of service. A buzzing answers him, trying hard to sound like speech. It says: \"To Nyarlathotep, Mighty Messenger, must all things be told.\"": "Une voix d'homme lit une sorte d'office. Un bourdonnement lui répond, s'efforçant de ressembler à une parole. Il dit : « À Nyarlathotep, le Puissant Messager, toutes choses doivent être dites. »",
  },
  "Elder Thing Murals": {
    "Elder Thing Murals": "Les Fresques des Anciens",
    "A photograph of a carved wall, drawn over in pencil to bring out the lines. Star-shaped figures build a city. Then black, shapeless things do the building for them. Then the black things pull the builders apart.": "La photographie d'un mur sculpté, repassée au crayon pour faire ressortir les lignes. Des figures en forme d'étoile bâtissent une cité. Puis des choses noires et informes bâtissent pour elles. Puis les choses noires mettent les bâtisseurs en pièces.",
    "Written underneath: \"Shoggoths. Their own servants. Do not go further in. W.D.\"": "Écrit en dessous : « Des shoggoths. Leurs propres serviteurs. N'allez pas plus loin. W.D. »",
  },
  "Pnakotic Manuscripts": {
    "Pnakotic Manuscripts": "Les Manuscrits pnakotiques",
    "Fragments of something older than writing, copied into English by a careful hand: \"The Great Race sends its minds across time and takes the bodies of others for a while, to study their age. The borrowed ones remember nothing afterwards but dreams of a library.\"": "Des fragments de quelque chose de plus ancien que l'écriture, recopiés en anglais d'une main soigneuse : « La Grand-Race envoie ses esprits à travers le temps et prend pour un temps le corps d'autres êtres, afin d'étudier leur époque. Ceux qu'elle a empruntés ne se souviennent ensuite de rien, sinon de rêves de bibliothèque. »",
    "A note at the foot of the page: \"This is what happened to my father in 1908. I am sure of it now. W.P.\"": "Une note au bas de la page : « C'est ce qui est arrivé à mon père en 1908. J'en suis sûr à présent. W.P. »",
  },
  "R'lyehian Tablet": {
    "R'lyehian Tablet": "La Tablette de R'lyeh",
    "A greenish stone tablet, cold and slightly greasy. The characters are no alphabet you know, but you can read them, which is worse.": "Une tablette de pierre verdâtre, froide et légèrement grasse. Les caractères n'appartiennent à aucun alphabet que vous connaissiez, mais vous pouvez les lire, et c'est pire.",
    "They say the same thing over and over: that in his house at R'lyeh the dead one waits, dreaming. Every sleeper in Arkham is dreaming too. You wonder whose dream this is.": "Ils répètent sans fin la même chose : que dans sa demeure de R'lyeh le mort attend en rêvant. Chaque dormeur d'Arkham rêve, lui aussi. Vous vous demandez de qui est ce rêve.",
  },
  "Michel Mauvais's Notes": {
    "Michel Mauvais's Notes": "Les Notes de Michel Mauvais",
    "Notes in old French with a later owner's translation in the margin. The wizard Michel Mauvais was burned by the Count de C—, and his son swore that no heir of the Count would live past thirty-two.": "Des notes en vieux français, avec la traduction d'un propriétaire ultérieur dans la marge. Le sorcier Michel Mauvais fut brûlé par le comte de C—, et son fils jura qu'aucun héritier du comte ne vivrait au-delà de trente-deux ans.",
    "\"The curse is carried out by the son himself,\" the translator writes, \"who has kept alive six hundred years by an elixir. The heirs never guessed who he was.\"": "« La malédiction est accomplie par le fils lui-même, écrit le traducteur, qui s'est maintenu en vie six cents ans grâce à un élixir. Les héritiers n'ont jamais deviné qui il était. »",
  },
  "Carter's Account": {
    "Carter's Account": "Le Récit de Carter",
    "Pages in Randolph Carter's hand, from his years in Arkham. \"I told Manton there was nothing unnamable. I was wrong.\"": "Des pages de la main de Randolph Carter, de ses années à Arkham. « J'ai dit à Manton qu'il n'existait rien d'innommable. Je me trompais. »",
    "Between the pages, a newer card: \"R. Carter, 2 Parker Place, Arkham.\" On the back, in pencil: \"He asked for the key very politely. I said no. He will come back.\"": "Entre les pages, une carte plus récente : « R. Carter, 2 Parker Place, Arkham. » Au dos, au crayon : « Il m'a demandé la clé très poliment. J'ai dit non. Il reviendra. »",
  },
  "Suydam's Papers": {
    "Suydam's Papers": "Les Papiers de Suydam",
    "Robert Suydam's papers, water-stained. Lists of names and addresses in Red Hook, most of them crossed out. The draft of a wedding announcement.": "Les papiers de Robert Suydam, tachés d'eau. Des listes de noms et d'adresses à Red Hook, la plupart barrées. Le brouillon d'un faire-part de mariage.",
    "At the bottom of the last page: \"The tall gentleman says the gate will be open by the autumn, and I may bring my bride through.\"": "Au bas de la dernière page : « Le grand monsieur dit que la porte sera ouverte à l'automne, et que je pourrai y faire passer ma fiancée. »",
  },
  "Liber Ivonis": {
    "Liber Ivonis": "Liber Ivonis",
    "The Latin Book of Eibon, a fifteenth-century copy chained to its shelf. The chain has been cut.": "Le Livre d'Eibon en latin, une copie du quinzième siècle enchaînée à son rayon. La chaîne a été coupée.",
    ...(__DEMO__
      ? { "A slip marks the chapter on Zhothaqquah, \"who dwelleth in N'kai beneath the mound\". Someone has written in the margin: \"the mound in the hills? or the one at Binger?\"": "Un signet marque le chapitre sur Zhothaqquah, « qui demeure en N'kai sous le tertre ». Quelqu'un a écrit dans la marge : « le tertre dans les collines ? ou celui de Binger ? »" }
      : {
          "A slip marks the chapter on Zhothaqquah, \"who dwelleth in N'kai beneath the mound\". Someone has written in the margin: \"the mound at Dunwich? or the one at Binger?\"": "Un signet marque le chapitre sur Zhothaqquah, « qui demeure en N'kai sous le tertre ». Quelqu'un a écrit dans la marge : « le tertre de Dunwich ? ou celui de Binger ? »",
        }),
  },
  "Gilman's Dream-Diary": {
    "Gilman's Dream-Diary": "Le Journal des rêves de Gilman",
    "A student's notebook, water-stained, found in a rat-hole. Walter Gilman's hand, getting worse page by page.": "Le carnet d'un étudiant, taché d'eau, trouvé dans un trou de rat. L'écriture de Walter Gilman, de pire en pire à chaque page.",
    "\"March 30. The little thing with the man's face came again last night. It nuzzled my hand. I am afraid of the angles of this room. I am more afraid of the day I stop being afraid of them.\"": "« 30 mars. La petite chose au visage d'homme est revenue cette nuit. Elle a frotté son museau contre ma main. J'ai peur des angles de cette chambre. J'ai plus peur encore du jour où je cesserai d'en avoir peur. »",
  },
  "Old Whateley's Ledger": {
    "Old Whateley's Ledger": "Le Livre de comptes du vieux Whateley",
    "A farm account-book: cattle bought, cattle bought, cattle bought. Never a head sold.": "Un livre de comptes de ferme : bétail acheté, bétail acheté, bétail acheté. Jamais une tête vendue.",
    "On the inside cover, in a different ink: \"Enlarge the shed agin. He grows faster than they told. Yog-Sothoth is the gate. The boy must learn the words.\"": "Au revers de la couverture, d'une autre encre : « Agrandir l'hangar encor. Il grandit plus vite qu'on m'a dit. Yog-Sothoth est la porte. Le garçon doit apprendre les mots. »",
  },
  "Obed Marsh's Log": {
    "Obed Marsh's Log": "Le Livre de bord d'Obed Marsh",
    "The captain's log of the Sumatra Queen, 1838 to 1846, swollen with seawater.": "Le livre de bord du capitaine de la Sumatra Queen, de 1838 à 1846, gonflé d'eau de mer.",
    "\"Walakea says they will give fish and gold for young folk. I told him Innsmouth has plenty of both kinds of young folk, and the ones that go down to them will not die, only change. Signed it at the reef tonight.\"": "« Walakea dit qu'ils donneront du poisson et de l'or contre des jeunes gens. Je lui ai dit qu'Innsmouth a des jeunes gens des deux sortes en quantité, et que ceux qui descendent vers eux ne mourront pas, ils changeront seulement. Signé au récif cette nuit. »",
  },
  "Bowen's Journal": {
    "Bowen's Journal": "Le Journal de Bowen",
    "Professor Enoch Bowen, Providence, 1844, on his return from Egypt: a list of what he brought home in his crates.": "Le professeur Enoch Bowen, Providence, 1844, à son retour d'Égypte : la liste de ce qu'il a rapporté dans ses caisses.",
    "\"The box with the stone. Keep it closed. The stone must not be left in darkness, and it must not be left in light. I have not decided which is worse.\"": "« La boîte avec la pierre. La garder fermée. La pierre ne doit pas être laissée dans l'obscurité, et elle ne doit pas être laissée à la lumière. Je n'ai pas décidé ce qui est pire. »",
  },
  "Danforth's Sketches": {
    "Danforth's Sketches": "Les Croquis de Danforth",
    "Pencil drawings from the Miskatonic Antarctic Expedition's second flight. The later sheets are not of buildings.": "Des dessins au crayon du second vol de l'expédition antarctique de Miskatonic. Les dernières feuilles ne représentent pas des bâtiments.",
    "The last sketch is of a black, bubbling mass filling a tunnel from wall to wall, lit by the plane's lamp. Written under it, over and over: \"Tekeli-li. Tekeli-li.\"": "Le dernier croquis montre une masse noire et bouillonnante qui emplit un tunnel d'un mur à l'autre, éclairée par le phare de l'avion. Écrit dessous, encore et encore : « Tekeli-li. Tekeli-li. »",
  },
  "The Case of the Earth Race": {
    "The Case of the Earth Race": "Le Cas de la race terrestre",
    "Metal-bound pages in a script like hooked marks, and, pressed between them, a sheet of University letterhead.": "Des pages reliées de métal, dans une écriture faite de signes en crochet, et, pressée entre elles, une feuille à en-tête de l'université.",
    "Peaslee's hand: \"It is my own writing. I wrote this, in their script, in 1908 to 1913, in a body that was not mine. I have now seen the shelf it was kept on. I wish I had not.\"": "L'écriture de Peaslee : « C'est ma propre écriture. J'ai écrit ceci, dans leur écriture, de 1908 à 1913, dans un corps qui n'était pas le mien. J'ai vu maintenant le rayon où on le gardait. J'aurais préféré ne pas le voir. »",
  },
  "Zamacona's Manuscript": {
    "Zamacona's Manuscript": "Le Manuscrit de Zamacona",
    "A roll of parchment in sixteenth-century Spanish, found in a clay cylinder. Pánfilo de Zamacona y Nuñez's account of K'n-yan.": "Un rouleau de parchemin en espagnol du seizième siècle, trouvé dans un cylindre d'argile. Le récit de K'n-yan par Pánfilo de Zamacona y Nuñez.",
    "\"They have given up the gods of the upper world, and even Yig and Tulu they keep only as a habit. But of what lies beneath red-litten Yoth, in black N'kai, they will not speak at all.\"": "« Ils ont renoncé aux dieux du monde d'en haut, et même Yig et Tulu, ils ne les gardent que par habitude. Mais de ce qui gît sous Yoth aux lueurs rouges, dans le noir N'kai, ils ne veulent rien dire du tout. »",
  },
  "The Pnakotic Fragments": {
    "The Pnakotic Fragments": "Les Fragments pnakotiques",
    "Loose leaves the elder priests of Ulthar keep behind a grille. They are older than Ulthar.": "Des feuillets épars que les anciens prêtres d'Ulthar gardent derrière une grille. Ils sont plus anciens qu'Ulthar.",
    "\"Seek not Kadath, for the gods of earth are weak, and dwell there under the guard of the Other Gods from outside, whose soul and messenger is the crawling chaos Nyarlathotep.\"": "« Ne cherche pas Kadath, car les dieux de la terre sont faibles et y demeurent sous la garde des Autres Dieux venus du dehors, dont l'âme et le messager est le chaos rampant Nyarlathotep. »",
  },
  "Johansen's Narrative": {
    "Johansen's Narrative": "Le Récit de Johansen",
    "The Norwegian mate's account of the Emma and the Alert, the copy his widow sent to Professor Angell.": "Le récit du second norvégien sur l'Emma et l'Alert, la copie que sa veuve envoya au professeur Angell.",
    "\"The angles were all wrong. A man went in over a corner that was not there, and did not come out. Then the great door opened, and It came out, and I steered for It.\"": "« Les angles étaient tous faux. Un homme est entré par un coin qui n'était pas là, et n'est pas ressorti. Puis la grande porte s'est ouverte, et la Chose est sortie, et j'ai mis le cap sur Elle. »",
  },
  "The Outer Ones' Ledger": {
    "The Outer Ones' Ledger": "Le Registre de ceux du Dehors",
    "A list scratched on a thin sheet of some metal that is not any metal, in English, in a hand that tried hard to be human.": "Une liste gravée sur une mince feuille d'un métal qui n'est aucun métal, en anglais, d'une main qui s'efforçait d'être humaine.",
    "\"Received for the journey: one brain, H.W.A., in cylinder 12. Condition good. He asks for his son. We have told him the son will come.\"": "« Reçu pour le voyage : un cerveau, H.W.A., dans le cylindre 12. Bon état. Il demande son fils. Nous lui avons dit que le fils viendrait. »",
  },
  "The Silver Key's Inscription": {
    "The Silver Key's Inscription": "L'Inscription de la Clé d'argent",
    "Nine lines in no known alphabet, rubbed from the key itself onto a sheet of paper by someone who could not read them either.": "Neuf lignes dans aucun alphabet connu, relevées par frottis de la clé elle-même sur une feuille de papier, par quelqu'un qui ne savait pas les lire non plus.",
    "Beneath, in pencil: \"Randolph Carter turned it at the Snake Den on his fifty-fourth birthday. He was never found. He was never quite lost either.\"": "En dessous, au crayon : « Randolph Carter l'a tournée dans l'Antre du Serpent le jour de ses cinquante-quatre ans. On ne l'a jamais retrouvé. Il n'a jamais été tout à fait perdu non plus. »",
  },
  "St John's Diary": {
    "St John's Diary": "Le Journal de St John",
    "A pocket diary with a green jade amulet pressed into its last pages, so that the shape of it stays in the paper.": "Un agenda de poche avec une amulette de jade vert pressée dans ses dernières pages, si bien que sa forme reste imprimée dans le papier.",
    "\"We should never have opened that grave in Holland. The baying follows us across the moor now. St John says it is only a dog. There are no dogs within ten miles.\"": "« Nous n'aurions jamais dû ouvrir cette tombe en Hollande. Les aboiements nous suivent maintenant à travers la lande. St John dit que ce n'est qu'un chien. Il n'y a pas de chiens à dix milles à la ronde. »",
  },
  "Asenath's Notes": {
    "Asenath's Notes": "Les Notes d'Asenath",
    "Loose sheets in a heavy, forceful hand that does not match the woman's signature at the bottom.": "Des feuillets épars d'une écriture lourde et énergique, qui ne correspond pas à la signature de femme au bas de la page.",
    "\"The body is young but it is a woman's, and a woman cannot enter the Order's inner circle. Edward Derby is weak. Edward Derby will do.\"": "« Le corps est jeune, mais c'est celui d'une femme, et une femme ne peut entrer dans le cercle intérieur de l'Ordre. Edward Derby est faible. Edward Derby fera l'affaire. »",
  },
  "Cultes des Goules": {
    "Cultes des Goules": "Cultes des Goules",
    "The Comte d'Erlette's book on the ghoul cults of France, in a cheap later printing. A railway ticket marks the chapter on New England. The name on the ticket is Pickman.": "Le livre du comte d'Erlette sur les cultes goules de France, dans une réimpression bon marché. Un billet de train marque le chapitre sur la Nouvelle-Angleterre. Le nom sur le billet est Pickman.",
    "The chapter says the ghouls were men once, and still keep some of the habits of men, including a taste for good paintings.": "Le chapitre dit que les goules furent autrefois des hommes, et qu'elles gardent encore certaines habitudes humaines, dont le goût de la bonne peinture.",
  },
  "Unaussprechlichen Kulten": {
    "Unaussprechlichen Kulten": "Unaussprechlichen Kulten",
    "Von Junzt's Nameless Cults, the Düsseldorf edition of 1839, with the iron clasps. The page on the Black Goat of the Woods has been folded down.": "Les Cultes innommables de von Junzt, l'édition de Düsseldorf de 1839, avec les fermoirs de fer. La page sur la Chèvre noire des bois a été cornée.",
    "Beside it, in a farmer's big letters: \"Wizard W. read this out loud on the hill every May Eve and Lammas. That is when the noises started.\"": "À côté, en grandes lettres de fermier : « Le sorcier W. lisait ça à voix haute sur la colline chaque veille de mai et à Lammas. C'est là que les bruits ont commencé. »",
  },
  "Seven Cryptical Books of Hsan": {
    "Seven Cryptical Books of Hsan": "Les Sept Livres cryptiques de Hsan",
    "A book of dream-lore from Ulthar, the pages brown and soft: \"The gods of earth dwell upon Kadath in the cold waste. They are weak and mild, and they are watched by the Other Gods from outside, whose messenger is the crawling chaos.\"": "Un livre de science des rêves venu d'Ulthar, aux pages brunes et douces : « Les dieux de la terre demeurent sur Kadath, dans le désert froid. Ils sont faibles et doux, et ils sont surveillés par les Autres Dieux venus du dehors, dont le messager est le chaos rampant. »",
    "Someone has pressed a flower between these pages. It is still fresh.": "Quelqu'un a pressé une fleur entre ces pages. Elle est encore fraîche.",
  },
  "Arkham Advertiser, October 2nd": {
    "Arkham Advertiser, October 2nd": "Arkham Advertiser, 2 octobre",
    "SLEEPING SICKNESS AT UNIVERSITY. Professor Wingate Peaslee of the Department of Psychology was found asleep at a table in the Orne Library on Monday morning and has not woken.": "MALADIE DU SOMMEIL À L'UNIVERSITÉ. Le professeur Wingate Peaslee, du département de psychologie, a été retrouvé endormi à une table de la bibliothèque Orne lundi matin et ne s'est pas réveillé.",
    "Dr. Hartwell of St. Mary's Hospital calls the professor's condition \"unusual but not alarming\". Four more cases have been reported in Arkham since.": "Le Dr Hartwell, de l'hôpital St. Mary, qualifie l'état du professeur d'« inhabituel mais pas alarmant ». Quatre autres cas ont été signalés à Arkham depuis.",
  },
  "Frank's Letter Home": {
    "Frank's Letter Home": "La Lettre de Frank à sa mère",
    "Dear Mother, don't worry about the news, they say it isn't catching. Everyone here is on edge though. Old Armitage has had the restricted room locked, and he sleeps in the library himself now, on a cot.": "Chère maman, ne t'inquiète pas des nouvelles, on dit que ce n'est pas contagieux. Tout le monde ici est quand même sur les nerfs. Le vieil Armitage a fait fermer à clé la salle réservée, et il dort lui-même à la bibliothèque maintenant, sur un lit de camp.",
    "Last night I walked past at midnight and saw him standing at the window, looking out at the quad as if he was waiting for somebody. Your loving son, Frank.": "Hier soir je suis passé devant à minuit et je l'ai vu debout à la fenêtre, regardant la cour comme s'il attendait quelqu'un. Ton fils qui t'aime, Frank.",
  },
  "Officer Riley's Report": {
    "Officer Riley's Report": "Le Rapport de l'agent Riley",
    "Report of Officer D. Riley, Arkham Police, October 3rd. Called to the Witch House regarding noises. Found the upper floor empty.": "Rapport de l'agent D. Riley, police d'Arkham, 3 octobre. Appelé à la Maison de la Sorcière pour des bruits. Étage supérieur trouvé vide.",
    "In the attic room there is a hole where the ceiling meets the wall. I could not see the end of it with my torch. Small footprints in the dust, like a rat's, but with fingers. I recommend the house be boarded up.": "Dans la chambre du grenier, il y a un trou là où le plafond rejoint le mur. Je n'ai pas pu en voir le fond avec ma lampe. De petites empreintes dans la poussière, comme celles d'un rat, mais avec des doigts. Je recommande de condamner la maison.",
  },
  "Ammi Pierce's Letter": {
    "Ammi Pierce's Letter": "La Lettre d'Ammi Pierce",
    "They're building the new reservoir over the old Gardner place, and I say good riddance. Don't you drink the water up there when it's done.": "On construit le nouveau réservoir sur l'ancienne ferme des Gardner, et je dis bon débarras. Ne bois pas l'eau de là-haut quand ce sera fini.",
    "Something came down in the Gardners' well in '82 and it never went away. It just changed colour. Your loving father, Ammi.": "Quelque chose est tombé dans le puits des Gardner en 82, et ce n'est jamais reparti. Ça a seulement changé de couleur. Ton père qui t'aime, Ammi.",
  },
  "Postcard from Kingsport": {
    "Postcard from Kingsport": "Carte postale de Kingsport",
    "Don't come up here, Ellie. There's an old man on Water Street who keeps bottles on a shelf and talks to them, and they swing without any wind.": "Ne monte pas ici, Ellie. Il y a un vieil homme dans Water Street qui garde des bouteilles sur une étagère et leur parle, et elles se balancent sans le moindre vent.",
    "Three sailors went to rob him last week. Nobody has seen them since. T.": "Trois marins ont voulu le voler la semaine dernière. Personne ne les a revus depuis. T.",
  },
  "Sheriff's Notebook": {
    "Sheriff's Notebook": "Le Carnet du shérif",
    "Aylesbury Pike, Sept. 9. Seth Bishop's cattle gone, eleven head. No tracks, but a trail flattened through the brush as if somebody had dragged a barn along it.": "Aylesbury Pike, 9 sept. Le bétail de Seth Bishop disparu, onze têtes. Pas de traces, mais un passage aplati à travers les broussailles, comme si on y avait traîné une grange.",
    "Whateley farm boarded up since the boy died. Whippoorwills very loud. Selina Frye says they are waiting to catch a soul.": "Ferme Whateley condamnée depuis la mort du garçon. Engoulevents très bruyants. Selina Frye dit qu'ils attendent d'attraper une âme.",
  },
  "Railway Notice": {
    "Railway Notice": "Avis de la compagnie de chemin de fer",
    "NOTICE. Owing to lack of custom, the Arkham to Innsmouth branch line is suspended until further notice.": "AVIS. Faute de clientèle, la ligne secondaire Arkham–Innsmouth est suspendue jusqu'à nouvel ordre.",
    "Travellers to Innsmouth should use Joe Sargent's bus from Newburyport. The company takes no responsibility for delays on the Innsmouth road.": "Les voyageurs pour Innsmouth sont priés de prendre l'autocar de Joe Sargent depuis Newburyport. La compagnie décline toute responsabilité pour les retards sur la route d'Innsmouth.",
  },
  "Treasury Memorandum": {
    "Treasury Memorandum": "Mémorandum du Trésor",
    "Confidential. February 1928 raid on Innsmouth: two hundred persons removed to camps. A submarine was sent out to Devil Reef. The crew's report is withheld.": "Confidentiel. Descente à Innsmouth en février 1928 : deux cents personnes transférées dans des camps. Un sous-marin a été envoyé au Récif du Diable. Le rapport de l'équipage n'est pas communiqué.",
    "Several of the removed persons have since died in custody of what the camp doctor calls \"a change in the skin\".": "Plusieurs des personnes transférées sont mortes depuis en détention de ce que le médecin du camp appelle « une modification de la peau ».",
  },
  "Akeley's Last Letter": {
    "Akeley's Last Letter": "La Dernière Lettre d'Akeley",
    "Townshend, Vermont. Dear Mr. Wilmarth, I have been out on the hills again and there are more tracks than ever, all of them pointing toward my house.": "Townshend, Vermont. Cher monsieur Wilmarth, je suis retourné dans les collines et il y a plus de traces que jamais, toutes tournées vers ma maison.",
    "They have been leaving my dogs alone, which worries me more than if they had not. If I stop writing, do not come up here. Yours, Henry W. Akeley.": "Ils laissent mes chiens tranquilles, ce qui m'inquiète davantage que s'ils ne le faisaient pas. Si je cesse d'écrire, ne montez pas ici. Votre dévoué, Henry W. Akeley.",
  },
  "Ordinance of Ulthar": {
    "Ordinance of Ulthar": "Ordonnance d'Ulthar",
    "It is the law in Ulthar that no man may kill a cat. It has been the law since the old cottager and his wife were found with their bones picked clean, the morning after the caravan left.": "La loi d'Ulthar veut que nul homme ne tue un chat. C'est la loi depuis qu'on a retrouvé le vieux paysan et sa femme, les os nettoyés, le matin après le départ de la caravane.",
    "A merchant who laughed at the law last spring left town in a hurry. His mule came back without him.": "Un marchand qui s'était moqué de la loi au printemps dernier a quitté la ville en hâte. Sa mule est revenue sans lui.",
  },
  "Lake's Notebook": {
    "Lake's Notebook": "Le Carnet de Lake",
    "A field notebook with a split spine, the last page in pencil: \"Specimen 4 is warm to the touch. Dissected the third. Nobody has lit the stove since the dogs began. Gedney says the sixth is no longer on the table.\"": "Un carnet de terrain au dos fendu, la dernière page au crayon : « Le spécimen 4 est chaud au toucher. Disséqué le troisième. Personne n'a allumé le poêle depuis que les chiens ont commencé. Gedney dit que le sixième n'est plus sur la table. »",
    "Under it, in a steadier hand, Danforth's: \"We found eight of them afterwards, set upright in the snow, each in a perfect five-pointed mound. Whoever buried them had a great deal of respect for the dead.\"": "En dessous, d'une main plus ferme, celle de Danforth : « Nous en avons retrouvé huit ensuite, dressés debout dans la neige, chacun dans un tertre parfait à cinq branches. Celui qui les a enterrés avait un grand respect pour les morts. »",
  },
  "A Sledge Driver's Note": {
    "A Sledge Driver's Note": "Note d'un conducteur de traîneau",
    "Dogs will not go past the ridge. Not for the whip, not for fish. Pierce says it is the wind. I say the wind never played a tune before.": "Les chiens refusent de passer la crête. Ni pour le fouet, ni pour le poisson. Pierce dit que c'est le vent. Moi je dis que le vent n'a jamais joué d'air avant.",
    "Someone has added in a thick pencil: \"It has a very wide range, the tune. I counted the notes from a sledge and I could not count them all.\"": "Quelqu'un a ajouté d'un gros crayon : « Il a une très grande étendue, cet air. J'ai compté les notes depuis un traîneau et je n'ai pas pu toutes les compter. »",
  },
  "Freeborn's Survey Book": {
    "Freeborn's Survey Book": "Le Carnet d'arpentage de Freeborn",
    "Western Australia, 1935. Block 17: basalt, cyclopean, not cut but ground. The sand has been blown off it more than once; the drift shows two kinds of wind. Mackenzie wants to dig. I would rather not.": "Australie-Occidentale, 1935. Bloc 17 : basalte, cyclopéen, non taillé mais poli. Le sable en a été balayé plus d'une fois ; les dépôts montrent deux sortes de vent. Mackenzie veut creuser. Je préférerais pas.",
    "On the facing page, in another hand: \"Peaslee dreamed of this place for fifteen years before he saw it. At the fork he knew which way the stairs went, and said so, and then asked us to forget he had.\"": "Sur la page en regard, d'une autre main : « Peaslee a rêvé de cet endroit pendant quinze ans avant de le voir. À l'embranchement, il savait de quel côté allaient les escaliers, et il l'a dit, puis il nous a demandé d'oublier qu'il l'avait dit. »",
  },
  "A Receipt in the Archivist's Hand": {
    "A Receipt in the Archivist's Hand": "Un reçu de la main de l'Archiviste",
    "Received for the Great Race: one mind of the dominant form of the third planet, 1.7 of its years, held for the study of its age. Returned with most of its memory, as agreed. The borrowed body is marked in good condition.": "Reçu pour la Grand-Race : un esprit de la forme dominante de la troisième planète, pour 1,7 de ses années, gardé pour l'étude de son époque. Rendu avec la plus grande partie de sa mémoire, comme convenu. Le corps emprunté est noté en bon état.",
    "A line is added in English, a good deal more slowly written: \"The borrower asks it be noted that the exchange student wept at the end of the term, and did not say for what.\"": "Une ligne est ajoutée en anglais, écrite bien plus lentement : « L'emprunteur demande qu'il soit noté que l'étudiant d'échange a pleuré à la fin du semestre, et n'a pas dit pourquoi. »",
  },
  "A Judge's Notice": {
    "A Judge's Notice": "Avis d'un juge",
    "NOTICE OF THE THIRD HALL. The sitting is adjourned for want of a god. The Judge records that Tulu is again the fashion and the old Serpent unfashionable, and reminds the citizens that the Serpent is unfashionable at its pleasure.": "AVIS DE LA TROISIÈME SALLE. La séance est ajournée faute de dieu. Le juge consigne que Tulu est de nouveau à la mode et le vieux Serpent passé de mode, et rappelle aux citoyens que le Serpent est passé de mode selon son bon plaisir.",
    "Below, in a sharper script: \"Citizens are asked to leave the lower stair clear. What is kept beneath red Yoth is not our concern, and we would like it to remain so.\"": "En dessous, d'une écriture plus acérée : « Les citoyens sont priés de laisser libre l'escalier inférieur. Ce qui est gardé sous Yoth la rouge ne nous concerne pas, et nous aimerions qu'il en reste ainsi. »",
  },
  "Tally of the Red Stairs": {
    "Tally of the Red Stairs": "Le Compte de l'Escalier rouge",
    "Nine steps to red-litten Yoth. The light is warm to the sixth and begins to fail at the seventh. It does not fail further, for what lies below it is not dark, being the absence of any light and so beyond the reach of its dimming.": "Neuf marches jusqu'à Yoth aux lueurs rouges. La lumière est chaude jusqu'à la sixième et commence à faiblir à la septième. Elle ne faiblit pas davantage, car ce qui se trouve en dessous n'est pas obscur, étant l'absence de toute lumière, et donc hors de portée de son déclin.",
    "A child has scratched a little figure with six arms beside the ninth step, and the words: \"He waves.\"": "Un enfant a gravé une petite figure à six bras à côté de la neuvième marche, et ces mots : « Il fait signe. »",
  },
};
