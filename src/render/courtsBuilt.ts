/**
 * Which open arenas' courts stand in the scene now (2026-11-27): an arena's walls, towers and set are one site, built in slices after the
 * chunks about it (worldScene.ts), while its house's gate is drawn from the start (gateViews.ts). The gate waits for its court, so it never
 * stands alone in the open. Keyed by the arena's first horror, as a gate's style is. Render only.
 */

const built = new Set<string>();

/** The world scene says an arena's court has gone into the scene, or come out of it. */
export function markCourt(boss: string, stands: boolean): void {
  if (stands) built.add(boss);
  else built.delete(boss);
}

/** Whether the court of the arena of this horror stands in the scene. */
export const courtStands = (boss: string): boolean => built.has(boss);
