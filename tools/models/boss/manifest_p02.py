"""Pack 02, Kenney's Nature Kit (CC0): standing stones, boulders and stumps, fences, reeds and lilies, a canoe, bridges and paths, cliff blocks and the like (Black Man's
menhirs, the marsh of Bokrug, the rock of the Other Gods, Martin's Beach's canoe). Flat-coloured low poly: the game keeps their light and dark."""
from manifest import M, add
import sources as S

G = 'p02/Models/GLTF format/'
ROCK = {'.': S.ROCK}
WOOD = {'.': S.WOOD}
LEAF = {'.': S.LEAF}

def nt(id, file, classes, **kw):
    return M(id, G + file + '.glb', kit='p02', classes=classes, **kw)

add(
    nt('nt_menhir_a', 'stone_tallE', ROCK, fit={'height': 5.2}, squash=(0.5, 1, 0.5), solids='box', round=True),
    nt('nt_menhir_b', 'stone_tallB', ROCK, fit={'height': 4.4}, solids='box', round=True),
    nt('nt_menhir_c', 'stone_tallH', ROCK, fit={'height': 5.8}, squash=(0.5, 1, 0.5), solids='box', round=True),
    nt('nt_menhir_d', 'stone_tallD', ROCK, fit={'height': 3.6}, solids='box', round=True),
    nt('nt_stone_flat', 'stone_largeD', ROCK, fit={'height': 1.0}, solids='box', round=True),
    nt('nt_canoe', 'canoe', WOOD, fit={'length': 4.2}, solids='box'),
    nt('nt_log', 'log_large', WOOD, fit={'length': 3.4}, solids='box'),
    nt('nt_stump', 'stump_oldTall', WOOD, fit={'height': 1.6}, solids='box', round=True),
    nt('nt_reed', 'plant_flatTall', LEAF, fit={'height': 1.6}, solids='none'),
    nt('nt_lily', 'lily_large', LEAF, fit={'width': 1.2}, solids='none', double=(S.LEAF,)),
    nt('nt_bush', 'plant_bushLarge', LEAF, fit={'height': 1.4}, solids='none'),
)
