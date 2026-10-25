"""Pack 42, 'Modular Cathedral Kit' by SigilsVault (itch.io, CC0 1.0): its two columns and a railing, for the church, the cellars and the ballroom (round 79)."""
from manifest import M, add
import sources as S

TEX = ('p42/Textures/1024x1024/', 'p42/Textures/')
def ca(id, file, **kw):
    return M(id, f'p42/glb/{file}.glb', None, kit='p42', textures=TEX, cls=S.STONE, classes={'.': S.STONE}, **kw)

add(
    ca('ca_column', 'column_01', fit={'height': 5.4}, solids='box', round=True),
    ca('ca_column_small', 'column_small_01', fit={'height': 3.0}, solids='box', round=True),
    ca('ca_railing', 'railing_01', fit={'width': 2.4}, solids='box'),
)
