/**
 * The demo's browser smoke test (docs/DEMO_BUILD.md): serves a built demo, starts a new game, walks a little, and fails on any page
 * error, console error, failed request or missing file. Needs the Playwright install the sandbox has (its browser is found by the
 * default launch). The build is `npm run build:demo`, or the leak check's own build in node_modules/.cache/demo-leak/demo.
 *
 *   node tools/demo/smoke.mjs [dist dir]
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const dir = resolve(process.argv[2] ?? join(ROOT, 'node_modules/.cache/demo-leak/demo'));
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.mp3': 'audio/mpeg',
  '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain', '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const file = join(dir, normalize(path === '/' ? '/index.html' : path));
  if (!file.startsWith(dir)) return void res.writeHead(403).end();
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const { port } = server.address();

const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const problems = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
  await page.goto(`http://127.0.0.1:${port}/?fresh`, { waitUntil: 'load' });
  await page.waitForTimeout(8000);
  const sized = await page.$$eval('canvas', (cs) => cs.some((c) => c.width > 0 && c.height > 0));
  if (!sized) problems.push('no drawn canvas: the world did not appear');
  await page.keyboard.down('w');
  await page.waitForTimeout(2000);
  await page.keyboard.up('w');
  await page.waitForTimeout(1000);
} finally {
  await browser.close();
  server.close();
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('demo smoke: a new game started and walked, with no page error, console error, failed request or missing file');
