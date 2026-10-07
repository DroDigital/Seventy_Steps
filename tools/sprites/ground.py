#!/usr/bin/env python3
"""Every grounded creature on the brief's ground line: the lowest pixel of its frames on row 61 (the 62nd of 64).

  python3 ground.py <pack> [--dry-run]

A direction's frames move together, by what puts its idle_0 on the line, so an attack's leap or a hurt
stagger keeps its height over the idle; then each move frame still off the line is set on it (a walk or a
slither does not leave the ground). What flies (`flies` in notes.json) hovers where it is drawn, and the
assemblies (their own canvases) are left alone. No frame is moved past row 62, so none touches the edge."""
import json, os, re, sys
import numpy as np
from PIL import Image

LINE, LOWEST = 61, 62
NOTES = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'notes.json')))


def _rel(path):
    return os.path.normpath(path[3:] if path.startswith('../') else path)


def _bottom(a):
    rows = np.nonzero((a[..., 3] > 40).any(1))[0]
    return int(rows[-1]) if len(rows) else None


def _shift(a, dy):
    out = np.zeros_like(a)
    if dy >= 0:
        out[dy:] = a[:a.shape[0] - dy]
    else:
        out[:dy] = a[-dy:]
    return out


def main(root, dry):
    page = open(os.path.join(root, 'previews/library.html'), encoding='utf-8').read()
    data = json.loads(re.search(r'<script id="pack-data"[^>]*>(.*?)</script>', page, re.S).group(1))
    moved = 0
    for item in data['items']:
        if item.get('renderer') != 'sprite' or NOTES.get(item['key'], {}).get('flies'):
            continue
        for direction, fr in item['frames'].items():
            if 'idle_0' not in fr:
                continue
            frames = {n: np.asarray(Image.open(os.path.join(root, _rel(p))).convert('RGBA')) for n, p in fr.items()}
            if any(a.shape[0] != 64 for a in frames.values()):
                continue
            base = LINE - _bottom(frames['idle_0'])
            for name, a in frames.items():
                b = _bottom(a)
                if b is None:
                    continue
                dy = LINE - b if name.startswith('move_') else base
                dy = min(dy, LOWEST - b)
                if dy == 0:
                    continue
                moved += 1
                print(f'{item["key"]} {direction} {name}: {dy:+d} px (row {b} to {b + dy})')
                if not dry:
                    Image.fromarray(_shift(a, dy), 'RGBA').save(os.path.join(root, _rel(fr[name])))
    print(f'{moved} frames {"would move" if dry else "moved"}')


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 1 or set(sys.argv[1:]) - set(args) - {'--dry-run'}:
        sys.exit(__doc__)
    main(args[0], '--dry-run' in sys.argv)
