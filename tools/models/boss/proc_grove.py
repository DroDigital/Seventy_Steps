"""Forms of the places of the living, the buried and the leaning (round 71; proc.py's helpers, `M(src='proc:<name>', args={...})`): a hedge of grown-together
trunks, a pod, an arching root, a length of serpent, a cyclopean leaning slab, a pale hexagonal prism, a bone collar. Same frame and rules as
proc.py (x right, y up, z front); offline only; their licence is this repository's."""
import math
import numpy as np
import sources as S
from proc import Shape, box, lathe, ellipsoid, loft, BONE

BARK = (0.27, 0.2, 0.19)
FLESH = (0.48, 0.2, 0.24)

def hedge(length=4.0, height=9.0, depth=2.6, **_):
    """A length of the black grove's wall: trunks side by side that have grown into one another, flared at the foot, knotted, their limbs knitted overhead into a dark crown, a root or two reaching out along the ground."""
    s = Shape()
    rng = np.random.default_rng(31)
    n = max(2, round(length / 1.35))
    base = length / n * 0.5
    tops = []
    for i in range(n):
        r = base * (1.2 + rng.random() * 0.3)
        x = (-length / 2 + base * 1.5) + (length - 3 * base) * i / (n - 1)
        z = (rng.random() - 0.5) * depth * 0.3
        h = height * (0.78 + rng.random() * 0.14)
        lathe(s, [(r * 1.5, 0), (r * 1.1, 0.5), (r * 0.9, h * 0.3), (r * 1.05, h * 0.52), (r * 0.8, h * 0.78), (r * 0.6, h * 0.95)], sides=7, at=(x, 0, z),
              col=BARK, cls=S.WOOD, twist=rng.random(), squash=(1, max(0.7, depth * 0.4 / r)))
        tops.append((x, h * 0.94, z))
    for x in np.linspace(-length / 2 + base * 1.5, length / 2 - base * 1.5, n + 1)[1:-1]:  # the web between each pair, where they have grown together
        ellipsoid(s, (x, height * 0.34, 0), (0.7, height * 0.36, depth * 0.38), 4, 7, BARK, S.WOOD)
    for k, (x, y, z) in enumerate(tops):  # the crown: a mass of dark leaf, and limbs that reach across to the next trunk and out over the way
        ellipsoid(s, (x, y + height * 0.06, z), (base * 1.95, height * 0.11, depth * 0.4), 4, 8, (0.15, 0.17, 0.15), S.LEAF)
        nx, ny, nz = tops[(k + 1) % n]
        if k + 1 < n:
            loft(s, [(x, y - 0.4, z), ((x + nx) / 2, y + 0.6, (z + nz) / 2), (nx, ny - 0.4, nz)], [0.34, 0.3, 0.34], sides=5, col=BARK, cls=S.WOOD)
        side = 1 if k % 2 else -1
        loft(s, [(x, y - 0.8, z), (x + 0.2, y + 0.3, z + side * depth * 0.5), (x + 0.5, y + 0.9, z + side * depth * 0.95)], [0.32, 0.22, 0.1], sides=5, col=BARK, cls=S.WOOD)
    for k in range(max(2, n)):  # knots, in the colour of what is under the bark
        ellipsoid(s, (-length / 2 + rng.random() * length, height * (0.2 + rng.random() * 0.5), (rng.random() - 0.5) * depth * 0.5 + (depth * 0.3) * (1 if k % 2 else -1)), (0.3, 0.38, 0.3), 4, 6, FLESH, S.WOOD)
    for side in (-1, 1):  # roots along the ground
        x = (rng.random() - 0.5) * length * 0.6
        path = [(x, 1.1, side * depth * 0.3), (x + 0.3, 0.55, side * (depth * 0.5 + 0.2)), (x + 0.5, 0.2, side * (depth * 0.5 + 0.7))]
        loft(s, path, [0.36, 0.26, 0.14], sides=5, col=BARK, cls=S.WOOD)
    return s.out(41)

def pod(radius=0.6, **_):
    """A pod on a stalk, split along its length by a lighter seam, the colour of what it has in it showing."""
    s = Shape()
    lathe(s, [(radius * 0.22, 0), (radius * 0.14, radius * 1.2)], sides=5, col=BARK, cls=S.WOOD)
    ellipsoid(s, (0, radius * 2.0, 0), (radius * 0.85, radius * 1.1, radius * 0.8), 5, 9, (0.78, 0.36, 0.5), S.GLOW)
    box(s, radius * 0.1, radius * 1.4, radius * 0.1, at=(0, radius * 1.3, radius * 0.76), col=(0.22, 0.08, 0.14), cls=S.WOOD)
    return s.out(43, 0.05)

def root(span=7.0, height=3.4, radius=0.55, **_):
    """A root rising from the ground, going over and into it again some way off: an arch of grown wood, buttressed at both feet."""
    s = Shape()
    n = 9
    path = [(-span / 2 + span * i / (n - 1), height * math.sin(math.pi * i / (n - 1)) ** 0.8 + 0.1, 0.18 * math.sin(i * 1.7)) for i in range(n)]
    radii = [radius * (1.6 - 1.1 * math.sin(math.pi * i / (n - 1))) for i in range(n)]
    loft(s, path, radii, sides=6, col=BARK, cls=S.WOOD)
    for side in (-1, 1):
        ellipsoid(s, (side * span * 0.5, 0.2, 0), (radius * 2.2, radius * 1.0, radius * 1.8), 3, 7, BARK, S.WOOD)
        loft(s, [(side * span * 0.5, 0.5, 0), (side * (span * 0.5 + 0.9), 0.15, 0.7)], [radius * 0.5, radius * 0.2], sides=5, col=BARK, cls=S.WOOD)
    return s.out(47)

def serpent(length=8.0, radius=2.2, **_):
    """A length of an enormous snake's body lying along +x: a round back ridged in scales, its flank a little pale, half sunk in the ground by the caller."""
    s = Shape()
    n = 16
    path = [(-length / 2 + length * i / (n - 1), radius, 0) for i in range(n)]
    radii = [radius * (0.9 + 0.1 * math.cos(math.pi * i)) for i in range(n)]
    loft(s, path, radii, sides=9, col=(0.56, 0.46, 0.34), cls=S.STONE, squash=0.92)
    for i in range(0, n - 1, 2):  # a dorsal scute on each ridge
        box(s, length / n * 1.5, radius * 0.22, radius * 0.9, at=(path[i][0], radius * 1.88, 0), col=(0.46, 0.36, 0.26), cls=S.STONE, taper=0.7)
    return s.out(53)

def _skew(s, w, h, d, at, shift, col, cls):
    """A block whose top is shifted by (dx, dz) from its foot: a wall that leans."""
    x, y, z = at
    dx, dz = shift
    hw, hd = w / 2, d / 2
    b = [(x - hw, y, z - hd), (x + hw, y, z - hd), (x + hw, y, z + hd), (x - hw, y, z + hd)]
    t = [(x - hw + dx, y + h, z - hd + dz), (x + hw + dx, y + h, z - hd + dz), (x + hw + dx, y + h, z + hd + dz), (x - hw + dx, y + h, z + hd + dz)]
    q = lambda a, c, e, f: [(a, c, e), (a, e, f)]
    tris = []
    for i in range(4):
        j = (i + 1) % 4
        tris += q(b[i], b[j], t[j], t[i])
    tris += q(t[0], t[1], t[2], t[3]) + q(b[0], b[1], b[2], b[3])
    s.part(tris, (x + dx / 2, y + h / 2, z + dz / 2), col, cls)

def slab(width=5.0, height=7.0, thick=1.6, lean=0.1, **_):
    """A cyclopean slab of green-black masonry set a little out of true: three courses of block, each leaning on the last, the joints cut in."""
    s = Shape()
    y = 0.0
    shift = 0.0
    for k, (hk, wk) in enumerate(((0.38, 1.0), (0.34, 0.96), (0.28, 0.9))):
        step = height * hk * lean * (1.0 + 0.3 * k)
        _skew(s, width * wk, height * hk, thick * (1 - 0.07 * k), (0, y, shift), (0, step), (0.42 + 0.03 * k, 0.5 + 0.03 * k, 0.45), S.STONE)
        for j in (-1, 1):  # a joint's groove
            box(s, 0.12, height * hk * 0.92, thick * (1 - 0.07 * k) + 0.04, at=(j * width * wk * 0.17, y + height * hk * 0.04, shift + step * 0.5), col=(0.25, 0.3, 0.27), cls=S.STONE)
        y += height * hk
        shift += step
    return s.out(59)

def prism(radius=1.4, height=6.0, sides=6, **_):
    """A pale regular prism standing on its end, its top cut in a shallow point (the Elder Things' own masonry: no ornament, only the angle)."""
    s = Shape()
    lathe(s, [(radius, 0), (radius, height * 0.97), (radius * 0.86, height)], sides=sides, col=(0.8, 0.82, 0.86), cls=S.SLAB)
    lathe(s, [(radius * 1.06, 0), (radius * 1.06, height * 0.04)], sides=sides, col=(0.62, 0.64, 0.7), cls=S.SLAB)
    return s.out(61)

def collar(radius=0.9, **_):
    """A ring of bone to go about a pipe: a band with a knuckle at each of eight places round it."""
    s = Shape()
    lathe(s, [(radius * 1.12, 0), (radius * 1.22, 0.12), (radius * 1.22, 0.3), (radius * 1.12, 0.42)], sides=10, col=BONE, cls=S.BONE)
    for k in range(8):
        a = 2 * math.pi * k / 8
        ellipsoid(s, (math.cos(a) * radius * 1.2, 0.21, math.sin(a) * radius * 1.2), (0.16, 0.2, 0.16), 3, 5, (0.9, 0.86, 0.74), S.BONE)
    return s.out(67)

PROC = dict(hedge=hedge, pod=pod, root=root, serpent=serpent, slab=slab, prism=prism, collar=collar)
