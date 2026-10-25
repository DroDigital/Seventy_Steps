/**
 * Round 78, atmosphere: a room for every place, and the hearth of fires and lamps. One of the atmosphere audio hub's parts
 * (render/audio/atmosphereAudio.ts): made once with the game's audio and updated each frame, read-only on the simulation. A few
 * times a second it reads where the investigator stands (the dungeon room's kit and shape, the region's air, a fight engaged)
 * and tells the engine's reverb (audio/space.ts) the room; every frame it hands the lights in earshot to the hearth
 * (audio/hearth.ts). Walls between the investigator and a sound live in audio/occlusion.ts, which gameAudio's `place` asks.
 */

import { SPACE } from '../../../data/acoustics';
import { engagedFights } from '../../../systems/bossFight';
import { kitIdOfRoom } from '../../../world/dungeonKit';
import { dungeonRoomAt } from '../../../world/terrain';
import type { AtmAudioContext, AtmAudioPart } from '../atmosphereAudio';
import { createHearth } from '../hearth';
import { HEARD_LIGHTS, type HeardLight } from '../heardLights';
import { createOcclusion } from '../occlusion';
import { spaceOf, type SpaceInput } from '../spacePlan';
import { createSpaceSafety } from '../spaceSafety';

const NONE: readonly HeardLight[] = [];

export function createSpace(ctx: AtmAudioContext): AtmAudioPart {
  const { e, g } = ctx;
  const hearth = createHearth(e);
  const ears = createOcclusion(g); // (this part's own looks: a lamp or a Sign is asked of a ray, a torch or a fire of the eye's)
  const safety = createSpaceSafety();
  const input: SpaceInput = { kit: null, kind: null, wide: false, region: null, fighting: false };
  let [asked, last] = [-Infinity, performance.now() / 1000];
  const open = (h: HeardLight): number => (h.kind === 'torch' || h.kind === 'fire' ? h.v : 1 - ears.occludedAt(h));
  return {
    update(_fx, _seconds, _camera, paused) {
      const now = performance.now() / 1000;
      const on = safety.frame((now - last) * 1000, now);
      last = now;
      const bus = e.space;
      if (bus) {
        if (bus.state.on !== on) bus.enable(on);
        const wet = paused ? SPACE.paused : 1; // a menu's sounds do not carry a vault's tail
        if (on && (now - asked >= SPACE.every || wet !== bus.state.wet)) {
          asked = now;
          const me = g.ecs.c.transform.get(g.player.id)?.pos;
          const d = g.overworld && me ? dungeonRoomAt(me.x, me.z) : null;
          input.kit = d ? kitIdOfRoom(d.layout, d.room) : null;
          input.kind = d?.room.def.kind ?? null;
          input.wide = !!d?.room.def.wide;
          input.region = g.overworld ? g.overworld.region : null;
          input.fighting = engagedFights(g).length > 0;
          bus.set(spaceOf(input), wet);
        }
      }
      hearth.update(g.overworld ? HEARD_LIGHTS : NONE, ctx.listener, ctx.right, open, paused);
    },
  };
}
