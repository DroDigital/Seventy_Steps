"""Round 125, what colour each point of a plant takes in the game (render/floraKit.ts reads the same numbers): a leaf's slot picks one of its
realm's leaf colours (data/propLooks.ts `leaves`, turned by the prop's seed so two trees of one variant turn differently), a needle the
realm's needles, moss, a dry leaf, the shade of a gill; the bark its realm's bark, darker at its foot, a birch's white and its marks, a
sawn or broken heart, a fungus's pale stalk.
"""
import math

LEAF = (0, 1, 2, 3)  # the realm's leaf colours
NEEDLE, NEEDLE_DARK, MOSS, DRY, GILL, GROWTH, TWIG = 4, 5, 6, 7, 8, 9, 10  # TWIG: a card of bare twigs, in its bark's colour
BARK, FOOT, BIRCH, MARK, HEART, STALK, GREY = 16, 17, 18, 19, 20, 21, 22


def bark_slot(spec):
    """The slot of a point of bark at p, th radians round its branch and `along` metres up it."""
    kind = spec.get('bark', 'bark')
    if kind == 'birch':
        def birch(p, th, along):
            band = math.sin(along * 7.3 + math.sin(th * 2.0) * 0.8)  # the dark lenticel bands and the black wounds where boughs fell
            if p.y < 0.45:
                return MARK if (math.sin(th * 5 + along * 9) > 0.2) else BIRCH
            return MARK if band > 0.82 or (math.sin(th * 3 + along * 2.3) > 0.93) else BIRCH
        return birch
    if kind == 'stalk':
        return lambda p, th, along: STALK
    if kind == 'grey':
        return lambda p, th, along: FOOT if p.y < 0.6 else GREY
    return lambda p, th, along: FOOT if p.y < 0.55 else BARK
