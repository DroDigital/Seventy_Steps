"""Pack 36, 'Gothic Cloaked Figure - Building Wall Statue' by INGSOC1984 (Sketchfab, CC BY 4.0): a cloaked figure standing on a flat back, a priest of Mu in relief for the risen R'lyeh's temple."""
from manifest import M, add
import sources as S

add(
    M('rl_priest', 'p36/scene.gltf', None, kit='p36', textures=('p36/textures/',), cls=S.STONE, classes={'.': S.STONE}, fit={'height': 3.4}, decimate=2400, solids='box'),
)
