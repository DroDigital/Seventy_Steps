"""Two-bone legs set by where their foot is to be (docs/MODELS.md): a crouch, a stride, a leap, with the
foot where it should be rather than guessed at. Planar, in the leg's own side view (Y forward-back, Z
up), which is how a leg bends; its sideways turn (ry, rz) is the caller's to add."""

import math


def _angle(d):
    """How far a direction (dy, dz) leans back from straight down, in degrees (+: back, toward +Y)."""
    return math.degrees(math.atan2(d[0], -d[1]))


def leg(k, thigh, shin, foot, ankle, root=(0.0, 0.0, 0.0), parent_rx=0.0, knee='front', toe=0.0):
    """Pose entries that bring the head of `foot` (the ankle) to `ankle` (metres, rest axes) once the
    body has moved by `root` and the thigh's parents have pitched by `parent_rx` degrees; the knee
    bends to the `front` (a man's) or the `back` (a hound's hock, a bird's); the foot keeps its rest
    angle to the ground, plus `toe` degrees (+ tips its toes down)."""
    r = k.r
    hip, kn, an = r.head(thigh), r.head(shin), r.head(foot)
    hy, hz = hip[1] + root[1], hip[2] + root[2]
    l1 = math.dist((hip[1], hip[2]), (kn[1], kn[2]))
    l2 = math.dist((kn[1], kn[2]), (an[1], an[2]))
    dy, dz = ankle[1] - hy, ankle[2] - hz
    d = min(max(math.hypot(dy, dz), 1e-4), (l1 + l2) * 0.999)
    reach = _angle((dy, dz))
    inner = math.degrees(math.acos(max(-1.0, min(1.0, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))))
    side = -1 if knee == 'front' else 1  # a front knee: the thigh swings forward of the line to the foot
    a1 = reach + side * inner
    ky, kz = hy + l1 * math.sin(math.radians(a1)), hz - l1 * math.cos(math.radians(a1))
    a2 = _angle((ankle[1] - ky, ankle[2] - kz))
    rest1 = _angle((kn[1] - hip[1], kn[2] - hip[2]))
    rest2 = _angle((an[1] - kn[1], an[2] - kn[2]))
    t = a1 - rest1 - parent_rx
    s = a2 - rest2 - (a1 - rest1)
    return {thigh: (t, 0.0, 0.0), shin: (s, 0.0, 0.0), foot: (-(t + s + parent_rx) + toe, 0.0, 0.0)}


def plant(k, legs, root=(0.0, 0.0, 0.0), parent_rx=0.0, knee='front', shift=None):
    """Every leg's foot left where it stood at rest (or moved by `shift[i]`) while the body moves by
    `root`: a crouch, a rise, a lean into a blow without the feet sliding. `legs`: (thigh, shin, foot)."""
    out = {}
    for i, (t, s, f) in enumerate(legs):
        a = k.r.head(f)
        dx = shift[i] if shift else (0.0, 0.0, 0.0)
        out.update(leg(k, t, s, f, (a[0] + dx[0], a[1] + dx[1], a[2] + dx[2]), root, parent_rx, knee))
    out['root:loc'] = tuple(root)
    return out
