// The Mac build: an app for Apple Silicon and one for Intel, each with the controllers' SDL library of its own architecture
// (@kmamal/sdl downloads the one of the machine it is installed on; CROSS_COMPILE_ARCH names another), then, if asked, the one universal app
// that is both (what a single Steam depot takes). Run it on a Mac: `npm run package:mac`.
//   --only arm64|x64   build one architecture
//   --universal        also merge the two into release/mac-universal (needs both)
//   --no-build         only merge and sign what is already in release/ (with --universal)
// Signing: with MAC_SIGN_IDENTITY set (a "Developer ID Application: …" in the keychain) every app is signed with the hardened runtime and
// packaging/entitlements.mac.plist; with APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD and APPLE_TEAM_ID too it is notarised. Without them the apps are signed ad hoc, which is enough to run on this Mac (and on one with Gatekeeper off) and what Steam needs; docs/RELEASE.md.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
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
    run('npx', ['electron-builder', '--mac', `--${arch}`, '--dir']);
  }
  if (existsSync(sdlScripts) && arches.at(-1) !== host) run('node', ['install.mjs'], { cwd: sdlScripts, env: { CROSS_COMPILE_ARCH: host } }); // and this machine's own again
}

const identity = process.env.MAC_SIGN_IDENTITY ?? '-'; // '-' is ad hoc
const { signAsync } = await import('@electron/osx-sign');
const entitlements = join(root, 'packaging', 'entitlements.mac.plist');
const sign = async (app) => {
  console.log(`signing ${app} (${identity === '-' ? 'ad hoc' : identity})`);
  await signAsync({ app, identity, platform: 'darwin', optionsForFile: () => ({ entitlements, hardenedRuntime: identity !== '-' }) });
};

if (args.includes('--universal')) {
  const { makeUniversalApp } = await import('@electron/universal');
  const out = join(root, 'release', 'mac-universal', APP);
  await makeUniversalApp({
    x64AppPath: join(dirOf.x64, APP),
    arm64AppPath: join(dirOf.arm64, APP),
    outAppPath: out,
    force: true,
    x64ArchFiles: '**/steamworks.js/**', // (the Steam binding carries its own libraries for both: identical in both apps)
  });
  arches.length = 0;
  await sign(out);
} else {
  for (const arch of arches) await sign(join(dirOf[arch], APP));
}

if (process.env.APPLE_ID && process.env.APPLE_APP_SPECIFIC_PASSWORD && process.env.APPLE_TEAM_ID && identity !== '-') {
  const { notarize } = await import('@electron/notarize');
  const targets = args.includes('--universal') ? [join(root, 'release', 'mac-universal', APP)] : arches.map((a) => join(dirOf[a], APP));
  for (const appPath of targets) {
    console.log(`notarising ${appPath}`);
    await notarize({ appPath, appleId: process.env.APPLE_ID, appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD, teamId: process.env.APPLE_TEAM_ID });
  }
}
