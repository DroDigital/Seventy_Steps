"""A small solid-modelling kit for the investigator (tools/player/model.py): the figures' own forms (src/render/bodyKit.ts: a convex hull of eight corners, each
shaved into three, so every edge has a chamfer) and a few more for what a body needs and a box does not give: a loft through rings (a sleeve, a coat, a
skull), a lathe, a wedge. Pure numpy + scipy, no Blender: a `Shape` is vertices, triangles and one colour for each triangle, in the joint's own frame
(game axes: y up, +z ahead, the figure's left at +x), so a part is written as the TypeScript writes it and built by tools/player/build_blend.py.
Faces wind counter-clockwise seen from outside.
"""
import numpy as np
from scipy.spatial import ConvexHull


class Shape:
    def __init__(self, v=None, f=None, c=None, tag=None):
        self.v = np.zeros((0, 3)) if v is None else np.asarray(v, float)
        self.f = np.zeros((0, 3), int) if f is None else np.asarray(f, int)
        self.c = np.zeros((0, 3)) if c is None else np.asarray(c, float)
        self.tag = tag

    def __add__(self, o):
        if o is None:
            return self
        return Shape(np.vstack([self.v, o.v]), np.vstack([self.f, o.f + len(self.v)]), np.vstack([self.c, o.c]), self.tag)

    __radd__ = lambda self, o: self if o in (0, None) else self.__add__(o)

    def copy(self):
        return Shape(self.v.copy(), self.f.copy(), self.c.copy(), self.tag)

    def move(self, x=0, y=0, z=0):
        return Shape(self.v + np.array([x, y, z], float), self.f, self.c, self.tag)

    def scale(self, sx=1, sy=None, sz=None):
        sy = sx if sy is None else sy
        sz = sx if sz is None else sz
        return Shape(self.v * np.array([sx, sy, sz]), self.f, self.c, self.tag)

    def turn(self, rx=0.0, ry=0.0, rz=0.0):
        """Rotates about x, then z, then y (three.js `rotateX(rx).rotateZ(rz).rotateY(ry)`, as the TypeScript parts are written), about the origin."""
        v = self.v
        for axis, a in (('x', rx), ('z', rz), ('y', ry)):
            if not a:
                continue
            c, s = np.cos(a), np.sin(a)
            m = {'x': [[1, 0, 0], [0, c, -s], [0, s, c]], 'y': [[c, 0, s], [0, 1, 0], [-s, 0, c]], 'z': [[c, -s, 0], [s, c, 0], [0, 0, 1]]}[axis]
            v = v @ np.array(m).T
        return Shape(v, self.f, self.c, self.tag)

    def mirror_x(self):
        """The shape mirrored across x = 0 (its triangles re-wound)."""
        return Shape(self.v * np.array([-1, 1, 1]), self.f[:, ::-1], self.c, self.tag)

    def shade(self, k):
        return Shape(self.v, self.f, self.c * k, self.tag)

    def tinted(self, c):
        return Shape(self.v, self.f, np.tile(np.asarray(c, float), (len(self.f), 1)), self.tag)

    def tris(self):
        return self.v[self.f]

    def normals(self):
        t = self.tris()
        n = np.cross(t[:, 1] - t[:, 0], t[:, 2] - t[:, 0])
        return n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)


def merge(shapes):
    out = Shape()
    for s in shapes:
        if s is not None:
            out = out + s
    return out


# ---- colour -----------------------------------------------------------------------------------------------------------------------------------------

def mix(a, b, t):
    a, b = np.asarray(a, float), np.asarray(b, float)
    return a + (b - a) * t

def shade(c, k):
    return np.asarray(c, float) * k


# ---- hulls (bodyKit.ts `hull`, `prism`, `bevel`) ---------------------------------------------------------------------------------------------------

def hull_points(pts, c):
    """The convex hull of points as a Shape, every face wound outward."""
    pts = np.asarray(pts, float)
    h = ConvexHull(pts)
    centre = pts[h.vertices].mean(axis=0)
    f = h.simplices.copy()
    t = pts[f]
    n = np.cross(t[:, 1] - t[:, 0], t[:, 2] - t[:, 0])
    out = np.einsum('ij,ij->i', n, t.mean(axis=1) - centre) < 0
    f[out] = f[out][:, ::-1]
    used = np.unique(f)
    remap = -np.ones(len(pts), int)
    remap[used] = np.arange(len(used))
    return Shape(pts[used], remap[f], np.tile(np.asarray(c, float), (len(f), 1)))


def shave(corners, r):
    """Each of eight corners (bit 0 x, bit 1 y, bit 2 z) replaced by three points `r` along the edges that leave it (never more than 0.45 of an edge)."""
    out = []
    for i in range(8):
        at = np.asarray(corners[i], float)
        for bit in (1, 2, 4):
            to = np.asarray(corners[i ^ bit], float)
            e = to - at
            d = np.linalg.norm(e)
            out.append(at + e / max(d, 1e-9) * min(r, 0.45 * d))
    return out


def prism(x, y, z, wB, dB, wT, dT, h, c, r=0.012, sx=0.0, sz=0.0):
    """A tapering form, bodyKit.ts `prism`: foot wB x dB at y - h/2, top wT x dT at y + h/2 (its middle moved sx, sz), centred at (x, z), chamfered by r."""
    corners = []
    for i in range(8):
        xs, ys, zs = (1 if i & 1 else -1), (1 if i & 2 else -1), (1 if i & 4 else -1)
        corners.append([x + xs * wB / 2, y - h / 2, z + zs * dB / 2] if ys < 0 else [x + sx + xs * wT / 2, y + h / 2, z + sz + zs * dT / 2])
    return hull_points(shave(corners, r) if r > 0 else corners, c)


def bevel(w, h, d, x, y, z, c, r=0.012):
    return prism(x, y, z, w, d, w, d, h, c, r)


def box(w, h, d, x, y, z, c):
    return prism(x, y, z, w, d, w, d, h, c, 0)


def slab(w, h, d, x, y, z, c, rz=0.0, rx=0.0, r=0.0):
    """A box turned about its own centre (z, then x) and moved: the TypeScript's `slab`."""
    return (bevel(w, h, d, 0, 0, 0, c, r) if r else box(w, h, d, 0, 0, 0, c)).turn(rx=rx, rz=rz).move(x, y, z)


# ---- rings, lofts, lathes ---------------------------------------------------------------------------------------------------------------------------

def ring(y, hw, hd, cx=0.0, cz=0.0, ch=0.35, n=8, rot=0.0):
    """A cross-section in the plane y: a rectangle hw x hd (half sizes) centred at (cx, cz) with its four corners chamfered by `ch` of the shorter side
    (n = 8), or a plain rectangle (n = 4), or a regular n-gon of radius hw (any other n; hd scales it). Returned as (n, 3) points, counter-clockwise from above."""
    if n == 4:
        pts = [(hw, -hd), (hw, hd), (-hw, hd), (-hw, -hd)]
    elif n == 8:
        c = ch * min(hw, hd)
        pts = [(hw, -hd + c), (hw, hd - c), (hw - c, hd), (-hw + c, hd), (-hw, hd - c), (-hw, -hd + c), (-hw + c, -hd), (hw - c, -hd)]
    else:
        pts = [(hw * np.cos(2 * np.pi * (i / n) + rot), hd * np.sin(2 * np.pi * (i / n) + rot)) for i in range(n)]
    return np.array([[cx + x, y, cz + z] for x, z in pts])


def loft(rings, c, caps=(True, True), cols=None):
    """A skin through consecutive rings of equal point counts, wound outward for rings given from the bottom up with points ordered counter-clockwise seen
    from above... in this kit's (x right-hand, z toward the viewer) frame that is x -> z order; `ring` lists them so. `cols` colours each band (len(rings)-1)."""
    rings = [np.asarray(r, float) for r in rings]
    n = len(rings[0])
    v = np.vstack(rings)
    f, col = [], []
    for i in range(len(rings) - 1):
        for k in range(n):
            a, b = i * n + k, i * n + (k + 1) % n
            a2, b2 = a + n, b + n
            # bottom ring i, top ring i+1: a point order x -> z runs clockwise seen from +y, so the outside is (a, a2, b) and (b, a2, b2)
            f += [(a, a2, b), (b, a2, b2)]
            col += [cols[i] if cols is not None else c] * 2
    shape = Shape(v, f, col)
    if caps[0]:
        centre = rings[0].mean(axis=0)
        idx = len(shape.v)
        shape = Shape(np.vstack([shape.v, centre]), np.vstack([shape.f, [(idx, k, (k + 1) % n) for k in range(n)]]), np.vstack([shape.c, np.tile(np.asarray(c if cols is None else cols[0], float), (n, 1))]))
    if caps[1]:
        centre = rings[-1].mean(axis=0)
        idx = len(shape.v)
        base = (len(rings) - 1) * n
        shape = Shape(np.vstack([shape.v, centre]), np.vstack([shape.f, [(idx, base + (k + 1) % n, base + k) for k in range(n)]]), np.vstack([shape.c, np.tile(np.asarray(c if cols is None else cols[-1], float), (n, 1))]))
    return shape


def fix_winding(shape, inside=None):
    """Turns every triangle so its normal points away from `inside` (default: the shape's centre): for a closed convex-ish loft, this makes it outward."""
    inside = shape.v.mean(axis=0) if inside is None else np.asarray(inside, float)
    t = shape.tris()
    n = np.cross(t[:, 1] - t[:, 0], t[:, 2] - t[:, 0])
    out = np.einsum('ij,ij->i', n, t.mean(axis=1) - inside) < 0
    f = shape.f.copy()
    f[out] = f[out][:, ::-1]
    return Shape(shape.v, f, shape.c, shape.tag)


def lathe(profile, c, n=8, cols=None, rot=0.0, aspect=1.0, cx=0.0, cz=0.0):
    """A solid turned about the y axis: `profile` is (y, radius) from the bottom up; n sides (the figures' cylinders have 9)."""
    rings = [ring(y, r, r * aspect, cx, cz, n=n, rot=rot) if r > 1e-6 else np.tile(np.array([cx, y, cz]), (n, 1)) for y, r in profile]
    s = loft(rings, c, caps=(profile[0][1] > 1e-6, profile[-1][1] > 1e-6), cols=cols)
    return fix_winding(s) if len(profile) < 3 else s


def cylinder(r0, r1, h, y, c, n=9, cx=0.0, cz=0.0):
    """three.js CylinderGeometry(r0 = top, r1 = bottom): top radius first, as the TypeScript's `cylinder` passes them."""
    return fix_winding(lathe([(y - h / 2, r1), (y + h / 2, r0)], c, n=n, cx=cx, cz=cz))


def wedge(w, h, d, x, y, z, c, top=0.0):
    """A triangular prism along x: a box whose top edge is drawn in toward the back by `top` (0: a box; 1: a sharp ridge): a nose, a roof, a blade's spine."""
    hw, hh, hd = w / 2, h / 2, d / 2
    pts = [(-hw, -hh, -hd), (hw, -hh, -hd), (-hw, -hh, hd), (hw, -hh, hd), (-hw, hh, -hd * (1 - top)), (hw, hh, -hd * (1 - top)), (-hw, hh, hd * (1 - top)), (hw, hh, hd * (1 - top))]
    return hull_points(np.array(pts) + np.array([x, y, z]), c)


def sphere(r, c, at=(0, 0, 0), detail=1, squash=(1, 1, 1)):
    """A low sphere (an icosphere of `detail` subdivisions)."""
    t = (1 + 5 ** 0.5) / 2
    v = [(-1, t, 0), (1, t, 0), (-1, -t, 0), (1, -t, 0), (0, -1, t), (0, 1, t), (0, -1, -t), (0, 1, -t), (t, 0, -1), (t, 0, 1), (-t, 0, -1), (-t, 0, 1)]
    f = [(0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11), (1, 5, 9), (5, 11, 4), (11, 10, 2), (10, 7, 6), (7, 1, 8), (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9), (4, 9, 5), (2, 4, 11), (6, 2, 10), (8, 6, 7), (9, 8, 1)]
    v = [np.array(p, float) / np.linalg.norm(p) for p in v]
    for _ in range(detail):
        cache, nf = {}, []
        def mid(a, b):
            k = (min(a, b), max(a, b))
            if k not in cache:
                v.append((v[a] + v[b]) / 2 / np.linalg.norm((v[a] + v[b]) / 2))
                cache[k] = len(v) - 1
            return cache[k]
        for a, b, d in f:
            ab, bd, da = mid(a, b), mid(b, d), mid(d, a)
            nf += [(a, ab, da), (b, bd, ab), (d, da, bd), (ab, bd, da)]
        f = nf
    pts = np.array(v) * r * np.array(squash) + np.array(at)
    return fix_winding(Shape(pts, f, np.tile(np.asarray(c, float), (len(f), 1))), at)


def torus(R, r, x, y, z, c, axis='z', n=8, m=4):
    """A ring of tube radius r on a circle of radius R about (x, y, z), lying in the plane perpendicular to `axis` (z: a ring seen from the front; x: from the side), n round it, m round the tube."""
    v, f = [], []
    for i in range(n):
        a = 2 * np.pi * i / n
        for j in range(m):
            b = 2 * np.pi * j / m
            d = R + r * np.cos(b)
            p = [d * np.cos(a), d * np.sin(a), r * np.sin(b)]  # in the plane xy, the axis along z
            v.append({'z': p, 'x': [p[2], p[1], -p[0]], 'y': [p[0], p[2], -p[1]]}[axis])
    for i in range(n):
        for j in range(m):
            a, b = i * m + j, ((i + 1) % n) * m + j
            a2, b2 = i * m + (j + 1) % m, ((i + 1) % n) * m + (j + 1) % m
            f += [[a, b, b2], [a, b2, a2]]
    s = Shape(np.array(v) + [x, y, z], f, np.tile(np.asarray(c, float), (len(f), 1)))
    centre = np.array([x, y, z])
    n_ = s.normals()
    # wind outward: every face's normal away from the nearest point of the ring's centre line
    tri = s.tris().mean(axis=1) - centre
    ring_pt = tri - {'z': np.array([0, 0, 1.0]), 'x': np.array([1.0, 0, 0]), 'y': np.array([0, 1.0, 0])}[axis] * np.einsum('ij,j->i', tri, {'z': np.array([0, 0, 1.0]), 'x': np.array([1.0, 0, 0]), 'y': np.array([0, 1.0, 0])}[axis])[:, None]
    ring_pt = ring_pt / np.maximum(np.linalg.norm(ring_pt, axis=1, keepdims=True), 1e-9) * R
    out = np.einsum('ij,ij->i', n_, tri - ring_pt) < 0
    s.f[out] = s.f[out][:, ::-1]
    return s
