"""Pack 52, 'Old Gramophone' by KIFIR (Sketchfab, CC BY 4.0): a gramophone with its horn, its turntable and a needle arm, decimated, for Akeley's study (round 77)."""
from manifest import M, add
import sources as S

add(
    M('og_gramophone', 'p52/scene.gltf', None, kit='p52', textures=('p52/textures/',), cls=S.WOOD, classes={'.': S.WOOD}, fit={'height': 1.15}, decimate=1100, solids='box'),
)
