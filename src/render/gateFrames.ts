/**
 * A gate's frame by where it leads (round 104; data/gateFrames.ts names each gate's, gateFramesEarth.ts and gateFramesDream.ts
 * build them): its pieces by texture, built once a frame and shared by every gate that wears it.
 */

import type { GateFrame } from '../data/gateFrames';
import { Frame, type FramePiece } from './gateFrameKit';
import { antarctic, cyclopean, dolmen, farmstead, fungoid, miskatonic, pnakotic, reef, serpent } from './gateFramesEarth';
import { chaos, crystal, goat, ivory, onyx, pipes, spheres, storm, voidFrame, wood } from './gateFramesDream';

const BUILD: Readonly<Record<GateFrame, (f: Frame) => void>> = {
  miskatonic, antarctic, pnakotic, serpent, dolmen, fungoid, farmstead, cyclopean, reef,
  wood, ivory, onyx, void: voidFrame, storm, goat, crystal, pipes, spheres, chaos,
};

const built = new Map<GateFrame, FramePiece[]>();

/** The frame's pieces (each a geometry of one texture and glow; shared, so not to be disposed by one gate). */
export function gateFrame(theme: GateFrame): FramePiece[] {
  let pieces = built.get(theme);
  if (!pieces) {
    const f = new Frame();
    BUILD[theme](f);
    built.set(theme, (pieces = f.pieces()));
  }
  return pieces;
}
