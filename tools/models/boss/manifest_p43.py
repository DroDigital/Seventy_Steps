"""Pack 43, 'Sewers Modular Assets' by RotoPoly (itch.io, CC0 1.0): pipes, barred grilles, a support, brick rubble and a stair, for the drowned vaults (round 79)."""
from manifest import M, add
import sources as S

TEX = ('p43/gltf/', 'p43/gltf/texture/')
def sw(id, file, **kw):
    kw.setdefault('cls', S.BRICK)
    return M(id, f'p43/gltf/{file}.gltf', None, kit='p43', textures=TEX, classes={'.': kw['cls']}, **kw)

add(
    sw('sw_pipe_big', 'big_pipe_01', cls=S.METAL, rx=90, fit={'height': 3.4}, solids='box', round=True),
    sw('sw_pipe_huge', 'huge_pipe', cls=S.METAL, fit={'height': 2.4}, solids='box', round=True),
    sw('sw_grille', 'metal_bars_with_door', cls=S.METAL, fit={'width': 3.3}, solids='box'),
    sw('sw_bars', 'metal_bars', cls=S.METAL, fit={'length': 3.1}, solids='box', rot=90),
    sw('sw_support', 'support_03', cls=S.METAL, fit={'height': 3.6}, solids='box'),
    sw('sw_rubble', 'brick_debris', cls=S.BRICK, fit={'width': 1.8}, solids='none'),
)
