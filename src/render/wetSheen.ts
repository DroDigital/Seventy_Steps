/**
 * How much of a mirror the ground is (round 113): a drowned hall's floor stands wet (`uDamp`, eased in as the investigator walks into one
 * of its rooms), and the rain's ripples on wet ground are as strong as the rain (`uWetMirror.w`). The world shader marks it, the post pass
 * mirrors it (shaders/wetReflect.ts). Render only, read-only on the simulation.
 */

import { LIGHTING } from '../data/tuning';
import type { Game } from '../systems/components';
import { kitOfRoom } from '../world/dungeonKit';
import { dungeonRoomAt } from '../world/terrain';
import type { PostPass } from './postPass';
import { wetness } from './wetness';
import { worldUniforms } from './worldMaterial';

/** The walls a drowned hall is built of (data/kits.ts: the drowned vaults and the sunken temple). */
const DROWNED = 'rot';

export function createWetSheen(g: Game, post: PostPass): { update(time: number): void } {
  let damp = 0;
  let want = 0;
  let frame = 0;
  let last = -1;
  return {
    update(time) {
      const dt = last < 0 ? 1 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      if (frame++ % 12 === 0) {
        const me = g.ecs.c.transform.get(g.player.id)?.pos;
        const room = me && g.overworld ? dungeonRoomAt(me.x, me.z) : null;
        want = room && kitOfRoom(room.layout, room.room).wall === DROWNED ? 1 : 0;
      }
      damp += (want - damp) * Math.min(1, dt * 1.5);
      worldUniforms.uDamp.value = damp;
      post.uniforms.uWetMirror.value.w = LIGHTING.sheenMirror.ripple * Math.min(1, wetness.value * 1.5);
    },
  };
}
