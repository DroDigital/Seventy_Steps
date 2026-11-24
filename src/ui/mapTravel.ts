/**
 * Fast travel from the full map (playtest round 7): a lit Elder Sign of the realm on show is picked
 * under the mouse or pad cursor, or in a direction from where
 * the map is centred (the pad's d-pad, or the stick once R3 has locked on), or in turn (nearest the
 * investigator first) with Tab or the pad's shoulders. The one chosen glows in a breathing ring, bone in Cosmic Purple like the veil's
 * sign; A travels to the hovered sign, and a second click or Enter travels to a mouse or keyboard choice, unless the words
 * say why not (checkpoints.ts's travelBar: a boss fight on, a foe hunting close by).
 */

import { t } from '../core/i18n';
import { distXZ, type XZ } from '../core/geom';
import type { Key } from '../data/lang/en';
import type { RegionDef } from '../data/regions';
import { INPUT } from '../data/tuning';
import type { Game } from '../systems/components';
import { mapPlaces, type MapPlace } from '../world/mapData';
import { screenX, screenY, worldX, worldZ, type MapView } from './mapView';

const PICK_PX = 14; // a sign this near the pointer is picked
/** Why a journey may not be made, as the map's bar says it: a fight on, a foe hunting close by, the investigator fallen, or (round 56) a sign beyond the demo's realms. */
const BAR_WORDS = { boss: 'travel.boss', foes: 'travel.foes', fallen: 'travel.fallen', demo: 'travel.demo' } as const satisfies Record<string, Key>;
export type BarWord = keyof typeof BAR_WORDS;
export const barWord = (bar: BarWord): string => t(BAR_WORDS[bar]);

/** The lit Elder Signs of the realm, nearest `from` first. */
export function litSigns(g: Game, realm: readonly RegionDef[], from: XZ): MapPlace[] {
  const ids = new Set(realm.map((r) => r.id));
  return mapPlaces()
    .filter((p) => p.kind === 'sign' && ids.has(p.region) && !!g.overworld?.discovered.has(p.id))
    .sort((a, b) => distXZ(a, from) - distXZ(b, from));
}

const screenOf = (view: MapView, p: XZ): [number, number] => [screenX(view, p.x), screenY(view, p.z)];

/**
 * The lit sign most nearly in a screen direction from `from` (y grows down the canvas), other than
 * the one already there. A press that points at nothing in that quarter returns null.
 */
export function signToward(signs: readonly MapPlace[], view: MapView, from: XZ, dir: { x: number; y: number }): MapPlace | null {
  const [fx, fy] = screenOf(view, from);
  const len = Math.hypot(dir.x, dir.y) || 1;
  const [dx, dy] = [dir.x / len, dir.y / len];
  let best: MapPlace | null = null;
  let bestScore = Infinity;
  for (const p of signs) {
    const [x, y] = screenOf(view, p);
    const [ox, oy] = [x - fx, y - fy];
    const d = Math.hypot(ox, oy);
    if (d < 8) continue; // the sign the view is already on
    const dot = (ox * dx + oy * dy) / d;
    if (dot < 0.5) continue; // outside a quarter turned a little past the diagonals
    const score = d / (dot * dot); // nearer, and more nearly straight, wins
    if (score < bestScore) [best, bestScore] = [p, score];
  }
  return best;
}

/** The lit sign nearest a point in the world, or null when none are lit. What R3 locks on to when the mark sits on none. */
export function signNearest(signs: readonly MapPlace[], from: XZ): MapPlace | null {
  let best: MapPlace | null = null;
  let bestD = Infinity;
  for (const p of signs) {
    const d = distXZ(p, from);
    if (d < bestD) [best, bestD] = [p, d];
  }
  return best;
}

const STICK_FLICK = 0.55; // a push this far switches; a lighter tilt does not
const STICK_REARM = 0.32; // the stick must come back under this before the next push switches

/**
 * One sign along a stick push, then none until the stick comes back. `armed` is that rest.
 * The stick is in screen space (x right, y down), the same frame `signToward` reads.
 */
export function stickSwitch(armed: boolean, signs: readonly MapPlace[], view: MapView, from: XZ, stick: { x: number; y: number }): { armed: boolean; next: MapPlace | null } {
  const mag = Math.hypot(stick.x, stick.y);
  if (mag >= STICK_FLICK) return { armed: false, next: armed ? signToward(signs, view, from, stick) : null };
  return { armed: mag < STICK_REARM || armed, next: null };
}

const PAN = 0.48; // screen widths a second at a full stick, for both the cursor and the chart
const ZOOM = Math.log(1.03) * 60; // the old per-frame 1.03, as a rate, so a frame rate does not change how fast the map zooms

/** How far a trigger is pulled, 0 when it is up. A digital press with no analog value counts as full. */
export function triggerHeld(b: { pressed: boolean; value: number } | undefined): number {
  if (!b || !(b.pressed || b.value > 0.5)) return 0;
  return Math.min(1, Math.max(0.35, b.value > 0 ? b.value : 1));
}

/** The zoom multiplier for this slice of a second: above 1 zooms in, below 1 zooms out. */
export function mapZoom(into: number, out: number, dt: number): number {
  const z = Math.min(1, Math.max(0, into)) - Math.min(1, Math.max(0, out));
  return z === 0 ? 1 : Math.exp(z * ZOOM * dt);
}

interface MapPoint {
  x: number;
  y: number;
}

export interface PadMapView extends MapView {
  locked: boolean;
  armed: boolean;
  aim: MapPoint;
}

interface PadSteering {
  stick: MapPoint;
  pan: MapPoint;
  lock: boolean;
  dpad: MapPoint | null;
  zoomIn: number;
  zoomOut: number;
}

function stickStep(stick: MapPoint, step: number): MapPoint | null {
  if (Math.hypot(stick.x, stick.y) <= INPUT.deadzone) return null;
  return { x: stick.x * step, y: stick.y * step };
}

/**
 * The left stick moves the cursor and pans past the edge. The right stick pans under the cursor.
 * R3 locks the hovered or nearest sign, then the left stick flicks between signs. The d-pad
 * jumps to the next sign in its direction in either mode.
 */
export function steerPad(
  current: PadMapView,
  input: PadSteering,
  dt: number,
  signs: readonly MapPlace[],
  pickPx: number,
): { view: PadMapView; zoom: number; focus: MapPlace | null } {
  const view = { ...current };
  const { w, h, scale } = view;
  const { stick, pan, lock, dpad, zoomIn, zoomOut } = input;
  const take = (p: MapPlace | null): MapPlace | null => {
    if (!p) return null;
    [view.cx, view.cz] = [p.x, p.z];
    view.aim = { x: w / 2, y: h / 2 };
    return p;
  };

  if (!view.locked) {
    const step = PAN * w * dt;
    const scroll = stickStep(pan, step);
    if (scroll) {
      view.cx -= scroll.x / scale;
      view.cz -= scroll.y / scale;
    }
    const move = stickStep(stick, step);
    if (move) {
      const x = view.aim.x + move.x;
      const y = view.aim.y + move.y;
      view.aim = { x: Math.max(0, Math.min(w, x)), y: Math.max(0, Math.min(h, y)) };
      view.cx -= (x - view.aim.x) / scale;
      view.cz -= (y - view.aim.y) / scale;
    }
  }
  let focus: MapPlace | null = null;
  const atAim = () => ({ x: worldX(view, view.aim.x), z: worldZ(view, view.aim.y) });
  if (dpad) {
    const on = signAt(signs, view, view.aim.x, view.aim.y, pickPx);
    focus = take(signToward(signs, view, on ?? atAim(), dpad));
  }
  if (lock) {
    if (view.locked) view.locked = false;
    else {
      const under = signNearest(signs, atAim());
      if (under) {
        focus = take(under);
        view.locked = true;
        view.armed = Math.hypot(stick.x, stick.y) < STICK_REARM;
      }
    }
  }
  if (view.locked) {
    const step = stickSwitch(view.armed, signs, view, atAim(), stick);
    view.armed = step.armed;
    focus = take(step.next) ?? focus;
  }
  return { view, zoom: mapZoom(zoomIn, zoomOut, dt), focus };
}

/** The lit sign nearest a point on the canvas (pixels), within PICK_PX, if any. */
export function signAt(signs: readonly MapPlace[], view: MapView, px: number, py: number, within = PICK_PX): MapPlace | null {
  let best: MapPlace | null = null;
  let bestD = within;
  for (const p of signs) {
    const [x, y] = screenOf(view, p);
    const d = Math.hypot(x - px, y - py);
    if (d < bestD) [best, bestD] = [p, d];
  }
  return best;
}

/** A ring about a sign: breathing and glowing for the one chosen (grey when barred), faint under the pointer; `k`, the UI's scale. */
export function drawRing(ctx: CanvasRenderingContext2D, view: MapView, p: XZ, chosen: boolean, barred: boolean, now: number, k = 1): void {
  const [x, y] = screenOf(view, p);
  const breath = 0.5 + 0.5 * Math.sin(now / 260);
  ctx.save();
  ctx.lineWidth = chosen ? 2 : 1;
  ctx.strokeStyle = barred ? '#8a8474' : chosen ? '#d9d0b8' : '#d9d0b899';
  ctx.shadowColor = barred ? '#000' : '#9a3cff';
  ctx.shadowBlur = chosen ? 10 + 8 * breath : 4;
  ctx.beginPath();
  ctx.arc(x, y, (chosen ? 12 + 2 * breath : 11) * k, 0, Math.PI * 2);
  ctx.stroke();
  if (chosen) {
    for (let i = 0; i < 4; i++) { // four ticks turning slowly about it, like a compass rose
      const a = now / 1800 + (i * Math.PI) / 2;
      const [r0, r1] = [(16 + 2 * breath) * k, (21 + 2 * breath) * k];
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
      ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
      ctx.stroke();
    }
  }
  ctx.restore();
}
