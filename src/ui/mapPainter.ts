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
  /** Paints `realm` on `view`; `full`: the full map, with its names; `you`: the investigator's arrow (not on another realm than theirs). The marks drawn, the first underneath. */
  paint(ctx: CanvasRenderingContext2D, view: MapView, realm: readonly RegionDef[], full: boolean, you?: boolean): readonly Mark[];
}

const FOG = '#11100f';

interface Veil {
  canvas: HTMLCanvasElement;
  mask: HTMLCanvasElement;
  art: Art;
  artVersion: number;
  seenVersion: number;
}

/** Deterministic PRNG for consistent antique survey paper grain. */
function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The unknown: aged charcoal-parchment field chart with seamless paper tooth, surveyor grid, and intersection ticks. */
function fogPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const tile = document.createElement('canvas');
  const S = 128;
  [tile.width, tile.height] = [S, S];
  const t = tile.getContext('2d')!;
  const rnd = mulberry(1928070);
  const img = t.createImageData(S, S);
  const d = img.data;
  const tau = Math.PI * 2;
  for (let y = 0; y < S; y++) {
    const ty = (y / S) * tau;
    for (let x = 0; x < S; x++) {
      const tx = (x / S) * tau;
      // Seamless periodic paper mottling (wraps cleanly across tile edges)
      const cloud =
        0.5 * Math.sin(tx + 0.6) * Math.cos(ty - 0.4) +
        0.3 * Math.cos(2 * tx - ty + 1.2) +
        0.2 * Math.sin(tx + 2 * ty - 0.8);
      const grain = (rnd() - 0.5) * 4.2 + cloud * 2.6;
      const i = (y * S + x) * 4;
      d[i] = Math.max(8, Math.min(28, Math.round(17 + grain * 1.08)));
      d[i + 1] = Math.max(8, Math.min(26, Math.round(16 + grain)));
      d[i + 2] = Math.max(8, Math.min(25, Math.round(15 + grain * 0.86)));
      d[i + 3] = 255;
    }
  }
  t.putImageData(img, 0, 0);
  // Subtle horizontal & vertical paper-fibre flecks
  for (let i = 0; i < 140; i++) {
    const a = 0.014 + 0.024 * rnd();
    t.fillStyle = rnd() > 0.35 ? `rgba(217,208,184,${a.toFixed(3)})` : `rgba(0,0,0,${(a * 2).toFixed(3)})`;
    t.fillRect(Math.floor(rnd() * S), Math.floor(rnd() * S), rnd() > 0.75 ? 3 : 1, 1);
  }
  // Minor and major surveyor grid lines
  t.fillStyle = 'rgba(217,208,184,0.024)';
  t.fillRect(0, S / 2, S, 1);
  t.fillRect(S / 2, 0, 1, S);
  t.fillStyle = 'rgba(217,208,184,0.055)';
  t.fillRect(0, 0, S, 1);
  t.fillRect(0, 0, 1, S);
  // Subtle engraved '+' crosshairs at major intersections
  t.fillStyle = 'rgba(168,147,95,0.16)';
  t.fillRect(0, 0, 5, 1);
  t.fillRect(S - 4, 0, 4, 1);
  t.fillRect(0, 0, 1, 5);
  t.fillRect(0, S - 4, 1, 4);
  return ctx.createPattern(tile, 'repeat');
}

/** Faint antique survey rhumb lines and double-ink chart frame drawn across the full map canvas. */
function drawChartChrome(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  // Subtle compass rose rhumb lines radiating softly from off-center
  const [rx, ry] = [w * 0.5, h * 0.52];
  const maxR = Math.hypot(w, h) * 0.65;
  ctx.strokeStyle = 'rgba(168,147,95,0.045)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    ctx.moveTo(rx + Math.cos(a) * 32, ry + Math.sin(a) * 32);
    ctx.lineTo(rx + Math.cos(a) * maxR, ry + Math.sin(a) * maxR);
  }
  ctx.stroke();
  for (const rad of [Math.min(w, h) * 0.28, Math.min(w, h) * 0.46]) {
    ctx.beginPath();
    ctx.arc(rx, ry, rad, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Soft warm edge vignette
  const v = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.3, w * 0.5, h * 0.5, Math.hypot(w, h) * 0.58);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(4,4,6,0.58)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  // Double antique hairline border inside the viewport
  ctx.strokeStyle = 'rgba(168,147,95,0.22)';
  ctx.strokeRect(10.5, 10.5, w - 21, h - 21);
  ctx.strokeStyle = 'rgba(217,208,184,0.09)';
  ctx.strokeRect(14.5, 14.5, w - 29, h - 29);
  ctx.restore();
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
    paint(ctx, view, realm, full, you = true) {
      const ow = g.overworld;
      if (typeof fog === 'string') fog = fogPattern(ctx) ?? FOG;
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, view.w, view.h);
      if (full) drawChartChrome(ctx, view.w, view.h);
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
      if (you) drawMark(ctx, 'you', sx(tr.pos.x) + s2.dx, sy(tr.pos.z) + s2.dy, unit * 1.05, { turn: -tr.yaw });
      return marks;
    },
  };
}
