/**
 * The points of interest on the map (round 61; systems/pois.ts): a grey "?" where ground near one has been charted and it has not been
 * found; once found, a mark of its kind in bone (dim once its chest is taken): a ring for a tale, a square for a hoard, a triangle
 * for a rite, a star for an anomaly, a cross for a den. Only within the realm on show; on the minimap nothing is named.
 */

import type { RegionDef } from '../data/regions';
import { poiMark, poiCount } from '../systems/pois';
import type { Game } from '../systems/components';
import { poiSitesOf } from '../world/poiSites';
import type { PoiKind } from '../data/pois';
import { BONE } from './hudKit';
import { screenX, screenY, type MapView } from './mapPainter';
import { slip, SLIDE } from './mapWrong';
import { uiScale } from './uiScale';

const DIM = '#8a8474';

/** The secrets found and told of in `realm`, for the map's heading. */
export function poiTotals(g: Game, realm: readonly RegionDef[]): { found: number; of: number } {
  return realm.reduce((n, r) => ((c) => ({ found: n.found + c.found, of: n.of + c.of }))(poiCount(g, r.id)), { found: 0, of: 0 });
}

function shape(ctx: CanvasRenderingContext2D, kind: PoiKind): void {
  ctx.beginPath();
  if (kind === 'tale') {
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.moveTo(1, 0);
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
  } else if (kind === 'hoard') {
    ctx.rect(-4, -3.5, 8, 7);
    ctx.moveTo(-4, -0.5);
    ctx.lineTo(4, -0.5);
  } else if (kind === 'rite') {
    ctx.moveTo(0, -5);
    ctx.lineTo(4.6, 3.5);
    ctx.lineTo(-4.6, 3.5);
    ctx.closePath();
  } else if (kind === 'anomaly') {
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 4;
      ctx.moveTo(Math.sin(a) * -5, Math.cos(a) * -5);
      ctx.lineTo(Math.sin(a) * 5, Math.cos(a) * 5);
    }
  } else {
    ctx.moveTo(-4, -4);
    ctx.lineTo(4, 4);
    ctx.moveTo(4, -4);
    ctx.lineTo(-4, 4);
  }
}

export function drawPois(ctx: CanvasRenderingContext2D, view: MapView, g: Game, realm: readonly RegionDef[], names: boolean, turn = 0): void { // `turn`: how far the view is turned, which the marks turn back
  const [sanity, bucket] = [g.mind.sanity, Math.floor(performance.now() / 1000 / SLIDE)];
  const k = uiScale();
  ctx.save();
  ctx.textAlign = 'center';
  for (const r of realm) {
    for (const s of poiSitesOf(r.id)) {
      const mark = poiMark(g, s);
      if (mark === 'hidden') continue;
      const off = slip(`poi:${s.def.id}`, sanity, bucket); // a failing mind's map slides, these among the rest
      const [x, y] = [screenX(view, s.x) + off.dx, screenY(view, s.z) + off.dy];
      if (x < -20 || y < -20 || x > view.w + 20 || y > view.h + 20) continue;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-turn);
      if (mark === 'rumour') {
        ctx.font = `bold ${Math.round(13 * k)}px monospace`;
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        ctx.strokeText('?', 0, 0);
        ctx.fillStyle = DIM;
        ctx.fillText('?', 0, 0);
      } else {
        shape(ctx, s.def.kind);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#000';
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = mark === 'spent' ? DIM : BONE;
        ctx.stroke();
        if (names) {
          ctx.font = `${Math.round(8.5 * k)}px monospace`;
          ctx.textBaseline = 'top';
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#000';
          ctx.strokeText(s.def.name.toUpperCase(), 0, 8);
          ctx.fillStyle = DIM;
          ctx.fillText(s.def.name.toUpperCase(), 0, 8);
        }
      }
      ctx.restore();
    }
  }
  ctx.restore();
}
