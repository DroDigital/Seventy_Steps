#!/usr/bin/env python3
"""Bakes the mark atlas (src/data/markAtlas.ts) that render/markAtlas.ts lays under render/particles.ts's 'mark' and 'trace' shapes: six 32 x 32
masks of 8-bit coverage side by side in one row (a 1 px margin of nothing about each, so Nearest sampling never bleeds a neighbour), in the order
of MARK_NAMES (render/particles.ts): scratch, splat, dust, twirl, wisp, smear. Coverage only: the game tints each blow its own hues.
Where they come from (round 87, the quiet blows, data/foeBlows.ts; credits in src/data/models/CREDITS.md):
  scratch  Kenney's Particle Pack (CC0), scratch_01: its three claw lines, turned to run along +x, thickened to survive 32 px, spaced further apart.
  dust     Kenney's Particle Pack (CC0), dirt_01: its fine grit, thinned toward its rim into a spray.
  wisp     Kenney's Particle Pack (CC0), trace_04: its thin wavering tendril, turned along +x and waved into an S, bright at the head and fading behind.
  smear    made here, the mottle of Kenney's smoke_05 (CC0) giving its fray: a wet drag that swells to a round head at +x and comes apart into hairs.
  splat    made here with numpy: a blot of joined lobes, droplets about it and tapering flicks. Seeded, so a rerun is byte for byte the same.
  twirl    made here with numpy: a spiral arm of one and a half turns. Kenney's twirl_01 to _03 were tried and read, at 32 px, as one hooked crescent
           (the 'crescent' shape's twin), their inner arcs lost; no sprite of the pack is an ink blot either (its scorch and dirt are scorch marks and rubble).
A directional mask (scratch, wisp, smear) has its long axis along +x, the way 'trace' lays it along a flight.
Run: python3 -I tools/marks/bake_marks.py <the pack's 'PNG (Transparent)' folder> [src/data/markAtlas.ts] [--preview sheet.png]   (needs `pip install pillow numpy`)"""
import base64, os, sys
import numpy as np
from PIL import Image, ImageFilter

CELL = 32
NAMES = ['scratch', 'splat', 'dust', 'twirl', 'wisp', 'smear']  # = MARK_NAMES in render/particles.ts
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


def turn_along_x(a):
    """Rotates a picture so that the long axis of its light lies along +x (second moments, image rows down)."""
    ys, xs = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    w = a.sum()
    cx, cy = (a * xs).sum() / w, (a * ys).sum() / w
    ang = 0.5 * np.arctan2(2 * (a * (xs - cx) * (ys - cy)).sum() / w, (a * (xs - cx) ** 2).sum() / w - (a * (ys - cy) ** 2).sum() / w)
    return np.asarray(to_img(a).rotate(np.degrees(ang), expand=True, resample=Image.BICUBIC)).astype(np.float64) / 255.0


def thicken(a, size):
    return np.asarray(to_img(a).filter(ImageFilter.MaxFilter(size))).astype(np.float64) / 255.0


def fitted(a, thresh, box=CELL - 2, tall=1.0):
    """The light of `a` above `thresh` cropped, scaled to fit the cell's inner box (its height stretched `tall` times) and centred."""
    ys, xs = np.where(a > thresh)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = a.shape
    s = box / max(w, h * tall)
    nw, nh = max(1, round(w * s)), max(1, min(box, round(h * s * tall)))
    small = np.asarray(to_img(a).resize((nw, nh), Image.BOX if s < 1 else Image.BICUBIC)).astype(np.float64) / 255.0
    out = np.zeros((CELL, CELL))
    out[(CELL - nh) // 2:(CELL - nh) // 2 + nh, (CELL - nw) // 2:(CELL - nw) // 2 + nw] = small
    return out





def scratch(folder):
    """Three claw lines, tapered at their ends, the head end a little brighter."""
    a = turn_along_x(thicken(load(folder, 'scratch_01'), 5))
    return smoothstep(0.1, 0.8, fitted(smoothstep(0.1, 0.6, a), 0.2, tall=1.9)) * (0.7 + 0.3 * smoothstep(-1, 0.8, X))


def dust(folder):
    a = fitted(load(folder, 'dirt_01'), 0.1)
    return a * np.clip(0.3 + 1.0 - smoothstep(0.5, 1.05, np.hypot(X, Y)), 0, 1)





def waved(a, amp, cycles):
    """Each column slid up or down (a fraction of a texel, by linear blending) along a sine of `cycles` waves across the cell, `amp` texels at most: a straight line into a tendril."""
    rows = np.arange(CELL, dtype=np.float64)
    out = np.zeros_like(a)
    for i in range(CELL):
        shift = amp * np.sin((i / (CELL - 1)) * 2 * np.pi * cycles) * (0.35 + 0.65 * i / (CELL - 1))
        out[:, i] = np.interp(rows - shift, rows, a[:, i], left=0, right=0)
    return out


def wisp(folder):
    a = turn_along_x(thicken(load(folder, 'trace_04'), 9))
    return waved(fitted(smoothstep(0.08, 0.5, a), 0.2), 4.2, 1.25) * (0.35 + 0.65 * smoothstep(-1.0, 0.7, X))


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


def twirl():
    """A spiral arm of one and a half turns, thick toward its head and tapering at both ends, the head brightest."""
    r, phi = np.hypot(X, Y), np.arctan2(Y, X + 1e-9)
    out = np.zeros((CELL, CELL))
    for n in (0, 1):
        t = (phi + np.pi + 2 * np.pi * n) / (2 * np.pi * 1.5)
        rs = 0.14 + 0.8 * t
        w = 0.07 + 0.1 * np.sin(np.pi * np.clip(t, 0, 1)) ** 0.6
        c = (1 - smoothstep(w * 0.4, w, np.abs(r - rs))) * ((t >= 0) & (t <= 1))
        out = np.maximum(out, c * (0.45 + 0.55 * np.clip(t, 0, 1)))
    return out


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


def bake(folder, out, preview):
    cells = [scratch(folder), splat(), dust(folder), twirl(), wisp(folder), smear(folder)]
    atlas = np.zeros((CELL, CELL * len(cells)), dtype=np.uint8)
    for i, c in enumerate(cells):
        c = np.clip(c, 0, 1).copy()
        c[0, :] = c[-1, :] = 0  # the safe margin: a texel of nothing all round
        c[:, 0] = c[:, -1] = 0
        atlas[:, i * CELL:(i + 1) * CELL] = np.round(c * 255)
        assert atlas[:, i * CELL:(i + 1) * CELL].max() > 0, NAMES[i]
    data = base64.b64encode(atlas.tobytes()).decode()
    lines = [
        "/** The mark atlas (round 87; tools/marks/bake_marks.py, render/markAtlas.ts): six 32 x 32 masks of coverage, one byte a texel, side by side in one row (a texel of nothing about each), in the order of `names` (= MARK_NAMES, render/particles.ts). Scratch, dust and wisp cut from Kenney's CC0 Particle Pack, smear from its smoke's mottle, splat and twirl made in the baker; credits in src/data/models/CREDITS.md. Generated. */",
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
