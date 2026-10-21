"""Low-poly geometry, gathered into one skinned mesh (docs/MODELS.md).

Every primitive is built in rest-pose metres (Blender axes: X the creature's left, -Y its front, Z up)
and rigidly bound to the bone in context (`with m.on('bone')`), as a PS1 body's segments were; a tube
along a chain of bones blends between them. `with m.sym()` repeats each primitive mirrored across X,
`.L` bones swapped for `.R`. A colour is (r, g, b) or ((r, g, b), glow): glow 0..1 is how far it lights
itself (eyes, markings), carried to the game in the colour's alpha.
"""

import math
from contextlib import contextmanager

V = tuple


def add(a, b): return (a[0] + b[0], a[1] + b[1], a[2] + b[2])
def sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def mul(a, k): return (a[0] * k, a[1] * k, a[2] * k)
def dot(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
def cross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
def length(a): return math.sqrt(dot(a, a))
def norm(a):
    n = length(a)
    return (a[0] / n, a[1] / n, a[2] / n) if n > 1e-9 else (0.0, 0.0, 1.0)
def lerp3(a, b, t): return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t)


def rot(p, deg):
    """Rotates p by Euler degrees (x, then y, then z) about the origin."""
    x, y, z = p
    rx, ry, rz = (math.radians(d) for d in deg)
    y, z = y * math.cos(rx) - z * math.sin(rx), y * math.sin(rx) + z * math.cos(rx)
    x, z = x * math.cos(ry) + z * math.sin(ry), -x * math.sin(ry) + z * math.cos(ry)
    x, y = x * math.cos(rz) - y * math.sin(rz), x * math.sin(rz) + y * math.cos(rz)
    return (x, y, z)


def frame(d):
    """Two unit vectors at right angles to direction d (a ring's axes)."""
    d = norm(d)
    up = (0.0, 0.0, 1.0) if abs(d[2]) < 0.95 else (0.0, -1.0, 0.0)
    u = norm(cross(up, d))
    return u, cross(d, u)


def mirror_name(b):
    return b[:-2] + '.R' if b.endswith('.L') else b[:-2] + '.L' if b.endswith('.R') else b


def _centre(ps):
    return mul(tuple(map(sum, zip(*ps))), 1 / len(ps))


def gradient(c0, c1, axis=(0, -1, 0), lo=0.0, hi=1.0, glow=0.0):
    """A colour that runs from c0 to c1 along `axis` between `lo` and `hi` (metres along it, at rest):
    a pale belly under a dark back, a sooty tip, a blush of rot. Measured at each face's centre."""
    def at(p):
        t = min(1.0, max(0.0, (dot(p, norm(axis)) - lo) / max(hi - lo, 1e-6)))
        return (tuple(c0[i] + (c1[i] - c0[i]) * t for i in range(3)), glow)
    return at


def colour(c):
    """(rgb, glow) from a colour as given."""
    return (tuple(c[0]), float(c[1])) if len(c) == 2 and not isinstance(c[0], (int, float)) else (tuple(c), 0.0)


class Mesh:
    """Accumulates the parts; `faces` hold (vertex indices, material, rgb, glow, smooth)."""

    def __init__(self):
        self.verts, self.weights, self.faces = [], [], []
        self.materials = []
        self._bone, self._mat, self._sym, self._smooth, self._layer = 'root', 'flesh', False, None, ''
        self.eyes = []  # (bone, rest position, colour, layer)
        self.layers = {}  # layer name -> face indices (`@eldritch` parts and the like)

    # ---- context ---------------------------------------------------------------------------------
    @contextmanager
    def _set(self, attr, value):
        old = getattr(self, attr)
        setattr(self, attr, value)
        try:
            yield
        finally:
            setattr(self, attr, old)

    def on(self, bone): return self._set('_bone', bone)
    def mat(self, name): return self._set('_mat', name)
    def smooth(self, on=True): return self._set('_smooth', on)  # Gouraud across a part (default for the round ones) or faceted (boxes, slabs, spikes)
    def layer(self, name): return self._set('_layer', name)  # 'eldritch': drawn only in the eldritch variant; 'plain': only out of it

    @contextmanager
    def sym(self):
        with self._set('_sym', True):
            yield

    # ---- emission --------------------------------------------------------------------------------
    def _emit(self, verts, faces, c, weights=None, bone=None, mirrored=False, smooth=False):
        bone = bone or self._bone
        smooth = smooth if self._smooth is None else self._smooth
        if self._mat not in self.materials:
            self.materials.append(self._mat)
        mi = self.materials.index(self._mat)
        base = len(self.verts)
        for i, v in enumerate(verts):
            self.verts.append((-v[0], v[1], v[2]) if mirrored else tuple(v))
            w = weights[i] if weights else {bone: 1.0}
            self.weights.append({(mirror_name(b) if mirrored else b): k for b, k in w.items()})
        for f in faces:
            idx = tuple(base + i for i in (reversed(f) if mirrored else f))
            if self._layer:
                self.layers.setdefault(self._layer, []).append(len(self.faces))
            rgb, glow = colour(c(_centre([self.verts[i] for i in idx])) if callable(c) else c)
            self.faces.append((idx, mi, rgb, glow, smooth))
        if self._sym and not mirrored:
            self._emit(verts, faces, c, weights, bone, True, smooth)

    # ---- primitives ------------------------------------------------------------------------------
    def box(self, center, size, c, rot_deg=(0, 0, 0), taper=(1.0, 1.0), shear=(0.0, 0.0)):
        """A box `size` (x, y, z) about `center`; its top face scaled by `taper` and shifted by `shear` (x, y)."""
        sx, sy, sz = (s / 2 for s in size)
        vs = []
        for z in (-1, 1):
            k = taper if z > 0 else (1.0, 1.0)
            off = shear if z > 0 else (0.0, 0.0)
            for x, y in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
                vs.append(add(center, rot((x * sx * k[0] + off[0], y * sy * k[1] + off[1], z * sz), rot_deg)))
        faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
        self._emit(vs, faces, c)

    def ellipsoid(self, center, radii, c, rot_deg=(0, 0, 0), segs=6, rings=4):
        """A low sphere stretched to `radii`; `segs` around, `rings` from pole to pole."""
        vs = [add(center, rot((0, 0, -radii[2]), rot_deg))]
        for r in range(1, rings):
            a = math.pi * r / rings - math.pi / 2
            for s in range(segs):
                b = 2 * math.pi * s / segs
                p = (math.cos(a) * math.cos(b) * radii[0], math.cos(a) * math.sin(b) * radii[1], math.sin(a) * radii[2])
                vs.append(add(center, rot(p, rot_deg)))
        vs.append(add(center, rot((0, 0, radii[2]), rot_deg)))
        top = len(vs) - 1
        faces = [(0, 1 + (s + 1) % segs, 1 + s) for s in range(segs)]
        for r in range(rings - 2):
            a0, a1 = 1 + r * segs, 1 + (r + 1) * segs
            faces += [(a0 + s, a0 + (s + 1) % segs, a1 + (s + 1) % segs, a1 + s) for s in range(segs)]
        last = 1 + (rings - 2) * segs
        faces += [(last + s, last + (s + 1) % segs, top) for s in range(segs)]
        self._emit(vs, faces, c, smooth=True)

    def tube(self, points, radii, c, sides=6, bones=None, cap=(True, True), flat=(1.0, 1.0), twist=0.0):
        """Rings of `sides` along a polyline, radius per point (0 closes to a point); `bones` per point
        blends the skin along a chain (a tentacle, a tail, a neck). `flat` squashes each ring (u, v)."""
        if isinstance(radii, (int, float)):
            radii = [radii] * len(points)
        rings, prev_u = [], None
        for i, p in enumerate(points):
            d = sub(points[min(i + 1, len(points) - 1)], points[max(i - 1, 0)])
            u, v = frame(d)
            if prev_u is not None:  # parallel transport: no ring turns against the last
                u = norm(sub(prev_u, mul(norm(d), dot(prev_u, norm(d)))))
                v = cross(norm(d), u)
            prev_u = u
            rings.append((p, u, v, radii[i]))
        vs, ws, faces = [], [], []
        for i, (p, u, v, r) in enumerate(rings):
            w = self._chain_weight(bones, i) if bones else None
            for s in range(sides):
                a = 2 * math.pi * s / sides + math.radians(twist) * i
                vs.append(add(p, add(mul(u, math.cos(a) * r * flat[0]), mul(v, math.sin(a) * r * flat[1]))))
                ws.append(w)
        for i in range(len(rings) - 1):
            a0, a1 = i * sides, (i + 1) * sides
            faces += [(a0 + s, a0 + (s + 1) % sides, a1 + (s + 1) % sides, a1 + s) for s in range(sides)]
        if cap[0] and radii[0] > 0:
            faces.append(tuple(reversed(range(sides))))
        if cap[1] and radii[-1] > 0:
            n = len(rings) - 1
            faces.append(tuple(n * sides + s for s in range(sides)))
        self._emit(vs, faces, c, ws if bones else None, smooth=sides > 4)

    def _chain_weight(self, bones, i):
        b = bones[i]
        if isinstance(b, str):
            return {b: 1.0}
        return dict(b)  # an explicit {bone: weight}

    def limb(self, a, b, r0, r1, c, sides=6, tip=0.0, flat=(1.0, 1.0)):
        """A tapered segment from a to b; `tip` draws its far end out to a point that far beyond b."""
        pts, rad = [a, b], [r0, r1]
        if tip:
            pts.append(add(b, mul(norm(sub(b, a)), tip)))
            rad.append(0.0)
        self.tube(pts, rad, c, sides, flat=flat)

    def cone(self, base, tip, r, c, sides=4):
        """A spike, claw, horn or tooth: from a base of radius r to a point."""
        self.tube([base, tip], [r, 0.0], c, sides)

    def lathe(self, profile, c, base=(0, 0, 0), axis=(0, 0, 1), sides=8, squash=(1.0, 1.0), rot_deg=0.0):
        """Rings of (radius, distance along `axis` from `base`): a torso, a robe, a head, a bell.
        `squash` scales each ring across (u, v); a radius of 0 at an end closes it to a pole."""
        u, v = frame(axis)
        a = norm(axis)
        vs, faces, rings = [], [], []
        for r, h in profile:
            centre = add(base, mul(a, h))
            if r <= 0:
                rings.append([len(vs)])
                vs.append(centre)
                continue
            ring = []
            for s in range(sides):
                t = 2 * math.pi * s / sides + math.radians(rot_deg)
                ring.append(len(vs))
                vs.append(add(centre, add(mul(u, math.cos(t) * r * squash[0]), mul(v, math.sin(t) * r * squash[1]))))
            rings.append(ring)
        for r0, r1 in zip(rings, rings[1:]):
            if len(r0) == 1 and len(r1) == 1:
                continue
            if len(r0) == 1:
                faces += [(r0[0], r1[(s + 1) % sides], r1[s]) for s in range(sides)]
            elif len(r1) == 1:
                faces += [(r0[s], r0[(s + 1) % sides], r1[0]) for s in range(sides)]
            else:
                faces += [(r0[s], r0[(s + 1) % sides], r1[(s + 1) % sides], r1[s]) for s in range(sides)]
        if len(rings[0]) > 1:
            faces.append(tuple(reversed(rings[0])))
        if len(rings[-1]) > 1:
            faces.append(tuple(rings[-1]))
        self._emit(vs, faces, c, smooth=True)

    def slab(self, outline, c, origin=(0, 0, 0), u=(1, 0, 0), v=(0, 0, 1), thick=0.03, weights=None):
        """A flat polygon (2D `outline` in the plane of u, v about `origin`) given thickness: a fin, an
        ear, a blade, a mitre, a membrane. `weights` per outline point skins it across bones (a wing)."""
        n = norm(cross(u, v))
        if sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(outline, outline[1:] + outline[:1])) < 0:
            outline, weights = outline[::-1], weights[::-1] if weights else None  # wound the other way: its faces would look inward
        pts = [add(origin, add(mul(u, x), mul(v, y))) for x, y in outline]
        k = len(pts)
        vs = [add(p, mul(n, thick / 2)) for p in pts] + [sub(p, mul(n, thick / 2)) for p in pts]
        faces = [tuple(range(k)), tuple(reversed(range(k, 2 * k)))]
        faces += [(i, k + i, k + (i + 1) % k, (i + 1) % k) for i in range(k)]
        self._emit(vs, faces, c, (weights + weights) if weights else None)

    def eye(self, center, r, c, bone=None, socket=None):
        """An eye: a small faceted bead, its colour glowing as given; it also marks where the game's
        halo glows (`socket`: a darker rim around it)."""
        if socket:
            self.ellipsoid(center, (r * 1.5, r * 1.1, r * 1.5), socket, segs=6, rings=3)
        vs = [add(center, p) for p in ((r, 0, 0), (-r, 0, 0), (0, r, 0), (0, -r, 0), (0, 0, r), (0, 0, -r))]
        faces = [(0, 2, 4), (2, 1, 4), (1, 3, 4), (3, 0, 4), (2, 0, 5), (1, 2, 5), (3, 1, 5), (0, 3, 5)]
        self._emit(vs, faces, c, bone=bone)
        self.eyes.append((bone or self._bone, tuple(center), colour(c)[0], self._layer))
        if self._sym:
            self.eyes.append((mirror_name(bone or self._bone), (-center[0], center[1], center[2]), colour(c)[0], self._layer))

    def teeth(self, a, b, n, size, c, down=(0, 0, -1)):
        """A row of n fangs along a..b, pointing `down`."""
        for i in range(n):
            p = lerp3(a, b, (i + 0.5) / n)
            self.cone(p, add(p, mul(norm(down), size)), size * 0.3, c, 3)

    # ---- facts -----------------------------------------------------------------------------------
    def tris(self):
        return sum(len(f[0]) - 2 for f in self.faces)

    def bounds(self):
        xs, ys, zs = zip(*self.verts)
        return (min(xs), min(ys), min(zs)), (max(xs), max(ys), max(zs))
