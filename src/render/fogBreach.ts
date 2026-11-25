/**
 * The breach torn in a boss fog wall when the investigator walks through it (2026-11-24): instead of making the whole wall
 * disappear, passing through opens a ragged, body-sized hole right where they cross, pushes the mist forward along their
 * walk, holds a localized sight opening only while the follow camera is still outside looking through, and then visibly
 * swirls inward and closes the hole back into a solid wall. Pure: no Three.js.
 */

import type { V3, XZ } from '../core/geom';
import { sideOf } from '../systems/fogGates';
import type { FogWall } from '../world/gatePlan';
import type { FogSightState } from './fogSight';

export type BreachPhase = 'idle' | 'tearing' | 'open' | 'closing';

export interface BreachState {
  active: boolean;
  u: number; // wall-local horizontal centre of the hole (metres)
  y: number; // wall-local vertical centre above wall foot (metres)
  rx: number; // horizontal half-width (metres; 0 = closed)
  ry: number; // vertical half-height (metres; 0 = closed)
  swirl: number; // +1 tearing outward .. -1 spiraling inward to close
  push: number; // signed wall-local z billow in walk direction (-1..+1)
  rim: number; // 0..1 intensity of displaced-mist rim around the tear
  closeProg: number; // 0 open .. 1 sealed (drives creeping closing tendrils)
  phase: BreachPhase;
  sealedNow: boolean; // true on the exact frame the hole finishes knitting shut
}

export interface FogPassInfo {
  from: XZ;
  to: XZ;
  frame: number;
  frames: number;
}

export interface FogBreach {
  /** Called when the investigator finishes walking through this wall. */
  passed(at: XZ): void;
  /** Advance one frame and compute current shader parameters for the breach. */
  update(player: V3 | undefined, pass: FogPassInfo | null, sight: FogSightState, dt: number): BreachState;
}

const HOLD_AFTER_CLEAR = 0.24; // seconds the open breach lingers once the camera clears the wall, so it is seen before closing
const CLOSE_SECONDS = 1.9; // seconds the torn hole takes to swirl inward and knit completely shut
const PEEK_SETTLE = 1.1; // seconds an idle peek hole contracts slightly toward the body while the camera remains outside
const PEEK_SHARE = 0.84; // minimum share of full hole held while the follow camera still peeks through
const BODY_Y = 1.18; // torso centre above wall foot (metres)

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function createFogBreach(w: Pick<FogWall, 'x' | 'y' | 'z' | 'yaw' | 'width' | 'height'>): FogBreach {
  const [cs, sn] = [Math.cos(w.yaw), Math.sin(w.yaw)];
  const across = (p: XZ): number => (p.x - w.x) * cs - (p.z - w.z) * sn;
  // Keep thick mist clinging to both jambs and overhead during the centred walk-through; once free movement begins while
  // the camera remains outside (`sight.blocked`), allow the sight opening to follow the ray all the way to either jamb.
  const halfW = w.width * 0.5;
  const maxRx = Math.min(1.08, Math.max(0.68, w.width * 0.3));
  const maxRy = Math.min(1.42, Math.max(1.02, w.height * 0.37));
  const maxU = Math.max(0, halfW - maxRx - 0.22);

  let phase: BreachPhase = 'idle';
  let [u, y, crossU] = [0, BODY_Y, 0];
  let [open, startOpen] = [0, 0]; // 0..1 scale of hole radii
  let [dir, push, swirl, rim] = [1, 0, 0, 0];
  let [holdTimer, closeTimer, peekTimer, closeProg] = [0, 0, 0, 0];

  /** Where the walk segment `from -> to` meets the wall's plane (wall-local u). */
  const crossingU = (from: XZ, to: XZ): number => {
    const [sa, sb] = [sideOf(w, from), sideOf(w, to)];
    const t = sa === sb ? 0.5 : clamp(sa / (sa - sb), 0, 1);
    return clamp(across({ x: from.x + (to.x - from.x) * t, z: from.z + (to.z - from.z) * t }), -maxU, maxU);
  };

  return {
    passed(at) {
      if (phase === 'idle') {
        crossU = clamp(across(at), -maxU, maxU);
        u = crossU;
        y = BODY_Y;
        dir = Math.sign(sideOf(w, at)) || 1;
        open = 1;
        rim = 0.85;
      }
      phase = 'open';
      holdTimer = HOLD_AFTER_CLEAR;
      peekTimer = 0;
      closeTimer = 0;
      closeProg = 0;
    },

    update(player, pass, sight, dt) {
      const step = Math.max(0, Math.min(0.1, dt));
      let sealedNow = false;

      if (pass && player) {
        dir = Math.sign(sideOf(w, pass.to) - sideOf(w, pass.from)) || 1;
        crossU = crossingU(pass.from, pass.to);
        u = phase === 'idle' ? crossU : u + (crossU - u) * Math.min(1, step * 10);
        const bodyY = clamp(player.y - w.y + BODY_Y, 0.85, Math.max(0.9, w.height - maxRy - 0.15));
        y = phase === 'idle' ? bodyY : y + (bodyY - y) * Math.min(1, step * 8);
        const dist = sideOf(w, player) * dir; // negative approaching, 0 on the wall, positive past it
        const tear = smoothstep(-0.95, 0.25, dist);
        const bow = Math.exp(-Math.pow((dist + 0.12) / 0.72, 2)); // strongest 3D curtain push right as torso crosses
        open = Math.max(open, tear);
        push = dir * (0.22 * open + 0.82 * bow);
        swirl = 0.35 * open + 0.65 * bow;
        rim = Math.max(0.75 * open, bow);
        closeProg = 0;
        holdTimer = HOLD_AFTER_CLEAR;
        closeTimer = 0;
        peekTimer = 0;
        phase = open > 0.01 || bow > 0.05 ? 'tearing' : 'idle';
      } else if (phase !== 'idle' || sight.blocked) {
        if (sight.blocked) {
          // Camera is still behind the crossed wall: align the held opening with the actual camera sight ray across the
          // full doorway span so moving near a jamb or lintel never leaves the player obscured behind opaque mist.
          const sightU = clamp(sight.u, -halfW, halfW);
          const sightY = clamp(sight.y, 0.5, Math.max(0.9, w.height));
          if (phase === 'idle') {
            crossU = sightU;
            u = sightU;
            y = sightY;
            open = 1;
          } else if (phase === 'closing') {
            peekTimer = 0;
          }
          u += (sightU - u) * Math.min(1, step * 12);
          y += (sightY - y) * Math.min(1, step * 12);
          peekTimer = Math.min(PEEK_SETTLE, peekTimer + step);
          const targetOpen = 1 - (1 - PEEK_SHARE) * smoothstep(0.25, PEEK_SETTLE, peekTimer);
          open += (targetOpen - open) * Math.min(1, step * (open < targetOpen ? 12 : 5));
          // Keep the sight ray inside the clear interior of the core opening even on fast lateral strafes or camera orbits.
          const leashX = maxRx * Math.max(open, PEEK_SHARE) * 0.32;
          const leashY = maxRy * Math.max(open, PEEK_SHARE) * 0.32;
          u = clamp(u, sightU - leashX, sightU + leashX);
          y = clamp(y, sightY - leashY, sightY + leashY);
          push += (dir * 0.14 - push) * Math.min(1, step * 4);
          swirl += (-0.28 - swirl) * Math.min(1, step * 4); // subtle inward tug as the mist tries to reclaim the breach
          rim += (0.72 - rim) * Math.min(1, step * 5);
          closeProg = Math.max(0, closeProg - step * 2.5);
          holdTimer = HOLD_AFTER_CLEAR;
          closeTimer = 0;
          phase = 'open';
        } else {
          // Camera has entered (or moved off the sight line): linger briefly so the torn hole is seen, then swirl shut.
          if (phase !== 'closing') {
            holdTimer = Math.max(0, holdTimer - step);
            push += (dir * 0.12 - push) * Math.min(1, step * 4);
            swirl += (-0.35 - swirl) * Math.min(1, step * 4);
            if (holdTimer <= 0) {
              phase = 'closing';
              startOpen = Math.max(0.05, open);
              closeTimer = 0;
            }
          }
          if (phase === 'closing') {
            closeTimer += step;
            closeProg = clamp(closeTimer / CLOSE_SECONDS, 0, 1);
            const ease = Math.pow(closeProg, 1.35);
            open = startOpen * (1 - ease);
            swirl = -Math.sin(Math.PI * Math.min(1, closeProg * 1.1));
            push = dir * 0.12 * (1 - ease);
            rim = 0.88 * (1 - closeProg * 0.55) * Math.sin(Math.PI * Math.min(1, 0.18 + 0.82 * (1 - closeProg)));
            if (closeProg >= 1) {
              phase = 'idle';
              open = 0;
              push = 0;
              swirl = 0;
              rim = 0;
              closeProg = 0;
              sealedNow = true;
            }
          }
        }
      }

      const rx = maxRx * open;
      const ry = maxRy * open;
      return { active: rx > 0.002 || Math.abs(push) > 0.01, u, y, rx, ry, swirl, push, rim, closeProg, phase, sealedNow };
    },
  };
}
