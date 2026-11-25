import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createItchAutomobileDlc, ITCH_DLC_EXTENSION } from '../desktop/itchDlc.js';

const fixture = Buffer.from('0123456789abcdef0123456789abcdef');
const sha256 = createHash('sha256').update(fixture).digest('hex');
const { ownsItchAutomobileDlc, importItchAutomobileDlc } = createItchAutomobileDlc(sha256);
let temp: string;
let profile: string;
let download: string;

beforeEach(async () => {
  temp = await mkdtemp(join(tmpdir(), 'seventy-steps-itch-dlc-'));
  profile = join(temp, 'profile');
  download = join(temp, `download.${ITCH_DLC_EXTENSION}`);
});

afterEach(async () => { await rm(temp, { recursive: true, force: true }); });

describe('the offline itch car unlock', () => {
  it('persists a valid import after the original download is deleted', async () => {
    expect(await ownsItchAutomobileDlc(profile)).toBe(false);
    await writeFile(download, fixture);
    expect(await importItchAutomobileDlc(profile, download)).toBe('imported');
    await rm(download);
    expect(await ownsItchAutomobileDlc(profile)).toBe(true);
    expect(await ownsItchAutomobileDlc(join(temp, 'other-profile'))).toBe(false);
  });

  it('rejects altered and oversized files without losing an installed unlock', async () => {
    await writeFile(download, fixture);
    expect(await importItchAutomobileDlc(profile, download)).toBe('imported');
    const altered = Buffer.from(fixture);
    altered[0] ^= 1;
    for (const invalid of [altered, Buffer.concat([fixture, Buffer.from([0])])]) {
      await writeFile(download, invalid);
      expect(await importItchAutomobileDlc(profile, download)).toBe('invalid');
      expect(await ownsItchAutomobileDlc(profile)).toBe(true);
    }
  });

  it('checks the saved unlock again instead of trusting a previously granted import', async () => {
    await writeFile(download, fixture);
    expect(await importItchAutomobileDlc(profile, download)).toBe('imported');
    await writeFile(join(profile, 'dlc', `brassbound-motor-car.${ITCH_DLC_EXTENSION}`), Buffer.alloc(fixture.length));
    expect(await ownsItchAutomobileDlc(profile)).toBe(false);
    expect(await importItchAutomobileDlc(profile, download)).toBe('imported');
    expect(await ownsItchAutomobileDlc(profile)).toBe(true);
  });

  it('rejects directories and reports filesystem failures without granting access', async () => {
    await mkdir(download);
    expect(await importItchAutomobileDlc(profile, download)).toBe('invalid');
    await rm(download, { recursive: true });
    await writeFile(download, fixture);
    await writeFile(profile, 'this path cannot hold the unlock folder');
    expect(await importItchAutomobileDlc(profile, download)).toBe('error');
    expect(await ownsItchAutomobileDlc(profile)).toBe(false);
  });

  it('accepts repeated imports of the same unlock', async () => {
    await writeFile(download, fixture);
    expect(await Promise.all([
      importItchAutomobileDlc(profile, download),
      importItchAutomobileDlc(profile, download),
    ])).toEqual(['imported', 'imported']);
    expect(await importItchAutomobileDlc(profile, download)).toBe('imported');
    expect(await ownsItchAutomobileDlc(profile)).toBe(true);
  });
});
