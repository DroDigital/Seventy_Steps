"""Pack 01, the retro medieval building kit (CC0): a farmhouse's plaster walls with their doors and windows, roof panels, posts and beams, a hearth,
a table, a bed (the Gardner place; Hutchinson's laboratory annex; the huts and halls of others). One scene, its pieces told apart by name."""
from manifest import M, add
import sources as S

KIT = 'p01/3D Retro Medieval Fantasy Kit/3D Retro Medieval Fantasy Kit.blend'
TEX = ('p01/3D Retro Medieval Fantasy Kit/Textures',)
PLASTER = {'.': S.STONE}
TIMBER = {'.': S.WOOD}
HEARTH = {'.': S.BRICK}

def fh(id, sel, classes=PLASTER, **kw):
    return M(id, KIT, sel, kit='p01', textures=TEX, classes=classes, fit=kw.pop('fit', {'scale': 1.0}), **kw)

add(
    fh('fh_wall', 'Wall A Plain', solids='box'),
    fh('fh_wall_door', 'Wall A Door', solids='auto'),
    fh('fh_wall_win', 'Wall A Window Small', solids='auto', bands=(0.9, 2.4)),
    fh('fh_wall_winl', 'Wall A Window Large', solids='auto', bands=(0.9, 2.4)),
    fh('fh_wall_thin', 'Wall C', solids='box'),
    fh('fh_roof_c', 'Wall Roof 45 Center', TIMBER, solids='none'),
    fh('fh_hearth', 'Fireplace', HEARTH, solids='box'),
    fh('fh_beam', 'Beam Long', TIMBER, solids='none'),
    fh('fh_beam_lean', 'Beam Long', TIMBER, rz=-28, solids='none'),
    fh('fh_beam_drop', 'Beam Long', TIMBER, rz=-62, solids='none'),
    fh('fh_post', 'Post Long', TIMBER, solids='box'),
    fh('fh_floor', 'Floor Thick', TIMBER, solids='none'),
    fh('fh_table', 'Table Large', TIMBER, solids='box'),
    fh('fh_bed', 'Bed Double', TIMBER, solids='box'),
    fh('fh_trunk', 'Trunk', TIMBER, solids='box'),
    fh('fh_crate', 'Crate', TIMBER, solids='box'),
    fh('fh_stove', 'Stove', {'.': S.METAL}, solids='box'),
    fh('fh_shelf', 'Bookshelf', TIMBER, solids='box'),
    fh('fh_pane', 'Window Large', TIMBER, rx=90, solids='none'),  # laid flat: a skylight
)
