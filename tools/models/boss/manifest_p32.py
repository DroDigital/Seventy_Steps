"""Pack 32, 'Armillary sphere' by KRei (Sketchfab, CC BY 4.0): an engraved bronze armillary of crossing rings, decimated from nearly twenty thousand faces and stood large for 'Umr at-Tawil's platform and gate."""
from manifest import M, add
import sources as S

add(
    M('uv_armillary', 'p32/scene.gltf', None, kit='p32', textures=('p32/textures/',), cls=S.METAL, classes={'.': S.METAL}, fit={'height': 3.4}, decimate=2600, solids='box', round=True),
)
