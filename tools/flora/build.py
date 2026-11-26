#!/usr/bin/env python3
"""Round 125, the flora library (docs/FLORA.md): every plant of species.py grown, barked, leafed, its light baked by rays through it, and
written into the game's data (export.py). Blender's own Python (bpy, mathutils) is used: its vectors, quaternions and BVH, and, with
--sheet, Cycles for a contact sheet of every model (preview.py).

    python3 -I tools/flora/build.py [--only tree.oak,pine.fir] [--sheet out.png --atlas atlas.png] [--stats]   (needs `pip install bpy numpy pillow`)
    then  npm run check

With --only, the other models already in src/data/flora are kept as they are. Each model is grown from a seed of its own name and
variant, so a rerun makes the same bytes.
"""
import argparse
import math
import os
import random
import re
import sys
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bpy  # noqa: E402,F401  (Blender's Python: it brings mathutils with it)

from grow import grow  # noqa: E402
from tubes import bark, reach_at  # noqa: E402
from cards import place  # noqa: E402
from bake import bake  # noqa: E402
from shapes import caps, stubs  # noqa: E402
from species import SPECIES  # noqa: E402
import export  # noqa: E402


def build(name, spec, v):
    """One model: (blob, index entry, (wood, leaf, cards))."""
    seed = zlib.crc32(name.encode()) + v * 7919
    rng = random.Random(seed ^ 0x5F3759DF)
    trunk, h = grow(spec, seed)
    if spec.get('extra', {}).get('stubs'):
        stubs(trunk, spec['extra']['stubs'] + rng.randint(0, 2), rng)
    wood = bark(trunk, spec, rng)
    leaf = caps(trunk, spec, rng) if 'caps' in spec else None
    cards = place(trunk, spec, rng, reach_at, spec.get('flex', [0.0, 0.05, 0.12, 0.22]), h)
    bake(wood, cards, leaf)
    pts = list(wood.pos) + (list(leaf.pos) if leaf else []) + [q for c in cards for q in c.corners()]
    top = max(p.y for p in pts)
    at_metre = min(0.999, max(0.0, (1.0 + 0.25) / max(trunk.length, 1e-3)))
    forks = [c.pts[0].y for c in trunk.children if c.pts]
    crown_pts = [c.center for c in cards] or ([p for p in leaf.pos] if leaf else [trunk.pts[-1]])
    lo = [min(p[i] for p in crown_pts) for i in range(3)]
    hi = [max(p[i] for p in crown_pts) for i in range(3)]
    info = dict(h=top, r=trunk.point(at_metre)[2], fork=min(forks) if forks else top, faces=len(wood.tris) + (len(leaf.tris) if leaf else 0) + 2 * len(cards),
                crown=[(lo[i] + hi[i]) / 2 for i in range(3)] + [(hi[i] - lo[i]) / 2 for i in range(3)])
    return export.blob(wood, leaf, cards), info, (wood, leaf, cards)


def kept():
    """The models already written (for --only): {id: (base64, index line)}."""
    pack, index = {}, {}
    try:
        for line in open(os.path.join(export.OUT, 'floraPack.ts')):
            m = re.match(r"\s+'([^']+)': '([^']*)',", line)
            if m:
                pack[m.group(1)] = m.group(2)
        for line in open(os.path.join(export.OUT, 'floraIndex.ts')):
            m = re.match(r"\s+'([^']+)': \{ h: ([-\d.]+), r: ([-\d.]+), fork: ([-\d.]+), crown: \[([^\]]*)\], faces: (\d+) \},", line)
            if m:
                index[m.group(1)] = dict(h=float(m.group(2)), r=float(m.group(3)), fork=float(m.group(4)), crown=[float(x) for x in m.group(5).split(',')], faces=int(m.group(6)))
    except FileNotFoundError:
        pass
    return pack, index


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default='')
    ap.add_argument('--sheet', default='')
    ap.add_argument('--atlas', default='')
    ap.add_argument('--stats', action='store_true')
    ap.add_argument('--dry', action='store_true', help='build and report, write nothing')
    a = ap.parse_args()
    only = set(filter(None, a.only.split(',')))
    import base64
    old_pack, old_index = kept() if only else ({}, {})
    models = {k: base64.b64decode(v) for k, v in old_pack.items()}
    index = dict(old_index)
    shown = []
    for name, spec in SPECIES.items():
        if only and name not in only:
            continue
        for v in range(spec.get('variants', 3)):
            key = f'{name}.{v}'
            data, info, parts = build(name, spec, v)
            models[key], index[key] = data, info
            shown.append((key, parts, info))
            if a.stats:
                wood, leaf, cards = parts
                print(f'{key:22s} h {info["h"]:5.2f}  r {info["r"]:.3f}  fork {info["fork"]:5.2f}  faces {info["faces"]:5d}  (wood {len(wood.tris)}, cards {len(cards)}{f", caps {len(leaf.tris)}" if leaf else ""})  {len(data)} bytes')
    if not a.dry:
        export.write(models, index)
        size = sum(len(base64.b64encode(m)) for m in models.values())
        print(f'{len(models)} models, {size / 1024:.0f} KB of text')
    if a.sheet:
        import preview
        preview.sheet(shown, a.sheet, a.atlas)


if __name__ == '__main__':
    main()
