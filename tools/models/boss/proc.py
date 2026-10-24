"""Forms the packs do not have, made in code for the baker (tools/models/bake_boss_models.py: `M(src='proc:<name>', args={...})`): a lightning
mast, a chimney's stack, an obelisk, a fang, a mask, a trough of slime, a bollard. Each returns triangles (n,3,3) in the game's frame (x right, y up,
z front; counter-clockwise from outside, as the game's faces are), a colour for each and a material class, like what is read from a pack. A
shape is built from boxes, lathes (a profile turned about the vertical), lofts (rings along a path) and ellipsoids; faces are jittered a little
in value, as low-poly art's are, so a flat colour is not a flat sheet. Offline only."""
import math
import numpy as np
import sources as S

def _jit(n, seed, amp=0.07):
    rng = np.random.default_rng(seed)
    return 1 + (rng.random(n) - 0.5) * 2 * amp

class Shape:
    def __init__(self):
        self.tris, self.cols, self.cls = [], [], []

    def part(self, tris, centre, col, cls):
        """Adds the triangles of one convex part, each wound so its normal points away from `centre` (the part's own middle, or the axis point a ring of a loft is about)."""
        c = np.array(centre, dtype=np.float64)
        for a, b, d in tris:
            a, b, d = np.array(a, dtype=np.float64), np.array(b, dtype=np.float64), np.array(d, dtype=np.float64)
            n = np.cross(b - a, d - a)
            if np.linalg.norm(n) < 1e-12:
                continue
            if np.dot(n, (a + b + d) / 3 - c) < 0:
                b, d = d, b
            self.tris.append([a, b, d])
            self.cols.append(col)
            self.cls.append(cls)

    def out(self, seed=1, amp=0.07):
        t = np.array(self.tris, dtype=np.float64).reshape(-1, 3, 3)
        c = np.array(self.cols, dtype=np.float64).reshape(-1, 3) * _jit(len(t), seed, amp)[:, None]
        return t, np.clip(c, 0, 1), np.array(self.cls, dtype=np.int32)

def _quad(a, b, c, d):
    return [(a, b, c), (a, c, d)]

def box(s, w, h, d, at=(0, 0, 0), col=(0.6, 0.6, 0.6), cls=S.STONE, taper=1.0):
    """A box with its foot centre at `at`: `taper` scales the top's width and depth (a pyramid frustum)."""
    x, y, z = at
    hw, hd = w / 2, d / 2
    b = [(x - hw, y, z - hd), (x + hw, y, z - hd), (x + hw, y, z + hd), (x - hw, y, z + hd)]
    t = [(x - hw * taper, y + h, z - hd * taper), (x + hw * taper, y + h, z - hd * taper), (x + hw * taper, y + h, z + hd * taper), (x - hw * taper, y + h, z + hd * taper)]
    tris = []
    for i in range(4):
        j = (i + 1) % 4
        tris += _quad(b[i], b[j], t[j], t[i])
    tris += _quad(t[0], t[1], t[2], t[3]) + _quad(b[0], b[1], b[2], b[3])
    s.part(tris, (x, y + h / 2, z), col, cls)

def lathe(s, profile, sides=8, at=(0, 0, 0), col=(0.6, 0.6, 0.6), cls=S.STONE, twist=0.0, squash=(1, 1)):
    """A profile [(radius, height), ...] from foot to top turned about the vertical; a radius of 0 closes it to a point."""
    x0, y0, z0 = at
    ring = lambda r, y, k: (x0 + math.cos(2 * math.pi * k / sides + twist) * r * squash[0], y0 + y, z0 + math.sin(2 * math.pi * k / sides + twist) * r * squash[1])
    for (r0, ya), (r1, yb) in zip(profile, profile[1:]):
        mid = (x0, y0 + (ya + yb) / 2, z0)
        tris = []
        for k in range(sides):
            a, b, c, d = ring(r0, ya, k), ring(r0, ya, k + 1), ring(r1, yb, k + 1), ring(r1, yb, k)
            tris += _quad(a, b, c, d) if r0 > 0 and r1 > 0 else [(a, c, d)] if r0 == 0 else [(a, b, c)]
        s.part(tris, mid, col, cls)
    for (r, y), up in ((profile[0], -1), (profile[-1], 1)):
        if r > 0:
            c = (x0, y0 + y, z0)
            s.part([(c, ring(r, y, k), ring(r, y, k + 1)) for k in range(sides)], (x0, y0 + y - up, z0), col, cls)

def ellipsoid(s, at, radii, rings=5, sides=8, col=(0.7, 0.7, 0.7), cls=S.BONE):
    x0, y0, z0 = at
    rx, ry, rz = radii
    pt = lambda i, k: (x0 + rx * math.sin(math.pi * i / rings) * math.cos(2 * math.pi * k / sides), y0 + ry * math.cos(math.pi * i / rings), z0 + rz * math.sin(math.pi * i / rings) * math.sin(2 * math.pi * k / sides))
    tris = []
    for i in range(rings):
        for k in range(sides):
            a, b, c, d = pt(i, k), pt(i, k + 1), pt(i + 1, k + 1), pt(i + 1, k)
            tris += [(a, c, d)] if i == 0 else [(a, b, c)] if i == rings - 1 else _quad(a, b, c, d)
    s.part(tris, at, col, cls)

def loft(s, path, radii, sides=6, col=(0.7, 0.7, 0.7), cls=S.BONE, squash=1.0):
    """Rings of `sides` points about each point of `path` [(x, y, z)] with the radius of `radii`, joined, closed at both ends (a fang, a tentacle, a horn)."""
    p = np.array(path, dtype=np.float64)
    rings = []
    for i in range(len(p)):
        t = p[min(i + 1, len(p) - 1)] - p[max(i - 1, 0)]
        t /= np.linalg.norm(t) or 1
        up = np.array([0, 0, 1.0]) if abs(t[1]) > 0.9 else np.array([0, 1.0, 0])
        u = np.cross(t, up); u /= np.linalg.norm(u)
        v = np.cross(u, t)
        rings.append([tuple(p[i] + (math.cos(2 * math.pi * k / sides) * u + math.sin(2 * math.pi * k / sides) * v * squash) * radii[i]) for k in range(sides)])
    for i in range(len(p) - 1):
        mid = (p[i] + p[i + 1]) / 2
        tris = []
        for k in range(sides):
            tris += _quad(rings[i][k], rings[i][(k + 1) % sides], rings[i + 1][(k + 1) % sides], rings[i + 1][k])
        s.part(tris, mid, col, cls)
    for idx, end in ((0, p[0] - (p[1] - p[0])), (len(p) - 1, p[-1] + (p[-1] - p[-2]))):
        s.part([(tuple(p[idx]), rings[idx][k], rings[idx][(k + 1) % sides]) for k in range(sides)], tuple(p[idx] - (end - p[idx])), col, cls)

# ---------------------------------------------------------------------------- the forms

STONE = (0.55, 0.54, 0.5)
BRICK = (0.5, 0.33, 0.28)
IRON = (0.22, 0.2, 0.2)
BONE = (0.82, 0.78, 0.66)

def rod(height=12.0, **_):
    """A lightning mast: a stone footing, an iron mast tapering to a point with two rings and a ball (at 2/3), the point sharp."""
    s = Shape()
    box(s, 0.9, 0.5, 0.9, col=STONE)
    lathe(s, [(0.22, 0.5), (0.16, height * 0.5), (0.1, height * 0.9), (0.0, height)], sides=6, col=IRON, cls=S.METAL)
    for f in (0.25, 0.5):
        lathe(s, [(0.28, height * f), (0.28, height * f + 0.14)], sides=6, col=IRON, cls=S.METAL)
    ellipsoid(s, (0, height * 0.66, 0), (0.22, 0.22, 0.22), 3, 6, IRON, S.METAL)
    return s.out(3)

def chimney(height=9.0, width=1.8, **_):
    """A brick stack: a wide footing, a shaft tapering a little, a corbelled cap with a flue."""
    s = Shape()
    box(s, width * 1.5, height * 0.12, width * 1.5, col=BRICK, cls=S.BRICK, taper=0.8)
    box(s, width * 1.2, height * 0.8, width * 1.2, at=(0, height * 0.12, 0), col=BRICK, cls=S.BRICK, taper=0.85)
    box(s, width * 1.15, height * 0.06, width * 1.15, at=(0, height * 0.92, 0), col=BRICK, cls=S.BRICK, taper=1.0)
    box(s, width * 1.45, height * 0.03, width * 1.45, at=(0, height * 0.98, 0), col=(0.42, 0.3, 0.26), cls=S.BRICK, taper=0.95)
    return s.out(5)

def obelisk(height=12.0, base=1.6, **_):
    s = Shape()
    box(s, base * 1.6, height * 0.05, base * 1.6, col=STONE, cls=S.SLAB)
    box(s, base * 1.3, height * 0.05, base * 1.3, at=(0, height * 0.05, 0), col=STONE, cls=S.SLAB)
    box(s, base, height * 0.78, base, at=(0, height * 0.1, 0), col=(0.7, 0.62, 0.48), cls=S.SLAB, taper=0.62)
    cap = base * 0.62
    box(s, cap, height * 0.12, cap, at=(0, height * 0.88, 0), col=(0.84, 0.7, 0.4), cls=S.SLAB, taper=0.0)
    return s.out(7)

def fang(height=3.0, base=0.5, bend=0.5, **_):
    """A curved tooth standing on its root, the point leaning toward +z by `bend` of its height."""
    s = Shape()
    n = 6
    path = [(0, height * i / (n - 1), bend * height * (i / (n - 1)) ** 2) for i in range(n)]
    radii = [base * (1 - i / (n - 1)) ** 0.8 + 0.01 for i in range(n)]
    loft(s, path, radii, sides=6, col=BONE, cls=S.BONE)
    return s.out(9)

def mask(width=1.0, **_):
    """A theatre mask on a short stand: a pale oval face, slits for eyes, a thin smile, a pole under it."""
    s = Shape()
    face = (0.86, 0.82, 0.7)
    lathe(s, [(0.06, 0), (0.05, 0.9)], sides=5, col=(0.3, 0.24, 0.18), cls=S.WOOD)
    ellipsoid(s, (0, 1.25, 0), (0.34 * width, 0.46, 0.14), 5, 8, face, S.BONE)
    dark = (0.1, 0.09, 0.08)
    for sx in (-1, 1):
        box(s, 0.22, 0.05, 0.03, at=(sx * 0.13, 1.33, 0.12), col=dark, cls=S.METAL)
    box(s, 0.3, 0.04, 0.03, at=(0, 1.0, 0.115), col=dark, cls=S.METAL)
    for sx in (-1, 1):
        box(s, 0.05, 0.12, 0.03, at=(sx * 0.17, 0.97, 0.11), col=dark, cls=S.METAL)
    return s.out(11)

def trough(length=4.0, width=1.2, depth=0.5, **_):
    """A stone trough open along its length, its channel filled to the brim with a glowing slime (the one surface the model calls glow)."""
    s = Shape()
    wall = 0.18
    box(s, length, depth, wall, at=(0, 0, width / 2 - wall / 2), col=STONE)
    box(s, length, depth, wall, at=(0, 0, -width / 2 + wall / 2), col=STONE)
    box(s, wall, depth, width, at=(length / 2 - wall / 2, 0, 0), col=STONE)
    box(s, wall, depth, width, at=(-length / 2 + wall / 2, 0, 0), col=STONE)
    inner = (length - 2 * wall, width - 2 * wall)
    a, b, c, d = (-inner[0] / 2, depth * 0.78, -inner[1] / 2), (inner[0] / 2, depth * 0.78, -inner[1] / 2), (inner[0] / 2, depth * 0.78, inner[1] / 2), (-inner[0] / 2, depth * 0.78, inner[1] / 2)
    s.part(_quad(a, b, c, d), (0, -1, 0), (0.5, 0.82, 0.4), S.GLOW)  # (faces up)
    return s.out(13, 0.04)

def bollard(height=1.1, **_):
    s = Shape()
    lathe(s, [(0.34, 0), (0.26, 0.1), (0.22, height * 0.8), (0.3, height * 0.86), (0.3, height), (0.0, height)], sides=8, col=(0.2, 0.22, 0.21), cls=S.METAL)
    return s.out(15)

def sphere(radius=1.0, glow=True, **_):
    s = Shape()
    ellipsoid(s, (0, radius, 0), (radius, radius, radius), 6, 10, (0.8, 0.82, 1.0), S.GLOW if glow else S.STONE)
    return s.out(17, 0.03)

def ring(radius=3.0, tube=0.25, glow=True, **_):
    """A ring standing on edge, its foot on the ground (a gate that is not a gate)."""
    s = Shape()
    n = 20
    path = [(math.cos(2 * math.pi * i / n) * radius, radius + math.sin(2 * math.pi * i / n) * radius, 0) for i in range(n + 1)]
    loft(s, path[:-1] + [path[0]], [tube] * (n + 1), sides=6, col=(0.7, 0.72, 0.95), cls=S.GLOW if glow else S.STONE)
    return s.out(19, 0.03)

def brazier(height=1.2, **_):
    s = Shape()
    lathe(s, [(0.05, 0), (0.05, height * 0.7)], sides=4, col=IRON, cls=S.METAL)
    for k in range(3):
        a = 2 * math.pi * k / 3
        loft(s, [(math.cos(a) * 0.38, 0, math.sin(a) * 0.38), (math.cos(a) * 0.1, height * 0.7, math.sin(a) * 0.1)], [0.04, 0.04], sides=4, col=IRON, cls=S.METAL)
    lathe(s, [(0.12, height * 0.68), (0.4, height * 0.82), (0.44, height * 0.95), (0.3, height * 0.92), (0.0, height * 0.86)], sides=8, col=IRON, cls=S.METAL)
    lathe(s, [(0.28, height * 0.9), (0.16, height * 1.12), (0.0, height * 1.3)], sides=6, col=(1.0, 0.7, 0.3), cls=S.GLOW)
    return s.out(21, 0.04)

PROC = {k: v for k, v in dict(rod=rod, chimney=chimney, obelisk=obelisk, fang=fang, mask=mask, trough=trough, bollard=bollard, sphere=sphere, ring=ring, brazier=brazier).items()}
