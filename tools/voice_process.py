#!/usr/bin/env python3
"""Peaslee's recordings, treated as round 42 left them (docs/VOICES.md): his designed voice, taken lower and brisker.

    python3 tools/voice_process.py <take.mp3> <public/voice/npc-peaslee-xxxxxx.mp3> [--hold START:LEN ...]

Needs `pip install av numpy scipy`. A take from ElevenLabs is (1) played at 0.91 (pitch and pace both fall: the
resampling), (2) sped by WSOLA, 1.26, which returns the pace and brings it ~12% brisker than the take, (3) every
silence over 0.4 s cut to 0.22 s, and (4) levelled to a peak of 0.87 and written as a 56 kbit/s mono MP3 (as his other
ten are). `--hold START:LEN` keeps one pause LEN seconds long instead of 0.22 (START: a second inside that silence in the
TAKE's own time; a line that wants a beat, "Find him." and its long pause).

The three numbers were fitted, not recovered (round 42 left no script): run on the unprocessed take of a line that is
still in the history (698a0e2: `npc-peaslee-oj7abx`) they give the clip of the same line that shipped: the same length
(11.35 s), its pauses within 0.1 s of where they fell, and its spectrum within 0.3 dB a band to 6.4 kHz (1.8 dB above).
Only Peaslee is treated: the other voices are used as ElevenLabs gives them (Morgan's four were processed once, round 45).
"""
import argparse
from fractions import Fraction

import av
import numpy as np
from scipy.signal import fftconvolve, resample_poly

SR = 44100
PITCH, SPEED = 0.91, 1.26  # the resampling (pitch and pace) and the WSOLA speed-up
PAUSE_OVER, PAUSE_TO = 0.4, 0.22  # silences longer than the first are cut to the second (seconds)
PEAK, KBPS = 0.87, 56  # the level the clips are set to, and the bit rate they are written at
SILENT_DB = -48  # a 10 ms frame below this is silence


def load(path: str) -> np.ndarray:
    c = av.open(path)
    r = av.AudioResampler(format='flt', layout='mono', rate=SR)
    return np.concatenate([f.to_ndarray().reshape(-1) for fr in c.decode(audio=0) for f in r.resample(fr)]).astype(np.float64)


def resample(x: np.ndarray, rate: float) -> np.ndarray:
    """Played at `rate`: pitch and pace both move by it."""
    f = Fraction(rate).limit_denominator(200)
    return resample_poly(x, f.denominator, f.numerator)


def wsola(x: np.ndarray, speed: float, n: int = 1024, delta: int = 300) -> np.ndarray:
    """Faster by `speed` with the pitch where it was: overlapped windows, each set where the wave carries on from the last."""
    hs = n // 2
    win = np.hanning(n + 1)[:n]  # periodic: windows half overlapped sum to one
    frames = int(np.ceil((len(x) - n) / (speed * hs))) + 1
    out = np.zeros(frames * hs + n)
    pad = np.concatenate([np.zeros(delta), x, np.zeros(n + 2 * delta + hs)])
    prev = None
    for k in range(frames):
        p = int(round(k * speed * hs)) + delta
        s = p
        if prev is not None:
            ref = pad[prev + hs: prev + hs + n]
            s = p - delta + int(np.argmax(fftconvolve(pad[p - delta: p + delta + n], ref[::-1], mode='valid')))
        out[k * hs: k * hs + n] += win * pad[s: s + n]
        prev = s
    return out[: int(len(x) / speed)]


def silences(x: np.ndarray, at_least: float) -> list[tuple[int, int]]:
    """The runs of silence at least `at_least` s long, as sample spans."""
    hop = int(SR * 0.01)
    n = len(x) // hop
    quiet = 20 * np.log10(np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9) < SILENT_DB
    runs, i = [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            if (j - i) * 0.01 >= at_least:
                runs.append((i * hop, j * hop))
            i = j
        else:
            i += 1
    return runs


def cut_pauses(x: np.ndarray, hold: list[tuple[float, float]]) -> np.ndarray:
    """Silences over PAUSE_OVER become PAUSE_TO (the head and tail of each kept, so nothing clicks); `hold`: (a second in it, its length) is kept as asked."""
    pieces, at = [], 0
    for a, b in silences(x, PAUSE_OVER):
        if a == 0 or b >= len(x) - 1:
            continue  # the first and last silences stay as they are
        want = next((length for t, length in hold if a / SR - 0.05 <= t <= b / SR + 0.05), PAUSE_TO)
        keep = int(want * SR)
        if b - a > keep:
            pieces += [x[at: a + keep // 2], x[b - (keep - keep // 2): b]]
            at = b
    return np.concatenate(pieces + [x[at:]])


def write_mp3(x: np.ndarray, path: str) -> None:
    out = av.open(path, 'w', format='mp3')
    st = out.add_stream('libmp3lame', rate=SR)
    st.bit_rate = KBPS * 1000
    st.layout = 'mono'
    x = np.clip(x, -1, 1).astype(np.float32)
    for i in range(0, len(x), 1152):
        fr = av.AudioFrame.from_ndarray(x[None, i: i + 1152], format='fltp', layout='mono')
        fr.sample_rate, fr.pts = SR, i
        for pkt in st.encode(fr):
            out.mux(pkt)
    for pkt in st.encode(None):
        out.mux(pkt)
    out.close()


def treat(x: np.ndarray, hold: list[tuple[float, float]] = ()) -> np.ndarray:
    """A take, treated; `hold` pauses are in the take's own time."""
    y = wsola(resample(x, PITCH), SPEED)
    y = cut_pauses(y, [(t / PITCH / SPEED, length) for t, length in hold])
    return y * (PEAK / float(np.abs(y).max()))


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('take')
    ap.add_argument('out')
    ap.add_argument('--hold', nargs='*', default=[], metavar='START:LEN', help='keep this pause LEN s long; START is a second inside it, in the take')
    a = ap.parse_args()
    y = treat(load(a.take), [tuple(float(v) for v in h.split(':')) for h in a.hold])
    write_mp3(y, a.out)
    print(f'{a.out}: {len(y) / SR:.2f} s, peak {np.abs(y).max():.2f}')
