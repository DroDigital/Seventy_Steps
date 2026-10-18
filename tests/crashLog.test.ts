import { afterEach, describe, expect, it, vi } from 'vitest';
import { note, recorded } from '../src/ui/crashLog';

afterEach(() => vi.unstubAllGlobals());

describe('the crash record', () => {
  it('keeps the last sixty lines, each cut short, errors with their words', () => {
    for (let i = 0; i < 100; i++) note('error', `line ${i}`);
    expect(recorded().length).toBe(60);
    expect(recorded()[0]).toContain('line 40');
    expect(recorded().at(-1)).toContain('line 99');
    note('uncaught', new TypeError('x is not a function'));
    expect(recorded().at(-1)).toContain('TypeError: x is not a function');
    note('error', 'z'.repeat(5000));
    expect(recorded().at(-1)!.length).toBeLessThan(700);
  });
});

describe('the graphics card named in a report (review of PR 142)', () => {
  it('is asked of one borrowed context, once, which is let go at once, however often a report is made', async () => {
    let made = 0;
    let lost = 0;
    const context = {
      getExtension: (name: string) => (name === 'WEBGL_debug_renderer_info' ? { UNMASKED_RENDERER_WEBGL: 0x9246 } : name === 'WEBGL_lose_context' ? { loseContext: () => void lost++ } : null),
      getParameter: () => 'Test GPU',
    };
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => (made++, context) }) });
    vi.stubGlobal('screen', { width: 1920, height: 1080 });
    vi.stubGlobal('window', { devicePixelRatio: 1 });
    vi.stubGlobal('innerWidth', 1280);
    vi.stubGlobal('innerHeight', 720);
    vi.resetModules();
    const { crashReport } = await import('../src/ui/crashLog');
    for (let i = 0; i < 20; i++) expect(crashReport('asked from the pause menu', 'here', 'problem report')).toContain('graphics: Test GPU');
    expect([made, lost]).toEqual([1, 1]);
  });

  it('says "unknown" where there is no WebGL 2, and does not ask again', async () => {
    let made = 0;
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => (made++, null) }) });
    vi.resetModules();
    const { graphicsName } = await import('../src/ui/crashLog');
    expect([graphicsName(), graphicsName()]).toEqual(['unknown', 'unknown']);
    expect(made).toBe(1);
  });
});
