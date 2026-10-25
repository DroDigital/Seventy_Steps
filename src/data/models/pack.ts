/** Every baked model's triangles (read by render/modelKit.ts, which loads this module as the world is made): the Kenney kits', the boss places' and the gates'. Data only. */

import { BOSS_PACK } from './bossPack';
import { GATE_PACK } from './gatePack';
import { KENNEY_PACK } from './kenneyPack';

export const MODEL_PACK: Readonly<Record<string, string>> = { ...KENNEY_PACK, ...BOSS_PACK, ...GATE_PACK };
