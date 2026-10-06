/**
 * The record of a break (round 46): the last errors and warnings the page raised, kept as they happen, and a report made
 * of them when the dream breaks (ui/crashScreen.ts), to copy from the crash screen or, in the desktop shell, written to a
 * file in its logs folder (desktop/main.js) that the screen opens. Errors outside the frame loop (an event handler, a
 * promise nobody caught) are kept too, and a crash report names them: they are often the first sign of what broke.
 */

import { desktop } from './desktop';

const KEEP = 60;
const lines: string[] = [];
let installed = false;
declare const __APP_VERSION__: string | undefined;

const stamp = (): string => new Date().toISOString().slice(11, 23);
const words = (x: unknown): string => (x instanceof Error ? `${x.name}: ${x.message}${x.stack ? `\n${x.stack.split('\n').slice(1, 5).join('\n')}` : ''}` : typeof x === 'string' ? x : JSON.stringify(x) ?? String(x));

/** Adds a line to the record (the oldest fall off). */
export function note(kind: string, what: unknown): void {
  lines.push(`${stamp()} ${kind} ${words(what).slice(0, 600)}`);
  if (lines.length > KEEP) lines.shift();
}

/** The record so far, oldest first. */
export const recorded = (): readonly string[] => lines;

/** Starts keeping the record: the console's errors and warnings, uncaught errors and rejected promises. Once. */
export function installCrashLog(): void {
  if (installed) return;
  installed = true;
  for (const kind of ['error', 'warn'] as const) {
    const was = console[kind].bind(console);
    console[kind] = (...args: unknown[]): void => {
      note(kind, args.map(words).join(' '));
      was(...args);
    };
  }
  addEventListener('error', (e) => note('uncaught', e.error ?? e.message));
  addEventListener('unhandledrejection', (e) => note('rejected', e.reason));
}

/** What a bug report needs: when, what ran it, how it was set, and the record. */
export function crashReport(kind: string, detail?: string): string {
  const gl = (() => {
    try {
      const c = document.createElement('canvas').getContext('webgl2');
      const x = c?.getExtension('WEBGL_debug_renderer_info');
      return c && x ? String(c.getParameter(x.UNMASKED_RENDERER_WEBGL)) : 'unknown';
    } catch {
      return 'unknown';
    }
  })();
  return [
    `Seventy Steps ${typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev'} crash report: ${kind}`,
    new Date().toISOString(),
    `${navigator.userAgent}${desktop ? ' (desktop shell)' : ''}`,
    `graphics: ${gl} · screen ${screen.width}x${screen.height} @${window.devicePixelRatio}x · window ${innerWidth}x${innerHeight}`,
    detail ? `\n${detail}` : '',
    '\nthe last errors and warnings:',
    ...lines,
  ].join('\n');
}
