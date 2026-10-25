/**
 * The open world's ground mist, thickened in the courts of the horrors it fits (round 78, asked: "add the open world fog to every fitting boss arena as well to enhance
 * atmosphere even more"). The mist of a court is its realm's own (data/fogs.ts), made `density` times as thick and `height` times as deep, drifting in the patches a
 * place wants; it gathers as the camera crosses the wall (render/courtMist.ts) and is whole a few metres inside. It stays a low mist (the roofs, the towers and the sky
 * stand clear above it, as the open world's does) and a fight's ground keeps its contrast, so none is thicker than the Black Man's river, which the round 71 places were
 * made to be seen over. Left without: the Colossus (a desert's clear air, only sand blown along its walls) and Yig (a dry plateau, its pits).
 */

export interface ArenaMist {
  density: number; // times the realm's mist at the ground
  height: number; // times the metres over which it thins
  haze?: number; // times its thin haze (the lamps' height)
  patchy?: number; // 0: an even veil; 1: drifts with clear air between (else the realm's)
}

export const ARENA_MISTS: Readonly<Record<string, ArenaMist>> = {
  simon_orne: { density: 2.1, height: 1.7, patchy: 0.75 }, // a burying ground's mist, lying among the stones
  colour_out_of_space: { density: 1.8, height: 1.4, haze: 1.3 }, // the blasted ground's, a pale ash-fog in the dry basin
  black_man: { density: 2.2, height: 1.6, patchy: 0.8 }, // the black river's, lying on the water and the island
  shub_niggurath: { density: 1.9, height: 1.5, haze: 1.3, patchy: 0.7 }, // the grove's breath, among the pods and spores
  medusa_gorgon: { density: 1.6, height: 1.3, haze: 1.2 }, // smoke and ash over a burned house
  martins_beach_horror: { density: 2.2, height: 1.6, patchy: 0.55 }, // sea fog off the basin
  edward_hutchinson: { density: 1.5, height: 1.2 }, // the keep's: a thin mist under the storm
  nug: { density: 2.0, height: 1.5 }, // the damp of the channels
  bokrug: { density: 2.2, height: 1.6, patchy: 0.7 }, // mist off the lake of Ib
  cthulhu: { density: 1.9, height: 1.5, haze: 1.2 }, // sea-mist over the lagoon
  hastur: { density: 1.9, height: 1.5, patchy: 0.8 }, // Carcosa's, drifting through the tiers
  zkauba: { density: 1.5, height: 1.3 },
  other_gods: { density: 2.0, height: 1.3 }, // the cloud-sea's edge curling at the ankle
  ancient_ones: { density: 1.5, height: 1.3, patchy: 0.3 }, // a still pale air
  daemon_pipers: { density: 1.8, height: 1.4, patchy: 0.85 }, // swirling to the tune
  yog_sothoth: { density: 1.4, height: 1.3 }, // the oil-bright haze
  azathoth: { density: 1.5, height: 1.3, haze: 1.2 }, // hot ash
  nyarlathotep: { density: 1.5, height: 1.3, patchy: 0.7 }, // ash drifting across the floor
};
