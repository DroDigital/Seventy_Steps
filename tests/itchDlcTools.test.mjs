import { spawnSync } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';

const dirs = [];
const fixture = () => {
  const outer = mkdtempSync(join(tmpdir(), 'itch-dlc-tools-'));
  dirs.push(outer);
  const root = join(outer, 'project');
  mkdirSync(join(root, 'tools'), { recursive: true });
  writeFileSync(join(root, 'tools/itch_dlc.mjs'), readFileSync('tools/itch_dlc.mjs'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ type: 'module', version: '1.0.1', build: { appId: 'com.digitaldro.seventysteps' } }));
  return { root, key: join(outer, 'publisher.dlc-private.pem') };
};
const run = (f, command, key = f.key) => {
  const r = spawnSync(process.execPath, [join(f.root, 'tools/itch_dlc.mjs'), command, '--key', key], { cwd: f.root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.error) throw r.error;
  return r;
};
const metadata = (f) => JSON.parse(readFileSync(join(f.root, 'package.json'), 'utf8'));
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

describe('provisioning the DLC redemption signing key', () => {
  it('keeps the private key outside the project and configures native itch sub-products without issuing unlocks', () => {
    const f = fixture();
    expect(run(f, 'init').status).toBe(0);
    const pkg = metadata(f);
    expect(pkg.itchDlc.publicKey).toContain('BEGIN PUBLIC KEY');
    expect(JSON.stringify(pkg)).not.toContain('PRIVATE KEY');
    expect(pkg.build.appId).toBe('com.digitaldro.seventysteps');
    expect(pkg.itchDlc).toMatchObject({
      purchaseUrl: 'https://digitaldro.itch.io/seventy-steps/purchase',
      redemptionUrl: '',
      products: {
        chariot: { externalId: 'spectral-chariot', subProductId: '' },
        automobile: { externalId: 'brassbound-motor-car', subProductId: '' },
      },
    });
    expect(pkg.itchDlc).not.toHaveProperty('urls');
    expect(existsSync(join(f.root, 'release'))).toBe(false);
    const privateKey = readFileSync(f.key, 'utf8');
    expect(privateKey).toContain('BEGIN PRIVATE KEY');
    if (process.platform !== 'win32') expect(statSync(f.key).mode & 0o777).toBe(0o600);
    expect(run(f, 'init').status).toBe(0); // reopening the same key does not replace it
    expect(metadata(f).itchDlc.publicKey).toBe(pkg.itchDlc.publicKey);
    expect(readFileSync(f.key, 'utf8')).toBe(privateKey);
  });

  it('preserves configured product values and the publisher key while removing legacy separate-page URLs', () => {
    const f = fixture();
    expect(run(f, 'init').status).toBe(0);
    const pkg = metadata(f);
    pkg.itchDlc.redemptionUrl = 'https://redeem.example/redeem';
    pkg.itchDlc.products.chariot.subProductId = '123';
    pkg.itchDlc.products.automobile.subProductId = 456;
    pkg.itchDlc.urls = { chariot: 'https://digitaldro.itch.io/old-chariot', automobile: '' };
    writeFileSync(join(f.root, 'package.json'), JSON.stringify(pkg));
    const privateKey = readFileSync(f.key, 'utf8');
    expect(run(f, 'init').status).toBe(0);
    const expected = { ...pkg.itchDlc };
    delete expected.urls;
    expect(metadata(f).itchDlc).toEqual(expected);
    expect(readFileSync(f.key, 'utf8')).toBe(privateKey);
  });

  it('rejects pack and unknown commands before creating a key or changing metadata', () => {
    for (const command of ['pack', 'unknown', '']) {
      const f = fixture();
      const before = readFileSync(join(f.root, 'package.json'), 'utf8');
      const result = run(f, command);
      expect(result.status).toBe(2);
      expect(existsSync(f.key)).toBe(false);
      expect(existsSync(join(f.root, 'release'))).toBe(false);
      expect(readFileSync(join(f.root, 'package.json'), 'utf8')).toBe(before);
    }
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
    expect(run(f, 'init', other.key).status).toBe(2);
    expect(metadata(f).itchDlc.publicKey).toBe(before);
  });

  it.skipIf(process.platform === 'win32')('refuses a private key path that points back into the repository through a symlink', () => {
    const f = fixture();
    const alias = join(f.root, '..', 'project-alias');
    symlinkSync(f.root, alias, 'dir');
    expect(run(f, 'init', join(alias, 'secret.pem')).status).toBe(2);
    expect(existsSync(join(f.root, 'secret.pem'))).toBe(false);
  });

  it('refuses an existing non-Ed25519 private key without configuring it as the publisher', () => {
    const f = fixture();
    const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    writeFileSync(f.key, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
    const before = readFileSync(f.key, 'utf8');
    const result = run(f, 'init');
    expect(result.status).toBe(2);
    expect(metadata(f).itchDlc).toBeUndefined();
    expect(readFileSync(f.key, 'utf8')).toBe(before);
  });
});
