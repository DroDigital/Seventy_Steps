"""Pack 15, Paul Wortmann's skull and bones debris (CC0): piles, ribcages, spines, skulls, limbs. The Daemon Pipers' bones (collars about the shafts, ribs braced between them,
heaps at their feet), and wherever a court has been left to its dead. Cut down from thousands of faces to a few hundred."""
from manifest import M, add
import sources as S

D = 'p15/dungeon_debris_-_skull_and_bones_2/'
B1, B2 = D + 'dungeon_skull_bone_debris_1.blend', D + 'dungeon_skull_bone_debris_2.blend'
BONE = {'.': S.BONE}

def bn(id, blend, sel, dec, **kw):
    return M(id, blend, sel, kit='p15', cls=S.BONE, classes=BONE, decimate=dec, fit=kw.pop('fit', {'scale': 1.0}), **kw)

add(
    bn('bn_pile_skull', B2, 'bone pile with skull', 420, solids='box', round=True),
    bn('bn_ribcage', B2, 'ribcage', 900, solids='none'),
    bn('bn_spine', B2, 'spine', 1100, solids='none'),
    bn('bn_leg', B2, 'leg', 200, solids='none'),
    bn('bn_skull_pyramid', B1, 'Skull.003_Skull.005', 450, solids='box', round=True),
)
