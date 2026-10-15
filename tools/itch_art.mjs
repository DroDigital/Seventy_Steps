/**
 * The itch.io page's pictures, made from the game itself (round 52; docs/RELEASE.md): screenshots, the cover and the profile
 * picture. Needs what tools/store_shots.mjs needs (Playwright with a Chromium: `npm i -D playwright` or point PLAYWRIGHT_MODULE and
 * CHROMIUM at yours, and the dev server running: `npm run dev`). Writes to `store/itch/` (ignored by git):
 *
 *   screenshots/NN-name.png   1920 × 1080: the title, the dream's places (`?trailer&hold=n`: the picture alone) and one with the HUD
 *   cover-630x500.png         the cover: a place, darkened toward its foot, the wordmark over it
 *   avatar-512.png            the profile picture: the Elder Sign (desktop/icon.js) on its dark, a plain square (the site crops it)
 *
 *   node tools/itch_art.mjs [http://localhost:5173] [--only title,0,3,hud] [--from <folder of your own PNGs>]
 *
 * A software renderer is slow (about a minute a picture) and flatter than a real GPU. With `--from` nothing is rendered: the pictures
 * in the folder (the game's photo mode, P, keeps one as a PNG) become the screenshots, and the cover is made from the first.
 */

import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { iconPng } from '../desktop/icon.js';

const args = process.argv.slice(2);
const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const base = args.find((a) => a.startsWith('http')) ?? 'http://localhost:5173';
const out = 'store/itch';
mkdirSync(`${out}/screenshots`, { recursive: true });
writeFileSync(`${out}/avatar-512.png`, iconPng(512, 'plain'));
console.log(`${out}/avatar-512.png`);

const SCENES = ['hub_quad', 'arkham_heath', 'innsmouth_reef', 'mountains_city', 'dream_zin', 'rlyeh_door', 'yuggoth_cities', 'beyond_court']; // (ui/trailer.ts)
const WAIT = 40000; // the world is made about the place and the light settles
/** What is photographed: [name, url, what to do once the world is up]. */
const SHOTS = [
  ['title', '/', null], // (opened by a key: see `take`)
  ...SCENES.map((s, i) => [`${String(i)}-${s}`, `/?fresh&trailer&hold=${i}`, null]),
  ['hud', '/?fresh', async (p) => (await p.keyboard.press('Enter'), await p.waitForTimeout(20000))], // the wake is skipped; the town, with its HUD
];
const only = flag('--only')?.split(',');
const todo = SHOTS.filter(([name]) => !only || only.some((o) => name === o || name.startsWith(`${o}-`)));

let files = [];
const from = flag('--from');
if (from) {
  files = readdirSync(from).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort().map((f, i) => {
    const to = `${out}/screenshots/${String(i + 1).padStart(2, '0')}-${f.replace(/\s+/g, '-')}`;
    copyFileSync(join(from, f), to);
    return to;
  });
} else {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])] });
  const take = async ([name, path, act], n) => {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    page.on('pageerror', (e) => console.log(`${name}: ${String(e).slice(0, 160)}`));
    await page.goto(`${base}${path}`);
    if (name === 'title') {
      await page.waitForTimeout(15000);
      await page.keyboard.press('Shift'); // the title opens out of the dark on the first key
      await page.waitForTimeout(12000);
    } else {
      await page.waitForTimeout(WAIT);
      if (act) await act(page);
    }
    const file = `${out}/screenshots/${String(n).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: file });
    console.log(file);
    await page.close();
    return file;
  };
  for (let i = 0; i < todo.length; i += 2) files.push(...(await Promise.all(todo.slice(i, i + 2).map((s, k) => take(s, i + k + 1))))); // (two at a time)
  await browser.close();
}

/** The cover: a place cropped to the shape, darkened toward the foot, the wordmark over it (as the store's capsules are). */
if (files.length) {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])] });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.goto(`${base}/?look`);
  const src = files.find((f) => /-0-hub_quad/.test(f)) ?? files[0];
  const data = `data:image/png;base64,${readFileSync(src).toString('base64')}`;
  const url = await page.evaluate(async ({ data, w, h }) => {
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
    const scale = (w * 0.74) / lw;
    g.imageSmoothingEnabled = false;
    g.drawImage(logo, (w - lw * scale) / 2, h - lh * scale - h * 0.04, lw * scale, lh * scale);
    return c.toDataURL('image/png');
  }, { data, w: 630, h: 500 });
  writeFileSync(`${out}/cover-630x500.png`, Buffer.from(url.split(',')[1], 'base64'));
  console.log(`${out}/cover-630x500.png`);
  await browser.close();
}
