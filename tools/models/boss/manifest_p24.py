"""Pack 24, 'Egyptian Temple' by Bruno Macchioni (Sketchfab, CC BY 4.0): a temple of thin planes laid out from its pylon back through its courts and halls. The Colossus's temenos takes its front: the
two sloping towers of the pylon with the gate between them, cut out of the whole (everything behind it left out) and sized to the gate of the court."""
from manifest import M, add
import sources as S

SRC = 'p24/scene.gltf'
# game z -740..-585 is Blender y 585..740 (to_game: (x, y, z) -> (x, z, -y)): the pylon's slab, its front face at the near end
SLAB = [((0, 740, 0), (0, -1, 0)), ((0, 585, 0), (0, 1, 0))]

# the two towers (the gate between them, 9.4 m, is open; the lintel above it is not walled): about 28 m across at the foot, 9.4 m deep, rising some 30 m
TOWERS = [[-18.9, 0.3, 14.05, 4.7, 0.0, 30.0], [18.9, 0.3, 14.05, 4.7, 0.0, 30.0]]

add(
    M('eg_pylon', SRC, r'Material.*', kit='p24', cls=S.STONE, classes={'.': S.STONE}, fit={'scale': 0.08}, cut=SLAB, double=(S.CLOTH, S.LEAF, S.STONE), solids=TOWERS),
)
