"""Pack 08, the modular temple (CC0): sandstone columns in stacked courses, beams and arches, walls plain and ruined, doorways, towers, steps, floors, rubble,
vases and banners (the colonnades of Gorgon's porch, Yig's shrine, Bokrug's court, the Daemon Pipers' temple plinths, the Colossus's court; whatever a place
wants stood of cut sandstone). Each file is a piece a unit or two across, set here at `K` metres to the unit; a column is stood by its planner, course on course."""
from manifest import M, add
import sources as S

DIR = 'p08/Modular Temple/'
K = 2.4
SAND = {'.': S.SLAB}
CLOTH = {'Fabric|Blue|Red|Cloth': S.CLOTH, '.': S.SLAB}

def tp(id, file, classes=SAND, k=K, **kw):
    return M(id, DIR + file + '.obj', kit='p08', classes=classes, fit={'scale': k}, **kw)

add(
    tp('tp_col_base', 'Pillar_Large_Base', solids='box', round=True),
    tp('tp_col_mid', 'Pillar_Large_Middle', solids='box', round=True),
    tp('tp_col_top', 'Pillar_Large_Top', solids='none', round=True),
    tp('tp_beam', 'Pillar_Large_Beam', solids='none'),
    tp('tp_arch', 'Pillar_Large_Arch', solids='auto'),
    tp('tp_wall_mid', 'Wall_Straight_Middle', solids='box'),
    tp('tp_wall_win', 'Wall_Straight_Window_Tall', solids='auto'),
    tp('tp_doorway', 'Wall_Straight_Doorway_Large', solids='auto'),
    tp('tp_door_leaf', 'Wall_Straight_Door_Large', solids='box'),
    tp('tp_door_sun', 'Wall_Straight_Door_Sun', solids='box'),
    tp('tp_door_moon', 'Wall_Straight_Door_Moon', solids='box'),
    tp('tp_tower_bot', 'Tower_Bottom', solids='box'),
    tp('tp_tower_top', 'Tower_Top', solids='box'),
    tp('tp_stairs', 'Stairs_Steps_Straight', solids='none'),
    tp('tp_floor', 'Floor_Normal_Square', solids='none'),
    tp('tp_floor_ruin_1', 'Floor_Ruined_Straight_1', solids='none'),
    tp('tp_floor_ruin_2', 'Floor_Ruined_Corner_Inner_1', solids='none'),
    tp('tp_rubble_1', 'Prop_Rubble_1', solids='none'),
    tp('tp_rubble_2', 'Prop_Rubble_2', solids='none'),
    tp('tp_vase_1', 'Prop_Vase_1', solids='box', round=True),
    tp('tp_vase_2', 'Prop_Vase_2', solids='box', round=True),
    tp('tp_vase_3', 'Prop_Vase_3', solids='box', round=True),
    tp('tp_flag_sun', 'Prop_Flag_Sun', CLOTH, solids='none'),
    tp('tp_flag_moon', 'Prop_Flag_Moon', CLOTH, solids='none'),
    tp('tp_flag_stars', 'Prop_Flag_Stars', CLOTH, solids='none'),
    tp('tp_flag_eclipse', 'Prop_Flag_Eclipse', CLOTH, solids='none'),
)
