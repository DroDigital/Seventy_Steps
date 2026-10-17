import { generateKeyPairSync, sign } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DLC_GAME, DLC_LIMIT, installMountUnlock, mountCheckoutUrl, mountDlcStore, ownsItchMount, unlockPayload, verifyMountUnlock } from '../desktop/itchDlc.js';

const keys = generateKeyPairSync('ed25519');
const pkg = { channel: 'itch', itchDlc: {
  publicKey: keys.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
  urls: { chariot: 'https://digitaldro.itch.io/test-chariot/purchase', automobile: 'https://digitaldro.itch.io/test-motor-car' },
} };
const unlock = (mount, key = keys.privateKey) => JSON.stringify({ version: 1, game: DLC_GAME, mount, signature: sign(null, Buffer.from(unlockPayload(mount)), key).toString('base64') });
const dirs = [];
const dir = () => { const path = mkdtempSync(join(tmpdir(), 'itch-dlc-')); dirs.push(path); return path; };
afterEach(() => { for (const path of dirs.splice(0)) rmSync(path, { recursive: true, force: true }); });

describe('itch DLC downloads', () => {
  it('accepts publisher-issued unlocks independently for both paid appearances', () => {
    for (const id of ['chariot', 'automobile']) expect(verifyMountUnlock(unlock(id), pkg)).toBe(id);
  });

  it('rejects edited products, wrong publishers, malformed or oversized files, and incompatible schemas', () => {
    const other = generateKeyPairSync('ed25519');
    const original = JSON.parse(unlock('chariot'));
    for (const text of [
      JSON.stringify({ ...original, mount: 'automobile' }),
      JSON.stringify({ ...original, mount: '../chariot' }),
      JSON.stringify({ ...original, game: 'another-game' }),
      JSON.stringify({ ...original, version: 2 }),
      JSON.stringify({ ...original, signature: 'not signed' }),
      unlock('chariot', other.privateKey), '{broken', 'x'.repeat(DLC_LIMIT + 1),
    ]) expect(verifyMountUnlock(text, pkg)).toBeNull();
    expect(verifyMountUnlock(unlock('chariot'), { channel: 'itch' })).toBeNull();
    expect(verifyMountUnlock(unlock('chariot'), { ...pkg, channel: 'steam' })).toBeNull();
  });

  it('keeps installed unlocks separate, verifies them on each read, and preserves a valid file after an invalid import', () => {
    const data = dir();
    expect(installMountUnlock(unlock('chariot'), data, pkg)).toEqual({ status: 'imported', mount: 'chariot' });
    expect(ownsItchMount('chariot', data, pkg)).toBe(true);
    expect(ownsItchMount('automobile', data, pkg)).toBe(false);
    const kept = readFileSync(join(data, 'chariot.seventysteps-dlc'), 'utf8');
    expect(installMountUnlock('{"chariotOwned":true}', data, pkg)).toEqual({ status: 'invalid' });
    expect(readFileSync(join(data, 'chariot.seventysteps-dlc'), 'utf8')).toBe(kept);
    expect(installMountUnlock(unlock('automobile'), data, pkg).status).toBe('imported');
    expect(ownsItchMount('chariot', data, pkg)).toBe(true);
    expect(ownsItchMount('automobile', data, pkg)).toBe(true);
    writeFileSync(join(data, 'chariot.seventysteps-dlc'), '{"chariotOwned":true}');
    expect(ownsItchMount('chariot', data, pkg)).toBe(false);
    expect(ownsItchMount('automobile', data, pkg)).toBe(true);
    expect(ownsItchMount('../automobile', data, pkg)).toBe(false);
  });

  it('refuses a renamed file for another product and never grants itch entitlement in a Steam build', () => {
    const data = dir();
    writeFileSync(join(data, 'automobile.seventysteps-dlc'), unlock('chariot'));
    expect(ownsItchMount('automobile', data, pkg)).toBe(false);
    installMountUnlock(unlock('chariot'), data, pkg);
    expect(ownsItchMount('chariot', data, { ...pkg, channel: 'steam' })).toBe(false);
  });
});

describe('itch checkout boundaries', () => {
  it('opens only the configured publisher product page and leaves entitlement unchanged', () => {
    const data = dir();
    expect(mountCheckoutUrl('chariot', pkg)).toBe('https://digitaldro.itch.io/test-chariot/purchase');
    expect(mountDlcStore(pkg)).toEqual({ channel: 'itch', chariot: true, automobile: true });
    expect(ownsItchMount('chariot', data, pkg)).toBe(false);
    expect(mountCheckoutUrl('grey', pkg)).toBeNull();
    expect(mountCheckoutUrl('https://attacker.example', pkg)).toBeNull();
    expect(mountCheckoutUrl('chariot', { ...pkg, channel: 'steam' })).toBeNull();
  });

  it('keeps purchasing disabled until a valid verification key and separate product URL are configured', () => {
    expect(mountDlcStore({ channel: 'itch' })).toEqual({ channel: 'itch', chariot: false, automobile: false });
    for (const url of ['', 'javascript:alert(1)', 'http://digitaldro.itch.io/test-chariot', 'https://attacker.example/dlc',
      'https://digitaldro.itch.io.attacker.example/dlc', 'https://name@digitaldro.itch.io/dlc',
      'https://digitaldro.itch.io/seventy-steps/purchase', 'https://digitaldro.itch.io/']) {
      expect(mountCheckoutUrl('chariot', { ...pkg, itchDlc: { ...pkg.itchDlc, urls: { chariot: url } } }), url).toBeNull();
    }
  });
});
