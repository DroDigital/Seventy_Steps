// In-game pictures of a creature's model (docs/MODELS.md), through the effects lab (`?spawn=<id>&debug`,
// ui/fxLab.ts): the world held, the camera set about the creature, it at rest and each of its attacks at
// the frame its blow lands, a sheet of them in tools/blender/sheets/<id>-game.png.
//
//   npm run dev &   (then)   node tools/blender/shots.mjs deep_one [--variant eldritch] [--url http://localhost:5173/]
//
// Needs Playwright (PLAYWRIGHT_MODULE names it if it is not installed here; CHROMIUM a browser) and Pillow-free:
// the sheet is laid out by the page itself.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const id = args.find((a) => !a.startsWith('--') && a !== opt('--variant') && a !== opt('--url') && a !== opt('--moves') && a !== opt('--yaw'));
const variant = opt('--variant');
const base = opt('--url', 'http://localhost:5173/');
const timing = (await import(join(here, 'timing.json'), { with: { type: 'json' } })).default;
const clips = timing.entities[id].clips;
const height = timing.entities[id].body.height + timing.entities[id].body.hover;
const moves = (opt('--moves') ?? Object.keys(clips).filter((c) => c.startsWith('atk.')).map((c) => c.slice(4)).join(',')).split(',').filter(Boolean);

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 900, height: 506 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${base}?spawn=${id}${variant ? `&variant=${variant}` : ''}&debug`);
await page.waitForFunction(() => window.fxlab && window.game, null, { timeout: 180000 });
await page.waitForTimeout(1500);
await page.keyboard.press('h'); // the debug panel away
const view = { yaw: Number(opt('--yaw', 0.95)), dist: Math.max(3.4, height * 2.2), up: height * 0.62, aim: height * 0.5 };
await page.evaluate(([v, who]) => { window.fxlab.target(who); window.fxlab.hold(true); window.fxlab.place({ dist: Math.max(2.6, v.dist * 0.8), bearing: 0 }); window.fxlab.look(v); }, [view, id]);
await page.evaluate(() => window.fxlab.advance(0.3));
const shots = [];
const grab = async (label) => shots.push({ label, png: (await page.screenshot({ type: 'png' })).toString('base64') });
await grab('idle');
for (const m of moves) {
  const c = clips[`atk.${m}`];
  if (!c) continue;
  await page.evaluate((name) => window.fxlab.fire(name), m);
  await page.evaluate((s) => window.fxlab.advance(s), Math.max(0.05, (c.strike - 1) / 60));
  await grab(`${m} ${c.strike}/${c.frames}`);
  await page.evaluate((s) => window.fxlab.advance(s), (c.frames - c.strike + 30) / 60);
}
// the sheet: three across, each picture labelled
const sheet = await page.evaluate(async (list) => {
  const imgs = await Promise.all(list.map((s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = `data:image/png;base64,${s.png}`; })));
  const w = 450, h = 253, cols = 3, rows = Math.ceil(imgs.length / cols);
  const cv = Object.assign(document.createElement('canvas'), { width: w * cols, height: h * rows });
  const cx = cv.getContext('2d');
  imgs.forEach((img, i) => {
    cx.drawImage(img, (i % cols) * w, Math.floor(i / cols) * h, w, h);
    cx.fillStyle = '#fff'; cx.font = '14px monospace'; cx.fillText(list[i].label, (i % cols) * w + 6, Math.floor(i / cols) * h + 16);
  });
  return cv.toDataURL('image/png').split(',')[1];
}, shots);
mkdirSync(join(here, 'sheets'), { recursive: true });
const out = join(here, 'sheets', `${id}${variant ? `-${variant}` : ''}-game.png`);
writeFileSync(out, Buffer.from(sheet, 'base64'));
console.log(out);
if (errors.length) console.log('page errors:\n' + errors.join('\n'));
await browser.close();
