/**
 * The release's packaging (round 49: Windows and Mac builds for Steam): what the `build` field of package.json must keep true for a packed
 * game to start, and what the tools around it refuse. The packed game itself is started by CI (.github/workflows/release-builds.yml).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';

const pkg = JSON.parse(readFileSync('package.json', 'utf8')); // (the tests run from the project's root)
const read = (path: string): string => readFileSync(path, 'utf8');

describe('what is packed', () => {
  it('holds the built page and the shell, and keeps the native modules outside the archive, where they can be loaded', () => {
    expect(pkg.build.files).toEqual(expect.arrayContaining(['dist/**', 'desktop/**', 'package.json']));
    for (const m of ['steamworks.js', '@kmamal/sdl', 'gamepad-node']) expect(pkg.build.asarUnpack.join(' ')).toContain(m);
    expect(pkg.main).toBe('desktop/main.js');
  });

  it('every shell file the main process imports is in the package', () => {
    for (const [, file] of read('desktop/main.js').matchAll(/from '\.\/([\w.]+)'/g)) expect(existsSync(`desktop/${file}`), file).toBe(true);
    expect(pkg.build.files).not.toContain('!desktop/**'); // (and the exclusions are of what is not needed alone)
  });

  it('has a build for Windows, macOS and Linux, each a folder for a depot', () => {
    for (const os of ['win', 'mac', 'linux']) expect(JSON.stringify(pkg.build[os].target), os).toContain('"dir"');
    expect(pkg.build.win.executableName).toBe('SeventySteps'); // (what docs/STEAM.md and tools/smoke_packaged.mjs name)
    expect(pkg.build.linux.executableName).toBe('seventy-steps');
    expect(JSON.stringify(pkg.build.mac.target)).toMatch(/arm64/);
    expect(JSON.stringify(pkg.build.mac.target)).toMatch(/x64/);
  });

  it('asks macOS for what the game needs and no more', () => {
    const plist = read('packaging/entitlements.mac.plist');
    const asked = [...plist.matchAll(/<key>([^<]+)<\/key>/g)].map((m) => m[1]);
    expect(asked.sort()).toEqual(['com.apple.security.cs.allow-dyld-environment-variables', 'com.apple.security.cs.allow-jit', 'com.apple.security.cs.allow-unsigned-executable-memory', 'com.apple.security.cs.disable-library-validation']);
    expect(pkg.build.mac.entitlements).toBe('packaging/entitlements.mac.plist');
    expect(pkg.build.mac.entitlementsInherit).toBe('packaging/entitlements.mac.plist');
    expect(pkg.build.mac.hardenedRuntime).toBe(true);
  });
});

describe('the scripts', () => {
  it('every package script makes the icon first (build/ is not kept: the packaged game has none without it)', () => {
    for (const name of ['package', 'package:win', 'package:linux', 'package:mac']) expect(pkg.scripts[name], name).toMatch(/npm run icon/);
  });

  it('the Steam app id is a number, 0 until Steamworks gives one', () => {
    expect(Number.isInteger(pkg.steam.appId)).toBe(true);
    expect(pkg.steam.appId).toBeGreaterThanOrEqual(0);
  });

  it('the upload tool sends nothing without an app id and a depot, and never to "default"', () => {
    const run = (env: Record<string, string>) => spawnSync(process.execPath, ['tools/steam_upload.mjs'], { env: { PATH: process.env.PATH ?? '', ...env }, encoding: 'utf8' });
    const bare = run({ STEAM_APP_ID: '480' });
    expect(bare.status).toBe(2);
    expect(bare.stderr).toMatch(/No depot/);
    const live = run({ STEAM_APP_ID: '480', STEAM_DEPOT_WINDOWS: '481', STEAM_BRANCH: 'default' });
    expect(live.status).toBe(2);
  });
});

describe('the itch.io release (round 51)', () => {
  const push = (env: Record<string, string>, ...args: string[]) => spawnSync(process.execPath, ['tools/itch_push.mjs', ...args], { env: { PATH: process.env.PATH ?? '', ...env }, encoding: 'utf8' });
  /** A release folder with a universal Mac app whose package.json holds `meta` (what the tool reads to tell which store a pack is for). */
  const fakeRelease = (meta: string, intelMeta = meta): string => {
    const dir = mkdtempSync(`${tmpdir()}/itch-test-`);
    for (const [arch, text] of [['app-arm64', meta], ['app-x64', intelMeta]]) {
      const resources = `${dir}/mac-universal/Seventy Steps.app/Contents/Resources/${arch}`;
      mkdirSync(resources, { recursive: true });
      writeFileSync(`${resources}/package.json`, text);
    }
    return dir;
  };

  it('has a script, and asks for the project it sends to', () => {
    expect(pkg.scripts['itch:push']).toBe('node tools/itch_push.mjs');
    const bare = push({});
    expect(bare.status).toBe(2);
    expect(bare.stderr).toMatch(/ITCH_TARGET/);
    expect(push({ ITCH_TARGET: 'not a project' }).status).toBe(2);
  });

  it('refuses a pack made for Steam: it would relaunch itself through Steam', () => {
    const r = push({ ITCH_TARGET: 'digitaldro/seventy-steps', ITCH_RELEASE: fakeRelease('{"steam":{"appId":1234560}}') }, '--only', 'osx');
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/Steam, not itch\.io/);
  });

  it('accepts a pack made for itch.io, writes what the itch app launches, and sends nothing without --run', () => {
    const dir = fakeRelease(JSON.stringify({ channel: 'itch', version: pkg.version }));
    const r = push({ ITCH_TARGET: 'digitaldro/seventy-steps', ITCH_RELEASE: dir }, '--only', 'osx');
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/digitaldro\/seventy-steps:osx/);
    expect(r.stdout).toContain(`(version ${pkg.version})`);
    expect(r.stdout).toMatch(/Nothing sent/);
    expect(readFileSync(`${dir}/mac-universal/.itch.toml`, 'utf8')).toContain('path = "Seventy Steps.app"');
  });

  it('refuses a stale or unversioned pack before changing it or trying to upload it', () => {
    for (const version of ['0.0.1', undefined]) {
      const dir = fakeRelease(JSON.stringify({ channel: 'itch', version }));
      const r = push({ ITCH_TARGET: 'digitaldro/seventy-steps', ITCH_RELEASE: dir }, '--only', 'osx', '--run');
      expect(r.status).toBe(2);
      expect(r.stderr).toContain('packed version');
      expect(r.stderr).toContain('Rebuild this platform');
      expect(existsSync(`${dir}/mac-universal/.itch.toml`)).toBe(false);
      expect(r.stdout).not.toContain('butler:');
    }
  });

  it('checks that the Intel half of a universal Mac app has the same version and itch channel', () => {
    const appleSilicon = JSON.stringify({ channel: 'itch', version: pkg.version });
    for (const intel of [{ channel: 'itch', version: '0.0.1' }, { channel: 'steam', version: pkg.version }]) {
      const dir = fakeRelease(appleSilicon, JSON.stringify(intel));
      const r = push({ ITCH_TARGET: 'digitaldro/seventy-steps', ITCH_RELEASE: dir }, '--only', 'osx');
      expect(r.status).toBe(2);
      expect(r.stderr).toContain('macOS Intel:');
      expect(existsSync(`${dir}/mac-universal/.itch.toml`)).toBe(false);
    }
  });

  it('the workflow packs for itch.io only when asked, checks the channel, and pushes with a secret it never prints', () => {
    const wf = read('.github/workflows/release-builds.yml');
    expect(wf).toMatch(/channel=itch/);
    expect(wf).toMatch(/--channel itch/);
    expect(wf).toMatch(/secrets\.BUTLER_API_KEY/);
    expect(wf).toMatch(/itch_push\.mjs --only windows/);
    expect(wf).toMatch(/itch_push\.mjs --only osx/);
    expect(wf).toMatch(/itch_push\.mjs --only linux/);
  });
});
