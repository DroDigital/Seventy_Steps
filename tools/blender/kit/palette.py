"""The game's colours (render/palette.ts), as display-sRGB triples: what the vertex colours carry.

Each creature palette has a dark, mid and light; BASE is the world's charcoal, bone, rust and sea-grey;
ANOMALY the three saturated hues that alone mean something is wrong (spec §2). Saturation anywhere
else breaks the look: glowing marks and eyes take an anomaly hue or a pale bone, nothing else.
"""


def hexrgb(h):
    n = int(h[1:], 16)
    return ((n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255)


CREATURE = {
    'sea': ('#26312f', '#52625d', '#8c9a90'),
    'bone': ('#4a4538', '#9a927c', '#d9d0b8'),
    'charcoal': ('#121114', '#2e2c32', '#4e4b54'),
    'rust': ('#2e1e18', '#5e3a2c', '#8f6a58'),
    'flesh': ('#4a3530', '#8a6a60', '#c4a393'),
    'fungus': ('#4a3a3e', '#8a6d72', '#bfa3a6'),
    'rubber': ('#0d0d10', '#24242c', '#40404c'),
    'pallid': ('#5a5a58', '#a8a8a2', '#e2e0d8'),
    'mold': ('#232a20', '#45503c', '#717c62'),
    'sand': ('#3e3526', '#7a6a4c', '#b3a27c'),
    'ichor': ('#0b0b0e', '#1e1c24', '#383442'),
    'stone': ('#34343a', '#66666a', '#9a9894'),
}
BASE = {'charcoal': hexrgb('#1d1c1f'), 'bone': hexrgb('#d9d0b8'), 'rust': hexrgb('#74493a'), 'seaGrey': hexrgb('#5d6c70')}
ANOMALY = {'magenta': hexrgb('#D80073'), 'purple': hexrgb('#6A0DAD'), 'green': hexrgb('#2BFFA0')}


def mix(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def shade(c, k):
    return tuple(min(1.0, x * k) for x in c)


class Palette:
    """A creature's colours: `dark`, `mid`, `light` of its palette, `glow` (its anomaly hue, or a pale
    bone where it has none), and any other palette by name (`p['bone'].light`)."""

    def __init__(self, name, glow=None):
        self.name = name or 'charcoal'
        self.dark, self.mid, self.light = (hexrgb(h) for h in CREATURE[self.name])
        self.glow_name = glow
        self.glow = ANOMALY[glow] if glow else shade(BASE['bone'], 1.0)
        self.base, self.anomaly = BASE, ANOMALY

    def __getitem__(self, name):
        return Palette(name)

    def lit(self, c, k=1.0):
        """A colour that glows `k` of the way (an eye, a mark)."""
        return (tuple(c), k)
