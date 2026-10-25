"""Pack 50, 'Curtains' by Heliona (Sketchfab, CC BY 4.0): a rod and its two drapes, reduced to a third of their faces and hung against a wall (the pale drapery of Lilith's bridal canopy, round 77)."""
from manifest import M, add
import sources as S

add(
    M('cu_curtains', 'p50/scene.gltf', None, kit='p50', textures=('p50/textures/',), cls=S.CLOTH, classes={'curtain_holder': S.METAL, '.': S.CLOTH}, fit={'width': 4.4}, decimate=800, solids='none'),
)
