"""What sits inside or on a baked model (round 74): the liquid a flask or a jar holds, built as a body of revolution under its glass, and the faces of a
flat panel that are a mirror. Offline only (tools/models/bake_boss_models.py)."""
import numpy as np
import sources as S

def liquid(pos, col, cls, spec):
    """A liquid body inside the model's glass: `level` (0..1 of the glass's height), `inset` (the share of the glass's radius it fills, 0.9), `colour`
    (r, g, b), `from` (the class whose faces are the vessel: GLASS), `rings` (12). Its radius at each height is the vessel's own at that height."""
    vessel = pos[cls == spec.get('from', S.GLASS)].reshape(-1, 3)
    if len(vessel) == 0:
        return pos, col, cls
    lo, hi = vessel.min(axis=0), vessel.max(axis=0)
    cx, cz = (lo[0] + hi[0]) / 2, (lo[2] + hi[2]) / 2
    y0, y1 = lo[1], lo[1] + spec.get('level', 0.5) * (hi[1] - lo[1])
    n, seg = spec.get('rings', 12), spec.get('segments', 10)
    inset = spec.get('inset', 0.82)
    ys = np.linspace(y0 + 0.012 * (hi[1] - lo[1]), y1, n)
    h = (hi[1] - lo[1]) / (n * 3.2)
    radial = np.hypot(vessel[:, 0] - cx, vessel[:, 2] - cz)
    r = np.array([radial[np.abs(vessel[:, 1] - y) <= h].max() if (np.abs(vessel[:, 1] - y) <= h).any() else 0.0 for y in ys]) * inset
    r = np.maximum(r, 0.004)
    ang = np.linspace(0, 2 * np.pi, seg, endpoint=False)
    ring = lambda i: np.stack([cx + r[i] * np.cos(ang), np.full(seg, ys[i]), cz + r[i] * np.sin(ang)], axis=1)
    tris = []
    for i in range(n - 1):
        a, b = ring(i), ring(i + 1)
        for k in range(seg):
            k2 = (k + 1) % seg
            tris += [(a[k], b[k], b[k2]), (a[k], b[k2], a[k2])]
    top, bot = ring(n - 1), ring(0)
    ctop, cbot = np.array([cx, ys[-1], cz]), np.array([cx, ys[0], cz])
    for k in range(seg):
        k2 = (k + 1) % seg
        tris += [(ctop, top[k], top[k2]), (cbot, bot[k2], bot[k])]
    t = np.array(tris)
    colour = np.tile(np.array(spec.get('colour', (0.3, 0.55, 0.35)))[None, :], (len(t), 1))
    return np.concatenate([pos, t]), np.concatenate([col, colour]), np.concatenate([cls, np.full(len(t), S.LIQUID, dtype=cls.dtype)])

def panel(pos, cls, spec):
    """The faces of a flat plane made a mirror: `axis` (0, 1, 2: x, y, z of the game's frame), `sign` (which way its normal points), `at` (where along
    that axis its faces' middles lie), `tol`, and the class it becomes (MIRROR)."""
    axis, sign = spec.get('axis', 2), spec.get('sign', 1)
    a, b, c = pos[:, 0], pos[:, 1], pos[:, 2]
    n = np.cross(b - a, c - a)
    ln = np.linalg.norm(n, axis=1)
    ok = ln > 1e-12
    n = np.where(ok[:, None], n / np.where(ok, ln, 1)[:, None], 0)
    mid = pos.mean(axis=1)
    sel = ok & (n[:, axis] * sign > spec.get('flat', 0.97)) & (np.abs(mid[:, axis] - spec['at']) < spec.get('tol', 0.0006))
    if spec.get('debug'):
        front = ok & (n[:, axis] * sign > 0.9)
        area = 0.5 * ln
        for z in np.unique(np.round(mid[front, axis], 4)):
            m = front & (np.round(mid[:, axis], 4) == z)
            if area[m].sum() > 0.0005: print('   plane', z, int(m.sum()), round(float(area[m].sum()), 4))
        print('   selected', int(sel.sum()), 'area', round(float(area[sel].sum()), 4), 'of front', round(float(area[front].sum()), 4))
    out = cls.copy()
    out[sel] = spec.get('cls', S.MIRROR)
    return out
