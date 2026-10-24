/**
 * Photographs the open horrors' places from the game itself (the boss environment upgrade; docs/BOSS_PLACES.md): from the court
 * before the gate (approach), from the gate, from inside the ring as the fight's camera has it, from above, and from the
 * ring's inner side toward the wall (what the fight is seen against). `--phase 0.85` holds the night at a place in it, `--bright 0.2` adds light. Needs Playwright with a Chromium (not a dependency of the
 * game: `PLAYWRIGHT_MODULE` and `CHROMIUM` point at yours, as in tools/store_shots.mjs) and the dev server running (`npm run dev`).
 *
 *   node tools/boss_shots.mjs <out dir> [--views approach,gate,fight,high,wall] [--url http://127.0.0.1:5173] [--hour deep] [--info stats.jsonl] [boss id ...]
 *
 * `--info` appends, for each picture, a line of the frame's draw calls, triangles, geometries and textures (the renderer's own count, which
 * a software renderer shares with a GPU) and the mean milliseconds of ten frames (which it does not: docs/BOSS_PLACES.md).
 *
 * No boss ids: every open horror with a house. The pictures are 1280 x 720 with no HUD and no sanity distortion. A software
 * renderer is slow (a view takes about ten seconds) and flatter than a real GPU.
 */

import { appendFileSync, mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const out = args[0];
if (!out || out.startsWith('--')) throw new Error('usage: boss_shots.mjs <out dir> [--views a,b] [--url u] [--hour h] [boss ids]');
const flag = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const views = flag('--views', 'approach,gate,fight,high,wall').split(',');
const base = flag('--url', 'http://127.0.0.1:5173');
const hour = flag('--hour', 'gloaming');
const phase = flag('--phase', ''); // a place in the night (0..1) instead of an hour's: 0.85 is the grey before the dawn
const bright = Number(flag('--bright', '0')); // light added to the world's ambient, to see a place by (labelled so where it is shown)
const info = flag('--info', ''); // a file of the frame's counts, a line for each picture
const taken = new Set(['--views', '--url', '--hour', '--phase', '--bright', '--info'].flatMap((f) => (args.includes(f) ? [args[args.indexOf(f) + 1]] : [])));
const bosses = args.slice(1).filter((a) => !a.startsWith('--') && !taken.has(a));
mkdirSync(out, { recursive: true });

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('pageerror', String(e).slice(0, 300)));
await page.goto(`${base}/?fresh&debug`);
await page.waitForFunction(() => window.game && window.world, null, { timeout: 180000 });
await page.waitForTimeout(8000);
await page.keyboard.press('Enter'); // the wake is skipped
await page.keyboard.press('h'); // the debug panel away
await page.evaluate(async ({ hour, phase, bright }) => {
  const { HINT_IDS, HINT_KEPT } = await import('/src/data/fieldGuide.ts');
  for (const id of HINT_IDS) window.game.overworld.told.add(HINT_KEPT + id);
  window.settings.fxCap = 0;
  const { HOUR_FROM } = await import('/src/systems/clock.ts');
  const { CLOCK, SIM } = await import('/src/data/tuning.ts');
  // the night is held at the hour asked: its phase set by hurrying it on from where the game's own frames have it, each frame
  const hold = () => {
    const g = window.game;
    if (!g.overworld) return;
    const now = g.frame / SIM.hz;
    let need = ((phase ? Number(phase) : HOUR_FROM[hour] + 0.03) - CLOCK.start) * CLOCK.night - now;
    need = ((need % CLOCK.night) + CLOCK.night) % CLOCK.night;
    g.overworld.hurried = need;
  };
  setInterval(hold, 100);
  const { worldUniforms } = await import('/src/render/worldMaterial.ts');
  // a camera of the script's own, over the game's (as the effects lab does): window.__cam = { pos: [x, y, z], at: [x, y, z], fov }
  const cam = window.camera;
  const original = cam.updateMatrixWorld.bind(cam);
  cam.updateMatrixWorld = (force) => {
    const v = window.__cam;
    if (v) {
      cam.position.set(...v.pos);
      if (cam.fov !== (v.fov ?? 60)) { cam.fov = v.fov ?? 60; cam.updateProjectionMatrix(); }
      cam.lookAt(...v.at);
    }
    if (bright) worldUniforms.uAmbient.value.addScalar(bright);
    original(force);
  };
}, { hour, phase, bright });

const list = await page.evaluate(async (want) => {
  const { worldLayout } = await import('/src/world/placements.ts');
  return worldLayout().arenas.filter((a) => a.house && (!want.length || want.includes(a.bosses[0]))).map((a) => a.bosses[0]);
}, bosses);

for (const id of list) {
  const geom = await page.evaluate(async (boss) => {
    const { worldLayout } = await import('/src/world/placements.ts');
    const a = worldLayout().arenas.find((x) => x.bosses[0] === boss);
    return { x: a.x, z: a.z, y: a.y, r: a.radius, fx: a.front.x, fz: a.front.z, gate: a.house.gate, rect: a.house.rect };
  }, id);
  const { x, z, r, fx, fz, gate, rect } = geom;
  const yawTo = (dx, dz) => Math.atan2(dx, dz);
  const R = Math.max(rect.x1 - rect.x0, rect.z1 - rect.z0) / 2;
  const at = { // where the investigator stands, the eye's height above the ground there, and where it looks
    approach: { me: [gate.x + fx * 46, gate.z + fz * 46], yaw: yawTo(-fx, -fz), look: { up: 1.8, aim: 6, dist: 0.01 } },
    gate: { me: [gate.x + fx * 9, gate.z + fz * 9], yaw: yawTo(-fx, -fz), look: { up: 1.7, aim: 3, dist: 0.01 } },
    fight: { me: [x + fx * r * 0.55, z + fz * r * 0.55], yaw: yawTo(-fx, -fz), look: null },
    high: { me: [gate.x + fx * 30, gate.z + fz * 30], yaw: yawTo(-fx, -fz), look: { high: true } },
    wall: { me: [x + fx * r * 0.2, z + fz * r * 0.2], yaw: yawTo(-fx, -fz), look: { wall: true } },
  };
  for (const view of views) {
    // `p:a:c:h:ta:tc:th`: an eye `a` along the court's front and `c` to its left of the centre, `h` metres over the ground, looking at (ta, tc, th) (any place of a court, as its planner says it)
    const free = view.startsWith('p:') ? view.slice(2).split(':').map(Number) : null;
    const world = (a, c) => [x + fx * a - fz * c, z + fz * a + fx * c];
    const v = free ? { me: world(free[0], free[1]), yaw: 0, look: null, free } : at[view];
    if (!v) continue;
    await page.evaluate(async ({ v, view, x, z, r, fx, fz, R, boss }) => {
      const g = window.game;
      window.__cam = null;
      const { teleport } = await import('/src/systems/checkpoints.ts');
      const behind = view === 'approach' || view === 'gate' ? 4 : 0; // the investigator stands behind the camera (its own is inside the figure's hat and coat otherwise)
      teleport(g, { x: v.me[0] + fx * behind, z: v.me[1] + fz * behind, yaw: v.yaw });
      g.ecs.c.health.get(g.player.id).immortal = true;
      const { NIGHT } = await import('/src/systems/clock.ts');
      void NIGHT;
      window.world.update(v.me[0], v.me[1], 300000);
      window.world.update(x, z, 300000);
      const ground = (px, pz) => g.world.ground(px, pz);
      if (v.free) {
        const [a, c, hh, ta, tc, th] = v.free;
        const w = (aa, cc) => [x + fx * aa - fz * cc, z + fz * aa + fx * cc];
        const [e, t] = [w(a, c), w(ta, tc)];
        teleport(g, { x: e[0] + fx * 3, z: e[1] + fz * 3, yaw: 0 });
        window.world.update(e[0], e[1], 300000);
        window.__cam = { pos: [e[0], ground(e[0], e[1]) + hh, e[1]], at: [t[0], ground(t[0], t[1]) + th, t[1]], fov: 62 };
      } else if (view === 'approach' || view === 'gate') {
        const eye = [v.me[0], ground(v.me[0], v.me[1]) + v.look.up, v.me[1]];
        window.__cam = { pos: eye, at: [v.me[0] + Math.sin(v.yaw) * 30, eye[1] + v.look.aim * 0.4, v.me[1] + Math.cos(v.yaw) * 30], fov: 62 };
      } else if (view === 'high') {
        const e = [x + fx * R * 1.25, ground(x, z) + R * 0.95, z + fz * R * 1.25];
        window.__cam = { pos: e, at: [x - fx * R * 0.1, ground(x, z) + 2, z - fz * R * 0.1], fov: 55 };
      } else if (view === 'wall') {
        const e = [x + fx * r * 0.2, ground(x, z) + 2.4, z + fz * r * 0.2];
        window.__cam = { pos: e, at: [x + fx * R * 1.1 + -fz * 0.45 * R, ground(x, z) + 6, z + fz * R * 1.1 + fx * 0.45 * R], fov: 70 };
      }
    }, { v, view, x, z, r, fx, fz, R, boss: id });
    for (let i = 0; i < 90; i++) { // until the chunks are made
      await page.waitForTimeout(1500);
      if (await page.evaluate(() => window.world.pending === 0).catch(() => false)) break;
    }
    await page.evaluate(() => { document.querySelectorAll('body > div').forEach((d) => (d.style.visibility = 'hidden')); });
    await page.waitForTimeout(4000);
    const file = `${out}/${id}-${view.replace(/[^\w.-]+/g, '_')}.png`;
    await page.screenshot({ path: file });
    if (info) {
      const n = await page.evaluate(async () => {
        const r = window.pipeline.renderer;
        const t0 = performance.now();
        for (let i = 0; i < 10; i++) await new Promise((res) => requestAnimationFrame(res));
        return { calls: r.info.render.calls, triangles: r.info.render.triangles, geometries: r.info.memory.geometries, textures: r.info.memory.textures, frameMs: (performance.now() - t0) / 10 };
      });
      appendFileSync(info, JSON.stringify({ boss: id, view, ...n }) + '\n');
    }
    console.log(file);
  }
}
await browser.close();
