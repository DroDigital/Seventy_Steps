/**
 * After packing on Linux: rename the Electron binary to `seventy-steps.bin` and write `seventy-steps`
 * as a shell that starts it with `--no-sandbox`.
 *
 * Ubuntu 23.10+ (and 26.04) sets AppArmor so unprivileged user namespaces are refused. Chromium's
 * sandbox then aborts before any window opens (electron#41066). A .deb can ship an AppArmor profile;
 * Steam and itch.io ship this folder, so the flag is the reliable fix. The shell `exec`s the binary,
 * so Chromium children re-exec the `.bin` via `/proc/self/exe` and never re-enter the script.
 */
import { chmodSync, existsSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const EXE = 'seventy-steps';

export default async function afterPack(context) {
  if (context.electronPlatformName !== 'linux') return;
  const out = context.appOutDir;
  const real = join(out, EXE);
  const bin = join(out, `${EXE}.bin`);
  if (!existsSync(real)) throw new Error(`linux afterPack: missing ${real}`);
  renameSync(real, bin);
  writeFileSync(
    real,
    `#!/bin/sh
# Seventy Steps Linux launcher (packaging/linuxLaunch.mjs).
cd "$(dirname "$0")" || exit 1
exec ./${EXE}.bin --no-sandbox "$@"
`,
  );
  chmodSync(real, 0o755);
  chmodSync(bin, 0o755);
}
