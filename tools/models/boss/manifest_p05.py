"""Pack 05, the PSX Halloween graveyard (free version, with its texture archive): the cemetery's walls, iron, stones and dead trees (Simon Orne;
the sets of other places borrow its dead trees, rocks and graves). Retro, hand-painted 512 px textures: their light and dark is all the game keeps."""
from manifest import M, add
import sources as S

GY, T = 'p05a/HalloweenGraveyardFreeVersion.fbx', ('p05b',)
STONE = {'.': S.STONE}
METAL = {'.': S.METAL}
WOOD = {'.': S.WOOD}

def gy(id, sel, **kw):
    return M(id, GY, sel, kit='p05', textures=T, **kw)

add(
    gy('gy_wall', 'Wall', fit={'length': 4.0}, classes=STONE),
    gy('gy_pillar', 'WallCornerPillar', fit={'height': 1.5}, classes=STONE),
    gy('gy_rail', 'Railing', fit={'length': 4.7}, classes=METAL, solids='none'),
    gy('gy_stone_1', 'Tombstone1', fit={'height': 1.2}, classes=STONE),
    gy('gy_stone_4', 'Tombstone4', fit={'height': 1.05}, classes=STONE),
    gy('gy_stone_7', 'Tombstone7', fit={'height': 1.05}, classes=STONE),
    gy('gy_coffin', 'Coffin1', fit={'length': 2.1}, classes=WOOD, solids='none'),
    gy('gy_coffin_lid', 'CoffinLid1', fit={'length': 2.1}, classes=WOOD, solids='none'),
    gy('gy_grave', 'DirtGrave', fit={'length': 2.25}, classes={'.': S.ROCK}, solids='none'),
    gy('gy_tree_1', 'DeadTree1', fit={'height': 3.6}, classes={'.': S.WOOD}, solids='box', round=True),
    gy('gy_tree_2', 'DeadTree2', fit={'height': 4.5}, classes={'.': S.WOOD}, solids='box', round=True),
    gy('gy_flag', 'Floor_Road', fit={'length': 4.0}, classes={'.': S.COBBLE}, solids='none'),
)
