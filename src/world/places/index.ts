/** Every horror's place, by the first boss of its arena (round 71; world/enclosurePlace.ts): its planner lays the pieces and says the outline of its wall. */

import type { ExtraFn, PlaceFn } from '../enclosurePlace';
import { ancients } from './ancients';
import { azathoth } from './azathoth';
import { blackman } from './blackman';
import { bokrug } from './bokrug';
import { colour } from './colour';
import { cthulhu } from './cthulhu';
import { colossus } from './colossus';
import { gorgon } from './gorgon';
import { hastur } from './hastur';
import { hutchinson } from './hutchinson';
import { martins } from './martins';
import { nug } from './nug';
import { orne } from './orne';
import { othergods } from './othergods';
import { pipers } from './pipers';
import { shub } from './shub';
import { yig } from './yig';
import { yog } from './yog';
import { zkauba } from './zkauba';

export const PLACES: Readonly<Record<string, PlaceFn>> = { simon_orne: orne, edward_hutchinson: hutchinson, martins_beach_horror: martins, medusa_gorgon: gorgon, colossus_pyramids: colossus, shub_niggurath: shub, yig, nug, bokrug, other_gods: othergods, cthulhu, hastur, yog_sothoth: yog, azathoth, zkauba, daemon_pipers: pipers, ancient_ones: ancients };

/** What is laid in a horror's court that keeps its own enclosure (a basin's dam, a river's island), by the first boss. */
export const EXTRAS: Readonly<Record<string, ExtraFn>> = { colour_out_of_space: colour, black_man: blackman };
