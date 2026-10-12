/** Read-only browser evidence for ?debug. This never advances or changes the simulation. */

import type { Game } from '../systems/components';

export interface RenderedCreatureFrame {
  id: number;
  key: string;
  direction: string;
  state: string;
  frame: number;
  source: string;
  mirror: boolean;
  page: number;
  width: number;
  height: number;
}

interface CreatureDiagnostics {
  debugFrames(): readonly RenderedCreatureFrame[];
}

declare global {
  interface Window {
    render_game_to_text?: () => string;
  }
}

const rounded = (n: number): number => Number(n.toFixed(3));

/** Installs a compact state reader only when the debug query is present. */
export function installGameEvidence(game: Game, creatures: CreatureDiagnostics): void {
  if (!new URLSearchParams(window.location.search).has('debug')) return;
  window.render_game_to_text = () => {
    const c = game.ecs.c;
    const id = game.player.id;
    const transform = c.transform.get(id);
    const health = c.health.get(id);
    const stamina = c.stamina.get(id);
    const actor = c.actor.get(id);
    const mover = c.mover.get(id);
    const position = (entity: number) => {
      const t = c.transform.get(entity);
      return t ? { x: rounded(t.pos.x), y: rounded(t.pos.y), z: rounded(t.pos.z), yaw: rounded(t.yaw) } : null;
    };
    return JSON.stringify({
      coordinates: 'Metres, y up. Yaw 0 faces +z; positive yaw turns toward +x. Positions are feet.',
      mode: game.overworld ? 'world' : 'arena',
      frame: game.frame,
      seconds: rounded(game.frame / 60),
      player: {
        id,
        position: transform ? position(id) : null,
        hp: health?.hp,
        maxHp: health?.max,
        stamina: stamina ? rounded(stamina.value) : null,
        velocity: mover ? { x: rounded(mover.vx), z: rounded(mover.vz) } : null,
        action: actor?.move ?? 'idle',
        actionFrame: actor?.frame,
        lockTarget: game.lock.target,
      },
      mind: { sanity: rounded(game.mind.sanity), insight: game.mind.insight },
      creatures: creatures.debugFrames().map((frame) => ({
        ...frame,
        position: position(frame.id),
        hp: c.health.get(frame.id)?.hp,
        action: c.actor.get(frame.id)?.move ?? 'idle',
        actionFrame: c.actor.get(frame.id)?.frame,
      })),
    });
  };
}
