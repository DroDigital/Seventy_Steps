/**
 * The beacons (playtest round 4: the lead's mark, systems/lead.ts; round 60: the marker the investigator sets on the map, systems/marker.ts):
 * the place where the story leads, a diamond breathing softly (mapIcons.ts draws it), and the place marked, a verdigris pin with its point
 * on the spot. When one lies beyond the view a pointer on the edge points toward it, each in a colour and shape of its own: bone and a
 * plain head for the story, verdigris with a pin's dot behind it for the marker. On the minimap's round rim (the minimap turns with the
 * camera, and these are set upright after it: `yaw`) and, in round 60, on the full map's screen, where a mark off the screen was simply
 * out of sight and the way to it unsaid. Only within the realm on show: another realm is reached by its gate or stair, which the
 * journal's line names.
 */

import type { XZ } from '../core/geom';
import type { RegionDef } from '../data/regions';
import { regionAt } from '../world/worldMap';
import { BONE, drawMark, PIN_TIP, VERDIGRIS } from './mapIcons';
import { stampMark } from './markSprites';
import { screenX, screenY, type MapView } from './mapView';

const EDGE = 26; // pixels the full map's pointer keeps from the screen's edge

export type Beacon = 'lead' | 'marker';
export type Rim = 'round' | 'screen' | false;

export interface Placed {
  x: number;
  y: number;
  beyond: boolean; // past the view: (x, y) is on its edge, and `angle` points on toward it
  angle: number; // radians: the way from the view's middle to the place
}

/**
 * Where `at` falls on `view`, or on its edge (`rim`: the minimap's round one, or the full map's screen), or null if it lies off it and
 * there is no rim. `yaw` turns it about the view's middle, as the minimap's picture is turned (ctx.rotate(yaw)).
 */
export function beaconPlace(view: MapView, at: XZ, rim: Rim, yaw = 0): Placed | null {
  const [cx, cy] = [view.w / 2, view.h / 2];
  let [dx, dy] = [screenX(view, at.x) - cx, screenY(view, at.z) - cy];
  if (yaw) [dx, dy] = [dx * Math.cos(yaw) - dy * Math.sin(yaw), dx * Math.sin(yaw) + dy * Math.cos(yaw)];
  const d = Math.hypot(dx, dy);
  let [x, y, beyond] = [cx + dx, cy + dy, false];
  if (rim === 'round') {
    const edge = Math.min(cx, cy) - 7;
    beyond = d > edge;
    if (beyond) [x, y] = [cx + (dx / d) * edge, cy + (dy / d) * edge];
  } else if (rim === 'screen') {
    beyond = Math.abs(dx) > cx - EDGE || Math.abs(dy) > cy - EDGE;
    if (beyond) {
      const t = Math.min((cx - EDGE) / Math.abs(dx || 1e-6), (cy - EDGE) / Math.abs(dy || 1e-6));
      [x, y] = [cx + dx * t, cy + dy * t];
    }
  }
  if (!beyond && (x < -8 || y < -8 || x > view.w + 8 || y > view.h + 8)) return null;
  return { x, y, beyond, angle: Math.atan2(dy, dx) };
}

/**
 * Draws a beacon: the mark where it is on view (unless `arrowOnly`, for a mark the painter draws itself), the pointer on the edge where
 * it is beyond. `unit`: the mark's radius, pixels.
 */
export function drawBeacon(ctx: CanvasRenderingContext2D, view: MapView, at: XZ | null, realm: readonly RegionDef[], rim: Rim, unit: number, kind: Beacon, yaw = 0, arrowOnly = false): void {
  if (!at || !realm.some((r) => r.id === regionAt(at.x, at.z)?.id)) return;
  const p = beaconPlace(view, at, rim, yaw);
  if (!p) return;
  const now = performance.now();
  if (!p.beyond) {
    if (arrowOnly) return;
    if (kind === 'lead') return drawMark(ctx, 'lead', p.x, p.y, unit, { now });
    return stampMark(ctx, 'marker', p.x, p.y - PIN_TIP * unit, unit * 0.95, {}); // the pin's point on the place
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = 0.7 + 0.3 * Math.sin(now / 300);
  ctx.rotate(p.angle);
  const u = rim === 'screen' ? unit * 1.5 : unit * 0.85;
  ctx.beginPath();
  ctx.moveTo(u, 0);
  ctx.lineTo(-u * 0.6, -u * 0.8);
  ctx.lineTo(-u * 0.6, u * 0.8);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#000';
  ctx.stroke();
  ctx.fillStyle = kind === 'lead' ? BONE : VERDIGRIS;
  ctx.fill();
  if (kind === 'marker') { // a dot behind the point, a pin's: told from the story's plain pointer
    ctx.beginPath();
    ctx.arc(-u * 1.25, 0, u * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
