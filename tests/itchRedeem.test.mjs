import { createHmac, generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { verifyMountUnlock } from '../desktop/itchDlc.js';
import { ClaimError, ClaimStore, loadConfig, verifyPurchaseJwt } from '../services/itch-redeem/core.mjs';
import { createRedeemServer } from '../services/itch-redeem/server.mjs';

const keys = generateKeyPairSync('ed25519');
const publicKey = keys.publicKey.export({ type: 'spki', format: 'pem' }).toString();
const secret = 'synthetic-itch-dashboard-secret-for-tests-only';
const now = 1_790_000_000;
const products = {
  chariot: { subProductId: 101, externalId: 'spectral-chariot' },
  automobile: { subProductId: 102, externalId: 'brassbound-motor-car' },
};
const config = (overrides = {}) => ({ secret, privateKey: keys.privateKey, products, dbPath: ':memory:', origin: 'https://redeem.example', ...overrides });
const payload = (overrides = {}) => ({ purchase_id: 300, sub_product_id: 101, external_id: 'spectral-chariot', iat: now - 5, exp: now + 600, ...overrides });
const jwt = (claims = payload(), header = { alg: 'HS256', typ: 'JWT' }, signingSecret = secret) => {
  const prefix = [header, claims].map(value => Buffer.from(JSON.stringify(value)).toString('base64url')).join('.');
  return `${prefix}.${createHmac('sha256', signingSecret).update(prefix).digest('base64url')}`;
};
const pkg = { channel: 'itch', itchDlc: { publicKey } };
const stores = new Set();
const servers = new Set();
const dirs = [];
const dir = () => { const path = mkdtempSync(join(tmpdir(), 'itch-redeem-')); dirs.push(path); return path; };
const store = (options = {}, clock = () => now) => { const instance = new ClaimStore(config(options), clock); stores.add(instance); return instance; };
const status = (operation, expected) => {
  try { operation(); throw new Error('Expected claim rejection'); }
  catch (error) { expect(error).toBeInstanceOf(ClaimError); expect(error.status).toBe(expected); }
};
afterEach(async () => {
  for (const server of servers) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  servers.clear();
  for (const instance of stores) instance.close();
  stores.clear();
  for (const path of dirs.splice(0)) rmSync(path, { recursive: true, force: true });
});

describe('native itch purchase JWT verification', () => {
  it('uses the signed numeric product ID and checks the optional external ID for both products', () => {
    expect(verifyPurchaseJwt(jwt(), config(), now)).toEqual({ purchaseId: 300, subProductId: 101, mount: 'chariot', expires: now + 600 });
    expect(verifyPurchaseJwt(jwt(payload({ sub_product_id: 102, external_id: 'brassbound-motor-car' })), config(), now).mount).toBe('automobile');
    expect(verifyPurchaseJwt(jwt(payload({ external_id: undefined, metadata: { mount: 'automobile' } })), config(), now).mount).toBe('chariot');
    status(() => verifyPurchaseJwt(jwt(payload({ sub_product_id: 999 })), config(), now), 400);
    status(() => verifyPurchaseJwt(jwt(payload({ external_id: 'brassbound-motor-car' })), config(), now), 400);
  });

  it('rejects forged or modified tokens and algorithms or extensions chosen by an attacker', () => {
    const original = jwt();
    const parts = original.split('.');
    const changedPayload = Buffer.from(JSON.stringify(payload({ purchase_id: 999 }))).toString('base64url');
    for (const token of [
      `${parts[0]}.${changedPayload}.${parts[2]}`,
      jwt(payload(), { alg: 'HS256' }, 'wrong-secret'),
      jwt(payload(), { alg: 'none' }), jwt(payload(), { alg: 'HS512' }),
      jwt(payload(), { alg: 'HS256', typ: 'other' }),
      jwt(payload(), { alg: 'HS256', crit: ['anything'] }),
      jwt(payload(), { alg: 'HS256', b64: false }),
      `${original}=`, `${original}.extra`, 'invalid', '', 'x'.repeat(16_385),
    ]) status(() => verifyPurchaseJwt(token, config(), now), 400);
  });

  it('requires positive safe numeric purchase and product IDs', () => {
    for (const field of ['purchase_id', 'sub_product_id']) {
      for (const value of [undefined, null, '300', 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
        status(() => verifyPurchaseJwt(jwt(payload({ [field]: value })), config(), now), 400);
      }
    }
  });

  it('enforces signed timestamps and expiry, including not-before and limited clock skew', () => {
    status(() => verifyPurchaseJwt(jwt(payload({ exp: now })), config(), now), 410);
    status(() => verifyPurchaseJwt(jwt(payload({ exp: now - 1 })), config(), now), 410);
    for (const fields of [
      { iat: undefined }, { exp: undefined }, { iat: 0 }, { iat: '123' }, { exp: '123' },
      { iat: now + 31 }, { iat: now + 10, exp: now + 10 }, { exp: now - 10 },
      { nbf: now + 1 }, { nbf: '123' },
    ]) status(() => verifyPurchaseJwt(jwt(payload(fields)), config(), now), 400);
    expect(verifyPurchaseJwt(jwt(payload({ iat: now + 30, nbf: now })), config(), now).mount).toBe('chariot');
  });
});

describe('durable single-issue DLC redemption', () => {
  it('does not grant on arrival, then issues a signed purchase-specific receipt that can be downloaded again', () => {
    const instance = store();
    const session = instance.start(jwt());
    status(() => instance.download(session), 403);
    const pending = instance.session(session);
    instance.claim(session, pending.csrf);
    const file = instance.download(session);
    expect(file.mount).toBe('chariot');
    expect(JSON.parse(file.receipt)).toMatchObject({ version: 2, mount: 'chariot', purchaseId: 300 });
    expect(verifyMountUnlock(file.receipt, pkg)).toBe('chariot');
    instance.claim(session, pending.csrf);
    expect(instance.download(session).receipt).toBe(file.receipt);
    expect(instance.start(jwt(), session)).toBe(session);
  });

  it('binds the signature to the purchase ID and appearance', () => {
    const instance = store();
    const session = instance.start(jwt(payload({ sub_product_id: 102, external_id: 'brassbound-motor-car' })));
    instance.claim(session, instance.session(session).csrf);
    const file = JSON.parse(instance.download(session).receipt);
    expect(verifyMountUnlock(JSON.stringify(file), pkg)).toBe('automobile');
    for (const changes of [{ purchaseId: 301 }, { purchaseId: 0 }, { purchaseId: '300' }, { mount: 'chariot' }, { version: 1 }]) {
      expect(verifyMountUnlock(JSON.stringify({ ...file, ...changes }), pkg)).toBeNull();
    }
  });

  it('atomically rejects the second session even if both started before the first claim', async () => {
    const instance = store();
    const sessions = [instance.start(jwt()), instance.start(jwt())];
    const results = await Promise.allSettled(sessions.map(async token => instance.claim(token, instance.session(token).csrf)));
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    const failed = results.find(result => result.status === 'rejected');
    expect(failed.reason.status).toBe(409);
    status(() => instance.start(jwt()), 409);
    status(() => instance.start(jwt(payload({ sub_product_id: 102, external_id: 'brassbound-motor-car' }))), 409);
    expect(instance.db.prepare('SELECT COUNT(*) AS count FROM purchases').get().count).toBe(1);
  });

  it('retains purchase replay protection and the same receipt when the database is reopened', () => {
    const dbPath = join(dir(), 'purchases.sqlite');
    const first = store({ dbPath });
    const token = first.start(jwt());
    first.claim(token, first.session(token).csrf);
    const receipt = first.download(token).receipt;
    first.close(); stores.delete(first);
    const second = store({ dbPath });
    status(() => second.start(jwt()), 409);
    expect(second.download(token).receipt).toBe(receipt);
  });

  it('shares replay protection across independent connections to the persistent database', () => {
    const dbPath = join(dir(), 'shared.sqlite');
    const first = store({ dbPath });
    const second = store({ dbPath });
    const firstSession = first.start(jwt());
    const secondSession = second.start(jwt());
    first.claim(firstSession, first.session(firstSession).csrf);
    status(() => second.claim(secondSession, second.session(secondSession).csrf), 409);
    expect(second.download(firstSession).receipt).toBe(first.download(firstSession).receipt);
    expect(second.db.prepare('SELECT COUNT(*) AS count FROM purchases').get().count).toBe(1);
  });

  it('rolls back failed signing without consuming the purchase', () => {
    const options = config();
    const instance = new ClaimStore(options, () => now); stores.add(instance);
    const token = instance.start(jwt());
    const csrf = instance.session(token).csrf;
    options.privateKey = keys.publicKey;
    expect(() => instance.claim(token, csrf)).toThrow();
    expect(instance.db.prepare('SELECT COUNT(*) AS count FROM purchases').get().count).toBe(0);
    options.privateKey = keys.privateKey;
    instance.claim(token, csrf);
    expect(verifyMountUnlock(instance.download(token).receipt, pkg)).toBe('chariot');
  });

  it('requires a live session and CSRF token, and expires the download session after its grace period', () => {
    let clock = now;
    const instance = store({}, () => clock);
    const token = instance.start(jwt());
    status(() => instance.claim(token, 'wrong-csrf'), 403);
    status(() => instance.claim('unknown', 'anything'), 410);
    expect(instance.session('unknown')).toBeNull();
    instance.claim(token, instance.session(token).csrf);
    clock += 901;
    expect(instance.session(token)).toBeNull();
    status(() => instance.download(token), 403);
  });
});

describe('redemption deployment configuration', () => {
  const fixture = () => {
    const keyPath = join(dir(), 'synthetic-private.pem');
    writeFileSync(keyPath, keys.privateKey.export({ type: 'pkcs8', format: 'pem' }));
    return {
      env: { ITCH_REDEEM_SECRET: secret, DLC_SIGNING_KEY_FILE: keyPath, DLC_DB_PATH: join(dir(), 'purchases.sqlite'), ITCH_CHARIOT_SUB_PRODUCT_ID: '101', ITCH_AUTOMOBILE_SUB_PRODUCT_ID: '102' },
      package: { itchDlc: { publicKey, purchaseUrl: 'https://digitaldro.itch.io/seventy-steps/purchase', redemptionUrl: 'https://redeem.example/redeem', products: structuredClone(products) } },
    };
  };

  it('loads only matching actual product IDs and the private key corresponding to the game public key', () => {
    const { env, package: packageConfig } = fixture();
    expect(loadConfig(env, packageConfig)).toMatchObject({ secret, origin: 'https://redeem.example', products });
    for (const changes of [
      { ITCH_REDEEM_SECRET: '' }, { ITCH_REDEEM_SECRET: 'short' }, { DLC_DB_PATH: '' }, { DLC_DB_PATH: ':memory:' }, { DLC_DB_PATH: 'relative.sqlite' }, { DLC_SIGNING_KEY_FILE: '' },
      { ITCH_CHARIOT_SUB_PRODUCT_ID: '' }, { ITCH_CHARIOT_SUB_PRODUCT_ID: '0' }, { ITCH_CHARIOT_SUB_PRODUCT_ID: '0101' },
      { ITCH_CHARIOT_SUB_PRODUCT_ID: '9007199254740992' }, { ITCH_CHARIOT_SUB_PRODUCT_ID: '102' },
    ]) expect(() => loadConfig({ ...env, ...changes }, packageConfig)).toThrow();
    const duplicate = structuredClone(packageConfig);
    duplicate.itchDlc.products.chariot.subProductId = 102;
    expect(() => loadConfig({ ...env, ITCH_CHARIOT_SUB_PRODUCT_ID: '102' }, duplicate)).toThrow(/distinct/);
    const wrongPublisher = generateKeyPairSync('ed25519').publicKey.export({ type: 'spki', format: 'pem' }).toString();
    expect(() => loadConfig(env, { itchDlc: { ...packageConfig.itchDlc, publicKey: wrongPublisher } })).toThrow(/match/);
    const wrongProduct = structuredClone(packageConfig);
    wrongProduct.itchDlc.products.chariot.externalId = 'another-game';
    expect(() => loadConfig(env, wrongProduct)).toThrow(/matching actual/);
  });

  it('requires a clean HTTPS redeem endpoint', () => {
    const { env, package: packageConfig } = fixture();
    for (const redemptionUrl of ['', 'http://redeem.example/redeem', 'https://user:pass@redeem.example/redeem', 'https://redeem.example/other', 'https://redeem.example/redeem?secret=a', 'https://redeem.example/redeem#token']) {
      expect(() => loadConfig(env, { itchDlc: { ...packageConfig.itchDlc, redemptionUrl } }), redemptionUrl).toThrow();
    }
    expect(() => loadConfig(env, { itchDlc: { ...packageConfig.itchDlc, purchaseUrl: 'https://attacker.example/purchase' } })).toThrow();
  });
});

describe('native claim HTTP flow', () => {
  const listen = async () => {
    const options = config();
    const instance = new ClaimStore(options, () => now);
    const server = createRedeemServer(options, instance);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    servers.add(server);
    return { base: `http://127.0.0.1:${server.address().port}`, instance };
  };
  const request = (base, path, options = {}) => fetch(base + path, { redirect: 'manual', ...options });
  const cookieOf = response => response.headers.get('set-cookie').split(';')[0];

  it('strips the JWT from the navigation, secures the session, and requires Origin plus CSRF before downloading', async () => {
    const { base } = await listen();
    const token = jwt();
    const arrival = await request(base, `/redeem?jwt=${token}`);
    expect(arrival.status).toBe(303);
    expect(arrival.headers.get('location')).toBe('/claim');
    const cookieHeader = arrival.headers.get('set-cookie');
    expect(cookieHeader).toContain('__Host-seventy-dlc=');
    for (const flag of ['Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax']) expect(cookieHeader).toContain(flag);
    expect(cookieHeader).not.toContain(token);
    expect(arrival.headers.get('referrer-policy')).toBe('no-referrer');
    expect(arrival.headers.get('cache-control')).toBe('no-store');
    expect(arrival.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
    const cookie = cookieOf(arrival);
    expect((await request(base, '/download', { headers: { cookie } })).status).toBe(403);
    const pageResponse = await request(base, '/claim', { headers: { cookie } });
    const html = await pageResponse.text();
    expect(html).not.toContain(token);
    expect(html).toContain('The Spectral Chariot');
    const csrf = html.match(/name="csrf" value="([A-Za-z0-9_-]+)"/)[1];
    const body = new URLSearchParams({ csrf }).toString();
    const headers = { cookie, 'content-type': 'application/x-www-form-urlencoded', origin: 'https://redeem.example' };
    for (const invalidHeaders of [{ ...headers, origin: 'https://attacker.example' }, { ...headers, origin: '' }, { ...headers, 'content-type': 'application/json' }]) {
      expect((await request(base, '/claim', { method: 'POST', headers: invalidHeaders, body })).status).toBe(403);
    }
    expect((await request(base, '/claim', { method: 'POST', headers, body: 'csrf=wrong' })).status).toBe(403);
    expect((await request(base, '/claim', { method: 'POST', headers, body: `${body}&${body}` })).status).toBe(403);
    const claimed = await request(base, '/claim', { method: 'POST', headers, body });
    expect(claimed.status).toBe(303);
    expect(claimed.headers.get('location')).toBe('/download');
    expect(cookieOf(claimed)).toBe(cookie);
    expect(claimed.headers.get('set-cookie')).toContain('Max-Age=900');
    const downloaded = await request(base, '/download', { headers: { cookie } });
    expect(downloaded.status).toBe(200);
    expect(downloaded.headers.get('content-type')).toBe('application/octet-stream');
    expect(downloaded.headers.get('content-disposition')).toContain('spectral-chariot.seventysteps-dlc');
    const receipt = await downloaded.text();
    expect(verifyMountUnlock(receipt, pkg)).toBe('chariot');
    expect(await (await request(base, '/download', { headers: { cookie } })).text()).toBe(receipt);
    expect((await request(base, `/redeem?jwt=${token}`)).status).toBe(409);
    expect((await request(base, `/redeem?jwt=${token}`, { headers: { cookie } })).status).toBe(303);
  });

  it('rejects missing, duplicated, expired or invalid claim tokens without issuing a purchase', async () => {
    const { base, instance } = await listen();
    expect((await request(base, '/redeem')).status).toBe(400);
    expect((await request(base, `/redeem?jwt=${jwt()}&jwt=${jwt()}`)).status).toBe(400);
    expect((await request(base, '/redeem?jwt=invalid')).status).toBe(400);
    expect((await request(base, `/redeem?jwt=${jwt(payload({ exp: now }))}`)).status).toBe(410);
    expect((await request(base, '/claim')).status).toBe(410);
    expect((await request(base, '/download')).status).toBe(403);
    expect(instance.db.prepare('SELECT COUNT(*) AS count FROM purchases').get().count).toBe(0);
    expect(await (await request(base, '/health')).text()).toBe('ok\n');
  });
});
