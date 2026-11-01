/** Azathoth's court fractures during the fight. The floor belongs to the encounter, not the world save. */
import type { ArenaCircle, ArenaFloor, ArenaTile, Fight } from './fightTypes';
import type { Game } from './components';

export const FLOOR = {
  size: 6,
  visible: 0.14,
  warning: 0.72,
  warningFrames: 180,
  movementPerMetre: 0.04,
  // Caps apply to unstable tiles; protected crossing lanes and the outside route always remain.
  phaseCap: [0.1, 0.2, 0.35, 1] as const,
};

function tileSeed(x: number, z: number): number {
  let n = Math.imul(x, 374761393) + Math.imul(z, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

/** A grid with stable crossing lanes and a stable perimeter, so there is always somewhere to move. */
export function createArenaFloor(arena: ArenaCircle, boss?: { x: number; z: number; radius: number }): ArenaFloor {
  const tiles: ArenaTile[] = [];
  const n = Math.floor((arena.radius - FLOOR.size) / FLOOR.size);
  for (let iz = -n; iz <= n; iz++) for (let ix = -n; ix <= n; ix++) {
    const x = arena.x + ix * FLOOR.size;
    const z = arena.z + iz * FLOOR.size;
    const d = Math.hypot(x - arena.x, z - arena.z);
    if (d > arena.radius - FLOOR.size) continue;
    const underBoss = !!boss && Math.hypot(x - boss.x, z - boss.z) < boss.radius + FLOOR.size * Math.SQRT1_2;
    const protectedTile = ix === 0 || iz === 0 || d > arena.radius - FLOOR.size * 2 || underBoss;
    tiles.push({ x, z, strain: 0, seed: tileSeed(ix, iz), warning: 0, collapsed: false, protected: protectedTile });
  }
  return { tiles, size: FLOOR.size, lastTremor: -1e9 };
}

export function tileAt(floor: ArenaFloor, x: number, z: number): ArenaTile | undefined {
  const half = floor.size / 2;
  return floor.tiles.find((t) => x >= t.x - half && x < t.x + half && z >= t.z - half && z < t.z + half);
}

/** Only the investigator's footing reads this; Azathoth and all other creatures remain anchored. */
export function collapsedFloorAt(g: Game, x: number, z: number): boolean {
  for (const fight of g.ecs.c.fight.values()) {
    if (fight.engaged && fight.arenaFloor && tileAt(fight.arenaFloor, x, z)?.collapsed) return true;
  }
  return false;
}

/** Strain grows over time; movement on an already visible fissure hastens only that section. */
export function stepArenaFloor(g: Game, fight: Fight): void {
  const floor = fight.arenaFloor;
  const tr = g.ecs.c.transform.get(g.player.id);
  if (!floor || !tr || g.player.falling || (g.ecs.c.health.get(g.player.id)?.hp ?? 0) <= 0) return;
  const under = tileAt(floor, tr.pos.x, tr.pos.z);
  const moved = Math.min(0.25, Math.hypot(tr.pos.x - tr.prev.x, tr.pos.z - tr.prev.z));
  const eligible = floor.tiles.filter((t) => !t.protected);
  let fallen = eligible.filter((t) => t.collapsed).length;
  const cap = Math.floor(eligible.length * FLOOR.phaseCap[Math.min(fight.phase, FLOOR.phaseCap.length - 1)]);
  for (const t of eligible) {
    if (t.collapsed) continue;
    // Each tile has its own slow rhythm; the last phases worsen the whole arena a little faster.
    t.strain = Math.min(1, t.strain + (0.75 + 0.7 * t.seed) * (1 + fight.phase * 0.12) / (60 * 110));
    if (t === under && t.strain >= FLOOR.visible) t.strain = Math.min(1, t.strain + moved * FLOOR.movementPerMetre);
    if (fallen >= cap) {
      t.strain = Math.min(t.strain, FLOOR.warning - 0.01);
      t.warning = 0;
      continue;
    }
    if (t.strain < FLOOR.warning) continue;
    t.warning++;
    if ((t.warning === 1 || t.warning % 90 === 0) && g.frame - floor.lastTremor >= 75 && Math.hypot(tr.pos.x - t.x, tr.pos.z - t.z) <= 15) {
      floor.lastTremor = g.frame;
      g.events.emit('FloorTremor', { at: { x: t.x, y: g.world.ground(t.x, t.z), z: t.z }, strength: 0.12 });
    }
    if (t.strain >= 1 && t.warning >= FLOOR.warningFrames) {
      t.collapsed = true;
      fallen++;
      if (Math.hypot(tr.pos.x - t.x, tr.pos.z - t.z) <= 15 && g.frame - floor.lastTremor >= 30) {
        floor.lastTremor = g.frame;
        g.events.emit('FloorTremor', { at: { x: t.x, y: g.world.ground(t.x, t.z), z: t.z }, strength: 0.24 });
      }
    }
  }
}
