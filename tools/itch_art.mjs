/**
 * The itch.io page's pictures, made from the game itself (round 52; docs/RELEASE.md). Needs what tools/store_shots.mjs needs
 * (Playwright with a Chromium: `npm i -D playwright` or point PLAYWRIGHT_MODULE and CHROMIUM at yours, and the dev server running:
 * `npm run dev`). Writes to `store/itch/` (ignored by git).
 *
 *   node tools/itch_art.mjs frames [boss id ...]   photographs fights: the investigator walks into each horror's ring (the default:
 *                                                  cthulhu shub_niggurath yog_sothoth hastur colossus_pyramids) and strikes, a picture
 *                                                  every second or two for --seconds (90) into frames/<boss>-NN.png, and the same
 *                                                  moment without the HUD as -NN-clean.png; and the title (frames/title.png).
 *                                                  Choose the best by eye.
 *   node tools/itch_art.mjs pack --hero <png> [<png> ...]
 *                                                  makes the page's set from chosen pictures: screenshots/ (numbered, as given), the
 *                                                  cover (630 x 500), the social image (1200 x 630), the wide cover (21:9, 2100 x 900),
 *                                                  the logo (a transparent PNG) and the profile picture (512, the Elder Sign); the
 *                                                  --hero picture (a -clean one) is what the cover, the social image and the wide cover are cut from
 *
 * The pictures are 1920 x 1080 with no sanity distortion (the effects' cap set to 0, sanity held at 100: a warped picture looks like
 * a fault), no hints, and the HUD as it is. A software renderer is slow (a minute a place) and flatter than a real GPU.
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { iconPng } from '../desktop/icon.js';

const args = process.argv.slice(2);
const mode = args[0];
const flag = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const base = args.find((a) => a.startsWith('http')) ?? 'http://localhost:5173';
const out = 'store/itch';
mkdirSync(`${out}/frames`, { recursive: true });
mkdirSync(`${out}/screenshots`, { recursive: true });
const launch = async () => {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
  return chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])] });
};

if (mode === 'frames') {
  const bosses = args.slice(1).filter((a) => !a.startsWith('http') && !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--seconds');
  const todo = bosses.length ? bosses : ['cthulhu', 'shub_niggurath', 'yog_sothoth', 'hastur', 'colossus_pyramids'];
  const seconds = Number(flag('--seconds', 90));
  const browser = await launch();
  const title = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await title.goto(`${base}/`);
  await title.waitForTimeout(15000);
  await title.keyboard.press('Shift'); // the title opens out of the dark on the first key
  await title.waitForTimeout(12000);
  await title.screenshot({ path: `${out}/frames/title.png` });
  await title.close();
  console.log(`${out}/frames/title.png`);
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.log(String(e).slice(0, 160)));
  await page.goto(`${base}/?fresh&debug`);
  await page.waitForFunction(() => window.game && window.world, null, { timeout: 120000 });
  await page.waitForTimeout(12000);
  await page.keyboard.press('Enter'); // the wake is skipped
  await page.keyboard.press('h'); // the debug panel away
  await page.evaluate(async () => {
    const { HINT_IDS, HINT_KEPT } = await import('/src/data/fieldGuide.ts');
    for (const id of HINT_IDS) window.game.overworld.told.add(HINT_KEPT + id); // no hint over the picture
    window.settings.fxCap = 0; // no sanity distortion
  });
  for (const id of todo) {
    await page.evaluate(async (boss) => {
      const g = window.game;
      const { teleport } = await import('/src/systems/checkpoints.ts');
      const { worldLayout } = await import('/src/world/placements.ts');
      const { priorOf } = await import('/src/systems/sealCount.ts');
      const sp = worldLayout().spawns.find((x) => x.id === `boss:${boss}`);
      const a = worldLayout().arenas.find((x) => x.bosses.includes(boss)) ?? { x: sp.at.x, z: sp.at.z, radius: sp.arena.radius };
      const prior = priorOf(sp.entity);
      if (prior) g.overworld.slain.add(`boss:${prior}`); // the order of the Beyond kept
      if (sp.entity === 'hastur') { Object.assign(g.overworld, { named: 3 }); g.overworld.called.add('hastur'); }
      teleport(g, { x: a.x, z: a.z - a.radius + 3, yaw: 0 });
      g.ecs.c.health.get(g.player.id).immortal = true;
    }, id);
    for (let i = 0; i < 80; i++) { // until the chunks are made and the horror stands
      await page.waitForTimeout(3000);
      const ready = await page.evaluate((boss) => window.world.pending === 0 && [...window.game.ecs.c.fight.values()].some((f) => f.id === boss), id).catch(() => false);
      if (ready) break;
    }
    await page.keyboard.down('KeyW');
    const end = Date.now() + seconds * 1000;
    for (let n = 0; Date.now() < end; n++) {
      const d = await page.evaluate(async () => {
        const g = window.game, c = g.ecs.c;
        const { setSanity } = await import('/src/systems/sanity.ts');
        setSanity(g, 100);
        const boss = [...c.fight.keys()][0];
        if (boss === undefined) return null;
        const p = c.transform.get(g.player.id).pos, q = c.transform.get(boss).pos;
        if (!window.cinema.active) g.camera.yaw = g.camera.prevYaw = Math.atan2(q.x - p.x, q.z - p.z); // the camera on the horror
        return Math.hypot(q.x - p.x, q.z - p.z) - (c.body.get(boss)?.radius ?? 0.5);
      }).catch(() => null);
      if (d !== null && d < 2.5) { await page.mouse.down(); await page.waitForTimeout(50); await page.mouse.up(); } // a blow
      await page.keyboard[d !== null && d < 8 ? 'up' : 'down']('KeyW');
      const file = `${out}/frames/${id}-${String(n).padStart(2, '0')}.png`;
      await page.screenshot({ path: file });
      const hud = (v) => page.evaluate((v) => document.querySelectorAll('body > div').forEach((d) => (d.style.visibility = v)), v);
      await hud('hidden'); // and the same moment without the HUD: what a cover or a social image is cut from
      await page.screenshot({ path: file.replace('.png', '-clean.png') });
      await hud('');
      console.log(file);
      await page.waitForTimeout(1200);
    }
    await page.keyboard.up('KeyW');
  }
  await browser.close();
} else if (mode === 'pack') {
  const hero = flag('--hero');
  if (!hero) throw new Error('pack: --hero <the picture the cover is cut from>');
  const shots = args.slice(1).filter((a) => /\.(png|jpe?g)$/i.test(a));
  shots.forEach((f, i) => copyFileSync(f, `${out}/screenshots/${String(i + 1).padStart(2, '0')}.png`));
  writeFileSync(`${out}/profile-picture-512.png`, iconPng(512, 'plain'));
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.goto(`${base}/?look`);
  const data = `data:image/png;base64,${readFileSync(hero).toString('base64')}`;
  /** [file, width, height, the wordmark's width as a share of it, where its centre stands across]: the picture cut to the shape, darkened toward the foot. */
  const TARGETS = [['cover-630x500', 630, 500, 0.74, 0.5], ['social-1200x630', 1200, 630, 0.46, 0.5], ['wide-cover-2100x900', 2100, 900, 0.3, 0.5]];
  const made = await page.evaluate(async ({ data, TARGETS }) => {
    const { buildLogoArt } = await import('/src/ui/logoArt.ts');
    const { LOGO, SETTLED } = await import('/src/ui/logoPlan.ts');
    const img = await new Promise((ok) => Object.assign(new Image(), { src: data, onload() { ok(this); } }));
    const [lw, lh] = LOGO.size;
    const logo = Object.assign(document.createElement('canvas'), { width: lw, height: lh });
    const lg = logo.getContext('2d');
    const px = lg.createImageData(lw, lh);
    buildLogoArt().paint(px.data, SETTLED + 2);
    lg.putImageData(px, 0, 0);
    const files = {};
    for (const [name, w, h, share, across] of TARGETS) {
      const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
      const g = c.getContext('2d');
      const k = Math.max(w / img.width, h / img.height);
      g.drawImage(img, (w - img.width * k) / 2, (h - img.height * k) * 0.4, img.width * k, img.height * k);
      const fade = g.createLinearGradient(0, h * 0.35, 0, h);
      fade.addColorStop(0, '#0000');
      fade.addColorStop(1, '#050506e6');
      g.fillStyle = fade;
      g.fillRect(0, 0, w, h);
      const s = (w * share) / lw;
      g.imageSmoothingEnabled = false;
      g.drawImage(logo, w * across - (lw * s) / 2, h - lh * s - h * 0.04, lw * s, lh * s);
      files[name] = c.toDataURL('image/png');
    }
    const big = Object.assign(document.createElement('canvas'), { width: lw * 4, height: lh * 4 }); // the wordmark alone, transparent, four times
    const bg = big.getContext('2d');
    bg.imageSmoothingEnabled = false;
    bg.drawImage(logo, 0, 0, lw * 4, lh * 4);
    files['logo-transparent'] = big.toDataURL('image/png');
    return files;
  }, { data, TARGETS });
  for (const [name, url] of Object.entries(made)) {
    writeFileSync(`${out}/${name}.png`, Buffer.from(url.split(',')[1], 'base64'));
    console.log(`${out}/${name}.png`);
  }
  await browser.close();
} else {
  console.log('node tools/itch_art.mjs frames [boss id ...] [--seconds 90]   |   node tools/itch_art.mjs pack --hero <png> [<png> ...]   (see the header)');
}
