/** Every baked model's triangles (read by render/modelKit.ts, which loads this module as the world is made): the Kenney kits', the boss places', the gates', the web-sourced parts' and the endings' props. Data only. */

import { BOSS_PACK } from './bossPack';
import { FINALE_PACK } from './finalePack';
import { GATE_PACK } from './gatePack';
import { KENNEY_PACK } from './kenneyPack';
import { WEB_PACK } from './webPack';

export const MODEL_PACK: Readonly<Record<string, string>> = { ...KENNEY_PACK, ...BOSS_PACK, ...GATE_PACK, ...WEB_PACK, ...FINALE_PACK };
