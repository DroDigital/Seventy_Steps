/** The quests, in French (data/quests.ts): each one's title, its stages' lines in the journal and its line once done, by quest. */

import type { StoryTable } from '..';

export const FR_QUESTS: StoryTable = {
  borrowed_reins: {
    "The Borrowed Reins": "Les Rênes empruntées",
    "Speak with Wingate Peaslee on the Miskatonic Quad. A chariot from the university stables is waiting to be borrowed.": "Parlez à Wingate Peaslee sur la cour de Miskatonic. Un char des écuries de l'université attend qu'on l'emprunte.",
    "Find the Sleeper’s Sign, southwest across the university grounds. The reins of the chariot wait there; no horror need fall, and nothing is owed.": "Trouvez le Signe du Dormeur, au sud-ouest, de l'autre côté du campus. Les rênes du char vous y attendent ; aucune horreur n'a besoin de tomber, et rien n'est dû.",
    "The borrowed reins answer my call on dry open ground. The chariot is mine. A motor car may also be chosen at an Elder Sign; it is no faster.": "Les rênes empruntées répondent à mon appel sur un terrain sec et dégagé. Le char est à moi. Une automobile peut aussi être choisie à un Signe des Anciens ; elle n'est pas plus rapide.",
  },
  sleepers: {
    "The Sleepers": "Les Dormeurs",
    "Peaslee says Walter Gilman, the second sleeper, is in Arkham, west of the university. Find him.": "Peaslee dit que Walter Gilman, le deuxième dormeur, est à Arkham, à l'ouest de l'université. Trouvez-le.",
    "Found Gilman on the streets of Arkham. The tall man visited him too, the night before he slept.": "J'ai trouvé Gilman dans les rues d'Arkham. L'homme de haute taille lui a rendu visite, à lui aussi, la nuit avant qu'il s'endorme.",
  },
  witch_house: {
    "The Witch House": "La Maison de la Sorcière",
    "Gilman says the police went into the Witch House on the third of October. Officer Riley's report is lying somewhere in Arkham. Read what he found before going in.": "Gilman dit que la police est entrée dans la Maison de la Sorcière le trois octobre. Le rapport de l'agent Riley traîne quelque part dans Arkham. Lisez ce qu'il a trouvé avant d'y entrer.",
    "Riley found a hole in the attic wall and small footprints with fingers. Take it to Gilman: he knows what it means.": "Riley a trouvé un trou dans le mur du grenier et de petites empreintes avec des doigts. Apportez-le à Gilman : il sait ce que cela signifie.",
    "Gilman has shown you how to look at a corner until it gives. Climb the Witch House to the stair landing, where an Elder Sign stands, and rest there before the attic.": "Gilman vous a montré comment regarder un coin jusqu'à ce qu'il cède. Montez dans la Maison de la Sorcière jusqu'au palier, où se dresse un Signe des Anciens, et reposez-vous là avant le grenier.",
    "Her formulae are in a closet off the landing that only a mind that has learned to look can see (it wants 1 insight). Read them: Gilman says they tell what she is doing, and when. If the insight is spent, go on: the garret does not wait for them.": "Ses formules sont dans un cabinet donnant sur le palier, que seul un esprit qui a appris à regarder peut voir (il lui faut 1 point de discernement). Lisez-les : Gilman dit qu'elles révèlent ce qu'elle fait, et quand. Si le discernement est dépensé, continuez : la mansarde ne les attend pas.",
    "Keziah Mason is in the garret above the landing, with the rat thing with the little hands. Gilman cannot think straight while she is there.": "Keziah Mason est dans la mansarde au-dessus du palier, avec la chose-rat aux petites mains. Gilman ne peut pas penser clairement tant qu'elle y est.",
    "Keziah Mason is gone from the Witch House.": "Keziah Mason a quitté la Maison de la Sorcière.",
  },
  descent: {
    "The Stair": "L'Escalier",
    "Find a dreamer called Kuranes: down the stair from the Sleeper's Sign on the university grounds, and on through the Gate of Deeper Slumber.": "Trouvez un rêveur nommé Kuranes : descendez l'escalier depuis le Signe du Dormeur, sur le campus, et continuez par la Porte du Sommeil profond.",
    "Kuranes told me what the key opens.": "Kuranes m'a dit ce qu'ouvre la clé.",
  },
  kadath: {
    "The Gate": "La Porte",
    "Kadath's door is sealed by the great horrors of the waking world. Kuranes says four must fall before it opens; Keziah Mason was one.": "La porte de Kadath est scellée par les grandes horreurs du monde de l'éveil. Kuranes dit que quatre doivent tomber avant qu'elle s'ouvre ; Keziah Mason en était une.",
    "Kadath's door stands open. The Great Ones and the Crawling Chaos hold the hall beyond it, and the Ultimate Gate will not open while a horror holds you. Put them down, and pass through to the Threshold of the Silver Key.": "La porte de Kadath est ouverte. Les Grands et le Chaos rampant tiennent la salle qui se trouve au-delà, et la Porte Ultime ne s'ouvrira pas tant qu'une horreur vous retient. Abattez-les, et passez jusqu'au Seuil de la Clé d'argent.",
    "I have reached the Threshold. What happens now is my choice.": "J'ai atteint le Seuil. Ce qui arrive maintenant est mon choix.",
  },
  zadok: {
    "A Drink for Zadok": "Un verre pour Zadok",
    "Zadok Allen, in Innsmouth Square, will talk for a swallow of Laudanum.": "Zadok Allen, sur la place d'Innsmouth, parlera pour une gorgée de laudanum.",
    "Zadok told me about Devil Reef and the Marshes, and gave me a Silver Vial.": "Zadok m'a parlé du Récif du Diable et des Marsh, et m'a donné une fiole d'argent.",
  },
  akeley: {
    "Akeley's Chair": "Le fauteuil d'Akeley",
    "Something sits in Henry Akeley's chair at the farmhouse up the road in Vermont. Wilmarth does not think it is Akeley.": "Quelque chose est assis dans le fauteuil d'Henry Akeley, à la ferme en haut de la route, dans le Vermont. Wilmarth ne croit pas que ce soit Akeley.",
    "The thing in the chair is finished. Wilmarth gave me Akeley's notes.": "La chose du fauteuil est finie. Wilmarth m'a donné les notes d'Akeley.",
  },
  curwen: {
    "The Curwen Business": "L'Affaire Curwen",
    "Joseph Curwen is back, in the catacombs under Pawtuxet in Providence. Dr. Willett asks me to finish what he started.": "Joseph Curwen est revenu, dans les catacombes sous Pawtuxet, à Providence. Le Dr Willett me demande de finir ce qu'il a commencé.",
    "Curwen is dust again. Willett gave me the formula he used.": "Curwen est redevenu poussière. Willett m'a donné la formule dont il s'est servi.",
  },
  dunwich: {
    "Sentinel Hill": "Sentinel Hill",
    "Something nobody can see walks the hills around Dunwich at night. Curtis Whateley asks me to finish it.": "Quelque chose que personne ne peut voir marche la nuit dans les collines autour de Dunwich. Curtis Whateley me demande d'en finir.",
    "The whippoorwills around Dunwich have gone quiet.": "Les engoulevents autour de Dunwich se sont tus.",
  },
  elder_city: {
    "The City Past the Ridge": "La cité au-delà de la crête",
    "One of the Elder Things' servants still lives in their city past the ridge. Professor Dyer warns me not to let it get between me and the way out.": "L'un des serviteurs des Anciens vit encore dans leur cité, au-delà de la crête. Le professeur Dyer m'avertit de ne pas le laisser se mettre entre moi et la sortie.",
    "The servant in the Elder city is dead. Dyer gave me his drawings of the murals.": "Le serviteur de la cité des Anciens est mort. Dyer m'a donné ses dessins des fresques.",
  },
  archives: {
    "In His Own Hand": "De sa propre main",
    "Nathaniel Peaslee says an account in his own hand lies in the Archives of the Great Race, under the desert. Find the Archive Reading Hall.": "Nathaniel Peaslee dit qu'un récit de sa propre main se trouve dans les Archives de la Grand-Race, sous le désert. Trouvez la salle de lecture des Archives.",
    "The polyps the Great Race walled in below the archives are loose. Nathaniel asks me to put down the swarm that leads them, in the vault below.": "Les polypes que la Grand-Race avait emmurés sous les archives sont libres. Nathaniel me demande d'abattre l'essaim qui les mène, dans la crypte en dessous.",
    "The whistling below the archives has stopped. Nathaniel Peaslee remembers a little more of what he was.": "Les sifflements sous les archives ont cessé. Nathaniel Peaslee se souvient d'un peu plus de ce qu'il était.",
  },
  zamacona: {
    "The Toad of N'kai": "Le Crapaud de N'kai",
    "Zamacona says Tsathoggua sleeps in black N'kai, below Tsath, and while it sleeps nothing in K'n-yan can leave. The way is past the temple stair.": "Zamacona dit que Tsathoggua dort dans le noir N'kai, sous Tsath, et que tant qu'il dort, rien ne peut quitter K'n-yan. Le chemin passe par l'escalier du temple.",
    "Tsathoggua is still. Zamacona gave me his espada; he says he cannot lift it here.": "Tsathoggua ne bouge plus. Zamacona m'a donné son espada ; il dit qu'il ne peut pas la soulever ici.",
  },
  alert: {
    "Where Johansen Stood": "Là où se tenait Johansen",
    "Johansen says the Alert still lies at R'lyeh's edge. When the thing comes out of the great door, take her helm and put her bows into it.": "Johansen dit que l'Alert est toujours au bord de R'lyeh. Quand la chose sortira de la grande porte, prenez la barre et enfoncez-lui la proue dedans.",
    "The Alert struck it, as she did once before, and R'lyeh went down again. Johansen gave me the stones that came up with the island.": "L'Alert l'a frappée, comme une fois déjà, et R'lyeh a de nouveau sombré. Johansen m'a donné les pierres remontées avec l'île.",
  },
  cylinders: {
    "The Cylinders": "Les Cylindres",
    "Akeley says the Outer Ones keep brains in metal cylinders in their Fungoid Cities, his among them. Find the cities, east of the landing.": "Akeley dit que ceux du Dehors gardent des cerveaux dans des cylindres de métal dans leurs Cités fongiques, le sien parmi eux. Trouvez les cités, à l'est de l'aire d'atterrissage.",
    "The Outer Ones feed Rhan-Tegoth in the hall of cylinders. Akeley says none will open while it lives.": "Ceux du Dehors nourrissent Rhan-Tegoth dans la salle des cylindres. Akeley dit qu'aucun ne s'ouvrira tant qu'il vit.",
    "Rhan-Tegoth is dead in the hall of cylinders, and they are opening. Akeley gave me a vial and the Outer Ones' stones.": "Rhan-Tegoth gît mort dans la salle des cylindres, et ils s'ouvrent. Akeley m'a donné une fiole et les pierres de ceux du Dehors.",
  },
  silver_key: {
    "The Gate and the Key": "La Porte et la Clé",
    "'Umr at-Tawil, the Guide, keeps the last gate in the Ultimate Void, across the span north of the First Gate. When his strength fails he may offer to go through the Gate with you: that is an ending. Strike him down instead, and the way goes on to Yog-Sothoth and the Court.": "'Umr at-Tawil, le Guide, garde la dernière porte dans le Vide Ultime, au-delà du pont, au nord de la Première Porte. Quand ses forces faiblissent, il peut proposer de franchir la Porte avec vous : c'est une fin. Abattez-le plutôt, et le chemin continue vers Yog-Sothoth et la Cour.",
    "Randolph Carter says Yog-Sothoth is the gate and the key and the guardian, and while it holds, the tall man's way stays open. It waits in the Gate of Spheres, past 'Umr at-Tawil and four dimensions of the Outer Dark: take the storm gate on the Last Shore.": "Randolph Carter dit que Yog-Sothoth est la porte, la clé et le gardien, et que tant qu'il tient, la voie de l'homme de haute taille reste ouverte. Il attend dans la Porte des Sphères, au-delà de 'Umr at-Tawil et de quatre dimensions des Ténèbres extérieures : prenez la porte de l'orage, sur le Dernier Rivage.",
    "Azathoth waits in its Court at the centre of all, past the Gate of Spheres, blind, and answers every shot and every sprint. Its blows are aimed at no one but fall over the whole court, in rings, beats and boils: read each by where it will fall and when, and strike it at the flank between them until the piping fades.": "Azathoth attend dans sa Cour, au centre de toutes choses, au-delà de la Porte des Sphères, aveugle, et répond à chaque coup de feu et à chaque course. Ses coups ne visent personne mais tombent sur toute la cour, en cercles, en battements et en bouillons : lisez chacun à l'endroit et au moment où il tombera, et frappez-le au flanc entre eux jusqu'à ce que les flûtes s'éteignent.",
    "The piping has faded. The silver key hangs before the Elder Sign in Azathoth's Court: close your hand on it to wake and seal the Gate. The tall man waits aside: attend him, and the knee bends.": "Les flûtes se sont éteintes. La clé d'argent pend devant le Signe des Anciens, dans la Cour d'Azathoth : refermez la main dessus pour vous éveiller et sceller la Porte. L'homme de haute taille attend à l'écart : allez à lui, et le genou plie.",
    "The dream is ended, and the choice was my own.": "Le rêve est fini, et le choix était le mien.",
  },
};
