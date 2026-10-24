"""Pack 11, KayKit's Space Base Bits (CC0): a colony's towers, tunnels, domes and landing pads, with their painted metal thrown away and their light and dark kept in a pale
stone (Zkauba's Yaddith: towers of a city left in a hurry, and the passages that join them overhead). Their windows, lamps and masts are not asked for."""
from manifest import M, add
import sources as S

DIR = 'p11/KayKit_Space_Base_Bits_1.0_FREE/Assets/fbx/'
PALE = (0.82, 0.76, 0.74)
DARK = (0.62, 0.54, 0.56)

def yd(id, file, k, **kw):
    return M(id, DIR + file + '.fbx', file, kit='p11', textures=(DIR,), cls=S.SLAB, classes={'.': S.SLAB}, fit={'scale': k}, recolour=kw.pop('recolour', PALE), **kw)

add(
    yd('yd_tower_tall', 'structure_tall', 6.0, solids='box'),
    yd('yd_tower_low', 'structure_low', 6.0, solids='box'),
    yd('yd_drill', 'drill_structure', 6.0, solids='box', recolour=DARK),
    yd('yd_tunnel', 'tunnel_straight_A', 6.0, solids='none'),
    yd('yd_dome_a', 'basemodule_A', 5.0, solids='box'),
    yd('yd_dome_e', 'basemodule_E', 5.0, solids='box', recolour=DARK),
)
