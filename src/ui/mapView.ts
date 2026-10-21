/** A view of the map (playtest round 1): where it is centred and how large the world is drawn, and where a world point falls on it. */

export interface MapView {
  cx: number; // world point at the centre
  cz: number;
  scale: number; // pixels a metre
  w: number;
  h: number;
}

/**
 * Where a world point falls on a view (pixels). The world is drawn as the investigator sees it
 * (playtest round 13: the map was its mirror, so the minimap turned against the camera): facing
 * north (+z), +x lies on the left, so +x is drawn to the left.
 */
export const screenX = (view: MapView, x: number): number => (view.cx - x) * view.scale + view.w / 2;
export const screenY = (view: MapView, z: number): number => (view.cz - z) * view.scale + view.h / 2;
