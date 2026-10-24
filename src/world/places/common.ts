/** What more than one place does alike (round 71): a rectangle for an outline, and its wall in runs with a gap for the gate. */

import { MODEL_INFO } from '../../data/models/index';
import type { Court, Put, Run } from '../placeKit';

/** A rectangle's outline in the court's frame: `ahead` to the front, `side` to either side, `behind` to the back. Its front edge passes through (ahead, 0). */
export const rectOutline = (ahead: number, side: number, behind: number): [number, number][] => [[ahead, -side], [ahead, side], [-behind, side], [-behind, -side]];

/** A wall of `id` about the rectangle, closed but for the gate: the front is cut by `gate` metres to either side of its middle. Returns the runs' pieces. */
export function wallRect(c: Court, id: string, ahead: number, side: number, behind: number, gate: number, o: Run = {}): void {
  c.run(id, [ahead, -gate], [ahead, -side], o);
  c.run(id, [ahead, gate], [ahead, side], o);
  c.run(id, [ahead, side], [-behind, side], o);
  c.run(id, [ahead, -side], [-behind, -side], o);
  c.run(id, [-behind, side], [-behind, -side], o);
}

/** A column of the temple pack, stood course on course: a base, `courses` shafts and a capital, all at scale `s`, lit or not. Returns its height in metres. */
export function column(c: Court, a: number, cc: number, courses: number, o: Put = {}): number {
  const k = o.s ?? 1;
  const h = (id: string): number => { const m = MODEL_INFO[id]!; return (m.y1 - m.y0) * k * (o.stretch?.[1] ?? 1); };
  const base = o.y ?? 0;
  let y = base;
  c.add('tp_col_base', a, cc, { ...o, y });
  y += h('tp_col_base');
  for (let i = 0; i < courses; i++) { c.add('tp_col_mid', a, cc, { ...o, y }); y += h('tp_col_mid'); }
  c.add('tp_col_top', a, cc, { ...o, y, walk: true });
  return y + (MODEL_INFO.tp_col_top!.y1 - 2.4) * k - base;
}

/** A closed outline of `n` points about the fight's middle whose radius is `r(angle)`, the angle in radians from the front: the first point is the front's, (r(0), 0), where the gate stands. */
export function polar(r: (th: number) => number, n: number): [number, number][] {
  return Array.from({ length: n }, (_, i) => { const th = (2 * Math.PI * i) / n; return [Math.cos(th) * r(th), Math.sin(th) * r(th)] as [number, number]; });
}

/** A wall of `id` along a closed outline (the first point is the gate's middle), with `gate` metres to either side of it left open. */
export function wallAbout(c: Court, id: string, pts: readonly (readonly [number, number])[], gate: number, o: Run = {}): void {
  const len = (i: number): number => Math.hypot(pts[(i + 1) % pts.length]![0] - pts[i]![0], pts[(i + 1) % pts.length]![1] - pts[i]![1]);
  const total = pts.reduce((s, _, i) => s + len(i), 0);
  let at = 0;
  for (let i = 0; i < pts.length; i++) {
    const l = len(i);
    const [lo, hi] = [Math.max(at, gate), Math.min(at + l, total - gate)];
    if (hi - lo > 0.5) c.run(id, pts[i]!, pts[(i + 1) % pts.length]!, { ...o, from: (lo - at) / l, to: (hi - at) / l });
    at += l;
  }
}

/** The angle about the fight's middle, in radians from the front, folded to 0..π (so a shape may be the same either side of the gate). */
export const bearing = (th: number): number => Math.abs(Math.atan2(Math.sin(th), Math.cos(th)));
