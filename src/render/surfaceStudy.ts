/** Optional rendering experiments. Query-only: never stored as a player's chosen look. */
export const SURFACE_STUDIES = [
  { id: 'off', name: 'Original', detail: 'The current game renderer.' },
  { id: 'carved', name: 'Carved', detail: 'Weathered relief · rough raking light' },
  { id: 'ceramic', name: 'Ceramic', detail: 'Soft forms · broad glazed highlights' },
  { id: 'facets', name: 'Facets', detail: 'Cut planes · stepped directional light' },
] as const;

export type SurfaceStudy = (typeof SURFACE_STUDIES)[number]['id'];

export function surfaceStudyIndex(flag: string | null): number {
  return Math.max(0, SURFACE_STUDIES.findIndex((study) => study.id === flag));
}
