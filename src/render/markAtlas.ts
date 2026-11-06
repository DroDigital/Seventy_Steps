/**
 * The mark atlas as a texture (round 90, the quiet blows): the coverage masks of data/markAtlas.ts (tools/marks/bake_marks.py), side by side in
 * one row, hard edged like the flame flipbook (render/flames.ts `flameAtlasTexture`). One shared texture; render/particles.ts binds it as
 * `uMarks` and draws a cell by a 'mark' or 'trace' particle's `thick` (`markCell`).
 */

import * as THREE from 'three';
import { MARK_ATLAS } from '../data/markAtlas';

let atlas: THREE.DataTexture | null = null;

/** The atlas's bytes, decoded. */
export function markAtlasBytes(): Uint8Array {
  const raw = atob(MARK_ATLAS.data);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/** Coverage in red, one texel a byte, Nearest, no mipmaps; made once. */
export function markAtlasTexture(): THREE.DataTexture {
  if (atlas) return atlas;
  const tex = new THREE.DataTexture(markAtlasBytes(), MARK_ATLAS.width, MARK_ATLAS.height, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  atlas = tex;
  return tex;
}
