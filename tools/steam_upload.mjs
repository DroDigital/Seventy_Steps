// Writes the SteamPipe build scripts for the packed game, and, with --run, uploads them with steamcmd. docs/RELEASE.md.
//   node tools/steam_upload.mjs                 write steam/build/*.vdf (nothing is sent)
//   node tools/steam_upload.mjs --run           and run steamcmd (needs STEAM_USER, and steamcmd on the PATH or in STEAMCMD)
// What it reads (environment): STEAM_APP_ID (else "steam.appId" in package.json), and a depot id for each platform to send:
//   STEAM_DEPOT_WINDOWS (release/win-unpacked), STEAM_DEPOT_MACOS (release/mac-universal, else release/mac-arm64), STEAM_DEPOT_LINUX (release/linux-unpacked).
// STEAM_BRANCH: a branch to set live ("beta"; never "default": that is the author's to do on the partner site). STEAM_DESC: the build's note.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const env = process.env;
const appId = Number(env.STEAM_APP_ID || pkg.steam?.appId || 0);
if (!Number.isInteger(appId) || appId <= 0) {
  console.error('No Steam app id: set STEAM_APP_ID, or "steam.appId" in package.json (Steamworks gives it).');
  process.exit(2);
}
const release = join(root, 'release');
const pick = (...dirs) => dirs.find((d) => existsSync(join(release, d)));
const depots = [
  ['STEAM_DEPOT_WINDOWS', pick('win-unpacked'), 'Windows'],
  ['STEAM_DEPOT_MACOS', pick('mac-universal', 'mac-arm64'), 'macOS'],
  ['STEAM_DEPOT_LINUX', pick('linux-unpacked'), 'Linux'],
].filter(([name]) => env[name]);
if (!depots.length) {
  console.error('No depot to send: set STEAM_DEPOT_WINDOWS, STEAM_DEPOT_MACOS or STEAM_DEPOT_LINUX (a depot id from the partner site).');
  process.exit(2);
}
const missing = depots.filter(([, dir]) => !dir);
if (missing.length) {
  console.error(`Not packed yet: ${missing.map(([, , os]) => os).join(', ')} (npm run package:win|mac|linux on that platform).`);
  process.exit(2);
}
const branch = env.STEAM_BRANCH ?? '';
if (branch === 'default') {
  console.error('Not to "default": setting a build live to every player is done on the partner site.');
  process.exit(2);
}

const out = join(root, 'steam', 'build');
mkdirSync(out, { recursive: true });
const vdf = (name, body) => writeFileSync(join(out, name), `${body}\n`);
for (const [name, dir, os] of depots) {
  const id = env[name];
  vdf(`depot_${id}.vdf`, `"DepotBuildConfig"\n{\n\t"DepotID" "${id}"\n\t"ContentRoot" "${join(release, dir)}"\n\t"FileMapping"\n\t{\n\t\t"LocalPath" "*"\n\t\t"DepotPath" "."\n\t\t"Recursive" "1"\n\t}\n\t"FileExclusion" "*.pdb"\n\t"FileExclusion" "steam_appid.txt"\n}`);
  console.log(`${os}: depot ${id} ← release/${dir}`);
}
vdf(`app_${appId}.vdf`, `"AppBuild"\n{\n\t"AppID" "${appId}"\n\t"Desc" "${env.STEAM_DESC ?? `Seventy Steps ${pkg.version}`}"\n\t"BuildOutput" "${join(root, 'steam', 'output')}"\n\t"ContentRoot" "${release}"\n\t"SetLive" "${branch}"\n\t"Depots"\n\t{\n${depots.map(([name]) => `\t\t"${env[name]}" "depot_${env[name]}.vdf"`).join('\n')}\n\t}\n}`);
console.log(`wrote steam/build/app_${appId}.vdf`);

if (process.argv.includes('--run')) {
  if (!env.STEAM_USER) {
    console.error('STEAM_USER names the build account steamcmd logs in as.');
    process.exit(2);
  }
  const r = spawnSync(env.STEAMCMD || 'steamcmd', ['+login', env.STEAM_USER, '+run_app_build', join(out, `app_${appId}.vdf`), '+quit'], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}
console.log('Nothing sent. With --run: steamcmd +login $STEAM_USER +run_app_build …');
