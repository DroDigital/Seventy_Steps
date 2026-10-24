"""Pack 23, 'Wajia flute' by 3D Vault (Sketchfab, CC BY 4.0): a bone flute, its finger holes along the shaft, stood on end and darkened to black bone: a pipe of the Daemon Pipers' organ,
graded from the foot of the court to its back by the planner's own scales."""
from manifest import M, add
import sources as S

SRC = 'p23/scene.gltf'
BLACK = (0.2, 0.19, 0.24)

add(
    M('wf_flute', SRC, None, kit='p23', cls=S.BONE, classes={'.': S.BONE}, fit={'height': 12}, rz=90, decimate=520, solids='box', round=True, recolour=BLACK),
    # the foot of it, the flared end and the first holes (the source's x runs 30 m, the flare at its near end): the shorter pipes of the ring, at the whole's own scale
    M('wf_flute_low', SRC, None, kit='p23', cls=S.BONE, classes={'.': S.BONE}, fit={'scale': 0.4}, rz=90, cut=[((2.6, 0, 0), (-1, 0, 0))], decimate=360, solids='box', round=True, recolour=BLACK),
)
