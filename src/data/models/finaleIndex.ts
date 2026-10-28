/** Boxes of the endings' props (tools/finale/bake_finale.py). Not merged into MODEL_INFO. Data only. */

import type { ModelInfo } from './index';

export const FINALE_INFO: Readonly<Record<string, ModelInfo>> = {
  fn_key: { kit: 'finale', x0: -0.057, x1: 0.057, y0: 0.000, y1: 0.280, z0: -0.037, z1: 0.037, round: false, tris: 608, solids: [] },
  fn_arch: { kit: 'finale', x0: -2.947, x1: 2.947, y0: 0.000, y1: 6.400, z0: -2.947, z1: 2.947, round: false, tris: 308, solids: [] },
  fn_clock: { kit: 'finale', x0: -0.610, x1: 0.610, y0: 0.000, y1: 6.149, z0: -0.664, z1: 0.664, round: false, tris: 656, solids: [] },
};
