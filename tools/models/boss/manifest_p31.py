"""Pack 31, 'American Old Barn' by andrewriddle (Sketchfab, CC BY 4.0): a weathered barn with its trusses showing, decimated and fitted to stand as a barn-nave's frame in the Whateley farmhouse's hall."""
from manifest import M, add
import sources as S

add(
    M('wf_barn', 'p31/scene.gltf', None, kit='p31', textures=('p31/textures/',), cls=S.WOOD, classes={'.': S.WOOD}, fit={'width': 11}, decimate=1500, solids='auto'),
)
