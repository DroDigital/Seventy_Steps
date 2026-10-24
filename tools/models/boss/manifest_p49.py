"""Pack 49, 'Retro Fantasy Kit' by Kenney (kenney.nl, CC0 1.0): a column, a broken column, a barrel stack and a pulley, taken singly, for the monasteries and halls of the Dreamlands and the loft of the Whateleys (round 74)."""
from manifest import M, add
import sources as S

def kf(id, file, **kw):
    kw.setdefault('cls', S.STONE)
    return M(id, f'p49/glb/{file}.glb', None, kit='p49', textures=('p49/glb/Textures/',), classes={'.': kw['cls']}, **kw)

add(
    kf('kf_column', 'column', fit={'height': 4.2}, solids='box', round=True),
    kf('kf_column_broken', 'column-damaged', fit={'height': 3.0}, solids='box', round=True),
    kf('kf_barrels', 'barrels', cls=S.WOOD, fit={'width': 1.4}, solids='box', round=True),
    kf('kf_pulley', 'pulley', cls=S.WOOD, fit={'height': 1.6}, solids='none'),
)
