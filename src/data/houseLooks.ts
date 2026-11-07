/**
 * Round 111, each town's houses by its realm (render/houseMesh.ts, render/houseExtras.ts): the paints, bricks, roofs and doors it
 * chooses from (round 35's palettes are the defaults), how often a roof is a gambrel or a saltbox, how many windows are lit and how
 * many boarded, how a roof sags, and what stands on a roof or against a wall: an Innsmouth widow's walk, a college cupola, a round
 * turret of Ulthar. Data only; display sRGB, muted.
 */

type Rgb = readonly [number, number, number];

export interface HouseLook {
  paints: readonly Rgb[];
  bricks: readonly Rgb[];
  roofs: readonly Rgb[];
  doors: readonly Rgb[];
  gambrel: number; // share of clapboard roofs that are gambrels
  saltbox: number; // share of the rest that are saltboxes
  lit: number; // share of windows lit
  boarded: number; // share of the dark windows boarded over
  shutters: number; // share of clapboard houses with shutters
  sag: number; // metres the ridge sags (a hovel sags a further 0.25)
  walk: number; // share with a widow's walk on the ridge
  cupola: number; // share with a cupola on the ridge
  turret: number; // share with a round turret at a gable end
  steep: boolean; // stone houses roofed with steep slate gables, not flat parapets
}

const PAINT: readonly Rgb[] = [[0.82, 0.8, 0.74], [0.78, 0.7, 0.5], [0.6, 0.68, 0.6], [0.56, 0.62, 0.7], [0.7, 0.44, 0.38], [0.56, 0.46, 0.36], [0.7, 0.74, 0.76], [0.46, 0.5, 0.44]];
const BRICKS: readonly Rgb[] = [[1.05, 0.95, 0.9], [0.95, 0.7, 0.58], [0.88, 0.78, 0.55], [0.7, 0.62, 0.6], [0.72, 0.76, 0.84], [0.82, 0.62, 0.5]];
const ROOFS: readonly Rgb[] = [[0.62, 0.64, 0.7], [0.72, 0.6, 0.5], [0.6, 0.7, 0.56], [0.46, 0.46, 0.5], [0.74, 0.5, 0.42], [0.82, 0.8, 0.76]];
const DOOR: Rgb = [0.4, 0.27, 0.23];
const DOORS: readonly Rgb[] = [DOOR, [0.3, 0.42, 0.34], [0.5, 0.24, 0.18], [0.2, 0.2, 0.22], [0.42, 0.32, 0.22]];

const BASE: HouseLook = { paints: PAINT, bricks: BRICKS, roofs: ROOFS, doors: DOORS, gambrel: 0.45, saltbox: 0.36, lit: 0.3, boarded: 0, shutters: 0.6, sag: 0, walk: 0, cupola: 0, turret: 0, steep: false };

export const HOUSE_LOOKS: Readonly<Record<string, HouseLook>> = {
  hub: { ...BASE, bricks: [[0.95, 0.7, 0.58], [0.82, 0.62, 0.5], [0.88, 0.66, 0.54], [0.7, 0.62, 0.6]], roofs: [[0.46, 0.46, 0.5], [0.4, 0.42, 0.46], [0.6, 0.62, 0.66]], cupola: 0.3, lit: 0.4 }, // the college's red brick and slate, a cupola or two
  arkham: { ...BASE, paints: [[0.82, 0.8, 0.74], [0.78, 0.7, 0.5], [0.6, 0.66, 0.6], [0.66, 0.42, 0.36], [0.56, 0.46, 0.36], [0.7, 0.72, 0.72]], gambrel: 0.7, saltbox: 0.4, boarded: 0.08, walk: 0.06 }, // the gambrel roofs of old Arkham
  dunwich: { ...BASE, paints: [[0.52, 0.46, 0.4], [0.46, 0.42, 0.38], [0.58, 0.54, 0.48], [0.42, 0.38, 0.34]], roofs: [[0.46, 0.44, 0.42], [0.5, 0.42, 0.36], [0.4, 0.4, 0.4]], doors: [[0.28, 0.24, 0.2], [0.34, 0.28, 0.22]], lit: 0.15, boarded: 0.4, sag: 0.25, shutters: 0.2 }, // unpainted, sagging, shut against the hills
  innsmouth: { ...BASE, paints: [[0.62, 0.62, 0.58], [0.56, 0.58, 0.56], [0.66, 0.62, 0.54], [0.5, 0.54, 0.54], [0.58, 0.52, 0.46]], roofs: [[0.46, 0.46, 0.5], [0.52, 0.5, 0.48], [0.4, 0.42, 0.44]], doors: [[0.3, 0.34, 0.34], [0.28, 0.26, 0.24], DOOR], gambrel: 0.5, lit: 0.12, boarded: 0.55, sag: 0.18, walk: 0.35, shutters: 0.4 }, // paint gone grey in the salt, windows boarded, the captains' widow's walks
  providence: { ...BASE, bricks: [[0.95, 0.7, 0.58], [0.88, 0.78, 0.55], [0.82, 0.62, 0.5], [0.72, 0.76, 0.84]], gambrel: 0.55, boarded: 0.05, walk: 0.15, cupola: 0.1, lit: 0.35 }, // College Hill's Georgian brick, Kingsport's gambrels by the sea
  vermont: { ...BASE, paints: [[0.82, 0.8, 0.74], [0.66, 0.36, 0.3], [0.74, 0.72, 0.66], [0.6, 0.4, 0.34]], roofs: [[0.46, 0.46, 0.5], [0.56, 0.5, 0.44], [0.62, 0.64, 0.7]], lit: 0.25, boarded: 0.15, sag: 0.08, shutters: 0.5 }, // white farmhouses and barn red
  dreamlands: { ...BASE, roofs: [[0.46, 0.4, 0.42], [0.52, 0.44, 0.36], [0.4, 0.42, 0.48], [0.62, 0.5, 0.42]], lit: 0.45, turret: 0.3, steep: true }, // the steep old roofs and turrets of Ulthar
};

export const houseLookOf = (region?: string): HouseLook => (region && HOUSE_LOOKS[region]) || BASE;
