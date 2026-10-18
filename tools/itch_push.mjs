// Pushes the packed game to itch.io with butler (itch's uploader). docs/RELEASE.md.
//   node tools/itch_push.mjs                 checks the packs and says what would be sent (nothing is sent)
//   node tools/itch_push.mjs --run           and pushes them (butler uses BUTLER_API_KEY, or the login `butler login` keeps)
//   --only windows,osx,linux                 some platforms only
//   --get-butler                             downloads butler into .butler/ when it is not on the PATH
// The version the itch app and the page show for a build is `package.json`'s (a pack carries the same), or what ITCH_VERSION (or --version) says:
// bump it before a push (`1.0.0-rc.2`, then `-rc.3`...), or a new build wears the last one's name.
// Environment: ITCH_TARGET (or --target): "digitaldro/seventy-steps", your itch.io user and the project's URL name; BUTLER: the path to butler;
// ITCH_RELEASE: the folder the packs are in (release/). The channels are named windows, osx and linux, which is how the itch app tells the platforms apart.
// Every pack is checked to have been made for itch.io (`channel` "itch" in its package.json: desktop/steam.js): a Steam build, started
// outside Steam, would relaunch itself through Steam. Pack with `npm run package:win|linux -- -c.extraMetadata.channel=itch`
// or `npm run package:mac -- --universal --channel itch`.
// The demo (round 56: packed with `-c.extraMetadata.edition=demo`, or `--edition demo` on the Mac) goes to channels of its own,
// windows-demo, osx-demo and linux-demo, beside the full game's on the same page: mark its uploads "demo" in the page's editor.
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const release = process.env.ITCH_RELEASE || join(root, 'release');
const asarBin = join(root, 'node_modules', '@electron', 'asar', 'bin', 'asar.js');
const fail = (text) => {
  console.error(text);
  process.exit(2);
};

const target = flag('--target') ?? process.env.ITCH_TARGET ?? '';
if (!/^[\w.-]+\/[\w.-]+$/.test(target)) fail('Name the project: ITCH_TARGET=<your itch.io user>/<the project\'s URL name>, e.g. digitaldro/seventy-steps (or --target).');

const version = (flag('--version') ?? process.env.ITCH_VERSION ?? '').trim() || pkg.version; // the label butler gives each channel's build (the one the page shows)
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/.test(version)) fail(`"${version}" is not a version (1.0.0-rc.2).`);

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
/** package.json out of an asar (a Windows or Linux pack). */
function inAsar(asar) {
  const dir = mkdtempSync(join(tmpdir(), 'itch-push-'));
  const r = spawnSync(process.execPath, [asarBin, 'extract-file', asar, 'package.json'], { cwd: dir, encoding: 'utf8' });
  if (r.status !== 0) fail(`Could not read ${asar}: ${r.stderr}`);
  return readJson(join(dir, 'package.json'));
}
const app = 'Seventy Steps.app';
const resources = (dir) => join(dir, app, 'Contents', 'Resources');
const platforms = [
  { name: 'windows', os: 'Windows', dir: 'win-unpacked', play: 'SeventySteps.exe', pack: (d) => inAsar(join(d, 'resources', 'app.asar')) },
  { name: 'osx', os: 'macOS', dir: 'mac-universal', play: app, pack: (d) => readJson(join(resources(d), 'app-arm64', 'package.json')), hint: 'the universal app, for Intel Macs too: npm run package:mac -- --universal --channel itch' },
  { name: 'linux', os: 'Linux', dir: 'linux-unpacked', play: 'seventy-steps', pack: (d) => inAsar(join(d, 'resources', 'app.asar')) },
];
const only = flag('--only')?.split(',');
const todo = platforms.filter((p) => !only || only.includes(p.name));
if (!todo.length) fail('--only names windows, osx or linux.');

const plan = [];
for (const p of todo) {
  const dir = join(release, p.dir);
  if (!existsSync(dir)) {
    if (only) fail(`${p.os} is not packed: ${dir} is missing${p.hint ? ` (${p.hint})` : ''}.`);
    console.log(`${p.os}: not packed, left out`);
    continue;
  }
  const packed = p.pack(dir);
  const channel = packed.channel;
  if (channel !== 'itch') fail(`${p.os}: ${dir} was packed for ${channel ?? 'Steam'}, not itch.io: it would relaunch itself through Steam. Pack it again for itch (see this file's header).`);
  writeFileSync(join(dir, '.itch.toml'), `# what the itch app launches\n[[actions]]\nname = "play"\npath = "${p.play}"\n`);
  const name = packed.edition === 'demo' ? `${p.name}-demo` : p.name; // the demo's own channel, never the full game's
  plan.push({ ...p, dir, name });
  console.log(`${p.os}: ${dir} → ${target}:${name} (version ${version})`);
}
if (!plan.length) fail('Nothing is packed for itch.io.');

/** butler: BUTLER, the PATH, or .butler/ (downloaded with --get-butler). */
async function butler() {
  const works = (cmd) => spawnSync(cmd, ['-V'], { encoding: 'utf8' }).status === 0;
  const local = join(root, '.butler', process.platform === 'win32' ? 'butler.exe' : 'butler');
  for (const cmd of [process.env.BUTLER, 'butler', local]) if (cmd && works(cmd)) return cmd;
  if (!args.includes('--get-butler')) fail('butler is not installed (https://itch.io/docs/butler/installing.html), or run this with --get-butler.');
  const plat = { win32: 'windows-amd64', linux: 'linux-amd64', darwin: process.arch === 'arm64' ? 'darwin-arm64' : 'darwin-amd64' }[process.platform];
  const dir = join(root, '.butler');
  mkdirSync(dir, { recursive: true });
  const res = await fetch(`https://broth.itch.zone/butler/${plat}/LATEST/archive/default`);
  if (!res.ok) fail(`butler's download answered ${res.status}.`);
  const zip = join(dir, 'butler.zip');
  writeFileSync(zip, new Uint8Array(await res.arrayBuffer()));
  const r = process.platform === 'win32' ? spawnSync('powershell', ['-NoProfile', '-Command', `Expand-Archive -Force -Path '${zip}' -DestinationPath '${dir}'`], { stdio: 'inherit' }) : spawnSync('unzip', ['-o', '-q', zip, '-d', dir], { stdio: 'inherit' });
  if (r.status !== 0) fail('Could not unpack butler.');
  if (process.platform !== 'win32') chmodSync(local, 0o755);
  if (!works(local)) fail('The butler that was downloaded does not run.');
  return local;
}

const cmd = args.includes('--run') || args.includes('--get-butler') ? await butler() : null;
if (cmd) {
  const v = spawnSync(cmd, ['-V'], { encoding: 'utf8' });
  console.log(`butler: ${(v.stdout || v.stderr).trim()}`); // (it says its version on stderr)
}
if (!args.includes('--run')) {
  console.log('Nothing sent: run it again with --run to push.');
  process.exit(0);
}
for (const p of plan) {
  const r = spawnSync(cmd, ['push', p.dir, `${target}:${p.name}`, '--userversion', version, '--if-changed'], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
