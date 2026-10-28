/**
 * The beacons (playtest round 4: the lead's mark, systems/lead.ts; round 60: the marker the investigator sets on the map, systems/marker.ts):
 * the place where the story leads, a brass key (mapIcons.ts draws it), and the place marked, a verdigris pin with its point on the spot.
 * A marker beyond the view is a pointer on the edge. The story's lead stays the key there too, set in by its rays, with a short bone point
 * in the direction of the place: the map opens on the ground already seen, so a lead in another region used to be a plain triangle in the
 * black, which read as a stray mark. On the minimap's round rim (the minimap turns with the camera, and these are set upright after it:
 * `yaw`) and on the full map's screen. Only within the realm on show: another realm is reached by its gate or stair, which the journal's line names.
 */

import type { XZ } from '../core/geom';
import type { RegionDef } from '../data/regions';
import { regionAt } from '../world/worldMap';
import { BONE, drawMark, PIN_TIP, VERDIGRIS } from './mapIcons';
import { stampMark } from './markSprites';
import { screenX, screenY, type MapView } from './mapView';

const EDGE = 26; // pixels the full map's pointer keeps from the screen's edge
const LEAD_REACH = 1.9; // radii: the key's longest ray (mapIconsLive.ts `lead`). An off-screen lead is set in by this.
const LEAD_RIM = 0.8; // an off-screen key is a little smaller, so the point in front of it still fits the rim

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
 * there is no rim. `yaw` turns it about the view's middle, as the minimap's picture is turned (ctx.rotate(yaw)). `inset` pulls that edge
 * in by so many pixels, so a figure larger than the plain pointer (the story's key) stays whole.
 */
export function beaconPlace(view: MapView, at: XZ, rim: Rim, yaw = 0, inset = 0): Placed | null {
  const [cx, cy] = [view.w / 2, view.h / 2];
  let [dx, dy] = [screenX(view, at.x) - cx, screenY(view, at.z) - cy];
  if (yaw) [dx, dy] = [dx * Math.cos(yaw) - dy * Math.sin(yaw), dx * Math.sin(yaw) + dy * Math.cos(yaw)];
  const d = Math.hypot(dx, dy);
  let [x, y, beyond] = [cx + dx, cy + dy, false];
  if (rim === 'round') {
    const edge = Math.max(8, Math.min(cx, cy) - 7 - inset);
    beyond = d > edge;
    if (beyond && d > 0) [x, y] = [cx + (dx / d) * edge, cy + (dy / d) * edge];
  } else if (rim === 'screen') {
    const edge = Math.min(EDGE + inset, Math.min(cx, cy) - 8);
    beyond = Math.abs(dx) > cx - edge || Math.abs(dy) > cy - edge;
    if (beyond) {
      const t = Math.min((cx - edge) / Math.abs(dx || 1e-6), (cy - edge) / Math.abs(dy || 1e-6));
      [x, y] = [cx + dx * t, cy + dy * t];
    }
  }
  if (!beyond && (x < -8 || y < -8 || x > view.w + 8 || y > view.h + 8)) return null;
  return { x, y, beyond, angle: Math.atan2(dy, dx) };
}

/** A short bone point in front of an off-screen key, along `angle`, no further out than the key's own rays. */
function pointLead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, unit: number): void {
  const tip = unit * LEAD_REACH;
  const base = unit * 1.05;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(tip, 0);
  ctx.lineTo(base, -unit * 0.42);
  ctx.lineTo(base, unit * 0.42);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, unit * 0.22);
  ctx.strokeStyle = '#000';
  ctx.stroke();
  ctx.fillStyle = BONE;
  ctx.fill();
  ctx.restore();
}

/**
 * Draws a beacon: the mark where it is on view (unless `arrowOnly`, for a mark the painter draws itself), the pointer on the edge where
 * it is beyond. The story's lead is the key in both places. `unit`: the mark's radius, pixels.
 */
export function drawBeacon(ctx: CanvasRenderingContext2D, view: MapView, at: XZ | null, realm: readonly RegionDef[], rim: Rim, unit: number, kind: Beacon, yaw = 0, arrowOnly = false): void {
  if (!at || !realm.some((r) => r.id === regionAt(at.x, at.z)?.id)) return;
  const rimUnit = unit * LEAD_RIM;
  const p = beaconPlace(view, at, rim, yaw, kind === 'lead' ? rimUnit * LEAD_REACH : 0);
  if (!p) return;
  const now = performance.now();
  if (!p.beyond) {
    if (arrowOnly) return;
    if (kind === 'lead') return drawMark(ctx, 'lead', p.x, p.y, unit, { now });
    return stampMark(ctx, 'marker', p.x, p.y - PIN_TIP * unit, unit * 0.95, {}); // the pin's point on the place
  }
  if (kind === 'lead') {
    drawMark(ctx, 'lead', p.x, p.y, rimUnit, { now });
    return pointLead(ctx, p.x, p.y, p.angle, rimUnit);
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
  ctx.fillStyle = VERDIGRIS;
  ctx.fill();
  ctx.beginPath(); // a dot behind the point, a pin's: the investigator's own mark, told from the story's key
  ctx.arc(-u * 1.25, 0, u * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
