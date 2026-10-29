/**
 * Photograph the optional material studies in the real game renderer.
 *
 *   node tools/surface_studies.mjs [http://127.0.0.1:5173] [--scenes 0,1,6] [--out store/surface-studies]
 *
 * Needs a running Vite server and Playwright/Chromium (PLAYWRIGHT_MODULE and CHROMIUM
 * select installed copies). Each place loads once; the existing effects lab then holds
 * the simulation while the material uniform changes. Baseline and studies therefore
 * show the same camera, weather, lights and animation frame. PNGs are untouched browser
 * screenshots. diagnostics.json records runtime and shader errors; errors fail the run.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const flag = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const base = args.find((arg) => /^https?:\/\//.test(arg)) ?? 'http://127.0.0.1:5173';
const out = resolve(flag('--out', 'store/surface-studies'));
const scenes = flag('--scenes', '0').split(',').map(Number);
if (scenes.some((scene) => !Number.isInteger(scene) || scene < 0 || scene > 7)) throw new Error('--scenes must contain trailer scene numbers 0–7');
const runtimeModule = '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const modulePath = process.env.PLAYWRIGHT_MODULE ?? (existsSync(runtimeModule) ? pathToFileURL(runtimeModule).href : 'playwright');
const pw = await import(modulePath);
const chromium = pw.chromium ?? pw.default.chromium;
const executablePath = process.env.CHROMIUM ?? ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].find(existsSync);
const browser = await chromium.launch({
  executablePath,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])],
});
const modes = [['baseline', 0], ['carved', 1], ['ceramic', 2], ['facets', 3]];
const diagnostics = { base, scenes, screenshots: [], errors: [], warnings: [] };
mkdirSync(out, { recursive: true });
// Close Chromium on interruption too; a slow software shader compile otherwise outlives Node.
const interrupt = async () => {
  await browser.close();
  process.exit(130);
};
process.once('SIGINT', interrupt);
process.once('SIGTERM', interrupt);

try {
  for (const scene of scenes) {
    console.log(`Loading trailer scene ${scene}...`);
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    page.setDefaultTimeout(180000);
    const record = (kind, message) => {
      const item = { scene, message: String(message).slice(0, 6000) };
      diagnostics[kind].push(item);
      if (kind === 'errors') console.error(item.message);
    };
    page.on('pageerror', (error) => record('errors', error.stack ?? error));
    page.on('console', (message) => {
      if (message.type() === 'error') record('errors', message.text());
      else if (message.type() === 'warning') record('warnings', message.text());
    });
    // A new page gets fresh defaults and no pre-existing save. The explicit query only
    // enables the comparison code; it does not select a different brightness/FX level.
    await page.goto(`${base}/?fresh&debug&trailer&hold=${scene}&still&study=carved`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.game && window.world && window.pipeline && window.fxlab);
    console.log(`Scene ${scene}: renderer ready; waiting for world and veil.`);
    await page.waitForFunction(() => window.world?.pending === 0 && window.pipeline && window.fxlab && [...document.querySelectorAll('canvas[data-veil]')].every((canvas) => getComputedStyle(canvas).display === 'none'));
    await page.evaluate(async () => {
      window.fxlab.hold(true);
      const { worldUniforms } = await import('/src/render/worldMaterial.ts');
      if (!worldUniforms.uStudy) throw new Error('The surface studies are not installed: worldUniforms.uStudy is missing');
      window.__surfaceStudyUniform = worldUniforms.uStudy;
      const canvas = window.pipeline.renderer.domElement;
      canvas.dataset.surfaceCapture = '';
      for (const node of document.body.children) if (node !== canvas && node instanceof HTMLElement) node.style.visibility = 'hidden';
    });
    console.log(`Scene ${scene}: frame held.`);
    // Let the held pose and shadow maps settle once, before taking any mode.
    await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
    for (const [name, value] of modes) {
      await page.evaluate((value) => { window.__surfaceStudyUniform.value = value; }, value);
      await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
      const file = resolve(out, `scene-${scene}-${name}.png`);
      await page.locator('canvas[data-surface-capture]').screenshot({ path: file, timeout: 180000 });
      const state = await page.evaluate(() => {
        const pipeline = window.pipeline;
        const programs = pipeline.renderer.info.programs ?? [];
        const failed = programs.filter((program) => program.diagnostics?.runnable === false).map((program) => program.diagnostics);
        const frame = pipeline.grab();
        let sum = 0, nonzero = 0, sceneHash = 2166136261;
        for (let i = 0; i < frame.data.length; i += 4) {
          const light = frame.data[i] + frame.data[i + 1] + frame.data[i + 2];
          sum += light;
          if (light > 0) nonzero++;
          for (let channel = 0; channel < 3; channel++) sceneHash = Math.imul(sceneHash ^ frame.data[i + channel], 16777619) >>> 0;
        }
        return {
          mode: window.__surfaceStudyUniform.value,
          brightness: window.settings.brightness,
          resolution: [frame.width, frame.height],
          nonzeroPixels: nonzero,
          meanSceneChannel: sum / (frame.width * frame.height * 3),
          sceneHash: sceneHash.toString(16).padStart(8, '0'),
          calls: pipeline.renderer.info.render.calls,
          triangles: pipeline.renderer.info.render.triangles,
          failedPrograms: failed,
        };
      });
      diagnostics.screenshots.push({ scene, name, file, ...state });
      if (state.nonzeroPixels === 0) record('errors', `${name}: scene render target is entirely black`);
      if (state.failedPrograms.length) record('errors', `${name}: ${JSON.stringify(state.failedPrograms)}`);
      console.log(file);
    }
    await page.close();
  }
} catch (error) {
  diagnostics.errors.push({ message: String(error.stack ?? error) });
  throw error;
} finally {
  writeFileSync(resolve(out, 'diagnostics.json'), `${JSON.stringify(diagnostics, null, 2)}\n`);
  await browser.close();
  if (diagnostics.errors.length) process.exitCode = 1;
}
