/** The arms: each weapon's name, how it handles, where it is had and its temper, and each relic's gift and price in Spanish. */

import type { StoryTable } from '..';

export const ES_ARMS: StoryTable = {
  cane: {
    "Sword-cane": "Bastón-espada",
    "A blade in a walking stick. Quick enough, and it reaches.": "Una hoja dentro de un bastón. Bastante rápido, y tiene alcance.",
  },
  axe: {
    "Woodsman's Axe": "Hacha de leñador",
    "From the Whateley woodpile. Slow to lift; what it bites, it staggers.": "De la leñera de los Whateley. Lenta de alzar; lo que muerde, se tambalea.",
    "It lies in the kitchen of the Whateley farmhouse, in Dunwich.": "Está en la cocina de la granja Whateley, en Dunwich.",
  },
  razor: {
    "Straight Razor": "Navaja de afeitar",
    "A barber's razor from the Witch House. Four cuts before a cane finishes two; mind the short reach.": "La navaja de un barbero de la Casa de la Bruja. Cuatro cortes antes de que un bastón termine dos; cuidado con su corto alcance.",
    "It lies in the parlour of the Witch House, in Arkham.": "Está en el salón de la Casa de la Bruja, en Arkham.",
  },
  cutlass: {
    "Obed Marsh's Cutlass": "El alfanje de Obed Marsh",
    "Off the Sumatra Queen, rusted at the basket. Wide cuts that find more than one foe.": "Del Sumatra Queen, oxidado en la cazoleta. Cortes amplios que alcanzan a más de un enemigo.",
    "It lies in the cells off the Drowned Hall of Y'ha-nthlei, beneath Innsmouth.": "Está en las celdas junto a la Sala Ahogada de Y'ha-nthlei, bajo Innsmouth.",
    ...(__DEMO__
      ? {}
      : {
          "Salt-rusted; it takes its share of every kill.": "Oxidado por la sal; se lleva su parte de cada muerte.",
        }),
  },
  rapier: {
    "Zamacona's Espada": "La espada de Zamacona",
    "A Spanish sword of 1541, from the depths of K'n-yan. It reaches past a foe's guard; mind its narrow line.": "Una espada española de 1541, de las profundidades de K'n-yan. Supera la guardia del enemigo; cuidado con su línea estrecha.",
    "Zamacona gives it, in K'n-yan, once Tsathoggua is stilled.": "Zamacona te la da, en K'n-yan, una vez aquietado Tsathoggua.",
    ...(__DEMO__
      ? {}
      : {
          "A clean kill steadies the hand and the mind.": "Una muerte limpia serena la mano y la mente.",
        }),
  },
  starHook: {
    "Hook of the Star-Stone": "Gancho de la piedra estelar",
    "Your blows bite deeper. Your mind mends slower.": "Tus golpes muerden más hondo. Tu mente sana más despacio.",
  },
  blackCoin: {
    "Coin of the Black Pharaoh": "Moneda del Faraón Negro",
    "Kills earn more Echoes. Blows land harder on you.": "Las muertes dan más Ecos. Los golpes te alcanzan con más fuerza.",
  },
  paleLamp: {
    "Lamp of the Pale Watcher": "Lámpara del Vigía Pálido",
    "The mind mends faster. Your blows are lighter.": "La mente sana más deprisa. Tus golpes son más ligeros.",
  },
  yellowSeal: {
    "Seal of the Yellow Sign": "Sello del Signo Amarillo",
    "Much deeper blows. Much blacker thoughts.": "Golpes mucho más hondos. Pensamientos mucho más negros.",
  },
  saltCharm: {
    "Charm of Salt and Brine": "Amuleto de sal y salmuera",
    "You take less harm. Kills earn less.": "Recibes menos daño. Las muertes dan menos.",
  },
  heartwood: {
    "Heartwood Reliquary": "Relicario de duramen",
    "The black wood lends you life, but weighs on your breath.": "La madera negra te presta vida, pero pesa sobre tu aliento.",
  },
  drownedLung: {
    "Lung of the Drowned": "Pulmón del Ahogado",
    "A stolen breath carries you farther, at the cost of your life.": "Un aliento robado te lleva más lejos, a costa de tu vida.",
  },
  dreamKnot: {
    "Knot of the Dreamer": "Nudo del Soñador",
    "Your breath returns more quickly. Kills earn less.": "Tu aliento vuelve más deprisa. Las muertes dan menos.",
  },
  bloodAmber: {
    "Blood in Amber": "Sangre en ámbar",
    "The trapped blood strengthens life and breath, but dulls your blows.": "La sangre atrapada fortalece la vida y el aliento, pero embota tus golpes.",
  },
};
