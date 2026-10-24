"""Pack 16, Kenney's hexagon kit (CC0): hexagonal tiles, plain, hilled, mountained and built upon, thrown to a pale stone: the Ancient Ones' hexagons (paving of tiles,
prisms standing from them, a ring of walled hexes). One hex is a metre across the flats in the source; here it is eight."""
from manifest import M, add
import sources as S

DIR = 'p16/Models/FBX format/'
TEX = ('p16/Models/Textures',)
PALE = (0.86, 0.88, 0.9)
HX = 8.0

def hx(id, file, sel, **kw):
    return M(id, DIR + file + '.fbx', sel, kit='p16', textures=TEX, cls=S.SLAB, classes={'.': S.SLAB}, fit={'scale': kw.pop('k', HX)}, recolour=kw.pop('recolour', PALE), **kw)

add(
    hx('hx_tile', 'stone', 'stone', solids='none', squash=(1, 0.2, 1)),
    hx('hx_hill', 'stone-hill', 'stone_hill', solids='box'),
    hx('hx_mountain', 'stone-mountain', 'stone_mountain', solids='box'),
    hx('hx_rocks', 'stone-rocks', 'stone_rocks', solids='box'),
    hx('hx_tower', 'building-tower', 'building_tower', solids='box'),
)
