// Round 78, dev only: renders a 12 s scripted sequence (two footfalls, a growl, a door, a cane tap) through the game's own room reverb
// (src/render/audio/space.ts, in OfflineAudioContext) twice for each place, the send off and on, and writes the pairs as WAVs with what
// the reverb adds (its level against the dry, and how long a footfall's tail stays audible). Needs Playwright and `npx vite --port <port>`:
//   node tools/sound_ab.mjs <out dir> [port=5189] [case ...]     cases: open timber library vault cave drowned cosmos fight ruin nave
// (No GL is used: the page is a blank one.)
import { mkdirSync, writeFileSync } from 'node:fs';

const [out = 'sound_ab', port = '5189', ...only] = process.argv.slice(2);
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(`http://localhost:${port}/tools/sound_ab.html`);

const names = ['open', 'ruin', 'timber', 'library', 'nave', 'vault', 'cave', 'drowned', 'cosmos', 'fight'].filter((n) => !only.length || only.includes(n));
const result = await page.evaluate(async (names) => {
  const { SPACES } = await import('/src/data/acoustics.ts');
  const { createSpaceBus } = await import('/src/render/audio/space.ts');
  const SR = 48000;
  const rnd = (() => { let s = 7; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296) * 2 - 1; })();
  const lp = (x, hz) => { const k = 1 - Math.exp((-2 * Math.PI * hz) / SR); let y = 0; return x.map((v) => (y += k * (v - y))); };
  const burst = (len, tau, hz, g) => lp(Array.from({ length: len }, () => rnd()), hz).map((v, i) => v * g * Math.exp(-i / SR / tau));
  const foot = burst(Math.round(0.12 * SR), 0.03, 700, 0.5);
  const cane = Array.from({ length: Math.round(0.1 * SR) }, (_, i) => (Math.sin((2 * Math.PI * 1900 * i) / SR) * 0.35 + rnd() * 0.1) * Math.exp(-i / SR / 0.012));
  const growl = Array.from({ length: SR }, (_, i) => { const t = i / SR; const p = (90 * (1 + 0.06 * Math.sin(2 * Math.PI * 5 * t)) * t) % 1; return (2 * p - 1) * 0.3 * Math.min(1, t / 0.08) * Math.exp(-t / 0.5); });
  const door = burst(Math.round(0.5 * SR), 0.08, 500, 0.5).map((v, i) => v + Math.sin((2 * Math.PI * 55 * i) / SR) * 0.3 * Math.exp(-i / SR / 0.1));
  const sequence = (seconds, events) => { const x = new Float32Array(SR * seconds); for (const [t, s] of events) s.forEach((v, i) => { const j = Math.round(t * SR) + i; if (j < x.length) x[j] += v; }); return x; };
  const render = async (x, row, on) => {
    const ctx = new OfflineAudioContext(2, x.length, SR);
    const buf = ctx.createBuffer(1, x.length, SR);
    buf.getChannelData(0).set(x);
    const sfx = ctx.createGain();
    const bed = ctx.createGain();
    const master = ctx.createGain();
    master.connect(ctx.destination);
    sfx.connect(master);
    if (on) createSpaceBus(ctx, sfx, bed, master, row); // (begun in the room: a send that glides there would be heard mid-glide)
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(sfx);
    src.start();
    const r = await ctx.startRendering();
    return [r.getChannelData(0), r.getChannelData(1)];
  };
  const db = (v) => 20 * Math.log10(v + 1e-12);
  const rms = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
  const peakOf = (a) => a.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  const b64 = (a, k) => { const i = new Int16Array(a.length); a.forEach((v, j) => (i[j] = Math.max(-1, Math.min(1, v * k)) * 32767)); let s = ''; const u = new Uint8Array(i.buffer); for (let j = 0; j < u.length; j += 8192) s += String.fromCharCode(...u.subarray(j, j + 8192)); return btoa(s); };
  const full = sequence(12, [[0.5, foot], [1.1, foot], [2.5, growl], [5, door], [7, cane]]);
  const one = sequence(6, [[0.2, foot]]);
  const out = {};
  for (const name of names) {
    const row = SPACES[name];
    const [wl, wr] = await render(full, row, true);
    const [dl] = await render(full, row, false);
    const [tl] = await render(one, row, true);
    const [t0] = await render(one, row, false);
    const wet = Float32Array.from(tl, (v, i) => v - t0[i]);
    const dryPeak = peakOf(t0);
    let above = (limit) => { let last = 0; const blk = 960; for (let i = 0; i + blk < wet.length; i += blk) if (db(rms(wet.slice(i, i + blk)) / dryPeak) > limit) last = i + blk; return +(last / SR - 0.2).toFixed(2); };
    out[name] = { wetOverDryDb: +(db(rms(Float32Array.from(wl, (v, i) => v - dl[i]))) - db(rms(dl))).toFixed(1), tailAbove30dbS: above(-30), tailAbove40dbS: above(-40), tailAbove50dbS: above(-50), peakDry: +db(peakOf(dl)).toFixed(1), peakWet: +db(Math.max(peakOf(wl), peakOf(wr))).toFixed(1) };
    const k = 0.98 / Math.max(peakOf(dl), peakOf(wl), peakOf(wr));
    out[name].files = { dry: b64(dl, k), wetL: b64(wl, k), wetR: b64(wr, k) };
  }
  return out;
}, names);

const wav = (l, r) => {
  const n = l.length;
  const b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(48000, 24); b.writeUInt32LE(48000 * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { b.writeInt16LE(l[i], 44 + i * 4); b.writeInt16LE(r[i], 46 + i * 4); }
  return b;
};
const pcm = (s) => new Int16Array(Buffer.from(s, 'base64').buffer.slice(0));
for (const [name, r] of Object.entries(result)) {
  const { files, ...stats } = r;
  const [dry, wl, wr] = [pcm(files.dry), pcm(files.wetL), pcm(files.wetR)];
  writeFileSync(`${out}/${name}_dry.wav`, wav(dry, dry));
  writeFileSync(`${out}/${name}_wet.wav`, wav(wl, wr));
  console.log(name.padEnd(8), JSON.stringify(stats));
}
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
