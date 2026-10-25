"""What the investigator carries, as the game's moves use it: the lantern at the belt, the revolver in its holster and in the hand, and the small things the
off-hand takes up for a move (the oil flask lobbed by `throw`, the Laudanum, West's Reagent in its syringe, the Powder of Ibn Ghazi, a match for the
lamp, the book of the incantation). Each is in the frame of the joint it hangs from or is held by (the hand's: the grip on the line (0, y, 0.02), the
business end down -y). Round 80: the props are new; the moves drew the hand empty before.
"""
import numpy as np
from kit import bevel, box, cylinder, hull_points, lathe, loft, merge, mix, prism, ring, shade, slab, sphere, torus, wedge
from palette import BRASS, DARK, LANTERN, LEATHER, PALE, SILVER, STEEL, bone, charcoal, rust, sea

PX, PY, PZ = 0.29, -0.005, 0.02  # where the lantern hangs from the belt (the pendulum's pivot: the `lantern` joint), in the torso's frame
LX, LY, LZ = 0.29, -0.255, 0.02  # the lantern's flame, in the torso's frame (the game's own light hangs there: src/render/investigator.ts)
FLAME_Y = LY - PY  # and in the lantern joint's
GREEN = np.array([0.17, 1.0, 0.63])  # Void Green, the anomaly colour: the Reagent glows it


def lantern_mount():
    """What the lantern hangs from, fixed on the belt (torso frame): a loop on the belt's end, a strap out to a brass clip over the lantern."""
    return [box(0.03, 0.075, 0.05, 0.225, -0.03, PZ, LEATHER),
            slab(0.022, 0.07, 0.024, (0.225 + PX) / 2, PY, PZ, LEATHER, rz=float(np.pi / 2)),
            bevel(0.03, 0.03, 0.03, PX, PY, PZ, BRASS, 0.006)]


def lantern():
    """The lantern as it swings (the `lantern` joint's frame: its pivot at the origin): three links of chain, the bail ring, the cage round the flame (the flame
    itself, `flame()`, is its own part: it gutters out with the mind)."""
    cage = shade(charcoal, 1.6)
    iron = shade(charcoal, 1.9)
    x, y, z = 0.0, FLAME_Y, 0.0
    s = [bevel(0.14, 0.022, 0.14, x, y - 0.085, z, cage, 0.006),  # the base plate
         bevel(0.12, 0.026, 0.12, x, y + 0.085, z, cage, 0.006),  # the cap's collar
         hull_points(np.array([[-0.06, 0.098, -0.06], [0.06, 0.098, -0.06], [-0.06, 0.098, 0.06], [0.06, 0.098, 0.06], [-0.014, 0.125, -0.014], [0.014, 0.125, -0.014], [-0.014, 0.125, 0.014], [0.014, 0.125, 0.014]]) + [x, y, z], cage)]  # the hood
    for sx in (-1, 1):
        for sz in (-1, 1):
            s.append(box(0.014, 0.17, 0.014, x + sx * 0.056, y, z + sz * 0.056, cage))  # the four bars
    ring_y = y + 0.125 + 0.015
    s.append(torus(0.026, 0.007, x, ring_y, z, iron, axis='z', n=8, m=4))  # the bail ring
    for i, ax in enumerate(('x', 'z', 'x')):  # the chain: links turned a quarter to one another
        s.append(torus(0.011, 0.0035, x, ring_y + 0.033 + 0.021 * (2 - i) + 0.0, z, shade(iron, 1.1), axis=ax, n=6, m=3))
    return s


def flame():
    """The flame, its box centred on the origin of its own joint (the game scales it by the lantern's gain; tests/lighting.test.ts keeps it there)."""
    return [hull_points(np.array([[0, -0.065, 0], [0.034, -0.02, 0], [-0.034, -0.02, 0], [0, -0.02, 0.034], [0, -0.02, -0.034], [0.022, 0.03, 0], [-0.022, 0.03, 0], [0, 0.03, 0.022], [0, 0.03, -0.022], [0, 0.065, 0]]), LANTERN)]


def holster():
    """The holster at the front of the left hip, outside the skirt, its grip standing out of it (the grip alone is `holstered_grip`: it is hidden when the gun is drawn)."""
    hx, hz = 0.15, 0.185
    return [bevel(0.066, 0.15, 0.076, hx, -0.12, hz, LEATHER, 0.012), bevel(0.036, 0.095, 0.022, hx, -0.005, 0.146, LEATHER, 0.008), bevel(0.07, 0.02, 0.08, hx, -0.045, hz, shade(LEATHER, 0.8), 0.006),
            bevel(0.02, 0.1, 0.01, hx + 0.036, -0.13, hz, shade(LEATHER, 0.7), 0.003)]  # (a strap round its leg)


def holstered_grip():
    hx, hz = 0.15, 0.185
    return [slab(0.044, 0.075, 0.052, hx, -0.01, hz - 0.006, shade(rust, 0.9), rx=0.3), box(0.024, 0.026, 0.05, hx, 0.032, hz - 0.03, DARK)]


def flask_belt():
    """An oil flask on the belt at the right front hip: a squat glass bottle, a rag in its neck."""
    glass = shade(mix(sea, bone, 0.2), 1.5)
    x, z = -0.13, 0.172
    return [lathe([(-0.2, 0.03), (-0.14, 0.04), (-0.07, 0.04), (-0.05, 0.016), (-0.025, 0.014)], glass, n=7, cx=x, cz=z),
            bevel(0.022, 0.04, 0.022, x, -0.0, z, shade(bone, 1.1), 0.004),  # the rag
            bevel(0.05, 0.016, 0.05, x, -0.205, z, shade(LEATHER, 0.9), 0.004)]  # a leather cup under it


def revolver():
    """The revolver in the hand, its bore along -y: grip, frame, six-chambered drum, barrel and sight (the tip at about y = -0.30; the flash sits there)."""
    wood, steel = shade(rust, 0.9), shade(charcoal, 1.7)
    return [bevel(0.045, 0.1, 0.06, 0, -0.06, 0.035, wood, 0.008),  # the grip
            bevel(0.05, 0.05, 0.075, 0, -0.125, 0.03, steel, 0.008),  # the frame
            lathe([(-0.196, 0.03), (-0.13, 0.03)], shade(steel, 1.12), n=6, cz=0.03),  # the drum
            lathe([(-0.30, 0.0105), (-0.196, 0.0135)], steel, n=6, cz=0.03),  # the barrel
            box(0.01, 0.018, 0.012, 0, -0.29, 0.046, shade(bone, 1.1)),  # the front sight
            bevel(0.016, 0.03, 0.03, 0, -0.1, 0.075, steel, 0.004),  # the trigger guard
            box(0.014, 0.02, 0.02, 0, -0.1, -0.008, shade(steel, 0.8))]  # the hammer


def oil_flask():
    """The lobbed flask in the hand: a bottle gripped by the neck, a rag trailing."""
    glass = shade(mix(sea, bone, 0.2), 1.5)
    return [lathe([(-0.27, 0.036), (-0.2, 0.046), (-0.14, 0.046), (-0.1, 0.018), (-0.05, 0.014)], glass, n=7, cz=0.02),
            bevel(0.026, 0.07, 0.026, 0, -0.025, 0.02, shade(bone, 1.1), 0.005),  # the rag in its neck
            slab(0.02, 0.09, 0.012, 0.012, -0.0, 0.02, shade(bone, 0.95), rz=-0.4)]  # its end hanging


def laudanum_bottle():
    glass = shade(mix(rust, charcoal, 0.65), 1.7)
    return [lathe([(-0.19, 0.026), (-0.1, 0.03), (-0.07, 0.014), (-0.03, 0.012)], glass, n=7, cz=0.02), bevel(0.02, 0.026, 0.02, 0, -0.02, 0.02, shade(rust, 1.3), 0.004)]


def syringe():
    """West's Reagent in a glass syringe: brass fittings, a bright shaft of Void Green."""
    return [lathe([(-0.2, 0.016), (-0.06, 0.016)], GREEN * 0.85, n=6, cz=0.02), bevel(0.044, 0.014, 0.044, 0, -0.058, 0.02, BRASS, 0.004), bevel(0.012, 0.09, 0.012, 0, 0.01, 0.02, SILVER, 0.002), bevel(0.04, 0.012, 0.04, 0, 0.06, 0.02, BRASS, 0.004),
            lathe([(-0.28, 0.002), (-0.2, 0.007)], SILVER, n=5, cz=0.02)]


def powder_packet():
    """The Powder of Ibn Ghazi in a twist of paper held in the fist, its mouth open."""
    return [bevel(0.07, 0.1, 0.045, 0, -0.1, 0.03, shade(bone, 1.2), 0.008), bevel(0.074, 0.02, 0.05, 0, -0.045, 0.03, shade(bone, 0.9), 0.004), bevel(0.05, 0.012, 0.03, 0, -0.04, 0.03, GREEN * 0.6, 0.002)]


def match():
    """A lucifer match for the lamp, its head a spark."""
    return [bevel(0.008, 0.11, 0.008, 0, -0.07, 0.02, shade(bone, 0.9), 0.0015), bevel(0.014, 0.02, 0.014, 0, -0.135, 0.02, shade(LANTERN, 1.0), 0.003)]


def book():
    """The little black book the incantation is read from, held open on the palm."""
    cover = shade(charcoal, 2.2)
    return [bevel(0.2, 0.014, 0.13, 0, -0.095, 0.09, cover, 0.004), bevel(0.088, 0.02, 0.118, -0.047, -0.087, 0.09, shade(bone, 1.15), 0.002), bevel(0.088, 0.02, 0.118, 0.047, -0.087, 0.09, shade(bone, 1.1), 0.002),
            bevel(0.012, 0.03, 0.12, 0, -0.092, 0.09, shade(cover, 0.8), 0.003)]
