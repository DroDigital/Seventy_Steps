"""Pack 06, the PSX modular castle (Hutchinson's keep, the cemetery's gate and chapel, Zkauba's and others' stairs and towers)."""
from manifest import M, add
import sources as S

CASTLE = 'p06/gltf/PSX_Modular_Castle.glb'
STONE = {'.': S.STONE}

def cs(id, sel, **kw):
    return M(id, CASTLE, sel, kit='p06', **kw)

add(
    cs('cs_wall', 'Wall', fit={'width': 3.0}, classes=STONE),
    cs('cs_tower_corner', r'Tower1_\(Corner\)', classes=STONE, solids='box', round=True),
    cs('cs_tower', 'Tower2', classes=STONE, solids='box', round=True),
    cs('cs_temple', 'Temple', classes=STONE, solids='box'),  # (a chapel's inside is drawn, not walked: its doorway is too narrow for a body, and a room no body can leave is what the audits forbid)
    cs('cs_temple_tower', 'Temple_Tower', classes=STONE, solids='box', round=True),
    cs('cs_stairs_1', 'Stairs1', classes=STONE, solids='none'),
)
