"""Round 125, the light a plant keeps in itself, baked into its points: how much of the sky each point of bark and each corner of a leaf
card sees past the plant's own wood (which stops the light) and leaves (which let some through: a card's cover, the share of its cell
the leaves fill), with the ground below. Rays from Blender's own BVH (mathutils.bvhtree), weighted toward the sky; the result is a
multiplier the game lays over each point's colour (inner leaves darker, the crown's top paler, the trunk dark under it). Smooth normals
for the bark, its seams welded.
"""
import math
from mathutils import Vector
from mathutils.bvhtree import BVHTree

AO_FLOOR = 0.3  # the darkest a point is kept (the PS1's floor: a crown's heart is dark, not black)
RAYS = 64  # directions over the sphere; each point uses the half about its normal
REACH = 9.0  # metres a ray is followed


def sphere(n):
    """n directions spread evenly over the sphere (Fibonacci)."""
    out = []
    g = math.pi * (3 - math.sqrt(5))
    for k in range(n):
        y = 1 - (k + 0.5) / n * 2
        r = math.sqrt(max(0.0, 1 - y * y))
        out.append(Vector((math.cos(g * k) * r, y, math.sin(g * k) * r)))
    return out


DIRS = sphere(RAYS)


def smooth_normals(mesh):
    acc = [Vector((0.0, 0.0, 0.0)) for _ in mesh.pos]
    for a, b, c in mesh.tris:
        n = (mesh.pos[b] - mesh.pos[a]).cross(mesh.pos[c] - mesh.pos[a])  # area-weighted
        for i in (a, b, c):
            acc[i] += n
    twins = {}
    for i, p in enumerate(mesh.pos):
        twins.setdefault((round(p.x, 4), round(p.y, 4), round(p.z, 4)), []).append(i)
    for group in twins.values():
        s = sum((acc[i] for i in group), Vector((0.0, 0.0, 0.0)))
        for i in group:
            acc[i] = s
    mesh.normal = [n.normalized() if n.length > 1e-12 else Vector((0.0, 1.0, 0.0)) for n in acc]


def bake(wood, cards, leaf=None):
    """Fills the normals and each point's AO (wood.ao, leaf.ao, card.ao), by rays through the plant."""
    smooth_normals(wood)
    verts = [p.copy() for p in wood.pos]
    polys = [list(t) for t in wood.tris]
    if leaf:
        smooth_normals(leaf)
        k = len(verts)
        verts.extend(p.copy() for p in leaf.pos)
        polys.extend([a + k, b + k, c + k] for a, b, c in leaf.tris)
    cover = [1.0] * len(polys)
    solid = len(polys)  # the faces below this are closed solids (bark, caps): a ray leaving one from inside is not stopped by it
    for c in cards:
        k = len(verts)
        verts.extend(c.corners())
        polys.append([k, k + 1, k + 2])
        polys.append([k, k + 2, k + 3])
        cover.extend([c.opacity, c.opacity])
    tree = BVHTree.FromPolygons(verts, polys, all_triangles=True)
    first = len(wood.tris) + (len(leaf.tris) if leaf else 0)  # card k's own faces are first + 2k and first + 2k + 1: it does not shade itself

    def seen(p, n, own=-1):
        total, weight = 0.0, 0.0
        for d in DIRS:
            cos = d.dot(n)
            if cos <= 0.02:
                continue
            w = cos * (0.45 + 0.55 * max(0.0, d.y))  # the sky's light falls from above
            through = 1.0
            o = p + n * 0.02 + d * 0.01
            left = REACH
            if d.y < -1e-3:  # the ground: what reaches it is lit only by what the ground gives back
                left = min(left, (o.y + 0.02) / -d.y)
                ground = True
            else:
                ground = False
            for _ in range(6):
                hit, hn, idx, dist = tree.ray_cast(o, d, left)
                if hit is None:
                    break
                inside = idx < solid and hn.dot(d) > 0  # (a bough's collar, inside its parent, takes the light its parent's skin there takes)
                if idx not in (own, own + 1) and not inside:
                    through *= 1.0 - cover[idx]
                if through < 0.03:
                    break
                o = hit + d * 0.004
                left -= dist + 0.004
                if left <= 0:
                    break
            if ground:
                through *= 0.22
            total += w * through
            weight += w
        return total / max(weight, 1e-9)

    wood.ao = [AO_FLOOR + (1 - AO_FLOOR) * seen(p, n) ** 0.85 for p, n in zip(wood.pos, wood.normal)]
    if leaf:
        leaf.ao = [AO_FLOOR + (1 - AO_FLOOR) * seen(p, n) ** 0.85 for p, n in zip(leaf.pos, leaf.normal)]
    for k, c in enumerate(cards):
        c.ao = [AO_FLOOR + (1 - AO_FLOOR) * seen(q, c.normal, first + 2 * k) ** 0.85 for q in c.corners()]
