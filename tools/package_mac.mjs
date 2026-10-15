// The Mac build: an app for Apple Silicon and one for Intel, each with the controllers' SDL library of its own architecture
// (@kmamal/sdl downloads the one of the machine it is installed on; CROSS_COMPILE_ARCH names another), then, if asked, the one universal app
// that is both (what a single Steam depot takes). Run it on a Mac: `npm run package:mac`.
//   --only arm64|x64   build one architecture
//   --universal        also merge the two into release/mac-universal (needs both)
//   --no-build         only merge and sign what is already in release/ (with --universal)
// Signing: with MAC_SIGN_IDENTITY set (a "Developer ID Application: …" in the keychain) every app is signed with the hardened runtime and
// packaging/entitlements.mac.plist; with APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD and APPLE_TEAM_ID too it is notarised. Without them the apps are signed ad hoc, which is enough to run on this Mac (and on one with Gatekeeper off) and what Steam needs; docs/RELEASE.md.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const arches = only ? [only] : ['arm64', 'x64'];
const APP = 'Seventy Steps.app';
const dirOf = { arm64: join(root, 'release', 'mac-arm64'), x64: join(root, 'release', 'mac') };

function run(cmd, cmdArgs, opts = {}) {
  console.log(`$ ${cmd} ${cmdArgs.join(' ')}`);
  const r = spawnSync(cmd, cmdArgs, { stdio: 'inherit', cwd: root, ...opts, env: { ...process.env, ...opts.env } });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const sdlScripts = join(root, 'node_modules', '@kmamal', 'sdl', 'scripts');
const host = process.arch;
if (!args.includes('--no-build')) {
  for (const arch of arches) {
    if (existsSync(sdlScripts)) run('node', ['install.mjs'], { cwd: sdlScripts, env: { CROSS_COMPILE_ARCH: arch } }); // this architecture's SDL for the build
    run('npx', ['electron-builder', '--mac', `--${arch}`, '--dir', '-c.asar=false']); // no asar: the two apps differ only in their native files, which is what merging them into one needs
  }
  if (existsSync(sdlScripts) && arches.at(-1) !== host) run('node', ['install.mjs'], { cwd: sdlScripts, env: { CROSS_COMPILE_ARCH: host } }); // and this machine's own again
}

const identity = process.env.MAC_SIGN_IDENTITY ?? '-'; // '-' is ad hoc
const entitlements = join(root, 'packaging', 'entitlements.mac.plist');
const sign = async (app) => {
  console.log(`signing ${app} (${identity === '-' ? 'ad hoc' : identity})`);
  if (identity === '-') { // (osx-sign looks an identity up in the keychain and finds none for '-': codesign itself, the whole bundle, inside out)
    run('codesign', ['--force', '--deep', '--sign', '-', app]);
    run('codesign', ['--verify', '--deep', '--strict', app]);
    return;
  }
  const { signAsync } = await import('@electron/osx-sign');
  await signAsync({ app, identity, platform: 'darwin', optionsForFile: () => ({ entitlements, hardenedRuntime: true }) });
};

const universal = args.includes('--universal');
const universalApp = join(root, 'release', 'mac-universal', APP);
if (!args.includes('--no-build')) for (const arch of arches) await sign(join(dirOf[arch], APP)); // (what was just built; with --no-build it is signed already)

if (universal) {
  // The two apps are merged from copies without their code signatures: a signature file is different in each (it seals that architecture's
  // binaries), and @electron/universal refuses to merge files that differ. The merged app is signed as a whole.
  const { makeUniversalApp } = await import('@electron/universal');
  const staging = join(root, 'release', '.universal-in');
  const copies = Object.fromEntries(['arm64', 'x64'].map((arch) => [arch, join(staging, arch, APP)]));
  rmSync(staging, { recursive: true, force: true });
  for (const arch of ['arm64', 'x64']) {
    run('ditto', [join(dirOf[arch], APP), copies[arch]]);
    run('find', [copies[arch], '-name', '_CodeSignature', '-type', 'd', '-prune', '-exec', 'rm', '-rf', '{}', '+']);
  }
  await makeUniversalApp({
    x64AppPath: copies.x64,
    arm64AppPath: copies.arm64,
    outAppPath: universalApp,
    force: true,
    x64ArchFiles: '**/steamworks.js/**', // (the Steam binding carries its own libraries for both: identical in both apps)
  });
  // The merge makes a launcher (Resources/app.asar: it picks app-arm64 or app-x64) that carries a copy of this package.json, "type": "module"
  // and all: that makes its CommonJS launcher an ES module, which cannot start, and Electron stands at its own error box. The launcher's
  // package.json is made CommonJS again (the game's main, in app-arm64 and app-x64, is still the ES module it is).
  const asarBin = join(root, 'node_modules', '@electron', 'asar', 'bin', 'asar.js');
  const launcher = join(universalApp, 'Contents', 'Resources', 'app.asar');
  const unpacked = join(staging, 'launcher');
  run(process.execPath, [asarBin, 'extract', launcher, unpacked]);
  const metaFile = join(unpacked, 'package.json');
  const meta = JSON.parse(readFileSync(metaFile, 'utf8'));
  delete meta.type;
  writeFileSync(metaFile, JSON.stringify(meta));
  run(process.execPath, [asarBin, 'pack', unpacked, launcher]);
  rmSync(staging, { recursive: true, force: true });
  await sign(universalApp);
}

if (process.env.APPLE_ID && process.env.APPLE_APP_SPECIFIC_PASSWORD && process.env.APPLE_TEAM_ID && identity !== '-') {
  const { notarize } = await import('@electron/notarize');
  const targets = universal ? [universalApp] : arches.map((a) => join(dirOf[a], APP));
  for (const appPath of targets) {
    console.log(`notarising ${appPath}`);
    await notarize({ appPath, appleId: process.env.APPLE_ID, appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD, teamId: process.env.APPLE_TEAM_ID });
  }
}
