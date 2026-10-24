"""Pack 19, 'Dead trees (Low-poly)' by Goth Scarecrow (itch.io, CC0): ten gnarled dead trunks with their limbs, for the groves and the orchards that have died (their pixel
foliage, grass and bushes are not asked for). The heavier ones are cut down to a few hundred faces."""
from manifest import M, add
import sources as S

def gt(id, obj, tris, h, **kw):
    return M(id, 'p19/Deadtrees.glb', '^' + obj + '$', kit='p19', cls=S.WOOD, classes={'.': S.WOOD}, fit={'height': h}, decimate=tris, solids='trunk', round=True, **kw)

# the six that stand: the branchy ones about the groves and the orchard, the bare ones on the island's rim
add(*[gt(f'gt_dead_{n}', f'Deadtree{n}' if n != 8 else 'DeadTree8', t, 10.0) for n, t in ((3, 900), (4, 900), (5, 900), (6, 900), (8, 540), (9, 500))])
