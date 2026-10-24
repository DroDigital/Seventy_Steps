"""Pack 30, 'Alembic' by FlukierJupiter (Sketchfab, CC BY 4.0): a copper alchemical still, its glass vessel kept (opaque, as every baked face is) and the whole taken to copper, stood in Charles le Sorcier's laboratory and sized to be read across a hall."""
from manifest import M, add
import sources as S

add(
    M('al_still', 'p30/scene.gltf', None, kit='p30', textures=('p30/textures/',), cls=S.METAL, classes={'.': S.METAL}, fit={'height': 1.5}, solids='box', recolour=(0.8, 0.5, 0.26)),
)
