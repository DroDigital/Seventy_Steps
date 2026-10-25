/**
 * Round 78: what the sky's parts (atm/sky.ts) can be told to show whatever the weather and the hour, for the debug panel and
 * a photograph (`window.sky.userData.atm.force`): nothing is set in a game, and none of it is kept in a save.
 */

export interface SkyForce {
  snap?: boolean; // take the ceiling and the hours at once, not eased (a software-rendered photograph has frames of seconds)
  over?: number; // the cloud ceiling, 0..1
  veil?: number; // a bank over the moon, 0..1
  phase?: number; // the night's phase, 0..1 (the afterglow, the false dawn)
  heat?: { az: number; level: number }; // heat lightning at a bearing, held at a brightness
  omen?: { amount: number; yaw?: number }; // the Alignment, held, at a bearing (default: where the eye looks)
  wrong?: number; // a failing mind's moon and stars, 0..1
}

/** The sky's parts, as they stand: read by the debug panel and the tests. */
export interface SkyAtm {
  force: SkyForce;
  over: number;
  veil: number;
  afterglow: number;
  dawn: number;
  heat: number;
  omen: number;
  swell: number;
}

export const newAtm = (): SkyAtm => ({ force: {}, over: 0, veil: 0, afterglow: 0, dawn: 0, heat: 0, omen: 0, swell: 0 });

export const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** A hash of two numbers in 0..1 (a deterministic schedule is a function of time, so a pause or a replay sees the same sky). */
export const hash2 = (n: number, k: number): number => {
  const x = Math.sin(n * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
