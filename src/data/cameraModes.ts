/**
 * The gameplay camera's three looks (round 77, asked: Classic stays the default and others are options in Settings › Play, after pictures
 * of each: docs/DECISIONS.md; the Long lens, a telephoto from far back, was taken out again at the owner's word). Classic is the boom as it was, from `CAMERA`.
 * Low hero hangs lower and closer behind the shoulder with a wider lens. Tight shoulder hangs close and over the shoulder. Low hero, locked on to a
 * foe, gathers the lens back and aims it between the investigator and the foe, further for a taller one, so that a colossus is seen whole instead
 * of the camera sitting under it (the player cannot turn the camera while locked on, so only the game can do this).
 * Every boom stays on the line the picture looks along (`rig.yaw`), which the sticks, the lock, the hurt edge and the minimap read.
 */

import { CAMERA, RENDER } from './tuning';

export type CameraMode = 'classic' | 'hero' | 'shoulder';
/** In the order of the setting's values: 0 is Classic, the default. */
export const CAMERA_MODE_IDS: readonly CameraMode[] = ['classic', 'hero', 'shoulder'];

/** How a locked-on foe is framed: its height `H` in metres (clamped to `height`) sets everything. */
export interface FrameTuning {
  follow: number; // 1/s: how fast the framing comes in and goes out (a lock lost, a lock switched)
  height: readonly [least: number, most: number]; // the foe heights the framing scales between (a colossus of 40 m is framed as 24)
  lead: number; // the share of the way to the foe the lens looks at...
  leadMax: number; // ...at most this many metres
  back: readonly [base: number, perMetre: number, least: number, most: number]; // metres the lens hangs behind the investigator
  aim: readonly [perMetre: number, least: number, most: number]; // the height of the foe the lens looks at, above its feet
  lensUp: readonly [base: number, perMetre: number, least: number, most: number]; // the lens's height above the pivot
  pitchMost: number; // rad: the boom never tilts further than this to get there
  tall: readonly [from: number, to: number]; // the heights between which the lens narrows...
  fovTall: number; // ...to this
}

export interface CameraTuning {
  pivotHeight: number;
  distance: number;
  mountDistance: number; // the boom when the investigator drives a rig
  shoulder: number;
  pitch: number;
  pitchMin: number;
  pitchMax: number;
  lockPitch: number;
  lockLift: number;
  lockPitchMax: number;
  easeOut: number; // m/s the boom grows back after a pull-in
  fov: number; // degrees, vertical
  frame: FrameTuning | null; // null: a lock only turns the boom toward the foe
}

const CLASSIC: CameraTuning = {
  pivotHeight: CAMERA.pivotHeight,
  distance: CAMERA.distance,
  mountDistance: 8.5,
  shoulder: CAMERA.shoulder,
  pitch: CAMERA.pitch,
  pitchMin: CAMERA.pitchMin,
  pitchMax: CAMERA.pitchMax,
  lockPitch: CAMERA.lockPitch,
  lockLift: CAMERA.lockLift,
  lockPitchMax: CAMERA.lockPitchMax,
  easeOut: CAMERA.easeOut,
  fov: RENDER.fovDeg,
  frame: null,
};

export const CAMERA_MODES: Record<CameraMode, CameraTuning> = {
  classic: CLASSIC,
  hero: {
    ...CLASSIC,
    pivotHeight: 1.05, // the figure's chest: the horizon sits near the middle of the picture
    distance: 4.4,
    mountDistance: 8,
    shoulder: 0.75,
    pitch: 0.04,
    lockPitch: 0.04,
    lockLift: 0.1,
    lockPitchMax: 0.3,
    easeOut: 6,
    fov: 76,
    frame: {
      follow: 2.5,
      height: [1.6, 24],
      lead: 0.5,
      leadMax: 9,
      back: [2.4, 0.6, 4.4, 12],
      aim: [0.42, 1.5, 9],
      lensUp: [0.65, 0.22, 0.75, 3.45],
      pitchMost: 0.35,
      tall: [3, 14],
      fovTall: 62,
    },
  },
  shoulder: {
    ...CLASSIC,
    pivotHeight: 1.45,
    distance: 3,
    mountDistance: 6.5,
    shoulder: 0.8, // (the picture was 2.5 m and 0.95 m: a little wider, for the left side the boom does not hang over)
    pitch: 0.06,
    lockPitch: 0.08,
    lockLift: 0.2,
    lockPitchMax: 0.4,
    easeOut: 6,
    fov: 60,
  },
};

/** The look a setting's value names (0: Classic, the default). */
export const cameraModeOf = (setting: number): CameraMode => CAMERA_MODE_IDS[Math.min(CAMERA_MODE_IDS.length - 1, Math.max(0, Math.round(setting)))]!;
