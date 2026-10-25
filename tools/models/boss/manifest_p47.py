"""Pack 47, 'Retro Modular House Pack' by Elegant Crow (itch.io, CC0 1.0; the photographs that ship beside it have terms of their own and are not used): a boarded door and window, a pair of closed shutters,
a loose plank, a double window, a door and a flight of stairs, taken singly for the lodgings, farmhouses and cellars of the dungeons (round 77)."""
from manifest import M, add
import sources as S

TEX = ('p47/house/textures/',)
H = 'p47/house/models/'
def rh(id, path, **kw):
    kw.setdefault('cls', S.WOOD)
    return M(id, H + path + '.fbx', None, kit='p47', textures=TEX, classes={'.': kw['cls']}, **kw)

add(
    rh('rh_boarded_door', 'misc/door_planks/planks_single_door', fit={'height': 2.1}, solids='none'),
    rh('rh_boarded_window', 'misc/window_planks/planks_double_window', fit={'width': 2.2}, solids='none'),
    rh('rh_shutter', 'misc/window_shutters/shutters_double_closed_01', fit={'width': 2.0}, solids='none'),
    rh('rh_plank', 'misc/loose_planks/plank_loose_01', fit={'length': 1.4}, solids='none'),
    rh('rh_window', 'windows/double_windows/window_double_02', fit={'width': 2.6}, solids='none'),
    rh('rh_door', 'doors/single_doors/door_single_03', fit={'height': 2.8}, solids='none'),
    rh('rh_stair', 'misc/stairs/stair_medium_01', fit={'width': 2.0}, solids='box'),
)
