/** The night of the arena and the open world: a dim low moon, a faint cold ambient, and the investigator's lantern. */

import { wrapAngle } from '../core/geom';
import { LANTERN, LIGHT, LIGHTING } from '../data/tuning';
import type { Game } from '../systems/components';
import { worldUniforms } from './worldMaterial';

/** Switches the shared world light from the look test's moonlight to night: a dim low moon, and the lantern. */
export function lightNight(): void {
  const u = worldUniforms;
  u.uLightDir.value.set(...LIGHT.nightMoonDir).normalize();
  u.uLightColor.value.set(...LIGHT.nightMoon);
  u.uAmbient.value.set(...LIGHT.nightAmbient);
  u.uLanternColor.value.set(...LANTERN.color).multiplyScalar(LANTERN.intensity);
}

/** Hangs the light at the player's left hip, where the lantern is, at this frame's interpolated pose. */
export function placeLantern(g: Game, alpha: number): void {
  const tr = g.ecs.c.transform.get(g.player.id);
  if (!tr) return;
  const t = g.frame / 60 + alpha / 60; // the flame breathes: three slow waves of its own
  const breath = LIGHTING.flicker.speed;
  const f = LIGHTING.flicker.lantern * (0.5 * Math.sin(t * breath) + 0.3 * Math.sin(t * breath * 2.37 + 1.7) + 0.2 * Math.sin(t * breath * 0.43));
  worldUniforms.uLanternColor.value.set(...LANTERN.color).multiplyScalar(LANTERN.intensity * (1 + f));
  const yaw = tr.prevYaw + wrapAngle(tr.yaw - tr.prevYaw) * alpha;
  const [s, c] = [Math.sin(yaw), Math.cos(yaw)]; // forward (s, c), left (c, -s)
  const lerp = (p: number, q: number): number => p + (q - p) * alpha;
  worldUniforms.uLanternPos.value.set(
    lerp(tr.prev.x, tr.pos.x) + s * LANTERN.forward + c * LANTERN.side,
    lerp(tr.prev.y, tr.pos.y) + LANTERN.height,
    lerp(tr.prev.z, tr.pos.z) + c * LANTERN.forward - s * LANTERN.side,
  );
}
