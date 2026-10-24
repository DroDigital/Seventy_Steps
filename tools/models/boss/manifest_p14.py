"""Pack 14, LoFi3D's modular pipes (CC0): straight runs, bends, tees and caps, stood on end and darkened to black stone: the Daemon Pipers' organ, shafts of graded height
with their mouths open at the top (a run stood upon a run), and what joins them."""
from manifest import M, add
import sources as S

DIR = 'p14/Modular_Pipes/obj/'
TEX = ('p14/Modular_Pipes/tex',)
BLACK = (0.2, 0.2, 0.25)

def dp(id, file, **kw):
    return M(id, DIR + file + '.obj', kit='p14', textures=TEX, cls=S.STONE, classes={'.': S.STONE}, fit={'scale': kw.pop('k', 1.7)}, recolour=BLACK, **kw)

add(
    dp('dp_pipe_4', 'Pipe_4m', rz=90, squash=(1.5, 1, 1.5), solids='box', round=True),
    dp('dp_pipe_open', 'Pipe_2m_open', rz=90, squash=(1.5, 1, 1.5), solids='box', round=True),
)
