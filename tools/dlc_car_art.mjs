/**
 * Store art for the Brassbound Motor Car cosmetic DLC (docs/CAR_DLC_UPLOAD_TEMPLATE.md).
 * Captures 1920 x 1080 stills from the coach house (`?mounts`) and Arkham at night, then composites
 * the itch.io covers and Steam DLC capsules using the game's own wordmark (`src/ui/logoArt.ts`)
 * and `IM Fell English` title typography.
 *
 * Requires Playwright with Chromium (`npm i -D playwright` or PLAYWRIGHT_MODULE + CHROMIUM)
 * and the dev server running (`npm run dev`). Writes to `store/dlc-car/` (ignored by git).
 *
 *   node tools/dlc_car_art.mjs [http://localhost:5173]
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5173';
const out = 'store/dlc-car';
mkdirSync(`${out}/screenshots`, { recursive: true });
mkdirSync(`${out}/covers`, { recursive: true });

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])],
});

const SHOT = { timeout: 120_000, animations: 'allow' };

// 1. Coach house 1920x1080 studio shots
const coach = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await coach.goto(`${base}/?mounts`, { waitUntil: 'domcontentloaded' });
await coach.waitForSelector(".mount-exhibit button[data-mount='automobile']", { timeout: 90_000 });
await coach.waitForTimeout(8000);
await coach.click("button[data-mount='automobile']");
await coach.click("button[data-action='resolution']");
await coach.click("button[data-action='orbit']");
await coach.getByRole('button', { name: 'Three-quarter' }).click();
await coach.waitForTimeout(2500);
await coach.keyboard.press('h');

const box = await coach.locator('canvas').boundingBox();
const [cx, cy] = [box.x + box.width / 2, box.y + box.height / 2];
await coach.mouse.move(cx, cy);
await coach.mouse.wheel(0, -140);
await coach.mouse.down();
await coach.mouse.move(cx - 58, cy - 10, { steps: 12 });
await coach.mouse.up();
await coach.waitForTimeout(2500);
const heroFile = `${out}/screenshots/01-hero-three-quarter.png`;
await coach.screenshot({ ...SHOT, path: heroFile });
console.log(heroFile);

await coach.keyboard.press('h');
await coach.getByRole('button', { name: 'Profile' }).click();
await coach.keyboard.press('h');
await coach.waitForTimeout(1500);
await coach.mouse.move(cx, cy);
await coach.mouse.wheel(0, -150);
await coach.mouse.down();
await coach.mouse.move(cx + 310, cy + 20, { steps: 18 });
await coach.mouse.up();
await coach.waitForTimeout(2500);
await coach.screenshot({ ...SHOT, path: `${out}/screenshots/02-rear-three-quarter.png` });
console.log(`${out}/screenshots/02-rear-three-quarter.png`);

await coach.keyboard.press('h');
await coach.getByRole('button', { name: 'Profile' }).click();
await coach.keyboard.press('h');
await coach.waitForTimeout(1500);
await coach.mouse.move(cx, cy);
await coach.mouse.wheel(0, -140);
await coach.waitForTimeout(2000);
await coach.screenshot({ ...SHOT, path: `${out}/screenshots/03-side-profile.png` });
console.log(`${out}/screenshots/03-side-profile.png`);
await coach.close();

// 2. In-world Arkham shots & Elder Sign resting menu Mounts tab
const world = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
await world.goto(`${base}/?fresh&debug`, { waitUntil: 'domcontentloaded' });
await world.waitForFunction(() => window.game && window.world, null, { timeout: 150_000 });
for (let i = 0; i < 30; i++) {
  if (await world.evaluate(() => window.world?.pending === 0)) break;
  await world.waitForTimeout(2000);
}
await world.waitForTimeout(2000);
await world.keyboard.press('Enter');
await world.waitForTimeout(1500);
await world.keyboard.press('h');
await world.evaluate(async () => {
  const g = window.game;
  const { HINT_IDS, HINT_KEPT } = await import('/src/data/fieldGuide.ts');
  for (const id of HINT_IDS) g.overworld.told.add(HINT_KEPT + id);
  window.settings.fxCap = 0;
  const { setSanity } = await import('/src/systems/sanity.ts');
  setSanity(g, 100);
  const { QUESTS } = await import('/src/data/quests.ts');
  const { MOUNT_QUEST } = await import('/src/data/mounts.ts');
  g.overworld.quests.set(MOUNT_QUEST, QUESTS[MOUNT_QUEST].stages.length);
  const { rest } = await import('/src/systems/checkpoints.ts');
  rest(g, 'hub_quad');
});
await world.waitForTimeout(1500);
await world.evaluate(() => {
  const m = [...document.querySelectorAll('button')].find((b) => /mount/i.test(b.textContent || ''));
  m?.click();
});
await world.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
await world.waitForTimeout(1000);
await world.screenshot({ ...SHOT, path: `${out}/screenshots/05-elder-sign-mounts-tab.png` });
console.log(`${out}/screenshots/05-elder-sign-mounts-tab.png`);

await world.evaluate(async () => {
  const g = window.game;
  const back = [...document.querySelectorAll('button')].find((b) => /^back$/i.test((b.textContent || '').trim()));
  back?.click();
  g.player.kneeling = null;
  const { setAutomobileEntitlement, selectMount, toggleMount, controlMount } = await import('/src/systems/mounts.ts');
  const { movementSystem } = await import('/src/systems/movement.ts');
  const { emptyInput } = await import('/src/core/input.ts');
  const { setSanity } = await import('/src/systems/sanity.ts');
  setSanity(g, 100);
  setAutomobileEntitlement(g, true);
  selectMount(g, 'automobile');
  const tr = g.ecs.c.transform.get(g.player.id);
  for (const [x, z, yaw] of [[tr.pos.x, tr.pos.z + 4.5, 0.12], [tr.pos.x + 5, tr.pos.z + 5, 0.25], [tr.pos.x - 5, tr.pos.z + 5, -0.2]]) {
    tr.pos.x = tr.prev.x = x;
    tr.pos.z = tr.prev.z = z;
    tr.pos.y = tr.prev.y = g.world.ground(x, z);
    tr.yaw = tr.prevYaw = yaw;
    if (toggleMount(g)) break;
  }
  const inp = emptyInput();
  inp.moveY = 1;
  inp.moveX = 0.35;
  for (let i = 0; i < 55; i++) {
    controlMount(g, inp);
    movementSystem(g, 1 / 60);
  }
  g.player.mount.speed = 9.5;
  g.camera.yaw = g.camera.prevYaw = tr.yaw - 0.32;
  g.camera.pitch = g.camera.prevPitch = 0.22;
  g.camera.dist = g.camera.prevDist = 7.4;
});
await world.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
await world.waitForTimeout(2500);
await world.screenshot({ ...SHOT, path: `${out}/screenshots/04-arkham-night-drive.png` });
console.log(`${out}/screenshots/04-arkham-night-drive.png`);

await world.evaluate(() => {
  const g = window.game;
  const tr = g.ecs.c.transform.get(g.player.id);
  g.player.mount.speed = 6.5;
  g.camera.yaw = g.camera.prevYaw = tr.yaw + Math.PI - 0.56;
  g.camera.pitch = g.camera.prevPitch = 0.19;
  g.camera.dist = g.camera.prevDist = 5.6;
  document.querySelectorAll('body > div').forEach((d) => (d.style.visibility = 'hidden'));
});
await world.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
await world.waitForTimeout(2500);
await world.screenshot({ ...SHOT, path: `${out}/screenshots/06-investigator-at-the-wheel.png` });
console.log(`${out}/screenshots/06-investigator-at-the-wheel.png`);
await world.close();

// 3. Composite itch.io covers and Steam DLC capsules
const cpage = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
await cpage.goto(`${base}/?mounts`, { waitUntil: 'domcontentloaded' });
await cpage.waitForSelector('.mount-exhibit', { timeout: 60_000 });
await cpage.evaluate(() => document.fonts.ready);

const heroUri = `data:image/png;base64,${readFileSync(heroFile).toString('base64')}`;
const TARGETS = [
  ['itch-cover-630x500', 630, 500, 0.68, 0.5, 0.37, 0.78, 'full'],
  ['itch-social-1200x630', 1200, 630, 0.42, 0.5, 0.38, 0.54, 'full'],
  ['itch-wide-banner-2100x900', 2100, 900, 0.28, 0.5, 0.39, 0.44, 'full'],
  ['steam-header-460x215', 460, 215, 0.44, 0.5, 0.37, 0.48, 'compact'],
  ['steam-main-616x353', 616, 353, 0.52, 0.5, 0.37, 0.58, 'full'],
  ['steam-small-231x87', 231, 87, 0.52, 0.5, 0.42, 0.44, 'tiny'],
  ['steam-vertical-374x448', 374, 448, 0.78, 0.5, 0.36, 0.9, 'full'],
  ['steam-library-600x900', 600, 900, 0.8, 0.5, 0.38, 0.92, 'full'],
];

const made = await cpage.evaluate(async ({ heroUri, TARGETS }) => {
  const { buildLogoArt } = await import('/src/ui/logoArt.ts');
  const { LOGO, SETTLED } = await import('/src/ui/logoPlan.ts');
  const img = await new Promise((ok, bad) => Object.assign(new Image(), { onload() { ok(this); }, onerror: bad, src: heroUri }));
  const [lw, lh] = LOGO.size;
  const logo = Object.assign(document.createElement('canvas'), { width: lw, height: lh });
  const lg = logo.getContext('2d');
  const px = lg.createImageData(lw, lh);
  buildLogoArt().paint(px.data, SETTLED + 2);
  lg.putImageData(px, 0, 0);

  const files = {};
  for (const [name, w, h, share, cxNorm, cyNorm, carWShare, mode] of TARGETS) {
    const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
    const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#040508');
    bg.addColorStop(0.55, '#070910');
    bg.addColorStop(1, '#050508');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    const scaleByCarW = (w * carWShare) / (img.width * 0.48);
    const scaleByCarH = (h * (mode === 'tiny' ? 0.84 : 0.64)) / (img.height * 0.68);
    let scale = Math.min(scaleByCarW, scaleByCarH);
    scale = w >= h ? Math.max(scale, w / img.width) : Math.max(scale, (w * 0.96) / (img.width * 0.52));
    const [dw, dh] = [img.width * scale, img.height * scale];
    const [dx, dy] = [w * cxNorm - dw * 0.525, h * cyNorm - dh * 0.475];
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, dx, dy, dw, dh);

    if (h > w) {
      const topBlend = g.createLinearGradient(0, Math.max(0, dy), 0, Math.max(0, dy) + dh * 0.25);
      topBlend.addColorStop(0, '#040508');
      topBlend.addColorStop(1, 'rgba(4,5,8,0)');
      g.fillStyle = topBlend;
      g.fillRect(0, 0, w, Math.max(0, dy) + dh * 0.26);
      const botEdge = dy + dh;
      const botBlend = g.createLinearGradient(0, botEdge - dh * 0.28, 0, botEdge);
      botBlend.addColorStop(0, 'rgba(5,5,8,0)');
      botBlend.addColorStop(1, '#050508');
      g.fillStyle = botBlend;
      g.fillRect(0, botEdge - dh * 0.28, w, h - (botEdge - dh * 0.28));
    }

    const topFade = g.createLinearGradient(0, 0, 0, h * 0.22);
    topFade.addColorStop(0, 'rgba(4, 5, 8, 0.58)');
    topFade.addColorStop(1, 'rgba(4, 5, 8, 0)');
    g.fillStyle = topFade;
    g.fillRect(0, 0, w, h * 0.24);

    const fade = g.createLinearGradient(0, mode === 'tiny' ? h * 0.22 : h * 0.48, 0, h);
    fade.addColorStop(0, 'rgba(5, 5, 8, 0)');
    fade.addColorStop(0.56, 'rgba(5, 5, 8, 0.78)');
    fade.addColorStop(1, 'rgba(4, 4, 6, 0.97)');
    g.fillStyle = fade;
    g.fillRect(0, 0, w, h);

    if (w >= 370 && h >= 200) {
      g.strokeStyle = 'rgba(202, 158, 80, 0.30)';
      g.lineWidth = Math.max(1, Math.round(Math.min(w, h) * 0.0025));
      const inset = Math.round(Math.min(w, h) * 0.028);
      g.strokeRect(inset + 0.5, inset + 0.5, w - inset * 2 - 1, h - inset * 2 - 1);
    }

    const s = (w * share) / lw;
    const [logoW, logoH] = [lw * s, lh * s];
    if (mode === 'tiny') {
      g.imageSmoothingEnabled = false;
      g.drawImage(logo, (w - logoW) / 2, h * 0.14, logoW, logoH);
      g.imageSmoothingEnabled = true;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = `600 ${Math.round(h * 0.17)}px 'IM Fell English', Georgia, serif`;
      g.shadowColor = 'rgba(0, 0, 0, 0.95)';
      g.shadowBlur = 4;
      g.fillStyle = '#ead19c';
      g.fillText('BRASSBOUND MOTOR CAR', w / 2, h * 0.81);
    } else if (mode === 'compact') {
      const logoY = h - logoH - h * 0.23;
      g.imageSmoothingEnabled = false;
      g.drawImage(logo, (w - logoW) / 2, logoY, logoW, logoH);
      g.imageSmoothingEnabled = true;
      const ruleY = logoY + logoH + h * 0.035;
      const rule = g.createLinearGradient(w * 0.22, ruleY, w * 0.78, ruleY);
      rule.addColorStop(0, 'rgba(198,152,72,0)');
      rule.addColorStop(0.5, 'rgba(224,178,94,0.9)');
      rule.addColorStop(1, 'rgba(198,152,72,0)');
      g.fillStyle = rule;
      g.fillRect(w * 0.22, ruleY, w * 0.56, 1.5);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.shadowColor = 'rgba(0, 0, 0, 0.95)';
      g.shadowBlur = 6;
      g.font = `400 ${Math.round(h * 0.092)}px 'IM Fell English', Georgia, serif`;
      g.fillStyle = '#f2e7d2';
      g.fillText('THE BRASSBOUND MOTOR CAR', w / 2, ruleY + h * 0.095);
    } else {
      const subSize = Math.max(13, Math.round(Math.min(w * 0.04, h * 0.048)));
      const tagSize = Math.max(9, Math.round(subSize * 0.44));
      const tagY = h - h * 0.052;
      const subY = tagY - tagSize * 1.95;
      const ruleY = subY - subSize * 0.88;
      const logoY = ruleY - logoH - Math.max(4, h * 0.014);
      g.imageSmoothingEnabled = false;
      g.drawImage(logo, (w - logoW) / 2, logoY, logoW, logoH);
      g.imageSmoothingEnabled = true;
      const ruleHalf = Math.min(w * 0.34, logoW * 0.56);
      const rule = g.createLinearGradient(w / 2 - ruleHalf, ruleY, w / 2 + ruleHalf, ruleY);
      rule.addColorStop(0, 'rgba(198, 152, 72, 0)');
      rule.addColorStop(0.2, 'rgba(198, 152, 72, 0.72)');
      rule.addColorStop(0.5, 'rgba(236, 194, 112, 0.96)');
      rule.addColorStop(0.8, 'rgba(198, 152, 72, 0.72)');
      rule.addColorStop(1, 'rgba(198, 152, 72, 0)');
      g.fillStyle = rule;
      g.fillRect(w / 2 - ruleHalf, ruleY, ruleHalf * 2, Math.max(1.5, h * 0.0026));
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.shadowColor = 'rgba(0, 0, 0, 0.95)';
      g.shadowBlur = Math.max(6, Math.round(subSize * 0.35));
      g.font = `400 ${subSize}px 'IM Fell English', Georgia, serif`;
      g.fillStyle = '#f2e7d2';
      g.fillText('THE BRASSBOUND MOTOR CAR', w / 2, subY);
      g.shadowBlur = 4;
      g.font = `500 ${tagSize}px monospace`;
      g.fillStyle = '#cfa760';
      g.fillText('OPTIONAL COSMETIC MOUNT DLC'.split('').join('\u200A'), w / 2, tagY);
    }
    files[name] = c.toDataURL('image/png');
  }
  return files;
}, { heroUri, TARGETS });

for (const [name, url] of Object.entries(made)) {
  const path = `${out}/covers/${name}.png`;
  writeFileSync(path, Buffer.from(url.split(',')[1], 'base64'));
  console.log(path);
}
await browser.close();
