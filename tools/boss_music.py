#!/usr/bin/env python3
"""Reads every boss theme in public/music/bosses and writes src/data/bossMusicMap.ts (round 44): for each
track its tempo and beat grid (or none: a drone, or no pulse), `entry` (where playing begins: full drive
within ~10 s), the loop's two ends (on bar lines, chosen by how alike the music is either side, at least
25 s long, inside the body, with a crossfade of at most two bars or 3 s), `hot` (the most intense
bar-aligned stretch of 12 s or more after the entry that can also be looped, if it stands clear of the
loop's mean) and the gain that brings the body to BOSS_MUSIC.target as render/audio/loudness.ts reads it
(0.5 s windows, the body where a window reaches REALM_MUSIC.steady of the median), with no peak over the
ceiling. A track with no good seam has `loop: null` and loops the realms' way. Prints the table and the
seams (the level step and the spectral-flux jump across the seam, against the track's own variation).
Run when a theme is added or changed: `python3 tools/boss_music.py` (needs `pip install av numpy`)."""
import os, re, sys
from concurrent.futures import ProcessPoolExecutor
import av
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
DIR, OUT = os.path.join(ROOT, 'public', 'music', 'bosses'), os.path.join(ROOT, 'src', 'data', 'bossMusicMap.ts')
HOP, NFFT, NB = 512, 2048, 24
MIN_LOOP, PREF_LOOP, MIN_HOT, MAX_XF = 25.0, 45.0, 12.0, 3.0  # the shortest loop and the length first tried; the shortest hot stretch; the longest crossfade (s), of two bars if they fit
PULSE = 0.10  # the least pulse strength (autocorrelation of the onsets) that has a beat grid
SEAM_STEP, SEAM_FLUX = float(os.environ.get('SEAM_STEP', 1.5)), 1.5  # the worst a seam may be: its level step (dB), its flux against the track's own 99th percentile
HOT_SIGMA, HOT_DB = 0.3, 1.0  # how far a hot stretch stands above the loop's mean: intensity (sigmas of the bars') and level (dB)

def const(path, name):
    return float(re.search(r'\b' + name + r':\s*(-?[\d.]+)', open(os.path.join(ROOT, 'src', 'data', path)).read()).group(1))
TARGET, CEIL, HOT_RISE, STEADY, WIN = const('bossMusic.ts', 'target'), const('bossMusic.ts', 'ceiling'), const('bossMusic.ts', 'hotRise'), const('realmMusic.ts', 'steady'), const('realmMusic.ts', 'window')
db = lambda v: 20 * np.log10(max(float(v), 1e-9))

def load(path):
    c = av.open(path)
    rate = c.streams.audio[0].rate
    x = np.concatenate([f.to_ndarray() for f in c.decode(audio=0)], axis=1)
    c.close()
    return (x / 32768.0 if x.dtype.kind == 'i' else x).astype(np.float32), rate

def levels(x, rate):
    """The level (RMS across the channels) and peak of each WIN-second window, as loudness.ts reads them."""
    n = round(rate * WIN)
    cnt = x.shape[1] // n
    seg = x[:, :cnt * n].reshape(x.shape[0], cnt, n).astype(np.float64)
    return np.sqrt((seg ** 2).sum(axis=(0, 2)) / (n * x.shape[0])), np.abs(seg).max(axis=(0, 2))

def body_of(rms, peak):
    mid = np.median(rms[rms > 1e-5])
    st = np.nonzero(rms >= STEADY * mid)[0]
    a, b = st[0], st[-1]
    return a * WIN, (b + 1) * WIN, float(np.sqrt((rms[a:b + 1] ** 2).mean())), float(peak[a:b + 1].max())

def bands(mono, rate):
    """Log-band energies (dB) per frame, and the frame rate."""
    edges = np.geomspace(50, 14000, NB + 1)
    f = np.fft.rfftfreq(NFFT, 1 / rate)
    m = np.stack([((f >= lo) & (f < hi)).astype(np.float32) for lo, hi in zip(edges[:-1], edges[1:])], 1)
    win, n, out = np.hanning(NFFT).astype(np.float32), 1 + (len(mono) - NFFT) // HOP, []
    for s in range(0, n, 1500):
        idx = (np.arange(NFFT)[None, :] + HOP * np.arange(s, min(n, s + 1500))[:, None])
        out.append((np.abs(np.fft.rfft(mono[idx] * win, axis=1)) ** 2) @ m)
    L = 10 * np.log10(np.concatenate(out) + 1e-9)
    return np.maximum(L, L.max() - 70), rate / HOP

def tempo(o, fr):
    d = o - np.convolve(o, np.ones(int(fr)) / int(fr), 'same')
    ac = np.fft.irfft(np.abs(np.fft.rfft(d, 2 * len(d))) ** 2)[:int(20 * fr)]
    ac /= ac[0] + 1e-12
    lag = np.arange(len(ac))
    bpm = 60 * fr / np.maximum(lag, 1)
    k = int(np.argmax(ac * np.exp(-0.5 * (np.log2(bpm / 100) / 0.7) ** 2) * ((bpm >= 55) & (bpm <= 190))))
    if 0 < k < len(ac) - 1:
        k = k + 0.5 * (ac[k - 1] - ac[k + 1]) / (ac[k - 1] - 2 * ac[k] + ac[k + 1] + 1e-12)
    s3, s4 = (np.mean([ac[min(len(ac) - 1, round(j * m * k))] for j in (1, 2, 3, 4)]) for m in (3, 4))
    per = 3 if s3 > 1.15 * s4 else 4
    return k, float(ac[int(round(k))]), per, bool(0.75 < s3 / max(s4, 1e-9) < 1.5)  # ... and whether 3 or 4 beats a bar is a close call

def track_beats(o, T):
    """Ellis's dynamic-programming beat tracker: the beat frames, following the take's own tempo drift."""
    loc = o / (o.std() + 1e-9)
    lo, hi = max(1, int(round(T / 2))), int(round(2 * T))
    tx = -100 * np.log(np.arange(lo, hi + 1) / T) ** 2
    score, back = loc.copy(), np.full(len(o), -1)
    for i in range(lo, len(o)):
        a = max(0, i - hi)
        v = score[a:i - lo + 1][::-1] + tx[:i - lo + 1 - a]
        j = int(np.argmax(v))
        score[i], back[i] = loc[i] + v[j], i - (lo + j)
    i, out = int(np.argmax(score[-int(T * 2):]) + len(o) - int(T * 2)), []
    while i >= 0:
        out.append(i)
        i = back[i]
    return np.array(out[::-1])

def per_bar(a, b, x):  # mean of a per-frame array between bar frames
    return np.stack([x[a[i]:max(a[i] + 1, a[i + 1])].mean(0) for i in range(len(a) - 1)])

def mixed(x, rate, i_t, j_t, xf, lead=7.5):
    """The sound across a loop's seam: `lead` seconds before the crossfade, the crossfade (end fading out, start fading in) and `lead` after (the level step reads the 6 s before the seam); and the seam's centre (sample)."""
    n, W = int(xf * rate), int((lead + xf) * rate)
    j, i = int(j_t * rate), int(i_t * rate)
    t = np.linspace(0, 1, n, dtype=np.float32)
    left = x[:, max(0, j - W):j - n]
    y = np.concatenate([left, x[:, j - n:j] * np.cos(t * np.pi / 2) + x[:, i:i + n] * np.sin(t * np.pi / 2), x[:, i + n:i + W]], axis=1)
    return y, left.shape[1] + n // 2

def level_at(y, rate, c, offsets, win=WIN):
    """The level (dB) of the `win`-second window centred `o` seconds from sample `c`, for each offset."""
    n = int(win * rate)
    return np.array([db(np.sqrt((y[:, max(0, int(c + o * rate) - n // 2):int(c + o * rate) + n // 2].astype(np.float64) ** 2).mean())) for o in offsets])

def seam_metrics(x, rate, i_t, j_t, xf, L0, ref):
    """A seam's level step and flux jump. The step (dB): the worst 0.5 s window from a second before the crossfade to a second after it
    against the median of the windows from 6 s to 1.5 s before it. The flux: the worst spectral-flux frame within the crossfade and half
    a second either side, against the 99th percentile of the flux of the stretch `ref` (seconds, the loop's own or the hot stretch's)."""
    y, c = mixed(x, rate, i_t, j_t, xf)
    hop, half = 0.0625, xf / 2
    base = np.median(level_at(y, rate, c, np.arange(-(half + 6), -(half + 1.5) + 1e-9, hop)))
    step = float(np.abs(level_at(y, rate, c, np.arange(-(half + 1), half + 1 + 1e-9, hop)) - base).max())
    Ly, _ = bands(y.mean(0), rate)
    fy = np.maximum(np.diff(Ly, axis=0), 0).sum(1)
    f0, w = int(c / HOP), int((half + 0.5) * rate / HOP)
    ref_flux = np.maximum(np.diff(L0[int(ref[0] * rate / HOP):int(ref[1] * rate / HOP)], axis=0), 0).sum(1)
    return step, float(fy[max(0, f0 - w):f0 + w].max() / np.percentile(ref_flux, 99))

def analyse(name):
    x, rate = load(os.path.join(DIR, name + '.mp3'))
    dur = x.shape[1] / rate
    rms, peak = levels(x, rate)
    B0, B1, body, bpeak = body_of(rms, peak)
    L, fr = bands(x.mean(0), rate)
    dL = np.maximum(np.diff(L, axis=0), 0)
    o, low = dL.sum(1), dL[:, :6].sum(1)
    k, strength, per, unsure = tempo(o, fr)
    r = dict(dur=dur, bpm=0, beats=0, bar=0.0, entry=round(max(0.0, B0 - 6) if B0 > 10 else 0.0, 3), lead=0.0, loop=None, hot=None, strength=strength, B0=B0, B1=B1, seam=None)
    realm = (B0, B1, max(0.5, min(10.0, (B1 - B0) / 4))) if B1 - B0 >= 24 else (0.0, dur, max(0.5, min(10.0, dur / 4)))  # the realms' kind of loop, where there is no better
    loop = realm
    if strength >= PULSE:
        bf = track_beats(o, k)
        s = o[bf] + low[bf]
        ph = int(np.argmax([s[p::per].mean() for p in range(per)]))
        bars = bf[ph::per]
        r.update(bpm=round(60 * fr / k, 1), beats=per)
        if len(bars) > 12:
            Fb = per_bar(bars, None, L)
            nb = len(Fb)
            bt = bars[:nb] / fr  # a bar's start, for each bar with a body
            pre = np.stack([Fb[max(0, m - 2):m].mean(0) if m else Fb[0] for m in range(nb)])
            post = np.stack([Fb[m:m + 2].mean(0) for m in range(nb)])
            rm = lambda a, b: np.sqrt(((a[:, None, :] - b[None, :, :]) ** 2).mean(2))
            D = rm(post, pre) + 0.5 * (rm(pre, pre) + rm(post, post))  # [i, j]: how a loop from bar i to bar j sounds across its seam
            Dmed = np.median(D[np.triu_indices(nb, 4)])
            idx = np.arange(nb)
            gap, n_ = bt[None, :] - bt[:, None], idx[None, :] - idx[:, None]
            def xf_of(a, b):
                """A crossfade of whole bars (two, else one) where that is within MAX_XF, else of whole beats: only then do the two passes' beats fall together in it."""
                bar = (bt[b] - bt[a]) / (b - a)
                return float(2 * bar if 2 * bar <= MAX_XF else bar if bar <= MAX_XF else max(1, int(MAX_XF / (bar / per))) * bar / per)
            def best_of(mask, cost, keep=24):
                """The top few candidates by `cost`, tried by sound: the seam's level step and flux, as the crossfade would make them."""
                pairs = sorted(zip(*np.nonzero(mask)), key=lambda ab: cost[ab])[:keep]
                tried = [(cost[a, b] / 1.0 + 0.4 * m[0] + 0.3 * m[1], a, b, m) for a, b in pairs for m in [seam_metrics(x, rate, bt[a], bt[b], xf_of(a, b), L, (bt[a], bt[b]))]]
                return sorted(tried, key=lambda t: t[0])[0] if tried else None
            phrase = (n_ * per % 12 == 0) if unsure else (n_ % 2 == 0)  # a loop is whole phrases: where a bar of 3 or of 4 is a close call, whole twelves of beats
            cost = D / Dmed - 0.2 * np.minimum(1, gap / 90) - 0.1 * (n_ % 8 == 0) - 0.05 * (n_ % 4 == 0)
            pick = None
            for least, ph in ((PREF_LOOP, phrase), (MIN_LOOP, phrase), (PREF_LOOP, n_ % 2 == 0), (MIN_LOOP, n_ % 2 == 0)):  # a long loop if its seam is good, else a shorter; whole twelves of beats, else whole pairs of bars
                ok = (gap >= least) & (bt[:, None] >= B0 - 0.3) & (bt[None, :] <= B1 + 0.3) & ph
                pick = best_of(ok, cost) if ok.any() else None
                if pick and pick[3][0] <= SEAM_STEP and pick[3][1] <= SEAM_FLUX:
                    break
            if os.environ.get('SEAM_DEBUG') and pick:
                print(name, 'loop pick: cost %.2f step %.2f flux %.2f' % (pick[0], pick[3][0], pick[3][1]))
            if pick and pick[3][0] <= SEAM_STEP and pick[3][1] <= SEAM_FLUX:
                _, i, j, m = pick
                bar = float((bt[j] - bt[i]) / (j - i))
                loop, r['bar'], r['loop_ok'], r['score'], r['seam'] = (float(bt[i]), float(bt[j]), xf_of(i, j)), bar, True, float(D[i, j] / Dmed), m
                if B0 > 10:  # the entry: a bar line, with the drive within ~6 s
                    r['entry'] = round(float(min(bt[np.searchsorted(bt, B0 - 6)], bt[i])), 3)
                # hot: the most intense bar-aligned stretch of >= MIN_HOT s after the entry that stands clear of the loop and can also be looped
                lv = np.array([db(np.sqrt((x[:, int(bt[q] * rate):int(bt[q + 1] * rate)].astype(np.float64) ** 2).mean())) for q in range(nb - 1)] + [-90.0])
                z = lambda a: (a - a.mean()) / (a.std() + 1e-9)
                inten = (z(lv) + z(per_bar(bars, None, o[:, None]).ravel()) + z(Fb[:, 14:].mean(1) - Fb[:, :8].mean(1))) / 3
                span = np.array([[inten[a:b].mean() - inten[i:j].mean() if b > a else 0 for b in range(nb)] for a in range(nb)])
                dbs = np.array([[lv[a:b].mean() - lv[i:j].mean() if b > a else 0 for b in range(nb)] for a in range(nb)])
                hot = (gap >= MIN_HOT) & (gap <= 40) & (bt[:, None] >= r['entry']) & (bt[None, :] <= B1 + 0.3) & (span >= HOT_SIGMA) & (dbs >= HOT_DB) & (n_ % 2 == 0)
                pick = best_of(hot, D / Dmed - span) if hot.any() else None
                if pick and pick[3][0] <= SEAM_STEP and pick[3][1] <= SEAM_FLUX:
                    _, a, b, m = pick
                    r['hot'], r['hot_db'], r['hot_seam'] = (float(bt[a]), float(bt[b]), xf_of(a, b)), float(dbs[a, b]), m
    r['lead'] = round(max(0.0, B0 - r['entry']), 2)
    r['loop'] = loop if r.get('loop_ok') else None
    if not r['seam'] and B1 - B0 > realm[2] * 2:
        m = seam_metrics(x, rate, realm[0], realm[1], realm[2], L, (B0, B1))
        r['seam'] = m
    # the gain: the body of what plays (the first pass and the loop) to the target, no peak over the ceiling in it; the hot stretch, louder by design, is trimmed alone,
    # to the ceiling and to HOT_RISE dB over the loop
    w = slice(int(r['entry'] / WIN), int(loop[1] / WIN) + 1)
    _, _, body, bpeak = body_of(rms[w], peak[w])
    r['gain'] = min(10 ** (TARGET / 20) / body, CEIL / bpeak)
    hw = slice(int(r['hot'][0] / WIN), int(r['hot'][1] / WIN) + 1) if r['hot'] else None
    r['hotGain'] = min(1.0, CEIL / (r['gain'] * float(peak[hw].max())), 10 ** ((HOT_RISE - r['hot_db']) / 20)) if r['hot'] else 1.0
    r['rms'], r['peak'] = db(body), db(bpeak)
    lw = 20 * np.log10(np.maximum(rms[int(r['entry'] / WIN):int(loop[1] / WIN)], 1e-6))
    cf = np.geomspace(50, 14000, NB + 1)
    cf = np.sqrt(cf[:-1] * cf[1:])
    E = 10 ** (L[int(B0 * fr):int(B1 * fr)] / 10)
    r['quiet'] = float((lw < r['rms'] - 6).mean())
    r['dyn'], r['cent'] = float(np.percentile(lw, 90) - np.percentile(lw, 10)), float((E * cf).sum() / E.sum())  # how far the level ranges (dB, 10th to 90th percentile), and how bright it is (Hz)
    return name, r

def fmt(r):
    t = lambda v: 'null' if v is None else '[' + ', '.join(f'{u:.3f}'.rstrip('0').rstrip('.') for u in v) + ']'
    s = r['seam'] or (0, 0)
    return (f"{{ dur: {r['dur']:.1f}, bpm: {r['bpm']}, beats: {r['beats']}, bar: {r['bar']:.3f}, entry: {r['entry']}, lead: {r['lead']}, "
            f"loop: {t(r['loop'])}, hot: {t(r['hot'])}, gain: {r['gain']:.4f}, hotGain: {r['hotGain']:.3f}, rms: {r['rms']:.1f}, peak: {r['peak']:.1f}, seam: [{s[0]:.2f}, {s[1]:.2f}] }}")

if __name__ == '__main__':
    names = sorted(f[:-4] for f in os.listdir(DIR) if f.endswith('.mp3'))
    only = [a.replace('-', '_') for a in sys.argv[1:]]  # tracks given: print their rows, write nothing
    names = [n for n in names if not only or n.replace('-', '_') in only]
    with ProcessPoolExecutor(max(1, (os.cpu_count() or 2))) as ex:
        res = dict(ex.map(analyse, names))
    print(f"{'track':28} {'dur':>4} {'bpm':>5} {'pulse':>5} {'entry':>5} {'loop':>13} {'xf':>3} {'step':>5} {'flux':>5} {'hot':>11} {'+dB':>4} {'hstep':>5} {'hflux':>5} {'gain':>5} {'rms':>5} {'dyn':>4} {'cent':>5} {'quiet':>5} {'hg':>4}")
    for n in names:
        r = res[n]
        sm, hs = r['seam'] or (0, 0), r.get('hot_seam') or (0, 0)
        lp = f"{r['loop'][0]:5.1f}-{r['loop'][1]:5.1f}" if r['loop'] else 'realms(body)'
        ht = f"{r['hot'][0]:5.1f}-{r['hot'][1]:5.1f}" if r['hot'] else '-'
        print(f"{n:28} {r['dur']:4.0f} {r['bpm']:5} {r['strength']:5.2f} {r['entry']:5.1f} {lp:>13} {(r['loop'] or (0, 0, 0))[2]:3.1f} {sm[0]:5.2f} {sm[1]:5.2f} {ht:>11} {r.get('hot_db', 0):4.1f} {hs[0]:5.2f} {hs[1]:5.2f} {db(r['gain']):5.1f} {r['rms']:5.1f} {r['dyn']:4.1f} {r['cent']:5.0f} {r['quiet']:5.2f} {r['hotGain']:4.2f}")
    if only:
        sys.exit(0)  # tracks given: their rows only, nothing written
    ids = ',\n'.join(f"  {n.replace('-', '_')}: {fmt(res[n])}" for n in names)
    open(OUT, 'w').write(f"""/**
 * Where each boss theme plays, loops and heats (round 44): found offline by `python3 tools/boss_music.py`
 * (do not edit; mend a loop point in data/bossMusic.ts OVERRIDES). Seconds into the file. `bpm` and `beats`
 * a bar (0: no pulse found), `bar` the loop's bar in seconds, `entry` where playing begins and `lead` the
 * seconds from there to full drive, `loop` its two ends and the crossfade between passes (null: the realms'
 * kind of loop, found as it loads), `hot` the last phase's stretch (null: none stands clear), `gain` what
 * brings the body to BOSS_MUSIC.target without a peak over the ceiling (linear), `hotGain` the hot stretch's own trim to the ceiling (× the gain; 1: none), `rms` and `peak` the body's
 * before it (dBFS), `seam` the level step and the spectral-flux jump across the loop's seam, each against the
 * track's own variation (1: as large as its own largest). Data only.
 */

import type {{ BossTrackId }} from './bossMusic';

export interface BossMap {{
  dur: number;
  bpm: number;
  beats: number;
  bar: number;
  entry: number;
  lead: number;
  loop: readonly [number, number, number] | null;
  hot: readonly [number, number, number] | null;
  gain: number;
  hotGain: number;
  rms: number;
  peak: number;
  seam: readonly [step: number, flux: number];
}}

export const BOSS_MAP: Readonly<Partial<Record<BossTrackId, BossMap>>> = {{
{ids},
}};
""")
    print('wrote', OUT)
