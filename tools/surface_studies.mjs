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
const saveDiagnostics = () => writeFileSync(resolve(out, 'diagnostics.json'), `${JSON.stringify(diagnostics, null, 2)}\n`);
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
    page.setDefaultTimeout(600000);
    const record = (kind, message) => {
      const item = { scene, message: String(message).slice(0, 6000) };
      diagnostics[kind].push(item);
      if (kind === 'errors') console.error(item.message);
      saveDiagnostics();
    };
    page.on('pageerror', (error) => record('errors', error.stack ?? error));
    page.on('console', (message) => {
      if (message.type() === 'error') record('errors', message.text());
      else if (message.type() === 'warning') record('warnings', message.text());
    });
    // A new page gets fresh defaults and no pre-existing save. The explicit query only
    // enables the comparison code; it does not select a different brightness/FX level.
    await page.goto(`${base}/?fresh&debug&trailer&hold=${scene}&still&studies&study=off`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.game && window.world && window.pipeline && window.fxlab);
    console.log(`Scene ${scene}: renderer ready; waiting for world and veil.`);
    const readinessDeadline = Date.now() + 600000;
    for (;;) {
      try {
        await page.waitForFunction(() => window.world && window.pipeline && window.fxlab && [...document.querySelectorAll('canvas[data-veil]')].every((canvas) => getComputedStyle(canvas).display === 'none'), null, { timeout: 30000 });
        break;
      } catch (error) {
        if (error.name !== 'TimeoutError' || Date.now() >= readinessDeadline) throw error;
        // Shader linking can block the renderer thread; log that explicitly instead of
        // abandoning an otherwise healthy page and restarting all its cold compilation.
        const progress = await Promise.race([
          page.evaluate(() => ({
            pending: window.world?.pending,
            programs: window.pipeline?.renderer.info.programs?.length,
            veil: [...document.querySelectorAll('canvas[data-veil]')].map((canvas) => getComputedStyle(canvas).display),
            text: document.body.innerText.slice(0, 400),
          })).catch((error) => ({ error: String(error) })),
          new Promise((done) => setTimeout(() => done({ rendererThreadBusy: true }), 5000)),
        ]);
        console.log(`Scene ${scene} loading: ${JSON.stringify(progress)}`);
        diagnostics.progress = { scene, at: new Date().toISOString(), ...progress };
        saveDiagnostics();
        if (!existsSync(resolve(out, `scene-${scene}-loading.png`))) {
          const session = await page.context().newCDPSession(page);
          const shot = await Promise.race([
            session.send('Page.captureScreenshot', { format: 'png', fromSurface: true }).catch(() => null),
            new Promise((done) => setTimeout(() => done(null), 5000)),
          ]);
          if (shot?.data) writeFileSync(resolve(out, `scene-${scene}-loading.png`), Buffer.from(shot.data, 'base64'));
          await session.detach();
        }
      }
    }
    const drained = await page.evaluate(async () => {
      window.fxlab.hold(true);
      // The visible journey finishes before a few distant streaming jobs do. Finish those
      // CPU generation jobs explicitly, rather than waiting for many software-rendered
      // frames with the normal tiny interactive budget. This changes no scene content.
      const at = window.game.ecs.c.transform.get(window.game.player.id).pos;
      const before = window.world.pending;
      for (let i = 0; i < 20 && window.world.pending > 0; i++) window.world.update(at.x, at.z, 1000);
      if (window.world.pending > 0) throw new Error(`World generation did not settle: ${window.world.pending} jobs remain`);
      // Read the material references the scene actually uses. A plain dynamic import can
      // create a second module singleton when Vite has timestamped its HMR import graph.
      const uniforms = new Set();
      let eligibleMaterials = 0;
      window.scene.traverse((object) => {
        for (const material of [object.material ?? []].flat()) {
          if (!material.uniforms?.uStudy) continue;
          uniforms.add(material.uniforms.uStudy);
          if (material.uniforms.uStudyOn?.value > 0.5) eligibleMaterials++;
        }
      });
      if (!uniforms.size || !eligibleMaterials) throw new Error('No eligible surface-study materials are present in the active scene');
      window.__surfaceStudyUniforms = [...uniforms];
      const canvas = window.pipeline.renderer.domElement;
      canvas.dataset.surfaceCapture = '';
      for (const node of document.body.children) if (node !== canvas && node instanceof HTMLElement) node.style.visibility = 'hidden';
      return { before, pending: window.world.pending, programs: window.pipeline.renderer.info.programs?.length, eligibleMaterials, studyUniformObjects: uniforms.size };
    });
    console.log(`Scene ${scene}: frame held; generation ${JSON.stringify(drained)}.`);
    // Let the held pose and shadow maps settle once, before taking any mode.
    await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
    for (const [name, value] of modes) {
      // Exercise the real comparison control, then check the active scene's uniform objects.
      // Use a DOM click rather than pointer input: the overlay is hidden in the screenshots.
      const selected = await page.evaluate((value) => {
        const buttons = [...document.querySelectorAll('#surface-studies button')];
        if (buttons.length !== 4) throw new Error('The live surface-study controls are missing');
        buttons[value].click();
        const values = window.__surfaceStudyUniforms.map((uniform) => uniform.value);
        if (values.some((mode) => mode !== value)) throw new Error(`Live controls did not update active materials: ${JSON.stringify(values)}`);
        return values;
      }, value);
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
          mode: window.__surfaceStudyUniforms[0].value,
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
      const previous = diagnostics.screenshots.filter((shot) => shot.scene === scene);
      diagnostics.screenshots.push({ scene, name, file, activeUniformValues: selected, ...drained, ...state });
      if (state.nonzeroPixels === 0) record('errors', `${name}: scene render target is entirely black`);
      if (state.failedPrograms.length) record('errors', `${name}: ${JSON.stringify(state.failedPrograms)}`);
      for (const shot of previous) if (shot.sceneHash === state.sceneHash) record('errors', `${name}: rendered frame is identical to ${shot.name}`);
      console.log(file);
      saveDiagnostics();
    }
    await page.close();
  }
} catch (error) {
  diagnostics.errors.push({ message: String(error.stack ?? error) });
  throw error;
} finally {
  saveDiagnostics();
  await browser.close();
  if (diagnostics.errors.length) process.exitCode = 1;
}
