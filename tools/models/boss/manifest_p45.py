"""Pack 45, Poly Haven (CC0 1.0): 'Ornate Mirror 01', 'Modular Industrial Pipes 01', 'Old Military Compressor', 'Wine Bottles 01' (the burgundy bottle) and 'Pine Roots' (Rob Tuytel and others), each reduced hard
for the Outsider's ballroom, the pipes of Muñoz's plant, the Old Man's bottle gallery and the cellars where roots break in (round 74)."""
from manifest import M, add
import sources as S

def ph(id, folder, **kw):
    return M(id, f'p45/{folder}/{folder}_1k.gltf', kit='p45', textures=(f'p45/{folder}/textures/',), **kw)

add(
    ph('ph_mirror', 'ornate_mirror_01', cls=S.METAL, classes={'.': S.METAL}, fit={'height': 3.2}, decimate=1100, plane={'axis': 2, 'sign': 1, 'at': 0.007, 'tol': 0.0006}, solids='box'), # (round 74: its glass is a mirror)
    ph('ph_pipes', 'modular_industrial_pipes_01', cls=S.METAL, classes={'.': S.METAL}, fit={'height': 2.6}, decimate=300, solids='box'),
    ph('ph_bottle', 'wine_bottles_01', select='wine_bottles_01_burgundy', cls=S.GLASS, classes={'wine_light_red': S.LIQUID, 'glass_clear': S.GLASS, 'seal_cork': S.WOOD, 'intertwine': S.CLOTH, '.': S.GLASS}, fit={'height': 0.9}, decimate=420, solids='none', recolour=(0.12, 0.2, 0.13), recolour_not=(S.LIQUID, S.WOOD, S.CLOTH)),
    ph('ph_compressor', 'old_military_compressor', cls=S.METAL, classes={'glass': S.GLASS, '.': S.METAL}, fit={'height': 1.7}, decimate=700, solids='box'), # (round 74: its gauge's glass is glass)
    ph('ph_roots', 'pine_roots', cls=S.WOOD, classes={'.': S.WOOD}, fit={'width': 2.6}, decimate=350, solids='none'),
)
