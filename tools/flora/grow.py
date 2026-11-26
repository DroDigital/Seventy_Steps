"""Round 125, a plant's skeleton grown by its species' rules (species.py): a trunk, its limbs, their branches and twigs, each a polyline
with a radius at each point, a level, the share of its parent it leaves from, and the phase its bough sways on in the wind. Game axes
(y up), metres, feet at the origin. Pure (mathutils only, from Blender's own Python): tubes.py makes the bark of it, cards.py the leaves.
"""
import math
import random
from mathutils import Matrix, Quaternion, Vector

UP = Vector((0.0, 1.0, 0.0))


class Branch:
    def __init__(self, level, parent=None, at=0.0):
        self.level = level
        self.parent = parent
        self.at = at  # the share along its parent it leaves from
        self.pts = []  # Vectors, foot to tip
        self.radii = []
        self.children = []
        self.phase = 0.0  # its bough's phase in the wind (0..1)
        self.reach0 = 0.0  # how far its foot is blown already (its parent's reach where it leaves)

    @property
    def length(self):
        return sum((self.pts[k + 1] - self.pts[k]).length for k in range(len(self.pts) - 1))

    def point(self, t):
        """(position, direction, radius) at share t of its length."""
        total = max(self.length, 1e-6)
        want = t * total
        for k in range(len(self.pts) - 1):
            seg = (self.pts[k + 1] - self.pts[k]).length
            if want <= seg or k == len(self.pts) - 2:
                u = 0.0 if seg < 1e-9 else min(1.0, want / seg)
                d = (self.pts[k + 1] - self.pts[k]).normalized() if seg > 1e-9 else UP.copy()
                return self.pts[k].lerp(self.pts[k + 1], u), d, self.radii[k] + (self.radii[k + 1] - self.radii[k]) * u
            want -= seg
        return self.pts[-1].copy(), UP.copy(), self.radii[-1]

    def walk(self):
        yield self
        for c in self.children:
            yield from c.walk()


def perpendicular(d):
    """A unit vector at right angles to d."""
    a = Vector((1.0, 0.0, 0.0)) if abs(d.x) < 0.9 else Vector((0.0, 0.0, 1.0))
    return d.cross(a).normalized()


def turned(d, down, around):
    """d tilted `down` radians from itself, then turned `around` radians about itself (a child leaving its parent)."""
    p = perpendicular(d)
    tilt = Quaternion(p, down) @ d
    return (Quaternion(d, around) @ tilt).normalized()


def shape_of(kind, t):
    """How long a child leaving at share t of its parent is, by the crown's shape (Weber and Penn's)."""
    if kind == 'conical':
        return 0.2 + 0.8 * (1 - t)
    if kind == 'spherical':
        return 0.2 + 0.8 * math.sin(math.pi * t)
    if kind == 'hemispherical':
        return 0.2 + 0.8 * math.sin(0.5 * math.pi * t)
    if kind == 'cylindrical':
        return 1.0
    if kind == 'tapered':
        return 0.5 + 0.5 * t
    if kind == 'flame':
        return t / 0.7 if t <= 0.7 else (1 - t) / 0.3
    if kind == 'inverse':
        return 1 - 0.8 * t
    if kind == 'vase':
        return 0.4 + 0.6 * t
    return 1.0


def bend(d, rng, gnarl, tropism, droop_tip=0.0, t=0.0):
    """The next segment's heading: a wander of `gnarl` radians, drawn up (tropism > 0) or down (< 0) toward the sky."""
    p = perpendicular(d)
    q = Quaternion(d, rng.uniform(0, math.tau)) @ p
    d = (Quaternion(q, rng.gauss(0, gnarl)) @ d).normalized()
    pull = tropism + droop_tip * t * t
    return (d + UP * pull).normalized() if abs(pull) > 1e-6 else d


def grow_branch(b, start, heading, length, r0, r1, segs, rng, gnarl, tropism, droop_tip=0.0, twist=0.0):
    """Lays b's points: from `start` along `heading`, `segs` segments of a wandering, tropic path, tapering r0 to r1."""
    pos, d = start.copy(), heading.normalized()
    b.pts, b.radii = [pos.copy()], [r0]
    step = length / segs
    for k in range(segs):
        t = (k + 1) / segs
        d = bend(d, rng, gnarl, tropism, droop_tip, t)
        if twist:
            d = (Quaternion(UP, twist * step) @ d).normalized()
        pos = pos + d * step
        b.pts.append(pos.copy())
        b.radii.append(r0 + (r1 - r0) * t ** 0.85)


def grow(spec, seed):
    """A species' skeleton (its trunk Branch, the rest hung from it), for variant `seed`."""
    rng = random.Random(seed)
    h = spec['height'] * rng.uniform(0.9, 1.1)
    tr = spec['trunk']
    trunk = Branch(0)
    if tr.get('leeward'):  # bent by the wind toward +x, its limbs all that way (the game turns it to its realm's wind)
        lean = (Quaternion(perpendicular(UP), tr['lean'] * rng.uniform(0.85, 1.15)) @ UP).normalized()
    else:
        lean = Quaternion(perpendicular(UP), rng.gauss(0, tr.get('lean', 0.05))) @ UP
        lean = (Quaternion(UP, rng.uniform(0, math.tau)) @ lean).normalized()
    grow_branch(trunk, Vector((0.0, -0.25, 0.0)), lean, h * tr['length'] + 0.25, tr['radius'], tr['radius'] * tr.get('tip', 0.25), tr.get('segs', 8), rng, tr.get('gnarl', 0.05), tr.get('tropism', 0.08), tr.get('droopTip', 0.0), twist=tr.get('twist', 0.0))
    trunk.phase = 0.0
    trunk.lee = 0.0 if tr.get('leeward') else rng.uniform(0, math.tau)
    levels = spec['levels']
    _children(trunk, levels, 0, rng, h)
    return trunk, h


def _children(parent, levels, depth, rng, h):
    if depth >= len(levels):
        return
    lv = levels[depth]
    n = lv['count']
    n = max(0, int(round(n * rng.uniform(0.85, 1.15)))) if isinstance(n, (int, float)) else n
    whorl = lv.get('whorl', 0)  # children in whorls of this many (a conifer's), else one at a time in a spiral
    angle = rng.uniform(0, math.tau)
    lee = getattr(parent, 'lee', None) if lv.get('lee') else None  # a wind-bent tree's limbs all to its lee side
    plen = parent.length
    for k in range(n):
        if whorl:
            ring = k // whorl
            rings = max(1, math.ceil(n / whorl))
            t = lv['start'] + (1 - lv['start']) * (ring + rng.uniform(0.0, 0.25)) / rings
            around = angle + (k % whorl) * math.tau / whorl + ring * 0.7 + rng.gauss(0, 0.2)
        else:
            t = lv['start'] + (1 - lv['start']) * (k + rng.uniform(0.2, 0.8)) / max(n, 1)
            angle += math.radians(lv.get('rotate', 137.5)) + rng.gauss(0, 0.3)
            around = angle
        if lee is not None:
            around = lee + rng.uniform(-lv['lee'], lv['lee'])
        t = min(0.98, t)
        at, d, pr = parent.point(t)
        down = math.radians(lv['down'] + rng.gauss(0, lv.get('downVar', 8)))
        if lv.get('downTaper'):  # the higher a conifer's whorl, the more it points up
            down -= math.radians(lv['downTaper']) * t
        heading = turned(d, down, around)
        base = h * lv['absLength'] if 'absLength' in lv else plen * lv['length']  # a bush's stems are as long as it stands, not as its stub of a trunk
        length = base * shape_of(lv.get('shape', 'spherical'), t) * rng.uniform(0.8, 1.2)
        if lv.get('maxLength'):
            length = min(length, lv['maxLength'] * h)
        if length < 0.08:
            continue
        b = Branch(depth + 1, parent, t)
        r0 = min(pr * lv.get('ratio', 0.6), pr * 0.92)
        segs = max(2, int(math.ceil(length / lv.get('step', 0.7))))
        grow_branch(b, at, heading, length, r0, max(0.006, r0 * lv.get('tip', 0.2)), segs, rng, lv.get('gnarl', 0.15), lv.get('tropism', 0.0), lv.get('droopTip', 0.0))
        b.phase = (parent.phase + rng.uniform(0.15, 0.85)) % 1.0 if depth == 0 else (parent.phase + rng.uniform(-0.08, 0.08)) % 1.0
        parent.children.append(b)
        _children(b, levels, depth + 1, rng, h)
