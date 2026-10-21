/**
 * The lead's mark (playtest round 4, systems/lead.ts): a diamond, breathing softly, where the story leads (mapIcons.ts draws it);
 * when that lies beyond the view, a pointer on the edge toward it: on the minimap's round rim, and (round 60) on the full map's
 * screen, where the diamond was simply out of sight and the way to it unsaid. Only within the realm on show: another realm is
 * reached by its gate or stair, which the journal's line names.
 */

import type { XZ } from '../core/geom';
import type { RegionDef } from '../data/regions';
import { regionAt } from '../world/worldMap';
import { BONE, drawMark } from './mapIcons';
import { screenX, screenY, type MapView } from './mapView';

const EDGE = 26; // pixels the full map's pointer keeps from the screen's edge

/** `rim`: where a lead beyond the view is pointed to: 'round' (the minimap's face), 'screen' (the full map's edge) or not at all. `unit`: the mark's radius, pixels. */
export function drawLead(ctx: CanvasRenderingContext2D, view: MapView, at: XZ | null, realm: readonly RegionDef[], rim: 'round' | 'screen' | false, unit = 6): void {
  if (!at || !realm.some((r) => r.id === regionAt(at.x, at.z)?.id)) return;
  let x = screenX(view, at.x);
  let y = screenY(view, at.z);
  const [cx, cy] = [view.w / 2, view.h / 2];
  const [dx, dy] = [x - cx, y - cy];
  const d = Math.hypot(dx, dy);
  let beyond = false;
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
  if (!beyond && (x < -8 || y < -8 || x > view.w + 8 || y > view.h + 8)) return;
  const now = performance.now();
  if (!beyond) return drawMark(ctx, 'lead', x, y, unit, { now });
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.7 + 0.3 * Math.sin(now / 300);
  ctx.rotate(Math.atan2(dy, dx));
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
  ctx.fillStyle = BONE;
  ctx.fill();
  ctx.restore();
}
