"""More forms made in code for the baker (proc.py's helpers; `M(src='proc:<name>', args={...})`): what a place needs that no pack has, one by one as the
places called for them. Same frame and rules as proc.py. Offline only; their licence is this repository's."""
import math
import sources as S
from proc import Shape, box, lathe, ellipsoid, loft, STONE, BRICK, IRON, BONE

WOOD = (0.36, 0.26, 0.18)

def well(radius=0.95, **_):
    """A farmstead's well: a ring of stones, two posts and a beam over it, a little pitched roof of boards gone grey."""
    s = Shape()
    lathe(s, [(radius, 0), (radius, 0.95), (radius * 0.74, 0.95), (radius * 0.74, 0.12)], sides=9, col=STONE, cls=S.STONE)
    lathe(s, [(radius * 1.08, 0.88), (radius * 1.08, 1.0), (radius * 0.68, 1.0), (radius * 0.68, 0.88)], sides=9, col=(0.5, 0.49, 0.46), cls=S.STONE)
    for sx in (-1, 1):
        box(s, 0.16, 2.3, 0.16, at=(sx * radius * 0.9, 0.95, 0), col=WOOD, cls=S.WOOD)
    box(s, radius * 2.4, 0.14, 0.14, at=(0, 2.2, 0), col=WOOD, cls=S.WOOD)
    for side in (-1, 1):  # the two pitches of the roof, a board each, one of them missing a half
        n = 0.62 if side > 0 else 0.34
        pts = [(-radius * 1.3, 2.3, side * 0.0), (radius * 1.3, 2.3, side * 0.0), (radius * 1.3, 2.3 + n * 0.6, side * 0.75 * n * 1.6), (-radius * 1.3, 2.3 + n * 0.6, side * 0.75 * n * 1.6)]
        s.part([(pts[0], pts[1], pts[2]), (pts[0], pts[2], pts[3])], (0, 1.4, 0), (0.3, 0.24, 0.2), S.WOOD)
        s.part([(pts[0], pts[2], pts[1]), (pts[0], pts[3], pts[2])], (0, 4.0, 0), (0.3, 0.24, 0.2), S.WOOD)
    box(s, 0.05, 0.7, 0.05, at=(0, 1.5, 0), col=(0.3, 0.27, 0.22), cls=S.WOOD)  # the rope and the bucket's hook
    box(s, 0.28, 0.24, 0.28, at=(0, 1.3, 0), col=(0.3, 0.25, 0.2), cls=S.WOOD, taper=0.8)
    return s.out(23)

SALT = (0.34, 0.3, 0.26)
RUST = (0.4, 0.28, 0.22)

def hull(length=9.0, beam=3.0, **_):
    """A boat's hull stranded on its keel: ribs standing in an arc from the keel, planking on one side left on them, the other side bare, a stem and a stern post."""
    s = Shape()
    n = 8
    xs = [(-0.5 + i / (n - 1)) * length for i in range(n)]
    box(s, length, 0.22, 0.34, at=(0, 0.1, 0), col=SALT, cls=S.WOOD)
    swell = lambda x: 0.2 + 0.8 * (1.0 - (2 * x / length) ** 4)  # fullest amidships
    for x in xs:
        k = swell(x)
        path = [(x, 0.3 + math.sin(t) * beam * 0.5 * k * 1.1, math.cos(t) * beam * 0.5 * k) for t in [math.radians(a) for a in (-80, -55, -30, -5, 20, 45, 70)]]
        loft(s, path, [0.07] * len(path), sides=4, col=SALT, cls=S.WOOD)
        loft(s, [(x, 0.3 + math.sin(t) * beam * 0.5 * k * 1.1, -math.cos(t) * beam * 0.5 * k) for t in [math.radians(a) for a in (-80, -55, -30, -5, 20, 45)]], [0.07] * 6, sides=4, col=SALT, cls=S.WOOD)
    for h in (0.25, 0.55, 0.85, 1.15):  # the planking left on one side
        t = math.asin(min(1, (h) / (beam * 0.55)))
        pts = [(x, 0.3 + h, math.cos(t) * beam * 0.5 * swell(x)) for x in xs]
        loft(s, pts, [0.06] * n, sides=4, col=(0.42, 0.34, 0.26), cls=S.WOOD, squash=2.2)
    loft(s, [(-length / 2, 0.2, 0), (-length / 2 - 0.3, 1.1, 0), (-length / 2 - 0.9, 1.9, 0)], [0.1, 0.09, 0.07], sides=4, col=SALT, cls=S.WOOD)
    loft(s, [(length / 2, 0.2, 0), (length / 2 + 0.1, 1.2, 0)], [0.1, 0.09], sides=4, col=SALT, cls=S.WOOD)
    return s.out(29)

def mast(height=9.0, **_):
    """A mast stepped in a heel of timber, its yard across near the top, a rope's end hanging."""
    s = Shape()
    box(s, 0.9, 0.5, 0.9, col=SALT, cls=S.WOOD, taper=0.8)
    lathe(s, [(0.2, 0.4), (0.15, height * 0.7), (0.08, height)], sides=6, col=(0.45, 0.36, 0.28), cls=S.WOOD)
    box(s, height * 0.5, 0.12, 0.12, at=(0, height * 0.78, 0), col=(0.45, 0.36, 0.28), cls=S.WOOD)
    loft(s, [(height * 0.2, height * 0.78, 0), (height * 0.2, height * 0.55, 0.05), (height * 0.22, height * 0.42, 0.05)], [0.025] * 3, sides=4, col=(0.7, 0.62, 0.45), cls=S.CLOTH)
    return s.out(31)

def derrick(height=8.0, reach=4.5, **_):
    """A landing's derrick: two legs in an A, a jib out over the water with its block and hook, a winch at the foot."""
    s = Shape()
    for sx in (-1, 1):
        loft(s, [(sx * 0.9, 0, -0.4), (sx * 0.12, height, 0)], [0.14, 0.1], sides=4, col=RUST, cls=S.METAL)
    box(s, 1.9, 0.14, 0.14, at=(0, height * 0.35, -0.2), col=RUST, cls=S.METAL)
    loft(s, [(0, height * 0.95, 0), (0, height * 0.88, reach * 0.55), (0, height * 0.7, reach)], [0.1, 0.09, 0.07], sides=4, col=RUST, cls=S.METAL)
    loft(s, [(0, height * 0.7, reach), (0, height * 0.35, reach)], [0.02, 0.02], sides=4, col=(0.2, 0.18, 0.18), cls=S.METAL)
    box(s, 0.3, 0.3, 0.3, at=(0, height * 0.28, reach), col=RUST, cls=S.METAL, taper=0.6)
    box(s, 1.1, 0.7, 0.8, at=(0, 0, -0.9), col=(0.3, 0.27, 0.25), cls=S.METAL, taper=0.85)
    return s.out(33)

def anchor(height=2.6, **_):
    """An old anchor stood up against a post, its stock across and its flukes in the ground."""
    s = Shape()
    loft(s, [(0, 0, 0), (0, height, 0)], [0.07, 0.07], sides=5, col=RUST, cls=S.METAL)
    box(s, height * 0.6, 0.09, 0.09, at=(0, height * 0.85, 0), col=RUST, cls=S.METAL)
    arc = [(math.sin(t) * height * 0.38, 0.35 - math.cos(t) * height * 0.22 + 0.2, 0) for t in [math.radians(a) for a in (-110, -70, -30, 0, 30, 70, 110)]]
    loft(s, arc, [0.07] * 7, sides=5, col=RUST, cls=S.METAL)
    for sx in (-1, 1):
        box(s, 0.2, 0.05, 0.3, at=(sx * height * 0.34, 0.5, 0), col=RUST, cls=S.METAL, taper=0.4)
    return s.out(35)

SAND = (0.76, 0.66, 0.5)
SAND_D = (0.58, 0.48, 0.36)

def dune(width=12.0, height=3.0, depth=8.0, **_):
    """A drift of sand, long and low, its crest a little off the middle and a second, lesser, behind it."""
    s = Shape()
    lathe(s, [(1.0, 0), (0.88, height * 0.3), (0.6, height * 0.72), (0.0, height)], sides=12, col=SAND, cls=S.SLAB, squash=(width / 2, depth / 2))
    lathe(s, [(1.0, 0), (0.8, height * 0.3), (0.45, height * 0.6), (0.0, height * 0.82)], sides=10, at=(width * 0.2, 0, depth * 0.1), col=(0.8, 0.7, 0.54), cls=S.SLAB, squash=(width / 3.4, depth / 2.6))
    return s.out(39, 0.05)

PROC = dict(dune=dune, well=well, hull=hull, mast=mast, derrick=derrick, anchor=anchor)
