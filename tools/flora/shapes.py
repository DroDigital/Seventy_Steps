"""Round 125, what a skeleton's rules cannot grow: the shelving caps of a fungus from Yuggoth or K'n-yan on their stalk (a lathe each,
wide and drooping at its rim, its gills dark beneath), and the broken stubs of a blasted tree's limbs.
"""
import math
from mathutils import Vector

from grow import Branch, UP, turned
from tubes import Mesh
import slots as S

SOLID = 15  # the atlas's all-covered cell (render/foliageCells.ts)


def cell_uv(u, v, cell=SOLID):
    """The atlas UV of (u, v) within a cell, in the geometry's units (render/textureFoliage.ts cellUv)."""
    col, row = cell % 4, cell // 4
    inset = lambda x: 0.004 + max(0.0, min(1.0, x)) * 0.992
    return ((col + inset(u)) / 4 * 2, (row + inset(v)) / 4 * 2)


def caps(trunk, spec, rng):
    """The caps of a fungal tree on its stalk's top, one to three, the lower wider (or, `on: 1`, one on each stalk of a cluster), as a leaf Mesh (lit and coloured as leaves)."""
    cfg = spec['caps']
    m = Mesh()
    if cfg.get('on') == 1:  # a crowd of toadstools: a cap on each stalk, as wide as its stalk is long
        for b in trunk.walk():
            if b.level == 1:
                cap(m, b.pts[-1], b.length * rng.uniform(*cfg['radius']), rng, rng.randint(0, 3), 7)
        return m
    top = trunk.pts[-1]
    tiers = rng.randint(*cfg['tiers'])
    h = top.y
    side = rng.uniform(0, math.tau)
    for k in range(tiers):
        t = k / max(tiers, 1)
        r = h * rng.uniform(*cfg['radius']) * (1 - 0.4 * t)
        at, d, _ = trunk.point(1.0 - t * cfg['drop'])
        if k:  # the lower caps shelve out from the stalk to one side and the other, as bracket fungi do
            side += math.pi * rng.uniform(0.7, 1.3)
            at = at + Vector((math.cos(side), 0.0, math.sin(side))) * r * 0.55
        cap(m, at, r, rng, k)
    return m


def cap(m, at, r, rng, k, sides=12):
    """One cap of radius r on its stalk's end at `at`, of `sides`: a lathe drooping at its rim, its gills dark beneath."""
    slot = S.LEAF[(k + rng.randint(0, 3)) % 4]
    profile = [(0.08, 0.32), (0.45, 0.3), (0.78, 0.2), (1.0, 0.02), (0.97, -0.08)]  # (share of radius, height in radii): crown, shoulder, rim
    rings = []
    for i, (pr, py) in enumerate(profile):
        ring = []
        for s in range(sides + 1):
            th = s / sides * math.tau
            wob = 1 + 0.08 * math.sin(th * 3 + k * 1.7) + 0.05 * math.sin(th * 5 + 0.4)
            p = at + Vector((math.cos(th) * pr * r * wob, py * r * wob - (0.08 * r if pr > 0.9 else 0.0), math.sin(th) * pr * r * wob))
            ring.append(m.add(p, cell_uv(s / sides, i / (len(profile) - 1)), slot, 0.08 + 0.25 * pr, rng.random(), 0.0))
        rings.append(ring)
    apex = m.add(at + Vector((0.0, 0.36 * r, 0.0)), cell_uv(0.5, 1.0), slot, 0.08, 0.0, 0.0)
    for s in range(sides):
        m.tris.append((apex, rings[0][s + 1], rings[0][s]))
    for i in range(len(rings) - 1):
        a, c = rings[i], rings[i + 1]
        for s in range(sides):
            m.tris.append((a[s], a[s + 1], c[s + 1]))
            m.tris.append((a[s], c[s + 1], c[s]))
    under = []  # the gills: a dark underside from the rim in to the stalk
    for s in range(sides + 1):
        th = s / sides * math.tau
        p = at + Vector((math.cos(th) * r * 0.2, -0.04 * r, math.sin(th) * r * 0.2))
        under.append(m.add(p, cell_uv(s / sides, 0.0), S.GILL, 0.06, 0.0, 0.0))
    rim = rings[-1]
    for s in range(sides):
        m.tris.append((rim[s], rim[s + 1], under[s + 1]))
        m.tris.append((rim[s], under[s + 1], under[s]))


def stubs(trunk, n, rng):
    """A blasted tree's limbs broken short: thick stubs off its trunk, as branches of the skeleton."""
    for k in range(n):
        t = rng.uniform(0.35, 0.85)
        at, d, r = trunk.point(t)
        heading = turned(d, math.radians(rng.uniform(45, 75)), rng.uniform(0, math.tau))
        b = Branch(1, trunk, t)
        length = rng.uniform(0.4, 1.1)
        b.pts = [at, at + heading * length * 0.55, at + (heading + UP * 0.15).normalized() * length]
        b.radii = [r * 0.5, r * 0.4, r * 0.3]
        b.phase = rng.random()
        trunk.children.append(b)
