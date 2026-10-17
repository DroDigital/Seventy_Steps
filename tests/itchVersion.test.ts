import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';

const script = readFileSync('tools/itch_version.mjs', 'utf8');
const fixture = (version = '1.0.1') => {
  const dir = mkdtempSync(`${tmpdir()}/itch-version-`);
  writeFileSync(`${dir}/version.mjs`, script);
  writeFileSync(`${dir}/package.json`, JSON.stringify({ name: 'test-game', version, build: { appId: 'keep.this.identity', mac: { hardenedRuntime: true } } }));
  writeFileSync(`${dir}/package-lock.json`, JSON.stringify({ version, packages: { '': { version }, dependency: { version: '9.0.0' } } }));
  return dir;
};
const stamp = (dir: string, run = '42', attempt = '1') => spawnSync(process.execPath, [`${dir}/version.mjs`], {
  cwd: dir, env: { PATH: process.env.PATH, GITHUB_RUN_NUMBER: run, GITHUB_RUN_ATTEMPT: attempt }, encoding: 'utf8',
});
const json = (dir: string, file: string) => JSON.parse(readFileSync(`${dir}/${file}`, 'utf8'));

describe('itch CI version labels', () => {
  it('gives all platform jobs the same version before packaging, keeping app and lock metadata consistent', () => {
    for (let platform = 0; platform < 3; platform++) {
      const dir = fixture();
      const r = stamp(dir);
      expect(r.status).toBe(0);
      expect(r.stdout).toContain('1.0.1-build.42.1');
      expect(json(dir, 'package.json')).toMatchObject({ version: '1.0.1-build.42.1', build: {
        appId: 'keep.this.identity', mac: { hardenedRuntime: true, bundleShortVersion: '1.0.1', bundleVersion: '1.0.1' },
      } });
      const lock = json(dir, 'package-lock.json');
      expect(lock.version).toBe('1.0.1-build.42.1');
      expect(lock.packages[''].version).toBe(lock.version);
      expect(lock.packages.dependency.version).toBe('9.0.0');
    }
  });

  it('distinguishes later runs and retries and is safe to repeat without accumulating suffixes', () => {
    const dir = fixture();
    expect(stamp(dir).status).toBe(0);
    expect(stamp(dir).status).toBe(0);
    expect(json(dir, 'package.json').version).toBe('1.0.1-build.42.1');
    expect(stamp(dir, '42', '2').status).toBe(0);
    expect(json(dir, 'package.json').version).toBe('1.0.1-build.42.2');
    expect(stamp(dir, '43').status).toBe(0);
    expect(json(dir, 'package.json').version).toBe('1.0.1-build.43.1');
  });

  it('refuses missing or invalid run identifiers without changing the release version', () => {
    for (const [run, attempt] of [['', '1'], ['42', ''], ['not-a-number', '1'], ['42', '0']]) {
      const dir = fixture();
      const before = readFileSync(`${dir}/package.json`, 'utf8');
      expect(stamp(dir, run, attempt).status).toBe(2);
      expect(readFileSync(`${dir}/package.json`, 'utf8')).toBe(before);
    }
  });

  it('refuses inconsistent lock metadata before modifying either file', () => {
    const dir = fixture();
    writeFileSync(`${dir}/package-lock.json`, JSON.stringify({ version: '1.0.0', packages: { '': { version: '1.0.0' } } }));
    const before = readFileSync(`${dir}/package-lock.json`, 'utf8');
    expect(stamp(dir).status).toBe(2);
    expect(json(dir, 'package.json').version).toBe('1.0.1');
    expect(readFileSync(`${dir}/package-lock.json`, 'utf8')).toBe(before);
  });
});
