"""The Blender kit for the creatures' models (docs/MODELS.md). A creature's script imports from here."""

from .anim import Clip, add, lerp, mirror, scale, sym, wave
from .core import Kit
from .gait import BIPED, BOUND, TRIPOD, TROT, WALK4, walk
from .geo import add as vadd, gradient, lerp3, mul as vmul, norm, rot, sub as vsub
from .ik import leg, plant
from .palette import ANOMALY, BASE, Palette, mix, shade

__all__ = [
    'Clip', 'Kit', 'Palette', 'ANOMALY', 'BASE', 'BIPED', 'BOUND', 'TRIPOD', 'TROT', 'WALK4',
    'add', 'lerp', 'mirror', 'scale', 'sym', 'wave', 'walk', 'leg', 'plant', 'mix', 'shade',
    'vadd', 'vsub', 'vmul', 'lerp3', 'norm', 'rot', 'gradient',
]
