/**
 * Suspension, engine vibration, gearbox, canopy inertia and lamp response for the Brassbound Motor Car.
 * Pure kinematics/dynamics (no Three.js) so the car's living mechanical motion is deterministic and unit-tested.
 */
import { MOUNT_TRAVERSAL } from '../data/mounts';
import { GEARS, engineNote } from './audio/mountBed';

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export interface CarDynamics {
  lastSpeed: number;
  accel: number; // smoothed longitudinal acceleration (m/s²), positive accelerating, negative braking
  brake: number; // 0..1 braking intensity
  gear: number; // 0..3 (1st through 4th)
  shiftAge: number; // seconds since last gear change
  shiftDir: number; // +1 upshift, -1 downshift
  heave: number;
  heaveVel: number;
  pitch: number;
  pitchVel: number;
  roll: number;
  rollVel: number;
  canopyPitch: number;
  canopyPitchVel: number;
  canopyRoll: number;
  canopyRollVel: number;
  enginePhase: number; // radians integrated from firing frequency
  fanAngle: number; // radians for radiator cooling fan
  shifterAngle: number; // current gear-lever pitch angle (radians)
  steerSmooth: number; // smoothed steering input (-1..1)
}

export interface CarPose {
  /** Body suspension offset and attitude (radians) layered over terrain pitch/roll. */
  heave: number;
  pitch: number;
  roll: number;
  /** Subtle high-frequency 4-cylinder engine shudder on body and front bonnet/crank. */
  vibeY: number;
  vibeRoll: number;
  hoodVibe: number;
  /** Canopy secondary spring lag and wind flutter (radians). */
  canopyPitch: number;
  canopyRoll: number;
  /** Mechanical animations. */
  fanAngle: number;
  steerAngle: number; // front wheel yaw (rad)
  wheelSpinSteer: number; // steering wheel Z rotation (rad)
  tieRodX: number; // lateral tie-rod shift (metres)
  shifterAngle: number; // brass gear-lever tilt (rad)
  /** Lighting response. */
  gear: number;
  brake: number;
  lampFlicker: number; // ~0.92..1.08 acetylene gas shimmer
  tailGain: number; // ruby tail-lamp intensity (brighter when braking)
}

const GEAR_ANGLES = [-0.26, -0.09, 0.09, 0.27] as const;
const SHIFT_HYSTERESIS = 0.24; // m/s buffer so riding right on a shift point never chatters

export function createCarDynamics(): CarDynamics {
  return {
    lastSpeed: 0,
    accel: 0,
    brake: 0,
    gear: 0,
    shiftAge: 10,
    shiftDir: 0,
    heave: 0,
    heaveVel: 0,
    pitch: 0,
    pitchVel: 0,
    roll: 0,
    rollVel: 0,
    canopyPitch: 0,
    canopyPitchVel: 0,
    canopyRoll: 0,
    canopyRollVel: 0,
    enginePhase: 0,
    fanAngle: 0,
    shifterAngle: GEAR_ANGLES[0],
    steerSmooth: 0,
  };
}

/** Gear index (0..3) with gentle hysteresis around `GEARS` thresholds. */
export function gearWithHysteresis(current: number, speed: number): number {
  let g = clamp(Math.round(current), 0, GEARS.length - 2);
  while (g < GEARS.length - 2 && speed >= GEARS[g + 1]! + SHIFT_HYSTERESIS) g++;
  while (g > 0 && speed < GEARS[g]! - SHIFT_HYSTERESIS) g--;
  return g;
}

function stepSpring(x: number, v: number, target: number, hz: number, damp: number, dt: number): [number, number] {
  const w = Math.PI * 2 * hz;
  const a = -w * w * (x - target) - 2 * damp * w * v;
  const nv = v + a * dt;
  return [x + nv * dt, nv];
}

export function stepCarDynamics(
  s: CarDynamics,
  input: { time: number; dt: number; speed: number; steer: number; distance: number },
): CarPose {
  const dt = clamp(input.dt, 0, 0.1);
  const speed = Math.max(0, input.speed);
  const normSpeed = clamp(speed / MOUNT_TRAVERSAL.gallop, 0, 1.2);
  const moving = clamp(speed / 1.8, 0, 1);

  if (dt > 0) {
    const rawAccel = clamp((speed - s.lastSpeed) / dt, -18, 14);
    s.accel += (rawAccel - s.accel) * Math.min(1, dt * 9);
    s.steerSmooth += (clamp(input.steer, -1, 1) - s.steerSmooth) * Math.min(1, dt * 11);
    const targetBrake = rawAccel < -1.2 && speed > 0.4 ? clamp((-rawAccel - 1.2) / 9, 0, 1) : 0;
    s.brake += (targetBrake - s.brake) * Math.min(1, dt * (targetBrake > s.brake ? 14 : 6));
  } else {
    s.steerSmooth = clamp(input.steer, -1, 1);
  }
  s.lastSpeed = speed;

  // Gear selection and tactile shift lurch impulse
  const nextGear = speed < 0.25 ? 0 : gearWithHysteresis(s.gear, speed);
  if (nextGear !== s.gear && dt > 0) {
    s.shiftDir = nextGear > s.gear ? 1 : -1;
    s.gear = nextGear;
    s.shiftAge = 0;
    // Brief torque-interruption forward dip on upshift, slight kickback on downshift
    s.pitchVel += s.shiftDir > 0 ? 0.34 : -0.22;
    s.heaveVel -= 0.055;
  }
  s.shiftAge = Math.min(10, s.shiftAge + dt);

  const firingHz = engineNote(speed);
  const rpmRatio = clamp((firingHz - 22) / 60, 0, 1);
  if (dt > 0) {
    s.enginePhase = (s.enginePhase + firingHz * Math.PI * 2 * dt) % (Math.PI * 2 * 1000);
    s.fanAngle = (s.fanAngle + (9 + rpmRatio * 28) * dt) % (Math.PI * 2);
  }

  // Target chassis squat (accel -> nose up -> negative X rotation in +z forward), brake dive (nose down -> positive X rotation), corner roll
  const roadRipple =
    (Math.sin(input.distance * 5.8) * 0.015 +
      Math.sin(input.distance * 11.3 + 0.9) * 0.008 +
      Math.sin(input.distance * 17.9 + 2.1) * 0.004) *
    moving;
  const targetHeave = roadRipple - s.brake * 0.014;
  // In Three.js +z forward, +y up: positive rotation.x dips the nose (+z) downward!
  const targetPitch = clamp(-s.accel * 0.0068 + s.brake * 0.022 + Math.sin(input.distance * 4.7) * 0.007 * moving, -0.068, 0.085);
  // Left turn (+steer) rolls body outward to the right (-x -> negative rotation.z in right-handed +z forward)
  const targetRoll = clamp(-s.steerSmooth * (0.016 + 0.052 * normSpeed) + Math.sin(input.distance * 6.3 + 1.4) * 0.006 * moving, -0.09, 0.09);

  // Sub-step suspension springs cleanly so any dt stays rock-stable
  const steps = dt > 0 ? Math.max(1, Math.ceil(dt / (1 / 120))) : 0;
  const h = steps > 0 ? dt / steps : 0;
  for (let i = 0; i < steps; i++) {
    [s.heave, s.heaveVel] = stepSpring(s.heave, s.heaveVel, targetHeave, 2.7, 0.42, h);
    [s.pitch, s.pitchVel] = stepSpring(s.pitch, s.pitchVel, targetPitch, 2.35, 0.38, h);
    [s.roll, s.rollVel] = stepSpring(s.roll, s.rollVel, targetRoll, 2.15, 0.4, h);
    // Canopy lags softly behind body attitude & buffets gently in wind at speed
    const windBuffet = normSpeed * normSpeed * 0.009 * Math.sin(input.time * 13.7 + input.distance * 0.4);
    const canopyTargetPitch = clamp(s.pitch * 0.32 + (s.accel * -0.0022) + windBuffet, -0.045, 0.05);
    const canopyTargetRoll = clamp(s.roll * 0.45 - s.steerSmooth * 0.018 * normSpeed, -0.06, 0.06);
    [s.canopyPitch, s.canopyPitchVel] = stepSpring(s.canopyPitch, s.canopyPitchVel, canopyTargetPitch, 3.1, 0.32, h);
    [s.canopyRoll, s.canopyRollVel] = stepSpring(s.canopyRoll, s.canopyRollVel, canopyTargetRoll, 2.8, 0.3, h);
  }
  s.heave = clamp(s.heave, -0.07, 0.07);
  s.pitch = clamp(s.pitch, -0.1, 0.11);
  s.roll = clamp(s.roll, -0.11, 0.11);
  s.canopyPitch = clamp(s.canopyPitch, -0.06, 0.06);
  s.canopyRoll = clamp(s.canopyRoll, -0.075, 0.075);

  // Gear lever smooth throw to current gear gate (+ brief notch click during shift)
  const targetShift = speed < 0.25 ? -0.34 : GEAR_ANGLES[s.gear]!;
  if (dt > 0) s.shifterAngle += (targetShift - s.shifterAngle) * Math.min(1, dt * 16);
  else s.shifterAngle = targetShift;

  // Vintage inline-4 mechanical tremor: lively irregular lope at idle, tauter hum at speed
  const idleShare = 1 - 0.68 * moving;
  const lope = 0.78 + 0.22 * Math.sin(input.time * 11.2) * Math.sin(input.time * 4.3 + 0.8);
  const shiftFlare = s.shiftAge < 0.22 ? Math.sin((s.shiftAge / 0.22) * Math.PI) * 0.55 : 0;
  const amp = (0.0046 * idleShare * lope + 0.0016 * moving) * (1 + shiftFlare);
  const p = s.enginePhase;
  const vibeY = (Math.sin(p) * 0.65 + Math.sin(p * 2 + 0.5) * 0.35) * amp;
  const vibeRoll = Math.sin(p * 0.5 + 0.3) * amp * 1.45;
  const hoodVibe = (Math.sin(p * 1.0 + 0.2) * 0.6 + Math.sin(p * 2.0) * 0.4) * amp * 1.85;

  // Acetylene gas-lamp warm flicker + braking ruby tail-lamp boost
  const lampFlicker = 1 + 0.045 * Math.sin(input.time * 16.5) * Math.sin(input.time * 6.3 + 1.2) + 0.025 * Math.sin(input.time * 29.1);
  const tailGain = 0.48 + s.brake * 0.72 + (speed < 0.3 ? 0.08 : 0);

  const steerAngle = s.steerSmooth * 0.4;
  return {
    heave: s.heave,
    pitch: s.pitch,
    roll: s.roll,
    vibeY,
    vibeRoll,
    hoodVibe,
    canopyPitch: s.canopyPitch,
    canopyRoll: s.canopyRoll,
    fanAngle: s.fanAngle,
    steerAngle,
    wheelSpinSteer: -s.steerSmooth * 0.92 + vibeRoll * 2.4,
    tieRodX: Math.sin(steerAngle) * 0.12,
    shifterAngle: s.shifterAngle,
    gear: s.gear,
    brake: s.brake,
    lampFlicker,
    tailGain,
  };
}
