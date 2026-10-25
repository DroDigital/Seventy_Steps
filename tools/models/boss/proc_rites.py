"""Forms for the places rebuilt in round 75 (proc.py's helpers; `M(src='proc:<name>', args={...})`): a carved monolith, a cairn, a twisted spire and a hexagonal dais for
the summit of the Other Gods; a raft of pipes, a drum and a gallows of chimes for the pipers; an armillary, a cluster of globes, a helix and a crystal for the Gate; and
an Elder Thing's barrel and a five-pointed stele for the Ancient Ones. Same frame and rules as proc.py. Offline only; their licence is this repository's."""
import math
import sources as S
from proc import Shape, box, lathe, ellipsoid, loft, STONE, IRON, BONE

PALE = (0.5, 0.49, 0.56)
WOOD = (0.3, 0.24, 0.2)
LIGHT = (0.78, 0.82, 1.0)

def monolith(height=12.0, base=2.2, **_):
    """A tall slab of the summit's stone, tapering to a low pyramid, three bands of a glyph cut into both faces and lit."""
    s = Shape()
    d, h, taper, y0 = base * 0.55, height * 0.93, 0.72, height * 0.03
    box(s, base * 1.5, y0, d * 1.6, col=STONE)
    box(s, base, h, d, at=(0, y0, 0), col=(0.46, 0.45, 0.52), cls=S.SLAB, taper=taper)
    cap = base * taper
    box(s, cap, height * 0.04, cap * 0.55, at=(0, y0 + h, 0), col=PALE, cls=S.SLAB, taper=0.0)
    for f in (0.3, 0.5, 0.7):
        k = 1 - (1 - taper) * f
        for sz in (-1, 1):
            box(s, base * k * 0.6, 0.16, 0.05, at=(0, y0 + h * f, sz * (d * k / 2 - 0.005)), col=LIGHT, cls=S.GLOW)
    return s.out(41)

def cairn(height=2.4, **_):
    """Flat stones stacked, each a little off the one below, the topmost the smallest."""
    s = Shape()
    n, y = 5, 0.0
    for i in range(n):
        hh = height / n
        r = 0.9 * (1 - i / n * 0.8)
        g = 0.5 - 0.02 * i
        ellipsoid(s, (math.sin(i * 2.1) * 0.12, y + hh * 0.5, math.cos(i * 1.7) * 0.12), (r, hh * 0.62, r * 0.9), 3, 7, (g, g, g + 0.04), S.ROCK)
        y += hh * 0.8
    return s.out(43)

def spire(height=14.0, base=1.4, **_):
    """A spire of stacked frustums, each turned a little from the last, tapering to a point."""
    s = Shape()
    n = 7
    for i in range(n):
        r0, r1 = base * (1 - i / n * 0.82) + 0.05, base * (1 - (i + 1) / n * 0.82) + 0.05
        lathe(s, [(r0, height * i / n), (0.0 if i == n - 1 else r1, height * (i + 1) / n)], sides=5, col=(0.5 + 0.03 * (i % 2), 0.49, 0.56), cls=S.SLAB, twist=i * 0.35)
    return s.out(45)

def dais(radius=5.0, **_):
    """Two hexagonal steps and a disc of light let into the top of them."""
    s = Shape()
    lathe(s, [(radius, 0), (radius, 0.5), (radius * 0.8, 0.5), (radius * 0.8, 0.9)], sides=6, col=(0.3, 0.3, 0.36), cls=S.SLAB)
    lathe(s, [(radius * 0.5, 0.9), (radius * 0.5, 0.94)], sides=6, col=LIGHT, cls=S.GLOW)
    return s.out(47)

def panpipe(count=7, height=8.0, width=0.5, **_):
    """A raft of bone pipes of graded length bound with two bands, each with a dark mouth, on two short legs."""
    s = Shape()
    for i in range(count):
        hh = height * (0.45 + 0.55 * (1 - i / (count - 1)))
        x = (i - (count - 1) / 2) * width
        lathe(s, [(width * 0.46, 0.5), (width * 0.46, 0.5 + hh)], sides=7, at=(x, 0, 0), col=(0.8, 0.76, 0.64), cls=S.BONE)
        lathe(s, [(width * 0.32, 0.5 + hh), (width * 0.32, 0.5 + hh + 0.03)], sides=7, at=(x, 0, 0), col=(0.08, 0.07, 0.1), cls=S.METAL)
    for f in (0.2, 0.38):
        box(s, count * width, 0.16, width * 0.9, at=(0, 0.5 + height * f, 0), col=(0.34, 0.25, 0.2), cls=S.WOOD)
    for sx in (-1, 1):
        box(s, 0.16, 0.5, 0.16, at=(sx * (count * width / 2 - 0.1), 0, 0), col=WOOD, cls=S.WOOD)
    return s.out(49)

def drum(radius=1.6, **_):
    """A great drum on a tripod, hooped in iron, its skin taut and pale, a bone beater laid across it."""
    s = Shape()
    h, y0 = radius * 1.1, radius * 0.5
    lathe(s, [(radius * 0.88, y0), (radius, y0 + h * 0.3), (radius, y0 + h * 0.7), (radius * 0.9, y0 + h)], sides=10, col=(0.32, 0.24, 0.2), cls=S.WOOD)
    lathe(s, [(radius * 0.92, y0 + h), (radius * 0.92, y0 + h + 0.05)], sides=10, col=(0.78, 0.72, 0.6), cls=S.CLOTH)
    for f in (0.12, 0.88):
        lathe(s, [(radius * 1.02, y0 + h * f), (radius * 1.02, y0 + h * f + 0.1)], sides=10, col=IRON, cls=S.METAL)
    for k in range(3):
        a = 2 * math.pi * k / 3 + 0.5
        loft(s, [(math.cos(a) * radius * 1.25, 0, math.sin(a) * radius * 1.25), (math.cos(a) * radius * 0.7, y0 + h * 0.2, math.sin(a) * radius * 0.7)], [0.1, 0.08], sides=4, col=WOOD, cls=S.WOOD)
    loft(s, [(-radius * 0.5, y0 + h + 0.1, 0.1), (radius * 0.4, y0 + h + 0.3, -0.3)], [0.05, 0.07], sides=5, col=BONE, cls=S.BONE)
    return s.out(51)

def chimes(height=6.0, width=4.0, **_):
    """A gallows of two posts and a beam, tubes of bone hung from it on cords at graded lengths."""
    s = Shape()
    for sx in (-1, 1):
        loft(s, [(sx * width / 2, 0, 0), (sx * width / 2, height, 0)], [0.14, 0.1], sides=4, col=WOOD, cls=S.WOOD)
    box(s, width + 0.5, 0.16, 0.16, at=(0, height - 0.1, 0), col=WOOD, cls=S.WOOD)
    n = 7
    for i in range(n):
        x, l = (i - (n - 1) / 2) * width / n, 1.2 + 2.2 * abs(math.sin(i * 1.7))
        loft(s, [(x, height - 0.2, 0), (x, height - 0.2 - l * 0.15, 0)], [0.012, 0.012], sides=3, col=IRON, cls=S.METAL)
        lathe(s, [(0.09, height - 0.2 - l), (0.09, height - 0.2 - l * 0.15)], sides=6, at=(x, 0, 0), col=BONE, cls=S.BONE)
    return s.out(53)

def armillary(radius=3.0, **_):
    """Rings of light turned about one another on a stone foot and a thin stem, a sphere of light at their middle."""
    s = Shape()
    cy, n = radius + 0.9, 16
    box(s, 1.2, 0.5, 1.2, col=STONE, taper=0.7)
    loft(s, [(0, 0.5, 0), (0, cy - radius * 0.3, 0)], [0.15, 0.1], sides=5, col=IRON, cls=S.METAL)
    for a in (0.0, math.pi / 3, 2 * math.pi / 3):
        ring = [(math.cos(2 * math.pi * i / n) * radius * math.cos(a), cy + math.sin(2 * math.pi * i / n) * radius, -math.cos(2 * math.pi * i / n) * radius * math.sin(a)) for i in range(n)]
        loft(s, ring + [ring[0]], [0.12] * (n + 1), sides=5, col=(0.7, 0.72, 0.95), cls=S.GLOW)
    flat = [(math.cos(2 * math.pi * i / n) * radius * 0.75, cy, math.sin(2 * math.pi * i / n) * radius * 0.75) for i in range(n)]
    loft(s, flat + [flat[0]], [0.1] * (n + 1), sides=5, col=(0.78, 0.7, 1.0), cls=S.GLOW)
    ellipsoid(s, (0, cy, 0), (0.5, 0.5, 0.5), 4, 8, (0.9, 0.92, 1.0), S.GLOW)
    return s.out(55, 0.03)

def globes(radius=1.4, **_):
    """Spheres of light of every size massed together, each a faint other colour."""
    s = Shape()
    spec = [(0, 1.0, 0, 1.0), (1.15, 0.8, 0.3, 0.62), (-0.9, 0.7, 0.8, 0.55), (0.1, 2.0, -0.2, 0.7), (-0.6, 1.7, -0.9, 0.5), (0.7, 1.9, 0.9, 0.46), (1.5, 1.6, -0.7, 0.4)]
    cols = [(0.8, 0.84, 1.0), (0.9, 0.75, 1.0), (0.7, 0.9, 0.95), (0.85, 0.8, 1.0), (0.95, 0.8, 0.9), (0.75, 0.85, 1.0), (0.8, 0.95, 0.9)]
    for (x, y, z, r), c in zip(spec, cols):
        ellipsoid(s, (x * radius, y * radius, z * radius), (r * radius,) * 3, 5, 8, c, S.GLOW)
    return s.out(57, 0.04)

def helix(height=10.0, radius=0.9, **_):
    """Two strands of crystal wound about each other round a pale core, standing on a stone foot."""
    s = Shape()
    box(s, radius * 3, 0.4, radius * 3, col=STONE, taper=0.8)
    loft(s, [(0, 0.4, 0), (0, height, 0)], [radius * 0.3, radius * 0.2], sides=6, col=PALE, cls=S.SLAB)
    n = 18
    for ph, col in ((0.0, (0.75, 0.8, 1.0)), (math.pi, (0.85, 0.72, 1.0))):
        path = [(math.cos(ph + 4 * math.pi * i / n) * radius, 0.4 + (height - 0.4) * i / n, math.sin(ph + 4 * math.pi * i / n) * radius) for i in range(n + 1)]
        loft(s, path, [radius * 0.26 * (1 - 0.6 * i / n) for i in range(n + 1)], sides=5, col=col, cls=S.GLOW)
    return s.out(59, 0.03)

def shard(height=6.0, **_):
    """A cluster of prisms of crystal leaning out from one root, each taller than the last and ending in a point."""
    s = Shape()
    for i, (lx, lz, k, r) in enumerate([(0.0, 0.1, 1.0, 0.5), (0.5, -0.2, 0.7, 0.36), (-0.45, -0.3, 0.6, 0.32), (0.2, 0.5, 0.45, 0.28), (-0.3, 0.45, 0.38, 0.24)]):
        hh = height * k
        loft(s, [(0, 0, 0), (lx * hh * 0.25, hh * 0.7, lz * hh * 0.25), (lx * hh * 0.4, hh, lz * hh * 0.4)], [r, r * 0.8, 0.02], sides=6, col=(0.66 + 0.04 * i, 0.74, 0.96), cls=S.SLAB)
    return s.out(61)

def barrel(height=6.0, radius=1.4, **_):
    """The Elder Thing: a barrel of grey-green flesh ridged five ways, five arms and a head of five at its crown."""
    s = Shape()
    prof = [(radius * 0.55, 0), (radius * 0.95, height * 0.18), (radius, height * 0.5), (radius * 0.9, height * 0.78), (radius * 0.55, height * 0.92)]
    lathe(s, prof, sides=10, col=(0.34, 0.38, 0.36), cls=S.STONE)
    at = lambda y: next(r0 + (r1 - r0) * (y - ya) / (yb - ya) for (r0, ya), (r1, yb) in zip(prof, prof[1:]) if ya <= y <= yb)
    for k in range(5):
        a = 2 * math.pi * k / 5
        ys = [height * f for f in (0.05, 0.25, 0.5, 0.75, 0.9)]
        loft(s, [(math.cos(a) * at(y) * 1.03, y, math.sin(a) * at(y) * 1.03) for y in ys], [0.07] * 5, sides=4, col=(0.28, 0.32, 0.3), cls=S.STONE)
        b = a + 0.3
        loft(s, [(math.cos(b) * radius * 0.45, height * 0.9, math.sin(b) * radius * 0.45), (math.cos(b) * radius * 0.9, height * 1.05, math.sin(b) * radius * 0.9), (math.cos(b) * radius * 1.2, height * 1.12, math.sin(b) * radius * 1.2)], [0.18, 0.14, 0.08], sides=5, col=(0.4, 0.44, 0.42), cls=S.STONE)
    ellipsoid(s, (0, height * 1.05, 0), (0.45, 0.3, 0.45), 4, 6, (0.5, 0.5, 0.46), S.STONE)
    return s.out(63)

def _prism(s, poly, y, t, col, cls):
    """A convex outline in the xy plane (list of (x, y)) pushed back and forth `t` in z."""
    cx, cy = sum(p[0] for p in poly) / len(poly), sum(p[1] for p in poly) / len(poly)
    tris = []
    for sz in (-1, 1):
        tris += [((cx, cy + y, sz * t), (poly[i][0], poly[i][1] + y, sz * t), (poly[(i + 1) % len(poly)][0], poly[(i + 1) % len(poly)][1] + y, sz * t)) for i in range(len(poly))]
    for i in range(len(poly)):
        a, b = poly[i], poly[(i + 1) % len(poly)]
        tris += [((a[0], a[1] + y, -t), (b[0], b[1] + y, -t), (b[0], b[1] + y, t)), ((a[0], a[1] + y, -t), (b[0], b[1] + y, t), (a[0], a[1] + y, t))]
    s.part(tris, (cx, cy + y, 0), col, cls)

def star(radius=4.0, thick=0.5, **_):
    """A stele cut as a five-pointed star, one point up and two on the ground, with a pentagon of light let into its middle."""
    s = Shape()
    cy, inner = radius * 0.81, radius * 0.382
    out = [(math.cos(math.radians(90 + 72 * k)) * radius, math.sin(math.radians(90 + 72 * k)) * radius) for k in range(5)]
    inn = [(math.cos(math.radians(90 + 36 + 72 * k)) * inner, math.sin(math.radians(90 + 36 + 72 * k)) * inner) for k in range(5)]
    _prism(s, inn, cy, thick, (0.62, 0.64, 0.7), S.SLAB)
    for k in range(5):
        _prism(s, [out[k], inn[(k - 1) % 5], inn[k]], cy, thick, (0.66, 0.68, 0.74), S.SLAB)
    _prism(s, [(x * 0.5, y * 0.5) for x, y in inn], cy, thick + 0.04, LIGHT, S.GLOW)
    return s.out(65)

PROC = dict(monolith=monolith, cairn=cairn, spire=spire, dais=dais, panpipe=panpipe, drum=drum, chimes=chimes, armillary=armillary, globes=globes, helix=helix, shard=shard, barrel=barrel, star=star)
