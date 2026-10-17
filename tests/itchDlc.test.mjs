import { generateKeyPairSync, sign } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DLC_GAME, DLC_LIMIT, installMountUnlock, mountCheckoutUrl, mountDlcStore, ownsItchMount, purchaseUnlockPayload, unlockPayload, verifyMountUnlock } from '../desktop/itchDlc.js';

const keys = generateKeyPairSync('ed25519');
const pkg = { channel: 'itch', itchDlc: {
  publicKey: keys.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
} };
const unlock = (mount, key = keys.privateKey) => JSON.stringify({ version: 1, game: DLC_GAME, mount, signature: sign(null, Buffer.from(unlockPayload(mount)), key).toString('base64') });
const dirs = [];
const dir = () => { const path = mkdtempSync(join(tmpdir(), 'itch-dlc-')); dirs.push(path); return path; };
afterEach(() => { for (const path of dirs.splice(0)) rmSync(path, { recursive: true, force: true }); });

describe('itch DLC downloads', () => {
  it('verifies purchase-specific v2 files and binds the signed purchase ID to its appearance', () => {
    for (const mount of ['chariot', 'automobile']) {
      const file = { version: 2, game: DLC_GAME, mount, purchaseId: 1234,
        signature: sign(null, Buffer.from(purchaseUnlockPayload(mount, 1234)), keys.privateKey).toString('base64') };
      expect(verifyMountUnlock(JSON.stringify(file), pkg)).toBe(mount);
      for (const purchaseId of [1235, 0, -1, '1234', 1.5, Number.MAX_SAFE_INTEGER + 1, null]) {
        expect(verifyMountUnlock(JSON.stringify({ ...file, purchaseId }), pkg)).toBeNull();
      }
      expect(verifyMountUnlock(JSON.stringify({ ...file, version: 1 }), pkg)).toBeNull();
      expect(verifyMountUnlock(JSON.stringify({ ...file, version: 3 }), pkg)).toBeNull();
      const data = dir();
      expect(installMountUnlock(JSON.stringify(file), data, pkg)).toEqual({ status: 'imported', mount });
      expect(ownsItchMount(mount, data, pkg)).toBe(true);
    }
  });

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
  const checkoutPkg = { ...pkg, itchDlc: {
    publicKey: pkg.itchDlc.publicKey,
    purchaseUrl: 'https://digitaldro.itch.io/seventy-steps/purchase',
    redemptionUrl: 'https://redeem.example/redeem',
    products: {
      chariot: { externalId: 'spectral-chariot', subProductId: '123' },
      automobile: { externalId: 'brassbound-motor-car', subProductId: 456 },
    },
  } };
  const config = (change) => ({ ...checkoutPkg, itchDlc: { ...checkoutPkg.itchDlc, ...change } });

  it('opens the base game checkout for the selected native sub-product and leaves entitlement unchanged', () => {
    const data = dir();
    expect(mountCheckoutUrl('chariot', checkoutPkg)).toBe('https://digitaldro.itch.io/seventy-steps/purchase?external_product_id=spectral-chariot');
    expect(mountCheckoutUrl('automobile', checkoutPkg)).toBe('https://digitaldro.itch.io/seventy-steps/purchase?external_product_id=brassbound-motor-car');
    expect(mountDlcStore(checkoutPkg)).toEqual({ channel: 'itch', chariot: true, automobile: true });
    expect(ownsItchMount('chariot', data, checkoutPkg)).toBe(false);
    expect(mountCheckoutUrl('grey', checkoutPkg)).toBeNull();
    expect(mountCheckoutUrl('https://attacker.example', checkoutPkg)).toBeNull();
    expect(mountCheckoutUrl('chariot', { ...checkoutPkg, channel: 'steam' })).toBeNull();
  });

  it('requires the verification key, exact base checkout and a configured HTTPS redemption endpoint', () => {
    expect(mountDlcStore({ channel: 'itch' })).toEqual({ channel: 'itch', chariot: false, automobile: false });
    expect(mountCheckoutUrl('chariot', config({ publicKey: '' }))).toBeNull();
    for (const purchaseUrl of ['', 'javascript:alert(1)', 'http://digitaldro.itch.io/seventy-steps/purchase', 'https://attacker.example/seventy-steps/purchase',
      'https://digitaldro.itch.io.attacker.example/seventy-steps/purchase', 'https://name@digitaldro.itch.io/seventy-steps/purchase',
      'https://digitaldro.itch.io/test-chariot/purchase', 'https://digitaldro.itch.io/seventy-steps/purchase?external_product_id=wrong',
      'https://digitaldro.itch.io/seventy-steps/purchase#fragment', 'https://digitaldro.itch.io/seventy-steps/purchase/']) {
      expect(mountCheckoutUrl('chariot', config({ purchaseUrl })), purchaseUrl).toBeNull();
    }
    for (const redemptionUrl of ['', 'http://redeem.example/redeem', 'https://user:pass@redeem.example/redeem',
      'https://redeem.example/other', 'https://redeem.example/redeem?key=value', 'https://redeem.example/redeem?', 'https://redeem.example/redeem#']) {
      expect(mountCheckoutUrl('chariot', config({ redemptionUrl })), redemptionUrl).toBeNull();
    }
  });

  it('requires actual positive numeric product IDs and keeps the two appearances distinct', () => {
    const products = checkoutPkg.itchDlc.products;
    for (const subProductId of ['', 0, -1, 1.5, '1.5', '01', ' 123 ', '1e3', 'Infinity', Number.MAX_SAFE_INTEGER + 1]) {
      const changed = config({ products: { ...products, chariot: { ...products.chariot, subProductId } } });
      expect(mountCheckoutUrl('chariot', changed), String(subProductId)).toBeNull();
    }
    expect(mountDlcStore(config({ products: { ...products, chariot: { ...products.chariot, subProductId: '456' } } }))).toEqual({ channel: 'itch', chariot: false, automobile: false });
    expect(mountCheckoutUrl('chariot', config({ products: { ...products, chariot: { ...products.chariot, externalId: 'brassbound-motor-car' } } }))).toBeNull();
    expect(mountDlcStore(config({ products: { ...products, chariot: { ...products.chariot, subProductId: '' } } }))).toEqual({ channel: 'itch', chariot: false, automobile: true });
  });
});
