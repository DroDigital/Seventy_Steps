import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RESCAN_FIRST_MS, RESCAN_MAX_MS, rescanWait } from '../desktop/padRescan.js';

describe('the controllers are looked for again while none is heard (round 54: a pad connected after launch was not found)', () => {
  it('looks first after the first wait, then a little less often each time, and never less often than the most', () => {
    const waits: number[] = [];
    let wait: number | undefined;
    for (let i = 0; i < 12; i++) waits.push((wait = rescanWait(wait)));
    expect(waits[0]).toBe(RESCAN_FIRST_MS);
    for (let i = 1; i < waits.length; i++) expect(waits[i]).toBeGreaterThanOrEqual(waits[i - 1]);
    expect(waits[waits.length - 1]).toBe(RESCAN_MAX_MS);
  });

  it('a wait is never shorter than the first, so a keyboard player is not made to start the worker in a loop', () => {
    expect(rescanWait(undefined)).toBe(RESCAN_FIRST_MS);
    expect(rescanWait(RESCAN_FIRST_MS)).toBeGreaterThan(RESCAN_FIRST_MS);
  });

  it('looks again inside the living worker, and does not close it', () => {
    const restart = readFileSync('desktop/main.js', 'utf8').match(/function restartPads\(\) \{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(restart).toContain("postMessage({ type: 'rescan' })");
    expect(restart).not.toContain('.kill(');
    const worker = readFileSync('desktop/padWorker.js', 'utf8');
    expect(worker).toContain("data?.type !== 'rescan'");
    expect(worker).toContain('manager.destroy()');
    expect(worker).toContain('new GamepadManager()');
  });
});
