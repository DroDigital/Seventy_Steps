"""The investigator's weapons in the right hand's frame (src/render/armsMeshes.ts: the grip at the wrist on the line (0, y, 0.02), the business end down -y,
the edge forward at +z). Lengths are the old ones, so a blow reaches as far as the hit boxes say it does. Round 78: the sword-cane has two bodies, the stick
it is carried as and the blade it is fought with.
"""
import numpy as np
from kit import Shape, bevel, box, cylinder, hull_points, lathe, loft, merge, mix, ring, shade, slab, sphere
from palette import BRASS, DARK, LEATHER, SILVER, STEEL, bone, charcoal, rust, sea

G = 0.02  # the grip's line, z


def blade_rings(spec, c, tip=True):
    """A blade through (y, half-thickness in x, half-width in z, centre z) rings, a four-sided section: edge forward. The last ring closes to a point if `tip`."""
    rs = [ring(y, hw, hd, 0.0, cz, n=4) for y, hw, hd, cz in spec]
    if tip:
        y, hw, hd, cz = spec[-1]
        rs[-1] = np.tile(np.array([0.0, y - 0.04, cz]), (4, 1))
    return loft(rs, c, caps=(True, not tip))


def cane_stick():
    """The sword-cane as it is carried: a dark shaft in its silver-capped sheath, a round silver knob, a brass band where the blade seats, a silver ferrule."""
    wood = shade(bone, 0.9)
    return [lathe([(-0.83, 0.014), (-0.78, 0.0155), (-0.1, 0.0185), (-0.04, 0.0185)], wood, n=8, cz=G),
            lathe([(-0.835, 0.006), (-0.8, 0.0165), (-0.77, 0.0165)], SILVER, n=8, cz=G),  # the ferrule
            lathe([(-0.07, 0.024), (-0.045, 0.024)], BRASS, n=8, cz=G),  # the band
            lathe([(-0.04, 0.03), (-0.01, 0.028), (0.015, 0.032), (0.04, 0.026), (0.058, 0.0)], SILVER, n=8, cz=G),  # the knob
            sphere(0.024, shade(SILVER, 1.1), at=(0, 0.032, G), detail=1)]


def cane_blade():
    """The sword drawn from it: the silver knob for a pommel, a small brass guard, a slim blade the length of the stick."""
    return [lathe([(-0.02, 0.026), (0.015, 0.03), (0.04, 0.024), (0.056, 0.0)], SILVER, n=8, cz=G),
            lathe([(-0.07, 0.016), (-0.03, 0.017)], shade(charcoal, 1.4), n=8, cz=G),  # the grip
            bevel(0.1, 0.012, 0.028, 0, -0.078, G, BRASS, 0.003),  # the guard
            blade_rings([(-0.085, 0.0085, 0.0165, G), (-0.4, 0.0075, 0.0145, G), (-0.82, 0.0045, 0.011, G), (-0.9, 0.0025, 0.006, G)], STEEL, tip=True)]


def axe():
    """A woodsman's axe: a long ash haft, a forged head with a bearded blade and a bright bit."""
    haft = shade(mix(rust, bone, 0.35), 1.3)
    iron = shade(charcoal, 1.4)
    bit = shade(bone, 1.1)
    head = np.array([[-0.026, -0.66, -0.035], [0.026, -0.66, -0.035], [-0.026, -0.8, -0.035], [0.026, -0.8, -0.035],  # the poll
                     [-0.026, -0.62, 0.06], [0.026, -0.62, 0.06], [-0.026, -0.8, 0.06], [0.026, -0.8, 0.06],  # the eye's front
                     [-0.005, -0.58, 0.19], [0.005, -0.58, 0.19], [-0.005, -0.86, 0.17], [0.005, -0.86, 0.17], [-0.004, -0.7, 0.235], [0.004, -0.7, 0.235]])  # the edge, its toe and beard
    return [lathe([(-0.9, 0.02), (-0.84, 0.024), (-0.4, 0.019), (-0.04, 0.022), (0.04, 0.03)], haft, n=8, cz=G),
            hull_points(head, iron),
            hull_points(np.array([[-0.006, -0.6, 0.17], [0.006, -0.6, 0.17], [-0.006, -0.85, 0.15], [0.006, -0.85, 0.15], [-0.003, -0.7, 0.238], [0.003, -0.7, 0.238]]), bit),
            bevel(0.056, 0.05, 0.056, 0, 0.0, G, iron, 0.01)]  # the butt's wedge


def razor():
    """A straight razor, open: horn scales in the fist, a thin steel blade clipped at its point."""
    horn = shade(mix(bone, charcoal, 0.4), 1.4)
    blade = np.array([[-0.0055, -0.085, 0.02], [0.0055, -0.085, 0.02], [-0.0055, -0.085, 0.06], [0.0055, -0.085, 0.06],
                      [-0.0035, -0.275, 0.02], [0.0035, -0.275, 0.02], [-0.0035, -0.25, 0.058], [0.0035, -0.25, 0.058]])
    return [bevel(0.03, 0.13, 0.034, 0, -0.03, G, horn, 0.005), bevel(0.036, 0.016, 0.038, 0, -0.09, G, BRASS, 0.003),
            hull_points(blade, shade(bone, 1.2))]


def rapier():
    """Zamacona's espada: a wire-bound grip, a brass pommel, a swept hilt with a cup and a knuckle-bow, a long triangular blade."""
    brass = BRASS
    return [lathe([(-0.115, 0.014), (-0.0, 0.016)], shade(charcoal, 1.2), n=6, cz=G),
            sphere(0.02, brass, at=(0, 0.018, G), detail=1),
            bevel(0.2, 0.014, 0.016, 0, -0.122, G, brass, 0.003),  # the quillons
            lathe([(-0.106, 0.012), (-0.118, 0.04), (-0.138, 0.044), (-0.15, 0.03)], brass, n=8, cz=G + 0.015),  # the cup
            slab(0.012, 0.13, 0.012, 0, -0.06, G + 0.08, brass, rx=0.15),  # the knuckle-bow, forward of the fist
            slab(0.012, 0.026, 0.07, 0, -0.01, G + 0.044, brass),
            blade_rings([(-0.15, 0.0075, 0.0125, G), (-0.6, 0.0055, 0.009, G), (-1.05, 0.003, 0.0045, G), (-1.09, 0.0015, 0.0025, G)], STEEL, tip=True)]


def cutlass():
    """Obed Marsh's cutlass: a brass shell guard over the knuckles, a broad blade that curves back from its edge and widens toward the point."""
    brass = shade(mix(rust, bone, 0.55), 1.3)
    spec = []
    for t in np.linspace(0, 1, 6):
        spec.append((-0.13 - 0.6 * t, 0.0085 - 0.003 * t, 0.026 + 0.018 * np.sin(np.pi * min(1, t * 1.15) * 0.8), G + 0.012 - 0.085 * t * t))
    return [lathe([(-0.12, 0.016), (-0.0, 0.018)], shade(charcoal, 1.3), n=6, cz=G),
            sphere(0.022, brass, at=(0, 0.014, G), detail=1),
            bevel(0.1, 0.014, 0.018, 0, -0.128, G, brass, 0.003),  # the quillons
            bevel(0.022, 0.014, 0.12, 0, -0.005, G + 0.07, brass, 0.003),  # the shell: a top bar, a bottom bar, and the front of it
            bevel(0.022, 0.014, 0.12, 0, -0.12, G + 0.07, brass, 0.003),
            bevel(0.022, 0.12, 0.014, 0, -0.062, G + 0.13, brass, 0.003),
            blade_rings(spec, mix(STEEL, rust, 0.12), tip=True)]


WEAPONS = {'cane': ('wood', cane_stick), 'cane_drawn': ('cloth', cane_blade), 'axe': ('wood', axe), 'razor': ('cloth', razor), 'rapier': ('cloth', rapier), 'cutlass': ('cloth', cutlass)}
