/**
 * Round 80, the lane of laid-down stems: a field of 64 x 64 texels (half a metre each) about the investigator, wrapped like a torus
 * so it never has to be moved: a body stamps its footprint at 1, the field rises again over `TRAMPLE.hold` seconds, and the vertex shader
 * (shaders/world.ts, SWAY) reads it to lay a reed or a blade down where something has gone through it. The cells that come into the window
 * as it follows the investigator are cleared first. Render only; pure but for the texture it keeps.
 */

import * as THREE from 'three';
import { TRAMPLE as T } from '../data/groundSkin';

const MOST_STAMPS = 16; // along one stretch

export class Trample {
  readonly field = new Float32Array(T.size * T.size);
  readonly bytes = new Uint8Array(T.size * T.size);
  readonly texture = new THREE.DataTexture(this.bytes, T.size, T.size, THREE.RedFormat, THREE.UnsignedByteType);
  /** The cell at the window's centre (set by `recentre`). */
  cx = 0;
  cz = 0;
  private placed = false;
  private live = false; // anything above nothing in the field (so an empty field costs no upload)

  constructor() {
    const tex = this.texture;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
  }

  /** The index of an absolute cell's texel along an axis. */
  private static wrap(c: number): number {
    return ((c % T.size) + T.size) % T.size;
  }

  private clearColumns(from: number, to: number): void {
    for (let c = from; c <= to; c++) for (let j = 0; j < T.size; j++) this.field[j * T.size + Trample.wrap(c)] = 0;
  }

  private clearRows(from: number, to: number): void {
    for (let c = from; c <= to; c++) this.field.fill(0, Trample.wrap(c) * T.size, (Trample.wrap(c) + 1) * T.size);
  }

  /** Brings the window to the cell about (x, z): what falls away is overwritten by what comes in, so the cells that enter are cleared. */
  recentre(x: number, z: number): void {
    const [nx, nz] = [Math.floor(x / T.cell), Math.floor(z / T.cell)];
    const half = T.size / 2;
    if (!this.placed || Math.abs(nx - this.cx) >= T.size || Math.abs(nz - this.cz) >= T.size) {
      this.field.fill(0);
      this.live = true; // (one more upload lays the emptiness)
    } else {
      if (nx > this.cx) this.clearColumns(this.cx + half, nx + half - 1);
      else if (nx < this.cx) this.clearColumns(nx - half + 1, this.cx - half);
      if (nz > this.cz) this.clearRows(this.cz + half, nz + half - 1);
      else if (nz < this.cz) this.clearRows(nz - half + 1, this.cz - half);
    }
    [this.cx, this.cz, this.placed] = [nx, nz, true];
  }

  /** Forgets everything (a journey, a roof). */
  clear(): void {
    this.field.fill(0);
    this.placed = false;
    this.live = true;
  }

  /** A body's footprint of radius `r` at (x, z): the lane it lays is soft at its edge. */
  stamp(x: number, z: number, r: number): void {
    const half = T.size / 2;
    const [i0, i1] = [Math.floor((x - r) / T.cell), Math.floor((x + r) / T.cell)];
    const [j0, j1] = [Math.floor((z - r) / T.cell), Math.floor((z + r) / T.cell)];
    for (let j = j0; j <= j1; j++) {
      if (Math.abs(j - this.cz) >= half - 1) continue;
      for (let i = i0; i <= i1; i++) {
        if (Math.abs(i - this.cx) >= half - 1) continue;
        const d = Math.hypot((i + 0.5) * T.cell - x, (j + 0.5) * T.cell - z) / r;
        if (d >= 1) continue;
        const v = d < 0.55 ? 1 : 1 - (d - 0.55) / 0.45;
        const at = Trample.wrap(j) * T.size + Trample.wrap(i);
        if (v > this.field[at]) this.field[at] = v;
        this.live = true;
      }
    }
  }

  /** A body that went from (x0, z0) to (x1, z1) between two drawn frames lays its footprint all along the way (a slow frame must not leave a dotted lane). */
  sweep(x0: number, z0: number, x1: number, z1: number, r: number): void {
    const n = Math.min(MOST_STAMPS, Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / (T.cell * 1.5))));
    for (let i = 1; i <= n; i++) this.stamp(x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n, r);
  }

  /** The stems rise: `dt` seconds. */
  decay(dt: number): void {
    if (!this.live) return;
    const k = dt / T.hold;
    let any = false;
    for (let i = 0; i < this.field.length; i++) {
      const v = this.field[i];
      if (v > 0) {
        this.field[i] = v > k ? v - k : 0;
        any = true;
      }
    }
    this.live = any || this.live;
  }

  /** Writes the field to its texture (once more when it has just emptied). */
  upload(): void {
    if (!this.live) return;
    let any = false;
    for (let i = 0; i < this.field.length; i++) {
      const v = Math.round(this.field[i] * 255);
      this.bytes[i] = v;
      if (v > 0) any = true;
    }
    this.texture.needsUpdate = true;
    this.live = any;
  }

  /** The cell at (x, z) as the shader has it: 0..1. */
  at(x: number, z: number): number {
    const half = T.size / 2;
    const [i, j] = [Math.floor(x / T.cell), Math.floor(z / T.cell)];
    if (Math.abs(i - this.cx) >= half || Math.abs(j - this.cz) >= half) return 0;
    return this.field[Trample.wrap(j) * T.size + Trample.wrap(i)];
  }
}

/** The one field the world's shaders read. */
export const trample = new Trample();
