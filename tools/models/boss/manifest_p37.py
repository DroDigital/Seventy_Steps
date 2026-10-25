"""Pack 37, 'Hourglass' by carismah (Sketchfab, CC BY 4.0): an antique hourglass in a turned frame, stood large for 'Umr at-Tawil's reversed sands and the Sculptor's studio."""
from manifest import M, add
import sources as S

add(
    M('uv_hourglass', 'p37/scene.gltf', None, kit='p37', textures=('p37/textures/',), cls=S.WOOD, classes={'.': S.WOOD}, fit={'height': 2.0}, decimate=2200, glass_alpha=0.97, solids='box', round=True),
)
