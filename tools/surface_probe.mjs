/** Actual WebGL checks for the surface studies. Run with a Vite server: node tools/surface_probe.mjs [url]. */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const runtime = '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? (existsSync(runtime) ? pathToFileURL(runtime).href : 'playwright'));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? ['/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])],
});
const errors = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  // Keep the origin and Vite module loader without booting the game's simulation.
  await page.route(`${base}/`, (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' }));
  await page.goto(`${base}/`);
  const results = await page.evaluate(async () => {
    const THREE = await import('/node_modules/.vite/deps/three.js');
    const { createWorldMaterial, worldUniforms: u } = await import('/src/render/worldMaterial.ts');
    const { createPostPass } = await import('/src/render/postPass.ts');
    THREE.ColorManagement.enabled = false;
    const size = [128, 72];
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setSize(...size);
    renderer.setClearColor(0, 1);
    const target = new THREE.WebGLRenderTarget(...size, { depthTexture: new THREE.DepthTexture(...size) });
    const output = new THREE.WebGLRenderTarget(...size);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, size[0] / size[1], 0.1, 100);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    const geometry = new THREE.SphereGeometry(1.25, 14, 10);
    const mesh = new THREE.Mesh(geometry, createWorldMaterial({ texture: 'stone', uvScale: [7, 7] }));
    scene.add(mesh);
    u.uRes.value.set(...size);
    u.uCamPos.value.copy(camera.position);
    u.uLightDir.value.set(0.65, 0.3, 0.7).normalize();
    u.uLightColor.value.set(0.6, 0.62, 0.7);
    u.uAmbient.value.set(0.18, 0.2, 0.22);
    u.uLanternPos.value.set(-1.3, 1.4, 2.1);
    u.uLanternColor.value.set(0.8, 0.5, 0.2);
    u.uGlowColor.value.set(0, 0, 0);
    u.uFogAmount.value = 0;
    u.uWet.value = 0;
    const bytes = new Uint8Array(size[0] * size[1] * 4);
    const checks = [];
    const assert = (name, passed, evidence = {}) => {
      checks.push({ name, passed, ...evidence });
      if (!passed) throw new Error(`${name}: ${JSON.stringify(evidence)}`);
    };
    const read = (rt) => {
      renderer.readRenderTargetPixels(rt, 0, 0, ...size, bytes);
      const pixels = Uint8Array.from(bytes);
      let sum = 0, max = 0, count = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const light = pixels[i] + pixels[i + 1] + pixels[i + 2];
        sum += light;
        max = Math.max(max, pixels[i], pixels[i + 1], pixels[i + 2]);
        if (light) count++;
      }
      return { pixels, sum, max, count };
    };
    const render = (mode) => {
      u.uStudy.value = mode;
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      return read(target);
    };
    const difference = (a, b) => a.pixels.reduce((sum, value, index) => sum + (index % 4 === 3 ? 0 : Math.abs(value - b.pixels[index])), 0);
    const normal = [0, 1, 2, 3].map(render);
    assert('all four solid-surface modes render lit pixels', normal.every((frame) => frame.count > 100), { nonzero: normal.map((frame) => frame.count) });
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) {
      const delta = difference(normal[a], normal[b]);
      assert(`surface modes ${a} and ${b} differ`, delta > 200, { delta });
    }
    const materialTests = [
      ['player', { texture: 'cloth', character: 'player' }],
      ['creature', { texture: 'flesh', character: 'creature' }],
      ['emissive', { texture: 'stone', emissive: 1 }],
      ['glass', { texture: 'stone', surface: 'glass', opacity: 0.6 }],
      ['wax', { texture: 'stone', surface: 'wax' }],
      ['mirror', { texture: 'stone', surface: 'mirror' }],
      ['liquid', { texture: 'water', surface: 'liquid' }],
    ];
    for (const [name, options] of materialTests) {
      mesh.material.dispose();
      mesh.material = createWorldMaterial(options);
      const base = render(0);
      const deltas = [1, 2, 3].map((mode) => difference(base, render(mode)));
      assert(`${name} pixels stay unchanged`, deltas.every((delta) => delta === 0), { deltas });
    }
    mesh.material.dispose();
    mesh.material = createWorldMaterial({ texture: 'stone', uvScale: [7, 7] });
    mesh.material.uniforms.uEmissive.value = 0.6; // A hit flash changed after creation.
    const flashed = render(0);
    const flashDeltas = [1, 2, 3].map((mode) => difference(flashed, render(mode)));
    assert('runtime emissive hit flashes bypass studies', flashDeltas.every((delta) => delta === 0), { deltas: flashDeltas });
    mesh.material.uniforms.uEmissive.value = 0;
    u.uAmbient.value.set(0, 0, 0);
    u.uLightColor.value.set(0, 0, 0);
    u.uLanternColor.value.set(0, 0, 0);
    const dark = [0, 1, 2, 3].map(render);
    assert('no-light surfaces remain black in every mode', dark.every((frame) => frame.max === 0), { maxima: dark.map((frame) => frame.max) });
    u.uAmbient.value.set(0.3, 0.3, 0.3);
    u.uLightColor.value.set(0.6, 0.6, 0.6);
    u.uLanternColor.value.set(1, 0.7, 0.4);
    const post = createPostPass(target.texture, target.depthTexture);
    post.uniforms.uRes.value.set(...size);
    post.uniforms.uProjInv.value.copy(camera.projectionMatrixInverse);
    post.uniforms.uCamWorld.value.copy(camera.matrixWorld);
    post.uniforms.uCamPos.value.copy(camera.position);
    post.uniforms.uFade.value = 1;
    post.uniforms.uAo.value.x = 0;
    post.uniforms.uBloom.value.x = 0;
    post.uniforms.uVig.value = 0;
    const faded = [];
    for (const mode of [0, 1, 2, 3]) {
      render(mode);
      renderer.setRenderTarget(output);
      renderer.render(post.scene, post.camera);
      faded.push(read(output).max);
    }
    assert('fall fade finishes black after every material mode', faded.every((max) => max === 0), { maxima: faded });
    // Float readback exposes invalid normals/colors instead of silently clamping NaN to a byte.
    assert('floating-point render targets are available', renderer.extensions.has('EXT_color_buffer_float'));
    const floatTarget = new THREE.WebGLRenderTarget(...size, { type: THREE.FloatType });
    const floats = new Float32Array(size[0] * size[1] * 4);
    for (const mode of [0, 1, 2, 3]) {
      u.uStudy.value = mode;
      renderer.setRenderTarget(floatTarget);
      renderer.render(scene, camera);
      renderer.readRenderTargetPixels(floatTarget, 0, 0, ...size, floats);
      assert(`mode ${mode} produces finite floating-point colors`, floats.every(Number.isFinite));
    }
    floatTarget.dispose();
    const gl = renderer.getContext();
    assert('WebGL reports no error', gl.getError() === gl.NO_ERROR);
    const failed = renderer.info.programs.filter((program) => program.diagnostics?.runnable === false);
    assert('all shader programs are runnable', failed.length === 0, { failed: failed.length });
    renderer.dispose();

    const { installSurfaceStudies } = await import('/src/ui/surfaceStudies.ts');
    const settingsKey = 'lovecraft-souls-like/settings';
    const savedSettings = '{"brightness":0.85,"resolution":2}';
    localStorage.setItem(settingsKey, savedSettings);
    history.replaceState(null, '', '/?studies&study=ceramic');
    let chosen = -1;
    installSurfaceStudies((mode) => { chosen = mode; });
    const buttons = [...document.querySelectorAll('#surface-studies button')];
    assert('live chooser selects the ceramic query', chosen === 2 && buttons[2].getAttribute('aria-pressed') === 'true');
    for (const mode of [1, 3, 0]) {
      buttons[mode].click();
      assert(`live chooser selects mode ${mode}`, chosen === mode && buttons[mode].getAttribute('aria-pressed') === 'true' && buttons.filter((button) => button.getAttribute('aria-pressed') === 'true').length === 1);
    }
    assert('live comparison leaves saved player settings unchanged', localStorage.getItem(settingsKey) === savedSettings);
    return checks;
  });
  mkdirSync('store/surface-studies', { recursive: true });
  writeFileSync('store/surface-studies/probe.json', `${JSON.stringify({ results, errors }, null, 2)}\n`);
  console.log(JSON.stringify({ checks: results.length, passed: results.every((result) => result.passed), errors, results }, null, 2));
  if (errors.length) process.exitCode = 1;
} finally {
  await browser.close();
}
