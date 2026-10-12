/** Only the hash API used by the lossless artwork test; no additional dependency. */
declare module 'node:crypto' {
  export function createHash(algorithm: 'sha256'): { update(data: Uint8Array): { digest(encoding: 'hex'): string } };
}
