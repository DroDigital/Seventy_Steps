/** Every baked model's triangles (read by render/modelKit.ts, which loads this module as the world is made): the Kenney kits', the boss places', the gates' and the web-sourced parts'. Data only. */

import { BOSS_PACK } from './bossPack';
import { GATE_PACK } from './gatePack';
import { KENNEY_PACK } from './kenneyPack';
import { WEB_PACK } from './webPack';

export const MODEL_PACK: Readonly<Record<string, string>> = { ...KENNEY_PACK, ...BOSS_PACK, ...GATE_PACK, ...WEB_PACK };
