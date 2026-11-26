"""Round 125, a plant's leaves as cards: quads cut out by the leaf atlas (render/textureFoliage.ts), each a cluster, a spray, a strand or a
frond, laid on the skeleton (grow.py) by its species' layers (species.py): clusters at the ends of the finest boughs, held at their foot
and turned out of the crown; a conifer's flat sprays down each bough, rolled a little each way; strands and moss hung from the boughs;
a cypress's flame clothed all over; fronds arching from a crown. A card's normal is its crown's (the game lights a crown as one mass).
"""
import math
from mathutils import Quaternion, Vector

from grow import UP, perpendicular
import slots as S

CELLS = ['broad', 'maple', 'small', 'bare', 'fir', 'spruce', 'pine', 'scale', 'frond', 'strand', 'moss', 'thorn', 'grass', 'reeds', 'growth', 'solid']


class Card:
    def __init__(self, center, u, v, cell, slot, normal, reach, phase, hang=False, v0=0.0, v1=1.0, opacity=0.55):
        self.center, self.u, self.v = center, u, v  # u, v: half-axes (v toward the cell's head)
        self.cell = CELLS.index(cell)
        self.slot, self.normal, self.reach, self.phase = slot, normal, reach, phase
        self.hang, self.v0, self.v1, self.opacity = hang, v0, v1, opacity
        self.ao = [1.0, 1.0, 1.0, 1.0]  # baked: foot left, foot right, head right, head left

    def corners(self):
        c, u, v = self.center, self.u, self.v
        return [c - u - v, c + u - v, c + u + v, c - u + v]


def slot_of(layer, rng, bough):
    kind = layer.get('slots', 'palette')
    if kind == 'palette':  # a bough's leaves mostly of one colour: October turns a tree a bough at a time
        return S.LEAF[(bough + (1 if rng.random() < 0.25 else 0)) % 4]
    if kind == 'mixed':  # a bush mostly in its realm's green, a bough here and there turned
        return S.NEEDLE if rng.random() < 0.72 else S.LEAF[bough % 4]
    if kind == 'bracken':  # October's bracken: half of it turned brown
        return S.DRY if rng.random() < 0.5 else S.NEEDLE
    if kind == 'thornleaf':
        return S.NEEDLE_DARK if rng.random() < 0.6 else S.DRY
    return {'needle': S.NEEDLE if rng.random() < 0.7 else S.NEEDLE_DARK, 'moss': S.MOSS, 'dry': S.DRY, 'growth': S.GROWTH, 'gill': S.GILL, 'twig': S.TWIG}[kind]


def crown_normal(p, centre, radii, face, blend=0.22):
    out = Vector(((p.x - centre.x) / radii.x, (p.y - centre.y) / radii.y, (p.z - centre.z) / radii.z))
    out = out.normalized() if out.length > 1e-6 else UP.copy()
    f = face if face.dot(out) >= 0 else -face
    return (out * (1 - blend) + f * blend).normalized()


def crown_of(points):
    """The centre and half-extents of a crown from its points (a box's, at least half a metre each way)."""
    lo = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    hi = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    c = (lo + hi) * 0.5
    r = (hi - lo) * 0.5
    return c, Vector((max(r.x, 0.5), max(r.y, 0.5), max(r.z, 0.5)))


def boughs(trunk, level):
    return [b for b in trunk.walk() if b.level == level]


def place(trunk, spec, rng, reach_at, flex, height):
    """Every card of a skeleton, by its species' leaf layers."""
    cards = []
    tips = [b.pts[-1] for b in trunk.walk() if b.level >= 1] or [trunk.pts[-1]]
    centre, radii = crown_of(tips)
    if 'crown' in spec:
        centre.y = spec['crown'] * trunk.pts[-1].y
    for layer in spec.get('leaves', []):
        mode = layer.get('mode', 'cluster')
        if mode == 'column':
            _column(cards, layer, rng, height)
            continue
        if mode == 'frond':
            _fronds(cards, layer, rng)
            continue
        on = [b for b in trunk.walk() if b.level in layer.get('on', (2,))]
        keep = layer.get('keep', 1.0)
        for i, b in enumerate(on):
            if rng.random() > keep:
                continue
            n = layer.get('per', 3)
            n = int(n * rng.uniform(0.75, 1.25) + rng.random())
            for k in range(n):
                t = layer.get('from_', 0.4) + (1 - layer.get('from_', 0.4)) * ((k + rng.random()) / max(n, 1))
                at, d, r = b.point(t)
                reach = reach_at(b, t, flex) + layer.get('reach', 0.15)
                size = rng.uniform(*layer.get('size', (0.6, 0.9)))
                slot = slot_of(layer, rng, i)
                if mode == 'cluster':
                    off = perpendicular(d)
                    off = Quaternion(d, rng.uniform(0, math.tau)) @ off
                    at = at + off * rng.uniform(0, layer.get('spread', 0.25))
                    out = (at - centre)
                    out = out.normalized() if out.length > 1e-6 else UP.copy()
                    head = (d * layer.get('along', 0.6) + out * 0.8 + UP * layer.get('lift', 0.15) + Vector((rng.gauss(0, 0.35), rng.gauss(0, 0.35), rng.gauss(0, 0.35)))).normalized()
                    across = head.cross(Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 1)))).normalized()
                    v = head * size * 0.5
                    u = across * size * 0.5 * layer.get('aspect', 1.0)
                    c = at + v * 0.85
                    face = u.cross(v).normalized()
                    cards.append(Card(c, u, v, layer['cell'], slot, crown_normal(c, centre, radii, face), reach, b.phase, opacity=layer.get('opacity', 0.55)))
                elif mode == 'spray':
                    flat = d.copy()
                    flat.y *= layer.get('flatten', 0.5)
                    head = (flat.normalized() + UP * layer.get('droop', -0.15)).normalized()
                    side = head.cross(UP)
                    side = side.normalized() if side.length > 1e-6 else perpendicular(head)
                    roll = rng.choice((-1, 1)) * rng.uniform(*layer.get('roll', (0.25, 0.75)))
                    side = (Quaternion(head, roll) @ side).normalized()
                    v = head * size * 0.5
                    u = side * size * 0.5 * layer.get('aspect', 0.8)
                    c = at + v * 0.7 + UP * rng.uniform(-0.05, 0.08)
                    face = u.cross(v).normalized()
                    normal = (Vector((c.x - trunk.pts[0].x, 0.0, c.z - trunk.pts[0].z)).normalized() * 0.75 + UP * (0.35 + 0.4 * c.y / max(trunk.pts[-1].y, 1))).normalized()
                    cards.append(Card(c, u, v, layer['cell'], slot, (normal * 0.8 + (face if face.y > 0 else -face) * 0.2).normalized(), reach, b.phase, opacity=layer.get('opacity', 0.6)))
                elif mode == 'hang':
                    length = rng.uniform(*layer.get('length', (1.2, 2.4)))
                    width = size
                    turn = rng.uniform(0, math.tau)
                    across = Vector((math.cos(turn), 0.0, math.sin(turn)))
                    v = UP * length * 0.5
                    u = across * width * 0.5
                    c = at - v * 0.95
                    out = Vector((c.x - centre.x, 0.0, c.z - centre.z))
                    out = out.normalized() if out.length > 1e-6 else across
                    cards.append(Card(c, u, v, layer['cell'], slot, (out + UP * -0.1).normalized(), reach, b.phase, hang=True, opacity=layer.get('opacity', 0.35)))
    return cards


def _column(cards, layer, rng, top):
    """A flame of foliage clothed all over (a cypress), `top` tall: cards on its surface, facing out, standing up it."""
    base = layer.get('base', 0.12) * top
    rmax = layer.get('radius', 0.1) * top
    n = layer.get('count', 120)
    for k in range(n):
        t = rng.random() ** 0.85
        y = base + (top - base) * t
        prof = math.sin(math.pi * min(1.0, (t + 0.08) / 1.02) ** 0.7) * (1 - 0.75 * t ** 2)  # swelling from its foot, widest a third up, drawn to a point
        r = rmax * prof * rng.uniform(0.75, 1.05)
        a = rng.uniform(0, math.tau)
        out = Vector((math.sin(a), 0.0, math.cos(a)))
        c = Vector((0.0, y, 0.0)) + out * r
        size = rng.uniform(*layer.get('size', (0.6, 0.9))) * (0.6 + 0.4 * (1 - t))
        tilt = (UP * 0.9 + out * rng.uniform(0.1, 0.5)).normalized()
        side = Vector((out.z, 0.0, -out.x))
        side = (Quaternion(tilt, rng.uniform(-0.5, 0.5)) @ side).normalized()
        v = tilt * size * 0.5
        u = side * size * 0.5
        normal = (out * 0.85 + UP * (0.15 + 0.5 * t)).normalized()
        cards.append(Card(c, u, v, layer['cell'], S.NEEDLE if rng.random() < 0.65 else S.NEEDLE_DARK, normal, layer.get('reach', 0.05) + 0.25 * t, rng.random(), opacity=layer.get('opacity', 0.7)))


def _fronds(cards, layer, rng):
    """Fronds out of a crown at the foot (bracken, a fern's bed): each one card from the crown, leaning out, its face turned up to the sky."""
    n = layer.get('count', 10)
    for k in range(n):
        a = (k + rng.uniform(-0.3, 0.3)) / n * math.tau
        out = Vector((math.sin(a), 0.0, math.cos(a)))
        length = rng.uniform(*layer.get('size', (0.7, 1.1)))
        tilt = math.radians(rng.uniform(30, 62))  # from upright
        head = (out * math.sin(tilt) + UP * math.cos(tilt)).normalized()
        side = Vector((out.z, 0.0, -out.x))
        side = (Quaternion(head, rng.uniform(-0.5, 0.5)) @ side).normalized()
        v = head * length * 0.5
        u = side * length * 0.3
        c = Vector((out.x * 0.04, -0.03, out.z * 0.04)) + v
        normal = (out * 0.55 + UP * 0.85).normalized()
        cards.append(Card(c, u, v, layer['cell'], slot_of(layer, rng, k), normal, 0.1 + 0.15 * math.sin(tilt), rng.random(), opacity=layer.get('opacity', 0.5)))
