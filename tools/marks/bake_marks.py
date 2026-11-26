#!/usr/bin/env python3
"""Bakes the mark atlas (src/data/markAtlas.ts) that render/markAtlas.ts lays under render/particles.ts's 'mark' and 'trace' shapes: two 32 x 32
masks of 8-bit coverage side by side in one row (a 1 px margin of nothing about each, so Nearest sampling never bleeds a neighbour), in the order
of MARK_NAMES (render/particles.ts): splat, smear. Coverage only: the game tints each blow its own hues.
Where they come from (round 90, the quiet blows, data/foeBlows.ts; credits in src/data/models/CREDITS.md):
  splat    made here with numpy, from no sprite: a blot of joined lobes, droplets about it and tapering flicks. Seeded, so a rerun is byte for byte the same.
  smear    made here, the mottle of Kenney's Particle Pack (CC0) smoke_05 giving its fray: a wet drag that swells to a round head at +x and comes
           apart into hairs. Its long axis lies along +x, the way 'trace' lays it along a flight.
(Four more were baked and tried first, cut from the pack's scratch_01, dirt_01 and trace_04 and a spiral made here; no recipe drew them, so they were left out.)
Run: python3 -I tools/marks/bake_marks.py <the pack's 'PNG (Transparent)' folder> [src/data/markAtlas.ts] [--preview sheet.png]   (needs `pip install pillow numpy`)"""
import base64, os, sys
import numpy as np
from PIL import Image

CELL = 32
NAMES = ['splat', 'smear']  # = MARK_NAMES in render/particles.ts
X = np.linspace(-1, 1, CELL)[None, :]
Y = np.linspace(-1, 1, CELL)[:, None]


def smoothstep(lo, hi, v):
    t = np.clip((np.asarray(v, dtype=np.float64) - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def load(folder, name):
    """A sprite's alpha, 0..1 (all of the pack's are white on transparent)."""
    return np.asarray(Image.open(os.path.join(folder, name + '.png')).convert('RGBA'))[..., 3].astype(np.float64) / 255.0


def to_img(a):
    return Image.fromarray(np.round(np.clip(a, 0, 1) * 255).astype(np.uint8))


def smear(folder):
    """A wet drag, a stroke of a loaded brush: its body swells toward +x (the head, rounded), and its tail comes apart into hairs, row on row
    (the mottle of a cloud, smoke_05, and a seeded roll), so the drag frays where it ends."""
    cloud = np.asarray(to_img(load(folder, 'smoke_05')).resize((CELL, CELL), Image.BOX)).astype(np.float64) / 255.0
    hair = np.clip(cloud.mean(axis=1, keepdims=True) * 1.4, 0, 1) * 0.5 + np.random.default_rng(5).uniform(0, 1, (CELL, 1)) * 0.5
    cap = np.sqrt(np.clip(1 - ((X - 0.45) / 0.5) ** 2, 0, 1)) * (X > 0.45) + (X <= 0.45)
    half = (0.13 + 0.21 * smoothstep(-1.0, 0.4, X)) * cap
    edge = half - np.abs(Y - 0.05 * np.sin((X + 1) * 3.4))
    body = smoothstep(-0.02, 0.07, edge + (hair - 0.5) * 0.9 * (1 - smoothstep(-0.8, 0.45, X)) + (cloud - 0.5) * 0.1)
    return body * smoothstep(-1.0, -0.82, X) * (0.5 + 0.5 * smoothstep(-1.0, 0.4, X))


def splat(seed=3):
    """An ink blot: joined lobes, droplets about it, tapering flicks."""
    rng = np.random.default_rng(seed)
    blob = lambda cx, cy, r: np.hypot(X - cx, Y - cy) - r
    f = blob(0, 0, 0.36)
    for _ in range(7):
        a, r = rng.uniform(0, 2 * np.pi), rng.uniform(0.28, 0.42)
        f = np.minimum(f, blob(np.cos(a) * 0.22, np.sin(a) * 0.22, r * 0.62))
    for _ in range(5):
        a, d, r = rng.uniform(0, 2 * np.pi), rng.uniform(0.55, 0.9), rng.uniform(0.06, 0.13)
        f = np.minimum(f, blob(np.cos(a) * d, np.sin(a) * d, r))
    for _ in range(4):
        a, length = rng.uniform(0, 2 * np.pi), rng.uniform(0.7, 0.95)
        ux, uy = np.cos(a), np.sin(a)
        t, n = X * ux + Y * uy, -X * uy + Y * ux
        ray = np.maximum(np.abs(n) - 0.09 * (1 - smoothstep(0.3, length, t)), np.maximum(0.15 - t, t - length))
        f = np.minimum(f, ray)
    return 1 - smoothstep(-0.02, 0.05, f)


def filament(points):
    """Coverage of a tapered strand through (x, y, radius) control points, in texels."""
    y, x = np.indices((CELL, CELL))
    coverage = np.zeros((CELL, CELL))
    for (ax, ay, ar), (bx, by, br) in zip(points, points[1:]):
        dx, dy = bx - ax, by - ay
        t = np.clip(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy), 0, 1)
        distance = np.hypot(x - ax - t * dx, y - ay - t * dy)
        radius = ar + (br - ar) * t
        coverage = np.maximum(coverage, 1 - smoothstep(radius - 0.4, radius + 0.45, distance))
    return coverage


def paint_mark(name, source):
    """Torn membranes leave pale slits in the central clot and long, clinging strands at the edges."""
    if name == 'splat':
        veins = [
            [(17, 15, 2.4), (20, 10, 1.2), (24, 8, 0.7), (27, 4, 0.45)],
            [(21, 10, 0.9), (24, 11, 0.6), (28, 9, 0.4)],
            [(14, 19, 2.0), (10, 23, 1.0), (9, 27, 0.6), (6, 29, 0.4)],
            [(14, 13, 1.4), (9, 11, 0.85), (6, 7, 0.5)],
        ]
        tears = [
            [(11, 11, 0.4), (14, 13, 0.85), (16, 17, 0.4)],
            [(20, 13, 0.5), (17, 16, 0.9), (16, 20, 0.5), (14, 22, 0.35)],
        ]
    else:
        veins = [
            [(22, 16, 2.2), (17, 16, 1.1), (12, 13, 0.8), (8, 14, 0.48), (3, 12, 0.35)],
            [(25, 19, 1.5), (18, 19, 0.9), (13, 21, 0.6), (6, 20, 0.4)],
            [(15, 14, 0.8), (12, 12, 0.6), (9, 11, 0.4)],
        ]
        tears = [
            [(12, 15, 0.4), (18, 17, 0.8), (23, 16, 0.65), (26, 16, 0.4)],
            [(17, 20, 0.35), (22, 18, 0.7), (27, 19, 0.4)],
        ]
    ink = source / 255.0
    for path in veins:
        ink = np.maximum(ink, filament(path))
    for path in tears:
        ink *= 1 - 0.86 * filament(path)
    return np.rint(ink * 255).astype(np.uint8)


def bake(folder, out, preview):
    cells = [splat(), smear(folder)]
    atlas = np.zeros((CELL, CELL * len(cells)), dtype=np.uint8)
    for i, c in enumerate(cells):
        c = np.clip(c, 0, 1).copy()
        c[0, :] = c[-1, :] = 0  # the safe margin: a texel of nothing all round
        c[:, 0] = c[:, -1] = 0
        atlas[:, i * CELL:(i + 1) * CELL] = paint_mark(NAMES[i], np.round(c * 255))
        assert atlas[:, i * CELL:(i + 1) * CELL].max() > 0, NAMES[i]
    data = base64.b64encode(atlas.tobytes()).decode()
    lines = [
        "/** The mark atlas (round 90; tools/marks/bake_marks.py, render/markAtlas.ts): two 32 x 32 masks of coverage, one byte a texel, side by side in one row (a texel of nothing about each), in the order of `names` (= MARK_NAMES, render/particles.ts). Splat is made in the baker; smear is made there too, its fray from the mottle of Kenney's CC0 Particle Pack smoke_05; credits in src/data/models/CREDITS.md. Generated. */",
        '',
        f"export const MARK_ATLAS = {{ width: {CELL * len(cells)}, height: {CELL}, cell: {CELL}, names: {NAMES!r}, data: '{data}' }} as const;",
        '',
    ]
    open(out, 'w').write('\n'.join(lines))
    print(f'{out}: {len(data)} bytes of base64, {len(cells)} cells')
    if preview:
        S = 8
        sheet = Image.new('RGB', (len(cells) * (CELL * S + 8), CELL * S + 8), (28, 14, 38))
        for i in range(len(cells)):
            im = to_img(atlas[:, i * CELL:(i + 1) * CELL] / 255.0).resize((CELL * S, CELL * S), Image.NEAREST)
            sheet.paste(Image.new('RGB', im.size, (240, 236, 220)), (i * (CELL * S + 8) + 4, 4), im)
        sheet.save(preview)


if __name__ == '__main__':
    args = [a for a in sys.argv[1:]]
    prev = None
    if '--preview' in args:
        i = args.index('--preview')
        prev = args[i + 1]
        del args[i:i + 2]
    bake(args[0], args[1] if len(args) > 1 else 'markAtlas.ts', prev)
