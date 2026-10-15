/** The few node:fs (node:zlib and node:child_process) calls the tests make, typed here: the project carries no @types/node (Vitest runs in Node). */
declare module 'node:fs' {
  export function existsSync(path: string): boolean;
  export function readdirSync(path: string): string[];
  export function readFileSync(path: string, encoding: 'utf8'): string;
  export function readFileSync(path: string): Uint8Array;
  export function statSync(path: string): { size: number };
  export function appendFileSync(path: string, data: string): void;
  export function writeFileSync(path: string, data: string): void;
  export function mkdirSync(path: string, options: { recursive: boolean }): void;
  export function mkdtempSync(prefix: string): string;
}
declare module 'node:os' {
  export function tmpdir(): string;
}
declare const process: { env: Record<string, string | undefined>; execPath: string };
declare module 'node:child_process' {
  export function spawnSync(command: string, args: string[], options: { env: Record<string, string | undefined>; encoding: 'utf8' }): { status: number | null; stdout: string; stderr: string };
}
declare module 'node:zlib' {
  export function inflateSync(data: Uint8Array): Uint8Array;
}
