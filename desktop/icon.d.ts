/** Types for icon.js (the desktop shell runs it as plain JavaScript). */

/** A node Buffer, as far as the tests read one. */
export interface Png extends Uint8Array {
  readUInt32BE(offset: number): number;
  indexOf(value: string | number): number;
}

/** `shape`: "round" (a rounded square to the edge), "mac" (set in from the edge, with a soft shadow) or "plain" (no corners). */
export type IconShape = 'round' | 'mac' | 'plain';

export function iconPixels(size: number, shape?: IconShape): Uint8Array;

export function iconPng(size?: number, shape?: IconShape): Png;
