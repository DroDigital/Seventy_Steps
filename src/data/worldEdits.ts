/**
 * The world editor's committed edits (round 110; docs/WORLD_EDITOR.md): written by
 * `node tools/world_edits.mjs apply <export.json>`, never by hand. Between the two markers is plain
 * JSON; `tests/worldEdits.test.ts` keeps every edit's target found in the world.
 */

import type { WorldEditFile } from '../world/edits/editTypes';

export const WORLD_EDITS: WorldEditFile = /* edits:begin */ {
  "format": "seventy-steps-world-edits",
  "version": 1,
  "edits": []
} /* edits:end */;
