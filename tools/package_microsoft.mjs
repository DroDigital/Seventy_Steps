import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Arch, build, Platform } from 'electron-builder';
import { prepareMicrosoftStore } from '../packaging/microsoftStore.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
const output = join(project, 'release', 'microsoft-store');
const payload = join(output, 'win-unpacked');
const packages = join(output, 'package');

function run(executable, args, env = process.env) {
  const result = spawnSync(executable, args, { cwd: project, env, stdio: 'inherit' });
  if (result.error?.code === 'ENOENT' && executable === 'makepkg.exe') {
    throw new Error('MakePkg is missing. Install the October 2026 Microsoft GDK and run this command from its developer command prompt.');
  }
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${executable} failed (${result.status ?? result.signal}).`);
}

async function packageMicrosoft() {
  if (process.platform !== 'win32' || process.arch !== 'x64') {
    throw new Error('The Store package requires x64 Windows for the native controller binding and Microsoft GDK.');
  }

  const npm = process.env.npm_execpath;
  if (!npm) throw new Error('Run this script with npm run package:microsoft.');
  run(process.execPath, [npm, 'run', 'build']);
  run(process.execPath, [npm, 'run', 'icon']);

  await build({
    projectDir: project,
    targets: Platform.WINDOWS.createTarget('dir', Arch.x64),
    publish: 'never',
    config: {
      directories: { output },
      extraMetadata: { channel: 'microsoft' },
      asar: false,
    },
  });

  // Leave the files loose so this channel can ship without the Steam SDK, including its DLLs.
  const app = join(payload, 'resources', 'app');
  const metadataFile = join(app, 'package.json');
  const metadata = JSON.parse(readFileSync(metadataFile, 'utf8'));
  delete metadata.dependencies?.['steamworks.js'];
  delete metadata.steam;
  writeFileSync(metadataFile, `${JSON.stringify(metadata, null, 2)}\n`);
  rmSync(join(app, 'node_modules', 'steamworks.js'), { recursive: true, force: true });
  // The SDL package includes C++ sources for development. Windows ships its compiled binding.
  rmSync(join(app, 'node_modules', '@kmamal', 'sdl', 'src', 'native'), { recursive: true, force: true });

  prepareMicrosoftStore(payload, metadata.version);
  run(process.execPath, [
    'tools/smoke_packaged.mjs', '--app', join(payload, 'SeventySteps.exe'),
    '--channel', 'microsoft', '--edition', 'full', '--require', 'pads',
  ]);

  rmSync(packages, { recursive: true, force: true });
  mkdirSync(packages, { recursive: true });
  const packageFiles = () => readdirSync(packages).filter((file) => file.toLowerCase().endsWith('.msixvc'));
  try {
    run('makepkg.exe', ['pack', '/msixvc2', '/d', payload, '/pc', '/pd', packages, '/validationcritical']);
  } catch (error) {
    // MakePkg can leave an MSIXVC behind when validation fails. Keep the diagnostics for review.
    for (const file of packageFiles()) rmSync(join(packages, file));
    throw error;
  }
  const [artifact] = packageFiles();
  if (!artifact) throw new Error('MakePkg did not produce an MSIXVC package.');
  console.log(`Microsoft Store package: ${join(packages, artifact)}`);
}

packageMicrosoft().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
