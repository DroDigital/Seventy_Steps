/**
 * Round 80, the ground's litter belongs to the place: what lies about on open ground in the regions that have more to say than their
 * ground texture does. Weed and wrack strewn on the mud flats of Innsmouth, bleached ribs and potsherds in the Pnakotic sand, pale fungus
 * caps in the caverns of K'n-yan. A share of each chunk's cover (render/groundCover.ts) and of what lies about the foot of a prop
 * (render/baseCover.ts) is one of these pieces instead of a tuft or a pebble, so the count and the cost do not grow much. Colours are
 * display sRGB before the cover's gain (render/groundCover.ts `GAIN`): muted, none an anomaly's hue (tests/coverKinds.test.ts). Data only.
 */

type Rgb = readonly [number, number, number];

export type Piece = 'wrack' | 'rib' | 'sherd' | 'cap';

/** A region's pieces and the share of its cover each takes (the rest of the cover is the ground texture's own, as ever). */
export const REGION_COVER: Readonly<Record<string, readonly { piece: Piece; share: number }[]>> = {
  innsmouth: [{ piece: 'wrack', share: 0.13 }], // the weed-strewn shore of Innsmouth
  pnakotus: [{ piece: 'rib', share: 0.025 }, { piece: 'sherd', share: 0.07 }], // the bone-littered desert about the Pnakotic ruins
  kn_yan: [{ piece: 'cap', share: 0.16 }], // the pale fungus of the K'n-yan caverns
};

export const PIECE_COLORS: Readonly<Record<Piece, readonly Rgb[]>> = {
  wrack: [[0.2, 0.25, 0.19], [0.26, 0.3, 0.22], [0.18, 0.2, 0.17]], // dark olive weed, drying nearly black
  rib: [[0.62, 0.58, 0.48], [0.56, 0.52, 0.44]], // bone gone chalk-pale in the sun
  sherd: [[0.5, 0.36, 0.3], [0.44, 0.33, 0.28], [0.56, 0.44, 0.34]], // a broken pot's terracotta and cream
  cap: [[0.58, 0.64, 0.64], [0.5, 0.56, 0.58]], // a pale cold fungus
};

/** The piece a roll in 0..1 picks in this region, or none: a roll beyond the pieces' shares is the ground's own cover. */
export function pieceOf(region: string, roll: number): Piece | null {
  let r = roll;
  for (const { piece, share } of REGION_COVER[region] ?? []) if ((r -= share) < 0) return piece;
  return null;
}
