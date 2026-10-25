"""Pack 53, 'old church bell' by vertexgrocer (Sketchfab, CC BY 4.0): a bronze bell, decimated, hung in the windowless steeple of the Starry Wisdom church (round 79)."""
from manifest import M, add
import sources as S

add(
    M('cb_bell', 'p53/scene.gltf', None, kit='p53', textures=('p53/textures/',), cls=S.METAL, classes={'.': S.METAL}, fit={'height': 1.5}, decimate=1500, solids='none', round=True),
)
