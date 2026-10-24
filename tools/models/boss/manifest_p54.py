"""Pack 54, 'Bust of Apollo' by davdadams (Sketchfab, CC BY 4.0): a scan of a marble head and shoulders (121,000 faces), reduced to two thousand, for the dreamer's studio at the top of the Sculptor's Tower (round 74)."""
from manifest import M, add
import sources as S

add(
    M('ba_bust', 'p54/scene.gltf', None, kit='p54', textures=('p54/textures/',), cls=S.STONE, classes={'.': S.STONE}, fit={'height': 1.1}, decimate=2000, solids='box', round=True),
)
