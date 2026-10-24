"""Pack 09, Quaternius's Ultimate Modular Ruins (CC0): dead trees, columns, arches, ruined walls, floors, stairs, statues of beasts, torches, bones and
carts (the Gardner orchard, Gorgon's manor, Yig's and Bokrug's courts, Hastur's stage, Yog-Sothoth's gate, and wherever a place wants a stone that has
stood too long). The source's stone is detailed to 1,000-3,000 faces a piece: the baker reduces each to a few hundred, planar faces dissolved first."""
from manifest import M, add
import sources as S

DIR = 'p09/Ultimate-Modular-Ruins-Pack---Aug-2021-dev/'
TEX = (DIR + 'Textures',)
STONE = {'Main|Highlights|Stone': S.STONE}
SLAB = {'Main|Highlights': S.SLAB}

def rn(id, file, classes=None, decimate=300, **kw):
    return M(id, DIR + 'FBX/' + file + '.fbx', kit='p09', textures=TEX, classes=classes or {}, decimate=decimate, fit=kw.pop('fit', {'scale': 1.0}), **kw)

add(
    rn('rn_arch_goth', 'Arch_Gothic', STONE, 450, solids='auto'),
    rn('rn_wall_broken', 'Wall_Broken', STONE, 220, solids='box'),
    rn('rn_bricks', 'Bricks', STONE, 160, solids='box'),
    rn('rn_torch', 'Torch', None, 0, drop='Fire', anchor_of='Fire', solids='none'),
    rn('rn_flag', 'Flag_Wall', None, 0, solids='none'),
    rn('rn_cart', 'Cart', None, 420, solids='box'),
    rn('rn_barrel', 'Barrel', None, 200, solids='box', round=True),
)
