/** Camera-relative authored sprite views and timing; read-only on combat and movement. */

export type SpriteDirection = 'front' | 'left' | 'back' | 'right';
export type SpriteAction = 'idle' | 'move' | 'attack' | 'hurt' | 'stoop';
interface PositionXZ { x: number; z: number }

const QUARTER = Math.PI / 2;
export const DIRECTION_HYSTERESIS = 10 * Math.PI / 180;
const CENTERS: Record<SpriteDirection, number> = { front: 0, left: QUARTER, back: Math.PI, right: -QUARTER };
const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));
const frameCount = (count: number): number => Math.max(1, Math.floor(count));
const wrap = (angle: number): number => Math.atan2(Math.sin(angle), Math.cos(angle));

/** Yaw zero faces +z. The bearing is from the creature to the camera, not the camera's rotation. */
export function viewAngle(yaw: number, creature: PositionXZ, camera: PositionXZ): number {
  const dx = camera.x - creature.x;
  const dz = camera.z - creature.z;
  return dx === 0 && dz === 0 ? 0 : wrap(Math.atan2(dx, dz) - yaw);
}

/** Keep the previous view until it passes ten degrees beyond its 45-degree boundary. */
export function directionForAngle(angle: number, previous?: SpriteDirection, hysteresis = DIRECTION_HYSTERESIS): SpriteDirection {
  const relative = wrap(angle);
  if (previous && Math.abs(wrap(relative - CENTERS[previous])) <= Math.PI / 4 + Math.max(0, hysteresis)) return previous;
  if (Math.abs(relative) <= Math.PI / 4) return 'front';
  if (Math.abs(relative) >= Math.PI * 3 / 4) return 'back';
  return relative > 0 ? 'left' : 'right';
}

export const spriteDirection = (yaw: number, creature: PositionXZ, camera: PositionXZ, previous?: SpriteDirection): SpriteDirection =>
  directionForAngle(viewAngle(yaw, creature, camera), previous);

export interface DirectionalClip<T> {
  frames: readonly T[];
  /** Taken from the reviewed index. A right clip may already name left sources: flip exactly once. */
  mirror_horizontal: boolean;
}
export type DirectionalClips<T> = Partial<Record<SpriteDirection, Partial<Record<SpriteAction, DirectionalClip<T>>>>>;

/** Side combat art (and the colossi's stoop) is authored only from the front in this pack; keep its accepted front action and mirror flag. */
export function resolveDirectionalClip<T>(clips: DirectionalClips<T>, direction: SpriteDirection, action: SpriteAction): DirectionalClip<T> | undefined {
  const exact = clips[direction]?.[action];
  if (exact?.frames.length) return exact;
  if (action === 'attack' || action === 'hurt' || action === 'stoop') {
    const front = clips.front?.[action];
    if (front?.frames.length) return front;
  }
  return undefined;
}

/** Shared normalized phase keeps 2/4/6/8-frame directions in step, without a held wrap frame. */
export function loopFrame(time: number, count: number, cycleSeconds = 1): number {
  const n = frameCount(count);
  if (!Number.isFinite(time) || !(cycleSeconds > 0)) return 0;
  const phase = ((time % cycleSeconds) + cycleSeconds) % cycleSeconds / cycleSeconds;
  return Math.min(n - 1, Math.floor(phase * n));
}

/** Plays each authored attack pose across the existing windup, strike and recovery windows. */
export function attackFrame(frame: number, duration: number, strike: number, end: number, count: number): number {
  const n = frameCount(count);
  if (n === 1) return 0;
  if (n === 2) return frame < strike ? 0 : 1;
  const windEnd = Math.max(1, Math.floor(n / 3));
  const strikeEnd = Math.max(windEnd + 1, Math.floor(n * 2 / 3));
  const at = Math.max(0, frame);
  const segment = (progress: number, first: number, last: number): number =>
    Math.min(last - 1, first + Math.floor(clamp01(progress) * (last - first)));
  if (at < strike) return segment(at / Math.max(1, strike), 0, windEnd);
  if (at < end) return segment((at - strike) / Math.max(1, end - strike), windEnd, strikeEnd);
  return segment((at - end) / Math.max(1, duration - end), strikeEnd, n);
}

/** A reaction advances once and holds its final pose; it never loops through a living idle. */
export function reactionFrame(frame: number, duration: number, count: number): number {
  const n = frameCount(count);
  return Math.min(n - 1, Math.floor(clamp01(frame / Math.max(1, duration)) * n));
}

/** Death keeps the last hurt pose while the renderer performs its existing fade and sink. */
export const lastFrame = (count: number): number => frameCount(count) - 1;
