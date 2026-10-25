/**
 * Photographs the investigator from the game itself (docs/PLAYER.md): the turnaround in the real renderer, beside the people he stands among, and a clip's
 * frames. Needs Playwright with a Chromium (not a dependency of the game: `PLAYWRIGHT_MODULE` and `CHROMIUM` point at yours, as in tools/boss_shots.mjs)
 * and the dev server running (`npm run dev`).
 *
 *   node tools/player_shots.mjs <out dir> turn [--weapon axe] [--drawn]
 *   node tools/player_shots.mjs <out dir> npcs [--npcs peaslee,morgan,gilman,zadok]
 *   node tools/player_shots.mjs <out dir> clip <move> [--frames 0,6,12] [--views side,front] [--weapon cane]
 *
 * The arena (`?arena&debug`) holds the picture still; the camera is the script's own, over the game's. Pictures are the middle 640 x 720 of the frame.
 */

import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const out = args[0];
const mode = args[1];
if (!out || !['turn', 'npcs', 'clip'].includes(mode)) throw new Error('usage: player_shots.mjs <out dir> turn|npcs|clip ...');
const flag = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const base = flag('--url', 'http://127.0.0.1:5173');
const weapon = flag('--weapon', 'cane');
const drawn = args.includes('--drawn');
const npcs = flag('--npcs', 'peaslee,morgan,gilman,zadok').split(',');
const bright = Number(flag('--bright', '0.12'));
mkdirSync(out, { recursive: true });

const pw = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const chromium = pw.chromium ?? pw.default.chromium;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('pageerror', String(e).slice(0, 300)));
await page.goto(`${base}/?arena&debug`);
await page.waitForFunction(() => window.game && window.camera && window.scene, null, { timeout: 180000 });
await page.waitForTimeout(5000);
await page.keyboard.press('h'); // the debug panel away
await page.evaluate(() => document.querySelectorAll('body > div').forEach((d) => (d.style.visibility = 'hidden'))); // and the HUD
await page.evaluate(async ({ bright, weapon }) => {
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
    original(force);
  };
  window.settings.fxCap = 0;
  const { equip } = await import('/src/systems/arms.ts').catch(() => ({}));
  void equip; void weapon;
}, { bright, weapon });

const stage = await page.evaluate(() => {
  const t = window.game.ecs.c.transform.get(window.game.player.id);
  return { x: t.pos.x, y: t.pos.y, z: t.pos.z, yaw: t.yaw };
});

/** The camera round the point (x, z) at `yaw` from the figure's front, `d` metres off, looking at height `h`, the lens `fov` degrees. */
async function look(yawOff, d, h, fov, centre = 0) {
  await page.evaluate(({ s, yawOff, d, h, fov, centre }) => {
    const ay = s.yaw + yawOff;
    const [rx, rz] = [-Math.cos(s.yaw), Math.sin(s.yaw)]; // his right
    const cx = s.x + rx * centre;
    const cz = s.z + rz * centre;
    window.__cam = { pos: [cx + Math.sin(ay) * d, s.y + h + 0.25, cz + Math.cos(ay) * d], at: [cx, s.y + h, cz], fov };
  }, { s: stage, yawOff, d, h, fov, centre });
  await page.waitForTimeout(900);
}

const shot = (name, wide = false) => page.screenshot({ path: `${out}/${name}.png`, ...(wide ? {} : { clip: { x: 320, y: 0, width: 640, height: 720 } }) });
const VIEWS = { front: 0, q34: Math.PI / 4, side: Math.PI / 2, back: Math.PI, q34b: -Math.PI / 4 };

if (mode === 'turn') {
  for (const [name, a] of Object.entries(VIEWS)) {
    await look(a, 4.4, 0.92, 30);
    await shot(`turn_${name}`);
  }
}

if (mode === 'npcs') {
  await page.evaluate(async ({ stage, npcs }) => {
    const { buildFigure } = await import('/src/render/figures.ts');
    const { pose } = await import('/src/render/poses.ts');
    const [rx, rz] = [-Math.cos(stage.yaw), Math.sin(stage.yaw)];
    window.__lineup = [];
    const spots = npcs.length <= 2 ? [-1.1, 1.1] : [-1.2, 1.2, -2.4, 2.4];
    npcs.forEach((id, i) => {
      const f = buildFigure(`npc:${id}`);
      const o = spots[i];
      f.root.position.set(stage.x + rx * o, stage.y, stage.z + rz * o);
      f.root.rotation.y = stage.yaw;
      pose(f, { move: null, def: undefined, frame: 0, speed: 0, stride: 0, guard: false, flinch: 0, rollYaw: 0, time: 0.5 + i });
      window.scene.add(f.root);
      window.__lineup.push(f);
    });
  }, { stage, npcs });
  await look(0.12, 6.4, 0.9, 36);
  await shot('npcs_front', true);
  await look(Math.PI / 2 + 0.2, 6.4, 0.9, 36);
  await shot('npcs_side', true);
}

if (mode === 'clip') {
  console.log('clip frames are taken once the clips are keyed (tools/player/clips.py, src/render/playerClips.ts)');
}

await browser.close();
