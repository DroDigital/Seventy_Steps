"""Pack 17, bobjh's columnar basalt (CC BY 4.0: credit and a note of the changes are in src/data/models/CREDITS.md): hexagonal columns grown together in clusters and
broken at different heights. The weathered outer edge of the Ancient Ones' ground, and the black stone of Nug and Yeb's shrine. The textures are replaced by the stone's own
light and dark."""
from manifest import M, add
import sources as S

BLEND = 'p17/basalt_columns/columns.blend'
BASALT = (0.34, 0.34, 0.37)

def bs(id, sel, k, **kw):
    return M(id, BLEND, sel, kit='p17', cls=S.ROCK, classes={'.': S.ROCK}, fit={'scale': k}, recolour=kw.pop('recolour', BASALT), **kw)

add(
    bs('bs_low', 'basalt_columns', 3.2, solids='box', round=True),
    bs('bs_mid', 'basalt_columns2', 3.2, solids='box', round=True),
    bs('bs_a', 'basalt_columns3', 4.5, solids='box', round=True),
    bs('bs_b', 'basalt_columns4', 4.5, solids='box', round=True),
    bs('bs_c', 'basalt_columns5', 4.5, solids='box', round=True),
)
