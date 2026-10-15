// Starts a packed build with --smoke-test and fails unless it reaches its title (desktop/main.js: `smoke`).
// usage: node tools/smoke_packaged.mjs [--app <path to the executable>] [--require steam,pads]
// On a machine with no GPU (CI on Linux) set SMOKE_SOFTWARE_GL=1; under Linux's CI the Chromium sandbox is off (--no-sandbox).
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const release = fileURLToPath(new URL('../release/', import.meta.url));
const defaults = {
  win32: join(release, 'win-unpacked', 'SeventySteps.exe'),
  linux: join(release, 'linux-unpacked', 'seventy-steps'),
  darwin: join(release, process.arch === 'arm64' ? 'mac-arm64' : 'mac', 'Seventy Steps.app', 'Contents', 'MacOS', 'Seventy Steps'),
};
const exe = flag('--app') ?? defaults[process.platform];
if (!exe || !existsSync(exe)) {
  console.error(`no packed build at ${exe} (npm run package first)`);
  process.exit(2);
}
const need = flag('--require') ?? (process.platform === 'linux' ? 'steam' : 'steam,pads'); // (a CI Linux box may have no SDL video or HID to start the worker on)
const child = spawn(exe, ['--smoke-test', ...(process.platform === 'linux' ? ['--no-sandbox'] : [])], { env: { ...process.env, SMOKE_REQUIRE: need }, stdio: ['ignore', 'pipe', 'pipe'] });
let ok = false;
for (const [stream, out] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
  stream.on('data', (d) => {
    const text = String(d);
    if (text.includes('SMOKE OK')) ok = true;
    out.write(text);
  });
}
const timer = setTimeout(() => {
  console.error('SMOKE FAIL: no answer in 4 minutes');
  child.kill('SIGKILL');
}, 240_000);
child.on('exit', (code) => {
  clearTimeout(timer);
  process.exit(ok && code === 0 ? 0 : 1);
});
