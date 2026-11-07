/**
 * The world editor's moves of what is held (round 110, development builds only): moved over the
 * ground's plane (along one axis, if asked), turned, sized and raised by the mouse, shown as they go
 * and kept as one patch. Pure: no Three.js.
 */

import type { Dir } from '../data/dungeons';
import { yawOfDir } from '../world/worldMap';
import type { FieldPatch } from './editorFields';
import { boxOf, type Box, type Item } from './editorItems';

export type ModeKind = 'grab' | 'turn' | 'size' | 'raise';
type V3 = readonly [number, number, number];

export interface Mode {
  kind: ModeKind;
  item: Item;
  box0: Box;
  mouse0: readonly [number, number];
  hit0: readonly [number, number] | null; // where the ray met the plane of its foot as the move began
  axis: 'x' | 'z' | null;
}

/** Where a ray meets the level plane at `y`, or null. */
export function onPlane(o: V3, d: V3, y: number): [number, number] | null {
  if (Math.abs(d[1]) < 1e-4) return null;
  const t = (y - o[1]) / d[1];
  return t > 0 && t < 2000 ? [o[0] + d[0] * t, o[2] + d[2] * t] : null;
}

export const startMode = (kind: ModeKind, item: Item, mouse: readonly [number, number], o: V3, d: V3): Mode => {
  const box0 = boxOf(item);
  return { kind, item, box0, mouse0: mouse, hit0: onPlane(o, d, box0.y), axis: null };
};

const snapTo = (v: number, step: number): number => Math.round(v / step) * step;
const DIRS: readonly Dir[] = ['n', 'e', 's', 'w'];
const nearestDir = (yaw: number): Dir => DIRS.reduce((a, b) => (Math.abs(Math.sin((yaw - yawOfDir(b)) / 2)) < Math.abs(Math.sin((yaw - yawOfDir(a)) / 2)) ? b : a));

/** The move as it stands: the box to show and the patch it would keep (null: nothing to keep). */
export function preview(m: Mode, mouse: readonly [number, number], o: V3, d: V3, snap: boolean): { box: Box; patch: FieldPatch | null } {
  const b = m.box0;
  const [mx, my] = [mouse[0] - m.mouse0[0], mouse[1] - m.mouse0[1]];
  const it = m.item;
  if (m.kind === 'grab') {
    const hit = onPlane(o, d, b.y);
    if (!hit || !m.hit0) return { box: b, patch: null };
    let [x, z] = [b.x + (m.axis === 'z' ? 0 : hit[0] - m.hit0[0]), b.z + (m.axis === 'x' ? 0 : hit[1] - m.hit0[1])];
    if (snap) [x, z] = [m.axis === 'z' ? x : snapTo(x, 0.5), m.axis === 'x' ? z : snapTo(z, 0.5)];
    const patch: FieldPatch = it.type === 'prop' ? { prop: { x, z } } : it.type === 'foe' ? { foe: { x, z } } : { site: { x, z } };
    return { box: { ...b, x, z }, patch };
  }
  if (m.kind === 'turn') {
    let yaw = b.yaw - mx * 0.01;
    if (snap) yaw = snapTo(yaw, Math.PI / 12);
    if (it.type === 'site') {
      if (!it.face) return { box: b, patch: null };
      const face = nearestDir(yaw);
      return { box: { ...b, yaw: yawOfDir(face) }, patch: { site: { face } } };
    }
    return { box: { ...b, yaw }, patch: it.type === 'prop' ? { prop: { yaw } } : { foe: { yaw } } };
  }
  if (it.type !== 'prop') return { box: b, patch: null };
  const p = it.prop;
  if (m.kind === 'size') {
    let f = Math.exp(mx * 0.006);
    if (snap) f = Math.max(0.1, snapTo(f, 0.1));
    const look = p.set ? { look: { scale: (p.set.scale ?? 1) * f } } : {};
    return { box: { ...b, hx: b.hx * f, hz: b.hz * f, h: b.h * f }, patch: { prop: { w: p.w * f, d: p.d * f, h: p.h * f, ...look } } };
  }
  let y = p.y - my * 0.02;
  if (snap) y = snapTo(y, 0.25);
  return { box: { ...b, y: b.y + (y - p.y) }, patch: { prop: { y } } };
}
