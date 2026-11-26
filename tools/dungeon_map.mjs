/**
 * Prints each dungeon's plan as text (round 125, docs/LEVEL_DESIGN.md): its rooms on the kit's 16 m grid, north up, with their
 * floors, doorways, and the second ways of world/dungeonLinks.ts, and whatever the layout cannot build. Loads the game's own modules
 * through Vite, so what it prints is what the game lays.
 *
 *   node tools/dungeon_map.mjs [--cells] [dungeon id ...]   (--cells: each room's cell and floor, too)
 *
 * In a room: its id, then its kind's letter and floor (a stair: foot>top), `*` an Elder Sign, `!` a boss, `@` a gate, `?` a hidden
 * doorway into it, `~` foes that lie in wait. On a wall: a gap is a doorway (`IN` the way in), `S` a shortcut (its arrow points away
 * from the side it is opened from), `D` a drop (its arrow points down it), `#` a window, `?` a hidden way.
 */

import { createServer } from 'vite';

const DIR = { n: { x: 0, z: 1 }, e: { x: 1, z: 0 }, s: { x: 0, z: -1 }, w: { x: -1, z: 0 } };
const ARROW = { n: '^', e: '>', s: 'v', w: '<' };
const W = 10; // characters a cell is wide...
const H = 4; // ...and high

const cellsToo = process.argv.includes('--cells');
const want = new Set(process.argv.slice(2).filter((a) => !a.startsWith('--')));
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { DUNGEONS } = await vite.ssrLoadModule('/src/data/dungeons.ts');
  const { layoutDungeon } = await vite.ssrLoadModule('/src/world/dungeonKit.ts');
  for (const def of DUNGEONS) {
    if (want.size && !want.has(def.id)) continue;
    const d = layoutDungeon(def, { x: 0, z: 0 }, 0);
    console.log(`\n${def.id} (${def.name}): ${d.rooms.length} rooms, ${d.doors.filter((o) => o.link).length + d.windows.length} links`);
    if (d.errors.length) console.log(`  ERRORS:\n${d.errors.map((e) => `    ${e}`).join('\n')}`);
    console.log(plan(d));
    if (cellsToo) for (const r of d.rooms) console.log(`  ${r.def.id.padEnd(14)} ${r.def.kind.padEnd(8)} cell (${r.i}, ${r.j})${r.size === 3 ? ' wide' : ''}  floor ${fmt(r.level)}${r.rise ? ` > ${fmt(r.level + r.rise)} (${r.axis})` : ''}`);
  }
} finally {
  await vite.close();
}

/** A floor's height, to a tenth. */
function fmt(v) {
  return String(Math.round(v * 10) / 10);
}

/** The plan of a laid dungeon, as lines of text. */
function plan(d) {
  const cells = new Map();
  for (const r of d.rooms) {
    const h = (r.size - 1) / 2;
    for (let di = -h; di <= h; di++) for (let dj = -h; dj <= h; dj++) cells.set(`${r.i + di},${r.j + dj}`, r);
  }
  const ks = [...cells.keys()].map((k) => k.split(',').map(Number));
  const [i0, i1] = [Math.min(...ks.map((c) => c[0])), Math.max(...ks.map((c) => c[0]))];
  const [j0, j1] = [Math.min(...ks.map((c) => c[1])), Math.max(...ks.map((c) => c[1]))];
  const cols = (i1 - i0 + 1) * W + 1;
  const rows = (j1 - j0 + 1) * H + 1;
  const g = Array.from({ length: rows }, () => Array(cols).fill(' '));
  const put = (x, y, s) => { for (let k = 0; k < s.length; k++) if (y >= 0 && y < rows && x + k >= 0 && x + k < cols) g[y][x + k] = s[k]; };
  const at = (i, j) => cells.get(`${i},${j}`);
  const X = (i) => (i - i0) * W; // a cell's west wall
  const Y = (j) => (j1 - j) * H; // its north wall
  for (let j = j0 - 1; j <= j1 + 1; j++) {
    for (let i = i0 - 1; i <= i1 + 1; i++) {
      const r = at(i, j);
      if (r !== at(i, j + 1)) put(X(i) + 1, Y(j), '-'.repeat(W - 1)); // the wall on its north side
      if (r !== at(i - 1, j)) for (let k = 1; k < H; k++) put(X(i), Y(j) + k, '|'); // on its west
      const around = [at(i - 1, j), at(i, j), at(i - 1, j + 1), at(i, j + 1)]; // the four cells about its north-west corner
      if (around.some((c) => c !== around[0])) put(X(i), Y(j), '+');
      if (r && r.i === i && r.j === j) {
        const marks = `${r.def.sign ? '*' : ''}${r.def.boss ? '!' : ''}${r.def.gate ? '@' : ''}${r.def.hidden ? '?' : ''}${r.def.lurk?.length ? '~' : ''}`;
        const floor = r.def.kind === 'stair' ? `${fmt(r.level)}>${fmt(r.level + r.rise)}` : fmt(r.level);
        put(X(i) + 1, Y(j) + 1, r.def.id.slice(0, W - 1));
        put(X(i) + 1, Y(j) + 2, `${r.def.kind[0]}${floor}${marks}`.slice(0, W - 1));
        const foes = (r.def.spawns?.length ?? 0) + (r.def.lurk?.length ?? 0);
        if (foes) put(X(i) + 1, Y(j) + 3, `${foes} foe${foes > 1 ? 's' : ''}`);
      }
    }
  }
  /** Marks the doorway `o` on its wall with `ch` (two characters on a north or south wall, one on an east or west). */
  const mark = (o, ch) => {
    const n = DIR[o.side];
    const p = { x: -n.z, z: n.x };
    const r = o.a;
    const h = (r.size - 1) / 2;
    for (let k = -h; k <= h; k++) {
      const [ex, ez] = [r.x + n.x * r.half + p.x * k * 16, r.z + n.z * r.half + p.z * k * 16];
      if (Math.abs(o.x - ex) > 0.01 || Math.abs(o.z - ez) > 0.01) continue;
      const [ci, cj] = [r.i + n.x * h + p.x * k, r.j + n.z * h + p.z * k]; // the cell of `r` whose wall it is
      if (n.z !== 0) put(X(ci) + W / 2 - 1, n.z > 0 ? Y(cj) : Y(cj) + H, ch.slice(0, 2).padEnd(2, ' '));
      else put(n.x > 0 ? X(ci) + W : X(ci), Y(cj) + 2, ch[0]);
    }
  };
  for (const o of d.doors) {
    if (!o.b) mark(o, 'IN');
    else if (o.hidden) mark(o, '??');
    else if (!o.link || o.link.kind === 'open') mark(o, '  ');
    else if (o.link.kind === 'shortcut') mark(o, `S${ARROW[o.link.side]}`);
    else mark(o, `D${ARROW[o.link.side]}`);
  }
  for (const o of d.windows) mark(o, '##');
  return g.map((l) => l.join('').trimEnd()).join('\n');
}
