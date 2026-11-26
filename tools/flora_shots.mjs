/**
 * Photographs the trees, conifers and undergrowth of the realms from the game itself (docs/FLORA.md): at each Elder Sign named, the
 * densest stand of trees within reach of it is found in the world's own plan, and the camera is set before it at a man's height, and
 * again closer and from below a crown. Needs Playwright with a Chromium (not a dependency of the game: `PLAYWRIGHT_MODULE` and
 * `CHROMIUM` point at yours, as in tools/store_shots.mjs) and the dev server running (`npm run dev`).
 *
 *   node tools/flora_shots.mjs <out dir> [--url http://127.0.0.1:5173] [--hour gloaming] [--wind 1] [--bright 0] [--frames 1] [sign ...]
 *
 * `--wind` holds the wind's strength (1 a calm night, 3 a gale), `--frames n` takes n pictures a view a third of a second apart (the
 * sway, seen). No signs: a stand in each of the forested realms. The pictures are 1280 x 720, no HUD, no sanity distortion. A software
 * renderer is slow (a view takes some seconds) and flatter than a real GPU.
 */

import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const out = args[0];
if (!out || out.startsWith('--')) throw new Error('usage: flora_shots.mjs <out dir> [--url u] [--hour h] [--wind w] [--bright b] [--frames n] [sign ...]');
const flag = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const base = flag('--url', 'http://127.0.0.1:5173');
const hour = flag('--hour', 'gloaming');
const wind = Number(flag('--wind', '1'));
const bright = Number(flag('--bright', '0'));
const frames = Number(flag('--frames', '1'));
const taken = new Set(['--url', '--hour', '--wind', '--bright', '--frames'].flatMap((f) => (args.includes(f) ? [args[args.indexOf(f) + 1]] : [])));
const asked = args.slice(1).filter((a) => !a.startsWith('--') && !taken.has(a));
const signs = asked.length ? asked : ['hub_quad', 'vermont_road', 'dunwich_hills', 'arkham_heath', 'dream_wood', 'innsmouth_reef'];
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
await page.evaluate(async ({ hour, bright, wind }) => {
  const { HINT_IDS, HINT_KEPT } = await import('/src/data/fieldGuide.ts');
  for (const id of HINT_IDS) window.game.overworld.told.add(HINT_KEPT + id);
  window.settings.fxCap = 0;
  const { HOUR_FROM } = await import('/src/systems/clock.ts');
  const { CLOCK, SIM } = await import('/src/data/tuning.ts');
  const hold = () => { // the night held at the hour asked, and the weather calm
    const g = window.game;
    if (!g.overworld) return;
    const now = g.frame / SIM.hz;
    let need = (HOUR_FROM[hour] + 0.03 - CLOCK.start) * CLOCK.night - now;
    need = ((need % CLOCK.night) + CLOCK.night) % CLOCK.night;
    g.overworld.hurried = need;
    if (g.overworld.weather) g.overworld.weather.amount = 0;
  };
  setInterval(hold, 100);
  const { worldUniforms } = await import('/src/render/worldMaterial.ts');
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
    worldUniforms.uWind.value = wind;
    original(force);
  };
}, { hour, bright, wind });

for (const sign of signs) {
  const views = await page.evaluate(async (sign) => {
    const { travel } = await import('/src/systems/checkpoints.ts');
    const g = window.game;
    g.overworld.discovered.add(sign);
    travel(g, sign);
    await new Promise((r) => setTimeout(r, 1500));
    const me = g.ecs.c.transform.get(g.player.id).pos;
    const { chunkContent } = await import('/src/world/chunks.ts');
    const { chunkOf } = await import('/src/world/worldMap.ts');
    const { surface } = await import('/src/world/terrain.ts');
    const [cx, cz] = [chunkOf(me.x), chunkOf(me.z)];
    const trees = [];
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const p of chunkContent(cx + i, cz + j).props) if (p.kind === 'tree' || p.kind === 'pine') trees.push(p);
    if (!trees.length) return [];
    let best = trees[0], most = -1;
    for (const t of trees) {
      const near = trees.filter((u) => Math.hypot(u.x - t.x, u.z - t.z) < 14).length - Math.hypot(t.x - me.x, t.z - me.z) / 40;
      if (near > most) [best, most] = [t, near];
    }
    const away = Math.atan2(me.x - best.x, me.z - best.z);
    const at = (d, h, look, spin = 0) => {
      const [x, z] = [best.x + Math.sin(away + spin) * d, best.z + Math.cos(away + spin) * d];
      return { pos: [x, surface(x, z) + h, z], at: [best.x, surface(best.x, best.z) + look, best.z] };
    };
    const views = [
      { name: 'stand', ...at(16, 1.7, 3) },
      { name: 'near', ...at(7, 1.6, 3.5, 0.6) },
      { name: 'under', ...at(2.6, 1.4, 6, -0.5) },
    ];
    // the investigator a few steps before each view, so the lantern lights what is seen (set again for each view)
    return views.map((v) => { // (to the camera's side and a step behind it, out of the picture)
      const [dx, dz] = [v.at[0] - v.pos[0], v.at[2] - v.pos[2]];
      const l = Math.hypot(dx, dz) || 1;
      return { ...v, me: [v.pos[0] - (dx / l) * 1.2 + (dz / l) * 1.4, v.pos[2] - (dz / l) * 1.2 - (dx / l) * 1.4] };
    });
  }, sign);
  if (!views.length) { console.log(`${sign}: no trees near`); continue; }
  for (const v of views) {
    await page.evaluate((v) => {
      const g = window.game;
      const me = g.ecs.c.transform.get(g.player.id).pos;
      [me.x, me.z] = v.me;
      window.__cam = v;
    }, v);
    await page.evaluate(() => document.querySelectorAll('body > div').forEach((d) => (d.style.visibility = 'hidden'))); // no HUD
    await page.waitForTimeout(6000); // the land made about it
    for (let f = 0; f < frames; f++) {
      await page.screenshot({ path: `${out}/${sign}-${v.name}${frames > 1 ? `-${f}` : ''}.png` });
      if (f + 1 < frames) await page.waitForTimeout(330);
    }
    console.log(`${sign} ${v.name}`);
  }
}
await browser.close();
