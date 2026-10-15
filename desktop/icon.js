/**
 * The window's and the package's icon (playtest round 12), drawn in code as everything else is: the
 * Elder Sign's five strokes (as render/signMeshes.ts carves them) in bone on near-black, a rim of
 * Cosmic Purple about them, on a rounded square. Encoded as a PNG with node's zlib; `npm run icon`
 * writes build/icon.png (Windows, Linux and the window), build/icon-mac.png (the Mac's: the square
 * set in from the edge with a soft shadow, as macOS icons are drawn) and build/avatar.png (a plain
 * square for a store's profile picture) for packaging and the stores (round 52).
 */

import { deflateSync } from 'node:zlib';

// Start x and y above the stem's foot, lean from upright (radians), length: the sign's strokes.
const STROKES = [[0, 0, 0, 1.35], [0, 0.88, 0.65, 0.5], [0, 0.88, -0.65, 0.5], [0, 0.46, 0.8, 0.42], [0, 0.46, -0.8, 0.42]];
const BG = [9, 9, 11];
const BONE = [217, 208, 184];
const PURPLE = [106, 13, 173];
const SCALE = 0.54; // of the icon's side per unit of stroke
const FOOT = [0.5, 0.835];
const WIDTH = 0.047; // a stroke's half width: heavy enough to read at 16 px

function segDist(px, py, [ax, ay, bx, by]) {
  const [dx, dy] = [bx - ax, by - ay];
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

/**
 * RGBA pixels of the icon, `size` square. `shape`: "round" (a rounded square to the edge), "mac" (the same, set in to 80% with a soft
 * shadow under it: Apple's template) or "plain" (no corners, the sign set in to 80%: the picture a store crops itself).
 */
export function iconPixels(size, shape = 'round') {
  const mac = shape === 'mac';
  const plain = shape === 'plain';
  const inset = mac ? 0.805 : plain ? 0.8 : 1; // the square's side, of the canvas (a picture a store crops, perhaps round, keeps the sign well inside)
  const segs = STROKES.map(([x0, y0, lean, len]) => {
    const [ax, ay] = [0.5 + (FOOT[0] - 0.5 + x0 * SCALE) * inset, 0.5 + (FOOT[1] - 0.5 - y0 * SCALE) * inset];
    return [ax, ay, ax + Math.sin(lean) * len * SCALE * inset, ay - Math.cos(lean) * len * SCALE * inset];
  });
  const width = WIDTH * inset;
  const out = new Uint8Array(size * size * 4);
  const px = 1 / size;
  const half = inset / 2;
  const radius = 0.225 * inset;
  const box = (u, v) => Math.hypot(Math.max(0, Math.abs(u - 0.5) - (half - radius)), Math.max(0, Math.abs(v - 0.5) - (half - radius))) - radius; // < 0 inside
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [u, v] = [(x + 0.5) * px, (y + 0.5) * px];
      const d = Math.min(...segs.map((s) => segDist(u, v, s)));
      const ink = Math.max(0, Math.min(1, 0.5 + (width - d) / px)); // (edges anti-aliased about the true edge: a stroke keeps its width at 16 px)
      const glow = 0.62 * Math.exp(-(((d - width) / (0.1 * inset)) ** 2)) * (1 - ink);
      const core = Math.max(0, 1 - d / (width * 0.45)) * ink; // the stroke is lit along its middle
      const top = Math.max(0, Math.min(1, (v - 0.12) / 0.75)); // bone a little paler at the crown, as if lit from above
      const ground = 1 - 0.4 * Math.min(1, Math.hypot(u - 0.5, v - 0.46) / (0.62 * inset)) ** 2; // the ground is darker toward its corners
      const inside = plain ? 1 : Math.max(0, Math.min(1, 0.5 - box(u, v) / px));
      let a = inside;
      if (mac) a = inside + (1 - inside) * Math.exp(-((Math.max(0, box(u, v - 0.012)) / 0.016) ** 2)) * 0.45; // the soft shadow under a Mac icon, a little below
      const i = (y * size + x) * 4;
      for (let k = 0; k < 3; k++) {
        const bone = BONE[k] * (1.06 - 0.16 * top) + 38 * core;
        const bg = BG[k] * ground;
        out[i + k] = inside > 0 ? Math.round(Math.min(255, bg * (1 - ink) + bone * ink + PURPLE[k] * glow)) : 0; // (outside the square: only the shadow, black)
      }
      out[i + 3] = Math.round(255 * a);
    }
  }
  return out;
}

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** The icon as a PNG, `size` square (`shape`: see iconPixels). */
export function iconPng(size = 256, shape = 'round') {
  const rgba = iconPixels(size, shape);
  const rows = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    rows[y * (size * 4 + 1)] = 0; // no filter
    Buffer.from(rgba.buffer, y * size * 4, size * 4).copy(rows, y * (size * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 6, 0, 0, 0], 8); // 8 bits, RGBA
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]);
}
