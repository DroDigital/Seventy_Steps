/** Every baked model's triangles (read by render/modelKit.ts, which loads this module as the world is made): the Kenney kits' and the boss places'. Data only. */

import { BOSS_PACK } from './bossPack';
import { KENNEY_PACK } from './kenneyPack';

export const MODEL_PACK: Readonly<Record<string, string>> = { ...KENNEY_PACK, ...BOSS_PACK };
