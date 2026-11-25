import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { mkdir, mkdtemp, open, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const ITCH_DLC_EXTENSION = 'seventysteps-dlc';
const FILE_NAME = `brassbound-motor-car.${ITCH_DLC_EXTENSION}`;
const TOKEN_BYTES = 32;
// The paid download contains the token. The game ships only its SHA-256 digest.
const AUTOMOBILE_SHA256 = '4a3f53651f4623749d0350670e0e8aba0674e7a0b2aae96e37c4494ab9cc1bf6';

async function verifiedToken(path, sha256) {
  const info = await stat(path);
  if (!info.isFile() || info.size !== TOKEN_BYTES) return null;

  const file = await open(path, constants.O_RDONLY | constants.O_NONBLOCK);
  try {
    if (!(await file.stat()).isFile()) return null;
    // Read only the expected bytes plus one so a growing file is also rejected.
    const buffer = Buffer.alloc(TOKEN_BYTES + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await file.read(buffer, length, buffer.length - length, length);
      if (bytesRead === 0) break;
      length += bytesRead;
    }
    if (length !== TOKEN_BYTES) return null;
    const token = buffer.subarray(0, length);
    return createHash('sha256').update(token).digest('hex') === sha256 ? token : null;
  } finally {
    await file.close();
  }
}

export function createItchAutomobileDlc(sha256) {
  async function ownsItchAutomobileDlc(userData) {
    try {
      return (await verifiedToken(join(userData, 'dlc', FILE_NAME), sha256)) !== null;
    } catch {
      return false;
    }
  }

  async function importItchAutomobileDlc(userData, selectedPath) {
    try {
      const token = await verifiedToken(selectedPath, sha256);
      if (!token) return 'invalid';
      if (await ownsItchAutomobileDlc(userData)) return 'imported';

      const directory = join(userData, 'dlc');
      await mkdir(directory, { mode: 0o700, recursive: true });
      const temporary = await mkdtemp(join(directory, '.import-'));
      try {
        const pending = join(temporary, FILE_NAME);
        await writeFile(pending, token, { mode: 0o600 });
        await rename(pending, join(directory, FILE_NAME));
      } finally {
        await rm(temporary, { recursive: true, force: true }).catch(() => {});
      }
      return 'imported';
    } catch {
      return 'error';
    }
  }

  return { ownsItchAutomobileDlc, importItchAutomobileDlc };
}

export const { ownsItchAutomobileDlc, importItchAutomobileDlc } = createItchAutomobileDlc(AUTOMOBILE_SHA256);
