"""Pack 03, Quaternius's Ultimate Stylized Nature (CC0): dead, maple and ordinary trees and rocks, cut down from three to eight thousand faces to a few hundred
(the black grove's living trunks, the burnt trees about Gorgon's manor, the rock of the Other Gods). One blend holds them all, told apart by name."""
from manifest import M, add
import sources as S

BLEND = 'p03/Quaternius-Ultimate-Stylized-Nature-source/Ultimate Stylized Nature/AllModels.blend'
TREE = {'Leaves|Leaf|Foliage': S.LEAF, '.': S.WOOD}
ROCK = {'.': S.ROCK}

def st(id, sel, classes, decimate, **kw):
    return M(id, BLEND, sel, kit='p03', classes=classes, decimate=decimate, fit=kw.pop('fit', {'scale': 1.0}), **kw)

add(
    st('st_maple_3', 'MapleTree_3', TREE, 900, solids='box', round=True),
    st('st_rock_1', 'Rock_1', ROCK, 160, solids='box', round=True),
    st('st_rock_3', 'Rock_3', ROCK, 200, solids='box', round=True),
    st('st_rock_4', 'Rock_4', ROCK, 200, solids='box', round=True),
    st('st_rock_5', 'Rock_5', ROCK, 200, solids='box', round=True),
)
