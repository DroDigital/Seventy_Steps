/**
 * Walking stills of the realms, made from the game itself (docs/PRESS_KIT.md): the investigator seen from behind, lantern in hand,
 * mid-stride on the way out from an Elder Sign (or toward it), in the hour and weather each place is shown best in. No HUD, no prompt,
 * no sanity distortion. Needs what tools/store_shots.mjs needs (Playwright with a Chromium, and `npm run dev` running). Writes
 * `store/scenes/<name>.png` (ignored by git).
 *
 *   node tools/scene_shots.mjs [http://localhost:5173] [name ...]      every shot of SHOTS, or only those named
 *   W=1920 H=1080 node tools/scene_shots.mjs                            the size (1600 x 900 by default)
 *
 * A shot: `sign` the Elder Sign it is taken by; `dist` metres out from where one rests at it, `bear` radians off the way out (0: straight
 * away from the sign); `faceSign` walks toward the sign instead (`turn` adds to the heading); `walk` seconds of walking before the picture;
 * `phase` where in the night (0 gloaming, 0.3 the deep, 0.86 the waning's false dawn); `weather` rain, storm, gale or motes; `cam` the
 * camera's yaw off the investigator's back; `mount` summons the carriage, `stopFirst` seconds it stands before the picture. The camera
 * swings to the nearest angle whose line to the investigator no collider crosses. A software renderer takes four to eight minutes a shot.
 */

import { mkdirSync } from 'node:fs';

const SHOTS = [
  { name: '01_hub_night', sign: 'hub_dream', dist: 6, walk: 1.2, phase: 0.35 },
  { name: '02_arkham_heath_dusk_rain', sign: 'arkham_heath', dist: 5, walk: 1.2, phase: 0.04, weather: 'rain', cam: 0.5 },
  { name: '03_hub_elder_sign', sign: 'hub_quad', dist: 26, faceSign: true, walk: 0.5, phase: 0.4 },
  { name: '04_arkham_carriage', sign: 'arkham_streets', dist: 5, mount: true, walk: 2.5, stopFirst: 1.5, hold: 2500, phase: 0.12, cam: 1.2 },
  { name: '05_dunwich_hills_rain_dawn', sign: 'dunwich_hills', dist: 10, bear: 0.6, walk: 1.2, phase: 0.86, weather: 'rain', cam: -0.4 },
  { name: '06_innsmouth_square', sign: 'innsmouth_square', dist: 6, walk: 1.2, phase: 0.45 },
  { name: '07_innsmouth_reef_storm', sign: 'innsmouth_reef', dist: 5, walk: 1.2, phase: 0.5, weather: 'storm', cam: 0.5 },
  { name: '08_providence_benefit_rain', sign: 'prov_benefit', dist: 6, walk: 1.2, phase: 0.1, weather: 'rain' },
  { name: '09_kingsport', sign: 'prov_kingsport', dist: 6, walk: 1.2, phase: 0.9, cam: 0.6 },
  { name: '10_vermont_dark_mountain', sign: 'vermont_dark', dist: 6, walk: 1.2, phase: 0.25, weather: 'gale' },
  { name: '11_mountains_lakes_camp', sign: 'mountains_camp', dist: 6, walk: 1, phase: 0.88, weather: 'gale', cam: 0.4 },
  { name: '12_mountains_elder_city', sign: 'mountains_city', dist: 16, faceSign: true, walk: 0.5, phase: 0.5, weather: 'gale', cam: 0.6 },
  { name: '13_pnakotus_desert', sign: 'pnakotus_camp', dist: 6, walk: 1.2, phase: 0.88 },
  { name: '14_knyan_serpent_temple', sign: 'knyan_serpents', dist: 12, faceSign: true, walk: 0.5, phase: 0.4, cam: 0.5 },
  { name: '15_dream_enchanted_wood', sign: 'dream_wood', dist: 6, walk: 1.2, phase: 0.3, weather: 'motes' },
  { name: '16_dream_ulthar', sign: 'dream_ulthar', dist: 14, faceSign: true, walk: 0.5, phase: 0.06, cam: 0.5 },
  { name: '17_dream_shores_of_ib', sign: 'dream_sarnath', dist: 6, walk: 1.2, phase: 0.9 },
  { name: '18_dream_hatheg_kla', sign: 'dream_hatheg', dist: 6, walk: 1.2, phase: 0.3, cam: -0.5 },
  { name: '19_rlyeh_great_door', sign: 'rlyeh_door', dist: 10, faceSign: true, turn: Math.PI, walk: 1.2, phase: 0.4, weather: 'storm' },
  { name: '20_yuggoth_rivers_of_pitch', sign: 'yuggoth_pitch', dist: 6, walk: 1.2, phase: 0.4, cam: 0.5 },
  { name: '21_beyond_last_shore', sign: 'beyond_shore', dist: 6, walk: 1.2, phase: 0.4 },
  { name: '22_cloud_summit', sign: 'cloud_sign', dist: 6, walk: 1.2, phase: 0.4, cam: 0.5 },
  { name: '23_black_wood', sign: 'wood_clearing', dist: 6, walk: 1.2, phase: 0.4 },
  { name: '24_pale_lattice', sign: 'lattice_vertex', dist: 6, walk: 1.2, phase: 0.4, cam: -0.5 },
  { name: '25_shore_of_hours', sign: 'spheres_shore', dist: 6, walk: 1.2, phase: 0.4 },
  { name: '26_cavern_of_flame', sign: 'dream_cavern', dist: 2, walk: 0.4, phase: 0.4 },
];

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith('http')) ?? 'http://localhost:5173';
const only = args.filter((a) => !a.startsWith('http'));
const [W, H] = [Number(process.env.W ?? 1600), Number(process.env.H ?? 900)];
mkdirSync('store/scenes', { recursive: true });
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => console.log(String(e).slice(0, 160)));
await page.goto(`${base}/?fresh&debug`);
await page.waitForFunction(() => window.game && window.world, null, { timeout: 240000 });
await page.waitForTimeout(8000);
await page.keyboard.press('Enter'); // the wake is skipped
await page.keyboard.press('h'); // the debug panel away
await page.evaluate(async () => {
  const g = window.game;
  const { HINT_IDS, HINT_KEPT } = await import('/src/data/fieldGuide.ts');
  const { QUESTS } = await import('/src/data/quests.ts');
  const { MOUNT_QUEST } = await import('/src/data/mounts.ts');
  for (const id of HINT_IDS) g.overworld.told.add(HINT_KEPT + id); // no hint over the picture
  g.overworld.quests.set(MOUNT_QUEST, QUESTS[MOUNT_QUEST].stages.length); // the carriage may be summoned
  window.settings.fxCap = 0; // no sanity distortion
  g.ecs.c.health.get(g.player.id).immortal = true;
});

/** Everything but the game's canvas hidden, over whatever visibility or opacity the HUD sets itself each frame. */
const bare = (on) => page.evaluate((on) => {
  let css = document.getElementById('scene-shot');
  if (!css) {
    for (let el = window.pipeline.renderer.domElement; el && el !== document.documentElement; el = el.parentElement) el.dataset.keep = '1';
    css = Object.assign(document.createElement('style'), { id: 'scene-shot' });
    document.head.append(css);
  }
  css.textContent = on ? 'body *:not([data-keep]) { visibility: hidden !important; opacity: 0 !important; }' : '';
}, on);

for (const s of SHOTS.filter((x) => !only.length || only.includes(x.name))) {
  const t0 = Date.now();
  await page.evaluate(async (s) => {
    const g = window.game;
    const { teleport, signPlace, discover } = await import('/src/systems/checkpoints.ts');
    const { CLOCK } = await import('/src/data/lifeTuning.ts');
    const { SIM } = await import('/src/data/tuning.ts');
    const { dismissMount } = await import('/src/systems/mounts.ts');
    dismissMount(g);
    const sign = signPlace(s.sign);
    discover(g, s.sign); // a lit sign, no beacon over it
    const dir = Math.atan2(sign.x - sign.rest.x, sign.z - sign.rest.z) + Math.PI + (s.bear ?? 0);
    const x = sign.rest.x + Math.sin(dir) * (s.dist ?? 0);
    const z = sign.rest.z + Math.cos(dir) * (s.dist ?? 0);
    const yaw = (s.faceSign ? Math.atan2(sign.x - x, sign.z - z) : dir) + (s.turn ?? 0);
    teleport(g, { x, z, yaw });
    const secs = g.frame / SIM.hz; // the night hurried on to the hour asked (systems/clock.ts)
    g.overworld.hurried = ((((s.phase ?? 0.3) - CLOCK.start) * CLOCK.night - secs) % CLOCK.night + CLOCK.night) % CLOCK.night;
    const kind = s.weather ?? 'clear';
    Object.assign(g.overworld.weather, { kind, want: kind, amount: kind === 'clear' ? 0 : 1, until: g.frame + 216000 });
  }, s);
  for (let i = 0; i < 60 && !(await page.evaluate(() => window.world.pending === 0).catch(() => false)); i++) await page.waitForTimeout(2000);
  await page.waitForTimeout(6000); // the light and the mist settle
  if (s.mount) {
    await page.evaluate(async () => (await import('/src/systems/mounts.ts')).toggleMount(window.game));
    await page.waitForTimeout(1500);
  }
  if (s.walk) await page.keyboard.down('KeyW');
  await page.waitForTimeout((s.walk ?? 0) * 1000);
  if (s.stopFirst) { await page.keyboard.up('KeyW'); await page.waitForTimeout(s.stopFirst * 1000); }
  const shift = await page.evaluate(async (s) => {
    const g = window.game;
    const { setSanity } = await import('/src/systems/sanity.ts');
    const { raycast } = await import('/src/world/colliders.ts');
    setSanity(g, 100);
    const p = g.ecs.c.transform.get(g.player.id).pos;
    const pitch = s.pitch ?? 0.14;
    const clear = (yaw) => [-0.9, 0, 0.9, 1.6].every((side) => [0.6, 1.6, 2.6].every((h) => {
      const a = { x: p.x - Math.cos(yaw) * side, y: p.y + h, z: p.z + Math.sin(yaw) * side };
      const reach = g.camera.dist + 4;
      return raycast(g.world, a, { x: a.x - Math.sin(yaw) * reach, y: a.y + Math.sin(pitch) * reach, z: a.z - Math.cos(yaw) * reach }) >= 0.999;
    }));
    const want = g.ecs.c.transform.get(g.player.id).yaw + (s.cam ?? 0);
    const d = [0, 0.25, -0.25, 0.5, -0.5, 0.8, -0.8, 1.1, -1.1, 1.5, -1.5, 2, -2, 2.6, -2.6, Math.PI].find((k) => clear(want + k)) ?? 0;
    Object.assign(g.camera, { yaw: want + d, prevYaw: want + d, pitch, prevPitch: pitch });
    return d;
  }, s);
  await bare(true);
  await page.waitForTimeout(s.hold ?? 1200);
  await page.screenshot({ path: `store/scenes/${s.name}.png` });
  await bare(false);
  await page.keyboard.up('KeyW');
  console.log(`store/scenes/${s.name}.png (camera ${shift >= 0 ? '+' : ''}${shift.toFixed(2)}, ${Math.round((Date.now() - t0) / 1000)} s)`);
}
await browser.close();
