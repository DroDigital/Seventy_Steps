/**
 * The seabed about the investigator, as a grid of heights (round 55): the sea's shader needs to know how deep the water is where it is drawn, to
 * colour it by what light gets through, to thin it to nothing where it meets the shore and to lay foam on the shore's line. The terrain is
 * a function (`surface`), not a picture, so a window of it is kept: `size` cells of `cell` metres, wrapping (a cell of the world is always the same
 * texel, `ix mod size`), so that as the investigator moves only the columns and rows that come into the window are made, and the rest stay as
 * they were. The first fill is made a few rows at a time. Pure; render/seabed.ts puts it in a texture.
 */

export interface SeabedWindow {
  readonly data: Float32Array;
  readonly size: number;
  readonly cell: number;
  /** The world cell the window begins at (its west and south edge), in cells; meaningful once `ready`. */
  readonly origin: { x: number; z: number };
  /** Whether the first fill is done. */
  readonly ready: boolean;
  /** Brings the window about (x, z); true if any of it changed. */
  update(x: number, z: number): boolean;
  /** The height at a world point as the texture holds it (bilinear), or `deep` outside the window: what the shader does. */
  at(x: number, z: number, deep: number): number;
}

export function createSeabedWindow(height: (x: number, z: number) => number, size = 160, cell = 1.5, rowsPerCall = 16): SeabedWindow {
  const data = new Float32Array(size * size);
  const origin = { x: 0, z: 0 };
  let filled = 0; // rows of the first fill done
  let ready = false;
  const wrap = (n: number): number => ((n % size) + size) % size;
  const set = (ix: number, iz: number): void => void (data[wrap(iz) * size + wrap(ix)] = height((ix + 0.5) * cell, (iz + 0.5) * cell));
  const texel = (ix: number, iz: number): number => data[wrap(iz) * size + wrap(ix)]!;
  const win: SeabedWindow = {
    data,
    size,
    cell,
    origin,
    get ready() {
      return ready;
    },
    update(x, z) {
      const [nx, nz] = [Math.floor(x / cell) - size / 2, Math.floor(z / cell) - size / 2];
      if (!ready) {
        if (filled === 0) [origin.x, origin.z] = [nx, nz];
        for (let r = 0; r < rowsPerCall && filled < size; r++, filled++) for (let c = 0; c < size; c++) set(origin.x + c, origin.z + filled);
        ready = filled >= size;
        return true;
      }
      const [dx, dz] = [nx - origin.x, nz - origin.z];
      if (dx === 0 && dz === 0) return false;
      if (Math.abs(dx) >= size || Math.abs(dz) >= size) { // a jump: made anew
        [origin.x, origin.z] = [nx, nz];
        for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) set(nx + c, nz + r);
        return true;
      }
      const cols: number[] = [];
      const rows: number[] = [];
      for (let k = 0; k < Math.abs(dx); k++) cols.push(dx > 0 ? origin.x + size + k : origin.x - 1 - k);
      for (let k = 0; k < Math.abs(dz); k++) rows.push(dz > 0 ? origin.z + size + k : origin.z - 1 - k);
      [origin.x, origin.z] = [nx, nz];
      for (const ix of cols) for (let r = 0; r < size; r++) set(ix, nz + r);
      for (const iz of rows) for (let c = 0; c < size; c++) set(nx + c, iz);
      return true;
    },
    at(x, z, deep) {
      const [u, v] = [x / cell - 0.5, z / cell - 0.5];
      const [ix, iz] = [Math.floor(u), Math.floor(v)];
      const [fx, fz] = [u - ix, v - iz];
      const inside = (a: number, b: number): boolean => a >= origin.x && a < origin.x + size && b >= origin.z && b < origin.z + size;
      const pick = (a: number, b: number): number => (inside(a, b) ? texel(a, b) : deep);
      const top = pick(ix, iz) * (1 - fx) + pick(ix + 1, iz) * fx;
      const bottom = pick(ix, iz + 1) * (1 - fx) + pick(ix + 1, iz + 1) * fx;
      return top * (1 - fz) + bottom * fz;
    },
  };
  return win;
}
