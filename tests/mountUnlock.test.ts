import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, expect, it, vi } from 'vitest';
import { UNLOCK_MOUNTS, UNLOCK_PUBLIC_KEY, findCode, honoursCode, mountsUnlockedHere, redeem, unlockedMounts } from '../desktop/mountUnlock.js';
import { newKeyPair, signCode } from '../tools/mount_unlock.mjs';

const pair = newKeyPair();
const other = newKeyPair();
const both = signCode(pair.privatePem, { id: 'test-pack' });
const itch = { channel: 'itch' };
const b64url = (text: string): string => btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); // (the node typings are not carried: tests/nodeFs.d.ts)

describe('the signed unlock code of the itch.io Mounts pack (round 84)', () => {
  it('opens what its payload names when the key signed it, and says who made it', () => {
    expect(unlockedMounts(both, pair.publicKey)).toEqual({ mounts: ['chariot', 'automobile'], id: 'test-pack' });
    expect(unlockedMounts(signCode(pair.privatePem, { mounts: ['automobile'] }), pair.publicKey)?.mounts).toEqual(['automobile']);
    expect(unlockedMounts(signCode(pair.privatePem, { mounts: ['chariot', 'a-mount-from-the-future'] }), pair.publicKey)?.mounts).toEqual(['chariot']);
  });

  it('refuses a code another key signed, a code that was touched, and a payload that is not ours', () => {
    expect(unlockedMounts(both, other.publicKey)).toBeNull();
    expect(unlockedMounts(signCode(other.privatePem), pair.publicKey)).toBeNull();
    const [tag, payload, signature] = both.split('.');
    const forged = b64url(JSON.stringify({ v: 1, for: 'seventy-steps-mounts', mounts: ['chariot', 'automobile'], id: 'forged' }));
    expect(unlockedMounts(`${tag}.${forged}.${signature}`, pair.publicKey)).toBeNull(); // another payload under the same signature
    const flip = (s: string): string => `${s.slice(0, 5)}${s[5] === 'A' ? 'B' : 'A'}${s.slice(6)}`;
    expect(unlockedMounts(`${tag}.${flip(payload)}.${signature}`, pair.publicKey)).toBeNull();
    expect(unlockedMounts(`${tag}.${payload}.${flip(signature)}`, pair.publicKey)).toBeNull();
    for (const body of [{ v: 2, for: 'seventy-steps-mounts', mounts: ['chariot'] }, { v: 1, for: 'another-game', mounts: ['chariot'] }, { v: 1, for: 'seventy-steps-mounts', mounts: [] }, { v: 1, for: 'seventy-steps-mounts', mounts: ['grey'] }, { v: 1, for: 'seventy-steps-mounts', mounts: 'chariot' }]) {
      const head = `SS-MOUNTS.${b64url(JSON.stringify(body))}`;
      expect(unlockedMounts(`${head}.${signCode(pair.privatePem).split('.')[2]}`, pair.publicKey), JSON.stringify(body)).toBeNull();
    }
    expect(unlockedMounts('', pair.publicKey)).toBeNull();
    expect(unlockedMounts(undefined, pair.publicKey)).toBeNull();
    expect(unlockedMounts(both, 'not a key')).toBeNull();
  });

  it('finds the code in whatever the player copied: the whole file, a wrapped line, windows line ends, stray words', () => {
    const file = `Seventy Steps: the Mounts pack\r\nCopy the line below.\r\n\r\n${both}\r\n\r\nThank you!\r\n`;
    expect(findCode(file)).toBe(both);
    expect(findCode(`${both.slice(0, 40)}\n${both.slice(40, 120)}\n  ${both.slice(120)}`)).toBe(both);
    expect(findCode(`words${both}more words`)).toBe(both);
    expect(unlockedMounts(file, pair.publicKey)?.mounts).toEqual(['chariot', 'automobile']);
    expect(findCode(both.slice(0, both.length - 5))).toBeNull(); // cut short
    expect(findCode('SS-MOUNTS.nothing.here')).toBeNull();
  });

  it('is honoured only by an itch.io pack of the full game, never by Steam, the demo or a pack with no word', () => {
    expect(honoursCode(itch)).toBe(true);
    expect(honoursCode({ channel: 'itch', edition: 'demo' })).toBe(false);
    expect(honoursCode({ channel: 'steam' })).toBe(false);
    expect(honoursCode({})).toBe(false);
    expect(mountsUnlockedHere(both, itch, pair.publicKey)).toEqual(['chariot', 'automobile']);
    expect(mountsUnlockedHere(both, { channel: 'itch', edition: 'demo' }, pair.publicKey)).toEqual([]);
    expect(mountsUnlockedHere(both, {}, pair.publicKey)).toEqual([]);
    expect(mountsUnlockedHere('', itch, pair.publicKey)).toEqual([]);
    expect(mountsUnlockedHere(signCode(other.privatePem), itch, pair.publicKey)).toEqual([]);
  });

  it('answers the paste with a code to keep, or the one reason it cannot', () => {
    expect(redeem(`code: ${both}`, itch, pair.publicKey)).toEqual({ ok: true, mounts: ['chariot', 'automobile'], code: both });
    expect(redeem('just some words', itch, pair.publicKey)).toEqual({ ok: false, reason: 'none' });
    expect(redeem('', itch, pair.publicKey)).toEqual({ ok: false, reason: 'none' });
    expect(redeem(signCode(other.privatePem), itch, pair.publicKey)).toEqual({ ok: false, reason: 'invalid' });
    expect(redeem(both, { channel: 'steam' }, pair.publicKey)).toEqual({ ok: false, reason: 'store' });
    expect(redeem(both, { channel: 'itch', edition: 'demo' }, pair.publicKey)).toEqual({ ok: false, reason: 'store' });
  });

  it('holds the public key alone: 32 bytes, and no code made with a key of this test opens the shipped one', () => {
    expect(atob(UNLOCK_PUBLIC_KEY)).toHaveLength(32);
    expect(UNLOCK_PUBLIC_KEY).not.toBe(pair.publicKey);
    expect(unlockedMounts(both)).toBeNull(); // (the default key is the shipped one)
    expect(UNLOCK_MOUNTS).toEqual(['chariot', 'automobile']);
    expect(readFileSync('.gitignore', 'utf8')).toContain('*.private.pem');
  });

  it('is told apart in the shell: the bridge says the store and keeps the paste behind one fixed channel', () => {
    const invoke = vi.fn((channel: string) => Promise.resolve(channel === 'desktop:pads-get' ? [] : { ok: false, reason: 'none' }));
    let bridge: { channel: string; unlockMounts(): Promise<unknown> } | undefined;
    const run = (argv: string[]): void => {
      new Function('require', 'process', readFileSync('desktop/preload.cjs', 'utf8'))(() => ({
        contextBridge: { exposeInMainWorld: (_key: string, value: typeof bridge) => { bridge = value; } },
        ipcRenderer: { on: vi.fn(), invoke },
      }), { argv });
    };
    run(['--channel=itch']);
    expect(bridge!.channel).toBe('itch');
    run([]);
    expect(bridge!.channel).toBe('steam');
    return bridge!.unlockMounts().then(() => expect(invoke).toHaveBeenLastCalledWith('desktop:mount-unlock'));
  });

  it('is wired in the shell: the two ownership reads add the stored code to Steam, and the page is told its store', () => {
    const main = readFileSync('desktop/main.js', 'utf8');
    expect(main).toContain("steamOwnsAutomobileDlc() || mountsUnlockedHere(storedCode()).includes('automobile')");
    expect(main).toContain("steamOwnsChariotDlc() || mountsUnlockedHere(storedCode()).includes('chariot')");
    expect(main).toContain("ipcMain.handle('desktop:mount-unlock'");
    expect(main).toContain('`--channel=${channel()}`');
  });

  it('the tool refuses a private key inside the repository, a check of what it made passes, and a wrong key cannot sign', () => {
    const run = (...args: string[]) => spawnSync(process.execPath, ['tools/mount_unlock.mjs', ...args], { env: { PATH: process.env.PATH ?? '' }, encoding: 'utf8' });
    expect(run('keygen', 'inside.private.pem').status).toBe(2);
    const dir = mkdtempSync(`${tmpdir()}/unlock-test-`);
    const file = `${dir}/k.pem`;
    writeFileSync(file, other.privatePem);
    expect(run('sign', file).status).toBe(2); // not the pair of the key the game holds
    expect(run('check', both).status).toBe(1); // (made with a test key, not the shipped one)
    expect(run('check').status).toBe(2);
  });
});
