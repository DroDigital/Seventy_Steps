"""Pack 28, 'Temple Ruins Asset Pack' by Bl4ckGh0st (Sketchfab, CC BY 4.0): a kit of broken temple stone: pillars whole and broken, archways, wall pieces with windows, stairs, and five statues in
poses. The Gorgon's burned house takes its stone people, the columns of its porch (whole, broken, very broken), the arches of its doorways and the broken windows of its wings."""
from manifest import M, add
import sources as S

SRC = 'p28/scene.gltf'
TEX = ('p28/textures/',)
STONE = (0.74, 0.7, 0.66)

def piece(id, name, k, **kw):
    return M(id, SRC, name, kit='p28', cls=S.STONE, classes={'.': S.STONE}, fit={'scale': k}, textures=TEX, **kw)

def statue(id, name):
    return M(id, SRC, name, kit='p28', cls=S.STONE, classes={'.': S.STONE}, fit={'height': 2.1}, textures=TEX, decimate=900, solids='box', round=True)

K = 14  # the pillars' scale: the tall one 0.5 in the source stands 7 m
add(
    statue('tr_statue_a', 'Stone_Statue_PoseA_M_Stone1_0'),
    statue('tr_statue_b', 'Stone_Statue_PoseB_M_Stone1_0'),
    statue('tr_statue_c', 'Stone_Statue_PoseC_M_Stone1_0'),
    statue('tr_statue_d', 'Stone_Statue_PoseD_M_Stone1_0'),
    statue('tr_statue_e', 'Stone_Statue_M_Stone1_0'),
    piece('tr_pillar_tall', 'Stone_Pillar_Tall_M_Stone2_0', K, solids='box', round=True),
    piece('tr_pillar_tall_b', 'Stone_Pillar_Tall_Broken_M_Stone2_0', K, solids='box', round=True),
    piece('tr_pillar', 'Stone_Pillar_M_Stone2_0', K, solids='box', round=True),
    piece('tr_pillar_b', 'Stone_Pillar_Broken_M_Stone2_0', K, solids='box', round=True),
    piece('tr_pillar_vb', 'Stone_Pillar_Very_Broken_M_Stone2_0', K, solids='box', round=True),
    piece('tr_arch', 'Stone_Archway_M_Stone1_0', 9.6, solids='auto'),
    piece('tr_arch_b', 'Stone_Archway_Broken_M_Stone1_0', 9.6, solids='auto'),
    piece('tr_wall_win_b', 'Small_Stone_Wall_Window_Broken_M_Stone1_0', 9.6, solids='box'),
    piece('tr_wall_b', 'Small_Stone_Wall_Plain_Broken_M_Stone1_0', 9.6, solids='box'),
)
