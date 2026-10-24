"""Pack 22, 'Roman theater of Palmyra' by Marin PETTE (Sketchfab, CC BY 4.0): the cavea of a Roman theatre, its tiers and stairs, and the columns of its stage front. One wedge of the
bowl (twenty degrees of it, the apex and the outer rows cut away) stands fourteen times about the fight in Hastur's Carcosa, and two of the columns stand before its stage house.
The bowl's centre is (0, -30) in the scene (its tiers run from 40 m out to 80 m, rising twelve metres) and its axis is the scene's -y."""
import math
from manifest import M, add
import sources as S

SRC = 'p22/scene.gltf'
_s, _c = math.sin(math.radians(10)), math.cos(math.radians(10))
# the wedge: both sides through the centre, the apex trimmed at 36 m, the outer rows cut at 68 m (keeping the side each normal points to)
WEDGE = [((0, -30, 0), (-_c, -_s, 0)), ((0, -30, 0), (_c, -_s, 0)), ((0, -66, 0), (0, -1, 0)), ((0, -98, 0), (0, 1, 0))]

# the wedge is placed 40.3 m out, its tiers rising away from the stage: the whole of it is one solid in five stepped slices (z from the stage end, the half-width the wedge has at the slice's
# outer edge, the height of the tiers there), so the vomitory's tunnel, which a body could otherwise find the way into, is filled
SLICES = [[0.0, 8.62, 5.97, 2.2, 0.0, 2.4], [0.0, 4.31, 6.73, 2.2, 0.0, 4.2], [0.0, 0.0, 7.49, 2.2, 0.0, 5.3], [0.0, -4.31, 8.25, 2.2, 0.0, 6.9], [0.0, -8.62, 9.0, 2.2, 0.0, 7.51]]

def col(id, obj, h, tris):
    return M(id, SRC, obj, kit='p22', cls=S.SLAB, classes={'.': S.SLAB}, fit={'height': h}, decimate=tris, solids='box', round=True)

add(
    M('hs_cavea', SRC, 'Gradins.*|Marches.*', kit='p22', cls=S.SLAB, classes={'.': S.SLAB}, cut=WEDGE, fit={'scale': 0.75}, rot=180, decimate=700, solids=SLICES),
    col('hs_col_tall', r'Cylinder\.000_0', 17.6, 220),
    col('hs_col_mid', r'Cylinder\.004_0', 12.5, 200),
)
