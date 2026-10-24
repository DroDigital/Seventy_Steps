"""Pack 18, KayKit's dungeon pack (CC0): stone walls, pillars, doorways, stairs, tiles and rubble. The Ancient Ones' stair and the pale pillars of its court, set at
a size a ring of grown stone asks, and the like where a place wants plain cut stone."""
from manifest import M, add
import sources as S

DIR = 'p18/KayKit_Dungeon_Pack_1.1_FREE/Assets/fbx/'
TEX = ('p18/KayKit_Dungeon_Pack_1.1_FREE/Assets/textures',)

def dg(id, file, k=1.0, **kw):
    return M(id, DIR + file + '.fbx', file, kit='p18', textures=TEX, cls=S.STONE, classes={'.': S.STONE}, fit={'scale': k}, **kw)

add(
    dg('dg_stairs_wide', 'stairs_wide', solids='none'),
)
