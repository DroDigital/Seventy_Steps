"""Pack 35, 'Coral' by rkuhlf (Sketchfab, CC BY 4.0): seven colonies of coral, three taken singly, taken from their red to a pale encrusted bone for the drowned sanctuary of Y'ha-nthlei."""
from manifest import M, add
import sources as S

def coral(id, node, h):
    return M(id, 'p35/scene.gltf', '^' + node + '$', kit='p35', cls=S.BONE, classes={'.': S.BONE}, fit={'height': h}, solids='box', round=True, recolour=(0.8, 0.76, 0.68))

add(coral('yh_coral_a', 'Object_4', 1.5), coral('yh_coral_b', 'Object_8', 1.2), coral('yh_coral_c', 'Object_12', 2.0))
