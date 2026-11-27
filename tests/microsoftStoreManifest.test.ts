import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';

function prepare(path: string, version: string) {
  return spawnSync(process.execPath, [
    '--input-type=module',
    '-e',
    "import { prepareMicrosoftStore } from './packaging/microsoftStore.mjs'; prepareMicrosoftStore(process.argv[1], process.argv[2]);",
    path,
    version,
  ], { env: process.env, encoding: 'utf8' });
}

describe('Microsoft Store package preparation', () => {
  it('writes the reserved game identity, desktop launch target, and referenced shell images', () => {
    const dir = mkdtempSync(`${tmpdir()}/seventy-steps-store-`);
    const result = prepare(dir, '1.0.8');
    expect(result.status, result.stderr).toBe(0);
    const config = readFileSync(`${dir}/MicrosoftGame.config`, 'utf8');
    expect(config).toMatch(/<Identity\s+Name="DigitalDro\.SeventySteps"\s+Publisher="CN=71719126-39AC-4AE5-AEDC-C058AADC8F07"\s+Version="1\.0\.8\.0"/);
    expect(config).toContain('<StoreId>9NPXF7D955V7</StoreId>');
    expect(config).toContain('PublisherDisplayName="Digital Dro"');
    expect(config).toMatch(/<Executable\s+Name="SeventySteps\.exe"\s+Id="Game"\s+TargetDeviceFamily="PC"/);
    expect(config).toContain('<ProcessorArchitecture>x64</ProcessorArchitecture>');
    expect(config).not.toMatch(/<(MSAAppId|TitleId)>/);

    for (const [name, size] of [['StoreLogo', 100], ['Square150x150Logo', 150], ['Square44x44Logo', 44]] as const) {
      expect(config).toContain(`${name}="${name}.png"`);
      const png = readFileSync(`${dir}/${name}.png`);
      const header = new DataView(png.buffer, png.byteOffset, png.byteLength);
      expect(header.getUint32(0)).toBe(0x89504e47);
      expect(header.getUint32(16)).toBe(size);
      expect(header.getUint32(20)).toBe(size);
    }
  });

  it('rejects prerelease versions before writing the manifest or images', () => {
    const dir = mkdtempSync(`${tmpdir()}/seventy-steps-store-`);
    const result = prepare(dir, '1.0.8-rc.1');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Microsoft Store package version');
    expect(readdirSync(dir)).toEqual([]);
  });
});
