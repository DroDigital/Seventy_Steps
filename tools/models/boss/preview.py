"""A software preview of triangles (no GPU): flat-shaded, painter's order, a few views on one sheet. For looking at what the baker made;
offline only. `render(pos, col, size, az, el)` returns a PIL image; `sheet(items)` lays titled previews in a grid."""
import math
import numpy as np
from PIL import Image, ImageDraw

def render(pos, col, size=256, az=35.0, el=28.0, bg=(26, 28, 32), pad=0.08, flip=False):
    """pos (n,3,3) game space (y up, front +z), col (n,3) 0..1. Orthographic, the model fitted into the frame."""
    img = Image.new('RGB', (size, size), bg)
    if len(pos) == 0:
        return img
    a, e = math.radians(az), math.radians(el)
    cx, sx = math.cos(a), math.sin(a)
    # rotate about y by az, then tilt about x by el
    rot_y = np.array([[cx, 0, sx], [0, 1, 0], [-sx, 0, cx]])
    ce, se = math.cos(e), math.sin(e)
    rot_x = np.array([[1, 0, 0], [0, ce, -se], [0, se, ce]])
    R = rot_x @ rot_y
    p = pos.reshape(-1, 3) @ R.T
    lo, hi = p.min(axis=0), p.max(axis=0)
    span = max(hi[0] - lo[0], hi[1] - lo[1], 1e-6)
    k = size * (1 - 2 * pad) / span
    mid = (lo + hi) / 2
    scr = np.stack([(p[:, 0] - mid[0]) * k + size / 2, size / 2 - (p[:, 1] - mid[1]) * k], axis=1).reshape(-1, 3, 2)
    depth = p[:, 2].reshape(-1, 3).mean(axis=1)
    n = np.cross(pos[:, 1] - pos[:, 0], pos[:, 2] - pos[:, 0])
    nl = np.linalg.norm(n, axis=1, keepdims=True)
    n = n / np.where(nl == 0, 1, nl)
    nr = n @ R.T
    light = np.array([-0.4, 0.8, 0.5]); light /= np.linalg.norm(light)
    shade = 0.45 + 0.55 * np.clip(nr @ light, 0, 1) * 0.9 + 0.1 * np.clip(-nr[:, 2], 0, 1)
    d = ImageDraw.Draw(img)
    for i in np.argsort(depth):  # far (small z after rotation toward the viewer: larger z is nearer)
        c = np.clip(col[i] * shade[i] * 1.15, 0, 1)
        d.polygon([tuple(scr[i, j]) for j in range(3)], fill=tuple(int(v * 255) for v in c))
    return img

def views(pos, col, size=224, azs=(25, 115, 205, 295), el=24.0):
    return [render(pos, col, size, a, el) for a in azs]

def sheet(items, cols=4, size=224, label=True):
    """items: list of (title, pos, col): one cell each (front 3/4 view)."""
    rows = (len(items) + cols - 1) // cols
    img = Image.new('RGB', (cols * size, rows * size), (20, 22, 26))
    d = ImageDraw.Draw(img)
    for i, (title, pos, col) in enumerate(items):
        cell = render(pos, col, size, 30, 24)
        img.paste(cell, ((i % cols) * size, (i // cols) * size))
        if label:
            d.text(((i % cols) * size + 4, (i // cols) * size + 2), title[:36], fill=(220, 220, 200))
    return img
