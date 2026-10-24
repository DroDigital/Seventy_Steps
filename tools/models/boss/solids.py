"""What a model is solid in, for the colliders (the baker, tools/models/bake_boss_models.py): a building must not be one box a body walks into,
so a model's triangles are voxelised, its inside filled, and each band of height (below the knee, to the head, above it) cut into the fewest
rectangles of floor it covers; a doorway, an arch or a colonnade is then a set of boxes about its opening. Pure numpy. Boxes are
(cx, cz, hx, hz, y0, y1) in the model's own metres, its footprint centred on the origin and its foot on y = 0 (half extents, as colliders are)."""
import numpy as np

def surface(tris, cell, rng, skip_floor=0.35):
    """Points over every triangle's surface, about two to a cell, as indices into a grid; horizontal faces on the ground (floors) are left out."""
    pts = []
    for t in tris:
        n = np.cross(t[1] - t[0], t[2] - t[0])
        area = np.linalg.norm(n) / 2
        if area < 1e-9:
            continue
        flat = abs(n[1]) / (2 * area) > 0.98 and t[:, 1].max() < skip_floor
        if flat:
            continue
        k = int(min(4000, max(3, area / (cell * cell * 0.25) + 3)))
        r = rng.random((k, 2))
        r = np.where(r.sum(axis=1, keepdims=True) > 1, 1 - r, r)
        pts.append(t[0] + r[:, :1] * (t[1] - t[0]) + r[:, 1:] * (t[2] - t[0]))
        pts.append(t)  # the corners
    return np.concatenate(pts) if pts else np.zeros((0, 3))

def fill(shell):
    """A closed shell of voxels with its inside: everything the outside cannot reach. The shell is grown a cell first so a crack does not leak."""
    g = shell.copy()
    for ax in range(3):
        g = g | np.roll(g, 1, ax) | np.roll(g, -1, ax)
    outside = np.zeros_like(g)
    outside[0, :, :] = outside[-1, :, :] = True
    outside[:, 0, :] = outside[:, -1, :] = True
    outside[:, :, 0] = outside[:, :, -1] = True
    outside &= ~g
    while True:
        grown = outside.copy()
        for ax in range(3):
            grown |= np.roll(outside, 1, ax) | np.roll(outside, -1, ax)
        grown &= ~g
        if (grown == outside).all():
            break
        outside = grown
    inner = ~outside
    for ax in range(3):  # the grown shell is given back: one cell eroded
        inner = inner & np.roll(inner, 1, ax) & np.roll(inner, -1, ax)
    return inner | shell

def rects(plane):
    """A boolean floor plan (x, z) as the fewest rectangles found greedily: (x0, z0, x1, z1) in cells, end exclusive."""
    free = plane.copy()
    out = []
    nx, nz = free.shape
    for i in range(nx):
        j = 0
        while j < nz:
            if not free[i, j]:
                j += 1
                continue
            j1 = j
            while j1 < nz and free[i, j1]:
                j1 += 1
            i1 = i + 1
            while i1 < nx and free[i1, j:j1].all():
                i1 += 1
            free[i:i1, j:j1] = False
            out.append((i, j, i1, j1))
            j = j1
    return out

def decompose(tris, bands=(0.9, 2.2), cell=0.25, limit=24, seed=1, only_above=0.0):
    """The boxes of a model by bands of height: [(cx, cz, hx, hz, y0, y1)]. `tris` is (n, 3, 3) in the model's frame; the cell grows until
    the boxes are no more than `limit`."""
    tris = np.asarray(tris)
    lo, hi = tris.reshape(-1, 3).min(axis=0), tris.reshape(-1, 3).max(axis=0)
    rng = np.random.default_rng(seed)
    while True:
        pts = surface(tris, cell, rng)
        idx = np.floor((pts - lo + cell) / cell).astype(int)
        shape = np.ceil((hi - lo) / cell).astype(int) + 3
        shell = np.zeros(shape, dtype=bool)
        ok = (idx >= 0).all(axis=1) & (idx < shape).all(axis=1)
        shell[idx[ok, 0], idx[ok, 1], idx[ok, 2]] = True
        solid = fill(shell)
        edges = [lo[1], *[lo[1] + b for b in bands if lo[1] + b < hi[1] - 0.2], hi[1]]
        boxes = []
        for y0, y1 in zip(edges[:-1], edges[1:]):
            k0, k1 = int(np.floor((y0 - lo[1]) / cell)) + 1, int(np.ceil((y1 - lo[1]) / cell)) + 1
            plane = solid[:, k0:max(k0 + 1, k1), :].any(axis=1)
            for (i0, j0, i1, j1) in rects(plane):
                boxes.append([lo[0] + (i0 - 1) * cell, lo[2] + (j0 - 1) * cell, lo[0] + (i1 - 1) * cell, lo[2] + (j1 - 1) * cell, y0, y1])
        boxes = merge_bands(boxes)
        if len(boxes) <= limit or cell > 1.5:
            break
        cell *= 1.5
    return [[round((b[0] + b[2]) / 2, 3), round((b[1] + b[3]) / 2, 3), round((b[2] - b[0]) / 2, 3), round((b[3] - b[1]) / 2, 3), round(b[4], 3), round(b[5], 3)] for b in boxes]

def merge_bands(boxes):
    """Boxes of the same footprint in bands that touch are one taller box."""
    out = []
    for b in sorted(boxes, key=lambda b: (b[0], b[1], b[2], b[3], b[4])):
        last = out[-1] if out else None
        if last and last[:4] == b[:4] and abs(last[5] - b[4]) < 1e-6:
            last[5] = b[5]
        else:
            out.append(list(b))
    return out

def one_box(tris):
    """The model's whole box as a single collider."""
    p = np.asarray(tris).reshape(-1, 3)
    lo, hi = p.min(axis=0), p.max(axis=0)
    return [[round((lo[0] + hi[0]) / 2, 3), round((lo[2] + hi[2]) / 2, 3), round((hi[0] - lo[0]) / 2, 3), round((hi[2] - lo[2]) / 2, 3), round(lo[1], 3), round(hi[1], 3)]]
