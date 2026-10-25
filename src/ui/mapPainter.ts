/**
 * Paints a view of the map (playtest round 1), for the minimap and the full map alike: the fog,
 * each region's art where it has been seen (its edges soft), the marks upon it (mapMarks.ts gathers them, mapIcons.ts draws each:
 * Elder Signs, gates, dungeon doors with an eye for a horror met within, an eye over each horror's lair, the people, the places
 * found, the Echoes left behind), the names (region, then sign, gate and dungeon, person, place) and the investigator's arrow.
 * North is up. It hands back the marks it drew, for the screen to pick among (round 60).
 */

import type { RegionDef } from '../data/regions';
import type { Game } from '../systems/components';
import { cellsOf } from '../systems/exploration';
import { regionRect } from '../world/worldMap';
import { artOf, type Art } from './mapArt';
import { drawMark } from './mapIcons';
import { stampMark } from './markSprites';
import { drawLabels, type MapLabel } from './mapLabels';
import { falseSign, gatherMarks, type Mark } from './mapMarks';
import { slip, SLIDE } from './mapWrong';
import { screenX, screenY, type MapView } from './mapView';
import { uiScale } from './uiScale';

/** The radius of a mark, pixels (the full map's grows with the UI). Round 68: 7 and 5.2 were small marks on a large map; the beacons draw at the same size. */
export const UNIT = { full: 10, mini: 7.4 } as const;

export interface MapPainter {
  /** Paints `realm` on `view`; `full`: the full map, with its names. The marks drawn, the first underneath. */
  paint(ctx: CanvasRenderingContext2D, view: MapView, realm: readonly RegionDef[], full: boolean): readonly Mark[];
}

const FOG = '#0b0b0d';

interface Veil {
  canvas: HTMLCanvasElement;
  mask: HTMLCanvasElement;
  art: Art;
  artVersion: number;
  seenVersion: number;
}

/** The unknown: a dark sheet with faint specks and the survey's ruled squares. */
function fogPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const tile = document.createElement('canvas');
  [tile.width, tile.height] = [64, 64];
  const t = tile.getContext('2d')!;
  t.fillStyle = FOG;
  t.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 90; i++) {
    t.fillStyle = `rgba(217,208,184,${0.02 + 0.04 * Math.random()})`;
    t.fillRect(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64), 1, 1);
  }
  t.fillStyle = 'rgba(217,208,184,0.035)';
  t.fillRect(0, 0, 64, 1);
  t.fillRect(0, 0, 1, 64);
  return ctx.createPattern(tile, 'repeat');
}

export function createMapPainter(g: Game): MapPainter {
  const seen = new Map<string, number>(); // region → how often more of it has been seen
  g.events.on('Explored', ({ region }) => void seen.set(region, (seen.get(region) ?? 0) + 1));
  const veils = new Map<string, Veil>();
  let fog: CanvasPattern | string = FOG;

  /** The region's art, with only what has been seen showing (rebuilt as either changes). */
  function veiled(r: RegionDef): HTMLCanvasElement | null {
    const ex = g.overworld?.explored.get(r.id);
    if (!ex) return null;
    let v = veils.get(r.id);
    if (!v) {
      const art = artOf(r);
      const { cols, rows } = cellsOf(r);
      const canvas = document.createElement('canvas');
      [canvas.width, canvas.height] = [art.canvas.width, art.canvas.height];
      const mask = document.createElement('canvas');
      [mask.width, mask.height] = [cols + 2, rows + 2]; // a border cell each side, copied from the edge, so the blur leaves no seam between regions
      veils.set(r.id, (v = { canvas, mask, art, artVersion: -1, seenVersion: -1 }));
    }
    const now = seen.get(r.id) ?? 0;
    if (v.artVersion === v.art.version && v.seenVersion === now) return v.canvas;
    [v.artVersion, v.seenVersion] = [v.art.version, now];
    const m = v.mask.getContext('2d')!;
    const [mw, mh] = [v.mask.width, v.mask.height];
    const [cols, rows] = [mw - 2, mh - 2];
    const img = m.createImageData(mw, mh);
    for (let y = 0; y < mh; y++) {
      const iz = Math.min(rows - 1, Math.max(0, rows - y)); // north row first; border rows copy their neighbours
      for (let x = 0; x < mw; x++) img.data[(y * mw + x) * 4 + 3] = ex[iz * cols + Math.min(cols - 1, Math.max(0, x - 1))] ? 255 : 0;
    }
    m.putImageData(img, 0, 0);
    const cell = v.canvas.width / cols;
    const c = v.canvas.getContext('2d')!;
    c.globalCompositeOperation = 'copy';
    c.drawImage(v.art.canvas, 0, 0);
    c.globalCompositeOperation = 'destination-in';
    c.imageSmoothingEnabled = true;
    c.filter = 'blur(5px)'; // the fog's edge soft, not stepped cell by cell
    c.drawImage(v.mask, -cell, -cell, v.canvas.width + 2 * cell, v.canvas.height + 2 * cell);
    c.filter = 'none';
    c.globalCompositeOperation = 'source-over';
    return v.canvas;
  }

  return {
    paint(ctx, view, realm, full) {
      const ow = g.overworld;
      if (typeof fog === 'string') fog = fogPattern(ctx) ?? FOG;
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, view.w, view.h);
      if (!ow) return [];
      const sx = (x: number): number => screenX(view, x);
      const sy = (z: number): number => screenY(view, z);
      ctx.imageSmoothingEnabled = view.scale < 1;
      for (const r of realm) {
        const rc = regionRect(r);
        const [x0, y0, x1, y1] = [sx(rc.x1), sy(rc.z1), sx(rc.x0), sy(rc.z0)];
        if (x1 < 0 || y1 < 0 || x0 > view.w || y0 > view.h) continue;
        const img = veiled(r);
        if (!img) continue;
        ctx.save(); // the art is drawn west to east; the map shows it mirrored, as the world is seen
        ctx.translate(x1, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, -0.5, y0 - 0.5, x1 - x0 + 1, y1 - y0 + 1); // half a pixel over, so no seam shows between regions
        ctx.restore();
      }
      const k = uiScale(); // the names and the marks of the full map grow with the UI
      const unit = full ? UNIT.full * k : UNIT.mini;
      const { marks, labels } = gatherMarks(g, view, realm, full, unit, k);
      for (const m of marks) stampMark(ctx, m.kind, m.x, m.y, m.r, m.state);
      for (const m of marks) if (m.badge) stampMark(ctx, 'boss', m.x + m.r * 0.95, m.y - m.r * 0.95, m.r * 0.55, { slain: m.badge === 'slain' }); // a dungeon's horror
      if (full) {
        const regionNames: MapLabel[] = [];
        for (const r of realm) {
          if (!ow.explored.get(r.id)?.some((v) => v > 0)) continue;
          const rc = regionRect(r);
          regionNames.push({ text: r.name.toUpperCase(), x: sx((rc.x0 + rc.x1) / 2), y: sy(rc.z1) + 6, size: 12 * k, color: 'rgba(217,208,184,0.55)', gap: 0, centred: true });
        }
        drawLabels(ctx, [...regionNames, ...labels], marks.map((m) => ({ x: m.x, y: m.y, r: m.r * 1.2 })));
      }
      const tr = g.ecs.c.transform.get(g.player.id)!;
      const [sanity, bucket] = [g.mind.sanity, Math.floor(performance.now() / 1000 / SLIDE)];
      const s2 = slip('you', sanity, bucket);
      const lie = falseSign(g, view); // a star where there is none, for a moment of each slide
      if (lie) drawMark(ctx, 'sign', lie.x, lie.y, unit, { lit: false });
      drawMark(ctx, 'you', sx(tr.pos.x) + s2.dx, sy(tr.pos.z) + s2.dy, unit * 1.05, { turn: -tr.yaw });
      return marks;
    },
  };
}
