/** The creatures in German, deep_one to shoggoth: their names, sources, field notes, epithets and epitaphs. */

import type { StoryTable } from '..';

export const DE_CREATURES: StoryTable = {
  deep_one: {
    "Deep One": "Tiefes Wesen",
    "The Shadow over Innsmouth": "Schatten über Innsmouth",
    "They come up from Devil Reef in packs and keep to the dark side of every street. The old men of Innsmouth say they will not cross a fire; fire is no more than a nuisance to them.": "Sie kommen in Rudeln vom Teufelsriff herauf und halten sich auf der dunklen Seite jeder Straße. Die alten Männer von Innsmouth sagen, sie würden kein Feuer überqueren; Feuer ist ihnen nicht mehr als ein Ärgernis.",
  },
  innsmouth_hybrid: {
    "Innsmouth Hybrid": "Innsmouth-Mischling",
    "The Shadow over Innsmouth": "Schatten über Innsmouth",
    "A man to the waist and something else about the eyes: the Innsmouth look, the wide unblinking stare, the skin gone rough. Quicker than they seem, and they know the lanes better than you do.": "Bis zur Hüfte ein Mensch und um die Augen etwas anderes: das Innsmouth-Aussehen, der weite, starre Blick ohne Lidschlag, die rau gewordene Haut. Schneller, als sie scheinen, und sie kennen die Gassen besser als ihr.",
  },
  dagon_priest: {
    "Esoteric Order of Dagon Priest": "Priester des Esoterischen Ordens des Dagon",
    "The Shadow over Innsmouth": "Schatten über Innsmouth",
    "The Order's priests wear the tiara from the church on New Church Green and chant from behind a screen of others. Kill the singer and the song goes on.": "Die Priester des Ordens tragen die Tiara aus der Kirche am New Church Green und singen hinter einer Wand aus anderen. Tötet den Sänger, und das Lied geht weiter.",
  },
  cthulhu_cultist: {
    "A hooded man with a stone in his pocket and a chant he cannot pronounce. Brave in a crowd; the crowd is not usually far.": "Ein Mann mit Kapuze, einem Stein in der Tasche und einem Gesang, den er nicht aussprechen kann. Tapfer in der Menge; die Menge ist meist nicht weit.",
    ...(__DEMO__
      ? { "Cultist": "Kultist", "A Tale of the Deep": "Eine Geschichte aus der Tiefe" }
      : {
          "Cthulhu Cultist": "Cthulhu-Kultist",
          "The Call of Cthulhu": "Cthulhus Ruf",
        }),
  },
  ghoul: {
    "Ghoul": "Ghul",
    ...(__DEMO__
      ? { "An Arkham Tale": "Eine Geschichte aus Arkham", "Their own kind: rubbery, doglike, crouching, fond of graveyards and good paintings. They are not mindless. They simply do not share your opinion of the dead.": "Eine Art für sich: gummiartig, hundeähnlich, geduckt, Liebhaber von Friedhöfen und guten Gemälden. Sie sind nicht geistlos. Sie teilen nur eure Meinung über die Toten nicht." }
      : {
          "Pickman's Model": "Pickmans Modell",
          "Pickman's friends: rubbery, doglike, crouching, fond of graveyards and good paintings. They are not mindless. They simply do not share your opinion of the dead.": "Pickmans Freunde: gummiartig, hundeähnlich, geduckt, Liebhaber von Friedhöfen und guten Gemälden. Sie sind nicht geistlos. Sie teilen nur eure Meinung über die Toten nicht.",
        }),
  },
  ghast: {
    "Ghast": "Ghast",
    "The Dream-Quest of Unknown Kadath": "Die Traumsuche nach dem unbekannten Kadath",
    "A ghast hunts by the dark and dies by the sun, which is why the Dreamlands keep their lamps lit. It leaps on its hooves, and it barks when it laughs.": "Ein Ghast jagt im Dunkeln und stirbt an der Sonne, weshalb die Traumlande ihre Lampen brennen lassen. Er springt auf seinen Hufen, und er bellt, wenn er lacht.",
  },
  zoog: {
    "Zoog": "Zoog",
    "The Dream-Quest of Unknown Kadath": "Die Traumsuche nach dem unbekannten Kadath",
    "Small, brown and everywhere in the Enchanted Wood. Gentle if their mushrooms are left alone; quick, and many, if they are not.": "Klein, braun und überall im Verzauberten Wald. Sanft, wenn man ihre Pilze in Ruhe lässt; schnell und zahlreich, wenn nicht.",
  },
  night_gaunt: {
    "Night-gaunt": "Dürrer Nachtmahr",
    "The Dream-Quest of Unknown Kadath": "Die Traumsuche nach dem unbekannten Kadath",
    "Faceless, horned, silent, with a barbed tail. They carry sleepers off through the dark, tickle them, and set them down in strange places. They do not speak. They never have.": "Gesichtslos, gehörnt, stumm, mit einem Widerhakenschwanz. Sie tragen Schläfer durch das Dunkel davon, kitzeln sie und setzen sie an seltsamen Orten ab. Sie sprechen nicht. Sie haben es nie getan.",
  },
  moon_beast: {
    "Moon-beast": "Mondbestie",
    "The Dream-Quest of Unknown Kadath": "Die Traumsuche nach dem unbekannten Kadath",
    "Pale, slug-bodied, its blunt feelers never still: it sails its galley out of the Moon and trades slaves for rubies at Dylath-Leen. Stronger than it looks.": "Bleich, mit dem Leib einer Nacktschnecke, die stumpfen Fühler nie still: Sie segelt ihre Galeere vom Mond herab und tauscht in Dylath-Leen Sklaven gegen Rubine. Stärker, als sie aussieht.",
  },
  man_of_leng: {
    "Man of Leng": "Mann aus Leng",
    "The Dream-Quest of Unknown Kadath": "Die Traumsuche nach dem unbekannten Kadath",
    "The Men of Leng wear a turban and keep their mouths covered, and sell what they cannot name to the things in the monastery. They pass for human, which is the worst of it.": "Die Männer aus Leng tragen einen Turban und halten den Mund bedeckt, und sie verkaufen, was sie nicht benennen können, an die Dinge im Kloster. Sie gehen als Menschen durch, und das ist das Schlimmste daran.",
  },
  cat_from_saturn: {
    "Cat from Saturn": "Katze vom Saturn",
    "The Dream-Quest of Unknown Kadath": "Die Traumsuche nach dem unbekannten Kadath",
    "Larger than any cat of Earth and unfriendly to a stranger who has never been kind to one. They hunt in rings, and the ring closes from behind.": "Größer als jede Katze der Erde und unfreundlich zu einem Fremden, der nie gut zu einer war. Sie jagen in Ringen, und der Ring schließt sich von hinten.",
  },
  wamp: {
    "Wamp": "Wamp",
    "The Dream-Quest of Unknown Kadath": "Die Traumsuche nach dem unbekannten Kadath",
    "No one who describes a wamp agrees on its shape. All agree that it hunts the lanes beyond the Enchanted Wood and that it is quick.": "Niemand, der einen Wamp beschreibt, ist sich über seine Gestalt einig. Alle sind sich einig, dass er die Pfade jenseits des Verzauberten Waldes bejagt und dass er schnell ist.",
  },
  gnorri: {
    "Gnorri": "Gnorri",
    "The Dream-Quest of Unknown Kadath": "Die Traumsuche nach dem unbekannten Kadath",
    "The Gnorri build labyrinths under the sea and dislike the sun, and ask nothing of anyone. The ones that wander ashore want something.": "Die Gnorri bauen Labyrinthe unter dem Meer, mögen die Sonne nicht und verlangen von niemandem etwas. Die, die an Land streunen, wollen etwas.",
  },
  serpent_man: {
    "Serpent Man of Valusia": "Schlangenmensch aus Valusien",
    "The Haunter of the Dark": "Der Unhold im Dunkeln",
    "The serpent people ruled the Earth before there were men. The ones that remain wear human faces badly, and rule from behind the eyes of the weak.": "Das Schlangenvolk beherrschte die Erde, bevor es Menschen gab. Die Übriggebliebenen tragen menschliche Gesichter schlecht und herrschen hinter den Augen der Schwachen.",
  },
  kn_yan_dweller: {
    "K'n-yan Dweller": "Bewohner von K'n-yan",
    "The Mound": "Der Hügel",
    "The people of blue-litten K'n-yan have no use for the surface and little for each other. They are scholars of sensation, and pain is one of the arts.": "Das Volk des blaubeleuchteten K'n-yan hat keine Verwendung für die Oberfläche und wenig füreinander. Sie sind Gelehrte der Empfindung, und Schmerz ist eine ihrer Künste.",
  },
  ym_bhi: {
    "Y'm-bhi": "Y'm-bhi",
    "The Mound": "Der Hügel",
    "Y'm-bhi: the dead of K'n-yan, brought back from their tombs with the fire in the flesh and none of the mind. They are made to labour and they do not tire.": "Y'm-bhi: die Toten von K'n-yan, aus ihren Gräbern zurückgeholt, mit dem Feuer im Fleisch und nichts vom Geist. Man zwingt sie zur Arbeit, und sie ermüden nicht.",
  },
  gyaa_yothn: {
    "Gyaa-yothn": "Gyaa-yothn",
    "The Mound": "Der Hügel",
    "Hulking things bred in Yoth to carry loads: blind, strong, and loyal to nobody in particular.": "Massige Dinge, in Yoth als Lasttiere gezüchtet: blind, stark und niemandem im Besonderen treu.",
  },
  reanimated_corpse: {
    "Reanimated Corpse": "Wiederbelebte Leiche",
    "Herbert West—Reanimator": "Herbert West – der Wiedererwecker",
    "West's work: a body made to walk by a serum that preferred fresher stock. It strikes without feeling and rots without minding. Fire ends it.": "Wests Werk: ein Körper, durch ein Serum zum Gehen gebracht, das frischere Ware vorzog. Er schlägt ohne Gefühl zu und verwest, ohne sich daran zu stören. Feuer macht ihm ein Ende.",
  },
  martense_degenerate: {
    "Martense Degenerate": "Entarteter Martense",
    "The Lurking Fear": "Die lauernde Furcht",
    "The Martense line went under the mountain when the house fell and took on the habits of the place. They hunt on all fours in the dark, and thunder wakes them.": "Das Geschlecht der Martense ging unter den Berg, als das Haus verfiel, und nahm die Gewohnheiten des Ortes an. Sie jagen auf allen vieren im Dunkeln, und der Donner weckt sie.",
  },
  exham_troglodyte: {
    "Exham Priory Troglodyte": "Troglodyt von Exham Priory",
    "The Rats in the Walls": "Die Ratten im Gemäuer",
    "Beneath Exham Priory the cellars and the rats are one tale. These are what the rats were guarding: pale, grey-eyed, and long since unable to say what they descend from.": "Unter Exham Priory sind die Keller und die Ratten eine einzige Geschichte. Diese hier sind es, was die Ratten bewachten: bleich, grauäugig und längst nicht mehr fähig zu sagen, wovon sie abstammen.",
  },
  rat_swarm: {
    "Rat Swarm": "Rattenschwarm",
    "The Rats in the Walls": "Die Ratten im Gemäuer",
    "A hundred small feet running toward you in a wave and a hundred small voices saying nothing at all. Fire turns them; a lantern held low parts them.": "Hundert kleine Füße, die in einer Woge auf euch zulaufen, und hundert kleine Stimmen, die gar nichts sagen. Feuer treibt sie zurück; eine tief gehaltene Laterne teilt sie.",
  },
  winged_hybrid: {
    "Winged Hybrid": "Geflügelter Mischling",
    "The Festival": "Das Fest",
    "At the Festival in Kingsport they come up out of the crypt on beaten wings in the shape of men, and nobody in the town will say why the old church bell is so slow.": "Beim Fest in Kingsport steigen sie auf schlagenden Schwingen in Menschengestalt aus der Krypta empor, und niemand in der Stadt will sagen, warum die alte Kirchenglocke so langsam schlägt.",
  },
  moon_bog_wraith: {
    "Moon-Bog Wraith": "Mondmoor-Gespenst",
    "The Moon-Bog": "Das Mondmoor",
    "The wraiths of the Moon-Bog: the shapes moonlight takes over a drowned village. Steel goes through them; light does not. They take the mind before the body.": "Die Gespenster des Mondmoors: die Gestalten, die das Mondlicht über einem ertrunkenen Dorf annimmt. Stahl geht durch sie hindurch; Licht nicht. Sie nehmen den Geist vor dem Körper.",
  },
  being_of_ib: {
    "Being of Ib": "Wesen aus Ib",
    "The Doom that Came to Sarnath": "Das Verhängnis, das über Sarnath kam",
    "Grey, bulging-eyed, froglike and mute: the dead city of Sarnath was built where they lived. They do not remember Sarnath. They have not forgotten it.": "Grau, glotzäugig, froschartig und stumm: Die tote Stadt Sarnath wurde dort erbaut, wo sie lebten. Sie erinnern sich nicht an Sarnath. Vergessen haben sie es nicht.",
  },
  nameless_city_reptile: {
    "Nameless City Reptile": "Reptil der namenlosen Stadt",
    "The Nameless City": "Die namenlose Stadt",
    "A crawling thing of the Nameless City, scaly, patient, as old as the desert. It lies in the low passages and moves only when you have gone in too far to turn.": "Ein kriechendes Ding der namenlosen Stadt, schuppig, geduldig, so alt wie die Wüste. Es liegt in den niedrigen Gängen und regt sich erst, wenn ihr zu weit hineingegangen seid, um umzukehren.",
  },
  hybrid_mummy: {
    "Hybrid Mummy": "Mischlingsmumie",
    "Under the Pyramids": "Unter den Pyramiden",
    "Under the pyramid, in the black chambers: a man's body and a beast's head, wrapped, rising from a niche. Not dead, not alive, and not stopped by a door.": "Unter der Pyramide, in den schwarzen Kammern: der Leib eines Menschen und der Kopf eines Tieres, gewickelt, aus einer Nische aufsteigend. Nicht tot, nicht lebendig, und von keiner Tür aufzuhalten.",
  },
  venusian_man_lizard: {
    "Venusian Man-Lizard": "Echsenmensch der Venus",
    "In the Walls of Eryx": "In den Mauern von Eryx",
    "A thing of Venus, if the walls of Eryx are to be believed: a reptile with a man's bearing, speaking in the mind, doing quiet harm with a cold glass look.": "Ein Ding der Venus, wenn man den Mauern von Eryx glauben darf: ein Reptil mit der Haltung eines Menschen, das im Geist spricht und mit kaltem, gläsernem Blick leise Schaden anrichtet.",
  },
  beast_in_the_cave: {
    "The Beast in the Cave": "Das Tier in der Höhle",
    "What a guide led a boy toward in the dark of the great cave: white, blind, human in its gait. It is, in its way, still a man.": "Wohin ein Führer einen Jungen im Dunkel der großen Höhle führte: weiß, blind, menschlich im Gang. Es ist auf seine Weise noch immer ein Mensch.",
  },
  child_of_yig: {
    "Child of Yig": "Kind des Yig",
    "The Curse of Yig": "Der Fluch des Yig",
    "Yig's children are many, and small, and they follow the scent of anyone who has hurt a snake. They are far better than you at finding you.": "Yigs Kinder sind viele und klein, und sie folgen der Witterung eines jeden, der einer Schlange etwas zuleide getan hat. Sie sind weit besser darin, euch zu finden, als ihr darin, euch zu verstecken.",
  },
  albino_penguin: {
    "Blind Albino Penguin": "Blinder Albinopinguin",
    "At the Mountains of Madness": "Berge des Wahnsinns",
    "A blind white bird that wanders the dark galleries beneath the ice, going toward the sound of its own feet. Miserable things. Their ancestors were bred.": "Ein blinder weißer Vogel, der durch die dunklen Galerien unter dem Eis wandert, dem Geräusch seiner eigenen Füße entgegen. Erbärmliche Geschöpfe. Ihre Vorfahren wurden gezüchtet.",
  },
  gnoph_keh: {
    "Gnoph-keh": "Gnoph-keh",
    "Polaris": "Polaris",
    "The hairy, many-limbed horror of the northern ice. It came down with the glaciers and hunted men, and it has not left off.": "Das haarige, vielgliedrige Grauen des nördlichen Eises. Es kam mit den Gletschern herab und jagte Menschen, und es hat nicht damit aufgehört.",
  },
  mi_go: {
    "Mi-Go": "Mi-Go",
    "The Whisperer in Darkness": "Der Flüsterer im Dunkeln",
    "The Fungi from Yuggoth: pinkish, crustaceous, winged, with a cluster of waving feelers where a head should be. Careful, quiet and unhurried. They take brains out and never quite finish.": "Die Pilze von Yuggoth: rosa, krebsartig, geflügelt, mit einem Büschel wedelnder Fühler, wo ein Kopf sein sollte. Sorgfältig, leise und ohne Eile. Sie nehmen Gehirne heraus und werden nie ganz fertig.",
  },
  elder_thing: {
    "Elder Thing": "Älteres Wesen",
    "At the Mountains of Madness": "Berge des Wahnsinns",
    "Barrel-bodied, star-headed, with membranous wings and tubular feelers. Not our enemy by temperament: they built a world and were undone by their own servants. Sometimes they are gentle.": "Tonnenleibig, sternköpfig, mit häutigen Schwingen und röhrenförmigen Fühlern. Nicht von Natur aus unser Feind: Sie bauten eine Welt und wurden von ihren eigenen Dienern zugrunde gerichtet. Manchmal sind sie sanft.",
  },
  shoggoth: {
    "Shoggoth": "Shoggoth",
    "Elder Shoggoth": "Älterer Shoggoth",
    "At the Mountains of Madness": "Berge des Wahnsinns",
    "A protoplasmic mass that makes eyes and mouths at will. They obeyed once. They remember obeying. They say one thing, over and over, and it is not a word you want to hear near.": "Eine protoplasmische Masse, die nach Belieben Augen und Münder bildet. Einst gehorchten sie. Sie erinnern sich ans Gehorchen. Sie sagen ein Ding, immer und immer wieder, und es ist kein Wort, das ihr aus der Nähe hören wollt.",
  },
};
