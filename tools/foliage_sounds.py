#!/usr/bin/env python3
"""Round 126, the trees heard: cuts the CC0 field recordings of wind in trees (Freesound; credited in public/audio/CREDITS.md) into
the foliage's three beds and its creaks.

    python3 -I tools/foliage_sounds.py <folder holding the Freesound files, named by their id: 579250.mp3 701085.mp3 829004.mp3 726217.mp3>

(needs `pip install av numpy scipy`). Each bed is a calm stretch with no birds, insects or mic rumble in it (measured by ear and by its
spectrum), high-passed below the leaves, softened above them, looped by an equal-power crossfade of its end into its start and brought to
the beds' common level (-22.4 dB RMS, peak no higher than -1.4 dBFS), mono MP3 at 32 kHz and 64 kbps. Each creak is one groan of a trunk
on near silence, its foot and tail faded, peak at -1.4 dBFS, 44.1 kHz and 96 kbps. Run `python3 tools/audio_levels.py` after it.
"""
import os
import sys

import av
import numpy as np
from scipy.signal import butter, sosfiltfilt

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
BED_RMS = -22.4  # the level every bed in public/audio/amb is cut to
PEAK = -1.4

# (out, source id, start s, end s, high-pass Hz, low-pass Hz, crossfade s)
BEDS = [
    ('amb/canopy', '579250', 32.0, 76.0, 140, 7000, 2.5),  # cottonwoods in a breeze: a broadleaf crown's rustle
    ('amb/pines', '701085', 40.0, 83.0, 110, 6500, 3.0),  # pines soughing, soft
    ('amb/boughs', '829004', 76.0, 118.0, 90, 5500, 3.0),  # a gale's gusts through conifers: whole boughs heaving
]
# (out, source id, start s, length s): the groans of a trunk
CREAKS = [
    ('sfx/tree_creak1', '726217', 4.95, 1.35),
    ('sfx/tree_creak2', '726217', 16.2, 1.4),
    ('sfx/tree_creak3', '726217', 37.05, 1.5),
    ('sfx/tree_creak4', '726217', 40.45, 1.25),
    ('sfx/tree_creak5', '726217', 49.3, 1.15),
]


def load(path: str, rate: int) -> np.ndarray:
    c = av.open(path)
    r = av.AudioResampler(format='flt', layout='mono', rate=rate)
    x = np.concatenate([f.to_ndarray().reshape(-1) for fr in c.decode(audio=0) for f in r.resample(fr)])
    c.close()
    return x.astype(np.float64)


def band(x: np.ndarray, rate: int, lo: float, hi: float) -> np.ndarray:
    x = sosfiltfilt(butter(2, lo, 'highpass', fs=rate, output='sos'), x)
    return sosfiltfilt(butter(2, hi, 'lowpass', fs=rate, output='sos'), x)


def write_mp3(x: np.ndarray, path: str, rate: int, kbps: int) -> None:
    out = av.open(path, 'w', format='mp3')
    st = out.add_stream('libmp3lame', rate=rate)
    st.bit_rate = kbps * 1000
    st.layout = 'mono'
    x = x.astype(np.float32)
    for i in range(0, len(x), 1152):
        fr = av.AudioFrame.from_ndarray(x[None, i: i + 1152].copy(), format='fltp', layout='mono')
        fr.sample_rate = rate
        for pkt in st.encode(fr):
            out.mux(pkt)
    for pkt in st.encode(None):
        out.mux(pkt)
    out.close()


def db(v: float) -> float:
    return 20 * np.log10(max(v, 1e-12))


def bed(src: str, a: float, b: float, lo: float, hi: float, xf: float, rate: int = 32000) -> np.ndarray:
    x = band(load(src, rate)[int(a * rate): int(b * rate)], rate, lo, hi)
    n, f = len(x), int(xf * rate)
    body = x[: n - f].copy()
    t = np.linspace(0, np.pi / 2, f)
    body[:f] = x[:f] * np.sin(t) + x[n - f:] * np.cos(t)  # the end faded into the start: the loop closes on itself
    rms = np.sqrt((body ** 2).mean())
    g = 10 ** ((BED_RMS - db(rms)) / 20)
    g = min(g, 10 ** (PEAK / 20) / np.abs(body).max())
    return body * g


def creak(src: str, at: float, length: float, rate: int = 44100) -> np.ndarray:
    x = band(load(src, rate)[int((at - 0.12) * rate): int((at + length + 0.5) * rate)], rate, 180, 6000)
    up, down = int(0.015 * rate), int(0.35 * rate)
    x[:up] *= np.linspace(0, 1, up)
    x[-down:] *= np.cos(np.linspace(0, np.pi / 2, down)) ** 2
    return x * 10 ** (PEAK / 20) / np.abs(x).max()


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = lambda sid: os.path.join(sys.argv[1], f'{sid}.mp3')
    for out, sid, a, b, lo, hi, xf in BEDS:
        y = bed(src(sid), a, b, lo, hi, xf)
        write_mp3(y, os.path.join(ROOT, f'{out}.mp3'), 32000, 64)
        print(f'{out}: {len(y) / 32000:.1f} s, rms {db(np.sqrt((y ** 2).mean())):.1f}, peak {db(np.abs(y).max()):.1f}')
    for out, sid, at, length in CREAKS:
        y = creak(src(sid), at, length)
        write_mp3(y, os.path.join(ROOT, f'{out}.mp3'), 44100, 96)
        print(f'{out}: {len(y) / 44100:.2f} s')


if __name__ == '__main__':
    main()
