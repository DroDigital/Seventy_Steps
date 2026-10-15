// Starts a packed build with --smoke-test and fails unless it reaches its title (desktop/main.js: `smoke`).
// usage: node tools/smoke_packaged.mjs [--app <path to the executable>] [--require steam,pads] [--arch x86_64] [--timeout seconds] [--verbose] [--channel itch]
// --channel: the store the build must say it was packed for ("itch" or "steam"), or the check fails.
// --verbose: Chromium's own log on stderr, and on macOS what a start that never answers was doing (`sample`) when it was ended.
// On a machine with no GPU (CI on Linux) set SMOKE_SOFTWARE_GL=1; under Linux's CI the Chromium sandbox is off (--no-sandbox).
import { spawn, spawnSync } from 'node:child_process';
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
const arch = flag('--arch'); // macOS: `--arch x86_64` starts the Intel app under Rosetta (`arch -x86_64`: it needs no Intel node, only the app)
const shell = ['--smoke-test', ...(process.platform === 'linux' ? ['--no-sandbox'] : [])];
const verbose = args.includes('--verbose');
const limit = Number(flag('--timeout') ?? 240);
const child = spawn(arch ? 'arch' : exe, arch ? [`-${arch}`, exe, ...shell] : shell, { env: { ...process.env, SMOKE_REQUIRE: need, ...(verbose ? { ELECTRON_ENABLE_LOGGING: '1' } : {}) }, stdio: ['ignore', 'pipe', 'pipe'] });
let ok = false;
let said = ''; // the channel the build reports
for (const [stream, out] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
  stream.on('data', (d) => {
    const text = String(d);
    if (text.includes('SMOKE OK')) ok = true;
    said = text.match(/"channel":"(\w+)"/)?.[1] ?? said;
    out.write(text);
  });
}
const timer = setTimeout(() => {
  console.error(`SMOKE FAIL: no answer in ${limit} s`);
  if (verbose && process.platform === 'darwin') spawnSync('sample', [String(child.pid), '2'], { stdio: 'inherit' }); // where it was stuck
  child.kill('SIGKILL');
}, limit * 1000);
child.on('exit', (code) => {
  clearTimeout(timer);
  const channelOk = !flag('--channel') || said === flag('--channel');
  if (!channelOk) console.error(`SMOKE FAIL: the build says channel "${said}", not "${flag('--channel')}"`);
  process.exit(ok && code === 0 && channelOk ? 0 : 1);
});
