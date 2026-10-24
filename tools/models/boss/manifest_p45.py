"""Pack 45, Poly Haven (CC0 1.0): 'Ornate Mirror 01', 'Modular Industrial Pipes 01', 'Wine Bottles 01' (the burgundy bottle) and 'Pine Roots' (Rob Tuytel and others), each reduced hard
for the Outsider's ballroom, the pipes of Muñoz's plant, the Old Man's bottle gallery and the cellars where roots break in (round 74)."""
from manifest import M, add
import sources as S

def ph(id, folder, **kw):
    return M(id, f'p45/{folder}/{folder}_1k.gltf', kit='p45', textures=(f'p45/{folder}/textures/',), **kw)

add(
    ph('ph_mirror', 'ornate_mirror_01', cls=S.METAL, classes={'.': S.METAL}, fit={'height': 3.2}, decimate=1100, solids='box'),
    ph('ph_pipes', 'modular_industrial_pipes_01', cls=S.METAL, classes={'.': S.METAL}, fit={'height': 2.6}, decimate=300, solids='box'),
    ph('ph_bottle', 'wine_bottles_01', select='wine_bottles_01_burgundy', cls=S.BONE, classes={'glass': S.BONE, 'seal': S.WOOD, 'label': S.CLOTH, '.': S.BONE}, fit={'height': 0.9}, decimate=420, solids='none', recolour=(0.12, 0.2, 0.13)),
    ph('ph_roots', 'pine_roots', cls=S.WOOD, classes={'.': S.WOOD}, fit={'width': 2.6}, decimate=350, solids='none'),
)
