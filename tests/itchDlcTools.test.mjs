import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { verifyMountUnlock } from '../desktop/itchDlc.js';

const dirs = [];
const fixture = () => {
  const outer = mkdtempSync(join(tmpdir(), 'itch-dlc-tools-'));
  dirs.push(outer);
  const root = join(outer, 'project');
  mkdirSync(join(root, 'tools'), { recursive: true });
  mkdirSync(join(root, 'desktop'), { recursive: true });
  for (const file of ['tools/itch_dlc.mjs', 'desktop/itchDlc.js']) writeFileSync(join(root, file), readFileSync(file));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ type: 'module', version: '1.0.1', build: { appId: 'com.digitaldro.seventysteps' } }));
  return { root, key: join(outer, 'publisher.dlc-private.pem') };
};
const run = (f, command, key = f.key) => {
  const r = spawnSync(process.execPath, [join(f.root, 'tools/itch_dlc.mjs'), command, '--key', key], { cwd: f.root, encoding: 'utf8' });
  if (r.error) throw r.error;
  return r;
};
const metadata = (f) => JSON.parse(readFileSync(join(f.root, 'package.json'), 'utf8'));
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

describe('preparing paid DLC downloads', () => {
  it('keeps the private key outside the project, configures only its public key, and signs both independent downloads', () => {
    const f = fixture();
    expect(run(f, 'init').status).toBe(0);
    const pkg = metadata(f);
    expect(pkg.itchDlc.publicKey).toContain('BEGIN PUBLIC KEY');
    expect(JSON.stringify(pkg)).not.toContain('PRIVATE KEY');
    expect(pkg.build.appId).toBe('com.digitaldro.seventysteps');
    expect(pkg.itchDlc.urls).toEqual({ chariot: '', automobile: '' });
    expect(run(f, 'pack').status).toBe(0);
    for (const [name, id] of [['spectral-chariot', 'chariot'], ['brassbound-motor-car', 'automobile']]) {
      const text = readFileSync(join(f.root, 'release/dlc', `${name}.seventysteps-dlc`), 'utf8');
      expect(verifyMountUnlock(text, pkg)).toBe(id);
    }
    expect(run(f, 'init').status).toBe(0); // reopening the same key does not replace it
    expect(metadata(f).itchDlc.publicKey).toBe(pkg.itchDlc.publicKey);
  });

  it('refuses an in-repository private key and does not silently rotate a configured publisher', () => {
    const f = fixture();
    const unsafe = join(f.root, 'secret.pem');
    expect(run(f, 'init', unsafe).status).toBe(2);
    expect(existsSync(unsafe)).toBe(false);
    expect(run(f, 'init').status).toBe(0);
    const before = metadata(f).itchDlc.publicKey;
    expect(run(f, 'init', `${f.key}.new`).status).toBe(2);
    expect(existsSync(`${f.key}.new`)).toBe(false);
    expect(metadata(f).itchDlc.publicKey).toBe(before);
    const other = fixture();
    expect(run(other, 'init').status).toBe(0);
    expect(run(f, 'pack', other.key).status).toBe(2);
  });
});
