"""Pack 34, 'Brazier' by Jochon (Sketchfab, CC BY 4.0): a footed iron brazier with a deep bowl; its fire is laid over it by the game (a flame anchor at the bowl's rim)."""
from manifest import M, add
import sources as S

add(
    M('ss_brazier', 'p34/scene.gltf', None, kit='p34', textures=('p34/textures/',), cls=S.METAL, classes={'.': S.METAL}, fit={'height': 1.7}, solids='box', round=True, anchors=[(0.0, 1.55, 0.0)]),
)
