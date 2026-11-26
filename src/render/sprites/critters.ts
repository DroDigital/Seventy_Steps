/**
 * Native-size pixel drawings for the small lives. Each coat shares its palette across its poses.
 * Airborne frames pivot at the shoulder. Feet stay on row 15 in every grounded pose.
 * Fireflies live in the halo batch and have no atlas cells.
 */

import type { CritterId } from '../../data/fauna';
import { createCanvas, GLINT, LIT, type Canvas } from './raster';

export const CRITTER_CELL = 16;
const COLUMNS = 16;

type Palette = Readonly<Record<string, number>>;
type Stamp = (x: number, y: number, rows: readonly string[], mirror?: boolean) => void;
type Draw = (stamp: Stamp, frame: number) => void;
type Clip = readonly [Draw, number];

export interface CritterFrames {
  rest: number[];
  move: number[];
}

export interface CritterAtlas {
  data: Uint8Array;
  width: number;
  height: number;
  coats: Record<Exclude<CritterId, 'firefly'>, CritterFrames[]>;
}

/** A dot leaves the layer beneath it visible. Only g, a cat or rat eye, carries shader glint. */
function painter(canvas: Canvas, palette: Palette): Stamp {
  return (left, top, rows, mirror = false) => {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const key = row[x];
        if (key === '.') continue;
        const rgb = palette[key];
        const column = mirror ? CRITTER_CELL - 1 - left - x : left + x;
        const i = ((top + y) * CRITTER_CELL + column) * 4;
        canvas.px[i] = rgb >> 16;
        canvas.px[i + 1] = (rgb >> 8) & 255;
        canvas.px[i + 2] = rgb & 255;
        canvas.px[i + 3] = key === 'g' ? GLINT : LIT;
      }
    });
  };
}

// k: ink, s: shadow, m/l/h: the middle and upper planes, a: marking, b: bill/feet, e: eye.
const CROW = { k: 0x17151e, s: 0x282a37, m: 0x3c404f, l: 0x525e72, h: 0x808398, a: 0x62515d, b: 0x746969, e: 0xd6c7a3 };
const GULL = { k: 0x302c32, s: 0x4c535d, m: 0x727e88, l: 0xa8aca6, h: 0xe3dfcb, a: 0xe6d7bb, b: 0xb88651, e: 0x251e23 };
const NIGHTJAR = { k: 0x241e22, s: 0x3e3032, m: 0x5c4640, l: 0x846f56, h: 0xa99470, a: 0xd0b796, b: 0x7c655b, e: 0xd19b64 };

const crowPerch: Draw = (p, f) => {
  p(1, 7, [
    '.......mms',
    '.....mlmlmk',
    '...klhlmmssk',
    '..smlmmsasak',
    '.klmlmsskss',
    'kmmmsks.ss',
    'kssk..b.b',
    'k....bk.b',
    '....kb.kbk',
  ]);
  p(8, 3 + f, ['.sslmk', 'kmlhmmk', 'smmsesb', '.smkskbk', '..ksam', '.msks']);
};

const gullPerch: Draw = (p, f) => {
  p(1, 7, [
    '.........hhk',
    '.....lllhhhk',
    '..kksmlllmhhk',
    'kkmmlmmmllhhk',
    '.ksmsksslhhs',
    '...ksmlllhsk',
    '......b..b',
    '......b..b',
    '.....kbb.bb',
  ]);
  p(9, 4 + f, ['.hhh', 'hhaehb', 'lhhhbbk', 'lhhsk', 'mhhk']);
};

const nightjarPerch: Draw = (p, f) => {
  p(0, 9, [
    '......smlmml',
    '....klhsmhlms',
    '...klmshlmssls',
    'kkhlmslmmslak',
    '.ksslhskssms',
    '..kkks..b.b',
    '.......kbkbk',
  ]);
  p(8, 6 + f, ['.slhls', 'kmlselk', 'klsksbk', '.sakk', 'mlsk']);
};

/** The long primaries fold together as the wing drops past the body. Gulls have black wing tips,
 * nightjars a broken pale bar, and the crow an iridescent fan that stays dark at the ends. */
function onWing(kind: 'crow' | 'gull' | 'whippoorwill'): Draw {
  const gull = kind === 'gull';
  const bar = kind === 'whippoorwill' ? 'a' : 'l';
  return (p, f) => {
    p(0, 7, ['kl......lmms', '.smk.kmllhlms', '.klsmlllmmmssk', '..kkkssmmsssk', '.....kkkskk']);
    p(gull ? 10 : 9, 6, gull
      ? ['.hhk', 'hhehb', 'lhhbbk', 'hlk']
      : kind === 'crow'
        ? ['.mllsk', 'lmmsesb', 'smsskbk', 'ssk']
        : ['.hlml', 'lmselk', 'ksaksbk', '.ssk']);
    if (f === 0) {
      p(2, gull ? 0 : 1, [
        'k', 'sk', 'kmk.k', '.smksk', '..s' + bar + 'msk', '...l' + bar + 'lmk', '....lmlmk', '.....ksms',
      ]);
    } else if (f === 1) {
      p(1, 5, ['kk', '.smkk', '..mlmmmk', '...l' + bar + bar + 'lmms', '.....mmmss', '.......kk']);
    } else {
      p(3, 8, ['....mlms', '....lmlms', '...s' + bar + 'lms', '..sm' + bar + 'ms', '..kmmss', '.ksksk', 'kk.k']);
    }
  };
}

const BAT = { k: 0x201d2b, s: 0x382a3a, m: 0x5d3d50, l: 0x875866, h: 0xb3827a, a: 0x907466, e: 0xcb9980 };
const BAT_WINGS = [
  ['..h', '.lms', '.mmls', 'kmlsms', 'ksmsmls', 's.ksmsms', '...k.ksm'],
  ['.....hl', '..klmlms', 'klmmsmlm', 'smssmksm', 'k..kk.ks'],
  ['......hl', '....klms', '..klmmsm', '.smssmks', 'smmksk', 'sk.ks', 'k..k'],
] as const;

const bat: Draw = (p, f) => {
  const y = [2, 6, 8][f];
  p(0, y, BAT_WINGS[f]);
  p(0, y, BAT_WINGS[f], true);
  p(6, 4, ['s..s', 'hs.s', '.mml', 'meem', '.ahs', '.lms', '.ss', '.ks', '.k']);
};

const RAT = { k: 0x27242c, s: 0x433e43, m: 0x645a57, l: 0x8e7e6d, h: 0xad9b83, a: 0xb2837a, b: 0x926b69, g: 0xd0aa84 };
const rat = (running: boolean): Draw => (p, f) => {
  // The hind feet meet under the belly on the gathering stride.
  p(4, 13, running
    ? f ? ['..s..ks', '..kb.ks', '...b.bk'] : ['.s....ss', 'kb.....s', 'bb.....bb']
    : ['.s...ss', '.s...sk', 'kbb..bb']);
  p(0, 11, f && running ? ['bb', '.aks', '...bsm'] : ['....bs', '...bs', 'babs']);
  p(3, 9, ['...smmk', '.mlhhmls', 'sllmmmmls', 'lmmsmsssmk', 'kssmmlmsk', '.kkssssk']);
  const nod = running ? f : 1 - f;
  p(9, 8 + nod, ['ab.k', 'malms', 'smhglk', '.smslbk', '..ksk']);
};

const MOTH = { k: 0x464047, s: 0x675951, m: 0x94816c, l: 0xbfa88a, h: 0xe2d5ab, a: 0xeee4c2 };
const moth = (moving: boolean): Draw => (p, f) => {
  const wing = f
    ? ['..k', '.lh', 'sahm', 'lmsl', '.hms', '.msk']
    : ['hl', 'lhhl', 'msalh', 'kshmll', '.lmsks', '..skhm', '...ks'];
  const left = f ? 4 : 1;
  const top = moving ? 4 : 5;
  p(left, top, wing);
  p(left, top, wing, true);
  p(6, top, ['k..k', '.ll', '.aa', '.ks', '.hl', '.ms', '.ks']);
};

const BLACK_CAT = { k: 0x1a1924, s: 0x292b39, m: 0x414352, l: 0x585d71, h: 0x858391, a: 0x987479, b: 0x6b6470, g: 0xb9c586 };
const TABBY = { k: 0x30252b, s: 0x523d3b, m: 0x82614e, l: 0xa58060, h: 0xc3a483, a: 0xb9877b, b: 0x9a7e6b, g: 0xc8d391 };
const sittingCat: Draw = (p, f) => {
  if (f) p(1, 9, ['l', 'ms', 'ms', '.mk', '.ms', '..ssk']);
  else p(0, 12, ['ms', 'kml', '.kmsk']);
  p(3, 7, [
    '.....mls', '....lmhss', '...llmlhs', '..smmsmls', '.slmlsmls', 'sllmmssms', 'lmmslssls', 'smmmls.ls', '.ssshs.bb',
  ]);
  p(7, 2, ['s...s', 'ma.sms', 'mlmsls', 'kmlhmm', '.msgls', '..mhbk', '..lsk']);
};
const walkingCat: Draw = (p, f) => {
  p(0, 5 + f, ['m', 'ls', 'ks', '.mk', '.mls', '..ksk']);
  p(3, 12, f ? ['.msk..mss', '..ss.ksk', '..ls.bk', '..bb.kb'] : ['.ms...sms', '.sk....ls', 'sk......mk', 'bb......bb']);
  p(3, 8, ['.........ml', '..llmllmmlm', '.lmlssmlmls', 'slmmsmssmss', 'kssmlmmssk', '.kskkksk']);
  p(10, 4, ['s..s', 'makms', 'klmls', '.sgls', '.mhbbk', '..msk']);
};

interface Coat {
  palette: Palette;
  rest: Clip;
  move: Clip;
}

const PLANS: Record<Exclude<CritterId, 'firefly'>, readonly Coat[]> = {
  crow: [{ palette: CROW, rest: [crowPerch, 2], move: [onWing('crow'), 3] }],
  gull: [{ palette: GULL, rest: [gullPerch, 2], move: [onWing('gull'), 3] }],
  whippoorwill: [{ palette: NIGHTJAR, rest: [nightjarPerch, 2], move: [onWing('whippoorwill'), 3] }],
  bat: [{ palette: BAT, rest: [bat, 3], move: [bat, 3] }],
  rat: [{ palette: RAT, rest: [rat(false), 2], move: [rat(true), 2] }],
  moth: [{ palette: MOTH, rest: [moth(false), 2], move: [moth(true), 2] }],
  cat: [BLACK_CAT, TABBY].map(palette => ({ palette, rest: [sittingCat, 2], move: [walkingCat, 2] })),
};

/** Every critter's frames, drawn and packed. */
export function critterAtlas(): CritterAtlas {
  const drawn: { canvas: Canvas }[] = [];
  const coats = {} as CritterAtlas['coats'];
  const draw = ([plan, n]: Clip, palette: Palette): number[] =>
    Array.from({ length: n }, (_, f) => {
      const canvas = createCanvas(CRITTER_CELL, CRITTER_CELL);
      plan(painter(canvas, palette), f);
      return drawn.push({ canvas }) - 1;
    });
  for (const [id, plans] of Object.entries(PLANS) as [keyof typeof PLANS, (typeof PLANS)[keyof typeof PLANS]][]) {
    coats[id] = plans.map(({ rest, move, palette }) => ({ rest: draw(rest, palette), move: draw(move, palette) }));
  }
  const rows = Math.ceil(drawn.length / COLUMNS);
  const [width, height] = [COLUMNS * CRITTER_CELL, rows * CRITTER_CELL];
  const data = new Uint8Array(width * height * 4);
  drawn.forEach(({ canvas }, cell) => {
    const [cx, cy] = [(cell % COLUMNS) * CRITTER_CELL, Math.floor(cell / COLUMNS) * CRITTER_CELL];
    for (let y = 0; y < CRITTER_CELL; y++) data.set(canvas.px.subarray(y * CRITTER_CELL * 4, (y + 1) * CRITTER_CELL * 4), ((cy + y) * width + cx) * 4);
  });
  return { data, width, height, coats };
}

/** Top-left pixel of a critter atlas cell. */
export const critterCell = (cell: number): readonly [number, number] => [(cell % COLUMNS) * CRITTER_CELL, Math.floor(cell / COLUMNS) * CRITTER_CELL];
