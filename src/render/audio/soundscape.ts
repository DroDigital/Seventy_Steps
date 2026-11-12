/** Outdoor soundscapes that belong to a place within a realm. */

import type { XZ } from '../../core/geom';
import { worldLayout } from '../../world/placements';
import { segmentDistance } from '../../world/roads';

// The sign, its approach and the whole of Yig's enclosure, with room beyond its walls.
const TEMPLE_REACH = 90;
let temple: { sign: XZ; arena: XZ } | null | undefined;

function templePlaces(): { sign: XZ; arena: XZ } | null {
  if (temple === undefined) {
    const world = worldLayout();
    const sign = world.signs.find((s) => s.id === 'knyan_serpents');
    const arena = world.arenas.find((a) => a.bosses.includes('yig'));
    temple = sign && arena ? { sign, arena } : null;
  }
  return temple;
}

/** A place's outdoor ambience and far voices share this key; other sound still follows the realm. */
export function soundscapeAt(region: string | null | undefined, at?: XZ): string | null {
  if (!__DEMO__ && region === 'kn_yan' && at) { // (the Kn-Yan temple is not in the demo)
    const places = templePlaces();
    if (places && segmentDistance(at.x, at.z, places.sign, places.arena) <= TEMPLE_REACH) return 'serpent_temple';
  }
  return region ?? null;
}
