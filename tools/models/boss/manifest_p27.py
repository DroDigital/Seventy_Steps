"""Pack 27, 'Snake Statue' by Animex (Sketchfab, CC BY 4.0): a cobra coiled about a post, its hood raised. Yig's shrine in the coil takes it for its totem, stone-coloured and sized to the shrine."""
from manifest import M, add
import sources as S

add(
    M('yg_snake', 'p27/scene.gltf', None, kit='p27', cls=S.STONE, classes={'.': S.STONE}, fit={'height': 8}, decimate=900, solids=[[0.0, 0.3, 1.7, 1.8, 0.0, 8.0]], textures=('p27/textures/',)),
)
