/**
 * The store's pictures, made from the game itself (round 46; docs/PRESS_KIT.md): stills of the dream's best places, and the
 * capsules Steam asks for with the wordmark over them. Needs Playwright with a Chromium (not a dependency of the game: install it
 * where you run this: `npm i -D playwright && npx playwright install chromium`, or point PLAYWRIGHT_MODULE and CHROMIUM at yours) and
 * the dev server running (`npm run dev`). Writes to `store/` (ignored by git).
 *
 *   node tools/store_shots.mjs [http://localhost:5173] [first..last of the 8 places, e.g. 0..7]
 *
 * Stills are 1920 × 1080 with no HUD (the game's `?trailer&hold=n`). A software renderer is slow (a place takes about 30 s) and
 * flatter than a real GPU: on a real machine the stills are better, and a screen recorder on `?trailer` makes the trailer.
 */

import { mkdirSync, writeFileSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5173';
const [first, last] = (process.argv[3] ?? '0..7').split('..').map(Number);
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
mkdirSync('store/shots', { recursive: true });
mkdirSync('store/capsules', { recursive: true });

const shots = [];
for (let i = first; i <= last; i++) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`${base}/?fresh&trailer&hold=${i}`);
  await page.waitForTimeout(30000); // the world is made about the place, and the light settles
  const file = `store/shots/scene-${i}.png`;
  await page.screenshot({ path: file });
  shots.push(file);
  console.log(file);
  await page.close();
}

/** The capsules: a still cropped to the shape, darkened toward the foot, the wordmark over it. */
const CAPSULES = [
  ['header', 460, 215],
  ['small', 231, 87],
  ['main', 616, 353],
  ['vertical', 374, 448],
  ['library', 600, 900],
  ['page-background', 1438, 810],
];
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto(`${base}/?look`);
const { readFileSync } = await import('node:fs');
for (const [name, w, h] of CAPSULES) {
  const src = shots[CAPSULES.findIndex(([n]) => n === name) % shots.length] ?? shots[0];
  const data = `data:image/png;base64,${readFileSync(src).toString('base64')}`;
  const url = await page.evaluate(async ({ data, w, h, name }) => {
    const { buildLogoArt } = await import('/src/ui/logoArt.ts');
    const { LOGO, SETTLED } = await import('/src/ui/logoPlan.ts');
    const img = await new Promise((ok) => Object.assign(new Image(), { src: data, onload() { ok(this); } }));
    const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
    const g = c.getContext('2d');
    const k = Math.max(w / img.width, h / img.height);
    g.drawImage(img, (w - img.width * k) / 2, (h - img.height * k) / 2, img.width * k, img.height * k);
    const fade = g.createLinearGradient(0, h * 0.35, 0, h);
    fade.addColorStop(0, '#0000');
    fade.addColorStop(1, '#050506e6');
    g.fillStyle = fade;
    g.fillRect(0, 0, w, h);
    const [lw, lh] = LOGO.size;
    const logo = Object.assign(document.createElement('canvas'), { width: lw, height: lh });
    const lg = logo.getContext('2d');
    const px = lg.createImageData(lw, lh);
    buildLogoArt().paint(px.data, SETTLED + 2);
    lg.putImageData(px, 0, 0);
    const scale = (w * (name === 'small' ? 0.8 : 0.66)) / lw;
    g.imageSmoothingEnabled = false;
    g.drawImage(logo, (w - lw * scale) / 2, h - lh * scale - h * 0.06, lw * scale, lh * scale);
    return c.toDataURL('image/png');
  }, { data, w, h, name });
  writeFileSync(`store/capsules/${name}-${w}x${h}.png`, Buffer.from(url.split(',')[1], 'base64'));
  console.log(`store/capsules/${name}-${w}x${h}.png`);
}
await browser.close();
