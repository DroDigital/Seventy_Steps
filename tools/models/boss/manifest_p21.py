"""Pack 21, 'Modular Wooden Pier' from Poly Haven (CC0): the planks of a pier's deck and the poles of its frame, one section each. Martin's Beach takes them for the boardwalk from the gate to the sand."""
from manifest import M, add
import sources as S

SRC = 'p21/modular_wooden_pier_1k.gltf'
TEX = ('p21/textures/',)

add(
    M('mp_deck', SRC, 'modular_wooden_pier_planks', kit='p21', cls=S.WOOD, classes={'.': S.WOOD}, fit={'length': 2.2}, decimate=420, solids='none', textures=TEX),
    M('mp_frame', SRC, 'modular_wooden_pier_poles', kit='p21', cls=S.WOOD, classes={'.': S.WOOD}, fit={'scale': 1.0}, decimate=700, solids='none', textures=TEX),
)
