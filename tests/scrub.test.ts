import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrub } from '../src/ui/scrub';

afterEach(() => vi.unstubAllGlobals());

describe('a report pasted in public carries nothing that names the player (round 56)', () => {
  it('takes the home folder\'s name out of a path, on every system and in every spelling', () => {
    const cases: [string, string][] = [
      ["EACCES: open 'C:\\Users\\Jane Doe\\AppData\\Roaming\\Seventy Steps\\saves\\slot0.json'", "EACCES: open 'C:\\Users\\<user>\\AppData\\Roaming\\Seventy Steps\\saves\\slot0.json'"],
      ['"path":"C:\\\\Users\\\\jdoe\\\\AppData\\\\x.log"', '"path":"C:\\\\Users\\\\<user>\\\\AppData\\\\x.log"'],
      ['at file:///C:/Users/jdoe/Games/SeventySteps/resources/app.asar/dist/a.js:3:9', 'at file:///C:/Users/<user>/Games/SeventySteps/resources/app.asar/dist/a.js:3:9'],
      ['ENOENT /Users/jane/Library/Application Support/Seventy Steps/window.json', 'ENOENT /Users/<user>/Library/Application Support/Seventy Steps/window.json'],
      ['at /home/jdoe/.local/share/itch/apps/seventy-steps/resources/app.asar/main.js:12:4', 'at /home/<user>/.local/share/itch/apps/seventy-steps/resources/app.asar/main.js:12:4'],
      ['C:\\Documents and Settings\\Owner\\x', 'C:\\Documents and Settings\\<user>\\x'],
      ['could not open C:\\Users\\Jane; retrying', 'could not open C:\\Users\\<user>; retrying'], // a name with nothing after it: the name alone
      ["open 'C:\\Users\\O'Neil\\AppData\\Roaming\\x.json'", "open 'C:\\Users\\<user>\\AppData\\Roaming\\x.json'"], // review of PR 142: a name with an apostrophe...
      ['C:\\Users\\Jane Doe (Work)\\AppData', 'C:\\Users\\<user>\\AppData'], // ...or brackets...
      ['C:/Users/D\'Arcy, Smith/Saved Games/x', 'C:/Users/<user>/Saved Games/x'], // ...or a comma, in a file:// address
      ["home is C:\\Users\\O'Neil", 'home is C:\\Users\\<user>'], // ...and with nothing after it
    ];
    for (const [raw, clean] of cases) expect(scrub(raw)).toBe(clean);
  });

  it('takes out e-mail addresses and the query of an address (a key, a token), and keeps the line it points at', () => {
    expect(scrub('signed in as jane.doe+games@example.co.uk failed')).toBe('signed in as <email> failed');
    expect(scrub('GET https://api.example.com/v1/x?key=SECRET123&user=jane failed')).toBe('GET https://api.example.com/v1/x failed');
    expect(scrub('at q (https://html-classic.itch.zone/html/1234/assets/index-AbC12.js?v=9:2:41)')).toBe('at q (https://html-classic.itch.zone/html/1234/assets/index-AbC12.js:2:41)');
    expect(scrub('at r (app://seventy-steps/assets/index-AbC12.js#token=abc:1:5)')).toBe('app://seventy-steps/assets/index-AbC12.js:1:5'.replace(/^/, 'at r (') + ')');
  });

  it('takes the whole of a query, colons and nested addresses with it, and still keeps a stack trace\'s line (review of PR 142)', () => {
    expect(scrub('GET https://api.example.com/x?token=abc:def failed')).toBe('GET https://api.example.com/x failed');
    expect(scrub('to https://a.example/login?redirect=https://private.example/path?key=SECRET:9 then')).toBe('to https://a.example/login then');
    expect(scrub('"https://a.example/cb#access_token=ya29:a0:b1"')).toBe('"https://a.example/cb"');
    expect(scrub('at f (https://x.example/a.js?sig=ab:cd:2:41)')).toBe('at f (https://x.example/a.js:2:41)');
    expect(scrub('see https://x.example/p?k=SECRET:1:2 and on')).not.toContain('SECRET');
    expect(scrub('two: https://a.example/?k=1 and https://b.example/?k=2:3:4')).toBe('two: https://a.example/ and https://b.example/:3:4');
  });

  it('takes a query whole where it holds brackets, quotes or apostrophes of its own, and ends one only at the mark that closed its address (review of PR 142)', () => {
    // a bracket in a query value, which a URL may hold unescaped, was taken for the end of the address
    expect(scrub('https://api.example/x?redirect=https://private.example/(user)?key=SECRET')).toBe('https://api.example/x');
    expect(scrub('at g (https://x.example/a.js?r=https://p.example/(u)?k=SECRET:5:6)')).toBe('at g (https://x.example/a.js:5:6)'); // the frame's own bracket still closes it
    expect(scrub('GET https://x.example/p?a=((b))&k=SECRET end')).toBe('GET https://x.example/p end');
    expect(scrub('GET https://x.example/p?a=[1,2]&k=SECRET end')).toBe('GET https://x.example/p end');
    // one that nothing opened runs to the space, whatever it holds: a lone bracket or an apostrophe is as likely a key's as an end
    expect(scrub('see https://x.example/p?a=1)&k=SECRET now')).toBe('see https://x.example/p now');
    expect(scrub("see https://x.example/p?name=O'Neil&k=SECRET now")).toBe('see https://x.example/p now');
    expect(scrub('at h (https://x.example/a.js?a=(b&k=SECRET:1:2)')).not.toContain('SECRET'); // an unclosed one takes more, never less
    // one in a quote or a bracket ends where that closes
    expect(scrub('"url":"https://x.example/p?k=SECRET","next":1')).toBe('"url":"https://x.example/p","next":1');
    expect(scrub("open 'https://x.example/p?k=SECRET' and 'https://y.example/q?k=SECRET'")).toBe("open 'https://x.example/p' and 'https://y.example/q'");
    expect(scrub('<https://x.example/p?k=SECRET> and [https://y.example/q?k=SECRET]')).toBe('<https://x.example/p> and [https://y.example/q]');
  });

  it('keeps what a fix is found by: file names, line numbers, versions, the game\'s own words', () => {
    const kept = [
      'TypeError: Cannot read properties of undefined (reading \'pos\') at stepGame (app://seventy-steps/assets/index-AbC12.js:1:23456)',
      'three@0.170.0 WebGL: INVALID_OPERATION: drawElements',
      'Seventy Steps 1.0.0-rc.5 demo crash report: the dream broke',
      'at Miskatonic University (257.2, 3.0, 224.6) · lead: Speak with Wingate Peaslee, by the Elder Sign at Miskatonic Quad.',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) seventy-steps/1.0.0-rc.5 Chrome/142.0.0.0 Electron/39.0.0 Safari/537.36',
      'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 (0x00002503) Direct3D11 vs_5_0 ps_5_0, D3D11)',
      '/root/x and /usr/lib/x86_64-linux-gnu/libGL.so.1',
    ];
    for (const line of kept) expect(scrub(line)).toBe(line);
  });

  it('is applied to the whole report: the record of errors as well as the game\'s state', async () => {
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => null }) });
    vi.stubGlobal('screen', { width: 1920, height: 1080 });
    vi.stubGlobal('window', { devicePixelRatio: 1 });
    vi.stubGlobal('innerWidth', 1280);
    vi.stubGlobal('innerHeight', 720);
    vi.resetModules();
    const { crashReport, note } = await import('../src/ui/crashLog');
    note('error', new Error("EPERM: open 'C:\\Users\\Jane\\AppData\\Roaming\\Seventy Steps\\saves\\a.json' (mail jane@example.com)"));
    const report = crashReport('the dream broke', 'played 1:02 · last sign Miskatonic Quad');
    expect(report).not.toMatch(/Jane|jane@example\.com/);
    expect(report).toContain('C:\\Users\\<user>\\AppData');
    expect(report).toContain('<email>');
    expect(report).toContain('last sign Miskatonic Quad');
  });
});
