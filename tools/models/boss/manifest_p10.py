"""Pack 10, the colosseum (CC0): one oval of tiered seats with its arcade, cut into wedges to stand round Hastur's theatre (Carcosa: the audience's tiers and the arcade
behind them). The source is one mesh of 6,800 faces and a cylinder (its floor), which is left out."""
from manifest import M, add
import sources as S

COL = 'p10/CreativeTrio-Colosseum.glb'

WEDGE = [((0, 0, 0), (0.17633, 1, 0)), ((0, 0, 0), (0.17633, -1, 0)), ((1.1, 0, 0), (1, 0, 0))]

add(
    M('co_seg', COL, 'Coliseum', kit='p10', classes={'.': S.SLAB}, decimate=500, cut=WEDGE, fit={'scale': 10.0}, rot=90,
      solids=[(0, 2.075, 2.25, 1.04, 0, 6.907), (0, 0.0, 2.62, 1.04, 0, 6.907), (0, -2.075, 2.986, 1.04, 0, 6.907)])  # (three slices, each as wide as the wedge is there: a passage between two wedges is as wide as it looks),
)
