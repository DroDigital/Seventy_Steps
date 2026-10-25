"""Pack 39, 'Stone Altar' by TheoClarke (Sketchfab, CC BY 4.0): a rough table-stone on its supports, fitted to the length of Sentinel Hill's summit altar."""
from manifest import M, add
import sources as S

add(
    M('sh_altar', 'p39/scene.gltf', None, kit='p39', textures=('p39/textures/',), cls=S.ROCK, classes={'.': S.ROCK}, fit={'length': 4.4}, decimate=1800, solids='box'),
)
