"""Round 125, a skeleton's bark (grow.py): each branch a tube of rings carried along it without twisting (parallel transport), its
sides fewer the finer it is, its tip closed in a point; the trunk's foot flared into buttress roots and its rings knotted by a scatter;
roots dived into the ground from the flare. Each point carries its bark's UV (metres round and along), its slot (slots.py), and its wind:
the reach a bough's sway has there (none on the trunk: the trunk's lean is the game's, by height) and its bough's phase.
"""
import math
from mathutils import Quaternion, Vector

from grow import UP, Branch, perpendicular
import slots as S


class Mesh:
    def __init__(self):
        self.pos, self.uv, self.slot, self.reach, self.phase, self.flutter, self.tris = [], [], [], [], [], [], []
        self.normal = None  # filled by the bake (smooth normals of the tubes; the cards' are the crown's)

    def add(self, p, uv, slot, reach, phase, flutter=0.0):
        self.pos.append(p.copy())
        self.uv.append(uv)
        self.slot.append(slot)
        self.reach.append(reach)
        self.phase.append(phase)
        self.flutter.append(flutter)
        return len(self.pos) - 1


def scatter(a, b, salt):
    v = math.sin(a * 12.9898 + b * 78.233 + salt * 37.719) * 43758.5453
    return v - math.floor(v)


def reach_at(b, t, flex):
    """How far the wind carries a point at share t of branch b: its foot's reach and what its own length adds, the finer the more."""
    return b.reach0 + b.length * t * flex[min(b.level, len(flex) - 1)]


def frames(b):
    """A ring frame (tangent, normal) at each of b's points, carried along without twist."""
    n = len(b.pts)
    tangents = []
    for k in range(n):
        a = b.pts[max(0, k - 1)]
        c = b.pts[min(n - 1, k + 1)]
        tangents.append((c - a).normalized() if (c - a).length > 1e-9 else UP.copy())
    normal = perpendicular(tangents[0])
    out = [(tangents[0], normal)]
    for k in range(1, n):
        q = tangents[k - 1].rotation_difference(tangents[k])
        normal = (q @ normal).normalized()
        out.append((tangents[k], normal))
    return out


def tube(m, b, sides, slot, flex, spec, salt):
    """Rings along branch b into mesh m, closed at its tip."""
    fr = frames(b)
    flare = spec['trunk'].get('flare', 0.0) if b.level == 0 else 0.0
    lobes = spec['trunk'].get('lobes', 5)
    knots = spec.get('knots', 0.07)
    length = b.length
    along = 0.0
    rings = []
    for k, p in enumerate(b.pts):
        if k:
            along += (b.pts[k] - b.pts[k - 1]).length
        t = along / max(length, 1e-6)
        tan, nor = fr[k]
        bi = tan.cross(nor).normalized()
        r = b.radii[k]
        ring = []
        for s in range(sides + 1):  # (the seam's twin carries u = the whole way round)
            th = s / sides * math.tau
            rr = r
            if flare and p.y < 0.9:  # buttresses running down into the ground
                w = ((0.9 - p.y) / 1.15) ** 2
                rr *= 1 + flare * w * (0.55 + 0.45 * max(0.0, math.cos(lobes * th + salt)) ** 3)
            rr *= 1 + knots * (scatter(round(th * 100) % 628, round(along * 3), salt) - 0.5) * 2
            d = nor * math.cos(th) + bi * math.sin(th)
            sl = slot(p, th, along) if callable(slot) else slot
            ring.append(m.add(p + d * rr, (s / sides * math.tau * max(r, 0.04), along), sl, reach_at(b, t, flex), b.phase))
        rings.append(ring)
    for k in range(len(rings) - 1):
        a, c = rings[k], rings[k + 1]
        for s in range(sides):
            m.tris.append((a[s], c[s + 1], c[s]))  # wound counter-clockwise seen from outside
            m.tris.append((a[s], a[s + 1], c[s + 1]))
    if b.level > 0:  # a bough's foot closed, inside its parent: a parent of few sides is narrow across its flats, and an open foot showed through
        foot = m.add(b.pts[0] - fr[0][0] * b.radii[0] * 0.5, (0.0, 0.0), slot(b.pts[0], 0.0, 0.0) if callable(slot) else slot, reach_at(b, 0.0, flex), b.phase)
        first = rings[0]
        for s in range(sides):
            m.tris.append((first[s], foot, first[s + 1]))
    point = spec.get('tipLen', 2.5)  # how far past its end a branch's tip is drawn to a point (a capped stalk ends flush under its cap)
    tip = b.pts[-1] + fr[-1][0] * b.radii[-1] * point
    end = m.add(tip, (0.0, along + b.radii[-1] * point), slot(tip, 0.0, along) if callable(slot) else slot, reach_at(b, 1.0, flex), b.phase)
    last = rings[-1]
    for s in range(sides):
        m.tris.append((last[s], last[s + 1], end))


def roots(trunk, spec, rng):
    """Roots from the trunk's flared foot out and down into the ground, as branches of their own."""
    out = []
    tr = spec['trunk']
    n = tr.get('roots', 0)
    r = trunk.radii[0]
    for k in range(n):
        a = (k + rng.uniform(-0.2, 0.2)) / max(n, 1) * math.tau
        d = Vector((math.sin(a), 0.0, math.cos(a)))
        reach = r * rng.uniform(1.2, 2.0)
        b = Branch(1)
        foot = Vector((0.0, 0.4 + rng.uniform(0, 0.15), 0.0)) + d * r * 0.55
        mid = d * (r + reach * 0.45) + Vector((0.0, 0.08, 0.0))  # hugging the ground, then into it
        end = d * (r + reach) + Vector((0.0, -0.2, 0.0))
        b.pts = [foot, mid, end]
        b.radii = [r * 0.55, r * 0.32, r * 0.1]
        out.append(b)
    return out


def bark(trunk, spec, rng):
    """The bark of a skeleton: one Mesh of every branch thick enough for a tube, and the roots."""
    m = Mesh()
    flex = spec.get('flex', [0.0, 0.05, 0.12, 0.22])
    sides = spec.get('sides', [8, 6, 4, 3])
    least = spec.get('minTube', 0.012)
    tubes = spec.get('tubeLevels', 3)
    slot = S.bark_slot(spec)
    for b in trunk.walk():
        if b.parent is not None:
            b.reach0 = reach_at(b.parent, b.at, flex)
    for i, b in enumerate(trunk.walk()):
        if b.level > tubes or b.radii[0] < least:
            continue
        tube(m, b, sides[min(b.level, len(sides) - 1)], slot, flex, spec, i * 1.7 + 0.3)
    for b in roots(trunk, spec, rng):
        tube(m, b, 4, S.FOOT, [0.0], spec, rng.uniform(0, 9))
    return m
