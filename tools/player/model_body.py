"""The investigator's body, part by part, each written in its joint's own frame (src/render/figures.ts, tools/player/frame.py): the coat's body, the head and
hat, the sleeves and gloves, the trousers and boots, the coat's two skirts. Heights, widths and the places of the joints are the game's (a pose written for
the old figure fits this one); what is new is the shape of them: lofts through rings where the old figure had a box, a sloped shoulder under a rounded cap,
a coat that is cinched and flares, a hand that closes round what it holds, a boot that is laced.
"""
import numpy as np
from kit import Shape, bevel, box, cylinder, hull_points, loft, merge, mix, prism, ring, shade, slab, sphere, wedge
from palette import BRASS, COAT, DARK, FACING, HAIR, LEATHER, PALE, SCARF, SHIRT, SILVER, SLEEVE, rust, charcoal, bone, sea


def rings(spec, n=8, ch=0.4):
    """[(y, hw, hd, cx, cz)] bottom to top as rings (cx, cz optional)."""
    return [ring(s[0], s[1], s[2], s[3] if len(s) > 3 else 0.0, s[4] if len(s) > 4 else 0.0, ch=ch, n=n) for s in spec]


def torso():
    """Belt at y = 0, the neck at 0.64, the shoulder joints at (+-0.28, 0.58): a coat cinched at the waist, broad in the chest, sloping to the neck."""
    s = [loft(rings([(-0.02, 0.205, 0.140, 0, 0.005), (0.10, 0.183, 0.124), (0.27, 0.205, 0.128), (0.43, 0.236, 0.134), (0.52, 0.248, 0.130), (0.565, 0.232, 0.118), (0.60, 0.15, 0.104), (0.64, 0.088, 0.096)]), COAT, caps=(True, True))]
    s.append(slab(0.075, 0.27, 0.022, -0.075, 0.45, 0.13, FACING, -0.32))  # lapels
    s.append(slab(0.075, 0.27, 0.022, 0.075, 0.45, 0.13, FACING, 0.32))
    s.append(slab(0.05, 0.05, 0.024, -0.115, 0.545, 0.128, shade(FACING, 1.08), -0.5))  # their notches
    s.append(slab(0.05, 0.05, 0.024, 0.115, 0.545, 0.128, shade(FACING, 1.08), 0.5))
    s.append(box(0.07, 0.11, 0.02, 0, 0.53, 0.128, SHIRT))  # shirt in the V...
    s.append(box(0.035, 0.17, 0.02, 0, 0.47, 0.135, shade(rust, 1.1)))  # ...and the tie
    for x in (-0.06, 0.06):  # double-breasted: two columns of brass buttons
        for y in (0.33, 0.22, 0.12):
            s.append(box(0.026, 0.026, 0.016, x, y, 0.131, BRASS))
    s.append(bevel(0.075, 0.03, 0.03, -0.14, 0.18, 0.12, FACING, 0.008))  # pocket flaps
    s.append(bevel(0.075, 0.03, 0.03, 0.14, 0.18, 0.12, FACING, 0.008))
    s.append(box(0.04, 0.06, 0.012, -0.145, 0.43, 0.14, SHIRT))  # a notebook's corner in the breast pocket...
    s.append(box(0.012, 0.075, 0.012, -0.125, 0.45, 0.143, BRASS))  # ...and its pencil
    s.append(bevel(0.032, 0.032, 0.014, 0.12, 0.48, 0.132, BRASS, 0.006))  # an Elder Sign on the left lapel
    s.append(bevel(0.085, 0.014, 0.09, -0.236, 0.572, 0, LEATHER, 0.005).turn(rz=-0.2))  # epaulettes: a field coat's
    s.append(bevel(0.085, 0.014, 0.09, 0.236, 0.572, 0, LEATHER, 0.005).turn(rz=0.2))
    s.append(bevel(0.012, 0.45, 0.012, 0, 0.32, -0.133, shade(COAT, 0.7), 0.003))  # the back seam
    s.append(bevel(0.34, 0.012, 0.01, 0, 0.5, -0.131, shade(COAT, 0.75), 0.003))  # the yoke
    s.append(bevel(0.44, 0.06, 0.275, 0, 0.0, 0.002, LEATHER, 0.014))  # belt
    s.append(bevel(0.065, 0.055, 0.025, 0, 0.0, 0.146, BRASS, 0.008))  # buckle
    s.append(bevel(0.04, 0.06, 0.012, -0.045, -0.04, 0.142, LEATHER, 0.004))  # the belt's tail
    s.append(bevel(0.11, 0.032, 0.02, 0, 0.02, -0.14, shade(LEATHER, 0.85), 0.006))  # a half-belt behind
    for k in range(6):  # a cartridge loop on the belt, six rounds of brass
        s.append(cylinder(0.011, 0.011, 0.036, 0.0, BRASS, n=5, cx=-0.185 + 0.027 * k * 0.78, cz=0.14 - 0.012 * k * 0.0).move(0, 0, 0))
    # the collar turned up, and the scarf at the neck
    s.append(bevel(0.23, 0.05, 0.055, 0, 0.652, -0.106, FACING, 0.01))
    s.append(bevel(0.055, 0.05, 0.15, -0.118, 0.646, -0.01, FACING, 0.008))
    s.append(bevel(0.055, 0.05, 0.15, 0.118, 0.646, -0.01, FACING, 0.008))
    s.append(loft([ring(0.597, 0.112, 0.108, n=8, ch=0.5), ring(0.64, 0.118, 0.114, n=8, ch=0.5), ring(0.685, 0.108, 0.104, n=8, ch=0.5)], SCARF))
    s.append(bevel(0.075, 0.075, 0.05, 0.06, 0.585, 0.112, shade(SCARF, 1.12), 0.012))  # the knot...
    s.append(slab(0.06, 0.2, 0.026, 0.085, 0.49, 0.125, SCARF, 0.12))  # ...a short end down the chest (no tail down the back)
    # the satchel's strap: over the left shoulder, across the chest and the back, to the bag at the right hip behind
    s.append(slab(0.045, 0.7, 0.02, 0, 0.31, 0.134, LEATHER, -0.74))
    s.append(slab(0.045, 0.7, 0.02, 0, 0.31, -0.136, LEATHER, -0.74))
    s.append(bevel(0.05, 0.02, 0.026, 0.2, 0.572, 0.0, shade(LEATHER, 0.9), 0.005))  # its pad on the shoulder
    return s


def satchel():
    """A field satchel at the right hip behind, hung from the strap."""
    s = [bevel(0.2, 0.17, 0.095, 0, -0.04, 0, LEATHER, 0.016),
         bevel(0.21, 0.07, 0.105, 0, 0.03, 0.0, shade(LEATHER, 0.82), 0.012),  # its flap
         bevel(0.03, 0.04, 0.014, 0, 0.0, 0.058, BRASS, 0.005),  # the clasp
         bevel(0.19, 0.05, 0.02, 0, -0.1, 0.05, shade(LEATHER, 1.1), 0.006),  # a front pocket
         slab(0.04, 0.3, 0.02, 0.05, 0.19, -0.02, LEATHER, -0.5)]  # the strap's end
    return [x.move(-0.2, -0.11, -0.115) for x in s]


def head():
    """The head from the neck: a skull and face, brow, nose, ears and neck, short hair, the eyes in the hat's shadow, and the fedora."""
    skull = loft(rings([(0.02, 0.072, 0.082, 0, 0.01), (0.07, 0.092, 0.104, 0, 0.012), (0.14, 0.1, 0.108, 0, 0.012), (0.2, 0.092, 0.1, 0, 0.01), (0.238, 0.064, 0.076, 0, 0.006)], ch=0.5), PALE)
    s = [skull,
         prism(0, 0.04, 0.045, 0.1, 0.1, 0.15, 0.17, 0.07, shade(PALE, 0.9), 0.016),  # the jaw
         bevel(0.085, 0.045, 0.06, 0, 0.012, 0.1, shade(PALE, 0.88), 0.012),  # the chin
         wedge(0.036, 0.085, 0.052, 0, 0.1, 0.133, shade(PALE, 0.94), 0.55),  # the nose, a ridge
         bevel(0.045, 0.026, 0.03, 0, 0.078, 0.147, shade(PALE, 0.92), 0.008),  # its tip
         bevel(0.04, 0.04, 0.02, -0.07, 0.088, 0.108, shade(PALE, 0.97), 0.008),  # cheekbones
         bevel(0.04, 0.04, 0.02, 0.07, 0.088, 0.108, shade(PALE, 0.97), 0.008),
         bevel(0.07, 0.012, 0.012, 0, 0.052, 0.12, shade(PALE, 0.62), 0.003),  # the mouth
         bevel(0.035, 0.05, 0.05, -0.108, 0.12, 0.0, shade(PALE, 0.9), 0.008),  # ears
         bevel(0.035, 0.05, 0.05, 0.108, 0.12, 0.0, shade(PALE, 0.9), 0.008),
         cylinder(0.052, 0.058, 0.09, -0.01, shade(PALE, 0.86), n=8),  # the neck
         box(0.05, 0.018, 0.02, -0.05, 0.14, 0.114, shade(bone, 1.2)), box(0.05, 0.018, 0.02, 0.05, 0.14, 0.114, shade(bone, 1.2)),  # eyes, in the hat's shadow
         box(0.02, 0.02, 0.022, -0.05, 0.14, 0.117, DARK), box(0.02, 0.02, 0.022, 0.05, 0.14, 0.117, DARK),
         bevel(0.18, 0.026, 0.03, 0, 0.17, 0.108, shade(charcoal, 1.3), 0.008),  # the brow, in the hat's shadow
         # short hair: a back and sides under the brim, sideburns before the ears
         box(0.206, 0.09, 0.144, 0, 0.195, -0.032, HAIR), box(0.2, 0.045, 0.072, 0, 0.1275, -0.064, HAIR), box(0.14, 0.03, 0.036, 0, 0.09, -0.078, HAIR), box(0.198, 0.035, 0.022, 0, 0.1325, 0.039, HAIR)]
    return s


def hat():
    """A fedora: a brim, a crown pinched in the middle and dented along its top, a band."""
    brim = loft([ring(0.236, 0.225, 0.245, 0, 0.012, ch=0.7, n=8), ring(0.258, 0.225, 0.245, 0, 0.012, ch=0.7, n=8)], DARK)
    crown = loft(rings([(0.255, 0.115, 0.13, 0, 0.002), (0.31, 0.12, 0.133, 0, 0.0), (0.36, 0.112, 0.128, 0, -0.004), (0.4, 0.088, 0.12, 0, -0.006)], ch=0.55), DARK)
    s = [brim, crown,
         bevel(0.03, 0.05, 0.2, 0, 0.392, -0.006, shade(DARK, 0.7), 0.01),  # the dent along the top
         bevel(0.1, 0.06, 0.03, 0, 0.345, 0.12, shade(DARK, 0.85), 0.008),  # the pinch at the front
         loft([ring(0.262, 0.12, 0.135, 0, 0.002, ch=0.55), ring(0.3, 0.124, 0.138, 0, 0.0, ch=0.55)], shade(rust, 0.9)),  # the band
         bevel(0.03, 0.036, 0.016, 0.0, 0.282, 0.14, BRASS, 0.005)]  # a brass pin on it
    return s


def upper_arm():
    """The sleeve from the shoulder joint (y 0) to the elbow (y -0.30): a cap over the shoulder, a bulge, a taper."""
    s = [loft(rings([(-0.31, 0.056, 0.062), (-0.2, 0.062, 0.07), (-0.08, 0.074, 0.08), (0.0, 0.066, 0.07)], ch=0.5), SLEEVE),
         sphere(0.066, shade(SLEEVE, 1.02), at=(0, -0.035, 0), detail=1, squash=(1.0, 0.75, 1.0)),  # the cap on the joint
         bevel(0.1, 0.05, 0.1, 0, -0.29, 0, FACING, 0.008)]  # the turn of the elbow's patch is on the forearm
    return s


def fore_arm():
    """From the elbow (y 0) to the wrist (y -0.28): the forearm and its cuff."""
    return [loft(rings([(-0.23, 0.044, 0.05), (-0.12, 0.05, 0.056), (-0.02, 0.058, 0.064), (0.04, 0.056, 0.062)], ch=0.5), shade(SLEEVE, 0.94)),
            bevel(0.12, 0.04, 0.128, 0, -0.255, 0, FACING, 0.01),  # the cuff
            bevel(0.126, 0.012, 0.134, 0, -0.232, 0, shade(FACING, 1.25), 0.004),  # its band
            bevel(0.1, 0.05, 0.09, 0, 0.0, -0.045, shade(LEATHER, 0.9), 0.008)]  # the patch at the elbow, behind


def hand(c=LEATHER):
    """A gloved hand closed round a grip held on the line (0, y, 0.02): the back of the hand behind it, the four fingers round its front, the thumb across them."""
    lighter = lambda k: shade(c, k)
    return [bevel(0.1, 0.05, 0.108, 0, 0.0, 0.0, lighter(0.92), 0.01),  # the glove's cuff over the sleeve
            bevel(0.088, 0.075, 0.034, 0, -0.058, -0.02, c, 0.012),  # the back of the hand
            bevel(0.016, 0.075, 0.09, -0.046, -0.058, 0.025, lighter(0.95), 0.006),  # the sides of the fist
            bevel(0.016, 0.075, 0.09, 0.046, -0.058, 0.025, lighter(0.95), 0.006),
            box(0.084, 0.018, 0.034, 0, -0.03, 0.06, lighter(0.96)),  # the four fingers, one over another
            box(0.084, 0.018, 0.034, 0, -0.05, 0.062, lighter(0.9)),
            box(0.084, 0.018, 0.034, 0, -0.07, 0.062, lighter(0.96)),
            box(0.078, 0.018, 0.03, 0, -0.09, 0.058, lighter(0.88)),
            bevel(0.03, 0.065, 0.045, 0.043, -0.04, 0.062, lighter(1.06), 0.01),  # the thumb across them
            box(0.07, 0.012, 0.012, 0, -0.098, 0.072, lighter(0.7))]


def thigh():
    """Hip (y 0) to knee (y -0.42): trousers."""
    return [loft(rings([(-0.45, 0.064, 0.073), (-0.3, 0.076, 0.086), (-0.14, 0.092, 0.102), (0.02, 0.1, 0.108)], ch=0.5), DARK)]


def shin():
    """Knee (y 0) to ankle (y -0.41): the shin and calf in trousers, and a tall laced boot over the lower half, strapped at the top."""
    boot = shade(LEATHER, 1.0)
    s = [loft(rings([(-0.2, 0.058, 0.066, 0, 0.0), (-0.08, 0.068, 0.085, 0, -0.012), (0.0, 0.07, 0.078)], ch=0.5), DARK),
         loft(rings([(-0.41, 0.058, 0.068, 0, 0.0), (-0.3, 0.062, 0.074, 0, 0.004), (-0.19, 0.07, 0.082, 0, 0.0)], ch=0.5), boot),
         bevel(0.15, 0.032, 0.17, 0, -0.178, 0.0, shade(boot, 1.15), 0.01),  # the strap and cuff at the top
         bevel(0.03, 0.03, 0.02, 0, -0.178, 0.088, BRASS, 0.005)]  # its buckle
    for y in (-0.22, -0.26, -0.3, -0.34):  # laces
        s.append(bevel(0.05, 0.008, 0.012, 0, y, 0.078, shade(bone, 0.95), 0.002))
    return s


def foot():
    """From the ankle (the sole 0.07 below): a laced boot's foot with its heel, toe-cap and sole."""
    sole = shade(charcoal, 0.9)
    upper = LEATHER
    toe = np.array([[-0.062, -0.052, -0.07], [0.062, -0.052, -0.07], [-0.056, 0.03, -0.062], [0.056, 0.03, -0.062],
                    [-0.07, -0.052, 0.12], [0.07, -0.052, 0.12], [-0.064, 0.0, 0.1], [0.064, 0.0, 0.1],
                    [-0.05, -0.052, 0.205], [0.05, -0.052, 0.205], [-0.044, -0.022, 0.195], [0.044, -0.022, 0.195]])
    return [hull_points(toe, upper),
            bevel(0.15, 0.03, 0.29, 0, -0.058, 0.045, sole, 0.008),  # the sole
            bevel(0.122, 0.042, 0.09, 0, -0.038, -0.075, shade(sole, 1.1), 0.008),  # the heel
            bevel(0.1, 0.05, 0.06, 0, -0.02, 0.16, shade(upper, 1.14), 0.012)]  # the toe-cap


def skirt(side):
    """One half of the coat's skirt, a closed flared shell from the belt (y 0.03) to the hem, in the body's frame, hung at the hip so it swings with its thigh."""
    cx = lambda hw: side * (0.006 + hw)
    rs = [ring(0.03, 0.1, 0.126, cx(0.1), 0.0, ch=0.5), ring(-0.2, 0.106, 0.144, cx(0.106), -0.004, ch=0.5), ring(-0.44, 0.116, 0.166, cx(0.116), -0.012, ch=0.5)]
    shell = loft(rs, COAT)
    # a hem that is not clean: darker cloth along it, and a vent's facing up the back edge
    return [shell, bevel(0.226, 0.03, 0.34, cx(0.116), -0.445, -0.012, shade(COAT, 0.72), 0.008)]
