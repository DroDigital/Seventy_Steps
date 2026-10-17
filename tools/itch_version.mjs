// Stamp a shared, distinct version before CI builds any itch package (all platforms use the same run and attempt).
// Run from the project root after npm ci. Local releases use npm version patch --no-git-tag-version before packaging.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const run = process.env.GITHUB_RUN_NUMBER;
const attempt = process.env.GITHUB_RUN_ATTEMPT;
if (!/^[1-9]\d*$/.test(run ?? '') || !/^[1-9]\d*$/.test(attempt ?? '')) {
  console.error('An itch CI version needs GITHUB_RUN_NUMBER and GITHUB_RUN_ATTEMPT (positive integers).');
  process.exit(2);
}

const pkgFile = join(process.cwd(), 'package.json');
const lockFile = join(process.cwd(), 'package-lock.json');
const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
const lock = JSON.parse(readFileSync(lockFile, 'utf8'));
// Re-running this step replaces the previous suffix instead of growing the version indefinitely.
const base = pkg.version.replace(/-build\.\d+\.\d+$/, '');
if (!/^\d+\.\d+\.\d+$/.test(base)) {
  console.error('Set a stable release version in package.json before building for itch.io, e.g. npm version 1.0.1 --no-git-tag-version.');
  process.exit(2);
}
if (lock.version !== pkg.version || lock.packages?.['']?.version !== pkg.version) {
  console.error('package.json and package-lock.json versions disagree; use npm version to update both before packaging.');
  process.exit(2);
}

const version = `${base}-build.${run}.${attempt}`;
pkg.version = lock.version = lock.packages[''].version = version;
// Apple bundle fields require numeric versions; the game's package and itch label keep the full build id.
pkg.build = { ...pkg.build, mac: { ...pkg.build?.mac, bundleShortVersion: base, bundleVersion: base } };
writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);
writeFileSync(lockFile, `${JSON.stringify(lock, null, 2)}\n`);
console.log(`itch.io release version: ${version}`);
