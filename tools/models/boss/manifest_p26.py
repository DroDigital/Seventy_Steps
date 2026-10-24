"""Pack 26, 'Theatre stage' by mynameismary (Sketchfab, CC BY 4.0): its curtains only (two drapes and the swagged valance above them; the stage, walls and ropes are not asked for),
taken from their red to the yellow of the King's, for Hastur's stage house."""
from manifest import M, add
import sources as S

add(
    M('hs_curtain', 'p26/scene.gltf', None, kit='p26', textures=('p26/textures/', 'p26/'), cls=S.CLOTH, classes={'.': S.CLOTH}, fit={'width': 16},
      drop=['^6__0$', '^material$', '^material_2$', '^walls$', r'^walls\.1$', '^stage$'], solids='none', recolour=(0.86, 0.68, 0.2)),
)
